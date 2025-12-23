/**
 * Repository for Sales data access.
 * Extends BaseRepository.
 * 
 * Data Contract: SALES_COLS (23 columns A:W)
 * NOTE: Headers on row 2, data from row 3
 */
class SalesRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEET_SALES);
  }

  /**
   * Create a new sale record.
   * @param {Object} model - Domain model (JSON)
   * @returns {number} Row index
   */
  create(model) {
    const rowData = this.mapModelToRow(model);
    const sheet = this.getSheet();
    
    // Sales sheet has headers on row 2, so data starts from row 3
    const lastRowWithData = this.findLastRowInColumns(sheet, 1, 3);
    const targetRow = Math.max(lastRowWithData + 1, 3); // Minimum row 3
    
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    
    return targetRow;
  }

  /**
   * Map row array to Domain Model (JSON).
   * @param {Array} row 
   * @returns {Object}
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
   * Map Domain Model (JSON) to row array.
   * @param {Object} model 
   * @returns {Array}
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

  /**
   * Helper for finding last row in specific columns.
   */
  findLastRowInColumns(sheet, startCol, endCol) {
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) return 0;
    const range = sheet.getRange(1, startCol, lastRow, endCol - startCol + 1);
    const values = range.getValues();
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i].some(cell => cell !== "" && cell !== null)) {
        return i + 1;
      }
    }
    return 0;
  }
}
