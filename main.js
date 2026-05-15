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
   HERO INGREDIENT CARD INTERACTION (home page only)
═══════════════════════════════════════════════════ */

const flavorData = {
  caramel:  { name: 'Caramel Cold Foam Latte',  price: '$8.50' },
  vanilla:  { name: 'Vanilla Bean Cloud Latte',  price: '$8.00' },
  hazelnut: { name: 'Hazelnut Espresso Frost',   price: '$8.75' },
  cinnamon: { name: 'Cinnamon Spice Cold Brew',  price: '$7.50' },
};

function initHeroCards() {
  const cards = document.querySelectorAll('.ingredient-card');
  if (!cards.length) return;

  let activeCard = null;
  let isAnimating = false;

  /* ─ Initial staggered reveal ─ */
  cards.forEach((card, i) => {
    const flavor = card.dataset.flavor;
    const baseDelay = 650;
    const stagger = i * 130;

    setTimeout(() => {
      card.classList.remove('state-behind');
      if (flavor === 'caramel') {
        card.classList.add('state-active');
        activeCard = card;
      } else {
        card.classList.add('state-rest');
      }
    }, baseDelay + stagger);
  });

  /* ─ Click interaction ─ */
  function switchCard(newCard) {
    if (!activeCard || newCard === activeCard || isAnimating) return;
    isAnimating = true;

    const prev = activeCard;

    // Both cards retreat behind the drink simultaneously
    prev.classList.remove('state-active');
    prev.classList.add('state-behind');

    newCard.classList.remove('state-rest');
    newCard.classList.add('state-behind');

    // New card emerges as active
    setTimeout(() => {
      newCard.classList.remove('state-behind');
      newCard.classList.add('state-active');
      activeCard = newCard;

      updateDrinkInfo(newCard.dataset.flavor);

      // Previous card returns to resting orbit
      setTimeout(() => {
        prev.classList.remove('state-behind');
        prev.classList.add('state-rest');
        isAnimating = false;
      }, 260);
    }, 420);
  }

  cards.forEach(card => {
    card.addEventListener('click', () => switchCard(card));
  });
}

function updateDrinkInfo(flavor) {
  const data = flavorData[flavor];
  const nameEl  = document.querySelector('.drink-name-display');
  const priceEl = document.querySelector('.price-value');

  if (nameEl) {
    nameEl.style.opacity = '0';
    setTimeout(() => {
      nameEl.textContent = data.name;
      nameEl.style.opacity = '1';
    }, 190);
  }
  if (priceEl) {
    priceEl.style.opacity = '0';
    setTimeout(() => {
      priceEl.textContent = data.price;
      priceEl.style.opacity = '1';
    }, 190);
  }
}

// Only init on home page
if (document.querySelector('.ingredient-card')) {
  // Wait for loader to start fading
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
