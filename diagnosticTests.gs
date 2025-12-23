/**
 * Diagnostic Tests - проверка загрузки данных.
 * Запуск: runDataLoadTests()
 */

function runDataLoadTests() {
  const results = [];
  
  // Test 1: Clients
  try {
    const clients = getClients();
    results.push({
      name: 'getClients()',
      passed: Array.isArray(clients),
      count: clients.length,
      sample: clients[0] || null,
      error: null
    });
  } catch (e) {
    results.push({
      name: 'getClients()',
      passed: false,
      error: e.message
    });
  }
  
  // Test 2: Products
  try {
    const products = getProducts();
    results.push({
      name: 'getProducts()',
      passed: Array.isArray(products),
      count: products.length,
      sample: products[0] || null,
      error: null
    });
  } catch (e) {
    results.push({
      name: 'getProducts()',
      passed: false,
      error: e.message
    });
  }
  
  // Test 3: Staff
  try {
    const staff = getStaff();
    results.push({
      name: 'getStaff()',
      passed: Array.isArray(staff),
      count: staff.length,
      sample: staff[0] || null,
      error: null
    });
  } catch (e) {
    results.push({
      name: 'getStaff()',
      passed: false,
      error: e.message
    });
  }
  
  // Test 4: Sheet access
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scheduleSheet = findSheetByName(ss, CONFIG.SHEET_SCHEDULE);
    const clientsSheet = findSheetByName(ss, CONFIG.SHEET_CLIENTS);
    const productsSheet = findSheetByName(ss, CONFIG.SHEET_PRODUCTS);
    const employeesSheet = findSheetByName(ss, CONFIG.SHEET_EMPLOYEES);
    
    results.push({
      name: 'Sheet Access',
      passed: true,
      sheets: {
        schedule: scheduleSheet ? scheduleSheet.getName() : 'NOT FOUND',
        clients: clientsSheet ? clientsSheet.getName() : 'NOT FOUND',
        products: productsSheet ? productsSheet.getName() : 'NOT FOUND',
        employees: employeesSheet ? employeesSheet.getName() : 'NOT FOUND'
      }
    });
  } catch (e) {
    results.push({
      name: 'Sheet Access',
      passed: false,
      error: e.message
    });
  }
  
  // Generate report
  let report = '=== DATA LOAD DIAGNOSTICS ===\n\n';
  
  results.forEach(r => {
    report += `${r.name}:\n`;
    if (r.passed) {
      report += `  ✅ Passed\n`;
      if (r.count !== undefined) {
        report += `  Count: ${r.count}\n`;
        if (r.sample) {
          report += `  Sample: ${JSON.stringify(r.sample).substring(0, 100)}...\n`;
        }
      }
      if (r.sheets) {
        Object.keys(r.sheets).forEach(key => {
          report += `  ${key}: ${r.sheets[key]}\n`;
        });
      }
    } else {
      report += `  ❌ Failed: ${r.error}\n`;
    }
    report += '\n';
  });
  
  Logger.log(report);
  SpreadsheetApp.getUi().alert('Data Load Tests', report, SpreadsheetApp.getUi().ButtonSet.OK);
  
  return results;
}

/**
 * Test getStaff function
 */
function getStaff() {
  try {
    const repo = new EmployeeRepository();
    return repo.getAll();
  } catch (e) {
    console.error('getStaff error:', e);
    return [];
  }
}

/**
 * Quick check - вызывается из sidebar для диагностики
 */
function debugDataLoad() {
  return {
    clients: getClients().length,
    products: getProducts().length,
    staff: getStaff().length,
    sheets: {
      schedule: CONFIG.SHEET_SCHEDULE,
      clients: CONFIG.SHEET_CLIENTS,
      products: CONFIG.SHEET_PRODUCTS,
      employees: CONFIG.SHEET_EMPLOYEES
    }
  };
}
