'use strict';

const crypto = require('crypto');

// SHA-256 en hex de una cadena.
function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

// Token largo, aleatorio y URL-safe (32 bytes -> 43 chars base64url).
function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

// Clave de activacion corta y legible (para compartir aparte del enlace).
function generateActivationKey() {
  return crypto.randomBytes(5).toString('hex'); // 10 caracteres hex
}

// Comparacion en tiempo constante entre dos hashes hex.
function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { sha256, generateToken, generateActivationKey, safeEqualHex };
