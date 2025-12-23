/**
 * Schema Validator - проверка соответствия таблиц Data Contracts.
 * Запускается при старте приложения.
 */

/**
 * Валидация всех схем данных.
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateSchemas() {
  const errors = [];
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Validate Schedule
    const scheduleSheet = findSheetByName(ss, CONFIG.SHEET_SCHEDULE);
    if (!scheduleSheet) {
      errors.push(`Лист "${CONFIG.SHEET_SCHEDULE}" не найден`);
    } else {
      const scheduleErrors = validateSheet(scheduleSheet, {
        name: CONFIG.SHEET_SCHEDULE,
        expectedColumns: 14,
        headerRow: 1,
        requiredHeaders: ['Дата', 'Начало', 'Конец', 'Сотрудник', 'Клиент', 'Статус', 'PK']
      });
      errors.push(...scheduleErrors);
    }
    
    // 2. Validate Clients
    const clientsSheet = findSheetByName(ss, CONFIG.SHEET_CLIENTS);
    if (!clientsSheet) {
      errors.push(`Лист "${CONFIG.SHEET_CLIENTS}" не найден`);
    } else {
      const clientErrors = validateSheet(clientsSheet, {
        name: CONFIG.SHEET_CLIENTS,
        expectedColumns: 10,
        headerRow: 1,
        requiredHeaders: ['Клиент', 'Мобильный', 'PK']
      });
      errors.push(...clientErrors);
    }
    
    // 3. Validate Sales
    const salesSheet = findSheetByName(ss, CONFIG.SHEET_SALES);
    if (!salesSheet) {
      errors.push(`Лист "${CONFIG.SHEET_SALES}" не найден`);
    } else {
      const salesErrors = validateSheet(salesSheet, {
        name: CONFIG.SHEET_SALES,
        expectedColumns: 23,
        headerRow: 2,
        requiredHeaders: ['Дата', 'Клиент', 'Продукт', 'PK']
      });
      errors.push(...salesErrors);
    }
    
    // 4. Validate Employees
    const employeesSheet = findSheetByName(ss, CONFIG.SHEET_EMPLOYEES);
    if (!employeesSheet) {
      errors.push(`Лист "${CONFIG.SHEET_EMPLOYEES}" не найден`);
    } else {
      const empErrors = validateSheet(employeesSheet, {
        name: CONFIG.SHEET_EMPLOYEES,
        expectedColumns: 3,
        headerRow: 1,
        requiredHeaders: ['Имя сотрудника', 'Тип']
      });
      errors.push(...empErrors);
    }
    
    // 5. Validate Products
    const productsSheet = findSheetByName(ss, CONFIG.SHEET_PRODUCTS);
    if (!productsSheet) {
      errors.push(`Лист "${CONFIG.SHEET_PRODUCTS}" не найден`);
    } else {
      const prodErrors = validateSheet(productsSheet, {
        name: CONFIG.SHEET_PRODUCTS,
        expectedColumns: 5,
        headerRow: 1,
        requiredHeaders: ['Продукт', 'Актуальная цена']
      });
      errors.push(...prodErrors);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
    
  } catch (e) {
    return {
      valid: false,
      errors: [`Критическая ошибка валидации: ${e.message}`]
    };
  }
}

/**
 * Валидация отдельного листа.
 * @param {Sheet} sheet 
 * @param {Object} config 
 * @returns {Array<string>} errors
 */
function validateSheet(sheet, config) {
  const errors = [];
  
  try {
    const lastColumn = sheet.getLastColumn();
    
    // Check column count
    if (lastColumn < config.expectedColumns) {
      errors.push(
        `${config.name}: Недостаточно колонок (найдено ${lastColumn}, ожидается ${config.expectedColumns})`
      );
    }
    
    // Check headers
    if (sheet.getLastRow() < config.headerRow) {
      errors.push(`${config.name}: Лист пустой или отсутствуют заголовки`);
      return errors;
    }
    
    const headers = sheet.getRange(config.headerRow, 1, 1, config.expectedColumns).getValues()[0];
    
    config.requiredHeaders.forEach(requiredHeader => {
      const found = headers.some(h => 
        String(h).trim().toLowerCase() === requiredHeader.toLowerCase()
      );
      
      if (!found) {
        errors.push(
          `${config.name}: Отсутствует обязательный заголовок "${requiredHeader}"`
        );
      }
    });
    
  } catch (e) {
    errors.push(`${config.name}: Ошибка валидации - ${e.message}`);
  }
  
  return errors;
}

/**
 * Проверка наличия UUID в существующих данных.
 * @returns {Object} {hasUUIDs: boolean, stats: Object}
 */
function checkUUIDs() {
  const stats = {};
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Schedule
    const scheduleSheet = findSheetByName(ss, CONFIG.SHEET_SCHEDULE);
    if (scheduleSheet && scheduleSheet.getLastRow() >= 2) {
      const pkCol = SCHEDULE_COLS.PK + 1; // Convert to 1-based
      const values = scheduleSheet.getRange(2, pkCol, scheduleSheet.getLastRow() - 1, 1).getValues();
      const filled = values.filter(r => r[0] && String(r[0]).trim() !== '').length;
      stats.schedule = { total: values.length, filled: filled };
    }
    
    // Clients
    const clientsSheet = findSheetByName(ss, CONFIG.SHEET_CLIENTS);
    if (clientsSheet && clientsSheet.getLastRow() >= 2) {
      const pkCol = CLIENT_COLS.PK + 1;
      const values = clientsSheet.getRange(2, pkCol, clientsSheet.getLastRow() - 1, 1).getValues();
      const filled = values.filter(r => r[0] && String(r[0]).trim() !== '').length;
      stats.clients = { total: values.length, filled: filled };
    }
    
    // Sales
    const salesSheet = findSheetByName(ss, CONFIG.SHEET_SALES);
    if (salesSheet && salesSheet.getLastRow() >= 3) {
      const pkCol = SALES_COLS.PK + 1;
      const values = salesSheet.getRange(3, pkCol, salesSheet.getLastRow() - 2, 1).getValues();
      const filled = values.filter(r => r[0] && String(r[0]).trim() !== '').length;
      stats.sales = { total: values.length, filled: filled };
    }
    
    const hasUUIDs = Object.values(stats).every(s => s.filled === s.total && s.total > 0);
    
    return { hasUUIDs, stats };
    
  } catch (e) {
    return { hasUUIDs: false, error: e.message };
  }
}

/**
 * Автоматическое заполнение отсутствующих UUID.
 * ВНИМАНИЕ: Изменяет данные в таблицах!
 */
function fillMissingUUIDs() {
  const log = [];
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Schedule
    const scheduleSheet = findSheetByName(ss, CONFIG.SHEET_SCHEDULE);
    if (scheduleSheet && scheduleSheet.getLastRow() >= 2) {
      const filled = fillUUIDsInSheet(scheduleSheet, 2, SCHEDULE_COLS.PK + 1);
      log.push(`Расписание: заполнено ${filled} UUID`);
    }
    
    // Clients
    const clientsSheet = findSheetByName(ss, CONFIG.SHEET_CLIENTS);
    if (clientsSheet && clientsSheet.getLastRow() >= 2) {
      const filled = fillUUIDsInSheet(clientsSheet, 2, CLIENT_COLS.PK + 1);
      log.push(`Клиенты: заполнено ${filled} UUID`);
    }
    
    // Sales
    const salesSheet = findSheetByName(ss, CONFIG.SHEET_SALES);
    if (salesSheet && salesSheet.getLastRow() >= 3) {
      const filled = fillUUIDsInSheet(salesSheet, 3, SALES_COLS.PK + 1);
      log.push(`Продажи: заполнено ${filled} UUID`);
    }
    
    return { success: true, log: log };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Helper: заполнение UUID в конкретном листе.
 */
function fillUUIDsInSheet(sheet, startRow, pkColumn) {
  let count = 0;
  const lastRow = sheet.getLastRow();
  
  for (let i = startRow; i <= lastRow; i++) {
    const cell = sheet.getRange(i, pkColumn);
    const value = cell.getValue();
    
    if (!value || String(value).trim() === '') {
      cell.setValue(generateUUID());
      count++;
    }
  }
  
  return count;
}

/**
 * UI функция для запуска валидации из меню.
 */
function runSchemaValidation() {
  const result = validateSchemas();
  const uuidCheck = checkUUIDs();
  
  let message = '=== ВАЛИДАЦИЯ СХЕМЫ ДАННЫХ ===\n\n';
  
  if (result.valid) {
    message += '✅ Все схемы корректны\n\n';
  } else {
    message += '❌ Обнаружены ошибки:\n';
    result.errors.forEach(err => {
      message += `  • ${err}\n`;
    });
    message += '\n';
  }
  
  message += '=== ПРОВЕРКА UUID ===\n';
  if (uuidCheck.hasUUIDs) {
    message += '✅ Все записи имеют UUID\n';
  } else {
    message += '⚠️ Отсутствуют UUID:\n';
    Object.keys(uuidCheck.stats).forEach(sheet => {
      const s = uuidCheck.stats[sheet];
      if (s.filled < s.total) {
        message += `  • ${sheet}: ${s.filled}/${s.total}\n`;
      }
    });
    message += '\nЗапустите fillMissingUUIDs() для автозаполнения.\n';
  }
  
  SpreadsheetApp.getUi().alert('Валидация схемы', message, SpreadsheetApp.getUi().ButtonSet.OK);
}
