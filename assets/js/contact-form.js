/* ==========================================================================
   contact-form.js — validatie en verzending van élk formulier met het
   [data-ajax-form] attribuut op deze site (het reserveringsformulier op de
   homepage én het contactformulier op /contact/ delen deze logica).

   ┌─ HIER STEL JE IN WAAR FORMULIEREN NAARTOE GAAN ───────────────────────┐
   │ ENDPOINT leeg laten  → de mailclient van de bezoeker opent met een    │
   │                        volledig ingevuld bericht. Werkt vandaag, en   │
   │                        vereist geen account of server.                │
   │ ENDPOINT invullen    → het bericht wordt op de achtergrond verstuurd  │
   │                        en de bezoeker blijft op de pagina. Zet hier   │
   │                        je Formspree-, Web3Forms- of Netlify-URL.      │
   │                        (Formspree: maak gratis een account op         │
   │                        formspree.io, koppel het e-mailadres van de    │
   │                        zaak, en plak de endpoint-URL hieronder.)      │
   └──────────────────────────────────────────────────────────────────────┘

   Zonder JavaScript blijft het contactformulier werken via de gewone HTML-
   submit naar het mailto-action-attribuut. Het reserveringsformulier op de
   homepage heeft geen action (het bestaat pas dankzij JS) — vandaar de
   zichtbare <noscript>-melding daar met telefoon en e-mail.
   ========================================================================== */
(function () {
  'use strict';

  var ENDPOINT = '';
  var MAIL_TO = 'info@landvangaasbeek.be';

  var forms = document.querySelectorAll('[data-ajax-form]');
  if (!forms.length) return;

  // — Validatieregels per veldnaam. Een regel wordt enkel toegepast op een
  //   formulier als dat formulier ook effectief een veld met die naam heeft. —
  var RULES = {
    naam: function (v) {
      if (!v) return 'Vul je naam in.';
      if (v.length < 2) return 'Dat lijkt wat kort — vul je volledige naam in.';
      return null;
    },
    email: function (v) {
      if (!v) return 'Vul je e-mailadres in, zodat we kunnen antwoorden.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Controleer je e-mailadres — er lijkt een tikfout in te zitten.';
      return null;
    },
    telefoon: function (v, input) {
      if (!v) return input.hasAttribute('required') ? 'Vul je telefoonnummer in.' : null;
      var digits = v.replace(/[^\d]/g, '');
      if (digits.length < 8) return 'Een telefoonnummer heeft minstens 8 cijfers.';
      if (digits.length > 15) return 'Dat zijn te veel cijfers voor een telefoonnummer.';
      return null;
    },
    bericht: function (v, input) {
      if (!v) return input.hasAttribute('required') ? 'Schrijf hier je vraag of bericht.' : null;
      if (v.length < 10) return 'Vertel iets meer, dan kunnen we je beter helpen.';
      return null;
    },
    datum: function (v) {
      if (!v) return 'Kies een gewenste datum.';
      return null;
    },
    personen: function (v) {
      if (!v) return 'Vul aan met hoeveel personen jullie komen.';
      if (parseInt(v, 10) < 1) return 'Minstens 1 persoon, uiteraard.';
      return null;
    }
  };

  Array.prototype.forEach.call(forms, initForm);

  function initForm(form) {
    var statusEl = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    form.setAttribute('novalidate', 'novalidate');

    function fieldWrap(input) { return input.closest ? input.closest('.field') : null; }

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
      var error = rule((input.value || '').trim(), input);
      if (error) { showError(input, error); return false; }
      clearError(input);
      return true;
    }

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

    // Verzamelt elk benoemd, niet-verborgen veld dat effectief in dit
    // formulier bestaat (dus nooit het honeypot-veld "website").
    var FIELD_ORDER = ['naam', 'email', 'telefoon', 'datum', 'personen', 'bericht'];
    var FIELD_LABELS = {
      naam: 'Naam', email: 'E-mail', telefoon: 'Telefoon',
      datum: 'Gewenste datum', personen: 'Aantal personen', bericht: 'Bericht'
    };
    function values() {
      var v = {};
      FIELD_ORDER.forEach(function (name) {
        var input = form.elements[name];
        if (input) v[name] = (input.value || '').trim();
      });
      return v;
    }

    function sendByMailClient(v) {
      var lines = [];
      FIELD_ORDER.forEach(function (name) {
        if (v[name] === undefined) return;
        if (name === 'bericht') return; // apart onderaan toevoegen
        lines.push(FIELD_LABELS[name] + ': ' + (v[name] || 'niet opgegeven'));
      });
      var body = lines.join('\n') + (v.bericht ? '\n\n' + v.bericht : '') + '\n';

      var href = 'mailto:' + MAIL_TO +
        '?subject=' + encodeURIComponent('Bericht via de website — ' + (v.naam || 'nieuwe aanvraag')) +
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
        var firstName = (v.naam || '').split(' ')[0].replace(/[<>&]/g, '') || 'Bedankt';
        setStatus('success',
          '<strong>Bedankt' + (v.naam ? ', ' + firstName : '') + '.</strong> ' +
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
  }
})();
