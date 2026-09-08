/* ==========================================================================
   analytics.js — laadt Google Analytics 4, maar UITSLUITEND nadat een
   bezoeker cookies heeft geaccepteerd via cookie-consent.js. Niets van
   Google raakt de pagina voor die toestemming er is (GDPR).

   ┌─ HIER STEL JE JE GA4-METING-ID IN ────────────────────────────────────┐
   │ 1. Ga naar https://analytics.google.com → maak (of open) een property │
   │    voor landvangaasbeek.be.                                           │
   │ 2. Admin → Datastreams → Web → jouw stream → kopieer de "Meet-ID",    │
   │    iets als G-ABC1234XYZ.                                             │
   │ 3. Plak die hieronder in plaats van 'G-XXXXXXXXXX'.                   │
   │ Zolang hier de placeholder staat, doet dit bestand bewust NIETS.      │
   └─────────────────────────────────────────────────────────────────────────┘
   ========================================================================== */
(function () {
  'use strict';

  var GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

  function isConfigured() {
    return GA_MEASUREMENT_ID && GA_MEASUREMENT_ID.indexOf('XXXX') === -1;
  }

  function loadGoogleAnalytics() {
    if (!isConfigured() || window.__lvgGaLoaded) return;
    window.__lvgGaLoaded = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    // anonymize_ip: extra privacywaarborg bovenop wat GA4 al standaard doet.
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  if (window.lvgConsent === 'accepted') loadGoogleAnalytics();
  window.addEventListener('lvg:consent-accepted', loadGoogleAnalytics);
})();
