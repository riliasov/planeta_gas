/**
 * Репозиторий для работы с расписанием/бронированиями.
 * Наследует DbRepository.
 */
class ScheduleRepository extends DbRepository {
  constructor() {
    super(CONFIG.SHEET_SCHEDULE, SCHEDULE_COLS, 1);
  }

  /**
   * Получение записей на конкретную дату.
   * Возвращает массив моделей.
   * @param {Date} dateObj 
   * @returns {Array<Object>}
   */
  getByDate(dateObj) {
    const sheet = this.getSheet();
    const dateStr = Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
    
    // Используем текстовый поиск для оптимизации в больших таблицах
    const finder = sheet.getRange("A:A").createTextFinder(dateStr).matchEntireCell(true);
    const ranges = finder.findAll();
    
    if (ranges.length === 0) return [];

    const firstRow = ranges[0].getRow();
    const lastRow = ranges[ranges.length - 1].getRow();
    const numRows = lastRow - firstRow + 1;
    const data = sheet.getRange(firstRow, 1, numRows, 14).getValues();
    
    return data
      .filter(row => {
        const val = row[SCHEDULE_COLS.DATE];
        const rowDateStr = (val instanceof Date) 
          ? Utilities.formatDate(val, CONFIG.TIME_ZONE, 'dd.MM.yyyy')
          : String(val);
        return rowDateStr === dateStr;
      })
      .map(row => this.mapRowToModel(row));
  }

  /**
   * Генерация сетки слотов для даты, если их нет.
   * @param {Date} dateObj
   */
  ensureGridForDate(dateObj) {
    const existing = this.getByDate(dateObj);
    if (existing.length > 0) return;

    const slots = [];
    const dateStr = Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
    const startTime = CONFIG.WORK_START_HOUR * 60; 
    const endTime = CONFIG.WORK_END_HOUR * 60; 
    const step = CONFIG.STEP_MIN;

    for (let m = startTime; m < endTime; m += step) {
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      const timeStr = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;

      const endM = m + step;
      const endHh = Math.floor(endM / 60);
      const endMm = endM % 60;
      const endTimeStr = `${String(endHh).padStart(2,'0')}:${String(endMm).padStart(2,'0')}`;

      CONFIG.ROOM_TYPES.forEach(room => {
        const model = {
            date: dateStr,
            start: timeStr,
            end: endTimeStr,
            status: STATUS.EMPTY,
            type: TRAINING_TYPES.POOL,
            category: room,
            pk: generateUUID()
        };
        slots.push(this.mapModelToRow(model));
      });
    }

    if (slots.length > 0) {
      const sheet = this.getSheet();
      const lastRow = Math.max(sheet.getLastRow(), 1); // Ensure we don't overwrite header if empty
      sheet.getRange(lastRow + 1, 1, slots.length, slots[0].length).setValues(slots);
    }
  }

  /**
   * Вставка записи после определенного условия (специфично для расписания).
   * В новой архитектуре сервис не должен знать про rowIndex, 
   * поэтому мы можем реализовать логику "вставить в слот" внутри репозитория.
   */
  insertAfterLastInSlot(date, time, category, model) {
    // Временная реализация для плавного перехода
    // TODO: Полностью инкапсулировать логику сортировки внутри репозитория
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    sheet.appendRow(this.mapModelToRow(model));
    return model.pk;
  }

  /**
   * Маппинг строки Sheets в JSON-модель.
   */
  mapRowToModel(row) {
    return {
      date: row[SCHEDULE_COLS.DATE],
      start: row[SCHEDULE_COLS.START],
      end: row[SCHEDULE_COLS.END],
      employee: row[SCHEDULE_COLS.EMPLOYEE],
      client: row[SCHEDULE_COLS.CLIENT],
      status: row[SCHEDULE_COLS.STATUS],
      type: row[SCHEDULE_COLS.TYPE],
      category: row[SCHEDULE_COLS.CATEGORY],
      replace: row[SCHEDULE_COLS.REPLACE],
      comment: row[SCHEDULE_COLS.COMMENT],
      remainingLessons: row[SCHEDULE_COLS.REMAINING_LESSONS],
      totalVisited: row[SCHEDULE_COLS.TOTAL_VISITED],
      whatsappReminder: row[SCHEDULE_COLS.WHATSAPP_REMINDER],
      pk: row[SCHEDULE_COLS.PK]
    };
  }

  /**
   * Маппинг JSON-модели в строку Sheets.
   */
  mapModelToRow(model) {
    const row = new Array(14).fill('');
    row[SCHEDULE_COLS.DATE] = model.date || '';
    row[SCHEDULE_COLS.START] = model.start || '';
    row[SCHEDULE_COLS.END] = model.end || '';
    row[SCHEDULE_COLS.EMPLOYEE] = model.employee || '';
    row[SCHEDULE_COLS.CLIENT] = model.client || '';
    row[SCHEDULE_COLS.STATUS] = model.status || '';
    row[SCHEDULE_COLS.TYPE] = model.type || '';
    row[SCHEDULE_COLS.CATEGORY] = model.category || '';
    row[SCHEDULE_COLS.REPLACE] = model.replace || '';
    row[SCHEDULE_COLS.COMMENT] = model.comment || '';
    row[SCHEDULE_COLS.REMAINING_LESSONS] = model.remainingLessons || '';
    row[SCHEDULE_COLS.TOTAL_VISITED] = model.totalVisited || '';
    row[SCHEDULE_COLS.WHATSAPP_REMINDER] = model.whatsappReminder || '';
    row[SCHEDULE_COLS.PK] = model.pk || generateUUID();
    return row;
  }
}
