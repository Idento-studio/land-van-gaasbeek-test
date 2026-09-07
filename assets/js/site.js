/* ==========================================================================
   site.js — progressive enhancement voor de hele site.
   Alles is optioneel: zonder JS blijft de pagina volledig leesbaar.
   Home-specifieke hooks (sticky bar, nudge, hero-parallax) doen niets
   op pagina's waar die elementen niet bestaan.
   ========================================================================== */
(function () {
  document.documentElement.classList.add('js');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fade/settle-in on scroll (content itself is never opacity:0 — see .reveal CSS)
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && els.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // Count-up numbers (stat row), once each, while visible
  var counters = document.querySelectorAll('[data-count-to]');
  if ('IntersectionObserver' in window && counters.length) {
    var countIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIo.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        if (reducedMotion) { el.textContent = target + suffix; return; }
        var start = null;
        var duration = 1100;
        function step(ts) {
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { countIo.observe(el); });
  }

  // Thin scroll progress bar
  var progressFill = document.getElementById('progressFill');
  var heroEl = document.getElementById('hero');
  var heroPhoto = document.getElementById('heroPhoto');
  var heroImg = heroPhoto ? heroPhoto.querySelector('img') : null;
  var stickyBar = document.getElementById('stickyBar');
  var gerechtenEl = document.getElementById('gerechten');
  var nudgeEl = document.getElementById('nudge');
  var nudgeShown = false;
  var nudgeDismissed = false;
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop;
      var scrollable = (doc.scrollHeight - doc.clientHeight) || 1;
      if (progressFill) progressFill.style.transform = 'scaleX(' + Math.min(scrollTop / scrollable, 1) + ')';

      if (heroEl) {
        var heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
        if (stickyBar) stickyBar.classList.toggle('is-visible', scrollTop > heroBottom - 120);

        if (!reducedMotion && heroImg && scrollTop < heroBottom) {
          var shift = Math.min(scrollTop * 0.08, 28);
          heroImg.style.transform = 'translateY(' + shift + 'px)';
        }
      }

      if (gerechtenEl && !nudgeShown && !nudgeDismissed) {
        var gerechtenBottom = gerechtenEl.offsetTop + gerechtenEl.offsetHeight;
        if (scrollTop > gerechtenBottom) {
          nudgeShown = true;
          if (nudgeEl) nudgeEl.classList.add('is-visible');
        }
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var nudgeClose = document.getElementById('nudgeClose');
  if (nudgeClose && nudgeEl) {
    nudgeClose.addEventListener('click', function () {
      nudgeDismissed = true;
      nudgeEl.classList.remove('is-visible');
    });
  }
})();
