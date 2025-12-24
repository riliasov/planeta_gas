/**
 * Централизованный валидатор бизнес-правил.
 * Не содержит зависимостей от SpreadsheetApp (работает с JSON моделями).
 */
const BusinessValidator = {
  /**
   * Проверка входных данных формы бронирования.
   * @param {Object} fd 
   */
  validateBookingInput(fd) {
    if (!fd.date || !fd.time || !fd.client || !fd.trainer || !fd.room) {
      throw new Error('Все поля обязательны для заполнения.');
    }
    
    const [hh, mm] = fd.time.split(':').map(Number);
    if (hh < CONFIG.WORK_START_HOUR || hh >= CONFIG.WORK_END_HOUR) {
      throw new Error(`Время должно быть между ${CONFIG.WORK_START_HOUR}:00 и ${CONFIG.WORK_END_HOUR}:00`);
    }
    
    const d = new Date(fd.date);
    if (isNaN(d.getTime())) throw new Error('Некорректная дата');
    
    const now = new Date();
    const formDate = new Date(d);
    formDate.setHours(hh, mm, 0, 0);

    if (formDate < now) {
      throw new Error('Нельзя записывать на прошедшее время.');
    }
  },

  /**
   * Проверка конфликтов тренера.
   * @param {Array<Object>} modelsOnDate - Массив моделей записей на дату.
   * @param {string} trainer 
   * @param {number} newStartM - Время начала в минутах от начала дня.
   * @param {number} newEndM - Время конца в минутах.
   */
  checkTrainerConflict(modelsOnDate, trainer, newStartM, newEndM) {
    const conflict = modelsOnDate.find(model => {
      if (model.employee !== trainer) return false;
      if (model.status === STATUS.EMPTY || model.status === STATUS.CANCELED) return false;
      
      const { startM, endM } = this._parseModelTimes(model);
      return (newStartM < endM) && (newEndM > startM);
    });
    
    if (conflict) {
      throw new Error(`Тренер ${trainer} занят в это время.`);
    }
  },

  /**
   * Проверка конфликтов клиента.
   */
  checkClientConflict(modelsOnDate, client, newStartM, newEndM) {
    const conflict = modelsOnDate.find(model => {
      if (model.client !== client) return false;
      if (![STATUS.BOOKED, STATUS.CONFIRMED, STATUS.VISITED].includes(model.status)) return false;
      
      const { startM, endM } = this._parseModelTimes(model);
      return (newStartM < endM) && (newEndM > startM);
    });
    
    if (conflict) {
      throw new Error(`Клиент ${client} уже записан на это время.`);
    }
  },

  /**
   * Проверка лимита в бассейне (макс 4).
   */
  checkRoomCapacity(modelsOnDate, timeStr, roomType) {
    if (roomType !== TRAINING_TYPES.POOL) return;

    const activeCount = modelsOnDate.filter(model => {
      if (model.category !== roomType) return false;
      if ([STATUS.EMPTY, STATUS.CANCELED].includes(model.status)) return false;
      
      const t = (model.start instanceof Date) 
        ? Utilities.formatDate(model.start, CONFIG.TIME_ZONE, 'HH:mm')
        : String(model.start).substring(0, 5);
      
      return t === timeStr;
    }).length;

    if (activeCount >= CONFIG.LIMIT_PER_SLOT) {
      throw new Error(`В бассейне на ${timeStr} уже ${activeCount} чел. (лимит ${CONFIG.LIMIT_PER_SLOT})`);
    }
  },

  /**
   * Вспомогательный метод для парсинга времени из модели.
   * @private
   */
  _parseModelTimes(model) {
    const sVal = model.start;
    const eVal = model.end;
    let startM, endM;
    
    if (sVal instanceof Date) {
      startM = sVal.getHours() * 60 + sVal.getMinutes();
    } else {
      const [h, m] = String(sVal).split(':').map(Number);
      startM = h * 60 + m;
    }
    
    if (eVal instanceof Date) {
      endM = eVal.getHours() * 60 + eVal.getMinutes();
    } else if (eVal && String(eVal).includes(':')) {
      const [h, m] = String(eVal).split(':').map(Number);
      endM = h * 60 + m;
    } else {
      endM = startM + 30;
    }
    
    return { startM, endM };
  }
};
