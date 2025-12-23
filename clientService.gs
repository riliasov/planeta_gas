/**
 * Получить всех клиентов из базы (Сырые данные)
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
 * Получить список клиентов для UI (Typeahead)
 */
function getClients() {
  try {
    const repo = new ClientRepository();
    const clients = repo.getAll();
    console.log(`Loaded ${clients.length} clients in getClients()`);
    
    return clients; // Already mapped to models in repository
  } catch (e) {
    console.error('getClients UI error:', e);
    return [];
  }
}

/**
 * Поиск клиентов по запросу (Server-side search fallback)
 */
function searchClients(query) {
  try {
    const repo = new ClientRepository();
    const filtered = repo.search(query);
    
    return filtered.slice(0, 15).map(c => ({
      ...c,
      label: `${c.name} ${c.mobile ? '| ' + c.mobile : ''}`
    }));
  } catch (e) {
    console.error('searchClients error:', e);
    return [];
  }
}

/**
 * Получение истории клиента
 */
function getClientHistory(clientName) {
  if (!clientName) return { sales: [], training: [] };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Покупки (из листа "Продажи")
  const saleSheet = ss.getSheetByName(CONFIG.SHEET_SALES || 'Продажи');
  let sales = [];
  if (saleSheet) {
    const lastRow = saleSheet.getLastRow();
    if (lastRow >= 2) {
      // Assuming Sales structure: date(0), client(1), product(3), price(8) - check ui.gs creation
      // created in salesService: date, client, phone, product, type, cat, base, disc, total, payment...
      // Col indexes: 0, 1, 2, 3, 4, 5, 6, 7, 8
      const data = saleSheet.getRange(2, 1, lastRow - 1, 9).getValues();
      const filteredSales = data.filter(r => r[1] === clientName);
      sales = filteredSales.slice(-5).reverse().map(r => ({
        date: typeof r[0] === 'object' ? Utilities.formatDate(r[0], ss.getSpreadsheetTimeZone(), "dd.MM.yy") : r[0],
        product: r[3], // Product Name
        price: r[8]    // Final Price
      }));
    }
  }

  // 2. Тренировки (из листа "Расписание")
  const schSheet = ss.getSheetByName(CONFIG.SHEET_SCHEDULE || 'Schedule');
  let training = [];
  if (schSheet) {
    const lastRow = schSheet.getLastRow();
    if (lastRow >= 2) {
      // COLS are defined in constants. CLIENT is 4 (E).
      // Let's use constants if available, or just grab a large range.
      const data = schSheet.getRange(2, 1, lastRow - 1, 15).getValues();
      // COLS.CLIENT = 4
      const filteredSch = data.filter(r => r[4] === clientName);
      
      filteredSch.sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        if (dateA - dateB !== 0) return dateB - dateA; // Descending
        return 0; // Simplify
      });

      const now = new Date();
      now.setHours(0,0,0,0);

      const upcoming = filteredSch.filter(r => new Date(r[0]) >= now); // Ascending order for upcoming? usually users want closest first.
      const past = filteredSch.filter(r => new Date(r[0]) < now).slice(0, 5);

      training = upcoming.concat(past).map(r => ({
        date: typeof r[0] === 'object' ? Utilities.formatDate(r[0], ss.getSpreadsheetTimeZone(), "dd.MM.yy") : r[0],
        time: r[1],
        trainer: r[3], // EMPLOYEE is 3
        type: r[6],    // TYPE is 6
        status: r[5]   // STATUS is 5
      }));
    }
  }

  return { sales, training };
}
