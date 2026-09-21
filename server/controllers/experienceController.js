'use strict';

const path = require('path');
const db = require('../db');
const { sha256 } = require('../services/tokenService');
const content = require('../services/contentService');

const VIEWS = path.join(__dirname, '..', '..', 'views');
const getByTokenHash = db.prepare('SELECT id FROM accesses WHERE token_hash = ?');

// GET /sorpresa/:token
// Sirve el "shell" de la experiencia. La autorizacion real (dispositivo/sesion)
// ocurre despues via POST /api/init. Aqui solo comprobamos que el token exista;
// si no existe, mostramos la pantalla generica para no filtrar informacion.
function experience(req, res) {
  const token = req.params.token || '';
  const exists = getByTokenHash.get(sha256(token));
  if (!exists) {
    return res.status(404).sendFile(path.join(VIEWS, 'unavailable.html'));
  }
  return res.sendFile(path.join(VIEWS, 'experience.html'));
}

// GET /confesion  (protegida por sesion valida via middleware)
function confessionPage(req, res) {
  return res.sendFile(path.join(VIEWS, 'confession.html'));
}

// GET /no-disponible
function unavailable(req, res) {
  return res.status(200).sendFile(path.join(VIEWS, 'unavailable.html'));
}

// GET /api/intro  -> textos de portada (publico, no sensible)
function intro(req, res) {
  return res.json({ ok: true, intro: content.getIntro() });
}

module.exports = { experience, confessionPage, unavailable, intro };
