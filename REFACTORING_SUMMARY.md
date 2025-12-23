# Рефакторинг: JSON-based Architecture

## Статус: ✅ Завершено

Проект полностью переведён на архитектуру с JSON-моделями и строгими контрактами данных.

---

## Что изменилось

### 1. Data Contracts (constants.gs)
- ✅ Полные маппинги для 7 листов
- ✅ UUID-генератор (RFC4122 v4)
- ✅ Конфигурация заголовков (строка 1 для всех, кроме Продаж)
- ✅ Бизнес-константы (статусы, типы помещений)

### 2. Repositories (7 классов)
**Высокий приоритет:**
- ✅ `ScheduleRepository` - 14 колонок (A:N)
- ✅ `ClientRepository` - 10 колонок (A:J)
- ✅ `SalesRepository` - 23 колонки (A:W)
- ✅ `TaskRepository` - 8 колонок (A:H)

**Средний приоритет:**
- ✅ `EmployeeRepository` - 3 колонки (A:C)
- ✅ `ProductRepository` - 5 колонок (A:E)
- ✅ `LeadRepository` - 16 колонок (A:P)

### 3. Services (рефакторинг)
- ✅ `clientService.gs` - использует `ClientRepository`, `SalesRepository`, `ScheduleRepository`
- ✅ `salesService.gs` - использует `ProductRepository`, `SalesRepository`
- ✅ `bookingService.gs` - использует `ScheduleRepository`, `ClientRepository`, `EmployeeRepository`
- ✅ `sheetDriver.gs` - утилиты + deprecated-функции

---

## Ключевые улучшения

### До рефакторинга
```javascript
// Хардкод индексов колонок
const row = [];
row[0] = date;
row[4] = client;
row[5] = status;
sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
```

### После рефакторинга
```javascript
// JSON-модель
const booking = {
  date: new Date(),
  client: 'Петров П.П.',
  status: STATUS.BOOKED,
  pk: generateUUID()
};

const repo = new ScheduleRepository();
const rowData = repo.mapModelToRow(booking);
repo.insertAfter(lastRowIndex, rowData);
```

---

## Преимущества новой архитектуры

### 1. Безопасность типов
- Все поля имеют явные имена (не `row[4]`, а `model.client`)
- Автодополнение в IDE
- Легче находить ошибки

### 2. Гибкость схемы
- Изменение порядка колонок не ломает код
- Добавление новых полей требует изменений только в Repository
- Единая точка истины (constants.gs)

### 3. Тестируемость
- Repositories можно мокировать
- Бизнес-логика отделена от работы с листами
- Легче писать unit-тесты

### 4. Читаемость
- Код стал самодокументируемым
- Меньше магических чисел
- Понятные имена переменных

---

## Миграция данных

### Обратная совместимость
**НЕ ТРЕБУЕТСЯ** - работаем с новой схемой сразу.

### Что нужно проверить в таблицах

1. **Расписание:**
   - Заголовки на строке 1 ✅
   - Колонка N содержит PK (UUID) ⚠️ Нужно заполнить
   - Колонки K, L (Остаток занятий, Всего посещено) ⚠️ Могут быть пустыми

2. **Клиенты:**
   - Заголовки на строке 1 ✅
   - Колонка J содержит PK (UUID) ⚠️ Нужно заполнить

3. **Продажи:**
   - Заголовки на строке 2 ✅
   - Данные с строки 3 ✅
   - Колонка W содержит PK (UUID) ⚠️ Нужно заполнить

### Скрипт для заполнения UUID (опционально)

```javascript
function fillMissingUUIDs() {
  const repos = [
    new ScheduleRepository(),
    new ClientRepository(),
    new SalesRepository()
  ];
  
  repos.forEach(repo => {
    const sheet = repo.getSheet();
    const lastRow = sheet.getLastRow();
    const pkCol = repo.constructor.name === 'SalesRepository' ? 23 : 
                  repo.constructor.name === 'ClientRepository' ? 10 : 14;
    
    for (let i = 2; i <= lastRow; i++) {
      const pkCell = sheet.getRange(i, pkCol);
      if (!pkCell.getValue()) {
        pkCell.setValue(generateUUID());
      }
    }
  });
}
```

---

## Следующие шаги

### Немедленно
1. ⏳ Проверить таблицы на соответствие схеме
2. ⏳ Заполнить отсутствующие UUID (опционально)
3. ⏳ Протестировать создание записи через UI

### Ближайшее будущее
1. Обновить `sidebar.html` для работы с новыми JSON-моделями
2. Добавить валидацию схемы при старте приложения
3. Создать unit-тесты для Repositories

### Долгосрочно
1. Добавить TypeScript для статической типизации
2. Создать API-слой для внешних интеграций
3. Добавить версионирование схемы данных

---

## Документация

- **DATA_CONTRACTS.md** - полное описание всех схем данных
- **README.md** - общая информация о проекте (требует обновления)
- **CONTEXT.md** - контекст проекта

---

## Контрольный список

- [x] constants.gs - Data Contracts
- [x] BaseRepository.gs
- [x] ScheduleRepository.gs
- [x] ClientRepository.gs
- [x] SalesRepository.gs
- [x] TaskRepository.gs
- [x] EmployeeRepository.gs
- [x] ProductRepository.gs
- [x] LeadRepository.gs
- [x] clientService.gs - рефакторинг
- [x] salesService.gs - рефакторинг
- [x] bookingService.gs - рефакторинг
- [x] sheetDriver.gs - cleanup
- [ ] sidebar.html - обновление UI
- [ ] Тестирование в реальной таблице
- [ ] Заполнение UUID в существующих данных

---

**Дата завершения:** 2025-12-24  
**Автор:** Antigravity AI
