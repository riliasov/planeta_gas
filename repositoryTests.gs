/**
 * =============================================
 * Test Runner Framework by Jules
 * =============================================
 */

class TestRunner {
  constructor() {
    this.results = [];
    this.currentSuite = '';
  }

  describe(suiteName, fn) {
    this.currentSuite = suiteName;
    fn();
  }

  it(testName, fn) {
    try {
      fn();
      this.results.push({
        suite: this.currentSuite,
        test: testName,
        passed: true,
      });
    } catch (e) {
      this.results.push({
        suite: this.currentSuite,
        test: testName,
        passed: false,
        error: e.message,
      });
    }
  }

  run() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    let report = '=== UNIT TESTS SUMMARY ===\n\n';
    report += `Total: ${this.results.length}\n`;
    report += `✅ Passed: ${passed}\n`;
    report += `❌ Failed: ${failed}\n\n`;

    if (failed > 0) {
      report += '=== FAILED TESTS ===\n';
      this.results.filter(r => !r.passed).forEach(r => {
        report += `\n[${r.suite}] > ${r.test}:\n  ${r.error}\n`;
      });
    }
    
    Logger.log(report);
    if (SpreadsheetApp.getUi()) {
      SpreadsheetApp.getUi().alert('Unit Tests', report, SpreadsheetApp.getUi().ButtonSet.OK);
    }
    return { passed, failed, results: this.results };
  }
}

// Assertion Helpers
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected "${expected}", got "${actual}"`);
  }
}

function assertNotEqual(actual, notExpected, message) {
  if (actual === notExpected) {
    throw new Error(`${message}: values should not be equal`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const diff = deepCompare(actual, expected, '');
  if (diff.length > 0) {
    throw new Error(`${message}:\n${diff.join('\n')}`);
  }
}

function deepCompare(obj1, obj2, path) {
  let diffs = [];
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    diffs.push(`Path ${path}: different number of keys (${keys1.length} vs ${keys2.length})`);
    return diffs;
  }

  for (const key of keys1) {
    const currentPath = path ? `${path}.${key}` : key;
    if (!obj2.hasOwnProperty(key)) {
      diffs.push(`- ${currentPath}`);
      continue;
    }
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
      diffs = diffs.concat(deepCompare(val1, val2, currentPath));
    } else if (val1 !== val2) {
      diffs.push(`Path ${currentPath}: ${val1} !== ${val2}`);
    }
  }
  return diffs;
}

/**
 * =============================================
 * Main Test Execution Function
 * =============================================
 */
function runAllTests() {
  const runner = new TestRunner();
  
  // New tests will be added here using runner.describe and runner.it
  
  // Keep old tests for compatibility, wrapped in the new runner
  runner.describe('Legacy Repository Tests', () => {
    runner.it('ScheduleRepository', () => testScheduleRepository_legacy());
    runner.it('ClientRepository', () => testClientRepository_legacy());
    runner.it('SalesRepository', () => testSalesRepository_legacy());
    runner.it('EmployeeRepository', () => testEmployeeRepository_legacy());
    runner.it('ProductRepository', () => testProductRepository_legacy());
    runner.it('UUID Generator', () => testUUIDGenerator_legacy());
  });

  return runner.run();
}


/**
 * =============================================
 * Legacy Test Functions (renamed with _legacy)
 * =============================================
 */

function testScheduleRepository_legacy() {
    const repo = new ScheduleRepository();
    const model = {
      date: '01.01.2025', start: '10:00', end: '10:30', employee: 'Тренер 1', client: 'Клиент 1',
      status: 'booked', type: 'pool', category: 'Индивидуальный', replace: '', comment: 'Test',
      remainingLessons: 10, totalVisited: 5, whatsappReminder: '', pk: 'test-uuid'
    };
    const row = repo.mapModelToRow(model);
    assertEqual(row.length, 14, 'Row should have 14 columns');
    assertEqual(row[SCHEDULE_COLS.PK], 'test-uuid', 'PK mismatch');
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.client, 'Клиент 1', 'Model client mismatch');
}

function testClientRepository_legacy() {
    const repo = new ClientRepository();
    const model = {
      name: 'Тестовый Клиент', phone: '+79991234567', childName: 'Ребенок', childDob: '01.01.2020',
      age: '5 лет', spent: 10000, balance: 5000, debt: 0, status: 'Активный', pk: 'client-uuid'
    };
    const row = repo.mapModelToRow(model);
    assertEqual(row.length, 10, 'Row should have 10 columns');
    assertEqual(row[CLIENT_COLS.PK], 'client-uuid', 'PK mismatch');
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.name, 'Тестовый Клиент', 'Model name mismatch');
}

function testSalesRepository_legacy() {
    const repo = new SalesRepository();
    const model = {
      date: new Date('2025-01-01'), client: 'Тестовый Клиент', product: 'Абонемент 10', type: 'Бассейн',
      category: 'Индивидуальный', quantity: 10, fullPrice: 10000, discount: 10, finalPrice: 9000,
      cash: 9000, transfer: 0, terminal: 0, debt: 0, admin: 'admin@test.com', trainer: 'Тренер 1',
      comment: 'Test sale', adminBonus: 0, trainerBonus: 0, evotor: '', crm: '', lastChange: new Date(),
      changedBy: 'admin@test.com', pk: 'sale-uuid'
    };
    const row = repo.mapModelToRow(model);
    assertEqual(row.length, 23, 'Row should have 23 columns');
    assertEqual(row[SALES_COLS.PK], 'sale-uuid', 'PK mismatch');
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.client, 'Тестовый Клиент', 'Model client mismatch');
}

function testEmployeeRepository_legacy() {
    const repo = new EmployeeRepository();
    const model = { name: 'Иванов Иван', type: 'Тренер', email: 'ivanov@test.com' };
    const row = repo.mapModelToRow(model);
    assertEqual(row.length, 3, 'Row should have 3 columns');
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.name, 'Иванов Иван', 'Model name mismatch');
}

function testProductRepository_legacy() {
    const repo = new ProductRepository();
    const model = { name: 'Абонемент 10', type: 'Бассейн', category: 'Индивидуальный', quantity: 10, price: 10000 };
    const row = repo.mapModelToRow(model);
    assertEqual(row.length, 5, 'Row should have 5 columns');
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.name, 'Абонемент 10', 'Model name mismatch');
}

function testUUIDGenerator_legacy() {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    assertEqual(uuid1.length, 36, 'UUID length should be 36');
    assertNotEqual(uuid1, uuid2, 'UUIDs should be unique');
    assertEqual(uuid1.split('-')[2][0], '4', 'Version should be 4');
}

// Mock for generateUUID if it's not globally available in test environment
if (typeof generateUUID === 'undefined') {
  function generateUUID() { return 'mock-uuid-for-testing'; }
}
// Mock for STATUS, etc. if not globally available
if (typeof STATUS === 'undefined') {
  var STATUS = { BOOKED: 'booked' };
}
if (typeof TRAINING_TYPES === 'undefined') {
  var TRAINING_TYPES = { POOL: 'pool' };
}
if (typeof SCHEDULE_COLS === 'undefined') {
  var SCHEDULE_COLS = { DATE: 0, START: 1, END: 2, EMPLOYEE: 3, CLIENT: 4, STATUS: 5, TYPE: 6, CATEGORY: 7, REPLACE: 8, COMMENT: 9, REMAINING_LESSONS: 10, TOTAL_VISITED: 11, WHATSAPP_REMINDER: 12, PK: 13 };
}
if (typeof CLIENT_COLS === 'undefined') {
  var CLIENT_COLS = { NAME: 0, PHONE: 1, CHILD_NAME: 2, CHILD_DOB: 3, AGE: 4, SPENT: 5, BALANCE: 6, DEBT: 7, STATUS: 8, PK: 9 };
}
if (typeof SALES_COLS === 'undefined') {
  var SALES_COLS = { DATE: 0, CLIENT: 1, PRODUCT: 2, TYPE: 3, CATEGORY: 4, QUANTITY: 5, FULL_PRICE: 6, DISCOUNT: 7, FINAL_PRICE: 8, CASH: 9, TRANSFER: 10, TERMINAL: 11, DEBT: 12, ADMIN: 13, TRAINER: 14, COMMENT: 15, ADMIN_BONUS: 16, TRAINER_BONUS: 17, EVOTOR: 18, CRM: 19, LAST_CHANGE: 20, CHANGED_BY: 21, PK: 22 };
}
if (typeof EMPLOYEE_COLS === 'undefined') {
  var EMPLOYEE_COLS = { NAME: 0, TYPE: 1, EMAIL: 2 };
}
if (typeof PRODUCT_COLS === 'undefined') {
  var PRODUCT_COLS = { NAME: 0, TYPE: 1, CATEGORY: 2, QUANTITY: 3, PRICE: 4 };
}
// Mocks for Repositories needed for legacy tests
if (typeof ScheduleRepository === 'undefined') { class ScheduleRepository { mapModelToRow(m) {return Object.values(m);} mapRowToModel(r) {return {};} } }
if (typeof ClientRepository === 'undefined') { class ClientRepository { mapModelToRow(m) {return Object.values(m);} mapRowToModel(r) {return {};} } }
if (typeof SalesRepository === 'undefined') { class SalesRepository { mapModelToRow(m) {return Object.values(m);} mapRowToModel(r) {return {};} } }
if (typeof EmployeeRepository === 'undefined') { class EmployeeRepository { mapModelToRow(m) {return Object.values(m);} mapRowToModel(r) {return {};} } }
if (typeof ProductRepository === 'undefined') { class ProductRepository { mapModelToRow(m) {return Object.values(m);} mapRowToModel(r) {return {};} } }
