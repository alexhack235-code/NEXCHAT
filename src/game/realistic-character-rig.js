/**
 * src/game/realistic-character-rig.js
 * Zero-lag, articulated Three.js (r128 compatible) procedural humanoid & vehicle builder.
 *
 * Exposes `window.RealisticCharacterRig`:
 *   - createHumanoid(opts)
 *   - animateHumanoid(rig, state, dt)
 *   - createCruiser(opts)
 *   - createStarfighter(opts)
 *   - disposeShared()
 *
 * Design highlights:
 * - Shared cached BufferGeometry primitives (lazy-created, disposed via disposeShared()).
 * - Zero per-frame allocations inside animateHumanoid(rig, state, dt).
 * - Real anatomical proportions (~1.80m tall, grounded cleanly at y = 0).
 * - Supports 'exo-operative' and 'canadian-explorer' humanoid variants.
 */
(function (global) {
  'use strict';

  function getTHREE() {
    if (typeof global !== 'undefined' && global.THREE) return global.THREE;
    if (typeof THREE !== 'undefined') return THREE;
    throw new Error('RealisticCharacterRig requires Three.js (THREE) to be loaded.');
  }

  // ============================================================================
  // SHARED GEOMETRY & MATERIAL CACHE
  // ============================================================================
  const _geoCache = Object.create(null);
  const _matCache = Object.create(null);

  function getCachedGeo(key, factory) {
    if (!_geoCache[key]) {
      _geoCache[key] = factory(getTHREE());
    }
    return _geoCache[key];
  }

  function getCachedMat(key, factory) {
    if (!_matCache[key]) {
      _matCache[key] = factory(getTHREE());
    }
    return _matCache[key];
  }

  function createStdMat(THREE, params) {
    return new THREE.MeshStandardMaterial(params);
  }

  function makeBox(key, w, h, d) {
    return getCachedGeo(key, function (THREE) {
      return new THREE.BoxGeometry(w, h, d);
    });
  }

  function makeCyl(key, rt, rb, h, segs) {
    return getCachedGeo(key, function (THREE) {
      return new THREE.CylinderGeometry(rt, rb, h, segs || 12);
    });
  }

  function makeSphere(key, r, ws, hs) {
    return getCachedGeo(key, function (THREE) {
      return new THREE.SphereGeometry(r, ws || 12, hs || 10);
    });
  }

  function makeCone(key, r, h, segs) {
    return getCachedGeo(key, function (THREE) {
      return new THREE.ConeGeometry(r, h, segs || 12);
    });
  }

  function makeTorus(key, r, tube, rSegs, tSegs) {
    return getCachedGeo(key, function (THREE) {
      return new THREE.TorusGeometry(r, tube, rSegs || 8, tSegs || 16);
    });
  }

  function configureShadow(mesh, castShadow, receiveShadow) {
    mesh.castShadow = !!castShadow;
    mesh.receiveShadow = receiveShadow !== undefined ? !!receiveShadow : !!castShadow;
    return mesh;
  }

  function damp(current, target, lambda, dt) {
    return current + (target - current) * (1 - Math.exp(-lambda * dt));
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  // ============================================================================
  // HUMANOID BUILDER (~1.80m tall, grounded at y = 0)
  // ============================================================================
  function createHumanoid(opts) {
    const THREE = getTHREE();
    const o = opts || {};
    const variant = o.variant === 'canadian-explorer' ? 'canadian-explorer' : 'exo-operative';
    const castShadow = o.castShadow !== undefined ? !!o.castShadow : true;

    const defaultSuit = variant === 'canadian-explorer' ? 0xc62828 : 0x1e293b;
    const defaultAccent = variant === 'canadian-explorer' ? 0xf59e0b : 0x38bdf8;
    const suitColor = o.suitColor !== undefined ? o.suitColor : defaultSuit;
    const accentColor = o.accentColor !== undefined ? o.accentColor : defaultAccent;

    // Materials (cached per color/variant key to minimize shader switches)
    const suitMat = getCachedMat('suit_' + variant + '_' + suitColor, function (T) {
      return createStdMat(T, {
        color: suitColor,
        roughness: variant === 'canadian-explorer' ? 0.78 : 0.42,
        metalness: variant === 'canadian-explorer' ? 0.08 : 0.35
      });
    });

    const underSuitMat = getCachedMat('undersuit_' + variant, function (T) {
      return createStdMat(T, {
        color: variant === 'canadian-explorer' ? 0x1f2937 : 0x0f172a,
        roughness: 0.72,
        metalness: 0.22
      });
    });

    const accentMat = getCachedMat('accent_' + accentColor, function (T) {
      return createStdMat(T, {
        color: accentColor,
        roughness: 0.35,
        metalness: 0.45,
        emissive: accentColor,
        emissiveIntensity: 0.22
      });
    });

    const skinMat = getCachedMat('skin_tone', function (T) {
      return createStdMat(T, {
        color: 0xe2b49a,
        roughness: 0.65,
        metalness: 0.04
      });
    });

    const visorMat = getCachedMat('visor_' + variant + '_' + accentColor, function (T) {
      return createStdMat(T, {
        color: variant === 'canadian-explorer' ? 0xf97316 : 0x0ea5e9,
        roughness: 0.12,
        metalness: 0.85,
        emissive: variant === 'canadian-explorer' ? 0x9a3412 : 0x0369a1,
        emissiveIntensity: 0.35
      });
    });

    const darkGearMat = getCachedMat('dark_gear', function (T) {
      return createStdMat(T, {
        color: 0x111827,
        roughness: 0.68,
        metalness: 0.28
      });
    });

    const furTrimMat = getCachedMat('fur_trim', function (T) {
      return createStdMat(T, {
        color: 0xe5e7eb,
        roughness: 0.92,
        metalness: 0.02
      });
    });

    const thrusterGlowMat = getCachedMat('thruster_glow_' + accentColor, function (T) {
      return createStdMat(T, {
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 1.1,
        roughness: 0.2,
        metalness: 0.1
      });
    });

    const root = new THREE.Group();
    root.name = 'HumanoidRig_' + variant;

    // --------------------------------------------------------------------------
    // PELVIS / HIPS ROOT (y = 0.90)
    // --------------------------------------------------------------------------
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.90, 0);
    root.add(pelvis);

    const pelvisMesh = configureShadow(
      new THREE.Mesh(makeCyl('hum_pelvis', 0.145, 0.125, 0.12, 12), underSuitMat),
      castShadow
    );
    pelvisMesh.scale.set(1.12, 1, 0.78);
    pelvis.add(pelvisMesh);

    const beltMesh = configureShadow(
      new THREE.Mesh(makeCyl('hum_belt', 0.155, 0.155, 0.055, 12), darkGearMat),
      castShadow
    );
    beltMesh.position.set(0, 0.04, 0);
    beltMesh.scale.set(1.14, 1, 0.82);
    pelvis.add(beltMesh);

    const buckleMesh = configureShadow(
      new THREE.Mesh(makeBox('hum_buckle', 0.07, 0.045, 0.03), accentMat),
      castShadow
    );
    buckleMesh.position.set(0, 0.04, 0.125);
    pelvis.add(buckleMesh);

    // --------------------------------------------------------------------------
    // TORSO (pivot at y = 0.94)
    // --------------------------------------------------------------------------
    const torso = new THREE.Group();
    torso.position.set(0, 0.04, 0); // relative to pelvis -> world y = 0.94
    pelvis.add(torso);

    // Tapered abdomen -> chest / parka
    const abdomenMesh = configureShadow(
      new THREE.Mesh(makeCyl('hum_abdomen', 0.16, 0.135, 0.18, 12), suitMat),
      castShadow
    );
    abdomenMesh.position.set(0, 0.10, 0);
    abdomenMesh.scale.set(1.12, 1, 0.76);
    torso.add(abdomenMesh);

    const chestMesh = configureShadow(
      new THREE.Mesh(makeCyl('hum_chest_' + variant, variant === 'canadian-explorer' ? 0.21 : 0.195, 0.16, 0.28, 12), suitMat),
      castShadow
    );
    chestMesh.position.set(0, 0.32, 0);
    chestMesh.scale.set(1.18, 1, 0.78);
    torso.add(chestMesh);

    // Chest armor plate or parka placket
    const chestDetailMesh = configureShadow(
      new THREE.Mesh(
        makeBox('hum_chest_detail_' + variant, variant === 'canadian-explorer' ? 0.06 : 0.22, 0.22, 0.04),
        variant === 'canadian-explorer' ? darkGearMat : accentMat
      ),
      castShadow
    );
    chestDetailMesh.position.set(0, 0.33, 0.145);
    torso.add(chestDetailMesh);

    // Neck collar
    const collarMesh = configureShadow(
      new THREE.Mesh(
        makeCyl('hum_collar_' + variant, 0.095, 0.115, 0.07, 12),
        variant === 'canadian-explorer' ? furTrimMat : darkGearMat
      ),
      castShadow
    );
    collarMesh.position.set(0, 0.49, 0);
    torso.add(collarMesh);

    const neckMesh = configureShadow(
      new THREE.Mesh(makeCyl('hum_neck', 0.058, 0.068, 0.08, 10), skinMat),
      castShadow
    );
    neckMesh.position.set(0, 0.52, 0);
    torso.add(neckMesh);

    // Tactical Backpack / Thruster Pack
    const backpack = new THREE.Group();
    backpack.position.set(0, 0.31, -0.16);
    torso.add(backpack);

    const packBody = configureShadow(
      new THREE.Mesh(makeBox('hum_pack_body', 0.22, 0.28, 0.11), darkGearMat),
      castShadow
    );
    backpack.add(packBody);

    const packAccent = configureShadow(
      new THREE.Mesh(makeBox('hum_pack_accent', 0.14, 0.16, 0.025), accentMat),
      castShadow
    );
    packAccent.position.set(0, 0.02, -0.055);
    backpack.add(packAccent);

    let thrusterGlowL = null;
    let thrusterGlowR = null;
    if (variant === 'exo-operative') {
      const nozzleGeo = makeCyl('hum_nozzle', 0.032, 0.042, 0.07, 10);
      const glowGeo = makeCone('hum_thruster_cone', 0.028, 0.09, 10);

      const nozzleL = configureShadow(new THREE.Mesh(nozzleGeo, darkGearMat), castShadow);
      nozzleL.position.set(-0.07, -0.14, -0.02);
      backpack.add(nozzleL);

      const nozzleR = configureShadow(new THREE.Mesh(nozzleGeo, darkGearMat), castShadow);
      nozzleR.position.set(0.07, -0.14, -0.02);
      backpack.add(nozzleR);

      thrusterGlowL = new THREE.Mesh(glowGeo, thrusterGlowMat);
      thrusterGlowL.rotation.x = Math.PI;
      thrusterGlowL.position.set(-0.07, -0.21, -0.02);
      backpack.add(thrusterGlowL);

      thrusterGlowR = new THREE.Mesh(glowGeo, thrusterGlowMat);
      thrusterGlowR.rotation.x = Math.PI;
      thrusterGlowR.position.set(0.07, -0.21, -0.02);
      backpack.add(thrusterGlowR);
    } else {
      // Expedition bedroll & antenna
      const bedroll = configureShadow(
        new THREE.Mesh(makeCyl('hum_bedroll', 0.048, 0.048, 0.24, 10), suitMat),
        castShadow
      );
      bedroll.rotation.z = Math.PI * 0.5;
      bedroll.position.set(0, 0.16, -0.01);
      backpack.add(bedroll);
    }

    // --------------------------------------------------------------------------
    // HEAD (pivot at y = 0.56 relative to torso -> world y = 1.50, top ~1.80)
    // --------------------------------------------------------------------------
    const head = new THREE.Group();
    head.position.set(0, 0.56, 0);
    torso.add(head);

    // Sculpted face + chin/jaw
    const cranium = configureShadow(
      new THREE.Mesh(makeSphere('hum_cranium', 0.112, 14, 12), variant === 'exo-operative' ? suitMat : skinMat),
      castShadow
    );
    cranium.position.set(0, 0.14, 0);
    cranium.scale.set(0.92, 1.08, 1.0);
    head.add(cranium);

    const jaw = configureShadow(
      new THREE.Mesh(makeBox('hum_jaw', 0.115, 0.08, 0.115), variant === 'exo-operative' ? darkGearMat : skinMat),
      castShadow
    );
    jaw.position.set(0, 0.075, 0.022);
    head.add(jaw);

    if (variant === 'exo-operative') {
      // Helmet crest + reflective visor
      const visor = configureShadow(
        new THREE.Mesh(makeSphere('hum_visor', 0.105, 14, 10), visorMat),
        castShadow
      );
      visor.position.set(0, 0.145, 0.032);
      visor.scale.set(0.95, 0.58, 0.85);
      head.add(visor);

      const helmetCrest = configureShadow(
        new THREE.Mesh(makeBox('hum_crest', 0.045, 0.04, 0.19), accentMat),
        castShadow
      );
      helmetCrest.position.set(0, 0.255, -0.01);
      head.add(helmetCrest);
    } else {
      // Canadian explorer hood + fur rim + ski goggles
      const hood = configureShadow(
        new THREE.Mesh(makeSphere('hum_hood', 0.132, 14, 12), suitMat),
        castShadow
      );
      hood.position.set(0, 0.15, -0.025);
      hood.scale.set(1.02, 1.12, 1.06);
      head.add(hood);

      const hoodRim = configureShadow(
        new THREE.Mesh(makeTorus('hum_hood_rim', 0.105, 0.026, 8, 16), furTrimMat),
        castShadow
      );
      hoodRim.position.set(0, 0.135, 0.068);
      head.add(hoodRim);

      const goggles = configureShadow(
        new THREE.Mesh(makeBox('hum_goggles', 0.15, 0.048, 0.055), visorMat),
        castShadow
      );
      goggles.position.set(0, 0.155, 0.092);
      head.add(goggles);
    }

    // --------------------------------------------------------------------------
    // ARMS (left & right: shoulder -> upperArm -> elbow -> forearm -> gloved hand)
    // --------------------------------------------------------------------------
    function buildArm(side) {
      const sign = side === 'L' ? -1 : 1;
      const shoulder = new THREE.Group();
      shoulder.position.set(sign * 0.23, 0.43, 0);
      torso.add(shoulder);

      const pauldron = configureShadow(
        new THREE.Mesh(makeSphere('hum_shoulder_cap', 0.068, 10, 8), variant === 'exo-operative' ? accentMat : suitMat),
        castShadow
      );
      pauldron.scale.set(1.05, 0.95, 1.0);
      shoulder.add(pauldron);

      const upperArm = configureShadow(
        new THREE.Mesh(makeCyl('hum_upper_arm', 0.052, 0.045, 0.26, 10), suitMat),
        castShadow
      );
      upperArm.position.set(0, -0.14, 0);
      shoulder.add(upperArm);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.28, 0);
      shoulder.add(elbow);

      const elbowCap = configureShadow(
        new THREE.Mesh(makeSphere('hum_elbow_cap', 0.045, 8, 8), darkGearMat),
        castShadow
      );
      elbow.add(elbowCap);

      const forearm = configureShadow(
        new THREE.Mesh(makeCyl('hum_forearm', 0.044, 0.036, 0.24, 10), underSuitMat),
        castShadow
      );
      forearm.position.set(0, -0.125, 0);
      elbow.add(forearm);

      const glove = configureShadow(
        new THREE.Mesh(makeBox('hum_glove', 0.055, 0.085, 0.065), darkGearMat),
        castShadow
      );
      glove.position.set(0, -0.275, 0.008);
      elbow.add(glove);

      return { shoulder: shoulder, elbow: elbow };
    }

    const armL = buildArm('L');
    const armR = buildArm('R');

    // --------------------------------------------------------------------------
    // LEGS (left & right: hip -> thigh -> knee -> shin -> treaded boot at y = 0)
    // --------------------------------------------------------------------------
    function buildLeg(side) {
      const sign = side === 'L' ? -1 : 1;
      const hip = new THREE.Group();
      hip.position.set(sign * 0.105, 0, 0); // relative to pelvis (y = 0.90)
      pelvis.add(hip);

      const thigh = configureShadow(
        new THREE.Mesh(makeCyl('hum_thigh', 0.076, 0.062, 0.40, 10), suitMat),
        castShadow
      );
      thigh.position.set(0, -0.21, 0);
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.set(0, -0.42, 0); // world y = 0.48
      hip.add(knee);

      const kneePad = configureShadow(
        new THREE.Mesh(makeBox('hum_kneepad', 0.09, 0.08, 0.06), darkGearMat),
        castShadow
      );
      kneePad.position.set(0, 0, 0.042);
      knee.add(kneePad);

      const shin = configureShadow(
        new THREE.Mesh(makeCyl('hum_shin', 0.060, 0.048, 0.36, 10), underSuitMat),
        castShadow
      );
      shin.position.set(0, -0.19, 0);
      knee.add(shin);

      // Treaded boot: sole bottom sits exactly at y = -0.48 relative to knee -> world y = 0.00
      const bootUpper = configureShadow(
        new THREE.Mesh(makeBox('hum_boot_upper', 0.095, 0.09, 0.16), darkGearMat),
        castShadow
      );
      bootUpper.position.set(0, -0.405, 0.025);
      knee.add(bootUpper);

      const bootSole = configureShadow(
        new THREE.Mesh(makeBox('hum_boot_sole', 0.105, 0.04, 0.21), darkGearMat),
        castShadow
      );
      bootSole.position.set(0, -0.46, 0.038); // bottom at -0.46 - 0.02 = -0.48 -> 0.90 - 0.42 - 0.48 = 0.00
      knee.add(bootSole);

      return { hip: hip, knee: knee };
    }

    const legL = buildLeg('L');
    const legR = buildLeg('R');

    return {
      root: root,
      pelvis: pelvis,
      torso: torso,
      head: head,
      hipL: legL.hip,
      hipR: legR.hip,
      kneeL: legL.knee,
      kneeR: legR.knee,
      shoulderL: armL.shoulder,
      shoulderR: armR.shoulder,
      elbowL: armL.elbow,
      elbowR: armR.elbow,
      thrusterGlowL: thrusterGlowL,
      thrusterGlowR: thrusterGlowR,
      variant: variant,
      _anim: {
        walkPhase: 0,
        idlePhase: 0,
        pelvisY: 0.90
      },
      dispose: function () {
        // Shared geometries/materials are disposed via disposeShared()
      }
    };
  }

  // ============================================================================
  // ZERO-ALLOCATION SKELETAL ANIMATION
  // ============================================================================
  function animateHumanoid(rig, state, dt) {
    if (!rig || !rig.torso) return;

    const s = state || {};
    const clampedDt = clamp(dt || 0, 0, 0.05);
    if (clampedDt <= 0) return;

    const anim = rig._anim || (rig._anim = { walkPhase: 0, idlePhase: 0, pelvisY: 0.90 });
    const speed = typeof s.speed === 'number' ? Math.max(0, s.speed) : 0;
    const isMoving = !!s.isMoving && speed > 0.05;
    const isGrounded = s.isGrounded !== undefined ? !!s.isGrounded : true;
    const isFiring = !!s.isFiring;
    const isSeated = !!s.isSeated;

    anim.idlePhase += clampedDt * 2.2;

    // Target joint angles (all scalars, zero allocations)
    let tPelvisY = 0.90;
    let tTorsoRx = 0;
    let tTorsoRy = 0;
    let tHeadRx = 0;
    let tHeadRy = 0;

    let tHipLRx = 0;
    let tHipRRx = 0;
    let tKneeLRx = 0;
    let tKneeRRx = 0;

    let tShoulderLRx = 0;
    let tShoulderLRz = 0.08;
    let tShoulderRRx = 0;
    let tShoulderRRz = -0.08;
    let tElbowLRx = -0.18;
    let tElbowRRx = -0.18;

    if (isSeated) {
      // Seated driving pose
      tPelvisY = 0.62;
      tTorsoRx = -0.12;
      tHipLRx = -1.35;
      tHipRRx = -1.35;
      tKneeLRx = 1.42;
      tKneeRRx = 1.42;
      tShoulderLRx = -0.95;
      tShoulderRRx = -0.95;
      tShoulderLRz = 0.14;
      tShoulderRRz = -0.14;
      tElbowLRx = -0.55;
      tElbowRRx = -0.55;
    } else if (!isGrounded) {
      // Airborne jetpack / jump leg tuck & arm flare
      tPelvisY = 0.92 + Math.sin(anim.idlePhase * 1.8) * 0.015;
      tTorsoRx = 0.14;
      tHipLRx = -0.55;
      tHipRRx = -0.32;
      tKneeLRx = 0.95;
      tKneeRRx = 0.65;
      tShoulderLRx = -0.25;
      tShoulderRRx = -0.25;
      tShoulderLRz = 0.58;
      tShoulderRRz = -0.58;
      tElbowLRx = -0.45;
      tElbowRRx = -0.45;
    } else if (isMoving) {
      // Natural stride & knee bend + opposite arm swing proportional to speed
      const strideFreq = clamp(speed * 1.45, 3.0, 12.5);
      const strideAmp = clamp(speed * 0.085, 0.28, 0.82);
      anim.walkPhase += clampedDt * strideFreq;

      const sinP = Math.sin(anim.walkPhase);
      const cosP = Math.cos(anim.walkPhase);

      tPelvisY = 0.90 + Math.abs(cosP) * 0.028;
      tTorsoRx = 0.08 + clamp(speed * 0.012, 0, 0.12);
      tTorsoRy = sinP * 0.06;

      tHipLRx = sinP * strideAmp;
      tHipRRx = -sinP * strideAmp;

      // Knee bends during swing-through
      tKneeLRx = Math.max(0.05, -cosP * strideAmp * 1.05 + 0.18);
      tKneeRRx = Math.max(0.05, cosP * strideAmp * 1.05 + 0.18);

      // Opposite arm swing
      tShoulderLRx = -sinP * strideAmp * 0.78;
      tShoulderRRx = sinP * strideAmp * 0.78;
      tElbowLRx = -0.35 - Math.max(0, sinP) * 0.35;
      tElbowRRx = -0.35 - Math.max(0, -sinP) * 0.35;
    } else {
      // Subtle breathing idle sway
      const breath = Math.sin(anim.idlePhase);
      tPelvisY = 0.90 + breath * 0.008;
      tTorsoRx = breath * 0.02;
      tHeadRx = -breath * 0.018;
      tHeadRy = Math.sin(anim.idlePhase * 0.45) * 0.06;
      tShoulderLRz = 0.08 + breath * 0.015;
      tShoulderRRz = -0.08 - breath * 0.015;
      tElbowLRx = -0.20;
      tElbowRRx = -0.20;
    }

    // Right-arm aiming pose overrides right arm (and adds slight torso aim twist)
    if (isFiring && !isSeated) {
      tShoulderRRx = -1.48;
      tShoulderRRz = -0.05;
      tElbowRRx = -0.18;
      tTorsoRy += -0.18;
      tHeadRy += 0.12;
    }

    const lambda = 14;
    if (rig.pelvis) {
      rig.pelvis.position.y = damp(rig.pelvis.position.y, tPelvisY, lambda, clampedDt);
    }
    rig.torso.rotation.x = damp(rig.torso.rotation.x, tTorsoRx, lambda, clampedDt);
    rig.torso.rotation.y = damp(rig.torso.rotation.y, tTorsoRy, lambda, clampedDt);

    rig.head.rotation.x = damp(rig.head.rotation.x, tHeadRx, lambda, clampedDt);
    rig.head.rotation.y = damp(rig.head.rotation.y, tHeadRy, lambda, clampedDt);

    rig.hipL.rotation.x = damp(rig.hipL.rotation.x, tHipLRx, lambda, clampedDt);
    rig.hipR.rotation.x = damp(rig.hipR.rotation.x, tHipRRx, lambda, clampedDt);
    rig.kneeL.rotation.x = damp(rig.kneeL.rotation.x, tKneeLRx, lambda, clampedDt);
    rig.kneeR.rotation.x = damp(rig.kneeR.rotation.x, tKneeRRx, lambda, clampedDt);

    rig.shoulderL.rotation.x = damp(rig.shoulderL.rotation.x, tShoulderLRx, lambda, clampedDt);
    rig.shoulderL.rotation.z = damp(rig.shoulderL.rotation.z, tShoulderLRz, lambda, clampedDt);
    rig.shoulderR.rotation.x = damp(rig.shoulderR.rotation.x, tShoulderRRx, lambda, clampedDt);
    rig.shoulderR.rotation.z = damp(rig.shoulderR.rotation.z, tShoulderRRz, lambda, clampedDt);

    rig.elbowL.rotation.x = damp(rig.elbowL.rotation.x, tElbowLRx, lambda, clampedDt);
    rig.elbowR.rotation.x = damp(rig.elbowR.rotation.x, tElbowRRx, lambda, clampedDt);

    // Thruster glow pulse when airborne
    if (rig.thrusterGlowL && rig.thrusterGlowR) {
      const targetScale = !isGrounded ? 1.35 + Math.sin(anim.idlePhase * 6) * 0.25 : 0.35;
      rig.thrusterGlowL.scale.y = damp(rig.thrusterGlowL.scale.y, targetScale, 16, clampedDt);
      rig.thrusterGlowR.scale.y = rig.thrusterGlowL.scale.y;
    }
  }

  // ============================================================================
  // VEHICLE 1: REALISTIC CRUISER (sloped body, wheel wells, glass cabin, 4 wheels)
  // ============================================================================
  function createCruiser(opts) {
    const THREE = getTHREE();
    const o = opts || {};
    const castShadow = o.castShadow !== undefined ? !!o.castShadow : true;
    const bodyColor = o.bodyColor !== undefined ? o.bodyColor : (o.suitColor !== undefined ? o.suitColor : 0x1e3a5f);
    const accentColor = o.accentColor !== undefined ? o.accentColor : 0x38bdf8;

    const bodyMat = getCachedMat('cruiser_body_' + bodyColor, function (T) {
      return createStdMat(T, { color: bodyColor, roughness: 0.28, metalness: 0.62 });
    });
    const trimMat = getCachedMat('cruiser_trim', function (T) {
      return createStdMat(T, { color: 0x111827, roughness: 0.72, metalness: 0.25 });
    });
    const glassMat = getCachedMat('cruiser_glass', function (T) {
      return createStdMat(T, {
        color: 0x0f172a,
        roughness: 0.08,
        metalness: 0.85,
        transparent: true,
        opacity: 0.78
      });
    });
    const tireMat = getCachedMat('cruiser_tire', function (T) {
      return createStdMat(T, { color: 0x171717, roughness: 0.88, metalness: 0.05 });
    });
    const rimMat = getCachedMat('cruiser_rim', function (T) {
      return createStdMat(T, { color: 0xd1d5db, roughness: 0.25, metalness: 0.88 });
    });
    const headlightMat = getCachedMat('cruiser_headlight', function (T) {
      return createStdMat(T, {
        color: 0xfef9c3,
        emissive: 0xfef08a,
        emissiveIntensity: 1.4,
        roughness: 0.15
      });
    });
    const taillightMat = getCachedMat('cruiser_taillight', function (T) {
      return createStdMat(T, {
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 1.3,
        roughness: 0.2
      });
    });
    const beaconMat = getCachedMat('cruiser_beacon_' + accentColor, function (T) {
      return createStdMat(T, {
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 1.2,
        roughness: 0.2
      });
    });

    const root = new THREE.Group();
    root.name = 'CruiserRig';

    // Lower chassis & bumpers
    const chassis = configureShadow(
      new THREE.Mesh(makeBox('cruiser_chassis', 1.88, 0.42, 4.30), bodyMat),
      castShadow
    );
    chassis.position.set(0, 0.56, 0);
    root.add(chassis);

    // Sloped aerodynamic hood (+Z is front)
    const hood = configureShadow(
      new THREE.Mesh(makeBox('cruiser_hood', 1.76, 0.22, 1.45), bodyMat),
      castShadow
    );
    hood.position.set(0, 0.76, 1.35);
    hood.rotation.x = 0.14;
    root.add(hood);

    // Front splitter & rear diffuser
    const frontSplitter = configureShadow(
      new THREE.Mesh(makeBox('cruiser_splitter', 1.92, 0.12, 0.28), trimMat),
      castShadow
    );
    frontSplitter.position.set(0, 0.34, 2.12);
    root.add(frontSplitter);

    const rearDiffuser = configureShadow(
      new THREE.Mesh(makeBox('cruiser_diffuser', 1.90, 0.16, 0.26), trimMat),
      castShadow
    );
    rearDiffuser.position.set(0, 0.36, -2.10);
    root.add(rearDiffuser);

    // Tinted glass cabin
    const cabinGlass = configureShadow(
      new THREE.Mesh(makeBox('cruiser_cabin_glass', 1.56, 0.50, 1.95), glassMat),
      castShadow
    );
    cabinGlass.position.set(0, 1.02, -0.18);
    root.add(cabinGlass);

    // Cabin roof panel
    const roof = configureShadow(
      new THREE.Mesh(makeBox('cruiser_roof', 1.50, 0.08, 1.55), bodyMat),
      castShadow
    );
    roof.position.set(0, 1.28, -0.22);
    root.add(roof);

    // Roof rack + beacon lightbar
    const rack = configureShadow(
      new THREE.Mesh(makeBox('cruiser_rack', 1.36, 0.06, 1.15), trimMat),
      castShadow
    );
    rack.position.set(0, 1.34, -0.32);
    root.add(rack);

    const beacon = configureShadow(
      new THREE.Mesh(makeBox('cruiser_beacon', 0.92, 0.08, 0.18), beaconMat),
      castShadow
    );
    beacon.position.set(0, 1.40, 0.15);
    root.add(beacon);

    // Headlights (+Z) & Taillights (-Z)
    const lightGeo = makeBox('cruiser_light_pod', 0.36, 0.11, 0.08);
    const headL = new THREE.Mesh(lightGeo, headlightMat);
    headL.position.set(-0.62, 0.60, 2.15);
    root.add(headL);

    const headR = new THREE.Mesh(lightGeo, headlightMat);
    headR.position.set(0.62, 0.60, 2.15);
    root.add(headR);

    const tailL = new THREE.Mesh(lightGeo, taillightMat);
    tailL.position.set(-0.64, 0.64, -2.15);
    root.add(tailL);

    const tailR = new THREE.Mesh(lightGeo, taillightMat);
    tailR.position.set(0.64, 0.64, -2.15);
    root.add(tailR);

    // 4 Wheel wells & rotating rubber-tire + alloy-rim wheels
    const wheelPositions = [
      [-0.96, 0.38, 1.32],
      [0.96, 0.38, 1.32],
      [-0.96, 0.38, -1.32],
      [0.96, 0.38, -1.32]
    ];

    const wellGeo = makeCyl('cruiser_wheel_well', 0.45, 0.45, 0.34, 14);
    const tireGeo = makeCyl('cruiser_tire', 0.38, 0.38, 0.26, 16);
    const rimGeo = makeCyl('cruiser_rim', 0.23, 0.23, 0.28, 12);
    const hubGeo = makeCyl('cruiser_hub', 0.08, 0.08, 0.30, 8);

    const wheels = [];
    for (let i = 0; i < wheelPositions.length; i++) {
      const wp = wheelPositions[i];
      const well = new THREE.Mesh(wellGeo, trimMat);
      well.rotation.z = Math.PI * 0.5;
      well.position.set(wp[0] * 0.88, wp[1] + 0.06, wp[2]);
      root.add(well);

      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wp[0], wp[1], wp[2]);

      const tire = configureShadow(new THREE.Mesh(tireGeo, tireMat), castShadow);
      tire.rotation.z = Math.PI * 0.5;
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI * 0.5;
      wheelGroup.add(rim);

      const hub = new THREE.Mesh(hubGeo, beaconMat);
      hub.rotation.z = Math.PI * 0.5;
      wheelGroup.add(hub);

      root.add(wheelGroup);
      wheels.push(wheelGroup);
    }

    return {
      root: root,
      wheels: wheels,
      dispose: function () {}
    };
  }

  // ============================================================================
  // VEHICLE 2: REALISTIC STARFIGHTER (fuselage nose, delta wings, canopy, twin ion)
  // ============================================================================
  function createStarfighter(opts) {
    const THREE = getTHREE();
    const o = opts || {};
    const castShadow = o.castShadow !== undefined ? !!o.castShadow : true;
    const hullColor = o.hullColor !== undefined ? o.hullColor : (o.suitColor !== undefined ? o.suitColor : 0x334155);
    const accentColor = o.accentColor !== undefined ? o.accentColor : 0x38bdf8;

    const hullMat = getCachedMat('sf_hull_' + hullColor, function (T) {
      return createStdMat(T, { color: hullColor, roughness: 0.30, metalness: 0.68 });
    });
    const darkMetalMat = getCachedMat('sf_dark_metal', function (T) {
      return createStdMat(T, { color: 0x0f172a, roughness: 0.48, metalness: 0.72 });
    });
    const canopyMat = getCachedMat('sf_canopy', function (T) {
      return createStdMat(T, {
        color: 0x38bdf8,
        roughness: 0.08,
        metalness: 0.65,
        transparent: true,
        opacity: 0.62
      });
    });
    const ionMat = getCachedMat('sf_ion_' + accentColor, function (T) {
      return createStdMat(T, {
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 1.6,
        roughness: 0.15
      });
    });

    const root = new THREE.Group();
    root.name = 'StarfighterRig';

    // Central fuselage (+Z is forward nose)
    const fuselage = configureShadow(
      new THREE.Mesh(makeBox('sf_fuselage', 0.92, 0.58, 3.40), hullMat),
      castShadow
    );
    fuselage.position.set(0, 0.55, -0.10);
    root.add(fuselage);

    // Sculpted tapered nose cone
    const nose = configureShadow(
      new THREE.Mesh(makeCone('sf_nose', 0.46, 1.85, 8), hullMat),
      castShadow
    );
    nose.rotation.x = Math.PI * 0.5;
    nose.scale.set(1.0, 1.0, 0.65);
    nose.position.set(0, 0.53, 2.52);
    root.add(nose);

    const noseTip = configureShadow(
      new THREE.Mesh(makeCone('sf_nose_tip', 0.12, 0.55, 8), darkMetalMat),
      castShadow
    );
    noseTip.rotation.x = Math.PI * 0.5;
    noseTip.position.set(0, 0.53, 3.65);
    root.add(noseTip);

    // Translucent canopy cockpit
    const canopy = configureShadow(
      new THREE.Mesh(makeSphere('sf_canopy', 0.46, 14, 10), canopyMat),
      castShadow
    );
    canopy.scale.set(0.88, 0.66, 2.25);
    canopy.position.set(0, 0.86, 0.45);
    root.add(canopy);

    // Swept delta wings (left & right)
    const wingGeo = makeBox('sf_wing', 2.25, 0.09, 1.45);
    const wingL = configureShadow(new THREE.Mesh(wingGeo, hullMat), castShadow);
    wingL.position.set(-1.45, 0.52, -0.55);
    wingL.rotation.y = 0.38;
    wingL.rotation.z = -0.05;
    root.add(wingL);

    const wingR = configureShadow(new THREE.Mesh(wingGeo, hullMat), castShadow);
    wingR.position.set(1.45, 0.52, -0.55);
    wingR.rotation.y = -0.38;
    wingR.rotation.z = 0.05;
    root.add(wingR);

    // Wingtip laser cannons
    const cannonGeo = makeCyl('sf_cannon', 0.05, 0.06, 1.35, 8);
    const cannonL = configureShadow(new THREE.Mesh(cannonGeo, darkMetalMat), castShadow);
    cannonL.rotation.x = Math.PI * 0.5;
    cannonL.position.set(-2.45, 0.48, -0.45);
    root.add(cannonL);

    const cannonR = configureShadow(new THREE.Mesh(cannonGeo, darkMetalMat), castShadow);
    cannonR.rotation.x = Math.PI * 0.5;
    cannonR.position.set(2.45, 0.48, -0.45);
    root.add(cannonR);

    // Vertical tail stabilizer
    const stabilizer = configureShadow(
      new THREE.Mesh(makeBox('sf_stabilizer', 0.09, 0.78, 0.95), hullMat),
      castShadow
    );
    stabilizer.position.set(0, 1.05, -1.35);
    stabilizer.rotation.x = -0.32;
    root.add(stabilizer);

    // Twin glowing ion exhaust thrusters
    const nacelleGeo = makeCyl('sf_nacelle', 0.24, 0.28, 1.25, 12);
    const glowGeo = makeCyl('sf_ion_glow', 0.18, 0.08, 0.55, 12);

    const nacelleL = configureShadow(new THREE.Mesh(nacelleGeo, darkMetalMat), castShadow);
    nacelleL.rotation.x = Math.PI * 0.5;
    nacelleL.position.set(-0.42, 0.54, -1.65);
    root.add(nacelleL);

    const nacelleR = configureShadow(new THREE.Mesh(nacelleGeo, darkMetalMat), castShadow);
    nacelleR.rotation.x = Math.PI * 0.5;
    nacelleR.position.set(0.42, 0.54, -1.65);
    root.add(nacelleR);

    const ionL = new THREE.Mesh(glowGeo, ionMat);
    ionL.rotation.x = Math.PI * 0.5;
    ionL.position.set(-0.42, 0.54, -2.42);
    root.add(ionL);

    const ionR = new THREE.Mesh(glowGeo, ionMat);
    ionR.rotation.x = Math.PI * 0.5;
    ionR.position.set(0.42, 0.54, -2.42);
    root.add(ionR);

    return {
      root: root,
      thrusters: [ionL, ionR],
      dispose: function () {}
    };
  }

  // ============================================================================
  // SHARED CACHE DISPOSAL
  // ============================================================================
  function disposeShared() {
    for (const k in _geoCache) {
      if (_geoCache[k] && typeof _geoCache[k].dispose === 'function') {
        _geoCache[k].dispose();
      }
      delete _geoCache[k];
    }
    for (const k in _matCache) {
      if (_matCache[k] && typeof _matCache[k].dispose === 'function') {
        _matCache[k].dispose();
      }
      delete _matCache[k];
    }
  }

  global.RealisticCharacterRig = {
    createHumanoid: createHumanoid,
    animateHumanoid: animateHumanoid,
    createCruiser: createCruiser,
    createStarfighter: createStarfighter,
    disposeShared: disposeShared
  };
})(typeof window !== 'undefined' ? window : globalThis);
