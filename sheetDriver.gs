/**
 * Sheet Driver - утилиты для работы с листами.
 * Основная логика работы с данными перенесена в Repositories.
 */

/**
 * Получает основной лист расписания.
 * @returns {Sheet}
 */
function getScheduleSheet() {
  return new ScheduleRepository().getSheet();
}

/**
 * Получает лист справочника.
 * @returns {Sheet}
 */
function getDirectorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = findSheetByName(ss, CONFIG.SHEET_DIRECTORY);
  if (!sheet) {
    throw new Error(`Лист ${CONFIG.SHEET_DIRECTORY} не найден.`);
  }
  return sheet;
}

/**
 * Получает лист логов по имени.
 * @param {string} sheetName 
 * @returns {Sheet}
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
 * Reads all trainers from employees sheet.
 * @returns {Array<Object>} JSON array
 */
function getAllTrainers() {
  const repo = new EmployeeRepository();
  return repo.getByType('Тренер');
}

/**
 * DEPRECATED: Use ScheduleRepository.getByDate() instead.
 * Находит диапазон строк для конкретной даты.
 * @param {Date} dateObj 
 * @returns {Array<{rowIndex: number, values: Array, model: Object}>}
 */
function findRowsByDate(dateObj) {
  const repo = new ScheduleRepository();
  return repo.getByDate(dateObj);
}

/**
 * DEPRECATED: Use ScheduleRepository.insertAfter() instead.
 * Вставляет новую строку после указанного индекса.
 */
function insertRowAfter(rowIndex, rowData) {
  const repo = new ScheduleRepository();
  return repo.insertAfter(rowIndex, rowData);
}

/**
 * DEPRECATED: Use ScheduleRepository.update() instead.
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
  const startRow = lastRow < 2 ? 2 : lastRow + 1; // Headers on row 1
  
  sheet.getRange(startRow, 1, dataGrid.length, dataGrid[0].length).setValues(dataGrid);
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
