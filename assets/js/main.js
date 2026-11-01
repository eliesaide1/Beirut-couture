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

      /* Should the film be running right now? Only if it is on screen and
         the tab is actually in front. */
      var inView  = true;
      var wantsPlay = function () { return inView && !document.hidden; };

      /* Safari refuses to go on forever if autoplay is blocked, so cap the
         retries rather than nagging in a loop. Reset whenever playback
         genuinely starts, or when the reader comes back to the tab. */
      var tries = 0;

      var start = function () {
        if (!wantsPlay() || !reel.paused || tries > 8) return;
        tries++;
        var go = reel.play();
        if (go && go.then) {
          go.then(function () { tries = 0; })
            .catch(function () { /* autoplay refused — poster stands */ });
        }
      };

      /* `is-playing` fades the film in over the poster, so it must only go on
         once frames are genuinely moving. Latching it on the play() CALL meant
         a refused or stalled reel hid the poster behind a frozen frame. */
      reel.addEventListener('playing', function () {
        tries = 0;
        reel.classList.add('is-playing');
      });

      /* Defensive, not a reproduced bug: a UA may pause the reel on its own
         (Low Power Mode, a media interruption). The IntersectionObserver
         below only fires when intersection CHANGES, so with the hero already
         in view there would otherwise be nothing to restart the film. */
      reel.addEventListener('pause', function () {
        if (wantsPlay()) setTimeout(start, 150);
      });

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) return;
        tries = 0;
        start();
      });

      /* Listeners FIRST. A cached file can reach canplay before the next
         statement runs, and a listener attached afterwards would never hear
         it — the film would sit invisible behind the poster for good. */
      reel.addEventListener('canplay', start);
      reel.addEventListener('loadeddata', start);

      var pick = function () {
        var want = portrait.matches ? reel.dataset.srcSmall : reel.dataset.src;
        if (reel.getAttribute('src') === want) return;
        reel.setAttribute('src', want);
        reel.load();
      };

      pick();

      /* And if it was ready before any of that, nothing will fire. Start it. */
      if (reel.readyState >= 2) start();

      if (portrait.addEventListener) portrait.addEventListener('change', pick);
      else if (portrait.addListener) portrait.addListener(pick);

      /* Stop decoding while the reel is off screen. */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            inView = e.isIntersecting;
            if (inView) { tries = 0; start(); }
            else if (!reel.paused) { reel.pause(); }
          });
        }, { threshold: 0.1 }).observe(reel);
      }
    }
  }

  /* ---- Introductory film ------------------------------------------------ *
   * Plays on its own, muted, only while it is on screen — so it neither
   * downloads nor runs before it is seen. Reduced-motion readers get the
   * poster and the controls instead. Without JS the controls still work.
   * ---------------------------------------------------------------------- */
  var films = document.querySelectorAll('video[data-autoplay]');
  if (films.length && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var filmObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var film = e.target;
        if (e.isIntersecting) {
          var go = film.play();
          if (go && go.catch) go.catch(function () { /* blocked — poster and controls stand */ });
        } else if (!film.paused) {
          film.pause();
        }
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(films, function (film) { filmObserver.observe(film); });
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
      var link = e.target.closest('a');
      if (!link) return;
      setMenu(false);

      /* On the home page, menu links to its own sections scroll in place
         instead of reloading it. From any other page they navigate normally. */
      var m = /^index\.html#(.+)$/.exec(link.getAttribute('href') || '');
      var target = m && document.getElementById('top') && document.getElementById(m[1]);
      if (target) {
        e.preventDefault();
        target.scrollIntoView();
        if (history.pushState) history.pushState(null, '', '#' + m[1]);
      }
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

  /* ---- Disclosure: a photograph that opens the piece beneath it --------- *
   * The Banet Beirut group shot is the control for its own editorial: the
   * text and the individual portraits stay closed until it is clicked. The
   * panel uses the `hidden` attribute, so with JavaScript off it is simply
   * open and everything reads as a normal page.
   * ---------------------------------------------------------------------- */
  var discControls = document.querySelectorAll('[data-disclosure]');

  if (discControls.length) {
    /* JS is running, so start closed. Without this the panel would be open
       for the first paint and then snap shut, and readers with JS disabled
       keep the whole piece. */
    discControls.forEach(function (c) {
      var panel = document.getElementById(c.getAttribute('data-disclosure'));
      if (panel) panel.hidden = true;
    });

    var setDisclosure = function (id, open) {
      var panel = document.getElementById(id);
      if (!panel) return;
      panel.hidden = !open;

      document.querySelectorAll('[data-disclosure="' + id + '"]').forEach(function (c) {
        if (c.hasAttribute('aria-expanded')) c.setAttribute('aria-expanded', String(open));
        if (c.classList.contains('disclosure__hint')) {
          c.textContent = open ? (c.dataset.labelOpen || 'Close')
                               : (c.dataset.labelClosed || 'Read the editorial');
        }
      });

      /* Scroll reveals inside the panel never intersected while it was
         hidden; show them outright rather than wait for a scroll. */
      if (open) {
        panel.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
      }
    };

    var toggleFrom = function (control) {
      var id = control.getAttribute('data-disclosure');
      var panel = document.getElementById(id);
      if (panel) setDisclosure(id, panel.hidden);
    };

    document.addEventListener('click', function (e) {
      var c = e.target.closest('[data-disclosure]');
      if (c) toggleFrom(c);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var c = e.target.closest && e.target.closest('[data-disclosure][role="button"]');
      if (!c) return;
      e.preventDefault();
      toggleFrom(c);
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

    /* Photographs are div[role=button]: Enter or Space opens them too. */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target.closest && e.target.closest('div[data-lightbox][role="button"]');
      if (t && !box.classList.contains('is-open')) { e.preventDefault(); open(t); }
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
  Array.prototype.forEach.call(document.querySelectorAll('[data-inquiry-form]'), function (form) {
    var status = form.querySelector('.form__status');
    var submit = form.querySelector('[type="submit"]');
    var label  = submit ? submit.textContent : '';

    var say = function (message) {
      if (!status) return;
      status.textContent = message;
      status.classList.add('is-visible');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* The form carries `novalidate`, which suppresses the browser's own
         prompts — so the check has to be made here. Without it a completely
         empty form was answered with "your enquiry has been received", and
         once a real endpoint is set it would POST blank enquiries. */
      form.classList.add('was-validated');
      if (!form.checkValidity()) {
        var firstBad = form.querySelector(':invalid');
        say('Please complete the highlighted fields.');
        if (firstBad && firstBad.focus) {
          firstBad.focus();
          if (firstBad.scrollIntoView) {
            firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        return;
      }

      var action = form.getAttribute('action') || '';
      var configured = action && action.indexOf('REPLACE') === -1;

      if (!configured) {
        say('Thank you. Your enquiry has been received — we reply within two working days.');
        form.reset();
        form.classList.remove('was-validated');
        return;
      }

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
          form.classList.remove('was-validated');
        })
        .catch(function () {
          say('Something interrupted the send. Please write to us directly at christinaiskandarr@gmail.com.');
        })
        .then(function () {
          if (submit) { submit.disabled = false; submit.textContent = label; }
        });
    });
  });

  /* ---- Concierge tabs --------------------------------------------------- *
   * One service at a time, with its photograph. Arrow keys move between
   * tabs; #bridal / #couture / #jewelry in the URL open that tab.
   * ---------------------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-tabs]'), function (root) {
    var tabs   = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
    var photos = Array.prototype.slice.call(root.querySelectorAll('[data-tab-photo]'));

    var show = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.dataset.tab === id;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach(function (p) { p.hidden = p.id !== 'panel-' + id; });
      photos.forEach(function (p) {
        var on = p.dataset.tabPhoto === id;
        p.classList.toggle('is-active', on);
        /* Fine Jewelry is a film rather than a photograph: run it only while
           its tab is open, so it is not decoding behind the other two. */
        if (p.tagName === 'VIDEO') {
          if (on) { var go = p.play(); if (go && go.catch) go.catch(function () {}); }
          else { p.pause(); }
        }
      });
    };

    root.classList.add('is-ready');
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        var to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1
               : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
        if (to === null) return;
        e.preventDefault();
        show(tabs[(to + tabs.length) % tabs.length].dataset.tab, true);
      });
    });

    var fromHash = (location.hash || '').replace('#', '');
    show(tabs.some(function (t) { return t.dataset.tab === fromHash; }) ? fromHash : tabs[0].dataset.tab);
  });

  /* ---- Mark current page in nav ---------------------------------------- */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.drawer__nav a').forEach(function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
})();
