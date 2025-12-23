/**
 * Repository for Client data access.
 * Extends BaseRepository.
 * 
 * Data Contract: CLIENT_COLS (10 columns A:J)
 */
class ClientRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEET_CLIENTS);
  }

  /**
   * Retrieves all clients mapped to domain objects.
   * @returns {Array<Object>}
   */
  getAll() {
    const rawData = this.getAllValues(1); // Headers on row 1
    
    return rawData.map(row => this.mapRowToModel(row))
                  .filter(c => c.name); // Basic validation
  }

  /**
   * Map row array to Domain Model (JSON).
   * @param {Array} row 
   * @returns {Object}
   */
  mapRowToModel(row) {
    return {
      name: row[CLIENT_COLS.NAME] || '',
      phone: row[CLIENT_COLS.PHONE] || '',
      childName: row[CLIENT_COLS.CHILD_NAME] || '',
      childDob: this._formatDate(row[CLIENT_COLS.CHILD_DOB]),
      age: row[CLIENT_COLS.AGE] || '',
      spent: row[CLIENT_COLS.SPENT] || 0,
      balance: row[CLIENT_COLS.BALANCE] || 0,
      debt: row[CLIENT_COLS.DEBT] || 0,
      status: row[CLIENT_COLS.STATUS] || '',
      pk: row[CLIENT_COLS.PK] || ''
    };
  }

  /**
   * Map Domain Model (JSON) to row array.
   * @param {Object} model 
   * @returns {Array}
   */
  mapModelToRow(model) {
    const row = new Array(10).fill('');
    row[CLIENT_COLS.NAME] = model.name || '';
    row[CLIENT_COLS.PHONE] = model.phone || '';
    row[CLIENT_COLS.CHILD_NAME] = model.childName || '';
    row[CLIENT_COLS.CHILD_DOB] = model.childDob || '';
    row[CLIENT_COLS.AGE] = model.age || '';
    row[CLIENT_COLS.SPENT] = model.spent || 0;
    row[CLIENT_COLS.BALANCE] = model.balance || 0;
    row[CLIENT_COLS.DEBT] = model.debt || 0;
    row[CLIENT_COLS.STATUS] = model.status || '';
    row[CLIENT_COLS.PK] = model.pk || generateUUID();
    return row;
  }
  
  /**
   * Search clients by query (Name, Phone, ChildName).
   * @param {string} query 
   * @returns {Array<Object>}
   */
  search(query) {
    if (!query || query.length < 2) return [];
    
    const all = this.getAll();
    const qLower = query.toLowerCase();
    
    return all.filter(c => {
      const nameMatch = c.name && String(c.name).toLowerCase().includes(qLower);
      const phoneMatch = c.phone && String(c.phone).toLowerCase().includes(qLower);
      const childMatch = c.childName && String(c.childName).toLowerCase().includes(qLower);
      return nameMatch || phoneMatch || childMatch;
    });
  }

  /**
   * Helper to safely format date
   */
  _formatDate(val) {
    if (val instanceof Date) {
      return Utilities.formatDate(val, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
    }
    return val;
  }
}
