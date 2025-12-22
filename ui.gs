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
    .setWidth(400);
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
 * Предполагается лист "Справочник", колонки для товаров/услуг
 */
function getProducts() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Справочник');
    if (!sheet) return [];
    
    // Предполагаем, что товары в колонках AC:AG (29-33)
    // AC=Название, AD=Тип, AE=Категория, AF=Цена, AG=Количество
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    
    const range = sheet.getRange(2, 29, lastRow - 1, 5); // AC(29) to AG(33)
    const values = range.getValues();
    
    return values.map(row => ({
      name: row[0],
      type: row[1],
      category: row[2],
      fullPrice: row[3],
      quantity: row[4]
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
    let sheet = ss.getSheetByName('Продажи');
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
    
    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();
    
    return { row: lastRow };
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
    rowData[COLS.STATUS] = STATUS.BOOKED; 
    rowData[COLS.TYPE] = CONFIG.TRAINING_TYPES.POOL; 
    rowData[COLS.CATEGORY] = roomType; 
    rowData[COLS.REPLACE] = ''; 
    rowData[COLS.COMMENT] = ''; 
    rowData[COLS.PK] = pk;
    rowData[COLS.WHATSAPP] = '';

    const sheet = getScheduleSheet();
    sheet.appendRow(rowData);
    const resultRowIndex = sheet.getLastRow();
    
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