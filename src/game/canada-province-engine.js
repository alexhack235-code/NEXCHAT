/**
 * Canada Province Simulation Engine (Three.js r128)
 * Exposes `window.CanadaProvinceEngine.boot(provinceId)`
 * Single clamped 60 FPS rAF loop, zero per-frame allocations, walkable operative +
 * drivable Canadian Highway Cruiser, Rockstar-style weapons/wanted-heat/contracts,
 * functional buildings, landmark scanner, minimap radar, Atlas & Codex modals.
 */
(function (global) {
  'use strict';

  const QUALITY_PRESETS = {
    ultra: { label: 'Ultra', dprCap: 1.75, shadows: true },
    balanced: { label: 'Balanced', dprCap: 1.25, shadows: true },
    battery: { label: 'Battery', dprCap: 1.0, shadows: false }
  };

  const LIGHTING_MODES = ['day', 'golden', 'aurora'];

  const MAX_BULLETS = 36;
  const MAX_SPARKS = 40;
  const MAX_ENEMIES = 8;

  const WEAPON_ORDER = ['unarmed', 'pistol', 'carbine', 'shotgun'];
  const WEAPONS = {
    unarmed: {
      id: 'unarmed',
      slot: 1,
      name: 'Unarmed',
      shortName: 'Fists',
      damage: 18,
      fireRate: 0.42,
      reloadTime: 0,
      magSize: 0,
      bulletSpeed: 0,
      pellets: 0,
      spread: 0,
      range: 2.8,
      auto: false,
      cost: 0,
      ammoCost: 0
    },
    pistol: {
      id: 'pistol',
      slot: 2,
      name: 'Tactical Pistol',
      shortName: 'Pistol',
      damage: 28,
      fireRate: 0.24,
      reloadTime: 1.05,
      magSize: 12,
      bulletSpeed: 96,
      pellets: 1,
      spread: 0.018,
      range: 75,
      auto: false,
      cost: 0,
      ammoCost: 0
    },
    carbine: {
      id: 'carbine',
      slot: 3,
      name: 'Assault Carbine',
      shortName: 'Carbine',
      damage: 21,
      fireRate: 0.11,
      reloadTime: 1.35,
      magSize: 30,
      bulletSpeed: 118,
      pellets: 1,
      spread: 0.032,
      range: 92,
      auto: true,
      cost: 150,
      ammoCost: 30
    },
    shotgun: {
      id: 'shotgun',
      slot: 4,
      name: 'Pulse Shotgun',
      shortName: 'Shotgun',
      damage: 19,
      fireRate: 0.65,
      reloadTime: 1.5,
      magSize: 6,
      bulletSpeed: 84,
      pellets: 5,
      spread: 0.14,
      range: 48,
      auto: false,
      cost: 250,
      ammoCost: 35
    }
  };

  const CONTRACT_TEMPLATES = [
    {
      id: 'rogue_drones',
      title: 'Clear Rogue Drones',
      subtitle: 'Eliminate rogue security drones disrupting corridor comms.',
      enemyType: 'drone',
      target: 4,
      cashReward: 180,
      respectReward: 60
    },
    {
      id: 'armored_convoy',
      title: 'Armored Convoy Intercept',
      subtitle: 'Neutralize heavy armored syndicate units along the highway.',
      enemyType: 'armored',
      target: 3,
      cashReward: 260,
      respectReward: 95
    },
    {
      id: 'outpost_sweep',
      title: 'Outpost Sweep',
      subtitle: 'Sweep hostile syndicate enforcers from the sector perimeter.',
      enemyType: 'enforcer',
      target: 6,
      cashReward: 340,
      respectReward: 130
    }
  ];

  const BUILDING_COLORS = {
    gunshop: '#f59e0b',
    safehouse: '#10b981',
    garage: '#38bdf8',
    contract: '#a855f7'
  };

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

  function loadProfile() {
    const defaults = {
      cash: 200,
      respect: 0,
      unlockedWeapons: { unarmed: true, pistol: true, carbine: false, shotgun: false },
      mag: { pistol: 12, carbine: 30, shotgun: 6 },
      reserve: { pistol: Infinity, carbine: 90, shotgun: 24 },
      armor: 50,
      cruiserTier: 1,
      boostTier: 1,
      audioEnabled: true,
      contractsCompleted: 0
    };
    const raw = safeStorageGet('canada_rockstar_profile_v1');
    if (!raw) return defaults;
    try {
      const p = JSON.parse(raw);
      if (!p || typeof p !== 'object') return defaults;
      return {
        cash: typeof p.cash === 'number' && !isNaN(p.cash) ? Math.max(0, Math.floor(p.cash)) : defaults.cash,
        respect: typeof p.respect === 'number' && !isNaN(p.respect) ? Math.max(0, Math.floor(p.respect)) : 0,
        unlockedWeapons: Object.assign({}, defaults.unlockedWeapons, p.unlockedWeapons || {}),
        mag: Object.assign({}, defaults.mag, p.mag || {}),
        reserve: {
          pistol: Infinity,
          carbine: p.reserve && typeof p.reserve.carbine === 'number' ? Math.max(0, p.reserve.carbine) : defaults.reserve.carbine,
          shotgun: p.reserve && typeof p.reserve.shotgun === 'number' ? Math.max(0, p.reserve.shotgun) : defaults.reserve.shotgun
        },
        armor: typeof p.armor === 'number' && !isNaN(p.armor) ? Math.max(0, Math.min(100, p.armor)) : defaults.armor,
        cruiserTier: typeof p.cruiserTier === 'number' ? Math.max(1, Math.min(3, p.cruiserTier)) : 1,
        boostTier: typeof p.boostTier === 'number' ? Math.max(1, Math.min(3, p.boostTier)) : 1,
        audioEnabled: typeof p.audioEnabled === 'boolean' ? p.audioEnabled : true,
        contractsCompleted: typeof p.contractsCompleted === 'number' ? p.contractsCompleted : 0
      };
    } catch (_) {
      return defaults;
    }
  }

  function saveProfile(profile) {
    safeStorageSet('canada_rockstar_profile_v1', JSON.stringify({
      cash: profile.cash,
      respect: profile.respect,
      unlockedWeapons: profile.unlockedWeapons,
      mag: profile.mag,
      reserve: {
        carbine: profile.reserve.carbine,
        shotgun: profile.reserve.shotgun
      },
      armor: Math.round(profile.armor),
      cruiserTier: profile.cruiserTier,
      boostTier: profile.boostTier,
      audioEnabled: profile.audioEnabled,
      contractsCompleted: profile.contractsCompleted
    }));
  }

  function toHexNumber(val, fallback) {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const parsed = parseInt(val.replace('#', ''), 16);
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  }

  function resolveProvinceHref(href) {
    const path = (global.location && global.location.pathname) || '';
    if (path.indexOf('/Canada/') !== -1) {
      return '/Canada/' + href;
    }
    return href;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ============================================================================
  // SYNTHESIZED WEB AUDIO ENGINE (Zero external files)
  // ============================================================================
  function createSoundEngine(getEnabled) {
    let ctx = null;
    let noiseBuffer = null;

    function ensureCtx() {
      if (!getEnabled()) return null;
      if (!ctx) {
        const AudioCtx = global.AudioContext || global.webkitAudioContext;
        if (!AudioCtx) return null;
        try {
          ctx = new AudioCtx();
        } catch (_) {
          return null;
        }
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(function () {});
      }
      if (!noiseBuffer && ctx) {
        const len = Math.floor(ctx.sampleRate * 0.3);
        noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i += 1) {
          data[i] = Math.random() * 2 - 1;
        }
      }
      return ctx;
    }

    function playNoise(duration, filterFreq, filterType, gainPeak) {
      const c = ensureCtx();
      if (!c || !noiseBuffer) return;
      const now = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = c.createBiquadFilter();
      filter.type = filterType || 'bandpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      const gain = c.createGain();
      gain.gain.setValueAtTime(gainPeak, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      src.start(now);
      src.stop(now + duration);
    }

    function playTone(freqStart, freqEnd, duration, type, gainPeak, delaySec) {
      const c = ensureCtx();
      if (!c) return;
      const now = c.currentTime + (delaySec || 0);
      const osc = c.createOscillator();
      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
      }
      const gain = c.createGain();
      gain.gain.setValueAtTime(gainPeak, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    }

    return {
      unlock: ensureCtx,
      playShot: function (weaponId) {
        if (!getEnabled()) return;
        if (weaponId === 'shotgun') {
          playNoise(0.22, 520, 'lowpass', 0.24);
          playTone(155, 42, 0.2, 'sawtooth', 0.18, 0);
        } else if (weaponId === 'carbine') {
          playNoise(0.08, 1600, 'bandpass', 0.14);
          playTone(320, 95, 0.08, 'square', 0.09, 0);
        } else if (weaponId === 'pistol') {
          playNoise(0.09, 1250, 'highpass', 0.15);
          playTone(420, 110, 0.09, 'triangle', 0.12, 0);
        } else {
          playNoise(0.06, 400, 'lowpass', 0.09);
        }
      },
      playReload: function () {
        if (!getEnabled()) return;
        playTone(680, 460, 0.055, 'square', 0.06, 0);
        playTone(520, 880, 0.065, 'square', 0.07, 0.11);
      },
      playCash: function () {
        if (!getEnabled()) return;
        playTone(659.25, 659.25, 0.11, 'sine', 0.11, 0);
        playTone(987.77, 987.77, 0.18, 'sine', 0.12, 0.08);
      },
      playHit: function () {
        if (!getEnabled()) return;
        playTone(190, 75, 0.07, 'sawtooth', 0.08, 0);
      },
      playExplosion: function () {
        if (!getEnabled()) return;
        playNoise(0.28, 340, 'lowpass', 0.22);
        playTone(110, 32, 0.26, 'sawtooth', 0.16, 0);
      },
      playAlert: function () {
        if (!getEnabled()) return;
        playTone(540, 720, 0.1, 'triangle', 0.07, 0);
      }
    };
  }

  // ============================================================================
  // FALLBACK MESHES (if RealisticCharacterRig is unavailable)
  // ============================================================================
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

  // ============================================================================
  // PRE-ALLOCATED COMBAT OBJECT POOLS (ZERO PER-FRAME ALLOCATIONS)
  // ============================================================================
  function createCombatPools(THREE, scene) {
    const bulletGeo = new THREE.BoxGeometry(0.14, 0.14, 0.72);
    const playerBulletMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const enemyBulletMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const bullets = [];
    for (let i = 0; i < MAX_BULLETS; i += 1) {
      const mesh = new THREE.Mesh(bulletGeo, playerBulletMat);
      mesh.visible = false;
      scene.add(mesh);
      bullets.push({
        active: false,
        fromEnemy: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        damage: 20,
        life: 0,
        mesh: mesh
      });
    }

    const sparkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const sparkGoldMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const sparkCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const sparkRedMat = new THREE.MeshBasicMaterial({ color: 0xf87171 });

    const sparks = [];
    for (let i = 0; i < MAX_SPARKS; i += 1) {
      const mesh = new THREE.Mesh(sparkGeo, sparkGoldMat);
      mesh.visible = false;
      scene.add(mesh);
      sparks.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0,
        maxLife: 0.25,
        mesh: mesh
      });
    }

    // Pooled Security Drones / Enforcers (MAX_ENEMIES = 8)
    const droneHullGeo = new THREE.OctahedronGeometry(0.75, 1);
    const dronePodGeo = new THREE.BoxGeometry(0.32, 0.22, 0.72);
    const droneEyeGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const hpBgGeo = new THREE.PlaneGeometry(1.4, 0.14);
    const hpFillGeo = new THREE.PlaneGeometry(1.34, 0.1);

    const droneBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.7 });
    const armoredBodyMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.35, metalness: 0.75 });
    const enforcerBodyMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.35, metalness: 0.7 });
    const droneEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const armoredEyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x090d16, side: THREE.DoubleSide });
    const hpFillMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });

    const enemies = [];
    for (let i = 0; i < MAX_ENEMIES; i += 1) {
      const root = new THREE.Group();
      root.visible = false;

      const hull = new THREE.Mesh(droneHullGeo, droneBodyMat);
      hull.castShadow = true;
      root.add(hull);

      const podL = new THREE.Mesh(dronePodGeo, droneBodyMat);
      podL.position.set(-0.78, 0.08, 0);
      root.add(podL);

      const podR = new THREE.Mesh(dronePodGeo, droneBodyMat);
      podR.position.set(0.78, 0.08, 0);
      root.add(podR);

      const eye = new THREE.Mesh(droneEyeGeo, droneEyeMat);
      eye.position.set(0, 0, -0.62);
      root.add(eye);

      const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
      hpBg.position.set(0, 1.25, 0);
      root.add(hpBg);

      const hpFill = new THREE.Mesh(hpFillGeo, hpFillMat);
      hpFill.position.set(0, 1.25, 0.01);
      root.add(hpFill);

      scene.add(root);
      enemies.push({
        active: false,
        type: 'drone',
        isContractTarget: false,
        x: 0, y: 1.8, z: 0,
        vx: 0, vz: 0,
        yaw: 0,
        hp: 60,
        maxHp: 60,
        speed: 9.5,
        fireCooldown: 1.5,
        hoverPhase: i * 0.9,
        root: root,
        hull: hull,
        eye: eye,
        hpBg: hpBg,
        hpFill: hpFill
      });
    }

    return {
      bullets: bullets,
      sparks: sparks,
      enemies: enemies,
      mats: {
        playerBulletMat: playerBulletMat,
        enemyBulletMat: enemyBulletMat,
        sparkGoldMat: sparkGoldMat,
        sparkCyanMat: sparkCyanMat,
        sparkRedMat: sparkRedMat,
        droneBodyMat: droneBodyMat,
        armoredBodyMat: armoredBodyMat,
        enforcerBodyMat: enforcerBodyMat,
        droneEyeMat: droneEyeMat,
        armoredEyeMat: armoredEyeMat
      }
    };
  }

  function applyLightingFeel(THREE, world, province, mode, renderer) {
    if (!world || !world.lights) return;
    const c = province.climate;
    const { hemi, sun, fill, skyMat } = world.lights;
    const isPolar = province.id === 'northwest-territories' || province.id === 'nunavut' || province.id === 'manitoba';
    const u = skyMat && skyMat.uniforms ? skyMat.uniforms : null;

    if (mode === 'golden') {
      if (u) {
        u.topColor.value.set('#1e1b4b');
        u.bottomColor.value.set('#e06d53');
        if (u.horizonColor) u.horizonColor.value.set('#fbbf24');
        if (u.sunDir) u.sunDir.value.set(0.55, 0.24, -0.80).normalize();
        if (u.sunColor) u.sunColor.value.set('#ffd180');
        if (u.sunGlow) u.sunGlow.value = 1.0;
        if (u.cloudOpacity) u.cloudOpacity.value = 0.42;
      }
      sun.color.set('#ffcf87');
      sun.intensity = 1.32;
      sun.position.set(68, 32, -98);
      hemi.color.set('#fda4af');
      hemi.groundColor.set('#3b2820');
      hemi.intensity = 0.62;
      if (fill) {
        fill.color.set('#818cf8');
        fill.intensity = 0.28;
      }
      if (world.scene) {
        if (world.scene.fog) {
          world.scene.fog.color.set('#b46b57');
          world.scene.fog.density = world.fogDensityBase ? world.fogDensityBase * 1.1 : 0.0034;
        }
        if (world.scene.background && world.scene.background.set) {
          world.scene.background.set('#e06d53');
        }
      }
      if (renderer) renderer.toneMappingExposure = 1.08;
    } else if (mode === 'aurora') {
      if (u) {
        u.topColor.value.set('#020617');
        u.bottomColor.value.set('#0b293b');
        if (u.horizonColor) u.horizonColor.value.set('#113b4e');
        if (u.sunDir) u.sunDir.value.set(-0.35, 0.48, -0.80).normalize();
        if (u.sunColor) u.sunColor.value.set('#bae6fd');
        if (u.sunGlow) u.sunGlow.value = 0.45;
        if (u.cloudOpacity) u.cloudOpacity.value = 0.16;
      }
      sun.color.set('#93c5fd');
      sun.intensity = 0.68;
      sun.position.set(-45, 72, -92);
      hemi.color.set('#38bdf8');
      hemi.groundColor.set('#0f172a');
      hemi.intensity = 0.48;
      if (fill) {
        fill.color.set('#34d399');
        fill.intensity = 0.22;
      }
      if (world.scene) {
        if (world.scene.fog) {
          world.scene.fog.color.set('#081e2c');
          world.scene.fog.density = world.fogDensityBase ? world.fogDensityBase * 1.15 : 0.0036;
        }
        if (world.scene.background && world.scene.background.set) {
          world.scene.background.set('#081e2c');
        }
      }
      if (renderer) renderer.toneMappingExposure = 1.02;
    } else {
      if (u) {
        u.topColor.value.set(c.skyTop);
        u.bottomColor.value.set(c.skyHorizon);
        if (u.horizonColor) u.horizonColor.value.set(c.fogColor || c.skyHorizon);
        if (u.sunDir) u.sunDir.value.set(0.50, 0.74, 0.37).normalize();
        if (u.sunColor) u.sunColor.value.set(c.sunColor);
        if (u.sunGlow) u.sunGlow.value = 0.85;
        if (u.cloudOpacity) u.cloudOpacity.value = 0.36;
      }
      sun.color.set(c.sunColor);
      sun.intensity = 1.22;
      sun.position.set(75, 110, 55);
      hemi.color.set(c.skyTop);
      hemi.groundColor.set(c.groundColor);
      hemi.intensity = 0.74;
      if (fill) {
        fill.color.set(c.accent);
        fill.intensity = 0.25;
      }
      if (world.scene) {
        if (world.scene.fog) {
          world.scene.fog.color.set(c.fogColor);
          world.scene.fog.density = world.fogDensityBase || 0.0030;
        }
        if (world.scene.background && world.scene.background.set) {
          world.scene.background.set(c.skyHorizon);
        }
      }
      if (renderer) renderer.toneMappingExposure = 1.05;
    }

    if (world.emissiveTargets) {
      const lampIntensity = mode === 'aurora' ? 1.65 : (mode === 'golden' ? 1.15 : 0.05);
      const winIntensity = mode === 'aurora' ? 0.95 : (mode === 'golden' ? 0.62 : 0.06);
      if (world.emissiveTargets.streetlightMat) {
        world.emissiveTargets.streetlightMat.emissiveIntensity = lampIntensity;
      }
      if (world.emissiveTargets.buildingMat) {
        world.emissiveTargets.buildingMat.emissiveIntensity = winIntensity;
      }
    }

    for (let i = 0; i < world.auroraMeshes.length; i += 1) {
      world.auroraMeshes[i].visible = mode === 'aurora' || isPolar;
    }
  }

  // ============================================================================
  // HUD DOM BUILDER
  // ============================================================================
  function buildHudDom(province, allProvinces, profile, callbacks) {
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
          '<button type="button" class="btn-hud" id="btn-open-contracts" title="Syndicate Contracts">Contracts</button>' +
          '<button type="button" class="btn-hud" id="btn-toggle-cruiser" title="Toggle Highway Cruiser (V)">Cruiser [V]</button>' +
          '<button type="button" class="btn-hud" id="btn-toggle-audio" title="Toggle Sound Effects">' + (profile.audioEnabled ? 'Audio: ON' : 'Audio: OFF') + '</button>' +
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
        '<div id="active-contract-box" class="contract-box">' +
          '<div class="contract-header"><span>SYNDICATE OPS</span><span id="contract-status-tag">IDLE</span></div>' +
          '<div class="contract-title" id="contract-title-text">No Active Contract</div>' +
          '<div class="contract-progress-row" id="contract-progress-text">Visit Syndicate Ops or click Contracts</div>' +
        '</div>' +
        '<div class="mission-header"><span>LANDMARK SCANNER</span><span id="mission-progress-text">0 / ' + province.landmarks.length + '</span></div>' +
        '<div class="mission-list">' + itemsHtml + '</div>';
    }

    // Rockstar-style Top-Right Status HUD (Cash, Respect, Wanted Stars)
    let statusHud = document.getElementById('rockstar-status-hud');
    if (!statusHud) {
      statusHud = document.createElement('aside');
      statusHud.id = 'rockstar-status-hud';
      statusHud.setAttribute('aria-label', 'Cash and Wanted Level');
      statusHud.innerHTML =
        '<div class="rs-money-row">' +
          '<span class="rs-cash" id="rs-cash-val">$' + profile.cash + '</span>' +
          '<span class="rs-respect" id="rs-respect-val">' + profile.respect + ' REP</span>' +
        '</div>' +
        '<div class="rs-stars" id="rs-wanted-stars" aria-label="Wanted Level 0 of 5">' +
          '<span class="rs-star" data-star="1">&#9733;</span>' +
          '<span class="rs-star" data-star="2">&#9733;</span>' +
          '<span class="rs-star" data-star="3">&#9733;</span>' +
          '<span class="rs-star" data-star="4">&#9733;</span>' +
          '<span class="rs-star" data-star="5">&#9733;</span>' +
        '</div>';
      document.body.appendChild(statusHud);
    }

    // Rockstar-style Bottom-Left Health/Armor & Weapon/Ammo Pill
    let vitalsHud = document.getElementById('weapon-vitals-hud');
    if (!vitalsHud) {
      vitalsHud = document.createElement('aside');
      vitalsHud.id = 'weapon-vitals-hud';
      vitalsHud.setAttribute('aria-label', 'Health, Armor, and Weapons');
      vitalsHud.innerHTML =
        '<div class="vitals-bars">' +
          '<div class="vital-row">' +
            '<span class="vital-label">HP</span>' +
            '<div class="vital-track"><div class="vital-fill vital-hp" id="hud-hp-fill" style="width:100%"></div></div>' +
            '<span class="vital-num" id="hud-hp-num">100</span>' +
          '</div>' +
          '<div class="vital-row">' +
            '<span class="vital-label">AP</span>' +
            '<div class="vital-track"><div class="vital-fill vital-armor" id="hud-armor-fill" style="width:' + Math.round(profile.armor) + '%"></div></div>' +
            '<span class="vital-num" id="hud-armor-num">' + Math.round(profile.armor) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="weapon-pill">' +
          '<div class="weapon-active-name" id="hud-weapon-name">Tactical Pistol</div>' +
          '<div class="weapon-ammo" id="hud-weapon-ammo">12 / &infin;</div>' +
        '</div>' +
        '<div class="weapon-slots">' +
          '<button type="button" class="w-slot" data-weapon="unarmed" title="Unarmed [1]">[1] Fists</button>' +
          '<button type="button" class="w-slot active" data-weapon="pistol" title="Tactical Pistol [2]">[2] Pistol</button>' +
          '<button type="button" class="w-slot" data-weapon="carbine" title="Assault Carbine [3]">[3] Carbine</button>' +
          '<button type="button" class="w-slot" data-weapon="shotgun" title="Pulse Shotgun [4]">[4] Shotgun</button>' +
        '</div>';
      document.body.appendChild(vitalsHud);
    }

    // Desktop Controls Hint
    let controlsBanner = document.getElementById('controls-banner');
    if (!controlsBanner) {
      controlsBanner = document.createElement('div');
      controlsBanner.id = 'controls-banner';
      controlsBanner.className = 'controls-banner';
      controlsBanner.innerHTML =
        '<span>WASD</span> Move &bull; <span>Click/F</span> Fire &bull; <span>R</span> Reload &bull; <span>1-4</span> Weapons &bull; <span>E</span> Enter/Scan &bull; <span>V</span> Cruiser';
      document.body.appendChild(controlsBanner);
    }

    // Non-blocking Functional Building Service Drawer/Modal
    let bldgModal = document.getElementById('building-modal');
    if (!bldgModal) {
      bldgModal = document.createElement('section');
      bldgModal.id = 'building-modal';
      bldgModal.setAttribute('role', 'dialog');
      bldgModal.setAttribute('aria-label', 'Building Service Terminal');
      bldgModal.innerHTML =
        '<div class="bldg-drawer">' +
          '<div class="bldg-header">' +
            '<div>' +
              '<div class="bldg-title" id="bldg-modal-title">Service Terminal</div>' +
              '<div class="bldg-sub" id="bldg-modal-sub">Authorized Access</div>' +
            '</div>' +
            '<div class="bldg-header-right">' +
              '<span class="bldg-cash" id="bldg-modal-cash">$' + profile.cash + '</span>' +
              '<button type="button" class="modal-close" id="btn-close-bldg" aria-label="Close Terminal">&times;</button>' +
            '</div>' +
          '</div>' +
          '<div class="bldg-body" id="bldg-modal-body"></div>' +
        '</div>';
      document.body.appendChild(bldgModal);
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
          '<button type="button" class="touch-btn touch-btn-fire" id="touch-btn-fire">Fire</button>' +
          '<button type="button" class="touch-btn" id="touch-btn-weapon">Wpn</button>' +
          '<button type="button" class="touch-btn" id="touch-btn-scan">Interact</button>' +
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
    bindClick('btn-toggle-audio', callbacks.toggleAudio);
    bindClick('btn-open-contracts', function () { callbacks.openBuildingByType('contract'); });
    bindClick('btn-open-atlas', function () { callbacks.setModal('atlas', true); });
    bindClick('btn-close-atlas', function () { callbacks.setModal('atlas', false); });
    bindClick('btn-open-codex', function () { callbacks.setModal('codex', true); });
    bindClick('btn-close-codex', function () { callbacks.setModal('codex', false); });
    bindClick('btn-close-bldg', callbacks.closeBuildingModal);
    bindClick('touch-btn-scan', callbacks.interactNearest);
    bindClick('interact-prompt', callbacks.interactNearest);
    bindClick('touch-btn-weapon', callbacks.cycleWeapon);

    const slotBtns = document.querySelectorAll('.w-slot[data-weapon]');
    for (let i = 0; i < slotBtns.length; i += 1) {
      slotBtns[i].addEventListener('click', function () {
        callbacks.selectWeapon(this.getAttribute('data-weapon'));
      });
    }

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

  // ============================================================================
  // TACTICAL RADAR (Landmarks + Functional Building Squares + Hostile Blips)
  // ============================================================================
  function drawRadar(ctx, width, height, px, pz, yaw, landmarks, discovered, functionalBuildings, enemies, accent) {
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

    // Landmarks (circles)
    for (let i = 0; i < landmarks.length; i += 1) {
      const lm = landmarks[i];
      const dx = (lm.coords[0] - px) * scale;
      const dz = (lm.coords[2] - pz) * scale;
      const rx = Math.max(8, Math.min(width - 8, cx + dx));
      const ry = Math.max(8, Math.min(height - 8, cy + dz));
      ctx.fillStyle = discovered[lm.id] ? '#10b981' : accent;
      ctx.beginPath();
      ctx.arc(rx, ry, 4.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Functional Buildings (color-coded squares)
    if (functionalBuildings && functionalBuildings.length) {
      for (let i = 0; i < functionalBuildings.length; i += 1) {
        const fb = functionalBuildings[i];
        const dx = (fb.x - px) * scale;
        const dz = (fb.z - pz) * scale;
        const rx = Math.max(8, Math.min(width - 8, cx + dx));
        const ry = Math.max(8, Math.min(height - 8, cy + dz));
        ctx.fillStyle = fb.color || BUILDING_COLORS[fb.type] || '#f59e0b';
        ctx.fillRect(rx - 3.5, ry - 3.5, 7, 7);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx - 3.5, ry - 3.5, 7, 7);
      }
    }

    // Active Hostiles / Contract Targets (red/amber diamonds)
    if (enemies && enemies.length) {
      for (let i = 0; i < enemies.length; i += 1) {
        const en = enemies[i];
        if (!en.active) continue;
        const dx = (en.x - px) * scale;
        const dz = (en.z - pz) * scale;
        const rx = Math.max(7, Math.min(width - 7, cx + dx));
        const ry = Math.max(7, Math.min(height - 7, cy + dz));
        ctx.fillStyle = en.isContractTarget ? '#f97316' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(rx, ry - 4.2);
        ctx.lineTo(rx + 4.2, ry);
        ctx.lineTo(rx, ry + 4.2);
        ctx.lineTo(rx - 4.2, ry);
        ctx.closePath();
        ctx.fill();
      }
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

  // ============================================================================
  // MAIN BOOT
  // ============================================================================
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
    let pools = null;

    let qualityKey = 'balanced';
    let lightingIdx = (province.id === 'northwest-territories' || province.id === 'nunavut') ? 2 : 0;
    let inCruiser = false;
    let modalOpen = false;
    let rafId = 0;
    let disposed = false;

    const discovered = loadDiscovered(province.id);
    const profile = loadProfile();
    const sfx = createSoundEngine(function () { return profile.audioEnabled; });

    const player = {
      x: 0,
      y: 0,
      z: 18,
      vy: 0,
      yaw: 0,
      speed: 0,
      boost: false,
      hp: 100,
      maxHp: 100,
      armor: profile.armor,
      maxArmor: 100,
      weapon: 'pistol',
      recoil: 0,
      fireTimer: 0,
      reloadTimer: 0,
      isReloading: false,
      wantedHeat: 0,
      wantedStars: 0,
      aimTimer: 0,
      fireHeld: false
    };

    const activeContract = {
      template: null,
      kills: 0,
      target: 0,
      completed: false
    };

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

      const tagEl = document.getElementById('contract-status-tag');
      const titleEl = document.getElementById('contract-title-text');
      const progEl = document.getElementById('contract-progress-text');
      if (tagEl && titleEl && progEl) {
        if (activeContract.template) {
          tagEl.textContent = activeContract.kills + '/' + activeContract.target;
          tagEl.className = 'is-active';
          titleEl.textContent = activeContract.template.title;
          progEl.textContent = 'Reward: $' + activeContract.template.cashReward + ' + ' + activeContract.template.respectReward + ' REP';
        } else {
          tagEl.textContent = 'IDLE';
          tagEl.className = '';
          titleEl.textContent = 'No Active Contract';
          progEl.textContent = 'Visit Syndicate Ops or click Contracts';
        }
      }
    }

    function updateRockstarHud() {
      const cashEl = document.getElementById('rs-cash-val');
      if (cashEl) cashEl.textContent = '$' + profile.cash;
      const repEl = document.getElementById('rs-respect-val');
      if (repEl) repEl.textContent = profile.respect + ' REP';
      const bldgCashEl = document.getElementById('bldg-modal-cash');
      if (bldgCashEl) bldgCashEl.textContent = '$' + profile.cash;

      const starsWrap = document.getElementById('rs-wanted-stars');
      if (starsWrap) {
        const stars = starsWrap.children;
        for (let i = 0; i < stars.length; i += 1) {
          stars[i].classList.toggle('lit', i < player.wantedStars);
        }
        starsWrap.classList.toggle('hot', player.wantedStars > 0);
      }

      const hpFill = document.getElementById('hud-hp-fill');
      const hpNum = document.getElementById('hud-hp-num');
      if (hpFill) hpFill.style.width = Math.max(0, Math.min(100, Math.round(player.hp))) + '%';
      if (hpNum) hpNum.textContent = String(Math.max(0, Math.round(player.hp)));

      const apFill = document.getElementById('hud-armor-fill');
      const apNum = document.getElementById('hud-armor-num');
      if (apFill) apFill.style.width = Math.max(0, Math.min(100, Math.round(player.armor))) + '%';
      if (apNum) apNum.textContent = String(Math.max(0, Math.round(player.armor)));

      const w = WEAPONS[player.weapon] || WEAPONS.unarmed;
      const wNameEl = document.getElementById('hud-weapon-name');
      const wAmmoEl = document.getElementById('hud-weapon-ammo');
      if (wNameEl) wNameEl.textContent = player.isReloading ? w.name + ' (Reloading...)' : w.name;
      if (wAmmoEl) {
        if (w.id === 'unarmed') {
          wAmmoEl.textContent = 'MELEE';
        } else if (w.id === 'pistol') {
          wAmmoEl.textContent = (profile.mag.pistol || 0) + ' / \u221E';
        } else {
          wAmmoEl.textContent = (profile.mag[w.id] || 0) + ' / ' + (profile.reserve[w.id] || 0);
        }
      }

      const slotBtns = document.querySelectorAll('.w-slot[data-weapon]');
      for (let i = 0; i < slotBtns.length; i += 1) {
        const wid = slotBtns[i].getAttribute('data-weapon');
        slotBtns[i].classList.toggle('active', wid === player.weapon);
        slotBtns[i].classList.toggle('locked', !profile.unlockedWeapons[wid]);
      }
    }

    let operativeMesh = null;
    let operativeRig = null;
    let cruiserMesh = null;
    let cruiserRig = null;

    function selectWeapon(weaponId) {
      if (!WEAPONS[weaponId]) return;
      if (!profile.unlockedWeapons[weaponId]) {
        showNotify(WEAPONS[weaponId].name + ' Locked — Buy at Ammu-North ($' + WEAPONS[weaponId].cost + ')');
        return;
      }
      if (player.weapon === weaponId) return;
      player.weapon = weaponId;
      player.isReloading = false;
      player.reloadTimer = 0;
      const rigLib = global.RealisticCharacterRig;
      if (operativeRig && rigLib && typeof rigLib.setWeapon === 'function') {
        rigLib.setWeapon(operativeRig, weaponId);
      }
      updateRockstarHud();
    }

    function cycleWeapon() {
      const idx = WEAPON_ORDER.indexOf(player.weapon);
      for (let step = 1; step <= WEAPON_ORDER.length; step += 1) {
        const nextId = WEAPON_ORDER[(idx + step) % WEAPON_ORDER.length];
        if (profile.unlockedWeapons[nextId]) {
          selectWeapon(nextId);
          return;
        }
      }
    }

    function startReload() {
      const w = WEAPONS[player.weapon];
      if (!w || w.id === 'unarmed' || player.isReloading) return;
      const currentMag = profile.mag[w.id] || 0;
      if (currentMag >= w.magSize) return;
      const res = profile.reserve[w.id];
      if (res !== Infinity && res <= 0) {
        showNotify('Out of ' + w.shortName + ' Ammo — Refill at Ammu-North');
        return;
      }
      player.isReloading = true;
      player.reloadTimer = w.reloadTime;
      sfx.playReload();
      updateRockstarHud();
    }

    function finishReload() {
      const w = WEAPONS[player.weapon];
      player.isReloading = false;
      player.reloadTimer = 0;
      if (!w || w.id === 'unarmed') return;
      const currentMag = profile.mag[w.id] || 0;
      const needed = w.magSize - currentMag;
      if (needed <= 0) return;
      if (w.id === 'pistol') {
        profile.mag.pistol = w.magSize;
      } else {
        const avail = profile.reserve[w.id] || 0;
        const take = Math.min(needed, avail);
        profile.mag[w.id] = currentMag + take;
        profile.reserve[w.id] = avail - take;
      }
      saveProfile(profile);
      updateRockstarHud();
    }

    // ============================================================================
    // OBJECT POOL SPAWNERS (ZERO ALLOCATIONS)
    // ============================================================================
    function spawnSparkBurst(x, y, z, count, mat) {
      if (!pools) return;
      let spawned = 0;
      for (let i = 0; i < pools.sparks.length && spawned < count; i += 1) {
        const s = pools.sparks[i];
        if (!s.active) {
          s.active = true;
          s.x = x;
          s.y = y;
          s.z = z;
          s.vx = (Math.random() - 0.5) * 9;
          s.vy = Math.random() * 5.5 + 1.2;
          s.vz = (Math.random() - 0.5) * 9;
          s.maxLife = 0.16 + Math.random() * 0.14;
          s.life = s.maxLife;
          s.mesh.material = mat;
          s.mesh.position.set(x, y, z);
          s.mesh.scale.set(1, 1, 1);
          s.mesh.visible = true;
          spawned += 1;
        }
      }
    }

    function spawnBullet(x, y, z, dirX, dirZ, speed, damage, fromEnemy) {
      if (!pools) return;
      for (let i = 0; i < pools.bullets.length; i += 1) {
        const b = pools.bullets[i];
        if (!b.active) {
          b.active = true;
          b.fromEnemy = fromEnemy;
          b.x = x;
          b.y = y;
          b.z = z;
          b.vx = dirX * speed;
          b.vy = 0;
          b.vz = dirZ * speed;
          b.damage = damage;
          b.life = fromEnemy ? 1.6 : 1.15;
          b.mesh.material = fromEnemy ? pools.mats.enemyBulletMat : pools.mats.playerBulletMat;
          b.mesh.position.set(x, y, z);
          b.mesh.rotation.y = Math.atan2(dirX, dirZ);
          b.mesh.visible = true;
          return;
        }
      }
    }

    function spawnEnemy(type, isContractTarget) {
      if (!pools) return null;
      for (let i = 0; i < pools.enemies.length; i += 1) {
        const en = pools.enemies[i];
        if (!en.active) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 34 + Math.random() * 24;
          en.x = Math.max(-200, Math.min(200, player.x + Math.cos(angle) * dist));
          en.z = Math.max(-165, Math.min(200, player.z + Math.sin(angle) * dist));
          en.y = 1.9;
          en.active = true;
          en.type = type || 'drone';
          en.isContractTarget = !!isContractTarget;
          en.fireCooldown = 1.0 + Math.random() * 1.2;

          if (en.type === 'armored') {
            en.maxHp = 135;
            en.hp = 135;
            en.speed = 8.0;
            en.hull.material = pools.mats.armoredBodyMat;
            en.eye.material = pools.mats.armoredEyeMat;
            en.root.scale.set(1.25, 1.25, 1.25);
          } else if (en.type === 'enforcer') {
            en.maxHp = 90;
            en.hp = 90;
            en.speed = 11.2;
            en.hull.material = pools.mats.enforcerBodyMat;
            en.eye.material = pools.mats.droneEyeMat;
            en.root.scale.set(1.08, 1.08, 1.08);
          } else {
            en.maxHp = 60;
            en.hp = 60;
            en.speed = 9.8;
            en.hull.material = pools.mats.droneBodyMat;
            en.eye.material = pools.mats.droneEyeMat;
            en.root.scale.set(1, 1, 1);
          }
          en.hpFill.scale.x = 1;
          en.root.position.set(en.x, en.y, en.z);
          en.root.visible = true;
          return en;
        }
      }
      return null;
    }

    function countActiveEnemies(contractOnly) {
      if (!pools) return 0;
      let c = 0;
      for (let i = 0; i < pools.enemies.length; i += 1) {
        if (pools.enemies[i].active && (!contractOnly || pools.enemies[i].isContractTarget)) {
          c += 1;
        }
      }
      return c;
    }

    function addWantedHeat(amount) {
      const prevStars = player.wantedStars;
      player.wantedHeat = Math.min(100, player.wantedHeat + amount);
      player.wantedStars = player.wantedHeat >= 85 ? 5
        : player.wantedHeat >= 65 ? 4
        : player.wantedHeat >= 45 ? 3
        : player.wantedHeat >= 25 ? 2
        : player.wantedHeat >= 8 ? 1 : 0;
      if (player.wantedStars > prevStars) {
        sfx.playAlert();
        showNotify('WANTED LEVEL ' + player.wantedStars + ' STAR' + (player.wantedStars > 1 ? 'S' : ''));
      }
    }

    function clearWantedHeat() {
      player.wantedHeat = 0;
      player.wantedStars = 0;
      if (pools) {
        for (let i = 0; i < pools.enemies.length; i += 1) {
          const en = pools.enemies[i];
          if (en.active && !en.isContractTarget) {
            en.active = false;
            en.root.visible = false;
          }
        }
      }
      updateRockstarHud();
    }

    function startContract(templateId) {
      let tpl = null;
      for (let i = 0; i < CONTRACT_TEMPLATES.length; i += 1) {
        if (CONTRACT_TEMPLATES[i].id === templateId) {
          tpl = CONTRACT_TEMPLATES[i];
          break;
        }
      }
      if (!tpl) return;

      // Clear old contract enemies
      if (pools) {
        for (let i = 0; i < pools.enemies.length; i += 1) {
          if (pools.enemies[i].active && pools.enemies[i].isContractTarget) {
            pools.enemies[i].active = false;
            pools.enemies[i].root.visible = false;
          }
        }
      }

      activeContract.template = tpl;
      activeContract.kills = 0;
      activeContract.target = tpl.target;
      activeContract.completed = false;

      const initialWave = Math.min(tpl.target, 3);
      for (let i = 0; i < initialWave; i += 1) {
        spawnEnemy(tpl.enemyType, true);
      }

      sfx.playAlert();
      updateMissionDom();
      showNotify('CONTRACT STARTED: ' + tpl.title + ' (0/' + tpl.target + ')');
    }

    const muzzlePosVec = THREE ? new THREE.Vector3() : null;

    function fireWeapon() {
      if (inCruiser) return;
      const w = WEAPONS[player.weapon];
      if (!w || player.fireTimer > 0 || player.isReloading) return;

      if (w.id === 'unarmed') {
        player.fireTimer = w.fireRate;
        player.recoil = 1.0;
        player.aimTimer = 0.4;
        sfx.playShot('unarmed');
        // Melee check
        if (pools) {
          const fwdX = -Math.sin(player.yaw);
          const fwdZ = -Math.cos(player.yaw);
          for (let i = 0; i < pools.enemies.length; i += 1) {
            const en = pools.enemies[i];
            if (!en.active) continue;
            const dx = en.x - player.x;
            const dz = en.z - player.z;
            if (dx * dx + dz * dz < w.range * w.range) {
              damageEnemy(en, w.damage);
              break;
            }
          }
          spawnSparkBurst(player.x + fwdX * 1.2, player.y + 1.35, player.z + fwdZ * 1.2, 2, pools.mats.sparkCyanMat);
        }
        return;
      }

      const currentMag = profile.mag[w.id] || 0;
      if (currentMag <= 0) {
        startReload();
        return;
      }

      profile.mag[w.id] = currentMag - 1;
      player.fireTimer = w.fireRate;
      player.recoil = 1.0;
      player.aimTimer = 0.65;
      sfx.playShot(w.id);

      let mx = player.x - Math.sin(player.yaw) * 0.75;
      let my = player.y + 1.38;
      let mz = player.z - Math.cos(player.yaw) * 0.75;
      const rigLib = global.RealisticCharacterRig;
      if (operativeRig && rigLib && typeof rigLib.getMuzzleWorldPosition === 'function' && muzzlePosVec) {
        rigLib.getMuzzleWorldPosition(operativeRig, muzzlePosVec);
        mx = muzzlePosVec.x;
        my = Math.max(0.8, muzzlePosVec.y);
        mz = muzzlePosVec.z;
      }

      if (pools) {
        spawnSparkBurst(mx, my, mz, 3, pools.mats.sparkGoldMat);
      }

      const baseDirX = -Math.sin(player.yaw);
      const baseDirZ = -Math.cos(player.yaw);
      for (let p = 0; p < w.pellets; p += 1) {
        const angOffset = (Math.random() - 0.5) * w.spread;
        const cosA = Math.cos(angOffset);
        const sinA = Math.sin(angOffset);
        const dx = baseDirX * cosA - baseDirZ * sinA;
        const dz = baseDirX * sinA + baseDirZ * cosA;
        spawnBullet(mx, my, mz, dx, dz, w.bulletSpeed, w.damage, false);
      }

      addWantedHeat(w.id === 'shotgun' ? 6 : 3);
      if (profile.mag[w.id] === 0) {
        startReload();
      }
      updateRockstarHud();
    }

    function damageEnemy(en, dmg) {
      if (!en.active) return;
      en.hp -= dmg;
      sfx.playHit();
      if (pools) {
        spawnSparkBurst(en.x, en.y, en.z, 4, pools.mats.sparkCyanMat);
      }
      if (en.hp <= 0) {
        en.active = false;
        en.root.visible = false;
        sfx.playExplosion();
        if (pools) {
          spawnSparkBurst(en.x, en.y, en.z, 10, pools.mats.sparkGoldMat);
        }

        const bounty = en.type === 'armored' ? 45 : (en.type === 'enforcer' ? 30 : 20);
        profile.cash += bounty;
        profile.respect += 10;
        addWantedHeat(10);

        if (en.isContractTarget && activeContract.template && !activeContract.completed) {
          activeContract.kills += 1;
          if (activeContract.kills >= activeContract.target) {
            activeContract.completed = true;
            profile.cash += activeContract.template.cashReward;
            profile.respect += activeContract.template.respectReward;
            profile.contractsCompleted += 1;
            sfx.playCash();
            showNotify('CONTRACT COMPLETE: +$' + activeContract.template.cashReward + ' & +' + activeContract.template.respectReward + ' REP!');
            activeContract.template = null;
          } else {
            const remainingToSpawn = activeContract.target - activeContract.kills - countActiveEnemies(true);
            if (remainingToSpawn > 0) {
              spawnEnemy(activeContract.template.enemyType, true);
            }
          }
          updateMissionDom();
        }

        saveProfile(profile);
        updateRockstarHud();
      } else {
        en.hpFill.scale.x = Math.max(0.05, en.hp / en.maxHp);
      }
    }

    function damagePlayer(dmg) {
      if (player.armor > 0) {
        const absorbed = Math.min(player.armor, dmg * 0.75);
        player.armor -= absorbed;
        profile.armor = player.armor;
        dmg -= absorbed;
      }
      player.hp -= dmg;
      if (pools) {
        spawnSparkBurst(player.x, player.y + 1.2, player.z, 4, pools.mats.sparkRedMat);
      }
      if (player.hp <= 0) {
        const fee = Math.min(profile.cash, 25);
        profile.cash -= fee;
        player.hp = 100;
        player.armor = Math.max(player.armor, 25);
        profile.armor = player.armor;
        clearWantedHeat();
        player.x = 0;
        player.z = 18;
        player.speed = 0;
        saveProfile(profile);
        showNotify('MEDEVAC EXTRACTED — Health Restored' + (fee > 0 ? ' (-$' + fee + ')' : ''));
      }
      updateRockstarHud();
    }

    // ============================================================================
    // FUNCTIONAL BUILDING MODAL / SERVICE DRAWER
    // ============================================================================
    let activeBuilding = null;

    function renderBuildingModal(fb) {
      const modal = document.getElementById('building-modal');
      const titleEl = document.getElementById('bldg-modal-title');
      const subEl = document.getElementById('bldg-modal-sub');
      const bodyEl = document.getElementById('bldg-modal-body');
      const cashEl = document.getElementById('bldg-modal-cash');
      if (!modal || !titleEl || !subEl || !bodyEl) return;

      const accent = fb.color || BUILDING_COLORS[fb.type] || '#38bdf8';
      modal.style.setProperty('--bldg-accent', accent);
      titleEl.textContent = fb.name;
      subEl.textContent = fb.subtitle || 'Service Terminal';
      if (cashEl) cashEl.textContent = '$' + profile.cash;

      let html = '';
      if (fb.type === 'gunshop') {
        html +=
          '<div class="bldg-card">' +
            '<div><strong>Tactical Pistol</strong><div class="bldg-meta">Standard Issue &bull; Infinite Reserve</div></div>' +
            '<button type="button" class="bldg-action" data-act="equip-pistol">' + (player.weapon === 'pistol' ? 'Equipped' : 'Equip') + '</button>' +
          '</div>' +
          '<div class="bldg-card">' +
            '<div><strong>Assault Carbine</strong><div class="bldg-meta">Rapid Auto &bull; 30-rd Mag</div></div>' +
            '<button type="button" class="bldg-action" data-act="buy-carbine">' + (profile.unlockedWeapons.carbine ? (player.weapon === 'carbine' ? 'Equipped' : 'Equip') : 'Buy $150') + '</button>' +
          '</div>' +
          '<div class="bldg-card">' +
            '<div><strong>Pulse Shotgun</strong><div class="bldg-meta">5-Pellet Spread &bull; High Impact</div></div>' +
            '<button type="button" class="bldg-action" data-act="buy-shotgun">' + (profile.unlockedWeapons.shotgun ? (player.weapon === 'shotgun' ? 'Equipped' : 'Equip') : 'Buy $250') + '</button>' +
          '</div>' +
          '<div class="bldg-card">' +
            '<div><strong>Ammo Crate Refill</strong><div class="bldg-meta">Refill Carbine &amp; Shotgun Reserves</div></div>' +
            '<button type="button" class="bldg-action" data-act="buy-ammo">Refill $40</button>' +
          '</div>' +
          '<div class="bldg-card">' +
            '<div><strong>Tactical Kevlar Vest</strong><div class="bldg-meta">Restore Armor to 100 AP</div></div>' +
            '<button type="button" class="bldg-action" data-act="buy-armor">Armor $60</button>' +
          '</div>';
      } else if (fb.type === 'safehouse') {
        const scrubCost = player.wantedStars > 0 ? 50 : 0;
        html +=
          '<div class="bldg-card">' +
            '<div><strong>Med-Bay &amp; Armor Station</strong><div class="bldg-meta">Restore 100 HP &amp; 100 AP</div></div>' +
            '<button type="button" class="bldg-action" data-act="heal-full">Restore (Free)</button>' +
          '</div>' +
          '<div class="bldg-card">' +
            '<div><strong>Scrub Wanted Transponder</strong><div class="bldg-meta">Clear all Wanted Stars (' + player.wantedStars + ' Active)</div></div>' +
            '<button type="button" class="bldg-action" data-act="clear-heat">' + (scrubCost > 0 ? 'Clear $50' : 'Clean') + '</button>' +
          '</div>';
      } else if (fb.type === 'garage') {
        const engCost = profile.cruiserTier === 1 ? 120 : (profile.cruiserTier === 2 ? 220 : 0);
        const bstCost = profile.boostTier === 1 ? 100 : (profile.boostTier === 2 ? 180 : 0);
        html +=
          '<div class="bldg-card">' +
            '<div><strong>Cruiser Engine Tuning (Tier ' + profile.cruiserTier + '/3)</strong><div class="bldg-meta">Top Speed +' + (profile.cruiserTier * 15) + '%</div></div>' +
            '<button type="button" class="bldg-action" data-act="upg-engine">' + (engCost > 0 ? 'Upgrade $' + engCost : 'Maxed') + '</button>' +
          '</div>' +
          '<div class="bldg-card">' +
            '<div><strong>Nitrous Boost System (Tier ' + profile.boostTier + '/3)</strong><div class="bldg-meta">Boost Power &amp; Acceleration</div></div>' +
            '<button type="button" class="bldg-action" data-act="upg-boost">' + (bstCost > 0 ? 'Upgrade $' + bstCost : 'Maxed') + '</button>' +
          '</div>' +
          '<div class="bldg-card">' +
            '<div><strong>Express Tune &amp; Wax</strong><div class="bldg-meta">Instant Cruiser Prep &amp; Armor +25</div></div>' +
            '<button type="button" class="bldg-action" data-act="repair-cruiser">Service $35</button>' +
          '</div>';
      } else if (fb.type === 'contract') {
        for (let i = 0; i < CONTRACT_TEMPLATES.length; i += 1) {
          const tpl = CONTRACT_TEMPLATES[i];
          const isCurrent = activeContract.template && activeContract.template.id === tpl.id;
          html +=
            '<div class="bldg-card">' +
              '<div><strong>' + escapeHtml(tpl.title) + '</strong><div class="bldg-meta">' + escapeHtml(tpl.subtitle) + ' &bull; $' + tpl.cashReward + ' + ' + tpl.respectReward + ' REP</div></div>' +
              '<button type="button" class="bldg-action" data-act="start-contract" data-contract="' + escapeHtml(tpl.id) + '">' + (isCurrent ? 'Active' : 'Accept') + '</button>' +
            '</div>';
        }
      }

      bodyEl.innerHTML = html;
      const btns = bodyEl.querySelectorAll('.bldg-action');
      for (let i = 0; i < btns.length; i += 1) {
        btns[i].addEventListener('click', function () {
          handleBuildingAction(this.getAttribute('data-act'), this.getAttribute('data-contract'));
        });
      }
      modal.classList.add('visible');
    }

    function handleBuildingAction(act, extra) {
      if (act === 'equip-pistol') {
        selectWeapon('pistol');
      } else if (act === 'buy-carbine') {
        if (profile.unlockedWeapons.carbine) {
          selectWeapon('carbine');
        } else if (profile.cash >= 150) {
          profile.cash -= 150;
          profile.unlockedWeapons.carbine = true;
          profile.mag.carbine = WEAPONS.carbine.magSize;
          profile.reserve.carbine = 90;
          sfx.playCash();
          selectWeapon('carbine');
          showNotify('Purchased Assault Carbine!');
        } else {
          showNotify('Need $150 for Assault Carbine');
        }
      } else if (act === 'buy-shotgun') {
        if (profile.unlockedWeapons.shotgun) {
          selectWeapon('shotgun');
        } else if (profile.cash >= 250) {
          profile.cash -= 250;
          profile.unlockedWeapons.shotgun = true;
          profile.mag.shotgun = WEAPONS.shotgun.magSize;
          profile.reserve.shotgun = 24;
          sfx.playCash();
          selectWeapon('shotgun');
          showNotify('Purchased Pulse Shotgun!');
        } else {
          showNotify('Need $250 for Pulse Shotgun');
        }
      } else if (act === 'buy-ammo') {
        if (profile.cash >= 40) {
          profile.cash -= 40;
          profile.reserve.carbine = Math.min(240, (profile.reserve.carbine || 0) + 90);
          profile.reserve.shotgun = Math.min(60, (profile.reserve.shotgun || 0) + 24);
          sfx.playReload();
          showNotify('Ammo Reserves Refilled');
        } else {
          showNotify('Need $40 for Ammo Refill');
        }
      } else if (act === 'buy-armor') {
        if (profile.cash >= 60) {
          profile.cash -= 60;
          player.armor = 100;
          profile.armor = 100;
          sfx.playCash();
          showNotify('Tactical Armor Restored to 100 AP');
        } else {
          showNotify('Need $60 for Tactical Armor');
        }
      } else if (act === 'heal-full') {
        player.hp = 100;
        player.armor = 100;
        profile.armor = 100;
        sfx.playCash();
        showNotify('Health & Armor Restored');
      } else if (act === 'clear-heat') {
        if (player.wantedStars === 0) {
          showNotify('Transponder Already Clean');
        } else if (profile.cash >= 50) {
          profile.cash -= 50;
          clearWantedHeat();
          sfx.playCash();
          showNotify('Wanted Stars Cleared!');
        } else {
          showNotify('Need $50 to Clear Wanted Stars');
        }
      } else if (act === 'upg-engine') {
        const cost = profile.cruiserTier === 1 ? 120 : (profile.cruiserTier === 2 ? 220 : 0);
        if (cost > 0 && profile.cash >= cost) {
          profile.cash -= cost;
          profile.cruiserTier += 1;
          sfx.playCash();
          showNotify('Cruiser Engine Upgraded to Tier ' + profile.cruiserTier + '!');
        } else if (cost > 0) {
          showNotify('Need $' + cost + ' for Engine Upgrade');
        }
      } else if (act === 'upg-boost') {
        const cost = profile.boostTier === 1 ? 100 : (profile.boostTier === 2 ? 180 : 0);
        if (cost > 0 && profile.cash >= cost) {
          profile.cash -= cost;
          profile.boostTier += 1;
          sfx.playCash();
          showNotify('Nitrous Boost Upgraded to Tier ' + profile.boostTier + '!');
        } else if (cost > 0) {
          showNotify('Need $' + cost + ' for Boost Upgrade');
        }
      } else if (act === 'repair-cruiser') {
        if (profile.cash >= 35) {
          profile.cash -= 35;
          player.armor = Math.min(100, player.armor + 25);
          profile.armor = player.armor;
          sfx.playCash();
          showNotify('Cruiser Serviced (+25 Armor)');
        } else {
          showNotify('Need $35 for Express Service');
        }
      } else if (act === 'start-contract') {
        startContract(extra);
        closeBuildingModal();
        return;
      }

      saveProfile(profile);
      updateRockstarHud();
      if (activeBuilding) renderBuildingModal(activeBuilding);
    }

    function openBuildingModal(fb) {
      activeBuilding = fb;
      renderBuildingModal(fb);
    }

    function openBuildingByType(type) {
      if (world && world.functionalBuildings) {
        for (let i = 0; i < world.functionalBuildings.length; i += 1) {
          if (world.functionalBuildings[i].type === type) {
            openBuildingModal(world.functionalBuildings[i]);
            return;
          }
        }
      }
      openBuildingModal({
        id: 'hub-' + type,
        type: type,
        name: type === 'contract' ? 'Syndicate Ops Terminal' : 'Service Terminal',
        subtitle: 'Province Contracts & Bounties',
        color: BUILDING_COLORS[type] || '#a855f7'
      });
    }

    function closeBuildingModal() {
      activeBuilding = null;
      const modal = document.getElementById('building-modal');
      if (modal) modal.classList.remove('visible');
    }

    // ============================================================================
    // INTERACTION (FUNCTIONAL BUILDINGS + LANDMARKS)
    // ============================================================================
    let nearestLandmark = null;
    let nearestBuilding = null;

    function interactNearest() {
      if (nearestBuilding) {
        openBuildingModal(nearestBuilding);
        return;
      }
      if (nearestLandmark) {
        if (!discovered[nearestLandmark.id]) {
          discovered[nearestLandmark.id] = true;
          saveDiscovered(province.id, discovered);
          profile.cash += 50;
          profile.respect += 25;
          saveProfile(profile);
          sfx.playCash();
          updateMissionDom();
          updateRockstarHud();
          showNotify('Landmark Discovered: ' + nearestLandmark.name + ' (+$50, +25 REP)');
        } else {
          showNotify(nearestLandmark.name + ' (' + nearestLandmark.elevationM + ' m) — Already Logged');
        }
      }
    }

    function toggleCruiser() {
      inCruiser = !inCruiser;
      player.speed = 0;
      if (operativeMesh) operativeMesh.visible = operativeRig ? true : !inCruiser;
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
        applyLightingFeel(THREE, world, province, mode, renderer);
      }
      const btn = document.getElementById('btn-toggle-sky');
      if (btn) btn.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    }

    function toggleAudio() {
      profile.audioEnabled = !profile.audioEnabled;
      saveProfile(profile);
      const btn = document.getElementById('btn-toggle-audio');
      if (btn) btn.textContent = profile.audioEnabled ? 'Audio: ON' : 'Audio: OFF';
      if (profile.audioEnabled) sfx.unlock();
      showNotify(profile.audioEnabled ? 'Audio Enabled' : 'Audio Muted');
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

    const domRefs = buildHudDom(province, provinces, profile, {
      toggleCruiser: toggleCruiser,
      cycleQuality: cycleQuality,
      cycleLighting: cycleLighting,
      toggleAudio: toggleAudio,
      setModal: setModal,
      interactNearest: interactNearest,
      openBuildingByType: openBuildingByType,
      closeBuildingModal: closeBuildingModal,
      selectWeapon: selectWeapon,
      cycleWeapon: cycleWeapon
    });
    const radarCtx = domRefs.radarCanvas ? domRefs.radarCanvas.getContext('2d') : null;

    // Initialize WebGL safely
    try {
      if (!THREE) throw new Error('Three.js not loaded');
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, QUALITY_PRESETS[qualityKey].dprCap));
      renderer.setSize(container.clientWidth || global.innerWidth, container.clientHeight || global.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = QUALITY_PRESETS[qualityKey].shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(62, (container.clientWidth || global.innerWidth) / (container.clientHeight || global.innerHeight), 0.5, 650);

      world = global.CanadaLandmarks.buildProvinceWorld(scene, province, qualityKey);
      applyLightingFeel(THREE, world, province, LIGHTING_MODES[lightingIdx], renderer);

      const accentHex = toHexNumber(province.climate && province.climate.accent, 0x00f2ff);
      const rigLib = global.RealisticCharacterRig;
      if (rigLib && typeof rigLib.createHumanoid === 'function') {
        operativeRig = rigLib.createHumanoid({
          variant: 'canadian-explorer',
          accentColor: accentHex
        });
        operativeMesh = operativeRig.root;
        if (typeof rigLib.setWeapon === 'function') {
          rigLib.setWeapon(operativeRig, player.weapon);
        }
      } else {
        operativeMesh = createOperativeMesh(THREE, province.climate.accent);
      }
      if (rigLib && typeof rigLib.createCruiser === 'function') {
        cruiserRig = rigLib.createCruiser({
          accentColor: accentHex
        });
        cruiserMesh = cruiserRig.root;
        cruiserMesh.visible = false;
      } else {
        cruiserMesh = createCruiserMesh(THREE, province.climate.accent);
      }
      scene.add(operativeMesh);
      scene.add(cruiserMesh);

      pools = createCombatPools(THREE, scene);
    } catch (err) {
      container.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#e2e8f0;font-family:sans-serif;padding:24px;text-align:center;">' +
          '<div><h2>3D WebGL Unavailable</h2><p>' + escapeHtml(err && err.message ? err.message : 'Unable to initialize WebGL context.') + '</p></div>' +
        '</div>';
    }

    updateMissionDom();
    updateRockstarHud();

    const keys = Object.create(null);
    const touchInput = { x: 0, y: 0, boost: false };

    // Input handlers
    function onKeyDown(e) {
      const code = e.code;
      keys[code] = true;
      sfx.unlock();
      if (code === 'KeyV') toggleCruiser();
      if (code === 'KeyE') interactNearest();
      if (code === 'KeyR') startReload();
      if (code === 'KeyF') {
        player.fireHeld = true;
        fireWeapon();
      }
      if (code === 'Digit1') selectWeapon('unarmed');
      if (code === 'Digit2') selectWeapon('pistol');
      if (code === 'Digit3') selectWeapon('carbine');
      if (code === 'Digit4') selectWeapon('shotgun');
      if (code === 'Escape') {
        setModal('atlas', false);
        setModal('codex', false);
        closeBuildingModal();
      }
    }
    function onKeyUp(e) {
      keys[e.code] = false;
      if (e.code === 'KeyF') player.fireHeld = false;
    }

    function onCanvasMouseDown(e) {
      if (e.button === 0) {
        sfx.unlock();
        player.fireHeld = true;
        fireWeapon();
      } else if (e.button === 2) {
        player.aimTimer = 0.8;
      }
    }
    function onMouseUp() {
      player.fireHeld = false;
    }

    if (renderer && renderer.domElement) {
      renderer.domElement.addEventListener('mousedown', onCanvasMouseDown);
    }
    global.addEventListener('mouseup', onMouseUp);

    function syncMobileHudStack() {
      const rootEl = document.documentElement;
      if (!rootEl) return;
      if ((global.innerWidth || 1024) <= 720) {
        const hudEl = document.getElementById('province-hud');
        if (hudEl) {
          const rect = hudEl.getBoundingClientRect();
          if (rect.bottom > 0) {
            rootEl.style.setProperty('--hud-stack-top', Math.ceil(rect.bottom + 8) + 'px');
          }
        }
      } else {
        rootEl.style.removeProperty('--hud-stack-top');
      }
    }
    syncMobileHudStack();
    global.requestAnimationFrame(syncMobileHudStack);

    function onResize() {
      syncMobileHudStack();
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

    // Touch stick & action buttons
    const stickZone = document.getElementById('touch-stick-zone');
    const stickKnob = document.getElementById('touch-stick-knob');
    if (stickZone) {
      let stickTouchId = null;
      stickZone.addEventListener('touchstart', function (e) {
        sfx.unlock();
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

    const fireBtn = document.getElementById('touch-btn-fire');
    if (fireBtn) {
      fireBtn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        sfx.unlock();
        player.fireHeld = true;
        fireWeapon();
      }, { passive: false });
      fireBtn.addEventListener('touchend', function () { player.fireHeld = false; }, { passive: true });
      fireBtn.addEventListener('mousedown', function () {
        sfx.unlock();
        player.fireHeld = true;
        fireWeapon();
      });
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
    let patrolSpawnTimer = 1.5;

    function tick(now) {
      if (disposed) return;
      rafId = global.requestAnimationFrame(tick);

      const rawDt = (now - lastTime) * 0.001;
      lastTime = now;
      if (document.hidden || modalOpen || !renderer || !scene || !camera) return;

      const dt = Math.min(0.05, Math.max(0.001, rawDt));
      elapsed += dt;

      // Weapon timers & auto-fire
      if (player.fireTimer > 0) player.fireTimer = Math.max(0, player.fireTimer - dt);
      if (player.recoil > 0) player.recoil = Math.max(0, player.recoil - dt * 5.2);
      if (player.aimTimer > 0) player.aimTimer = Math.max(0, player.aimTimer - dt);
      if (player.isReloading) {
        player.reloadTimer -= dt;
        if (player.reloadTimer <= 0) {
          finishReload();
        }
      }
      if (player.fireHeld && WEAPONS[player.weapon] && WEAPONS[player.weapon].auto) {
        fireWeapon();
      }

      // Wanted heat decay & drone patrol spawning
      if (player.wantedHeat > 0) {
        player.wantedHeat = Math.max(0, player.wantedHeat - dt * 1.45);
        const newStars = player.wantedHeat >= 85 ? 5
          : player.wantedHeat >= 65 ? 4
          : player.wantedHeat >= 45 ? 3
          : player.wantedHeat >= 25 ? 2
          : player.wantedHeat >= 8 ? 1 : 0;
        if (newStars !== player.wantedStars) {
          player.wantedStars = newStars;
        }
      }

      if (player.wantedStars > 0 && pools) {
        patrolSpawnTimer -= dt;
        if (patrolSpawnTimer <= 0) {
          patrolSpawnTimer = Math.max(2.2, 5.5 - player.wantedStars * 0.7);
          const desiredPatrols = Math.min(5, player.wantedStars + 1);
          if (countActiveEnemies(false) < desiredPatrols) {
            spawnEnemy(player.wantedStars >= 4 ? 'armored' : 'drone', false);
          }
        }
      }

      // Movement
      const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - touchInput.y;
      const turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - touchInput.x;
      const boosting = !!(keys.ShiftLeft || keys.ShiftRight || touchInput.boost);

      if (inCruiser) {
        const tierMult = 1 + (profile.cruiserTier - 1) * 0.16;
        const boostMult = 1 + (profile.boostTier - 1) * 0.14;
        const maxSpd = (boosting ? 42 * boostMult : 28) * tierMult;
        if (Math.abs(forward) > 0.05) {
          player.speed += forward * 28 * tierMult * dt;
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

      const isMoving = Math.abs(player.speed) > 0.2;
      const isGrounded = player.y <= 0.01;
      const rigLib = global.RealisticCharacterRig;

      if (operativeMesh) {
        operativeMesh.position.set(player.x, inCruiser ? -0.05 : player.y, player.z);
        operativeMesh.rotation.y = operativeRig ? (player.yaw + Math.PI) : player.yaw;
      }
      if (operativeRig && rigLib && typeof rigLib.animateHumanoid === 'function') {
        rigLib.animateHumanoid(operativeRig, {
          speed: Math.abs(player.speed),
          isMoving: isMoving,
          isGrounded: isGrounded,
          isFiring: player.recoil > 0.2,
          isSeated: inCruiser,
          weapon: player.weapon,
          aiming: player.aimTimer > 0 || player.fireHeld,
          recoil: player.recoil
        }, dt);
      }
      if (cruiserMesh) {
        cruiserMesh.position.set(player.x, 0, player.z);
        cruiserMesh.rotation.y = cruiserRig ? (player.yaw + Math.PI) : player.yaw;
        if (inCruiser && cruiserRig && cruiserRig.wheels && cruiserRig.wheels.length) {
          const wheelSpin = (player.speed * dt) / 0.38;
          for (let w = 0; w < cruiserRig.wheels.length; w += 1) {
            cruiserRig.wheels[w].rotation.x += wheelSpin;
          }
        }
      }

      // Update Pooled Bullets, Sparks & Enemies (ZERO allocations)
      if (pools) {
        for (let i = 0; i < pools.bullets.length; i += 1) {
          const b = pools.bullets[i];
          if (!b.active) continue;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.z += b.vz * dt;
          b.life -= dt;
          b.mesh.position.set(b.x, b.y, b.z);

          let hit = false;
          if (b.fromEnemy) {
            const dx = b.x - player.x;
            const dz = b.z - player.z;
            if (dx * dx + dz * dz < 1.55) {
              damagePlayer(b.damage);
              hit = true;
            }
          } else {
            for (let j = 0; j < pools.enemies.length; j += 1) {
              const en = pools.enemies[j];
              if (!en.active) continue;
              const dx = b.x - en.x;
              const dz = b.z - en.z;
              if (dx * dx + dz * dz < 2.1) {
                damageEnemy(en, b.damage);
                hit = true;
                break;
              }
            }
          }
          if (hit || b.life <= 0) {
            b.active = false;
            b.mesh.visible = false;
          }
        }

        for (let i = 0; i < pools.sparks.length; i += 1) {
          const s = pools.sparks[i];
          if (!s.active) continue;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.z += s.vz * dt;
          s.vy -= 14 * dt;
          s.life -= dt;
          if (s.life <= 0) {
            s.active = false;
            s.mesh.visible = false;
          } else {
            const sc = s.life / s.maxLife;
            s.mesh.position.set(s.x, s.y, s.z);
            s.mesh.scale.set(sc, sc, sc);
          }
        }

        for (let i = 0; i < pools.enemies.length; i += 1) {
          const en = pools.enemies[i];
          if (!en.active) continue;
          const dx = player.x - en.x;
          const dz = player.z - en.z;
          const dist = Math.hypot(dx, dz) || 0.001;
          const dirX = dx / dist;
          const dirZ = dz / dist;

          if (dist > 14) {
            en.x += dirX * en.speed * dt;
            en.z += dirZ * en.speed * dt;
          } else if (dist < 8) {
            en.x -= dirX * en.speed * 0.5 * dt;
            en.z -= dirZ * en.speed * 0.5 * dt;
          } else {
            // Orbit strafe
            en.x += -dirZ * en.speed * 0.65 * dt;
            en.z += dirX * en.speed * 0.65 * dt;
          }

          en.y = 1.9 + Math.sin(elapsed * 3.2 + en.hoverPhase) * 0.25;
          en.yaw = Math.atan2(-dirX, -dirZ);
          en.root.position.set(en.x, en.y, en.z);
          en.root.rotation.y = en.yaw;

          en.fireCooldown -= dt;
          if (en.fireCooldown <= 0 && dist < 44) {
            en.fireCooldown = en.type === 'armored' ? 1.15 : 1.55;
            spawnBullet(en.x, en.y - 0.1, en.z, dirX, dirZ, 44, en.type === 'armored' ? 12 : 8, true);
          }
        }
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
        world.update(dt, elapsed);
      }

      renderer.render(scene, camera);

      // Proximity check + 15Hz HUD throttle
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
          updateRockstarHud();
        }

        if (inCruiser) {
          const spEl = document.getElementById('cruiser-speed-val');
          if (spEl) spEl.textContent = String(Math.round(Math.abs(player.speed) * 3.2));
        }

        // Check Functional Buildings proximity
        let foundBldg = null;
        let bestBldgDistSq = 999999;
        if (world && world.functionalBuildings) {
          for (let i = 0; i < world.functionalBuildings.length; i += 1) {
            const fb = world.functionalBuildings[i];
            const rad = (fb.radius || 5.5) + 1.5;
            const dx = player.x - fb.x;
            const dz = player.z - fb.z;
            const dSq = dx * dx + dz * dz;
            if (dSq < rad * rad && dSq < bestBldgDistSq) {
              bestBldgDistSq = dSq;
              foundBldg = fb;
            }
          }
        }
        nearestBuilding = foundBldg;

        // Check Landmarks proximity
        let foundLm = null;
        let bestDistSq = 18 * 18;
        for (let i = 0; i < province.landmarks.length; i += 1) {
          const lm = province.landmarks[i];
          const dx = player.x - lm.coords[0];
          const dz = player.z - lm.coords[2];
          const dSq = dx * dx + dz * dz;
          if (dSq < bestDistSq) {
            bestDistSq = dSq;
            foundLm = lm;
          }
        }
        nearestLandmark = foundLm;

        const promptEl = document.getElementById('interact-prompt');
        if (promptEl) {
          const pText = document.getElementById('interact-prompt-text');
          if (foundBldg) {
            if (pText) pText.textContent = 'Press [E] or Tap to Enter: ' + foundBldg.name;
            promptEl.style.display = 'flex';
          } else if (foundLm) {
            if (pText) pText.textContent = 'Press [E] or Tap to Scan: ' + foundLm.name;
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
          world ? world.functionalBuildings : null,
          pools ? pools.enemies : null,
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
      global.removeEventListener('mouseup', onMouseUp);
      global.removeEventListener('resize', onResize);
      if (renderer) {
        if (renderer.domElement) {
          renderer.domElement.removeEventListener('mousedown', onCanvasMouseDown);
        }
        renderer.dispose();
      }
    }

    global.addEventListener('beforeunload', dispose);

    activeSession = {
      province: province,
      dispose: dispose,
      toggleCruiser: toggleCruiser,
      scanNearest: interactNearest,
      interactNearest: interactNearest,
      selectWeapon: selectWeapon,
      openBuildingByType: openBuildingByType
    };
    return activeSession;
  }

  global.CanadaProvinceEngine = {
    boot: boot
  };
})(typeof window !== 'undefined' ? window : globalThis);
