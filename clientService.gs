/**
 * Client Service - бизнес-логика работы с клиентами.
 */
const ClientService = {
  /**
   * Получить всех клиентов (для UI).
   */
  getAllClients() {
    try {
      const repo = new ClientRepository();
      return repo.getAll();
    } catch (e) {
      console.error('ClientService.getAllClients error:', e);
      return [];
    }
  },

  /**
   * Поиск клиентов (для Typeahead/Search).
   * @param {string} query 
   */
  searchClients(query) {
    try {
      const repo = new ClientRepository();
      const filtered = repo.search(query);
      
      return filtered.slice(0, 15).map(c => ({
        ...c,
        label: `${c.name} ${c.phone ? '| ' + c.phone : ''}`
      }));
    } catch (e) {
      console.error('ClientService.searchClients error:', e);
      return [];
    }
  },

  /**
   * Получение полной истории клиента (Продажи + Тренировки).
   * @param {string} clientName 
   */
  getClientHistory(clientName) {
    if (!clientName) return { sales: [], training: [] };
    
    // 1. История покупок
    const salesRepo = new SalesRepository();
    // Используем findAll и фильтруем в памяти (можно оптимизировать через findByField если есть индекс)
    const sales = salesRepo.findAll()
      .filter(s => s.client === clientName)
      .slice(-5)
      .reverse() // Последние сверху
      .map(s => ({
        date: Utilities.formatDate(new Date(s.date), CONFIG.TIME_ZONE, "dd.MM.yy"),
        product: s.product,
        price: s.finalPrice
      }));

    // 2. История тренировок
    const notesRepo = new ScheduleRepository();
    const training = notesRepo.findAll()
      .filter(t => t.client === clientName)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date desc

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = training.filter(t => new Date(t.date) >= now);
    const past = training.filter(t => new Date(t.date) < now).slice(0, 5);
    
    const formattedTraining = upcoming.concat(past).map(t => ({
      date: Utilities.formatDate(new Date(t.date), CONFIG.TIME_ZONE, "dd.MM.yy"),
      time: t.start,
      trainer: t.employee,
      type: t.type,
      status: t.status
    }));

    return { sales, training: formattedTraining };
  }
};
