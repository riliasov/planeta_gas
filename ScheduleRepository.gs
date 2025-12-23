/**
 * Repository for Schedule/Booking data access.
 * Extends BaseRepository.
 */
class ScheduleRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEET_NAME || 'Schedule');
  }

  /**
   * Finds rows for a specific date.
   * Replaces/Encapsulates findRowsByDate from sheetDriver.gs.
   * @param {Date} dateObj 
   * @returns {Array<Object>} Array of {rowIndex, values, model}
   */
  getByDate(dateObj) {
    const sheet = this.getSheet();
    const dateStr = Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
    
    const lastRow = sheet.getLastRow();
    if (lastRow < (CONFIG.HEADER_ROWS || 2)) return [];

    // Optimization: find rows by date string in column A
    const finder = sheet.getRange("A:A").createTextFinder(dateStr).matchEntireCell(true);
    const ranges = finder.findAll();
    
    if (ranges.length === 0) return [];

    const firstRowIndex = ranges[0].getRow();
    const lastRowIndex = ranges[ranges.length - 1].getRow();
    const numRows = lastRowIndex - firstRowIndex + 1;
    const dataValues = sheet.getRange(firstRowIndex, 1, numRows, sheet.getLastColumn()).getValues();
    
    const result = [];
    dataValues.forEach((row, i) => {
      let rowDateStr;
      if (row[COLS.DATE] instanceof Date) {
        rowDateStr = Utilities.formatDate(row[COLS.DATE], CONFIG.TIME_ZONE, 'dd.MM.yyyy');
      } else {
        rowDateStr = String(row[COLS.DATE]);
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
   * Map row array to Domain Model.
   * @param {Array} row 
   */
  mapRowToModel(row) {
    return {
      date: row[COLS.DATE],
      start: row[COLS.START],
      end: row[COLS.END],
      employee: row[COLS.EMPLOYEE],
      client: row[COLS.CLIENT],
      status: row[COLS.STATUS],
      type: row[COLS.TYPE],
      category: row[COLS.CATEGORY],
      replace: row[COLS.REPLACE],
      comment: row[COLS.COMMENT],
      pk: row[COLS.PK]
    };
  }
}
