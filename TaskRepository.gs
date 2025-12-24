/**
 * Репозиторий для задач.
 * Наследует DbRepository.
 */
class TaskRepository extends DbRepository {
  constructor() {
    super(CONFIG.SHEET_TASKS, TASK_COLS, 1);
  }

  /**
   * Маппинг строки Sheets в JSON-модель.
   */
  mapRowToModel(row) {
    return {
      id: row[TASK_COLS.ID],
      manualTask: row[TASK_COLS.MANUAL_TASK],
      date: row[TASK_COLS.DATE],
      sheet: row[TASK_COLS.SHEET],
      type: row[TASK_COLS.TYPE],
      admin: row[TASK_COLS.ADMIN],
      description: row[TASK_COLS.DESCRIPTION], // Это поле 'task' в UI
      link: row[TASK_COLS.LINK]
      // PK нет, используем ID или ничего (read-only)
    };
  }

  mapModelToRow(model) {
    // Read-only logic mostly
    throw new Error('TaskRepository is currently read-only via app logic.');
  }
}
