# Data Contracts (Спецификации данных)

## Состояние: ✅ Актуально

Проект полностью переведён на **JSON-based архитектуру**. Схемы ниже являются эталонными.

### Ключевые принципы

1. **Никаких зависимостей от позиций колонок в бизнес-логике**
2. **Все данные передаются как JSON-объекты**
3. **UUID для всех Primary Keys**
4. **Bidirectional mapping**: `row ↔ model`

---

## Структура Data Contracts

### 1. РАСПИСАНИЕ (Расписание)
- **Лист:** `Расписание`
- **Заголовки:** Строка 1
- **Данные:** Строка 2+
- **Колонки:** A:N (14 колонок)

```javascript
SCHEDULE_COLS = {
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
  PK: 13                // N: PK (UUID)
}
```

**JSON Model:**
```javascript
{
  date: Date,
  start: String,
  end: String,
  employee: String,
  client: String,
  status: String,
  type: String,
  category: String,
  replace: String,
  comment: String,
  remainingLessons: Number,
  totalVisited: Number,
  whatsappReminder: String,
  pk: String (UUID)
}
```

---

### 2. КЛИЕНТЫ (Клиенты)
- **Лист:** `Клиенты`
- **Заголовки:** Строка 1
- **Данные:** Строка 2+
- **Колонки:** A:J (10 колонок)

```javascript
CLIENT_COLS = {
  NAME: 0,              // A: Клиент
  PHONE: 1,             // B: Мобильный
  CHILD_NAME: 2,        // C: Имя ребенка
  CHILD_DOB: 3,         // D: Дата рождения ребенка
  AGE: 4,               // E: Возраст (сокр)
  SPENT: 5,             // F: Списано
  BALANCE: 6,           // G: Остаток
  DEBT: 7,              // H: Долг
  STATUS: 8,            // I: Статус
  PK: 9                 // J: PK (UUID)
}
```

**JSON Model:**
```javascript
{
  name: String,
  phone: String,
  childName: String,
  childDob: String,
  age: String,
  spent: Number,
  balance: Number,
  debt: Number,
  status: String,
  pk: String (UUID)
}
```

---

### 3. ПРОДАЖИ (Продажи)
- **Лист:** `Продажи`
- **Заголовки:** Строка 2 ⚠️
- **Данные:** Строка 3+ ⚠️
- **Колонки:** A:W (23 колонки)

```javascript
SALES_COLS = {
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
  PK: 22                // W: PK (UUID)
}
```

---

### 4. ЗАДАЧИ (Задачи)
- **Лист:** `Задачи`
- **Заголовки:** Строка 1
- **Данные:** Строка 2+
- **Колонки:** A:H (8 колонок)

```javascript
TASK_COLS = {
  ID: 0,                // A: ID (UUID)
  MANUAL_TASK: 1,       // B: Manual task
  DATE: 2,              // C: Дата
  SHEET: 3,             // D: Лист
  TYPE: 4,              // E: Тип
  ADMIN: 5,             // F: Админ
  DESCRIPTION: 6,       // G: Описание
  LINK: 7               // H: Ссылка
}
```

---

### 5. СОТРУДНИКИ (employees)
- **Лист:** `employees`
- **Заголовки:** Строка 1
- **Данные:** Строка 2+
- **Колонки:** A:C (3 колонки)

```javascript
EMPLOYEE_COLS = {
  NAME: 0,              // A: Имя сотрудника
  TYPE: 1,              // B: Тип
  EMAIL: 2              // C: Email
}
```

---

### 6. ПРОДУКТЫ (pricelist)
- **Лист:** `pricelist`
- **Заголовки:** Строка 1
- **Данные:** Строка 2+
- **Колонки:** A:E (5 колонок)

```javascript
PRODUCT_COLS = {
  NAME: 0,              // A: Продукт
  TYPE: 1,              // B: Тип
  CATEGORY: 2,          // C: Категория
  QUANTITY: 3,          // D: Количество занятий
  PRICE: 4              // E: Актуальная цена
}
```

---

### 7. ЛИДЫ (leads)
- **Лист:** `leads`
- **Заголовки:** Строка 1
- **Данные:** Строка 2+
- **Колонки:** A:P (16 колонок)

```javascript
LEAD_COLS = {
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
}
```

---

## Использование в коде

### Пример: Создание записи в расписании

**Старый подход (DEPRECATED):**
```javascript
const row = [];
row[0] = date;
row[1] = start;
row[2] = end;
// ... и так далее
sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
```

**Новый подход:**
```javascript
const scheduleRepo = new ScheduleRepository();

const booking = {
  date: new Date(),
  start: '10:00',
  end: '10:30',
  employee: 'Иванов И.И.',
  client: 'Петров П.П.',
  status: STATUS.BOOKED,
  type: TRAINING_TYPES.POOL,
  category: 'Индивидуальное',
  remainingLessons: 10,
  totalVisited: 5
};

const rowData = scheduleRepo.mapModelToRow(booking);
scheduleRepo.insertAfter(lastRowIndex, rowData);
```

### Пример: Чтение данных клиента

**Старый подход (DEPRECATED):**
```javascript
const values = sheet.getRange(2, 1, lastRow, 9).getValues();
const clientName = values[0][0];
const clientPhone = values[0][1];
```

**Новый подход:**
```javascript
const clientRepo = new ClientRepository();
const clients = clientRepo.search('Петров');

clients.forEach(client => {
  console.log(client.name);    // JSON property
  console.log(client.phone);   // JSON property
  console.log(client.balance); // JSON property
});
```

---

## Миграция существующего кода

### Файлы, требующие обновления:

1. **bookingService.gs** - убрать прямые обращения к `COLS.*`
2. **clientService.gs** - использовать `ClientRepository.search()`
3. **salesService.gs** - использовать `SalesRepository.create(model)`
4. **sheetDriver.gs** - оставить только утилиты (findSheetByName)
5. **sidebar.html** - работать только с JSON

### Пример рефакторинга `clientService.gs`:

**Было:**
```javascript
function searchClients(query) {
  const sheet = getClientsSheet();
  const values = sheet.getRange(2, 1, sheet.getLastRow(), 9).getValues();
  // ... manual filtering by index
}
```

**Стало:**
```javascript
function searchClients(query) {
  const repo = new ClientRepository();
  return repo.search(query); // Returns JSON array
}
```

---

## История изменений
Архитектура репозитория и типизация моделей успешно внедрена во все основные сервисы проекта.
