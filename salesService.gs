/**
 * Sales Service - работа с продажами через Repository.
 * Все функции работают с JSON-объектами.
 */

/**
 * Получить список продуктов из прайс-листа.
 * @returns {Array<Object>} JSON array
 */
function getProducts() {
  const logCtx = logScriptStart('getProducts', 'Fetching product list');
  try {
    const repo = new ProductRepository();
    const products = repo.getAll();
    
    logScriptEnd(logCtx, 'success', `Loaded ${products.length} products`);
    return products;
  } catch (e) {
    logScriptEnd(logCtx, 'error', e.message);
    console.error('getProducts error:', e);
    return [];
  }
}

/**
 * Создать продажу.
 * @param {Object} payload - {date, client, product, discount, paymentMethod, comment, trainer}
 * @returns {Object} {row: number}
 */
function createSale(payload) {
  const logCtx = logScriptStart('createSale', 'Creating new sale');
  try {
    const base = Number(payload.product.price) || 0;
    const disc = Number(payload.discount) || 0;
    const final = Math.round((base * (1 - disc / 100)) * 100) / 100;
    
    // Prepare domain model
    const saleModel = {
      date: payload.date || new Date(),
      client: payload.client.name || payload.client.displayName || '',
      product: payload.product.name || '',
      type: payload.product.type || '',
      category: payload.product.category || '',
      quantity: payload.product.quantity || 0,
      fullPrice: base,
      discount: disc,
      finalPrice: final,
      cash: payload.paymentMethod === 'Наличные' ? final : 0,
      transfer: payload.paymentMethod === 'Перевод' ? final : 0,
      terminal: payload.paymentMethod === 'Терминал' ? final : 0,
      debt: payload.paymentMethod === 'Вдолг' ? final : 0,
      admin: Session.getActiveUser().getEmail(),
      trainer: payload.trainer?.name || '',
      comment: payload.comment || '',
      adminBonus: 0,
      trainerBonus: 0,
      evotor: '',
      crm: '',
      lastChange: new Date(),
      changedBy: Session.getActiveUser().getEmail()
      // pk will be auto-generated in Repository
    };
    
    const repo = new SalesRepository();
    const targetRow = repo.create(saleModel);
    
    logScriptEnd(logCtx, 'success', `Sale created at row ${targetRow}`);
    return { row: targetRow };
  } catch (e) {
    logScriptEnd(logCtx, 'error', e.message);
    console.error('createSale error:', e);
    throw new Error('Ошибка при создании продажи: ' + e.message);
  }
}
