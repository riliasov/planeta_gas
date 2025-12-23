/**
 * Base Repository for Planet GAS.
 * Provides shared logic for accessing sheets, logging, and error handling.
 */
class BaseRepository {
  /**
   * @param {string} sheetName - The name of the sheet to manage.
   */
  constructor(sheetName) {
    this.sheetName = sheetName;
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    this.sheet = null;
  }

  /**
   * Lazy loads and returns the sheet.
   * Uses the robust finding mechanism from sheetDriver or implements its own.
   * @returns {Sheet}
   */
  getSheet() {
    if (this.sheet) return this.sheet;

    // Use the global helper we created earlier in sheetDriver.gs
    // If we wanted to eliminate the dependency on sheetDriver entirely, we'd copy `findSheetByName` here.
    // For now, let's assume `findSheetByName` is available globally or we re-implement it static.
    this.sheet = findSheetByName(this.ss, this.sheetName);
    
    if (!this.sheet) {
      console.error(`[BaseRepository] Sheet not found: ${this.sheetName}`);
      throw new Error(`Sheet not found: ${this.sheetName}`);
    }
    return this.sheet;
  }

  /**
   * Returns all data rows (skipping header).
   * @param {number} headerRows - Number of header rows to skip (default 1).
   * @returns {Array<Array<any>>}
   */
  getAllValues(headerRows = 1) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= headerRows) return [];
    
    // index, row, numRows, numCols
    const numRows = lastRow - headerRows;
    const numCols = sheet.getLastColumn();
    
    if (numCols === 0) return [];

    return sheet.getRange(headerRows + 1, 1, numRows, numCols).getValues();
  }

  /**
   * Append a row to the sheet.
   * @param {Array<any>} rowData 
   * @returns {number} The new row index.
   */
  create(rowData) {
    const sheet = this.getSheet();
    sheet.appendRow(rowData);
    return sheet.getLastRow();
  }
}

/**
 * Helper static method if not importing from sheetDriver
 * (Though we currently have it in global scope from sheetDriver.gs)
 */
function findSheetByName(ss, name) {
   if (!ss || !name) return null;
   let sheet = ss.getSheetByName(name);
   if (sheet) return sheet;
   
   const normalize = (s) => String(s).trim().toLowerCase();
   const target = normalize(name);
   const allSheets = ss.getSheets();
   for (const s of allSheets) {
     if (normalize(s.getName()) === target) return s;
   }
   return null;
}
