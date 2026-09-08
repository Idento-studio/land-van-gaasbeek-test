/* ==========================================================================
   cookie-consent.js — eigen, lichte cookiebanner (geen externe library).
   Laadt op elke pagina, vóór analytics.js. Zolang niemand kiest, laadt er
   niets van Google — pas na een klik op "Accepteren" gaat analytics.js aan.

   Bewaart de keuze in localStorage. Onderaan elke pagina staat een link met
   [data-cookie-settings] waarmee een bezoeker zijn keuze kan herzien.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'lvg-cookie-consent';
  var banner = null;

  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* privénavigatie o.i.d. — negeren */ }
    window.lvgConsent = value;
  }

  window.lvgConsent = getConsent();

  function removeBanner() {
    if (!banner) return;
    banner.classList.remove('is-visible');
    var toRemove = banner;
    setTimeout(function () { if (toRemove.parentNode) toRemove.parentNode.removeChild(toRemove); }, 450);
    banner = null;
  }

  function buildBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookievoorkeuren');
    banner.innerHTML =
      '<p>We gebruiken enkel anonieme, analytische cookies om te begrijpen hoe bezoekers deze site gebruiken. Lees ons ' +
      '<a href="privacy.html">privacybeleid</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-outline" data-cookie-choice="rejected">Weigeren</button>' +
      '<button type="button" class="btn btn-primary" data-cookie-choice="accepted">Accepteren</button>' +
      '</div>';
    document.body.appendChild(banner);
    requestAnimationFrame(function () { banner.classList.add('is-visible'); });

    banner.addEventListener('click', function (event) {
      var btn = event.target.closest ? event.target.closest('[data-cookie-choice]') : null;
      if (!btn) return;
      var choice = btn.getAttribute('data-cookie-choice');
      setConsent(choice);
      removeBanner();
      if (choice === 'accepted') {
        window.dispatchEvent(new Event('lvg:consent-accepted'));
      }
    });
  }

  function init() {
    if (!window.lvgConsent) {
      buildBanner();
    } else if (window.lvgConsent === 'accepted') {
      window.dispatchEvent(new Event('lvg:consent-accepted'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Laat bezoekers hun keuze achteraf wijzigen via de footer-link.
  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('[data-cookie-settings]') : null;
    if (!link) return;
    event.preventDefault();
    try { localStorage.removeItem(KEY); } catch (e) { /* negeren */ }
    window.lvgConsent = null;
    buildBanner();
  });
})();
