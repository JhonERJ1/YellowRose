'use strict';

const path = require('path');
const db = require('../db');
const config = require('../config');
const { checkAdminCredentials } = require('../middleware/auth');
const { generateToken, generateActivationKey, sha256 } = require('../services/tokenService');

const VIEWS = path.join(__dirname, '..', '..', 'views');

function loginPage(req, res) {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  return res.sendFile(path.join(VIEWS, 'admin-login.html'));
}

function login(req, res) {
  const { username, password } = req.body || {};
  if (!checkAdminCredentials(username, password)) {
    return res.redirect('/admin/login?error=1');
  }
  req.session.isAdmin = true;
  return res.redirect('/admin');
}

function logout(req, res) {
  if (req.session) req.session.isAdmin = false;
  return res.redirect('/admin/login');
}

function dashboard(req, res) {
  return res.sendFile(path.join(VIEWS, 'admin.html'));
}

// GET /admin/api/data  -> datos para el panel (sin exponer hashes completos)
function data(req, res) {
  const accesses = db.prepare(`
    SELECT id, label, first_access, last_access, device_hash,
           easter_egg_found, confession_accessed, response, response_date,
           activation_required, created_at,
           CASE WHEN device_hash IS NULL THEN 0 ELSE 1 END AS activated
    FROM accesses
    ORDER BY created_at DESC
  `).all();

  const eventStmt = db.prepare(`
    SELECT event_type, timestamp, detail
    FROM events
    WHERE access_id = ?
    ORDER BY timestamp ASC
  `);

  const result = accesses.map((a) => ({
    id: a.id,
    label: a.label,
    activated: !!a.activated,
    activation_required: !!a.activation_required,
    first_access: a.first_access,
    last_access: a.last_access,
    device_fingerprint: a.device_hash ? a.device_hash.slice(0, 12) : null,
    rose_completed: eventStmt.all(a.id).some((e) => e.event_type === 'rose_completed'),
    easter_egg_found: !!a.easter_egg_found,
    confession_accessed: !!a.confession_accessed,
    response: a.response,
    response_date: a.response_date,
    created_at: a.created_at,
    events: eventStmt.all(a.id),
  }));

  return res.json({ ok: true, accesses: result });
}

// POST /admin/api/generate  { label, activation }  -> crea un enlace nuevo.
// Devuelve la URL y la clave UNA sola vez (en la DB solo se guarda el hash).
function generateLink(req, res) {
  const label = (req.body && typeof req.body.label === 'string' ? req.body.label : '').trim() || null;
  const activation = !(req.body && req.body.activation === false);

  const token = generateToken();
  const tokenHash = sha256(token);

  let activationKey = null;
  let activationKeyHash = null;
  if (activation) {
    activationKey = generateActivationKey();
    activationKeyHash = sha256(activationKey);
  }

  db.prepare(`
    INSERT INTO accesses (label, token_hash, activation_required, activation_key_hash)
    VALUES (?, ?, ?, ?)
  `).run(label, tokenHash, activation ? 1 : 0, activationKeyHash);

  let url = `${config.baseUrl}/sorpresa/${token}`;
  if (activation) url += `?clave=${activationKey}`;

  return res.json({ ok: true, url, activationKey, label, activation });
}

// POST /admin/api/delete  { id }  -> borra un enlace y sus eventos.
function deleteAccess(req, res) {
  const id = req.body && parseInt(req.body.id, 10);
  if (!id) return res.status(400).json({ ok: false, error: 'invalid_id' });
  db.prepare('DELETE FROM events WHERE access_id = ?').run(id);
  const info = db.prepare('DELETE FROM accesses WHERE id = ?').run(id);
  return res.json({ ok: true, deleted: info.changes });
}

module.exports = { loginPage, login, logout, dashboard, data, generateLink, deleteAccess };
