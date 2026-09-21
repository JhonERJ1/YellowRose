'use strict';

const db = require('../db');
const config = require('../config');
const { sha256, safeEqualHex } = require('../services/tokenService');

const getByTokenHash = db.prepare('SELECT * FROM accesses WHERE token_hash = ?');

// Verifica que la sesion actual corresponda a un token + dispositivo autorizados.
// Deja el registro de acceso en req.access. NO revela detalles al fallar.
function requireExperienceSession(req, res, next) {
  const tokenHash = req.session && req.session.tokenHash;
  const deviceHash = req.session && req.session.deviceHash;

  if (!tokenHash || !deviceHash) {
    return res.status(401).json({ ok: false, error: 'unavailable' });
  }

  const access = getByTokenHash.get(tokenHash);
  if (!access || !access.device_hash) {
    return res.status(401).json({ ok: false, error: 'unavailable' });
  }

  // El dispositivo de la sesion debe coincidir con el registrado en la DB.
  if (!safeEqualHex(deviceHash, access.device_hash)) {
    return res.status(403).json({ ok: false, error: 'unavailable' });
  }

  // La sesion actual debe ser la ultima vinculada (evita sesiones robadas/duplicadas).
  const currentSessionHash = sha256(req.sessionID || '');
  if (access.session_hash && !safeEqualHex(currentSessionHash, access.session_hash)) {
    return res.status(403).json({ ok: false, error: 'unavailable' });
  }

  req.access = access;
  next();
}

// Igual que el anterior pero para rutas de PAGINA (redirige en vez de responder JSON).
function requireExperienceSessionPage(req, res, next) {
  const tokenHash = req.session && req.session.tokenHash;
  const deviceHash = req.session && req.session.deviceHash;
  if (!tokenHash || !deviceHash) return res.redirect('/no-disponible');

  const access = getByTokenHash.get(tokenHash);
  if (!access || !access.device_hash || !safeEqualHex(deviceHash, access.device_hash)) {
    return res.redirect('/no-disponible');
  }
  req.access = access;
  next();
}

// Protege el panel admin.
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

function requireAdminApi(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ ok: false, error: 'unauthorized' });
}

// Comprueba credenciales de admin en tiempo (aprox.) constante.
function checkAdminCredentials(username, password) {
  const userOk = safeEqualHex(sha256(username || ''), sha256(config.admin.username));
  const passOk = safeEqualHex(sha256(password || ''), sha256(config.admin.password));
  return userOk && passOk;
}

module.exports = {
  requireExperienceSession,
  requireExperienceSessionPage,
  requireAdmin,
  requireAdminApi,
  checkAdminCredentials,
};
