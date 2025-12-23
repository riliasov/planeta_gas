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

// ======================================
// БЭКЕНД ДЛЯ РАЗДЕЛА "РАСПИСАНИЕ"
// ======================================

/**
 * Добавление записи в расписание (обертка над bookingService)
 */
function addTraining(formData) {
  // Функция addTraining уже определена в bookingService.gs
  // Здесь просто проксируем вызов
  try {
    return bookingServiceAddTraining(formData);
  } catch (e) {
    throw new Error(e.message);
  }
}

/**
 * Список залов/категорий для расписания
 */
function getRoomsList() {
  return ['Бассейн', 'Зал', 'Ванны'];
}

/**
 * Список тренеров (имена) для select
 */
function getTrainersList() {
  try {
    const trainers = getAllTrainers();
    return trainers.map(t => t.name).filter(n => n);
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Поиск клиентов по ФИО или телефону (для typeahead)
 */
function searchClients(query) {
  if (!query || query.length < 2) return [];
  
  const all = getAllClients(); 
  const qLower = query.toLowerCase();
  
  const filtered = all.filter(c => {
    // Поиск только по имени и телефону
    const nameMatch = c.name && c.name.toLowerCase().includes(qLower);
    const phoneMatch = c.phone && String(c.phone).includes(qLower);
    return nameMatch || phoneMatch;
  });
  
  return filtered.slice(0, 10).map(c => ({
    label: `${c.name} (${c.phone || 'без тел'})`,
    value: c.name,
    phone: c.phone
  }));
}

// ======================================
// БЭКЕНД ДЛЯ РАЗДЕЛА "ПРОДАЖИ"
// ======================================

/**
 * Получить список продуктов из Справочника
 * Заголовки (A:E): Продукт, Тип, Категория, Количество занятий, Актуальная цена
 */
function getProducts() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Справочник');
    if (!sheet) return [];
    
    // Колонки A:E (1-5)
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    
    const range = sheet.getRange(2, 1, lastRow - 1, 5); 
    const values = range.getValues();
    
    return values.map(row => ({
      name: row[0],
      type: row[1],
      category: row[2],
      quantity: row[3],
      fullPrice: row[4]
    })).filter(p => p.name);
  } catch (e) {
    console.error('getProducts error:', e);
    return [];
  }
}

/**
 * Получить список клиентов (для typeahead продаж)
 */
function getClients() {
  try {
    const clients = getAllClients();
    return clients.map(c => ({
      name: c.name,
      mobile: c.phone
    }));
  } catch (e) {
    console.error('getClients error:', e);
    return [];
  }
}

/**
 * Получить список сотрудников/тренеров (для typeahead продаж)
 */
function getStaff() {
  try {
    const trainers = getAllTrainers();
    return trainers.map(t => ({
      name: t.name,
      type: t.type,
      email: t.email
    }));
  } catch (e) {
    console.error('getStaff error:', e);
    return [];
  }
}

/**
 * Создать продажу
 */
function createSale(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Продажи');
    if (!sheet) {
      sheet = ss.insertSheet('Продажи');
      sheet.appendRow(['Дата', 'Клиент', 'Телефон', 'Продукт', 'Тип', 'Категория', 'Базовая цена', 'Скидка %', 'Итого', 'Оплата', 'Комментарий', 'Тренер', 'Timestamp']);
    }
    
    const base = Number(payload.product.fullPrice) || 0;
    const disc = Number(payload.discount) || 0;
    const final = Math.round((base * (1 - disc / 100)) * 100) / 100;
    
    const row = [
      payload.date,
      payload.client.displayName,
      payload.client.mobile || '',
      payload.product.name,
      payload.product.type || '',
      payload.product.category || '',
      base,
      disc,
      final,
      payload.paymentMethod,
      payload.comment || '',
      payload.trainer.name || '',
      new Date().toISOString()
    ];
    
    // Смарт-вставка: после последней заполненной строки в A:C (1-3)
    const lastRowWithData = findLastRowInColumns(sheet, 1, 3);
    const targetRow = lastRowWithData + 1;
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
    
    return { row: targetRow };
  } catch (e) {
    console.error('createSale error:', e);
    throw new Error('Ошибка при создании продажи: ' + e.message);
  }
}

// ======================================
// БЭКЕНД ДЛЯ РАЗДЕЛА "ЗАДАЧИ"
// ======================================

/**
 * Получить список задач
 */
function getTasks() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Задачи');
    if (!sheet) return [];
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    
    // Предполагаем: A=Задача, B=Ссылка, C=Статус
    const range = sheet.getRange(2, 1, lastRow - 1, 3);
    const values = range.getValues();
    
    return values
      .filter(row => row[0] && row[2] !== 'Выполнено')
      .map((row, idx) => ({
        task: row[0],
        link: row[1] || null,
        rowIndex: idx + 2
      }));
  } catch (e) {
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

// ======================================
// АЛИАС ДЛЯ bookingService.addTraining
// ======================================

/**
 * Обертка для вызова addTraining из bookingService.gs
 * (чтобы не было конфликта имен)
 */
function bookingServiceAddTraining(formData) {
  // Эта функция вызывает оригинальный addTraining из bookingService.gs
  // Если он уже называется addTraining, тогда нужно переименовать
  // Предполагаем, что в bookingService.gs функция называется addTraining
  
  const logCtx = logScriptStart('addTraining', 'User booking request');
  const lock = LockService.getScriptLock();
  
  try {
    validateInput(formData);
    
    if (!lock.tryLock(5000)) {
      throw new Error('Система занята. Попробуйте через несколько секунд.');
    }
    
    const dateObj = new Date(formData.date);
    const timeStr = formData.time;
    const roomType = formData.room; 
    
    const [hh, mm] = timeStr.split(':').map(Number);
    const startM = hh * 60 + mm;
    const endM = startM + CONFIG.STEP_MIN;
    
    let rowsOnDate = findRowsByDate(dateObj);
    if (rowsOnDate.length === 0) {
      // Сетка не найдена - создаем минимальную запись
      // (gridService отключен, поэтому просто добавляем запись)
    }
    
    const clientsList = getAllClients().map(c => c.name.toLowerCase());
    const trainersList = getAllTrainers().map(t => t.name.toLowerCase());

    if (!trainersList.includes(formData.trainer.toLowerCase())) {
      throw new Error(`Тренер "${formData.trainer}" не найден в справочнике.`);
    }
    if (!clientsList.includes(formData.client.toLowerCase())) {
      throw new Error(`Клиент "${formData.client}" не найден в справочнике.`);
    }

    if (rowsOnDate.length > 0) {
      checkTrainerConflict(rowsOnDate, formData.trainer, startM, endM);
      checkClientConflict(rowsOnDate, formData.client, startM, endM);
    }

    const endHh = Math.floor(endM / 60);
    const endMm = endM % 60;
    const endTimeStr = `${String(endHh).padStart(2, '0')}:${String(endMm).padStart(2, '0')}`;
    
    const pk = generatePK(dateObj, timeStr, roomType, 1);

    const rowData = new Array(12).fill('');
    rowData[COLS.DATE] = Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
    rowData[COLS.START] = timeStr;
    rowData[COLS.END] = endTimeStr;
    rowData[COLS.EMPLOYEE] = formData.trainer;
    rowData[COLS.CLIENT] = formData.client;
    rowData[COLS.STATUS] = "Отправить напоминание"; 
    rowData[COLS.TYPE] = formData.room; // По просьбе юзера в G
    rowData[COLS.CATEGORY] = formData.category || "Индивидуальный"; // В H
    rowData[COLS.REPLACE] = ''; 
    rowData[COLS.COMMENT] = ''; 
    rowData[COLS.PK] = pk;
    rowData[COLS.WHATSAPP] = '';

    const sheet = getScheduleSheet();
    // Поиск последней строки с контентом в A:E
    const lastRowWithData = findLastRowInColumns(sheet, 1, 5);
    sheet.getRange(lastRowWithData + 1, 1, 1, rowData.length).setValues([rowData]);
    const resultRowIndex = lastRowWithData + 1;
    
    logCreatedRecord({
      pk: pk,
      date: formData.date,
      time: timeStr,
      room_type: roomType,
      rowIndex: resultRowIndex,
      action: 'create', 
      message: 'Success'
    });
    
    logScriptEnd(logCtx, 'success');
    return { status: 'success', pk: pk, row: resultRowIndex };
    
  } catch (e) {
    logCreatedRecord({
      date: formData ? formData.date : 'N/A',
      action: 'create_error',
      message: e.message
    });
    logScriptEnd(logCtx, 'error', e.message);
    throw e; 
    
  } finally {
    lock.releaseLock();
  }
}

/**
 * Получение истории клиента: 5 последних покупок и записи (предстоящие + 5 последних)
 */
function getClientHistory(clientName) {
  if (!clientName) return { sales: [], training: [] };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Покупки (из листа "Продажи")
  const saleSheet = ss.getSheetByName(CONFIG.SHEET_SALES);
  let sales = [];
  if (saleSheet) {
    const lastRow = saleSheet.getLastRow();
    if (lastRow >= 2) {
      const data = saleSheet.getRange(2, 1, lastRow - 1, 8).getValues();
      const filteredSales = data.filter(r => r[1] === clientName);
      sales = filteredSales.slice(-5).reverse().map(r => ({
        date: typeof r[0] === 'object' ? Utilities.formatDate(r[0], ss.getSpreadsheetTimeZone(), "dd.MM.yy") : r[0],
        product: r[2],
        price: r[7]
      }));
    }
  }

  // 2. Тренировки (из листа "Расписание")
  const schSheet = ss.getSheetByName(CONFIG.SHEET_SCHEDULE);
  let training = [];
  if (schSheet) {
    const lastRow = schSheet.getLastRow();
    if (lastRow >= 2) {
      const data = schSheet.getRange(2, 1, lastRow - 1, 15).getValues();
      const filteredSch = data.filter(r => r[5] === clientName);
      
      filteredSch.sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        if (dateA - dateB !== 0) return dateB - dateA;
        return b[1].localeCompare(a[1]);
      });

      const now = new Date();
      now.setHours(0,0,0,0);

      const upcoming = filteredSch.filter(r => new Date(r[0]) >= now).reverse();
      const past = filteredSch.filter(r => new Date(r[0]) < now).slice(0, 5);

      training = upcoming.concat(past).map(r => ({
        date: typeof r[0] === 'object' ? Utilities.formatDate(r[0], ss.getSpreadsheetTimeZone(), "dd.MM.yy") : r[0],
        time: r[1],
        trainer: r[4],
        type: r[6],
        status: r[11] || 'Ок'
      }));
    }
  }

  return { sales, training };
}

/**
 * Проверка доступности тренера и клиента в реальном времени
 */
function checkAvailabilityRealtime(date, time, trainer, client, room) {
  try {
    const dateObj = new Date(date);
    const [hh, mm] = time.split(':').map(Number);
    const startM = hh * 60 + mm;
    const endM = startM + CONFIG.STEP_MIN;
    
    const rowsOnDate = findRowsByDate(dateObj);
    if (rowsOnDate.length === 0) return { conflict: false };
    
    try {
      if (trainer) checkTrainerConflict(rowsOnDate, trainer, startM, endM);
      if (client) checkClientConflict(rowsOnDate, client, startM, endM);
    } catch (e) {
      return { conflict: true, message: e.message };
    }
    
    return { conflict: false };
  } catch (e) {
    console.error('checkAvailabilityRealtime error:', e);
    return { conflict: false };
  }
}
```