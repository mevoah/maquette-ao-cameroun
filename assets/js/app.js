/* AO Cameroun — comportements d'interface. Aucun framework, aucune dépendance. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- thème clair / sombre ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    $$('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(t === 'dark'));
      b.setAttribute('aria-label', t === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre');
      var l = $('.ic-light', b), d = $('.ic-dark', b);
      if (l && d) { l.classList.toggle('hide', t === 'dark'); d.classList.toggle('hide', t !== 'dark'); }
    });
  }
  var saved = store.get('ao-theme');
  applyTheme(saved || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]');
    if (!b) return;
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    store.set('ao-theme', next); applyTheme(next);
  });

  /* ---------- en-tête collant ---------- */
  var hdr = $('.hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('stuck', window.scrollY > 8); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- méga-menu ---------- */
  var openMega = null;
  function closeMega() { if (openMega) { openMega.panel.classList.remove('open'); openMega.btn.setAttribute('aria-expanded', 'false'); openMega = null; } }
  $$('[data-mega]').forEach(function (li) {
    var btn = $('.navlink', li), panel = $('.mega', li);
    if (!btn || !panel) return;
    var open = function () { if (openMega && openMega.panel !== panel) closeMega(); panel.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); openMega = { btn: btn, panel: panel }; };
    btn.addEventListener('click', function (e) { e.preventDefault(); (panel.classList.contains('open') ? closeMega : open)(); });
    li.addEventListener('mouseenter', open);
    li.addEventListener('mouseleave', closeMega);
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) closeMega(); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMega(); closeDrawer(); } });
  document.addEventListener('click', function (e) { if (openMega && !e.target.closest('[data-mega]')) closeMega(); });

  /* ---------- tiroir mobile ---------- */
  var drawer = $('#drawer');
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open'); document.body.style.overflow = '';
    $$('[data-drawer-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }
  $$('[data-drawer-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!drawer) return;
      var isOpen = drawer.classList.toggle('open');
      document.body.style.overflow = isOpen ? 'hidden' : '';
      b.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) { var f = $('a,button', drawer); if (f) f.focus(); }
    });
  });
  $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', closeDrawer); });
  $$('.acc-t').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.nextElementSibling, open = p.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
      var ic = $('.ic', b); if (ic) ic.style.transform = open ? 'rotate(45deg)' : '';
    });
  });

  /* ---------- accordéons de contenu ---------- */
  $$('.acc button').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.nextElementSibling;
      var open = p.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- apparition au défilement ---------- */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.rv').forEach(function (el) { io.observe(el); });
  } else { $$('.rv').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- compteurs ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1100, t0 = null;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = target.toLocaleString('fr-FR') + suffix; return; }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString('fr-FR') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); io2.unobserve(en.target); } });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(function (el) { io2.observe(el); });
  } else { $$('[data-count]').forEach(countUp); }

  /* ---------- compte à rebours ---------- */
  $$('[data-countdown]').forEach(function (el) {
    var target = new Date(el.getAttribute('data-countdown')).getTime();
    if (isNaN(target)) return;
    var units = [['j', 86400000], ['h', 3600000], ['min', 60000]];
    function tick() {
      var d = target - Date.now();
      if (d <= 0) { el.innerHTML = '<div class="cd-u"><b>—</b><span>en cours</span></div>'; return; }
      var html = '';
      units.forEach(function (u) { var v = Math.floor(d / u[1]); d -= v * u[1]; html += '<div class="cd-u"><b>' + v + '</b><span>' + u[0] + '</span></div>'; });
      el.innerHTML = html;
    }
    tick(); setInterval(tick, 30000);
  });

  /* ---------- filtres de sessions ---------- */
  var list = $('[data-filter-list]');
  if (list) {
    var items = $$('[data-item]', list);
    var counter = $('[data-filter-count]');
    var inputs = $$('[data-filter]');
    var chips = $$('[data-chip]');
    function apply() {
      var crit = {};
      inputs.forEach(function (i) { if (i.value && i.value !== '*') crit[i.getAttribute('data-filter')] = i.value; });
      chips.forEach(function (c) { if (c.getAttribute('aria-pressed') === 'true') crit[c.getAttribute('data-chip')] = c.getAttribute('data-value'); });
      var q = ($('[data-filter-q]') || {}).value || '';
      q = q.trim().toLowerCase();
      var n = 0;
      items.forEach(function (it) {
        var ok = Object.keys(crit).every(function (k) { return (it.getAttribute('data-' + k) || '') === crit[k]; });
        if (ok && q) ok = (it.textContent || '').toLowerCase().indexOf(q) > -1;
        it.classList.toggle('hide', !ok);
        if (ok) n++;
      });
      if (counter) counter.textContent = n;
      var empty = $('[data-empty]');
      if (empty) empty.classList.toggle('hide', n > 0);
    }
    inputs.forEach(function (i) { i.addEventListener('change', apply); });
    var qi = $('[data-filter-q]'); if (qi) qi.addEventListener('input', apply);
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var group = c.getAttribute('data-chip');
        var wasOn = c.getAttribute('aria-pressed') === 'true';
        chips.filter(function (x) { return x.getAttribute('data-chip') === group; })
             .forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', String(!wasOn));
        apply();
      });
    });
    var reset = $('[data-filter-reset]');
    if (reset) reset.addEventListener('click', function () {
      inputs.forEach(function (i) { i.value = '*'; });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      if (qi) qi.value = '';
      apply();
    });
    apply();
  }

  /* ---------- vérification d'attestation (démonstration) ---------- */
  var vf = $('#verif-form');
  if (vf) {
    var DEMO = {
      'AOC-2026-4K7P-9QX2': { nom: 'Dr [Prénom NOM]', cours: 'Ostéosynthèse des fractures proximales du fémur',
        dates: '[JJ–JJ mois 2026]', lieu: 'Yaoundé', statut: 'valide' },
      'AOC-2025-2M4T-8RB1': { nom: 'Dr [Prénom NOM]', cours: 'Principes du traitement non opératoire',
        dates: '[JJ–JJ mois 2025]', lieu: 'Garoua', statut: 'revoquee' }
    };
    vf.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = ($('#verif-code').value || '').trim().toUpperCase();
      var out = $('#verif-out');
      out.className = 'verif-out';
      var r = DEMO[code];
      if (r && r.statut === 'valide') {
        out.classList.add('ok');
        out.innerHTML = '<p class="eyebrow" style="color:var(--green-600)">Attestation valide</p>' +
          '<p class="d4" style="margin:10px 0 14px">' + r.cours + '</p>' +
          '<p class="sm" style="margin:0">Délivrée à <strong>' + r.nom + '</strong> · ' + r.dates + ' · ' + r.lieu + '</p>';
      } else if (r) {
        out.classList.add('ko');
        out.innerHTML = '<p class="eyebrow" style="color:var(--red)">Attestation révoquée</p>' +
          '<p class="sm" style="margin:10px 0 0">Ce code correspond à une attestation retirée par l’association. Contactez le secrétariat.</p>';
      } else {
        out.classList.add('ko');
        out.innerHTML = '<p class="eyebrow" style="color:var(--red)">Attestation non reconnue</p>' +
          '<p class="sm" style="margin:10px 0 0">Aucune attestation ne correspond à ce code. Vérifiez la saisie, ou écrivez à contact@ao-cameroun.org.</p>';
      }
      out.setAttribute('tabindex', '-1'); out.focus();
    });
  }

  /* ---------- formulaires de démonstration ---------- */
  $$('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = f.querySelector('[data-demo-msg]');
      if (msg) { msg.classList.remove('hide'); msg.setAttribute('tabindex', '-1'); msg.focus(); }
    });
  });

  /* ---------- année courante ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });



  /* ---- diaporama d'accueil ---- */
  $$('[data-hs]').forEach(function (hs) {
    var slides = $$('.hs-slide', hs), dots = $$('.hs-dot', hs), n = 0, timer = null;
    if (slides.length < 2) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(i) {
      n = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === n); });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', String(k === n)); });
    }
    function start() { if (!reduce) { stop(); timer = setInterval(function () { show(n + 1); }, 7000); } }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); start(); }); });
    var prev = $('[data-hs-prev]', hs), next = $('[data-hs-next]', hs);
    if (prev) prev.addEventListener('click', function () { show(n - 1); start(); });
    if (next) next.addEventListener('click', function () { show(n + 1); start(); });
    hs.addEventListener('mouseenter', stop);
    hs.addEventListener('mouseleave', start);
    hs.addEventListener('focusin', stop);
    hs.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    hs.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(n - 1); start(); }
      if (e.key === 'ArrowRight') { show(n + 1); start(); }
    });
    start();
  });

})();
