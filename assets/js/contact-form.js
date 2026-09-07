/* ==========================================================================
   contact-form.js — validatie en verzending van het contactformulier.
   Laadt alleen op contact.html.

   ┌─ HIER STEL JE IN WAAR HET FORMULIER NAARTOE GAAT ────────────────────┐
   │ ENDPOINT leeg laten  → de mailclient van de bezoeker opent met een   │
   │                        volledig ingevuld bericht. Werkt vandaag, en  │
   │                        vereist geen account of server.               │
   │ ENDPOINT invullen    → het bericht wordt op de achtergrond verstuurd │
   │                        en de bezoeker blijft op de pagina. Zet hier  │
   │                        je Formspree-, Web3Forms- of Netlify-URL.     │
   └──────────────────────────────────────────────────────────────────────┘

   Zonder JavaScript blijft het formulier werken: het valt dan terug op de
   gewone HTML-submit naar het adres in het action-attribuut.
   ========================================================================== */
(function () {
  'use strict';

  var ENDPOINT = '';
  var MAIL_TO = 'info@landvangaasbeek.be';

  var form = document.getElementById('contactForm');
  if (!form) return;

  var statusEl = document.getElementById('formStatus');
  var submitBtn = form.querySelector('button[type="submit"]');

  // JS is beschikbaar: we nemen de submit over van de browser.
  form.setAttribute('novalidate', 'novalidate');

  // — Regels per veld. Elk veld valideert zichzelf. —
  var RULES = {
    naam: function (v) {
      if (!v) return 'Vul je naam in.';
      if (v.length < 2) return 'Dat lijkt wat kort — vul je volledige naam in.';
      return null;
    },
    email: function (v) {
      if (!v) return 'Vul je e-mailadres in, zodat we kunnen antwoorden.';
      // Bewust ruim: precies genoeg om typfouten te vangen, niet om
      // geldige exotische adressen te weigeren.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Controleer je e-mailadres — er lijkt een tikfout in te zitten.';
      return null;
    },
    telefoon: function (v) {
      if (!v) return null; // optioneel
      var digits = v.replace(/[^\d]/g, '');
      if (digits.length < 8) return 'Een telefoonnummer heeft minstens 8 cijfers.';
      if (digits.length > 15) return 'Dat zijn te veel cijfers voor een telefoonnummer.';
      return null;
    },
    bericht: function (v) {
      if (!v) return 'Schrijf hier je vraag of bericht.';
      if (v.length < 10) return 'Vertel iets meer, dan kunnen we je beter helpen.';
      return null;
    }
  };

  function fieldWrap(input) {
    return input.closest ? input.closest('.field') : null;
  }

  function showError(input, message) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    var msgEl = wrap.querySelector('.field-error');
    if (msgEl) msgEl.textContent = message;
    wrap.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
  }

  function validateField(input) {
    var rule = RULES[input.name];
    if (!rule) return true;
    var error = rule(input.value.trim());
    if (error) { showError(input, error); return false; }
    clearError(input);
    return true;
  }

  // Fout pas tonen bij verlaten van het veld, en meteen weer opruimen
  // zodra de bezoeker corrigeert. Niemand wil rood zien tijdens het typen.
  Object.keys(RULES).forEach(function (name) {
    var input = form.elements[name];
    if (!input) return;
    input.addEventListener('blur', function () { validateField(input); });
    input.addEventListener('input', function () {
      if (fieldWrap(input) && fieldWrap(input).classList.contains('has-error')) clearError(input);
    });
  });

  function setStatus(kind, html) {
    if (!statusEl) return;
    statusEl.className = 'form-status is-visible is-' + kind;
    statusEl.innerHTML = html;
    statusEl.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.className = 'form-status';
    statusEl.innerHTML = '';
  }

  function busy(on) {
    if (!submitBtn) return;
    if (on) {
      submitBtn.dataset.label = submitBtn.textContent;
      submitBtn.textContent = 'Versturen…';
      submitBtn.setAttribute('aria-busy', 'true');
    } else {
      if (submitBtn.dataset.label) submitBtn.textContent = submitBtn.dataset.label;
      submitBtn.removeAttribute('aria-busy');
    }
  }

  function values() {
    return {
      naam: (form.elements.naam.value || '').trim(),
      email: (form.elements.email.value || '').trim(),
      telefoon: (form.elements.telefoon.value || '').trim(),
      bericht: (form.elements.bericht.value || '').trim()
    };
  }

  function sendByMailClient(v) {
    var body =
      'Naam: ' + v.naam + '\n' +
      'E-mail: ' + v.email + '\n' +
      'Telefoon: ' + (v.telefoon || 'niet opgegeven') + '\n\n' +
      v.bericht + '\n';

    var href = 'mailto:' + MAIL_TO +
      '?subject=' + encodeURIComponent('Bericht via de website — ' + v.naam) +
      '&body=' + encodeURIComponent(body);

    window.location.href = href;

    setStatus('success',
      '<strong>Bijna klaar.</strong> Je mailprogramma opent met het bericht al ingevuld — ' +
      'je hoeft het enkel nog te versturen. Opent er niets? Mail ons dan rechtstreeks op ' +
      '<a href="mailto:' + MAIL_TO + '">' + MAIL_TO + '</a>.');
  }

  function sendByEndpoint(v) {
    busy(true);
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(v)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      setStatus('success',
        '<strong>Bedankt, ' + v.naam.split(' ')[0].replace(/[<>&]/g, '') + '.</strong> ' +
        'Je bericht is verstuurd — we antwoorden zo snel mogelijk, meestal binnen de dag.');
    }).catch(function () {
      setStatus('error',
        '<strong>Het versturen lukte niet.</strong> Probeer het straks opnieuw, of bereik ons ' +
        'rechtstreeks op <a href="tel:+32476273406">+32 476 27 34 06</a> of ' +
        '<a href="mailto:' + MAIL_TO + '">' + MAIL_TO + '</a>.');
    }).then(function () {
      busy(false);
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearStatus();

    // Honeypot: alleen bots vullen dit onzichtbare veld in.
    if (form.elements.website && form.elements.website.value) return;

    var firstBad = null;
    Object.keys(RULES).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      if (!validateField(input) && !firstBad) firstBad = input;
    });

    if (firstBad) {
      setStatus('error', 'Er ontbreekt nog iets — kijk de aangeduide velden even na.');
      firstBad.focus();
      return;
    }

    var v = values();
    if (ENDPOINT) sendByEndpoint(v);
    else sendByMailClient(v);
  });
})();
