/**
 * Repository for Client data access.
 * Extends BaseRepository.
 */
class ClientRepository extends BaseRepository {
  constructor() {
    super(CONFIG.CLIENTS_SHEET || 'clients');
  }

  /**
   * Retrieves all clients mapped to domain objects.
   * @returns {Array<Object>}
   */
  getAll() {
    const rawData = this.getAllValues(1); // Header is row 1
    
    return rawData.map(row => this.mapRowToModel(row))
                  .filter(c => c.name); // Basic validation
  }

  /**
   * Safe mapping from row array to object.
   * @param {Array} row 
   */
  mapRowToModel(row) {
    // Indexes based on historic code in clientService.gs
    // A: Name, B: Phone, C: ChildName, D: ChildDOB, E: Age, F: Spent, G: Balance, H: Debt, I: Status
    return {
      name: row[0],
      phone: row[1],
      childName: row[2],
      childDate: this._formatDate(row[3]),
      age: row[4],
      spent: row[5],
      balance: row[6],
      debt: row[7],
      status: row[8]
    };
  }
  
  /**
   * Search clients by query (Name, Phone, ChildName).
   * @param {string} query 
   * @returns {Array<Object>}
   */
  search(query) {
    if (!query || query.length < 2) return [];
    
    const all = this.getAll();
    const qLower = query.toLowerCase();
    
    return all.filter(c => {
      const nameMatch = c.name && String(c.name).toLowerCase().includes(qLower);
      const phoneMatch = c.phone && String(c.phone).toLowerCase().includes(qLower);
      const childMatch = c.childName && String(c.childName).toLowerCase().includes(qLower);
      return nameMatch || phoneMatch || childMatch;
    });
  }

  /**
   * Helper to safely format date
   */
  _formatDate(val) {
    if (val instanceof Date) {
      return Utilities.formatDate(val, CONFIG.TIME_ZONE || Session.getScriptTimeZone(), 'dd.MM.yyyy');
    }
    return val;
  }
}
