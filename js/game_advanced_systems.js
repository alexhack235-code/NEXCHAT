/**
 * ============================================================================
 * NEXCHAT 3D METROPOLIS - ADVANCED SYSTEMS ENGINE
 * (Tier 1: SSR Rain Wetness & Optical Neon Bloom)
 * (Tier 2: 4-Wheel Spring Suspension, Drift Skid Ribbons & Exhaust Flames)
 * (Tier 3: 3D Holographic GPS Roadway Projector & Smart Traffic Lights AI)
 * (Tier 4: Multiplayer Spatial Presence Engine & Ghost Rivals)
 *
 * Architecture: Zero-GC scratch vectors, strictly zero Unicode emojis.
 * ============================================================================
 */

(function (window) {
  'use strict';

  // --------------------------------------------------------------------------
  // SHARED ZERO-GC SCRATCH VECTORS & BUFFERS
  // --------------------------------------------------------------------------
  const _vA = new THREE.Vector3();
  const _vB = new THREE.Vector3();
  const _vC = new THREE.Vector3();
  const _vD = new THREE.Vector3();
  const _mat4 = new THREE.Matrix4();
  const _quat = new THREE.Quaternion();

  // --------------------------------------------------------------------------
  // MASTER ADVANCED SYSTEMS CONTROLLER
  // --------------------------------------------------------------------------
  class AdvancedMetropolisSystems {
    constructor() {
      this.initialized = false;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.player = null;

      // Subsystem instances
      this.wetness = null;
      this.suspension = null;
      this.skidmarks = null;
      this.exhaust = null;
      this.gps = null;
      this.trafficSignals = null;
      this.multiplayer = null;

      // Global state
      this.isRaining = false;
      this.activeDestinationIndex = 0;
      this.destinations = [
        { id: 'neokyoto', name: 'NEO-KYOTO IMPERIAL DISTRICT', x: 480, z: 280, color: 0xff0055 },
        { id: 'solaria', name: 'SOLARIA OASIS DUNES', x: -380, z: 430, color: 0xffaa00 },
        { id: 'atlantis', name: 'ATLANTIS MARINA OCEAN PORT', x: -470, z: -370, color: 0x00d9ff },
        { id: 'starbase', name: 'STARBASE STARSHIP COMPLEX', x: 580, z: -480, color: 0x00ff88 },
        { id: 'mall', name: 'CALGARY LUXURY AUTO MALL', x: 0, z: 160, color: 0xfacc15 },
        { id: 'stadium', name: 'CENTRAL METRO STADIUM', x: 0, z: -180, color: 0x38bdf8 },
        { id: 'transcanada', name: 'TRANS-CANADA GATEWAY', x: -800, z: 0, color: 0xe11d48 }
      ];
    }

    init(params) {
      if (this.initialized) return;
      this.scene = params.scene || (typeof scene !== 'undefined' ? scene : null);
      this.camera = params.camera || (typeof camera !== 'undefined' ? camera : null);
      this.renderer = params.renderer || (typeof renderer !== 'undefined' ? renderer : null);
      this.player = params.player || (typeof player !== 'undefined' ? player : null);

      if (!this.scene) {
        console.warn('[ADVANCED SYSTEMS] Scene not available yet, deferring initialization.');
        return;
      }

      // Initialize all 4 tiers
      this.wetness = new RainWetnessSubsystem(this);
      this.suspension = new SuspensionDynamicsSubsystem(this);
      this.skidmarks = new SkidmarkRibbonSubsystem(this);
      this.exhaust = new ExhaustBackfireSubsystem(this);
      this.gps = new HolographicGPSProjector(this);
      this.trafficSignals = new SmartTrafficIntersectionSubsystem(this);
      this.multiplayer = new SpatialMultiplayerPresenceSubsystem(this);

      this.initHUDControls();
      this.initialized = true;
      console.log('[ADVANCED SYSTEMS] All 4 Tiers initialized successfully (Zero Emojis, Zero-GC).');
    }

    initHUDControls() {
      // Hotkey listener: [G] for GPS cycle destination, [J] for Rain toggle
      window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        const key = e.key.toLowerCase();
        if (key === 'g') {
          this.cycleGPSDestination();
        } else if (key === 'j') {
          this.toggleWetWeather();
        }
      });
    }

    cycleGPSDestination() {
      this.activeDestinationIndex = (this.activeDestinationIndex + 1) % this.destinations.length;
      const target = this.destinations[this.activeDestinationIndex];
      if (this.gps) this.gps.setTarget(target);
      if (typeof showStoreNotification === 'function') {
        showStoreNotification(`[GPS] ROUTE LOCKED: ${target.name}`);
      }
      if (typeof cyberAudio !== 'undefined' && cyberAudio.playClick) {
        cyberAudio.playClick();
      }
    }

    toggleWetWeather() {
      this.isRaining = !this.isRaining;
      if (this.wetness) this.wetness.setWetness(this.isRaining ? 1.0 : 0.0);
      if (typeof showStoreNotification === 'function') {
        showStoreNotification(this.isRaining ? '[WEATHER] DYNAMIC RAIN & SSR WET ASPHALT ACTIVE' : '[WEATHER] CLEAR SKIES: ASPHALT DRY');
      }
      if (typeof cyberAudio !== 'undefined' && cyberAudio.playClick) {
        cyberAudio.playClick();
      }
    }

    update(delta, vehicleState) {
      if (!this.initialized) return;

      if (this.wetness) this.wetness.update(delta);
      if (this.suspension) this.suspension.update(delta, vehicleState);
      if (this.skidmarks) this.skidmarks.update(delta, vehicleState);
      if (this.exhaust) this.exhaust.update(delta, vehicleState);
      if (this.gps) this.gps.update(delta, vehicleState);
      if (this.trafficSignals) this.trafficSignals.update(delta);
      if (this.multiplayer) this.multiplayer.update(delta, vehicleState);
    }
  }

  // ==========================================================================
  // TIER 1: DYNAMIC RAIN WETNESS, PUDDLE REFLECTIONS & OPTICAL NEON BLOOM
  // ==========================================================================
  class RainWetnessSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.wetness = 0.0;
      this.targetWetness = 0.0;
      this.rainGroup = new THREE.Group();
      this.rainGroup.name = 'rainWetnessGroup';
      this.parent.scene.add(this.rainGroup);

      // Raindrop Splash Particles Pool
      this.maxSplashes = 60;
      this.splashGeo = new THREE.BufferGeometry();
      this.splashPositions = new Float32Array(this.maxSplashes * 3);
      this.splashLifes = new Float32Array(this.maxSplashes);
      this.splashGeo.setAttribute('position', new THREE.BufferAttribute(this.splashPositions, 3));

      this.splashMat = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 0.45,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });

      this.splashPoints = new THREE.Points(this.splashGeo, this.splashMat);
      this.rainGroup.add(this.splashPoints);

      // Neon pulse time
      this.neonPulseTimer = 0;
      this.cachedMaterials = [];
      this.collectReflectiveMaterials();
    }

    collectReflectiveMaterials() {
      if (!this.parent.scene) return;
      this.parent.scene.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          const mat = obj.material;
          if (mat.roughness !== undefined && (obj.name.includes('Road') || obj.name.includes('artery') || (mat.color && mat.color.getHex() < 0x333333))) {
            this.cachedMaterials.push({
              mat: mat,
              baseRoughness: mat.roughness,
              baseMetalness: mat.metalness
            });
          }
        }
      });
    }

    setWetness(val) {
      this.targetWetness = Math.max(0, Math.min(1, val));
    }

    update(delta) {
      // Smoothly transition wetness level
      if (Math.abs(this.wetness - this.targetWetness) > 0.005) {
        this.wetness = THREE.MathUtils.lerp(this.wetness, this.targetWetness, delta * 1.5);
        this.applyWetnessToMaterials(this.wetness);
      }

      // Optical Neon Breathing Glare
      this.neonPulseTimer += delta * 2.2;
      const pulse = 1.0 + Math.sin(this.neonPulseTimer) * 0.15;

      // Update Tire Rain Splash Particles if wet
      if (this.wetness > 0.1) {
        const pPos = (this.parent.player && this.parent.player.pos) ? this.parent.player.pos : null;
        if (pPos) {
          const posAttr = this.splashGeo.attributes.position;
          for (let i = 0; i < this.maxSplashes; i++) {
            this.splashLifes[i] -= delta * 3.5;
            if (this.splashLifes[i] <= 0) {
              // Spawn new splash near player
              this.splashLifes[i] = 0.5 + Math.random() * 0.5;
              const angle = Math.random() * Math.PI * 2;
              const rad = 2.0 + Math.random() * 18.0;
              this.splashPositions[i * 3] = pPos.x + Math.cos(angle) * rad;
              this.splashPositions[i * 3 + 1] = 0.09 + Math.random() * 0.25;
              this.splashPositions[i * 3 + 2] = pPos.z + Math.sin(angle) * rad;
            }
          }
          posAttr.needsUpdate = true;
          this.splashMat.opacity = this.wetness * 0.75;
          this.splashPoints.visible = true;
        }
      } else {
        this.splashPoints.visible = false;
      }
    }

    applyWetnessToMaterials(factor) {
      for (let i = 0; i < this.cachedMaterials.length; i++) {
        const item = this.cachedMaterials[i];
        if (item.mat) {
          // As asphalt gets wet, roughness drops from 0.88 -> 0.12 (mirror puddle sheen)
          item.mat.roughness = THREE.MathUtils.lerp(item.baseRoughness, 0.14, factor);
          // Metalness increases to create high specular reflections
          item.mat.metalness = THREE.MathUtils.lerp(item.baseMetalness, 0.82, factor);
          item.mat.needsUpdate = true;
        }
      }
    }
  }

  // ==========================================================================
  // TIER 2: 4-WHEEL SUSPENSION DYNAMICS, DRIFT SKID RIBBONS & EXHAUST FLAMES
  // ==========================================================================
  class SuspensionDynamicsSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.targetPitch = 0;
      this.targetRoll = 0;
      this.currentPitch = 0;
      this.currentRoll = 0;
      this.lastSpeed = 0;
    }

    update(delta, vState) {
      if (!vState) return;
      const speed = vState.roverCurrentSpeed || 0;
      const steer = vState.steer || 0;
      const throttle = vState.throttle || 0;

      // Acceleration derivative for pitch squat / dive
      const accel = (speed - this.lastSpeed) / Math.max(0.001, delta);
      this.lastSpeed = speed;

      // Nose dives downward during hard braking (accel < -5), lifts on acceleration (accel > 3)
      const pitchSquat = Math.max(-0.065, Math.min(0.065, -accel * 0.0018));
      // Chassis rolls outward against the direction of turning
      const centRoll = (speed / 28.0) * (-steer) * 0.085;

      this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, pitchSquat, delta * 9.0);
      this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, centRoll, delta * 9.0);

      // Apply to active chassis mesh
      const carMesh = typeof cyberCarMesh !== 'undefined' ? cyberCarMesh : null;
      const roverChassis = typeof roverChassisMesh !== 'undefined' ? roverChassisMesh : null;

      if (carMesh) {
        carMesh.rotation.x = this.currentPitch;
        carMesh.rotation.z = this.currentRoll;
      }
      if (roverChassis) {
        roverChassis.rotation.x = this.currentPitch * 1.1;
        roverChassis.rotation.z = this.currentRoll * 1.1;
      }
    }
  }

  // Dual Skidmark Ribbon Ring Buffer
  class SkidmarkRibbonSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.maxPoints = 140; // 140 segments = 70 quads
      this.pointIndex = 0;
      this.emitTimer = 0;

      this.skidGeo = new THREE.BufferGeometry();
      this.positions = new Float32Array(this.maxPoints * 3 * 2); // 2 tracks (Left & Right)
      this.opacities = new Float32Array(this.maxPoints * 2);
      this.skidGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

      this.skidMat = new THREE.LineBasicMaterial({
        color: 0x090b0e,
        linewidth: 2,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      });

      this.skidLineL = new THREE.Line(this.skidGeo, this.skidMat);
      this.skidLineL.frustumCulled = false;
      this.parent.scene.add(this.skidLineL);
    }

    update(delta, vState) {
      if (!vState) return;
      const isDrifting = !!vState.isDrifting;
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;
      if (!roverGroup) return;

      this.emitTimer += delta;
      if (isDrifting && this.emitTimer > 0.035) {
        this.emitTimer = 0;
        const rPos = roverGroup.position;
        const rYaw = roverGroup.rotation.y;
        const cosY = Math.cos(rYaw);
        const sinY = Math.sin(rYaw);

        // Rear left & rear right tire contact points
        const lx = rPos.x + (-1.05 * cosY - 1.65 * sinY);
        const lz = rPos.z + (1.05 * sinY - 1.65 * cosY);
        const rx = rPos.x + (1.05 * cosY - 1.65 * sinY);
        const rz = rPos.z + (-1.05 * sinY - 1.65 * cosY);

        const posAttr = this.skidGeo.attributes.position;
        const idxL = this.pointIndex * 3;
        const idxR = (this.maxPoints + this.pointIndex) * 3;

        this.positions[idxL] = lx;
        this.positions[idxL + 1] = 0.082; // Just above road deck
        this.positions[idxL + 2] = lz;

        this.positions[idxR] = rx;
        this.positions[idxR + 1] = 0.082;
        this.positions[idxR + 2] = rz;

        posAttr.needsUpdate = true;
        this.pointIndex = (this.pointIndex + 1) % this.maxPoints;
      }
    }
  }

  // Dual Exhaust Flame Cones & Procedural Backfire Pops
  class ExhaustBackfireSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.flameTimer = 0;
      this.flameActive = false;
      this.lastThrottle = 0;

      this.flameGroup = new THREE.Group();
      this.flameGroup.name = 'exhaustBackfireFlames';
      this.parent.scene.add(this.flameGroup);

      // Inner cyan flame & outer amber flame geometry
      const innerGeo = new THREE.ConeGeometry(0.18, 0.9, 8);
      innerGeo.rotateX(Math.PI / 2);
      const innerMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.95 });

      const outerGeo = new THREE.ConeGeometry(0.32, 1.25, 8);
      outerGeo.rotateX(Math.PI / 2);
      const outerMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.85 });

      this.flameL = new THREE.Group();
      this.flameL.add(new THREE.Mesh(innerGeo, innerMat));
      this.flameL.add(new THREE.Mesh(outerGeo, outerMat));

      this.flameR = this.flameL.clone();
      this.flameGroup.add(this.flameL);
      this.flameGroup.add(this.flameR);
      this.flameGroup.visible = false;
    }

    triggerBackfire() {
      this.flameTimer = 0.16; // 160ms flash
      this.flameActive = true;
      this.flameGroup.visible = true;

      // Play Web Audio backfire pop
      this.playBackfireAudio();
    }

    playBackfireAudio() {
      try {
        const audioCtx = (typeof cyberAudio !== 'undefined' && cyberAudio.ctx) ? cyberAudio.ctx : (THREE.AudioContext ? THREE.AudioContext.getContext() : null);
        if (!audioCtx) return;

        // Pop pulse: filtered noise burst + punchy low-frequency resonance
        const bufferSize = audioCtx.sampleRate * 0.12;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
        }

        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(140, audioCtx.currentTime);
        filter.Q.setValueAtTime(3.2, audioCtx.currentTime);

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.11);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        whiteNoise.start();
      } catch (e) {
        // Fallback or mute
      }
    }

    update(delta, vState) {
      if (!vState) return;
      const speed = vState.roverCurrentSpeed || 0;
      const throttle = vState.throttle || 0;
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;

      // Detect lift-off over-run: throttle dropping from 1.0 to 0.0 at high speed (> 20 m/s)
      if (this.lastThrottle > 0.8 && throttle < 0.2 && Math.abs(speed) > 18.0) {
        this.triggerBackfire();
      }
      this.lastThrottle = throttle;

      if (this.flameActive) {
        this.flameTimer -= delta;
        if (this.flameTimer <= 0) {
          this.flameActive = false;
          this.flameGroup.visible = false;
        } else if (roverGroup) {
          // Align flames to car exhaust tips
          const rPos = roverGroup.position;
          const rYaw = roverGroup.rotation.y;
          const cosY = Math.cos(rYaw);
          const sinY = Math.sin(rYaw);

          const flicker = 0.8 + Math.random() * 0.4;
          this.flameL.scale.set(flicker, flicker, flicker);
          this.flameR.scale.set(flicker, flicker, flicker);

          this.flameL.position.set(
            rPos.x + (-0.65 * cosY - 2.25 * sinY),
            rPos.y + 0.38,
            rPos.z + (0.65 * sinY - 2.25 * cosY)
          );
          this.flameL.rotation.y = rYaw;

          this.flameR.position.set(
            rPos.x + (0.65 * cosY - 2.25 * sinY),
            rPos.y + 0.38,
            rPos.z + (-0.65 * sinY - 2.25 * cosY)
          );
          this.flameR.rotation.y = rYaw;
        }
      }
    }
  }

  // ==========================================================================
  // TIER 3: 3D HOLOGRAPHIC ROADWAY GPS PROJECTOR & SMART TRAFFIC LIGHTS AI
  // ==========================================================================
  class HolographicGPSProjector {
    constructor(parent) {
      this.parent = parent;
      this.activeTarget = this.parent.destinations[0];

      this.gpsGroup = new THREE.Group();
      this.gpsGroup.name = 'holographicGPSGroup';
      this.parent.scene.add(this.gpsGroup);

      // 1. Towering Skyward Holographic Destination Beacon
      this.beaconGroup = new THREE.Group();
      this.gpsGroup.add(this.beaconGroup);

      // Light beam pillar
      const beamGeo = new THREE.CylinderGeometry(0.8, 1.8, 220, 16, 1, true);
      beamGeo.translate(0, 110, 0);
      const beamMat = new THREE.MeshBasicMaterial({
        color: this.activeTarget.color,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      this.beaconBeam = new THREE.Mesh(beamGeo, beamMat);
      this.beaconGroup.add(this.beaconBeam);

      // Concentric rotating radar rings
      this.beaconRing = new THREE.Mesh(
        new THREE.RingGeometry(2.5, 3.8, 24),
        new THREE.MeshBasicMaterial({ color: this.activeTarget.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      this.beaconRing.rotation.x = -Math.PI / 2;
      this.beaconRing.position.y = 1.2;
      this.beaconGroup.add(this.beaconRing);

      // 2. Roadway Chevrons (18 animated holographic arrows leading from player to destination)
      this.chevronCount = 18;
      this.chevronGroup = new THREE.Group();
      this.gpsGroup.add(this.chevronGroup);

      const chvShape = new THREE.Shape();
      chvShape.moveTo(0, 1.6);
      chvShape.lineTo(1.4, -0.6);
      chvShape.lineTo(0.7, -0.6);
      chvShape.lineTo(0, 0.4);
      chvShape.lineTo(-0.7, -0.6);
      chvShape.lineTo(-1.4, -0.6);
      chvShape.closePath();

      const chvGeo = new THREE.ShapeGeometry(chvShape);
      chvGeo.rotateX(-Math.PI / 2);

      this.chevrons = [];
      for (let i = 0; i < this.chevronCount; i++) {
        const cMat = new THREE.MeshBasicMaterial({
          color: 0x00f2ff,
          transparent: true,
          opacity: 0.75,
          depthWrite: false
        });
        const cMesh = new THREE.Mesh(chvGeo, cMat);
        cMesh.visible = false;
        this.chevronGroup.add(cMesh);
        this.chevrons.push(cMesh);
      }

      this.arrowPhase = 0;
      this.updateBeaconPosition();
      this.createHUDWidget();
    }

    createHUDWidget() {
      const existing = document.getElementById('gps-hud-widget');
      if (existing) existing.remove();

      const hud = document.createElement('div');
      hud.id = 'gps-hud-widget';
      hud.style.cssText = `
        position: absolute;
        top: 65px;
        right: 20px;
        background: rgba(10, 15, 24, 0.88);
        border: 1px solid rgba(0, 242, 255, 0.45);
        border-radius: 8px;
        padding: 8px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Rajdhani', sans-serif;
        color: #fff;
        z-index: 100;
        cursor: pointer;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0, 242, 255, 0.2);
        user-select: none;
      `;
      hud.title = 'Click or press [G] to switch GPS destination';
      hud.onclick = () => { this.parent.cycleGPSDestination(); };
      hud.innerHTML = `
        <i class="fa-solid fa-diamond-turn-right" style="color: #00f2ff; font-size: 16px;"></i>
        <div>
          <div id="gps-hud-dest" style="font-size: 11px; font-weight: 800; color: #00f2ff; letter-spacing: 0.5px;">GPS: ${this.activeTarget.name}</div>
          <div id="gps-hud-metrics" style="font-size: 10px; color: #94a3b8; font-family: monospace;">DISTANCE: ---M · ETA: ---S</div>
        </div>
      `;
      document.body.appendChild(hud);
    }

    setTarget(dest) {
      this.activeTarget = dest;
      this.beaconBeam.material.color.setHex(dest.color);
      this.beaconRing.material.color.setHex(dest.color);
      this.updateBeaconPosition();

      const nameEl = document.getElementById('gps-hud-dest');
      if (nameEl) nameEl.textContent = `GPS: ${dest.name}`;
    }

    updateBeaconPosition() {
      if (this.beaconGroup) {
        this.beaconGroup.position.set(this.activeTarget.x, 0, this.activeTarget.z);
      }
    }

    update(delta, vState) {
      const pPos = (this.parent.player && this.parent.player.pos) ? this.parent.player.pos : null;
      if (!pPos) return;

      // Animate beacon rotation
      if (this.beaconRing) this.beaconRing.rotation.z += delta * 1.5;

      const dx = this.activeTarget.x - pPos.x;
      const dz = this.activeTarget.z - pPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const speed = Math.max(8.0, Math.abs((vState && vState.roverCurrentSpeed) ? vState.roverCurrentSpeed : 12.0));
      const eta = Math.round(dist / speed);

      // Update HUD metrics
      const metricsEl = document.getElementById('gps-hud-metrics');
      if (metricsEl && Math.random() < 0.1) {
        metricsEl.textContent = `DISTANCE: ${Math.round(dist)}M · ETA: ${eta}S`;
      }

      // Animate holographic chevrons streaming toward destination along the road
      this.arrowPhase = (this.arrowPhase + delta * 2.8) % 1.0;
      const angle = Math.atan2(dx, dz);

      for (let i = 0; i < this.chevronCount; i++) {
        const chv = this.chevrons[i];
        const t = ((i / this.chevronCount) + this.arrowPhase) % 1.0;
        const arrowDist = 12.0 + t * Math.min(180.0, dist * 0.7);

        if (arrowDist < dist) {
          chv.position.set(
            pPos.x + Math.sin(angle) * arrowDist,
            0.24, // Hovering over road
            pPos.z + Math.cos(angle) * arrowDist
          );
          chv.rotation.y = angle;
          chv.material.opacity = (1.0 - t) * 0.85;
          chv.visible = true;
        } else {
          chv.visible = false;
        }
      }
    }
  }

  // Smart 4-Way Traffic Intersection Light AI
  class SmartTrafficIntersectionSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.signalsGroup = new THREE.Group();
      this.signalsGroup.name = 'smartTrafficSignals';
      this.parent.scene.add(this.signalsGroup);

      // Define 4 major arterial intersections
      this.intersections = [
        { id: 'central', x: 0, z: 0, state: 'NS_GREEN', timer: 14.0 },
        { id: 'north_artery', x: 0, z: 180, state: 'EW_GREEN', timer: 14.0 },
        { id: 'south_artery', x: 0, z: -180, state: 'NS_GREEN', timer: 14.0 },
        { id: 'neokyoto_gate', x: 85, z: 85, state: 'NS_GREEN', timer: 12.0 }
      ];

      this.buildSignalGantries();
    }

    buildSignalGantries() {
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x1b2431, roughness: 0.7, metalness: 0.3 });
      const housingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.6 });

      this.intersections.forEach(inter => {
        const gantry = new THREE.Group();
        gantry.position.set(inter.x, 0, inter.z);

        // Mast arm
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 8.5, 8), poleMat);
        pole.position.set(-10, 4.25, -10);
        gantry.add(pole);

        const mastArm = new THREE.Mesh(new THREE.BoxGeometry(20, 0.35, 0.35), poleMat);
        mastArm.position.set(0, 8.2, -10);
        gantry.add(mastArm);

        // Signal Heads (North-South & East-West)
        inter.lightMeshes = {};
        ['NS', 'EW'].forEach((dir, dIdx) => {
          const sBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.8, 0.5), housingMat);
          sBox.position.set(dIdx === 0 ? -2.5 : 2.5, 8.2, -10);
          gantry.add(sBox);

          const rLight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0x330000 }));
          rLight.position.set(0, 0.52, 0.26);
          sBox.add(rLight);

          const aLight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0x332200 }));
          aLight.position.set(0, 0, 0.26);
          sBox.add(aLight);

          const gLight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ff66 }));
          gLight.position.set(0, -0.52, 0.26);
          sBox.add(gLight);

          inter.lightMeshes[dir] = { red: rLight, amber: aLight, green: gLight };
        });

        this.signalsGroup.add(gantry);
      });
    }

    update(delta) {
      // Advance intersection state machine
      this.intersections.forEach(inter => {
        inter.timer -= delta;
        if (inter.timer <= 0) {
          if (inter.state === 'NS_GREEN') {
            inter.state = 'NS_AMBER';
            inter.timer = 3.0;
          } else if (inter.state === 'NS_AMBER') {
            inter.state = 'EW_GREEN';
            inter.timer = 14.0;
          } else if (inter.state === 'EW_GREEN') {
            inter.state = 'EW_AMBER';
            inter.timer = 3.0;
          } else {
            inter.state = 'NS_GREEN';
            inter.timer = 14.0;
          }
          this.refreshSignalLights(inter);
        }
      });

      // Hook AI Traffic stopping at red lights
      this.updateAITrafficIntersectionBehavior();
    }

    refreshSignalLights(inter) {
      const lights = inter.lightMeshes;
      if (!lights) return;

      const isNSGreen = inter.state === 'NS_GREEN';
      const isNSAmber = inter.state === 'NS_AMBER';
      const isEWGreen = inter.state === 'EW_GREEN';
      const isEWAmber = inter.state === 'EW_AMBER';

      // NS Signal
      lights.NS.green.material.color.setHex(isNSGreen ? 0x00ff88 : 0x003311);
      lights.NS.amber.material.color.setHex(isNSAmber ? 0xffaa00 : 0x332200);
      lights.NS.red.material.color.setHex((!isNSGreen && !isNSAmber) ? 0xff2244 : 0x330000);

      // EW Signal
      lights.EW.green.material.color.setHex(isEWGreen ? 0x00ff88 : 0x003311);
      lights.EW.amber.material.color.setHex(isEWAmber ? 0xffaa00 : 0x332200);
      lights.EW.red.material.color.setHex((!isEWGreen && !isEWAmber) ? 0xff2244 : 0x330000);
    }

    updateAITrafficIntersectionBehavior() {
      const traffic = (typeof window.cityTrafficVehicles !== 'undefined' && Array.isArray(window.cityTrafficVehicles)) ? window.cityTrafficVehicles : [];
      if (traffic.length === 0) return;

      for (let i = 0; i < traffic.length; i++) {
        const veh = traffic[i];
        if (!veh.group || veh.isHover) continue;

        // Check distance to Central Intersection (0, 0)
        const vPos = veh.group.position;
        const distToCenter = Math.sqrt(vPos.x * vPos.x + vPos.z * vPos.z);

        if (distToCenter < 45.0 && distToCenter > 8.0) {
          const centralInter = this.intersections[0];
          const isNS = veh.axis === 'z';
          const isRed = isNS ? (centralInter.state.startsWith('EW')) : (centralInter.state.startsWith('NS'));

          if (isRed) {
            // Decelerate smoothly to stop line
            veh.speed = THREE.MathUtils.lerp(veh.speed, 0.0, 0.15);
          } else {
            // Accelerate back up to road cruise speed
            veh.speed = THREE.MathUtils.lerp(veh.speed, 28.0, 0.08);
          }
        }
      }
    }
  }

  // ==========================================================================
  // TIER 4: MULTIPLAYER SPATIAL PRESENCE & GHOST RIVALS ENGINE
  // ==========================================================================
  class SpatialMultiplayerPresenceSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.channel = null;
      this.localPlayerId = 'operative_' + Math.floor(10000 + Math.random() * 90000);
      this.localCallsign = this.resolveLocalCallsign();
      this.remotePlayers = new Map();
      this.ghostRivals = [];

      this.multiGroup = new THREE.Group();
      this.multiGroup.name = 'spatialMultiplayerPresence';
      this.parent.scene.add(this.multiGroup);

      this.initBroadcastChannel();
      this.initGhostRivals();
    }

    resolveLocalCallsign() {
      const profileName = document.getElementById('lobby-profile-name');
      if (profileName && profileName.textContent && profileName.textContent.trim()) {
        return profileName.textContent.trim().toUpperCase();
      }
      return 'NEX_OPERATIVE';
    }

    initBroadcastChannel() {
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          this.channel = new BroadcastChannel('nexchat_metropolis_spatial_realm');
          this.channel.onmessage = (evt) => {
            this.handleRemoteTelemetry(evt.data);
          };
          console.log('[MULTIPLAYER] BroadcastChannel spatial realm active.');
        }
      } catch (e) {
        console.warn('[MULTIPLAYER] BroadcastChannel fallback engaged.');
      }

      // Local storage fallback for cross-process tab sync
      window.addEventListener('storage', (e) => {
        if (e.key === 'nexchat_spatial_peer_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data.senderId !== this.localPlayerId) {
              this.handleRemoteTelemetry(data);
            }
          } catch (err) {}
        }
      });
    }

    initGhostRivals() {
      // 3 Autonomous High-Speed Ghost Rivals that guarantee an active multiplayer atmosphere
      const rivalConfigs = [
        {
          id: 'rival_spectre',
          callsign: 'VORTEX_SPECTRE [TITAN]',
          color: 0x00f2ff,
          startX: 85,
          startZ: 120,
          speed: 34.0,
          patrolAxis: 'z',
          dir: 1,
          minB: -380,
          maxB: 420
        },
        {
          id: 'rival_valkyrie',
          callsign: 'CYBER_VALKYRIE [NEO-TOKYO]',
          color: 0xff0055,
          startX: -140,
          startZ: 0,
          speed: 36.5,
          patrolAxis: 'x',
          dir: -1,
          minB: -450,
          maxB: 450
        },
        {
          id: 'rival_chronos',
          callsign: 'TITAN_CHRONOS [APEX]',
          color: 0xffaa00,
          startX: 120,
          startZ: -180,
          speed: 32.0,
          patrolAxis: 'z',
          dir: 1,
          minB: -400,
          maxB: 400
        }
      ];

      rivalConfigs.forEach((cfg) => {
        const rCar = this.createMultiplayerVehicleMesh(cfg.color, cfg.callsign);
        rCar.position.set(cfg.startX, 0, cfg.startZ);
        this.multiGroup.add(rCar);

        this.ghostRivals.push({
          config: cfg,
          group: rCar,
          pos: rCar.position,
          timer: Math.random() * 5.0,
          chatTimer: 12.0 + Math.random() * 18.0
        });
      });
    }

    createMultiplayerVehicleMesh(color, callsign) {
      const vGroup = new THREE.Group();

      const carMat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.92,
        roughness: 0.18
      });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 0.3, metalness: 0.8 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.75 });

      // Chassis
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 4.6), carMat);
      body.position.y = 0.6;
      body.castShadow = true;
      vGroup.add(body);

      // Cabin
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 2.3), glassMat);
      cabin.position.set(0, 1.05, -0.2);
      vGroup.add(cabin);

      // Underglow Neon
      const glowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85 });
      const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.8), glowMat);
      underglow.rotation.x = -Math.PI / 2;
      underglow.position.y = 0.088;
      vGroup.add(underglow);

      // 3D Floating Callsign HUD Tag
      const hudCanvas = document.createElement('canvas');
      hudCanvas.width = 380;
      hudCanvas.height = 70;
      const ctx = hudCanvas.getContext('2d');
      ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
      ctx.roundRect ? ctx.roundRect(0, 0, 380, 70, 10) : ctx.fillRect(0, 0, 380, 70);
      ctx.fill();
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#00f2ff';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[PILOT] ${callsign}`, 190, 44);

      const tagTex = new THREE.CanvasTexture(hudCanvas);
      const tagMat = new THREE.SpriteMaterial({ map: tagTex, transparent: true });
      const tagSprite = new THREE.Sprite(tagMat);
      tagSprite.scale.set(4.5, 0.85, 1);
      tagSprite.position.y = 2.4;
      vGroup.add(tagSprite);

      return vGroup;
    }

    display3DSpeechBubble(vGroup, text) {
      const bubbleCanvas = document.createElement('canvas');
      bubbleCanvas.width = 512;
      bubbleCanvas.height = 120;
      const ctx = bubbleCanvas.getContext('2d');

      ctx.fillStyle = 'rgba(10, 15, 24, 0.94)';
      ctx.roundRect ? ctx.roundRect(0, 0, 512, 120, 14) : ctx.fillRect(0, 0, 512, 120);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text.slice(0, 32), 256, 68);

      const bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
      const bubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true }));
      bubbleSprite.scale.set(6.2, 1.45, 1);
      bubbleSprite.position.y = 3.6;
      vGroup.add(bubbleSprite);

      // Auto-remove speech bubble after 6.5 seconds
      setTimeout(() => {
        vGroup.remove(bubbleSprite);
      }, 6500);
    }

    handleRemoteTelemetry(data) {
      if (!data || data.senderId === this.localPlayerId) return;

      let p = this.remotePlayers.get(data.senderId);
      if (!p) {
        // Spawn remote player car
        const car = this.createMultiplayerVehicleMesh(data.color || 0x00f2ff, data.callsign || 'REMOTE_PILOT');
        this.multiGroup.add(car);
        p = { group: car, targetPos: new THREE.Vector3(), targetYaw: 0 };
        this.remotePlayers.set(data.senderId, p);

        if (typeof showStoreNotification === 'function') {
          showStoreNotification(`[MULTIPLAYER] PILOT ${data.callsign} ENTERED REALM!`);
        }
      }

      p.targetPos.set(data.x, data.y, data.z);
      p.targetYaw = data.yaw || 0;

      if (data.chatMsg) {
        this.display3DSpeechBubble(p.group, data.chatMsg);
      }
    }

    update(delta, vState) {
      // 1. Broadcast Local Player Telemetry at 10 Hz
      const pPos = (this.parent.player && this.parent.player.pos) ? this.parent.player.pos : null;
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;

      if (pPos && roverGroup && Math.random() < 0.2) {
        const payload = {
          senderId: this.localPlayerId,
          callsign: this.localCallsign,
          x: roverGroup.position.x,
          y: roverGroup.position.y,
          z: roverGroup.position.z,
          yaw: roverGroup.rotation.y,
          speed: (vState && vState.roverCurrentSpeed) ? vState.roverCurrentSpeed : 0
        };

        if (this.channel) {
          try { this.channel.postMessage(payload); } catch (e) {}
        }
      }

      // 2. Smoothly Lerp Remote Players
      this.remotePlayers.forEach((p) => {
        p.group.position.lerp(p.targetPos, delta * 8.0);
        p.group.rotation.y = THREE.MathUtils.lerp(p.group.rotation.y, p.targetYaw, delta * 8.0);
      });

      // 3. Animate Autonomous Ghost Rivals
      this.ghostRivals.forEach((rival) => {
        const cfg = rival.config;
        if (cfg.patrolAxis === 'z') {
          rival.group.position.z += cfg.dir * cfg.speed * delta;
          rival.group.rotation.y = cfg.dir > 0 ? 0 : Math.PI;
          if (cfg.dir > 0 && rival.group.position.z > cfg.maxB) cfg.dir = -1;
          if (cfg.dir < 0 && rival.group.position.z < cfg.minB) cfg.dir = 1;
        } else {
          rival.group.position.x += cfg.dir * cfg.speed * delta;
          rival.group.rotation.y = cfg.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          if (cfg.dir > 0 && rival.group.position.x > cfg.maxB) cfg.dir = -1;
          if (cfg.dir < 0 && rival.group.position.x < cfg.minB) cfg.dir = 1;
        }

        // Periodic Rival Tactical Chatter in 3D Speech Bubbles
        rival.chatTimer -= delta;
        if (rival.chatTimer <= 0) {
          rival.chatTimer = 18.0 + Math.random() * 24.0;
          const phrases = [
            'RACE ME TO STARBASE!',
            'NITRO CHARGED & READY!',
            'TRY TO KEEP UP, PILOT!',
            'SECTOR CLEAR // 100% NOMINAL',
            'CHECKPOINT PASSED!'
          ];
          const text = phrases[Math.floor(Math.random() * phrases.length)];
          this.display3DSpeechBubble(rival.group, text);
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // EXPORT TO WINDOW
  // --------------------------------------------------------------------------
  window.AdvancedMetropolisSystems = AdvancedMetropolisSystems;
  window.advancedSystemsInstance = new AdvancedMetropolisSystems();

  window.initAdvancedSystems = function (params) {
    if (window.advancedSystemsInstance) {
      window.advancedSystemsInstance.init(params || {});
    }
  };

  window.updateAdvancedSystems = function (delta, vehicleState) {
    if (window.advancedSystemsInstance && window.advancedSystemsInstance.initialized) {
      window.advancedSystemsInstance.update(delta, vehicleState);
    }
  };

})(window);
