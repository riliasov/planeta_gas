/**
 * Получает основной лист расписания.
 */
function getScheduleSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw new Error(`Лист ${CONFIG.SHEET_NAME} не найден.`);
  }
  return sheet;
}

/**
 * Получает лист справочника.
 */
function getDirectorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.DIRECTORY_SHEET);
  if (!sheet) {
    // If not found, try to find by partial match or throw precise error
    throw new Error(`Лист ${CONFIG.DIRECTORY_SHEET} не найден. Создайте его для работы справочников.`);
  }
  return sheet;
}

/**
 * Получает лист логов по имени.
 */
function getLogSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // Инициализация заголовков для новых листов логов
    if (sheetName === CONFIG.LOG_SHEET_RECORDS) {
      sheet.appendRow(['timestamp', 'userEmail', 'pk', 'date', 'time', 'room_type', 'rowIndex', 'action', 'message']);
    } else if (sheetName === CONFIG.LOG_SHEET_SCRIPT) {
      sheet.appendRow(['scriptName', 'description', 'startedAt', 'result', 'durationMs', 'note']);
    }
  }
  return sheet;
}

/**
 * Reads all trainers from Dictionary sheet (AN:AP).
 * Returns array of objects {name, email, type}.
 */
function getAllTrainers() {
  const sheet = getDirectorySheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  // AN:AP corresponds to columns 40, 41, 42 (1-based)
  // Check exact column indices.
  // A=1, Z=26, AA=27, AN=40.
  const range = sheet.getRange(2, 40, lastRow - 1, 3);
  const values = range.getValues();
  
  return values.map(row => ({
    name: row[0],
    email: row[1],
    type: row[2]
  })).filter(t => t.name); // Filter empty rows
}

/**
 * Reads all clients from Dictionary sheet (Q:AB).
 * Optimized to specific columns if needed, but for now reads block.
 * Q is 17. AB is 28.
 */
function getAllClients() {
  const sheet = getDirectorySheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  const range = sheet.getRange(2, 17, lastRow - 1, 12); // Q(17) to AB(28) is 12 columns
  const values = range.getValues();
  
  return values.map(row => ({
    name: row[0],           // Q: Client Name
    phone: row[1],          // R: Mobile
    childDate: row[2],      // S: Child Birth Date
    age: row[3],            // T
    // ... other fields as needed
    balance: row[5],        // V: Balance (Остаток)
    status: row[6],         // W: Status
    trainer: row[10],       // AA: Assigned Trainer
    lastRecord: row[11]     // AB
  })).filter(c => c.name);
}

/**
 * ОПТИМИЗАЦИЯ: Находит диапазон строк для конкретной даты, используя TextFinder.
 * @param {Date} dateObj Объект даты JS
 * @returns {Array<{rowIndex: number, values: Array}>} Массив объектов со значениями строки и её индексом (1-based)
 */
function findRowsByDate(dateObj) {
  const sheet = getScheduleSheet();
  const dateStr = Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
  
  // Ищем все вхождения даты в колонке A (COLS.DATE = 0, поэтому A:A корректно)
  const finder = sheet.getRange("A:A").createTextFinder(dateStr).matchEntireCell(true);
  const ranges = finder.findAll();
  
  if (ranges.length === 0) return [];

  const firstRow = ranges[0].getRow();
  const lastRow = ranges[ranges.length - 1].getRow();
  
  const numRows = lastRow - firstRow + 1;
  const dataValues = sheet.getRange(firstRow, 1, numRows, sheet.getLastColumn()).getValues();
  
  const result = [];
  dataValues.forEach((row, i) => {
    let rowDateStr;
    if (row[COLS.DATE] instanceof Date) {
      rowDateStr = Utilities.formatDate(row[COLS.DATE], CONFIG.TIME_ZONE, 'dd.MM.yyyy');
    } else {
      rowDateStr = String(row[COLS.DATE]);
    }

    if (rowDateStr === dateStr) {
      result.push({
        rowIndex: firstRow + i,
        values: row
      });
    }
  });
  
  return result;
}

/**
 * Вставляет новую строку после указанного индекса.
 */
function insertRowAfter(rowIndex, rowData) {
  const sheet = getScheduleSheet();
  sheet.insertRowAfter(rowIndex);
  sheet.getRange(rowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
  return rowIndex + 1;
}

/**
 * Обновляет существующую строку.
 */
function updateRow(rowIndex, rowData) {
  const sheet = getScheduleSheet();
  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
}

/**
 * Пакетная вставка данных (для генерации сетки).
 */
function batchAppendData(dataGrid) {
  if (dataGrid.length === 0) return;
  const sheet = getScheduleSheet();
  const lastRow = sheet.getLastRow();
  const startRow = lastRow < CONFIG.HEADER_ROWS ? CONFIG.HEADER_ROWS + 1 : lastRow + 1;
  
  sheet.getRange(startRow, 1, dataGrid.length, dataGrid[0].length).setValues(dataGrid);
}