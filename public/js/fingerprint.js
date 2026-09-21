/**
 * Recolecta señales del navegador para construir una huella de dispositivo.
 * NO identifica el modelo físico del equipo: es una barrera probabilística.
 * El hash real se calcula en el servidor a partir de estas señales.
 */
(function () {
  'use strict';

  async function collectDeviceSignals() {
    const nav = navigator;
    const screenInfo = window.screen || {};

    let uaPlatform = '';
    let uaMobile = '';
    // userAgentData no está en todos los navegadores.
    if (nav.userAgentData) {
      uaPlatform = nav.userAgentData.platform || '';
      uaMobile = typeof nav.userAgentData.mobile === 'boolean' ? String(nav.userAgentData.mobile) : '';
    }

    let timezone = '';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (_) { /* noop */ }

    return {
      userAgent: nav.userAgent || '',
      platform: nav.platform || '',
      uaPlatform,
      uaMobile,
      language: nav.language || '',
      languages: (nav.languages || []).join(','),
      timezone,
      hardwareConcurrency: nav.hardwareConcurrency || '',
      deviceMemory: nav.deviceMemory || '',
      screen: `${screenInfo.width || 0}x${screenInfo.height || 0}`,
      colorDepth: screenInfo.colorDepth || '',
      touch: (('ontouchstart' in window) || (nav.maxTouchPoints > 0)) ? '1' : '0',
    };
  }

  window.collectDeviceSignals = collectDeviceSignals;
})();
