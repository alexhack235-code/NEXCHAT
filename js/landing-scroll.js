/* ═══════════════════════════════════════════════════════════════════════
   NEXCHAT Landing — Scroll Engine
   Lenis smooth scroll + GSAP ScrollTrigger + Canvas Hero
   ═══════════════════════════════════════════════════════════════════════ */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── 1. LENIS SMOOTH SCROLL ───
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
});

// Sync Lenis → GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ─── 2. CANVAS HERO (Gradient placeholder — swap for frame sequence later) ───
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

function sizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

// Scroll progress drives canvas visuals
let heroProgress = { value: 0 };

function drawHeroFrame(progress) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Deep void base
  ctx.fillStyle = '#050811';
  ctx.fillRect(0, 0, w, h);

  // Animated radial glow 1 (emerald)
  const r1 = 200 + progress * 400;
  const g1 = ctx.createRadialGradient(
    w * (0.3 + progress * 0.2), h * (0.4 - progress * 0.15), 0,
    w * (0.3 + progress * 0.2), h * (0.4 - progress * 0.15), r1
  );
  g1.addColorStop(0, `rgba(0, 240, 118, ${0.25 - progress * 0.15})`);
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  // Animated radial glow 2 (cyan)
  const r2 = 180 + progress * 350;
  const g2 = ctx.createRadialGradient(
    w * (0.7 - progress * 0.15), h * (0.6 + progress * 0.1), 0,
    w * (0.7 - progress * 0.15), h * (0.6 + progress * 0.1), r2
  );
  g2.addColorStop(0, `rgba(0, 212, 255, ${0.18 - progress * 0.1})`);
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);

  // Grid lines (subtle, fade with scroll)
  const gridOpacity = Math.max(0, 0.06 - progress * 0.06);
  if (gridOpacity > 0.002) {
    ctx.strokeStyle = `rgba(0, 240, 118, ${gridOpacity})`;
    ctx.lineWidth = 1;
    const spacing = 60;
    for (let x = 0; x < w; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  // Floating particles
  const numParticles = 20;
  const time = Date.now() * 0.001;
  for (let i = 0; i < numParticles; i++) {
    const seed = i * 137.508;
    const px = (Math.sin(seed + time * 0.3) * 0.5 + 0.5) * w;
    const py = (Math.cos(seed * 0.7 + time * 0.2 + progress * 5) * 0.5 + 0.5) * h;
    const size = 1.5 + Math.sin(seed) * 1;
    const alpha = Math.max(0, (0.5 - progress * 0.4) * (0.3 + Math.sin(time + seed) * 0.3));
    ctx.fillStyle = i % 3 === 0
      ? `rgba(0, 212, 255, ${alpha})`
      : `rgba(0, 240, 118, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Animate canvas on scroll
function animateCanvas() {
  drawHeroFrame(heroProgress.value);
  requestAnimationFrame(animateCanvas);
}
animateCanvas();

// ─── 3. PIN HERO + SCRUB CANVAS ───
const heroSection = document.getElementById('hero');

ScrollTrigger.create({
  trigger: heroSection,
  start: 'top top',
  end: 'bottom bottom',
  pin: '#hero-canvas',
  pinSpacing: false,
  scrub: true,
  onUpdate: (self) => {
    heroProgress.value = self.progress;
  }
});

// Pin hero content too (fade out as you scroll)
ScrollTrigger.create({
  trigger: heroSection,
  start: 'top top',
  end: '+=100%',
  pin: '.hero-content',
  pinSpacing: false,
});

gsap.to('.hero-content', {
  opacity: 0,
  y: -80,
  ease: 'none',
  scrollTrigger: {
    trigger: heroSection,
    start: '30% top',
    end: '60% top',
    scrub: true,
  }
});

// ─── 4. HERO TEXT REVEALS ───
const heroTl = gsap.timeline({ delay: 0.3 });

heroTl
  .to('.hero-eyebrow', {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power3.out',
    from: { y: 20 }
  })
  .to('.hero-title-line', {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.15,
    ease: 'power3.out',
  }, '-=0.4')
  .to('.hero-sub', {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power3.out',
  }, '-=0.5')
  .to('.hero-scroll-hint', {
    opacity: 1,
    duration: 0.6,
    ease: 'power2.out',
  }, '-=0.3');

// Set initial states
gsap.set('.hero-eyebrow', { opacity: 0, y: 20 });
gsap.set('.hero-title-line', { opacity: 0, y: 30 });
gsap.set('.hero-sub', { opacity: 0, y: 20 });
gsap.set('.hero-scroll-hint', { opacity: 0 });

// ─── 5. PARALLAX ORBS ───
document.querySelectorAll('.hero-orb').forEach((orb) => {
  const speed = parseFloat(orb.dataset.speed) || 0.5;
  gsap.to(orb, {
    yPercent: -60 * speed,
    ease: 'none',
    scrollTrigger: {
      trigger: heroSection,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    }
  });
});

// ─── 6. SCROLL-TRIGGERED REVEALS (all [data-reveal] elements) ───
function initScrollReveals() {
  const revealElements = document.querySelectorAll('[data-reveal]');

  revealElements.forEach((el) => {
    const delay = parseFloat(el.dataset.delay) || 0;

    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      }
    );
  });
}
initScrollReveals();

// ─── 7. FEATURE & ECO CARDS STAGGER ───
function initCardStagger(selector) {
  const cards = document.querySelectorAll(selector);
  if (!cards.length) return;

  gsap.fromTo(cards,
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: cards[0].parentElement,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      }
    }
  );
}
initCardStagger('.feature-card');
initCardStagger('.eco-card');

// ─── 8. PHONE MOCKUP PARALLAX ───
const parallaxElements = document.querySelectorAll('[data-parallax]');
parallaxElements.forEach((el) => {
  const speed = parseFloat(el.dataset.speed) || 0.2;
  gsap.to(el, {
    yPercent: -30 * speed * 100,
    ease: 'none',
    scrollTrigger: {
      trigger: el.closest('section'),
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    }
  });
});

// ─── 9. COUNTER ANIMATION (stat numbers) ───
document.querySelectorAll('[data-count]').forEach((el) => {
  const target = parseInt(el.dataset.count, 10);
  const obj = { val: 0 };

  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to(obj, {
        val: target,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.round(obj.val);
        }
      });
    }
  });
});

// ─── 10. NAV GLASS EFFECT ON SCROLL ───
ScrollTrigger.create({
  start: 80,
  onUpdate: (self) => {
    const nav = document.getElementById('landing-nav');
    if (self.direction === 1 && window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else if (window.scrollY <= 80) {
      nav.classList.remove('scrolled');
    }
  }
});

// ─── 11. CTA SECTION REVEAL ───
gsap.fromTo('.cta-content',
  { opacity: 0, y: 50, scale: 0.96 },
  {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.cta-section',
      start: 'top 75%',
      toggleActions: 'play none none reverse',
    }
  }
);

// ─── 12. CLEANUP ON PAGE UNLOAD ───
window.addEventListener('beforeunload', () => {
  ScrollTrigger.getAll().forEach(t => t.kill());
  lenis.destroy();
});

console.log('🟢 NEXCHAT Landing — Scroll engine initialized');
