/**
 * Repository for Lead data access.
 * Extends BaseRepository.
 * 
 * Data Contract: LEAD_COLS (16 columns A:P)
 */
class LeadRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEET_LEADS);
  }

  /**
   * Get all leads.
   * @returns {Array<Object>}
   */
  getAll() {
    const rawData = this.getAllValues(1); // Headers on row 1
    return rawData.map(row => this.mapRowToModel(row));
  }

  /**
   * Create a new lead.
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
      client: row[LEAD_COLS.CLIENT] || '',
      date: row[LEAD_COLS.DATE] || '',
      phone: row[LEAD_COLS.PHONE] || '',
      request: row[LEAD_COLS.REQUEST] || '',
      adminCreated: row[LEAD_COLS.ADMIN_CREATED] || '',
      adultLastname: row[LEAD_COLS.ADULT_LASTNAME] || '',
      adultFirstname: row[LEAD_COLS.ADULT_FIRSTNAME] || '',
      childName: row[LEAD_COLS.CHILD_NAME] || '',
      childDob: row[LEAD_COLS.CHILD_DOB] || '',
      childGender: row[LEAD_COLS.CHILD_GENDER] || '',
      type: row[LEAD_COLS.TYPE] || '',
      adminClient: row[LEAD_COLS.ADMIN_CLIENT] || '',
      scheduledDate: row[LEAD_COLS.SCHEDULED_DATE] || '',
      source: row[LEAD_COLS.SOURCE] || '',
      comment: row[LEAD_COLS.COMMENT] || '',
      adminBooked: row[LEAD_COLS.ADMIN_BOOKED] || ''
    };
  }

  /**
   * Map Domain Model (JSON) to row array.
   * @param {Object} model 
   * @returns {Array}
   */
  mapModelToRow(model) {
    const row = new Array(16).fill('');
    row[LEAD_COLS.CLIENT] = model.client || '';
    row[LEAD_COLS.DATE] = model.date || new Date();
    row[LEAD_COLS.PHONE] = model.phone || '';
    row[LEAD_COLS.REQUEST] = model.request || '';
    row[LEAD_COLS.ADMIN_CREATED] = model.adminCreated || Session.getActiveUser().getEmail();
    row[LEAD_COLS.ADULT_LASTNAME] = model.adultLastname || '';
    row[LEAD_COLS.ADULT_FIRSTNAME] = model.adultFirstname || '';
    row[LEAD_COLS.CHILD_NAME] = model.childName || '';
    row[LEAD_COLS.CHILD_DOB] = model.childDob || '';
    row[LEAD_COLS.CHILD_GENDER] = model.childGender || '';
    row[LEAD_COLS.TYPE] = model.type || '';
    row[LEAD_COLS.ADMIN_CLIENT] = model.adminClient || '';
    row[LEAD_COLS.SCHEDULED_DATE] = model.scheduledDate || '';
    row[LEAD_COLS.SOURCE] = model.source || '';
    row[LEAD_COLS.COMMENT] = model.comment || '';
    row[LEAD_COLS.ADMIN_BOOKED] = model.adminBooked || '';
    return row;
  }
}
