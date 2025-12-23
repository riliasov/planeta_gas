/**
 * Client Service - работа с клиентами через Repository.
 * Все функции возвращают JSON-объекты.
 */

/**
 * Получить всех клиентов из базы.
 * @returns {Array<Object>} JSON array
 */
function getAllClients() {
  try {
    const repo = new ClientRepository();
    return repo.getAll();
  } catch (e) {
    console.error('getAllClients error:', e);
    return [];
  }
}

/**
 * Получить список клиентов для UI (Typeahead).
 * @returns {Array<Object>} JSON array
 */
function getClients() {
  try {
    const repo = new ClientRepository();
    const clients = repo.getAll();
    console.log(`Loaded ${clients.length} clients in getClients()`);
    
    return clients; // Already JSON models
  } catch (e) {
    console.error('getClients UI error:', e);
    return [];
  }
}

/**
 * Поиск клиентов по запросу (Server-side search).
 * @param {string} query 
 * @returns {Array<Object>} JSON array with labels
 */
function searchClients(query) {
  try {
    const repo = new ClientRepository();
    const filtered = repo.search(query);
    
    return filtered.slice(0, 15).map(c => ({
      ...c,
      label: `${c.name} ${c.phone ? '| ' + c.phone : ''}`
    }));
  } catch (e) {
    console.error('searchClients error:', e);
    return [];
  }
}

/**
 * Получение истории клиента (продажи + тренировки).
 * @param {string} clientName 
 * @returns {Object} {sales: Array, training: Array}
 */
function getClientHistory(clientName) {
  if (!clientName) return { sales: [], training: [] };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Продажи через SalesRepository
  const salesRepo = new SalesRepository();
  const salesSheet = salesRepo.getSheet();
  let sales = [];
  
  if (salesSheet) {
    const lastRow = salesSheet.getLastRow();
    if (lastRow >= 3) { // Sales headers on row 2
      const data = salesSheet.getRange(3, 1, lastRow - 2, 23).getValues();
      const filteredSales = data
        .filter(r => r[SALES_COLS.CLIENT] === clientName)
        .slice(-5)
        .reverse()
        .map(r => ({
          date: r[SALES_COLS.DATE] instanceof Date 
            ? Utilities.formatDate(r[SALES_COLS.DATE], CONFIG.TIME_ZONE, "dd.MM.yy") 
            : r[SALES_COLS.DATE],
          product: r[SALES_COLS.PRODUCT],
          price: r[SALES_COLS.FINAL_PRICE]
        }));
      
      sales = filteredSales;
    }
  }

  // 2. Тренировки через ScheduleRepository
  const scheduleRepo = new ScheduleRepository();
  const scheduleSheet = scheduleRepo.getSheet();
  let training = [];
  
  if (scheduleSheet) {
    const lastRow = scheduleSheet.getLastRow();
    if (lastRow >= 2) {
      const data = scheduleSheet.getRange(2, 1, lastRow - 1, 14).getValues();
      const filteredSchedule = data.filter(r => r[SCHEDULE_COLS.CLIENT] === clientName);
      
      filteredSchedule.sort((a, b) => {
        const dateA = new Date(a[SCHEDULE_COLS.DATE]);
        const dateB = new Date(b[SCHEDULE_COLS.DATE]);
        return dateB - dateA; // Descending
      });

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const upcoming = filteredSchedule.filter(r => new Date(r[SCHEDULE_COLS.DATE]) >= now);
      const past = filteredSchedule.filter(r => new Date(r[SCHEDULE_COLS.DATE]) < now).slice(0, 5);

      training = upcoming.concat(past).map(r => ({
        date: r[SCHEDULE_COLS.DATE] instanceof Date 
          ? Utilities.formatDate(r[SCHEDULE_COLS.DATE], CONFIG.TIME_ZONE, "dd.MM.yy") 
          : r[SCHEDULE_COLS.DATE],
        time: r[SCHEDULE_COLS.START],
        trainer: r[SCHEDULE_COLS.EMPLOYEE],
        type: r[SCHEDULE_COLS.TYPE],
        status: r[SCHEDULE_COLS.STATUS]
      }));
    }
  }

  return { sales, training };
}
