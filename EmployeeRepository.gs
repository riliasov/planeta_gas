/**
 * Репозиторий для работы с данными сотрудников.
 * Наследует DbRepository.
 */
class EmployeeRepository extends DbRepository {
  constructor() {
    super(CONFIG.SHEET_EMPLOYEES, EMPLOYEE_COLS, 1);
  }

  /**
   * Получение всех сотрудников.
   */
  getAll() {
    return this.findAll();
  }

  /**
   * Получение сотрудников по типу (напр. 'Тренер', 'Админ').
   */
  getByType(type) {
    const all = this.findAll();
    const target = (type || '').trim().toLowerCase();
    return all.filter(e => (e.type || '').trim().toLowerCase() === target);
  }

  /**
   * Маппинг строки Sheets в JSON-модель.
   */
  mapRowToModel(row) {
    return {
      name: row[EMPLOYEE_COLS.NAME] || '',
      type: row[EMPLOYEE_COLS.TYPE] || '',
      email: row[EMPLOYEE_COLS.EMAIL] || '',
      pk: row[EMPLOYEE_COLS.PK] || ''
    };
  }

  /**
   * Маппинг JSON-модели в строку Sheets.
   */
  mapModelToRow(model) {
    const row = new Array(4).fill('');
    row[EMPLOYEE_COLS.NAME] = model.name || '';
    row[EMPLOYEE_COLS.TYPE] = model.type || '';
    row[EMPLOYEE_COLS.EMAIL] = model.email || '';
    row[EMPLOYEE_COLS.PK] = model.pk || generateUUID();
    return row;
  }
}
