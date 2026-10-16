// js/game_hyper_realism.js
// NEXUS REALISM ENGINE // Hyper-Realistic Rendering, PBR Shaders, Atmospheric Physics & Low-End Performance Scaler
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
      cullDistance: 280,
      maxParticles: 60,
      pbrAnisotropy: 1,
      fogDensityFactor: 1.4,
      drawDecorations: false,
      enableVapor: false
    },
    med: {
      name: 'MEDIUM (BALANCED 60FPS)',
      pixelRatio: 1.25,
      shadows: true,
      shadowMapSize: 512,
      shadowType: (typeof THREE !== 'undefined' ? THREE.BasicShadowMap : 0),
      cullDistance: 560,
      maxParticles: 160,
      pbrAnisotropy: 2,
      fogDensityFactor: 1.0,
      drawDecorations: true,
      enableVapor: true
    },
    high: {
      name: 'HIGH (HYPER-REALISTIC CINEMATIC)',
      pixelRatio: 1.75,
      shadows: true,
      shadowMapSize: 1024,
      shadowType: (typeof THREE !== 'undefined' ? THREE.PCFSoftShadowMap : 2),
      cullDistance: 1100,
      maxParticles: 380,
      pbrAnisotropy: 4,
      fogDensityFactor: 0.85,
      drawDecorations: true,
      enableVapor: true
    }
  };

  function detectOptimalQuality() {
    const saved = localStorage.getItem('HYPER_REALISM_QUALITY');
    if (saved && QUALITY_PROFILES[saved]) return saved;

    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4; // GB

    if (isTouch || cores <= 4 || memory <= 4) {
      return 'low';
    }
    if (cores >= 8 && memory >= 8 && window.innerWidth >= 1600) {
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
  // 3. HYPER REALISM ENGINE CLASS
  // ============================================================
  class HyperRealismEngine {
    constructor() {
      this.initialized = false;
      this.quality = detectOptimalQuality();
      this.profile = QUALITY_PROFILES[this.quality];

      // Engine References
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.player = null;
      this.gameState = null;

      // Celestial & Atmosphere Objects
      this.sunMesh = null;
      this.sunCorona = null;
      this.moonMesh = null;
      this.sunLight = null;
      this.hemiLight = null;
      this.distantCullGroup = [];

      // Canadian Environmental Mechanics
      this.activeGearIndex = 0;
      this.equippedGear = CANADIAN_GEAR_TYPES[0];
      this.warmth = 100.0; // 0 - 100%
      this.thermosCount = 3;
      this.lastVaporTime = 0;
      this.outdoorTemp = -18; // Celsius
      this.isInsideShelter = false;

      // Online/GLB Models Loaded
      this.tacticalDroneMesh = null;
      this.cyberCarModel = null;
      this.vaporParticles = [];

      // Culling throttle timer
      this.lastCullCheck = 0;
    }

    init(scene, camera, renderer, player, gameState) {
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.player = player;
      this.gameState = gameState;

      if (!this.renderer || !this.scene) return;

      // 1. Calibrate Tone Mapping & Color Management for Photorealism
      if (typeof THREE !== 'undefined') {
        if (THREE.sRGBEncoding && this.renderer.outputEncoding !== undefined) {
          this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
        if (THREE.ACESFilmicToneMapping) {
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 1.18;
        }
      }

      // 2. Apply detected quality profile
      this.applyQuality(this.quality, false);

      // 3. Setup Atmospheric Celestial Objects
      this.setupCelestialRealism();

      // 4. Setup Breath Vapor & Frost Atmosphere Particles
      this.setupAtmosphericVapor();

      // 5. Load Free Online & Local 3D GLTF Assets (with zero-delay fallback)
      this.loadHighFidelityAssets();

      // 6. Connect HUD & UI bindings
      this.syncSurvivalHUD();

      this.initialized = true;
      console.log(`[HyperRealismEngine] Initialized in ${this.quality.toUpperCase()} mode.`);
    }

    // ------------------------------------------------------------
    // QUALITY PRESETS CONTROLLER
    // ------------------------------------------------------------
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

      // Fog adaptation
      if (this.scene && this.scene.fog) {
        if (mode === 'low') {
          this.scene.fog.density = 0.0032;
        } else if (mode === 'med') {
          this.scene.fog.density = 0.0020;
        } else {
          this.scene.fog.density = 0.0016;
        }
      }

      // Update HUD quality badges
      const qLbl = document.getElementById('quality-label') || document.getElementById('hud-quality-val');
      if (qLbl) qLbl.textContent = mode.toUpperCase();

      if (notify && typeof window.showStoreNotification === 'function') {
        window.showStoreNotification(`GRAPHICS PROFILE: ${p.name}`);
      }
    }

    // ------------------------------------------------------------
    // ATMOSPHERIC SUN / MOON / CELESTIAL REALISM
    // ------------------------------------------------------------
    setupCelestialRealism() {
      if (!this.scene || typeof THREE === 'undefined') return;

      // Hyper-Realistic Sun Disc with Dynamic Atmospheric Glow
      const sunGeo = new THREE.SphereGeometry(45, 24, 24);
      const sunMat = new THREE.MeshBasicMaterial({
        color: 0xfffae6,
        fog: false
      });
      this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
      this.sunMesh.visible = true;
      this.scene.add(this.sunMesh);

      // Volumetric Corona Shader/Mesh
      const coronaGeo = new THREE.RingGeometry(46, 120, 32);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: 0xffdd88,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        fog: false
      });
      this.sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
      this.sunMesh.add(this.sunCorona);

      // Realistic High-Fidelity Lunar Sphere
      const moonGeo = new THREE.SphereGeometry(38, 24, 24);
      const moonMat = new THREE.MeshBasicMaterial({
        color: 0xd8e8ff,
        fog: false
      });
      this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
      this.moonMesh.visible = false;
      this.scene.add(this.moonMesh);

      // Lunar Silver Halo
      const moonHaloGeo = new THREE.RingGeometry(40, 95, 32);
      const moonHaloMat = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        fog: false
      });
      const moonHalo = new THREE.Mesh(moonHaloGeo, moonHaloMat);
      this.moonMesh.add(moonHalo);
    }

    // ------------------------------------------------------------
    // FREE ONLINE & LOCAL GLB 3D ASSETS PIPELINE
    // ------------------------------------------------------------
    loadHighFidelityAssets() {
      if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') return;
      const loader = new THREE.GLTFLoader();

      // 1. Tactical Autonomous Companion Drone
      const dronePaths = [
        'assets/models/robot_companion.glb',
        '../assets/models/robot_companion.glb',
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb'
      ];
      this.loadAssetWithFallback(loader, dronePaths, (gltf) => {
        const drone = gltf.scene;
        drone.scale.set(0.65, 0.65, 0.65);
        drone.traverse(c => {
          if (c.isMesh) {
            c.castShadow = (this.quality !== 'low');
            c.receiveShadow = (this.quality !== 'low');
          }
        });

        // Add cyber scanning searchlight
        const spot = new THREE.SpotLight(0x00f2ff, 2.2, 35, Math.PI / 6, 0.5);
        spot.position.set(0, 0, 0.2);
        drone.add(spot);

        this.scene.add(drone);
        this.tacticalDroneMesh = drone;
      }, () => {
        // Procedural Tactical Hover Drone Fallback
        const dGroup = new THREE.Group();
        const dBody = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x141e28, metalness: 0.9, roughness: 0.2 })
        );
        const dEye = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x00f2ff })
        );
        dEye.position.set(0, 0, 0.38);
        dGroup.add(dBody);
        dGroup.add(dEye);

        const dRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.65, 0.05, 6, 24),
          new THREE.MeshBasicMaterial({ color: 0x00ff88 })
        );
        dRing.rotation.x = Math.PI / 2;
        dGroup.add(dRing);

        this.scene.add(dGroup);
        this.tacticalDroneMesh = dGroup;
      });

      // 2. High-Tech Cyber Cruiser Car (Replaces box placeholder)
      const carPaths = [
        'assets/models/cyber_car.glb',
        '../assets/models/cyber_car.glb'
      ];
      this.loadAssetWithFallback(loader, carPaths, (gltf) => {
        const car = gltf.scene;
        car.scale.set(1.4, 1.4, 1.4);
        car.traverse(c => {
          if (c.isMesh) {
            c.castShadow = (this.quality !== 'low');
            c.receiveShadow = (this.quality !== 'low');
            if (c.material) {
              c.material.metalness = 0.85;
              c.material.roughness = 0.22;
            }
          }
        });
        this.cyberCarModel = car;
      }, null);
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
        }, undefined, err => {
          console.warn(`[AssetLoader] Retrying next candidate after failure on: ${url}`);
          tryNext();
        });
      };
      tryNext();
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

      // Pre-allocate pool of 12 vapor puffs
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
      available.mesh.material.opacity = 0.4;
      available.mesh.visible = true;
      available.life = available.maxLife;
      available.vel.set(
        forwardX * 0.8 + (Math.random() - 0.5) * 0.2,
        0.45 + Math.random() * 0.25,
        forwardZ * 0.8 + (Math.random() - 0.5) * 0.2
      );
    }

    // ------------------------------------------------------------
    // CANADIAN SURVIVAL & WARMTH SIMULATION LOOP
    // ------------------------------------------------------------
    updateSurvival(dt) {
      if (!this.gameState) return;

      // Determine shelter status (inside mall, C-Train, or vehicle)
      const inTrain = this.gameState.inCalgaryCTrain;
      const inVehicle = this.gameState.inVehicle || (this.gameState.flightMode === 'rover');
      const inMall = (this.player && this.player.pos && Math.abs(this.player.pos.x) < 32 && Math.abs(this.player.pos.z - 122) < 28);

      this.isInsideShelter = inTrain || inVehicle || inMall;

      if (this.isInsideShelter) {
        // Regenerate warmth rapidly in heated spaces
        this.warmth = Math.min(100.0, this.warmth + dt * 18.0);
      } else {
        // Outdoor cold drain modified by gear insulation
        const rate = this.equippedGear.warmthDrain * (Math.abs(this.outdoorTemp) / 18.0);
        this.warmth = Math.max(0.0, this.warmth - dt * rate);
      }

      // If warmth drops to 0, start hypothermia health damage
      if (this.warmth <= 0 && !this.isInsideShelter) {
        const curHealth = this.gameState.health || 100;
        this.gameState.health = Math.max(0, curHealth - dt * 4.5);

        const hpBar = document.getElementById('city-hp-fill') || document.getElementById('fill-health') || document.getElementById('hud-hp-bar');
        const hpVal = document.getElementById('city-hp-val') || document.getElementById('label-health');
        if (hpBar) hpBar.style.width = Math.round(this.gameState.health) + '%';
        if (hpVal) hpVal.textContent = Math.round(this.gameState.health) + '%';
      }

      // Frostbite vignette effect
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

    // ------------------------------------------------------------
    // TIME OF DAY ATMOSPHERIC SYNC
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // DISTANCE CULLING OPTIMIZER (FOR LOW-END PHONES & CHIPS)
    // ------------------------------------------------------------
    registerCullableGroup(obj) {
      if (obj) this.distantCullGroup.push(obj);
    }

    updateDistanceCulling() {
      if (!this.camera || this.distantCullGroup.length === 0) return;
      const camPos = this.camera.position;
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

    // ------------------------------------------------------------
    // MAIN UPDATE LOOP
    // ------------------------------------------------------------
    update(delta, now) {
      if (!this.initialized) return;

      // 1. Throttled distance culling (runs every 120ms to save CPU cycles)
      if (now - this.lastCullCheck > 120) {
        this.lastCullCheck = now;
        this.updateDistanceCulling();
      }

      // 2. Breath condensation puffs
      if (now - this.lastVaporTime > 2400) {
        this.lastVaporTime = now;
        this.emitBreathPuff();
      }

      // 3. Update breath vapor particles
      for (let i = 0; i < this.vaporParticles.length; i++) {
        const v = this.vaporParticles[i];
        if (v.mesh.visible) {
          v.life -= delta;
          v.mesh.position.addScaledVector(v.vel, delta);
          v.mesh.scale.addScalar(delta * 0.45);
          v.mesh.material.opacity = Math.max(0, (v.life / v.maxLife) * 0.38);
          if (v.life <= 0) v.mesh.visible = false;
        }
      }

      // 4. Update Tactical Companion Drone (hovers gracefully near player's shoulder)
      if (this.tacticalDroneMesh && this.player && this.player.pos) {
        const targetX = this.player.pos.x + Math.cos(now * 0.0015) * 2.2;
        const targetY = this.player.pos.y + 2.4 + Math.sin(now * 0.003) * 0.25;
        const targetZ = this.player.pos.z + Math.sin(now * 0.0015) * 2.2;

        this.tacticalDroneMesh.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), delta * 4.5);
        this.tacticalDroneMesh.rotation.y += delta * 1.8;
      }

      // 5. Sun Corona & Lunar Halo Alignment
      if (this.camera) {
        if (this.sunCorona) this.sunCorona.lookAt(this.camera.position);
        if (this.sunMesh && typeof currentSunDir !== 'undefined') {
          this.sunMesh.position.copy(this.camera.position).addScaledVector(currentSunDir, 1600);
        }
        if (this.moonMesh && typeof currentMoonDir !== 'undefined') {
          this.moonMesh.position.copy(this.camera.position).addScaledVector(currentMoonDir, 1600);
        }
      }

      // 6. Canadian Coldness & Survival
      this.updateSurvival(delta);
    }
  }

  // Instantiate singleton engine on window
  window.HyperRealismEngine = new HyperRealismEngine();

  // Expose global convenient actions for HTML buttons & hotkeys
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
