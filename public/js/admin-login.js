(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  if (params.get('error')) {
    const el = document.getElementById('loginError');
    if (el) el.classList.add('show');
  }
})();
