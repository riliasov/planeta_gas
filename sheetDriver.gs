/**
 * Получает основной лист расписания.
 */
function getScheduleSheet() {
  return new ScheduleRepository().getSheet();
}

/**
 * Получает лист справочника.
 */
function getDirectorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = findSheetByName(ss, CONFIG.DIRECTORY_SHEET);
  if (!sheet) {
    throw new Error(`Лист ${CONFIG.DIRECTORY_SHEET} не найден.`);
  }
  return sheet;
}

/**
 * Получает лист логов по имени.
 */
function getLogSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = findSheetByName(ss, sheetName);
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
  const range = sheet.getRange(2, 40, lastRow - 1, 3);
  const values = range.getValues();
  
  return values.map(row => ({
    name: row[0],
    email: row[1],
    type: row[2]
  })).filter(t => t.name); // Filter empty rows
}

/**
 * ОПТИМИЗАЦИЯ: Находит диапазон строк для конкретной даты, используя Repository.
 * @param {Date} dateObj Объект даты JS
 * @returns {Array<{rowIndex: number, values: Array}>}
 */
function findRowsByDate(dateObj) {
  const repo = new ScheduleRepository();
  return repo.getByDate(dateObj);
}

/**
 * Вставляет новую строку после указанного индекса.
 */
function insertRowAfter(rowIndex, rowData) {
  const repo = new ScheduleRepository();
  return repo.insertAfter(rowIndex, rowData);
}

/**
 * Обновляет существующую строку.
 */
function updateRow(rowIndex, rowData) {
  const repo = new ScheduleRepository();
  repo.update(rowIndex, rowData);
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

/**
 * Находит последнюю строку, содержащую данные в указанном диапазоне колонок.
 */
function findLastRowInColumns(sheet, startCol, endCol) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) return 0;
  
  const range = sheet.getRange(1, startCol, lastRow, endCol - startCol + 1);
  const values = range.getValues();
  
  for (let i = values.length - 1; i >= 0; i--) {
    for (let j = 0; j < values[i].length; j++) {
      if (values[i][j] !== "") {
        return i + 1;
      }
    }
  }

  return 0;
}

/**
 * Helper: Ищет лист по имени нестрого (игнорируя регистр и пробелы).
 * @param {Spreadsheet} ss 
 * @param {string} name 
 * @returns {Sheet|null}
 */
function findSheetByName(ss, name) {
  if (!ss || !name) return null;
  
  // 1. Прямой поиск (быстро)
  let sheet = ss.getSheetByName(name);
  if (sheet) return sheet;

  // 2. Поиск перебором (с нормализацией)
  const normalize = (s) => String(s).trim().toLowerCase();
  const target = normalize(name);
  const allSheets = ss.getSheets();
  
  for (const s of allSheets) {
    if (normalize(s.getName()) === target) {
      console.warn(`Sheet found by fuzzy match: "${s.getName()}" (requested: "${name}")`);
      return s;
    }
  }
  
  return null;
}
