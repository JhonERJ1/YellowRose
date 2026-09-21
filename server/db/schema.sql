-- Un registro por enlace/token generado.
CREATE TABLE IF NOT EXISTS accesses (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  label                TEXT,                      -- etiqueta privada solo visible en el admin
  token_hash           TEXT NOT NULL UNIQUE,      -- SHA-256 del token (nunca guardamos el token en claro)
  activation_required  INTEGER NOT NULL DEFAULT 0,-- 1 = exige ?clave= en el primer acceso
  activation_key_hash  TEXT,                      -- SHA-256 de la clave de activacion (si aplica)
  device_hash          TEXT,                      -- huella del primer dispositivo autorizado
  session_hash         TEXT,                      -- SHA-256 del id de sesion actual
  first_access         TEXT,                      -- ISO8601 del primer acceso valido
  last_access          TEXT,                      -- ISO8601 del ultimo acceso valido
  easter_egg_found     INTEGER NOT NULL DEFAULT 0,
  confession_accessed  INTEGER NOT NULL DEFAULT 0,
  response             TEXT,                      -- id interno de la respuesta (positive/negative/...)
  response_date        TEXT,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Bitacora de eventos importantes.
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  access_id   INTEGER NOT NULL,
  token_hash  TEXT NOT NULL,
  event_type  TEXT NOT NULL,   -- page_opened | rose_started | rose_completed | easter_egg_found | confession_opened | response_selected
  session_id  TEXT,
  ip          TEXT,
  user_agent  TEXT,
  detail      TEXT,
  timestamp   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (access_id) REFERENCES accesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_access ON events(access_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_accesses_token ON accesses(token_hash);
