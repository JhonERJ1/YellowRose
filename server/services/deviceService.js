'use strict';

const { sha256 } = require('./tokenService');

// Recibe las senales del navegador y produce una huella estable (hash).
//
// IMPORTANTE: esto NO identifica el modelo fisico del equipo. Es una huella
// probabilistica basada en senales disponibles. Puede cambiar al cambiar de
// navegador, actualizarlo, usar incognito, etc. Se usa como barrera practica,
// no como autenticacion de alta seguridad.
function buildDeviceHash(signals = {}) {
  const canonical = [
    normalize(signals.userAgent),
    normalize(signals.platform),
    normalize(signals.uaPlatform),
    normalize(signals.uaMobile),
    normalize(signals.language),
    normalize(signals.languages),
    normalize(signals.timezone),
    normalize(signals.hardwareConcurrency),
    normalize(signals.deviceMemory),
    normalize(signals.screen),          // "1920x1080x24"
    normalize(signals.colorDepth),
    normalize(signals.touch),
  ].join('|');

  return sha256(canonical);
}

function normalize(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map((v) => String(v).trim().toLowerCase()).join(',');
  return String(value).trim().toLowerCase();
}

module.exports = { buildDeviceHash };
