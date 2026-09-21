'use strict';

const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const db = require('../db');
const config = require('../config');

// Sesiones almacenadas del lado del servidor (no en el cliente).
const store = new SqliteStore({
  client: db,
  expired: {
    clear: true,
    intervalMs: 1000 * 60 * 60, // limpia sesiones expiradas cada hora
  },
});

const sessionMiddleware = session({
  name: 'rosa.sid',
  store,
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure, // true en produccion (HTTPS)
    maxAge: config.sessionMaxAge,
  },
});

module.exports = sessionMiddleware;
