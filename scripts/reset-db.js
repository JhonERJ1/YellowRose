'use strict';

/*
 * Limpia la base de datos: borra el archivo SQLite (y sus temporales WAL/SHM)
 * y vuelve a crear el esquema vacío. Útil durante las pruebas.
 *
 *   npm run reset-db
 *
 * En producción pide confirmación para no borrar respuestas reales por error.
 * Para forzarlo sin preguntar (p. ej. en un shell de Render/Railway):
 *
 *   npm run reset-db -- --force
 */

const fs = require('fs');
const readline = require('readline');
const config = require('../server/config');

const force = process.argv.includes('--force');
const files = [
  config.databaseFile,
  `${config.databaseFile}-wal`,
  `${config.databaseFile}-shm`,
];

function wipe() {
  let removed = 0;
  for (const f of files) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      removed++;
    }
  }
  // Recrea el esquema vacío cargando el módulo de base de datos.
  require('../server/db');
  console.log(
    removed > 0
      ? `\n🧹 Base de datos limpiada. Esquema recreado vacío.\n   (${config.databaseFile})\n`
      : `\n🧹 No había base de datos previa. Esquema creado vacío.\n   (${config.databaseFile})\n`
  );
  process.exit(0);
}

if (force || config.env !== 'production') {
  wipe();
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(
    '⚠️  Estás en PRODUCCIÓN. Esto BORRA todas las respuestas guardadas.\n   Escribe "borrar" para confirmar: ',
    (answer) => {
      rl.close();
      if (answer.trim().toLowerCase() === 'borrar') return wipe();
      console.log('Cancelado. No se borró nada.');
      process.exit(0);
    }
  );
}
