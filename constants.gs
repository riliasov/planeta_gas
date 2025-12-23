/**
 * Конфигурация проекта и индексы колонок.
 * Индексы колонок (0-based) для работы с массив данных (getValues).
 * 
 * New Schema:
 * A: Date
 * B: Start
 * C: End
 * D: Employee
 * E: Client
 * F: Status
 * G: Type
 * H: Category
 * I: Replace?
 * J: Comment
 * K: PK (Hidden)
 * L: WA Text
 */
const COLS = {
  DATE: 0,          // A: Date
  START: 1,         // B: Start Time (HH:mm)
  END: 2,           // C: End Time (HH:mm)
  EMPLOYEE: 3,      // D: Employee (Trainer)
  CLIENT: 4,        // E: Client
  STATUS: 5,        // F: Status
  TYPE: 6,          // G: Type (Pool/Bath)
  CATEGORY: 7,      // H: Category (Indiv/Group...)
  REPLACE: 8,       // I: Replace?
  COMMENT: 9,       // J: Comment
  PK: 10,           // K: PK (Hidden)
  WHATSAPP: 11      // L: WhatsApp Text (Hidden or optional)
};

/**
 * Настройки бизнес-логики
 */
const CONFIG = {
  SHEET_NAME: 'Schedule',
  DIRECTORY_SHEET: 'Справочник',
  CLIENTS_SHEET: 'clients',
  SHEET_SALES: 'Продажи',
  LOG_SHEET_RECORDS: 'CreatedRecordsLog',
  LOG_SHEET_SCRIPT: 'ScriptLog',
  WORK_START_HOUR: 6,   // New spec: 06:00
  WORK_END_HOUR: 22,    // New spec: 22:00
  STEP_MIN: 30,         // Keeping 30min grid for now (as discussed)
  LIMIT_PER_SLOT: 4,
  HEADER_ROWS: 2,
  TIME_ZONE: Session.getScriptTimeZone(),
  ROOM_TYPES: ['Бассейн', 'Ванны'], 
  TRAINING_TYPES: {     // New enum for Type column
    POOL: 'Бассейн',
    BATH: 'Ванны'
  }
};

/**
 * Статусы записи
 */
const STATUS = {
  EMPTY: 'empty',
  BOOKED: 'booked',
  CANCELED: 'canceled',
  CONFIRMED: 'Подтвердили',
  VISITED: 'Посетили',
  MISSED: 'Пропуск',
  MISSED_VALID: 'Пропуск без списания'
};