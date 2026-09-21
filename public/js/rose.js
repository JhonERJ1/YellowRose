/**
 * Utilidades visuales de la rosa: partículas de fondo y detección
 * del momento en que la floración termina.
 */
(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function spawnParticles(count) {
    if (reducedMotion) return;
    const layer = document.getElementById('particles');
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const left = Math.random() * 100;
      const dur = 14 + Math.random() * 16;
      const delay = Math.random() * 18;
      const dx = (Math.random() * 60 - 30).toFixed(0) + 'px';
      const size = 2 + Math.random() * 2.5;
      p.style.left = left + 'vw';
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.animationDuration = dur + 's';
      p.style.animationDelay = delay + 's';
      p.style.setProperty('--dx', dx);
      layer.appendChild(p);
    }
  }

  /**
   * Llama a `cb` cuando la rosa termina de florecer.
   * Escucha el fin de la animación del punto central; si algo falla,
   * usa un temporizador de respaldo.
   */
  function onRoseComplete(cb) {
    let done = false;
    const fire = () => { if (!done) { done = true; cb(); } };

    if (reducedMotion) { setTimeout(fire, 300); return; }

    const center = document.querySelector('.center-dot');
    if (center) {
      center.addEventListener('animationend', fire, { once: true });
    }
    // Respaldo por si el evento no dispara (p. ej. pestaña en segundo plano).
    setTimeout(fire, 6600);
  }

  window.Rose = { spawnParticles, onRoseComplete, reducedMotion };
})();
