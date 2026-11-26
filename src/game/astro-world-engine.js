/**
 * src/game/astro-world-engine.js
 * Ultra-fast, zero-lag modular Three.js (r128 compatible) world engine for AstroShift.
 *
 * Architecture:
 * - Single-draw-call THREE.InstancedMesh per category (city towers, orbital pylons,
 *   glowing beacons, floating asteroids).
 * - Procedural grid/neon textures generated once & cached; materials cached by qualityTier.
 * - Zero per-frame allocations inside update() (all scratch math objects pre-allocated).
 * - Distance-based fog culling (THREE.FogExp2), procedural shader sky dome, static starfield.
 * - O(1) analytical getGroundHeight(x, z) and numeric-keyed spatial-hash checkWorldCollision(pos, radius).
 * - Full dispose() releasing all geometries, materials, and textures.
 */
(function (global) {
  'use strict';

  // ============================================================================
  // QUALITY TIER PRESETS
  // ============================================================================
  const QUALITY_PRESETS = {
    low: {
      tier: 'low',
      pixelRatioCap: 1.0,
      fogDensity: 0.0028,
      towerCount: 140,
      pylonCount: 40,
      beaconCount: 56,
      asteroidCount: 64,
      starCount: 700,
      anisotropy: 1,
      useStandardMaterial: false,
      shadows: false
    },
    med: {
      tier: 'med',
      pixelRatioCap: 1.35,
      fogDensity: 0.0018,
      towerCount: 220,
      pylonCount: 64,
      beaconCount: 88,
      asteroidCount: 110,
      starCount: 1400,
      anisotropy: 2,
      useStandardMaterial: true,
      shadows: true
    },
    high: {
      tier: 'high',
      pixelRatioCap: 1.75,
      fogDensity: 0.0012,
      towerCount: 300,
      pylonCount: 88,
      beaconCount: 120,
      asteroidCount: 160,
      starCount: 2200,
      anisotropy: 4,
      useStandardMaterial: true,
      shadows: true
    }
  };

  function resolveQuality(qualityTier) {
    if (typeof qualityTier === 'string') {
      const key = qualityTier.toLowerCase();
      if (key === 'low' || key === 'mobile') return QUALITY_PRESETS.low;
      if (key === 'high' || key === 'ultra') return QUALITY_PRESETS.high;
    }
    return QUALITY_PRESETS.med;
  }

  // ============================================================================
  // MODULE-SCOPE SCRATCH OBJECTS (ZERO PER-FRAME ALLOCATIONS)
  // ============================================================================
  const hasTHREE = typeof THREE !== 'undefined';
  const _scratchMat4 = hasTHREE ? new THREE.Matrix4() : null;
  const _scratchPos = hasTHREE ? new THREE.Vector3() : null;
  const _scratchQuat = hasTHREE ? new THREE.Quaternion() : null;
  const _scratchScale = hasTHREE ? new THREE.Vector3() : null;
  const _scratchEuler = hasTHREE ? new THREE.Euler() : null;
  const _scratchColor = hasTHREE ? new THREE.Color() : null;

  // Reusable collision output object (returned on hit; null returned on miss)
  const _collisionResult = {
    hit: false,
    collided: false,
    nx: 0,
    nz: 0,
    penetration: 0,
    pushX: 0,
    pushZ: 0,
    groundY: 0
  };

  // ============================================================================
  // SPATIAL HASH COLLISION SYSTEM (O(1) NUMERIC KEYED)
  // ============================================================================
  const CELL_SIZE = 32;
  const CELL_OFFSET = 512;
  const CELL_STRIDE = 1024;

  // ============================================================================
  // TEXTURE & MATERIAL CACHE (GENERATED ONCE)
  // ============================================================================
  const _textureCache = {
    groundGrid: null,
    towerFacade: null
  };

  function createGroundGridTexture(anisotropy) {
    if (_textureCache.groundGrid) {
      _textureCache.groundGrid.anisotropy = anisotropy;
      return _textureCache.groundGrid;
    }
    if (typeof document === 'undefined') return null;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#070b18';
    ctx.fillRect(0, 0, size, size);

    // Subtle sub-grid
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.12)';
    ctx.lineWidth = 1;
    const subStep = size / 8;
    ctx.beginPath();
    for (let i = 0; i <= size; i += subStep) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
    }
    ctx.stroke();

    // Primary neon border lines
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, size - 3, size - 3);

    // Corner node accents
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 10, 10);
    ctx.fillRect(size - 10, 0, 10, 10);
    ctx.fillRect(0, size - 10, 10, 10);
    ctx.fillRect(size - 10, size - 10, 10, 10);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(96, 96);
    tex.anisotropy = anisotropy;
    _textureCache.groundGrid = tex;
    return tex;
  }

  function createTowerFacadeTexture(anisotropy) {
    if (_textureCache.towerFacade) {
      _textureCache.towerFacade.anisotropy = anisotropy;
      return _textureCache.towerFacade;
    }
    if (typeof document === 'undefined') return null;

    const w = 128;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0c1324';
    ctx.fillRect(0, 0, w, h);

    // Horizontal floor bands & lit cyber windows
    for (let y = 8; y < h; y += 16) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, y, w, 4);
      for (let x = 8; x < w - 8; x += 16) {
        const lit = ((x * 13 + y * 7) % 11) > 3;
        if (lit) {
          ctx.fillStyle = ((x + y) % 32 === 0) ? 'rgba(0, 242, 255, 0.75)' : 'rgba(148, 163, 184, 0.45)';
          ctx.fillRect(x, y + 6, 10, 6);
        }
      }
    }

    // Vertical neon trim
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.fillRect(0, 0, 3, h);
    ctx.fillRect(w - 3, 0, 3, h);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = anisotropy;
    _textureCache.towerFacade = tex;
    return tex;
  }

  // ============================================================================
  // DETERMINISTIC PRNG (REPRODUCIBLE CITY LAYOUT, ZERO ALLOCATIONS)
  // ============================================================================
  function mulberry32(seed) {
    let a = seed | 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ============================================================================
  // ENGINE STATE
  // ============================================================================
  const state = {
    initialized: false,
    scene: null,
    renderer: null,
    quality: QUALITY_PRESETS.med,
    rootGroup: null,

    // Meshes / InstancedMeshes
    skyDome: null,
    starField: null,
    groundMesh: null,
    towerInstanced: null,
    pylonInstanced: null,
    beaconInstanced: null,
    asteroidInstanced: null,

    // Lights created by world engine
    ambientLight: null,
    hemiLight: null,
    dirLight: null,

    // Resources for clean dispose()
    geometries: [],
    materials: [],

    // Static AABB colliders + spatial hash
    colliders: [],
    spatialHash: new Map(),

    // Pre-allocated flat typed arrays for asteroid animation (zero GC)
    asteroidCount: 0,
    asteroidBaseX: null,
    asteroidBaseY: null,
    asteroidBaseZ: null,
    asteroidScale: null,
    asteroidSpeed: null,
    asteroidPhase: null,
    elapsedTime: 0
  };

  function cellKey(cx, cz) {
    return (cx + CELL_OFFSET) * CELL_STRIDE + (cz + CELL_OFFSET);
  }

  function registerCollider(minX, maxX, minZ, maxZ, maxY) {
    const idx = state.colliders.length;
    state.colliders.push({ minX, maxX, minZ, maxZ, maxY });

    const cx0 = Math.floor(minX / CELL_SIZE);
    const cx1 = Math.floor(maxX / CELL_SIZE);
    const cz0 = Math.floor(minZ / CELL_SIZE);
    const cz1 = Math.floor(maxZ / CELL_SIZE);

    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const key = cellKey(cx, cz);
        let bucket = state.spatialHash.get(key);
        if (!bucket) {
          bucket = [];
          state.spatialHash.set(key, bucket);
        }
        bucket.push(idx);
      }
    }
  }

  // ============================================================================
  // ANALYTICAL GROUND HEIGHT (O(1), ZERO RAYCASTING)
  // ============================================================================
  function getGroundHeight(x, z) {
    const rSq = x * x + z * z;
    // Central AstroShift spawn pad: gentle raised platform (radius 18m -> y = 0.25m)
    if (rSq < 324) {
      return 0.25;
    }
    if (rSq < 484) {
      // Smooth ramp between 18m and 22m
      const t = (Math.sqrt(rSq) - 18) * 0.25;
      return 0.25 * (1 - t);
    }
    // Flat metropolis district out to radius 220m
    if (rSq <= 48400) {
      return 0;
    }
    // Outer orbital ridge ring beyond 220m
    const r = Math.sqrt(rSq);
    const edge = Math.min(1, (r - 220) / 80);
    const wave = Math.sin(x * 0.022) * Math.cos(z * 0.022) * 10 + Math.sin((x + z) * 0.012) * 6;
    return Math.max(0, (12 + wave) * edge);
  }

  // ============================================================================
  // SPATIAL-HASH AABB COLLISION (O(1) AVERAGE, ZERO ALLOCATIONS)
  // ============================================================================
  function checkWorldCollision(pos, radius) {
    if (!pos) return null;
    const r = typeof radius === 'number' && radius > 0 ? radius : 1.0;
    const px = pos.x || 0;
    const py = pos.y || 0;
    const pz = pos.z || 0;

    const groundY = getGroundHeight(px, pz);

    const cx0 = Math.floor((px - r) / CELL_SIZE);
    const cx1 = Math.floor((px + r) / CELL_SIZE);
    const cz0 = Math.floor((pz - r) / CELL_SIZE);
    const cz1 = Math.floor((pz + r) / CELL_SIZE);

    let bestPen = 0;
    let bestNx = 0;
    let bestNz = 0;

    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const bucket = state.spatialHash.get(cellKey(cx, cz));
        if (!bucket) continue;

        for (let i = 0; i < bucket.length; i++) {
          const box = state.colliders[bucket[i]];
          if (py - r >= box.maxY) continue;

          // Closest point on AABB to circle center in XZ
          const clampedX = px < box.minX ? box.minX : (px > box.maxX ? box.maxX : px);
          const clampedZ = pz < box.minZ ? box.minZ : (pz > box.maxZ ? box.maxZ : pz);

          const dx = px - clampedX;
          const dz = pz - clampedZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < r * r) {
            let nx = 0;
            let nz = 0;
            let pen = 0;

            if (distSq > 1e-6) {
              const dist = Math.sqrt(distSq);
              nx = dx / dist;
              nz = dz / dist;
              pen = r - dist;
            } else {
              // Center is inside AABB; push out along shortest axis
              const dLeft = px - box.minX;
              const dRight = box.maxX - px;
              const dTop = pz - box.minZ;
              const dBottom = box.maxZ - pz;
              const minD = Math.min(dLeft, dRight, dTop, dBottom);
              if (minD === dLeft) { nx = -1; nz = 0; pen = dLeft + r; }
              else if (minD === dRight) { nx = 1; nz = 0; pen = dRight + r; }
              else if (minD === dTop) { nx = 0; nz = -1; pen = dTop + r; }
              else { nx = 0; nz = 1; pen = dBottom + r; }
            }

            if (pen > bestPen) {
              bestPen = pen;
              bestNx = nx;
              bestNz = nz;
            }
          }
        }
      }
    }

    if (bestPen > 0) {
      _collisionResult.hit = true;
      _collisionResult.collided = true;
      _collisionResult.nx = bestNx;
      _collisionResult.nz = bestNz;
      _collisionResult.penetration = bestPen;
      _collisionResult.pushX = bestNx * bestPen;
      _collisionResult.pushZ = bestNz * bestPen;
      _collisionResult.groundY = groundY;
      return _collisionResult;
    }

    return null;
  }

  // ============================================================================
  // WORLD INITIALIZATION
  // ============================================================================
  function initWorld(scene, renderer, qualityTier) {
    if (!hasTHREE) {
      throw new Error('AstroWorldEngine requires Three.js (global THREE) to be loaded.');
    }
    if (!scene) {
      throw new Error('AstroWorldEngine.initWorld requires a valid THREE.Scene.');
    }

    // Clean up any prior world instance first
    if (state.initialized) {
      dispose();
    }

    const q = resolveQuality(qualityTier);
    state.scene = scene;
    state.renderer = renderer || null;
    state.quality = q;
    state.elapsedTime = 0;

    // Configure renderer & fog
    if (state.renderer) {
      const dpr = typeof window !== 'undefined' && window.devicePixelRatio
        ? Math.min(window.devicePixelRatio, q.pixelRatioCap)
        : 1;
      state.renderer.setPixelRatio(dpr);
      if (state.renderer.shadowMap) {
        state.renderer.shadowMap.enabled = q.shadows;
      }
    }
    scene.fog = new THREE.FogExp2(0x050816, q.fogDensity);

    const root = new THREE.Group();
    root.name = 'AstroWorldEngineRoot';
    scene.add(root);
    state.rootGroup = root;

    // 1. Lighting (3 lightweight lights total)
    const ambient = new THREE.AmbientLight(0x3b4d7a, 0.75);
    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.55);
    const dir = new THREE.DirectionalLight(0xe0f2fe, 1.15);
    dir.position.set(120, 210, 90);
    if (q.shadows) {
      dir.castShadow = true;
      dir.shadow.mapSize.width = q.tier === 'high' ? 2048 : 1024;
      dir.shadow.mapSize.height = q.tier === 'high' ? 2048 : 1024;
      dir.shadow.camera.near = 20;
      dir.shadow.camera.far = 520;
      const d = 160;
      dir.shadow.camera.left = -d;
      dir.shadow.camera.right = d;
      dir.shadow.camera.top = d;
      dir.shadow.camera.bottom = -d;
    }
    root.add(ambient, hemi, dir);
    state.ambientLight = ambient;
    state.hemiLight = hemi;
    state.dirLight = dir;

    // 2. Procedural Sky Dome (1 draw call, ShaderMaterial)
    const skyGeo = new THREE.SphereGeometry(950, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x02040d) },
        midColor: { value: new THREE.Color(0x0a1533) },
        horizonColor: { value: new THREE.Color(0x0f2c59) }
      },
      vertexShader: [
        'varying vec3 vWorldPos;',
        'void main() {',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vWorldPos = wp.xyz;',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 topColor;',
        'uniform vec3 midColor;',
        'uniform vec3 horizonColor;',
        'varying vec3 vWorldPos;',
        'void main() {',
        '  float h = clamp(normalize(vWorldPos).y, 0.0, 1.0);',
        '  vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.28, h));',
        '  col = mix(col, topColor, smoothstep(0.28, 0.88, h));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    skyDome.frustumCulled = false;
    root.add(skyDome);
    state.skyDome = skyDome;
    state.geometries.push(skyGeo);
    state.materials.push(skyMat);

    // 3. Subtle Starfield (THREE.Points built once)
    const rand = mulberry32(20261126);
    const starPositions = new Float32Array(q.starCount * 3);
    const starColors = new Float32Array(q.starCount * 3);
    for (let i = 0; i < q.starCount; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(0.1 + rand() * 0.9); // upper hemisphere
      const rad = 780 + rand() * 110;
      const idx3 = i * 3;
      starPositions[idx3] = rad * Math.sin(phi) * Math.cos(theta);
      starPositions[idx3 + 1] = rad * Math.cos(phi);
      starPositions[idx3 + 2] = rad * Math.sin(phi) * Math.sin(theta);

      const tint = 0.7 + rand() * 0.3;
      starColors[idx3] = tint * (rand() > 0.7 ? 0.75 : 1.0);
      starColors[idx3 + 1] = tint;
      starColors[idx3 + 2] = 1.0;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      fog: false,
      depthWrite: false
    });
    const starField = new THREE.Points(starGeo, starMat);
    starField.frustumCulled = false;
    root.add(starField);
    state.starField = starField;
    state.geometries.push(starGeo);
    state.materials.push(starMat);

    // 4. Ground Grid Plane (1 draw call)
    const groundTex = createGroundGridTexture(q.anisotropy);
    const groundGeo = new THREE.PlaneGeometry(1400, 1400, 1, 1);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          map: groundTex,
          color: 0xffffff,
          roughness: 0.65,
          metalness: 0.35
        })
      : new THREE.MeshLambertMaterial({
          map: groundTex,
          color: 0xffffff
        });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = q.shadows;
    root.add(groundMesh);
    state.groundMesh = groundMesh;
    state.geometries.push(groundGeo);
    state.materials.push(groundMat);

    // 5. Instanced City Towers (1 draw call)
    const towerTex = createTowerFacadeTexture(q.anisotropy);
    const towerGeo = new THREE.BoxGeometry(1, 1, 1);
    const towerMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          map: towerTex,
          color: 0xdbeafe,
          roughness: 0.35,
          metalness: 0.65
        })
      : new THREE.MeshLambertMaterial({
          map: towerTex,
          color: 0xdbeafe
        });
    const towerMesh = new THREE.InstancedMesh(towerGeo, towerMat, q.towerCount);
    towerMesh.castShadow = q.shadows;
    towerMesh.receiveShadow = q.shadows;
    towerMesh.frustumCulled = false;

    const beaconPositions = [];
    const towerPalette = [0x1e3a8a, 0x0f766e, 0x312e81, 0x164e63, 0x1e293b];

    let placedTowers = 0;
    let attempts = 0;
    while (placedTowers < q.towerCount && attempts < q.towerCount * 6) {
      attempts++;
      // Grid-aligned metropolis blocks with clear central avenues (|x| > 16, |z| > 16)
      const gx = Math.round((rand() - 0.5) * 16) * 26;
      const gz = Math.round((rand() - 0.5) * 16) * 26;
      if (Math.abs(gx) < 28 && Math.abs(gz) < 28) continue; // Keep spawn plaza clear
      if (Math.abs(gx) < 14 || Math.abs(gz) < 14) continue; // Keep main N-S / E-W avenues open

      const w = 10 + rand() * 10;
      const d = 10 + rand() * 10;
      const h = 24 + rand() * 92;

      _scratchPos.set(gx, h * 0.5, gz);
      _scratchQuat.identity();
      _scratchScale.set(w, h, d);
      _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
      towerMesh.setMatrixAt(placedTowers, _scratchMat4);

      _scratchColor.setHex(towerPalette[placedTowers % towerPalette.length]);
      towerMesh.setColorAt(placedTowers, _scratchColor);

      registerCollider(gx - w * 0.5, gx + w * 0.5, gz - d * 0.5, gz + d * 0.5, h);

      if (beaconPositions.length < q.beaconCount) {
        beaconPositions.push(gx, h + 1.4, gz);
      }
      placedTowers++;
    }
    towerMesh.count = placedTowers;
    towerMesh.instanceMatrix.needsUpdate = true;
    if (towerMesh.instanceColor) towerMesh.instanceColor.needsUpdate = true;
    root.add(towerMesh);
    state.towerInstanced = towerMesh;
    state.geometries.push(towerGeo);
    state.materials.push(towerMat);

    // 6. Instanced Orbital Pylons (1 draw call)
    const pylonGeo = new THREE.CylinderGeometry(0.65, 1.15, 1, 8);
    const pylonMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.35,
          roughness: 0.3,
          metalness: 0.85
        })
      : new THREE.MeshLambertMaterial({
          color: 0x38bdf8
        });
    const pylonMesh = new THREE.InstancedMesh(pylonGeo, pylonMat, q.pylonCount);
    pylonMesh.frustumCulled = false;

    for (let i = 0; i < q.pylonCount; i++) {
      const angle = (i / q.pylonCount) * Math.PI * 2;
      const ringRadius = (i % 2 === 0) ? 46 : 138;
      const px = Math.cos(angle) * ringRadius;
      const pz = Math.sin(angle) * ringRadius;
      const ph = (i % 2 === 0) ? 14 : 26;

      _scratchPos.set(px, ph * 0.5, pz);
      _scratchQuat.identity();
      _scratchScale.set(1, ph, 1);
      _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
      pylonMesh.setMatrixAt(i, _scratchMat4);

      _scratchColor.setHex(i % 2 === 0 ? 0x0284c7 : 0x6366f1);
      pylonMesh.setColorAt(i, _scratchColor);

      registerCollider(px - 1.15, px + 1.15, pz - 1.15, pz + 1.15, ph);

      if (beaconPositions.length < q.beaconCount * 3) {
        beaconPositions.push(px, ph + 1.1, pz);
      }
    }
    pylonMesh.instanceMatrix.needsUpdate = true;
    if (pylonMesh.instanceColor) pylonMesh.instanceColor.needsUpdate = true;
    root.add(pylonMesh);
    state.pylonInstanced = pylonMesh;
    state.geometries.push(pylonGeo);
    state.materials.push(pylonMat);

    // 7. Instanced Glowing Beacons (1 draw call)
    const actualBeacons = Math.min(q.beaconCount, Math.floor(beaconPositions.length / 3));
    const beaconGeo = new THREE.OctahedronGeometry(1.1, 0);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const beaconMesh = new THREE.InstancedMesh(beaconGeo, beaconMat, Math.max(1, actualBeacons));
    beaconMesh.frustumCulled = false;

    const beaconColors = [0x00f2ff, 0x38bdf8, 0xf43f5e, 0x34d399, 0xa855f7];
    for (let i = 0; i < actualBeacons; i++) {
      const bIdx = i * 3;
      _scratchPos.set(beaconPositions[bIdx], beaconPositions[bIdx + 1], beaconPositions[bIdx + 2]);
      _scratchQuat.identity();
      _scratchScale.set(1, 1.4, 1);
      _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
      beaconMesh.setMatrixAt(i, _scratchMat4);

      _scratchColor.setHex(beaconColors[i % beaconColors.length]);
      beaconMesh.setColorAt(i, _scratchColor);
    }
    beaconMesh.count = actualBeacons;
    beaconMesh.instanceMatrix.needsUpdate = true;
    if (beaconMesh.instanceColor) beaconMesh.instanceColor.needsUpdate = true;
    root.add(beaconMesh);
    state.beaconInstanced = beaconMesh;
    state.geometries.push(beaconGeo);
    state.materials.push(beaconMat);

    // 8. Instanced Floating Asteroids (1 draw call, animated with zero allocations)
    const astGeo = new THREE.IcosahedronGeometry(1, 0);
    const astMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          color: 0x64748b,
          roughness: 0.78,
          metalness: 0.25
        })
      : new THREE.MeshLambertMaterial({
          color: 0x64748b
        });
    const astMesh = new THREE.InstancedMesh(astGeo, astMat, q.asteroidCount);
    astMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    astMesh.frustumCulled = false;

    state.asteroidCount = q.asteroidCount;
    state.asteroidBaseX = new Float32Array(q.asteroidCount);
    state.asteroidBaseY = new Float32Array(q.asteroidCount);
    state.asteroidBaseZ = new Float32Array(q.asteroidCount);
    state.asteroidScale = new Float32Array(q.asteroidCount);
    state.asteroidSpeed = new Float32Array(q.asteroidCount);
    state.asteroidPhase = new Float32Array(q.asteroidCount);

    for (let i = 0; i < q.asteroidCount; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 55 + rand() * 260;
      const bx = Math.cos(angle) * dist;
      const by = 52 + rand() * 115;
      const bz = Math.sin(angle) * dist;
      const sc = 1.6 + rand() * 4.8;

      state.asteroidBaseX[i] = bx;
      state.asteroidBaseY[i] = by;
      state.asteroidBaseZ[i] = bz;
      state.asteroidScale[i] = sc;
      state.asteroidSpeed[i] = (rand() > 0.5 ? 1 : -1) * (0.2 + rand() * 0.55);
      state.asteroidPhase[i] = rand() * Math.PI * 2;

      _scratchPos.set(bx, by, bz);
      _scratchEuler.set(rand() * 3, rand() * 3, 0);
      _scratchQuat.setFromEuler(_scratchEuler);
      _scratchScale.set(sc, sc * 0.78, sc * 0.92);
      _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
      astMesh.setMatrixAt(i, _scratchMat4);

      const shade = 0.55 + rand() * 0.45;
      _scratchColor.setRGB(shade * 0.75, shade * 0.85, shade);
      astMesh.setColorAt(i, _scratchColor);
    }
    astMesh.instanceMatrix.needsUpdate = true;
    if (astMesh.instanceColor) astMesh.instanceColor.needsUpdate = true;
    root.add(astMesh);
    state.asteroidInstanced = astMesh;
    state.geometries.push(astGeo);
    state.materials.push(astMat);

    state.initialized = true;
    return state;
  }

  // ============================================================================
  // PER-FRAME UPDATE (STRICTLY ZERO ALLOCATIONS)
  // ============================================================================
  function update(dt, playerPos, qualityTier) {
    if (!state.initialized) return;

    const delta = dt > 0 && dt < 0.2 ? dt : 0.016;
    state.elapsedTime += delta;
    const t = state.elapsedTime;

    // Keep sky dome & starfield centered on player so horizon never clips
    if (playerPos) {
      if (state.skyDome) {
        state.skyDome.position.set(playerPos.x || 0, 0, playerPos.z || 0);
      }
      if (state.starField) {
        state.starField.position.set(playerPos.x || 0, 0, playerPos.z || 0);
      }
    }

    // Adjust fog density if qualityTier changed dynamically
    if (qualityTier && state.scene && state.scene.fog) {
      const targetPreset = resolveQuality(qualityTier);
      if (targetPreset !== state.quality) {
        state.quality = targetPreset;
        state.scene.fog.density = targetPreset.fogDensity;
      }
    }

    // Animate floating asteroids using pre-allocated typed arrays & scratch objects
    const astMesh = state.asteroidInstanced;
    if (astMesh) {
      const count = state.asteroidCount;
      const bx = state.asteroidBaseX;
      const by = state.asteroidBaseY;
      const bz = state.asteroidBaseZ;
      const sc = state.asteroidScale;
      const sp = state.asteroidSpeed;
      const ph = state.asteroidPhase;

      for (let i = 0; i < count; i++) {
        const phase = ph[i] + t * sp[i];
        const s = sc[i];
        _scratchPos.set(bx[i], by[i] + Math.sin(phase) * 2.2, bz[i]);
        _scratchEuler.set(phase * 0.45, phase * 0.7, phase * 0.2);
        _scratchQuat.setFromEuler(_scratchEuler);
        _scratchScale.set(s, s * 0.78, s * 0.92);
        _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
        astMesh.setMatrixAt(i, _scratchMat4);
      }
      astMesh.instanceMatrix.needsUpdate = true;
    }
  }

  // ============================================================================
  // CLEAN RESOURCE DISPOSAL
  // ============================================================================
  function dispose() {
    if (state.rootGroup && state.scene) {
      state.scene.remove(state.rootGroup);
    }

    for (let i = 0; i < state.geometries.length; i++) {
      if (state.geometries[i] && typeof state.geometries[i].dispose === 'function') {
        state.geometries[i].dispose();
      }
    }
    for (let i = 0; i < state.materials.length; i++) {
      if (state.materials[i] && typeof state.materials[i].dispose === 'function') {
        state.materials[i].dispose();
      }
    }

    if (_textureCache.groundGrid) {
      _textureCache.groundGrid.dispose();
      _textureCache.groundGrid = null;
    }
    if (_textureCache.towerFacade) {
      _textureCache.towerFacade.dispose();
      _textureCache.towerFacade = null;
    }

    state.geometries.length = 0;
    state.materials.length = 0;
    state.colliders.length = 0;
    state.spatialHash.clear();

    state.scene = null;
    state.renderer = null;
    state.rootGroup = null;
    state.skyDome = null;
    state.starField = null;
    state.groundMesh = null;
    state.towerInstanced = null;
    state.pylonInstanced = null;
    state.beaconInstanced = null;
    state.asteroidInstanced = null;
    state.ambientLight = null;
    state.hemiLight = null;
    state.dirLight = null;
    state.asteroidCount = 0;
    state.asteroidBaseX = null;
    state.asteroidBaseY = null;
    state.asteroidBaseZ = null;
    state.asteroidScale = null;
    state.asteroidSpeed = null;
    state.asteroidPhase = null;
    state.initialized = false;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================
  global.AstroWorldEngine = {
    initWorld: initWorld,
    update: update,
    getGroundHeight: getGroundHeight,
    checkWorldCollision: checkWorldCollision,
    dispose: dispose
  };
})(typeof window !== 'undefined' ? window : globalThis);
