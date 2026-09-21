# 🌹 Rosa Amarilla — una confesión secreta

Una experiencia web romántica y privada: al abrir un enlace único aparece una
**rosa amarilla dibujada completamente por código** que florece poco a poco.
Escondida en la decoración hay una **zona secreta**; al descubrirla aparece la
frase *"Quería decirte algo más..."* y, tras un clic, una **confesión** protegida
por el backend con opciones de respuesta que se guardan en la base de datos.

No es una página web tradicional: está pensada para sentirse como una sorpresa
hecha a mano para una sola persona.

---

## ✨ Características

- **Rosa generada por código** (SVG + CSS + JS), con tallo, hojas, sépalos y
  cuatro capas de pétalos, gradientes y profundidad. Nada de imágenes.
- **Animación de crecimiento** orgánica: tallo → hojas → botón → pétalos
  exteriores → intermedios → internos → centro, con una brisa muy sutil al final.
- **Zona secreta** integrada en la esquina superior derecha (una pequeña estrella
  luminosa), con pista al pasar el mouse y equivalente táctil en móvil.
- **Confesión protegida por el servidor**: el texto solo se entrega tras validar
  token + dispositivo + sesión.
- **Enlace privado con token** aleatorio y criptográficamente seguro; en la base
  de datos solo se guarda su hash.
- **Registro del primer dispositivo** + **clave de activación** opcional para
  evitar que alguien que reciba el enlace antes se registre primero.
- **Bitácora de eventos** (abrió el enlace, terminó la rosa, encontró el secreto,
  abrió la confesión, respondió) con marcas de tiempo.
- **Panel de administración** con línea de tiempo por enlace, y un **generador de
  enlaces** integrado (crea la URL y la clave desde el navegador, sin consola).
- **Avisos instantáneos** opcionales (Telegram/Discord/email): te llega el
  momento en que abre el enlace, la confesión y cuando responde.
- **Responsive** y con soporte de `prefers-reduced-motion`.

---

## 🧱 Tecnologías

| Capa            | Tecnología                                    |
|-----------------|-----------------------------------------------|
| Backend         | Node.js + Express                             |
| Base de datos   | SQLite (better-sqlite3)                        |
| Sesiones        | express-session + almacén en SQLite           |
| Seguridad       | helmet (CSP), express-rate-limit, hashes SHA-256 |
| Frontend        | HTML + CSS + JavaScript (sin framework)       |
| La rosa         | SVG + CSS animations + JavaScript             |

Se eligió **SQLite** porque el proyecto es pequeño, no necesita un servidor de
base de datos aparte y se despliega fácilmente con un disco persistente.

---

## 📁 Estructura

```
rosa-amarilla/
├── server/
│   ├── app.js                 # App Express, middlewares, rutas, CSP
│   ├── config.js              # Configuración desde .env
│   ├── db/
│   │   ├── index.js           # Conexión SQLite + carga del esquema
│   │   ├── init.js            # Script de inicialización (npm run init-db)
│   │   └── schema.sql         # Esquema de tablas
│   ├── routes/                # experience.js, api.js, admin.js
│   ├── controllers/           # experienceController, apiController, adminController
│   ├── services/              # tokenService, deviceService, eventService, contentService
│   └── middleware/            # session.js, auth.js, rateLimit.js
├── public/
│   ├── css/                   # main.css, rose.css, confession.css, admin.css
│   ├── js/                    # fingerprint.js, rose.js, experience.js, confession.js, admin*.js
│   └── assets/                # (audio opcional)
├── views/                     # experience.html, confession.html, unavailable.html, admin*.html
├── content/
│   └── confession.json        # Textos y opciones de respuesta EDITABLES
├── scripts/
│   └── generate-token.js      # Generador de enlaces (npm run generate-token)
├── .env.example
├── render.yaml
├── package.json
└── README.md
```

---

## 🗄️ Base de datos

**Tabla `accesses`** — un registro por enlace generado:

`id`, `label`, `token_hash`, `activation_required`, `activation_key_hash`,
`device_hash`, `session_hash`, `first_access`, `last_access`,
`easter_egg_found`, `confession_accessed`, `response`, `response_date`, `created_at`.

**Tabla `events`** — bitácora:

`id`, `access_id`, `token_hash`, `event_type`, `session_id`, `ip`,
`user_agent`, `detail`, `timestamp`.

Tipos de evento: `page_opened`, `rose_started`, `rose_completed`,
`easter_egg_found`, `confession_opened`, `response_selected`.

El esquema se crea/actualiza solo al arrancar (todo con `IF NOT EXISTS`).

---

## 🔐 Flujo de autorización

1. La persona abre `/sorpresa/TOKEN?clave=XXXX`.
2. El servidor comprueba que el token exista (por su hash) y sirve la experiencia.
3. El navegador calcula señales de dispositivo y llama a `POST /api/init`.
4. **Primer acceso**: si el enlace exige clave, se valida; se registra el
   `device_hash`, se crea la sesión y se guarda `first_access`.
5. **Accesos posteriores**: el `device_hash` debe coincidir y la sesión debe ser
   válida. Si no, se muestra la pantalla genérica *"Esta sorpresa no está
   disponible en este dispositivo"* sin revelar ningún detalle.
6. La confesión (`/confesion` y `POST /api/confession`) exige sesión válida.

La clave de activación se elimina de la URL tras el primer acceso.

---

## 🚀 Instalación y ejecución local

### 1. Instalar Node.js
Necesitas **Node.js 18 o superior** (recomendado 20+). Descárgalo de
<https://nodejs.org>. Comprueba con:
```bash
node --version
npm --version
```

### 2. Obtener el proyecto e instalar dependencias
```bash
cd rosa-amarilla
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```
Edita `.env` y define al menos:
- `SESSION_SECRET` (genera uno):
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- `ADMIN_USERNAME` y `ADMIN_PASSWORD`.

### 4. Crear la base de datos
```bash
npm run init-db
```
(También se crea sola al iniciar el servidor.)

### 5. Generar un enlace
```bash
npm run generate-token -- --label "Para [nombre]"
```
Copia el enlace que imprime (incluye la clave de activación si está activada).
Para generar un enlace sin clave:
```bash
npm run generate-token -- --label "Para [nombre]" --no-activation
```

### 6. Iniciar el servidor
```bash
npm run dev      # desarrollo (recarga con --watch)
# o
npm start        # producción
```

### 7. Probar
Abre el enlace generado en el navegador. El panel está en `/admin`.

### Limpiar la base de datos (para pruebas)
```bash
npm run reset-db
```
Borra el archivo SQLite y recrea el esquema vacío. En producción pide
confirmación; para forzarlo en un shell del servidor: `npm run reset-db -- --force`.

---

## 🌐 Deployment

> **Lo importante:** el plan gratis de Render tiene disco **efímero**. Si la
> respuesta llega y el servicio se reinicia antes de que la veas, **se pierde**.
> Por eso, para el envío real usa una de estas dos cosas (o ambas): un host con
> almacenamiento persistente, y/o los **avisos instantáneos** (más abajo).

### A) Recomendado para el envío real — Railway (persistente, sin dormir)
Railway (<https://railway.app>) da almacenamiento persistente, **no duerme** el
servicio (carga al instante, sin la espera de ~1 min de Render), URL limpia
(`tu-nombre.up.railway.app`) y **no pide tarjeta**: el crédito de prueba alcanza
de sobra para una sorpresa. No hay que cambiar código.

1. Sube el proyecto a GitHub.
2. En Railway: **New Project → Deploy from GitHub repo**.
3. Añade un **Volume** al servicio y móntalo (p. ej. en `/data`).
4. Variables: `NODE_ENV=production`, `DATABASE_FILE=/data/app.db`,
   `COOKIE_SECURE=true`, `TRUST_PROXY=true`, `BASE_URL=https://tu-nombre.up.railway.app`,
   `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
5. Abre `https://tu-nombre.up.railway.app/admin`, entra con tu usuario/clave y
   pulsa **Generar** para crear el enlace (te muestra la URL y la clave una vez).

> El crédito de prueba ($5, ~30 días, sin tarjeta) cubre este proyecto porque
> gasta muy poco. Si quieres dejarlo más tiempo, el plan Hobby cuesta ~$5/mes.

### B) Alternativa — Render de pago (Starter, ~$7/mes)
En `render.yaml` cambia `plan: free` por `plan: starter`, descomenta el bloque
`disk:` y pon `DATABASE_FILE=/data/app.db`. Persistente e indefinido; cancela
cuando termines.

### C) Solo para PROBAR — Render gratis
Sirve para pruebas rápidas (la BD se borra sola en cada deploy, cómodo para
limpiar). No lo uses para el envío real por lo del disco efímero y porque el
servicio se duerme tras 15 min.

### 🔔 Avisos instantáneos (la mejor red de seguridad, y es gratis)
Para no depender de que la base de datos siga viva, la app puede **avisarte al
instante** cuando la persona abre el enlace, abre la confesión y —lo más
importante— **cuando responde**. El aviso llega a tu Telegram, Discord o correo,
y ahí queda guardado para siempre, aunque el hosting reinicie o borre los datos.

Configúralo en el `.env` (elige uno; ver instrucciones en `.env.example`):
- **Telegram:** `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (lo más simple en el móvil).
- **Discord:** `DISCORD_WEBHOOK_URL` (copiar y pegar).
- **Email:** `RESEND_API_KEY` + `NOTIFY_EMAIL_TO` + `NOTIFY_EMAIL_FROM`.

Si no configuras ninguno, la app funciona igual, solo que sin avisos.

> Con los avisos activados incluso podrías usar Render gratis sin miedo a perder
> la respuesta: te llega al momento a tu teléfono. Aun así, para que a ella le
> cargue al instante (sin la espera del arranque en frío), Railway da mejor
> experiencia.

En todos los casos usa HTTPS con `COOKIE_SECURE=true` y `TRUST_PROXY=true`.

> Evita plataformas puramente estáticas o serverless (Vercel/Netlify): SQLite y
> las sesiones necesitan un proceso siempre encendido y disco.

### Sobre los enlaces "largos"
La URL del host es corta y limpia; lo que alarga el enlace es el **token secreto**
(y la clave). Es el precio de que la sorpresa sea de verdad privada. Si quieres un
enlace más corto para compartir, se puede añadir un atajo tipo
`tu-sitio.onrender.com/r/ana` que redirija al enlace real (pídelo y lo agrego).

---

## 🛡️ Seguridad

- Secretos y credenciales solo en variables de entorno (`.env`), nunca en el
  código ni en el frontend.
- El token nunca se guarda en claro: solo su **hash SHA-256**.
- Cookies de sesión `HttpOnly`, `SameSite`, y `Secure` en producción; sesiones
  del lado del servidor.
- Comparaciones de hashes en **tiempo constante**.
- Cabeceras de seguridad y **CSP** con `helmet` (scripts restringidos a `'self'`).
- **Rate limiting** en la API, en la activación y en el login del admin.
- Mensajes de error genéricos: nunca revelan si un token existe, qué dispositivo
  está registrado o si hay una confesión.

---

## ⚠️ Limitación del "device fingerprint"

El navegador **no** permite identificar de forma fiable el modelo físico exacto
del dispositivo. Por eso el `device_hash` es una identificación **probabilística**
construida a partir de señales disponibles (user agent, plataforma, zona horaria,
resolución, idioma, núcleos, memoria, etc.).

Puede cambiar por: cambio o actualización del navegador, modo incógnito, cambios
de configuración o de pantalla, o bloqueo de ciertas APIs.

Por tanto, **TOKEN + SESIÓN + DEVICE HASH** debe considerarse una **barrera
práctica** para esta experiencia, no un sistema de autenticación de alta
seguridad. La clave de activación (recomendada) refuerza el primer acceso.

---

## 🎨 Personalización

- **Textos y respuestas:** edita `content/confession.json` (portada, confesión y
  las opciones de respuesta con sus identificadores internos).
- **Colores:** variables CSS en `public/css/main.css` (`:root`).
- **La rosa:** geometría y capas en `views/experience.html`; tiempos y brisa en
  `public/css/rose.css`.
- **Activación por defecto:** `REQUIRE_ACTIVATION_BY_DEFAULT` en `.env` o el flag
  `--no-activation` al generar cada enlace.

---

Hecho con intención y cariño. 💛
