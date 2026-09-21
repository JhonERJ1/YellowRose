'use strict';

// Inicializa (o migra) la base de datos ejecutando el esquema.
// Uso: npm run init-db
const db = require('./index');
const config = require('../config');

console.log(`Base de datos lista en: ${config.databaseFile}`);
db.close();
