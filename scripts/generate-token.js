'use strict';

// Genera un nuevo enlace privado.
//
// Uso:
//   npm run generate-token
//   npm run generate-token -- --label "Para Ana"
//   npm run generate-token -- --label "Para Ana" --no-activation
//
// Imprime el enlace completo (y la clave de activacion si aplica).
// El token en claro se muestra UNA sola vez: en la DB solo se guarda su hash.

const db = require('../server/db');
const config = require('../server/config');
const {
  generateToken,
  generateActivationKey,
  sha256,
} = require('../server/services/tokenService');

function parseArgs(argv) {
  const args = { label: null, activation: config.requireActivationByDefault };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--label') args.label = argv[++i] || null;
    else if (a === '--no-activation') args.activation = false;
    else if (a === '--activation') args.activation = true;
  }
  return args;
}

function main() {
  const { label, activation } = parseArgs(process.argv.slice(2));

  const token = generateToken();
  const tokenHash = sha256(token);

  let activationKey = null;
  let activationKeyHash = null;
  if (activation) {
    activationKey = generateActivationKey();
    activationKeyHash = sha256(activationKey);
  }

  db.prepare(`
    INSERT INTO accesses (label, token_hash, activation_required, activation_key_hash)
    VALUES (?, ?, ?, ?)
  `).run(label, tokenHash, activation ? 1 : 0, activationKeyHash);

  let url = `${config.baseUrl}/sorpresa/${token}`;
  if (activation) url += `?clave=${activationKey}`;

  console.log('\n─────────────────────────────────────────────');
  console.log('  Nuevo enlace generado 🌹');
  console.log('─────────────────────────────────────────────');
  if (label) console.log(`  Etiqueta:        ${label}`);
  console.log(`  Requiere clave:  ${activation ? 'sí' : 'no'}`);
  if (activation) console.log(`  Clave activacion: ${activationKey}`);
  console.log('');
  console.log('  ENLACE (compártelo solo con esa persona):');
  console.log(`  ${url}`);
  console.log('─────────────────────────────────────────────');
  console.log('  Nota: el token no se puede volver a mostrar.');
  console.log('  Solo se guardó su hash en la base de datos.\n');

  db.close();
}

main();
