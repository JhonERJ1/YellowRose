'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const config = require('./config');

// Fuerza la creacion/migracion de la DB al arrancar.
require('./db');

const sessionMiddleware = require('./middleware/session');
const experienceRoutes = require('./routes/experience');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();

if (config.trustProxy) app.set('trust proxy', 1);

// Cabeceras de seguridad + Content-Security-Policy.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // 'unsafe-inline' solo para estilos: los pétalos de la rosa usan
        // atributos style para sus variables (--a/--s/--d). Los scripts
        // siguen restringidos a 'self'.
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(sessionMiddleware);

// Archivos estaticos (css/js/assets).
app.use('/static', express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h' }));

// Rutas.
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/', experienceRoutes);

// Raiz: pantalla generica (no revela nada).
app.get('/', (req, res) => res.redirect('/no-disponible'));

// 404 -> pantalla generica.
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'views', 'unavailable.html'));
});

// Manejador de errores: nunca filtra detalles internos.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  if (res.headersSent) return;
  res.status(500).json({ ok: false, error: 'server_error' });
});

app.listen(config.port, () => {
  console.log(`🌹 Rosa amarilla escuchando en ${config.baseUrl}  (env: ${config.env})`);
});

module.exports = app;
