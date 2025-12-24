/**
 * Booking Service - логика бронирования тренировок.
 * Чистая бизнес-логика.
 */
const BookingService = {
  /**
   * Создание новой тренировки.
   * @param {Object} formData {date, time, room, trainer, client}
   * @returns {string} PK созданной записи.
   */
  createTraining(formData) {
    BusinessValidator.validateBookingInput(formData);
    
    const dateObj = new Date(formData.date);
    const repo = new ScheduleRepository();
    
    // Ensure grid exists
    repo.ensureGridForDate(dateObj);
    
    const modelsOnDate = repo.getByDate(dateObj);
    
    const clientRepo = new ClientRepository();
    const employeeRepo = new EmployeeRepository();
    
    // Ищем клиента в репозитории
    const clients = clientRepo.search(formData.client);
    const client = clients.length > 0 ? clients[0] : null;

    const trainers = employeeRepo.getByType('Тренер');
    const trainer = trainers.find(t => t.name === formData.trainer);

    if (!trainer) throw new Error(`Тренер "${formData.trainer}" не найден или не активен.`);
    if (!client) throw new Error(`Клиент "${formData.client}" не найден.`);

    const [hh, mm] = formData.time.split(':').map(Number);
    const startM = hh * 60 + mm;
    const endM = startM + CONFIG.STEP_MIN;

    BusinessValidator.checkTrainerConflict(modelsOnDate, formData.trainer, startM, endM);
    BusinessValidator.checkClientConflict(modelsOnDate, formData.client, startM, endM);
    BusinessValidator.checkRoomCapacity(modelsOnDate, formData.time, formData.room);

    const emptyModel = modelsOnDate.find(m => 
      m.status === STATUS.EMPTY && 
      m.category === formData.room && 
      String(m.start).startsWith(formData.time)
    );

    const endHh = Math.floor(endM / 60);
    const endMm = endM % 60;
    const endTimeStr = `${String(endHh).padStart(2, '0')}:${String(endMm).padStart(2, '0')}`;

    const bookingModel = {
      date: Utilities.formatDate(dateObj, CONFIG.TIME_ZONE, 'dd.MM.yyyy'),
      start: formData.time,
      end: endTimeStr,
      employee: formData.trainer,
      client: formData.client,
      status: STATUS.BOOKED,
      type: TRAINING_TYPES.POOL,
      category: formData.room,
      pk: emptyModel ? emptyModel.pk : generateUUID()
    };

    if (emptyModel) {
      repo.update(bookingModel);
    } else {
      repo.create(bookingModel);
    }

    logCreatedRecord({
      pk: bookingModel.pk,
      date: formData.date,
      time: formData.time,
      room_type: formData.room,
      action: 'create',
      message: 'Success'
    });

    return bookingModel.pk;
  },

  /**
   * Проверка доступности в реальном времени.
   */
  checkAvailability(date, time, trainer, client, room) {
    try {
      const dateObj = new Date(date);
      const repo = new ScheduleRepository();
      const modelsOnDate = repo.getByDate(dateObj);
      
      if (modelsOnDate.length === 0) return { conflict: false };
      
      const [hh, mm] = time.split(':').map(Number);
      const startM = hh * 60 + mm;
      const duration = (room === 'Ванны') ? 60 : 30;
      const endM = startM + duration;
      
      try {
        if (trainer) BusinessValidator.checkTrainerConflict(modelsOnDate, trainer, startM, endM);
        if (client) BusinessValidator.checkClientConflict(modelsOnDate, client, startM, endM);
        if (room) BusinessValidator.checkRoomCapacity(modelsOnDate, time, room);
      } catch (e) {
        return { conflict: true, message: e.message };
      }
      
      return { conflict: false };
    } catch (e) {
      console.error('BookingService.checkAvailability error:', e);
      return { conflict: false };
    }
  }
};
