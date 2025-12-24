/**
 * Слой контроллеров. 
 * Единственная точка входа для UI (sidebar.html).
 * Управляет блокировками, логированием выполнения и обработкой ошибок.
 */

/**
 * Меню при открытии таблицы.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏊 Бассейн')
    .addItem('➕ Открыть Sidebar', 'openSidebar')
    .addToUi();
  
  openSidebar();
}

/**
 * Открывает боковую панель.
 */
function openSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Панель управления')
    .setWidth(430);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * КОНТРОЛЛЕР: Создание тренировки.
 */
function createTraining(formData) {
  const logCtx = logScriptStart('createTraining', 'Запрос на бронирование из UI');
  const lock = LockService.getScriptLock();
  
  try {
    if (!lock.tryLock(10000)) {
      throw new Error('Система занята. Попробуйте через 10 секунд.');
    }
    
    // Вызов сервисного слоя
    const pk = BookingService.createTraining(formData);
    
    SpreadsheetApp.flush();
    logScriptEnd(logCtx, 'success', `Booking PK: ${pk}`);
    return { status: 'success', pk: pk };
    
  } catch (e) {
    logScriptEnd(logCtx, 'error', e.message);
    throw e;
  } finally {
    lock.releaseLock();
  }
}

/**
 * КОНТРОЛЛЕР: Проверка доступности (Realtime).
 */
function checkAvailabilityRealtime(date, time, trainer, client, room) {
  try {
    return BookingService.checkAvailability(date, time, trainer, client, room);
  } catch (e) {
    console.error('checkAvailabilityRealtime error:', e);
    return { conflict: false };
  }
}

/**
 * КОНТРОЛЛЕР: Создание продажи.
 */
function createSale(payload) {
  const logCtx = logScriptStart('createSale', 'Запрос на создание продажи из UI');
  const lock = LockService.getScriptLock();
  
  try {
    if (!lock.tryLock(10000)) throw new Error('Система занята.');
    
    const result = SalesService.createSale(payload);
    
    SpreadsheetApp.flush();
    logScriptEnd(logCtx, 'success');
    return result;
  } catch (e) {
    logScriptEnd(logCtx, 'error', e.message);
    throw e;
  } finally {
    lock.releaseLock();
  }
}

/**
 * КОНТРОЛЛЕР: Получить продукты.
 */
function getProducts() {
  try {
    return SalesService.getProducts();
  } catch (e) {
    console.error('getProducts error:', e);
    return [];
  }
}

/**
 * КОНТРОЛЛЕР: Получить историю клиента.
 */
function getClientHistory(clientName) {
  try {
    return ClientService.getClientHistory(clientName);
  } catch (e) {
    console.error('getClientHistory error:', e);
    return { sales: [], training: [] };
  }
}

/**
 * КОНТРОЛЛЕР: Получить список сотрудников.
 */
function getStaff() {
  // Простой запрос к репозиторию, не требует сервисной логики
  try {
    const employeeRepo = new EmployeeRepository();
    return employeeRepo.getAll().map(t => ({
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
 * КОНТРОЛЛЕР: Получить список клиентов.
 */
function getClients() {
  try {
    return ClientService.getAllClients();
  } catch (e) {
    console.error('getClients UI error:', e);
    return [];
  }
}

/**
 * КОНТРОЛЛЕР: Получить список задач.
 */
function getTasks() {
  try {
    const repo = new TaskRepository();
    // Используем findAll и мапим в формат, который ждет UI
    return repo.findAll()
      .filter(t => t.description && t.date !== 'Выполнено') // Простая фильтрация
      .map(t => ({
        task: t.description,
        source: t.sheet,
        link: t.link
      }));
  } catch (e) {
    console.error('getTasks error:', e);
    return [];
  }
}

/**
 * Перейти к ячейке.
 */
function openTaskCell(link) {
  if (!link) return;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const range = ss.getRange(link);
    if (range) ss.setActiveRange(range);
  } catch (e) {
    console.error('openTaskCell error:', e);
  }
}
