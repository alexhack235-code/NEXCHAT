// js/game_hyper_realism.js
// NEXUS REALISM ENGINE // Unity-HDRP Grade PBR Shaders, Live Top-Down GPS Map, Exotic Supercars,
// Flying Tesla Aero-System, Military Air-Defense, Aircraft Carrier, Rocket & Police Pursuit Engine
// Compatible with Central Metropolis (game.html) and all 14 Trans-Canada Province Realms

(function(window) {
  'use strict';

  // ============================================================
  // 1. HARDWARE DETECTION & ADAPTIVE QUALITY PROFILES
  // ============================================================
  const QUALITY_PROFILES = {
    low: {
      name: 'LOW (OPTIMIZED FOR MOBILE & LOW-END)',
      pixelRatio: 1.0,
      shadows: false,
      shadowMapSize: 512,
      shadowType: (typeof THREE !== 'undefined' ? THREE.BasicShadowMap : 0),
      cullDistance: 360,
      maxParticles: 60,
      pbrAnisotropy: 1,
      fogDensityFactor: 1.2,
      drawDecorations: false,
      enableVapor: false
    },
    med: {
      name: 'MEDIUM (BALANCED 60FPS)',
      pixelRatio: 1.25,
      shadows: true,
      shadowMapSize: 1024,
      shadowType: (typeof THREE !== 'undefined' ? THREE.PCFSoftShadowMap : 2),
      cullDistance: 720,
      maxParticles: 160,
      pbrAnisotropy: 2,
      fogDensityFactor: 0.92,
      drawDecorations: true,
      enableVapor: true
    },
    high: {
      name: 'HIGH (UNITY HDRP ULTRA-REALISTIC)',
      pixelRatio: 1.75,
      shadows: true,
      shadowMapSize: 2048,
      shadowType: (typeof THREE !== 'undefined' ? THREE.PCFSoftShadowMap : 2),
      cullDistance: 1400,
      maxParticles: 380,
      pbrAnisotropy: 4,
      fogDensityFactor: 0.72,
      drawDecorations: true,
      enableVapor: true
    }
  };

  function detectOptimalQuality() {
    try {
      const saved = localStorage.getItem('HYPER_REALISM_QUALITY');
      if (saved && QUALITY_PROFILES[saved]) return saved;
    } catch (e) {}

    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 900);
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;

    if (isTouch && (cores <= 4 || memory <= 4)) {
      return 'low';
    }
    if (cores >= 6 && memory >= 4) {
      return 'high';
    }
    return 'med';
  }

  // ============================================================
  // 2. CANADIAN CLIMATE, SURVIVAL & CLOTHING GEAR CONFIGS
  // ============================================================
  const CANADIAN_GEAR_TYPES = [
    { id: 'parka', name: '🇨🇦 ARCTIC GOOSE PARKA (85% INSULATION)', insulation: 0.85, warmthDrain: 0.22 },
    { id: 'toque', name: '🇨🇦 CALGARY WINTER FLANNEL & TOQUE (65% INSULATION)', insulation: 0.65, warmthDrain: 0.45 },
    { id: 'exosuit', name: '⚡ TITAN THERMAL EXO-RIG (95% INSULATION)', insulation: 0.95, warmthDrain: 0.08 }
  ];

  // ============================================================
  // 3. REAL-WORLD EXOTIC SUPERCAR & FLYING TESLA CATALOG
  // ============================================================
  const EXOTIC_CAR_CATALOG = [
    {
      id: 'lamborghini',
      brand: 'AUTOMOBILI LAMBORGHINI',
      name: 'Lamborghini Revuelto V12',
      store: 'Italian Exotics Gallery',
      price: 0,
      topSpeedKmh: 385,
      accel: 4.8,
      color: 0xffd000,
      accent: 0x0f172a,
      caliper: 0xffd000,
      canFly: false,
      badge: '🇮🇹 V12 HYBRID HYPERCAR',
      desc: 'Giallo Orion scissor-door V12 flagship with Y-shaped LEDs, active carbon delta wing & dual hexagonal exhaust.'
    },
    {
      id: 'ferrari',
      brand: 'SCUDERIA FERRARI',
      name: 'Ferrari SF90 Stradale',
      store: 'Italian Exotics Gallery',
      price: 0,
      topSpeedKmh: 375,
      accel: 4.7,
      color: 0xdc0000,
      accent: 0x0b0f17,
      caliper: 0xfacc15,
      canFly: false,
      badge: '🇮🇹 ROSSO CORSA SUPERCAR',
      desc: 'Sculpted Maranello twin-turbo V8 PHEV with S-duct nose, Nero carbon cabin canopy & quad round tail lamps.'
    },
    {
      id: 'mclaren',
      brand: 'MCLAREN AUTOMOTIVE',
      name: 'McLaren 765LT Spider',
      store: 'British & Hypercar Motorhouse',
      price: 0,
      topSpeedKmh: 365,
      accel: 4.6,
      color: 0xff5e00,
      accent: 0x111827,
      caliper: 0xff5e00,
      canFly: false,
      badge: '🇬🇧 PAPAYA SPARK LONGTAIL',
      desc: 'Carbon-monocoque track weapon with F1 roof snorkel, dihedral doors, quad titanium exhaust & active airbrake.'
    },
    {
      id: 'bugatti',
      brand: 'BUGATTI AUTOMOBILES',
      name: 'Bugatti Chiron Super Sport',
      store: 'British & Hypercar Motorhouse',
      price: 0,
      topSpeedKmh: 440,
      accel: 5.2,
      color: 0x0051ff,
      accent: 0x090d16,
      caliper: 0x38bdf8,
      canFly: false,
      badge: '🇫🇷 1,600 HP W16 HYPERCAR',
      desc: 'Two-tone French Racing Blue & Nocturne Carbon with signature C-bar side profile and horseshoe grille.'
    },
    {
      id: 'porsche',
      brand: 'PORSCHE MOTORSPORT',
      name: 'Porsche 911 GT3 RS (992)',
      store: 'British & Hypercar Motorhouse',
      price: 0,
      topSpeedKmh: 335,
      accel: 4.4,
      color: 0xf8fafc,
      accent: 0xe11d48,
      caliper: 0xe11d48,
      canFly: false,
      badge: '🇩🇪 SWAN-NECK DRS TRACK',
      desc: 'Ice White & Pyro Red aero icon with oval matrix LEDs, carbon hood louvers & towering swan-neck DRS wing.'
    },
    {
      id: 'tesla_roadster',
      brand: 'TESLA x SPACEX AERO',
      name: 'Tesla Roadster (SpaceX Flying Edition)',
      store: 'Tesla Gigafactory & Aero Hub',
      price: 0,
      topSpeedKmh: 420,
      flySpeedKmh: 580,
      accel: 5.5,
      color: 0xe11d48,
      accent: 0x0f172a,
      caliper: 0x00f2ff,
      canFly: true,
      badge: '🛸 FLYING TESLA [PRESS X]',
      desc: 'Ultra-Red EV hyper-roadster with deployable SpaceX Cold-Gas VTOL Thrusters & retractable plasma aero-wings!'
    },
    {
      id: 'tesla_cybertruck',
      brand: 'TESLA x SPACEX AERO',
      name: 'Tesla Cybertruck (VTOL Cyberbeast)',
      store: 'Tesla Gigafactory & Aero Hub',
      price: 0,
      topSpeedKmh: 320,
      flySpeedKmh: 510,
      accel: 4.5,
      color: 0x94a3b8,
      accent: 0x1e293b,
      caliper: 0x00f2ff,
      canFly: true,
      badge: '🛸 FLYING CYBERTRUCK [PRESS X]',
      desc: '30X Stainless-Steel exoskeleton truck equipped with 4 Heavy VTOL Plasma Thrusters & fold-out Cyber-Delta wings!'
    },
    {
      id: 'rcmp_interceptor',
      brand: 'ROYAL CANADIAN MOUNTED POLICE',
      name: 'RCMP Tactical Pursuit Interceptor',
      store: 'Police & Military Fleet',
      price: 0,
      topSpeedKmh: 340,
      accel: 4.5,
      color: 0x0f172a,
      accent: 0xf8fafc,
      caliper: 0xef4444,
      canFly: false,
      isPolice: true,
      badge: '🚓 RCMP POLICE CRUISER',
      desc: 'Official Canadian Police Interceptor with PIT push-bumper, high-output twin-turbo V6 & strobe lightbar.'
    }
  ];
  window.EXOTIC_CAR_CATALOG = EXOTIC_CAR_CATALOG;

  // ============================================================
  // 4. PROCEDURAL PBR & UNITY-HDRP ENVIRONMENT GENERATORS
  // ============================================================
  function createHDRPEnvironmentMap(preset) {
    if (typeof THREE === 'undefined') return null;
    const faces = [];
    for (let f = 0; f < 6; f++) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (f === 2) {
        // +Y Zenith Sky
        ctx.fillStyle = preset === 'sunset' ? '#1e3a66' : (preset === 'arctic' ? '#07162c' : '#164e87');
        ctx.fillRect(0, 0, 128, 128);
      } else if (f === 3) {
        // -Y Ground Bounce
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 128, 128);
      } else {
        // Horizon Sides
        const g = ctx.createLinearGradient(0, 0, 0, 128);
        if (preset === 'sunset') {
          g.addColorStop(0.0, '#1e3a66');
          g.addColorStop(0.45, '#7da8cc');
          g.addColorStop(0.55, '#f59e0b');
          g.addColorStop(0.62, '#334155');
          g.addColorStop(1.0, '#0f172a');
        } else {
          g.addColorStop(0.0, '#164e87');
          g.addColorStop(0.46, '#93c5fd');
          g.addColorStop(0.54, '#e0f2fe');
          g.addColorStop(0.60, '#334155');
          g.addColorStop(1.0, '#0f172a');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);

        // Specular Sun Highlight on face 0
        if (f === 0) {
          const sg = ctx.createRadialGradient(64, 48, 2, 64, 48, 36);
          sg.addColorStop(0, 'rgba(255, 255, 240, 1.0)');
          sg.addColorStop(0.4, 'rgba(255, 230, 170, 0.5)');
          sg.addColorStop(1, 'rgba(255, 200, 100, 0)');
          ctx.fillStyle = sg;
          ctx.fillRect(0, 0, 128, 128);
        }
      }
      faces.push(c);
    }
    const cubeTex = new THREE.CubeTexture(faces);
    cubeTex.needsUpdate = true;
    return cubeTex;
  }

  function createSkyDomeTexture(preset) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    if (preset === 'arctic' || preset === 'night') {
      grad.addColorStop(0.0, '#040b18');
      grad.addColorStop(0.28, '#0b1d36');
      grad.addColorStop(0.48, '#17385c');
      grad.addColorStop(0.54, '#2b587a');
      grad.addColorStop(1.0, '#0f172a');
    } else if (preset === 'sunset' || preset === 'prairie') {
      grad.addColorStop(0.0, '#132a4a');
      grad.addColorStop(0.25, '#2b588c');
      grad.addColorStop(0.44, '#6ea1c8');
      grad.addColorStop(0.50, '#f3c68f');
      grad.addColorStop(0.55, '#d98a5c');
      grad.addColorStop(1.0, '#1e293b');
    } else {
      grad.addColorStop(0.0, '#0f2c59');
      grad.addColorStop(0.22, '#1e5696');
      grad.addColorStop(0.42, '#4d8fd1');
      grad.addColorStop(0.49, '#9ec9f0');
      grad.addColorStop(0.53, '#dcecf9');
      grad.addColorStop(1.0, '#1e293b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    for (let i = 0; i < 110; i++) {
      const cx = (Math.sin(i * 73.1) * 0.5 + 0.5) * 1024;
      const cy = 95 + (Math.cos(i * 31.7) * 0.5 + 0.5) * 145;
      const rw = 40 + (i % 7) * 22;
      const rh = 6 + (i % 4) * 4;
      const cGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, rw);
      const alpha = (preset === 'arctic') ? 0.08 : 0.16;
      cGrad.addColorStop(0, `rgba(255, 252, 245, ${alpha})`);
      cGrad.addColorStop(0.6, `rgba(235, 244, 255, ${alpha * 0.45})`);
      cGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (preset === 'arctic') {
      for (let b = 0; b < 3; b++) {
        ctx.save();
        ctx.beginPath();
        const baseY = 110 + b * 32;
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= 1024; x += 32) {
          const y = baseY + Math.sin(x * 0.012 + b * 1.7) * 24 + Math.cos(x * 0.025) * 10;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(1024, baseY + 55);
        ctx.lineTo(0, baseY + 55);
        ctx.closePath();
        const aGrad = ctx.createLinearGradient(0, baseY - 20, 0, baseY + 55);
        aGrad.addColorStop(0, 'rgba(0, 255, 170, 0)');
        aGrad.addColorStop(0.4, b % 2 === 0 ? 'rgba(0, 255, 165, 0.28)' : 'rgba(56, 189, 248, 0.24)');
        aGrad.addColorStop(0.8, 'rgba(168, 85, 247, 0.12)');
        aGrad.addColorStop(1, 'rgba(0, 255, 170, 0)');
        ctx.fillStyle = aGrad;
        ctx.fill();
        ctx.restore();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createSunGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 124);
    g.addColorStop(0.0, 'rgba(255, 255, 250, 1.0)');
    g.addColorStop(0.18, 'rgba(255, 248, 220, 0.92)');
    g.addColorStop(0.42, 'rgba(255, 215, 140, 0.36)');
    g.addColorStop(0.75, 'rgba(255, 180, 90, 0.08)');
    g.addColorStop(1.0, 'rgba(255, 160, 60, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
  }

  function createTerrainMicroDetailTexture(baseHex, snowFraction) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const c = new THREE.Color(baseHex || 0x222a24);
    const rBase = Math.round(c.r * 255);
    const gBase = Math.round(c.g * 255);
    const bBase = Math.round(c.b * 255);

    ctx.fillStyle = `rgb(${rBase},${gBase},${bBase})`;
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const pIdx = i >> 2;
      const x = pIdx & 511;
      const y = pIdx >> 9;
      const n1 = Math.sin(x * 0.09 + y * 0.07) * Math.cos(x * 0.05 - y * 0.11);
      const n2 = ((pIdx * 16807) % 2147483647) / 2147483647 - 0.5;
      const delta = n1 * 18 + n2 * 22;

      let r = Math.max(0, Math.min(255, rBase + delta));
      let g = Math.max(0, Math.min(255, gBase + delta));
      let b = Math.max(0, Math.min(255, bBase + delta));

      if (snowFraction > 0 && (n1 + n2 * 0.35) > (0.55 - snowFraction * 0.6)) {
        const Frost = 0.45 + snowFraction * 0.4;
        r = r * (1 - Frost) + 232 * Frost;
        g = g * (1 - Frost) + 240 * Frost;
        b = b * (1 - Frost) + 250 * Frost;
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(36, 36);
    return tex;
  }

  function createHighwayPBRTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 6000; i++) {
      const x = (i * 73) & 511;
      const y = (i * 199) & 511;
      const v = 24 + (i % 18);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      ctx.fillRect(x, y, 2, 2);
    }

    const rutGradL = ctx.createLinearGradient(90, 0, 210, 0);
    rutGradL.addColorStop(0, 'rgba(10,12,16,0)');
    rutGradL.addColorStop(0.5, 'rgba(10,12,16,0.32)');
    rutGradL.addColorStop(1, 'rgba(10,12,16,0)');
    ctx.fillStyle = rutGradL;
    ctx.fillRect(90, 0, 120, 512);

    const rutGradR = ctx.createLinearGradient(302, 0, 422, 0);
    rutGradR.addColorStop(0, 'rgba(10,12,16,0)');
    rutGradR.addColorStop(0.5, 'rgba(10,12,16,0.32)');
    rutGradR.addColorStop(1, 'rgba(10,12,16,0)');
    ctx.fillStyle = rutGradR;
    ctx.fillRect(302, 0, 120, 512);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(24, 0, 8, 512);
    ctx.fillRect(480, 0, 8, 512);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(248, 0, 5, 512);
    for (let y = 16; y < 512; y += 64) {
      ctx.fillRect(259, y, 5, 36);
    }

    ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(136, y, 5, 32);
      ctx.fillRect(371, y, 5, 32);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 28);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createSignBannerTexture(title, subtitle, borderColor, bgHex) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgHex || '#080e1a';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = borderColor || '#00f2ff';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 1008, 240);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 512, 105);
    ctx.fillStyle = borderColor || '#00f2ff';
    ctx.font = '700 26px "Rajdhani", sans-serif';
    ctx.fillText(subtitle || '', 512, 175);
    return new THREE.CanvasTexture(c);
  }

  // ============================================================
  // 5. LIVE TOP-DOWN GPS MAP ENGINE (REPLACES COMPASS RADAR!)
  // ============================================================
  let gpsMapZoomIndex = 0;
  const GPS_MAP_RANGES = [260, 480, 160];
  let gpsMapExpanded = false;

  function upgradeRadarContainerToGPSMap() {
    // 1. Province Realms #radar-container
    const radarBox = document.getElementById('radar-container');
    if (radarBox && !radarBox.dataset.gpsUpgraded) {
      radarBox.dataset.gpsUpgraded = '1';
      radarBox.style.width = '156px';
      radarBox.style.height = '184px';
      radarBox.style.borderRadius = '12px';
      radarBox.style.padding = '6px';
      radarBox.style.background = 'rgba(8, 15, 26, 0.94)';
      radarBox.style.border = '1.5px solid #00f2ff';
      radarBox.style.pointerEvents = 'auto';
      radarBox.style.cursor = 'pointer';
      radarBox.title = 'Click to Zoom / Expand GPS Map';
      radarBox.onclick = function(e) {
        e.stopPropagation();
        gpsMapZoomIndex = (gpsMapZoomIndex + 1) % GPS_MAP_RANGES.length;
        gpsMapExpanded = (gpsMapZoomIndex === 1);
        radarBox.style.width = gpsMapExpanded ? '230px' : '156px';
        radarBox.style.height = gpsMapExpanded ? '258px' : '184px';
        const cvs = document.getElementById('hud-radar-canvas');
        if (cvs) {
          cvs.width = gpsMapExpanded ? 214 : 142;
          cvs.height = gpsMapExpanded ? 214 : 142;
          cvs.style.width = cvs.width + 'px';
          cvs.style.height = cvs.height + 'px';
        }
      };

      const headerDiv = radarBox.querySelector('div');
      if (headerDiv) {
        headerDiv.innerHTML = `
          <span style="color:#00f2ff; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-map-location-dot"></i> GPS MAP</span>
          <span id="radar-dist-lbl" style="color:#ffd700;">245m</span>
        `;
      }
      const cvs = document.getElementById('hud-radar-canvas');
      if (cvs) {
        cvs.width = 142;
        cvs.height = 142;
        cvs.style.width = '142px';
        cvs.style.height = '142px';
        cvs.style.borderRadius = '8px';
        cvs.style.border = '1px solid rgba(0, 242, 255, 0.35)';
      }
    }

    // 2. Main Game #city-hud-radar-canvas & #minimap-canvas
    const cityCvs = document.getElementById('city-hud-radar-canvas');
    if (cityCvs && !cityCvs.dataset.gpsUpgraded) {
      cityCvs.dataset.gpsUpgraded = '1';
      cityCvs.style.borderRadius = '8px';
      cityCvs.width = 124;
      cityCvs.height = 124;
      cityCvs.style.width = '124px';
      cityCvs.style.height = '124px';
      const parent = cityCvs.parentElement;
      if (parent) {
        const hdr = parent.querySelector('span');
        if (hdr && hdr.textContent.includes('RADAR')) {
          hdr.innerHTML = '<i class="fa-solid fa-map-location-dot"></i> GPS MAP';
        }
      }
    }

    const miniCvs = document.getElementById('minimap-canvas');
    if (miniCvs && !miniCvs.dataset.gpsUpgraded) {
      miniCvs.dataset.gpsUpgraded = '1';
      miniCvs.style.borderRadius = '8px';
      const lbl = document.querySelector('.minimap-label');
      if (lbl) lbl.textContent = 'LIVE GPS MAP';
    }
  }

  function renderLiveGPSMinimap(canvas, pPos, pYaw, options) {
    if (!canvas || !pPos) return;
    upgradeRadarContainerToGPSMap();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const opts = options || {};
    const isMetropolis = !!opts.isMetropolis;
    const maxRange = opts.maxRange || GPS_MAP_RANGES[gpsMapZoomIndex] || 280;
    const scale = (w * 0.48) / maxRange;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // 1. Cartographic Terrain Background (North-Up Satellite/Topo Map Hybrid)
    ctx.fillStyle = isMetropolis ? '#141e28' : '#16241d';
    ctx.fillRect(0, 0, w, h);

    // Helper: Convert World (wx, wz) to Top-Down Map Pixel (mx, my) [North-Up: -Z is UP, +X is RIGHT]
    const toMap = (wx, wz) => {
      return {
        x: cx + (wx - pPos.x) * scale,
        y: cy + (wz - pPos.z) * scale
      };
    };

    // 2. Topographic Map Grid Lines (Every 100m in world space)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)';
    ctx.lineWidth = 1;
    const startGridX = Math.floor((pPos.x - maxRange) / 100) * 100;
    const endGridX = Math.ceil((pPos.x + maxRange) / 100) * 100;
    for (let gx = startGridX; gx <= endGridX; gx += 100) {
      const pt = toMap(gx, pPos.z);
      ctx.beginPath();
      ctx.moveTo(pt.x, 0);
      ctx.lineTo(pt.x, h);
      ctx.stroke();
    }
    const startGridZ = Math.floor((pPos.z - maxRange) / 100) * 100;
    const endGridZ = Math.ceil((pPos.z + maxRange) / 100) * 100;
    for (let gz = startGridZ; gz <= endGridZ; gz += 100) {
      const pt = toMap(pPos.x, gz);
      ctx.beginPath();
      ctx.moveTo(0, pt.y);
      ctx.lineTo(w, pt.y);
      ctx.stroke();
    }

    // 3. Water Bodies (Rivers, Lakes, Carrier Harbor Basin)
    ctx.fillStyle = '#0369a1';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    const drawWaterRect = (wx, wz, ww, wd) => {
      const tl = toMap(wx - ww / 2, wz - wd / 2);
      ctx.fillRect(tl.x, tl.y, ww * scale, wd * scale);
      ctx.strokeRect(tl.x, tl.y, ww * scale, wd * scale);
    };

    if (isMetropolis) {
      // Bow River channel & Carrier Deepwater Harbor Basin (-340, 340) + Atlantis Ocean (-520, -420)
      drawWaterRect(-340, 340, 320, 260);
      drawWaterRect(-520, -420, 220, 220);
      // Bow River winding north of downtown
      ctx.fillStyle = 'rgba(2, 132, 199, 0.55)';
      const rTop = toMap(-600, -185);
      ctx.fillRect(rTop.x, rTop.y, 1200 * scale, 22 * scale);
    } else {
      // Provincial Carrier & Naval Basin (165, -180) + Geothermal / Coastal Water
      drawWaterRect(165, -180, 110, 140);
      drawWaterRect(-36, -35, 22, 22);
    }

    // 4. Paved Roadways, Highways & Runways (With Yellow Centerlines!)
    const drawRoad = (x1, z1, x2, z2, roadWidthM, isRunway) => {
      const p1 = toMap(x1, z1);
      const p2 = toMap(x2, z2);
      const pixW = Math.max(3, roadWidthM * scale);
      // Road shoulder
      ctx.strokeStyle = isRunway ? '#94a3b8' : '#64748b';
      ctx.lineWidth = pixW + 1.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      // Asphalt core
      ctx.strokeStyle = isRunway ? '#1e293b' : '#334155';
      ctx.lineWidth = pixW;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      // Yellow or White Dashed Centerline
      ctx.strokeStyle = isRunway ? '#ffffff' : '#facc15';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    if (isMetropolis) {
      // Calgary Metropolis Arterial Street Grid
      [-136, -68, 0, 68, 136].forEach(coord => {
        drawRoad(coord, -450, coord, 560, 16, false);
        drawRoad(-450, coord, 560, coord, 16, false);
      });
      // YYC Runway 09/27
      drawRoad(320, -220, 740, -220, 26, true);
      // Starbase Causeway
      drawRoad(340, -220, 650, -550, 14, false);
    } else {
      // Trans-Canada Main Highway (North-South along X=0)
      drawRoad(0, -550, 0, 550, 32, false);
      // Cross Boulevards to Dealerships, Mall/Events/Rec, Military Base & Naval Carrier
      drawRoad(-220, 55, 140, 55, 16, false);
      drawRoad(-220, 115, 120, 115, 16, false);
      drawRoad(-240, -160, 240, -160, 18, false);
      // Carrier Flight Deck & Regional Airstrip
      drawRoad(165, -230, 165, -130, 24, true);
    }

    // 5. 3D Building Footprints & Labeled District Blocks
    const drawFootprint = (wx, wz, bw, bd, fillCol, borderCol, label) => {
      const tl = toMap(wx - bw / 2, wz - bd / 2);
      const pw = Math.max(5, bw * scale);
      const pd = Math.max(5, bd * scale);
      if (tl.x + pw < 0 || tl.x > w || tl.y + pd < 0 || tl.y > h) return;
      ctx.fillStyle = fillCol;
      ctx.fillRect(tl.x, tl.y, pw, pd);
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(tl.x, tl.y, pw, pd);
      if (label) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 7.5px "Orbitron", monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, tl.x + pw / 2, tl.y - 2);
      }
    };

    if (isMetropolis) {
      drawFootprint(-35, -45, 22, 22, 'rgba(239, 68, 68, 0.55)', '#ef4444', 'TOWER');
      drawFootprint(25, -85, 36, 26, 'rgba(56, 189, 248, 0.5)', '#38bdf8', 'THE BOW');
      drawFootprint(0, 122, 68, 62, 'rgba(0, 242, 255, 0.45)', '#00f2ff', 'GRAND MALL');
      drawFootprint(-145, -45, 38, 32, 'rgba(250, 204, 21, 0.55)', '#facc15', 'LAMBO/FERRARI');
      drawFootprint(-145, -115, 38, 32, 'rgba(249, 115, 22, 0.55)', '#f97316', 'MCLAREN/BUGATTI');
      drawFootprint(-145, 115, 42, 34, 'rgba(225, 29, 72, 0.55)', '#f43f5e', 'TESLA FLY');
      drawFootprint(165, -75, 58, 48, 'rgba(168, 85, 247, 0.5)', '#a855f7', 'EVENTS ARENA');
      drawFootprint(-165, -210, 64, 52, 'rgba(16, 185, 129, 0.5)', '#10b981', 'REC & POOL');
      drawFootprint(-230, 160, 130, 100, 'rgba(34, 197, 94, 0.45)', '#22c55e', 'MILITARY BASE');
      drawFootprint(-340, 340, 56, 220, 'rgba(148, 163, 184, 0.65)', '#38bdf8', 'CARRIER CVN');
      drawFootprint(650, -550, 52, 52, 'rgba(245, 158, 11, 0.65)', '#f59e0b', 'STARSHIP PAD');
      drawFootprint(380, -145, 52, 28, 'rgba(56, 189, 248, 0.5)', '#38bdf8', 'AIRPORT');
    } else {
      // Provincial Map Footprints
      drawFootprint(0, -200, 36, 36, 'rgba(250, 204, 21, 0.6)', '#ffd700', 'LANDMARK');
      drawFootprint(62, 55, 38, 32, 'rgba(239, 68, 68, 0.6)', '#f43f5e', 'CARS & TESLA');
      drawFootprint(-85, 115, 58, 48, 'rgba(0, 242, 255, 0.5)', '#00f2ff', 'MALL & EVENTS');
      drawFootprint(-85, 45, 42, 36, 'rgba(16, 185, 129, 0.5)', '#10b981', 'REC & POOL');
      drawFootprint(-155, -160, 86, 72, 'rgba(34, 197, 94, 0.5)', '#22c55e', 'MIL BASE & SAM');
      drawFootprint(165, -180, 44, 130, 'rgba(148, 163, 184, 0.7)', '#38bdf8', 'CARRIER & ROCKET');
    }

    // 6. Live Moving Entities (Vehicles, Planes, Police Cruisers, Codex)
    const drawDot = (wx, wz, col, radius, lbl) => {
      const pt = toMap(wx, wz);
      const clX = Math.max(6, Math.min(w - 6, pt.x));
      const clY = Math.max(6, Math.min(h - 6, pt.y));
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(clX, clY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (lbl) {
        ctx.fillStyle = col;
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, clX, clY - radius - 2);
      }
    };

    if (opts.landmarkPos) {
      drawDot(opts.landmarkPos.x, opts.landmarkPos.z, '#ffd700', 4, '');
      const dist = Math.round(Math.hypot(opts.landmarkPos.x - pPos.x, opts.landmarkPos.z - pPos.z));
      const distEl = document.getElementById('radar-dist-lbl') || document.getElementById('city-radar-dist-lbl');
      if (distEl) distEl.textContent = `${dist}m`;
    }
    if (opts.vehiclePos) {
      drawDot(opts.vehiclePos.x, opts.vehiclePos.z, '#ff8800', 3.8, 'CAR');
    }
    if (opts.codexPos) {
      drawDot(opts.codexPos.x, opts.codexPos.z, '#00f2ff', 3.2, '');
    }

    // Draw Police Cruisers on GPS Map (Flashing Red/Blue)
    const flash = Math.sin(performance.now() * 0.02) > 0;
    if (window.HyperRealismEngine && window.HyperRealismEngine.policeUnits) {
      window.HyperRealismEngine.policeUnits.forEach(u => {
        if (u.mesh) {
          drawDot(u.mesh.position.x, u.mesh.position.z, flash ? '#ef4444' : '#3b82f6', 3.5, 'COP');
        }
      });
    }
    if (window.militaryAviationState && window.militaryAviationState.policeCruisers) {
      window.militaryAviationState.policeCruisers.forEach(c => {
        if (c.mesh) {
          drawDot(c.mesh.position.x, c.mesh.position.z, flash ? '#ef4444' : '#3b82f6', 3.5, 'COP');
        }
      });
    }

    // 7. Player GPS Navigation Chevron & View Cone at Map Center
    ctx.save();
    ctx.translate(cx, cy);
    // In Three.js, yaw=0 faces -Z (Up on North-Up map), positive yaw rotates counter-clockwise
    ctx.rotate(-pYaw);

    // Translucent GPS View Cone
    const coneGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    coneGrad.addColorStop(0, 'rgba(0, 242, 255, 0.38)');
    coneGrad.addColorStop(1, 'rgba(0, 242, 255, 0.0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 26, -Math.PI * 0.72, -Math.PI * 0.28);
    ctx.closePath();
    ctx.fill();

    // Crisp GPS Arrow
    ctx.fillStyle = '#00f2ff';
    ctx.strokeStyle = '#08101c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5.5, 6);
    ctx.lineTo(0, 3.2);
    ctx.lineTo(-5.5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 8. Map Frame Overlay: Scale Bar & North Badge
    ctx.fillStyle = 'rgba(8, 15, 26, 0.82)';
    ctx.fillRect(4, h - 15, 54, 12);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`GPS ${maxRange}M`, 7, h - 6);

    // North Indicator Badge in top-left corner of map
    ctx.fillStyle = 'rgba(8, 15, 26, 0.85)';
    ctx.fillRect(4, 4, 16, 14);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', 12, 14);

    ctx.restore();
  }

  // ============================================================
  // 6. HYPER REALISM ENGINE CLASS
  // ============================================================
  class HyperRealismEngine {
    constructor() {
      this.initialized = false;
      this.quality = detectOptimalQuality();
      this.profile = QUALITY_PROFILES[this.quality];

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.player = null;
      this.gameState = null;

      this.sunMesh = null;
      this.sunCorona = null;
      this.moonMesh = null;
      this.sunLight = null;
      this.hemiLight = null;
      this.envMap = null;
      this.distantCullGroup = [];

      // Canadian Environmental Mechanics
      this.activeGearIndex = 0;
      this.equippedGear = CANADIAN_GEAR_TYPES[0];
      this.warmth = 100.0;
      this.thermosCount = 3;
      this.lastVaporTime = 0;
      this.outdoorTemp = -18;
      this.isInsideShelter = false;

      // Models & Particles
      this.tacticalDroneMesh = null;
      this.droneRotors = [];
      this.cyberCarModel = null;
      this.vaporParticles = [];

      // Exotic Cars & Tesla Aero-Flight State
      this.activeCarId = 'lamborghini';
      this.activeVehicleGroup = null;
      this.activeCarWheels = [];
      this.activeCarSteers = [];
      this.teslaFlightActive = false;
      this.teslaAltitude = 0;
      this.teslaClimbVel = 0;
      this.teslaPitch = 0;
      this.teslaRoll = 0;
      this.teslaAeroWings = [];
      this.teslaThrusterGlows = [];
      this.dealershipShowroomCars = [];

      // Police ("Cops") & Military Air-Defense State
      this.wantedStars = 0;
      this.wantedDecayTimer = 0;
      this.policeUnits = [];
      this.policeChopper = null;
      this.samTurrets = [];
      this.samMissiles = [];
      this.provincialRocket = null;
      this.provincialRocketLaunching = false;

      this.lastCullCheck = 0;
    }

    init(scene, camera, renderer, player, gameState) {
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.player = player;
      this.gameState = gameState;

      if (!this.renderer || !this.scene) return;

      if (typeof THREE !== 'undefined') {
        if (THREE.sRGBEncoding && this.renderer.outputEncoding !== undefined) {
          this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
        if (THREE.ACESFilmicToneMapping) {
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 0.96;
        }
        // Apply Unity-HDRP Procedural Cubemap Reflections to Scene Environment
        this.envMap = createHDRPEnvironmentMap('alpine');
        if (this.envMap) {
          this.scene.environment = this.envMap;
        }
      }

      this.applyQuality(this.quality, false);
      this.setupCelestialRealism();
      this.setupAtmosphericVapor();
      this.loadHighFidelityAssets();
      this.syncSurvivalHUD();

      // Hook Metropolis GPS Map & Universal Dealership/Tesla/Cops UI
      this.hookMetropolisGPSAndSystems();
      this.injectUniversalDealershipAndMobileUI();

      this.initialized = true;
      console.log(`[HyperRealismEngine] Unity-HDRP Pipeline & Exotic/Tesla/Military Engine Initialized (${this.quality.toUpperCase()}).`);
    }

    setQuality(mode) {
      if (!QUALITY_PROFILES[mode]) mode = 'med';
      this.quality = mode;
      this.profile = QUALITY_PROFILES[mode];
      try {
        localStorage.setItem('HYPER_REALISM_QUALITY', mode);
      } catch (e) {}
      this.applyQuality(mode, true);
    }

    applyQuality(mode, notify = false) {
      const p = QUALITY_PROFILES[mode] || QUALITY_PROFILES.med;
      this.profile = p;

      if (this.renderer) {
        const dpr = Math.min(window.devicePixelRatio || 1.0, p.pixelRatio);
        this.renderer.setPixelRatio(dpr);

        if (this.renderer.shadowMap) {
          this.renderer.shadowMap.enabled = p.shadows;
          if (p.shadows) {
            this.renderer.shadowMap.type = p.shadowType;
          }
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }

      if (this.scene && this.scene.fog) {
        if (mode === 'low') {
          this.scene.fog.density = 0.0016;
        } else if (mode === 'med') {
          this.scene.fog.density = 0.0009;
        } else {
          this.scene.fog.density = 0.00055;
        }
      }

      const qLbl = document.getElementById('quality-label') || document.getElementById('hud-quality-val');
      if (qLbl) qLbl.textContent = mode.toUpperCase();

      if (notify && typeof window.showStoreNotification === 'function') {
        window.showStoreNotification(`GRAPHICS PROFILE: ${p.name}`);
      }
    }

    setupCelestialRealism() {
      if (!this.scene || typeof THREE === 'undefined') return;
      if (typeof window.sunVisualMesh !== 'undefined' && window.sunVisualMesh) return;

      const glowTex = createSunGlowTexture();
      const sunMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xfffaed,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      });
      this.sunMesh = new THREE.Sprite(sunMat);
      this.sunMesh.scale.set(220, 220, 1);
      this.sunMesh.position.set(260, 480, 190);
      this.scene.add(this.sunMesh);

      const moonMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xa5d8ff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      });
      this.moonMesh = new THREE.Sprite(moonMat);
      this.moonMesh.scale.set(150, 150, 1);
      this.moonMesh.position.set(-260, 440, -190);
      this.moonMesh.visible = false;
      this.scene.add(this.moonMesh);
    }

    loadHighFidelityAssets() {
      if (!this.scene || typeof THREE === 'undefined') return;

      const dGroup = new THREE.Group();
      const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.7, roughness: 0.3 });
      const lensMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const rotorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });

      const core = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.58), carbonMat);
      dGroup.add(core);

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.36), trimMat);
      canopy.position.set(0, 0.08, -0.04);
      dGroup.add(canopy);

      const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), carbonMat);
      gimbal.position.set(0, -0.09, -0.18);
      dGroup.add(gimbal);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), lensMat);
      eye.position.set(0, -0.10, -0.25);
      dGroup.add(eye);

      this.droneRotors = [];
      [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]].forEach(([rx, rz], idx) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.52, 6), carbonMat);
        arm.rotation.z = Math.PI / 2;
        arm.rotation.y = Math.atan2(rz, rx);
        arm.position.set(rx * 0.5, 0, rz * 0.5);
        dGroup.add(arm);

        const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 8), trimMat);
        motor.position.set(rx, 0.03, rz);
        dGroup.add(motor);

        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.035), rotorMat);
        blade.position.set(rx, 0.075, rz);
        dGroup.add(blade);
        this.droneRotors.push(blade);

        const navLed = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 6, 6),
          new THREE.MeshBasicMaterial({ color: idx < 2 ? 0x22c55e : 0xef4444 })
        );
        navLed.position.set(rx, -0.02, rz);
        dGroup.add(navLed);
      });

      dGroup.scale.set(0.55, 0.55, 0.55);
      dGroup.position.set(-3.2, 4.2, -2.5);
      this.scene.add(dGroup);
      this.tacticalDroneMesh = dGroup;
    }

    loadAssetWithFallback(loader, paths, onSuccess, onFallback) {
      let idx = 0;
      const tryNext = () => {
        if (idx >= paths.length) {
          if (onFallback) onFallback();
          return;
        }
        const url = paths[idx++];
        loader.load(url, gltf => {
          onSuccess(gltf);
        }, undefined, () => {
          tryNext();
        });
      };
      tryNext();
    }

    // ------------------------------------------------------------
    // MULTI-BRAND 3D EXOTIC SUPERCAR & FLYING TESLA BUILDER
    // Builds Lamborghini, Ferrari, McLaren, Bugatti, Porsche, Flying Tesla & RCMP Cruiser
    // ------------------------------------------------------------
    buildRealWorldSupercar(targetGroup, modelId, cyberCarWheels, cyberCarSteers) {
      if (!targetGroup || typeof THREE === 'undefined') return null;

      // Clear previous custom supercar meshes inside targetGroup
      for (let i = targetGroup.children.length - 1; i >= 0; i--) {
        const ch = targetGroup.children[i];
        if (ch.name === 'HyperSupercarMesh') {
          targetGroup.remove(ch);
        } else if (ch.isMesh || ch.isGroup) {
          // Hide old default box/chassis meshes without breaking lights
          if (!ch.isLight && ch.name !== 'headlightTarget') {
            ch.visible = false;
          }
        }
      }

      if (Array.isArray(cyberCarWheels)) cyberCarWheels.length = 0;
      if (Array.isArray(cyberCarSteers)) cyberCarSteers.length = 0;
      this.teslaAeroWings = [];
      this.teslaThrusterGlows = [];

      const spec = EXOTIC_CAR_CATALOG.find(c => c.id === modelId) || EXOTIC_CAR_CATALOG[0];
      this.activeCarId = spec.id;
      this.activeVehicleGroup = targetGroup;

      const vGroup = new THREE.Group();
      vGroup.name = 'HyperSupercarMesh';

      const isCybertruck = (spec.id === 'tesla_cybertruck');
      const isPolice = !!spec.isPolice;

      const paintMat = new THREE.MeshPhysicalMaterial({
        color: spec.color,
        metalness: isCybertruck ? 0.92 : 0.78,
        roughness: isCybertruck ? 0.24 : 0.14,
        clearcoat: isCybertruck ? 0.2 : 1.0,
        clearcoatRoughness: 0.06
      });
      const accentMat = new THREE.MeshStandardMaterial({
        color: spec.accent,
        metalness: 0.85,
        roughness: 0.28
      });
      const carbonMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.82,
        roughness: 0.32
      });
      const chromeMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.96,
        roughness: 0.10
      });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x091322,
        metalness: 0.85,
        roughness: 0.06,
        transparent: true,
        opacity: 0.56,
        clearcoat: 1.0
      });
      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x111318,
        metalness: 0.15,
        roughness: 0.88
      });
      const caliperMat = new THREE.MeshStandardMaterial({
        color: spec.caliper || 0xef4444,
        metalness: 0.8,
        roughness: 0.2
      });
      const headlightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
      const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
      const ionCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

      // ------------------------------------------------------------
      // COCKPIT INTERIOR & SEATED DRIVER SILHOUETTE (NO FLOAT GLITCH)
      // ------------------------------------------------------------
      const interiorGroup = new THREE.Group();
      const seatY = isCybertruck ? 0.80 : 0.60;
      [-0.46, 0.46].forEach(sx => {
        const bucketSeat = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.52, 0.50), carbonMat);
        bucketSeat.position.set(sx, seatY, -0.22);
        bucketSeat.rotation.x = -0.18;
        interiorGroup.add(bucketSeat);
      });
      const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.06), chromeMat);
      yoke.position.set(-0.46, seatY + 0.20, 0.35);
      yoke.rotation.x = -0.25;
      interiorGroup.add(yoke);

      const centerScreen = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.04), ionCyanMat);
      centerScreen.position.set(0, seatY + 0.18, 0.42);
      centerScreen.rotation.x = -0.22;
      interiorGroup.add(centerScreen);
      vGroup.add(interiorGroup);

      // Seated Driver Figure inside cabin (strictly contained below roofline)
      const driverGroup = new THREE.Group();
      driverGroup.name = 'SeatedDriverGroup';
      driverGroup.position.set(-0.46, seatY, -0.18);
      const drvTorso = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.38, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.3 })
      );
      drvTorso.position.set(0, 0.12, 0);
      drvTorso.rotation.x = -0.12;
      driverGroup.add(drvTorso);

      const drvHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.8 })
      );
      drvHead.position.set(0, 0.38, 0.02);
      driverGroup.add(drvHead);

      const drvVisor = new THREE.Mesh(
        new THREE.BoxGeometry(0.20, 0.06, 0.12),
        ionCyanMat
      );
      drvVisor.position.set(0, 0.39, 0.09);
      driverGroup.add(drvVisor);
      vGroup.add(driverGroup);
      this.activeDriverMesh = driverGroup;

      if (isCybertruck) {
        // TESLA CYBERTRUCK 30X STAINLESS STEEL EXOSKELETON
        const lowerBed = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.68, 5.45), paintMat);
        lowerBed.position.set(0, 0.72, 0);
        lowerBed.castShadow = true;
        vGroup.add(lowerBed);

        // Angular Wedge Roof Peak
        const wedgeFront = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.55, 2.7), glassMat);
        wedgeFront.rotation.x = 0.26;
        wedgeFront.position.set(0, 1.28, 0.95);
        vGroup.add(wedgeFront);

        const wedgeRear = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.55, 2.95), paintMat);
        wedgeRear.rotation.x = -0.22;
        wedgeRear.position.set(0, 1.28, -1.15);
        vGroup.add(wedgeRear);

        // Full-Width Cyber Laser Front Lightbar & Rear Crimson Bar
        const cyberFrontLed = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.08, 0.12), headlightMat);
        cyberFrontLed.position.set(0, 1.04, 2.73);
        vGroup.add(cyberFrontLed);

        const cyberRearLed = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.09, 0.12), taillightMat);
        cyberRearLed.position.set(0, 1.06, -2.73);
        vGroup.add(cyberRearLed);
      } else {
        // SCULPTED AERODYNAMIC SUPERCAR / INTERCEPTOR CHASSIS
        const bodyH = isPolice ? 0.58 : 0.44;
        const bodyY = isPolice ? 0.78 : 0.62;

        // Carbon Ground-Effect Splitter & Diffuser Floor
        const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.12, 5.12), carbonMat);
        splitter.position.set(0, 0.34, 0);
        vGroup.add(splitter);

        // Main Aerodynamic Body Tub
        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.34, bodyH, 4.88), paintMat);
        mainBody.position.set(0, bodyY, 0);
        mainBody.castShadow = true;
        mainBody.receiveShadow = true;
        vGroup.add(mainBody);

        // Sculpted Sloped Supercar Nose Wedge
        const noseWedge = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.28, 1.35), paintMat);
        noseWedge.rotation.x = 0.22;
        noseWedge.position.set(0, bodyY - 0.08, 2.15);
        vGroup.add(noseWedge);

        // Side Air Intakes / Bugatti C-Line / Police White Doors
        [-1.19, 1.19].forEach(sx => {
          const sideBlade = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, bodyH * 0.78, 2.25),
            isPolice ? accentMat : carbonMat
          );
          sideBlade.position.set(sx, bodyY, -0.1);
          vGroup.add(sideBlade);
        });

        // Teardrop Glass Canopy
        const cabinH = isPolice ? 0.56 : 0.44;
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.88, cabinH, 2.25), glassMat);
        cabin.position.set(0, bodyY + bodyH * 0.5 + cabinH * 0.42, -0.15);
        vGroup.add(cabin);

        const roofPanel = new THREE.Mesh(
          new THREE.BoxGeometry(1.76, 0.07, 1.65),
          (spec.id === 'ferrari' || spec.id === 'mclaren' || spec.id === 'bugatti') ? carbonMat : paintMat
        );
        roofPanel.position.set(0, bodyY + bodyH * 0.5 + cabinH * 0.85, -0.18);
        vGroup.add(roofPanel);

        // Brand-Specific Rear Engine Louvers & Active Aero Wing
        if (!isPolice) {
          const louvers = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 1.35), carbonMat);
          louvers.position.set(0, bodyY + bodyH * 0.52, -1.55);
          vGroup.add(louvers);

          // Active High-Downforce Wing (Lamborghini / Porsche / McLaren)
          const wingGroup = new THREE.Group();
          wingGroup.position.set(0, bodyY + bodyH * 0.5 + 0.34, -2.25);
          const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.06, 0.42), carbonMat);
          wingGroup.add(wingBlade);
          [-0.85, 0.85].forEach(wx => {
            const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.22), carbonMat);
            strut.position.set(wx, -0.17, 0);
            wingGroup.add(strut);
            const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.52), paintMat);
            endplate.position.set(wx * 1.32, 0.02, 0);
            wingGroup.add(endplate);
          });
          vGroup.add(wingGroup);
        } else {
          // RCMP Police Strobe Lightbar & Push Bumper
          const lightbarBase = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 0.32), chromeMat);
          lightbarBase.position.set(0, 1.68, -0.1);
          vGroup.add(lightbarBase);

          const redStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.10, 0.28), taillightMat);
          redStrobe.position.set(-0.42, 1.72, -0.1);
          vGroup.add(redStrobe);

          const blueStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.10, 0.28), new THREE.MeshBasicMaterial({ color: 0x0066ff }));
          blueStrobe.position.set(0.42, 1.72, -0.1);
          vGroup.add(blueStrobe);

          const pushBar = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.45, 0.22), carbonMat);
          pushBar.position.set(0, 0.65, 2.58);
          vGroup.add(pushBar);
        }

        // Front LED Headlights & Rear Taillights
        [-0.82, 0.82].forEach(hx => {
          const hl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.10, 0.12), headlightMat);
          hl.position.set(hx, bodyY + 0.06, 2.46);
          hl.rotation.z = hx > 0 ? -0.12 : 0.12;
          vGroup.add(hl);
        });

        const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.10, 0.10), taillightMat);
        tailStrip.position.set(0, bodyY + 0.12, -2.45);
        vGroup.add(tailStrip);

        // Twin Titanium / Hexagonal Exhaust Pipes
        [-0.52, 0.52].forEach(ex => {
          const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 0.28, 12), chromeMat);
          pipe.rotation.x = Math.PI / 2;
          pipe.position.set(ex, 0.48, -2.48);
          vGroup.add(pipe);
        });
      }

      // ------------------------------------------------------------
      // DEPLOYABLE TESLA SPACEX AERO-WINGS & COLD-GAS ION THRUSTERS
      // ------------------------------------------------------------
      if (spec.canFly) {
        [-1, 1].forEach(side => {
          const wingPivot = new THREE.Group();
          wingPivot.position.set(side * 1.15, 0.62, -0.2);

          const aeroWing = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 1.45), carbonMat);
          aeroWing.position.set(side * 0.85, 0, 0);
          wingPivot.add(aeroWing);

          const wingTipGlow = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.08, 0.12), ionCyanMat);
          wingTipGlow.position.set(side * 0.85, 0, -0.68);
          wingPivot.add(wingTipGlow);

          // Retracted by default until Flight Mode is engaged
          wingPivot.scale.x = 0.01;
          wingPivot.visible = false;
          vGroup.add(wingPivot);
          this.teslaAeroWings.push(wingPivot);
        });

        // Rear SpaceX Cold-Gas / Plasma Main Rocket Nozzle
        const spaceXNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.45, 16), chromeMat);
        spaceXNozzle.rotation.x = Math.PI / 2;
        spaceXNozzle.position.set(0, 0.58, -2.62);
        vGroup.add(spaceXNozzle);

        const mainPlume = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.2, 12), ionCyanMat);
        mainPlume.rotation.x = -Math.PI / 2;
        mainPlume.position.set(0, 0.58, -3.7);
        mainPlume.visible = false;
        vGroup.add(mainPlume);
        this.teslaThrusterGlows.push(mainPlume);
      }

      // ------------------------------------------------------------
      // 4 FORGED ALLOY WHEELS + TESLA VTOL HOVER-THRUSTER CONVERSION
      // ------------------------------------------------------------
      const wheelPositions = [
        { x: -1.18, y: 0.46, z: 1.58, front: true },
        { x:  1.18, y: 0.46, z: 1.58, front: true },
        { x: -1.18, y: 0.46, z: -1.58, front: false },
        { x:  1.18, y: 0.46, z: -1.58, front: false }
      ];

      wheelPositions.forEach(wp => {
        const steerPivot = new THREE.Group();
        steerPivot.position.set(wp.x, wp.y, wp.z);
        vGroup.add(steerPivot);

        const spinPivot = new THREE.Group();
        steerPivot.add(spinPivot);

        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.36, 20), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        spinPivot.add(tire);

        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.38, 14), chromeMat);
        rim.rotation.z = Math.PI / 2;
        spinPivot.add(rim);

        const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.18, 0.12), caliperMat);
        caliper.position.set(0, 0.14, 0.12);
        steerPivot.add(caliper);

        // Glowing Ion Hover Ring inside each wheel for Flying Tesla mode
        if (spec.canFly) {
          const ionRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 20), ionCyanMat);
          ionRing.rotation.y = Math.PI / 2;
          ionRing.visible = false;
          spinPivot.add(ionRing);
          this.teslaThrusterGlows.push(ionRing);
        }

        if (Array.isArray(cyberCarWheels)) {
          cyberCarWheels.push({ node: spinPivot, rotX: 0, steerNode: steerPivot });
        }
        if (wp.front && Array.isArray(cyberCarSteers)) {
          cyberCarSteers.push({ node: steerPivot, rotY: 0 });
        }
      });

      targetGroup.add(vGroup);

      // Wrap targetGroup.add once so if cyber_car.glb finishes loading asynchronously in a province, it stays hidden
      if (!targetGroup._hyperAddWrapped) {
        targetGroup._hyperAddWrapped = true;
        const origAdd = targetGroup.add.bind(targetGroup);
        targetGroup.add = function(obj) {
          const res = origAdd(obj);
          if (obj && obj.name !== 'HyperSupercarMesh' && !obj.isLight && obj.name !== 'headlightTarget') {
            obj.visible = false;
          }
          return res;
        };
      }
      return vGroup;
    }

    getActiveVehicleGroup() {
      return (typeof window.roverGroup !== 'undefined' && window.roverGroup)
        ? window.roverGroup
        : ((typeof window.cruiserGroup !== 'undefined' && window.cruiserGroup) ? window.cruiserGroup : this.activeVehicleGroup);
    }

    // Backwards-compatible wrapper used by enhanceProvinceRealm
    buildUltraRealisticCruiser(cruiserGroup, procCruiser, cyberCarWheels, cyberCarSteers, primaryColor, isHeavyHauler) {
      this.activeCarWheels = cyberCarWheels || [];
      this.activeCarSteers = cyberCarSteers || [];
      const savedCar = localStorage.getItem('SELECTED_EXOTIC_CAR') || 'lamborghini';
      return this.buildRealWorldSupercar(cruiserGroup, savedCar, this.activeCarWheels, this.activeCarSteers);
    }

    // ------------------------------------------------------------
    // SPAWN / SWITCH REAL-WORLD SUPERCAR OR FLYING TESLA INSTANTLY
    // ------------------------------------------------------------
    spawnExoticCar(carId, enterImmediately = true) {
      const spec = EXOTIC_CAR_CATALOG.find(c => c.id === carId) || EXOTIC_CAR_CATALOG[0];
      try {
        localStorage.setItem('SELECTED_EXOTIC_CAR', spec.id);
      } catch (e) {}

      // Determine target vehicle group (roverGroup in game.html, cruiserGroup in provinces)
      const vehGroup = this.getActiveVehicleGroup();

      if (vehGroup) {
        // Place car right beside/at player if player exists
        const pObj = this.player || window.player;
        if (pObj && pObj.pos) {
          const yaw = pObj.yaw || 0;
          if (enterImmediately) {
            vehGroup.position.set(pObj.pos.x, Math.max(0.08, pObj.pos.y - 1.0), pObj.pos.z);
          } else {
            vehGroup.position.set(pObj.pos.x - Math.sin(yaw) * 6.0, 0.08, pObj.pos.z - Math.cos(yaw) * 6.0);
          }
          vehGroup.rotation.y = yaw + Math.PI;
        }

        // Rebuild 3D model
        this.buildRealWorldSupercar(vehGroup, spec.id, this.activeCarWheels, this.activeCarSteers);

        // Explicitly hide legacy chassis/cyberCar meshes so they never clip through the supercar
        if (typeof window.roverChassisMesh !== 'undefined' && window.roverChassisMesh) {
          window.roverChassisMesh.visible = false;
        }
        if (typeof window.cyberCarMesh !== 'undefined' && window.cyberCarMesh) {
          window.cyberCarMesh.visible = false;
        }

        // Also sync game.html roverWheels / roverFrontSteerPivots if in Metropolis
        if (typeof window.roverWheels !== 'undefined' && Array.isArray(window.roverWheels)) {
          window.roverWheels.length = 0;
          this.activeCarWheels.forEach(w => window.roverWheels.push(w.node));
        }
        if (typeof window.roverFrontSteerPivots !== 'undefined' && Array.isArray(window.roverFrontSteerPivots)) {
          window.roverFrontSteerPivots.length = 0;
          this.activeCarSteers.forEach(s => window.roverFrontSteerPivots.push(s.node));
        }

        if (enterImmediately) {
          if (typeof window.gameState !== 'undefined' && window.gameState) {
            window.gameState.inVehicle = true;
            const cHud = document.getElementById('car-dashboard-hud') || document.getElementById('car-driving-hud') || document.getElementById('cruiser-hud');
            if (cHud) cHud.style.display = 'block';
          }
          // For province realms where toggleVehicle() enters cruiserGroup when within 8m
          const cruiserHud = document.getElementById('cruiser-hud');
          if (cruiserHud && cruiserHud.style.display === 'none' && typeof window.toggleVehicle === 'function') {
            window.toggleVehicle();
          }
          if (this.playerGroup) this.playerGroup.visible = false;
          if (typeof window.playerGroup !== 'undefined' && window.playerGroup) window.playerGroup.visible = false;
          if (typeof window.playerModelGroup !== 'undefined' && window.playerModelGroup) window.playerModelGroup.visible = false;
        }
      }

      // If switching away from a flying car, reset flight state
      if (!spec.canFly && this.teslaFlightActive) {
        this.setTeslaFlightMode(false);
      }
      this.updateTeslaFlightHUD();

      const msg = spec.canFly
        ? `🛸 SPAWNED ${spec.name.toUpperCase()}! PRESS [X] OR TAP [TESLA FLY] TO ENGAGE AERO-FLIGHT!`
        : `🏎️ SPAWNED ${spec.name.toUpperCase()} (${spec.topSpeedKmh} KM/H)!`;
      this.notifyUser(msg);
      this.closeDealershipModal();
    }

    // ------------------------------------------------------------
    // TESLA SPACEX AERO-FLIGHT MODE CONTROLLER & 3D FLIGHT PHYSICS
    // ------------------------------------------------------------
    toggleTeslaFlightMode() {
      const spec = EXOTIC_CAR_CATALOG.find(c => c.id === this.activeCarId);
      if (!spec || !spec.canFly) {
        // Automatically upgrade/switch to Flying Tesla Roadster so user can fly immediately!
        this.spawnExoticCar('tesla_roadster', true);
        this.setTeslaFlightMode(true);
        return;
      }
      this.setTeslaFlightMode(!this.teslaFlightActive);
    }

    setTeslaFlightMode(enable) {
      this.teslaFlightActive = !!enable;
      const vehGroup = (typeof window.roverGroup !== 'undefined' && window.roverGroup)
        ? window.roverGroup
        : ((typeof window.cruiserGroup !== 'undefined' && window.cruiserGroup) ? window.cruiserGroup : this.activeVehicleGroup);

      // Ensure player is officially inside the vehicle when engaging Tesla Flight so on-foot gravity never fights flight altitude!
      if (this.teslaFlightActive && vehGroup) {
        const pObj = this.player || window.player;
        if (typeof window.gameState !== 'undefined' && window.gameState && !window.gameState.inVehicle) {
          window.gameState.inVehicle = true;
          const dashHud = document.getElementById('car-dashboard-hud');
          if (dashHud) dashHud.style.display = 'block';
        }
        const cruiserHud = document.getElementById('cruiser-hud');
        if (cruiserHud && cruiserHud.style.display === 'none' && typeof window.toggleVehicle === 'function') {
          if (pObj && pObj.pos) {
            vehGroup.position.set(pObj.pos.x, 0.08, pObj.pos.z);
          }
          window.toggleVehicle();
        }
        if (this.playerGroup) this.playerGroup.visible = false;
        if (typeof window.playerGroup !== 'undefined' && window.playerGroup) window.playerGroup.visible = false;
        if (typeof window.playerModelGroup !== 'undefined' && window.playerModelGroup) window.playerModelGroup.visible = false;
      }

      if (this.teslaAeroWings) {
        this.teslaAeroWings.forEach(w => {
          w.visible = this.teslaFlightActive;
          w.scale.x = this.teslaFlightActive ? 1.0 : 0.01;
        });
      }
      if (this.teslaThrusterGlows) {
        this.teslaThrusterGlows.forEach(g => {
          g.visible = this.teslaFlightActive;
        });
      }
      // Tilt wheels 90 deg into horizontal VTOL hover-thrusters when flying
      if (this.activeCarWheels) {
        this.activeCarWheels.forEach(w => {
          if (w.steerNode) {
            w.steerNode.rotation.z = this.teslaFlightActive ? (Math.PI / 2) : 0;
          }
        });
      }

      if (this.teslaFlightActive && vehGroup) {
        this.teslaAltitude = Math.max(vehGroup.position.y + 5.5, 8.5);
        vehGroup.position.y = this.teslaAltitude;
        this.notifyUser('🛸 TESLA SPACEX VTOL FLIGHT ENGAGED! [SPACE/▲] CLIMB · [C/▼] DESCEND · [W/S/A/D] FLY');
      } else if (vehGroup) {
        vehGroup.position.y = 0.08;
        vehGroup.rotation.x = 0;
        vehGroup.rotation.z = 0;
        this.teslaAltitude = 0.08;
        this.notifyUser('🛞 TESLA AERO-THRUSTERS RETRACTED // ROAD DRIVING MODE RESTORED');
      }
      this.updateTeslaFlightHUD();
    }

    updateTeslaFlightPhysics(delta, now) {
      if (!this.teslaFlightActive) return;
      const vehGroup = (typeof window.roverGroup !== 'undefined' && window.roverGroup)
        ? window.roverGroup
        : ((typeof window.cruiserGroup !== 'undefined' && window.cruiserGroup) ? window.cruiserGroup : this.activeVehicleGroup);
      if (!vehGroup) return;

      const k = (typeof window.keys !== 'undefined') ? window.keys : (this._localKeys || {});
      let climbInput = 0;
      if (k['Space'] || this._mobileClimbUp) climbInput += 1;
      if (k['KeyC'] || k['ControlLeft'] || this._mobileClimbDown) climbInput -= 1;

      this.teslaClimbVel = THREE.MathUtils.lerp(this.teslaClimbVel || 0, climbInput * 28.0, delta * 5.0);
      this.teslaAltitude = Math.max(1.8, Math.min(650.0, (this.teslaAltitude || vehGroup.position.y) + this.teslaClimbVel * delta));

      // Gentle hover oscillation + altitude lock
      vehGroup.position.y = this.teslaAltitude + Math.sin(now * 0.005) * 0.14;

      // Forward flight boost & banking aesthetics
      let fwdInput = 0, turnInput = 0;
      if (k['KeyW'] || k['ArrowUp']) fwdInput += 1;
      if (k['KeyS'] || k['ArrowDown']) fwdInput -= 1;
      if (k['KeyA'] || k['ArrowLeft']) turnInput += 1;
      if (k['KeyD'] || k['ArrowRight']) turnInput -= 1;

      if (turnInput !== 0) {
        vehGroup.rotation.y += turnInput * 1.45 * delta;
      }

      // Extra airborne jet thrust
      if (fwdInput !== 0) {
        const fwdVec = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), vehGroup.rotation.y);
        vehGroup.position.addScaledVector(fwdVec, fwdInput * 28.0 * delta);
      }

      this.teslaPitch = THREE.MathUtils.lerp(this.teslaPitch || 0, fwdInput * 0.12 - climbInput * 0.18, delta * 6.0);
      this.teslaRoll = THREE.MathUtils.lerp(this.teslaRoll || 0, -turnInput * 0.26, delta * 6.0);
      vehGroup.rotation.x = this.teslaPitch;
      vehGroup.rotation.z = this.teslaRoll;

      // Keep player synced to flying Tesla and ensure standing avatar is hidden
      const pObj = this.player || window.player;
      if (pObj && pObj.pos) {
        pObj.pos.copy(vehGroup.position).add(new THREE.Vector3(0, 0.9, 0));
        if (pObj.vel) pObj.vel.set(0, 0, 0);
      }
      if (this.playerGroup) this.playerGroup.visible = false;
      if (typeof window.playerGroup !== 'undefined' && window.playerGroup) window.playerGroup.visible = false;
      if (typeof window.playerModelGroup !== 'undefined' && window.playerModelGroup) window.playerModelGroup.visible = false;

      // Smoothly lock camera to the flying Tesla (supports both 3P Chase and 1P Cockpit views)
      const cam = this.camera || window.camera;
      if (cam) {
        const isFirstPerson = (typeof window.gameState !== 'undefined' && window.gameState && window.gameState.cameraMode === '1P') ||
                              (typeof window.cameraMode !== 'undefined' && window.cameraMode === '1P');
        if (isFirstPerson) {
          if (this.activeDriverMesh) this.activeDriverMesh.visible = false;
          const cockOffset = new THREE.Vector3(-0.42, 1.18, 0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), vehGroup.rotation.y);
          cam.position.copy(vehGroup.position).add(cockOffset);
          const lookFwd = new THREE.Vector3(0, 1.05 - this.teslaPitch * 12.0, 28.0).applyAxisAngle(new THREE.Vector3(0, 1, 0), vehGroup.rotation.y);
          cam.lookAt(vehGroup.position.clone().add(lookFwd));
        } else {
          if (this.activeDriverMesh) this.activeDriverMesh.visible = true;
          const camBack = new THREE.Vector3(0, 3.6, -8.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), vehGroup.rotation.y);
          cam.position.lerp(vehGroup.position.clone().add(camBack), 0.42);
          cam.lookAt(vehGroup.position.x, vehGroup.position.y + 1.0, vehGroup.position.z);
        }
      }

      // Update altitude readout on HUD
      const altBadge = document.getElementById('tesla-fly-alt-val');
      if (altBadge) altBadge.textContent = `${Math.round(vehGroup.position.y)}m ALT`;
    }

    updateTeslaFlightHUD() {
      const flyBtn = document.getElementById('hud-btn-tesla-fly');
      if (!flyBtn) return;
      const spec = EXOTIC_CAR_CATALOG.find(c => c.id === this.activeCarId);
      if (this.teslaFlightActive) {
        flyBtn.style.background = 'linear-gradient(135deg, #00f2ff, #0284c7)';
        flyBtn.style.color = '#04101c';
        flyBtn.innerHTML = `<i class="fa-solid fa-jet-fighter-up"></i> TESLA FLYING (<span id="tesla-fly-alt-val">${Math.round(this.teslaAltitude)}m</span>) [X]`;
      } else if (spec && spec.canFly) {
        flyBtn.style.background = 'rgba(225, 29, 72, 0.9)';
        flyBtn.style.color = '#ffffff';
        flyBtn.innerHTML = `<i class="fa-solid fa-shuttle-space"></i> ENGAGE TESLA FLIGHT [X]`;
      } else {
        flyBtn.style.background = 'rgba(15, 23, 42, 0.9)';
        flyBtn.style.color = '#00f2ff';
        flyBtn.innerHTML = `<i class="fa-solid fa-shuttle-space"></i> FLYING TESLA [X]`;
      }
    }

    // ------------------------------------------------------------
    // PROVINCE REALM ULTRA-REALISM & MEGA-WORLD UPGRADER
    // ------------------------------------------------------------
    enhanceProvinceRealm(options) {
      const opts = options || {};
      const scene = opts.scene || window.scene;
      const camera = opts.camera || window.camera;
      const renderer = opts.renderer || window.renderer;
      if (!scene || typeof THREE === 'undefined') return;

      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.player = window.player || null;
      this.playerGroup = opts.playerGroup || window.playerGroup || null;
      this.cruiserGroup = opts.cruiserGroup || window.cruiserGroup || null;

      // 1. Calibrate Physically-Based Renderer & Unity-HDRP Environment Map
      if (renderer && THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.94;
      }
      if (opts.hemiLight) opts.hemiLight.intensity = 0.62;
      if (opts.dirLight) opts.dirLight.intensity = 1.18;

      const skyPreset = opts.skyPreset || 'alpine';
      this.envMap = createHDRPEnvironmentMap(skyPreset);
      if (this.envMap) {
        scene.environment = this.envMap;
      }

      // 2. Add Rayleigh/Mie Atmospheric Sky Dome & Sun Disc
      const skyTex = createSkyDomeTexture(skyPreset);
      if (skyTex) {
        const skyGeo = new THREE.SphereGeometry(2100, 32, 20);
        const skyMat = new THREE.MeshBasicMaterial({
          map: skyTex,
          side: THREE.BackSide,
          depthWrite: false,
          fog: false
        });
        const skyDome = new THREE.Mesh(skyGeo, skyMat);
        scene.add(skyDome);
        this.provinceSkyDome = skyDome;
      }

      const sunGlowTex = createSunGlowTexture();
      const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: sunGlowTex,
        color: skyPreset === 'sunset' ? 0xffbb66 : 0xfffaed,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      }));
      sunSprite.scale.set(240, 240, 1);
      sunSprite.position.set(280, 420, -320);
      scene.add(sunSprite);
      this.provinceSunSprite = sunSprite;

      // 3. Upgrade Ground Terrain with Micro-Detail Texture
      if (opts.groundMesh && opts.groundMesh.material) {
        const baseHex = opts.groundMesh.material.color ? opts.groundMesh.material.color.getHex() : 0x222a24;
        const snowFrac = (typeof opts.snowFraction === 'number') ? opts.snowFraction : 0.15;
        const groundTex = createTerrainMicroDetailTexture(baseHex, snowFrac);
        opts.groundMesh.material = new THREE.MeshStandardMaterial({
          map: groundTex,
          color: 0xffffff,
          roughness: 0.88,
          metalness: 0.06
        });
      }

      // 4. Upgrade Highway Surface & Add Lane Markings / Shoulder Reflector Posts
      if (opts.hwyMesh) {
        opts.hwyMesh.scale.y = 0.12;
        opts.hwyMesh.position.y = 0.06;
        const hwyTex = createHighwayPBRTexture();
        opts.hwyMesh.material = new THREE.MeshStandardMaterial({
          map: hwyTex,
          color: 0xffffff,
          roughness: 0.72,
          metalness: 0.15
        });

        const postGroup = new THREE.Group();
        const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
        const reflMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        for (let z = -320; z <= 320; z += 40) {
          [-23.2, 23.2].forEach(px => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), postMat);
            post.position.set(px, 0.52, z);
            postGroup.add(post);

            const refl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.16), reflMat);
            refl.position.set(px, 0.92, z);
            postGroup.add(refl);
          });
        }
        scene.add(postGroup);
      }

      // 5. Upgrade Any 6-Sided Cone Mountains into Multi-Faceted Rugged Alpine Massifs
      const conesToUpgrade = [];
      scene.traverse(obj => {
        if (obj.isMesh && obj.geometry && obj.geometry.type === 'ConeGeometry') {
          const params = obj.geometry.parameters || {};
          if (params.radius >= 25 && params.height >= 35 && params.radialSegments <= 8) {
            conesToUpgrade.push(obj);
          }
        }
      });

      conesToUpgrade.forEach((cone, idx) => {
        const params = cone.geometry.parameters;
        const r = params.radius;
        const h = params.height;
        const peakGeo = new THREE.ConeGeometry(r * 1.12, h, 18, 6);
        const posAttr = peakGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vy = posAttr.getY(i);
          const vz = posAttr.getZ(i);
          const normH = (vy + h / 2) / h;
          if (normH > 0.05 && normH < 0.98) {
            const angle = Math.atan2(vz, vx);
            const ridge = Math.sin(angle * 5 + idx * 1.3) * 0.16 + Math.cos(angle * 3 - normH * 4) * 0.12;
            const scale = 1.0 + ridge * (1.0 - normH * 0.5);
            posAttr.setX(i, vx * scale);
            posAttr.setZ(i, vz * scale);
          }
        }
        peakGeo.computeVertexNormals();
        cone.geometry.dispose();
        cone.geometry = peakGeo;
        if (cone.material) {
          cone.material.flatShading = true;
          cone.material.needsUpdate = true;
        }
      });

      // 6. Build Real-World Exotic Supercar / Flying Tesla on Cruiser Chassis
      if (opts.cruiserGroup) {
        opts.cruiserGroup.position.y = Math.min(opts.cruiserGroup.position.y, 0.08);
        this.activeVehicleGroup = opts.cruiserGroup;
        this.activeCarWheels = opts.cyberCarWheels || [];
        this.activeCarSteers = opts.cyberCarSteers || [];
        const savedCar = localStorage.getItem('SELECTED_EXOTIC_CAR') || 'lamborghini';
        this.buildRealWorldSupercar(opts.cruiserGroup, savedCar, this.activeCarWheels, this.activeCarSteers);
      }

      // 7. Upgrade Procedural Player Avatar Fallback into Articulated 3D Canadian Tactical Operative
      const pGrp = opts.playerGroup || window.playerGroup;
      if (pGrp) {
        pGrp.children.forEach(ch => {
          if (ch.isMesh || (ch.isGroup && ch.children.length <= 3)) {
            ch.visible = false;
          }
        });
        const opGroup = new THREE.Group();
        opGroup.name = 'CanadianTacticalOperativeFallback';
        const parkaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.25 });
        const armorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.75 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x273244, roughness: 0.72, metalness: 0.12 });
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.45, metalness: 0.3 });
        const furMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.92, metalness: 0.05 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0a696, roughness: 0.58, metalness: 0.05 });
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        const maplePatchMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

        [-0.12, 0.12].forEach(lx => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.068, 0.72, 12), pantsMat);
          leg.position.set(lx, 0.42, 0);
          leg.castShadow = true;
          opGroup.add(leg);
          const boot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.26), bootMat);
          boot.position.set(lx, 0.07, -0.03);
          opGroup.add(boot);
        });

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.19, 0.64, 14), parkaMat);
        torso.position.set(0, 1.08, 0);
        torso.castShadow = true;
        opGroup.add(torso);

        const vest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.40, 0.26), armorMat);
        vest.position.set(0, 1.12, 0);
        opGroup.add(vest);

        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 16), furMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.set(0, 1.41, 0);
        opGroup.add(collar);

        [-0.27, 0.27].forEach(ax => {
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.56, 12), parkaMat);
          arm.position.set(ax, 1.06, 0);
          arm.castShadow = true;
          opGroup.add(arm);
          const patch = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.09), maplePatchMat);
          patch.position.set(ax + (ax > 0 ? 0.055 : -0.055), 1.24, 0);
          opGroup.add(patch);
        });

        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.15), armorMat);
        pack.position.set(0, 1.12, 0.18);
        opGroup.add(pack);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 16), skinMat);
        head.position.set(0, 1.56, 0);
        opGroup.add(head);

        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.138, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), armorMat);
        helmet.position.set(0, 1.58, 0);
        opGroup.add(helmet);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.06), visorMat);
        visor.position.set(0, 1.56, -0.11);
        opGroup.add(visor);

        pGrp.add(opGroup);
        const origAdd = pGrp.add.bind(pGrp);
        pGrp.add = function(obj) {
          const res = origAdd(obj);
          if (obj && obj !== opGroup) {
            opGroup.visible = false;
          }
          return res;
        };
      }

      // 8. Build Well-Spaced Provincial Mega-Sectors (Exotic & Tesla Dealerships, Grand Mall/Events/Rec, Military Base & SAMs, Carrier & Rocket)
      this.buildProvincialMegaExpansion(scene);

      // 9. Override Compass updateRadar with True Top-Down GPS Map + Per-Frame Physics Hook!
      const self = this;
      upgradeRadarContainerToGPSMap();
      let lastHookTime = performance.now();
      window.updateRadar = function(pPos, pYaw, lPos, vPos, cPos) {
        const now = performance.now();
        const dt = Math.min((now - lastHookTime) / 1000, 0.1);
        lastHookTime = now;

        if (pPos) {
          self.player = { pos: pPos, yaw: pYaw || 0 };
        }

        const cvs = document.getElementById('hud-radar-canvas');
        renderLiveGPSMinimap(cvs, pPos, pYaw, {
          isMetropolis: false,
          landmarkPos: lPos,
          vehiclePos: vPos,
          codexPos: cPos
        });

        // Update Tesla Flight, SAM Air-Defense, Police Pursuit & Rocket Launch in Province Realms
        self.updateTeslaFlightPhysics(dt, now);
        self.updatePoliceAndMilitarySystem(dt, now, pPos);
      };

      // 10. Inject Universal Dealership, Tesla Flight & Police/Military UI
      this.injectUniversalDealershipAndMobileUI();
    }

    // ------------------------------------------------------------
    // WELL-SPACED MEGA-SECTORS FOR PROVINCE REALMS (UNCLUSTERED!)
    // ------------------------------------------------------------
    buildProvincialMegaExpansion(scene) {
      if (!scene || typeof THREE === 'undefined') return;
      const megaGroup = new THREE.Group();
      megaGroup.name = 'ProvincialMegaExpansion';
      scene.add(megaGroup);

      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, roughness: 0.08, metalness: 0.88, transparent: true, opacity: 0.72 });
      const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.82 });
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75, metalness: 0.2 });
      const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

      // ============================================================
      // SECTOR 1: EXOTIC SUPERCAR & TESLA FLYING SHOWROOM (X: 62, Z: 55)
      // ============================================================
      const dealerGroup = new THREE.Group();
      dealerGroup.position.set(62, 0, 55);
      megaGroup.add(dealerGroup);

      const showroomFloor = new THREE.Mesh(new THREE.BoxGeometry(40, 0.4, 34), darkSteelMat);
      showroomFloor.position.y = 0.2;
      showroomFloor.receiveShadow = true;
      dealerGroup.add(showroomFloor);

      const showroomGlass = new THREE.Mesh(new THREE.BoxGeometry(36, 9.5, 16), glassMat);
      showroomGlass.position.set(0, 4.95, 6);
      dealerGroup.add(showroomGlass);

      const showroomRoof = new THREE.Mesh(new THREE.BoxGeometry(38, 0.8, 18), darkSteelMat);
      showroomRoof.position.set(0, 9.8, 6);
      dealerGroup.add(showroomRoof);

      const dealerSignTex = createSignBannerTexture('EXOTIC MOTORS & TESLA AERO HUB', 'LAMBORGHINI · FERRARI · MCLAREN · FLYING TESLA [PRESS B]', '#00f2ff', '#090d16');
      const dealerSign = new THREE.Mesh(new THREE.PlaneGeometry(32, 5.5), new THREE.MeshBasicMaterial({ map: dealerSignTex }));
      dealerSign.position.set(0, 12.8, 6);
      dealerSign.rotation.y = Math.PI;
      dealerGroup.add(dealerSign);
      const dealerSignFront = dealerSign.clone();
      dealerSignFront.rotation.y = 0;
      dealerSignFront.position.set(0, 12.8, 5.8);
      dealerGroup.add(dealerSignFront);

      // 4 Parked 3D Display Supercars on Front Apron (Lamborghini, Ferrari, McLaren, Flying Tesla Roadster)
      const displayModels = ['lamborghini', 'ferrari', 'mclaren', 'tesla_roadster'];
      displayModels.forEach((mId, idx) => {
        const padX = -13.5 + idx * 9.0;
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.22, 24), darkSteelMat);
        pad.position.set(padX, 0.3, -5.5);
        dealerGroup.add(pad);

        const carHolder = new THREE.Group();
        carHolder.position.set(padX, 0.42, -5.5);
        carHolder.rotation.y = Math.PI;
        this.buildRealWorldSupercar(carHolder, mId, [], []);
        dealerGroup.add(carHolder);
      });

      // ============================================================
      // SECTOR 2: GRAND MALL, EVENTS ARENA & OLYMPIC REC CENTRE (X: -85, Z: 80)
      // ============================================================
      const civicGroup = new THREE.Group();
      civicGroup.position.set(-85, 0, 80);
      megaGroup.add(civicGroup);

      // 2A. Grand Galleria Mall & Events Arena (Z: +35 relative -> Z=115)
      const arenaPodium = new THREE.Mesh(new THREE.BoxGeometry(56, 12, 42), darkSteelMat);
      arenaPodium.position.set(0, 6, 35);
      civicGroup.add(arenaPodium);

      const arenaDome = new THREE.Mesh(new THREE.CylinderGeometry(22, 26, 8, 24), glassMat);
      arenaDome.position.set(0, 16, 35);
      civicGroup.add(arenaDome);

      const arenaSignTex = createSignBannerTexture('GRAND GALLERIA MALL & EVENTS ARENA', 'CONCERTS · LUXURY SHOPS · VIP LOUNGE', '#facc15', '#140c1c');
      const arenaSign = new THREE.Mesh(new THREE.PlaneGeometry(36, 6), new THREE.MeshBasicMaterial({ map: arenaSignTex }));
      arenaSign.position.set(0, 14, 13.8);
      arenaSign.rotation.y = Math.PI;
      civicGroup.add(arenaSign);

      // 2B. Olympic Recreational & Heated Aquatic Centre (Z: -35 relative -> Z=45)
      const recDeck = new THREE.Mesh(new THREE.BoxGeometry(46, 0.5, 36), concreteMat);
      recDeck.position.set(0, 0.25, -35);
      civicGroup.add(recDeck);

      const poolWater = new THREE.Mesh(
        new THREE.BoxGeometry(24, 0.35, 14),
        new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, roughness: 0.05, clearcoat: 1.0 })
      );
      poolWater.position.set(-8, 0.45, -35);
      civicGroup.add(poolWater);

      // Diving Tower & Basketball/Tennis Court
      const diveTower = new THREE.Mesh(new THREE.BoxGeometry(2.5, 7.5, 2.5), concreteMat);
      diveTower.position.set(-21, 3.75, -35);
      civicGroup.add(diveTower);

      const courtFloor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 22), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 }));
      courtFloor.position.set(13, 0.35, -35);
      civicGroup.add(courtFloor);

      // ============================================================
      // SECTOR 3: CFB MILITARY BASE & ACTIVE SAM AIR-DEFENSE (X: -155, Z: -160)
      // ============================================================
      const milGroup = new THREE.Group();
      milGroup.position.set(-155, 0, -160);
      megaGroup.add(milGroup);

      const basePad = new THREE.Mesh(new THREE.BoxGeometry(84, 0.5, 72), concreteMat);
      basePad.position.y = 0.25;
      milGroup.add(basePad);

      const commandBunker = new THREE.Mesh(new THREE.BoxGeometry(28, 9, 22), darkSteelMat);
      commandBunker.position.set(0, 4.5, -16);
      milGroup.add(commandBunker);

      const radarDome = new THREE.Mesh(new THREE.SphereGeometry(7.5, 20, 16), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.4 }));
      radarDome.position.set(0, 13.5, -16);
      milGroup.add(radarDome);

      const milSignTex = createSignBannerTexture('CFB MILITARY BASE & AIR DEFENSE COMMAND', 'PATRIOT / NASAMS SAM BATTERIES · F-35 STEALTH WING', '#22c55e', '#07140c');
      const milSign = new THREE.Mesh(new THREE.PlaneGeometry(34, 5.5), new THREE.MeshBasicMaterial({ map: milSignTex }));
      milSign.position.set(0, 11.5, -4.8);
      milGroup.add(milSign);

      // 2 Active Rotating SAM Air-Defense Missile Turrets
      [[-28, 18], [28, 18]].forEach(([sx, sz]) => {
        const samTurret = this.buildSAMAirDefenseBattery();
        samTurret.position.set(sx, 0.5, sz);
        milGroup.add(samTurret);
        this.samTurrets.push(samTurret);
      });

      // ============================================================
      // SECTOR 4: NAVAL SUPERCARRIER & ORBITAL ROCKET PAD (X: 165, Z: -180)
      // ============================================================
      const navalSpaceGroup = new THREE.Group();
      navalSpaceGroup.position.set(165, 0, -180);
      megaGroup.add(navalSpaceGroup);

      // Harbor Basin Water
      const basin = new THREE.Mesh(
        new THREE.BoxGeometry(110, 0.3, 150),
        new THREE.MeshPhysicalMaterial({ color: 0x0369a1, roughness: 0.08, metalness: 0.75, clearcoat: 1.0 })
      );
      basin.position.set(0, 0.05, 0);
      navalSpaceGroup.add(basin);

      // Supercarrier Hull & Flight Deck
      const carrierHull = new THREE.Mesh(new THREE.BoxGeometry(28, 7.5, 118), darkSteelMat);
      carrierHull.position.set(-16, 3.75, 0);
      navalSpaceGroup.add(carrierHull);

      const flightDeck = new THREE.Mesh(new THREE.BoxGeometry(36, 0.8, 126), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 }));
      flightDeck.position.set(-16, 7.8, 0);
      navalSpaceGroup.add(flightDeck);

      const islandTower = new THREE.Mesh(new THREE.BoxGeometry(7, 12, 22), concreteMat);
      islandTower.position.set(-2, 13.8, -10);
      navalSpaceGroup.add(islandTower);

      // Orbital Starship Launch Pad & 90m Stainless Rocket Stack on Adjacent Pier (+32, 0, 0)
      const launchPad = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 3.2, 12), concreteMat);
      launchPad.position.set(32, 1.6, 0);
      navalSpaceGroup.add(launchPad);

      const mechTower = new THREE.Mesh(new THREE.BoxGeometry(5.5, 86, 5.5), darkSteelMat);
      mechTower.position.set(42, 43, 0);
      navalSpaceGroup.add(mechTower);

      const rocketGrp = new THREE.Group();
      rocketGrp.position.set(32, 3.2, 0);
      const stainlessMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, metalness: 0.95, roughness: 0.12 });
      const booster = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 46, 24), stainlessMat);
      booster.position.y = 23;
      rocketGrp.add(booster);
      const ship = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 26, 24), stainlessMat);
      ship.position.y = 59;
      rocketGrp.add(ship);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(3.2, 11, 24), stainlessMat);
      nose.position.y = 77.5;
      rocketGrp.add(nose);
      const rFlame = new THREE.Mesh(new THREE.ConeGeometry(3.6, 22, 16), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
      rFlame.rotation.x = Math.PI;
      rFlame.position.y = -11;
      rFlame.visible = false;
      rocketGrp.add(rFlame);
      rocketGrp._flame = rFlame;
      navalSpaceGroup.add(rocketGrp);
      this.provincialRocket = rocketGrp;

      // Spawn 2 Initial RCMP Police Patrol Cruisers on the Provincial Highway
      this.spawnPoliceCruiserUnit(scene, -11, -60, 1);
      this.spawnPoliceCruiserUnit(scene, 11, 140, -1);
    }

    // Build a 3D Animated Patriot / NASAMS SAM Air-Defense Missile Battery
    buildSAMAirDefenseBattery() {
      const sam = new THREE.Group();
      const oliveMat = new THREE.MeshStandardMaterial({ color: 0x273526, roughness: 0.6, metalness: 0.4 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
      const warnMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

      const basePedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.0, 1.4, 12), steelMat);
      basePedestal.position.y = 0.7;
      sam.add(basePedestal);

      const turretPivot = new THREE.Group();
      turretPivot.position.y = 1.4;
      sam.add(turretPivot);
      sam._turretPivot = turretPivot;

      const turntable = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 3.2), oliveMat);
      turntable.position.y = 0.6;
      turretPivot.add(turntable);

      // Elevating 4-Tube Missile Pod
      const podPivot = new THREE.Group();
      podPivot.position.set(0, 1.8, 0);
      podPivot.rotation.x = -0.48; // Angled skyward
      turretPivot.add(podPivot);
      sam._podPivot = podPivot;

      const launcherBox = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 4.4), oliveMat);
      podPivot.add(launcherBox);

      [[-0.65, 0.45], [0.65, 0.45], [-0.65, -0.45], [0.65, -0.45]].forEach(([mx, my]) => {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 4.6, 12), steelMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(mx, my, 0);
        podPivot.add(tube);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), warnMat);
        cap.position.set(mx, my, -2.3);
        podPivot.add(cap);
      });

      // Rotating Target-Acquisition Radar Dish on Turret Roof
      const dish = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.25), steelMat);
      dish.position.set(0, 3.2, 0.8);
      turretPivot.add(dish);
      sam._radarDish = dish;

      return sam;
    }

    spawnPoliceCruiserUnit(scene, x, z, dir) {
      if (!scene || typeof THREE === 'undefined') return;
      const copGroup = new THREE.Group();
      copGroup.position.set(x, 0.08, z);
      const wheels = [];
      this.buildRealWorldSupercar(copGroup, 'rcmp_interceptor', wheels, []);
      scene.add(copGroup);
      this.policeUnits.push({
        mesh: copGroup,
        wheels: wheels,
        dir: dir || 1,
        baseX: x,
        speed: 24.0
      });
    }

    // ------------------------------------------------------------
    // 5-STAR POLICE ("COPS") & MILITARY PURSUIT SYSTEM
    // ------------------------------------------------------------
    triggerWantedStar(addStars = 1) {
      this.wantedStars = Math.min(5, (this.wantedStars || 0) + addStars);
      this.wantedDecayTimer = 45.0;
      if (typeof window.gameState !== 'undefined' && window.gameState) {
        window.gameState.wantedLevel = this.wantedStars;
        window.gameState.wantedTimer = 45.0;
        if (typeof window.updateWantedHUD === 'function') window.updateWantedHUD();
      }
      this.syncWantedBadgeUI();

      // Spawn Police Helicopter at 3+ Stars if not already airborne
      if (this.wantedStars >= 3 && !this.policeChopper && this.scene) {
        this.spawnPoliceHelicopter();
      }

      const labels = [
        '',
        '🚓 1-STAR WANTED: RCMP PATROL INTERCEPTORS DISPATCHED!',
        '🚓 2-STAR WANTED: HIGH-SPEED POLICE PURSUIT ACTIVE!',
        '🚁 3-STAR WANTED: SWAT TACTICAL & POLICE SEARCHLIGHT CHOPPER AIRBORNE!',
        '🪖 4-STAR MILITARY ALERT: CANADIAN FORCES LAV & SAM RADAR TRACKING!',
        '🚀 5-STAR DEFCON LOCKDOWN: STEALTH FIGHTERS & SAM AIR-DEFENSE ENGAGED!'
      ];
      this.notifyUser(labels[this.wantedStars]);
    }

    clearWantedStars() {
      this.wantedStars = 0;
      this.wantedDecayTimer = 0;
      if (typeof window.gameState !== 'undefined' && window.gameState) {
        window.gameState.wantedLevel = 0;
        window.gameState.wantedTimer = 0;
        if (typeof window.updateWantedHUD === 'function') window.updateWantedHUD();
      }
      if (this.policeChopper) {
        this.policeChopper.visible = false;
      }
      this.syncWantedBadgeUI();
      this.notifyUser('🛡️ POLICE & MILITARY DISPATCH CLEARED // LEGAL STATUS RESTORED');
    }

    spawnPoliceHelicopter() {
      if (!this.scene || typeof THREE === 'undefined') return;
      const heli = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.25 });
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const rotorMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 5.5), bodyMat);
      heli.add(cabin);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.5, 5.2), whiteMat);
      heli.add(stripe);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.55, 6.5, 8), bodyMat);
      tail.rotation.x = Math.PI / 2;
      tail.position.set(0, 0.4, 5.5);
      heli.add(tail);

      const mainRotor = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.08, 0.45), rotorMat);
      mainRotor.position.set(0, 1.35, 0);
      heli.add(mainRotor);
      heli._mainRotor = mainRotor;

      // Volumetric Searchlight Cone pointing down
      const coneGeo = new THREE.ConeGeometry(9.0, 42, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
      const beam = new THREE.Mesh(coneGeo, coneMat);
      beam.position.set(0, -21, 0);
      heli.add(beam);

      heli.position.set(0, 42, 0);
      this.scene.add(heli);
      this.policeChopper = heli;
    }

    syncWantedBadgeUI() {
      const btn = document.getElementById('hud-btn-cops-stars');
      if (!btn) return;
      if (this.wantedStars > 0) {
        const stars = '★'.repeat(this.wantedStars) + '☆'.repeat(5 - this.wantedStars);
        btn.style.background = 'rgba(220, 38, 38, 0.92)';
        btn.style.borderColor = '#facc15';
        btn.innerHTML = `<i class="fa-solid fa-shield-halved"></i> WANTED ${stars} [K]`;
      } else {
        btn.style.background = 'rgba(15, 23, 42, 0.9)';
        btn.style.borderColor = 'rgba(56, 189, 248, 0.45)';
        btn.innerHTML = `<i class="fa-solid fa-shield-halved"></i> COPS / MILITARY [K]`;
      }
    }

    updatePoliceAndMilitarySystem(delta, now, pPos) {
      const targetPos = pPos || (this.player && this.player.pos) || (window.player && window.player.pos);

      // 1. Rotate SAM Air-Defense Turrets & Radars
      if (this.samTurrets && this.samTurrets.length > 0) {
        this.samTurrets.forEach((sam, idx) => {
          if (sam._turretPivot) {
            if (this.wantedStars >= 4 && targetPos) {
              const worldPos = new THREE.Vector3();
              sam.getWorldPosition(worldPos);
              sam._turretPivot.rotation.y = Math.atan2(targetPos.x - worldPos.x, targetPos.z - worldPos.z);
            } else {
              sam._turretPivot.rotation.y = Math.sin(now * 0.0008 + idx) * 1.2;
            }
          }
          if (sam._radarDish) {
            sam._radarDish.rotation.y += delta * 3.2;
          }
        });
      }

      // 2. Update Police Cruiser Patrols & Active Pursuit when Wanted >= 1
      if (this.policeUnits && this.policeUnits.length > 0) {
        this.policeUnits.forEach(u => {
          if (!u.mesh) return;
          if (this.wantedStars >= 1 && targetPos) {
            // Pursue player!
            const dx = targetPos.x - u.mesh.position.x;
            const dz = targetPos.z - u.mesh.position.z;
            const dist = Math.hypot(dx, dz);
            if (dist > 8.5) {
              const ang = Math.atan2(dx, dz);
              u.mesh.rotation.y = ang;
              u.mesh.position.x += Math.sin(ang) * (u.speed * 1.25) * delta;
              u.mesh.position.z += Math.cos(ang) * (u.speed * 1.25) * delta;
            }
          } else {
            // Normal Highway Patrol
            u.mesh.position.z += u.dir * u.speed * delta;
            u.mesh.rotation.y = u.dir > 0 ? 0 : Math.PI;
            if (u.mesh.position.z > 280) u.dir = -1;
            if (u.mesh.position.z < -280) u.dir = 1;
          }
        });
      }

      // 3. Update Police Searchlight Helicopter when Wanted >= 3
      if (this.policeChopper && targetPos) {
        this.policeChopper.visible = (this.wantedStars >= 3);
        if (this.policeChopper.visible) {
          const orbitAng = now * 0.0012;
          this.policeChopper.position.x = THREE.MathUtils.lerp(this.policeChopper.position.x, targetPos.x + Math.cos(orbitAng) * 24, delta * 2.5);
          this.policeChopper.position.z = THREE.MathUtils.lerp(this.policeChopper.position.z, targetPos.z + Math.sin(orbitAng) * 24, delta * 2.5);
          this.policeChopper.position.y = Math.max(targetPos.y + 36, 42);
          this.policeChopper.rotation.y = -orbitAng;
          if (this.policeChopper._mainRotor) {
            this.policeChopper._mainRotor.rotation.y += delta * 28.0;
          }
        }
      }

      // 4. Provincial Rocket Launch Animation
      if (this.provincialRocket && this.provincialRocketLaunching) {
        this.provincialRocket.position.y += delta * 34.0;
        if (this.provincialRocket._flame) {
          this.provincialRocket._flame.visible = true;
          this.provincialRocket._flame.scale.y = 0.9 + Math.sin(now * 0.04) * 0.25;
        }
        if (this.provincialRocket.position.y > 520) {
          this.provincialRocket.position.y = 3.2;
          this.provincialRocketLaunching = false;
          if (this.provincialRocket._flame) this.provincialRocket._flame.visible = false;
        }
      }
    }

    // ------------------------------------------------------------
    // HOOK METROPOLIS (game.html) GPS MAP & SUPERCAR DEALERSHIPS
    // ------------------------------------------------------------
    hookMetropolisGPSAndSystems() {
      const self = this;
      // Override updateCalgaryCityRadar and drawTacticalMinimapRadar in game.html so they render True GPS Maps!
      window.updateCalgaryCityRadar = function() {
        const cvs = document.getElementById('city-hud-radar-canvas');
        const pObj = self.player || window.player;
        if (cvs && pObj && pObj.pos) {
          renderLiveGPSMinimap(cvs, pObj.pos, pObj.yaw || 0, {
            isMetropolis: true,
            landmarkPos: new THREE.Vector3(-35, 0, -45),
            vehiclePos: (typeof window.roverGroup !== 'undefined' && window.roverGroup) ? window.roverGroup.position : null
          });
        }
      };

      window.drawTacticalMinimapRadar = function(now) {
        const cvs = document.getElementById('mobile-minimap-canvas') || document.getElementById('minimap-canvas');
        const pObj = self.player || window.player;
        if (cvs && pObj && pObj.pos) {
          renderLiveGPSMinimap(cvs, pObj.pos, pObj.yaw || 0, {
            isMetropolis: true,
            landmarkPos: new THREE.Vector3(-35, 0, -45),
            vehiclePos: (typeof window.roverGroup !== 'undefined' && window.roverGroup) ? window.roverGroup.position : null
          });
        }
      };

      // Build 3 Distinct Luxury Dealership Showrooms + Events Centre + Olympic Rec Complex + SAM Batteries in Metropolis
      if (this.scene && document.getElementById('city-hud-radar-canvas')) {
        this.buildMetropolisMegaExpansion(this.scene);
      }
    }

    buildMetropolisMegaExpansion(scene) {
      if (!scene || typeof THREE === 'undefined' || scene._metropolisMegaBuilt) return;
      scene._metropolisMegaBuilt = true;

      const expGroup = new THREE.Group();
      expGroup.name = 'MetropolisExoticAndCivicExpansion';
      scene.add(expGroup);

      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.74, clearcoat: 1.0 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.85 });
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75, metalness: 0.2 });

      // 1. THREE DISTINCT LUXURY CAR DEALERSHIPS ALONG WEST AUTO BOULEVARD (X = -145)
      const dealerships = [
        {
          title: 'AUTOMOBILI LAMBORGHINI & FERRARI GALLERY',
          sub: 'ITALIAN V12 & V8 SUPERCAR SHOWROOM // PRESS [B] TO TEST DRIVE',
          color: '#facc15',
          x: -145,
          z: -45,
          cars: ['lamborghini', 'ferrari']
        },
        {
          title: 'MCLAREN, BUGATTI & PORSCHE MOTORHOUSE',
          sub: 'EUROPEAN HYPERCAR & GT3 TRACK GALLERY // PRESS [B] TO TEST DRIVE',
          color: '#f97316',
          x: -145,
          z: -115,
          cars: ['mclaren', 'bugatti', 'porsche']
        },
        {
          title: 'TESLA GIGAFACTORY & SPACEX FLYING CAR HUB',
          sub: 'FLYING TESLA ROADSTER & VTOL CYBERTRUCK // PRESS [X] TO FLY!',
          color: '#f43f5e',
          x: -145,
          z: 115,
          cars: ['tesla_roadster', 'tesla_cybertruck']
        }
      ];

      dealerships.forEach(d => {
        const dGrp = new THREE.Group();
        dGrp.position.set(d.x, 0, d.z);
        expGroup.add(dGrp);

        const floor = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 32), darkMat);
        floor.position.y = 0.2;
        dGrp.add(floor);

        const hall = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 28), glassMat);
        hall.position.set(-5, 5.2, 0);
        dGrp.add(hall);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 30), darkMat);
        roof.position.set(-4, 10.4, 0);
        dGrp.add(roof);

        const sTex = createSignBannerTexture(d.title, d.sub, d.color, '#070b14');
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(28, 5.0), new THREE.MeshBasicMaterial({ map: sTex }));
        sign.rotation.y = Math.PI / 2;
        sign.position.set(6.2, 12.2, 0);
        dGrp.add(sign);

        // Parked 3D Supercars on Showroom Plaza facing East Boulevard
        d.cars.forEach((cId, i) => {
          const cz = (i - (d.cars.length - 1) / 2) * 9.5;
          const carNode = new THREE.Group();
          carNode.position.set(8.5, 0.35, cz);
          carNode.rotation.y = Math.PI / 2;
          this.buildRealWorldSupercar(carNode, cId, [], []);
          dGrp.add(carNode);
          this.dealershipShowroomCars.push({ id: cId, worldPos: new THREE.Vector3(d.x + 8.5, 0, d.z + cz) });
        });
      });

      // 2. BMO / STAMPEDE GRAND EVENTS & CONCERT ARENA CENTRE (X: 165, Z: -75)
      const eventsGroup = new THREE.Group();
      eventsGroup.position.set(165, 0, -75);
      expGroup.add(eventsGroup);

      const arenaBase = new THREE.Mesh(new THREE.BoxGeometry(58, 14, 48), darkMat);
      arenaBase.position.y = 7;
      eventsGroup.add(arenaBase);

      const saddleRoof = new THREE.Mesh(new THREE.CylinderGeometry(26, 30, 7, 28), glassMat);
      saddleRoof.position.y = 17.5;
      eventsGroup.add(saddleRoof);

      const evTex = createSignBannerTexture('CALGARY GRAND EVENTS & CONCERT ARENA', 'WORLD TOURS · E-SPORTS · STAMPEDE EXHIBITION HALL', '#a855f7', '#12091d');
      const evSign = new THREE.Mesh(new THREE.PlaneGeometry(42, 7), new THREE.MeshBasicMaterial({ map: evTex }));
      evSign.rotation.y = -Math.PI / 2;
      evSign.position.set(-29.2, 13, 0);
      eventsGroup.add(evSign);

      // 3. OLYMPIC RECREATIONAL & AQUATIC SPORTS COMPLEX (X: -165, Z: -210)
      const recGroup = new THREE.Group();
      recGroup.position.set(-165, 0, -210);
      expGroup.add(recGroup);

      const recPlaza = new THREE.Mesh(new THREE.BoxGeometry(64, 0.5, 52), concreteMat);
      recPlaza.position.y = 0.25;
      recGroup.add(recPlaza);

      const lapPool = new THREE.Mesh(
        new THREE.BoxGeometry(32, 0.4, 18),
        new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, roughness: 0.05, clearcoat: 1.0 })
      );
      lapPool.position.set(-10, 0.45, -8);
      recGroup.add(lapPool);

      const recPavilion = new THREE.Mesh(new THREE.BoxGeometry(24, 9, 44), glassMat);
      recPavilion.position.set(18, 4.75, 0);
      recGroup.add(recPavilion);

      const recTex = createSignBannerTexture('OLYMPIC AQUATIC & RECREATIONAL COMPLEX', '50M HEATED POOL · BASKETBALL & TENNIS · FITNESS DOME', '#10b981', '#061814');
      const recSign = new THREE.Mesh(new THREE.PlaneGeometry(38, 6), new THREE.MeshBasicMaterial({ map: recTex }));
      recSign.position.set(0, 11.5, 26.2);
      recGroup.add(recSign);

      // 4. ACTIVE SAM AIR-DEFENSE BATTERIES AT CFB CALGARY BASE & CARRIER
      [[-190, 110], [-270, 110], [-230, 215], [-340, 260]].forEach(([sx, sz]) => {
        const sam = this.buildSAMAirDefenseBattery();
        sam.position.set(sx, 0.4, sz);
        expGroup.add(sam);
        this.samTurrets.push(sam);
      });
    }

    // ------------------------------------------------------------
    // UNIVERSAL DEALERSHIP MODAL + MOBILE-FRIENDLY QUICK ACTION BAR
    // ------------------------------------------------------------
    injectUniversalDealershipAndMobileUI() {
      if (document.getElementById('hyper-universal-action-bar')) return;
      const self = this;

      this._localKeys = {};
      window.addEventListener('keydown', e => {
        this._localKeys[e.code] = true;
        if (e.code === 'KeyB') {
          this.toggleDealershipModal();
        } else if (e.code === 'KeyX') {
          this.toggleTeslaFlightMode();
        } else if (e.code === 'KeyK') {
          if (this.wantedStars > 0 && e.shiftKey) this.clearWantedStars();
          else this.triggerWantedStar(1);
        }
      });
      window.addEventListener('keyup', e => {
        this._localKeys[e.code] = false;
      });

      const style = document.createElement('style');
      style.textContent = `
        #hyper-universal-action-bar {
          position: fixed;
          bottom: 58px;
          right: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          z-index: 240;
          pointer-events: auto;
          justify-content: flex-end;
          max-width: 440px;
        }
        .hyper-act-btn {
          background: rgba(10, 18, 30, 0.92);
          border: 1.5px solid rgba(0, 242, 255, 0.5);
          border-radius: 9px;
          color: #f8fafc;
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          font-weight: 800;
          padding: 7px 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
          transition: all 0.18s ease;
        }
        .hyper-act-btn:hover {
          transform: translateY(-2px);
          border-color: #00f2ff;
          box-shadow: 0 0 18px rgba(0, 242, 255, 0.45);
        }
        #hyper-dealership-modal {
          position: fixed;
          inset: 0;
          background: rgba(4, 9, 18, 0.88);
          backdrop-filter: blur(12px);
          z-index: 3200;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 16px;
          pointer-events: auto;
        }
        #hyper-dealership-modal.visible { display: flex; }
        .dealer-box {
          width: 100%;
          max-width: 960px;
          max-height: 86vh;
          background: linear-gradient(160deg, rgba(12, 20, 34, 0.98), rgba(6, 11, 20, 0.98));
          border: 2px solid #00f2ff;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 0 50px rgba(0, 242, 255, 0.35);
        }
        .dealer-grid {
          padding: 18px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
          gap: 14px;
          overflow-y: auto;
        }
        .dealer-card {
          background: rgba(18, 28, 46, 0.92);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          transition: all 0.2s;
        }
        .dealer-card:hover {
          border-color: #00f2ff;
          transform: translateY(-2px);
          box-shadow: 0 0 22px rgba(0, 242, 255, 0.25);
        }
        @media (max-width: 768px) {
          #hyper-universal-action-bar {
            bottom: 74px;
            right: 10px;
            max-width: 280px;
          }
          .hyper-act-btn {
            font-size: 9px;
            padding: 6px 9px;
          }
        }
      `;
      document.head.appendChild(style);

      const bar = document.createElement('div');
      bar.id = 'hyper-universal-action-bar';
      if (window.gameState && window.gameState.settings && window.gameState.settings.showFloatingActionBar === false) {
        bar.style.display = 'none';
      }
      bar.innerHTML = `
        <button type="button" class="hyper-act-btn" style="border-color:#facc15; color:#facc15;" onclick="window.HyperRealismEngine.toggleDealershipModal()">
          <i class="fa-solid fa-car-side"></i> CARS & TESLA STORE [B]
        </button>
        <button type="button" class="hyper-act-btn" id="hud-btn-tesla-fly" style="border-color:#f43f5e; background:rgba(225,29,72,0.88);" onclick="window.HyperRealismEngine.toggleTeslaFlightMode()">
          <i class="fa-solid fa-shuttle-space"></i> FLYING TESLA [X]
        </button>
        <button type="button" class="hyper-act-btn" id="hud-btn-cops-stars" onclick="window.HyperRealismEngine.triggerWantedStar(1)" oncontextmenu="window.HyperRealismEngine.clearWantedStars(); return false;">
          <i class="fa-solid fa-shield-halved"></i> COPS / MILITARY [K]
        </button>
      `;
      document.body.appendChild(bar);

      const modal = document.createElement('div');
      modal.id = 'hyper-dealership-modal';
      const cardsHtml = EXOTIC_CAR_CATALOG.map(c => {
        const hexStr = '#' + c.color.toString(16).padStart(6, '0');
        return `
          <div class="dealer-card" style="border-top: 4px solid ${hexStr};">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:10px; font-weight:800; color:#94a3b8; font-family:'Orbitron',sans-serif;">${c.brand}</span>
                <span style="font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:5px; background:rgba(0,242,255,0.14); color:#00f2ff;">${c.badge}</span>
              </div>
              <div style="font-family:'Orbitron',sans-serif; font-size:14px; font-weight:900; color:#fff; margin-bottom:6px;">${c.name}</div>
              <div style="font-size:11.5px; color:#cbd5e1; line-height:1.35; margin-bottom:8px;">${c.desc}</div>
              <div style="font-size:10.5px; color:#facc15; font-weight:700;">
                TOP SPEED: ${c.topSpeedKmh} KM/H ${c.canFly ? ` · SKY FLIGHT: ${c.flySpeedKmh} KM/H` : ''}
              </div>
              <div style="font-size:10px; color:#38bdf8; margin-top:2px;">SHOWROOM: ${c.store}</div>
            </div>
            <div style="display:flex; gap:8px; margin-top:6px;">
              <button type="button" onclick="window.HyperRealismEngine.spawnExoticCar('${c.id}', true)" style="flex:1; background:linear-gradient(135deg, #00f2ff, #0284c7); border:none; border-radius:8px; color:#04101c; font-family:'Orbitron',sans-serif; font-size:11px; font-weight:900; padding:9px 12px; cursor:pointer;">
                ${c.canFly ? '🛸 DRIVE / FLY NOW' : '🏎️ DRIVE NOW'}
              </button>
              ${c.canFly ? `
                <button type="button" onclick="window.HyperRealismEngine.spawnExoticCar('${c.id}', true); window.HyperRealismEngine.setTeslaFlightMode(true);" style="background:linear-gradient(135deg, #f43f5e, #be123c); border:none; border-radius:8px; color:#fff; font-family:'Orbitron',sans-serif; font-size:10px; font-weight:900; padding:9px 10px; cursor:pointer;" title="Launch Directly into Sky Flight Mode">
                  ✈️ TAKEOFF
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      modal.innerHTML = `
        <div class="dealer-box">
          <div style="padding:16px 22px; border-bottom:1px solid rgba(255,255,255,0.12); display:flex; justify-content:space-between; align-items:center; background:rgba(0,242,255,0.08); flex-wrap:wrap; gap:10px;">
            <div>
              <div style="font-family:'Orbitron',sans-serif; font-size:16px; font-weight:900; color:#fff;">
                🏎️ WORLD EXOTIC MOTORS, TESLA AERO-FLIGHT & MILITARY COMMAND
              </div>
              <div style="font-size:11.5px; color:#38bdf8; font-weight:700;">
                LAMBORGHINI · FERRARI · MCLAREN · BUGATTI · PORSCHE · FLYING TESLA ROADSTER & CYBERTRUCK
              </div>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <button type="button" onclick="window.HyperRealismEngine.teleportToDistrict('dealership')" style="background:rgba(250,204,21,0.2); border:1px solid #facc15; color:#facc15; border-radius:7px; padding:6px 10px; font-family:'Orbitron',sans-serif; font-size:10px; font-weight:800; cursor:pointer;">
                📍 AUTO MILE
              </button>
              <button type="button" onclick="window.HyperRealismEngine.teleportToDistrict('carrier')" style="background:rgba(56,189,248,0.2); border:1px solid #38bdf8; color:#38bdf8; border-radius:7px; padding:6px 10px; font-family:'Orbitron',sans-serif; font-size:10px; font-weight:800; cursor:pointer;">
                ⚓ CARRIER & JETS
              </button>
              <button type="button" onclick="window.HyperRealismEngine.teleportToDistrict('military')" style="background:rgba(34,197,94,0.2); border:1px solid #22c55e; color:#22c55e; border-radius:7px; padding:6px 10px; font-family:'Orbitron',sans-serif; font-size:10px; font-weight:800; cursor:pointer;">
                🪖 MILITARY & SAM
              </button>
              <button type="button" onclick="window.HyperRealismEngine.teleportToDistrict('rocket')" style="background:rgba(249,115,22,0.2); border:1px solid #f97316; color:#f97316; border-radius:7px; padding:6px 10px; font-family:'Orbitron',sans-serif; font-size:10px; font-weight:800; cursor:pointer;">
                🚀 ROCKET PAD
              </button>
              <button type="button" onclick="window.HyperRealismEngine.clearWantedStars()" style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; border-radius:7px; padding:6px 10px; font-family:'Orbitron',sans-serif; font-size:10px; font-weight:800; cursor:pointer;">
                🛡️ CLEAR COPS ★
              </button>
              <button type="button" onclick="window.HyperRealismEngine.closeDealershipModal()" style="background:none; border:none; color:#94a3b8; font-size:24px; cursor:pointer; padding:0 6px;">✕</button>
            </div>
          </div>
          <div class="dealer-grid">
            ${cardsHtml}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    toggleDealershipModal() {
      const m = document.getElementById('hyper-dealership-modal');
      if (!m) return;
      if (m.classList.contains('visible')) {
        this.closeDealershipModal();
      } else {
        this.openDealershipModal();
      }
    }

    openDealershipModal() {
      const m = document.getElementById('hyper-dealership-modal');
      if (!m) return;
      if (document.exitPointerLock) document.exitPointerLock();
      m.classList.add('visible');
    }

    closeDealershipModal() {
      const m = document.getElementById('hyper-dealership-modal');
      if (m) m.classList.remove('visible');
    }

    teleportToDistrict(sector) {
      const pObj = this.player || window.player;
      if (!pObj || !pObj.pos) return;
      const isMetropolis = !!document.getElementById('city-hud-radar-canvas');

      if (sector === 'dealership') {
        pObj.pos.set(isMetropolis ? -125 : 42, 1.2, isMetropolis ? -45 : 55);
        this.notifyUser('📍 TELEPORTED TO EXOTIC SUPERCAR & TESLA AERO SHOWROOM!');
      } else if (sector === 'carrier') {
        pObj.pos.set(isMetropolis ? -340 : 148, 12.5, isMetropolis ? 330 : -180);
        this.notifyUser('⚓ TELEPORTED TO HMCS AIRCRAFT CARRIER FLIGHT DECK!');
      } else if (sector === 'military') {
        pObj.pos.set(isMetropolis ? -230 : -155, 1.2, isMetropolis ? 115 : -125);
        this.notifyUser('🪖 TELEPORTED TO CANADIAN FORCES MILITARY BASE & SAM AIR-DEFENSE!');
      } else if (sector === 'rocket') {
        if (isMetropolis) {
          pObj.pos.set(622, 1.2, -550);
          this.notifyUser('🚀 TELEPORTED TO CAPE STARBASE ORBITAL ROCKET COMPLEX!');
        } else {
          pObj.pos.set(185, 4.0, -180);
          this.provincialRocketLaunching = true;
          this.notifyUser('🚀 ORBITAL STARSHIP IGNITION SEQUENCE STARTED!');
        }
      }
      this.closeDealershipModal();
    }

    notifyUser(msg) {
      if (typeof window.showStoreNotification === 'function') {
        window.showStoreNotification(msg);
      } else if (typeof window.showNotify === 'function') {
        window.showNotify(msg);
      }
    }

    // ------------------------------------------------------------
    // CANADIAN CONDENSATION BREATH VAPOR & COLD PARTICLES
    // ------------------------------------------------------------
    setupAtmosphericVapor() {
      if (!this.scene || typeof THREE === 'undefined') return;

      const vaporGeo = new THREE.SphereGeometry(0.14, 6, 6);
      const vaporMat = new THREE.MeshBasicMaterial({
        color: 0xebf8ff,
        transparent: true,
        opacity: 0.32,
        depthWrite: false
      });

      for (let i = 0; i < 12; i++) {
        const p = new THREE.Mesh(vaporGeo, vaporMat.clone());
        p.visible = false;
        this.scene.add(p);
        this.vaporParticles.push({
          mesh: p,
          life: 0,
          maxLife: 1.8,
          vel: new THREE.Vector3()
        });
      }
    }

    emitBreathPuff() {
      if (!this.profile.enableVapor || !this.player || !this.player.pos) return;
      if (this.isInsideShelter) return;

      const available = this.vaporParticles.find(v => !v.mesh.visible);
      if (!available) return;

      const forwardX = -Math.sin(this.player.yaw || 0);
      const forwardZ = -Math.cos(this.player.yaw || 0);

      available.mesh.position.set(
        this.player.pos.x + forwardX * 0.45,
        this.player.pos.y + 1.55,
        this.player.pos.z + forwardZ * 0.45
      );
      available.mesh.scale.set(0.6, 0.6, 0.6);
      available.mesh.material.opacity = 0.28;
      available.mesh.visible = true;
      available.life = available.maxLife;
      available.vel.set(
        forwardX * 0.8 + (Math.random() - 0.5) * 0.2,
        0.45 + Math.random() * 0.25,
        forwardZ * 0.8 + (Math.random() - 0.5) * 0.2
      );
    }

    updateSurvival(dt) {
      if (!this.gameState) return;

      const inTrain = this.gameState.inCalgaryCTrain;
      const inVehicle = this.gameState.inVehicle || (this.gameState.flightMode === 'rover');
      const inMall = (this.player && this.player.pos && Math.abs(this.player.pos.x) < 32 && Math.abs(this.player.pos.z - 122) < 28);

      this.isInsideShelter = inTrain || inVehicle || inMall;

      if (this.isInsideShelter) {
        this.warmth = Math.min(100.0, this.warmth + dt * 18.0);
      } else {
        const rate = this.equippedGear.warmthDrain * (Math.abs(this.outdoorTemp) / 18.0);
        this.warmth = Math.max(0.0, this.warmth - dt * rate);
      }

      if (this.warmth <= 0 && !this.isInsideShelter) {
        const curHealth = this.gameState.health || 100;
        this.gameState.health = Math.max(0, curHealth - dt * 4.5);

        const hpBar = document.getElementById('city-hp-fill') || document.getElementById('fill-health') || document.getElementById('hud-hp-bar');
        const hpVal = document.getElementById('city-hp-val') || document.getElementById('label-health');
        if (hpBar) hpBar.style.width = Math.round(this.gameState.health) + '%';
        if (hpVal) hpVal.textContent = Math.round(this.gameState.health) + '%';
      }

      const frostOverlay = document.getElementById('city-frostbite-overlay') || document.getElementById('frostbite-overlay');
      if (frostOverlay) {
        if (this.warmth < 28) {
          const intensity = (28 - this.warmth) / 28.0;
          frostOverlay.style.opacity = (intensity * 0.85).toFixed(2);
        } else {
          frostOverlay.style.opacity = '0';
        }
      }

      this.syncSurvivalHUD();
    }

    drinkThermos() {
      if (this.thermosCount <= 0) {
        if (typeof window.showStoreNotification === 'function') {
          window.showStoreNotification('☕ THERMOS EMPTY! VISIT STARDUST CAFE IN GRAND MALL TO REFILL.', true);
        }
        return;
      }
      this.thermosCount--;
      this.warmth = Math.min(100, this.warmth + 35);
      if (typeof window.playLootChime === 'function') window.playLootChime();
      if (typeof window.showStoreNotification === 'function') {
        window.showStoreNotification(`☕ SAVORED HOT TIM HORTONS COFFEE (+35% WARMTH, ${this.thermosCount} REMAINING)!`);
      }
      this.syncSurvivalHUD();
    }

    cycleWinterGear() {
      this.activeGearIndex = (this.activeGearIndex + 1) % CANADIAN_GEAR_TYPES.length;
      this.equippedGear = CANADIAN_GEAR_TYPES[this.activeGearIndex];
      if (typeof window.playLootChime === 'function') window.playLootChime();
      if (typeof window.showStoreNotification === 'function') {
        window.showStoreNotification(`EQUIPPED: ${this.equippedGear.name}`);
      }
      this.syncSurvivalHUD();
    }

    syncSurvivalHUD() {
      const wVal = document.getElementById('city-warmth-val') || document.getElementById('vital-warmth-val');
      const wFill = document.getElementById('city-warmth-fill') || document.getElementById('vital-warmth-fill');
      const tVal = document.getElementById('city-temp-val');
      const gLbl = document.getElementById('city-gear-label') || document.getElementById('label-current-gear');
      const thLbl = document.getElementById('city-thermos-label') || document.getElementById('label-thermos-count');

      if (wVal) wVal.textContent = Math.round(this.warmth) + '%';
      if (wFill) wFill.style.width = Math.round(this.warmth) + '%';
      if (tVal) tVal.textContent = this.outdoorTemp + '°C';
      if (gLbl) gLbl.textContent = this.equippedGear.name;
      if (thLbl) thLbl.textContent = `☕ HOT THERMOS (${this.thermosCount})`;
    }

    setTimeOfDay(mode) {
      if (mode === 'day') {
        this.outdoorTemp = -18;
        if (this.sunMesh) this.sunMesh.visible = true;
        if (this.moonMesh) this.moonMesh.visible = false;
      } else if (mode === 'sunset') {
        this.outdoorTemp = -12;
        if (this.sunMesh) this.sunMesh.visible = true;
        if (this.moonMesh) this.moonMesh.visible = false;
      } else {
        this.outdoorTemp = -28;
        if (this.sunMesh) this.sunMesh.visible = false;
        if (this.moonMesh) this.moonMesh.visible = true;
      }
      this.syncSurvivalHUD();
    }

    registerCullableGroup(obj) {
      if (obj) this.distantCullGroup.push(obj);
    }

    updateDistanceCulling() {
      if (!this.camera || this.distantCullGroup.length === 0) return;
      const camPos = this.camera.position;
      if (!camPos || isNaN(camPos.x) || isNaN(camPos.z)) {
        for (let i = 0; i < this.distantCullGroup.length; i++) {
          if (this.distantCullGroup[i]) this.distantCullGroup[i].visible = true;
        }
        return;
      }
      const maxDistSq = this.profile.cullDistance * this.profile.cullDistance;

      for (let i = 0; i < this.distantCullGroup.length; i++) {
        const item = this.distantCullGroup[i];
        if (!item || !item.position) continue;
        const dx = item.position.x - camPos.x;
        const dz = item.position.z - camPos.z;
        const distSq = dx * dx + dz * dz;

        item.visible = (distSq <= maxDistSq);
      }
    }

    update(delta, now) {
      if (!this.initialized) return;

      if (now - this.lastCullCheck > 120) {
        this.lastCullCheck = now;
        this.updateDistanceCulling();
      }

      if (now - this.lastVaporTime > 2400) {
        this.lastVaporTime = now;
        this.emitBreathPuff();
      }

      for (let i = 0; i < this.vaporParticles.length; i++) {
        const v = this.vaporParticles[i];
        if (v.mesh.visible) {
          v.life -= delta;
          v.mesh.position.addScaledVector(v.vel, delta);
          v.mesh.scale.addScalar(delta * 0.45);
          v.mesh.material.opacity = Math.max(0, (v.life / v.maxLife) * 0.28);
          if (v.life <= 0) v.mesh.visible = false;
        }
      }

      if (this.tacticalDroneMesh && this.player && this.player.pos) {
        const orbitAngle = (this.player.yaw || 0) + Math.PI * 0.65 + Math.sin(now * 0.0008) * 0.35;
        const targetX = this.player.pos.x + Math.cos(orbitAngle) * 3.8;
        const targetY = this.player.pos.y + 3.8 + Math.sin(now * 0.003) * 0.18;
        const targetZ = this.player.pos.z + Math.sin(orbitAngle) * 3.8;

        if (!this._scratchDroneTarget) this._scratchDroneTarget = new THREE.Vector3();
        this._scratchDroneTarget.set(targetX, targetY, targetZ);
        this.tacticalDroneMesh.position.lerp(this._scratchDroneTarget, Math.min(1.0, delta * 4.5));
        this.tacticalDroneMesh.rotation.y = (this.player.yaw || 0);

        if (this.droneRotors && this.droneRotors.length) {
          for (let r = 0; r < this.droneRotors.length; r++) {
            this.droneRotors[r].rotation.y += delta * 38.0;
          }
        }
      }

      if (this.camera) {
        if (this.sunMesh && typeof currentSunDir !== 'undefined') {
          this.sunMesh.position.copy(this.camera.position).addScaledVector(currentSunDir, 1600);
        }
        if (this.moonMesh && typeof currentMoonDir !== 'undefined') {
          this.moonMesh.position.copy(this.camera.position).addScaledVector(currentMoonDir, 1600);
        }
      }

      this.updateSurvival(delta);
      this.updateTeslaFlightPhysics(delta, now);

      // Synchronize standing character vs seated driver silhouette so character never float-glitches inside Tesla/Supercars
      const cruiserHudEl = document.getElementById('cruiser-hud');
      const inProvinceVehicle = !!(cruiserHudEl && cruiserHudEl.style.display !== 'none');
      const inMetroVehicle = !!(typeof window.gameState !== 'undefined' && window.gameState && (
        window.gameState.inVehicle ||
        window.gameState.inPlane ||
        window.gameState.inTrain ||
        window.gameState.inCalgaryCTrain ||
        window.gameState.inExocraft ||
        window.gameState.flightMode === 'starship'
      ));
      const isInsideAnyVehicle = inProvinceVehicle || inMetroVehicle || this.teslaFlightActive;

      if (isInsideAnyVehicle) {
        if (this.playerGroup) this.playerGroup.visible = false;
        if (typeof window.playerGroup !== 'undefined' && window.playerGroup) window.playerGroup.visible = false;
        if (typeof window.playerModelGroup !== 'undefined' && window.playerModelGroup) window.playerModelGroup.visible = false;
        const isFirstPerson = (typeof window.gameState !== 'undefined' && window.gameState && window.gameState.cameraMode === '1P') ||
                              (typeof window.cameraMode !== 'undefined' && window.cameraMode === '1P');
        if (this.activeDriverMesh) {
          this.activeDriverMesh.visible = !isFirstPerson && (inProvinceVehicle || (window.gameState && window.gameState.inVehicle) || this.teslaFlightActive);
        }
      } else {
        if (this.activeDriverMesh) this.activeDriverMesh.visible = false;
        if (this.playerGroup) {
          const is3P = (typeof window.cameraMode === 'undefined' || window.cameraMode === '3P');
          this.playerGroup.visible = is3P;
        }
      }

      this.updatePoliceAndMilitarySystem(delta, now, this.player ? this.player.pos : null);

      // Guaranteed Live Top-Down GPS Map Render on Metropolis & Province Canvases (Throttled to 20 FPS on visible canvases only)
      if (!this._lastGpsMapDrawTime || (now - this._lastGpsMapDrawTime > 48)) {
        this._lastGpsMapDrawTime = now;
        if (this.player && this.player.pos) {
          const pYaw = this.player.yaw || 0;
          const cityCvs = document.getElementById('city-hud-radar-canvas');
          if (cityCvs && cityCvs.offsetParent !== null) {
            renderLiveGPSMinimap(cityCvs, this.player.pos, pYaw, { isMetropolis: true, range: cityCvs._gpsZoomRange });
          }
          const miniCvs = document.getElementById('mobile-minimap-canvas') || document.getElementById('minimap-canvas');
          if (miniCvs && miniCvs.offsetParent !== null) {
            renderLiveGPSMinimap(miniCvs, this.player.pos, pYaw, { isMetropolis: true, range: miniCvs._gpsZoomRange || 520 });
          }
          const provCvs = document.getElementById('hud-radar-canvas');
          if (provCvs && provCvs.offsetParent !== null) {
            renderLiveGPSMinimap(provCvs, this.player.pos, pYaw, { isMetropolis: false, range: provCvs._gpsZoomRange });
          }
        }
      }

      // Check proximity to parked showroom supercars in Metropolis
      if (this.player && this.player.pos && this.dealershipShowroomCars.length > 0) {
        const k = (typeof window.keys !== 'undefined') ? window.keys : this._localKeys;
        if (k && (k['KeyE'] || k['e'] || k['E'])) {
          for (let i = 0; i < this.dealershipShowroomCars.length; i++) {
            const sc = this.dealershipShowroomCars[i];
            if (Math.hypot(this.player.pos.x - sc.worldPos.x, this.player.pos.z - sc.worldPos.z) < 6.5) {
              k['KeyE'] = false;
              this.spawnExoticCar(sc.id, true);
              break;
            }
          }
        }
      }
    }

    restoreSafeDisplay() {
      for (let i = 0; i < this.distantCullGroup.length; i++) {
        if (this.distantCullGroup[i]) this.distantCullGroup[i].visible = true;
      }
      this.setQuality('low');
    }
  }

  window.HyperRealismEngine = new HyperRealismEngine();
  window.renderLiveGPSMinimap = renderLiveGPSMinimap;

  window.cycleCityWinterGear = function() {
    window.HyperRealismEngine.cycleWinterGear();
  };
  window.drinkCityHotThermos = function() {
    window.HyperRealismEngine.drinkThermos();
  };
  window.setHyperQuality = function(mode) {
    window.HyperRealismEngine.setQuality(mode);
  };

})(window);
