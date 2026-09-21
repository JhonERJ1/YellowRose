'use strict';

const db = require('../db');

const ALLOWED_EVENTS = new Set([
  'page_opened',
  'rose_started',
  'rose_completed',
  'easter_egg_found',
  'confession_opened',
  'response_selected',
]);

const insertStmt = db.prepare(`
  INSERT INTO events (access_id, token_hash, event_type, session_id, ip, user_agent, detail)
  VALUES (@access_id, @token_hash, @event_type, @session_id, @ip, @user_agent, @detail)
`);

function isValidEvent(type) {
  return ALLOWED_EVENTS.has(type);
}

// Registra un evento y actualiza los indicadores de la fila de acceso cuando aplica.
function logEvent({ access, eventType, req, detail = null }) {
  if (!isValidEvent(eventType)) return false;

  insertStmt.run({
    access_id: access.id,
    token_hash: access.token_hash,
    event_type: eventType,
    session_id: req.sessionID || null,
    ip: req.ip || null,
    user_agent: (req.get && req.get('user-agent')) || null,
    detail: detail ? String(detail).slice(0, 500) : null,
  });

  if (eventType === 'easter_egg_found') {
    db.prepare('UPDATE accesses SET easter_egg_found = 1 WHERE id = ?').run(access.id);
  } else if (eventType === 'confession_opened') {
    db.prepare('UPDATE accesses SET easter_egg_found = 1, confession_accessed = 1 WHERE id = ?').run(access.id);
  }

  return true;
}

module.exports = { logEvent, isValidEvent, ALLOWED_EVENTS };
