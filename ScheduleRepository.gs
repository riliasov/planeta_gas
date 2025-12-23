/**
 * Repository for Schedule/Booking data access.
 * Extends BaseRepository.
 * 
 * Data Contract: SCHEDULE_COLS (14 columns A:N)
 */
class ScheduleRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEET_SCHEDULE);
  }

  /**
   * Finds rows for a specific date.
   * @param {Date} dateObj 
   * @returns {Array<Object>} Array of {rowIndex, values, model}
   */
  getByDate(dateObj) {
    const sheet = this.getSheet();
    const dateStr = Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return []; // Headers on row 1

    const finder = sheet.getRange("A:A").createTextFinder(dateStr).matchEntireCell(true);
    const ranges = finder.findAll();
    
    if (ranges.length === 0) return [];

    const firstRowIndex = ranges[0].getRow();
    const lastRowIndex = ranges[ranges.length - 1].getRow();
    const numRows = lastRowIndex - firstRowIndex + 1;
    const dataValues = sheet.getRange(firstRowIndex, 1, numRows, 14).getValues(); // 14 columns
    
    const result = [];
    dataValues.forEach((row, i) => {
      let rowDateStr;
      if (row[SCHEDULE_COLS.DATE] instanceof Date) {
        rowDateStr = Utilities.formatDate(row[SCHEDULE_COLS.DATE], CONFIG.TIME_ZONE, 'dd.MM.yyyy');
      } else {
        rowDateStr = String(row[SCHEDULE_COLS.DATE]);
      }

      if (rowDateStr === dateStr) {
        result.push({
          rowIndex: firstRowIndex + i,
          values: row,
          model: this.mapRowToModel(row)
        });
      }
    });
    
    return result;
  }

  /**
   * Update a specific row.
   * @param {number} rowIndex 
   * @param {Array} rowData 
   */
  update(rowIndex, rowData) {
    const sheet = this.getSheet();
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  }

  /**
   * Insert a row after a specific index.
   * @param {number} rowIndex 
   * @param {Array} rowData 
   * @returns {number} New row index
   */
  insertAfter(rowIndex, rowData) {
    const sheet = this.getSheet();
    sheet.insertRowAfter(rowIndex);
    const newIdx = rowIndex + 1;
    sheet.getRange(newIdx, 1, 1, rowData.length).setValues([rowData]);
    return newIdx;
  }

  /**
   * Map row array to Domain Model (JSON).
   * @param {Array} row 
   * @returns {Object}
   */
  mapRowToModel(row) {
    return {
      date: row[SCHEDULE_COLS.DATE],
      start: row[SCHEDULE_COLS.START],
      end: row[SCHEDULE_COLS.END],
      employee: row[SCHEDULE_COLS.EMPLOYEE],
      client: row[SCHEDULE_COLS.CLIENT],
      status: row[SCHEDULE_COLS.STATUS],
      type: row[SCHEDULE_COLS.TYPE],
      category: row[SCHEDULE_COLS.CATEGORY],
      replace: row[SCHEDULE_COLS.REPLACE],
      comment: row[SCHEDULE_COLS.COMMENT],
      remainingLessons: row[SCHEDULE_COLS.REMAINING_LESSONS],
      totalVisited: row[SCHEDULE_COLS.TOTAL_VISITED],
      whatsappReminder: row[SCHEDULE_COLS.WHATSAPP_REMINDER],
      pk: row[SCHEDULE_COLS.PK]
    };
  }

  /**
   * Map Domain Model (JSON) to row array.
   * @param {Object} model 
   * @returns {Array}
   */
  mapModelToRow(model) {
    const row = new Array(14).fill('');
    row[SCHEDULE_COLS.DATE] = model.date || '';
    row[SCHEDULE_COLS.START] = model.start || '';
    row[SCHEDULE_COLS.END] = model.end || '';
    row[SCHEDULE_COLS.EMPLOYEE] = model.employee || '';
    row[SCHEDULE_COLS.CLIENT] = model.client || '';
    row[SCHEDULE_COLS.STATUS] = model.status || '';
    row[SCHEDULE_COLS.TYPE] = model.type || '';
    row[SCHEDULE_COLS.CATEGORY] = model.category || '';
    row[SCHEDULE_COLS.REPLACE] = model.replace || '';
    row[SCHEDULE_COLS.COMMENT] = model.comment || '';
    row[SCHEDULE_COLS.REMAINING_LESSONS] = model.remainingLessons || '';
    row[SCHEDULE_COLS.TOTAL_VISITED] = model.totalVisited || '';
    row[SCHEDULE_COLS.WHATSAPP_REMINDER] = model.whatsappReminder || '';
    row[SCHEDULE_COLS.PK] = model.pk || generateUUID();
    return row;
  }
}
