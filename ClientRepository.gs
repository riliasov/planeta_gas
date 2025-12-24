/**
 * Репозиторий для работы с данными клиентов.
 * Наследует DbRepository.
 */
class ClientRepository extends DbRepository {
  constructor() {
    super(CONFIG.SHEET_CLIENTS, CLIENT_COLS, 1);
  }

  /**
   * Получение всех клиентов (синоним findAll для обратной совместимости или удобства).
   */
  getAll() {
    return this.findAll();
  }

  /**
   * Поиск клиентов по тексту (Имя, Телефон, Ребенок).
   * @param {string} query 
   */
  search(query) {
    if (!query || query.length < 2) return [];
    
    const all = this.findAll();
    const qLower = query.toLowerCase();
    
    return all.filter(c => {
      const nameMatch = c.name && String(c.name).toLowerCase().includes(qLower);
      const phoneMatch = c.phone && String(c.phone).toLowerCase().includes(qLower);
      const childMatch = c.childName && String(c.childName).toLowerCase().includes(qLower);
      return nameMatch || phoneMatch || childMatch;
    });
  }

  /**
   * Маппинг строки Sheets в JSON-модель.
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
   * Маппинг JSON-модели в строку Sheets.
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
}
