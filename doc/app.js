/* ============================================================
   PIXORA DOC 1 — Shared App Logic
   ============================================================ */

'use strict';

// === PAGE LOADER ===
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('pageLoader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 500);
    }
    triggerFadeUps();
  }, 650);
});

// === SCROLL FADE-UPS ===
function triggerFadeUps() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// === STICKY NAV ===
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }, { passive: true });
}

// === MOBILE HAMBURGER ===
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');
if (hamburger && navMobile) {
  hamburger.addEventListener('click', () => {
    const isOpen = navMobile.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    const spans = hamburger.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMobile.contains(e.target)) {
      navMobile.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
      const spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
}

// === TOAST NOTIFICATION ===
window.showToast = function(msg, duration = 3200) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), duration);
};

// === STAT COUNTER ANIMATION ===
function animateCounters() {
  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const step = 16;
    const increment = (target / duration) * step;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      el.textContent = Math.round(current).toLocaleString() + suffix;
      if (current >= target) clearInterval(timer);
    }, step);
  });
}

// Trigger counters when hero is visible
const heroSection = document.querySelector('.hero');
if (heroSection) {
  const heroObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      setTimeout(animateCounters, 400);
      heroObserver.disconnect();
    }
  }, { threshold: 0.2 });
  heroObserver.observe(heroSection);
}

// === SYMPTOM CHECKER ===
const symptomTags = document.getElementById('symptomTags');
const symptomResult = document.getElementById('symptomResult');
const symptomStep1 = document.getElementById('symptomStep1');
const resetSymptoms = document.getElementById('resetSymptoms');

const specialistDescriptions = {
  'Cardiologist': 'Specializes in heart health, blood pressure, arrhythmias, and cardiovascular disease.',
  'Neurologist': 'Focuses on conditions affecting the brain, spinal cord, and nervous system.',
  'Pulmonologist': 'Expert in lung conditions, breathing disorders, and respiratory health.',
  'Gastroenterologist': 'Treats digestive system issues including the stomach, intestines, and liver.',
  'Orthopedist': 'Specializes in bones, joints, muscles, and musculoskeletal injuries.',
  'Dermatologist': 'Diagnoses and treats skin, hair, and nail conditions.',
  'ENT Specialist': 'Focuses on ear, nose, throat, and head and neck conditions.',
  'Endocrinologist': 'Expert in hormonal disorders, diabetes, thyroid, and metabolism.',
  'Ophthalmologist': 'Specializes in eye health and vision conditions.',
  'Primary Care': 'Your first point of contact for general health concerns and wellness.',
  'Psychologist': 'Supports mental health, anxiety, depression, and emotional wellbeing.',
};

const specialistEmojis = {
  'Cardiologist': '❤️', 'Neurologist': '🧠', 'Pulmonologist': '🫁',
  'Gastroenterologist': '🏥', 'Orthopedist': '🦴', 'Dermatologist': '🔬',
  'ENT Specialist': '👂', 'Endocrinologist': '⚡', 'Ophthalmologist': '👁️',
  'Primary Care': '🌡️', 'Psychologist': '🌧️',
};

if (symptomTags) {
  let selected = [];

  symptomTags.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('active');
      const specialist = tag.dataset.specialist;
      if (tag.classList.contains('active')) {
        selected.push(specialist);
      } else {
        selected = selected.filter(s => s !== specialist);
      }

      if (selected.length >= 1) {
        // Find most common specialist
        const freq = {};
        selected.forEach(s => freq[s] = (freq[s] || 0) + 1);
        const top = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];

        document.getElementById('specialistName').textContent = top;
        document.getElementById('specialistNameBtn').textContent = top;
        document.getElementById('specialistIcon').textContent = specialistEmojis[top] || '🩺';
        document.getElementById('specialistDesc').textContent = specialistDescriptions[top] || '';

        symptomStep1.style.display = 'block';
        symptomResult.classList.add('visible');
      } else {
        symptomResult.classList.remove('visible');
      }
    });
  });
}

if (resetSymptoms) {
  resetSymptoms.addEventListener('click', () => {
    document.querySelectorAll('#symptomTags .tag').forEach(t => t.classList.remove('active'));
    symptomResult.classList.remove('visible');
  });
}

// === FAQ ACCORDION ===
document.querySelectorAll('.faq-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.faq-item');
    const body = item.querySelector('.faq-body');
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    // Close all others
    document.querySelectorAll('.faq-item').forEach(i => {
      i.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
      i.querySelector('.faq-body').classList.remove('open');
    });

    if (!isOpen) {
      trigger.setAttribute('aria-expanded', 'true');
      body.classList.add('open');
    }
  });
});

// === AUTO-RESIZE TEXTAREA ===
document.querySelectorAll('textarea').forEach(ta => {
  ta.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 140) + 'px';
  });
});

// === SMOOTH SCROLL TO SECTION ===
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) + 20;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});
