/**
 * Получить список продуктов из Справочника
 */
function getProducts() {
  const logCtx = logScriptStart('getProducts', 'Fetching product list');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = findSheetByName(ss, CONFIG.DIRECTORY_SHEET || 'Справочник');
    if (!sheet) {
      logScriptEnd(logCtx, 'warning', 'Spreavochnik not found');
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    
    const range = sheet.getRange(2, 1, lastRow - 1, 5); 
    const values = range.getValues();
    
    const result = values.map(row => ({
      name: row[0],
      type: row[1],
      category: row[2],
      quantity: row[3],
      fullPrice: row[4]
    })).filter(p => p.name);

    logScriptEnd(logCtx, 'success', `Loaded ${result.length} products`);
    return result;
  } catch (e) {
    logScriptEnd(logCtx, 'error', e.message);
    console.error('getProducts error:', e);
    return [];
  }
}

/**
 * Создать продажу
 */
function createSale(payload) {
  const logCtx = logScriptStart('createSale', 'Creating new sale');
  try {
    const base = Number(payload.product.fullPrice) || 0;
    const disc = Number(payload.discount) || 0;
    const final = Math.round((base * (1 - disc / 100)) * 100) / 100;
    
    const row = [
      payload.date,
      payload.client.displayName,
      payload.client.mobile || '',
      payload.product.name,
      payload.product.type || '',
      payload.product.category || '',
      base,
      disc,
      final,
      payload.paymentMethod,
      payload.comment || '',
      payload.trainer.name || '',
      new Date().toISOString()
    ];
    
    const repo = new SalesRepository();
    const targetRow = repo.create(row);
    
    logScriptEnd(logCtx, 'success', `Sale created at row ${targetRow}`);
    return { row: targetRow };
  } catch (e) {
    logScriptEnd(logCtx, 'error', e.message);
    console.error('createSale error:', e);
    throw new Error('Ошибка при создании продажи: ' + e.message);
  }
}
