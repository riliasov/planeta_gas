/**
 * Меню при открытии таблицы
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏊 Бассейн')
    .addItem('➕ Открыть Sidebar', 'openSidebar')
    .addToUi();
}

/**
 * Открывает боковую панель
 */
function openSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Панель управления')
    .setWidth(430);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Получить список сотрудников/тренеров (для typeahead продаж и расписания)
 */
function getStaff() {
  const logCtx = logScriptStart('getStaff', 'Fetching staff list for UI');
  try {
    const trainers = getAllTrainers();
    const result = trainers.map(t => ({
      name: t.name,
      type: t.type,
      email: t.email
    }));
    logScriptEnd(logCtx, 'success', `Loaded ${result.length} trainers`);
    return result;
  } catch (e) {
    logScriptEnd(logCtx, 'error', e.message);
    console.error('getStaff error:', e);
    return [];
  }
}

// ======================================
// БЭКЕНД ДЛЯ РАЗДЕЛА "ЗАДАЧИ"
// ======================================

/**
 * Получить список задач
 */
function getTasks() {
  const logCtx = logScriptStart('getTasks', 'Fetching task list for UI');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = findSheetByName(ss, CONFIG.SHEET_TASKS);
    if (!sheet) {
      logScriptEnd(logCtx, 'warning', 'Sheet "Задачи" not found');
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      logScriptEnd(logCtx, 'success', 'Sheet is empty');
      return [];
    }
    
    // Read 8 columns to reach column H
    const range = sheet.getRange(2, 1, lastRow - 1, 8);
    const values = range.getValues();
    
    const result = values
      .filter(row => row[6] && row[2] !== 'Выполнено') // Column G (idx 6) is description
      .map((row, idx) => ({
        task: row[6],        // Column G: Description
        link: row[7] || null, // Column H: Link
        rowIndex: idx + 2
      }));
    
    logScriptEnd(logCtx, 'success', `Loaded ${result.length} tasks`);
    return result;
  } catch (e) {
    logScriptEnd(logCtx, 'error', e.message);
    console.error('getTasks error:', e);
    return [];
  }
}

/**
 * Перейти к ячейке задачи
 */
function openTaskCell(link) {
  if (!link) return;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // link может быть адресом ячейки типа "Schedule!A10"
    const range = ss.getRange(link);
    if (range) {
      ss.setActiveRange(range);
    }
  } catch (e) {
    console.error('openTaskCell error:', e);
  }
}

/**
 * Функция для получения списка залов (если используется где-то)
 */
function getRoomsList() {
  return ['Бассейн', 'Ванны'];
}
