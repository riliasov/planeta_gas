/**
 * Booking Service - работа с бронированием через Repository.
 * Использует JSON-модели и Data Contracts.
 */

/**
 * Основная точка входа из Sidebar.
 * @param {Object} formData {date: string(yyyy-mm-dd), time: string(HH:mm), room: string, trainer: string, client: string}
 * @returns {Object} {status, pk, row}
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
    const timeStr = formData.time;
    const roomType = formData.room;
    
    // Parse times
    const [hh, mm] = timeStr.split(':').map(Number);
    const startM = hh * 60 + mm;
    const endM = startM + CONFIG.STEP_MIN; // 30 min duration
    
    // 1. Ensure Grid Exists & Get Rows
    const scheduleRepo = new ScheduleRepository();
    let rowsOnDate = scheduleRepo.getByDate(dateObj);
    
    if (rowsOnDate.length === 0) {
      generateSlotsForDate(dateObj);
      SpreadsheetApp.flush();
      rowsOnDate = scheduleRepo.getByDate(dateObj);
    }
    
    // 2. Validate trainer and client exist
    const clientRepo = new ClientRepository();
    const employeeRepo = new EmployeeRepository();
    
    const clientsList = clientRepo.getAll().map(c => c.name.toLowerCase());
    const trainersList = employeeRepo.getAll().map(t => t.name.toLowerCase());

    if (!trainersList.includes(formData.trainer.toLowerCase())) {
      throw new Error(`Тренер "${formData.trainer}" не найден в справочнике.`);
    }
    if (!clientsList.includes(formData.client.toLowerCase())) {
      throw new Error(`Клиент "${formData.client}" не найден в справочнике.`);
    }

    // 3. Check conflicts
    checkTrainerConflict(rowsOnDate, formData.trainer, startM, endM);
    checkClientConflict(rowsOnDate, formData.client, startM, endM);

    // 4. Filter for specific slot (Room + Time)
    const slotRows = filterRowsForSlot(rowsOnDate, timeStr, roomType);
    
    // 5. Check slot availability
    const targetInfo = checkSlotAvailability(slotRows);
    
    // 6. Generate UUID
    const pk = generateUUID();
    
    // 7. Prepare booking model
    const endHh = Math.floor(endM / 60);
    const endMm = endM % 60;
    const endTimeStr = `${String(endHh).padStart(2, '0')}:${String(endMm).padStart(2, '0')}`;

    const bookingModel = {
      date: Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy'),
      start: timeStr,
      end: endTimeStr,
      employee: formData.trainer,
      client: formData.client,
      status: STATUS.BOOKED,
      type: TRAINING_TYPES.POOL,
      category: roomType,
      replace: '',
      comment: '',
      remainingLessons: '', // TODO: Calculate from client balance
      totalVisited: '',     // TODO: Calculate from history
      whatsappReminder: '',
      pk: pk
    };

    const rowData = scheduleRepo.mapModelToRow(bookingModel);
    let resultRowIndex;
    
    // 8. Write to sheet
    if (targetInfo.action === 'update') {
      scheduleRepo.update(targetInfo.rowIndex, rowData);
      resultRowIndex = targetInfo.rowIndex;
    } else {
      resultRowIndex = scheduleRepo.insertAfter(targetInfo.rowIndex, rowData);
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
  
  // Check if date is in the past
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
    const model = r.model;
    let rowTime = model.start;
    
    if (rowTime instanceof Date) {
      const h = rowTime.getHours();
      const m = rowTime.getMinutes();
      rowTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    } else {
      rowTime = String(rowTime).substring(0, 5);
    }
    
    return rowTime === timeStr && model.category === roomType;
  });
}

/**
 * Checks if the trainer has overlapping bookings.
 * Overlap Logic: (StartA < EndB) and (EndA > StartB)
 */
function checkTrainerConflict(rowsOnDate, trainer, newStartM, newEndM) {
  const conflict = rowsOnDate.find(r => {
    const model = r.model;
    
    if (model.employee !== trainer) return false;
    if (model.status === STATUS.EMPTY || model.status === STATUS.CANCELED) return false;
    
    // Parse Row Start/End
    const sVal = model.start;
    const eVal = model.end;
    
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
    throw new Error(`Тренер ${trainer} занят в это время (строка ${conflict.rowIndex}).`);
  }
}

/**
 * Checks if the client has overlapping bookings (Double Booking).
 */
function checkClientConflict(rowsOnDate, client, newStartM, newEndM) {
  const conflict = rowsOnDate.find(r => {
    const model = r.model;
    
    if (model.client !== client) return false;
    if (![STATUS.BOOKED, STATUS.CONFIRMED, STATUS.VISITED].includes(model.status)) return false;

    // Parse Row Start/End
    const sVal = model.start;
    const eVal = model.end;
    
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
    const emptyRow = slotRows.find(r => 
      r.model.status === STATUS.EMPTY || r.model.status === STATUS.CANCELED
    );
    if (emptyRow) {
      return { action: 'update', rowIndex: emptyRow.rowIndex, count: count };
    }
    throw new Error('В этом слоте уже 4 записи (лимит исчерпан).');
  }
  
  const emptyRow = slotRows.find(r => r.model.status === STATUS.EMPTY);
  if (emptyRow) {
    return { action: 'update', rowIndex: emptyRow.rowIndex, count: count };
  } else {
    const lastRowInSlot = slotRows[slotRows.length - 1];
    return { action: 'insert', rowIndex: lastRowInSlot.rowIndex, count: count };
  }
}

/**
 * Проверка доступности тренера и клиента в реальном времени.
 */
function checkAvailabilityRealtime(date, time, trainer, client, room) {
  try {
    const dateObj = new Date(date);
    const [hh, mm] = time.split(':').map(Number);
    const startM = hh * 60 + mm;
    
    const duration = (room === 'Ванны') ? 60 : 30;
    const endM = startM + duration;
    
    const scheduleRepo = new ScheduleRepository();
    const rowsOnDate = scheduleRepo.getByDate(dateObj);
    
    if (rowsOnDate.length === 0) return { conflict: false };
    
    try {
      if (trainer) checkTrainerConflict(rowsOnDate, trainer, startM, endM);
      if (client) checkClientConflict(rowsOnDate, client, startM, endM);

      // Check room capacity (max 4)
      if (room === 'Бассейн') {
        const timeStr = time.length === 5 ? time : time.substring(0, 5);
        const slotRows = rowsOnDate.filter(r => {
          const model = r.model;
          let rowTime = model.start;
          
          if (rowTime instanceof Date) {
            rowTime = Utilities.formatDate(rowTime, CONFIG.TIME_ZONE, 'HH:mm');
          } else {
            rowTime = String(rowTime).substring(0, 5);
          }
          
          return rowTime === timeStr && model.category === room;
        });
        
        const activeCount = slotRows.filter(r => 
          ![STATUS.EMPTY, STATUS.CANCELED].includes(r.model.status)
        ).length;
        
        if (activeCount >= CONFIG.LIMIT_PER_SLOT) {
          return { 
            conflict: true, 
            message: `В бассейне на ${time} уже ${activeCount} чел. (лимит ${CONFIG.LIMIT_PER_SLOT})` 
          };
        }
      }
    } catch (e) {
      return { conflict: true, message: e.message };
    }
    
    return { conflict: false };
  } catch (e) {
    console.error('checkAvailabilityRealtime error:', e);
    return { conflict: false };
  }
}
