/* ═══════════════════════════════════════════════════
   PIXORA CAFE 1 — main.js
   Shared across all pages
═══════════════════════════════════════════════════ */

/* ─── Custom Cursor ─── */
const cursorDot = document.createElement('div');
cursorDot.className = 'cursor-dot';
document.body.appendChild(cursorDot);

let cursorX = 0, cursorY = 0;
let dotX = 0, dotY = 0;
let rafId = null;

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  cursorDot.classList.remove('cursor-hidden');
});

document.addEventListener('mouseleave', () => cursorDot.classList.add('cursor-hidden'));

(function animateCursor() {
  dotX += (cursorX - dotX) * 0.14;
  dotY += (cursorY - dotY) * 0.14;
  cursorDot.style.left = dotX + 'px';
  cursorDot.style.top  = dotY + 'px';
  requestAnimationFrame(animateCursor);
})();

function bindCursorHover(selector) {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('cursor-hover'));
  });
}
bindCursorHover('a, button, .ingredient-card, .drink-card, .menu-card, .platform-card, .value-card, .stat-pill, .form-submit');

/* ─── Page Loader ─── */
const loader = document.querySelector('.page-loader');
if (loader) {
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('loaded'), 380);
  });
  // Fallback
  setTimeout(() => loader && loader.classList.add('loaded'), 2000);
}

/* ─── Navigation ─── */
const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navOverlay = document.getElementById('navOverlay');

if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

if (hamburger && navOverlay) {
  const openOverlay = () => {
    hamburger.classList.add('open');
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeOverlay = () => {
    hamburger.classList.remove('open');
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => {
    navOverlay.classList.contains('open') ? closeOverlay() : openOverlay();
  });

  navOverlay.querySelectorAll('a').forEach(link => link.addEventListener('click', closeOverlay));

  document.querySelector('.nav-overlay-close')?.addEventListener('click', closeOverlay);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOverlay();
  });
}

/* ─── Active Nav Link ─── */
const currentFile = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-overlay-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentFile || (currentFile === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

/* ─── Scroll Reveal ─── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ═══════════════════════════════════════════════════
   HERO INGREDIENT CAROUSEL (home page only)
   Cards drift slowly left in an infinite horizontal
   loop — fanning out on each side of the drink and
   passing behind it as they cross the centre.
═══════════════════════════════════════════════════ */

const flavorData = {
  caramel:  { name: 'Caramel Cold Foam Latte',  price: '$8.50' },
  vanilla:  { name: 'Vanilla Bean Cloud Latte',  price: '$8.00' },
  hazelnut: { name: 'Hazelnut Espresso Frost',   price: '$8.75' },
  cinnamon: { name: 'Cinnamon Spice Cold Brew',  price: '$7.50' },
};

// Gap between card centres + hide/fade zones — all responsive
function getCarouselDims() {
  const w = window.innerWidth;
  if (w < 480)  return { gap: 88,  hideR: 50, fadeEdge: 152, speed: 10 };
  if (w < 768)  return { gap: 112, hideR: 58, fadeEdge: 192, speed: 11 };
  if (w < 1100) return { gap: 150, hideR: 65, fadeEdge: 262, speed: 12 };
  return               { gap: 190, hideR: 74, fadeEdge: 328, speed: 12 }; // px/s
}

function initHeroCards() {
  const cards = document.querySelectorAll('.ingredient-card');
  if (!cards.length) return;

  const N = cards.length; // 4
  let dims        = getCarouselDims();
  let t0          = null;
  let activeIndex = 0; // caramel starts selected

  // Hand transform control entirely to JS
  cards.forEach(card => {
    card.classList.remove('state-behind', 'state-rest', 'state-active');
    card.style.opacity    = '0';
    card.style.transition = 'box-shadow 300ms ease, opacity 600ms ease';
  });

  // Fade in after loader clears
  setTimeout(() => {
    cards.forEach(c => { c.style.opacity = '1'; });
    cards[activeIndex].classList.add('active-glow');
  }, 750);

  /* ── Animation loop ── */
  function tick(ts) {
    if (!t0) t0 = ts;
    const elapsed = (ts - t0) / 1000; // seconds
    const LOOP    = dims.gap * N;      // total wrap distance (e.g. 760px)
    const drift   = (elapsed * dims.speed) % LOOP;

    cards.forEach((card, i) => {
      // Evenly-spaced start positions: −1.5g, −0.5g, +0.5g, +1.5g
      const initX = (i - (N - 1) / 2) * dims.gap;
      let x = initX - drift;

      // Wrap smoothly into [−LOOP/2, +LOOP/2)
      x = ((x % LOOP) + LOOP + LOOP / 2) % LOOP - LOOP / 2;

      const absX = Math.abs(x);

      // ── Opacity ──
      // Fade out near drink centre (behind it) and at the far wrap edges
      const cFade = absX < dims.hideR
        ? Math.max(0, (absX - dims.hideR * 0.2) / (dims.hideR * 0.8))
        : 1;
      const eFade = absX > dims.fadeEdge
        ? Math.max(0, 1 - (absX - dims.fadeEdge) / (dims.gap * 0.55))
        : 1;
      card.style.opacity = (cFade * eFade).toFixed(3);

      // ── Z-index: behind drink when crossing centre ──
      card.style.zIndex = absX < dims.hideR ? '4' : '8';

      // norm: 0 = inner position, 1 = outer/edge
      const norm = Math.min(absX / dims.fadeEdge, 1);

      // Slight scale: inner cards fractionally larger
      const scale = 1.0 - norm * 0.11;

      // Tilt: cards lean outward from centre
      const tilt = -(x / (LOOP / 2)) * 13;

      // Y-arc: outer cards rise slightly, like a gentle fan
      const y = -(norm * norm) * 28;

      card.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${tilt}deg)`;
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  window.addEventListener('resize', () => { dims = getCarouselDims(); }, { passive: true });

  /* ── Click: highlight card + update drink info ── */
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (i === activeIndex) return;
      cards[activeIndex].classList.remove('active-glow');
      activeIndex = i;
      card.classList.add('active-glow');
      updateDrinkInfo(card.dataset.flavor);
    });
  });
}

function updateDrinkInfo(flavor) {
  const data    = flavorData[flavor];
  const nameEl  = document.querySelector('.drink-name-display');
  const priceEl = document.querySelector('.price-value');
  if (nameEl) {
    nameEl.style.opacity = '0';
    setTimeout(() => { nameEl.textContent = data.name;  nameEl.style.opacity  = '1'; }, 190);
  }
  if (priceEl) {
    priceEl.style.opacity = '0';
    setTimeout(() => { priceEl.textContent = data.price; priceEl.style.opacity = '1'; }, 190);
  }
}

if (document.querySelector('.ingredient-card')) {
  setTimeout(initHeroCards, 100);
}

/* ─── Contact Form ─── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    const original = btn.textContent;
    btn.textContent = 'Message sent ✓';
    btn.style.background = '#6B9E5A';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      contactForm.reset();
    }, 3000);
  });
}
