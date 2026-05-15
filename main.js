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
   HERO INGREDIENT ORBIT (home page only)
   Cards rotate continuously around the drink in a
   slow elliptical orbit — passing behind it as they
   cross through center. Click any card to select it.
═══════════════════════════════════════════════════ */

const flavorData = {
  caramel:  { name: 'Caramel Cold Foam Latte',  price: '$8.50' },
  vanilla:  { name: 'Vanilla Bean Cloud Latte',  price: '$8.00' },
  hazelnut: { name: 'Hazelnut Espresso Frost',   price: '$8.75' },
  cinnamon: { name: 'Cinnamon Spice Cold Brew',  price: '$7.50' },
};

// Orbit radius scales with viewport so cards never clip off-screen
function getOrbitDims() {
  const w = window.innerWidth;
  if (w < 480) return { rx: 126, ry: 36 };
  if (w < 768) return { rx: 156, ry: 42 };
  if (w < 1100) return { rx: 215, ry: 48 };
  return { rx: 262, ry: 52 };
}

// ~18-second full orbit — slow and cinematic
const ORBIT_SPEED = 0.000349; // rad/ms  (2π / 18 000)

// Starting angles: spread cards evenly around the circle.
// angle=0 → rightmost, π/2 → back, π → leftmost, 3π/2 → front
const CARD_OFFSETS = [
  0,              // caramel  → right side on load
  Math.PI / 2,    // vanilla  → back (passes behind drink)
  Math.PI,        // hazelnut → left side
  Math.PI * 1.5,  // cinnamon → front
];

function initHeroCards() {
  const cards = document.querySelectorAll('.ingredient-card');
  if (!cards.length) return;

  let dims        = getOrbitDims();
  let startTime   = null;
  let activeIndex = 0; // caramel starts selected

  // Strip CSS state classes; JS drives all transforms from here
  cards.forEach(card => {
    card.classList.remove('state-behind', 'state-rest', 'state-active');
    card.style.opacity    = '0';
    // Keep only non-transform transitions so JS can update transform every frame
    card.style.transition = 'box-shadow 300ms ease, opacity 700ms ease';
  });

  // Fade cards in after the page loader clears
  setTimeout(() => {
    cards.forEach(c => { c.style.opacity = '1'; });
    cards[activeIndex].classList.add('active-glow');
  }, 750);

  /* ── rAF orbit loop ── */
  function tick(ts) {
    if (!startTime) startTime = ts;
    const base = (ts - startTime) * ORBIT_SPEED;

    cards.forEach((card, i) => {
      const a    = base + CARD_OFFSETS[i];
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);

      // x: left↔right sweep   y: slight depth rise/fall
      const x = cosA * dims.rx;
      const y = sinA * dims.ry;

      // sinA: −1 = front-of-orbit, +1 = back-of-orbit (behind drink)
      // depth 0→1 drives scale and z-index
      const depth = (sinA + 1) / 2;
      const scale = 1.0 - depth * 0.15;   // 1.0 (front) → 0.85 (back)

      // Cards in the back half sit under the drink; front half sit above peer cards
      card.style.zIndex = sinA < 0 ? '8' : '4';

      // Tilt follows the horizontal arc naturally
      const tilt = cosA * 9;

      card.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${tilt}deg)`;
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // Recalculate on resize
  window.addEventListener('resize', () => { dims = getOrbitDims(); }, { passive: true });

  /* ── Click: select card + crossfade drink info ── */
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
