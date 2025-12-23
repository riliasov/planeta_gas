/**
 * Repository for Product/Pricelist data access.
 * Extends BaseRepository.
 * 
 * Data Contract: PRODUCT_COLS (5 columns A:E)
 */
class ProductRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEET_PRODUCTS);
  }

  /**
   * Get all products.
   * @returns {Array<Object>}
   */
  getAll() {
    const rawData = this.getAllValues(1); // Headers on row 1
    return rawData.map(row => this.mapRowToModel(row))
                  .filter(p => p.name); // Basic validation
  }

  /**
   * Get products by type.
   * @param {string} type 
   * @returns {Array<Object>}
   */
  getByType(type) {
    return this.getAll().filter(p => p.type === type);
  }

  /**
   * Map row array to Domain Model (JSON).
   * @param {Array} row 
   * @returns {Object}
   */
  mapRowToModel(row) {
    return {
      name: row[PRODUCT_COLS.NAME] || '',
      type: row[PRODUCT_COLS.TYPE] || '',
      category: row[PRODUCT_COLS.CATEGORY] || '',
      quantity: row[PRODUCT_COLS.QUANTITY] || 0,
      price: row[PRODUCT_COLS.PRICE] || 0
    };
  }

  /**
   * Map Domain Model (JSON) to row array.
   * @param {Object} model 
   * @returns {Array}
   */
  mapModelToRow(model) {
    const row = new Array(5).fill('');
    row[PRODUCT_COLS.NAME] = model.name || '';
    row[PRODUCT_COLS.TYPE] = model.type || '';
    row[PRODUCT_COLS.CATEGORY] = model.category || '';
    row[PRODUCT_COLS.QUANTITY] = model.quantity || 0;
    row[PRODUCT_COLS.PRICE] = model.price || 0;
    return row;
  }
}
