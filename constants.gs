/**
 * Конфигурация проекта и Data Contracts.
 * Все индексы колонок (0-based) для работы с массивами данных (getValues).
 */

/**
 * Настройки листов и бизнес-логики
 */
const CONFIG = {
  // Sheet Names
  SHEET_SCHEDULE: 'Расписание',
  SHEET_CLIENTS: 'Клиенты',
  SHEET_SALES: 'Продажи',
  SHEET_EMPLOYEES: 'employees',
  SHEET_PRODUCTS: 'pricelist',
  SHEET_TASKS: 'Задачи',
  SHEET_LEADS: 'leads',
  SHEET_DIRECTORY: 'Справочник',
  
  // Log Sheets
  LOG_SHEET_RECORDS: 'CreatedRecordsLog',
  LOG_SHEET_SCRIPT: 'ScriptLog',
  
  // Header Rows Configuration
  HEADER_ROWS: {
    DEFAULT: 1,        // Most sheets: headers row 1, data from row 2
    SALES: 2          // Sales sheet: headers row 2, data from row 3
  },
  
  // Business Logic
  WORK_START_HOUR: 10,
  WORK_END_HOUR: 22,
  STEP_MIN: 30,
  LIMIT_PER_SLOT: 4,
  TIME_ZONE: Session.getScriptTimeZone(),
  ROOM_TYPES: ['Бассейн', 'Ванны']
};

/**
 * UUID Generator (RFC4122 v4)
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * РАСПИСАНИЕ (Расписание)
 * Headers: Row 1, Data: Row 2+
 * Columns A:N
 */
const SCHEDULE_COLS = {
  DATE: 0,              // A: Дата
  START: 1,             // B: Начало
  END: 2,               // C: Конец
  EMPLOYEE: 3,          // D: Сотрудник
  CLIENT: 4,            // E: Клиент
  STATUS: 5,            // F: Статус
  TYPE: 6,              // G: Тип
  CATEGORY: 7,          // H: Категория
  REPLACE: 8,           // I: Замена?
  COMMENT: 9,           // J: Комментарий
  REMAINING_LESSONS: 10, // K: Остаток занятий
  TOTAL_VISITED: 11,    // L: Всего посещено
  WHATSAPP_REMINDER: 12, // M: Напоминание в WhatsApp
  PK: 13                // N: PK
};

/**
 * КЛИЕНТЫ (clients)
 * Headers: Row 1, Data: Row 2+
 * Columns A:J
 */
const CLIENT_COLS = {
  NAME: 0,              // A: Клиент
  PHONE: 1,             // B: Мобильный
  CHILD_NAME: 2,        // C: Имя ребенка
  CHILD_DOB: 3,         // D: Дата рождения ребенка
  AGE: 4,               // E: Возраст (сокр)
  SPENT: 5,             // F: Списано
  BALANCE: 6,           // G: Остаток
  DEBT: 7,              // H: Долг
  STATUS: 8,            // I: Статус
  PK: 9                 // J: PK
};

/**
 * ПРОДАЖИ (Продажи)
 * Headers: Row 2, Data: Row 3+
 * Columns A:W
 */
const SALES_COLS = {
  DATE: 0,              // A: Дата
  CLIENT: 1,            // B: Клиент
  PRODUCT: 2,           // C: Продукт
  TYPE: 3,              // D: Тип
  CATEGORY: 4,          // E: Категория
  QUANTITY: 5,          // F: Количество
  FULL_PRICE: 6,        // G: Полная стоимость
  DISCOUNT: 7,          // H: Скидка
  FINAL_PRICE: 8,       // I: Окончательная стоимость
  CASH: 9,              // J: Наличные
  TRANSFER: 10,         // K: Перевод
  TERMINAL: 11,         // L: Терминал
  DEBT: 12,             // M: Вдолг
  ADMIN: 13,            // N: Админ
  TRAINER: 14,          // O: Тренер
  COMMENT: 15,          // P: Комментарий
  ADMIN_BONUS: 16,      // Q: Бонус админа
  TRAINER_BONUS: 17,    // R: Бонус тренера
  EVOTOR: 18,           // S: Пробили на эвоторе
  CRM: 19,              // T: Внесли в CRM
  LAST_CHANGE: 20,      // U: last_change
  CHANGED_BY: 21,       // V: changed_by
  PK: 22                // W: PK
};

/**
 * СОТРУДНИКИ (employees)
 * Headers: Row 1, Data: Row 2+
 * Columns A:C
 */
const EMPLOYEE_COLS = {
  NAME: 0,              // A: Имя сотрудника
  TYPE: 1,              // B: Тип
  EMAIL: 2              // C: Email
};

/**
 * ПРОДУКТЫ (pricelist)
 * Headers: Row 1, Data: Row 2+
 * Columns A:E
 */
const PRODUCT_COLS = {
  NAME: 0,              // A: Продукт
  TYPE: 1,              // B: Тип
  CATEGORY: 2,          // C: Категория
  QUANTITY: 3,          // D: Количество занятий
  PRICE: 4              // E: Актуальная цена
};

/**
 * ЗАДАЧИ (Задачи)
 * Headers: Row 1, Data: Row 2+
 * Columns A:H
 */
const TASK_COLS = {
  ID: 0,                // A: ID
  MANUAL_TASK: 1,       // B: Manual task
  DATE: 2,              // C: Дата
  SHEET: 3,             // D: Лист
  TYPE: 4,              // E: Тип
  ADMIN: 5,             // F: Админ
  DESCRIPTION: 6,       // G: Описание
  LINK: 7               // H: Ссылка
};

/**
 * ЛИДЫ / ОБРАЩЕНИЯ (leads)
 * Headers: Row 1, Data: Row 2+
 * Columns A:P
 */
const LEAD_COLS = {
  CLIENT: 0,            // A: Клиент
  DATE: 1,              // B: Дата обращения
  PHONE: 2,             // C: Мобильный
  REQUEST: 3,           // D: Запрос при обращении
  ADMIN_CREATED: 4,     // E: Админ (создал лида)
  ADULT_LASTNAME: 5,    // F: Фамилия взрослого
  ADULT_FIRSTNAME: 6,   // G: Имя взрослого
  CHILD_NAME: 7,        // H: Имя ребенка
  CHILD_DOB: 8,         // I: Дата рождения ребенка
  CHILD_GENDER: 9,      // J: Пол ребёнка
  TYPE: 10,             // K: Тип
  ADMIN_CLIENT: 11,     // L: Админ (создал клиента)
  SCHEDULED_DATE: 12,   // M: Дата запланированного занятия
  SOURCE: 13,           // N: Источник
  COMMENT: 14,          // O: Комментарий при записи
  ADMIN_BOOKED: 15      // P: Админ (записал на занятие)
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

/**
 * Типы помещений
 */
const TRAINING_TYPES = {
  POOL: 'Бассейн',
  BATH: 'Ванны'
};