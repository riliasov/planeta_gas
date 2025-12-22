/**
 * Логирует результат создания/изменения записи (бизнес-лог).
 */
function logCreatedRecord(data) {
  try {
    const sheet = getLogSheet(CONFIG.LOG_SHEET_RECORDS);
    const timestamp = new Date().toISOString();
    const userEmail = Session.getEffectiveUser().getEmail(); // В админском контексте
    
    // [timestamp, userEmail, pk, date, time, room_type, rowIndex, action, message]
    sheet.appendRow([
      timestamp,
      userEmail,
      data.pk || 'N/A',
      data.date || 'N/A',
      data.time || 'N/A',
      data.room_type || 'N/A',
      data.rowIndex || -1,
      data.action,
      data.message
    ]);
  } catch (e) {
    console.error("Critical: Failed to write to RecordLog", e);
  }
}

/**
 * Начало выполнения скрипта (Технический лог).
 * @returns {string} ID лога (timestamp) для закрытия
 */
function logScriptStart(scriptName, description) {
  const start = new Date();
  const id = start.getTime().toString();
  // Можно писать сразу "pending", но для оптимизации квот запишем только в конце, 
  // либо используем CacheService для хранения start time.
  // Для простоты реализации требования: вернем объект контекста.
  return {
    id: id,
    scriptName: scriptName,
    description: description,
    startedAt: start
  };
}

/**
 * Конец выполнения скрипта.
 */
function logScriptEnd(ctx, result, note = '') {
  try {
    const sheet = getLogSheet(CONFIG.LOG_SHEET_SCRIPT);
    const end = new Date();
    const durationMs = end.getTime() - ctx.startedAt.getTime();
    
    // [scriptName, description, startedAt, result, durationMs, note]
    sheet.appendRow([
      ctx.scriptName,
      ctx.description,
      ctx.startedAt.toISOString(),
      result, // 'success' | 'error'
      durationMs,
      note
    ]);
  } catch (e) {
    console.error("Critical: Failed to write to ScriptLog", e);
  }
}