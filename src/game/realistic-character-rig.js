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

  function makeLathe(key, pts, segs, deformFn) {
    return getCachedGeo(key, function (THREE) {
      const v2 = [];
      for (let i = 0; i < pts.length; i += 1) {
        v2.push(new THREE.Vector2(pts[i][0], pts[i][1]));
      }
      const geo = new THREE.LatheGeometry(v2, segs || 16);
      if (deformFn) {
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i += 1) {
          deformFn(pos, i, pos.getX(i), pos.getY(i), pos.getZ(i));
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
      }
      return geo;
    });
  }

  function makeDeformedSphere(key, r, ws, hs, deformFn) {
    return getCachedGeo(key, function (THREE) {
      const geo = new THREE.SphereGeometry(r, ws || 16, hs || 14);
      if (deformFn) {
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i += 1) {
          deformFn(pos, i, pos.getX(i), pos.getY(i), pos.getZ(i));
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
      }
      return geo;
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
    const isExplorer = variant === 'canadian-explorer';
    const castShadow = o.castShadow !== undefined ? !!o.castShadow : true;

    const defaultSuit = isExplorer ? 0xb91c1c : 0x1e293b;
    const defaultAccent = isExplorer ? 0xf59e0b : 0x38bdf8;
    const suitColor = o.suitColor !== undefined ? o.suitColor : defaultSuit;
    const accentColor = o.accentColor !== undefined ? o.accentColor : defaultAccent;

    // Materials (cached per color/variant key to minimize shader switches)
    const suitMat = getCachedMat('suit_' + variant + '_' + suitColor, function (T) {
      return createStdMat(T, {
        color: suitColor,
        roughness: isExplorer ? 0.78 : 0.44,
        metalness: isExplorer ? 0.06 : 0.30
      });
    });

    const underSuitMat = getCachedMat('undersuit_' + variant, function (T) {
      return createStdMat(T, {
        color: isExplorer ? 0x1f2937 : 0x0f172a,
        roughness: 0.74,
        metalness: 0.18
      });
    });

    const pantsMat = getCachedMat('pants_' + variant, function (T) {
      return createStdMat(T, {
        color: isExplorer ? 0x293241 : 0x162032,
        roughness: isExplorer ? 0.80 : 0.52,
        metalness: isExplorer ? 0.04 : 0.24
      });
    });

    const accentMat = getCachedMat('accent_' + accentColor, function (T) {
      return createStdMat(T, {
        color: accentColor,
        roughness: 0.35,
        metalness: 0.42,
        emissive: accentColor,
        emissiveIntensity: 0.20
      });
    });

    const skinMat = getCachedMat('skin_human_warm', function (T) {
      return createStdMat(T, {
        color: 0xdca588,
        roughness: 0.55,
        metalness: 0.02
      });
    });

    const lipMat = getCachedMat('lip_human_warm', function (T) {
      return createStdMat(T, {
        color: 0xb56e5d,
        roughness: 0.58,
        metalness: 0.02
      });
    });

    const hairMat = getCachedMat('hair_human_dark', function (T) {
      return createStdMat(T, {
        color: 0x2c1d14,
        roughness: 0.82,
        metalness: 0.04
      });
    });

    const scleraMat = getCachedMat('eye_sclera', function (T) {
      return createStdMat(T, {
        color: 0xf8fafc,
        roughness: 0.25,
        metalness: 0.02
      });
    });

    const irisMat = getCachedMat('eye_iris_' + variant, function (T) {
      return createStdMat(T, {
        color: isExplorer ? 0x3b6e8c : 0x2e6f7e,
        roughness: 0.20,
        metalness: 0.05
      });
    });

    const pupilMat = getCachedMat('eye_pupil', function (T) {
      return createStdMat(T, {
        color: 0x0b0f17,
        roughness: 0.15,
        metalness: 0.05
      });
    });

    const clearVisorMat = getCachedMat('clear_visor_' + accentColor, function (T) {
      return createStdMat(T, {
        color: 0xa5f3fc,
        roughness: 0.08,
        metalness: 0.20,
        transparent: true,
        opacity: 0.24,
        depthWrite: false
      });
    });

    const goggleLensMat = getCachedMat('goggle_lens_' + accentColor, function (T) {
      return createStdMat(T, {
        color: 0xf97316,
        roughness: 0.14,
        metalness: 0.75,
        emissive: 0x9a3412,
        emissiveIntensity: 0.25
      });
    });

    const darkGearMat = getCachedMat('dark_gear', function (T) {
      return createStdMat(T, {
        color: 0x111827,
        roughness: 0.65,
        metalness: 0.26
      });
    });

    const bootMat = getCachedMat('boot_leather_' + variant, function (T) {
      return createStdMat(T, {
        color: isExplorer ? 0x3b2618 : 0x111827,
        roughness: isExplorer ? 0.72 : 0.54,
        metalness: isExplorer ? 0.08 : 0.28
      });
    });

    const furTrimMat = getCachedMat('fur_trim', function (T) {
      return createStdMat(T, {
        color: 0xe5e7eb,
        roughness: 0.92,
        metalness: 0.02
      });
    });

    const toqueMat = getCachedMat('toque_knit_' + suitColor, function (T) {
      return createStdMat(T, {
        color: 0x1e293b,
        roughness: 0.90,
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
    // PELVIS / HIPS ROOT (y = 0.92, grounded at y = 0)
    // --------------------------------------------------------------------------
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.92, 0);
    root.add(pelvis);

    const pelvisGeo = makeLathe(
      'hum_pelvis_anat',
      [
        [0.092, -0.075],
        [0.132, -0.035],
        [0.144, 0.015],
        [0.136, 0.055],
        [0.122, 0.088]
      ],
      18,
      function (pos, i, x, y, z) {
        const sx = x * 1.18;
        let sz = z * 0.78;
        // Subtle gluteal curve in back
        if (z < 0 && y < 0.04) {
          sz *= 1.14;
        }
        pos.setXYZ(i, sx, y, sz);
      }
    );
    const pelvisMesh = configureShadow(new THREE.Mesh(pelvisGeo, pantsMat), castShadow);
    pelvis.add(pelvisMesh);

    const beltGeo = makeLathe(
      'hum_belt_anat',
      [
        [0.126, -0.024],
        [0.129, 0.0],
        [0.125, 0.024]
      ],
      18,
      function (pos, i, x, y, z) {
        pos.setXYZ(i, x * 1.20, y, z * 0.82);
      }
    );
    const beltMesh = configureShadow(new THREE.Mesh(beltGeo, darkGearMat), castShadow);
    beltMesh.position.set(0, 0.068, 0);
    pelvis.add(beltMesh);

    const buckleMesh = configureShadow(
      new THREE.Mesh(makeBox('hum_buckle', 0.056, 0.038, 0.022), accentMat),
      castShadow
    );
    buckleMesh.position.set(0, 0.068, 0.105);
    pelvis.add(buckleMesh);

    // Subtle side hip pouches
    const pouchGeo = makeBox('hum_hip_pouch', 0.035, 0.065, 0.068);
    const pouchL = configureShadow(new THREE.Mesh(pouchGeo, darkGearMat), castShadow);
    pouchL.position.set(-0.155, 0.048, 0.01);
    pelvis.add(pouchL);
    const pouchR = configureShadow(new THREE.Mesh(pouchGeo, darkGearMat), castShadow);
    pouchR.position.set(0.155, 0.048, 0.01);
    pelvis.add(pouchR);

    // --------------------------------------------------------------------------
    // LOWER TORSO / ABDOMEN (pivot at y = 0.07 relative to pelvis -> world 0.99)
    // --------------------------------------------------------------------------
    const torso = new THREE.Group();
    torso.position.set(0, 0.07, 0);
    pelvis.add(torso);

    const abdomenGeo = makeLathe(
      'hum_abdomen_anat_' + variant,
      [
        [0.120, -0.02],
        [0.116, 0.04],
        [0.124, 0.10],
        [0.138, 0.155]
      ],
      18,
      function (pos, i, x, y, z) {
        const w = isExplorer ? 1.20 : 1.15;
        const d = isExplorer ? 0.84 : 0.77;
        pos.setXYZ(i, x * w, y, z * d);
      }
    );
    const abdomenMesh = configureShadow(new THREE.Mesh(abdomenGeo, suitMat), castShadow);
    torso.add(abdomenMesh);

    // --------------------------------------------------------------------------
    // UPPER TORSO / RIBCAGE (pivot at y = 0.14 relative to torso -> world 1.13)
    // --------------------------------------------------------------------------
    const chest = new THREE.Group();
    chest.position.set(0, 0.14, 0);
    torso.add(chest);

    const chestGeo = makeLathe(
      'hum_chest_anat_' + variant,
      [
        [0.136, -0.02],
        [0.150, 0.05],
        [0.168, 0.13],
        [0.174, 0.20],
        [0.148, 0.255],
        [0.104, 0.295],
        [0.074, 0.315]
      ],
      20,
      function (pos, i, x, y, z) {
        const w = isExplorer ? 1.24 : 1.20;
        let sx = x * w;
        let sz = z * (isExplorer ? 0.84 : 0.78);
        // Sculpted pectoral & upper-back lat contour
        if (z > 0 && y > 0.07 && y < 0.23) {
          sz *= 1.10;
        } else if (z < 0 && y > 0.09 && y < 0.24) {
          sz *= 1.07;
        }
        // Gentle shoulder slope toward neck
        if (y > 0.24) {
          sx *= 0.96;
        }
        pos.setXYZ(i, sx, y, sz);
      }
    );
    const chestMesh = configureShadow(new THREE.Mesh(chestGeo, suitMat), castShadow);
    chest.add(chestMesh);

    if (isExplorer) {
      // Parka front zipper placket + subtle lapel collar
      const placket = configureShadow(
        new THREE.Mesh(makeBox('hum_parka_placket', 0.036, 0.38, 0.02), darkGearMat),
        castShadow
      );
      placket.position.set(0, 0.09, 0.142);
      chest.add(placket);

      const zipAccent = configureShadow(
        new THREE.Mesh(makeBox('hum_parka_zip', 0.012, 0.36, 0.012), accentMat),
        castShadow
      );
      zipAccent.position.set(0, 0.09, 0.150);
      chest.add(zipAccent);
    } else {
      // Sleek tactical flight-suit chest plate & accent core
      const chestPlate = configureShadow(
        new THREE.Mesh(makeBox('hum_exo_plate', 0.19, 0.16, 0.035), underSuitMat),
        castShadow
      );
      chestPlate.position.set(0, 0.15, 0.128);
      chest.add(chestPlate);

      const coreStrip = configureShadow(
        new THREE.Mesh(makeBox('hum_exo_core', 0.09, 0.025, 0.018), accentMat),
        castShadow
      );
      coreStrip.position.set(0, 0.17, 0.146);
      chest.add(coreStrip);
    }

    // Collar + Anatomical Neck
    const collarGeo = makeLathe(
      'hum_collar_anat_' + variant,
      [
        [0.088, -0.015],
        [0.078, 0.022],
        [0.074, 0.048]
      ],
      16,
      function (pos, i, x, y, z) {
        pos.setXYZ(i, x * 1.05, y, z * 0.96);
      }
    );
    const collarMesh = configureShadow(
      new THREE.Mesh(collarGeo, isExplorer ? furTrimMat : darkGearMat),
      castShadow
    );
    collarMesh.position.set(0, 0.295, 0.005);
    chest.add(collarMesh);

    const neckGeo = makeLathe(
      'hum_neck_anat',
      [
        [0.060, 0.0],
        [0.051, 0.045],
        [0.053, 0.095]
      ],
      14,
      function (pos, i, x, y, z) {
        pos.setXYZ(i, x * 0.96, y, z * 1.02);
      }
    );
    const neckMesh = configureShadow(new THREE.Mesh(neckGeo, skinMat), castShadow);
    neckMesh.position.set(0, 0.305, 0.008);
    chest.add(neckMesh);

    // Sleek Backpack / Thruster Pack
    const backpack = new THREE.Group();
    backpack.position.set(0, 0.145, -0.155);
    chest.add(backpack);

    const packBody = configureShadow(
      new THREE.Mesh(makeBox('hum_pack_body', 0.19, 0.24, 0.09), darkGearMat),
      castShadow
    );
    backpack.add(packBody);

    const packAccent = configureShadow(
      new THREE.Mesh(makeBox('hum_pack_accent', 0.12, 0.13, 0.02), accentMat),
      castShadow
    );
    packAccent.position.set(0, 0.01, -0.048);
    backpack.add(packAccent);

    let thrusterGlowL = null;
    let thrusterGlowR = null;
    if (!isExplorer) {
      const nozzleGeo = makeCyl('hum_nozzle', 0.028, 0.036, 0.06, 10);
      const glowGeo = makeCone('hum_thruster_cone', 0.024, 0.085, 10);

      const nozzleL = configureShadow(new THREE.Mesh(nozzleGeo, darkGearMat), castShadow);
      nozzleL.position.set(-0.062, -0.125, -0.015);
      backpack.add(nozzleL);

      const nozzleR = configureShadow(new THREE.Mesh(nozzleGeo, darkGearMat), castShadow);
      nozzleR.position.set(0.062, -0.125, -0.015);
      backpack.add(nozzleR);

      thrusterGlowL = new THREE.Mesh(glowGeo, thrusterGlowMat);
      thrusterGlowL.rotation.x = Math.PI;
      thrusterGlowL.position.set(-0.062, -0.19, -0.015);
      backpack.add(thrusterGlowL);

      thrusterGlowR = new THREE.Mesh(glowGeo, thrusterGlowMat);
      thrusterGlowR.rotation.x = Math.PI;
      thrusterGlowR.position.set(0.062, -0.19, -0.015);
      backpack.add(thrusterGlowR);
    } else {
      const bedroll = configureShadow(
        new THREE.Mesh(makeCyl('hum_bedroll', 0.042, 0.042, 0.21, 10), suitMat),
        castShadow
      );
      bedroll.rotation.z = Math.PI * 0.5;
      bedroll.position.set(0, 0.135, -0.01);
      backpack.add(bedroll);
    }

    // --------------------------------------------------------------------------
    // HEAD & HUMAN FACE (pivot at y = 0.39 relative to chest -> world 1.52, top ~1.80)
    // --------------------------------------------------------------------------
    const head = new THREE.Group();
    head.position.set(0, 0.39, 0.012);
    chest.add(head);

    // Sculpted human cranium + cheekbones + tapered jawline + chin
    const headGeo = makeDeformedSphere('hum_head_sculpt', 0.106, 20, 16, function (pos, i, x, y, z) {
      let sx = x * 0.84;
      let sy = y * 1.14;
      let sz = z * 1.04;

      // Taper lower face into realistic jawline & chin
      if (y < 0.0) {
        const t = clamp(-y / 0.106, 0, 1);
        sx *= 1.0 - t * 0.42;
        if (z > 0) {
          // Project chin slightly forward, narrow at tip
          sz += t * 0.018 * (1.0 - Math.min(1, Math.abs(x) / 0.06));
        } else {
          // Under-jaw taper toward neck
          sz *= 1.0 - t * 0.32;
        }
      }
      // Subtle brow ridge & temple flattening
      if (y > 0.005 && y < 0.04 && z > 0.06) {
        sz += 0.006;
      }
      if (Math.abs(x) > 0.075 && y > 0.0) {
        sx *= 0.96;
      }
      pos.setXYZ(i, sx, sy, sz);
    });
    const cranium = configureShadow(new THREE.Mesh(headGeo, skinMat), castShadow);
    cranium.position.set(0, 0.125, 0);
    head.add(cranium);

    // Nose (bridge + tip)
    const noseGeo = makeDeformedSphere('hum_nose', 0.014, 10, 8, function (pos, i, x, y, z) {
      pos.setXYZ(i, x * 0.72, y * 1.45, z * 1.15);
    });
    const nose = configureShadow(new THREE.Mesh(noseGeo, skinMat), castShadow);
    nose.position.set(0, 0.112, 0.103);
    nose.rotation.x = -0.22;
    head.add(nose);

    // Mouth / lips
    const mouthMesh = new THREE.Mesh(makeBox('hum_mouth', 0.034, 0.008, 0.012), lipMat);
    mouthMesh.position.set(0, 0.068, 0.094);
    head.add(mouthMesh);

    // Ears
    const earGeo = makeDeformedSphere('hum_ear', 0.018, 8, 8, function (pos, i, x, y, z) {
      pos.setXYZ(i, x * 0.42, y * 1.35, z * 0.85);
    });
    const earL = configureShadow(new THREE.Mesh(earGeo, skinMat), castShadow);
    earL.position.set(-0.088, 0.118, -0.004);
    earL.rotation.y = -0.25;
    head.add(earL);

    const earR = configureShadow(new THREE.Mesh(earGeo, skinMat), castShadow);
    earR.position.set(0.088, 0.118, -0.004);
    earR.rotation.y = 0.25;
    head.add(earR);

    // Expressive Eyes (sclera + iris + pupil + blinking upper eyelid) + Eyebrows
    const scleraGeo = makeSphere('hum_eye_sclera', 0.013, 10, 8);
    const irisGeo = makeSphere('hum_eye_iris', 0.008, 10, 8);
    const pupilGeo = makeSphere('hum_eye_pupil', 0.0042, 8, 6);
    const eyelidGeo = makeDeformedSphere('hum_eyelid', 0.0145, 10, 8, function (pos, i, x, y, z) {
      // Upper hemisphere cap for blinking eyelid
      if (y < 0) {
        pos.setXYZ(i, x, y * 0.12, z);
      }
    });
    const browGeo = makeBox('hum_eyebrow', 0.028, 0.006, 0.010);

    function buildEye(side) {
      const sign = side === 'L' ? -1 : 1;
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(sign * 0.032, 0.135, 0.089);
      head.add(eyeGroup);

      const sclera = new THREE.Mesh(scleraGeo, scleraMat);
      sclera.scale.set(1.05, 0.78, 0.65);
      eyeGroup.add(sclera);

      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(0, 0, 0.0055);
      iris.scale.set(1.0, 1.0, 0.45);
      eyeGroup.add(iris);

      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(0, 0, 0.008);
      pupil.scale.set(1.0, 1.0, 0.45);
      eyeGroup.add(pupil);

      const eyelid = new THREE.Mesh(eyelidGeo, skinMat);
      eyelid.scale.set(1.08, 0.92, 0.80);
      eyelid.rotation.x = -0.55; // open position
      eyeGroup.add(eyelid);

      const brow = new THREE.Mesh(browGeo, hairMat);
      brow.position.set(sign * 0.032, 0.156, 0.095);
      brow.rotation.z = sign * -0.08;
      head.add(brow);

      return eyelid;
    }

    const eyelidL = buildEye('L');
    const eyelidR = buildEye('R');

    // Realistic Hair Cap + Fringe
    const hairCapGeo = makeDeformedSphere('hum_hair_cap', 0.111, 18, 14, function (pos, i, x, y, z) {
      let sx = x * 0.87;
      let sy = y * 1.12;
      let sz = z * 1.06;
      // Cut away front face region so eyes/nose/mouth stay completely open
      if (z > 0.025 && y < 0.055) {
        sz = 0.025;
      }
      pos.setXYZ(i, sx, sy, sz);
    });
    const hairCap = configureShadow(new THREE.Mesh(hairCapGeo, hairMat), castShadow);
    hairCap.position.set(0, 0.134, -0.006);
    head.add(hairCap);

    // Front hair fringe visible under toque or behind visor
    const fringe = configureShadow(
      new THREE.Mesh(makeBox('hum_hair_fringe', 0.125, 0.026, 0.045), hairMat),
      castShadow
    );
    fringe.position.set(0, 0.192, 0.078);
    fringe.rotation.x = 0.25;
    head.add(fringe);

    if (isExplorer) {
      // Knit winter toque + folded cuff + pushed-up goggles on forehead
      const toqueGeo = makeLathe(
        'hum_toque',
        [
          [0.098, 0.0],
          [0.102, 0.035],
          [0.096, 0.075],
          [0.072, 0.115],
          [0.025, 0.138],
          [0.0, 0.142]
        ],
        18,
        function (pos, i, x, y, z) {
          pos.setXYZ(i, x * 0.92, y, z * 1.06);
        }
      );
      const toque = configureShadow(new THREE.Mesh(toqueGeo, toqueMat), castShadow);
      toque.position.set(0, 0.185, -0.008);
      toque.rotation.x = -0.14;
      head.add(toque);

      const toqueCuff = configureShadow(
        new THREE.Mesh(makeTorus('hum_toque_cuff', 0.098, 0.018, 8, 20), suitMat),
        castShadow
      );
      toqueCuff.rotation.x = Math.PI * 0.5 - 0.14;
      toqueCuff.scale.set(0.92, 1.06, 1.0);
      toqueCuff.position.set(0, 0.195, -0.006);
      head.add(toqueCuff);

      // Pushed-up ski goggles resting on toque forehead (face & eyes stay 100% visible)
      const goggles = configureShadow(
        new THREE.Mesh(makeBox('hum_goggles_forehead', 0.125, 0.032, 0.036), goggleLensMat),
        castShadow
      );
      goggles.position.set(0, 0.212, 0.088);
      goggles.rotation.x = -0.22;
      head.add(goggles);
    } else {
      // Exo-Operative: Open-face tactical flight helmet with clear polycarbonate visor
      const helmetShellGeo = makeDeformedSphere('hum_exo_helmet', 0.122, 18, 14, function (pos, i, x, y, z) {
        let sx = x * 0.92;
        let sy = y * 1.12;
        let sz = z * 1.08;
        // Open front face cutout
        if (z > 0.015 && y < 0.055 && Math.abs(x) < 0.082) {
          sz = 0.015;
        }
        pos.setXYZ(i, sx, sy, sz);
      });
      const helmetShell = configureShadow(new THREE.Mesh(helmetShellGeo, suitMat), castShadow);
      helmetShell.position.set(0, 0.138, -0.010);
      head.add(helmetShell);

      const helmetCrest = configureShadow(
        new THREE.Mesh(makeBox('hum_crest', 0.034, 0.026, 0.16), accentMat),
        castShadow
      );
      helmetCrest.position.set(0, 0.268, -0.015);
      head.add(helmetCrest);

      // Ear comm pods
      const commGeo = makeCyl('hum_comm_pod', 0.024, 0.024, 0.022, 12);
      const commL = configureShadow(new THREE.Mesh(commGeo, accentMat), castShadow);
      commL.rotation.z = Math.PI * 0.5;
      commL.position.set(-0.105, 0.122, -0.005);
      head.add(commL);
      const commR = configureShadow(new THREE.Mesh(commGeo, accentMat), castShadow);
      commR.rotation.z = Math.PI * 0.5;
      commR.position.set(0.105, 0.122, -0.005);
      head.add(commR);

      // Clear/tinted visor so eyes, eyebrows, blinking, nose, and hair are visible
      const visorGeo = makeDeformedSphere('hum_clear_visor', 0.114, 16, 12, function (pos, i, x, y, z) {
        pos.setXYZ(i, x * 0.94, y * 0.62, z * 0.96);
      });
      const visor = new THREE.Mesh(visorGeo, clearVisorMat);
      visor.position.set(0, 0.132, 0.024);
      head.add(visor);
    }

    // --------------------------------------------------------------------------
    // ARMS (blended deltoid -> tapered upper arm -> elbow -> forearm -> wrist -> articulated hand)
    // --------------------------------------------------------------------------
    const deltoidGeo = makeLathe(
      'hum_deltoid_blend',
      [
        [0.048, -0.06],
        [0.056, -0.01],
        [0.048, 0.032],
        [0.022, 0.052],
        [0.0, 0.058]
      ],
      14,
      function (pos, i, x, y, z) {
        pos.setXYZ(i, x * 0.96, y, z * 1.04);
      }
    );

    const upperArmGeo = makeLathe(
      'hum_upper_arm_anat',
      [
        [0.038, -0.27],
        [0.044, -0.18],
        [0.049, -0.09],
        [0.052, 0.0]
      ],
      14,
      function (pos, i, x, y, z) {
        pos.setXYZ(i, x * 0.94, y, z * 1.04);
      }
    );

    const forearmGeo = makeLathe(
      'hum_forearm_anat',
      [
        [0.028, -0.24],
        [0.034, -0.15],
        [0.043, -0.06],
        [0.039, 0.0]
      ],
      14,
      function (pos, i, x, y, z) {
        pos.setXYZ(i, x * 0.96, y, z * 1.02);
      }
    );

    const elbowCapGeo = makeSphere('hum_elbow_anat', 0.038, 10, 8);
    const palmGeo = makeBox('hum_hand_palm', 0.024, 0.066, 0.054);
    const fingersGeo = makeBox('hum_hand_fingers', 0.020, 0.056, 0.050);
    const thumbGeo = makeCyl('hum_hand_thumb', 0.009, 0.011, 0.044, 8);

    function buildArm(side) {
      const sign = side === 'L' ? -1 : 1;
      const shoulder = new THREE.Group();
      shoulder.position.set(sign * 0.205, 0.225, 0);
      chest.add(shoulder);

      // Smoothly blended deltoid cap tucked into upper ribcage
      const deltoid = configureShadow(
        new THREE.Mesh(deltoidGeo, suitMat),
        castShadow
      );
      deltoid.rotation.z = sign * 0.14;
      shoulder.add(deltoid);

      const upperArm = configureShadow(
        new THREE.Mesh(upperArmGeo, suitMat),
        castShadow
      );
      shoulder.add(upperArm);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.27, 0);
      shoulder.add(elbow);

      const elbowCap = configureShadow(
        new THREE.Mesh(elbowCapGeo, isExplorer ? suitMat : underSuitMat),
        castShadow
      );
      elbow.add(elbowCap);

      const forearm = configureShadow(
        new THREE.Mesh(forearmGeo, isExplorer ? suitMat : underSuitMat),
        castShadow
      );
      elbow.add(forearm);

      const wrist = new THREE.Group();
      wrist.position.set(0, -0.24, 0);
      elbow.add(wrist);

      const handMat = isExplorer ? skinMat : darkGearMat;

      if (isExplorer) {
        const cuff = configureShadow(
          new THREE.Mesh(makeCyl('hum_sleeve_cuff', 0.032, 0.033, 0.024, 10), darkGearMat),
          castShadow
        );
        cuff.position.set(0, 0.008, 0);
        wrist.add(cuff);
      }

      const palm = configureShadow(new THREE.Mesh(palmGeo, handMat), castShadow);
      palm.position.set(0, -0.035, 0.004);
      wrist.add(palm);

      const fingers = configureShadow(new THREE.Mesh(fingersGeo, handMat), castShadow);
      fingers.position.set(sign * -0.004, -0.088, 0.010);
      fingers.rotation.z = sign * -0.14;
      wrist.add(fingers);

      const thumb = configureShadow(new THREE.Mesh(thumbGeo, handMat), castShadow);
      thumb.position.set(sign * -0.008, -0.038, 0.032);
      thumb.rotation.x = 0.48;
      thumb.rotation.z = sign * 0.22;
      wrist.add(thumb);

      return { shoulder: shoulder, elbow: elbow, wrist: wrist };
    }

    const armL = buildArm('L');
    const armR = buildArm('R');

    // --------------------------------------------------------------------------
    // LEGS (hip -> tapered thigh -> knee -> shaped calf -> ankle -> sculpted boot at y = 0)
    // --------------------------------------------------------------------------
    const thighGeo = makeLathe(
      'hum_thigh_anat',
      [
        [0.052, -0.43],
        [0.058, -0.32],
        [0.068, -0.18],
        [0.076, -0.06],
        [0.074, 0.0]
      ],
      14,
      function (pos, i, x, y, z) {
        // Subtle quadriceps/hamstring fullness
        const sz = z > 0 ? z * 1.06 : z * 1.02;
        pos.setXYZ(i, x * 0.96, y, sz);
      }
    );

    const calfGeo = makeLathe(
      'hum_calf_anat',
      [
        [0.038, -0.41],
        [0.042, -0.30],
        [0.056, -0.17],
        [0.058, -0.10],
        [0.051, 0.0]
      ],
      14,
      function (pos, i, x, y, z) {
        let sz = z;
        // Gastrocnemius calf muscle curve in upper-back half
        if (z < 0 && y > -0.26 && y < -0.05) {
          sz *= 1.18;
        }
        pos.setXYZ(i, x * 0.94, y, sz);
      }
    );

    const kneeBallGeo = makeSphere('hum_knee_anat', 0.050, 10, 8);
    const bootUpperGeo = makeLathe(
      'hum_boot_upper_anat',
      [
        [0.044, -0.062],
        [0.046, -0.025],
        [0.042, 0.025]
      ],
      12
    );
    const bootFootGeo = makeBox('hum_boot_foot', 0.088, 0.046, 0.165);
    const bootToeGeo = makeDeformedSphere('hum_boot_toe', 0.044, 10, 8, function (pos, i, x, y, z) {
      pos.setXYZ(i, x * 0.98, y * 0.58, z * 1.25);
    });
    const bootSoleGeo = makeBox('hum_boot_sole', 0.094, 0.022, 0.215);

    function buildLeg(side) {
      const sign = side === 'L' ? -1 : 1;
      const hip = new THREE.Group();
      hip.position.set(sign * 0.098, 0, 0); // world y = 0.92
      pelvis.add(hip);

      const thigh = configureShadow(new THREE.Mesh(thighGeo, pantsMat), castShadow);
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.set(0, -0.43, 0); // world y = 0.49
      hip.add(knee);

      const kneeCap = configureShadow(new THREE.Mesh(kneeBallGeo, pantsMat), castShadow);
      knee.add(kneeCap);

      const shin = configureShadow(new THREE.Mesh(calfGeo, pantsMat), castShadow);
      knee.add(shin);

      const ankle = new THREE.Group();
      ankle.position.set(0, -0.41, 0); // world y = 0.08
      knee.add(ankle);

      // Sculpted boot/shoe: sole bottom at y = -0.08 relative to ankle -> world y = 0.00
      const bootShaft = configureShadow(new THREE.Mesh(bootUpperGeo, bootMat), castShadow);
      ankle.add(bootShaft);

      const bootFoot = configureShadow(new THREE.Mesh(bootFootGeo, bootMat), castShadow);
      bootFoot.position.set(0, -0.046, 0.036);
      ankle.add(bootFoot);

      const bootToe = configureShadow(new THREE.Mesh(bootToeGeo, bootMat), castShadow);
      bootToe.position.set(0, -0.048, 0.105);
      ankle.add(bootToe);

      const bootSole = configureShadow(new THREE.Mesh(bootSoleGeo, darkGearMat), castShadow);
      bootSole.position.set(0, -0.069, 0.042); // bottom = -0.069 - 0.011 = -0.080
      ankle.add(bootSole);

      return { hip: hip, knee: knee, ankle: ankle };
    }

    const legL = buildLeg('L');
    const legR = buildLeg('R');

    return {
      root: root,
      pelvis: pelvis,
      torso: torso,
      chest: chest,
      head: head,
      eyelidL: eyelidL,
      eyelidR: eyelidR,
      hipL: legL.hip,
      hipR: legR.hip,
      kneeL: legL.knee,
      kneeR: legR.knee,
      ankleL: legL.ankle,
      ankleR: legR.ankle,
      shoulderL: armL.shoulder,
      shoulderR: armR.shoulder,
      elbowL: armL.elbow,
      elbowR: armR.elbow,
      wristL: armL.wrist,
      wristR: armR.wrist,
      thrusterGlowL: thrusterGlowL,
      thrusterGlowR: thrusterGlowR,
      variant: variant,
      _anim: {
        walkPhase: 0,
        idlePhase: 0,
        pelvisY: 0.92,
        blinkTimer: 2.8,
        blinkProgress: 0,
        wasGrounded: true,
        landTimer: 0
      },
      dispose: function () {
        // Shared geometries/materials are disposed via disposeShared()
      }
    };
  }

  // ============================================================================
  // ZERO-ALLOCATION LIFELIKE HUMAN KINEMATICS
  // ============================================================================
  function animateHumanoid(rig, state, dt) {
    if (!rig || !rig.torso) return;

    const s = state || {};
    const clampedDt = clamp(dt || 0, 0, 0.05);
    if (clampedDt <= 0) return;

    const anim = rig._anim || (rig._anim = {
      walkPhase: 0,
      idlePhase: 0,
      pelvisY: 0.92,
      blinkTimer: 2.8,
      blinkProgress: 0,
      wasGrounded: true,
      landTimer: 0
    });

    const speed = typeof s.speed === 'number' ? Math.max(0, s.speed) : 0;
    const isMoving = !!s.isMoving && speed > 0.05;
    const isGrounded = s.isGrounded !== undefined ? !!s.isGrounded : true;
    const isFiring = !!s.isFiring;
    const isSeated = !!s.isSeated;

    anim.idlePhase += clampedDt * 1.9;

    // Detect landing transition for soft knee-bend compression
    if (isGrounded && !anim.wasGrounded && !isSeated) {
      anim.landTimer = 0.22;
    }
    anim.wasGrounded = isGrounded;
    if (anim.landTimer > 0) {
      anim.landTimer = Math.max(0, anim.landTimer - clampedDt);
    }

    // Periodic natural eye blinking every ~3-5 seconds (zero allocations)
    let blinkClose = 0;
    if (anim.blinkProgress > 0) {
      anim.blinkProgress += clampedDt / 0.14;
      if (anim.blinkProgress >= 1.0) {
        anim.blinkProgress = 0;
        // Deterministic pseudo-random next blink interval in [3.1, 4.9] seconds
        anim.blinkTimer = 3.1 + ((Math.sin(anim.idlePhase * 7.3) + 1) * 0.9);
      } else {
        // Fast close, slightly softer open
        blinkClose = Math.sin(anim.blinkProgress * Math.PI);
      }
    } else {
      anim.blinkTimer -= clampedDt;
      if (anim.blinkTimer <= 0) {
        anim.blinkProgress = 0.001;
      }
    }

    if (rig.eyelidL && rig.eyelidR) {
      const lidAngle = -0.55 + blinkClose * 0.92;
      rig.eyelidL.rotation.x = lidAngle;
      rig.eyelidR.rotation.x = lidAngle;
    }

    // Target joint angles (all scalars, zero allocations)
    let tPelvisY = 0.916;
    let tPelvisX = 0;
    let tPelvisRy = 0;
    let tPelvisRz = 0;

    let tTorsoRx = 0.02;
    let tTorsoRy = 0;
    let tChestRx = 0;
    let tChestRy = 0;
    let tChestScaleXZ = 1.0;

    let tHeadRx = 0;
    let tHeadRy = 0;
    let tHeadRz = 0;

    // Natural ~6 deg resting knee & stance posture
    let tHipLRx = -0.05;
    let tHipRRx = -0.05;
    let tHipLRy = 0.05;
    let tHipRRy = -0.05;
    let tKneeLRx = 0.105;
    let tKneeRRx = 0.105;
    let tAnkleLRx = -0.055;
    let tAnkleRRx = -0.055;

    // Natural ~10 deg resting elbow bend
    let tShoulderLRx = -0.04;
    let tShoulderLRz = 0.075;
    let tShoulderRRx = -0.04;
    let tShoulderRRz = -0.075;
    let tElbowLRx = -0.175;
    let tElbowRRx = -0.175;
    let tWristLRx = 0;
    let tWristRRx = 0;

    if (isSeated) {
      tPelvisY = 0.62;
      tTorsoRx = -0.10;
      tChestRx = -0.04;
      tHipLRx = -1.35;
      tHipRRx = -1.35;
      tHipLRy = 0.08;
      tHipRRy = -0.08;
      tKneeLRx = 1.42;
      tKneeRRx = 1.42;
      tAnkleLRx = -0.08;
      tAnkleRRx = -0.08;
      tShoulderLRx = -0.92;
      tShoulderRRx = -0.92;
      tShoulderLRz = 0.12;
      tShoulderRRz = -0.12;
      tElbowLRx = -0.52;
      tElbowRRx = -0.52;
    } else if (!isGrounded) {
      // Airborne jump / jetpack knee tuck & arm balance
      const hover = Math.sin(anim.idlePhase * 1.8) * 0.014;
      tPelvisY = 0.93 + hover;
      tTorsoRx = 0.10;
      tChestRx = 0.06;
      tHeadRx = -0.10;

      tHipLRx = -0.58;
      tHipRRx = -0.32;
      tKneeLRx = 0.96;
      tKneeRRx = 0.64;
      tAnkleLRx = 0.28;
      tAnkleRRx = 0.22;

      tShoulderLRx = -0.26;
      tShoulderRRx = -0.26;
      tShoulderLRz = 0.52;
      tShoulderRRz = -0.52;
      tElbowLRx = -0.48;
      tElbowRRx = -0.48;
    } else if (isMoving) {
      // Walk / Run / Sprint lifelike human gait
      const runFactor = clamp((speed - 3.5) / 6.5, 0, 1);
      const strideFreq = clamp(speed * 1.38, 3.2, 12.2);
      const strideAmp = clamp(speed * 0.082, 0.28, 0.80);
      anim.walkPhase += clampedDt * strideFreq;

      const sinP = Math.sin(anim.walkPhase);
      const cosP = Math.cos(anim.walkPhase);
      const dblSin = Math.sin(anim.walkPhase * 2.0);
      const dblCos = Math.cos(anim.walkPhase * 2.0);

      // Double-frequency vertical bob + pelvis counter-rotation & hip list
      tPelvisY = 0.91 - runFactor * 0.018 + (dblCos * 0.5 + 0.5) * (0.022 + runFactor * 0.024);
      tPelvisRy = sinP * (0.065 + runFactor * 0.045);
      tPelvisRz = -cosP * (0.032 + runFactor * 0.020);

      // Forward lean proportional to speed + spine/chest counter-twist
      const lean = 0.05 + clamp(speed * 0.015, 0, 0.16);
      tTorsoRx = lean * 0.55;
      tChestRx = lean * 0.45 + dblSin * 0.015;
      tTorsoRy = -tPelvisRy * 0.65;
      tChestRy = -tPelvisRy * 0.75;

      // Head gaze stabilization (counter-pitch & counter-yaw against torso)
      tHeadRx = -lean * 0.75;
      tHeadRy = tPelvisRy * 0.45;
      tHeadRz = -tPelvisRz * 0.5;

      // Hip swing
      tHipLRx = sinP * strideAmp;
      tHipRRx = -sinP * strideAmp;
      tHipLRy = 0.03;
      tHipRRy = -0.03;

      // True knee flexion: ~55 deg (0.96 rad) during swing-through, cushioned ~12 deg on stance
      const swingL = Math.max(0, -cosP);
      const swingR = Math.max(0, cosP);
      tKneeLRx = 0.14 + swingL * (0.68 + runFactor * 0.28);
      tKneeRRx = 0.14 + swingR * (0.68 + runFactor * 0.28);

      // Ankle heel-strike dorsiflexion -> push-off plantarflexion
      tAnkleLRx = -sinP * 0.24 - swingL * 0.12;
      tAnkleRRx = sinP * 0.24 - swingR * 0.12;

      // Opposite arm swing with natural elbow bend
      tShoulderLRx = -sinP * strideAmp * 0.82;
      tShoulderRRx = sinP * strideAmp * 0.82;
      tShoulderLRz = 0.085 + runFactor * 0.04;
      tShoulderRRz = -0.085 - runFactor * 0.04;

      const fwdL = Math.max(0, -tShoulderLRx);
      const fwdR = Math.max(0, -tShoulderRRx);
      tElbowLRx = -0.26 - runFactor * 0.42 - fwdL * 0.45;
      tElbowRRx = -0.26 - runFactor * 0.42 - fwdR * 0.45;
      tWristLRx = -0.06 - fwdL * 0.08;
      tWristRRx = -0.06 - fwdR * 0.08;
    } else {
      // Lifelike Idle: ribcage breathing, gentle weight shift, asynchronous micro-glances
      const breath = Math.sin(anim.idlePhase);
      const sway = Math.sin(anim.idlePhase * 0.42);
      const shiftL = Math.max(0, sway);
      const shiftR = Math.max(0, -sway);

      tPelvisX = sway * 0.018;
      tPelvisY = 0.914 + breath * 0.005 - Math.abs(sway) * 0.004;
      tPelvisRz = -sway * 0.025;
      tPelvisRy = sway * 0.02;

      // Ribcage expansion + subtle chest rise
      tChestScaleXZ = 1.0 + breath * 0.014;
      tTorsoRx = 0.018 + breath * 0.012;
      tChestRx = breath * 0.018;

      // Subtle alternating knee flex during weight shift
      tHipLRx = -0.05 - shiftR * 0.04;
      tHipRRx = -0.05 - shiftL * 0.04;
      tKneeLRx = 0.105 + shiftR * 0.075;
      tKneeRRx = 0.105 + shiftL * 0.075;
      tAnkleLRx = -0.055 - shiftR * 0.035;
      tAnkleRRx = -0.055 - shiftL * 0.035;

      // Asynchronous natural head micro-glances
      tHeadRx = -breath * 0.016 + Math.sin(anim.idlePhase * 0.31) * 0.028;
      tHeadRy = Math.sin(anim.idlePhase * 0.27) * 0.075 + Math.sin(anim.idlePhase * 0.63) * 0.032;
      tHeadRz = Math.sin(anim.idlePhase * 0.23) * 0.025;

      // Relaxed arms with ~10 deg elbow bend & breathing micro-rise
      tShoulderLRx = -0.04 + breath * 0.012;
      tShoulderRRx = -0.04 + breath * 0.012;
      tShoulderLRz = 0.075 + breath * 0.014;
      tShoulderRRz = -0.075 - breath * 0.014;
      tElbowLRx = -0.175 - breath * 0.018;
      tElbowRRx = -0.175 - breath * 0.018;
    }

    // Soft landing compression overlay
    if (anim.landTimer > 0 && !isSeated) {
      const landFactor = Math.sin((anim.landTimer / 0.22) * Math.PI);
      tPelvisY -= landFactor * 0.085;
      tTorsoRx += landFactor * 0.14;
      tChestRx += landFactor * 0.10;
      tHipLRx -= landFactor * 0.24;
      tHipRRx -= landFactor * 0.24;
      tKneeLRx += landFactor * 0.48;
      tKneeRRx += landFactor * 0.48;
      tAnkleLRx -= landFactor * 0.24;
      tAnkleRRx -= landFactor * 0.24;
      tShoulderLRz += landFactor * 0.18;
      tShoulderRRz -= landFactor * 0.18;
    }

    // Right-arm aiming pose overrides right arm (and adds slight torso aim twist)
    if (isFiring && !isSeated) {
      tShoulderRRx = -1.48;
      tShoulderRRz = -0.05;
      tElbowRRx = -0.18;
      tWristRRx = 0;
      tTorsoRy += -0.14;
      tChestRy += -0.12;
      tHeadRy += 0.16;
    }

    const lambda = 14;
    if (rig.pelvis) {
      rig.pelvis.position.x = damp(rig.pelvis.position.x, tPelvisX, lambda, clampedDt);
      rig.pelvis.position.y = damp(rig.pelvis.position.y, tPelvisY, lambda, clampedDt);
      rig.pelvis.rotation.y = damp(rig.pelvis.rotation.y, tPelvisRy, lambda, clampedDt);
      rig.pelvis.rotation.z = damp(rig.pelvis.rotation.z, tPelvisRz, lambda, clampedDt);
    }

    rig.torso.rotation.x = damp(rig.torso.rotation.x, tTorsoRx, lambda, clampedDt);
    rig.torso.rotation.y = damp(rig.torso.rotation.y, tTorsoRy, lambda, clampedDt);

    if (rig.chest) {
      rig.chest.rotation.x = damp(rig.chest.rotation.x, tChestRx, lambda, clampedDt);
      rig.chest.rotation.y = damp(rig.chest.rotation.y, tChestRy, lambda, clampedDt);
      rig.chest.scale.x = damp(rig.chest.scale.x, tChestScaleXZ, 8, clampedDt);
      rig.chest.scale.z = rig.chest.scale.x;
    }

    rig.head.rotation.x = damp(rig.head.rotation.x, tHeadRx, lambda, clampedDt);
    rig.head.rotation.y = damp(rig.head.rotation.y, tHeadRy, lambda, clampedDt);
    rig.head.rotation.z = damp(rig.head.rotation.z, tHeadRz, lambda, clampedDt);

    rig.hipL.rotation.x = damp(rig.hipL.rotation.x, tHipLRx, lambda, clampedDt);
    rig.hipR.rotation.x = damp(rig.hipR.rotation.x, tHipRRx, lambda, clampedDt);
    rig.hipL.rotation.y = damp(rig.hipL.rotation.y, tHipLRy, lambda, clampedDt);
    rig.hipR.rotation.y = damp(rig.hipR.rotation.y, tHipRRy, lambda, clampedDt);
    rig.kneeL.rotation.x = damp(rig.kneeL.rotation.x, tKneeLRx, lambda, clampedDt);
    rig.kneeR.rotation.x = damp(rig.kneeR.rotation.x, tKneeRRx, lambda, clampedDt);

    if (rig.ankleL && rig.ankleR) {
      rig.ankleL.rotation.x = damp(rig.ankleL.rotation.x, tAnkleLRx, lambda, clampedDt);
      rig.ankleR.rotation.x = damp(rig.ankleR.rotation.x, tAnkleRRx, lambda, clampedDt);
    }

    rig.shoulderL.rotation.x = damp(rig.shoulderL.rotation.x, tShoulderLRx, lambda, clampedDt);
    rig.shoulderL.rotation.z = damp(rig.shoulderL.rotation.z, tShoulderLRz, lambda, clampedDt);
    rig.shoulderR.rotation.x = damp(rig.shoulderR.rotation.x, tShoulderRRx, lambda, clampedDt);
    rig.shoulderR.rotation.z = damp(rig.shoulderR.rotation.z, tShoulderRRz, lambda, clampedDt);

    rig.elbowL.rotation.x = damp(rig.elbowL.rotation.x, tElbowLRx, lambda, clampedDt);
    rig.elbowR.rotation.x = damp(rig.elbowR.rotation.x, tElbowRRx, lambda, clampedDt);

    if (rig.wristL && rig.wristR) {
      rig.wristL.rotation.x = damp(rig.wristL.rotation.x, tWristLRx, lambda, clampedDt);
      rig.wristR.rotation.x = damp(rig.wristR.rotation.x, tWristRRx, lambda, clampedDt);
    }

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
