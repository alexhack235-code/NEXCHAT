/**
 * src/game/astro-world-engine.js
 * Ultra-fast, zero-lag modular Three.js (r128 compatible) world engine for AstroShift.
 *
 * Architecture:
 * - Single-draw-call THREE.InstancedMesh per category (city towers, setbacks, spires,
 *   orbital pylons, base collars, rotating containment rings, crystal cores, beacons, asteroids).
 * - Procedural metallic deck, roughness/bump, glass-steel facade, and planetary ring
 *   CanvasTextures generated once & cached; materials cached by qualityTier.
 * - Zero per-frame allocations inside update() (all scratch math objects pre-allocated).
 * - ACESFilmicToneMapping, PCFSoftShadowMap, Hemisphere + Key/Rim directional lighting,
 *   atmospheric FogExp2, procedural nebula/starfield sky dome, and distant ringed planet.
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
      fogDensity: 0.0024,
      towerCount: 140,
      pylonCount: 40,
      beaconCount: 56,
      asteroidCount: 64,
      starCount: 800,
      pointLightCount: 0,
      anisotropy: 1,
      useStandardMaterial: false,
      shadows: false
    },
    med: {
      tier: 'med',
      pixelRatioCap: 1.35,
      fogDensity: 0.0016,
      towerCount: 220,
      pylonCount: 64,
      beaconCount: 88,
      asteroidCount: 110,
      starCount: 1600,
      pointLightCount: 2,
      anisotropy: 2,
      useStandardMaterial: true,
      shadows: true
    },
    high: {
      tier: 'high',
      pixelRatioCap: 1.75,
      fogDensity: 0.0011,
      towerCount: 300,
      pylonCount: 88,
      beaconCount: 120,
      asteroidCount: 160,
      starCount: 2600,
      pointLightCount: 4,
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
    groundBump: null,
    groundRoughness: null,
    towerFacade: null,
    towerEmissive: null,
    towerRoughness: null,
    planetRing: null
  };

  function configureRepeatTex(canvas, repeatX, repeatY, anisotropy) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = anisotropy;
    return tex;
  }

  function createGroundTextures(anisotropy) {
    if (_textureCache.groundGrid && _textureCache.groundBump && _textureCache.groundRoughness) {
      _textureCache.groundGrid.anisotropy = anisotropy;
      _textureCache.groundBump.anisotropy = anisotropy;
      _textureCache.groundRoughness.anisotropy = anisotropy;
      return {
        map: _textureCache.groundGrid,
        bumpMap: _textureCache.groundBump,
        roughnessMap: _textureCache.groundRoughness
      };
    }
    if (typeof document === 'undefined') {
      return { map: null, bumpMap: null, roughnessMap: null };
    }

    const size = 512;
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = size;
    diffCanvas.height = size;
    const dCtx = diffCanvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bCtx = bumpCanvas.getContext('2d');

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d');

    // Base brushed gunmetal titanium deck
    dCtx.fillStyle = '#141c2c';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#7a7a7a'; // mid-low roughness for brushed metal sheen
    rCtx.fillRect(0, 0, size, size);

    // Subtle alternating metallic plate tones (4x4 deck tiles per repeat)
    const tile = size / 4;
    const prng = mulberry32(90421);
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 4; tx++) {
        const shade = Math.floor(18 + prng() * 14);
        dCtx.fillStyle = 'rgb(' + shade + ',' + (shade + 8) + ',' + (shade + 22) + ')';
        dCtx.fillRect(tx * tile + 3, ty * tile + 3, tile - 6, tile - 6);

        const rVal = Math.floor(92 + prng() * 52);
        rCtx.fillStyle = 'rgb(' + rVal + ',' + rVal + ',' + rVal + ')';
        rCtx.fillRect(tx * tile + 3, ty * tile + 3, tile - 6, tile - 6);

        // Brushed metal micro-streaks
        for (let s = 0; s < 18; s++) {
          const sx = tx * tile + 6 + prng() * (tile - 28);
          const sy = ty * tile + 6 + prng() * (tile - 12);
          const sw = 10 + prng() * 22;
          dCtx.fillStyle = prng() > 0.5 ? 'rgba(148, 163, 184, 0.045)' : 'rgba(10, 15, 28, 0.08)';
          dCtx.fillRect(sx, sy, sw, 1);
          bCtx.fillStyle = 'rgba(200, 200, 200, 0.08)';
          bCtx.fillRect(sx, sy, sw, 1);
        }

        // Recessed panel bevels & corner bolts
        dCtx.strokeStyle = '#090e1a';
        dCtx.lineWidth = 3;
        dCtx.strokeRect(tx * tile + 1.5, ty * tile + 1.5, tile - 3, tile - 3);

        bCtx.strokeStyle = '#262626';
        bCtx.lineWidth = 4;
        bCtx.strokeRect(tx * tile + 2, ty * tile + 2, tile - 4, tile - 4);

        rCtx.strokeStyle = '#d4d4d4';
        rCtx.lineWidth = 4;
        rCtx.strokeRect(tx * tile + 2, ty * tile + 2, tile - 4, tile - 4);

        // Corner rivets
        const rOff = 8;
        const pts = [
          [tx * tile + rOff, ty * tile + rOff],
          [(tx + 1) * tile - rOff, ty * tile + rOff],
          [tx * tile + rOff, (ty + 1) * tile - rOff],
          [(tx + 1) * tile - rOff, (ty + 1) * tile - rOff]
        ];
        for (let p = 0; p < pts.length; p++) {
          dCtx.fillStyle = '#2d3b55';
          dCtx.fillRect(pts[p][0] - 1.5, pts[p][1] - 1.5, 3, 3);
          bCtx.fillStyle = '#d8d8d8';
          bCtx.fillRect(pts[p][0] - 1.5, pts[p][1] - 1.5, 3, 3);
        }
      }
    }

    // Subtle cyan energy conduits along primary seams
    dCtx.strokeStyle = 'rgba(14, 165, 233, 0.28)';
    dCtx.lineWidth = 2;
    dCtx.strokeRect(1, 1, size - 2, size - 2);
    dCtx.beginPath();
    dCtx.moveTo(size * 0.5, 0);
    dCtx.lineTo(size * 0.5, size);
    dCtx.moveTo(0, size * 0.5);
    dCtx.lineTo(size, size * 0.5);
    dCtx.stroke();

    // Glowing conduit nodes at intersections
    const nodes = [0, size * 0.5];
    for (let ny = 0; ny < nodes.length; ny++) {
      for (let nx = 0; nx < nodes.length; nx++) {
        const cx = nodes[nx];
        const cy = nodes[ny];
        const grad = dCtx.createRadialGradient(cx, cy, 1, cx, cy, 12);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.75)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        dCtx.fillStyle = grad;
        dCtx.fillRect(cx - 12, cy - 12, 24, 24);
      }
    }

    // Conduit channels are glossy (low roughness)
    rCtx.strokeStyle = '#303030';
    rCtx.lineWidth = 3;
    rCtx.strokeRect(1.5, 1.5, size - 3, size - 3);

    _textureCache.groundGrid = configureRepeatTex(diffCanvas, 96, 96, anisotropy);
    _textureCache.groundBump = configureRepeatTex(bumpCanvas, 96, 96, anisotropy);
    _textureCache.groundRoughness = configureRepeatTex(roughCanvas, 96, 96, anisotropy);

    return {
      map: _textureCache.groundGrid,
      bumpMap: _textureCache.groundBump,
      roughnessMap: _textureCache.groundRoughness
    };
  }

  function createTowerTextures(anisotropy) {
    if (_textureCache.towerFacade && _textureCache.towerEmissive && _textureCache.towerRoughness) {
      _textureCache.towerFacade.anisotropy = anisotropy;
      _textureCache.towerEmissive.anisotropy = anisotropy;
      _textureCache.towerRoughness.anisotropy = anisotropy;
      return {
        map: _textureCache.towerFacade,
        emissiveMap: _textureCache.towerEmissive,
        roughnessMap: _textureCache.towerRoughness
      };
    }
    if (typeof document === 'undefined') {
      return { map: null, emissiveMap: null, roughnessMap: null };
    }

    const w = 256;
    const h = 512;

    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = w;
    diffCanvas.height = h;
    const dCtx = diffCanvas.getContext('2d');

    const emisCanvas = document.createElement('canvas');
    emisCanvas.width = w;
    emisCanvas.height = h;
    const eCtx = emisCanvas.getContext('2d');

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = w;
    roughCanvas.height = h;
    const rCtx = roughCanvas.getContext('2d');

    // Architectural dark steel & reflective curtain-wall glass base
    dCtx.fillStyle = '#0f172a';
    dCtx.fillRect(0, 0, w, h);
    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, w, h);
    rCtx.fillStyle = '#383838'; // glossy glass panes
    rCtx.fillRect(0, 0, w, h);

    const prng = mulberry32(77319);
    const floorH = 16;
    const colW = 16;

    for (let y = 0; y < h; y += floorH) {
      // Concrete/steel spandrel beam between floors (matte)
      dCtx.fillStyle = '#1e293b';
      dCtx.fillRect(0, y, w, 5);
      rCtx.fillStyle = '#b0b0b0';
      rCtx.fillRect(0, y, w, 5);

      const floorLitChance = 0.25 + prng() * 0.55;
      const isWarmFloor = prng() > 0.42;

      for (let x = 4; x < w - 4; x += colW) {
        // Glass pane base reflection tint
        dCtx.fillStyle = '#132038';
        dCtx.fillRect(x + 1, y + 6, colW - 3, floorH - 7);

        // Lit interior office/apartment window clusters
        if (prng() < floorLitChance) {
          const intensity = 0.55 + prng() * 0.45;
          let winColor;
          if (isWarmFloor) {
            winColor = prng() > 0.25
              ? 'rgba(253, 224, 140, ' + intensity.toFixed(2) + ')'
              : 'rgba(251, 191, 36, ' + intensity.toFixed(2) + ')';
          } else {
            winColor = prng() > 0.3
              ? 'rgba(125, 211, 252, ' + intensity.toFixed(2) + ')'
              : 'rgba(224, 242, 254, ' + intensity.toFixed(2) + ')';
          }
          dCtx.fillStyle = winColor;
          dCtx.fillRect(x + 2, y + 7, colW - 5, floorH - 9);
          eCtx.fillStyle = winColor;
          eCtx.fillRect(x + 2, y + 7, colW - 5, floorH - 9);
        }

        // Vertical steel mullion
        dCtx.fillStyle = '#1b263b';
        dCtx.fillRect(x - 1, y, 2, floorH);
        rCtx.fillStyle = '#9a9a9a';
        rCtx.fillRect(x - 1, y, 2, floorH);
      }
    }

    // Subtle vertical structural corner columns
    dCtx.fillStyle = '#25334d';
    dCtx.fillRect(0, 0, 5, h);
    dCtx.fillRect(w - 5, 0, 5, h);
    rCtx.fillStyle = '#909090';
    rCtx.fillRect(0, 0, 5, h);
    rCtx.fillRect(w - 5, 0, 5, h);

    // Subtle cyan architectural trim strip near edges
    eCtx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    eCtx.fillRect(5, 0, 2, h);
    eCtx.fillRect(w - 7, 0, 2, h);

    _textureCache.towerFacade = configureRepeatTex(diffCanvas, 1, 2, anisotropy);
    _textureCache.towerEmissive = configureRepeatTex(emisCanvas, 1, 2, anisotropy);
    _textureCache.towerRoughness = configureRepeatTex(roughCanvas, 1, 2, anisotropy);

    return {
      map: _textureCache.towerFacade,
      emissiveMap: _textureCache.towerEmissive,
      roughnessMap: _textureCache.towerRoughness
    };
  }

  function createPlanetRingTexture(anisotropy) {
    if (_textureCache.planetRing) {
      _textureCache.planetRing.anisotropy = anisotropy;
      return _textureCache.planetRing;
    }
    if (typeof document === 'undefined') return null;

    const w = 256;
    const h = 32;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0.0, 'rgba(148, 163, 184, 0.0)');
    grad.addColorStop(0.15, 'rgba(148, 163, 184, 0.25)');
    grad.addColorStop(0.32, 'rgba(186, 230, 253, 0.55)');
    grad.addColorStop(0.45, 'rgba(100, 116, 139, 0.12)');
    grad.addColorStop(0.58, 'rgba(224, 242, 254, 0.65)');
    grad.addColorStop(0.75, 'rgba(125, 211, 252, 0.35)');
    grad.addColorStop(0.9, 'rgba(148, 163, 184, 0.15)');
    grad.addColorStop(1.0, 'rgba(148, 163, 184, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = anisotropy;
    _textureCache.planetRing = tex;
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
    skyMat: null,
    starField: null,
    starMat: null,
    planetGroup: null,
    groundMesh: null,
    spawnPadMesh: null,
    spawnTrimMesh: null,
    towerInstanced: null,
    towerSetbackInstanced: null,
    towerSpireInstanced: null,
    pylonInstanced: null,
    pylonBaseInstanced: null,
    pylonRingInstanced: null,
    crystalInstanced: null,
    beaconInstanced: null,
    asteroidInstanced: null,

    // Lights created by world engine
    ambientLight: null,
    hemiLight: null,
    dirLight: null,
    rimLight: null,
    pointLights: [],

    // Resources for clean dispose()
    geometries: [],
    materials: [],

    // Static AABB colliders + spatial hash
    colliders: [],
    spatialHash: new Map(),

    // Pre-allocated flat typed arrays for pylon ring & crystal animation (zero GC)
    pylonCount: 0,
    pylonPosX: null,
    pylonPosY: null,
    pylonPosZ: null,
    pylonRingPhase: null,

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

    // 1. Renderer Tone Mapping, Soft Shadows & Atmospheric Depth Fog
    if (state.renderer) {
      const dpr = typeof window !== 'undefined' && window.devicePixelRatio
        ? Math.min(window.devicePixelRatio, q.pixelRatioCap)
        : 1;
      state.renderer.setPixelRatio(dpr);
      if (typeof THREE.ACESFilmicToneMapping !== 'undefined') {
        state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        state.renderer.toneMappingExposure = 1.12;
      }
      if (typeof THREE.sRGBEncoding !== 'undefined') {
        state.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      if (state.renderer.shadowMap) {
        state.renderer.shadowMap.enabled = q.shadows;
        if (typeof THREE.PCFSoftShadowMap !== 'undefined') {
          state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
      }
    }
    scene.fog = new THREE.FogExp2(0x060b1c, q.fogDensity);

    const root = new THREE.Group();
    root.name = 'AstroWorldEngineRoot';
    scene.add(root);
    state.rootGroup = root;

    // 2. Sci-Fi Atmospheric Lighting (Hemisphere + Key Directional + Rim Directional)
    const ambient = new THREE.AmbientLight(0x1e293b, 0.45);
    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x0b1120, 0.72);
    const dir = new THREE.DirectionalLight(0xe0f2fe, 1.65);
    dir.position.set(130, 220, 95);
    if (q.shadows) {
      dir.castShadow = true;
      dir.shadow.mapSize.width = q.tier === 'high' ? 2048 : 1024;
      dir.shadow.mapSize.height = q.tier === 'high' ? 2048 : 1024;
      dir.shadow.camera.near = 20;
      dir.shadow.camera.far = 540;
      dir.shadow.bias = -0.0005;
      const d = 175;
      dir.shadow.camera.left = -d;
      dir.shadow.camera.right = d;
      dir.shadow.camera.top = d;
      dir.shadow.camera.bottom = -d;
    }
    const rim = new THREE.DirectionalLight(0x6366f1, 0.65);
    rim.position.set(-140, 95, -130);

    root.add(ambient, hemi, dir, rim);
    state.ambientLight = ambient;
    state.hemiLight = hemi;
    state.dirLight = dir;
    state.rimLight = rim;

    // 3. Procedural Deep-Space Nebula Sky Dome (1 draw call, ShaderMaterial)
    const skyGeo = new THREE.SphereGeometry(950, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTime: { value: 0 },
        topColor: { value: new THREE.Color(0x02040a) },
        midColor: { value: new THREE.Color(0x09132b) },
        horizonColor: { value: new THREE.Color(0x122b52) },
        nebulaA: { value: new THREE.Color(0x0ea5e9) },
        nebulaB: { value: new THREE.Color(0x6366f1) }
      },
      vertexShader: [
        'varying vec3 vDir;',
        'void main() {',
        '  vDir = normalize(position);',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform vec3 topColor;',
        'uniform vec3 midColor;',
        'uniform vec3 horizonColor;',
        'uniform vec3 nebulaA;',
        'uniform vec3 nebulaB;',
        'varying vec3 vDir;',
        'float hash(vec3 p) {',
        '  p = fract(p * 0.3183099 + 0.1);',
        '  p *= 17.0;',
        '  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));',
        '}',
        'float noise(vec3 x) {',
        '  vec3 i = floor(x);',
        '  vec3 f = fract(x);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),',
        '                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),',
        '             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),',
        '                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);',
        '}',
        'float fbm(vec3 p) {',
        '  float v = 0.0;',
        '  float a = 0.5;',
        '  for (int i = 0; i < 4; i++) {',
        '    v += a * noise(p);',
        '    p = p * 2.04 + vec3(1.7, 9.2, 3.4);',
        '    a *= 0.5;',
        '  }',
        '  return v;',
        '}',
        'void main() {',
        '  vec3 d = normalize(vDir);',
        '  float h = clamp(d.y, 0.0, 1.0);',
        '  vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.25, h));',
        '  col = mix(col, topColor, smoothstep(0.25, 0.85, h));',
        '  float band = exp(-pow((d.y - 0.28 + d.x * 0.18) * 3.2, 2.0));',
        '  float n1 = fbm(d * 3.5 + vec3(uTime * 0.004, 0.0, 0.0));',
        '  float n2 = fbm(d * 6.0 - vec3(0.0, uTime * 0.003, 1.2));',
        '  col += nebulaA * smoothstep(0.38, 0.85, n1) * band * 0.28;',
        '  col += nebulaB * smoothstep(0.42, 0.88, n2) * (0.12 + band * 0.22);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    skyDome.frustumCulled = false;
    root.add(skyDome);
    state.skyDome = skyDome;
    state.skyMat = skyMat;
    state.geometries.push(skyGeo);
    state.materials.push(skyMat);

    // 4. Rich Multi-Spectral Starfield (1 draw call, ShaderMaterial)
    const rand = mulberry32(20261126);
    const starPositions = new Float32Array(q.starCount * 3);
    const starColors = new Float32Array(q.starCount * 3);
    const starSizes = new Float32Array(q.starCount);
    const starPhases = new Float32Array(q.starCount);

    for (let i = 0; i < q.starCount; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(0.05 + rand() * 0.95);
      const rad = 760 + rand() * 140;
      const idx3 = i * 3;
      starPositions[idx3] = rad * Math.sin(phi) * Math.cos(theta);
      starPositions[idx3 + 1] = rad * Math.cos(phi);
      starPositions[idx3 + 2] = rad * Math.sin(phi) * Math.sin(theta);

      const spec = rand();
      if (spec > 0.82) {
        // Warm golden/amber star
        starColors[idx3] = 1.0;
        starColors[idx3 + 1] = 0.84;
        starColors[idx3 + 2] = 0.62;
      } else if (spec > 0.45) {
        // Crisp blue-white star
        starColors[idx3] = 0.8;
        starColors[idx3 + 1] = 0.91;
        starColors[idx3 + 2] = 1.0;
      } else {
        // Cool cyan-white star
        starColors[idx3] = 0.65;
        starColors[idx3 + 1] = 0.9;
        starColors[idx3 + 2] = 1.0;
      }
      starSizes[i] = (1.6 + rand() * 3.4) * (rand() > 0.93 ? 1.8 : 1.0);
      starPhases[i] = rand() * Math.PI * 2;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));

    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: q.pixelRatioCap }
      },
      vertexShader: [
        'attribute float aSize;',
        'attribute float aPhase;',
        'attribute vec3 color;',
        'uniform float uTime;',
        'uniform float uPixelRatio;',
        'varying vec3 vColor;',
        'varying float vTwinkle;',
        'void main() {',
        '  vColor = color;',
        '  vTwinkle = 0.72 + 0.28 * sin(uTime * 1.6 + aPhase);',
        '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = aSize * uPixelRatio * (420.0 / max(1.0, -mvPosition.z));',
        '  gl_Position = projectionMatrix * mvPosition;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vColor;',
        'varying float vTwinkle;',
        'void main() {',
        '  vec2 uv = gl_PointCoord - vec2(0.5);',
        '  float d = length(uv) * 2.0;',
        '  if (d > 1.0) discard;',
        '  float alpha = pow(1.0 - d, 1.8) * vTwinkle;',
        '  gl_FragColor = vec4(vColor, alpha);',
        '}'
      ].join('\n')
    });

    const starField = new THREE.Points(starGeo, starMat);
    starField.frustumCulled = false;
    root.add(starField);
    state.starField = starField;
    state.starMat = starMat;
    state.geometries.push(starGeo);
    state.materials.push(starMat);

    // 5. Distant Ringed Planet & Moon Silhouette (3 lightweight meshes)
    const planetGroup = new THREE.Group();
    const planetGeo = new THREE.SphereGeometry(72, 32, 24);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      emissive: 0x08162b,
      roughness: 0.85,
      metalness: 0.05,
      fog: false
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.position.set(-420, 290, -560);
    planetMesh.frustumCulled = false;

    const ringTex = createPlanetRingTexture(q.anisotropy);
    const ringGeo = new THREE.RingGeometry(94, 158, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      fog: false
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(planetMesh.position);
    ringMesh.rotation.set(Math.PI * 0.42, 0.25, -0.28);
    ringMesh.frustumCulled = false;

    const moonGeo = new THREE.SphereGeometry(16, 20, 16);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      emissive: 0x090d16,
      roughness: 0.92,
      metalness: 0.05,
      fog: false
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(-250, 355, -490);
    moonMesh.frustumCulled = false;

    planetGroup.add(planetMesh, ringMesh, moonMesh);
    root.add(planetGroup);
    state.planetGroup = planetGroup;
    state.geometries.push(planetGeo, ringGeo, moonGeo);
    state.materials.push(planetMat, ringMat, moonMat);

    // 6. Procedural Metallic Deck / Urban Grid Plane + Central Spawn Pad
    const groundTex = createGroundTextures(q.anisotropy);
    const groundGeo = new THREE.PlaneGeometry(1400, 1400, 1, 1);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          map: groundTex.map,
          bumpMap: groundTex.bumpMap,
          bumpScale: 0.08,
          roughnessMap: groundTex.roughnessMap,
          color: 0xe2e8f0,
          roughness: 0.72,
          metalness: 0.62
        })
      : new THREE.MeshLambertMaterial({
          map: groundTex.map,
          color: 0xe2e8f0
        });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = q.shadows;
    root.add(groundMesh);
    state.groundMesh = groundMesh;
    state.geometries.push(groundGeo);
    state.materials.push(groundMat);

    // Raised metallic central spawn pad matching getGroundHeight()
    const padGeo = new THREE.CylinderGeometry(18, 22, 0.25, 48);
    const padMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          map: groundTex.map,
          color: 0xcbd5e1,
          roughness: 0.42,
          metalness: 0.75
        })
      : new THREE.MeshLambertMaterial({ color: 0x334155 });
    const spawnPadMesh = new THREE.Mesh(padGeo, padMat);
    spawnPadMesh.position.set(0, 0.125, 0);
    spawnPadMesh.receiveShadow = q.shadows;
    root.add(spawnPadMesh);
    state.spawnPadMesh = spawnPadMesh;
    state.geometries.push(padGeo);
    state.materials.push(padMat);

    const trimGeo = new THREE.TorusGeometry(18.1, 0.14, 8, 64);
    trimGeo.rotateX(Math.PI / 2);
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const spawnTrimMesh = new THREE.Mesh(trimGeo, trimMat);
    spawnTrimMesh.position.set(0, 0.26, 0);
    root.add(spawnTrimMesh);
    state.spawnTrimMesh = spawnTrimMesh;
    state.geometries.push(trimGeo);
    state.materials.push(trimMat);

    // 7. Realistic Multi-Tier City Towers + Setbacks + Rooftop Spires (3 InstancedMeshes)
    const towerTex = createTowerTextures(q.anisotropy);
    const towerGeo = new THREE.BoxGeometry(1, 1, 1);
    const towerMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          map: towerTex.map,
          emissiveMap: towerTex.emissiveMap,
          emissive: 0xffffff,
          emissiveIntensity: 0.85,
          roughnessMap: towerTex.roughnessMap,
          color: 0xdbeafe,
          roughness: 0.48,
          metalness: 0.72
        })
      : new THREE.MeshLambertMaterial({
          map: towerTex.map,
          color: 0xdbeafe
        });

    const towerMesh = new THREE.InstancedMesh(towerGeo, towerMat, q.towerCount);
    towerMesh.castShadow = q.shadows;
    towerMesh.receiveShadow = q.shadows;
    towerMesh.frustumCulled = false;

    const setbackMesh = new THREE.InstancedMesh(towerGeo, towerMat, q.towerCount);
    setbackMesh.castShadow = q.shadows;
    setbackMesh.receiveShadow = q.shadows;
    setbackMesh.frustumCulled = false;

    const spireGeo = new THREE.CylinderGeometry(0.06, 0.28, 1, 6);
    const spireMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.35,
          metalness: 0.85
        })
      : new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const spireMesh = new THREE.InstancedMesh(spireGeo, spireMat, q.towerCount);
    spireMesh.frustumCulled = false;

    const beaconPositions = [];
    const towerPalette = [0x93c5fd, 0xa5f3fc, 0xc7d2fe, 0xcbd5e1, 0xbae6fd];

    let placedTowers = 0;
    let placedSetbacks = 0;
    let placedSpires = 0;
    let attempts = 0;

    while (placedTowers < q.towerCount && attempts < q.towerCount * 6) {
      attempts++;
      const gx = Math.round((rand() - 0.5) * 16) * 26;
      const gz = Math.round((rand() - 0.5) * 16) * 26;
      if (Math.abs(gx) < 28 && Math.abs(gz) < 28) continue;
      if (Math.abs(gx) < 14 || Math.abs(gz) < 14) continue;

      const w = 10 + rand() * 10;
      const d = 10 + rand() * 10;
      const h = 24 + rand() * 88;

      _scratchPos.set(gx, h * 0.5, gz);
      _scratchQuat.identity();
      _scratchScale.set(w, h, d);
      _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
      towerMesh.setMatrixAt(placedTowers, _scratchMat4);

      _scratchColor.setHex(towerPalette[placedTowers % towerPalette.length]);
      towerMesh.setColorAt(placedTowers, _scratchColor);

      registerCollider(gx - w * 0.5, gx + w * 0.5, gz - d * 0.5, gz + d * 0.5, h);

      let topY = h;

      // Upper architectural setback tier on ~75% of towers
      if (rand() > 0.25) {
        const sw = w * (0.58 + rand() * 0.16);
        const sd = d * (0.58 + rand() * 0.16);
        const sh = h * (0.22 + rand() * 0.26);
        _scratchPos.set(gx, h + sh * 0.5, gz);
        _scratchScale.set(sw, sh, sd);
        _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
        setbackMesh.setMatrixAt(placedSetbacks, _scratchMat4);
        setbackMesh.setColorAt(placedSetbacks, _scratchColor);
        placedSetbacks++;
        topY += sh;
      }

      // Rooftop antenna spire on ~65% of towers
      if (rand() > 0.35) {
        const spireH = 6 + rand() * 14;
        _scratchPos.set(gx, topY + spireH * 0.5, gz);
        _scratchScale.set(1, spireH, 1);
        _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
        spireMesh.setMatrixAt(placedSpires, _scratchMat4);
        placedSpires++;
        topY += spireH;
      }

      if (beaconPositions.length < q.beaconCount * 3) {
        beaconPositions.push(gx, topY + 0.6, gz);
      }
      placedTowers++;
    }

    towerMesh.count = placedTowers;
    towerMesh.instanceMatrix.needsUpdate = true;
    if (towerMesh.instanceColor) towerMesh.instanceColor.needsUpdate = true;

    setbackMesh.count = placedSetbacks;
    setbackMesh.instanceMatrix.needsUpdate = true;
    if (setbackMesh.instanceColor) setbackMesh.instanceColor.needsUpdate = true;

    spireMesh.count = placedSpires;
    spireMesh.instanceMatrix.needsUpdate = true;

    root.add(towerMesh, setbackMesh, spireMesh);
    state.towerInstanced = towerMesh;
    state.towerSetbackInstanced = setbackMesh;
    state.towerSpireInstanced = spireMesh;
    state.geometries.push(towerGeo, spireGeo);
    state.materials.push(towerMat, spireMat);

    // 8. Realistic Orbital Energy Pylons (Base Collar + Fluted Housing + Rotating Rings + Crystal Core)
    const pylonBaseGeo = new THREE.CylinderGeometry(1.25, 1.65, 1.4, 8);
    const pylonHousingGeo = new THREE.CylinderGeometry(0.58, 0.98, 1, 6);
    const pylonRingGeo = new THREE.TorusGeometry(1.35, 0.08, 8, 28);
    const crystalGeo = new THREE.OctahedronGeometry(0.95, 0);

    const metalDarkMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.32,
          metalness: 0.88
        })
      : new THREE.MeshLambertMaterial({ color: 0x334155 });

    const pylonHousingMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          emissive: 0x0284c7,
          emissiveIntensity: 0.25,
          roughness: 0.28,
          metalness: 0.85
        })
      : new THREE.MeshLambertMaterial({ color: 0x1e293b });

    const pylonRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85
    });

    const crystalMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          color: 0xe0f2fe,
          emissive: 0x0ea5e9,
          emissiveIntensity: 1.35,
          roughness: 0.12,
          metalness: 0.25,
          flatShading: true
        })
      : new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const pylonBaseMesh = new THREE.InstancedMesh(pylonBaseGeo, metalDarkMat, q.pylonCount);
    const pylonMesh = new THREE.InstancedMesh(pylonHousingGeo, pylonHousingMat, q.pylonCount);
    const pylonRingMesh = new THREE.InstancedMesh(pylonRingGeo, pylonRingMat, q.pylonCount);
    const crystalMesh = new THREE.InstancedMesh(crystalGeo, crystalMat, q.pylonCount);

    pylonBaseMesh.frustumCulled = false;
    pylonMesh.frustumCulled = false;
    pylonRingMesh.frustumCulled = false;
    crystalMesh.frustumCulled = false;
    pylonRingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    crystalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    state.pylonCount = q.pylonCount;
    state.pylonPosX = new Float32Array(q.pylonCount);
    state.pylonPosY = new Float32Array(q.pylonCount);
    state.pylonPosZ = new Float32Array(q.pylonCount);
    state.pylonRingPhase = new Float32Array(q.pylonCount);

    for (let i = 0; i < q.pylonCount; i++) {
      const angle = (i / q.pylonCount) * Math.PI * 2;
      const ringRadius = (i % 2 === 0) ? 46 : 138;
      const px = Math.cos(angle) * ringRadius;
      const pz = Math.sin(angle) * ringRadius;
      const ph = (i % 2 === 0) ? 13.5 : 25.0;

      state.pylonPosX[i] = px;
      state.pylonPosY[i] = ph + 2.0;
      state.pylonPosZ[i] = pz;
      state.pylonRingPhase[i] = i * 0.65;

      // Stepped metallic base collar
      _scratchPos.set(px, 0.7, pz);
      _scratchQuat.identity();
      _scratchScale.set(1, 1, 1);
      _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
      pylonBaseMesh.setMatrixAt(i, _scratchMat4);

      // Tapered structural housing
      _scratchPos.set(px, 1.4 + ph * 0.5, pz);
      _scratchScale.set(1, ph, 1);
      _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
      pylonMesh.setMatrixAt(i, _scratchMat4);

      // Containment ring
      _scratchPos.set(px, ph + 2.0, pz);
      _scratchEuler.set(Math.PI * 0.35, i * 0.5, 0);
      _scratchQuat.setFromEuler(_scratchEuler);
      _scratchScale.set(1, 1, 1);
      _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
      pylonRingMesh.setMatrixAt(i, _scratchMat4);

      // Crystal core
      _scratchPos.set(px, ph + 2.0, pz);
      _scratchQuat.identity();
      _scratchScale.set(0.9, 1.65, 0.9);
      _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
      crystalMesh.setMatrixAt(i, _scratchMat4);

      _scratchColor.setHex(i % 2 === 0 ? 0x00f2ff : 0x818cf8);
      pylonRingMesh.setColorAt(i, _scratchColor);
      crystalMesh.setColorAt(i, _scratchColor);

      registerCollider(px - 1.65, px + 1.65, pz - 1.65, pz + 1.65, ph + 1.4);
    }

    pylonBaseMesh.instanceMatrix.needsUpdate = true;
    pylonMesh.instanceMatrix.needsUpdate = true;
    pylonRingMesh.instanceMatrix.needsUpdate = true;
    crystalMesh.instanceMatrix.needsUpdate = true;
    if (pylonRingMesh.instanceColor) pylonRingMesh.instanceColor.needsUpdate = true;
    if (crystalMesh.instanceColor) crystalMesh.instanceColor.needsUpdate = true;

    root.add(pylonBaseMesh, pylonMesh, pylonRingMesh, crystalMesh);
    state.pylonBaseInstanced = pylonBaseMesh;
    state.pylonInstanced = pylonMesh;
    state.pylonRingInstanced = pylonRingMesh;
    state.crystalInstanced = crystalMesh;
    state.geometries.push(pylonBaseGeo, pylonHousingGeo, pylonRingGeo, crystalGeo);
    state.materials.push(metalDarkMat, pylonHousingMat, pylonRingMat, crystalMat);

    // Subtle PointLights on inner pylon ring for realistic ground/deck reflections
    state.pointLights = [];
    for (let i = 0; i < q.pointLightCount; i++) {
      const angle = (i / Math.max(1, q.pointLightCount)) * Math.PI * 2;
      const pl = new THREE.PointLight(i % 2 === 0 ? 0x38bdf8 : 0x818cf8, 2.2, 48, 2);
      pl.position.set(Math.cos(angle) * 46, 15.5, Math.sin(angle) * 46);
      root.add(pl);
      state.pointLights.push(pl);
    }

    // 9. Instanced Rooftop Aviation / Beacon Lights (1 draw call)
    const actualBeacons = Math.min(q.beaconCount, Math.floor(beaconPositions.length / 3));
    const beaconGeo = new THREE.SphereGeometry(0.45, 8, 6);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const beaconMesh = new THREE.InstancedMesh(beaconGeo, beaconMat, Math.max(1, actualBeacons));
    beaconMesh.frustumCulled = false;

    const beaconColors = [0xf43f5e, 0x00f2ff, 0xf43f5e, 0x38bdf8, 0xf59e0b];
    for (let i = 0; i < actualBeacons; i++) {
      const bIdx = i * 3;
      _scratchPos.set(beaconPositions[bIdx], beaconPositions[bIdx + 1], beaconPositions[bIdx + 2]);
      _scratchQuat.identity();
      _scratchScale.set(1, 1, 1);
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

    // 10. Instanced Floating Asteroids (1 draw call, animated with zero allocations)
    const astGeo = new THREE.IcosahedronGeometry(1, 1);
    const astMat = q.useStandardMaterial
      ? new THREE.MeshStandardMaterial({
          color: 0x64748b,
          roughness: 0.84,
          metalness: 0.22,
          flatShading: true
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

    if (state.skyMat) {
      state.skyMat.uniforms.uTime.value = t;
    }
    if (state.starMat) {
      state.starMat.uniforms.uTime.value = t;
    }

    // Keep sky dome, starfield & distant ringed planet centered on player
    if (playerPos) {
      const px = playerPos.x || 0;
      const pz = playerPos.z || 0;
      if (state.skyDome) {
        state.skyDome.position.set(px, 0, pz);
      }
      if (state.starField) {
        state.starField.position.set(px, 0, pz);
      }
      if (state.planetGroup) {
        state.planetGroup.position.set(px, 0, pz);
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

    // Animate holographic containment rings & crystal cores (zero allocations)
    const ringMesh = state.pylonRingInstanced;
    const crystalMesh = state.crystalInstanced;
    if (ringMesh && crystalMesh) {
      const pCount = state.pylonCount;
      const ppx = state.pylonPosX;
      const ppy = state.pylonPosY;
      const ppz = state.pylonPosZ;
      const pph = state.pylonRingPhase;

      for (let i = 0; i < pCount; i++) {
        const phase = pph[i] + t * 1.15;
        const bob = Math.sin(phase * 1.4) * 0.28;

        _scratchPos.set(ppx[i], ppy[i], ppz[i]);
        _scratchEuler.set(Math.PI * 0.35 + Math.sin(phase * 0.7) * 0.25, phase, phase * 0.4);
        _scratchQuat.setFromEuler(_scratchEuler);
        _scratchScale.set(1, 1, 1);
        _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
        ringMesh.setMatrixAt(i, _scratchMat4);

        _scratchPos.set(ppx[i], ppy[i] + bob, ppz[i]);
        _scratchEuler.set(0, -phase * 0.85, 0);
        _scratchQuat.setFromEuler(_scratchEuler);
        _scratchScale.set(0.9, 1.65, 0.9);
        _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
        crystalMesh.setMatrixAt(i, _scratchMat4);
      }
      ringMesh.instanceMatrix.needsUpdate = true;
      crystalMesh.instanceMatrix.needsUpdate = true;
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

    const cacheKeys = Object.keys(_textureCache);
    for (let i = 0; i < cacheKeys.length; i++) {
      const key = cacheKeys[i];
      if (_textureCache[key]) {
        _textureCache[key].dispose();
        _textureCache[key] = null;
      }
    }

    state.geometries.length = 0;
    state.materials.length = 0;
    state.colliders.length = 0;
    state.pointLights.length = 0;
    state.spatialHash.clear();

    state.scene = null;
    state.renderer = null;
    state.rootGroup = null;
    state.skyDome = null;
    state.skyMat = null;
    state.starField = null;
    state.starMat = null;
    state.planetGroup = null;
    state.groundMesh = null;
    state.spawnPadMesh = null;
    state.spawnTrimMesh = null;
    state.towerInstanced = null;
    state.towerSetbackInstanced = null;
    state.towerSpireInstanced = null;
    state.pylonInstanced = null;
    state.pylonBaseInstanced = null;
    state.pylonRingInstanced = null;
    state.crystalInstanced = null;
    state.beaconInstanced = null;
    state.asteroidInstanced = null;
    state.ambientLight = null;
    state.hemiLight = null;
    state.dirLight = null;
    state.rimLight = null;
    state.pylonCount = 0;
    state.pylonPosX = null;
    state.pylonPosY = null;
    state.pylonPosZ = null;
    state.pylonRingPhase = null;
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
