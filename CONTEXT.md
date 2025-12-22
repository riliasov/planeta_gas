# Текущий контекст: Planeta GAS
**Дата: 23.12.2025**

## Цель проекта
Рефакторинг и расширение Google Apps Script системы бронирования бассейна.

## Сделано (Summary)
1.  **Архитектура**: Код разделен на независимые сервисы.
2.  **Сетка**: 12 колонок (`Date`, `Start`, `End`, `Employee`, `Client`, `Status`, `Type`, `Category`, `Replace`, `Comment`, `PK`, `WA`). 
3.  **Sidebar (Unified)**: Единый sidebar.html с тремя разделами:
    *   **Задачи** — развернут по умолчанию
    *   **Продажи** — свернут, полная логика добавления продаж
    *   **Расписание** — свернут, добавление записей в Schedule
4.  **Справочники**: Динамическая подгрузка тренеров (AN:AP) и поиск клиентов (Q:AB) через Typeahead.
5.  **Проверки**: Оверлап тренера, оверлап клиента, валидация времени.

## Структура файлов
- `constants.gs`: `COLS` и `CONFIG`.
- `sheetDriver.gs`: `getAllTrainers()`, `getAllClients()`, `findRowsByDate()`.
- `bookingService.gs`: `addTraining()`, `checkTrainerConflict()`, `checkClientConflict()`.
- `logService.gs`: Логи (`CreatedRecordsLog`, `ScriptLog`).
- `ui.gs`: Меню, бэкенд для Sidebar (Задачи, Продажи, Расписание).
- `sidebar.html`: Единый интерфейс с аккордеоном.

## Отключенные модули (вынесены в отдельный проект)
- `gridservice/gridService.gs` — генерация сетки слотов
- `gridservice/integrationService.gs` — WhatsApp интеграция

## Базовые данные (Индексы `COLS`)
*   `DATE: 0`, `START: 1`, `END: 2`, `EMPLOYEE: 3`, `CLIENT: 4`, `STATUS: 5`, `CATEGORY: 7`, `PK: 10`.

## Что дальше
1. Реализовать логику отмены брони и статусов (`CANCELED`, `MISSED` и т.д.).
2. Добавить поддержку разной длительности (60/90 мин) — сейчас жестко 30 мин.
3. Доработать раздел Задачи (чтение из реального листа).
