'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');

const CONTENT_FILE = path.join(__dirname, '..', '..', 'content', 'confession.json');

let cache = null;

function load() {
  // En desarrollo recargamos siempre para poder editar el texto sin reiniciar.
  if (cache && config.isProd) return cache;
  cache = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  return cache;
}

// Contenido publico de la confesion (sin datos sensibles).
function getConfession() {
  const c = load();
  return {
    confession: c.confession,
    responses: c.responses,
  };
}

// Textos de la portada.
function getIntro() {
  const c = load();
  return { main: c.main, subtitle: c.subtitle };
}

function isValidResponseId(id) {
  const c = load();
  return c.responses.some((r) => r.id === id);
}

function getAcknowledgement(id) {
  const c = load();
  return (c.acknowledgements && c.acknowledgements[id]) || 'Gracias. 💛';
}

// Texto legible (emoji + texto) de una opción de respuesta, para los avisos.
function getResponseText(id) {
  const c = load();
  const r = c.responses.find((x) => x.id === id);
  if (!r) return id;
  return `${r.emoji ? r.emoji + ' ' : ''}${r.text}`.trim();
}

module.exports = { getConfession, getIntro, isValidResponseId, getAcknowledgement, getResponseText };
