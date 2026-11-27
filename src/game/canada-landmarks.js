/**
 * Canada Landmarks & Procedural Biome Builder (Three.js r128)
 * Exposes `window.CanadaLandmarks.buildProvinceWorld(scene, province, qualityTier)`
 * Uses cached procedural CanvasTextures, shared BufferGeometries, and InstancedMesh
 * for 60 FPS performance with zero per-frame allocations.
 *
 * Full 760-metre Trans-Canada Highway corridor (z: -380 → +380, terrain width 440m).
 * Dense roadside biomes, highway signage, 30+ city buildings, chalets, grain elevators,
 * lighthouses, and grand Banff/Rockies + all provincial landmarks at expanded coordinates.
 */
(function (global) {
  'use strict';

  const TEX_CACHE = Object.create(null);

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function tierScale(qualityTier) {
    if (qualityTier === 'battery') return 0.45;
    if (qualityTier === 'balanced') return 0.72;
    return 1.0;
  }

  function getCachedTexture(THREE, key, size, drawFn, opts) {
    if (TEX_CACHE[key]) return TEX_CACHE[key];
    const o = opts || {};
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    if (o.rx || o.ry) tex.repeat.set(o.rx || 1, o.ry || 1);
    if (o.srgb && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    TEX_CACHE[key] = tex;
    return tex;
  }

  // ─── Texture Factories ────────────────────────────────────────────────────

  function getTerrainTextures(THREE, biome, groundColor) {
    const keyBase = 'terrain_' + biome + '_' + groundColor;
    const rng = mulberry32(hashString(keyBase));
    const map = getCachedTexture(THREE, keyBase + '_diff', 256, function (ctx, s) {
      ctx.fillStyle = groundColor || '#3b6b3f';
      ctx.fillRect(0, 0, s, s);
      const isSnow = biome === 'arctic-tundra' || biome === 'klondike-glacier';
      const isShield = biome === 'subarctic-shield' || biome === 'granite-lighthouse';
      const isRed = biome === 'red-sand-island' || biome === 'fundy-coast';
      const isPrairie = biome === 'living-skies-wheat' || biome === 'prairie-lake';
      for (let i = 0; i < 2400; i += 1) {
        const x = rng() * s, y = rng() * s, r = 1 + rng() * (isSnow ? 4.5 : 3.2), v = rng();
        if (isSnow) ctx.fillStyle = v > 0.78 ? 'rgba(203,213,225,0.28)' : (v > 0.35 ? 'rgba(255,255,255,0.34)' : 'rgba(148,163,184,0.18)');
        else if (isShield) ctx.fillStyle = v > 0.7 ? 'rgba(100,116,139,0.26)' : (v > 0.35 ? 'rgba(74,107,68,0.28)' : 'rgba(163,177,138,0.2)');
        else if (isRed) ctx.fillStyle = v > 0.65 ? 'rgba(180,83,9,0.24)' : (v > 0.3 ? 'rgba(63,115,62,0.26)' : 'rgba(217,119,6,0.16)');
        else if (isPrairie) ctx.fillStyle = v > 0.65 ? 'rgba(161,132,48,0.25)' : (v > 0.3 ? 'rgba(84,122,58,0.25)' : 'rgba(120,96,48,0.18)');
        else ctx.fillStyle = v > 0.68 ? 'rgba(34,84,45,0.28)' : (v > 0.32 ? 'rgba(82,128,64,0.24)' : 'rgba(78,64,46,0.18)');
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = isSnow ? 'rgba(255,255,255,0.16)' : 'rgba(20,40,20,0.14)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 420; i += 1) {
        const x = rng() * s, y = rng() * s;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rng() - 0.5) * 6, y - 2 - rng() * 5); ctx.stroke();
      }
    }, { rx: 22, ry: 22, srgb: true });
    const bump = getCachedTexture(THREE, keyBase + '_bump', 256, function (ctx, s) {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
      const bRng = mulberry32(hashString(keyBase + '_b'));
      for (let i = 0; i < 2200; i += 1) {
        const shade = Math.floor(85 + bRng() * 90);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        ctx.fillRect(bRng() * s, bRng() * s, 2 + bRng() * 3, 2 + bRng() * 3);
      }
    }, { rx: 22, ry: 22, srgb: false });
    return { map, bump };
  }

  function getRoadTextures(THREE, isIceRoad) {
    const key = isIceRoad ? 'road_ice' : 'road_asphalt';
    const rng = mulberry32(hashString(key));
    const map = getCachedTexture(THREE, key + '_diff', 256, function (ctx, s) {
      ctx.fillStyle = isIceRoad ? '#9ec5de' : '#262b33';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 3600; i += 1) {
        const x = rng() * s, y = rng() * s, v = rng();
        if (isIceRoad) ctx.fillStyle = v > 0.5 ? 'rgba(224,242,254,0.28)' : 'rgba(125,175,205,0.24)';
        else ctx.fillStyle = v > 0.55 ? 'rgba(71,85,105,0.28)' : 'rgba(15,23,42,0.34)';
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      const trackGradL = ctx.createLinearGradient(s * 0.18, 0, s * 0.42, 0);
      trackGradL.addColorStop(0, 'rgba(0,0,0,0)');
      trackGradL.addColorStop(0.5, isIceRoad ? 'rgba(186,230,253,0.25)' : 'rgba(12,16,22,0.28)');
      trackGradL.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = trackGradL; ctx.fillRect(s * 0.18, 0, s * 0.24, s);
      const trackGradR = ctx.createLinearGradient(s * 0.58, 0, s * 0.82, 0);
      trackGradR.addColorStop(0, 'rgba(0,0,0,0)');
      trackGradR.addColorStop(0.5, isIceRoad ? 'rgba(186,230,253,0.25)' : 'rgba(12,16,22,0.28)');
      trackGradR.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = trackGradR; ctx.fillRect(s * 0.58, 0, s * 0.24, s);
      ctx.fillStyle = isIceRoad ? 'rgba(224,242,254,0.65)' : 'rgba(241,245,249,0.75)';
      ctx.fillRect(s * 0.045, 0, s * 0.022, s);
      ctx.fillRect(s * 0.933, 0, s * 0.022, s);
      ctx.strokeStyle = isIceRoad ? 'rgba(255,255,255,0.22)' : 'rgba(10,12,16,0.38)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i += 1) {
        const y0 = rng() * s;
        ctx.beginPath(); ctx.moveTo(rng() * s * 0.5, y0); ctx.lineTo(rng() * s, y0 + (rng() - 0.5) * 18); ctx.stroke();
      }
    }, { rx: 1, ry: 56, srgb: true });
    const bump = getCachedTexture(THREE, key + '_bump', 256, function (ctx, s) {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
      const bRng = mulberry32(hashString(key + '_b'));
      for (let i = 0; i < 3000; i += 1) {
        const shade = Math.floor(95 + bRng() * 75);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        ctx.fillRect(bRng() * s, bRng() * s, 1.5, 1.5);
      }
    }, { rx: 1, ry: 56, srgb: false });
    return { map, bump };
  }

  function getWaterBumpTexture(THREE) {
    return getCachedTexture(THREE, 'water_ripples_bump', 256, function (ctx, s) {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
      const img = ctx.getImageData(0, 0, s, s), d = img.data;
      for (let y = 0; y < s; y += 1) {
        const ny = (y / s) * Math.PI * 2;
        for (let x = 0; x < s; x += 1) {
          const nx = (x / s) * Math.PI * 2;
          const w = Math.sin(nx * 3 + Math.cos(ny * 2)) * 0.35 + Math.cos(ny * 5 - Math.sin(nx * 2)) * 0.3 + Math.sin((nx + ny) * 4) * 0.2;
          const val = Math.max(0, Math.min(255, Math.floor(128 + w * 90)));
          const idx = (y * s + x) * 4;
          d[idx] = val; d[idx + 1] = val; d[idx + 2] = val; d[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }, { rx: 14, ry: 7, srgb: false });
  }

  function getConcreteTexture(THREE) {
    return getCachedTexture(THREE, 'concrete_diff', 256, function (ctx, s) {
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(4219);
      for (let i = 0; i < 1800; i += 1) {
        const shade = Math.floor(175 + rng() * 55);
        ctx.fillStyle = 'rgba(' + shade + ',' + shade + ',' + (shade + 4) + ',0.35)';
        ctx.fillRect(rng() * s, rng() * s, 2, 2);
      }
      ctx.strokeStyle = 'rgba(100,116,139,0.22)'; ctx.lineWidth = 1;
      for (let y = 32; y < s; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke(); }
    }, { rx: 2, ry: 2, srgb: true });
  }

  function getStoneTexture(THREE) {
    return getCachedTexture(THREE, 'stone_ashlar_diff', 256, function (ctx, s) {
      ctx.fillStyle = '#a8a29e'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(7731), rows = 8, rowH = s / rows;
      for (let r = 0; r < rows; r += 1) {
        const offset = (r % 2) * 32;
        for (let c = -1; c < 5; c += 1) {
          const bx = c * 64 + offset, by = r * rowH, shade = Math.floor(145 + rng() * 38);
          ctx.fillStyle = 'rgb(' + shade + ',' + (shade - 2) + ',' + (shade - 6) + ')';
          ctx.fillRect(bx + 1, by + 1, 62, rowH - 2);
        }
      }
    }, { rx: 2, ry: 2, srgb: true });
  }

  function getWoodTexture(THREE) {
    return getCachedTexture(THREE, 'wood_planks_diff', 256, function (ctx, s) {
      ctx.fillStyle = '#78350f'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(9912);
      for (let y = 0; y < s; y += 16) {
        const tone = Math.floor(105 + rng() * 40);
        ctx.fillStyle = 'rgb(' + tone + ',' + Math.floor(tone * 0.56) + ',' + Math.floor(tone * 0.25) + ')';
        ctx.fillRect(0, y + 1, s, 14);
        ctx.strokeStyle = 'rgba(40,18,6,0.3)'; ctx.beginPath(); ctx.moveTo(0, y + 7); ctx.lineTo(s, y + 7); ctx.stroke();
      }
    }, { rx: 2, ry: 2, srgb: true });
  }

  function getBarkTexture(THREE) {
    const map = getCachedTexture(THREE, 'bark_diff', 128, function (ctx, s) {
      ctx.fillStyle = '#4b3621'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(1337);
      for (let i = 0; i < 240; i += 1) {
        const x = rng() * s;
        ctx.fillStyle = rng() > 0.5 ? 'rgba(30,20,10,0.45)' : 'rgba(110,82,55,0.35)';
        ctx.fillRect(x, 0, 1 + rng() * 3, s);
      }
    }, { rx: 1, ry: 2, srgb: true });
    const bump = getCachedTexture(THREE, 'bark_bump', 128, function (ctx, s) {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(1338);
      for (let i = 0; i < 240; i += 1) {
        const shade = Math.floor(70 + rng() * 110);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        ctx.fillRect(rng() * s, 0, 1 + rng() * 3, s);
      }
    }, { rx: 1, ry: 2, srgb: false });
    return { map, bump };
  }

  function getFoliageTexture(THREE, isConifer) {
    const key = isConifer ? 'foliage_conifer' : 'foliage_deciduous';
    return getCachedTexture(THREE, key, 128, function (ctx, s) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(hashString(key));
      for (let i = 0; i < 900; i += 1) {
        const shade = Math.floor(175 + rng() * 80);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        if (isConifer) { const x = rng() * s, y = rng() * s; ctx.fillRect(x, y, 2, 5); }
        else { ctx.beginPath(); ctx.arc(rng() * s, rng() * s, 2 + rng() * 3.5, 0, Math.PI * 2); ctx.fill(); }
      }
    }, { rx: 2, ry: 2, srgb: true });
  }

  function getBuildingTextures(THREE) {
    const map = getCachedTexture(THREE, 'building_win_diff', 256, function (ctx, s) {
      ctx.fillStyle = '#334155'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(5051), cols = 8, rows = 12, cw = s / cols, rh = s / rows;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const x = c * cw + 4, y = r * rh + 3, w = cw - 8, h = rh - 6, lit = rng();
          ctx.fillStyle = lit > 0.65 ? '#64748b' : (lit > 0.25 ? '#475569' : '#1e293b');
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = 'rgba(186,230,253,0.18)'; ctx.fillRect(x, y, w, h * 0.38);
        }
      }
    }, { rx: 1, ry: 2, srgb: true });
    const emissiveMap = getCachedTexture(THREE, 'building_win_emis', 256, function (ctx, s) {
      ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(5052), cols = 8, rows = 12, cw = s / cols, rh = s / rows;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          if (rng() > 0.42) {
            const x = c * cw + 4, y = r * rh + 3, w = cw - 8, h = rh - 6, warm = Math.floor(170 + rng() * 85);
            ctx.fillStyle = 'rgb(' + warm + ',' + Math.floor(warm * 0.82) + ',' + Math.floor(warm * 0.5) + ')';
            ctx.fillRect(x, y, w, h);
          }
        }
      }
    }, { rx: 1, ry: 2, srgb: true });
    return { map, emissiveMap };
  }

  function getMistSpriteTexture(THREE) {
    return getCachedTexture(THREE, 'niagara_mist_sprite', 128, function (ctx, s) {
      const grad = ctx.createRadialGradient(s * 0.5, s * 0.5, 2, s * 0.5, s * 0.5, s * 0.5);
      grad.addColorStop(0, 'rgba(240,249,255,0.85)');
      grad.addColorStop(0.45, 'rgba(224,242,254,0.42)');
      grad.addColorStop(1, 'rgba(224,242,254,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, s, s);
    }, { srgb: true });
  }

  // Canadian Highway sign texture (green shield with maple leaf)
  function getHighwaySignTexture(THREE, destText, subText) {
    const key = 'hwy_sign_' + destText;
    return getCachedTexture(THREE, key, 256, function (ctx, s) {
      // Green background
      ctx.fillStyle = '#1a5c2a';
      ctx.fillRect(0, 0, s, s);
      // White border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, s - 12, s - 12);
      // Maple leaf shield shape (simplified red shield)
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(s * 0.35, 10, s * 0.3, s * 0.28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TCH', s * 0.5, 44);
      // Maple leaf icon (simple)
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px sans-serif';
      ctx.fillText('\u{1F341}', s * 0.5, 72);
      // Destination text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      const words = destText.split('/');
      ctx.fillText(words[0], s * 0.5, s * 0.60);
      if (words[1]) ctx.fillText(words[1].trim(), s * 0.5, s * 0.76);
      if (subText) {
        ctx.font = '18px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.80)';
        ctx.fillText(subText, s * 0.5, s * 0.90);
      }
    }, { srgb: true });
  }

  // Speed limit sign (white with black 100 km/h)
  function getSpeedSignTexture(THREE) {
    return getCachedTexture(THREE, 'speed_100', 128, function (ctx, s) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 7; ctx.strokeRect(4, 4, s - 8, s - 8);
      ctx.strokeStyle = '#c8102e'; ctx.lineWidth = 4; ctx.strokeRect(8, 8, s - 16, s - 16);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('MAXIMUM', s * 0.5, 32);
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('100', s * 0.5, 78);
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('km/h', s * 0.5, 104);
    }, { srgb: true });
  }

  // ─── Material Helper ─────────────────────────────────────────────────────

  function mat(THREE, color, opts) {
    const o = opts || {};
    const cfg = {
      color: color,
      roughness: o.roughness !== undefined ? o.roughness : 0.72,
      metalness: o.metalness !== undefined ? o.metalness : 0.12,
      emissive: o.emissive !== undefined ? o.emissive : 0x000000,
      emissiveIntensity: o.emissiveIntensity !== undefined ? o.emissiveIntensity : 0,
      transparent: !!o.transparent,
      opacity: o.opacity !== undefined ? o.opacity : 1.0,
      side: o.side !== undefined ? o.side : THREE.FrontSide
    };
    if (o.map) cfg.map = o.map;
    if (o.bumpMap) { cfg.bumpMap = o.bumpMap; cfg.bumpScale = o.bumpScale !== undefined ? o.bumpScale : 0.15; }
    if (o.emissiveMap) cfg.emissiveMap = o.emissiveMap;
    return new THREE.MeshStandardMaterial(cfg);
  }

  function addBox(THREE, parent, w, h, d, color, x, y, z, opts) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(THREE, color, opts));
    mesh.position.set(x, y, z);
    if (opts && opts.ry) mesh.rotation.y = opts.ry;
    if (opts && opts.rx) mesh.rotation.x = opts.rx;
    if (opts && opts.rz) mesh.rotation.z = opts.rz;
    if (opts && opts.castShadow) mesh.castShadow = true;
    if (opts && opts.receiveShadow) mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCyl(THREE, parent, rt, rb, h, seg, color, x, y, z, opts) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(THREE, color, opts));
    mesh.position.set(x, y, z);
    if (opts && opts.rx) mesh.rotation.x = opts.rx;
    if (opts && opts.rz) mesh.rotation.z = opts.rz;
    if (opts && opts.castShadow) mesh.castShadow = true;
    if (opts && opts.receiveShadow) mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCone(THREE, parent, r, h, seg, color, x, y, z, opts) {
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(THREE, color, opts));
    mesh.position.set(x, y, z);
    if (opts && opts.castShadow) mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // ─── Sky & Lighting ───────────────────────────────────────────────────────

  function buildSkyAndLighting(THREE, scene, province, qualityTier) {
    const c = province.climate;
    const fogDensityBase = qualityTier === 'battery' ? 0.0040 : 0.0022;
    scene.background = new THREE.Color(c.skyHorizon);
    scene.fog = new THREE.FogExp2(c.fogColor, fogDensityBase);

    const hemi = new THREE.HemisphereLight(c.skyTop, c.groundColor, 0.74);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(c.sunColor, 1.22);
    sun.position.set(75, 110, 55);
    if (qualityTier !== 'battery') {
      sun.castShadow = true;
      sun.shadow.mapSize.width = qualityTier === 'ultra' ? 2048 : 1024;
      sun.shadow.mapSize.height = qualityTier === 'ultra' ? 2048 : 1024;
      sun.shadow.camera.near = 10;
      sun.shadow.camera.far = 500;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.03;
      const d = 220;
      sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
      sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    }
    scene.add(sun);

    const fill = new THREE.DirectionalLight(c.accent, 0.25);
    fill.position.set(-70, 40, -60);
    scene.add(fill);

    // Atmospheric gradient sky dome
    const skyGeo = new THREE.SphereGeometry(430, 32, 20);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(c.skyTop) },
        bottomColor: { value: new THREE.Color(c.skyHorizon) },
        horizonColor: { value: new THREE.Color(c.fogColor || c.skyHorizon) },
        sunDir: { value: new THREE.Vector3(0.50, 0.74, 0.37).normalize() },
        sunColor: { value: new THREE.Color(c.sunColor) },
        sunGlow: { value: 0.85 },
        cloudOpacity: { value: 0.36 },
        uTime: { value: 0 }
      },
      vertexShader: [
        'varying vec3 vWorldDir;',
        'void main() {',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vWorldDir = normalize(wp.xyz);',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 topColor, bottomColor, horizonColor, sunDir, sunColor;',
        'uniform float sunGlow, cloudOpacity, uTime;',
        'varying vec3 vWorldDir;',
        'void main() {',
        '  vec3 dir = normalize(vWorldDir);',
        '  float h = clamp(dir.y, 0.0, 1.0);',
        '  vec3 sky = mix(bottomColor, topColor, pow(h, 0.62));',
        '  float haze = pow(1.0 - h, 5.5);',
        '  sky = mix(sky, horizonColor, haze * 0.65);',
        '  float sunAmt = max(dot(dir, normalize(sunDir)), 0.0);',
        '  float halo = pow(sunAmt, 10.0) * 0.42 * sunGlow;',
        '  float disc = smoothstep(0.9965, 0.9992, sunAmt) * 1.15 * sunGlow;',
        '  sky += sunColor * (halo + disc);',
        '  float cy = max(dir.y, 0.08);',
        '  vec2 uv = dir.xz / (cy + 0.18) + vec2(uTime * 0.008, uTime * 0.004);',
        '  float c1 = sin(uv.x * 2.1 + cos(uv.y * 1.7)) * cos(uv.y * 2.4 - sin(uv.x * 1.3));',
        '  float c2 = sin(uv.x * 4.7 - uv.y * 3.1) * 0.5;',
        '  float cloud = smoothstep(0.28, 0.85, (c1 + c2) * 0.5 + 0.5) * smoothstep(0.05, 0.35, h);',
        '  vec3 cloudCol = mix(vec3(0.96, 0.98, 1.0), sunColor, 0.25 * sunGlow);',
        '  sky = mix(sky, cloudCol, cloud * cloudOpacity);',
        '  gl_FragColor = vec4(sky, 1.0);',
        '}'
      ].join('\n')
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);
    return { hemi, sun, fill, skyMesh, skyMat, fogDensityBase };
  }

  // ─── Ground & 760m Highway Corridor ──────────────────────────────────────

  function buildGroundAndHighway(THREE, scene, province, scale) {
    const c = province.climate;
    const biome = province.biome;
    const isIceRoad = province.id === 'northwest-territories' || province.id === 'nunavut';

    // Extended terrain: 440m wide, 800m long to cover the full 760m corridor
    const groundGeo = new THREE.PlaneGeometry(440, 800, 80, 160);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const baseCol = new THREE.Color(c.groundColor);
    const rockCol = new THREE.Color(biome === 'red-sand-island' || biome === 'fundy-coast' ? 0x9a4a2a : 0x64748b);
    const peakCol = new THREE.Color(biome === 'arctic-tundra' || biome === 'klondike-glacier' || biome === 'rockies-foothills' ? 0xe2e8f0 : 0x4b5d44);
    const tmpCol = new THREE.Color();

    const isFlat = biome === 'living-skies-wheat' || biome === 'prairie-lake' || biome === 'subarctic-shield';
    const amp = isFlat ? 0.65 : 2.8;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i), z = pos.getZ(i);
      const distFromRoad = Math.abs(x);
      let y = 0;
      if (distFromRoad > 14 && Math.abs(z) > 10) {
        const hill = Math.sin(x * 0.038) * Math.cos(z * 0.038) * amp + Math.sin((x + z) * 0.018) * amp * 0.6;
        y = Math.max(-0.4, hill * Math.min(1, (distFromRoad - 14) / 22));
        pos.setY(i, y);
      }
      tmpCol.copy(baseCol);
      if (y > 0.8) tmpCol.lerp(rockCol, Math.min(0.55, (y - 0.8) * 0.25));
      if (y > 2.2) tmpCol.lerp(peakCol, Math.min(0.6, (y - 2.2) * 0.35));
      colors[i * 3] = tmpCol.r; colors[i * 3 + 1] = tmpCol.g; colors[i * 3 + 2] = tmpCol.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const terrainTex = getTerrainTextures(THREE, biome, c.groundColor);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, map: terrainTex.map, bumpMap: terrainTex.bump,
      bumpScale: 0.32, roughness: 0.90, metalness: 0.04
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Full 760m road (z: -375 to +375) ──
    const roadTex = getRoadTextures(THREE, isIceRoad);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(11.2, 760),
      mat(THREE, 0xffffff, { map: roadTex.map, bumpMap: roadTex.bump, bumpScale: 0.08, roughness: isIceRoad ? 0.32 : 0.78, metalness: isIceRoad ? 0.22 : 0.06 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.05;
    road.receiveShadow = true;
    scene.add(road);

    // Centre dashed line across full 760m (76 dashes)
    const dashCount = 76;
    const dashGeo = new THREE.PlaneGeometry(0.28, 4.2);
    dashGeo.rotateX(-Math.PI / 2);
    const dashMat = new THREE.MeshBasicMaterial({ color: isIceRoad ? 0x38bdf8 : 0xfbbf24 });
    const dashes = new THREE.InstancedMesh(dashGeo, dashMat, dashCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < dashCount; i += 1) {
      dummy.position.set(0, 0.08, -375 + i * 10);
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
      dummy.updateMatrix(); dashes.setMatrixAt(i, dummy.matrix);
    }
    dashes.instanceMatrix.needsUpdate = true;
    scene.add(dashes);

    // Concrete curbs — full 760m
    const concreteTex = getConcreteTexture(THREE);
    const curbGeo = new THREE.BoxGeometry(0.45, 0.24, 760);
    const curbMat = mat(THREE, 0xcbd5e1, { map: concreteTex, roughness: 0.85, metalness: 0.05 });
    const curbL = new THREE.Mesh(curbGeo, curbMat); curbL.position.set(-5.78, 0.12, 0); curbL.receiveShadow = true; scene.add(curbL);
    const curbR = new THREE.Mesh(curbGeo, curbMat); curbR.position.set(5.78, 0.12, 0); curbR.receiveShadow = true; scene.add(curbR);

    // Galvanized guardrails — full 760m
    const railGeo = new THREE.BoxGeometry(0.14, 0.32, 760);
    const railMat = mat(THREE, 0x94a3b8, { roughness: 0.38, metalness: 0.65 });
    const railL = new THREE.Mesh(railGeo, railMat); railL.position.set(-6.32, 0.64, 0); scene.add(railL);
    const railR = new THREE.Mesh(railGeo, railMat); railR.position.set(6.32, 0.64, 0); scene.add(railR);

    // Instanced guardrail posts (every 8m over 760m = ~95 × 2 sides)
    const postSpacing = 8;
    const postHalfCount = Math.floor(760 / postSpacing);
    const postGeo = new THREE.BoxGeometry(0.18, 0.82, 0.18);
    const postMat = mat(THREE, 0x64748b, { roughness: 0.45, metalness: 0.6 });
    const posts = new THREE.InstancedMesh(postGeo, postMat, postHalfCount * 2);
    let pIdx = 0;
    for (let i = 0; i < postHalfCount; i += 1) {
      const z = -380 + i * postSpacing;
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
      dummy.position.set(-6.35, 0.41, z); dummy.updateMatrix(); posts.setMatrixAt(pIdx++, dummy.matrix);
      dummy.position.set(6.35, 0.41, z); dummy.updateMatrix(); posts.setMatrixAt(pIdx++, dummy.matrix);
    }
    posts.count = pIdx;
    posts.instanceMatrix.needsUpdate = true;
    scene.add(posts);

    // Instanced streetlights (every ~25m alternating sides over 760m = ~30 lamps)
    const lampCount = Math.max(16, Math.round(30 * scale));
    const poleGeo = new THREE.CylinderGeometry(0.09, 0.14, 6.2, 6);
    poleGeo.translate(0, 3.1, 0);
    const armGeo = new THREE.BoxGeometry(1.6, 0.1, 0.12);
    const headGeo = new THREE.BoxGeometry(0.65, 0.14, 0.32);
    const poleMat = mat(THREE, 0x475569, { roughness: 0.4, metalness: 0.7 });
    const streetlightMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xffcf70, emissiveIntensity: 0.05, roughness: 0.2 });
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, lampCount);
    const arms = new THREE.InstancedMesh(armGeo, poleMat, lampCount);
    const heads = new THREE.InstancedMesh(headGeo, streetlightMat, lampCount);
    for (let i = 0; i < lampCount; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * 6.75;
      const z = -370 + (i / Math.max(1, lampCount - 1)) * 740;
      dummy.position.set(x, 0, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); poles.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x - side * 0.72, 6.1, z); dummy.updateMatrix(); arms.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x - side * 1.35, 6.0, z); dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix);
    }
    poles.instanceMatrix.needsUpdate = true; arms.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    scene.add(poles); scene.add(arms); scene.add(heads);

    // ── Canadian Highway Signage along the drive ──
    buildHighwaySigns(THREE, scene, province);

    // ── Water body ──
    const waterBump = getWaterBumpTexture(THREE);
    const waterGeo = new THREE.PlaneGeometry(440, 300);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: c.waterColor, roughness: isIceRoad ? 0.24 : 0.12, metalness: 0.48,
      bumpMap: waterBump, bumpScale: 0.18, transparent: true, opacity: 0.88
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(170, -0.35, -210);
    if (biome === 'atlantic-iceberg' || biome === 'granite-lighthouse' || biome === 'fundy-coast') {
      waterMesh.position.set(170, -0.35, -145);
    }
    scene.add(waterMesh);

    return { ground, road, waterMesh, waterBump, streetlightMat };
  }

  // ─── Canadian Highway Signs ───────────────────────────────────────────────

  function buildHighwaySigns(THREE, scene, province) {
    // Signs at z positions along the 760m drive
    const signs = [
      { z: -320, dest: 'BANFF NATIONAL PARK', sub: 'Trans-Canada Hwy 1', side: 1 },
      { z: -240, dest: 'LAKE LOUISE', sub: '48 km ahead', side: -1 },
      { z: -160, dest: 'CALGARY / HWY 2', sub: 'Alberta', side: 1 },
      { z: -80, dest: 'JASPER NAT\'L PARK', sub: 'Hwy 93 N', side: -1 },
      { z:  0,  dest: 'TORONTO / HWY 401', sub: 'Ontario', side: 1, speed: true },
      { z:  80, dest: 'VANCOUVER / HWY 1', sub: 'British Columbia', side: -1 },
      { z:  160, dest: 'MONTREAL / HWY 20', sub: 'Quebec', side: 1 },
      { z:  240, dest: 'PEGGY\'S COVE', sub: 'Nova Scotia', side: -1 },
      { z:  320, dest: 'NIAGARA FALLS', sub: 'QEW / HWY 420', side: 1, speed: true }
    ];

    const stoneTex = getStoneTexture(THREE);

    for (let i = 0; i < signs.length; i += 1) {
      const s = signs[i];
      const sx = s.side * 14.5;

      // Post
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 5.5, 6),
        mat(THREE, 0x64748b, { roughness: 0.5, metalness: 0.6 })
      );
      post.position.set(sx, 2.75, s.z);
      scene.add(post);

      // Sign face
      const signTex = getHighwaySignTexture(THREE, s.dest, s.sub);
      const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.8, 2.8),
        new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.5 })
      );
      signMesh.position.set(sx, 5.0, s.z);
      signMesh.rotation.y = s.side > 0 ? Math.PI : 0;
      scene.add(signMesh);

      // Optional speed limit sign below
      if (s.speed) {
        const speedTex = getSpeedSignTexture(THREE);
        const speedMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.8, 1.8),
          new THREE.MeshStandardMaterial({ map: speedTex, roughness: 0.5 })
        );
        speedMesh.position.set(sx, 2.5, s.z + s.side * 1.5);
        speedMesh.rotation.y = s.side > 0 ? Math.PI : 0;
        scene.add(speedMesh);
      }
    }
  }

  // ─── Instanced Forest (full 760m corridor) ────────────────────────────────

  function buildInstancedForest(THREE, scene, province, scale, rng) {
    const biome = province.biome;

    if (biome === 'arctic-tundra') {
      const rCount = Math.round(80 * scale);
      const rGeo = new THREE.DodecahedronGeometry(1.1, 0);
      const rocks = new THREE.InstancedMesh(rGeo, mat(THREE, 0x64748b, { roughness: 0.92 }), rCount);
      const dummy = new THREE.Object3D(), tmp = new THREE.Color();
      for (let i = 0; i < rCount; i += 1) {
        const side = rng() > 0.5 ? 1 : -1;
        const rx = side * (16 + rng() * 170), rz = -375 + rng() * 750;
        if (Math.abs(rx) < 18 && rz > -6 && rz < 36) continue;
        dummy.position.set(rx, 0.25, rz);
        dummy.rotation.set(rng() * 2, rng() * 2, rng() * 2);
        dummy.scale.set(0.6 + rng() * 1.4, 0.35 + rng() * 0.5, 0.6 + rng() * 1.3);
        dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
        tmp.setHex(rng() > 0.4 ? 0x64748b : 0x94a3b8); rocks.setColorAt(i, tmp);
      }
      rocks.instanceMatrix.needsUpdate = true;
      if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
      scene.add(rocks);
      return;
    }

    if (biome === 'living-skies-wheat') {
      const count = Math.round(1400 * scale);
      const stalkGeo = new THREE.ConeGeometry(0.16, 1.5, 4);
      stalkGeo.translate(0, 0.75, 0);
      const wheat = new THREE.InstancedMesh(stalkGeo, mat(THREE, 0xffffff, { roughness: 0.85 }), count);
      const dummy = new THREE.Object3D(), tmp = new THREE.Color();
      for (let i = 0; i < count; i += 1) {
        const side = rng() > 0.5 ? 1 : -1;
        const x = side * (12 + rng() * 170), z = -375 + rng() * 750;
        if (Math.abs(x) < 17 && z > -6 && z < 36) continue;
        dummy.position.set(x, 0, z);
        dummy.rotation.set((rng() - 0.5) * 0.14, rng() * Math.PI * 2, (rng() - 0.5) * 0.14);
        const s = 0.75 + rng() * 0.6; dummy.scale.set(s, s, s);
        dummy.updateMatrix(); wheat.setMatrixAt(i, dummy.matrix);
        tmp.setHSL(0.11 + (rng() - 0.5) * 0.03, 0.72, 0.46 + (rng() - 0.5) * 0.12);
        wheat.setColorAt(i, tmp);
      }
      wheat.instanceMatrix.needsUpdate = true;
      if (wheat.instanceColor) wheat.instanceColor.needsUpdate = true;
      scene.add(wheat);
      return;
    }

    // Dense pine/maple/spruce forest flanking the full 760m highway
    const treeCount = Math.round((biome === 'subarctic-shield' ? 160 : 320) * scale);
    const isDeciduous = biome === 'great-lakes-metro' || biome === 'capital-canal' || biome === 'red-sand-island' || biome === 'st-lawrence-citadel';
    const barkTex = getBarkTexture(THREE);
    const foliageTex = getFoliageTexture(THREE, !isDeciduous);

    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.36, 2.7, 7);
    trunkGeo.translate(0, 1.35, 0);
    const trunkMat = mat(THREE, 0x5c4028, { map: barkTex.map, bumpMap: barkTex.bump, bumpScale: 0.12, roughness: 0.92 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    trunks.castShadow = scale > 0.5;

    const layerGeos = isDeciduous
      ? [new THREE.DodecahedronGeometry(1.45, 1), new THREE.DodecahedronGeometry(1.25, 1), new THREE.DodecahedronGeometry(1.05, 1)]
      : [new THREE.ConeGeometry(2.05, 3.0, 8), new THREE.ConeGeometry(1.55, 2.7, 8), new THREE.ConeGeometry(1.05, 2.3, 8)];

    if (isDeciduous) {
      layerGeos[0].translate(0, 3.5, 0); layerGeos[1].translate(0.55, 4.2, 0.35); layerGeos[2].translate(-0.45, 4.5, -0.35);
    } else {
      layerGeos[0].translate(0, 3.1, 0); layerGeos[1].translate(0, 4.6, 0); layerGeos[2].translate(0, 5.9, 0);
    }

    const foliageMat = mat(THREE, 0xffffff, { map: foliageTex, roughness: 0.82, metalness: 0.02 });
    const layers = [
      new THREE.InstancedMesh(layerGeos[0], foliageMat, treeCount),
      new THREE.InstancedMesh(layerGeos[1], foliageMat, treeCount),
      new THREE.InstancedMesh(layerGeos[2], foliageMat, treeCount)
    ];
    for (let l = 0; l < layers.length; l += 1) layers[l].castShadow = scale > 0.5;

    const dummy = new THREE.Object3D(), tmpCol = new THREE.Color();
    let placed = 0, attempts = 0;
    while (placed < treeCount && attempts < treeCount * 5) {
      attempts += 1;
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (14 + rng() * 170);
      const z = -375 + rng() * 750;
      if (Math.abs(x) < 18 && Math.abs(z + 52) < 22) continue;
      if (Math.abs(x) < 17 && z > -6 && z < 36) continue;

      const s = 0.72 + rng() * 0.85, sy = s * (0.88 + rng() * 0.28);
      dummy.position.set(x, 0, z);
      dummy.rotation.set((rng() - 0.5) * 0.06, rng() * Math.PI * 2, (rng() - 0.5) * 0.06);
      dummy.scale.set(s, sy, s); dummy.updateMatrix();
      trunks.setMatrixAt(placed, dummy.matrix);

      for (let l = 0; l < layers.length; l += 1) {
        dummy.rotation.y += l * 0.85; dummy.updateMatrix();
        layers[l].setMatrixAt(placed, dummy.matrix);
        if (isDeciduous) {
          if (rng() > 0.86) tmpCol.setHSL(0.03 + rng() * 0.06, 0.72, 0.40 + rng() * 0.08);
          else tmpCol.setHSL(0.32 + (rng() - 0.5) * 0.08, 0.45 + rng() * 0.15, 0.25 + rng() * 0.10);
        } else {
          const baseHue = biome === 'subarctic-shield' ? 0.38 : 0.36;
          tmpCol.setHSL(baseHue + (rng() - 0.5) * 0.05, 0.42 + rng() * 0.14, 0.18 + rng() * 0.08);
        }
        layers[l].setColorAt(placed, tmpCol);
      }
      placed += 1;
    }
    trunks.count = placed; trunks.instanceMatrix.needsUpdate = true; scene.add(trunks);
    for (let l = 0; l < layers.length; l += 1) {
      layers[l].count = placed; layers[l].instanceMatrix.needsUpdate = true;
      if (layers[l].instanceColor) layers[l].instanceColor.needsUpdate = true;
      scene.add(layers[l]);
    }
  }

  // ─── Mountains ───────────────────────────────────────────────────────────

  function buildInstancedMountains(THREE, scene, count, xRange, zBase, maxHeight, snowCap, rng) {
    const mGeo = new THREE.ConeGeometry(16, 1, 7);
    mGeo.translate(0, 0.5, 0);
    const stoneTex = getStoneTexture(THREE);
    const rock = new THREE.InstancedMesh(mGeo, mat(THREE, 0x525b66, { map: stoneTex, roughness: 0.92 }), count);
    const snow = snowCap ? new THREE.InstancedMesh(mGeo, mat(THREE, 0xeef5fc, { roughness: 0.55 }), count) : null;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const x = -xRange + (i / Math.max(1, count - 1)) * xRange * 2 + (rng() - 0.5) * 14;
      const z = zBase - rng() * 60;
      const h = maxHeight * (0.55 + rng() * 0.55), w = 0.8 + rng() * 1.3;
      dummy.position.set(x, -1, z); dummy.rotation.y = rng() * Math.PI; dummy.scale.set(w, h, w);
      dummy.updateMatrix(); rock.setMatrixAt(i, dummy.matrix);
      if (snow) {
        dummy.position.set(x, h * 0.52 - 1, z); dummy.scale.set(w * 0.48, h * 0.5, w * 0.48);
        dummy.updateMatrix(); snow.setMatrixAt(i, dummy.matrix);
      }
    }
    rock.instanceMatrix.needsUpdate = true; scene.add(rock);
    if (snow) { snow.instanceMatrix.needsUpdate = true; scene.add(snow); }
  }

  // ─── Instanced City Skyline ───────────────────────────────────────────────

  function buildInstancedSkyline(THREE, scene, count, centerX, centerZ, spreadX, maxH, rng, state) {
    const bTex = getBuildingTextures(THREE);
    const concreteTex = getConcreteTexture(THREE);
    const bGeo = new THREE.BoxGeometry(1, 1, 1);
    bGeo.translate(0, 0.5, 0);
    const bMat = mat(THREE, 0xffffff, {
      map: bTex.map, emissiveMap: bTex.emissiveMap,
      emissive: 0xffd580, emissiveIntensity: 0.06, roughness: 0.34, metalness: 0.52
    });
    if (state) state.buildingMat = bMat;
    const buildings = new THREE.InstancedMesh(bGeo, bMat, count);
    const podiums = new THREE.InstancedMesh(bGeo, mat(THREE, 0x64748b, { map: concreteTex, roughness: 0.82 }), count);
    const parapets = new THREE.InstancedMesh(bGeo, mat(THREE, 0x475569, { roughness: 0.65, metalness: 0.3 }), count);
    const hvacs = new THREE.InstancedMesh(bGeo, mat(THREE, 0x94a3b8, { roughness: 0.5, metalness: 0.45 }), count);
    buildings.castShadow = true; buildings.receiveShadow = true;
    const dummy = new THREE.Object3D(), tmpCol = new THREE.Color();
    const palette = [0x94a3b8, 0x64748b, 0x7dd3fc, 0xa8a29e, 0x475569];
    for (let i = 0; i < count; i += 1) {
      const x = centerX + (rng() - 0.5) * spreadX, z = centerZ + (rng() - 0.5) * 42;
      const w = 4.2 + rng() * 5.8, d = 4.2 + rng() * 5.8, h = 11 + rng() * maxH;
      dummy.rotation.set(0, 0, 0); dummy.position.set(x, 0, z); dummy.scale.set(w, h, d); dummy.updateMatrix();
      buildings.setMatrixAt(i, dummy.matrix); tmpCol.setHex(palette[Math.floor(rng() * palette.length)]); buildings.setColorAt(i, tmpCol);
      dummy.position.set(x, 0, z); dummy.scale.set(w * 1.16, 2.8, d * 1.16); dummy.updateMatrix(); podiums.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, h, z); dummy.scale.set(w * 1.04, 0.55, d * 1.04); dummy.updateMatrix(); parapets.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x + (rng() - 0.5) * w * 0.2, h + 0.55, z + (rng() - 0.5) * d * 0.2); dummy.scale.set(w * 0.42, 1.4, d * 0.42); dummy.updateMatrix(); hvacs.setMatrixAt(i, dummy.matrix);
    }
    buildings.instanceMatrix.needsUpdate = true; if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
    podiums.instanceMatrix.needsUpdate = true; parapets.instanceMatrix.needsUpdate = true; hvacs.instanceMatrix.needsUpdate = true;
    scene.add(buildings); scene.add(podiums); scene.add(parapets); scene.add(hvacs);
  }

  // ─── Aurora Curtains ──────────────────────────────────────────────────────

  function buildAuroraCurtains(THREE, scene, auroraMeshes) {
    const colors = [0x22d3ee, 0x34d399, 0xa855f7];
    for (let i = 0; i < 3; i += 1) {
      const geo = new THREE.PlaneGeometry(160, 26, 20, 4);
      const m = new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false });
      const ribbon = new THREE.Mesh(geo, m);
      ribbon.position.set(-20 + i * 25, 62 + i * 7, -110 - i * 18);
      ribbon.rotation.x = 0.35; ribbon.rotation.y = (i - 1) * 0.22;
      scene.add(ribbon); auroraMeshes.push(ribbon);
    }
  }

  // ─── Roadside Structures (chalets, cabins, rest stops, grain elevators, lighthouses) ──

  function buildRoadsideStructures(THREE, scene, province, scale, rng) {
    const biome = province.biome;
    const stoneTex = getStoneTexture(THREE);
    const woodTex = getWoodTexture(THREE);
    const concreteTex = getConcreteTexture(THREE);

    // 1. Alpine Chalets / Canadian Cabins along the 760m drive (outside city stretch)
    const chaletPositions = [
      { x: -18, z: -280 }, { x: 20, z: -260 }, { x: -22, z: -210 },
      { x: 18, z: -180 }, { x: -20, z: 120 }, { x: 22, z: 155 },
      { x: -18, z: 200 }, { x: 20, z: 250 }, { x: -24, z: 310 },
      { x: 22, z: 340 }
    ];
    for (let i = 0; i < chaletPositions.length; i += 1) {
      const cp = chaletPositions[i];
      const h = 4.5 + rng() * 2.5, w = 7 + rng() * 4;
      // Cabin body
      addBox(THREE, scene, w, h, 7, 0x78350f, cp.x, h * 0.5, cp.z, { map: woodTex, castShadow: true });
      // A-frame peaked roof
      addBox(THREE, scene, w + 1.2, 0.3, 8, 0x374151, cp.x, h + 1.5, cp.z, { ry: 0, castShadow: true });
      addCone(THREE, scene, (w + 1.2) * 0.6, 3.2, 4, 0x374151, cp.x, h + 3.1, cp.z, { castShadow: true });
      // Chimney
      addBox(THREE, scene, 0.8, 2.5, 0.8, 0x64748b, cp.x + w * 0.3, h + 2.5, cp.z - 1.5, { map: stoneTex });
      // Snow drift on roof (winter)
      if (biome === 'rockies-foothills' || biome === 'klondike-glacier' || biome === 'arctic-tundra') {
        addBox(THREE, scene, w + 0.4, 0.5, 7.4, 0xf8fafc, cp.x, h + 1.6, cp.z, { roughness: 0.5 });
      }
    }

    // 2. Rest stop / gas station (z = 90 and z = -155)
    const restStops = [{ x: -26, z: 90 }, { x: 26, z: -155 }];
    for (let i = 0; i < restStops.length; i += 1) {
      const rs = restStops[i];
      // Canopy
      addBox(THREE, scene, 18, 0.4, 10, 0x334155, rs.x, 5.2, rs.z, { map: concreteTex, castShadow: true });
      addCyl(THREE, scene, 0.2, 0.25, 5.2, 6, 0x475569, rs.x - 7, 2.6, rs.z - 3, {});
      addCyl(THREE, scene, 0.2, 0.25, 5.2, 6, 0x475569, rs.x + 7, 2.6, rs.z - 3, {});
      // Building
      addBox(THREE, scene, 8, 4, 10, 0xe2e8f0, rs.x, 2, rs.z + 8, { map: concreteTex, castShadow: true });
      addBox(THREE, scene, 8.4, 0.3, 10.4, 0x334155, rs.x, 4.2, rs.z + 8, {});
      // Red/white maple-leaf logo sign
      addBox(THREE, scene, 3.2, 1.2, 0.2, 0xc8102e, rs.x, 5.8, rs.z + 2.8, { emissive: 0xc8102e, emissiveIntensity: 0.3 });
    }

    // 3. Prairie grain elevators (Saskatchewan/Manitoba/Alberta)
    if (biome === 'living-skies-wheat' || biome === 'prairie-lake' || biome === 'rockies-foothills') {
      const elevatorZ = [-335, -295, 265, 310];
      const elevatorSides = [-1, 1, -1, 1];
      for (let i = 0; i < elevatorZ.length; i += 1) {
        const ex = elevatorSides[i] * 24;
        const ez = elevatorZ[i];
        // Main shaft
        addBox(THREE, scene, 7, 22, 7, 0xb91c1c, ex, 11, ez, { map: woodTex, castShadow: true });
        addCone(THREE, scene, 5, 4.5, 4, 0x7f1d1d, ex, 24.25, ez, {});
        // Annex
        addBox(THREE, scene, 5, 15, 5, 0x92400e, ex + 7, 7.5, ez, { map: woodTex });
        addCone(THREE, scene, 3.5, 3.5, 4, 0x78350f, ex + 7, 17, ez, {});
        // "POOL" or "PIONEER" text panel (simple sign)
        addBox(THREE, scene, 0.1, 2.2, 5.5, 0xffffff, ex - 3.5, 15, ez, { emissive: 0xffffff, emissiveIntensity: 0.1 });
      }
    }

    // 4. Lighthouse silhouette (coastal biomes)
    if (biome === 'granite-lighthouse' || biome === 'atlantic-iceberg' || biome === 'fundy-coast') {
      const lhPositions = [{ x: -60, z: -310 }, { x: 55, z: 280 }];
      for (let i = 0; i < lhPositions.length; i += 1) {
        const lh = lhPositions[i];
        addCyl(THREE, scene, 2.4, 3.8, 18, 10, 0xf8fafc, lh.x, 9, lh.z, { map: concreteTex, castShadow: true });
        addCyl(THREE, scene, 2.6, 2.6, 2.8, 10, 0xef4444, lh.x, 19.4, lh.z, { metalness: 0.35 });
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 10), mat(THREE, 0xfef08a, { emissive: 0xfde047, emissiveIntensity: 2.0 }));
        lamp.position.set(lh.x, 21.5, lh.z);
        scene.add(lamp);
      }
    }

    // 5. Distant mountain ridges framing the horizon on both sides
    // These are large low-poly silhouette ridges far off the road
    const ridgeGeo = new THREE.BoxGeometry(1, 1, 1);
    ridgeGeo.translate(0, 0.5, 0);
    const ridgeMat = mat(THREE, 0x334155, { roughness: 0.98, metalness: 0 });
    const ridgeCount = 28;
    const ridges = new THREE.InstancedMesh(ridgeGeo, ridgeMat, ridgeCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < ridgeCount; i += 1) {
      const side = i % 2 === 0 ? 1 : -1;
      const rx = side * (160 + rng() * 60);
      const rz = -360 + (i / (ridgeCount - 1)) * 720;
      const rh = 30 + rng() * 50, rw = 40 + rng() * 60;
      dummy.position.set(rx, 0, rz); dummy.rotation.set(0, rng() * 0.3, 0); dummy.scale.set(rw, rh, 25 + rng() * 30);
      dummy.updateMatrix(); ridges.setMatrixAt(i, dummy.matrix);
    }
    ridges.instanceMatrix.needsUpdate = true;
    scene.add(ridges);

    // Snow caps on ridges (for mountainous provinces)
    if (biome === 'rockies-foothills' || biome === 'klondike-glacier' || biome === 'arctic-tundra') {
      const capCount = 14;
      const caps = new THREE.InstancedMesh(ridgeGeo, mat(THREE, 0xeef5fc, { roughness: 0.5 }), capCount);
      for (let i = 0; i < capCount; i += 1) {
        const side = i % 2 === 0 ? 1 : -1;
        const rx = side * (165 + rng() * 55);
        const rz = -340 + (i / (capCount - 1)) * 680;
        const rh = 20 + rng() * 25, rw = 20 + rng() * 30;
        const baseH = 30 + rng() * 50;
        dummy.position.set(rx, baseH * 0.6, rz); dummy.rotation.set(0, 0, 0); dummy.scale.set(rw, rh, 12 + rng() * 18);
        dummy.updateMatrix(); caps.setMatrixAt(i, dummy.matrix);
      }
      caps.instanceMatrix.needsUpdate = true;
      scene.add(caps);
    }
  }

  // ─── Richer City Block (z -95 to +45, 28-40 varied buildings) ─────────────

  function buildStartingCityBlock(THREE, scene, province, scale, rng, state) {
    const concreteTex = getConcreteTexture(THREE);
    const stoneTex = getStoneTexture(THREE);
    const woodTex = getWoodTexture(THREE);
    const bTex = getBuildingTextures(THREE);

    // 1. Main downtown skyline cluster (left side)
    buildInstancedSkyline(THREE, scene, Math.round(18 * scale), -32, -55, 44, 28, rng, state);
    // Right side skyline
    buildInstancedSkyline(THREE, scene, Math.round(14 * scale), 32, -55, 38, 22, rng, null);

    // 2. Mid-rise commercial strip — left of road z: -90 to -20
    const commercialLeft = [
      { w: 10, h: 8, d: 7, x: -18, z: -85, color: 0x94a3b8 },
      { w: 8, h: 12, d: 7, x: -18, z: -72, color: 0x64748b },
      { w: 11, h: 6, d: 8, x: -19, z: -60, color: 0xa8a29e },
      { w: 9, h: 9, d: 7, x: -19, z: -47, color: 0x7dd3fc },
      { w: 8, h: 7, d: 8, x: -18, z: -34, color: 0x94a3b8 },
      { w: 10, h: 5, d: 7, x: -19, z: -22, color: 0x64748b }
    ];
    for (let i = 0; i < commercialLeft.length; i += 1) {
      const b = commercialLeft[i];
      addBox(THREE, scene, b.w, b.h, b.d, b.color, b.x, b.h * 0.5, b.z, { map: bTex.map, roughness: 0.42, metalness: 0.35, castShadow: true });
      // Podium
      addBox(THREE, scene, b.w + 1.2, 1.5, b.d + 1.2, 0x334155, b.x, 0.75, b.z, { map: concreteTex });
      // Rooftop parapet
      addBox(THREE, scene, b.w + 0.4, 0.5, b.d + 0.4, 0x475569, b.x, b.h + 0.25, b.z, { roughness: 0.65 });
    }

    // 3. Mid-rise strip — right side z: -90 to -20
    const commercialRight = [
      { w: 9, h: 10, d: 7, x: 19, z: -88, color: 0x475569 },
      { w: 11, h: 7, d: 8, x: 19, z: -76, color: 0x64748b },
      { w: 8, h: 14, d: 7, x: 18, z: -63, color: 0x94a3b8 },
      { w: 10, h: 6, d: 8, x: 19, z: -50, color: 0x7dd3fc },
      { w: 9, h: 8, d: 7, x: 19, z: -38, color: 0x475569 },
      { w: 11, h: 5, d: 7, x: 19, z: -25, color: 0xa8a29e }
    ];
    for (let i = 0; i < commercialRight.length; i += 1) {
      const b = commercialRight[i];
      addBox(THREE, scene, b.w, b.h, b.d, b.color, b.x, b.h * 0.5, b.z, { map: bTex.map, roughness: 0.42, metalness: 0.35, castShadow: true });
      addBox(THREE, scene, b.w + 1.2, 1.5, b.d + 1.2, 0x334155, b.x, 0.75, b.z, { map: concreteTex });
      addBox(THREE, scene, b.w + 0.4, 0.5, b.d + 0.4, 0x475569, b.x, b.h + 0.25, b.z, { roughness: 0.65 });
    }

    // 4. Street-level storefronts (small shopfronts z: -15 to +45)
    const storefronts = [
      { x: -16, z: -12, color: 0xfef3c7, h: 4 },
      { x: 16, z: -8, color: 0xdbeafe, h: 4.5 },
      { x: -16, z: 5, color: 0xfce7f3, h: 3.8 },
      { x: 16, z: 10, color: 0xecfdf5, h: 4.2 },
      { x: -16, z: 20, color: 0xfef3c7, h: 4 },
      { x: 16, z: 30, color: 0xdbeafe, h: 3.8 },
      { x: -16, z: 38, color: 0xecfdf5, h: 4.5 },
      { x: 16, z: 44, color: 0xfce7f3, h: 4 }
    ];
    for (let i = 0; i < storefronts.length; i += 1) {
      const sf = storefronts[i];
      addBox(THREE, scene, 7, sf.h, 6, sf.color, sf.x, sf.h * 0.5, sf.z, { map: concreteTex, roughness: 0.65, castShadow: true });
      // Awning
      addBox(THREE, scene, 7.4, 0.3, 2.5, 0xc8102e, sf.x, sf.h + 0.15, sf.z - 1.5, { roughness: 0.5 });
      // Flat roof
      addBox(THREE, scene, 7.6, 0.3, 6.6, 0x64748b, sf.x, sf.h + 0.3, sf.z, {});
    }

    // 5. Canadian Heritage/Cultural buildings (heritage stone look)
    // Post office / Town Hall
    addBox(THREE, scene, 20, 10, 12, 0xd6d3d1, -38, 5, 30, { map: stoneTex, roughness: 0.88, castShadow: true });
    addBox(THREE, scene, 20.5, 2.5, 12.5, 0xd6d3d1, -38, 11.25, 30, { map: stoneTex, roughness: 0.88 });
    addCyl(THREE, scene, 2.0, 2.0, 7, 12, 0xd6d3d1, -38, 14.5, 25, { map: stoneTex, castShadow: true });
    addCone(THREE, scene, 2.4, 4.5, 4, 0x2dd4bf, -38, 20, 25, { metalness: 0.35, roughness: 0.45 });
    // Library / Museum
    addBox(THREE, scene, 16, 7, 10, 0xc7c0b8, 36, 3.5, 36, { map: stoneTex, roughness: 0.88, castShadow: true });
    addBox(THREE, scene, 16.4, 1.2, 10.4, 0xd6d3d1, 36, 7.6, 36, { map: stoneTex });
    // Corner Bank building
    addBox(THREE, scene, 12, 14, 10, 0x78716c, -38, 7, -15, { map: stoneTex, castShadow: true });
    addBox(THREE, scene, 12.4, 1.5, 10.4, 0x57534e, -38, 14.75, -15, { map: stoneTex });

    // 6. Parking lot / pavement pad near functional buildings
    addBox(THREE, scene, 22, 0.08, 36, 0x1e293b, 0, 0.04, 14, { roughness: 0.92 });

    // 7. Pedestrian sidewalks
    const concMat = mat(THREE, 0xcbd5e1, { map: concreteTex, roughness: 0.88 });
    const sidewalkGeoL = new THREE.BoxGeometry(3.5, 0.12, 760);
    const sidewalkGeoR = new THREE.BoxGeometry(3.5, 0.12, 760);
    const swL = new THREE.Mesh(sidewalkGeoL, concMat);
    swL.position.set(-8.2, 0.06, 0); swL.receiveShadow = true; scene.add(swL);
    const swR = new THREE.Mesh(sidewalkGeoR, concMat);
    swR.position.set(8.2, 0.06, 0); swR.receiveShadow = true; scene.add(swR);
  }

  // ─── Province Landmarks ───────────────────────────────────────────────────

  function buildProvinceLandmarks(THREE, scene, province, scale, rng, state) {
    const id = province.id;
    const concreteTex = getConcreteTexture(THREE);
    const stoneTex = getStoneTexture(THREE);
    const woodTex = getWoodTexture(THREE);
    const waterBump = getWaterBumpTexture(THREE);

    // Helper to get landmark coords (falls back to defaults)
    function lmCoords(idx, defX, defY, defZ) {
      const lm = province.landmarks && province.landmarks[idx];
      if (lm && lm.coords) return lm.coords;
      return [defX, defY, defZ];
    }

    if (id === 'ontario') {
      // ── CN Tower at landmark 0 coords ──
      const cnC = lmCoords(0, 0, 0, -55);
      const cn = new THREE.Group();
      cn.position.set(cnC[0], 0, cnC[2]);
      addCyl(THREE, cn, 2.2, 5.4, 46, 14, 0xdbe4ee, 0, 23, 0, { map: concreteTex, roughness: 0.75, castShadow: true });
      for (let r = 0; r < 3; r += 1) {
        const ang = (r / 3) * Math.PI * 2;
        addBox(THREE, cn, 1.3, 42, 1.8, 0xcbd5e1, Math.sin(ang) * 3.1, 21, Math.cos(ang) * 3.1, { ry: ang, map: concreteTex });
      }
      addCyl(THREE, cn, 6.4, 5.4, 4.4, 24, 0xe2e8f0, 0, 46, 0, { map: concreteTex, metalness: 0.25, castShadow: true });
      addCyl(THREE, cn, 6.0, 6.0, 1.6, 24, 0x38bdf8, 0, 46.2, 0, { roughness: 0.15, metalness: 0.7, emissive: 0x0ea5e9, emissiveIntensity: 0.45 });
      addCyl(THREE, cn, 2.5, 2.8, 2.4, 16, 0x94a3b8, 0, 54.5, 0, { metalness: 0.5 });
      addCyl(THREE, cn, 0.35, 1.6, 18, 10, 0xf1f5f9, 0, 58, 0, { metalness: 0.65, roughness: 0.3 });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 10), mat(THREE, 0xff2244, { emissive: 0xff2244, emissiveIntensity: 1.6 }));
      beacon.position.set(0, 67.5, 0); cn.add(beacon); state.beaconMeshes.push(beacon); scene.add(cn);

      // Rogers-style Dome
      const domeC = lmCoords(1, -42, 0, -42);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(12, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(THREE, 0xdbeafe, { map: concreteTex, roughness: 0.38, metalness: 0.32 }));
      dome.position.set(domeC[0], 0, domeC[2]); scene.add(dome);
      addCyl(THREE, scene, 12.6, 13.2, 3.6, 24, 0x334155, domeC[0], 1.8, domeC[2], { map: concreteTex, metalness: 0.35 });

      // Niagara Falls at landmark 2 coords
      const niaC = lmCoords(2, 78, 0, 52);
      addBox(THREE, scene, 28, 12, 16, 0x475569, niaC[0], 6, niaC[2] - 8, { map: stoneTex, roughness: 0.9 });
      const falls = addBox(THREE, scene, 21, 12.2, 2.6, 0x7dd3fc, niaC[0], 6, niaC[2], {
        bumpMap: waterBump, bumpScale: 0.25, roughness: 0.2, emissive: 0x0284c7, emissiveIntensity: 0.3, transparent: true, opacity: 0.84
      });
      const mistCount = Math.round(90 * scale);
      const mistPos = new Float32Array(mistCount * 3), mistBase = new Float32Array(mistCount * 3);
      for (let i = 0; i < mistCount; i += 1) {
        const mx = niaC[0] + (rng() - 0.5) * 22, my = 0.5 + rng() * 6.5, mz = niaC[2] + rng() * 5.5;
        mistPos[i * 3] = mx; mistPos[i * 3 + 1] = my; mistPos[i * 3 + 2] = mz;
        mistBase[i * 3] = mx; mistBase[i * 3 + 1] = my; mistBase[i * 3 + 2] = mz;
      }
      const mistGeo = new THREE.BufferGeometry();
      mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
      const mistMat = new THREE.PointsMaterial({ size: 4.8, map: getMistSpriteTexture(THREE), transparent: true, opacity: 0.58, depthWrite: false });
      const mistPoints = new THREE.Points(mistGeo, mistMat); scene.add(mistPoints);
      state.animators.push(function (t) {
        falls.material.opacity = 0.74 + Math.sin(t * 4.5) * 0.1;
        const arr = mistGeo.attributes.position.array;
        for (let i = 0; i < mistCount; i += 1) {
          const i3 = i * 3;
          arr[i3] = mistBase[i3] + Math.sin(t * 0.9 + i) * 0.8;
          arr[i3 + 1] = ((mistBase[i3 + 1] + t * 2.1) % 7.2) + 0.4;
        }
        mistGeo.attributes.position.needsUpdate = true;
      });

      buildInstancedSkyline(THREE, scene, Math.round(28 * scale), cnC[0] - 24, cnC[2] - 12, 75, 26, rng, state);

    } else if (id === 'quebec') {
      // Château Frontenac at landmark 0
      const cfC = lmCoords(0, 0, 10, -58);
      addBox(THREE, scene, 44, 10, 26, 0x57534e, cfC[0], 5, cfC[2], { map: stoneTex, roughness: 0.92 });
      const ch = new THREE.Group(); ch.position.set(cfC[0], 10, cfC[2]);
      addBox(THREE, ch, 22, 14, 14, 0x9a3412, 0, 7, 0, { map: stoneTex, castShadow: true });
      addBox(THREE, ch, 9, 22, 9, 0xb45309, 0, 11, 0, { map: stoneTex, castShadow: true });
      addCone(THREE, ch, 6.2, 11, 8, 0x2dd4bf, 0, 27.5, 0, { metalness: 0.35, roughness: 0.45 });
      addCyl(THREE, ch, 3.2, 3.2, 16, 10, 0x9a3412, -11, 8, 5, { map: stoneTex });
      addCone(THREE, ch, 3.6, 8, 8, 0x2dd4bf, -11, 20, 5, { metalness: 0.35, roughness: 0.45 });
      addCyl(THREE, ch, 3.2, 3.2, 16, 10, 0x9a3412, 11, 8, 5, { map: stoneTex });
      addCone(THREE, ch, 3.6, 8, 8, 0x2dd4bf, 11, 20, 5, { metalness: 0.35, roughness: 0.45 });
      scene.add(ch);

      // Montreal Inclined Tower at landmark 1
      const mtlC = lmCoords(1, -72, 0, 44);
      addBox(THREE, scene, 4.5, 34, 4.5, 0xe2e8f0, mtlC[0], 15, mtlC[2], { map: concreteTex, rz: -0.45, castShadow: true });
      addCyl(THREE, scene, 12, 14, 4, 20, 0x475569, mtlC[0] + 10, 2, mtlC[2], { map: concreteTex });
      buildInstancedSkyline(THREE, scene, Math.round(22 * scale), cfC[0] + 54, cfC[2] - 46, 55, 18, rng, state);

    } else if (id === 'british-columbia') {
      // Canada Place Sails at landmark 0
      const cpC = lmCoords(0, -18, 0, -48);
      addBox(THREE, scene, 26, 3, 12, 0x334155, cpC[0], 1.5, cpC[2], { map: concreteTex });
      for (let i = 0; i < 5; i += 1) addCone(THREE, scene, 2.8, 11, 4, 0xf8fafc, cpC[0] - 10 + i * 4.2, 8.5, cpC[2], { roughness: 0.45, castShadow: true });

      // Lions Gate Bridge at landmark 1
      const lgC = lmCoords(1, 62, 0, -18);
      addBox(THREE, scene, 56, 1.8, 5, 0x10b981, lgC[0], 11, lgC[2], { metalness: 0.55, roughness: 0.35 });
      addBox(THREE, scene, 2, 24, 5, 0x059669, lgC[0] - 18, 12, lgC[2], { metalness: 0.6 });
      addBox(THREE, scene, 2, 24, 5, 0x059669, lgC[0] + 18, 12, lgC[2], { metalness: 0.6 });
      addBox(THREE, scene, 20, 0.25, 0.25, 0x34d399, lgC[0] - 28, 18, lgC[2], { rz: 0.48, metalness: 0.7 });
      addBox(THREE, scene, 20, 0.25, 0.25, 0x34d399, lgC[0] + 28, 18, lgC[2], { rz: -0.48, metalness: 0.7 });

      // BC Rockies / Coast Mountains at landmark 2
      const bcRockC = lmCoords(2, 0, 0, -200);
      buildInstancedMountains(THREE, scene, Math.round(28 * scale), 170, bcRockC[2], 60, true, rng);
      buildInstancedSkyline(THREE, scene, Math.round(20 * scale), cpC[0] - 18, cpC[2] - 20, 50, 22, rng, state);

    } else if (id === 'alberta') {
      // ── Calgary Tower at landmark 0 coords ──
      const calC = lmCoords(0, 0, 0, -65);
      addCyl(THREE, scene, 2.0, 2.9, 36, 14, 0xdbeafe, calC[0], 18, calC[2], { map: concreteTex, castShadow: true });
      addCyl(THREE, scene, 4.6, 3.8, 3.2, 18, 0xf59e0b, calC[0], 36, calC[2], { metalness: 0.45, roughness: 0.25, emissive: 0xd97706, emissiveIntensity: 0.35 });
      addCyl(THREE, scene, 0.3, 0.8, 9, 8, 0xffffff, calC[0], 42, calC[2], { metalness: 0.7 });

      // Calgary skyline
      buildInstancedSkyline(THREE, scene, Math.round(22 * scale), calC[0], calC[2] - 14, 56, 26, rng, state);

      // ── Banff Springs Hotel chateau silhouette at landmark 1 coords ──
      const banffC = lmCoords(1, 0, 0, -215);
      const banff = new THREE.Group(); banff.position.set(banffC[0], 0, banffC[2]);
      // Massive stone base
      addBox(THREE, banff, 50, 12, 28, 0x57534e, 0, 6, 0, { map: stoneTex, roughness: 0.92, castShadow: true });
      // Central keep
      addBox(THREE, banff, 18, 24, 18, 0x9a3412, 0, 18, 0, { map: stoneTex, castShadow: true });
      addCone(THREE, banff, 10, 14, 8, 0x2dd4bf, 0, 37, 0, { metalness: 0.35, roughness: 0.45 });
      // Corner towers
      for (let tx = -1; tx <= 1; tx += 2) {
        for (let tz = -1; tz <= 1; tz += 2) {
          addCyl(THREE, banff, 3.2, 3.5, 20, 10, 0x9a3412, tx * 22, 10, tz * 11, { map: stoneTex, castShadow: true });
          addCone(THREE, banff, 3.8, 9, 8, 0x2dd4bf, tx * 22, 24, tz * 11, { metalness: 0.35 });
        }
      }
      // Stone walls connecting towers
      addBox(THREE, banff, 50, 8, 2.5, 0x78716c, 0, 4, -13, { map: stoneTex });
      addBox(THREE, banff, 50, 8, 2.5, 0x78716c, 0, 4, 13, { map: stoneTex });
      scene.add(banff);

      // ── Towering Rockies peaks behind Banff ──
      buildInstancedMountains(THREE, scene, Math.round(32 * scale), 190, banffC[2] - 20, 80, true, rng);

      // ── Turquoise Lake Louise basin at landmark 2 coords ──
      const louiseC = lmCoords(2, 68, 0, -68);
      const louise = new THREE.Mesh(
        new THREE.CircleGeometry(22, 32),
        mat(THREE, 0x14b8a6, { roughness: 0.12, metalness: 0.4, bumpMap: waterBump, bumpScale: 0.14, emissive: 0x0d9488, emissiveIntensity: 0.2 })
      );
      louise.rotation.x = -Math.PI / 2;
      louise.position.set(louiseC[0], 0.12, louiseC[2]); scene.add(louise);
      // Snow-covered mountains behind Lake Louise
      buildInstancedMountains(THREE, scene, Math.round(18 * scale), 120, louiseC[2] - 30, 72, true, rng);

      // Alberta Badlands Hoodoos (use 3rd landmark or default z=165)
      const badC = lmCoords(2, 70, 0, 165);
      for (let i = 0; i < 7; i += 1) {
        const hx = badC[0] - 24 + i * 7, hz = badC[2] + (rng() - 0.5) * 20;
        const hh = 10 + rng() * 8;
        addCyl(THREE, scene, 1.4 + rng() * 0.8, 2.6 + rng() * 1.0, hh, 7, 0xb45309, hx, hh * 0.5, hz, { map: stoneTex, castShadow: true });
        addBox(THREE, scene, 3.5 + rng() * 2, 2.0, 3.5 + rng() * 2, 0x92400e, hx, hh + 1.0, hz, { map: stoneTex });
      }

    } else if (id === 'national-capital') {
      // Parliament Hill at landmark 0
      const parlC = lmCoords(0, 0, 0, -56);
      addBox(THREE, scene, 36, 11, 14, 0xd6d3d1, parlC[0], 5.5, parlC[2], { map: stoneTex, roughness: 0.85, castShadow: true });
      addBox(THREE, scene, 37, 2.5, 15, 0x2dd4bf, parlC[0], 12.2, parlC[2], { metalness: 0.35, roughness: 0.45 });
      addBox(THREE, scene, 6.2, 32, 6.2, 0xe7e5e4, parlC[0], 16, parlC[2] + 6, { map: stoneTex, roughness: 0.85, castShadow: true });
      addCone(THREE, scene, 4.4, 9, 4, 0x2dd4bf, parlC[0], 36.5, parlC[2] + 6, { metalness: 0.35, roughness: 0.45 });
      addBox(THREE, scene, 2.6, 2.6, 0.4, 0xfef08a, parlC[0], 26, parlC[2] + 9.8, { emissive: 0xfacc15, emissiveIntensity: 0.7 });

      // Rideau Canal at landmark 1
      const rcC = lmCoords(1, 46, 0, -16);
      addBox(THREE, scene, 12, 0.18, 120, 0x1e6b8a, rcC[0], 0.1, rcC[2], { bumpMap: waterBump, roughness: 0.14, metalness: 0.42 });

      // Alexandra Bridge at landmark 2
      const abC = lmCoords(2, -58, 0, -44);
      addBox(THREE, scene, 42, 1.5, 4.5, 0x64748b, abC[0], 8, abC[2], { metalness: 0.6, roughness: 0.4 });
      addBox(THREE, scene, 42, 2.4, 0.35, 0x475569, abC[0], 9.8, abC[2] + 2, { metalness: 0.65 });
      addBox(THREE, scene, 1.5, 9, 4.5, 0x475569, abC[0] - 12, 4.5, abC[2], { map: stoneTex });
      addBox(THREE, scene, 1.5, 9, 4.5, 0x475569, abC[0] + 12, 4.5, abC[2], { map: stoneTex });

    } else if (id === 'nova-scotia') {
      // Peggy's Cove Lighthouse at landmark 0
      const pcC = lmCoords(0, 0, 4, -52);
      addCyl(THREE, scene, 9, 13, 4.5, 9, 0x64748b, pcC[0], 2.25, pcC[2], { map: stoneTex, roughness: 0.92 });
      addCyl(THREE, scene, 2.2, 3.6, 16, 10, 0xf8fafc, pcC[0], 12, pcC[2], { map: concreteTex, castShadow: true });
      addCyl(THREE, scene, 2.4, 2.4, 3.2, 10, 0xef4444, pcC[0], 21.6, pcC[2], { metalness: 0.35 });
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), mat(THREE, 0xfef08a, { emissive: 0xfde047, emissiveIntensity: 1.8 }));
      lamp.position.set(pcC[0], 23.8, pcC[2]); scene.add(lamp); state.beaconMeshes.push(lamp);
      const bCount = Math.round(65 * scale);
      const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(2.4, 0), mat(THREE, 0x6b7280, { map: stoneTex, roughness: 0.9 }), bCount);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < bCount; i += 1) {
        dummy.position.set(pcC[0] - 70 + rng() * 140, 0.6, pcC[2] - 20 + rng() * 60);
        dummy.scale.set(0.8 + rng() * 1.8, 0.5 + rng() * 0.9, 0.8 + rng() * 1.6);
        dummy.rotation.set(rng(), rng(), rng()); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
      }
      rocks.instanceMatrix.needsUpdate = true; scene.add(rocks);
      // Halifax Citadel at landmark 1
      const hfxC = lmCoords(1, 0, 0, 80);
      addBox(THREE, scene, 32, 8, 20, 0x78716c, hfxC[0], 4, hfxC[2], { map: stoneTex, castShadow: true });
      addBox(THREE, scene, 34, 1.5, 22, 0x57534e, hfxC[0], 8.75, hfxC[2], { map: stoneTex });
      addCyl(THREE, scene, 3.5, 4.0, 10, 8, 0x57534e, hfxC[0] - 14, 5, hfxC[2] - 8, { map: stoneTex });
      addCyl(THREE, scene, 3.5, 4.0, 10, 8, 0x57534e, hfxC[0] + 14, 5, hfxC[2] - 8, { map: stoneTex });

    } else if (id === 'newfoundland') {
      // Signal Hill / Cabot Tower at landmark 0
      const shC = lmCoords(0, 0, 12, -56);
      addCyl(THREE, scene, 14, 22, 12, 10, 0x4b5563, shC[0], 6, shC[2], { map: stoneTex, roughness: 0.92 });
      addBox(THREE, scene, 8, 12, 8, 0x9a3412, shC[0], 18, shC[2], { map: stoneTex, castShadow: true });
      addBox(THREE, scene, 4.5, 6, 4.5, 0x7c2d12, shC[0], 27, shC[2], { map: stoneTex });
      // Jellybean Row at landmark 1
      const jbC = lmCoords(1, -52, 0, -18);
      const jelly = [0xef4444, 0xfacc15, 0x3b82f6, 0x10b981, 0xf97316, 0xa855f7];
      for (let i = 0; i < 6; i += 1) {
        const h = 7.5 + (i % 2) * 1.5;
        addBox(THREE, scene, 5.2, h, 6, jelly[i], jbC[0] + i * 5.6, h * 0.5, jbC[2], { map: woodTex, castShadow: true });
        addCone(THREE, scene, 4.0, 2.6, 4, 0x334155, jbC[0] + i * 5.6, h + 1.3, jbC[2]);
      }
      // Atlantic Icebergs at landmark 2
      const iceC = lmCoords(2, 66, 0, -48);
      const bergs = [];
      for (let i = 0; i < 4; i += 1) {
        const b = addBox(THREE, scene, 12 + i * 2, 8 + (i % 2) * 4, 10, 0xe0f2fe, iceC[0] + i * 18, 3.5, iceC[2] - i * 14, { roughness: 0.25, metalness: 0.15 });
        bergs.push(b);
      }
      state.animators.push(function (t) {
        for (let i = 0; i < bergs.length; i += 1) bergs[i].position.y = 3.2 + Math.sin(t * 0.9 + i) * 0.35;
      });

    } else if (id === 'new-brunswick') {
      // Hopewell Rocks at landmark 0
      const hwC = lmCoords(0, 0, 0, -52);
      const stacks = [[hwC[0] - 14, hwC[2]], [hwC[0], hwC[2] - 2], [hwC[0] + 14, hwC[2] + 2], [hwC[0] + 26, hwC[2] - 6]];
      for (let i = 0; i < stacks.length; i += 1) {
        addCyl(THREE, scene, 3.6, 2.2, 13, 9, 0xb45309, stacks[i][0], 6.5, stacks[i][1], { map: stoneTex, castShadow: true });
        addCone(THREE, scene, 3.2, 5.5, 7, 0x15803d, stacks[i][0], 15.5, stacks[i][1]);
      }
      // Fundy Tidal Range sea wall at landmark 1
      const funC = lmCoords(1, -56, 0, -34);
      addBox(THREE, scene, 26, 16, 18, 0x9a3412, funC[0], 8, funC[2], { map: stoneTex });
      // Confederation-era bridge at landmark 2
      const nbBrC = lmCoords(2, 64, 0, 28);
      addBox(THREE, scene, 40, 1.8, 5, 0x64748b, nbBrC[0], 10, nbBrC[2], { metalness: 0.5 });
      addCyl(THREE, scene, 1.5, 1.5, 12, 8, 0x475569, nbBrC[0] - 16, 6, nbBrC[2], { map: concreteTex });
      addCyl(THREE, scene, 1.5, 1.5, 12, 8, 0x475569, nbBrC[0] + 16, 6, nbBrC[2], { map: concreteTex });

    } else if (id === 'prince-edward-island') {
      // Confederation Bridge at landmark 0
      const confC = lmCoords(0, 20, 0, -58);
      for (let i = 0; i < 9; i += 1) {
        const bx = confC[0] - 20 + i * 11, bz = confC[2] - Math.sin(i * 0.35) * 10;
        addBox(THREE, scene, 12, 1.6, 4.5, 0xe2e8f0, bx, 10, bz, { map: concreteTex, ry: Math.cos(i * 0.35) * 0.15 });
        addCyl(THREE, scene, 1.1, 1.6, 10, 8, 0xcbd5e1, bx, 5, bz, { map: concreteTex });
      }
      // Green Gables farmhouse at landmark 1
      const ggC = lmCoords(1, -52, 0, 22);
      addBox(THREE, scene, 12, 6, 9, 0xf8fafc, ggC[0], 3, ggC[2], { map: woodTex, castShadow: true });
      addCone(THREE, scene, 8.5, 5, 4, 0x15803d, ggC[0], 8.5, ggC[2]);
      // Red PEI cliffs at landmark 2
      const peiC = lmCoords(2, -64, 0, -32);
      addBox(THREE, scene, 22, 6, 14, 0xb91c1c, peiC[0], 3, peiC[2], { map: stoneTex });
      addCyl(THREE, scene, 1.8, 2.6, 12, 12, 0xf8fafc, peiC[0], 12, peiC[2], { map: concreteTex });
      addCyl(THREE, scene, 2.0, 2.0, 2.2, 12, 0xef4444, peiC[0], 19, peiC[2]);

    } else if (id === 'manitoba') {
      // CMHR at landmark 0
      const cmhrC = lmCoords(0, 0, 0, -54);
      addBox(THREE, scene, 22, 10, 14, 0x94a3b8, cmhrC[0], 5, cmhrC[2], { map: stoneTex, castShadow: true });
      addCone(THREE, scene, 5, 28, 8, 0x38bdf8, cmhrC[0], 19, cmhrC[2], { roughness: 0.15, metalness: 0.7, transparent: true, opacity: 0.82, emissive: 0x0284c7, emissiveIntensity: 0.25 });
      // Winnipeg river at landmark 1
      const wpgC = lmCoords(1, 36, 0, -24);
      addBox(THREE, scene, 14, 0.16, 80, 0x1d5f82, wpgC[0], 0.1, wpgC[2], { ry: 0.35, bumpMap: waterBump, roughness: 0.15, metalness: 0.42 });
      buildAuroraCurtains(THREE, scene, state.auroraMeshes);

    } else if (id === 'saskatchewan') {
      // Regina Legislative at landmark 0
      const regC = lmCoords(0, 0, 0, -56);
      addBox(THREE, scene, 32, 10, 12, 0xe7e5e4, regC[0], 5, regC[2], { map: stoneTex, castShadow: true });
      const skDome = new THREE.Mesh(new THREE.SphereGeometry(5.5, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(THREE, 0x2dd4bf, { metalness: 0.35, roughness: 0.4 }));
      skDome.position.set(regC[0], 10, regC[2]); scene.add(skDome);
      addCyl(THREE, scene, 2.2, 2.2, 6, 12, 0xd6d3d1, regC[0], 12, regC[2], { map: stoneTex });
      // Grain Elevators at landmark 1
      const geC = lmCoords(1, -54, 0, -24);
      for (let i = 0; i < 3; i += 1) {
        addBox(THREE, scene, 6.5, 18, 6.5, 0xb91c1c, geC[0] + i * 9, 9, geC[2], { map: woodTex, castShadow: true });
        addCone(THREE, scene, 4.6, 4.5, 4, 0x7f1d1d, geC[0] + i * 9, 20.25, geC[2]);
      }
      // Wascana Lake at landmark 2
      const wsC = lmCoords(2, 58, 0, 26);
      const wascana = new THREE.Mesh(new THREE.CircleGeometry(22, 28), mat(THREE, 0x1e6b8a, { bumpMap: waterBump, roughness: 0.15, metalness: 0.42 }));
      wascana.rotation.x = -Math.PI / 2; wascana.position.set(wsC[0], 0.1, wsC[2]); scene.add(wascana);

    } else if (id === 'yukon') {
      // SS Klondike Sternwheeler at landmark 0
      const ssC = lmCoords(0, 18, 0, -42);
      addBox(THREE, scene, 22, 4, 7, 0xf8fafc, ssC[0], 2, ssC[2], { map: woodTex, castShadow: true });
      addBox(THREE, scene, 15, 3.5, 5.5, 0xe2e8f0, ssC[0], 5.75, ssC[2], { map: woodTex });
      const wheel = addCyl(THREE, scene, 2.6, 2.6, 4.8, 12, 0xef4444, ssC[0] + 12, 3, ssC[2], { rx: Math.PI / 2 });
      state.animators.push(function (t) { wheel.rotation.y = t * 1.4; });
      // Log cabins at landmark 1
      const lcC = lmCoords(1, -62, 0, 24);
      for (let i = 0; i < 4; i += 1) addBox(THREE, scene, 6, 7, 7, 0x92400e, lcC[0] + i * 7.5, 3.5, lcC[2], { map: woodTex });
      // Klondike Mountains at landmark 2
      const ykMC = lmCoords(2, 0, 0, -200);
      buildInstancedMountains(THREE, scene, Math.round(26 * scale), 170, ykMC[2], 72, true, rng);

    } else if (id === 'northwest-territories') {
      // Diamond Mine Headframe at landmark 0
      const dmC = lmCoords(0, -58, 0, -56);
      addBox(THREE, scene, 10, 24, 10, 0x475569, dmC[0], 12, dmC[2], { metalness: 0.55, roughness: 0.4, castShadow: true });
      addCyl(THREE, scene, 4.5, 4.5, 2, 16, 0x38bdf8, dmC[0], 24.5, dmC[2], { emissive: 0x0284c7, emissiveIntensity: 0.5 });
      buildAuroraCurtains(THREE, scene, state.auroraMeshes);

    } else if (id === 'nunavut') {
      // Monumental Inuksuk at landmark 0
      const inuC = lmCoords(0, 0, 0, -50);
      addBox(THREE, scene, 3.2, 6.5, 2.2, 0x64748b, inuC[0] - 2.5, 3.25, inuC[2], { map: stoneTex, roughness: 0.92, castShadow: true });
      addBox(THREE, scene, 3.2, 6.5, 2.2, 0x64748b, inuC[0] + 2.5, 3.25, inuC[2], { map: stoneTex, roughness: 0.92, castShadow: true });
      addBox(THREE, scene, 10.5, 2.6, 2.8, 0x94a3b8, inuC[0], 7.8, inuC[2], { map: stoneTex, roughness: 0.92, castShadow: true });
      addBox(THREE, scene, 5.5, 4.2, 2.6, 0x64748b, inuC[0], 11.2, inuC[2], { map: stoneTex, roughness: 0.92, castShadow: true });
      addBox(THREE, scene, 3.4, 3.2, 2.4, 0x94a3b8, inuC[0], 14.9, inuC[2], { map: stoneTex, roughness: 0.92, castShadow: true });
      // Arctic ice floes at landmark 1
      const floeC = lmCoords(1, 42, 0, -20);
      for (let i = 0; i < 8; i += 1) {
        addBox(THREE, scene, 11 + rng() * 8, 0.7, 9 + rng() * 6, 0xdbeafe, floeC[0] + (i % 4) * 14, 0.1, floeC[2] - Math.floor(i / 4) * 18, { roughness: 0.25 });
      }
      // Arctic peaks at landmark 2
      const arcMC = lmCoords(2, 0, 0, -200);
      buildInstancedMountains(THREE, scene, Math.round(22 * scale), 160, arcMC[2], 60, true, rng);
      buildAuroraCurtains(THREE, scene, state.auroraMeshes);
    }
  }

  // ─── Landmark Markers ─────────────────────────────────────────────────────

  function buildLandmarkMarkers(THREE, scene, province, state) {
    const accent = new THREE.Color(province.climate.accent);
    for (let i = 0; i < province.landmarks.length; i += 1) {
      const lm = province.landmarks[i];
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.6, 3.2, 28),
        new THREE.MeshBasicMaterial({ color: accent, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(lm.coords[0], 0.18, lm.coords[2]); scene.add(ring);
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 16, 8),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.28 })
      );
      pillar.position.set(lm.coords[0], 8, lm.coords[2]); scene.add(pillar);
      state.landmarkMarkers.push({ id: lm.id, ring, pillar });
    }
  }

  // ─── Functional Buildings (gameplay hubs) ─────────────────────────────────

  const FUNCTIONAL_HUB_SPECS = [
    { id: 'hub-gunshop', type: 'gunshop', name: 'Ammu-North Armory', subtitle: 'Weapons, Ammo & Tactical Gear', shortTitle: 'AMMU-NORTH', tag: 'ARMORY', color: '#f59e0b', side: 1, z: 28 },
    { id: 'hub-safehouse', type: 'safehouse', name: 'Explorer Safe House', subtitle: 'Rest, Heal & Stash Supplies', shortTitle: 'SAFE HOUSE', tag: 'EXPLORER LODGE', color: '#10b981', side: -1, z: 24 },
    { id: 'hub-contract', type: 'contract', name: 'Syndicate Ops Terminal', subtitle: 'Province Contracts & Bounties', shortTitle: 'SYNDICATE OPS', tag: 'CONTRACTS', color: '#a855f7', side: 1, z: 6 },
    { id: 'hub-garage', type: 'garage', name: 'Trans-Canada Customs', subtitle: 'Vehicle Repair & Paint Bay', shortTitle: 'TRANS-CANADA', tag: 'CUSTOMS BAY', color: '#38bdf8', side: -1, z: 2 }
  ];

  function getHubSignTexture(THREE, spec) {
    return getCachedTexture(THREE, 'hub_sign_' + spec.type, 256, function (ctx, s) {
      ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = spec.color; ctx.lineWidth = 10; ctx.strokeRect(8, 12, s - 16, s - 24);
      ctx.fillStyle = spec.color;
      ctx.fillRect(16, 22, s - 32, 8); ctx.fillRect(16, s - 30, s - 32, 8);
      ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(spec.shortTitle, s * 0.5, s * 0.44);
      ctx.fillStyle = spec.color; ctx.font = 'bold 24px sans-serif';
      ctx.fillText(spec.tag, s * 0.5, s * 0.68);
    }, { srgb: true });
  }

  function buildFunctionalBuildings(THREE, scene, state) {
    const concreteTex = getConcreteTexture(THREE);
    const bTex = getBuildingTextures(THREE);
    const bodyGeo = new THREE.BoxGeometry(5.0, 5.2, 7.6);
    const podiumGeo = new THREE.BoxGeometry(5.6, 0.24, 8.2);
    const roofTrimGeo = new THREE.BoxGeometry(5.3, 0.42, 7.9);
    const doorRecessGeo = new THREE.BoxGeometry(0.24, 2.75, 2.2);
    const doorJambGeo = new THREE.BoxGeometry(0.34, 2.9, 0.28);
    const doorHeaderGeo = new THREE.BoxGeometry(0.38, 0.3, 2.76);
    const doorStripGeo = new THREE.BoxGeometry(0.16, 0.12, 2.2);
    const awningGeo = new THREE.BoxGeometry(1.25, 0.22, 3.8);
    const signBackGeo = new THREE.BoxGeometry(0.18, 1.05, 4.2);
    const signFaceGeo = new THREE.PlaneGeometry(4.0, 0.92);
    const padGeo = new THREE.CylinderGeometry(1.65, 1.8, 0.08, 24);
    const ringGeo = new THREE.RingGeometry(1.85, 2.25, 32);
    const bodyMat = mat(THREE, 0x334155, { map: bTex.map, emissiveMap: bTex.emissiveMap, emissive: 0xffd580, emissiveIntensity: 0.08, roughness: 0.48, metalness: 0.35 });
    const trimMat = mat(THREE, 0x1e293b, { map: concreteTex, roughness: 0.72, metalness: 0.25 });
    const recessMat = mat(THREE, 0x050811, { roughness: 0.9, metalness: 0.1 });
    const padMat = mat(THREE, 0x475569, { map: concreteTex, roughness: 0.85, metalness: 0.1 });

    for (let i = 0; i < FUNCTIONAL_HUB_SPECS.length; i += 1) {
      const spec = FUNCTIONAL_HUB_SPECS[i];
      const side = spec.side, bx = side * 11.6, bz = spec.z;
      const faceDir = -side, frontX = bx + faceDir * 2.5, padX = side * 8.2;
      const accentMat = new THREE.MeshStandardMaterial({ color: spec.color, emissive: spec.color, emissiveIntensity: 0.72, roughness: 0.28, metalness: 0.2 });
      const signTex = getHubSignTexture(THREE, spec);
      const signFaceMat = new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.35 });

      const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.set(bx, 2.6, bz); body.castShadow = true; body.receiveShadow = true; scene.add(body);
      const podium = new THREE.Mesh(podiumGeo, trimMat); podium.position.set(bx, 0.12, bz); podium.receiveShadow = true; scene.add(podium);
      const roofTrim = new THREE.Mesh(roofTrimGeo, trimMat); roofTrim.position.set(bx, 5.4, bz); scene.add(roofTrim);
      const recess = new THREE.Mesh(doorRecessGeo, recessMat); recess.position.set(frontX + faceDir * 0.04, 1.38, bz); scene.add(recess);
      const jambL = new THREE.Mesh(doorJambGeo, accentMat); jambL.position.set(frontX + faceDir * 0.12, 1.45, bz - 1.24); scene.add(jambL);
      const jambR = new THREE.Mesh(doorJambGeo, accentMat); jambR.position.set(frontX + faceDir * 0.12, 1.45, bz + 1.24); scene.add(jambR);
      const header = new THREE.Mesh(doorHeaderGeo, accentMat); header.position.set(frontX + faceDir * 0.12, 2.95, bz); scene.add(header);
      const strip = new THREE.Mesh(doorStripGeo, accentMat); strip.position.set(frontX + faceDir * 0.26, 2.75, bz); scene.add(strip);
      const awning = new THREE.Mesh(awningGeo, accentMat); awning.position.set(frontX + faceDir * 0.62, 3.25, bz); awning.rotation.z = faceDir * -0.18; scene.add(awning);
      const signBack = new THREE.Mesh(signBackGeo, trimMat); signBack.position.set(frontX + faceDir * 0.12, 4.25, bz); scene.add(signBack);
      const signFace = new THREE.Mesh(signFaceGeo, signFaceMat); signFace.position.set(frontX + faceDir * 0.22, 4.25, bz); signFace.rotation.y = faceDir > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(signFace);
      const pad = new THREE.Mesh(padGeo, padMat); pad.position.set(padX, 0.04, bz); pad.receiveShadow = true; scene.add(pad);
      const ringMat = new THREE.MeshBasicMaterial({ color: spec.color, side: THREE.DoubleSide, transparent: true, opacity: 0.78 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat); ringMesh.rotation.x = -Math.PI / 2; ringMesh.position.set(padX, 0.14, bz); scene.add(ringMesh);

      state.functionalBuildings.push({ id: spec.id, type: spec.type, name: spec.name, subtitle: spec.subtitle, x: padX, z: bz, radius: 5.5, color: spec.color, ringMesh: ringMesh });
    }
  }

  // ─── Main Entry Point ─────────────────────────────────────────────────────

  function buildProvinceWorld(scene, province, qualityTier) {
    const THREE = global.THREE;
    if (!THREE) throw new Error('THREE is required to build province world');
    const tier = qualityTier || 'balanced';
    const scale = tierScale(tier);
    const rng = mulberry32(hashString(province.id));

    const state = {
      animators: [],
      auroraMeshes: [],
      beaconMeshes: [],
      landmarkMarkers: [],
      functionalBuildings: [],
      lights: null,
      waterMesh: null,
      waterBump: null,
      streetlightMat: null,
      buildingMat: null
    };

    state.lights = buildSkyAndLighting(THREE, scene, province, tier);
    const groundInfo = buildGroundAndHighway(THREE, scene, province, scale);
    state.waterMesh = groundInfo.waterMesh;
    state.waterBump = groundInfo.waterBump;
    state.streetlightMat = groundInfo.streetlightMat;

    buildInstancedForest(THREE, scene, province, scale, rng);
    buildRoadsideStructures(THREE, scene, province, scale, rng);
    buildStartingCityBlock(THREE, scene, province, scale, rng, state);
    buildProvinceLandmarks(THREE, scene, province, scale, rng, state);
    buildLandmarkMarkers(THREE, scene, province, state);
    buildFunctionalBuildings(THREE, scene, state);

    return {
      scene: scene,
      fogDensityBase: state.lights.fogDensityBase,
      lights: state.lights,
      waterMesh: state.waterMesh,
      auroraMeshes: state.auroraMeshes,
      beaconMeshes: state.beaconMeshes,
      landmarkMarkers: state.landmarkMarkers,
      functionalBuildings: state.functionalBuildings,
      emissiveTargets: {
        streetlightMat: state.streetlightMat,
        buildingMat: state.buildingMat
      },
      update: function (dtOrElapsed, maybeElapsed) {
        const elapsed = maybeElapsed !== undefined ? maybeElapsed : dtOrElapsed;
        if (state.lights && state.lights.skyMat && state.lights.skyMat.uniforms && state.lights.skyMat.uniforms.uTime) {
          state.lights.skyMat.uniforms.uTime.value = elapsed;
        }
        if (state.waterBump) {
          state.waterBump.offset.x = (elapsed * 0.025) % 1;
          state.waterBump.offset.y = (elapsed * 0.015) % 1;
        }
        for (let i = 0; i < state.animators.length; i += 1) state.animators[i](elapsed);
        for (let i = 0; i < state.auroraMeshes.length; i += 1) {
          const a = state.auroraMeshes[i];
          a.position.x = (-20 + i * 25) + Math.sin(elapsed * 0.35 + i) * 6;
          a.material.opacity = 0.18 + Math.sin(elapsed * 0.9 + i * 1.3) * 0.08;
        }
        for (let i = 0; i < state.beaconMeshes.length; i += 1) {
          state.beaconMeshes[i].material.emissiveIntensity = 1.0 + Math.sin(elapsed * 3.2) * 0.65;
        }
        for (let i = 0; i < state.functionalBuildings.length; i += 1) {
          const fb = state.functionalBuildings[i];
          const pulse = Math.sin(elapsed * 2.6 + i * 1.4);
          const s = 1.0 + pulse * 0.08;
          fb.ringMesh.scale.set(s, s, 1);
          fb.ringMesh.material.opacity = 0.62 + pulse * 0.24;
        }
      }
    };
  }

  global.CanadaLandmarks = {
    buildProvinceWorld: buildProvinceWorld
  };
})(typeof window !== 'undefined' ? window : globalThis);
