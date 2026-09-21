(function () {
  'use strict';

  const RESPONSE_LABELS = {
    positive: '💛 Tú también me gustas',
    negative: '😂 JAJAJA... no',
    unsure: '🙈 Necesito procesar esto',
    no_answer: '🤍 No sé qué decir',
  };

  function fmt(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function timelineItem(label, done) {
    const li = document.createElement('li');
    if (done) li.classList.add('done');
    const dot = document.createElement('span');
    dot.className = 'dot' + (done ? ' on' : '');
    li.appendChild(dot);
    li.appendChild(document.createTextNode(label));
    return li;
  }

  function renderCard(a) {
    const card = document.createElement('div');
    card.className = 'card';

    const h2 = document.createElement('h2');
    h2.textContent = a.label || `Enlace #${a.id}`;
    card.appendChild(h2);

    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = a.activated
      ? `Dispositivo: ${a.device_fingerprint || '—'}`
      : (a.activation_required ? 'Sin activar · requiere clave' : 'Sin activar');
    card.appendChild(meta);

    const ul = document.createElement('ul');
    ul.className = 'timeline';
    ul.appendChild(timelineItem('Enlace abierto', a.activated));
    ul.appendChild(timelineItem('Rosa completada', a.rose_completed));
    ul.appendChild(timelineItem('Zona secreta encontrada', a.easter_egg_found));
    ul.appendChild(timelineItem('Confesión abierta', a.confession_accessed));
    ul.appendChild(timelineItem('Respuesta recibida', !!a.response));
    card.appendChild(ul);

    const tag = document.createElement('span');
    if (a.response) {
      tag.className = 'response-tag';
      tag.textContent = RESPONSE_LABELS[a.response] || a.response;
    } else {
      tag.className = 'response-tag none';
      tag.textContent = 'Sin respuesta';
    }
    card.appendChild(tag);

    const dates = document.createElement('div');
    dates.className = 'dates';
    dates.textContent =
      `Creado: ${fmt(a.created_at)} · Primer acceso: ${fmt(a.first_access)} · ` +
      `Último: ${fmt(a.last_access)}` + (a.response_date ? ` · Respuesta: ${fmt(a.response_date)}` : '');
    card.appendChild(dates);

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = 'Borrar';
    del.addEventListener('click', async () => {
      if (!confirm(`¿Borrar "${a.label || 'Enlace #' + a.id}" y sus datos?`)) return;
      const r = await fetch('/admin/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id }),
      });
      if (r.ok) card.remove();
    });
    card.appendChild(del);

    return card;
  }

  async function load() {
    const res = await fetch('/admin/api/data');
    if (res.status === 401) { window.location.href = '/admin/login'; return; }
    const json = await res.json();
    const cards = document.getElementById('cards');
    const empty = document.getElementById('empty');
    cards.innerHTML = '';

    if (!json.ok || !json.accesses.length) { empty.hidden = false; return; }
    empty.hidden = true;
    json.accesses.forEach((a) => cards.appendChild(renderCard(a)));
  }

  function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.getAttribute('data-target'));
        if (!input) return;
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
          const prev = btn.textContent;
          btn.textContent = '¡Copiado!';
          setTimeout(() => { btn.textContent = prev; }, 1500);
        }).catch(() => {});
      });
    });
  }

  function setupGenerator() {
    const btn = document.getElementById('gen-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const label = document.getElementById('gen-label').value.trim();
      const activation = document.getElementById('gen-activation').checked;
      try {
        const r = await fetch('/admin/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, activation }),
        });
        const json = await r.json();
        if (json.ok) {
          const result = document.getElementById('gen-result');
          document.getElementById('gen-url').value = json.url;
          const keyWrap = document.getElementById('gen-key-wrap');
          if (json.activationKey) {
            document.getElementById('gen-key').value = json.activationKey;
            keyWrap.hidden = false;
          } else {
            keyWrap.hidden = true;
          }
          result.hidden = false;
          document.getElementById('gen-label').value = '';
          load();
        }
      } finally {
        btn.disabled = false;
      }
    });
  }

  setupCopyButtons();
  setupGenerator();
  load();
})();
