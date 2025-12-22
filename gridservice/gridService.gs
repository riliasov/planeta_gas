/**
 * Триггерная функция: Проверяет и создает слоты на 7 дней вперед.
 */
function ensureWeekAhead() {
  const logCtx = logScriptStart('ensureWeekAhead', 'Daily grid check');
  try {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const existingRows = findRowsByDate(targetDate);
      
      if (existingRows.length === 0) {
        generateSlotsForDate(targetDate);
      }
    }
    logScriptEnd(logCtx, 'success', 'Week check complete');
  } catch (e) {
    logScriptEnd(logCtx, 'error', e.message);
    throw e;
  }
}

/**
 * Генерирует сетку слотов для конкретной даты.
 */
function generateSlotsForDate(dateObj) {
  const dateStr = Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
  const grid = [];
  
  const startH = CONFIG.WORK_START_HOUR;
  const endH = CONFIG.WORK_END_HOUR; 
  
  const startMin = startH * 60;
  const endMin = endH * 60; 
  
  for (let m = startMin; m < endMin; m += CONFIG.STEP_MIN) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    
    // Calculate End Time (Start + STEP_MIN)
    const endM = m + CONFIG.STEP_MIN;
    const endHh = Math.floor(endM / 60);
    const endMm = endM % 60;
    
    const startTimeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    const endTimeStr = `${String(endHh).padStart(2, '0')}:${String(endMm).padStart(2, '0')}`;
    
    // Создаем по одной пустой строке для каждого типа зала
    CONFIG.ROOM_TYPES.forEach(roomType => {
      // New Schema:
      // [Date, Start, End, Employee, Client, Status, Type, Category, Replace, Comment, PK, WA]
      const row = new Array(12).fill('');
      
      row[COLS.DATE] = dateStr;
      row[COLS.START] = startTimeStr;
      row[COLS.END] = endTimeStr;
      row[COLS.TYPE] = CONFIG.TRAINING_TYPES.POOL; // Default to POOL for rooms, change if specific logic needed
      row[COLS.CATEGORY] = roomType; // Using Category to store "Зал А" etc. OR use separate column logic? 
                                     // Discussed: RoomType maps to Category or Type?
                                     // Let's assume Room Type = Category for now, as Type is "Бассейн".
      
      row[COLS.STATUS] = STATUS.EMPTY;
      
      grid.push(row);
    });
  }
  
  batchAppendData(grid);
}