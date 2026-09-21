'use strict';

/*
 * Notificaciones instantáneas.
 *
 * El objetivo es que, en cuanto ocurra algo importante (abrió el enlace, abrió
 * la confesión, respondió), te llegue un aviso AL MOMENTO a tu teléfono/correo.
 * Así, aunque el hosting reinicie o borre la base de datos, tú ya tienes la
 * respuesta guardada en tu chat o tu bandeja de entrada.
 *
 * Se activa solo si configuras alguno de estos canales en el .env. Puedes usar
 * uno o varios a la vez. Si no configuras ninguno, la app funciona igual, solo
 * que sin avisos (todo queda en la base de datos, como antes).
 *
 *   Telegram:  TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 *   Discord:   DISCORD_WEBHOOK_URL
 *   Email:     RESEND_API_KEY + NOTIFY_EMAIL_TO + NOTIFY_EMAIL_FROM
 *
 * Todo se envía en segundo plano: si un canal falla, no afecta a la experiencia.
 */

const env = process.env;

const channels = {
  telegram: !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
  discord: !!env.DISCORD_WEBHOOK_URL,
  email: !!(env.RESEND_API_KEY && env.NOTIFY_EMAIL_TO && env.NOTIFY_EMAIL_FROM),
};

const anyEnabled = channels.telegram || channels.discord || channels.email;

async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  });
}

async function sendDiscord(text) {
  await fetch(env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
  });
}

async function sendEmail(subject, text) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.NOTIFY_EMAIL_FROM,
      to: env.NOTIFY_EMAIL_TO,
      subject,
      text,
    }),
  });
}

/*
 * notify({ subject, text }) — dispara en segundo plano, nunca lanza.
 */
function notify({ subject, text }) {
  if (!anyEnabled) return;
  const full = subject ? `${subject}\n${text}` : text;

  const jobs = [];
  if (channels.telegram) jobs.push(sendTelegram(full));
  if (channels.discord) jobs.push(sendDiscord(full));
  if (channels.email) jobs.push(sendEmail(subject || 'Rosa amarilla', text));

  Promise.allSettled(jobs).then((results) => {
    results.forEach((r) => {
      if (r.status === 'rejected') {
        console.error('[notify] fallo al enviar aviso:', r.reason && r.reason.message);
      }
    });
  });
}

module.exports = { notify, channels, anyEnabled };
