/**
 * Orquesta la experiencia: valida la sesión con el backend, registra eventos
 * y lanza la animación de la rosa. (Versión solo-rosa, sin confesión.)
 */
(function () {
  'use strict';

  let authorized = false;
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

  document.addEventListener('DOMContentLoaded', start);
  if (document.readyState !== 'loading') start();
})();
