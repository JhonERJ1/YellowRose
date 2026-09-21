'use strict';

const rateLimit = require('express-rate-limit');

const jsonMessage = (res) =>
  res.status(429).json({ ok: false, error: 'too_many_requests' });

// Limite general para la API de la experiencia.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => jsonMessage(res),
});

// Limite mas estricto para el arranque de sesion (intento de activar el enlace).
const initLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => jsonMessage(res),
});

// Limite estricto para el login del admin (anti fuerza bruta).
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).send('Demasiados intentos. Intenta mas tarde.'),
});

module.exports = { apiLimiter, initLimiter, adminLoginLimiter };
