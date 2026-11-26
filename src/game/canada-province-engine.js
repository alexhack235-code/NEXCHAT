/**
 * Canada Province Simulation Engine (Three.js r128)
 * Exposes `window.CanadaProvinceEngine.boot(provinceId)`
 * Single clamped 60 FPS rAF loop, zero per-frame allocations, walkable operative +
 * drivable Canadian Highway Cruiser, landmark scanner, minimap radar, Atlas & Codex modals.
 */
(function (global) {
  'use strict';

  const QUALITY_PRESETS = {
    ultra: { label: 'Ultra', dprCap: 1.75, shadows: true },
    balanced: { label: 'Balanced', dprCap: 1.25, shadows: true },
    battery: { label: 'Battery', dprCap: 1.0, shadows: false }
  };

  const LIGHTING_MODES = ['day', 'golden', 'aurora'];

  let activeSession = null;

  function safeStorageGet(key) {
    try {
      return global.localStorage ? global.localStorage.getItem(key) : null;
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(key, val) {
    try {
      if (global.localStorage) global.localStorage.setItem(key, val);
    } catch (_) {
      // Ignore storage quota / private mode errors
    }
  }

  function loadDiscovered(provinceId) {
    const raw = safeStorageGet('canada_discovered_' + provinceId);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveDiscovered(provinceId, map) {
    safeStorageSet('canada_discovered_' + provinceId, JSON.stringify(map));
  }

  function resolveProvinceHref(href) {
    const path = (global.location && global.location.pathname) || '';
    if (path.indexOf('/Canada/') !== -1) {
      return '/Canada/' + href;
    }
    return href;
  }

  function createOperativeMesh(THREE, accentHex) {
    const group = new THREE.Group();
    const parkaMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.65 });
    const trimMat = new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.45, metalness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 });

    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.85, 0.42), darkMat);
    legs.position.y = 0.425;
    legs.castShadow = true;
    group.add(legs);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.9, 0.5), parkaMat);
    torso.position.y = 1.3;
    torso.castShadow = true;
    group.add(torso);

    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.65, 0.25), trimMat);
    pack.position.set(0, 1.32, 0.34);
    group.add(pack);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 }));
    head.position.y = 2.04;
    head.castShadow = true;
    group.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.18), visorMat);
    visor.position.set(0, 2.06, -0.25);
    group.add(visor);

    return group;
  }

  function createCruiserMesh(THREE, accentHex) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.35 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const accentMat = new THREE.MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 0.25 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.85, 4.7), bodyMat);
    chassis.position.y = 0.82;
    chassis.castShadow = true;
    group.add(chassis);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.18, 4.72), stripeMat);
    stripe.position.y = 0.84;
    group.add(stripe);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.78, 2.35), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.5 }));
    cabin.position.set(0, 1.56, 0.18);
    cabin.castShadow = true;
    group.add(cabin);

    const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.32), accentMat);
    lightbar.position.set(0, 2.02, 0.1);
    group.add(lightbar);

    const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.36, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    const offsets = [[-1.16, 0.46, -1.45], [1.16, 0.46, -1.45], [-1.16, 0.46, 1.45], [1.16, 0.46, 1.45]];
    for (let i = 0; i < offsets.length; i += 1) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(offsets[i][0], offsets[i][1], offsets[i][2]);
      w.castShadow = true;
      group.add(w);
    }

    group.visible = false;
    return group;
  }

  function applyLightingFeel(THREE, world, province, mode) {
    if (!world || !world.lights) return;
    const c = province.climate;
    const { hemi, sun, skyMat } = world.lights;
    const isPolar = province.id === 'northwest-territories' || province.id === 'nunavut' || province.id === 'manitoba';

    if (mode === 'golden') {
      skyMat.uniforms.topColor.value.set('#1e1b4b');
      skyMat.uniforms.bottomColor.value.set('#f59e0b');
      sun.color.set('#ffcf87');
      sun.intensity = 1.25;
      hemi.intensity = 0.65;
    } else if (mode === 'aurora') {
      skyMat.uniforms.topColor.value.set('#020617');
      skyMat.uniforms.bottomColor.value.set('#0f3443');
      sun.color.set('#7dd3fc');
      sun.intensity = 0.65;
      hemi.intensity = 0.5;
    } else {
      skyMat.uniforms.topColor.value.set(c.skyTop);
      skyMat.uniforms.bottomColor.value.set(c.skyHorizon);
      sun.color.set(c.sunColor);
      sun.intensity = 1.15;
      hemi.intensity = 0.72;
    }

    for (let i = 0; i < world.auroraMeshes.length; i += 1) {
      world.auroraMeshes[i].visible = mode === 'aurora' || isPolar;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildHudDom(province, allProvinces, callbacks) {
    const hudEl = document.getElementById('province-hud');
    if (hudEl && hudEl.children.length === 0) {
      hudEl.className = 'province-hud';
      hudEl.innerHTML =
        '<div class="province-badge">' +
          '<div class="maple-crest" aria-hidden="true">&#127809;</div>' +
          '<div>' +
            '<div class="province-title">' + escapeHtml(province.name) + ' [' + escapeHtml(province.abbr) + ']</div>' +
            '<div class="province-sub">' + escapeHtml(province.capital) + ' &bull; ' + escapeHtml(province.highway) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="hud-right">' +
          '<div class="hud-pill" id="hud-weather-pill">' + escapeHtml(province.climate.tempC) + '&deg;C &bull; ' + escapeHtml(province.climate.weather) + '</div>' +
          '<div class="hud-pill" id="hud-fps-pill">60 FPS &bull; <span id="hud-scan-count">0/3</span></div>' +
          '<button type="button" class="btn-hud" id="btn-toggle-cruiser" title="Toggle Highway Cruiser (V)">Cruiser [V]</button>' +
          '<button type="button" class="btn-hud" id="btn-toggle-quality" title="Cycle Graphics Quality">Balanced</button>' +
          '<button type="button" class="btn-hud" id="btn-toggle-sky" title="Cycle Day / Golden / Aurora">Day</button>' +
          '<button type="button" class="btn-hud" id="btn-open-atlas" title="14-Province Atlas">Atlas (14)</button>' +
          '<button type="button" class="btn-hud" id="btn-open-codex" title="Canadian Codex">Codex</button>' +
          '<a class="btn-return" href="game.html">Beyond Earth</a>' +
        '</div>';
    }

    const missionEl = document.getElementById('mission-tracker');
    if (missionEl && missionEl.children.length === 0) {
      missionEl.className = 'mission-tracker';
      let itemsHtml = '';
      for (let i = 0; i < province.landmarks.length; i += 1) {
        const lm = province.landmarks[i];
        itemsHtml += '<div class="mission-item" data-landmark-id="' + escapeHtml(lm.id) + '"><span>&#9675;</span> ' + escapeHtml(lm.name) + '</div>';
      }
      missionEl.innerHTML =
        '<div class="mission-header"><span>LANDMARK SCANNER</span><span id="mission-progress-text">0 / ' + province.landmarks.length + '</span></div>' +
        itemsHtml;
    }

    const radarEl = document.getElementById('radar-container');
    let radarCanvas = document.getElementById('hud-radar-canvas');
    if (radarEl && !radarCanvas) {
      radarCanvas = document.createElement('canvas');
      radarCanvas.id = 'hud-radar-canvas';
      radarCanvas.width = 132;
      radarCanvas.height = 132;
      radarEl.appendChild(radarCanvas);
    }

    const cruiserEl = document.getElementById('cruiser-hud');
    if (cruiserEl && cruiserEl.children.length === 0) {
      cruiserEl.innerHTML =
        '<div><span class="speed-val" id="cruiser-speed-val">0</span><span class="speed-unit">KM/H</span></div>' +
        '<div class="cruiser-mode-label">CANADIAN HIGHWAY CRUISER &bull; [V] EXIT</div>';
    }

    const promptEl = document.getElementById('interact-prompt');
    if (promptEl && promptEl.children.length === 0) {
      promptEl.innerHTML = '<span id="interact-prompt-text">Press [E] or Tap to Scan Landmark</span>';
    }

    const touchEl = document.getElementById('mobile-touch-controls');
    if (touchEl && touchEl.children.length === 0) {
      touchEl.innerHTML =
        '<div class="touch-stick-zone" id="touch-stick-zone"><div class="touch-stick-knob" id="touch-stick-knob"></div></div>' +
        '<div class="touch-actions">' +
          '<button type="button" class="touch-btn" id="touch-btn-scan">Scan</button>' +
          '<button type="button" class="touch-btn" id="touch-btn-cruiser">Cruiser</button>' +
          '<button type="button" class="touch-btn" id="touch-btn-boost">Boost</button>' +
        '</div>';
    }

    const atlasEl = document.getElementById('province-atlas-modal');
    if (atlasEl && atlasEl.children.length === 0) {
      atlasEl.className = 'province-modal';
      let cardsHtml = '';
      for (let i = 0; i < allProvinces.length; i += 1) {
        const p = allProvinces[i];
        const isCurrent = p.id === province.id;
        cardsHtml +=
          '<a class="province-card' + (isCurrent ? ' active' : '') + '" href="' + escapeHtml(resolveProvinceHref(p.href)) + '">' +
            '<div class="province-card-top"><strong>' + escapeHtml(p.name) + '</strong><span>' + escapeHtml(p.abbr) + '</span></div>' +
            '<div class="province-card-meta">' + escapeHtml(p.capital) + ' &bull; ' + escapeHtml(p.climate.tempC) + '&deg;C</div>' +
            '<div class="province-card-sub">' + escapeHtml(p.highway) + '</div>' +
          '</a>';
      }
      atlasEl.innerHTML =
        '<div class="modal-box" role="dialog" aria-modal="true" aria-label="14-Province Canadian Atlas">' +
          '<div class="modal-header">' +
            '<h2>Trans-Canada Atlas (14 Regions)</h2>' +
            '<button type="button" class="modal-close" id="btn-close-atlas" aria-label="Close Atlas">&times;</button>' +
          '</div>' +
          '<div class="modal-grid">' + cardsHtml + '</div>' +
        '</div>';
    }

    const codexEl = document.getElementById('modal-codex');
    if (codexEl && codexEl.children.length === 0) {
      codexEl.className = 'province-modal';
      let lmHtml = '';
      for (let i = 0; i < province.landmarks.length; i += 1) {
        const lm = province.landmarks[i];
        lmHtml += '<div class="codex-item"><strong>' + escapeHtml(lm.name) + '</strong> (' + lm.elevationM + ' m) — ' + escapeHtml(lm.description) + '</div>';
      }
      let factsHtml = '';
      for (let i = 0; i < province.codexFacts.length; i += 1) {
        factsHtml += '<li>' + escapeHtml(province.codexFacts[i]) + '</li>';
      }
      codexEl.innerHTML =
        '<div class="modal-box" role="dialog" aria-modal="true" aria-label="Canadian Codex">' +
          '<div class="modal-header">' +
            '<h2>Canadian Codex &mdash; ' + escapeHtml(province.name) + '</h2>' +
            '<button type="button" class="modal-close" id="btn-close-codex" aria-label="Close Codex">&times;</button>' +
          '</div>' +
          '<div class="codex-body">' +
            '<p><strong>Capital:</strong> ' + escapeHtml(province.capital) + ' &bull; <strong>Major Cities:</strong> ' + escapeHtml(province.majorCities.join(', ')) + '</p>' +
            '<p><strong>Corridor:</strong> ' + escapeHtml(province.highway) + ' &bull; <strong>Biome:</strong> ' + escapeHtml(province.biome) + '</p>' +
            '<h3>Key Landmarks</h3>' + lmHtml +
            '<h3>Geographic &amp; Historical Facts</h3><ul>' + factsHtml + '</ul>' +
          '</div>' +
        '</div>';
    }

    // Wire buttons
    const bindClick = function (id, fn) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };
    bindClick('btn-toggle-cruiser', callbacks.toggleCruiser);
    bindClick('touch-btn-cruiser', callbacks.toggleCruiser);
    bindClick('btn-toggle-quality', callbacks.cycleQuality);
    bindClick('btn-toggle-sky', callbacks.cycleLighting);
    bindClick('btn-open-atlas', function () { callbacks.setModal('atlas', true); });
    bindClick('btn-close-atlas', function () { callbacks.setModal('atlas', false); });
    bindClick('btn-open-codex', function () { callbacks.setModal('codex', true); });
    bindClick('btn-close-codex', function () { callbacks.setModal('codex', false); });
    bindClick('touch-btn-scan', callbacks.scanNearest);
    bindClick('interact-prompt', callbacks.scanNearest);

    if (atlasEl) {
      atlasEl.addEventListener('click', function (e) {
        if (e.target === atlasEl) callbacks.setModal('atlas', false);
      });
    }
    if (codexEl) {
      codexEl.addEventListener('click', function (e) {
        if (e.target === codexEl) callbacks.setModal('codex', false);
      });
    }

    return { radarCanvas };
  }

  function drawRadar(ctx, width, height, px, pz, yaw, landmarks, discovered, accent) {
    if (!ctx) return;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const scale = 0.52;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(6, 14, 26, 0.86)';
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, cx * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Landmarks
    for (let i = 0; i < landmarks.length; i += 1) {
      const lm = landmarks[i];
      const dx = (lm.coords[0] - px) * scale;
      const dz = (lm.coords[2] - pz) * scale;
      const rx = Math.max(8, Math.min(width - 8, cx + dx));
      const ry = Math.max(8, Math.min(height - 8, cy + dz));
      ctx.fillStyle = discovered[lm.id] ? '#10b981' : accent;
      ctx.beginPath();
      ctx.arc(rx, ry, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player triangle
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-yaw);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -6.5);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function boot(provinceId) {
    if (activeSession && activeSession.province.id === provinceId) {
      return activeSession;
    }
    if (activeSession) {
      activeSession.dispose();
      activeSession = null;
    }

    const provinces = global.CANADA_PROVINCES;
    if (!provinces || !global.CanadaLandmarks) {
      throw new Error('CanadaProvinces data and CanadaLandmarks must be loaded before booting');
    }

    const id = provinceId || (document.body && document.body.dataset && document.body.dataset.province) || 'ontario';
    const province = provinces.get ? provinces.get(id) : provinces[0];

    if (document.body && province.climate) {
      document.body.style.setProperty('--prov-accent', province.climate.accent);
    }

    const container = document.getElementById('canvas-container') || document.body;
    const THREE = global.THREE;

    let renderer = null;
    let scene = null;
    let camera = null;
    let world = null;

    let qualityKey = 'balanced';
    let lightingIdx = (province.id === 'northwest-territories' || province.id === 'nunavut') ? 2 : 0;
    let inCruiser = false;
    let modalOpen = false;
    let rafId = 0;
    let disposed = false;

    const discovered = loadDiscovered(province.id);

    const player = {
      x: 0,
      y: 0,
      z: 18,
      vy: 0,
      yaw: 0,
      speed: 0,
      boost: false
    };

    const keys = Object.create(null);
    const touchInput = { x: 0, y: 0, boost: false };

    let notifyTimer = 0;
    function showNotify(msg) {
      const box = document.getElementById('notify-box');
      if (!box) return;
      box.textContent = msg;
      box.style.display = 'block';
      clearTimeout(notifyTimer);
      notifyTimer = setTimeout(function () {
        box.style.display = 'none';
      }, 2800);
    }

    function updateMissionDom() {
      let count = 0;
      const items = document.querySelectorAll('.mission-item[data-landmark-id]');
      for (let i = 0; i < items.length; i += 1) {
        const lid = items[i].getAttribute('data-landmark-id');
        if (discovered[lid]) {
          items[i].classList.add('done');
          count += 1;
        }
      }
      const prog = document.getElementById('mission-progress-text');
      if (prog) prog.textContent = count + ' / ' + province.landmarks.length;
      const scanPill = document.getElementById('hud-scan-count');
      if (scanPill) scanPill.textContent = count + '/' + province.landmarks.length;

      if (world && world.landmarkMarkers) {
        for (let i = 0; i < world.landmarkMarkers.length; i += 1) {
          const m = world.landmarkMarkers[i];
          if (discovered[m.id]) {
            m.ring.material.color.setHex(0x10b981);
            m.pillar.material.color.setHex(0x10b981);
          }
        }
      }
    }

    let nearestLandmark = null;
    function scanNearest() {
      if (!nearestLandmark) return;
      if (!discovered[nearestLandmark.id]) {
        discovered[nearestLandmark.id] = true;
        saveDiscovered(province.id, discovered);
        updateMissionDom();
        showNotify('Landmark Discovered: ' + nearestLandmark.name);
      } else {
        showNotify(nearestLandmark.name + ' (' + nearestLandmark.elevationM + ' m) — Already Logged');
      }
    }

    let operativeMesh = null;
    let cruiserMesh = null;

    function toggleCruiser() {
      inCruiser = !inCruiser;
      player.speed = 0;
      if (operativeMesh) operativeMesh.visible = !inCruiser;
      if (cruiserMesh) cruiserMesh.visible = inCruiser;
      const chud = document.getElementById('cruiser-hud');
      if (chud) chud.style.display = inCruiser ? 'block' : 'none';
      const btn = document.getElementById('btn-toggle-cruiser');
      if (btn) btn.textContent = inCruiser ? 'Exit Cruiser [V]' : 'Cruiser [V]';
      showNotify(inCruiser ? 'Entered Canadian Highway Cruiser' : 'Exited Cruiser — On Foot');
    }

    function cycleQuality() {
      const order = ['ultra', 'balanced', 'battery'];
      qualityKey = order[(order.indexOf(qualityKey) + 1) % order.length];
      const preset = QUALITY_PRESETS[qualityKey];
      if (renderer) {
        renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, preset.dprCap));
        renderer.shadowMap.enabled = preset.shadows;
      }
      const btn = document.getElementById('btn-toggle-quality');
      if (btn) btn.textContent = preset.label;
      showNotify('Graphics Quality: ' + preset.label);
    }

    function cycleLighting() {
      lightingIdx = (lightingIdx + 1) % LIGHTING_MODES.length;
      const mode = LIGHTING_MODES[lightingIdx];
      if (THREE && world) {
        applyLightingFeel(THREE, world, province, mode);
      }
      const btn = document.getElementById('btn-toggle-sky');
      if (btn) btn.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    }

    function setModal(which, open) {
      const atlasEl = document.getElementById('province-atlas-modal');
      const codexEl = document.getElementById('modal-codex');
      if (which === 'atlas' && atlasEl) {
        atlasEl.classList.toggle('visible', open);
        if (open && codexEl) codexEl.classList.remove('visible');
      }
      if (which === 'codex' && codexEl) {
        codexEl.classList.toggle('visible', open);
        if (open && atlasEl) atlasEl.classList.remove('visible');
      }
      modalOpen = (atlasEl && atlasEl.classList.contains('visible')) || (codexEl && codexEl.classList.contains('visible'));
    }

    const domRefs = buildHudDom(province, provinces, {
      toggleCruiser: toggleCruiser,
      cycleQuality: cycleQuality,
      cycleLighting: cycleLighting,
      setModal: setModal,
      scanNearest: scanNearest
    });
    const radarCtx = domRefs.radarCanvas ? domRefs.radarCanvas.getContext('2d') : null;

    // Initialize WebGL safely
    try {
      if (!THREE) throw new Error('Three.js not loaded');
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, QUALITY_PRESETS[qualityKey].dprCap));
      renderer.setSize(container.clientWidth || global.innerWidth, container.clientHeight || global.innerHeight);
      renderer.shadowMap.enabled = QUALITY_PRESETS[qualityKey].shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(62, (container.clientWidth || global.innerWidth) / (container.clientHeight || global.innerHeight), 0.5, 650);

      world = global.CanadaLandmarks.buildProvinceWorld(scene, province, qualityKey);
      applyLightingFeel(THREE, world, province, LIGHTING_MODES[lightingIdx]);

      operativeMesh = createOperativeMesh(THREE, province.climate.accent);
      cruiserMesh = createCruiserMesh(THREE, province.climate.accent);
      scene.add(operativeMesh);
      scene.add(cruiserMesh);
    } catch (err) {
      container.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#e2e8f0;font-family:sans-serif;padding:24px;text-align:center;">' +
          '<div><h2>3D WebGL Unavailable</h2><p>' + escapeHtml(err && err.message ? err.message : 'Unable to initialize WebGL context.') + '</p></div>' +
        '</div>';
    }

    updateMissionDom();

    // Input handlers
    function onKeyDown(e) {
      const code = e.code;
      keys[code] = true;
      if (code === 'KeyV') toggleCruiser();
      if (code === 'KeyE') scanNearest();
      if (code === 'Escape') {
        setModal('atlas', false);
        setModal('codex', false);
      }
    }
    function onKeyUp(e) {
      keys[e.code] = false;
    }
    function onResize() {
      if (!renderer || !camera) return;
      const w = container.clientWidth || global.innerWidth;
      const h = container.clientHeight || global.innerHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    global.addEventListener('keydown', onKeyDown);
    global.addEventListener('keyup', onKeyUp);
    global.addEventListener('resize', onResize);

    // Touch stick
    const stickZone = document.getElementById('touch-stick-zone');
    const stickKnob = document.getElementById('touch-stick-knob');
    if (stickZone) {
      let stickTouchId = null;
      stickZone.addEventListener('touchstart', function (e) {
        if (e.changedTouches.length > 0) stickTouchId = e.changedTouches[0].identifier;
      }, { passive: true });
      stickZone.addEventListener('touchmove', function (e) {
        for (let i = 0; i < e.changedTouches.length; i += 1) {
          const t = e.changedTouches[i];
          if (t.identifier === stickTouchId) {
            const rect = stickZone.getBoundingClientRect();
            const dx = (t.clientX - (rect.left + rect.width * 0.5)) / (rect.width * 0.5);
            const dy = (t.clientY - (rect.top + rect.height * 0.5)) / (rect.height * 0.5);
            const len = Math.min(1, Math.hypot(dx, dy));
            const ang = Math.atan2(dy, dx);
            touchInput.x = Math.cos(ang) * len;
            touchInput.y = Math.sin(ang) * len;
            if (stickKnob) {
              stickKnob.style.transform = 'translate(' + (touchInput.x * 24) + 'px,' + (touchInput.y * 24) + 'px)';
            }
          }
        }
      }, { passive: true });
      const resetStick = function () {
        stickTouchId = null;
        touchInput.x = 0;
        touchInput.y = 0;
        if (stickKnob) stickKnob.style.transform = 'translate(0px,0px)';
      };
      stickZone.addEventListener('touchend', resetStick, { passive: true });
      stickZone.addEventListener('touchcancel', resetStick, { passive: true });
    }

    const boostBtn = document.getElementById('touch-btn-boost');
    if (boostBtn) {
      boostBtn.addEventListener('touchstart', function () { touchInput.boost = true; }, { passive: true });
      boostBtn.addEventListener('touchend', function () { touchInput.boost = false; }, { passive: true });
    }

    // Pre-allocated camera & math vectors (ZERO per-frame allocations)
    const camTarget = THREE ? new THREE.Vector3() : null;
    const camDesired = THREE ? new THREE.Vector3() : null;

    let lastTime = performance.now();
    let elapsed = 0;
    let hudTimer = 0;
    let frameCounter = 0;
    let fpsAccumulator = 0;
    let currentFps = 60;

    function tick(now) {
      if (disposed) return;
      rafId = global.requestAnimationFrame(tick);

      const rawDt = (now - lastTime) * 0.001;
      lastTime = now;
      if (document.hidden || modalOpen || !renderer || !scene || !camera) return;

      const dt = Math.min(0.05, Math.max(0.001, rawDt));
      elapsed += dt;

      // Movement
      const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - touchInput.y;
      const turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - touchInput.x;
      const boosting = !!(keys.ShiftLeft || keys.ShiftRight || touchInput.boost);

      if (inCruiser) {
        const maxSpd = boosting ? 42 : 28;
        if (Math.abs(forward) > 0.05) {
          player.speed += forward * 28 * dt;
        } else {
          player.speed *= Math.pow(0.25, dt);
        }
        player.speed = Math.max(-14, Math.min(maxSpd, player.speed));
        player.yaw += turn * 2.1 * dt * (player.speed >= -0.5 ? 1 : -1);
      } else {
        const walkSpd = boosting ? 19 : 11.5;
        player.speed = forward * walkSpd;
        player.yaw += turn * 2.6 * dt;
        if (keys.Space && player.y <= 0.01) {
          player.vy = 8.5;
        }
        player.vy -= 22 * dt;
        player.y = Math.max(0, player.y + player.vy * dt);
        if (player.y === 0) player.vy = 0;
      }

      player.x -= Math.sin(player.yaw) * player.speed * dt;
      player.z -= Math.cos(player.yaw) * player.speed * dt;
      player.x = Math.max(-220, Math.min(220, player.x));
      player.z = Math.max(-180, Math.min(220, player.z));

      if (operativeMesh) {
        operativeMesh.position.set(player.x, player.y, player.z);
        operativeMesh.rotation.y = player.yaw;
      }
      if (cruiserMesh) {
        cruiserMesh.position.set(player.x, 0, player.z);
        cruiserMesh.rotation.y = player.yaw;
      }

      // Third-person smooth camera
      const camDist = inCruiser ? 14 : 8.5;
      const camHeight = inCruiser ? 5.6 : 3.8;
      camDesired.set(
        player.x + Math.sin(player.yaw) * camDist,
        player.y + camHeight,
        player.z + Math.cos(player.yaw) * camDist
      );
      camera.position.lerp(camDesired, 1 - Math.pow(0.008, dt));
      camTarget.set(player.x, player.y + 1.6, player.z);
      camera.lookAt(camTarget);

      if (world && world.update) {
        world.update(elapsed);
      }

      renderer.render(scene, camera);

      // Proximity landmark check + 15Hz HUD throttle
      frameCounter += 1;
      fpsAccumulator += dt;
      hudTimer += dt;
      if (hudTimer >= 0.066) {
        hudTimer = 0;
        if (fpsAccumulator >= 0.5) {
          currentFps = Math.round(frameCounter / fpsAccumulator);
          frameCounter = 0;
          fpsAccumulator = 0;
          const fpsPill = document.getElementById('hud-fps-pill');
          if (fpsPill && fpsPill.firstChild) {
            fpsPill.firstChild.textContent = currentFps + ' FPS \u2022 ';
          }
        }

        if (inCruiser) {
          const spEl = document.getElementById('cruiser-speed-val');
          if (spEl) spEl.textContent = String(Math.round(Math.abs(player.speed) * 3.2));
        }

        let found = null;
        let bestDistSq = 18 * 18;
        for (let i = 0; i < province.landmarks.length; i += 1) {
          const lm = province.landmarks[i];
          const dx = player.x - lm.coords[0];
          const dz = player.z - lm.coords[2];
          const dSq = dx * dx + dz * dz;
          if (dSq < bestDistSq) {
            bestDistSq = dSq;
            found = lm;
          }
        }
        nearestLandmark = found;
        const promptEl = document.getElementById('interact-prompt');
        if (promptEl) {
          if (found) {
            const pText = document.getElementById('interact-prompt-text');
            if (pText) pText.textContent = 'Press [E] or Tap to Scan: ' + found.name;
            promptEl.style.display = 'flex';
          } else {
            promptEl.style.display = 'none';
          }
        }

        drawRadar(
          radarCtx,
          132,
          132,
          player.x,
          player.z,
          player.yaw,
          province.landmarks,
          discovered,
          province.climate.accent
        );
      }
    }

    rafId = global.requestAnimationFrame(tick);

    function dispose() {
      disposed = true;
      if (rafId) global.cancelAnimationFrame(rafId);
      global.removeEventListener('keydown', onKeyDown);
      global.removeEventListener('keyup', onKeyUp);
      global.removeEventListener('resize', onResize);
      if (renderer) {
        renderer.dispose();
      }
    }

    global.addEventListener('beforeunload', dispose);

    activeSession = {
      province: province,
      dispose: dispose,
      toggleCruiser: toggleCruiser,
      scanNearest: scanNearest
    };
    return activeSession;
  }

  global.CanadaProvinceEngine = {
    boot: boot
  };
})(typeof window !== 'undefined' ? window : globalThis);
