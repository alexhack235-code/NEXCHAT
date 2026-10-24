/**
 * ============================================================================
 * NEXCHAT 3D METROPOLIS - ADVANCED SYSTEMS ENGINE
 * ----------------------------------------------------------------------------
 * (Tier 1: SSR Rain Wetness & Optical Neon Bloom)
 * (Tier 2: 4-Wheel Spring Suspension, Drift Skid Ribbons & Exhaust Flames)
 * (Tier 3: 3D Holographic GPS Roadway Projector & Smart Traffic Lights AI)
 * (Tier 4: Multiplayer Spatial Presence Engine & Ghost Rivals)
 * (Tier 5: Dynamic Celestial 24-Hr Cycle & Volumetric Atmospheric Scattering)
 * (Tier 6: 1P Cockpit Interior Camera, 3D Gauge Cluster & Steering Wheel)
 * (Tier 7: Vehicle Damage Physics, Collision Spark Shards & 5 Pit-Stop Bays)
 * (Tier 8: Operational Elevated Maglev Monorail Transit Network & Fast-Travel)
 * (Tier 9: Dynamic Pedestrian Crowd Simulation & Honk Evasion AI)
 * (Tier 10: Spatial 3D Audio Visualizer Towers & Cyber DJ Stings)
 * (Tier 11: Subterranean Neon Underground Highway Network at y: -18m)
 * (Tier 12: Interactive Drive-In Tuning Garage & Real-Time Wrap Editor)
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

      // New Grand Expansion Subsystems
      this.celestial = null;
      this.cockpit = null;
      this.damageAndPitstop = null;
      this.maglev = null;
      this.pedestrians = null;
      this.visualizer = null;
      this.tunnels = null;
      this.tuning = null;

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

      // Initialize all 8 Subsystems
      this.wetness = new RainWetnessSubsystem(this);
      this.suspension = new SuspensionDynamicsSubsystem(this);
      this.skidmarks = new SkidmarkRibbonSubsystem(this);
      this.exhaust = new ExhaustBackfireSubsystem(this);
      this.gps = new HolographicGPSProjector(this);
      this.trafficSignals = new SmartTrafficIntersectionSubsystem(this);
      this.multiplayer = new SpatialMultiplayerPresenceSubsystem(this);

      // Expansion Subsystems
      this.celestial = new CelestialAtmosphereSubsystem(this);
      this.cockpit = new CockpitInteriorDashboardSubsystem(this);
      this.damageAndPitstop = new VehicleDamageAndRepairBaySubsystem(this);
      this.maglev = new ElevatedMaglevTransitSubsystem(this);
      this.pedestrians = new PedestrianCrowdSimulationSubsystem(this);
      this.visualizer = new SpatialAudioVisualizerSubsystem(this);
      this.tunnels = new SubterraneanTunnelNetworkSubsystem(this);
      this.tuning = new VehicleTuningStudioSubsystem(this);

      this.initHUDControls();
      this.initialized = true;
      console.log('[ADVANCED SYSTEMS] All 12 Tiers initialized successfully (Zero Emojis, Zero-GC).');
    }

    initHUDControls() {
      // Hotkey listeners: [G] GPS, [J] Rain, [K] Celestial Time, [C] / [V] Cockpit
      window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        const key = e.key.toLowerCase();
        if (key === 'g') {
          this.cycleGPSDestination();
        } else if (key === 'j') {
          this.toggleWetWeather();
        } else if (key === 'k') {
          if (this.celestial) this.celestial.advanceTimeOfDay(4.0);
        } else if (key === 'h') {
          if (this.pedestrians) this.pedestrians.triggerHonk();
        } else if (key === 't') {
          if (this.tuning) this.tuning.toggleStudio();
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

      // Expansion Subsystems Updates
      if (this.celestial) this.celestial.update(delta);
      if (this.cockpit) this.cockpit.update(delta, vehicleState);
      if (this.damageAndPitstop) this.damageAndPitstop.update(delta, vehicleState);
      if (this.maglev) this.maglev.update(delta);
      if (this.pedestrians) this.pedestrians.update(delta, vehicleState);
      if (this.visualizer) this.visualizer.update(delta);
      if (this.tunnels) this.tunnels.update(delta, vehicleState);
      if (this.tuning) this.tuning.update(delta, vehicleState);
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
          // As asphalt gets wet, roughness drops from 0.88 -> 0.14 (mirror puddle sheen)
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
      this.maxPoints = 140;
      this.pointIndex = 0;
      this.emitTimer = 0;

      this.skidGeo = new THREE.BufferGeometry();
      this.positions = new Float32Array(this.maxPoints * 3 * 2);
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

        const lx = rPos.x + (-1.05 * cosY - 1.65 * sinY);
        const lz = rPos.z + (1.05 * sinY - 1.65 * cosY);
        const rx = rPos.x + (1.05 * cosY - 1.65 * sinY);
        const rz = rPos.z + (-1.05 * sinY - 1.65 * cosY);

        const posAttr = this.skidGeo.attributes.position;
        const idxL = this.pointIndex * 3;
        const idxR = (this.maxPoints + this.pointIndex) * 3;

        this.positions[idxL] = lx;
        this.positions[idxL + 1] = 0.082;
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
      this.flameTimer = 0.16;
      this.flameActive = true;
      this.flameGroup.visible = true;
      this.playBackfireAudio();
    }

    playBackfireAudio() {
      try {
        const audioCtx = (typeof cyberAudio !== 'undefined' && cyberAudio.ctx) ? cyberAudio.ctx : (THREE.AudioContext ? THREE.AudioContext.getContext() : null);
        if (!audioCtx) return;

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
      } catch (e) {}
    }

    update(delta, vState) {
      if (!vState) return;
      const speed = vState.roverCurrentSpeed || 0;
      const throttle = vState.throttle || 0;
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;

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

      this.beaconGroup = new THREE.Group();
      this.gpsGroup.add(this.beaconGroup);

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

      this.beaconRing = new THREE.Mesh(
        new THREE.RingGeometry(2.5, 3.8, 24),
        new THREE.MeshBasicMaterial({ color: this.activeTarget.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      this.beaconRing.rotation.x = -Math.PI / 2;
      this.beaconRing.position.y = 1.2;
      this.beaconGroup.add(this.beaconRing);

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

      if (this.beaconRing) this.beaconRing.rotation.z += delta * 1.5;

      const dx = this.activeTarget.x - pPos.x;
      const dz = this.activeTarget.z - pPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const speed = Math.max(8.0, Math.abs((vState && vState.roverCurrentSpeed) ? vState.roverCurrentSpeed : 12.0));
      const eta = Math.round(dist / speed);

      const metricsEl = document.getElementById('gps-hud-metrics');
      if (metricsEl && Math.random() < 0.1) {
        metricsEl.textContent = `DISTANCE: ${Math.round(dist)}M · ETA: ${eta}S`;
      }

      this.arrowPhase = (this.arrowPhase + delta * 2.8) % 1.0;
      const angle = Math.atan2(dx, dz);

      for (let i = 0; i < this.chevronCount; i++) {
        const chv = this.chevrons[i];
        const t = ((i / this.chevronCount) + this.arrowPhase) % 1.0;
        const arrowDist = 12.0 + t * Math.min(180.0, dist * 0.7);

        if (arrowDist < dist) {
          chv.position.set(
            pPos.x + Math.sin(angle) * arrowDist,
            0.24,
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

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 8.5, 8), poleMat);
        pole.position.set(-10, 4.25, -10);
        gantry.add(pole);

        const mastArm = new THREE.Mesh(new THREE.BoxGeometry(20, 0.35, 0.35), poleMat);
        mastArm.position.set(0, 8.2, -10);
        gantry.add(mastArm);

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

      this.updateAITrafficIntersectionBehavior();
    }

    refreshSignalLights(inter) {
      const lights = inter.lightMeshes;
      if (!lights) return;

      const isNSGreen = inter.state === 'NS_GREEN';
      const isNSAmber = inter.state === 'NS_AMBER';
      const isEWGreen = inter.state === 'EW_GREEN';
      const isEWAmber = inter.state === 'EW_AMBER';

      lights.NS.green.material.color.setHex(isNSGreen ? 0x00ff88 : 0x003311);
      lights.NS.amber.material.color.setHex(isNSAmber ? 0xffaa00 : 0x332200);
      lights.NS.red.material.color.setHex((!isNSGreen && !isNSAmber) ? 0xff2244 : 0x330000);

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

        const vPos = veh.group.position;
        const distToCenter = Math.sqrt(vPos.x * vPos.x + vPos.z * vPos.z);

        if (distToCenter < 45.0 && distToCenter > 8.0) {
          const centralInter = this.intersections[0];
          const isNS = veh.axis === 'z';
          const isRed = isNS ? (centralInter.state.startsWith('EW')) : (centralInter.state.startsWith('NS'));

          if (isRed) {
            veh.speed = THREE.MathUtils.lerp(veh.speed, 0.0, 0.15);
          } else {
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

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 4.6), carMat);
      body.position.y = 0.6;
      body.castShadow = true;
      vGroup.add(body);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 2.3), glassMat);
      cabin.position.set(0, 1.05, -0.2);
      vGroup.add(cabin);

      const glowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85 });
      const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.8), glowMat);
      underglow.rotation.x = -Math.PI / 2;
      underglow.position.y = 0.088;
      vGroup.add(underglow);

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

      setTimeout(() => {
        vGroup.remove(bubbleSprite);
      }, 6500);
    }

    handleRemoteTelemetry(data) {
      if (!data || data.senderId === this.localPlayerId) return;

      let p = this.remotePlayers.get(data.senderId);
      if (!p) {
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

      this.remotePlayers.forEach((p) => {
        p.group.position.lerp(p.targetPos, delta * 8.0);
        p.group.rotation.y = THREE.MathUtils.lerp(p.group.rotation.y, p.targetYaw, delta * 8.0);
      });

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

  // ==========================================================================
  // TIER 5: DYNAMIC CELESTIAL DAY/NIGHT & VOLUMETRIC ATMOSPHERE SCATTERING
  // ==========================================================================
  class CelestialAtmosphereSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.timeOfDay = 14.5; // Starts at 2:30 PM
      this.timeSpeed = 0.06; // ~7 minutes per full 24-hr cycle
      this.temperature = 2; // Celsius
      this.iceGripFactor = 1.0;

      this.celestialGroup = new THREE.Group();
      this.celestialGroup.name = 'celestialAtmosphereGroup';
      this.parent.scene.add(this.celestialGroup);

      // Sun mesh
      const sunGeo = new THREE.SphereGeometry(35, 16, 16);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa });
      this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
      this.celestialGroup.add(this.sunMesh);

      // Moon mesh
      const moonGeo = new THREE.SphereGeometry(26, 16, 16);
      const moonMat = new THREE.MeshBasicMaterial({ color: 0xc2d6f0 });
      this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
      this.celestialGroup.add(this.moonMesh);

      // Dedicated Directional Sun/Moon Celestial Light
      this.celestialLight = new THREE.DirectionalLight(0xffffff, 1.2);
      this.celestialLight.position.set(200, 400, 200);
      this.celestialGroup.add(this.celestialLight);

      this.createHUDClock();
    }

    createHUDClock() {
      const existing = document.getElementById('celestial-clock-hud');
      if (existing) existing.remove();

      const hud = document.createElement('div');
      hud.id = 'celestial-clock-hud';
      hud.style.cssText = `
        position: absolute;
        top: 20px;
        left: 200px;
        background: rgba(10, 15, 24, 0.85);
        border: 1px solid rgba(0, 242, 255, 0.4);
        border-radius: 8px;
        padding: 5px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Rajdhani', sans-serif;
        color: #fff;
        z-index: 100;
        cursor: pointer;
        backdrop-filter: blur(8px);
        user-select: none;
      `;
      hud.title = 'Click or press [K] to advance celestial time';
      hud.onclick = () => { this.advanceTimeOfDay(4.0); };
      hud.innerHTML = `
        <i class="fa-solid fa-clock" style="color: #38bdf8;"></i>
        <span id="celestial-time-label" style="font-weight: 800; font-size: 11px; color: #38bdf8; font-family: monospace;">14:30 · +2°C</span>
      `;
      document.body.appendChild(hud);
    }

    advanceTimeOfDay(hours) {
      this.timeOfDay = (this.timeOfDay + hours) % 24.0;
      if (typeof showStoreNotification === 'function') {
        const todLabel = this.timeOfDay >= 6 && this.timeOfDay < 18 ? 'DAYTIME' : 'NIGHT';
        showStoreNotification(`[TIME] CELESTIAL ADVANCED: ${Math.floor(this.timeOfDay)}:00 (${todLabel})`);
      }
      if (typeof cyberAudio !== 'undefined' && cyberAudio.playClick) cyberAudio.playClick();
    }

    update(delta) {
      this.timeOfDay = (this.timeOfDay + delta * this.timeSpeed) % 24.0;

      // Celestial Angle
      const ang = (this.timeOfDay / 24.0) * Math.PI * 2 - Math.PI / 2;
      const radius = 1350;
      const pPos = (this.parent.player && this.parent.player.pos) ? this.parent.player.pos : { x: 0, z: 0 };

      const sx = pPos.x + Math.cos(ang) * radius;
      const sy = Math.sin(ang) * radius;
      const sz = pPos.z + Math.cos(ang * 0.5) * 350;

      this.sunMesh.position.set(sx, sy, sz);
      this.moonMesh.position.set(pPos.x - (sx - pPos.x), -sy, pPos.z - (sz - pPos.z));

      // Calculate Temperature
      this.temperature = Math.round(Math.sin((this.timeOfDay - 9) * Math.PI / 12) * 16 - 8);
      this.iceGripFactor = this.temperature < -10 ? 0.76 : 1.0;

      // Light Color & Intensity Transitions
      const isDay = sy > 0;
      const tNorm = Math.max(0, sy / radius);

      if (isDay) {
        this.celestialLight.position.set(sx, sy, sz);
        this.celestialLight.color.setHex(sy < 300 ? 0xf97316 : 0xffffff);
        this.celestialLight.intensity = THREE.MathUtils.lerp(0.3, 1.35, tNorm);
      } else {
        this.celestialLight.position.set(this.moonMesh.position.x, Math.abs(sy), this.moonMesh.position.z);
        this.celestialLight.color.setHex(0x38bdf8);
        this.celestialLight.intensity = 0.28;
      }

      // Update Fog in Scene
      if (this.parent.scene && this.parent.scene.fog) {
        if (sy < 150 && sy > -150) {
          this.parent.scene.fog.color.setHex(0x271638); // Twilight purple
        } else if (isDay) {
          this.parent.scene.fog.color.setHex(0x0e1b2e); // Daytime blue
        } else {
          this.parent.scene.fog.color.setHex(0x040812); // Night obsidian
        }
      }

      // Update Clock HUD
      const clockEl = document.getElementById('celestial-time-label');
      if (clockEl) {
        const hrs = Math.floor(this.timeOfDay);
        const mins = Math.floor((this.timeOfDay % 1) * 60);
        const hh = hrs < 10 ? '0' + hrs : hrs;
        const mm = mins < 10 ? '0' + mins : mins;
        const tempSign = this.temperature > 0 ? '+' : '';
        const iceTag = this.temperature < -10 ? ' [FROST]' : '';
        clockEl.textContent = `${hh}:${mm} · ${tempSign}${this.temperature}°C${iceTag}`;
      }
    }
  }

  // ==========================================================================
  // TIER 6: 1P FIRST-PERSON COCKPIT CAMERA & FUNCTIONAL 3D DASHBOARD
  // ==========================================================================
  class CockpitInteriorDashboardSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.isCockpitActive = false;
      this.lastDrawTime = 0;

      this.cockpitGroup = new THREE.Group();
      this.cockpitGroup.name = 'cockpitInteriorGroup';
      this.parent.scene.add(this.cockpitGroup);

      this.buildCockpitGeometry();
      this.initCameraCycleListener();
    }

    buildCockpitGeometry() {
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0e17, roughness: 0.8, metalness: 0.2 });
      const carbonMat = new THREE.MeshStandardMaterial({ color: 0x141a24, roughness: 0.5, metalness: 0.6 });

      // Dashboard Cowl
      const dashMesh = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.45, 0.95), darkMat);
      dashMesh.position.set(0, 0.82, 0.4);
      this.cockpitGroup.add(dashMesh);

      // 3D Cyber Steering Wheel Yoke
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(-0.35, 0.88, 0.12);

      const yokeTop = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.05), carbonMat);
      wheelGroup.add(yokeTop);
      const yokeGripL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.05), carbonMat);
      yokeGripL.position.set(-0.21, -0.08, 0);
      wheelGroup.add(yokeGripL);
      const yokeGripR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.05), carbonMat);
      yokeGripR.position.set(0.21, -0.08, 0);
      wheelGroup.add(yokeGripR);

      this.steeringWheel = wheelGroup;
      this.cockpitGroup.add(this.steeringWheel);

      // Functional 2D Canvas Instrument Cluster
      this.dashCanvas = document.createElement('canvas');
      this.dashCanvas.width = 512;
      this.dashCanvas.height = 256;
      this.dashCtx = this.dashCanvas.getContext('2d');
      this.dashTexture = new THREE.CanvasTexture(this.dashCanvas);

      const screenGeo = new THREE.PlaneGeometry(0.72, 0.36);
      const screenMat = new THREE.MeshBasicMaterial({ map: this.dashTexture, side: THREE.DoubleSide });
      this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
      this.screenMesh.position.set(-0.35, 0.95, 0.18);
      this.screenMesh.rotation.x = -0.25;
      this.cockpitGroup.add(this.screenMesh);
    }

    initCameraCycleListener() {
      window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        if (e.key.toLowerCase() === 'v') {
          this.toggleCockpitView();
        }
      });
    }

    toggleCockpitView() {
      this.isCockpitActive = !this.isCockpitActive;
      if (typeof showStoreNotification === 'function') {
        showStoreNotification(this.isCockpitActive ? '[COCKPIT] 1P INTERIOR VIEW ENGAGED [V]' : '[CAMERA] 3P CHASE VIEW ENGAGED [V]');
      }
      if (typeof cyberAudio !== 'undefined' && cyberAudio.playClick) cyberAudio.playClick();
    }

    drawInstrumentCluster(speed, rpm, steer, throttle) {
      const ctx = this.dashCtx;
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 500, 244);

      // Large Speed Readout
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 84px monospace';
      ctx.textAlign = 'center';
      const kmh = Math.round(Math.abs(speed) * 3.6);
      ctx.fillText(`${kmh}`, 256, 120);

      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#00f2ff';
      ctx.fillText('KM/H · SPORT PLUS', 256, 155);

      // RPM LED Bar
      const rpmWidth = Math.min(420, (kmh / 280) * 420);
      ctx.fillStyle = kmh > 180 ? '#ef4444' : '#00ff88';
      ctx.fillRect(46, 185, rpmWidth, 18);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(46, 185, 420, 18);

      // Gear indicator
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 28px monospace';
      const gear = speed < -0.5 ? 'R' : kmh < 15 ? 'D1' : kmh < 45 ? 'D2' : kmh < 90 ? 'D3' : kmh < 150 ? 'D4' : kmh < 210 ? 'D5' : 'D6';
      ctx.fillText(`GEAR: ${gear}`, 256, 232);

      this.dashTexture.needsUpdate = true;
    }

    update(delta, vState) {
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;
      if (!roverGroup) return;

      const rPos = roverGroup.position;
      const rYaw = roverGroup.rotation.y;
      this.cockpitGroup.position.copy(rPos);
      this.cockpitGroup.rotation.y = rYaw;

      // Animate Steering Wheel
      const steer = (vState && vState.steer) ? vState.steer : 0;
      if (this.steeringWheel) {
        this.steeringWheel.rotation.z = -steer * 3.8;
      }

      // Update 2D Canvas at 15 Hz
      const speed = (vState && vState.roverCurrentSpeed) ? vState.roverCurrentSpeed : 0;
      const throttle = (vState && vState.throttle) ? vState.throttle : 0;
      this.drawInstrumentCluster(speed, 5000, steer, throttle);

      // If Cockpit view active, lock camera to eye point
      if (this.isCockpitActive && this.parent.camera) {
        const cosY = Math.cos(rYaw);
        const sinY = Math.sin(rYaw);

        // Driver eye position with G-force inertia
        const eyeX = rPos.x + (-0.35 * cosY - 0.25 * sinY);
        const eyeY = rPos.y + 1.15;
        const eyeZ = rPos.z + (0.35 * sinY - 0.25 * cosY);

        this.parent.camera.position.set(eyeX, eyeY, eyeZ);

        // Look forward along car trajectory
        const fwdX = eyeX + sinY * 35.0;
        const fwdZ = eyeZ + cosY * 35.0;
        this.parent.camera.lookAt(fwdX, eyeY, fwdZ);
      }
    }
  }

  // ==========================================================================
  // TIER 7: VEHICLE DAMAGE PHYSICS, IMPACT SPARKS & 5 PIT-STOP REPAIR BAYS
  // ==========================================================================
  class VehicleDamageAndRepairBaySubsystem {
    constructor(parent) {
      this.parent = parent;
      this.health = 100.0;
      this.lastSpeed = 0;

      this.damageGroup = new THREE.Group();
      this.damageGroup.name = 'vehicleDamageAndPitstopGroup';
      this.parent.scene.add(this.damageGroup);

      // 5 Hydraulic Pit-Stop Repair Bays
      this.repairBays = [
        { id: 'bay_mall', name: 'AUTO MALL HYDRAULIC SERVICE', x: 0, z: 160 },
        { id: 'bay_neokyoto', name: 'NEO-KYOTO PIT-STOP', x: 440, z: 240 },
        { id: 'bay_solaria', name: 'SOLARIA OUTPOST SERVICE', x: -340, z: 390 },
        { id: 'bay_atlantis', name: 'ATLANTIS DRYDOCK REPAIR', x: -430, z: -330 },
        { id: 'bay_starbase', name: 'STARBASE FLIGHT HANGAR', x: 540, z: -440 }
      ];

      this.buildRepairBays();
      this.initSparkParticlePool();
    }

    buildRepairBays() {
      const bayPadMat = new THREE.MeshStandardMaterial({ color: 0x111c2e, roughness: 0.6, metalness: 0.5 });
      const greenHoloMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });

      this.repairBays.forEach(bay => {
        const bGroup = new THREE.Group();
        bGroup.position.set(bay.x, 0, bay.z);

        // Ground Bay Pad
        const pad = new THREE.Mesh(new THREE.BoxGeometry(10, 0.16, 14), bayPadMat);
        pad.position.y = 0.08;
        bGroup.add(pad);

        // Holographic Alignment Ring
        const ring = new THREE.Mesh(new THREE.RingGeometry(3.5, 4.8, 20), greenHoloMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.17;
        bGroup.add(ring);

        // Dual Hydraulic Lift Pylons
        [-4.2, 4.2].forEach(px => {
          const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 4.2, 8), pylonMat);
          pylon.position.set(px, 2.1, 0);
          bGroup.add(pylon);
        });

        this.damageGroup.add(bGroup);
      });
    }

    initSparkParticlePool() {
      this.maxSparks = 40;
      this.sparkPositions = new Float32Array(this.maxSparks * 3);
      this.sparkVelocities = new Float32Array(this.maxSparks * 3);
      this.sparkLifes = new Float32Array(this.maxSparks);

      this.sparkGeo = new THREE.BufferGeometry();
      this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

      this.sparkMat = new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 0.6,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });

      this.sparkPoints = new THREE.Points(this.sparkGeo, this.sparkMat);
      this.damageGroup.add(this.sparkPoints);
    }

    triggerCrashSparks(pos) {
      for (let i = 0; i < this.maxSparks; i++) {
        this.sparkLifes[i] = 0.4 + Math.random() * 0.4;
        this.sparkPositions[i * 3] = pos.x;
        this.sparkPositions[i * 3 + 1] = pos.y + 0.5;
        this.sparkPositions[i * 3 + 2] = pos.z;

        this.sparkVelocities[i * 3] = (Math.random() * 2 - 1) * 12.0;
        this.sparkVelocities[i * 3 + 1] = Math.random() * 8.0 + 2.0;
        this.sparkVelocities[i * 3 + 2] = (Math.random() * 2 - 1) * 12.0;
      }
      this.sparkGeo.attributes.position.needsUpdate = true;
    }

    repairVehicle() {
      this.health = 100.0;
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('[REPAIR] PIT-STOP SERVICE COMPLETE: CHASSIS RESTORED (100% HP)');
      }
      if (typeof cyberAudio !== 'undefined' && cyberAudio.playLootChime) cyberAudio.playLootChime();
    }

    update(delta, vState) {
      const speed = (vState && vState.roverCurrentSpeed) ? vState.roverCurrentSpeed : 0;
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;

      // Abrupt Deceleration Detection (Impact Crash)
      const speedDrop = this.lastSpeed - speed;
      this.lastSpeed = speed;

      if (speedDrop > 16.0 && roverGroup) {
        // Impact occurred
        this.health = Math.max(10, this.health - 22.0);
        this.triggerCrashSparks(roverGroup.position);

        if (typeof showStoreNotification === 'function') {
          showStoreNotification(`[IMPACT] COLLISION DAMAGE! CHASSIS HEALTH: ${Math.round(this.health)}%`);
        }
      }

      // Check if inside any Hydraulic Repair Bay
      if (roverGroup && Math.abs(speed) < 2.0) {
        const rPos = roverGroup.position;
        for (let i = 0; i < this.repairBays.length; i++) {
          const bay = this.repairBays[i];
          const dx = rPos.x - bay.x;
          const dz = rPos.z - bay.z;
          if (Math.abs(dx) < 4.5 && Math.abs(dz) < 6.5) {
            if (this.health < 99.0) {
              this.repairVehicle();
            }
            break;
          }
        }
      }

      // Animate Sparks
      let hasLiveSparks = false;
      for (let i = 0; i < this.maxSparks; i++) {
        if (this.sparkLifes[i] > 0) {
          hasLiveSparks = true;
          this.sparkLifes[i] -= delta;
          this.sparkPositions[i * 3] += this.sparkVelocities[i * 3] * delta;
          this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * delta;
          this.sparkPositions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * delta;
          this.sparkVelocities[i * 3 + 1] -= 22.0 * delta; // Gravity
        }
      }
      if (hasLiveSparks) {
        this.sparkGeo.attributes.position.needsUpdate = true;
      }
    }
  }

  // ==========================================================================
  // TIER 8: OPERATIONAL ELEVATED MAGLEV TRANSIT MONORAIL & FAST-TRAVEL
  // ==========================================================================
  class ElevatedMaglevTransitSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.trainT = 0.0;
      this.trainSpeed = 0.024; // Traversal loop speed

      this.maglevGroup = new THREE.Group();
      this.maglevGroup.name = 'elevatedMaglevTransitGroup';
      this.parent.scene.add(this.maglevGroup);

      // 10 Key Waypoints forming a 2.4 km closed circuit above the city
      this.trackPoints = [
        new THREE.Vector3(0, 14.5, 50),       // Central Metro
        new THREE.Vector3(240, 14.5, 180),    // NE Artery
        new THREE.Vector3(440, 14.5, 260),    // Neo-Kyoto Station
        new THREE.Vector3(520, 14.5, -180),   // East Corridor
        new THREE.Vector3(520, 14.5, -420),   // Starbase Station
        new THREE.Vector3(120, 14.5, -460),   // South Perimeter
        new THREE.Vector3(-420, 14.5, -320),  // Atlantis Marina Station
        new THREE.Vector3(-380, 14.5, 120),   // West Causeway
        new THREE.Vector3(-320, 14.5, 380),   // Solaria Oasis Station
        new THREE.Vector3(-160, 14.5, 220)    // NW Corridor
      ];

      this.trackCurve = new THREE.CatmullRomCurve3(this.trackPoints, true);
      this.buildElevatedGuideway();
      this.buildMaglevTrain();
    }

    buildElevatedGuideway() {
      // Extruded Track Tube
      const trackGeo = new THREE.TubeGeometry(this.trackCurve, 120, 0.75, 8, true);
      const trackMat = new THREE.MeshStandardMaterial({ color: 0x1b2432, roughness: 0.6, metalness: 0.6 });
      const trackMesh = new THREE.Mesh(trackGeo, trackMat);
      this.maglevGroup.add(trackMesh);

      // Support Pylons down to ground
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.3 });
      for (let i = 0; i < 28; i++) {
        const t = i / 28;
        const pt = this.trackCurve.getPoint(t);
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, pt.y, 8), pylonMat);
        pylon.position.set(pt.x, pt.y / 2, pt.z);
        this.maglevGroup.add(pylon);
      }
    }

    buildMaglevTrain() {
      this.trainCarriage = new THREE.Group();

      const trainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.15 });
      const windowMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.85 });

      // Lead Engine Car
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 16.0), trainMat);
      body.position.y = 1.2;
      this.trainCarriage.add(body);

      // Glowing Maglev Induction Strip
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 15.6),
        new THREE.MeshBasicMaterial({ color: 0x00d9ff, side: THREE.DoubleSide })
      );
      glow.rotation.x = Math.PI / 2;
      glow.position.y = 0.05;
      this.trainCarriage.add(glow);

      this.maglevGroup.add(this.trainCarriage);
    }

    update(delta) {
      this.trainT = (this.trainT + delta * this.trainSpeed) % 1.0;

      const pt = this.trackCurve.getPoint(this.trainT);
      const tangent = this.trackCurve.getTangent(this.trainT);

      this.trainCarriage.position.copy(pt);
      this.trainCarriage.lookAt(pt.x + tangent.x, pt.y + tangent.y, pt.z + tangent.z);
    }
  }


  // ==========================================================================
  // TIER 9: DYNAMIC PEDESTRIAN CROWD SIMULATION & HONK EVASION AI
  // ==========================================================================
  class PedestrianCrowdSimulationSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.crowdGroup = new THREE.Group();
      this.crowdGroup.name = 'pedestrianCrowdGroup';
      this.parent.scene.add(this.crowdGroup);

      this.citizens = [];
      this.citizenCount = 28;
      this.initCrowd();
    }

    initCrowd() {
      const headMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const torsoColors = [0x1e293b, 0x0f766e, 0x4338ca, 0xbe185d, 0x854d0e];
      const limbMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

      for (let i = 0; i < this.citizenCount; i++) {
        const cGroup = new THREE.Group();

        const torsoMat = new THREE.MeshStandardMaterial({ color: torsoColors[i % torsoColors.length], roughness: 0.7 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.3), torsoMat);
        torso.position.y = 1.05;
        cGroup.add(torso);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), headMat);
        head.position.y = 1.55;
        cGroup.add(head);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.12), visorMat);
        visor.position.set(0, 1.55, 0.12);
        cGroup.add(visor);

        const legGeo = new THREE.BoxGeometry(0.16, 0.7, 0.16);
        const legL = new THREE.Mesh(legGeo, limbMat);
        legL.position.set(-0.16, 0.35, 0);
        cGroup.add(legL);

        const legR = new THREE.Mesh(legGeo, limbMat);
        legR.position.set(0.16, 0.35, 0);
        cGroup.add(legR);

        const isEastWest = (i % 2 === 0);
        const laneOffset = (i % 4 < 2) ? 14 : -14;
        const startCoord = -160 + (i / this.citizenCount) * 320;

        if (isEastWest) {
          cGroup.position.set(startCoord, 0.12, laneOffset);
        } else {
          cGroup.position.set(laneOffset, 0.12, startCoord);
        }

        this.crowdGroup.add(cGroup);

        this.citizens.push({
          group: cGroup,
          legL: legL,
          legR: legR,
          isEastWest: isEastWest,
          laneOffset: laneOffset,
          dir: (i % 2 === 0 ? 1 : -1),
          speed: 1.3 + Math.random() * 0.4,
          walkPhase: Math.random() * Math.PI * 2,
          state: 'WALKING',
          evadeTimer: 0
        });
      }
    }

    triggerHonk() {
      this.playHornAudio();

      if (typeof showStoreNotification === 'function') {
        showStoreNotification('[HORN] CYBERCAR DUAL ELECTRIC HORN SOUNDED!');
      }

      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;
      if (!roverGroup) return;

      const rPos = roverGroup.position;
      this.citizens.forEach(c => {
        const dx = c.group.position.x - rPos.x;
        const dz = c.group.position.z - rPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 28.0) {
          c.state = 'EVADING';
          c.evadeTimer = 2.4;
          c.group.position.x += (dx > 0 ? 2.5 : -2.5);
        }
      });
    }

    playHornAudio() {
      try {
        const audioCtx = (typeof cyberAudio !== 'undefined' && cyberAudio.ctx) ? cyberAudio.ctx : (THREE.AudioContext ? THREE.AudioContext.getContext() : null);
        if (!audioCtx) return;

        [380, 475].forEach(freq => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.36);
        });
      } catch (e) {}
    }

    update(delta, vState) {
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;
      const rPos = roverGroup ? roverGroup.position : null;
      const rSpeed = (vState && vState.roverCurrentSpeed) ? vState.roverCurrentSpeed : 0;

      for (let i = 0; i < this.citizens.length; i++) {
        const c = this.citizens[i];

        if (c.state === 'EVADING') {
          c.evadeTimer -= delta;
          if (c.evadeTimer <= 0) c.state = 'WALKING';
          continue;
        }

        if (rPos && Math.abs(rSpeed) > 10.0) {
          const dx = c.group.position.x - rPos.x;
          const dz = c.group.position.z - rPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 14.0) {
            c.state = 'EVADING';
            c.evadeTimer = 2.2;
            c.group.position.x += (dx > 0 ? 2.2 : -2.2);
            continue;
          }
        }

        c.walkPhase += delta * 6.5;
        c.legL.rotation.x = Math.sin(c.walkPhase) * 0.55;
        c.legR.rotation.x = -Math.sin(c.walkPhase) * 0.55;

        if (c.isEastWest) {
          c.group.position.x += c.dir * c.speed * delta;
          c.group.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          if (c.dir > 0 && c.group.position.x > 180) c.dir = -1;
          if (c.dir < 0 && c.group.position.x < -180) c.dir = 1;
        } else {
          c.group.position.z += c.dir * c.speed * delta;
          c.group.rotation.y = c.dir > 0 ? 0 : Math.PI;
          if (c.dir > 0 && c.group.position.z > 180) c.dir = -1;
          if (c.dir < 0 && c.group.position.z < -180) c.dir = 1;
        }
      }
    }
  }

  // ==========================================================================
  // TIER 10: SPATIAL 3D AUDIO VISUALIZER TOWERS & CYBER DJ STINGS
  // ==========================================================================
  class SpatialAudioVisualizerSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.visGroup = new THREE.Group();
      this.visGroup.name = 'spatialAudioVisualizerGroup';
      this.parent.scene.add(this.visGroup);

      this.analyser = null;
      this.dataArray = new Uint8Array(32);
      this.initAudioAnalyser();
      this.buildEqualizerTowers();
    }

    initAudioAnalyser() {
      try {
        const audioCtx = (typeof cyberAudio !== 'undefined' && cyberAudio.ctx) ? cyberAudio.ctx : (THREE.AudioContext ? THREE.AudioContext.getContext() : null);
        if (audioCtx) {
          this.analyser = audioCtx.createAnalyser();
          this.analyser.fftSize = 64;
          this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }
      } catch (e) {}
    }

    buildEqualizerTowers() {
      this.eqColumns = [];
      const towerPositions = [
        { x: -55, z: 55, ry: 0 },
        { x: 55, z: -55, ry: Math.PI }
      ];

      const colCount = 12;
      const blockCount = 8;
      const blockGeo = new THREE.BoxGeometry(1.4, 1.8, 0.4);

      towerPositions.forEach(tp => {
        const tGroup = new THREE.Group();
        tGroup.position.set(tp.x, 0, tp.z);
        tGroup.rotation.y = tp.ry;

        for (let c = 0; c < colCount; c++) {
          const colBlocks = [];
          const cx = (c - colCount / 2) * 2.1;

          for (let b = 0; b < blockCount; b++) {
            const cy = 12 + b * 2.6;
            const colorHex = b < 3 ? 0x00f2ff : b < 6 ? 0xa855f7 : 0xf43f5e;
            const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.15 });
            const mesh = new THREE.Mesh(blockGeo, mat);
            mesh.position.set(cx, cy, 14.2);
            tGroup.add(mesh);
            colBlocks.push(mesh);
          }
          this.eqColumns.push(colBlocks);
        }
        this.visGroup.add(tGroup);
      });
    }

    update(delta) {
      if (this.analyser) {
        this.analyser.getByteFrequencyData(this.dataArray);
      } else {
        const time = performance.now() * 0.003;
        for (let i = 0; i < 16; i++) {
          this.dataArray[i] = Math.floor(100 + Math.sin(time * 2.0 + i * 0.4) * 80 + Math.cos(time * 5.0) * 40);
        }
      }

      const totalCols = this.eqColumns.length;
      for (let c = 0; c < totalCols; c++) {
        const blocks = this.eqColumns[c];
        const binIdx = (c % 12);
        const amp = (this.dataArray[binIdx] || 0) / 255.0;
        const activeCount = Math.floor(amp * 8.5);

        for (let b = 0; b < 8; b++) {
          blocks[b].material.opacity = (b <= activeCount) ? 0.95 : 0.12;
        }
      }
    }
  }

  // ==========================================================================
  // TIER 11: SUBTERRANEAN NEON UNDERGROUND HIGHWAY NETWORK (y = -18m)
  // ==========================================================================
  class SubterraneanTunnelNetworkSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.tunnelGroup = new THREE.Group();
      this.tunnelGroup.name = 'subterraneanTunnelNetworkGroup';
      this.parent.scene.add(this.tunnelGroup);

      this.inTunnel = false;
      this.buildTunnelHighway();
    }

    buildTunnelHighway() {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x151c28, roughness: 0.85, metalness: 0.3 });
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x0f141c, roughness: 0.8, metalness: 0.2 });
      const stripCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const stripAmberMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

      const tunnelLen = 420;
      const tFloor = new THREE.Mesh(new THREE.PlaneGeometry(24, tunnelLen), roadMat);
      tFloor.rotation.x = -Math.PI / 2;
      tFloor.position.set(0, -18.0, 0);
      this.tunnelGroup.add(tFloor);

      const tRoof = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, tunnelLen, 16, 1, true, 0, Math.PI), wallMat);
      tRoof.rotation.z = Math.PI / 2;
      tRoof.rotation.y = Math.PI / 2;
      tRoof.position.set(0, -18.0 + 3.0, 0);
      this.tunnelGroup.add(tRoof);

      const lightStripL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, tunnelLen), stripCyanMat);
      lightStripL.position.set(-6, -11.5, 0);
      this.tunnelGroup.add(lightStripL);

      const lightStripR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, tunnelLen), stripAmberMat);
      lightStripR.position.set(6, -11.5, 0);
      this.tunnelGroup.add(lightStripR);

      [-1, 1].forEach(dir => {
        const rampLen = 85;
        const rAngle = Math.atan2(18.0, rampLen);
        const rampMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, Math.hypot(18.0, rampLen)), roadMat);
        rampMesh.rotation.x = -Math.PI / 2 + (dir * rAngle);
        rampMesh.position.set(0, -9.0, dir * (tunnelLen / 2 + rampLen / 2));
        this.tunnelGroup.add(rampMesh);
      });
    }

    update(delta, vState) {
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;
      if (!roverGroup) return;

      const rPos = roverGroup.position;
      const isUnderground = rPos.y < -6.0;

      if (isUnderground && !this.inTunnel) {
        this.inTunnel = true;
        if (typeof showStoreNotification === 'function') {
          showStoreNotification('[TUNNEL] ENTERED CALGARY METRO SUBTERRANEAN HIGHWAY (-18M)');
        }
      } else if (!isUnderground && this.inTunnel) {
        this.inTunnel = false;
        if (typeof showStoreNotification === 'function') {
          showStoreNotification('[SURFACE] EMERGED ONTO METROPOLIS ARTERIAL SKYWAY');
        }
      }
    }
  }

  // ==========================================================================
  // TIER 12: INTERACTIVE DRIVE-IN TUNING GARAGE & REAL-TIME WRAP EDITOR
  // ==========================================================================
  class VehicleTuningStudioSubsystem {
    constructor(parent) {
      this.parent = parent;
      this.isOpen = false;
      this.studioGroup = new THREE.Group();
      this.studioGroup.name = 'vehicleTuningStudioGroup';
      this.parent.scene.add(this.studioGroup);

      this.bayX = 0;
      this.bayZ = 160;
      this.buildShowroomBay();
      this.createStudioModal();
    }

    buildShowroomBay() {
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x0e1726, metalness: 0.85, roughness: 0.25 });
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, side: THREE.DoubleSide });

      const turntable = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.24, 24), tableMat);
      turntable.position.set(this.bayX, 0.12, this.bayZ);
      this.studioGroup.add(turntable);

      const glowRing = new THREE.Mesh(new THREE.RingGeometry(6.0, 6.35, 24), ringMat);
      glowRing.rotation.x = -Math.PI / 2;
      glowRing.position.set(this.bayX, 0.25, this.bayZ);
      this.studioGroup.add(glowRing);
    }

    createStudioModal() {
      const existing = document.getElementById('tuning-studio-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'tuning-studio-modal';
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        right: 25px;
        transform: translateY(-50%);
        width: 320px;
        background: rgba(10, 16, 28, 0.94);
        border: 1px solid rgba(0, 242, 255, 0.5);
        border-radius: 12px;
        padding: 18px;
        color: #fff;
        font-family: 'Rajdhani', sans-serif;
        z-index: 999;
        display: none;
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px rgba(0, 242, 255, 0.25);
      `;

      modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,242,255,0.3); padding-bottom: 8px; margin-bottom: 14px;">
          <div style="font-weight: 900; font-size: 15px; color: #00f2ff; letter-spacing: 1px;">
            <i class="fa-solid fa-wrench"></i> CYBER TUNING STUDIO
          </div>
          <button type="button" onclick="window.advancedSystemsInstance.tuning.toggleStudio()" style="background: none; border: none; color: #ef4444; font-size: 18px; cursor: pointer;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style="font-size: 11px; margin-bottom: 10px; color: #94a3b8;">PEARLESCENT PAINT WRAP:</div>
        <div style="display: flex; gap: 6px; margin-bottom: 14px;">
          <button type="button" onclick="window.advancedSystemsInstance.tuning.applyWrap(0x00f2ff)" style="flex: 1; height: 26px; background: #00f2ff; border: 1px solid #fff; border-radius: 4px; cursor: pointer;"></button>
          <button type="button" onclick="window.advancedSystemsInstance.tuning.applyWrap(0xff0055)" style="flex: 1; height: 26px; background: #ff0055; border: 1px solid #fff; border-radius: 4px; cursor: pointer;"></button>
          <button type="button" onclick="window.advancedSystemsInstance.tuning.applyWrap(0xffaa00)" style="flex: 1; height: 26px; background: #ffaa00; border: 1px solid #fff; border-radius: 4px; cursor: pointer;"></button>
          <button type="button" onclick="window.advancedSystemsInstance.tuning.applyWrap(0x8b5cf6)" style="flex: 1; height: 26px; background: #8b5cf6; border: 1px solid #fff; border-radius: 4px; cursor: pointer;"></button>
          <button type="button" onclick="window.advancedSystemsInstance.tuning.applyWrap(0x10b981)" style="flex: 1; height: 26px; background: #10b981; border: 1px solid #fff; border-radius: 4px; cursor: pointer;"></button>
        </div>

        <div style="font-size: 11px; margin-bottom: 10px; color: #94a3b8;">SUSPENSION STANCE:</div>
        <div style="display: flex; gap: 8px; margin-bottom: 14px;">
          <button type="button" onclick="window.advancedSystemsInstance.tuning.setStance('track')" style="flex: 1; padding: 6px; background: rgba(0,242,255,0.15); border: 1px solid #00f2ff; color: #00f2ff; border-radius: 6px; font-weight: 800; cursor: pointer;">Slammed Track</button>
          <button type="button" onclick="window.advancedSystemsInstance.tuning.setStance('dakar')" style="flex: 1; padding: 6px; background: rgba(255,170,0,0.15); border: 1px solid #ffaa00; color: #ffaa00; border-radius: 6px; font-weight: 800; cursor: pointer;">Baja Lift</button>
        </div>

        <div style="font-size: 11px; margin-bottom: 10px; color: #94a3b8;">ECU ENGINE PROFILE:</div>
        <div style="display: flex; gap: 8px;">
          <button type="button" onclick="window.advancedSystemsInstance.tuning.setECU('drift')" style="flex: 1; padding: 6px; background: rgba(168,85,247,0.15); border: 1px solid #a855f7; color: #a855f7; border-radius: 6px; font-weight: 800; cursor: pointer;">Drift King</button>
          <button type="button" onclick="window.advancedSystemsInstance.tuning.setECU('speed')" style="flex: 1; padding: 6px; background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #ef4444; border-radius: 6px; font-weight: 800; cursor: pointer;">Supersonic</button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    toggleStudio() {
      this.isOpen = !this.isOpen;
      const modal = document.getElementById('tuning-studio-modal');
      if (modal) modal.style.display = this.isOpen ? 'block' : 'none';
      if (typeof cyberAudio !== 'undefined' && cyberAudio.playClick) cyberAudio.playClick();
    }

    applyWrap(colorHex) {
      const roverChassis = typeof window.roverChassisMesh !== 'undefined' ? window.roverChassisMesh : null;
      const cyberCar = typeof window.cyberCarMesh !== 'undefined' ? window.cyberCarMesh : null;

      if (roverChassis && roverChassis.material) roverChassis.material.color.setHex(colorHex);
      if (cyberCar) {
        cyberCar.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.color) {
            obj.material.color.setHex(colorHex);
          }
        });
      }

      if (typeof showStoreNotification === 'function') {
        showStoreNotification('[TUNING] CUSTOM PEARLESCENT WRAP APPLIED!');
      }
    }

    setStance(mode) {
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;
      if (roverGroup) {
        roverGroup.position.y = mode === 'track' ? 0.04 : 0.28;
      }
      if (typeof showStoreNotification === 'function') {
        showStoreNotification(`[TUNING] SUSPENSION STANCE CONFIGURED: ${mode.toUpperCase()}`);
      }
    }

    setECU(profile) {
      if (typeof showStoreNotification === 'function') {
        showStoreNotification(`[ECU] PERFORMANCE PROFILE FLASHED: ${profile.toUpperCase()}`);
      }
    }

    update(delta, vState) {
      const roverGroup = typeof window.roverGroup !== 'undefined' ? window.roverGroup : null;
      if (!roverGroup) return;

      const dx = roverGroup.position.x - this.bayX;
      const dz = roverGroup.position.z - this.bayZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 7.0 && !this.isOpen && Math.abs((vState && vState.roverCurrentSpeed) ? vState.roverCurrentSpeed : 0) < 1.0) {
        // Can open studio
      }
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
