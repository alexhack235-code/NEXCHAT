/* ═══════════════════════════════════════════════════════════════════════
   NEXCHAT Landing — Scroll & Cinematic Video-Animation Interactive Engine
   Lenis smooth scroll + GSAP ScrollTrigger + High-Performance Canvas
   + Dual-Phone Quantum Handshake + 360° 3D Turn-Around + Chat Banter
   + In-Phone Group Creation + 1:1 Voice Calling + 1:1 Status Editor
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

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ─── 2. HIGH-PERFORMANCE VIDEO-LIKE CANVAS HERO ───
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

function sizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

let heroProgress = { value: 0 };
let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener('mousemove', (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
});

// Particles network for cyber mesh
const NUM_PARTICLES = 36;
const particles = [];
for (let i = 0; i < NUM_PARTICLES; i++) {
  particles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    radius: Math.random() * 2 + 1,
    color: i % 2 === 0 ? '#00ff88' : '#00d4ff',
  });
}

// ─── THEME MANAGER (LIGHT / DARK) ───
let currentTheme = localStorage.getItem('nexchat_landing_theme') || 'dark';

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('nexchat_landing_theme', theme);

  if (particles && particles.length) {
    particles.forEach((p, idx) => {
      p.color = theme === 'light' 
        ? (idx % 2 === 0 ? '#00b359' : '#0284c7')
        : (idx % 2 === 0 ? '#00ff88' : '#00d4ff');
    });
  }
}
applyTheme(currentTheme);

const themeToggleBtn = document.getElementById('themeToggleBtn');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    playCyberClick();
  });
}

// ═══════════════════════════════════════════════════════════════════
// CYBER AUDIO SYNTHESIZER ENGINE (Zero-Latency Web Audio API)
// ═══════════════════════════════════════════════════════════════════
let audioCtx = null;
let sfxEnabled = true;

function initCyberAudio() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

window.addEventListener('click', initCyberAudio, { once: true });
window.addEventListener('keydown', initCyberAudio, { once: true });

function playCyberClick() {
  if (!sfxEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch(e) {}
}

function playHoverHum() {
  if (!sfxEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.05);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch(e) {}
}

function playShockwaveBoom() {
  if (!sfxEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch(e) {}
}

function playTurnaroundWhoosh() {
  if (!sfxEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.5);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch(e) {}
}

function playTypeBlip() {
  if (!sfxEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100 + Math.random() * 400, now);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  } catch(e) {}
}

const cyberSfxToggleBtn = document.getElementById('cyberSfxToggleBtn');
const sfxStatusText = document.getElementById('sfxStatusText');
if (cyberSfxToggleBtn) {
  cyberSfxToggleBtn.addEventListener('click', () => {
    initCyberAudio();
    sfxEnabled = !sfxEnabled;
    cyberSfxToggleBtn.classList.toggle('muted', !sfxEnabled);
    if (sfxStatusText) {
      sfxStatusText.textContent = sfxEnabled ? 'SFX: ON' : 'SFX: OFF';
    }
    if (sfxEnabled) playCyberClick();
  });
}


function drawHeroFrame(progress) {
  const w = canvas.width;
  const h = canvas.height;
  const time = Date.now() * 0.0015;
  const isLight = currentTheme === 'light';

  ctx.clearRect(0, 0, w, h);

  // 1. Base
  ctx.fillStyle = isLight ? '#f4f7fb' : '#050811';
  ctx.fillRect(0, 0, w, h);

  // 2. Dynamic Traveling Perspective Waves (Cyber Grid)
  const gridAlpha = Math.max(0.01, 0.08 - progress * 0.06);
  ctx.strokeStyle = isLight 
    ? `rgba(0, 160, 70, ${gridAlpha * 1.8})` 
    : `rgba(0, 255, 136, ${gridAlpha})`;
  ctx.lineWidth = 1;
  const gridSize = 65;
  const offsetY = (time * 15) % gridSize;

  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = offsetY; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 3. Ambient Reactive Glow Orbs
  const glow1 = ctx.createRadialGradient(
    mousePos.x * 0.3 + w * 0.3, mousePos.y * 0.3 + h * 0.2, 0,
    mousePos.x * 0.3 + w * 0.3, mousePos.y * 0.3 + h * 0.2, 350 + progress * 200
  );
  glow1.addColorStop(0, isLight ? `rgba(0, 180, 85, ${0.14 - progress * 0.08})` : `rgba(0, 255, 136, ${0.2 - progress * 0.12})`);
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, w, h);

  const glow2 = ctx.createRadialGradient(
    w * 0.7, h * 0.65, 0,
    w * 0.7, h * 0.65, 300 + progress * 150
  );
  glow2.addColorStop(0, isLight ? `rgba(2, 132, 199, ${0.11 - progress * 0.06})` : `rgba(0, 212, 255, ${0.16 - progress * 0.1})`);
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);

  // 4. Interactive Connected Particles
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.55 - progress * 0.4;
    ctx.fill();

    // Connect close neighbors
    for (let j = i + 1; j < NUM_PARTICLES; j++) {
      const p2 = particles[j];
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = (1 - dist / 130) * 0.18;
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1.0;
}

function animateCanvas() {
  drawHeroFrame(heroProgress.value);
  requestAnimationFrame(animateCanvas);
}
animateCanvas();

// ─── 3. PIN HERO + SCROLL REVEALS ───
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
  },
});

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
  },
});

// Staggered text reveals
const heroTl = gsap.timeline({ delay: 0.2 });
heroTl
  .to('.hero-eyebrow-badge', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
  .to('.hero-title-line', { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' }, '-=0.4')
  .to('.hero-sub', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
  .to('.hero-actions', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
  .to('.hero-terminal-pill', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2')
  .to('.hero-scroll-hint', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2');

gsap.set('.hero-eyebrow-badge', { opacity: 0, y: 20 });
gsap.set('.hero-title-line', { opacity: 0, y: 30 });
gsap.set('.hero-sub', { opacity: 0, y: 20 });
gsap.set('.hero-actions', { opacity: 0, y: 20 });
gsap.set('.hero-terminal-pill', { opacity: 0, y: 25 });
gsap.set('.hero-scroll-hint', { opacity: 0 });

// ─── 4. HERO TERMINAL TYPEWRITER ANIMATION ───
const termLines = [
  'nexchat init --quantum-cipher',
  'cipher: 256-bit AES-GCM established [OK]',
  'relay: WebRTC peer-to-peer 24ms ping [ONLINE]',
  'vault: Vercel Multi-Vault 7 partitions synced [OK]',
  'status: ALL CHANNELS SECURE & READY',
];

let lineIdx = 0;
let charIdx = 0;
const terminalEl = document.getElementById('heroTerminalText');

function typeNextChar() {
  if (!terminalEl) return;
  const currentLine = termLines[lineIdx];

  if (charIdx < currentLine.length) {
    terminalEl.innerHTML = `<span class="term-prompt">$</span> ${currentLine.slice(0, charIdx + 1)}<span class="term-cursor">|</span>`;
    charIdx++;
    setTimeout(typeNextChar, 35);
  } else {
    setTimeout(() => {
      lineIdx = (lineIdx + 1) % termLines.length;
      charIdx = 0;
      typeNextChar();
    }, 1800);
  }
}
setTimeout(typeNextChar, 1000);

// ─── 5. CHANDELIER SVG GRAPHIC INJECTION ───
const CHANDELIER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <radialGradient id="chGlow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
      <stop offset="40%" stop-color="#555555" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
    </radialGradient>
    <linearGradient id="crShine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#cccccc"/>
      <stop offset="100%" stop-color="#333333"/>
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="#080808"/>
  <rect width="400" height="500" fill="url(#chGlow)"/>
  <circle cx="200" cy="25" r="34" fill="none" stroke="#666" stroke-width="2"/>
  <circle cx="200" cy="25" r="20" fill="#181818" stroke="#aaa" stroke-width="1.5"/>
  <line x1="200" y1="25" x2="200" y2="95" stroke="#ccc" stroke-width="4" stroke-dasharray="8 3"/>
  <path d="M192 95h16v26h-16z" fill="#ddd"/>
  <ellipse cx="200" cy="130" rx="34" ry="16" fill="#222" stroke="#fff" stroke-width="2"/>
  <ellipse cx="200" cy="170" rx="58" ry="22" fill="#181818" stroke="#ccc" stroke-width="2"/>
  <ellipse cx="200" cy="220" rx="88" ry="28" fill="#111" stroke="#eee" stroke-width="2.5"/>
  <ellipse cx="200" cy="260" rx="48" ry="16" fill="#1a1a1a" stroke="#aaa" stroke-width="2"/>
  <path d="M180 170c-68 10-116 38-126 86-5 24 14 42 38 38 18-3 32-24 28-42" fill="none" stroke="#ddd" stroke-width="3"/>
  <path d="M170 220c-48 14-86 38-90 70-3 18 10 32 28 28" fill="none" stroke="#bbb" stroke-width="2.5"/>
  <path d="M190 260c-32 14-56 32-60 56" fill="none" stroke="#999" stroke-width="2"/>
  <path d="M220 170c68 10 116 38 126 86 5 24-14 42-38 38-18-3-32-24-28-42" fill="none" stroke="#ddd" stroke-width="3"/>
  <path d="M230 220c48 14 86 38 90 70 3 18-10 32-28 28" fill="none" stroke="#bbb" stroke-width="2.5"/>
  <path d="M210 260c32 14 56 32 60 56" fill="none" stroke="#999" stroke-width="2"/>
  <circle cx="85" cy="254" r="7" fill="#fff" filter="drop-shadow(0 0 8px #fff)"/>
  <rect x="82" y="261" width="6" height="14" fill="#eee"/>
  <circle cx="145" cy="288" r="6" fill="#fff" filter="drop-shadow(0 0 6px #fff)"/>
  <rect x="142" y="294" width="6" height="12" fill="#eee"/>
  <circle cx="315" cy="254" r="7" fill="#fff" filter="drop-shadow(0 0 8px #fff)"/>
  <rect x="312" y="261" width="6" height="14" fill="#eee"/>
  <circle cx="255" cy="288" r="6" fill="#fff" filter="drop-shadow(0 0 6px #fff)"/>
  <rect x="252" y="294" width="6" height="12" fill="#eee"/>
  <g fill="url(#crShine)" stroke="#fff" stroke-width="0.5">
    <polygon points="200,280 195,320 200,335 205,320"/>
    <polygon points="170,285 166,315 170,325 174,315"/>
    <polygon points="230,285 226,315 230,325 234,315"/>
    <polygon points="130,270 126,300 130,310 134,300"/>
    <polygon points="270,270 266,300 270,310 274,300"/>
    <polygon points="85,295 82,318 85,328 88,318"/>
    <polygon points="315,295 312,318 315,328 318,318"/>
    <path d="M85 254 Q140 298 200 280" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 3"/>
    <path d="M315 254 Q260 298 200 280" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 3"/>
    <path d="M145 288 Q170 318 200 308" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 3"/>
    <path d="M255 288 Q230 318 200 308" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 3"/>
  </g>
</svg>
`;

document.querySelectorAll('.chandelier-svg-container').forEach((el) => {
  el.innerHTML = CHANDELIER_SVG;
});

// ─── 6. CINEMATIC STORY ENGINE (HANDSHAKE → 3D SPIN → CHAT BANTER → CREATE GROUP) ───
let cinemaTimeouts = [];
let isCinemaPaused = false;

function clearCinemaSchedule() {
  cinemaTimeouts.forEach(t => clearTimeout(t));
  cinemaTimeouts = [];
}

function scheduleCinemaStep(fn, delayMs) {
  const t = setTimeout(fn, delayMs);
  cinemaTimeouts.push(t);
  return t;
}

// ═══════════════════════════════════════════════════════════════════
// STAGE MATRIX CANVAS (Continuous Digital Rain behind Dual Phones)
// ═══════════════════════════════════════════════════════════════════
const stageMatrixCanvas = document.getElementById('stageMatrixBgCanvas');
let stageMatrixCtx = stageMatrixCanvas ? stageMatrixCanvas.getContext('2d') : null;
let stageMatrixDrops = [];
let stageMatrixCols = 0;
const stageCodeChars = 'NEXCHAT01010189ABCDEFΣΩΨλπΔ0123456789';

function sizeStageMatrix() {
  if (!stageMatrixCanvas) return;
  const parent = stageMatrixCanvas.parentElement;
  const w = (parent ? parent.clientWidth : 0) || window.innerWidth || 800;
  const h = (parent ? parent.clientHeight : 0) || 680;
  stageMatrixCanvas.width = w;
  stageMatrixCanvas.height = h;
  stageMatrixCols = Math.floor(w / 18);
  stageMatrixDrops = Array(stageMatrixCols).fill(1).map(() => Math.floor(Math.random() * 30));
}
if (stageMatrixCanvas) {
  sizeStageMatrix();
  window.addEventListener('resize', sizeStageMatrix);
}

function renderStageMatrix() {
  if (!stageMatrixCtx || !stageMatrixCanvas) return;
  if (!stageMatrixCanvas.width || stageMatrixDrops.length === 0) {
    sizeStageMatrix();
    if (!stageMatrixCanvas.width) return;
  }
  stageMatrixCtx.fillStyle = 'rgba(6, 10, 20, 0.14)';
  stageMatrixCtx.fillRect(0, 0, stageMatrixCanvas.width, stageMatrixCanvas.height);
  stageMatrixCtx.fillStyle = '#00ff88';
  stageMatrixCtx.font = '12px "JetBrains Mono", monospace';

  for (let i = 0; i < stageMatrixDrops.length; i++) {
    const char = stageCodeChars.charAt(Math.floor(Math.random() * stageCodeChars.length));
    stageMatrixCtx.fillText(char, i * 18, stageMatrixDrops[i] * 18);
    if (stageMatrixDrops[i] * 18 > stageMatrixCanvas.height && Math.random() > 0.98) {
      stageMatrixDrops[i] = 0;
    }
    stageMatrixDrops[i]++;
  }
}
setInterval(renderStageMatrix, 45);

// ═══════════════════════════════════════════════════════════════════
// DUAL-PHONE SIMULTANEOUS LIVE CHATTING THEATRE ENGINE
// ═══════════════════════════════════════════════════════════════════
const cinemaStepLabel = document.getElementById('cinemaStepLabel');
const phoneAlexWrapper = document.getElementById('phoneAlexWrapper');
const phoneMiaWrapper = document.getElementById('phoneMiaWrapper');
const phoneAlexFrame = document.getElementById('phoneAlexFrame');
const phoneMiaFrame = document.getElementById('phoneMiaFrame');
const messagesStreamAlex = document.getElementById('messagesStreamAlex');
const messagesStreamMia = document.getElementById('messagesStreamMia');
const typingAlex = document.getElementById('typingAlex');
const typingMia = document.getElementById('typingMia');
const packetToRight = document.getElementById('packetToRight');
const packetToLeft = document.getElementById('packetToLeft');
const sparkBurst = document.getElementById('handshakeSpark');
const inputAlex = document.getElementById('inputAlex');
const inputMia = document.getElementById('inputMia');
const sendBtnAlex = document.getElementById('sendBtnAlex');
const sendBtnMia = document.getElementById('sendBtnMia');
const chatCanvasAlex = document.getElementById('chatCanvasAlex');
const chatCanvasMia = document.getElementById('chatCanvasMia');
const inPhoneGroupDrawer = document.getElementById('inPhoneGroupDrawer');
const alexContactTitle = document.getElementById('alexContactTitle');
const miaContactTitle = document.getElementById('miaContactTitle');
const alexContactStatus = document.getElementById('alexContactStatus');
const miaContactStatus = document.getElementById('miaContactStatus');

function addBubbleToStream(streamEl, type, text, time, opts = {}) {
  if (!streamEl) return;
  const bubble = document.createElement('div');
  bubble.className = `mock-bubble ${type} ${opts.isAudio ? 'audio-bubble' : ''}`;
  
  if (opts.isAudio) {
    bubble.innerHTML = `
      <button class="audio-play-btn"><i class="fa-solid fa-play"></i></button>
      <div class="audio-waveform-bars">
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
      <span class="audio-duration">0:14</span>
      <div class="bubble-meta">${time}</div>
    `;
  } else {
    bubble.innerHTML = `
      ${opts.author ? `<div style="font-size: 10px; font-weight: 700; color: #00ff88; margin-bottom: 2px;">${opts.author}</div>` : ''}
      <div class="bubble-text">${text}</div>
      <div class="bubble-meta">${time} ${type === 'sent' ? '<i class="fa-solid fa-check-double read-ticks"></i>' : ''}</div>
    `;
  }
  
  streamEl.appendChild(bubble);
  streamEl.scrollTop = streamEl.scrollHeight;
  playTypeBlip();
}

function streakPacket(direction) {
  const packet = direction === 'right' ? packetToRight : packetToLeft;
  if (!packet) return;
  packet.classList.remove('active');
  void packet.offsetWidth;
  packet.classList.add('active');
}

// Baseline reset so screens are never empty
function resetStreamsToInitial() {
  const initialHtmlAlex = `
    <div class="mock-date-pill">Today</div>
    <div class="mock-system-group-notice">
      <i class="fa-solid fa-lock"></i> Messages end-to-end encrypted. QKD-4096 verified.
    </div>
    <div class="mock-bubble received">
      <div class="bubble-text">Alex, are the quantum relays active? ⚡</div>
      <div class="bubble-meta">10:44 PM</div>
    </div>
    <div class="mock-bubble sent">
      <div class="bubble-text">Online now. Direct WebRTC tunnel established! 🛰️</div>
      <div class="bubble-meta">10:44 PM <i class="fa-solid fa-check-double read-ticks"></i></div>
    </div>
  `;
  const initialHtmlMia = `
    <div class="mock-date-pill">Today</div>
    <div class="mock-system-group-notice">
      <i class="fa-solid fa-lock"></i> Messages end-to-end encrypted. QKD-4096 verified.
    </div>
    <div class="mock-bubble sent">
      <div class="bubble-text">Alex, are the quantum relays active? ⚡</div>
      <div class="bubble-meta">10:44 PM <i class="fa-solid fa-check-double read-ticks"></i></div>
    </div>
    <div class="mock-bubble received">
      <div class="bubble-text">Online now. Direct WebRTC tunnel established! 🛰️</div>
      <div class="bubble-meta">10:44 PM</div>
    </div>
  `;
  if (messagesStreamAlex) {
    messagesStreamAlex.innerHTML = initialHtmlAlex;
    messagesStreamAlex.scrollTop = messagesStreamAlex.scrollHeight;
  }
  if (messagesStreamMia) {
    messagesStreamMia.innerHTML = initialHtmlMia;
    messagesStreamMia.scrollTop = messagesStreamMia.scrollHeight;
  }
}

// Live character-by-character typewriter simulator into input fields
function typeTextIntoInput(inputEl, text, speed = 36) {
  return new Promise((resolve) => {
    if (!inputEl) { resolve(); return; }
    inputEl.value = '';
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < text.length) {
        inputEl.value += text.charAt(idx);
        if (idx % 2 === 0) playTypeBlip();
        idx++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, speed);
    cinemaTimeouts.push(interval);
  });
}

// Act 1: Dual-Phone Handshake (Phones touch edges with lightning spark)
function runAct1_Handshake() {
  clearCinemaSchedule();
  if (cinemaStepLabel) cinemaStepLabel.textContent = 'ACT 1: DUAL-PHONE QUANTUM HANDSHAKE';
  
  if (sparkBurst) sparkBurst.style.opacity = '0';
  
  // Bring both phones to touch edges
  scheduleCinemaStep(() => {
    if (phoneAlexWrapper) phoneAlexWrapper.classList.add('touching');
    if (phoneMiaWrapper) phoneMiaWrapper.classList.add('touching');
  }, 300);

  // Spark burst and shockwave sound
  scheduleCinemaStep(() => {
    if (sparkBurst) sparkBurst.style.opacity = '1';
    playShockwaveBoom();
    const ring1 = document.querySelector('.shockwave-ring.ring-1');
    if (ring1) {
      ring1.style.animation = 'none';
      void ring1.offsetWidth;
      ring1.style.animation = 'shockwaveExpand 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }
  }, 1200);

  // Proceed to Act 2 (3D Turnaround)
  scheduleCinemaStep(runAct2_3DSpin, 2800);
}

// Act 2: 3D Turn-Around & Screen Unlock
function runAct2_3DSpin() {
  if (cinemaStepLabel) cinemaStepLabel.textContent = 'ACT 2: 3D TITANIUM TURN-AROUND & UNLOCK';
  if (sparkBurst) sparkBurst.style.opacity = '0';
  
  if (phoneAlexWrapper) phoneAlexWrapper.classList.remove('touching');
  if (phoneMiaWrapper) phoneMiaWrapper.classList.remove('touching');

  // Trigger simultaneous 360° spin on both frames
  if (phoneAlexFrame) {
    phoneAlexFrame.classList.remove('spin-360');
    void phoneAlexFrame.offsetWidth;
    phoneAlexFrame.classList.add('spin-360');
  }
  if (phoneMiaFrame) {
    phoneMiaFrame.classList.remove('spin-360');
    void phoneMiaFrame.offsetWidth;
    phoneMiaFrame.classList.add('spin-360');
  }
  playTurnaroundWhoosh();

  // Reset wallpapers
  setDemoWallpaper('doodle');

  // Proceed to Act 3
  scheduleCinemaStep(runAct3_ChatBanter, 1600);
}

// Act 3: Live Simultaneous Chatting Between Both Phones
function runAct3_ChatBanter() {
  if (cinemaStepLabel) cinemaStepLabel.textContent = 'ACT 3: LIVE SIMULTANEOUS DUAL-PHONE CHATTING';
  
  if (alexContactTitle) alexContactTitle.textContent = 'Mia [Co-Lead]';
  if (miaContactTitle) miaContactTitle.textContent = 'Alex [Lead Dev]';
  if (alexContactStatus) alexContactStatus.textContent = 'online · 24ms WebRTC';
  if (miaContactStatus) miaContactStatus.textContent = 'online · 24ms WebRTC';

  resetStreamsToInitial();
  if (typingAlex) typingAlex.style.display = 'none';
  if (typingMia) typingMia.style.display = 'none';
  if (inputAlex) inputAlex.value = '';
  if (inputMia) inputMia.value = '';

  // 1. Alex starts typing letter-by-letter
  scheduleCinemaStep(async () => {
    if (typingMia) typingMia.style.display = 'flex';
    const msg1 = 'Hey Mia, look at our live encrypted sync! 🚀';
    await typeTextIntoInput(inputAlex, msg1, 35);

    scheduleCinemaStep(() => {
      if (typingMia) typingMia.style.display = 'none';
      if (inputAlex) inputAlex.value = '';
      addBubbleToStream(messagesStreamAlex, 'sent', msg1, '10:45 PM');
      streakPacket('right');
      
      scheduleCinemaStep(() => {
        addBubbleToStream(messagesStreamMia, 'received', msg1, '10:45 PM');
      }, 350);
    }, 500);
  }, 800);

  // 2. Mia types reply letter-by-letter
  scheduleCinemaStep(async () => {
    if (typingAlex) typingAlex.style.display = 'flex';
    const msg2 = 'Whoa it synced in 24ms! Watch me morph to Cyber Emerald ⚡';
    await typeTextIntoInput(inputMia, msg2, 32);

    scheduleCinemaStep(() => {
      if (typingAlex) typingAlex.style.display = 'none';
      if (inputMia) inputMia.value = '';
      addBubbleToStream(messagesStreamMia, 'sent', msg2, '10:46 PM');
      streakPacket('left');
      
      scheduleCinemaStep(() => {
        addBubbleToStream(messagesStreamAlex, 'received', msg2, '10:46 PM');
      }, 350);
    }, 500);
  }, 4400);

  // 3. Live Wallpaper Morph
  scheduleCinemaStep(() => {
    setDemoWallpaper('emerald');
  }, 8200);

  // 4. Mia sends voice note
  scheduleCinemaStep(() => {
    streakPacket('left');
    addBubbleToStream(messagesStreamMia, 'sent', '', '10:46 PM', { isAudio: true });
    addBubbleToStream(messagesStreamAlex, 'received', '', '10:46 PM', { isAudio: true });
  }, 9500);

  // 5. Mia types follow-up message letter-by-letter
  scheduleCinemaStep(async () => {
    if (typingAlex) typingAlex.style.display = 'flex';
    const msg3 = 'BRO THAT IS SICK!! 🔥 Setting up our tournament squad group now!';
    await typeTextIntoInput(inputMia, msg3, 28);

    scheduleCinemaStep(() => {
      if (typingAlex) typingAlex.style.display = 'none';
      if (inputMia) inputMia.value = '';
      addBubbleToStream(messagesStreamMia, 'sent', msg3, '10:47 PM');
      streakPacket('left');
      scheduleCinemaStep(() => {
        addBubbleToStream(messagesStreamAlex, 'received', msg3, '10:47 PM');
      }, 350);
    }, 400);
  }, 10800);

  // Proceed to Act 4 (Group Creation)
  scheduleCinemaStep(runAct4_GroupCreation, 15500);
}

// Act 4: In-Phone Group Creation Flow
function runAct4_GroupCreation() {
  if (cinemaStepLabel) cinemaStepLabel.textContent = 'ACT 4: FORMING "CYBER SQUAD ELITE"';
  if (inPhoneGroupDrawer) inPhoneGroupDrawer.classList.add('open');

  const btnConfirm = document.getElementById('btnConfirmGroupCreation');
  const spinner = document.getElementById('groupCreationSpinner');

  scheduleCinemaStep(() => {
    if (spinner) spinner.style.display = 'inline-block';
    if (btnConfirm) btnConfirm.innerHTML = '<span>Creating Group...</span>';
    playCyberClick();
  }, 1600);

  scheduleCinemaStep(() => {
    if (inPhoneGroupDrawer) inPhoneGroupDrawer.classList.remove('open');
    if (btnConfirm) btnConfirm.innerHTML = '<span><i class="fa-solid fa-check"></i> Create Group</span>';
    if (spinner) spinner.style.display = 'none';
    playCyberClick();
    runAct5_SquadGroupChat();
  }, 3200);
}

// Act 5: Active Squad Group Chat on BOTH Phones
function runAct5_SquadGroupChat() {
  if (cinemaStepLabel) cinemaStepLabel.textContent = 'ACT 5: ACTIVE SQUAD GROUP CHAT ON BOTH PHONES';

  // Morph headers on both phones
  if (alexContactTitle) alexContactTitle.textContent = '⚡ CYBER SQUAD ELITE ⚡';
  if (miaContactTitle) miaContactTitle.textContent = '⚡ CYBER SQUAD ELITE ⚡';
  if (alexContactStatus) alexContactStatus.textContent = '4 members · Alex, Mia, Leo, Chronex';
  if (miaContactStatus) miaContactStatus.textContent = '4 members · Alex, Mia, Leo, Chronex';

  // Append system created badge to both
  [messagesStreamAlex, messagesStreamMia].forEach(stream => {
    if (!stream) return;
    const notice = document.createElement('div');
    notice.className = 'mock-system-group-notice';
    notice.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Group created with 256-bit AES encryption.';
    stream.appendChild(notice);
    stream.scrollTop = stream.scrollHeight;
  });

  // Group message from Alex
  scheduleCinemaStep(() => {
    addBubbleToStream(messagesStreamAlex, 'sent', 'Welcome squad! Prize pool is 5,000 NEX tokens 🏆', '10:48 PM', { author: 'Alex [Admin]' });
    streakPacket('right');
    scheduleCinemaStep(() => {
      addBubbleToStream(messagesStreamMia, 'received', 'Welcome squad! Prize pool is 5,000 NEX tokens 🏆', '10:48 PM', { author: 'Alex [Admin]' });
    }, 350);
  }, 900);

  // Group message from Mia
  scheduleCinemaStep(() => {
    addBubbleToStream(messagesStreamMia, 'sent', "Locked in! Chronex AI, what's our match probability? 💎", '10:49 PM', { author: 'Mia' });
    streakPacket('left');
    scheduleCinemaStep(() => {
      addBubbleToStream(messagesStreamAlex, 'received', "Locked in! Chronex AI, what's our match probability? 💎", '10:49 PM', { author: 'Mia' });
    }, 350);
  }, 2600);

  // Bot message from Chronex AI
  scheduleCinemaStep(() => {
    addBubbleToStream(messagesStreamAlex, 'received', '⚡ Chronex Neural Analysis: 96.4% victory probability. Strategy deployed.', '10:49 PM', { author: 'Chronex AI [Tactician]' });
    addBubbleToStream(messagesStreamMia, 'received', '⚡ Chronex Neural Analysis: 96.4% victory probability. Strategy deployed.', '10:49 PM', { author: 'Chronex AI [Tactician]' });
  }, 4400);

  // Loop back to Act 1
  scheduleCinemaStep(() => {
    if (!isCinemaPaused) runAct1_Handshake();
  }, 9500);
}

// Interactive Manual User Sending
function handleUserManualSend(sender) {
  if (sender === 'alex') {
    const text = inputAlex?.value.trim();
    if (!text) return;
    inputAlex.value = '';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addBubbleToStream(messagesStreamAlex, 'sent', text, nowTime);
    streakPacket('right');
    playCyberClick();
    setTimeout(() => {
      addBubbleToStream(messagesStreamMia, 'received', text, nowTime);
    }, 380);
  } else if (sender === 'mia') {
    const text = inputMia?.value.trim();
    if (!text) return;
    inputMia.value = '';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addBubbleToStream(messagesStreamMia, 'sent', text, nowTime);
    streakPacket('left');
    playCyberClick();
    setTimeout(() => {
      addBubbleToStream(messagesStreamAlex, 'received', text, nowTime);
    }, 380);
  }
}

sendBtnAlex?.addEventListener('click', () => handleUserManualSend('alex'));
inputAlex?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleUserManualSend('alex');
});

sendBtnMia?.addEventListener('click', () => handleUserManualSend('mia'));
inputMia?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleUserManualSend('mia');
});

// Start cinematic loop on page load
runAct1_Handshake();

// Cinema Controls
document.getElementById('cinemaReplayBtn')?.addEventListener('click', () => {
  isCinemaPaused = false;
  runAct1_Handshake();
});

document.getElementById('cinemaPauseBtn')?.addEventListener('click', () => {
  isCinemaPaused = !isCinemaPaused;
  const icon = document.querySelector('#cinemaPauseBtn i');
  if (isCinemaPaused) {
    clearCinemaSchedule();
    if (icon) icon.className = 'fa-solid fa-play';
  } else {
    if (icon) icon.className = 'fa-solid fa-pause';
    runAct3_ChatBanter();
  }
});

document.getElementById('cinemaJumpGroupBtn')?.addEventListener('click', () => {
  clearCinemaSchedule();
  runAct4_GroupCreation();
});

document.getElementById('triggerGroupCreation')?.addEventListener('click', () => {
  runAct4_GroupCreation();
});

document.getElementById('btnConfirmGroupCreation')?.addEventListener('click', () => {
  if (inPhoneGroupDrawer) inPhoneGroupDrawer.classList.remove('open');
  runAct5_SquadGroupChat();
});

// ─── CHAT WALLPAPER LIVE SWITCHER (SYNCS BOTH PHONES) ───
const DEMO_WALLPAPERS = {
  doodle: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340"><rect width="340" height="340" fill="%230b141a"/><g fill="none" stroke="%23ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.08"><path d="M30 40h40a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-25l-12 10v-10h-3a10 10 0 0 1-10-10v-20a10 10 0 0 1 10-10z"/><rect x="230" y="45" width="34" height="24" rx="4"/><path d="M30 150l45 15-20 8 10 15 5-10 18-5z"/><rect x="130" y="130" width="22" height="40" rx="4"/><rect x="40" y="240" width="24" height="18" rx="3"/><path d="M46 240v-8a6 6 0 0 1 12 0v8"/><circle cx="245" cy="245" r="14"/></g></svg>',
  emerald: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340"><rect width="340" height="340" fill="%23060c11"/><g fill="none" stroke="%2300ff88" stroke-width="1.3" opacity="0.14"><rect x="25" y="35" width="46" height="30" rx="5"/><path d="M140 40l16-6 16 6v14c0 10-16 18-16 18s-16-8-16-18z"/><path d="M45 130l-12 18h10l-4 18 16-22h-10z"/><rect x="135" y="135" width="26" height="26" rx="4"/><circle cx="240" cy="145" r="7"/></g></svg>',
  matrix: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><rect width="280" height="280" fill="%23050811"/><g fill="%2300ff88" font-family="monospace" font-size="11" opacity="0.14"><text x="20" y="30">0 1 1 0</text><text x="20" y="60">N E X</text><text x="120" y="45">1 0 0 1</text><text x="120" y="75">A E S</text><text x="200" y="30">E 2 E</text></g></svg>',
  obsidian: '',
};

function setDemoWallpaper(type) {
  const canvasAlex = document.getElementById('chatCanvasAlex');
  const canvasMia = document.getElementById('chatCanvasMia');

  document.querySelectorAll('.wp-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.textContent.toLowerCase() === type);
  });

  [canvasAlex, canvasMia].forEach(canvasEl => {
    if (!canvasEl) return;
    if (type === 'obsidian') {
      canvasEl.style.backgroundImage = 'none';
      canvasEl.style.backgroundColor = '#060912';
    } else {
      canvasEl.style.backgroundImage = `url('${DEMO_WALLPAPERS[type]}')`;
      canvasEl.style.backgroundColor = '#0b141a';
    }
  });
}
window.setDemoWallpaper = setDemoWallpaper;

let wpKeys = ['doodle', 'emerald', 'matrix', 'obsidian'];
let wpCycleIdx = 0;
function cycleDemoWallpaper() {
  wpCycleIdx = (wpCycleIdx + 1) % wpKeys.length;
  setDemoWallpaper(wpKeys[wpCycleIdx]);
}
window.cycleDemoWallpaper = cycleDemoWallpaper;

function previewGalleryWallpaper(type, cardEl) {
  document.querySelectorAll('.wp-gallery-card').forEach(c => c.classList.remove('active'));
  cardEl?.classList.add('active');
  setDemoWallpaper(type);
}
window.previewGalleryWallpaper = previewGalleryWallpaper;

// Interactive Manual Send Buttons for both phones
sendBtnAlex?.addEventListener('click', () => {
  const text = inputAlex?.value.trim() || 'Alex says: E2E Quantum Link Verified! 🚀';
  inputAlex.value = '';
  addBubbleToStream(messagesStreamAlex, 'sent', text, 'Just now');
  streakPacket('right');
  scheduleCinemaStep(() => {
    addBubbleToStream(messagesStreamMia, 'received', text, 'Just now');
  }, 350);
});

sendBtnMia?.addEventListener('click', () => {
  const text = inputMia?.value.trim() || 'Mia replies: Synced 24ms WebRTC! ⚡';
  inputMia.value = '';
  addBubbleToStream(messagesStreamMia, 'sent', text, 'Just now');
  streakPacket('left');
  scheduleCinemaStep(() => {
    addBubbleToStream(messagesStreamAlex, 'received', text, 'Just now');
  }, 350);
});


// ─── 7. FEATURE TABS & STAGE SWITCHER ───
const stageTabs = document.querySelectorAll('.stage-tab');
const stageViews = document.querySelectorAll('.stage-view');
let currentStageIdx = 0;
const stageKeys = ['chat', 'call', 'status', 'terminal', 'gaming'];
let stageAutoPlayTimer = null;
const STAGE_INTERVAL_MS = 6000;
let stageProgressStartTime = Date.now();

function switchStage(stageId) {
  stageTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.stage === stageId);
    const fill = tab.querySelector('.tab-progress-fill');
    if (fill) fill.style.width = '0%';
  });

  stageViews.forEach((view) => {
    view.classList.toggle('active', view.id === `view-${stageId}`);
  });

  const idx = stageKeys.indexOf(stageId);
  if (idx !== -1) currentStageIdx = idx;
  stageProgressStartTime = Date.now();

  // If user switches to chat, ensure dual-phone chat stage is visible
  if (stageId === 'chat') {
    const dualStage = document.getElementById('dualPhoneChatStage');
    if (dualStage) dualStage.style.display = 'flex';
  }
}
window.switchStage = switchStage;

stageTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    clearInterval(stageAutoPlayTimer);
    switchStage(tab.dataset.stage);
    startStageAutoPlay();
  });
});

function updateStageProgress() {
  const activeTab = document.querySelector('.stage-tab.active');
  if (!activeTab) return;
  const fill = activeTab.querySelector('.tab-progress-fill');
  if (!fill) return;

  const elapsed = Date.now() - stageProgressStartTime;
  const pct = Math.min(100, (elapsed / STAGE_INTERVAL_MS) * 100);
  fill.style.width = `${pct}%`;

  if (elapsed >= STAGE_INTERVAL_MS) {
    currentStageIdx = (currentStageIdx + 1) % stageKeys.length;
    switchStage(stageKeys[currentStageIdx]);
  }
}

function startStageAutoPlay() {
  clearInterval(stageAutoPlayTimer);
  stageProgressStartTime = Date.now();
  stageAutoPlayTimer = setInterval(updateStageProgress, 60);
}
startStageAutoPlay();

// ─── 8. CHAT WALLPAPER LIVE SWITCHER ───
const DEMO_WALLPAPERS = {
  doodle: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340"><rect width="340" height="340" fill="%230b141a"/><g fill="none" stroke="%23ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.08"><path d="M30 40h40a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-25l-12 10v-10h-3a10 10 0 0 1-10-10v-20a10 10 0 0 1 10-10z"/><rect x="230" y="45" width="34" height="24" rx="4"/><path d="M30 150l45 15-20 8 10 15 5-10 18-5z"/><rect x="130" y="130" width="22" height="40" rx="4"/><rect x="40" y="240" width="24" height="18" rx="3"/><path d="M46 240v-8a6 6 0 0 1 12 0v8"/><circle cx="245" cy="245" r="14"/></g></svg>',
  emerald: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340"><rect width="340" height="340" fill="%23060c11"/><g fill="none" stroke="%2300ff88" stroke-width="1.3" opacity="0.14"><rect x="25" y="35" width="46" height="30" rx="5"/><path d="M140 40l16-6 16 6v14c0 10-16 18-16 18s-16-8-16-18z"/><path d="M45 130l-12 18h10l-4 18 16-22h-10z"/><rect x="135" y="135" width="26" height="26" rx="4"/><circle cx="240" cy="145" r="7"/></g></svg>',
  matrix: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><rect width="280" height="280" fill="%23050811"/><g fill="%2300ff88" font-family="monospace" font-size="11" opacity="0.14"><text x="20" y="30">0 1 1 0</text><text x="20" y="60">N E X</text><text x="120" y="45">1 0 0 1</text><text x="120" y="75">A E S</text><text x="200" y="30">E 2 E</text></g></svg>',
  obsidian: '',
};

function setDemoWallpaper(type) {
  const canvasEl = document.getElementById('demoChatCanvas');
  if (!canvasEl) return;

  document.querySelectorAll('.wp-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.textContent.toLowerCase() === type);
  });

  if (type === 'obsidian') {
    canvasEl.style.backgroundImage = 'none';
    canvasEl.style.backgroundColor = '#060912';
  } else {
    canvasEl.style.backgroundImage = `url('${DEMO_WALLPAPERS[type]}')`;
    canvasEl.style.backgroundColor = '#0b141a';
  }
}
window.setDemoWallpaper = setDemoWallpaper;

let wpKeys = ['doodle', 'emerald', 'matrix', 'obsidian'];
let wpCycleIdx = 0;
function cycleDemoWallpaper() {
  wpCycleIdx = (wpCycleIdx + 1) % wpKeys.length;
  setDemoWallpaper(wpKeys[wpCycleIdx]);
}
window.cycleDemoWallpaper = cycleDemoWallpaper;

function previewGalleryWallpaper(type, cardEl) {
  document.querySelectorAll('.wp-gallery-card').forEach(c => c.classList.remove('active'));
  cardEl?.classList.add('active');

  if (type in DEMO_WALLPAPERS) {
    setDemoWallpaper(type);
  }
  switchStage('chat');
}
window.previewGalleryWallpaper = previewGalleryWallpaper;

// ─── 9. 1:1 PHOTO STATUS EDITOR FILTERS ───
const filterItems = document.querySelectorAll('.filter-circle-item');
const chandelierGraphic = document.getElementById('statusChandelierGraphic');
const filterLabel = document.getElementById('statusFilterName');
let currentRotation = 0;

const FILTERS_MAP = {
  normal: 'none',
  peach: 'sepia(0.3) saturate(1.8) hue-rotate(-25deg)',
  bw: 'grayscale(1) contrast(1.35) brightness(1.05)',
  sepia: 'sepia(0.85) contrast(1.15)',
  cyan: 'hue-rotate(150deg) saturate(2) brightness(0.95)',
};

filterItems.forEach((item) => {
  item.addEventListener('click', () => {
    filterItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const fKey = item.dataset.filter;
    const fName = item.dataset.name;

    if (filterLabel) filterLabel.textContent = fName;
    if (chandelierGraphic) {
      chandelierGraphic.style.filter = FILTERS_MAP[fKey] || 'none';
    }
  });
});

document.getElementById('statusRotateBtn')?.addEventListener('click', () => {
  currentRotation = (currentRotation + 90) % 360;
  if (chandelierGraphic) {
    chandelierGraphic.style.transform = `rotate(${currentRotation}deg)`;
    chandelierGraphic.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
  }
});

// ─── 10. HACKER TERMINAL CLI ───
const termInput = document.getElementById('stageTerminalInput');
const termHistory = document.getElementById('termLiveHistory');

function executeStageCommand(cmdText) {
  const cmd = cmdText.trim().toLowerCase();
  let response = '';

  if (cmd === 'help') {
    response = `
Available commands:
  help                     - List available CLI commands
  call <phone_number>      - Launch WebRTC encrypted voice call
  status photo             - Open Photo Status Editor with B&W filters
  wallpaper                - Cycle authentic chat wallpapers
  vault                    - Inspect Vercel Multi-Vault storage partitions
  matrix                   - Stream cyber matrix rain
  clear                    - Clear terminal screen
    `;
  } else if (cmd.startsWith('call')) {
    response = `[DIALING] Connecting peer +1 (218) 296-1795... Switching to calling stage.`;
    setTimeout(() => switchStage('call'), 800);
  } else if (cmd === 'status photo' || cmd === 'status') {
    response = `[STATUS ENGINE] Loading chandelier media into Status Editor stage...`;
    setTimeout(() => switchStage('status'), 800);
  } else if (cmd === 'wallpaper') {
    cycleDemoWallpaper();
    response = `[WALLPAPER] Switched active canvas wallpaper to: ${wpKeys[wpCycleIdx]}. Switching to Chat stage.`;
    setTimeout(() => switchStage('chat'), 800);
  } else if (cmd === 'vault') {
    response = `
[VERCEL MULTI-VAULT STATUS]
  Vault 0 (Reels Public):   ONLINE [RW]
  Vault 1 (Reels Private):  ONLINE [Streaming]
  Vault 2 (Reels Private):  ONLINE [Streaming]
  Vault 3 (Status Vault):   ONLINE [Private]
  Vault 4 (Status Vault):   ONLINE [Private]
  Vault 5 (Backup Vaults):  5 BACKUP PARTITIONS ACTIVE
  Token Sync:               All 7 Blob Tokens Loaded
    `;
  } else if (cmd === 'matrix') {
    setDemoWallpaper('matrix');
    response = `[MATRIX] Cyberpunk binary data stream injected into chat backdrop.`;
    setTimeout(() => switchStage('chat'), 600);
  } else if (cmd === 'clear') {
    if (termHistory) termHistory.innerHTML = '';
    return;
  } else {
    response = `Command not recognized: "${cmdText}". Type "help" for command list.`;
  }

  if (termHistory) {
    const entry = document.createElement('div');
    entry.style.marginTop = '6px';
    entry.innerHTML = `<span style="color: #00ff88;">nex@root:~$</span> <span style="color: #fff;">${cmdText}</span>\n<span style="color: #00d4ff;">${response}</span>`;
    termHistory.appendChild(entry);
    const consoleEl = document.getElementById('stageTerminalConsole');
    if (consoleEl) consoleEl.scrollTop = consoleEl.scrollHeight;
  }
}
window.executeStageCommand = executeStageCommand;

termInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = termInput.value.trim();
    if (val) {
      executeStageCommand(val);
      termInput.value = '';
    }
  }
});

// ─── 11. SCROLL REVEALS & NUMBERS ───
document.querySelectorAll('[data-reveal]').forEach((el) => {
  const delay = parseFloat(el.dataset.delay) || 0;
  gsap.fromTo(el,
    { opacity: 0, y: 35 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
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

document.querySelectorAll('.hero-orb').forEach((orb) => {
  const speed = parseFloat(orb.dataset.speed) || 0.5;
  gsap.to(orb, {
    yPercent: -50 * speed,
    ease: 'none',
    scrollTrigger: {
      trigger: heroSection,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    }
  });
});

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

ScrollTrigger.create({
  start: 60,
  onUpdate: (self) => {
    const nav = document.getElementById('landing-nav');
    if (self.direction === 1 && window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else if (window.scrollY <= 60) {
      nav.classList.remove('scrolled');
    }
  }
});

// ═══════════════════════════════════════════════════════════════════
// MATRIX OVERDRIVE ENGINE (Digital Rain Cascades)
// ═══════════════════════════════════════════════════════════════════
const matrixCanvas = document.getElementById('matrix-rain-overlay');
let matrixCtx = matrixCanvas ? matrixCanvas.getContext('2d') : null;
let matrixActive = false;
let matrixColumns = 0;
let matrixDrops = [];
const matrixChars = 'NEXCHAT0101010189ABCDEFΣΩΨλπΔΦ01';

function resizeMatrix() {
  if (!matrixCanvas) return;
  matrixCanvas.width = window.innerWidth;
  matrixCanvas.height = window.innerHeight;
  matrixColumns = Math.floor(matrixCanvas.width / 16);
  matrixDrops = Array(matrixColumns).fill(1);
}
if (matrixCanvas) {
  resizeMatrix();
  window.addEventListener('resize', resizeMatrix);
}

function drawMatrixRain() {
  if (!matrixActive || !matrixCtx || !matrixCanvas) return;
  matrixCtx.fillStyle = 'rgba(5, 8, 17, 0.08)';
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  matrixCtx.fillStyle = '#00ff88';
  matrixCtx.font = '14px "JetBrains Mono", monospace';

  for (let i = 0; i < matrixDrops.length; i++) {
    const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
    matrixCtx.fillText(text, i * 16, matrixDrops[i] * 16);
    if (matrixDrops[i] * 16 > matrixCanvas.height && Math.random() > 0.975) {
      matrixDrops[i] = 0;
    }
    matrixDrops[i]++;
  }
}

let matrixInterval = null;
const matrixOverdriveBtn = document.getElementById('matrixOverdriveBtn');
if (matrixOverdriveBtn) {
  matrixOverdriveBtn.addEventListener('click', () => {
    initCyberAudio();
    matrixActive = !matrixActive;
    document.body.classList.toggle('matrix-overdrive-active', matrixActive);
    matrixOverdriveBtn.classList.toggle('active', matrixActive);
    if (matrixActive) {
      playShockwaveBoom();
      if (!matrixInterval) matrixInterval = setInterval(drawMatrixRain, 35);
    } else {
      playCyberClick();
      if (matrixInterval) {
        clearInterval(matrixInterval);
        matrixInterval = null;
      }
      if (matrixCtx && matrixCanvas) matrixCtx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// 3D MOUSE PARALLAX TILT & SPECULAR GLARE REFLECTION
// ═══════════════════════════════════════════════════════════════════
const cinemaPhone = document.getElementById('cinemaPhoneFrame');
const phoneGlare = document.getElementById('phoneGlare');
const stageViewport = document.getElementById('stageViewport');

if (stageViewport && cinemaPhone) {
  stageViewport.addEventListener('mousemove', (e) => {
    if (cinemaPhone.classList.contains('spin-360')) return;
    const rect = stageViewport.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    cinemaPhone.style.transform = `perspective(1200px) rotateY(${mouseX * 18}deg) rotateX(${-mouseY * 16}deg)`;
    if (phoneGlare) {
      phoneGlare.style.opacity = (Math.abs(mouseX) + Math.abs(mouseY)) * 0.35;
      phoneGlare.style.background = `radial-gradient(circle at ${50 + mouseX * 45}% ${50 + mouseY * 45}%, rgba(255,255,255,0.22) 0%, transparent 60%)`;
    }
  });

  stageViewport.addEventListener('mouseleave', () => {
    if (cinemaPhone.classList.contains('spin-360')) return;
    cinemaPhone.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)';
    if (phoneGlare) phoneGlare.style.opacity = '0';
  });
}

// ═══════════════════════════════════════════════════════════════════
// QUANTUM TELEMETRY TICKER (Ping & Active Nodes)
// ═══════════════════════════════════════════════════════════════════
const telemetryPing = document.getElementById('telemetryPing');
const radarPing = document.getElementById('radarPing');
const radarNodes = document.getElementById('radarNodes');

setInterval(() => {
  const ping = Math.floor(10 + Math.random() * 8);
  if (telemetryPing) telemetryPing.textContent = `${ping}ms [GEO-ORBIT]`;
  if (radarPing) radarPing.textContent = `${ping}ms QKD`;
  if (radarNodes) {
    const nodes = 2840 + Math.floor(Math.random() * 15);
    radarNodes.textContent = `${nodes.toLocaleString()} ACTIVE`;
  }
}, 3200);

// Attach futuristic sound hover to interactive buttons
document.querySelectorAll('.stage-tab, .cinema-ctrl-btn, .hero-btn, .wp-gallery-card, .nav-link').forEach(btn => {
  btn.addEventListener('mouseenter', () => playHoverHum());
  btn.addEventListener('click', () => playCyberClick());
});

window.addEventListener('beforeunload', () => {
  clearCinemaSchedule();
  clearInterval(stageAutoPlayTimer);
  ScrollTrigger.getAll().forEach(t => t.kill());
  lenis.destroy();
});

console.log('🟢 NEXCHAT Full Cinematic Story & Interactive Engine initialized.');
