/**
 * Repository for Sales data access.
 * Extends BaseRepository.
 */
class SalesRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEET_SALES || 'Продажи');
  }

  /**
   * Create a new sale record.
   * @param {Array} rowData 
   */
  create(rowData) {
    const sheet = this.getSheet();
    
    // Use the smart insert logic from salesService
    const lastRowWithData = this.findLastRowInColumns(sheet, 1, 3);
    const targetRow = lastRowWithData + 1;
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    
    return targetRow;
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
