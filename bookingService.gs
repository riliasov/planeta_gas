/**
 * Основная точка входа из Sidebar.
 * @param {Object} formData {date: string(yyyy-mm-dd), time: string(HH:mm), room: string, trainer: string, client: string, duration: number}
 */
function addTraining(formData) {
  const logCtx = logScriptStart('addTraining', 'User booking request');
  const lock = LockService.getScriptLock();
  
  try {
    validateInput(formData);
    
    if (!lock.tryLock(5000)) {
      throw new Error('Система занята. Попробуйте через несколько секунд.');
    }
    
    const dateObj = new Date(formData.date);
    const timeStr = formData.time; // Start Time
    const roomType = formData.room; 
    
    // Parse times
    const [hh, mm] = timeStr.split(':').map(Number);
    const startM = hh * 60 + mm;
    const endM = startM + CONFIG.STEP_MIN; // 30 min duration fixed for now
    
    // 1. Ensure Grid Exists & Get Rows
    let rowsOnDate = findRowsByDate(dateObj);
    if (rowsOnDate.length === 0) {
      generateSlotsForDate(dateObj);
      SpreadsheetApp.flush();
      rowsOnDate = findRowsByDate(dateObj);
    }
    
    // 2. Check Availability (Overlap Check)
    const clientsList = getAllClients().map(c => c.name.toLowerCase());
    const trainersList = getAllTrainers().map(t => t.name.toLowerCase());

    if (!trainersList.includes(formData.trainer.toLowerCase())) {
        throw new Error(`Тренер "${formData.trainer}" не найден в справочнике.`);
    }
    if (!clientsList.includes(formData.client.toLowerCase())) {
         throw new Error(`Клиент "${formData.client}" не найден в справочнике.`);
    }

    checkTrainerConflict(rowsOnDate, formData.trainer, startM, endM);
    checkClientConflict(rowsOnDate, formData.client, startM, endM);

    // 3. Filter for specific slot (Room + Time) to check capacity
    const slotRows = filterRowsForSlot(rowsOnDate, timeStr, roomType);
    
    // 4. Проверка лимитов (Max 4 people)
    const targetInfo = checkSlotAvailability(slotRows); 
    
    // 5. Генерация PK
    const seqNumber = targetInfo.action === 'insert' ? targetInfo.count + 1 : targetInfo.count; 
    const pk = generatePK(dateObj, timeStr, roomType, seqNumber);
    
    // 6. WhatsApp текст (IntegrationService отключен)
    const whatsappText = '';
    
    // 7. Prepare Data
    const endHh = Math.floor(endM / 60);
    const endMm = endM % 60;
    const endTimeStr = `${String(endHh).padStart(2, '0')}:${String(endMm).padStart(2, '0')}`;

    const rowData = new Array(12).fill('');
    rowData[COLS.DATE] = Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy');
    rowData[COLS.START] = timeStr;
    rowData[COLS.END] = endTimeStr;
    rowData[COLS.EMPLOYEE] = formData.trainer;
    rowData[COLS.CLIENT] = formData.client;
    rowData[COLS.STATUS] = STATUS.BOOKED; 
    rowData[COLS.TYPE] = CONFIG.TRAINING_TYPES.POOL; 
    rowData[COLS.CATEGORY] = roomType; 
    rowData[COLS.REPLACE] = ''; 
    rowData[COLS.COMMENT] = ''; 
    rowData[COLS.PK] = pk;
    rowData[COLS.WHATSAPP] = whatsappText;

    let resultRowIndex;
    
    // 8. Write
    if (targetInfo.action === 'update') {
      updateRow(targetInfo.rowIndex, rowData);
      resultRowIndex = targetInfo.rowIndex;
    } else {
      resultRowIndex = insertRowAfter(targetInfo.rowIndex, rowData);
    }
    
    // 9. Log
    logCreatedRecord({
      pk: pk,
      date: formData.date,
      time: timeStr,
      room_type: roomType,
      rowIndex: resultRowIndex,
      action: 'create', 
      message: 'Success'
    });
    
    logScriptEnd(logCtx, 'success');
    return { status: 'success', pk: pk, row: resultRowIndex };
    
  } catch (e) {
    logCreatedRecord({
      date: formData ? formData.date : 'N/A',
      action: 'create_error',
      message: e.message
    });
    logScriptEnd(logCtx, 'error', e.message);
    throw e; 
    
  } finally {
    lock.releaseLock();
  }
}

/**
 * Валидация входных данных.
 */
function validateInput(fd) {
  if (!fd.date || !fd.time || !fd.client || !fd.trainer || !fd.room) {
    throw new Error('Все поля обязательны для заполнения.');
  }
  
  const [hh, mm] = fd.time.split(':').map(Number);
  if (hh < CONFIG.WORK_START_HOUR || hh >= CONFIG.WORK_END_HOUR) {
     throw new Error(`Время должно быть между ${CONFIG.WORK_START_HOUR}:00 и ${CONFIG.WORK_END_HOUR}:00`);
  }
  
  const d = new Date(fd.date);
  if (isNaN(d.getTime())) throw new Error('Некорректная дата');
  
  // Check if date is in the past (allow today if time is future)
  const now = new Date();
  const formDate = new Date(d);
  const [h, m] = fd.time.split(':').map(Number);
  formDate.setHours(h, m, 0, 0);

  if (formDate < now) {
    throw new Error('Нельзя записывать на прошедшее время.');
  }
}

/**
 * Filters rows for a specific slot (Time + Room).
 */
function filterRowsForSlot(rowsOnDate, timeStr, roomType) {
  return rowsOnDate.filter(r => {
    let rowTime = r.values[COLS.START];
    if (rowTime instanceof Date) {
      const h = rowTime.getHours();
      const m = rowTime.getMinutes();
      rowTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    } else {
        rowTime = String(rowTime).substring(0, 5); 
    }
    return rowTime === timeStr && r.values[COLS.CATEGORY] === roomType;
  });
}

/**
 * Checks if the trainer has overlapping bookings.
 * Overlap Logic: (StartA < EndB) and (EndA > StartB)
 */
function checkTrainerConflict(rowsOnDate, trainer, newStartM, newEndM) {
  const conflict = rowsOnDate.find(r => {
    // Only check active bookings for this trainer
    const rowTrainer = r.values[COLS.EMPLOYEE];
    const rowStatus = r.values[COLS.STATUS];
    
    if (rowTrainer !== trainer) return false;
    if (rowStatus === STATUS.EMPTY || rowStatus === STATUS.CANCELED) return false;
    
    // Parse Row Start/End
    const sVal = r.values[COLS.START];
    const eVal = r.values[COLS.END];
    
    let rowStartM, rowEndM;
    
    if (sVal instanceof Date) {
      rowStartM = sVal.getHours() * 60 + sVal.getMinutes();
    } else {
      const [h, m] = String(sVal).split(':').map(Number);
      rowStartM = h * 60 + m;
    }
    
    if (eVal instanceof Date) {
      rowEndM = eVal.getHours() * 60 + eVal.getMinutes();
    } else if (eVal && String(eVal).includes(':')) {
       const [h, m] = String(eVal).split(':').map(Number);
       rowEndM = h * 60 + m;
    } else {
       // Fallback if End is empty? Should not happen in new logic, but maybe in old data.
       // Assume 30 min duration
       rowEndM = rowStartM + 30; 
    }
    
    // Check overlap
    return (newStartM < rowEndM) && (newEndM > rowStartM);
  });
  
  if (conflict) {
    throw new Error(`Тренер ${trainer} занят в это время (строка ${conflict.rowIndex}).`);
  }
}

/**
 * Checks if the client has overlapping bookings (Double Booking).
 */
function checkClientConflict(rowsOnDate, client, newStartM, newEndM) {
  const conflict = rowsOnDate.find(r => {
    const rowClient = r.values[COLS.CLIENT];
    const rowStatus = r.values[COLS.STATUS];
    
    if (rowClient !== client) return false;
    // Visited/Confirmed bookings also count as "Occupied" for client time
    // But maybe they want to allow simple double booking?
    // "No rules specified for client double booking" -> usually implies they can't be in 2 places.
    // Spec: "Limit of 4 bookings per slot" is for Room Capacity.
    // "Trainer availability check" was requested.
    // "Reestr clientov" was requested.
    // Let's implement strict check to prevent errors.
    
    if (![STATUS.BOOKED, STATUS.CONFIRMED, STATUS.VISITED].includes(rowStatus)) return false;

    // Parse Row Start/End
    const sVal = r.values[COLS.START];
    const eVal = r.values[COLS.END];
    
    let rowStartM, rowEndM;
    
    if (sVal instanceof Date) {
      rowStartM = sVal.getHours() * 60 + sVal.getMinutes();
    } else {
      const [h, m] = String(sVal).split(':').map(Number);
      rowStartM = h * 60 + m;
    }
    
    if (eVal instanceof Date) {
      rowEndM = eVal.getHours() * 60 + eVal.getMinutes();
    } else if (eVal && String(eVal).includes(':')) {
       const [h, m] = String(eVal).split(':').map(Number);
       rowEndM = h * 60 + m;
    } else {
       rowEndM = rowStartM + 30; 
    }
    
    // Check overlap
    return (newStartM < rowEndM) && (newEndM > rowStartM);
  });
  
  if (conflict) {
    throw new Error(`Клиент ${client} уже записан на это время (строка ${conflict.rowIndex}).`);
  }
}

/**
 * Проверяет доступность слота (Limit 4).
 */
function checkSlotAvailability(slotRows) {
  const count = slotRows.length;
  if (count === 0) {
     throw new Error('Слот не инициализирован. Запустите генерацию сетки.');
  }
  
  if (count >= CONFIG.LIMIT_PER_SLOT) {
    const emptyRow = slotRows.find(r => r.values[COLS.STATUS] === STATUS.EMPTY || r.values[COLS.STATUS] === STATUS.CANCELED);
    if (emptyRow) {
      return { action: 'update', rowIndex: emptyRow.rowIndex, count: count };
    }
    throw new Error('В этом слоте уже 4 записи (лимит исчерпан).');
  }
  
  const emptyRow = slotRows.find(r => r.values[COLS.STATUS] === STATUS.EMPTY);
  if (emptyRow) {
    return { action: 'update', rowIndex: emptyRow.rowIndex, count: count };
  } else {
    // Insert new row logic
    const lastRowInSlot = slotRows[slotRows.length - 1];
    return { action: 'insert', rowIndex: lastRowInSlot.rowIndex, count: count };
  }
}

/**
 * Генерирует PK.
 */
function generatePK(dateObj, timeStr, roomType, seqNum) {
  const timeClean = timeStr.replace(':', '');
  const dateClean = Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'ddMMyy');
  const roomClean = roomType.replace(/\s+/g, ''); 
  return `${timeClean}_${dateClean}_${roomClean}_${seqNum}`;
}