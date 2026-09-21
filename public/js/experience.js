/**
 * Orquesta la experiencia: valida la sesión con el backend, registra eventos,
 * gestiona la zona secreta y la transición hacia la confesión.
 */
(function () {
  'use strict';

  const stage = document.getElementById('stage');
  const secretZone = document.getElementById('secretZone');
  const transition = document.getElementById('transition');

  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  let authorized = false;
  let eggLogged = false;
  let opening = false;
  let mobileArmed = false;
  let started = false;

  // --- Utilidades de red ---
  async function api(path, body) {
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
    } catch (_) {
      return { ok: false, status: 0, data: {} };
    }
  }

  function logEvent(type) {
    if (!authorized) return;
    api('/api/event', { type });
  }

  function goUnavailable() {
    window.location.replace('/no-disponible');
  }

  // --- Lee token y clave de la URL ---
  function readCredentials() {
    const match = window.location.pathname.match(/\/sorpresa\/([^/?#]+)/);
    const token = match ? decodeURIComponent(match[1]) : '';
    const clave = new URLSearchParams(window.location.search).get('clave') || '';
    return { token, clave };
  }

  // --- Arranque ---
  async function start() {
    if (started) return;
    started = true;
    const { token, clave } = readCredentials();
    if (!token) return goUnavailable();

    const signals = await window.collectDeviceSignals();
    const result = await api('/api/init', { token, clave, signals });

    if (!result.ok || !result.data.ok) return goUnavailable();

    authorized = true;

    // Oculta la clave de la URL una vez activado el enlace.
    if (clave) {
      history.replaceState(null, '', `/sorpresa/${encodeURIComponent(token)}`);
    }

    // Texto de portada editable desde el servidor.
    loadIntro();

    // Comienza la experiencia visual.
    window.Rose.spawnParticles(22);
    logEvent('rose_started');
    window.Rose.onRoseComplete(() => logEvent('rose_completed'));
  }

  async function loadIntro() {
    try {
      const res = await fetch('/api/intro');
      const json = await res.json();
      if (json && json.ok && json.intro) {
        const main = document.getElementById('introMain');
        const sub = document.getElementById('introSubtitle');
        if (json.intro.main) main.textContent = json.intro.main;
        if (json.intro.subtitle) sub.textContent = json.intro.subtitle;
      }
    } catch (_) { /* se mantiene el texto por defecto */ }
  }

  // --- Zona secreta ---
  function revealHint() {
    if (!eggLogged) {
      eggLogged = true;
      logEvent('easter_egg_found');
    }
  }

  function openConfession() {
    if (opening || !authorized) return;
    opening = true;

    stage.classList.add('leaving');
    transition.classList.add('active');

    // Tras la transición luminosa, navega a la confesión.
    setTimeout(() => { window.location.href = '/confesion'; }, 1400);
  }

  // Escritorio: hover muestra la pista (CSS) + registra hallazgo; clic abre.
  secretZone.addEventListener('mouseenter', revealHint);
  secretZone.addEventListener('focus', () => {
    secretZone.classList.add('armed');
    revealHint();
  });
  secretZone.addEventListener('blur', () => secretZone.classList.remove('armed'));

  secretZone.addEventListener('click', (e) => {
    if (isTouch) {
      // Móvil: primer toque revela, segundo toque abre.
      if (!mobileArmed) {
        mobileArmed = true;
        secretZone.classList.add('armed');
        revealHint();
        return;
      }
      openConfession();
    } else {
      openConfession();
    }
  });

  secretZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!mobileArmed) { mobileArmed = true; secretZone.classList.add('armed'); revealHint(); }
      else openConfession();
    }
  });

  document.addEventListener('DOMContentLoaded', start);
  if (document.readyState !== 'loading') start();
})();
