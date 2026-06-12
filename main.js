/* ============================================================
   Prime Plumbing LA — interactions & scroll choreography
   (GSAP + ScrollTrigger + Lenis)
   ============================================================ */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // If the animation libraries failed to load, leave the static page fully visible.
  if (!window.gsap || !window.ScrollTrigger) {
    const loaderEl = document.getElementById("loader");
    if (loaderEl) loaderEl.style.display = "none";
    return;
  }

  document.body.classList.add("js");
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -60, duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const hash = a.getAttribute("href");
      if (hash.length > 1) {
        e.preventDefault();
        scrollToTarget(hash);
        navLinks.classList.remove("is-open");
        burger.classList.remove("is-open");
      }
    });
  });

  /* ---------- Loader ---------- */
  const loader = document.getElementById("loader");
  const loaderFill = document.getElementById("loaderFill");
  const loaderCount = document.getElementById("loaderCount");
  const progress = { v: 0 };

  const introTl = gsap.timeline({ paused: true });

  gsap.to(progress, {
    v: 100,
    duration: reduceMotion ? 0.01 : 1.6,
    ease: "power2.inOut",
    onUpdate() {
      loaderCount.textContent = Math.round(progress.v);
      loaderFill.style.width = progress.v + "%";
    },
    onComplete() {
      gsap.to(loader, {
        yPercent: -100,
        duration: 0.9,
        ease: "power4.inOut",
        onComplete: () => {
          loader.style.display = "none";
          introTl.play();
        },
      });
    },
  });

  /* ---------- Hero intro ---------- */
  // Split headline lines into characters for a staggered rise.
  document.querySelectorAll("#heroTitle .line").forEach((line) => {
    const text = line.textContent;
    line.textContent = "";
    [...text].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "char";
      span.innerHTML = ch === " " ? "&nbsp;" : ch;
      line.appendChild(span);
    });
  });

  if (reduceMotion) {
    introTl.set("#heroTitle .char, .hero [data-reveal]", { opacity: 1, y: 0 });
  } else {
    gsap.set("#heroTitle .char", { yPercent: 120, rotate: 4 });
    introTl
      .to("#heroTitle .char", {
        yPercent: 0,
        rotate: 0,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.035,
      })
      .to(
        ".hero [data-reveal]",
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 },
        "-=0.7"
      );
  }

  /* ---------- Scroll reveals ---------- */
  if (!reduceMotion) {
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      if (el.closest(".hero")) return; // handled by intro timeline
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
  } else {
    gsap.set("[data-reveal]", { opacity: 1, y: 0 });
  }

  /* ---------- Stat counters ---------- */
  document.querySelectorAll(".stat-num").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: reduceMotion ? 0.01 : 2,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
      onUpdate() {
        el.textContent = prefix + Math.round(obj.v).toLocaleString() + suffix;
      },
    });
  });

  /* ---------- Horizontal process section ---------- */
  const track = document.getElementById("processTrack");
  const pin = document.getElementById("processPin");
  if (track && !reduceMotion) {
    const getDistance = () => Math.max(0, track.scrollWidth - pin.clientWidth + 96);
    gsap.to(track, {
      x: () => -getDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: "#process",
        start: "top top",
        end: () => "+=" + (getDistance() + window.innerHeight * 0.4),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  /* ---------- Nav: hide on scroll down ---------- */
  const nav = document.getElementById("nav");
  const navLinks = document.getElementById("navLinks");
  const burger = document.getElementById("navBurger");
  let lastY = 0;

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate(self) {
      const y = self.scroll();
      if (y > lastY && y > 220 && !navLinks.classList.contains("is-open")) {
        nav.classList.add("nav-hidden");
      } else {
        nav.classList.remove("nav-hidden");
      }
      lastY = y;
    },
  });

  burger.addEventListener("click", () => {
    navLinks.classList.toggle("is-open");
    burger.classList.toggle("is-open");
  });

  /* ---------- Service card spotlight follows mouse ---------- */
  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* ---------- Magnetic buttons ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.3;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * strength,
          y: (e.clientY - r.top - r.height / 2) * strength,
          duration: 0.4,
          ease: "power3.out",
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.getElementById("cursor");
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const target = { x: pos.x, y: pos.y };
    window.addEventListener("pointermove", (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
    });
    gsap.ticker.add(() => {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      cursor.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
    });
    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-active"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
    });
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById("contactForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    if (!name || !phone) {
      gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return;
    }
    // No backend in this static build — hook up your booking endpoint here.
    document.getElementById("formSuccess").classList.add("is-visible");
    form.querySelector('button[type="submit"]').disabled = true;
  });
})();
