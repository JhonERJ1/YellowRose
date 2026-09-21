/**
 * Página de confesión. El contenido llega SOLO tras validar la sesión en el
 * backend (POST /api/confession). Si no está autorizado, redirige a la
 * pantalla genérica.
 */
(function () {
  'use strict';

  const reduced = window.Rose ? window.Rose.reducedMotion : false;

  async function api(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  }

  function revealSequence(steps) {
    let t = reduced ? 0 : 300;
    steps.forEach((el, i) => {
      if (!el) return;
      setTimeout(() => el.classList.add('reveal'), t);
      t += reduced ? 0 : (i === 0 ? 1400 : 1100);
    });
  }

  let started = false;
  async function init() {
    if (started) return;
    started = true;
    if (window.Rose) window.Rose.spawnParticles(18);

    const result = await api('/api/confession', {});
    if (!result.ok || !result.data.ok) {
      window.location.replace('/no-disponible');
      return;
    }

    const content = result.data.content;
    const intro = document.getElementById('cIntro');
    const line = document.getElementById('cLine');
    const note = document.getElementById('cNote');
    const responses = document.getElementById('responses');
    const ack = document.getElementById('cAck');

    intro.textContent = content.confession.intro;
    line.textContent = content.confession.line;
    note.textContent = content.confession.note;

    // Construye los botones de respuesta.
    content.responses.forEach((r) => {
      const btn = document.createElement('button');
      btn.className = 'response-btn';
      btn.type = 'button';
      btn.dataset.id = r.id;

      const emoji = document.createElement('span');
      emoji.className = 'emoji';
      emoji.textContent = r.emoji || '';
      const label = document.createElement('span');
      label.textContent = r.text;

      btn.appendChild(emoji);
      btn.appendChild(label);
      btn.addEventListener('click', () => submit(r.id, btn, responses, ack));
      responses.appendChild(btn);
    });

    revealSequence([intro, line, note, responses]);
  }

  async function submit(responseId, btn, container, ack) {
    // Evita doble envío.
    const buttons = container.querySelectorAll('.response-btn');
    buttons.forEach((b) => (b.disabled = true));
    btn.classList.add('chosen');

    const result = await api('/api/response', { response: responseId });
    if (result.ok && result.data.ok) {
      ack.textContent = result.data.acknowledgement || 'Gracias. 💛';
    } else {
      ack.textContent = 'Gracias. 💛';
    }
    ack.classList.add('reveal');
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();
