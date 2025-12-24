/**
 * Репозиторий для работы с прайс-листом (продуктами).
 * Наследует DbRepository.
 */
class ProductRepository extends DbRepository {
  constructor() {
    super(CONFIG.SHEET_PRODUCTS, PRODUCT_COLS, 1);
  }

  /**
   * Получение всех продуктов.
   */
  getAll() {
    return this.findAll();
  }

  /**
   * Получение продуктов по типу.
   */
  getByType(type) {
    return this.findAll().filter(p => p.type === type);
  }

  /**
   * Маппинг строки Sheets в JSON-модель.
   */
  mapRowToModel(row) {
    return {
      name: row[PRODUCT_COLS.NAME] || '',
      type: row[PRODUCT_COLS.TYPE] || '',
      category: row[PRODUCT_COLS.CATEGORY] || '',
      quantity: row[PRODUCT_COLS.QUANTITY] || 0,
      price: row[PRODUCT_COLS.PRICE] || 0,
      pk: row[PRODUCT_COLS.PK] || ''
    };
  }

  /**
   * Маппинг JSON-модели в строку Sheets.
   */
  mapModelToRow(model) {
    const row = new Array(6).fill('');
    row[PRODUCT_COLS.NAME] = model.name || '';
    row[PRODUCT_COLS.TYPE] = model.type || '';
    row[PRODUCT_COLS.CATEGORY] = model.category || '';
    row[PRODUCT_COLS.QUANTITY] = model.quantity || 0;
    row[PRODUCT_COLS.PRICE] = model.price || 0;
    row[PRODUCT_COLS.PK] = model.pk || generateUUID();
    return row;
  }
}
