'use strict';

const db = require('../db');
const { sha256, safeEqualHex } = require('../services/tokenService');
const { buildDeviceHash } = require('../services/deviceService');
const { logEvent } = require('../services/eventService');
const content = require('../services/contentService');
const { notify } = require('../services/notifyService');

const getByTokenHash = db.prepare('SELECT * FROM accesses WHERE token_hash = ?');

const nowIso = () => new Date().toISOString();

// Respuesta generica: nunca revela si el token existe, si hay dispositivo, etc.
function unavailable(res) {
  return res.status(403).json({ ok: false, error: 'unavailable' });
}

// POST /api/init  { token, clave, signals }
// Valida el token, registra el primer dispositivo o comprueba el existente,
// y vincula la sesion del lado del servidor.
function init(req, res) {
  const { token, clave, signals } = req.body || {};
  if (!token || typeof token !== 'string') return unavailable(res);

  const tokenHash = sha256(token);
  const access = getByTokenHash.get(tokenHash);
  if (!access) return unavailable(res);

  const deviceHash = buildDeviceHash(signals || {});
  const sessionHash = sha256(req.sessionID || '');

  // --- Primer acceso: aun no hay dispositivo registrado ---
  if (!access.device_hash) {
    if (access.activation_required) {
      if (!clave) return unavailable(res);
      if (!access.activation_key_hash || !safeEqualHex(sha256(clave), access.activation_key_hash)) {
        return unavailable(res);
      }
    }

    const ts = nowIso();
    db.prepare(`
      UPDATE accesses
      SET device_hash = ?, session_hash = ?, first_access = ?, last_access = ?
      WHERE id = ?
    `).run(deviceHash, sessionHash, ts, ts, access.id);

    bindSession(req, tokenHash, deviceHash);
    const fresh = getByTokenHash.get(tokenHash);
    logEvent({ access: fresh, eventType: 'page_opened', req, detail: 'first_access' });
    notify({
      subject: '🌹 Abrió tu sorpresa',
      text: `${fresh.label || 'Alguien'} abrió el enlace por primera vez.`,
    });

    return res.json({ ok: true, state: publicState(fresh) });
  }

  // --- Accesos posteriores: el dispositivo debe coincidir ---
  if (!safeEqualHex(deviceHash, access.device_hash)) {
    return unavailable(res);
  }

  db.prepare('UPDATE accesses SET last_access = ?, session_hash = ? WHERE id = ?')
    .run(nowIso(), sessionHash, access.id);

  bindSession(req, tokenHash, deviceHash);
  const fresh = getByTokenHash.get(tokenHash);
  logEvent({ access: fresh, eventType: 'page_opened', req, detail: 'revisit' });

  return res.json({ ok: true, state: publicState(fresh) });
}

function bindSession(req, tokenHash, deviceHash) {
  req.session.tokenHash = tokenHash;
  req.session.deviceHash = deviceHash;
}

function publicState(access) {
  return {
    alreadyResponded: !!access.response,
    confessionAccessed: !!access.confession_accessed,
  };
}

// POST /api/event  { type }  (requiere sesion valida, ver middleware)
function event(req, res) {
  const type = req.body && req.body.type;
  const ok = logEvent({ access: req.access, eventType: type, req });
  if (!ok) return res.status(400).json({ ok: false, error: 'invalid_event' });
  return res.json({ ok: true });
}

// POST /api/confession  (requiere sesion valida)
// Devuelve el contenido de la confesion SOLO tras validar backend.
function confession(req, res) {
  logEvent({ access: req.access, eventType: 'confession_opened', req });
  notify({
    subject: '💛 Abrió la confesión',
    text: `${req.access.label || 'La persona'} encontró el secreto y abrió la confesión.`,
  });
  return res.json({ ok: true, content: content.getConfession() });
}

// POST /api/response  { response }  (requiere sesion valida)
function respond(req, res) {
  const responseId = req.body && req.body.response;
  if (!content.isValidResponseId(responseId)) {
    return res.status(400).json({ ok: false, error: 'invalid_response' });
  }

  db.prepare('UPDATE accesses SET response = ?, response_date = ? WHERE id = ?')
    .run(responseId, nowIso(), req.access.id);

  const fresh = getByTokenHash.get(req.access.token_hash);
  logEvent({ access: fresh, eventType: 'response_selected', req, detail: responseId });
  notify({
    subject: '✨ ¡Respondió!',
    text: `${fresh.label || 'La persona'} respondió: ${content.getResponseText(responseId)}`,
  });

  return res.json({ ok: true, acknowledgement: content.getAcknowledgement(responseId) });
}

module.exports = { init, event, confession, respond };
