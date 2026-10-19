/* Beirut Couture — progressive enhancement only. Nothing here is load-bearing. */
(function () {
  'use strict';

  var root = document.body;

  /* ---- Header: solid once past the fold edge ---------------------------- */
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-solid', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Hero reel -------------------------------------------------------- *
   * Loaded only when it is welcome: not on reduced-motion, not on a metered
   * or slow connection. The poster still is already painted underneath, so
   * the reel fades in when it can genuinely play and is never a black frame.
   * ---------------------------------------------------------------------- */
  var reel = document.querySelector('[data-hero-reel]');
  if (reel) {
    var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var conn     = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var thrifty  = !!(conn && (conn.saveData || /^(slow-)?2g$/.test(conn.effectiveType || '')));

    if (motionOK && !thrifty) {
      /* Match the film's aspect to the viewport's, so a portrait screen never
         gets a landscape cut squeezed into it. Width alone misses tablets. */
      var portrait = window.matchMedia('(orientation: portrait)');

      var pick = function () {
        var want = portrait.matches ? reel.dataset.srcSmall : reel.dataset.src;
        if (reel.getAttribute('src') === want) return;
        reel.setAttribute('src', want);
        reel.load();
      };

      pick();

      if (portrait.addEventListener) portrait.addEventListener('change', pick);
      else if (portrait.addListener) portrait.addListener(pick);

      reel.addEventListener('canplay', function () {
        var go = reel.play();
        if (go && go.catch) go.catch(function () { /* autoplay refused — poster stands */ });
        reel.classList.add('is-playing');
      });

      /* Stop decoding while the reel is off screen. */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { if (reel.paused) reel.play().catch(function () {}); }
            else if (!reel.paused) { reel.pause(); }
          });
        }, { threshold: 0.1 }).observe(reel);
      }
    }
  }

  /* ---- Mobile drawer ---------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.querySelector('.drawer');

  if (toggle && drawer) {
    var setMenu = function (open) {
      root.classList.toggle('is-menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
    };

    setMenu(false);

    toggle.addEventListener('click', function () {
      setMenu(!root.classList.contains('is-menu-open'));
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---- Reveal on scroll ------------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---- Portfolio filter ------------------------------------------------- */
  var filters = document.querySelector('[data-filters]');
  if (filters) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));

    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;

      var want = btn.dataset.filter;

      filters.querySelectorAll('button[data-filter]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });

      items.forEach(function (item) {
        var match = want === 'all' || item.dataset.category === want;
        item.hidden = !match;
        if (match) item.classList.add('is-in');
      });
    });
  }

  /* ---- Lightbox --------------------------------------------------------- */
  var box = document.querySelector('.lightbox');
  if (box) {
    var stage   = box.querySelector('.lightbox__stage');
    var caption = box.querySelector('[data-lightbox-caption]');
    var counter = box.querySelector('[data-lightbox-counter]');
    var sources = [];
    var index   = 0;

    var collect = function () {
      sources = Array.prototype.slice
        .call(document.querySelectorAll('[data-lightbox]'))
        .filter(function (el) { return !el.closest('[hidden]'); });
    };

    var render = function () {
      var el  = sources[index];
      if (!el) return;
      var img = el.querySelector('img');

      stage.innerHTML = '';
      var full = document.createElement('img');
      full.src = img.dataset.full || img.currentSrc || img.src;
      full.alt = img.alt;
      stage.appendChild(full);

      if (caption) caption.textContent = el.dataset.lightbox || '';
      if (counter) counter.textContent = (index + 1) + ' / ' + sources.length;
    };

    var open = function (el) {
      collect();
      index = sources.indexOf(el);
      if (index < 0) index = 0;
      render();
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      root.style.overflow = 'hidden';
    };

    var close = function () {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      root.style.overflow = '';
    };

    var step = function (dir) {
      if (!sources.length) return;
      index = (index + dir + sources.length) % sources.length;
      render();
    };

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-lightbox]');
      if (trigger) { e.preventDefault(); open(trigger); }
    });

    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-lightbox-close]')) return close();
      if (e.target.closest('[data-lightbox-prev]'))  return step(-1);
      if (e.target.closest('[data-lightbox-next]'))  return step(1);
      if (e.target === box || e.target.closest('.lightbox__stage') === e.target) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowLeft')  step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---- Inquiry form ----------------------------------------------------- *
   * Posts to the endpoint in the form's `action`. Until you set a real one
   * (Formspree / Netlify Forms), it resolves locally so the flow is testable.
   * ---------------------------------------------------------------------- */
  var form = document.querySelector('[data-inquiry-form]');
  if (form) {
    var status = form.querySelector('.form__status');
    var submit = form.querySelector('[type="submit"]');

    var say = function (message) {
      if (!status) return;
      status.textContent = message;
      status.classList.add('is-visible');
    };

    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action') || '';
      var configured = action && action.indexOf('REPLACE') === -1;

      if (!configured) {
        e.preventDefault();
        say('Thank you. Your enquiry has been received — we reply within two working days.');
        form.reset();
        return;
      }

      e.preventDefault();
      if (submit) { submit.disabled = true; submit.textContent = 'Sending'; }

      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          say('Thank you. Your enquiry has been received — we reply within two working days.');
          form.reset();
        })
        .catch(function () {
          say('Something interrupted the send. Please write to us directly at atelier@beirutcouture.com.');
        })
        .then(function () {
          if (submit) { submit.disabled = false; submit.textContent = 'Submit enquiry'; }
        });
    });
  }

  /* ---- Mark current page in nav ---------------------------------------- */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a, .drawer__nav a').forEach(function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
})();
