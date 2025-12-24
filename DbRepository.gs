/**
 * Универсальный репозиторий для доступа к Google Sheets.
 * Реализует CRUD операции с использованием JSON-моделей.
 */
class DbRepository {
  /**
   * @param {string} sheetName - Имя листа таблицы.
   * @param {Object} columnMap - Объект с индексами колонок (из constants.gs).
   * @param {number} headerRows - Количество строк заголовка (по умолчанию 1).
   */
  constructor(sheetName, columnMap, headerRows = 1) {
    this.sheetName = sheetName;
    this.columnMap = columnMap;
    this.headerRows = headerRows;
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    this.sheet = null;
    
    // Постоянный индекс колонки PK для оптимизации
    this.pkIndex = columnMap.PK;
    if (this.pkIndex === undefined) {
      throw new Error(`Repository Error: Column 'PK' not defined for ${sheetName}`);
    }
  }

  /**
   * Ленивая загрузка листа.
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  getSheet() {
    if (this.sheet) return this.sheet;
    
    this.sheet = findSheetByName(this.ss, this.sheetName);
    if (!this.sheet) {
      throw new Error(`DbRepository: Лист "${this.sheetName}" не найден.`);
    }
    return this.sheet;
  }

  /**
   * Поиск записи по PK.
   * @param {string} pk 
   * @returns {Object|null} Модель данных или null.
   */
  findById(pk) {
    if (!pk) return null;
    const rowIndex = this._findRowIndexByPk(pk);
    if (rowIndex === -1) return null;
    
    const sheet = this.getSheet();
    const rowValues = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    return this.mapRowToModel(rowValues);
  }

  /**
   * Возвращает все записи в виде массива моделей.
   * @returns {Array<Object>}
   */
  findAll() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= this.headerRows) return [];
    
    const numRows = lastRow - this.headerRows;
    const numCols = sheet.getLastColumn();
    const data = sheet.getRange(this.headerRows + 1, 1, numRows, numCols).getValues();
    return data.map(row => this.mapRowToModel(row))
               .filter(model => model && model.pk);
  }

  /**
   * Поиск записей по произвольному полю.
   * @param {string} fieldName - Ключ из columnMap (напр. 'PHONE').
   * @param {any} value - Значение для поиска.
   * @returns {Array<Object>}
   */
  findByField(fieldName, value) {
    const colIdx = this.columnMap[fieldName];
    if (colIdx === undefined) throw new Error(`Field ${fieldName} not found in map`);

    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= this.headerRows) return [];

    const data = sheet.getRange(this.headerRows + 1, 1, lastRow - this.headerRows, sheet.getLastColumn()).getValues();
    
    // Приводим все к строке для надежного сравнения, если это текст
    const targetVal = String(value).toLowerCase();
    
    return data
      .filter(row => String(row[colIdx]).toLowerCase() === targetVal)
      .map(row => this.mapRowToModel(row));
  }

  /**
   * Создает новую запись.
   * @param {Object} model
   * @returns {string} PK созданной записи.
   */
  create(model) {
    if (!model.pk) model.pk = generateUUID();
    const rowData = this.mapModelToRow(model);
    
    this.getSheet().appendRow(rowData);
    return model.pk;
  }

  /**
   * Обновляет существующую запись по PK.
   * @param {Object} model 
   * @returns {boolean} Результат операции.
   */
  update(model) {
    if (!model.pk) throw new Error("Update Error: PK is required");
    
    const rowIndex = this._findRowIndexByPk(model.pk);
    if (rowIndex === -1) {
      throw new Error(`Update Error: Record with PK ${model.pk} not found`);
    }
    
    const rowData = this.mapModelToRow(model);
    const sheet = this.getSheet();
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return true;
  }

  /**
   * Удаляет запись по PK.
   * @param {string} pk 
   * @returns {boolean}
   */
  delete(pk) {
    const rowIndex = this._findRowIndexByPk(pk);
    if (rowIndex === -1) return false;
    
    this.getSheet().deleteRow(rowIndex);
    return true;
  }

  /**
   * Поиск индекса строки по PK (внутренний метод).
   * @private
   */
  _findRowIndexByPk(pk) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= this.headerRows) return -1;
    
    const pks = sheet.getRange(this.headerRows + 1, this.pkIndex + 1, lastRow - this.headerRows, 1).getValues();
    
    for (let i = 0; i < pks.length; i++) {
      if (String(pks[i][0]) === String(pk)) {
        return i + this.headerRows + 1;
      }
    }
    return -1;
  }

  /**
   * Маппинг строки (Array) в JSON-модель. Должен быть переопределен в потомках.
   */
  mapRowToModel(row) {
    throw new Error("mapRowToModel must be implemented in subclass");
  }

  /**
   * Маппинг JSON-модели в строку (Array). Должен быть переопределен в потомках.
   */
  mapModelToRow(model) {
    throw new Error("mapModelToRow must be implemented in subclass");
  }

  /**
   * Вспомогательный метод для форматирования дат.
   */
  _formatDate(val) {
    if (val instanceof Date) {
      return Utilities.formatDate(val, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
    }
    return val;
  }
}
