/**
 * AstroShift: Beyond Earth — Pooled 60 FPS Combat, Physics, Vehicles & WebAudio Engine
 * Zero-GC runtime architecture compatible with Three.js r128.
 * Exposes window.AstroCombatPhysics = { createSession(scene, worldApi, opts) }
 */
(function (global) {
  'use strict';

  var THREE_REF = global.THREE || null;

  // Pool capacities (fixed, zero runtime allocation)
  var LASER_POOL_SIZE = 64;
  var MISSILE_POOL_SIZE = 16;
  var PARTICLE_POOL_SIZE = 60;
  var ENEMY_POOL_SIZE = 18;

  var VALID_MODES = { operative: true, starfighter: true, rover: true };

  // Pre-allocated module-level scratch math objects (available when THREE is present)
  var _v1 = null;
  var _v2 = null;
  var _v3 = null;
  var _v4 = null;
  var _v5 = null;
  var _v6 = null;
  var _forward = null;
  var _right = null;
  var _up = null;
  var _camPos = null;
  var _camTarget = null;
  var _mat4 = null;
  var _quat = null;
  var _euler = null;
  var _scale = null;
  var _zeroScale = null;
  var _colorTmp = null;
  var _colorEnemyBase = null;
  var _colorEnemyFlash = null;
  var _colorBoltPlayer = null;
  var _colorBoltEnemy = null;
  var _colorParticleHot = null;
  var _colorParticleSpark = null;
  var _colorParticleSmoke = null;
  var _scratchReady = false;

  function ensureScratch(T) {
    if (_scratchReady || !T) return;
    _v1 = new T.Vector3();
    _v2 = new T.Vector3();
    _v3 = new T.Vector3();
    _v4 = new T.Vector3();
    _v5 = new T.Vector3();
    _v6 = new T.Vector3();
    _forward = new T.Vector3();
    _right = new T.Vector3();
    _up = new T.Vector3(0, 1, 0);
    _camPos = new T.Vector3();
    _camTarget = new T.Vector3();
    _mat4 = new T.Matrix4();
    _quat = new T.Quaternion();
    _euler = new T.Euler(0, 0, 0, 'YXZ');
    _scale = new T.Vector3(1, 1, 1);
    _zeroScale = new T.Vector3(0, 0, 0);
    _colorTmp = new T.Color();
    _colorEnemyBase = new T.Color(0xff2a55);
    _colorEnemyFlash = new T.Color(0xffffff);
    _colorBoltPlayer = new T.Color(0x00f2ff);
    _colorBoltEnemy = new T.Color(0xff4422);
    _colorParticleHot = new T.Color(0xffaa22);
    _colorParticleSpark = new T.Color(0x00f2ff);
    _colorParticleSmoke = new T.Color(0xff3355);
    _scratchReady = true;
  }

  function safeNum(v, fallback) {
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function dampFactor(rate, dt) {
    return 1 - Math.exp(-rate * dt);
  }

  function lerpAngle(a, b, t) {
    var diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  function sanitizeVec3(v, fx, fy, fz) {
    if (!Number.isFinite(v.x)) v.x = fx;
    if (!Number.isFinite(v.y)) v.y = fy;
    if (!Number.isFinite(v.z)) v.z = fz;
  }

  // --------------------------------------------------------------------------
  // Procedural WebAudio Synth (zero external assets, lazy unlock)
  // --------------------------------------------------------------------------
  function createAudioSynth(initialEnabled) {
    var enabled = initialEnabled !== false;
    var ctx = null;
    var masterGain = null;
    var noiseBuffer = null;
    var engineOsc = null;
    var engineGain = null;
    var engineFilter = null;
    var disposed = false;

    function ensureContext() {
      if (disposed || !enabled) return null;
      if (!ctx) {
        var AudioCtx = global.AudioContext || global.webkitAudioContext;
        if (!AudioCtx) return null;
        try {
          ctx = new AudioCtx();
          masterGain = ctx.createGain();
          masterGain.gain.value = enabled ? 0.32 : 0.0;
          masterGain.connect(ctx.destination);

          // Pre-build 0.4s white noise buffer once
          var len = Math.floor(ctx.sampleRate * 0.4);
          noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
          var data = noiseBuffer.getChannelData(0);
          for (var i = 0; i < len; i++) {
            data[i] = Math.random() * 2 - 1;
          }

          // Continuous subtle engine hum oscillator
          engineOsc = ctx.createOscillator();
          engineOsc.type = 'sawtooth';
          engineOsc.frequency.value = 55;

          engineFilter = ctx.createBiquadFilter();
          engineFilter.type = 'lowpass';
          engineFilter.frequency.value = 180;

          engineGain = ctx.createGain();
          engineGain.gain.value = 0.0;

          engineOsc.connect(engineFilter);
          engineFilter.connect(engineGain);
          engineGain.connect(masterGain);
          engineOsc.start();
        } catch (e) {
          ctx = null;
          return null;
        }
      }
      if (ctx && ctx.state === 'suspended') {
        try { ctx.resume(); } catch (e) {}
      }
      return ctx;
    }

    function setEnabled(on) {
      enabled = !!on;
      if (masterGain && ctx) {
        masterGain.gain.setTargetAtTime(enabled ? 0.32 : 0.0, ctx.currentTime, 0.03);
      }
      if (!enabled && engineGain && ctx) {
        engineGain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.03);
      }
      if (enabled) ensureContext();
    }

    function playLaser() {
      var c = ensureContext();
      if (!c || !masterGain) return;
      var now = c.currentTime;
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.085);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.095);
    }

    function playMissile() {
      var c = ensureContext();
      if (!c || !masterGain) return;
      var now = c.currentTime;
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.24);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.26);

      if (noiseBuffer) {
        var src = c.createBufferSource();
        src.buffer = noiseBuffer;
        var flt = c.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.setValueAtTime(900, now);
        flt.frequency.exponentialRampToValueAtTime(280, now + 0.22);
        var ng = c.createGain();
        ng.gain.setValueAtTime(0.2, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
        src.connect(flt);
        flt.connect(ng);
        ng.connect(masterGain);
        src.start(now);
        src.stop(now + 0.24);
      }
    }

    function playHit() {
      var c = ensureContext();
      if (!c || !masterGain) return;
      var now = c.currentTime;
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.045);
      g.gain.setValueAtTime(0.14, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.055);
    }

    function playShield() {
      var c = ensureContext();
      if (!c || !masterGain) return;
      var now = c.currentTime;
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.2);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.23);
    }

    function playExplosion() {
      var c = ensureContext();
      if (!c || !masterGain) return;
      var now = c.currentTime;
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.32);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.35);

      if (noiseBuffer) {
        var src = c.createBufferSource();
        src.buffer = noiseBuffer;
        var flt = c.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(750, now);
        flt.frequency.exponentialRampToValueAtTime(110, now + 0.34);
        var ng = c.createGain();
        ng.gain.setValueAtTime(0.28, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        src.connect(flt);
        flt.connect(ng);
        ng.connect(masterGain);
        src.start(now);
        src.stop(now + 0.36);
      }
    }

    function updateEngineHum(speed, mode, active) {
      if (!ctx || !engineOsc || !engineGain || !engineFilter) return;
      var now = ctx.currentTime;
      if (!enabled || !active) {
        engineGain.gain.setTargetAtTime(0.0, now, 0.05);
        return;
      }
      var baseFreq = mode === 'starfighter' ? 72 : (mode === 'rover' ? 48 : 38);
      var freqScale = mode === 'starfighter' ? 1.8 : 1.1;
      var targetFreq = clamp(baseFreq + speed * freqScale, 36, 240);
      var targetGain = mode === 'operative'
        ? clamp(speed * 0.0022, 0.0, 0.05)
        : clamp(0.03 + speed * 0.0014, 0.02, 0.09);
      engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
      engineFilter.frequency.setTargetAtTime(targetFreq * 2.6, now, 0.08);
      engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
    }

    function dispose() {
      disposed = true;
      try {
        if (engineOsc) engineOsc.stop();
        if (ctx && typeof ctx.close === 'function') ctx.close();
      } catch (e) {}
      ctx = null;
      masterGain = null;
      engineOsc = null;
      engineGain = null;
      engineFilter = null;
      noiseBuffer = null;
    }

    return {
      unlock: ensureContext,
      setEnabled: setEnabled,
      playLaser: playLaser,
      playMissile: playMissile,
      playHit: playHit,
      playShield: playShield,
      playExplosion: playExplosion,
      updateEngineHum: updateEngineHum,
      dispose: dispose
    };
  }

  // --------------------------------------------------------------------------
  // Vehicle Visual Rig Builder (built once per session, zero runtime alloc)
  // --------------------------------------------------------------------------
  function buildPlayerRigs(T, disposables) {
    var root = new T.Group();
    root.name = 'AstroPlayerRoot';

    function trackGeo(g) { disposables.geos.push(g); return g; }
    function trackMat(m) { disposables.mats.push(m); return m; }

    var matArmor = trackMat(new T.MeshStandardMaterial({ color: 0x1b2838, metalness: 0.65, roughness: 0.35 }));
    var matTrim = trackMat(new T.MeshStandardMaterial({ color: 0x00f2ff, emissive: 0x0088aa, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.25 }));
    var matDark = trackMat(new T.MeshStandardMaterial({ color: 0x0c1118, metalness: 0.5, roughness: 0.6 }));
    var matGlow = trackMat(new T.MeshBasicMaterial({ color: 0x00f2ff }));
    var matThruster = trackMat(new T.MeshBasicMaterial({ color: 0xff8800 }));

    // 1. Exo-Operative
    var opGroup = new T.Group();
    var opTorso = new T.Mesh(trackGeo(new T.BoxGeometry(0.68, 0.9, 0.42)), matArmor);
    opTorso.position.y = 0.2;
    opGroup.add(opTorso);

    var opHead = new T.Mesh(trackGeo(new T.BoxGeometry(0.42, 0.42, 0.44)), matArmor);
    opHead.position.y = 0.88;
    opGroup.add(opHead);

    var opVisor = new T.Mesh(trackGeo(new T.BoxGeometry(0.36, 0.16, 0.08)), matGlow);
    opVisor.position.set(0, 0.9, -0.21);
    opGroup.add(opVisor);

    var opPack = new T.Mesh(trackGeo(new T.BoxGeometry(0.5, 0.62, 0.24)), matDark);
    opPack.position.set(0, 0.25, 0.28);
    opGroup.add(opPack);

    var opFlameL = new T.Mesh(trackGeo(new T.ConeGeometry(0.11, 0.45, 6)), matThruster);
    opFlameL.rotation.x = Math.PI;
    opFlameL.position.set(-0.14, -0.22, 0.28);
    opFlameL.visible = false;
    opGroup.add(opFlameL);

    var opFlameR = new T.Mesh(trackGeo(new T.ConeGeometry(0.11, 0.45, 6)), matThruster);
    opFlameR.rotation.x = Math.PI;
    opFlameR.position.set(0.14, -0.22, 0.28);
    opFlameR.visible = false;
    opGroup.add(opFlameR);

    root.add(opGroup);

    // 2. Starfighter
    var jetGroup = new T.Group();
    var jetBody = new T.Mesh(trackGeo(new T.ConeGeometry(0.75, 4.4, 6)), matArmor);
    jetBody.rotation.x = -Math.PI / 2;
    jetGroup.add(jetBody);

    var jetWing = new T.Mesh(trackGeo(new T.BoxGeometry(4.6, 0.12, 1.5)), matArmor);
    jetWing.position.set(0, -0.05, 0.45);
    jetGroup.add(jetWing);

    var jetWingTipL = new T.Mesh(trackGeo(new T.BoxGeometry(0.25, 0.35, 1.3)), matTrim);
    jetWingTipL.position.set(-2.25, 0.08, 0.5);
    jetGroup.add(jetWingTipL);

    var jetWingTipR = new T.Mesh(trackGeo(new T.BoxGeometry(0.25, 0.35, 1.3)), matTrim);
    jetWingTipR.position.set(2.25, 0.08, 0.5);
    jetGroup.add(jetWingTipR);

    var jetCanopy = new T.Mesh(trackGeo(new T.BoxGeometry(0.55, 0.36, 1.35)), matGlow);
    jetCanopy.position.set(0, 0.38, -0.35);
    jetGroup.add(jetCanopy);

    var jetFlame = new T.Mesh(trackGeo(new T.ConeGeometry(0.36, 1.4, 8)), matThruster);
    jetFlame.rotation.x = Math.PI / 2;
    jetFlame.position.set(0, 0, 2.55);
    jetGroup.add(jetFlame);

    jetGroup.visible = false;
    root.add(jetGroup);

    // 3. Tactical Rover
    var roverGroup = new T.Group();
    var roverChassis = new T.Mesh(trackGeo(new T.BoxGeometry(2.1, 0.72, 3.6)), matArmor);
    roverChassis.position.y = 0.62;
    roverGroup.add(roverChassis);

    var roverCab = new T.Mesh(trackGeo(new T.BoxGeometry(1.55, 0.56, 1.7)), matTrim);
    roverCab.position.set(0, 1.18, -0.15);
    roverGroup.add(roverCab);

    var wheelGeo = trackGeo(new T.CylinderGeometry(0.54, 0.54, 0.42, 12));
    wheelGeo.rotateZ(Math.PI / 2);
    var wheelPositions = [
      [-1.18, 0.54, -1.25],
      [1.18, 0.54, -1.25],
      [-1.18, 0.54, 1.25],
      [1.18, 0.54, 1.25]
    ];
    var wheels = [];
    for (var w = 0; w < 4; w++) {
      var wm = new T.Mesh(wheelGeo, matDark);
      wm.position.set(wheelPositions[w][0], wheelPositions[w][1], wheelPositions[w][2]);
      roverGroup.add(wm);
      wheels.push(wm);
    }

    roverGroup.visible = false;
    root.add(roverGroup);

    return {
      root: root,
      operative: opGroup,
      opFlameL: opFlameL,
      opFlameR: opFlameR,
      starfighter: jetGroup,
      jetFlame: jetFlame,
      rover: roverGroup,
      roverWheels: wheels
    };
  }

  // --------------------------------------------------------------------------
  // Session Factory
  // --------------------------------------------------------------------------
  function createSession(scene, worldApi, opts) {
    var T = global.THREE || THREE_REF;
    if (!T) {
      throw new Error('AstroCombatPhysics requires Three.js (THREE) to be loaded.');
    }
    ensureScratch(T);

    opts = opts || {};
    var camera = opts.camera || (scene && scene.userData && scene.userData.camera) || global.camera || null;
    var firstPerson = !!opts.firstPerson;
    var disposables = { geos: [], mats: [] };

    function safeGroundHeight(x, z) {
      if (worldApi && typeof worldApi.getGroundHeight === 'function') {
        var h = worldApi.getGroundHeight(x, z);
        if (typeof h === 'number' && Number.isFinite(h)) return h;
      }
      return 0;
    }

    function safeWorldCollision(pos, radius) {
      if (worldApi && typeof worldApi.checkWorldCollision === 'function') {
        return worldApi.checkWorldCollision(pos, radius);
      }
      return false;
    }

    var audio = createAudioSynth(opts.audioEnabled !== false);
    var rigs = buildPlayerRigs(T, disposables);
    if (scene && typeof scene.add === 'function') {
      scene.add(rigs.root);
    }

    // ------------------------------------------------------------------------
    // Pre-allocated InstancedMesh Pools (ZERO runtime new Mesh / dispose)
    // ------------------------------------------------------------------------
    var boltGeo = new T.BoxGeometry(0.16, 0.16, 1.9);
    var boltMat = new T.MeshBasicMaterial({ color: 0xffffff });
    var boltMesh = new T.InstancedMesh(boltGeo, boltMat, LASER_POOL_SIZE);
    boltMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    boltMesh.frustumCulled = false;

    var missileGeo = new T.ConeGeometry(0.24, 1.35, 6);
    missileGeo.rotateX(Math.PI / 2);
    var missileMat = new T.MeshBasicMaterial({ color: 0xff9900 });
    var missileMesh = new T.InstancedMesh(missileGeo, missileMat, MISSILE_POOL_SIZE);
    missileMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    missileMesh.frustumCulled = false;

    var particleGeo = new T.OctahedronGeometry(0.32, 0);
    var particleMat = new T.MeshBasicMaterial({ color: 0xffffff });
    var particleMesh = new T.InstancedMesh(particleGeo, particleMat, PARTICLE_POOL_SIZE);
    particleMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    particleMesh.frustumCulled = false;

    var enemyHullGeo = new T.OctahedronGeometry(1.45, 0);
    var enemyHullMat = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.55, roughness: 0.35 });
    var enemyHullMesh = new T.InstancedMesh(enemyHullGeo, enemyHullMat, ENEMY_POOL_SIZE);
    enemyHullMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    enemyHullMesh.frustumCulled = false;

    var enemyCoreGeo = new T.BoxGeometry(0.85, 0.85, 2.3);
    var enemyCoreMat = new T.MeshBasicMaterial({ color: 0xffaa00 });
    var enemyCoreMesh = new T.InstancedMesh(enemyCoreGeo, enemyCoreMat, ENEMY_POOL_SIZE);
    enemyCoreMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    enemyCoreMesh.frustumCulled = false;

    disposables.geos.push(boltGeo, missileGeo, particleGeo, enemyHullGeo, enemyCoreGeo);
    disposables.mats.push(boltMat, missileMat, particleMat, enemyHullMat, enemyCoreMat);

    // Initialize instance colors & zero matrices
    _mat4.compose(_v1.set(0, -9999, 0), _quat.identity(), _zeroScale);
    var idx;
    for (idx = 0; idx < LASER_POOL_SIZE; idx++) {
      boltMesh.setMatrixAt(idx, _mat4);
      boltMesh.setColorAt(idx, _colorBoltPlayer);
    }
    for (idx = 0; idx < MISSILE_POOL_SIZE; idx++) {
      missileMesh.setMatrixAt(idx, _mat4);
    }
    for (idx = 0; idx < PARTICLE_POOL_SIZE; idx++) {
      particleMesh.setMatrixAt(idx, _mat4);
      particleMesh.setColorAt(idx, _colorParticleHot);
    }
    for (idx = 0; idx < ENEMY_POOL_SIZE; idx++) {
      enemyHullMesh.setMatrixAt(idx, _mat4);
      enemyHullMesh.setColorAt(idx, _colorEnemyBase);
      enemyCoreMesh.setMatrixAt(idx, _mat4);
    }

    if (scene && typeof scene.add === 'function') {
      scene.add(boltMesh);
      scene.add(missileMesh);
      scene.add(particleMesh);
      scene.add(enemyHullMesh);
      scene.add(enemyCoreMesh);
    }

    // Typed-array backing stores for pools
    var boltActive = new Uint8Array(LASER_POOL_SIZE);
    var boltTeam = new Uint8Array(LASER_POOL_SIZE); // 0 = player, 1 = enemy
    var boltPos = new Float32Array(LASER_POOL_SIZE * 3);
    var boltVel = new Float32Array(LASER_POOL_SIZE * 3);
    var boltLife = new Float32Array(LASER_POOL_SIZE);
    var boltCursor = 0;

    var misActive = new Uint8Array(MISSILE_POOL_SIZE);
    var misPos = new Float32Array(MISSILE_POOL_SIZE * 3);
    var misVel = new Float32Array(MISSILE_POOL_SIZE * 3);
    var misLife = new Float32Array(MISSILE_POOL_SIZE);
    var misTarget = new Int16Array(MISSILE_POOL_SIZE);
    var misCursor = 0;

    var partActive = new Uint8Array(PARTICLE_POOL_SIZE);
    var partPos = new Float32Array(PARTICLE_POOL_SIZE * 3);
    var partVel = new Float32Array(PARTICLE_POOL_SIZE * 3);
    var partLife = new Float32Array(PARTICLE_POOL_SIZE);
    var partMaxLife = new Float32Array(PARTICLE_POOL_SIZE);
    var partSize = new Float32Array(PARTICLE_POOL_SIZE);
    var partCursor = 0;

    var enActive = new Uint8Array(ENEMY_POOL_SIZE);
    var enPos = new Float32Array(ENEMY_POOL_SIZE * 3);
    var enVel = new Float32Array(ENEMY_POOL_SIZE * 3);
    var enHp = new Float32Array(ENEMY_POOL_SIZE);
    var enFlash = new Float32Array(ENEMY_POOL_SIZE);
    var enFireCd = new Float32Array(ENEMY_POOL_SIZE);
    var enPhase = new Float32Array(ENEMY_POOL_SIZE);

    // ------------------------------------------------------------------------
    // Player & Combat State
    // ------------------------------------------------------------------------
    var state = {
      vehicleMode: VALID_MODES[opts.initialMode] ? opts.initialMode : 'operative',
      pos: new T.Vector3(0, 2, 0),
      vel: new T.Vector3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      roll: 0,
      roverPitch: 0,
      roverRoll: 0,
      grounded: false,
      jetFuel: 100,

      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      shieldRegenDelay: 0,
      shieldRegenNotified: false,
      hitFlash: 0,

      ammo: 12,
      maxAmmo: 12,
      ammoRegenTimer: 0,
      heat: 0,
      overheated: false,
      primaryCd: 0,
      missileCd: 0,

      score: 0,
      wave: 1,
      kills: 0,
      speed: 0,
      altitude: 0,
      gameOver: false,
      waveDelayTimer: 0,
      simTime: 0,
      disposed: false
    };

    // Pre-allocated HUD snapshot object (mutated in-place or shallow-copied)
    var hudSnapshot = {
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      ammo: 12,
      heat: 0,
      score: 0,
      wave: 1,
      kills: 0,
      speed: 0,
      altitude: 0,
      vehicleMode: 'operative',
      gameOver: false
    };

    // ------------------------------------------------------------------------
    // Pool Spawners
    // ------------------------------------------------------------------------
    function spawnParticles(x, y, z, count, speedScale, sizeScale, isExplosion) {
      for (var i = 0; i < count; i++) {
        var idx = partCursor;
        partCursor = (partCursor + 1) % PARTICLE_POOL_SIZE;
        partActive[idx] = 1;
        var i3 = idx * 3;
        partPos[i3] = x;
        partPos[i3 + 1] = y;
        partPos[i3 + 2] = z;

        var theta = Math.random() * Math.PI * 2;
        var phi = Math.acos(2 * Math.random() - 1);
        var spd = (0.35 + Math.random() * 0.85) * speedScale;
        partVel[i3] = Math.sin(phi) * Math.cos(theta) * spd;
        partVel[i3 + 1] = Math.cos(phi) * spd + (isExplosion ? 2.5 : 0.8);
        partVel[i3 + 2] = Math.sin(phi) * Math.sin(theta) * spd;

        var ml = (isExplosion ? 0.45 : 0.22) + Math.random() * 0.28;
        partLife[idx] = ml;
        partMaxLife[idx] = ml;
        partSize[idx] = sizeScale * (0.6 + Math.random() * 0.8);

        particleMesh.setColorAt(
          idx,
          isExplosion ? (i % 2 === 0 ? _colorParticleHot : _colorParticleSmoke) : _colorParticleSpark
        );
      }
      if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;
    }

    function spawnBolt(ox, oy, oz, dx, dy, dz, speed, team) {
      var idx = boltCursor;
      boltCursor = (boltCursor + 1) % LASER_POOL_SIZE;
      boltActive[idx] = 1;
      boltTeam[idx] = team;
      var i3 = idx * 3;
      boltPos[i3] = ox;
      boltPos[i3 + 1] = oy;
      boltPos[i3 + 2] = oz;
      boltVel[i3] = dx * speed;
      boltVel[i3 + 1] = dy * speed;
      boltVel[i3 + 2] = dz * speed;
      boltLife[idx] = team === 0 ? 1.45 : 2.2;
      boltMesh.setColorAt(idx, team === 0 ? _colorBoltPlayer : _colorBoltEnemy);
      if (boltMesh.instanceColor) boltMesh.instanceColor.needsUpdate = true;
    }

    function findNearestEnemy(px, py, pz) {
      var bestIdx = -1;
      var bestDistSq = 1e12;
      for (var i = 0; i < ENEMY_POOL_SIZE; i++) {
        if (!enActive[i]) continue;
        var i3 = i * 3;
        var dx = enPos[i3] - px;
        var dy = enPos[i3 + 1] - py;
        var dz = enPos[i3 + 2] - pz;
        var d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    function spawnWave(waveNum) {
      var count = Math.min(ENEMY_POOL_SIZE, 4 + waveNum * 2);
      var hp = 35 + waveNum * 12;
      for (var i = 0; i < count; i++) {
        enActive[i] = 1;
        var angle = (i / count) * Math.PI * 2 + Math.random() * 0.35;
        var dist = 48 + Math.random() * 38;
        var ex = state.pos.x + Math.cos(angle) * dist;
        var ez = state.pos.z + Math.sin(angle) * dist;
        var groundY = safeGroundHeight(ex, ez);
        var ey = Math.max(groundY + 12, state.pos.y + 6 + Math.random() * 14);
        var i3 = i * 3;
        enPos[i3] = ex;
        enPos[i3 + 1] = ey;
        enPos[i3 + 2] = ez;
        enVel[i3] = 0;
        enVel[i3 + 1] = 0;
        enVel[i3 + 2] = 0;
        enHp[i] = hp;
        enFlash[i] = 0;
        enFireCd[i] = 0.8 + Math.random() * 1.8;
        enPhase[i] = Math.random() * Math.PI * 2;
        enemyHullMesh.setColorAt(i, _colorEnemyBase);
      }
      for (var j = count; j < ENEMY_POOL_SIZE; j++) {
        enActive[j] = 0;
      }
      if (enemyHullMesh.instanceColor) enemyHullMesh.instanceColor.needsUpdate = true;
    }

    // ------------------------------------------------------------------------
    // Aim Direction Helper (writes into _forward)
    // ------------------------------------------------------------------------
    function computeAimDirection(outVec) {
      _euler.set(state.pitch, state.yaw, 0, 'YXZ');
      outVec.set(0, 0, -1).applyEuler(_euler).normalize();
      return outVec;
    }

    function applyDamageToPlayer(amount) {
      if (state.gameOver) return;
      state.shieldRegenDelay = 3.5;
      state.shieldRegenNotified = false;
      state.hitFlash = 0.18;

      if (state.shield > 0) {
        var absorbed = Math.min(state.shield, amount);
        state.shield -= absorbed;
        amount -= absorbed;
      }
      if (amount > 0) {
        state.health = Math.max(0, state.health - amount);
      }
      if (state.health <= 0) {
        state.gameOver = true;
        state.vel.set(0, 0, 0);
        spawnParticles(state.pos.x, state.pos.y + 0.8, state.pos.z, 24, 18, 1.4, true);
        audio.playExplosion();
        audio.updateEngineHum(0, state.vehicleMode, false);
        if (typeof opts.onGameOver === 'function') opts.onGameOver(getHudSnapshot());
      }
    }

    // ------------------------------------------------------------------------
    // Public Actions
    // ------------------------------------------------------------------------
    function firePrimary() {
      if (state.disposed || state.gameOver) return false;
      audio.unlock();
      if (state.overheated || state.primaryCd > 0) return false;

      computeAimDirection(_forward);
      var muzzleY = state.vehicleMode === 'operative' ? 0.65 : (state.vehicleMode === 'rover' ? 1.25 : 0.0);
      var ox = state.pos.x + _forward.x * 1.6;
      var oy = state.pos.y + muzzleY + _forward.y * 1.6;
      var oz = state.pos.z + _forward.z * 1.6;

      var boltSpeed = state.vehicleMode === 'starfighter' ? 165 : 135;
      spawnBolt(ox, oy, oz, _forward.x, _forward.y, _forward.z, boltSpeed, 0);

      state.primaryCd = state.vehicleMode === 'starfighter' ? 0.095 : 0.12;
      state.heat = Math.min(100, state.heat + 7.5);
      if (state.heat >= 100) {
        state.overheated = true;
      }
      audio.playLaser();
      return true;
    }

    function fireMissile() {
      if (state.disposed || state.gameOver) return false;
      audio.unlock();
      if (state.ammo <= 0 || state.missileCd > 0) return false;

      var idx = misCursor;
      misCursor = (misCursor + 1) % MISSILE_POOL_SIZE;
      computeAimDirection(_forward);

      misActive[idx] = 1;
      var i3 = idx * 3;
      misPos[i3] = state.pos.x + _forward.x * 2.0;
      misPos[i3 + 1] = state.pos.y + 0.9 + _forward.y * 2.0;
      misPos[i3 + 2] = state.pos.z + _forward.z * 2.0;
      misVel[i3] = _forward.x * 68;
      misVel[i3 + 1] = _forward.y * 68;
      misVel[i3 + 2] = _forward.z * 68;
      misLife[idx] = 3.6;
      misTarget[idx] = findNearestEnemy(state.pos.x, state.pos.y, state.pos.z);

      state.ammo -= 1;
      state.missileCd = 0.38;
      audio.playMissile();
      return true;
    }

    function switchVehicle(mode) {
      if (state.disposed) return state.vehicleMode;
      var normalized = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
      if (!VALID_MODES[normalized] || normalized === state.vehicleMode) {
        return state.vehicleMode;
      }
      audio.unlock();
      state.vehicleMode = normalized;

      rigs.operative.visible = normalized === 'operative';
      rigs.starfighter.visible = normalized === 'starfighter';
      rigs.rover.visible = normalized === 'rover';

      var groundY = safeGroundHeight(state.pos.x, state.pos.z);
      if (normalized === 'starfighter') {
        state.pos.y = Math.max(state.pos.y, groundY + 12);
        state.vel.y = Math.max(0, state.vel.y);
      } else if (normalized === 'rover') {
        state.pos.y = groundY;
        state.vel.y = 0;
        state.pitch = clamp(state.pitch, -0.45, 0.45);
        state.roll = 0;
      } else {
        state.pos.y = Math.max(state.pos.y, groundY + 1.1);
        state.roll = 0;
      }
      audio.playShield();
      return state.vehicleMode;
    }

    function setAudioEnabled(on) {
      audio.setEnabled(on);
    }

    function reset() {
      var i;
      for (i = 0; i < LASER_POOL_SIZE; i++) boltActive[i] = 0;
      for (i = 0; i < MISSILE_POOL_SIZE; i++) misActive[i] = 0;
      for (i = 0; i < PARTICLE_POOL_SIZE; i++) partActive[i] = 0;
      for (i = 0; i < ENEMY_POOL_SIZE; i++) enActive[i] = 0;

      var startGround = safeGroundHeight(0, 0);
      state.pos.set(0, state.vehicleMode === 'starfighter' ? startGround + 16 : startGround + 1.1, 0);
      state.vel.set(0, 0, 0);
      state.yaw = 0;
      state.pitch = 0;
      state.roll = 0;
      state.roverPitch = 0;
      state.roverRoll = 0;
      state.grounded = true;
      state.jetFuel = 100;

      state.health = state.maxHealth;
      state.shield = state.maxShield;
      state.shieldRegenDelay = 0;
      state.shieldRegenNotified = false;
      state.hitFlash = 0;

      state.ammo = state.maxAmmo;
      state.ammoRegenTimer = 0;
      state.heat = 0;
      state.overheated = false;
      state.primaryCd = 0;
      state.missileCd = 0;

      state.score = 0;
      state.wave = 1;
      state.kills = 0;
      state.speed = 0;
      state.altitude = state.pos.y - startGround;
      state.gameOver = false;
      state.waveDelayTimer = 0;

      spawnWave(1);
      syncVisuals(0.016);
    }

    // ------------------------------------------------------------------------
    // Per-Frame Simulation
    // ------------------------------------------------------------------------
    function updatePlayerPhysics(dt, input) {
      var moveX = 0;
      var moveZ = 0;
      var jump = false;
      var boost = false;
      var down = false;

      if (input) {
        if (typeof input.moveX === 'number' && Number.isFinite(input.moveX)) {
          moveX = clamp(input.moveX, -1, 1);
        } else {
          moveX = (input.right || input.d ? 1 : 0) - (input.left || input.a ? 1 : 0);
        }
        if (typeof input.moveZ === 'number' && Number.isFinite(input.moveZ)) {
          moveZ = clamp(input.moveZ, -1, 1);
        } else {
          moveZ = (input.forward || input.w ? 1 : 0) - (input.backward || input.s ? 1 : 0);
        }

        if (typeof input.aimYaw === 'number' && Number.isFinite(input.aimYaw)) {
          state.yaw = input.aimYaw;
        } else if (typeof input.deltaYaw === 'number' && Number.isFinite(input.deltaYaw)) {
          state.yaw += input.deltaYaw;
        } else if (typeof input.lookX === 'number' && Number.isFinite(input.lookX)) {
          state.yaw -= input.lookX * dt * 2.2;
        }

        if (typeof input.aimPitch === 'number' && Number.isFinite(input.aimPitch)) {
          state.pitch = clamp(input.aimPitch, -1.25, 1.25);
        } else if (typeof input.deltaPitch === 'number' && Number.isFinite(input.deltaPitch)) {
          state.pitch = clamp(state.pitch + input.deltaPitch, -1.25, 1.25);
        } else if (typeof input.lookY === 'number' && Number.isFinite(input.lookY)) {
          state.pitch = clamp(state.pitch - input.lookY * dt * 1.8, -1.25, 1.25);
        }

        jump = !!(input.jump || input.space || input.up);
        boost = !!(input.sprint || input.boost || input.shift);
        down = !!(input.crouch || input.down);

        if (input.switchVehicle || input.vehicleMode) {
          switchVehicle(input.switchVehicle || input.vehicleMode);
        }
      }

      // Compute horizontal basis from yaw
      var sinY = Math.sin(state.yaw);
      var cosY = Math.cos(state.yaw);
      _forward.set(-sinY, 0, -cosY);
      _right.set(cosY, 0, -sinY);

      if (state.vehicleMode === 'operative') {
        var maxSpd = boost ? 22 : 13.5;
        var wishX = _forward.x * moveZ + _right.x * moveX;
        var wishZ = _forward.z * moveZ + _right.z * moveX;
        var wishLen = Math.hypot(wishX, wishZ);
        if (wishLen > 1) {
          wishX /= wishLen;
          wishZ /= wishLen;
        }
        var accel = state.grounded ? 14 : 6;
        var f = dampFactor(accel, dt);
        state.vel.x += (wishX * maxSpd - state.vel.x) * f;
        state.vel.z += (wishZ * maxSpd - state.vel.z) * f;

        // Gravity & Jetpack jump
        if (jump && state.grounded) {
          state.vel.y = 11.5;
          state.grounded = false;
        } else if (jump && state.jetFuel > 0) {
          state.vel.y += 38 * dt;
          state.vel.y = Math.min(state.vel.y, 14);
          state.jetFuel = Math.max(0, state.jetFuel - 34 * dt);
          rigs.opFlameL.visible = true;
          rigs.opFlameR.visible = true;
        } else {
          rigs.opFlameL.visible = false;
          rigs.opFlameR.visible = false;
          state.vel.y -= 26 * dt;
        }

        state.pos.x += state.vel.x * dt;
        state.pos.y += state.vel.y * dt;
        state.pos.z += state.vel.z * dt;

        var gY = safeGroundHeight(state.pos.x, state.pos.z) + 1.1;
        if (state.pos.y <= gY) {
          state.pos.y = gY;
          if (state.vel.y < 0) state.vel.y = 0;
          state.grounded = true;
          state.jetFuel = Math.min(100, state.jetFuel + 42 * dt);
        } else {
          state.grounded = false;
        }
        state.roll = lerpAngle(state.roll, -moveX * 0.08, dampFactor(10, dt));

      } else if (state.vehicleMode === 'starfighter') {
        // Yaw steering with A/D or moveX, pitch with W/S or look
        state.yaw -= moveX * 1.9 * dt;
        var targetRoll = clamp(-moveX * 0.65, -0.75, 0.75);
        state.roll = lerpAngle(state.roll, targetRoll, dampFactor(7, dt));

        if (jump) state.pitch = clamp(state.pitch + 1.15 * dt, -1.1, 1.1);
        if (down) state.pitch = clamp(state.pitch - 1.15 * dt, -1.1, 1.1);

        var targetSpd = boost ? 82 : (moveZ > 0 ? 54 : (moveZ < 0 ? 22 : 36));
        computeAimDirection(_v1);
        _v2.copy(_v1).multiplyScalar(targetSpd);
        var jf = dampFactor(5.5, dt);
        state.vel.lerp(_v2, jf);
        state.pos.addScaledVector(state.vel, dt);

        var minFlightY = safeGroundHeight(state.pos.x, state.pos.z) + 4.5;
        if (state.pos.y < minFlightY) {
          state.pos.y = minFlightY;
          if (state.vel.y < 0) state.vel.y = 0;
        } else if (state.pos.y > 420) {
          state.pos.y = 420;
          if (state.vel.y > 0) state.vel.y = 0;
        }
        rigs.jetFlame.scale.set(1, boost ? 1.85 : 1.0, 1);

      } else {
        // Tactical Rover: high-traction steering + terrain height alignment
        var forwardSpd = state.vel.x * _forward.x + state.vel.z * _forward.z;
        var steerSign = forwardSpd >= -0.5 ? 1 : -1;
        if (Math.abs(moveZ) > 0.05 || Math.abs(forwardSpd) > 0.6) {
          state.yaw -= moveX * 2.15 * steerSign * dt;
        }
        sinY = Math.sin(state.yaw);
        cosY = Math.cos(state.yaw);
        _forward.set(-sinY, 0, -cosY);
        _right.set(cosY, 0, -sinY);

        var targetDrive = moveZ * (boost ? 38 : 26);
        var rf = dampFactor(6.5, dt);
        var newFwdSpd = forwardSpd + (targetDrive - forwardSpd) * rf;
        state.vel.x = _forward.x * newFwdSpd;
        state.vel.z = _forward.z * newFwdSpd;
        state.vel.y = 0;

        state.pos.x += state.vel.x * dt;
        state.pos.z += state.vel.z * dt;

        var rgY = safeGroundHeight(state.pos.x, state.pos.z);
        state.pos.y = rgY;

        // Sample 4 wheel points for terrain normal pitch/roll alignment
        var hF = safeGroundHeight(state.pos.x + _forward.x * 1.4, state.pos.z + _forward.z * 1.4);
        var hB = safeGroundHeight(state.pos.x - _forward.x * 1.4, state.pos.z - _forward.z * 1.4);
        var hL = safeGroundHeight(state.pos.x - _right.x * 1.2, state.pos.z - _right.z * 1.2);
        var hR = safeGroundHeight(state.pos.x + _right.x * 1.2, state.pos.z + _right.z * 1.2);
        var targetRoverPitch = Math.atan2(hF - hB, 2.8);
        var targetRoverRoll = Math.atan2(hL - hR, 2.4);
        var alignF = dampFactor(12, dt);
        state.roverPitch += (targetRoverPitch - state.roverPitch) * alignF;
        state.roverRoll += (targetRoverRoll - state.roverRoll) * alignF;

        for (var w = 0; w < 4; w++) {
          rigs.roverWheels[w].rotation.x -= newFwdSpd * dt * 1.6;
        }
      }

      // World obstacle collision push-out
      var colRadius = state.vehicleMode === 'operative' ? 0.85 : 2.1;
      var col = safeWorldCollision(state.pos, colRadius);
      if (col) {
        if (col === true) {
          state.pos.addScaledVector(state.vel, -dt * 1.2);
          state.vel.multiplyScalar(-0.25);
        } else if (col.hit) {
          if (col.pushOut) {
            state.pos.x += safeNum(col.pushOut.x, 0);
            state.pos.y += safeNum(col.pushOut.y, 0);
            state.pos.z += safeNum(col.pushOut.z, 0);
          } else if (col.normal) {
            var pen = safeNum(col.penetration, 0.25);
            state.pos.x += safeNum(col.normal.x, 0) * pen;
            state.pos.z += safeNum(col.normal.z, 0) * pen;
          }
          state.vel.multiplyScalar(0.5);
        }
      }

      sanitizeVec3(state.pos, 0, 2, 0);
      sanitizeVec3(state.vel, 0, 0, 0);

      var terrainHere = safeGroundHeight(state.pos.x, state.pos.z);
      state.speed = state.vel.length();
      state.altitude = Math.max(0, state.pos.y - terrainHere);

      if (input && (input.fire || input.firePrimary)) firePrimary();
      if (input && (input.missile || input.fireMissile)) fireMissile();
    }

    function updateProjectilesAndEnemies(dt) {
      var i, j, i3, j3, dx, dy, dz, distSq;

      // 1. Update laser bolts
      for (i = 0; i < LASER_POOL_SIZE; i++) {
        if (!boltActive[i]) continue;
        boltLife[i] -= dt;
        if (boltLife[i] <= 0) {
          boltActive[i] = 0;
          continue;
        }
        i3 = i * 3;
        boltPos[i3] += boltVel[i3] * dt;
        boltPos[i3 + 1] += boltVel[i3 + 1] * dt;
        boltPos[i3 + 2] += boltVel[i3 + 2] * dt;

        var bGround = safeGroundHeight(boltPos[i3], boltPos[i3 + 2]);
        if (boltPos[i3 + 1] <= bGround) {
          boltActive[i] = 0;
          spawnParticles(boltPos[i3], bGround + 0.1, boltPos[i3 + 2], 4, 8, 0.55, false);
          continue;
        }

        if (boltTeam[i] === 0) {
          // Player bolt vs enemies
          for (j = 0; j < ENEMY_POOL_SIZE; j++) {
            if (!enActive[j]) continue;
            j3 = j * 3;
            dx = boltPos[i3] - enPos[j3];
            dy = boltPos[i3 + 1] - enPos[j3 + 1];
            dz = boltPos[i3 + 2] - enPos[j3 + 2];
            if (dx * dx + dy * dy + dz * dz < 6.25) {
              boltActive[i] = 0;
              enHp[j] -= 22;
              enFlash[j] = 0.12;
              state.score += 15;
              audio.playHit();
              spawnParticles(boltPos[i3], boltPos[i3 + 1], boltPos[i3 + 2], 5, 11, 0.65, false);
              if (enHp[j] <= 0) {
                enActive[j] = 0;
                state.kills += 1;
                state.score += 120 + state.wave * 25;
                audio.playExplosion();
                spawnParticles(enPos[j3], enPos[j3 + 1], enPos[j3 + 2], 16, 18, 1.25, true);
              }
              break;
            }
          }
        } else {
          // Enemy bolt vs player
          dx = boltPos[i3] - state.pos.x;
          dy = boltPos[i3 + 1] - (state.pos.y + 0.8);
          dz = boltPos[i3 + 2] - state.pos.z;
          var pHitR = state.vehicleMode === 'operative' ? 1.85 : 2.6;
          if (dx * dx + dy * dy + dz * dz < pHitR * pHitR) {
            boltActive[i] = 0;
            spawnParticles(boltPos[i3], boltPos[i3 + 1], boltPos[i3 + 2], 6, 10, 0.7, false);
            applyDamageToPlayer(8 + Math.min(8, state.wave));
          }
        }
      }

      // 2. Update homing missiles
      for (i = 0; i < MISSILE_POOL_SIZE; i++) {
        if (!misActive[i]) continue;
        misLife[i] -= dt;
        if (misLife[i] <= 0) {
          misActive[i] = 0;
          continue;
        }
        i3 = i * 3;
        var tgt = misTarget[i];
        if (tgt < 0 || !enActive[tgt]) {
          tgt = findNearestEnemy(misPos[i3], misPos[i3 + 1], misPos[i3 + 2]);
          misTarget[i] = tgt;
        }
        if (tgt >= 0 && enActive[tgt]) {
          var t3 = tgt * 3;
          _v1.set(enPos[t3] - misPos[i3], enPos[t3 + 1] - misPos[i3 + 1], enPos[t3 + 2] - misPos[i3 + 2]);
          if (_v1.lengthSq() > 0.001) {
            _v1.normalize().multiplyScalar(78);
            var steerF = dampFactor(6.5, dt);
            misVel[i3] += (_v1.x - misVel[i3]) * steerF;
            misVel[i3 + 1] += (_v1.y - misVel[i3 + 1]) * steerF;
            misVel[i3 + 2] += (_v1.z - misVel[i3 + 2]) * steerF;
          }
        }
        misPos[i3] += misVel[i3] * dt;
        misPos[i3 + 1] += misVel[i3 + 1] * dt;
        misPos[i3 + 2] += misVel[i3 + 2] * dt;

        // Check missile impact
        var hitEnemy = false;
        for (j = 0; j < ENEMY_POOL_SIZE; j++) {
          if (!enActive[j]) continue;
          j3 = j * 3;
          dx = misPos[i3] - enPos[j3];
          dy = misPos[i3 + 1] - enPos[j3 + 1];
          dz = misPos[i3 + 2] - enPos[j3 + 2];
          if (dx * dx + dy * dy + dz * dz < 11.5) {
            hitEnemy = true;
            break;
          }
        }
        var mGround = safeGroundHeight(misPos[i3], misPos[i3 + 2]);
        if (hitEnemy || misPos[i3 + 1] <= mGround) {
          misActive[i] = 0;
          audio.playExplosion();
          spawnParticles(misPos[i3], misPos[i3 + 1], misPos[i3 + 2], 18, 22, 1.35, true);
          // Splash damage
          for (j = 0; j < ENEMY_POOL_SIZE; j++) {
            if (!enActive[j]) continue;
            j3 = j * 3;
            dx = misPos[i3] - enPos[j3];
            dy = misPos[i3 + 1] - enPos[j3 + 1];
            dz = misPos[i3 + 2] - enPos[j3 + 2];
            distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < 81) {
              enHp[j] -= 75;
              enFlash[j] = 0.16;
              state.score += 25;
              if (enHp[j] <= 0) {
                enActive[j] = 0;
                state.kills += 1;
                state.score += 150 + state.wave * 25;
              }
            }
          }
        }
      }

      // 3. Update enemy drones & wave progression
      var activeEnemies = 0;
      var enSpeed = 11 + Math.min(18, state.wave * 1.4);
      for (i = 0; i < ENEMY_POOL_SIZE; i++) {
        if (!enActive[i]) continue;
        activeEnemies++;
        i3 = i * 3;
        if (enFlash[i] > 0) {
          enFlash[i] = Math.max(0, enFlash[i] - dt);
        }

        dx = state.pos.x - enPos[i3];
        dy = (state.pos.y + 8) - enPos[i3 + 1];
        dz = state.pos.z - enPos[i3 + 2];
        var dist = Math.hypot(dx, dy, dz) || 1;
        var invD = 1 / dist;

        // Orbit + approach behavior
        var orbitSign = (i % 2 === 0) ? 1 : -1;
        var desiredApproach = dist > 36 ? 1.0 : (dist < 20 ? -0.6 : 0.15);
        var strafeX = -dz * invD * orbitSign;
        var strafeZ = dx * invD * orbitSign;
        var hoverY = Math.sin(state.simTime * 2.2 + enPhase[i]) * 2.4;

        var tx = (dx * invD * desiredApproach + strafeX * 0.75) * enSpeed;
        var ty = (dy * invD * 0.65) * enSpeed + hoverY;
        var tz = (dz * invD * desiredApproach + strafeZ * 0.75) * enSpeed;

        var ef = dampFactor(3.5, dt);
        enVel[i3] += (tx - enVel[i3]) * ef;
        enVel[i3 + 1] += (ty - enVel[i3 + 1]) * ef;
        enVel[i3 + 2] += (tz - enVel[i3 + 2]) * ef;

        enPos[i3] += enVel[i3] * dt;
        enPos[i3 + 1] += enVel[i3 + 1] * dt;
        enPos[i3 + 2] += enVel[i3 + 2] * dt;

        var eGround = safeGroundHeight(enPos[i3], enPos[i3 + 2]) + 4.5;
        if (enPos[i3 + 1] < eGround) enPos[i3 + 1] = eGround;

        // Enemy firing
        enFireCd[i] -= dt;
        if (enFireCd[i] <= 0 && !state.gameOver && dist < 110) {
          enFireCd[i] = Math.max(0.85, 2.7 - state.wave * 0.14) + Math.random() * 0.7;
          _v1.set(
            state.pos.x - enPos[i3],
            (state.pos.y + 0.7) - enPos[i3 + 1],
            state.pos.z - enPos[i3 + 2]
          ).normalize();
          spawnBolt(enPos[i3], enPos[i3 + 1], enPos[i3 + 2], _v1.x, _v1.y, _v1.z, 58 + state.wave * 2, 1);
        }
      }

      if (activeEnemies === 0 && !state.gameOver) {
        state.waveDelayTimer += dt;
        if (state.waveDelayTimer >= 1.6) {
          state.waveDelayTimer = 0;
          state.wave += 1;
          state.score += 250;
          state.ammo = Math.min(state.maxAmmo, state.ammo + 3);
          state.shield = Math.min(state.maxShield, state.shield + 25);
          spawnWave(state.wave);
          audio.playShield();
          if (typeof opts.onWave === 'function') opts.onWave(state.wave);
        }
      }

      // 4. Update particles
      for (i = 0; i < PARTICLE_POOL_SIZE; i++) {
        if (!partActive[i]) continue;
        partLife[i] -= dt;
        if (partLife[i] <= 0) {
          partActive[i] = 0;
          continue;
        }
        i3 = i * 3;
        partVel[i3 + 1] -= 14 * dt;
        partPos[i3] += partVel[i3] * dt;
        partPos[i3 + 1] += partVel[i3 + 1] * dt;
        partPos[i3 + 2] += partVel[i3 + 2] * dt;
      }
    }

    // ------------------------------------------------------------------------
    // Visual & Camera Rig Sync (zero allocations)
    // ------------------------------------------------------------------------
    function syncVisuals(dt) {
      var i, i3;

      // Player rig transform
      rigs.root.position.copy(state.pos);
      if (state.vehicleMode === 'rover') {
        _euler.set(state.roverPitch, state.yaw, state.roverRoll, 'YXZ');
      } else {
        _euler.set(state.vehicleMode === 'starfighter' ? state.pitch : 0, state.yaw, state.roll, 'YXZ');
      }
      rigs.root.quaternion.setFromEuler(_euler);
      rigs.root.visible = !(firstPerson && state.vehicleMode === 'operative');

      // Smooth damped camera rig
      if (camera && camera.position) {
        computeAimDirection(_forward);
        if (firstPerson && state.vehicleMode === 'operative') {
          _camPos.set(state.pos.x, state.pos.y + 0.85, state.pos.z);
          _camTarget.copy(_camPos).addScaledVector(_forward, 20);
        } else {
          var backDist = state.vehicleMode === 'starfighter' ? 11.5 : (state.vehicleMode === 'rover' ? 8.5 : 5.6);
          var upDist = state.vehicleMode === 'starfighter' ? 3.2 : (state.vehicleMode === 'rover' ? 3.6 : 2.4);
          _camPos.set(
            state.pos.x - _forward.x * backDist,
            state.pos.y + upDist - _forward.y * backDist * 0.45,
            state.pos.z - _forward.z * backDist
          );
          var camFloor = safeGroundHeight(_camPos.x, _camPos.z) + 1.1;
          if (_camPos.y < camFloor) _camPos.y = camFloor;
          _camTarget.set(
            state.pos.x + _forward.x * 16,
            state.pos.y + 1.0 + _forward.y * 16,
            state.pos.z + _forward.z * 16
          );
        }
        var camF = dampFactor(14, dt);
        camera.position.lerp(_camPos, camF);
        if (typeof camera.lookAt === 'function') {
          camera.lookAt(_camTarget);
        }
      }

      // Update InstancedMesh matrices
      for (i = 0; i < LASER_POOL_SIZE; i++) {
        if (!boltActive[i]) {
          _mat4.compose(_v1.set(0, -9999, 0), _quat.identity(), _zeroScale);
        } else {
          i3 = i * 3;
          _v1.set(boltPos[i3], boltPos[i3 + 1], boltPos[i3 + 2]);
          _v2.set(boltVel[i3], boltVel[i3 + 1], boltVel[i3 + 2]).normalize();
          _v3.copy(_v1).add(_v2);
          _mat4.lookAt(_v3, _v1, _up);
          _quat.setFromRotationMatrix(_mat4);
          _mat4.compose(_v1, _quat, _scale.set(1, 1, 1));
        }
        boltMesh.setMatrixAt(i, _mat4);
      }
      boltMesh.instanceMatrix.needsUpdate = true;

      for (i = 0; i < MISSILE_POOL_SIZE; i++) {
        if (!misActive[i]) {
          _mat4.compose(_v1.set(0, -9999, 0), _quat.identity(), _zeroScale);
        } else {
          i3 = i * 3;
          _v1.set(misPos[i3], misPos[i3 + 1], misPos[i3 + 2]);
          _v2.set(misVel[i3], misVel[i3 + 1], misVel[i3 + 2]).normalize();
          _v3.copy(_v1).add(_v2);
          _mat4.lookAt(_v3, _v1, _up);
          _quat.setFromRotationMatrix(_mat4);
          _mat4.compose(_v1, _quat, _scale.set(1, 1, 1));
        }
        missileMesh.setMatrixAt(i, _mat4);
      }
      missileMesh.instanceMatrix.needsUpdate = true;

      for (i = 0; i < PARTICLE_POOL_SIZE; i++) {
        if (!partActive[i]) {
          _mat4.compose(_v1.set(0, -9999, 0), _quat.identity(), _zeroScale);
        } else {
          i3 = i * 3;
          var ratio = clamp(partLife[i] / (partMaxLife[i] || 0.25), 0.05, 1);
          var s = partSize[i] * ratio;
          _v1.set(partPos[i3], partPos[i3 + 1], partPos[i3 + 2]);
          _quat.identity();
          _mat4.compose(_v1, _quat, _scale.set(s, s, s));
        }
        particleMesh.setMatrixAt(i, _mat4);
      }
      particleMesh.instanceMatrix.needsUpdate = true;

      var colorDirty = false;
      for (i = 0; i < ENEMY_POOL_SIZE; i++) {
        if (!enActive[i]) {
          _mat4.compose(_v1.set(0, -9999, 0), _quat.identity(), _zeroScale);
          enemyHullMesh.setMatrixAt(i, _mat4);
          enemyCoreMesh.setMatrixAt(i, _mat4);
        } else {
          i3 = i * 3;
          _v1.set(enPos[i3], enPos[i3 + 1], enPos[i3 + 2]);
          _v2.set(state.pos.x - _v1.x, state.pos.y - _v1.y, state.pos.z - _v1.z);
          var yawE = Math.atan2(-_v2.x, -_v2.z);
          _euler.set(0, yawE, Math.sin(state.simTime * 3 + enPhase[i]) * 0.22, 'YXZ');
          _quat.setFromEuler(_euler);
          _mat4.compose(_v1, _quat, _scale.set(1, 1, 1));
          enemyHullMesh.setMatrixAt(i, _mat4);
          enemyCoreMesh.setMatrixAt(i, _mat4);

          if (enFlash[i] > 0) {
            enemyHullMesh.setColorAt(i, _colorEnemyFlash);
            colorDirty = true;
          } else {
            enemyHullMesh.setColorAt(i, _colorEnemyBase);
            colorDirty = true;
          }
        }
      }
      enemyHullMesh.instanceMatrix.needsUpdate = true;
      enemyCoreMesh.instanceMatrix.needsUpdate = true;
      if (colorDirty && enemyHullMesh.instanceColor) {
        enemyHullMesh.instanceColor.needsUpdate = true;
      }
    }

    function update(dt, input) {
      if (state.disposed) return;
      var clampedDt = safeNum(dt, 0.016);
      if (clampedDt < 0) clampedDt = 0;
      if (clampedDt > 0.05) clampedDt = 0.05;

      state.simTime += clampedDt;
      if (state.primaryCd > 0) state.primaryCd = Math.max(0, state.primaryCd - clampedDt);
      if (state.missileCd > 0) state.missileCd = Math.max(0, state.missileCd - clampedDt);
      if (state.hitFlash > 0) state.hitFlash = Math.max(0, state.hitFlash - clampedDt);

      // Weapon heat always cools down (never locks permanently)
      var coolRate = (input && (input.fire || input.firePrimary)) ? 22 : 34;
      state.heat = Math.max(0, state.heat - coolRate * clampedDt);
      if (state.overheated && state.heat <= 30) {
        state.overheated = false;
      }

      // Missile ammo passive regeneration
      if (state.ammo < state.maxAmmo && !state.gameOver) {
        state.ammoRegenTimer += clampedDt;
        if (state.ammoRegenTimer >= 4.0) {
          state.ammoRegenTimer = 0;
          state.ammo += 1;
        }
      }

      // Shield regeneration after cooldown
      if (!state.gameOver && state.shield < state.maxShield) {
        if (state.shieldRegenDelay > 0) {
          state.shieldRegenDelay = Math.max(0, state.shieldRegenDelay - clampedDt);
        } else {
          if (!state.shieldRegenNotified) {
            state.shieldRegenNotified = true;
            audio.playShield();
          }
          state.shield = Math.min(state.maxShield, state.shield + 15 * clampedDt);
        }
      }

      if (!state.gameOver) {
        updatePlayerPhysics(clampedDt, input);
      }
      updateProjectilesAndEnemies(clampedDt);
      syncVisuals(clampedDt);
      audio.updateEngineHum(state.speed, state.vehicleMode, !state.gameOver);
    }

    function getHudSnapshot() {
      hudSnapshot.health = Math.round(safeNum(state.health, 0));
      hudSnapshot.maxHealth = state.maxHealth;
      hudSnapshot.shield = Math.round(safeNum(state.shield, 0));
      hudSnapshot.maxShield = state.maxShield;
      hudSnapshot.ammo = state.ammo;
      hudSnapshot.heat = Math.round(safeNum(state.heat, 0));
      hudSnapshot.score = Math.round(safeNum(state.score, 0));
      hudSnapshot.wave = state.wave;
      hudSnapshot.kills = state.kills;
      hudSnapshot.speed = Math.round(safeNum(state.speed, 0));
      hudSnapshot.altitude = Math.round(safeNum(state.altitude, 0));
      hudSnapshot.vehicleMode = state.vehicleMode;
      hudSnapshot.gameOver = !!state.gameOver;
      return hudSnapshot;
    }

    function dispose() {
      if (state.disposed) return;
      state.disposed = true;
      audio.dispose();

      if (scene && typeof scene.remove === 'function') {
        scene.remove(rigs.root);
        scene.remove(boltMesh);
        scene.remove(missileMesh);
        scene.remove(particleMesh);
        scene.remove(enemyHullMesh);
        scene.remove(enemyCoreMesh);
      }

      var i;
      for (i = 0; i < disposables.geos.length; i++) {
        if (disposables.geos[i] && typeof disposables.geos[i].dispose === 'function') {
          disposables.geos[i].dispose();
        }
      }
      for (i = 0; i < disposables.mats.length; i++) {
        if (disposables.mats[i] && typeof disposables.mats[i].dispose === 'function') {
          disposables.mats[i].dispose();
        }
      }
      disposables.geos.length = 0;
      disposables.mats.length = 0;
    }

    // Initialize wave 1 and initial transforms
    reset();

    return {
      update: update,
      firePrimary: firePrimary,
      fireMissile: fireMissile,
      switchVehicle: switchVehicle,
      setAudioEnabled: setAudioEnabled,
      reset: reset,
      dispose: dispose,
      getHudSnapshot: getHudSnapshot
    };
  }

  global.AstroCombatPhysics = {
    createSession: createSession
  };
})(typeof window !== 'undefined' ? window : globalThis);
