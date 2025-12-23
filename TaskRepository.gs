/**
 * Repository for Task data access.
 * Extends BaseRepository.
 * 
 * Data Contract: TASK_COLS (8 columns A:H)
 */
class TaskRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEET_TASKS);
  }

  /**
   * Get all tasks.
   * @returns {Array<Object>}
   */
  getAll() {
    const rawData = this.getAllValues(1); // Headers on row 1
    return rawData.map(row => this.mapRowToModel(row));
  }

  /**
   * Create a new task.
   * @param {Object} model - Domain model (JSON)
   * @returns {number} Row index
   */
  create(model) {
    const rowData = this.mapModelToRow(model);
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    const targetRow = lastRow + 1;
    
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
      id: row[TASK_COLS.ID] || '',
      manualTask: row[TASK_COLS.MANUAL_TASK] || '',
      date: row[TASK_COLS.DATE] || '',
      sheet: row[TASK_COLS.SHEET] || '',
      type: row[TASK_COLS.TYPE] || '',
      admin: row[TASK_COLS.ADMIN] || '',
      description: row[TASK_COLS.DESCRIPTION] || '',
      link: row[TASK_COLS.LINK] || ''
    };
  }

  /**
   * Map Domain Model (JSON) to row array.
   * @param {Object} model 
   * @returns {Array}
   */
  mapModelToRow(model) {
    const row = new Array(8).fill('');
    row[TASK_COLS.ID] = model.id || generateUUID();
    row[TASK_COLS.MANUAL_TASK] = model.manualTask || '';
    row[TASK_COLS.DATE] = model.date || new Date();
    row[TASK_COLS.SHEET] = model.sheet || '';
    row[TASK_COLS.TYPE] = model.type || '';
    row[TASK_COLS.ADMIN] = model.admin || Session.getActiveUser().getEmail();
    row[TASK_COLS.DESCRIPTION] = model.description || '';
    row[TASK_COLS.LINK] = model.link || '';
    return row;
  }
}
