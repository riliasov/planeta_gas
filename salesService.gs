/**
 * Sales Service - логика продаж.
 * Чистая бизнес-логика.
 */
const SalesService = {
  /**
   * Получить список продуктов.
   */
  getProducts() {
    const repo = new ProductRepository();
    return repo.getAll();
  },

  /**
   * Создать продажу.
   * @param {Object} payload - {date, client, product, discount, paymentMethod, comment, trainer}
   */
  createSale(payload) {
    const base = Number(payload.product.price) || 0;
    const disc = Number(payload.discount) || 0;
    const final = Math.round((base * (1 - disc / 100)) * 100) / 100;
    
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
    };
    
    const repo = new SalesRepository();
    const pk = repo.create(saleModel);
    
    return { status: 'success', pk: pk };
  }
};
