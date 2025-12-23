/**
 * Repository for Employee data access.
 * Extends BaseRepository.
 * 
 * Data Contract: EMPLOYEE_COLS (3 columns A:C)
 */
class EmployeeRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEET_EMPLOYEES);
  }

  /**
   * Get all employees.
   * @returns {Array<Object>}
   */
  getAll() {
    const rawData = this.getAllValues(1); // Headers on row 1
    return rawData.map(row => this.mapRowToModel(row))
                  .filter(e => e.name); // Basic validation
  }

  /**
   * Get employees by type (e.g., 'Тренер', 'Админ').
   * @param {string} type 
   * @returns {Array<Object>}
   */
  getByType(type) {
    return this.getAll().filter(e => e.type === type);
  }

  /**
   * Map row array to Domain Model (JSON).
   * @param {Array} row 
   * @returns {Object}
   */
  mapRowToModel(row) {
    return {
      name: row[EMPLOYEE_COLS.NAME] || '',
      type: row[EMPLOYEE_COLS.TYPE] || '',
      email: row[EMPLOYEE_COLS.EMAIL] || ''
    };
  }

  /**
   * Map Domain Model (JSON) to row array.
   * @param {Object} model 
   * @returns {Array}
   */
  mapModelToRow(model) {
    const row = new Array(3).fill('');
    row[EMPLOYEE_COLS.NAME] = model.name || '';
    row[EMPLOYEE_COLS.TYPE] = model.type || '';
    row[EMPLOYEE_COLS.EMAIL] = model.email || '';
    return row;
  }
}
