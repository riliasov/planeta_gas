/**
 * Unit Tests для Repositories.
 * Запуск: runAllRepositoryTests()
 */

/**
 * Запуск всех тестов.
 */
function runAllRepositoryTests() {
  const results = [];
  
  results.push(testScheduleRepository());
  results.push(testClientRepository());
  results.push(testSalesRepository());
  results.push(testEmployeeRepository());
  results.push(testProductRepository());
  results.push(testUUIDGenerator());
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  let report = '=== UNIT TESTS SUMMARY ===\n\n';
  report += `Total: ${results.length}\n`;
  report += `✅ Passed: ${passed}\n`;
  report += `❌ Failed: ${failed}\n\n`;
  
  if (failed > 0) {
    report += '=== FAILED TESTS ===\n';
    results.filter(r => !r.passed).forEach(r => {
      report += `\n${r.name}:\n  ${r.error}\n`;
    });
  }
  
  Logger.log(report);
  SpreadsheetApp.getUi().alert('Unit Tests', report, SpreadsheetApp.getUi().ButtonSet.OK);
  
  return { passed, failed, results };
}

/**
 * Test: ScheduleRepository
 */
function testScheduleRepository() {
  try {
    const repo = new ScheduleRepository();
    
    // Test 1: mapModelToRow
    const model = {
      date: '01.01.2025',
      start: '10:00',
      end: '10:30',
      employee: 'Тренер 1',
      client: 'Клиент 1',
      status: STATUS.BOOKED,
      type: TRAINING_TYPES.POOL,
      category: 'Индивидуальный',
      replace: '',
      comment: 'Test',
      remainingLessons: 10,
      totalVisited: 5,
      whatsappReminder: '',
      pk: 'test-uuid'
    };
    
    const row = repo.mapModelToRow(model);
    
    // Assertions
    assertEqual(row.length, 14, 'Row should have 14 columns');
    assertEqual(row[SCHEDULE_COLS.DATE], '01.01.2025', 'Date mismatch');
    assertEqual(row[SCHEDULE_COLS.START], '10:00', 'Start time mismatch');
    assertEqual(row[SCHEDULE_COLS.CLIENT], 'Клиент 1', 'Client mismatch');
    assertEqual(row[SCHEDULE_COLS.PK], 'test-uuid', 'PK mismatch');
    
    // Test 2: mapRowToModel
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.client, 'Клиент 1', 'Model client mismatch');
    assertEqual(modelBack.remainingLessons, 10, 'Remaining lessons mismatch');
    
    return { name: 'ScheduleRepository', passed: true };
    
  } catch (e) {
    return { name: 'ScheduleRepository', passed: false, error: e.message };
  }
}

/**
 * Test: ClientRepository
 */
function testClientRepository() {
  try {
    const repo = new ClientRepository();
    
    // Test: mapModelToRow
    const model = {
      name: 'Тестовый Клиент',
      phone: '+79991234567',
      childName: 'Ребенок',
      childDob: '01.01.2020',
      age: '5 лет',
      spent: 10000,
      balance: 5000,
      debt: 0,
      status: 'Активный',
      pk: 'client-uuid'
    };
    
    const row = repo.mapModelToRow(model);
    
    // Assertions
    assertEqual(row.length, 10, 'Row should have 10 columns');
    assertEqual(row[CLIENT_COLS.NAME], 'Тестовый Клиент', 'Name mismatch');
    assertEqual(row[CLIENT_COLS.PHONE], '+79991234567', 'Phone mismatch');
    assertEqual(row[CLIENT_COLS.BALANCE], 5000, 'Balance mismatch');
    assertEqual(row[CLIENT_COLS.PK], 'client-uuid', 'PK mismatch');
    
    // Test: mapRowToModel
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.name, 'Тестовый Клиент', 'Model name mismatch');
    assertEqual(modelBack.phone, '+79991234567', 'Model phone mismatch');
    
    return { name: 'ClientRepository', passed: true };
    
  } catch (e) {
    return { name: 'ClientRepository', passed: false, error: e.message };
  }
}

/**
 * Test: SalesRepository
 */
function testSalesRepository() {
  try {
    const repo = new SalesRepository();
    
    // Test: mapModelToRow
    const model = {
      date: new Date('2025-01-01'),
      client: 'Тестовый Клиент',
      product: 'Абонемент 10',
      type: 'Бассейн',
      category: 'Индивидуальный',
      quantity: 10,
      fullPrice: 10000,
      discount: 10,
      finalPrice: 9000,
      cash: 9000,
      transfer: 0,
      terminal: 0,
      debt: 0,
      admin: 'admin@test.com',
      trainer: 'Тренер 1',
      comment: 'Test sale',
      adminBonus: 0,
      trainerBonus: 0,
      evotor: '',
      crm: '',
      lastChange: new Date(),
      changedBy: 'admin@test.com',
      pk: 'sale-uuid'
    };
    
    const row = repo.mapModelToRow(model);
    
    // Assertions
    assertEqual(row.length, 23, 'Row should have 23 columns');
    assertEqual(row[SALES_COLS.CLIENT], 'Тестовый Клиент', 'Client mismatch');
    assertEqual(row[SALES_COLS.PRODUCT], 'Абонемент 10', 'Product mismatch');
    assertEqual(row[SALES_COLS.FINAL_PRICE], 9000, 'Final price mismatch');
    assertEqual(row[SALES_COLS.PK], 'sale-uuid', 'PK mismatch');
    
    // Test: mapRowToModel
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.client, 'Тестовый Клиент', 'Model client mismatch');
    assertEqual(modelBack.finalPrice, 9000, 'Model final price mismatch');
    
    return { name: 'SalesRepository', passed: true };
    
  } catch (e) {
    return { name: 'SalesRepository', passed: false, error: e.message };
  }
}

/**
 * Test: EmployeeRepository
 */
function testEmployeeRepository() {
  try {
    const repo = new EmployeeRepository();
    
    // Test: mapModelToRow
    const model = {
      name: 'Иванов Иван',
      type: 'Тренер',
      email: 'ivanov@test.com'
    };
    
    const row = repo.mapModelToRow(model);
    
    // Assertions
    assertEqual(row.length, 3, 'Row should have 3 columns');
    assertEqual(row[EMPLOYEE_COLS.NAME], 'Иванов Иван', 'Name mismatch');
    assertEqual(row[EMPLOYEE_COLS.TYPE], 'Тренер', 'Type mismatch');
    
    // Test: mapRowToModel
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.name, 'Иванов Иван', 'Model name mismatch');
    assertEqual(modelBack.type, 'Тренер', 'Model type mismatch');
    
    return { name: 'EmployeeRepository', passed: true };
    
  } catch (e) {
    return { name: 'EmployeeRepository', passed: false, error: e.message };
  }
}

/**
 * Test: ProductRepository
 */
function testProductRepository() {
  try {
    const repo = new ProductRepository();
    
    // Test: mapModelToRow
    const model = {
      name: 'Абонемент 10',
      type: 'Бассейн',
      category: 'Индивидуальный',
      quantity: 10,
      price: 10000
    };
    
    const row = repo.mapModelToRow(model);
    
    // Assertions
    assertEqual(row.length, 5, 'Row should have 5 columns');
    assertEqual(row[PRODUCT_COLS.NAME], 'Абонемент 10', 'Name mismatch');
    assertEqual(row[PRODUCT_COLS.PRICE], 10000, 'Price mismatch');
    
    // Test: mapRowToModel
    const modelBack = repo.mapRowToModel(row);
    assertEqual(modelBack.name, 'Абонемент 10', 'Model name mismatch');
    assertEqual(modelBack.price, 10000, 'Model price mismatch');
    
    return { name: 'ProductRepository', passed: true };
    
  } catch (e) {
    return { name: 'ProductRepository', passed: false, error: e.message };
  }
}

/**
 * Test: UUID Generator
 */
function testUUIDGenerator() {
  try {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    
    // Assertions
    assertEqual(uuid1.length, 36, 'UUID length should be 36');
    assertEqual(uuid1.split('-').length, 5, 'UUID should have 5 parts');
    assertNotEqual(uuid1, uuid2, 'UUIDs should be unique');
    
    // Check format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
    const parts = uuid1.split('-');
    assertEqual(parts[0].length, 8, 'Part 1 length');
    assertEqual(parts[1].length, 4, 'Part 2 length');
    assertEqual(parts[2].length, 4, 'Part 3 length');
    assertEqual(parts[3].length, 4, 'Part 4 length');
    assertEqual(parts[4].length, 12, 'Part 5 length');
    assertEqual(parts[2][0], '4', 'Version should be 4');
    
    return { name: 'UUID Generator', passed: true };
    
  } catch (e) {
    return { name: 'UUID Generator', passed: false, error: e.message };
  }
}

/**
 * Helper: assertEqual
 */
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected "${expected}", got "${actual}"`);
  }
}

/**
 * Helper: assertNotEqual
 */
function assertNotEqual(actual, notExpected, message) {
  if (actual === notExpected) {
    throw new Error(`${message}: values should not be equal`);
  }
}
