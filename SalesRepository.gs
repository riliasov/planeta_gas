/**
 * Репозиторий для работы с данными продаж.
 * Наследует DbRepository.
 * ВАЖНО: Заголовки на 2-й строке, данные с 3-й.
 */
class SalesRepository extends DbRepository {
  constructor() {
    super(CONFIG.SHEET_SALES, SALES_COLS, 2);
  }

  /**
   * Переопределение метода create для учета специфики листа продаж.
   */
  create(model) {
    if (!model.pk) model.pk = generateUUID();
    const rowData = this.mapModelToRow(model);
    const sheet = this.getSheet();
    
    // Поиск последней заполненной строки в первых колонках
    const values = sheet.getRange(1, 1, sheet.getLastRow(), 3).getValues();
    let lastRowWithData = 0;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i].some(cell => cell !== "" && cell !== null)) {
        lastRowWithData = i + 1;
        break;
      }
    }
    
    const targetRow = Math.max(lastRowWithData + 1, 3);
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    return model.pk;
  }

  /**
   * Маппинг строки Sheets в JSON-модель.
   */
  mapRowToModel(row) {
    return {
      date: row[SALES_COLS.DATE] || '',
      client: row[SALES_COLS.CLIENT] || '',
      product: row[SALES_COLS.PRODUCT] || '',
      type: row[SALES_COLS.TYPE] || '',
      category: row[SALES_COLS.CATEGORY] || '',
      quantity: row[SALES_COLS.QUANTITY] || 0,
      fullPrice: row[SALES_COLS.FULL_PRICE] || 0,
      discount: row[SALES_COLS.DISCOUNT] || 0,
      finalPrice: row[SALES_COLS.FINAL_PRICE] || 0,
      cash: row[SALES_COLS.CASH] || 0,
      transfer: row[SALES_COLS.TRANSFER] || 0,
      terminal: row[SALES_COLS.TERMINAL] || 0,
      debt: row[SALES_COLS.DEBT] || 0,
      admin: row[SALES_COLS.ADMIN] || '',
      trainer: row[SALES_COLS.TRAINER] || '',
      comment: row[SALES_COLS.COMMENT] || '',
      adminBonus: row[SALES_COLS.ADMIN_BONUS] || 0,
      trainerBonus: row[SALES_COLS.TRAINER_BONUS] || 0,
      evotor: row[SALES_COLS.EVOTOR] || '',
      crm: row[SALES_COLS.CRM] || '',
      lastChange: row[SALES_COLS.LAST_CHANGE] || '',
      changedBy: row[SALES_COLS.CHANGED_BY] || '',
      pk: row[SALES_COLS.PK] || ''
    };
  }

  /**
   * Маппинг JSON-модели в строку Sheets.
   */
  mapModelToRow(model) {
    const row = new Array(23).fill('');
    row[SALES_COLS.DATE] = model.date || new Date();
    row[SALES_COLS.CLIENT] = model.client || '';
    row[SALES_COLS.PRODUCT] = model.product || '';
    row[SALES_COLS.TYPE] = model.type || '';
    row[SALES_COLS.CATEGORY] = model.category || '';
    row[SALES_COLS.QUANTITY] = model.quantity || 0;
    row[SALES_COLS.FULL_PRICE] = model.fullPrice || 0;
    row[SALES_COLS.DISCOUNT] = model.discount || 0;
    row[SALES_COLS.FINAL_PRICE] = model.finalPrice || 0;
    row[SALES_COLS.CASH] = model.cash || 0;
    row[SALES_COLS.TRANSFER] = model.transfer || 0;
    row[SALES_COLS.TERMINAL] = model.terminal || 0;
    row[SALES_COLS.DEBT] = model.debt || 0;
    row[SALES_COLS.ADMIN] = model.admin || Session.getActiveUser().getEmail();
    row[SALES_COLS.TRAINER] = model.trainer || '';
    row[SALES_COLS.COMMENT] = model.comment || '';
    row[SALES_COLS.ADMIN_BONUS] = model.adminBonus || 0;
    row[SALES_COLS.TRAINER_BONUS] = model.trainerBonus || 0;
    row[SALES_COLS.EVOTOR] = model.evotor || '';
    row[SALES_COLS.CRM] = model.crm || '';
    row[SALES_COLS.LAST_CHANGE] = model.lastChange || new Date();
    row[SALES_COLS.CHANGED_BY] = model.changedBy || Session.getActiveUser().getEmail();
    row[SALES_COLS.PK] = model.pk || generateUUID();
    return row;
  }
}
