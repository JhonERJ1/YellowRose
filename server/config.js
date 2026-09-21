'use strict';

require('dotenv').config();

const path = require('path');

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const isProd = process.env.NODE_ENV === 'production';

const config = {
  env: process.env.NODE_ENV || 'development',
  isProd,
  port: parseInt(process.env.PORT || '3000', 10),

  // Public base URL, used only by the token generator to print full links.
  baseUrl: (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, ''),

  // Absolute path to the SQLite database file.
  databaseFile: process.env.DATABASE_FILE
    ? path.resolve(process.env.DATABASE_FILE)
    : path.join(__dirname, '..', 'data', 'app.db'),

  // Secret used to sign the session cookie. MUST be set in production.
  sessionSecret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me',

  // Session lifetime (ms). Default 30 days.
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE_MS || String(1000 * 60 * 60 * 24 * 30), 10),

  // If true, cookies are marked Secure (requires HTTPS). Enable in production.
  cookieSecure: bool(process.env.COOKIE_SECURE, isProd),

  // Admin panel credentials.
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
  },

  // Global switch: require an activation key (?clave=...) for the FIRST access.
  // Individual tokens can still override this at generation time.
  requireActivationByDefault: bool(process.env.REQUIRE_ACTIVATION_BY_DEFAULT, true),

  // Trust the first proxy hop (needed on Render/Railway/etc. for Secure cookies + real IPs).
  trustProxy: bool(process.env.TRUST_PROXY, isProd),
};

module.exports = config;
