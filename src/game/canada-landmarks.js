/**
 * Canada Landmarks & Procedural Biome Builder (Three.js r128)
 * Exposes `window.CanadaLandmarks.buildProvinceWorld(scene, province, qualityTier)`
 * Uses cached procedural CanvasTextures, shared BufferGeometries, and InstancedMesh
 * for 60 FPS performance with zero per-frame allocations.
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
        const x = rng() * s;
        const y = rng() * s;
        const r = 1 + rng() * (isSnow ? 4.5 : 3.2);
        const v = rng();
        if (isSnow) {
          ctx.fillStyle = v > 0.78 ? 'rgba(203,213,225,0.28)' : (v > 0.35 ? 'rgba(255,255,255,0.34)' : 'rgba(148,163,184,0.18)');
        } else if (isShield) {
          ctx.fillStyle = v > 0.7 ? 'rgba(100,116,139,0.26)' : (v > 0.35 ? 'rgba(74,107,68,0.28)' : 'rgba(163,177,138,0.2)');
        } else if (isRed) {
          ctx.fillStyle = v > 0.65 ? 'rgba(180,83,9,0.24)' : (v > 0.3 ? 'rgba(63,115,62,0.26)' : 'rgba(217,119,6,0.16)');
        } else if (isPrairie) {
          ctx.fillStyle = v > 0.65 ? 'rgba(161,132,48,0.25)' : (v > 0.3 ? 'rgba(84,122,58,0.25)' : 'rgba(120,96,48,0.18)');
        } else {
          ctx.fillStyle = v > 0.68 ? 'rgba(34,84,45,0.28)' : (v > 0.32 ? 'rgba(82,128,64,0.24)' : 'rgba(78,64,46,0.18)');
        }
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Subtle organic blades/scratches
      ctx.strokeStyle = isSnow ? 'rgba(255,255,255,0.16)' : 'rgba(20,40,20,0.14)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 420; i += 1) {
        const x = rng() * s;
        const y = rng() * s;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rng() - 0.5) * 6, y - 2 - rng() * 5);
        ctx.stroke();
      }
    }, { rx: 22, ry: 22, srgb: true });

    const bump = getCachedTexture(THREE, keyBase + '_bump', 256, function (ctx, s) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, s, s);
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

      // Aggregate / frost grain
      for (let i = 0; i < 3600; i += 1) {
        const x = rng() * s;
        const y = rng() * s;
        const v = rng();
        if (isIceRoad) {
          ctx.fillStyle = v > 0.5 ? 'rgba(224,242,254,0.28)' : 'rgba(125,175,205,0.24)';
        } else {
          ctx.fillStyle = v > 0.55 ? 'rgba(71,85,105,0.28)' : 'rgba(15,23,42,0.34)';
        }
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      // Subtle tire-wear tracks in both lanes
      const trackGradL = ctx.createLinearGradient(s * 0.18, 0, s * 0.42, 0);
      trackGradL.addColorStop(0, 'rgba(0,0,0,0)');
      trackGradL.addColorStop(0.5, isIceRoad ? 'rgba(186,230,253,0.25)' : 'rgba(12,16,22,0.28)');
      trackGradL.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = trackGradL;
      ctx.fillRect(s * 0.18, 0, s * 0.24, s);

      const trackGradR = ctx.createLinearGradient(s * 0.58, 0, s * 0.82, 0);
      trackGradR.addColorStop(0, 'rgba(0,0,0,0)');
      trackGradR.addColorStop(0.5, isIceRoad ? 'rgba(186,230,253,0.25)' : 'rgba(12,16,22,0.28)');
      trackGradR.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = trackGradR;
      ctx.fillRect(s * 0.58, 0, s * 0.24, s);

      // Shoulder edge lines
      ctx.fillStyle = isIceRoad ? 'rgba(224,242,254,0.65)' : 'rgba(241,245,249,0.75)';
      ctx.fillRect(s * 0.045, 0, s * 0.022, s);
      ctx.fillRect(s * 0.933, 0, s * 0.022, s);

      // Subtle tar seams / ice cracks
      ctx.strokeStyle = isIceRoad ? 'rgba(255,255,255,0.22)' : 'rgba(10,12,16,0.38)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i += 1) {
        const y0 = rng() * s;
        ctx.beginPath();
        ctx.moveTo(rng() * s * 0.5, y0);
        ctx.lineTo(rng() * s, y0 + (rng() - 0.5) * 18);
        ctx.stroke();
      }
    }, { rx: 1, ry: 28, srgb: true });

    const bump = getCachedTexture(THREE, key + '_bump', 256, function (ctx, s) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, s, s);
      const bRng = mulberry32(hashString(key + '_b'));
      for (let i = 0; i < 3000; i += 1) {
        const shade = Math.floor(95 + bRng() * 75);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        ctx.fillRect(bRng() * s, bRng() * s, 1.5, 1.5);
      }
    }, { rx: 1, ry: 28, srgb: false });

    return { map, bump };
  }

  function getWaterBumpTexture(THREE) {
    return getCachedTexture(THREE, 'water_ripples_bump', 256, function (ctx, s) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, s, s);
      const img = ctx.getImageData(0, 0, s, s);
      const d = img.data;
      for (let y = 0; y < s; y += 1) {
        const ny = (y / s) * Math.PI * 2;
        for (let x = 0; x < s; x += 1) {
          const nx = (x / s) * Math.PI * 2;
          const w =
            Math.sin(nx * 3 + Math.cos(ny * 2)) * 0.35 +
            Math.cos(ny * 5 - Math.sin(nx * 2)) * 0.3 +
            Math.sin((nx + ny) * 4) * 0.2;
          const val = Math.max(0, Math.min(255, Math.floor(128 + w * 90)));
          const idx = (y * s + x) * 4;
          d[idx] = val;
          d[idx + 1] = val;
          d[idx + 2] = val;
          d[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }, { rx: 14, ry: 7, srgb: false });
  }

  function getConcreteTexture(THREE) {
    return getCachedTexture(THREE, 'concrete_diff', 256, function (ctx, s) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(4219);
      for (let i = 0; i < 1800; i += 1) {
        const shade = Math.floor(175 + rng() * 55);
        ctx.fillStyle = 'rgba(' + shade + ',' + shade + ',' + (shade + 4) + ',0.35)';
        ctx.fillRect(rng() * s, rng() * s, 2, 2);
      }
      ctx.strokeStyle = 'rgba(100,116,139,0.22)';
      ctx.lineWidth = 1;
      for (let y = 32; y < s; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(s, y);
        ctx.stroke();
      }
    }, { rx: 2, ry: 2, srgb: true });
  }

  function getStoneTexture(THREE) {
    return getCachedTexture(THREE, 'stone_ashlar_diff', 256, function (ctx, s) {
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(7731);
      const rows = 8;
      const rowH = s / rows;
      for (let r = 0; r < rows; r += 1) {
        const offset = (r % 2) * 32;
        for (let c = -1; c < 5; c += 1) {
          const bx = c * 64 + offset;
          const by = r * rowH;
          const shade = Math.floor(145 + rng() * 38);
          ctx.fillStyle = 'rgb(' + shade + ',' + (shade - 2) + ',' + (shade - 6) + ')';
          ctx.fillRect(bx + 1, by + 1, 62, rowH - 2);
        }
      }
    }, { rx: 2, ry: 2, srgb: true });
  }

  function getWoodTexture(THREE) {
    return getCachedTexture(THREE, 'wood_planks_diff', 256, function (ctx, s) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(9912);
      for (let y = 0; y < s; y += 16) {
        const tone = Math.floor(105 + rng() * 40);
        ctx.fillStyle = 'rgb(' + tone + ',' + Math.floor(tone * 0.56) + ',' + Math.floor(tone * 0.25) + ')';
        ctx.fillRect(0, y + 1, s, 14);
        ctx.strokeStyle = 'rgba(40,18,6,0.3)';
        ctx.beginPath();
        ctx.moveTo(0, y + 7);
        ctx.lineTo(s, y + 7);
        ctx.stroke();
      }
    }, { rx: 2, ry: 2, srgb: true });
  }

  function getBarkTexture(THREE) {
    const map = getCachedTexture(THREE, 'bark_diff', 128, function (ctx, s) {
      ctx.fillStyle = '#4b3621';
      ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(1337);
      for (let i = 0; i < 240; i += 1) {
        const x = rng() * s;
        ctx.fillStyle = rng() > 0.5 ? 'rgba(30,20,10,0.45)' : 'rgba(110,82,55,0.35)';
        ctx.fillRect(x, 0, 1 + rng() * 3, s);
      }
    }, { rx: 1, ry: 2, srgb: true });

    const bump = getCachedTexture(THREE, 'bark_bump', 128, function (ctx, s) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, s, s);
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
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(hashString(key));
      for (let i = 0; i < 900; i += 1) {
        const shade = Math.floor(175 + rng() * 80);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        if (isConifer) {
          const x = rng() * s;
          const y = rng() * s;
          ctx.fillRect(x, y, 2, 5);
        } else {
          ctx.beginPath();
          ctx.arc(rng() * s, rng() * s, 2 + rng() * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }, { rx: 2, ry: 2, srgb: true });
  }

  function getBuildingTextures(THREE) {
    const map = getCachedTexture(THREE, 'building_win_diff', 256, function (ctx, s) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(5051);
      const cols = 8;
      const rows = 12;
      const cw = s / cols;
      const rh = s / rows;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const x = c * cw + 4;
          const y = r * rh + 3;
          const w = cw - 8;
          const h = rh - 6;
          const lit = rng();
          ctx.fillStyle = lit > 0.65 ? '#64748b' : (lit > 0.25 ? '#475569' : '#1e293b');
          ctx.fillRect(x, y, w, h);
          // Subtle sky reflection highlight
          ctx.fillStyle = 'rgba(186,230,253,0.18)';
          ctx.fillRect(x, y, w, h * 0.38);
        }
      }
    }, { rx: 1, ry: 2, srgb: true });

    const emissiveMap = getCachedTexture(THREE, 'building_win_emis', 256, function (ctx, s) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(5052);
      const cols = 8;
      const rows = 12;
      const cw = s / cols;
      const rh = s / rows;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          if (rng() > 0.42) {
            const x = c * cw + 4;
            const y = r * rh + 3;
            const w = cw - 8;
            const h = rh - 6;
            const warm = Math.floor(170 + rng() * 85);
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
      grad.addColorStop(0, 'rgba(240, 249, 255, 0.85)');
      grad.addColorStop(0.45, 'rgba(224, 242, 254, 0.42)');
      grad.addColorStop(1, 'rgba(224, 242, 254, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s, s);
    }, { srgb: true });
  }

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
    if (o.bumpMap) {
      cfg.bumpMap = o.bumpMap;
      cfg.bumpScale = o.bumpScale !== undefined ? o.bumpScale : 0.15;
    }
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

  function buildSkyAndLighting(THREE, scene, province, qualityTier) {
    const c = province.climate;
    const fogDensityBase = qualityTier === 'battery' ? 0.0040 : 0.0029;
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
      sun.shadow.camera.far = 320;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.03;
      const d = 115;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
    }
    scene.add(sun);

    const fill = new THREE.DirectionalLight(c.accent, 0.25);
    fill.position.set(-70, 40, -60);
    scene.add(fill);

    // Procedural atmospheric gradient sky dome with soft cloud wisps, sun disc & horizon haze
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
        'uniform vec3 topColor;',
        'uniform vec3 bottomColor;',
        'uniform vec3 horizonColor;',
        'uniform vec3 sunDir;',
        'uniform vec3 sunColor;',
        'uniform float sunGlow;',
        'uniform float cloudOpacity;',
        'uniform float uTime;',
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

  function buildGroundAndHighway(THREE, scene, province, scale) {
    const c = province.climate;
    const biome = province.biome;
    const isIceRoad = province.id === 'northwest-territories' || province.id === 'nunavut';

    // Terrain with biome CanvasTexture + per-vertex macro elevation/biome blending
    const groundGeo = new THREE.PlaneGeometry(520, 520, 64, 64);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const baseCol = new THREE.Color(c.groundColor);
    const rockCol = new THREE.Color(biome === 'red-sand-island' || biome === 'fundy-coast' ? 0x9a4a2a : 0x64748b);
    const peakCol = new THREE.Color(biome === 'arctic-tundra' || biome === 'klondike-glacier' || biome === 'rockies-foothills' ? 0xe2e8f0 : 0x4b5d44);
    const tmpCol = new THREE.Color();

    const isFlat = biome === 'living-skies-wheat' || biome === 'prairie-lake' || biome === 'subarctic-shield';
    const amp = isFlat ? 0.65 : 2.35;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromRoad = Math.abs(x);
      let y = 0;
      if (distFromRoad > 14 && Math.abs(z) > 10) {
        const hill = Math.sin(x * 0.045) * Math.cos(z * 0.045) * amp + Math.sin((x + z) * 0.02) * amp;
        y = Math.max(-0.4, hill * Math.min(1, (distFromRoad - 14) / 22));
        pos.setY(i, y);
      }
      tmpCol.copy(baseCol);
      if (y > 0.8) {
        tmpCol.lerp(rockCol, Math.min(0.55, (y - 0.8) * 0.25));
      }
      if (y > 2.2) {
        tmpCol.lerp(peakCol, Math.min(0.6, (y - 2.2) * 0.35));
      }
      colors[i * 3] = tmpCol.r;
      colors[i * 3 + 1] = tmpCol.g;
      colors[i * 3 + 2] = tmpCol.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const terrainTex = getTerrainTextures(THREE, biome, c.groundColor);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      map: terrainTex.map,
      bumpMap: terrainTex.bump,
      bumpScale: 0.32,
      roughness: 0.90,
      metalness: 0.04
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // Trans-Canada / Provincial Highway with weathered asphalt or ice-road PBR textures
    const roadTex = getRoadTextures(THREE, isIceRoad);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(11.2, 460),
      mat(THREE, 0xffffff, {
        map: roadTex.map,
        bumpMap: roadTex.bump,
        bumpScale: 0.08,
        roughness: isIceRoad ? 0.32 : 0.78,
        metalness: isIceRoad ? 0.22 : 0.06
      })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.05;
    road.receiveShadow = true;
    scene.add(road);

    // Highway centre dashed line
    const lineCount = 46;
    const dashGeo = new THREE.PlaneGeometry(0.28, 4.2);
    dashGeo.rotateX(-Math.PI / 2);
    const dashMat = new THREE.MeshBasicMaterial({ color: isIceRoad ? 0x38bdf8 : 0xfbbf24 });
    const dashes = new THREE.InstancedMesh(dashGeo, dashMat, lineCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < lineCount; i += 1) {
      dummy.position.set(0, 0.08, -220 + i * 10);
      dummy.updateMatrix();
      dashes.setMatrixAt(i, dummy.matrix);
    }
    dashes.instanceMatrix.needsUpdate = true;
    scene.add(dashes);

    // Raised concrete curbs along both highway edges
    const concreteTex = getConcreteTexture(THREE);
    const curbGeo = new THREE.BoxGeometry(0.45, 0.24, 460);
    const curbMat = mat(THREE, 0xcbd5e1, { map: concreteTex, roughness: 0.85, metalness: 0.05 });
    const curbL = new THREE.Mesh(curbGeo, curbMat);
    curbL.position.set(-5.78, 0.12, 0);
    curbL.receiveShadow = true;
    scene.add(curbL);
    const curbR = new THREE.Mesh(curbGeo, curbMat);
    curbR.position.set(5.78, 0.12, 0);
    curbR.receiveShadow = true;
    scene.add(curbR);

    // Roadside galvanized steel guardrails & instanced posts
    const railGeo = new THREE.BoxGeometry(0.14, 0.32, 460);
    const railMat = mat(THREE, 0x94a3b8, { roughness: 0.38, metalness: 0.65 });
    const railL = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-6.32, 0.64, 0);
    scene.add(railL);
    const railR = new THREE.Mesh(railGeo, railMat);
    railR.position.set(6.32, 0.64, 0);
    scene.add(railR);

    const postSpacing = 8;
    const postHalf = Math.floor(440 / postSpacing);
    const postGeo = new THREE.BoxGeometry(0.18, 0.82, 0.18);
    const posts = new THREE.InstancedMesh(postGeo, mat(THREE, 0x64748b, { roughness: 0.45, metalness: 0.6 }), postHalf * 2);
    let pIdx = 0;
    for (let i = 0; i < postHalf; i += 1) {
      const z = -216 + i * postSpacing;
      dummy.position.set(-6.35, 0.41, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      posts.setMatrixAt(pIdx++, dummy.matrix);
      dummy.position.set(6.35, 0.41, z);
      dummy.updateMatrix();
      posts.setMatrixAt(pIdx++, dummy.matrix);
    }
    posts.instanceMatrix.needsUpdate = true;
    scene.add(posts);

    // Instanced highway streetlights (glow softly at Sunset/Night)
    const lampCount = Math.max(8, Math.round(14 * scale));
    const poleGeo = new THREE.CylinderGeometry(0.09, 0.14, 6.2, 6);
    poleGeo.translate(0, 3.1, 0);
    const armGeo = new THREE.BoxGeometry(1.6, 0.1, 0.12);
    const headGeo = new THREE.BoxGeometry(0.65, 0.14, 0.32);

    const poleMat = mat(THREE, 0x475569, { roughness: 0.4, metalness: 0.7 });
    const streetlightMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xffcf70,
      emissiveIntensity: 0.05,
      roughness: 0.2
    });

    const poles = new THREE.InstancedMesh(poleGeo, poleMat, lampCount);
    const arms = new THREE.InstancedMesh(armGeo, poleMat, lampCount);
    const heads = new THREE.InstancedMesh(headGeo, streetlightMat, lampCount);

    for (let i = 0; i < lampCount; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * 6.75;
      const z = -195 + (i / Math.max(1, lampCount - 1)) * 390;
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poles.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x - side * 0.72, 6.1, z);
      dummy.updateMatrix();
      arms.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x - side * 1.35, 6.0, z);
      dummy.updateMatrix();
      heads.setMatrixAt(i, dummy.matrix);
    }
    poles.instanceMatrix.needsUpdate = true;
    arms.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    scene.add(poles);
    scene.add(arms);
    scene.add(heads);

    // Rippled water body (lake, river, fjord, or ocean)
    const waterBump = getWaterBumpTexture(THREE);
    const waterGeo = new THREE.PlaneGeometry(520, 260);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: c.waterColor,
      roughness: isIceRoad ? 0.24 : 0.12,
      metalness: 0.48,
      bumpMap: waterBump,
      bumpScale: 0.18,
      transparent: true,
      opacity: 0.88
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, -0.35, -185);
    if (biome === 'atlantic-iceberg' || biome === 'granite-lighthouse' || biome === 'fundy-coast') {
      waterMesh.position.set(0, -0.35, -145);
    }
    scene.add(waterMesh);

    return { ground, road, waterMesh, waterBump, streetlightMat };
  }

  function buildInstancedForest(THREE, scene, province, scale, rng) {
    const biome = province.biome;
    if (biome === 'arctic-tundra') {
      // Scatter low arctic boulders/tussocks
      const rCount = Math.round(55 * scale);
      const rGeo = new THREE.DodecahedronGeometry(1.1, 0);
      const rocks = new THREE.InstancedMesh(rGeo, mat(THREE, 0x64748b, { roughness: 0.92 }), rCount);
      const dummy = new THREE.Object3D();
      const tmp = new THREE.Color();
      for (let i = 0; i < rCount; i += 1) {
        const side = rng() > 0.5 ? 1 : -1;
        dummy.position.set(side * (16 + rng() * 130), 0.25, -90 + rng() * 200);
        dummy.rotation.set(rng() * 2, rng() * 2, rng() * 2);
        dummy.scale.set(0.6 + rng() * 1.4, 0.35 + rng() * 0.5, 0.6 + rng() * 1.3);
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);
        tmp.setHex(rng() > 0.4 ? 0x64748b : 0x94a3b8);
        rocks.setColorAt(i, tmp);
      }
      rocks.instanceMatrix.needsUpdate = true;
      if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
      scene.add(rocks);
      return;
    }

    const isWheat = biome === 'living-skies-wheat';
    if (isWheat) {
      const count = Math.round(900 * scale);
      const stalkGeo = new THREE.ConeGeometry(0.16, 1.5, 4);
      stalkGeo.translate(0, 0.75, 0);
      const wheat = new THREE.InstancedMesh(stalkGeo, mat(THREE, 0xffffff, { roughness: 0.85 }), count);
      const dummy = new THREE.Object3D();
      const tmp = new THREE.Color();
      for (let i = 0; i < count; i += 1) {
        const side = rng() > 0.5 ? 1 : -1;
        const x = side * (12 + rng() * 140);
        const z = -120 + rng() * 240;
        dummy.position.set(x, 0, z);
        dummy.rotation.set((rng() - 0.5) * 0.14, rng() * Math.PI * 2, (rng() - 0.5) * 0.14);
        const s = 0.75 + rng() * 0.6;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        wheat.setMatrixAt(i, dummy.matrix);
        tmp.setHSL(0.11 + (rng() - 0.5) * 0.03, 0.72, 0.46 + (rng() - 0.5) * 0.12);
        wheat.setColorAt(i, tmp);
      }
      wheat.instanceMatrix.needsUpdate = true;
      if (wheat.instanceColor) wheat.instanceColor.needsUpdate = true;
      scene.add(wheat);
      return;
    }

    const treeCount = Math.round((biome === 'subarctic-shield' ? 95 : 180) * scale);
    const isDeciduous = biome === 'great-lakes-metro' || biome === 'capital-canal' || biome === 'red-sand-island' || biome === 'st-lawrence-citadel';
    const barkTex = getBarkTexture(THREE);
    const foliageTex = getFoliageTexture(THREE, !isDeciduous);

    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.36, 2.7, 7);
    trunkGeo.translate(0, 1.35, 0);
    const trunkMat = mat(THREE, 0x5c4028, { map: barkTex.map, bumpMap: barkTex.bump, bumpScale: 0.12, roughness: 0.92 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    trunks.castShadow = scale > 0.5;

    // 3 overlapping organic foliage cluster layers per tree
    const layerGeos = isDeciduous
      ? [
          new THREE.DodecahedronGeometry(1.45, 1),
          new THREE.DodecahedronGeometry(1.25, 1),
          new THREE.DodecahedronGeometry(1.05, 1)
        ]
      : [
          new THREE.ConeGeometry(2.05, 3.0, 8),
          new THREE.ConeGeometry(1.55, 2.7, 8),
          new THREE.ConeGeometry(1.05, 2.3, 8)
        ];

    if (isDeciduous) {
      layerGeos[0].translate(0, 3.5, 0);
      layerGeos[1].translate(0.55, 4.2, 0.35);
      layerGeos[2].translate(-0.45, 4.5, -0.35);
    } else {
      layerGeos[0].translate(0, 3.1, 0);
      layerGeos[1].translate(0, 4.6, 0);
      layerGeos[2].translate(0, 5.9, 0);
    }

    const foliageMat = mat(THREE, 0xffffff, { map: foliageTex, roughness: 0.82, metalness: 0.02 });
    const layers = [
      new THREE.InstancedMesh(layerGeos[0], foliageMat, treeCount),
      new THREE.InstancedMesh(layerGeos[1], foliageMat, treeCount),
      new THREE.InstancedMesh(layerGeos[2], foliageMat, treeCount)
    ];
    for (let l = 0; l < layers.length; l += 1) {
      layers[l].castShadow = scale > 0.5;
    }

    const dummy = new THREE.Object3D();
    const tmpCol = new THREE.Color();
    let placed = 0;
    let attempts = 0;
    while (placed < treeCount && attempts < treeCount * 4) {
      attempts += 1;
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (14 + rng() * 135);
      const z = -95 + rng() * 220;
      if (Math.abs(x) < 18 && Math.abs(z + 52) < 22) continue;

      const s = 0.72 + rng() * 0.85;
      const sy = s * (0.88 + rng() * 0.28);
      dummy.position.set(x, 0, z);
      dummy.rotation.set((rng() - 0.5) * 0.06, rng() * Math.PI * 2, (rng() - 0.5) * 0.06);
      dummy.scale.set(s, sy, s);
      dummy.updateMatrix();
      trunks.setMatrixAt(placed, dummy.matrix);

      for (let l = 0; l < layers.length; l += 1) {
        dummy.rotation.y += l * 0.85;
        dummy.updateMatrix();
        layers[l].setMatrixAt(placed, dummy.matrix);
        if (isDeciduous) {
          // Canadian greens with occasional maple autumn crimson/amber
          if (rng() > 0.86) {
            tmpCol.setHSL(0.03 + rng() * 0.06, 0.72, 0.40 + rng() * 0.08);
          } else {
            tmpCol.setHSL(0.32 + (rng() - 0.5) * 0.08, 0.45 + rng() * 0.15, 0.25 + rng() * 0.10);
          }
        } else {
          const baseHue = biome === 'subarctic-shield' ? 0.38 : 0.36;
          tmpCol.setHSL(baseHue + (rng() - 0.5) * 0.05, 0.42 + rng() * 0.14, 0.18 + rng() * 0.08);
        }
        layers[l].setColorAt(placed, tmpCol);
      }
      placed += 1;
    }
    trunks.count = placed;
    trunks.instanceMatrix.needsUpdate = true;
    scene.add(trunks);
    for (let l = 0; l < layers.length; l += 1) {
      layers[l].count = placed;
      layers[l].instanceMatrix.needsUpdate = true;
      if (layers[l].instanceColor) layers[l].instanceColor.needsUpdate = true;
      scene.add(layers[l]);
    }
  }

  function buildInstancedMountains(THREE, scene, count, xRange, zBase, maxHeight, snowCap, rng) {
    const mGeo = new THREE.ConeGeometry(16, 1, 7);
    mGeo.translate(0, 0.5, 0);
    const stoneTex = getStoneTexture(THREE);
    const rock = new THREE.InstancedMesh(mGeo, mat(THREE, 0x525b66, { map: stoneTex, roughness: 0.92 }), count);
    const snow = snowCap ? new THREE.InstancedMesh(mGeo, mat(THREE, 0xeef5fc, { roughness: 0.55 }), count) : null;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const x = -xRange + (i / Math.max(1, count - 1)) * xRange * 2 + (rng() - 0.5) * 14;
      const z = zBase - rng() * 45;
      const h = maxHeight * (0.55 + rng() * 0.55);
      const w = 0.8 + rng() * 1.1;
      dummy.position.set(x, -1, z);
      dummy.rotation.y = rng() * Math.PI;
      dummy.scale.set(w, h, w);
      dummy.updateMatrix();
      rock.setMatrixAt(i, dummy.matrix);

      if (snow) {
        dummy.position.set(x, h * 0.52 - 1, z);
        dummy.scale.set(w * 0.48, h * 0.5, w * 0.48);
        dummy.updateMatrix();
        snow.setMatrixAt(i, dummy.matrix);
      }
    }
    rock.instanceMatrix.needsUpdate = true;
    scene.add(rock);
    if (snow) {
      snow.instanceMatrix.needsUpdate = true;
      scene.add(snow);
    }
  }

  function buildInstancedSkyline(THREE, scene, count, centerX, centerZ, spreadX, maxH, rng, state) {
    const bTex = getBuildingTextures(THREE);
    const concreteTex = getConcreteTexture(THREE);

    const bGeo = new THREE.BoxGeometry(1, 1, 1);
    bGeo.translate(0, 0.5, 0);

    const bMat = mat(THREE, 0xffffff, {
      map: bTex.map,
      emissiveMap: bTex.emissiveMap,
      emissive: 0xffd580,
      emissiveIntensity: 0.06,
      roughness: 0.34,
      metalness: 0.52
    });
    if (state) state.buildingMat = bMat;

    const buildings = new THREE.InstancedMesh(bGeo, bMat, count);
    const podiums = new THREE.InstancedMesh(bGeo, mat(THREE, 0x64748b, { map: concreteTex, roughness: 0.82 }), count);
    const parapets = new THREE.InstancedMesh(bGeo, mat(THREE, 0x475569, { roughness: 0.65, metalness: 0.3 }), count);
    const hvacs = new THREE.InstancedMesh(bGeo, mat(THREE, 0x94a3b8, { roughness: 0.5, metalness: 0.45 }), count);

    buildings.castShadow = true;
    buildings.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const tmpCol = new THREE.Color();
    const palette = [0x94a3b8, 0x64748b, 0x7dd3fc, 0xa8a29e, 0x475569];

    for (let i = 0; i < count; i += 1) {
      const x = centerX + (rng() - 0.5) * spreadX;
      const z = centerZ + (rng() - 0.5) * 34;
      const w = 4.2 + rng() * 5.8;
      const d = 4.2 + rng() * 5.8;
      const h = 11 + rng() * maxH;

      dummy.rotation.set(0, 0, 0);
      dummy.position.set(x, 0, z);
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      buildings.setMatrixAt(i, dummy.matrix);
      tmpCol.setHex(palette[Math.floor(rng() * palette.length)]);
      buildings.setColorAt(i, tmpCol);

      // Street-level podium
      dummy.position.set(x, 0, z);
      dummy.scale.set(w * 1.16, 2.8, d * 1.16);
      dummy.updateMatrix();
      podiums.setMatrixAt(i, dummy.matrix);

      // Rooftop parapet rim
      dummy.position.set(x, h, z);
      dummy.scale.set(w * 1.04, 0.55, d * 1.04);
      dummy.updateMatrix();
      parapets.setMatrixAt(i, dummy.matrix);

      // Rooftop HVAC unit
      dummy.position.set(x + (rng() - 0.5) * w * 0.2, h + 0.55, z + (rng() - 0.5) * d * 0.2);
      dummy.scale.set(w * 0.42, 1.4, d * 0.42);
      dummy.updateMatrix();
      hvacs.setMatrixAt(i, dummy.matrix);
    }

    buildings.instanceMatrix.needsUpdate = true;
    if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
    podiums.instanceMatrix.needsUpdate = true;
    parapets.instanceMatrix.needsUpdate = true;
    hvacs.instanceMatrix.needsUpdate = true;

    scene.add(buildings);
    scene.add(podiums);
    scene.add(parapets);
    scene.add(hvacs);
  }

  function buildAuroraCurtains(THREE, scene, auroraMeshes) {
    const colors = [0x22d3ee, 0x34d399, 0xa855f7];
    for (let i = 0; i < 3; i += 1) {
      const geo = new THREE.PlaneGeometry(160, 26, 20, 4);
      const m = new THREE.MeshBasicMaterial({
        color: colors[i],
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ribbon = new THREE.Mesh(geo, m);
      ribbon.position.set(-20 + i * 25, 62 + i * 7, -110 - i * 18);
      ribbon.rotation.x = 0.35;
      ribbon.rotation.y = (i - 1) * 0.22;
      scene.add(ribbon);
      auroraMeshes.push(ribbon);
    }
  }

  function buildProvinceLandmarks(THREE, scene, province, scale, rng, state) {
    const id = province.id;
    const concreteTex = getConcreteTexture(THREE);
    const stoneTex = getStoneTexture(THREE);
    const woodTex = getWoodTexture(THREE);
    const waterBump = getWaterBumpTexture(THREE);

    if (id === 'ontario') {
      // CN Tower (0, 0, -55)
      const cn = new THREE.Group();
      cn.position.set(0, 0, -55);
      addCyl(THREE, cn, 2.2, 5.4, 46, 14, 0xdbe4ee, 0, 23, 0, { map: concreteTex, roughness: 0.75, castShadow: true });
      // Vertical structural buttress ribs
      for (let r = 0; r < 3; r += 1) {
        const ang = (r / 3) * Math.PI * 2;
        addBox(THREE, cn, 1.3, 42, 1.8, 0xcbd5e1, Math.sin(ang) * 3.1, 21, Math.cos(ang) * 3.1, { ry: ang, map: concreteTex });
      }
      // SkyPod & Main Observation Deck
      addCyl(THREE, cn, 6.4, 5.4, 4.4, 24, 0xe2e8f0, 0, 46, 0, { map: concreteTex, metalness: 0.25, castShadow: true });
      addCyl(THREE, cn, 6.0, 6.0, 1.6, 24, 0x38bdf8, 0, 46.2, 0, { roughness: 0.15, metalness: 0.7, emissive: 0x0ea5e9, emissiveIntensity: 0.45 });
      addCyl(THREE, cn, 2.5, 2.8, 2.4, 16, 0x94a3b8, 0, 54.5, 0, { metalness: 0.5 });
      addCyl(THREE, cn, 0.35, 1.6, 18, 10, 0xf1f5f9, 0, 58, 0, { metalness: 0.65, roughness: 0.3 });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 10), mat(THREE, 0xff2244, { emissive: 0xff2244, emissiveIntensity: 1.6 }));
      beacon.position.set(0, 67.5, 0);
      cn.add(beacon);
      state.beaconMeshes.push(beacon);
      scene.add(cn);

      // Rogers-style Dome (-42, 0, -42)
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(12, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat(THREE, 0xdbeafe, { map: concreteTex, roughness: 0.38, metalness: 0.32 })
      );
      dome.position.set(-42, 0, -42);
      scene.add(dome);
      addCyl(THREE, scene, 12.6, 13.2, 3.6, 24, 0x334155, -42, 1.8, -42, { map: concreteTex, metalness: 0.35 });

      // Niagara Falls (78, 0, 52) with rocky gorge, scrolling water & animated mist spray
      addBox(THREE, scene, 28, 12, 16, 0x475569, 78, 6, 44, { map: stoneTex, roughness: 0.9 });
      const falls = addBox(THREE, scene, 21, 12.2, 2.6, 0x7dd3fc, 78, 6, 52, {
        bumpMap: waterBump,
        bumpScale: 0.25,
        roughness: 0.2,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.84
      });
      // Mist spray particles at base of Niagara Falls (pre-allocated buffer)
      const mistCount = Math.round(90 * scale);
      const mistPos = new Float32Array(mistCount * 3);
      const mistBase = new Float32Array(mistCount * 3);
      for (let i = 0; i < mistCount; i += 1) {
        const mx = 78 + (rng() - 0.5) * 22;
        const my = 0.5 + rng() * 6.5;
        const mz = 53 + rng() * 5.5;
        mistPos[i * 3] = mx;
        mistPos[i * 3 + 1] = my;
        mistPos[i * 3 + 2] = mz;
        mistBase[i * 3] = mx;
        mistBase[i * 3 + 1] = my;
        mistBase[i * 3 + 2] = mz;
      }
      const mistGeo = new THREE.BufferGeometry();
      mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
      const mistMat = new THREE.PointsMaterial({
        size: 4.8,
        map: getMistSpriteTexture(THREE),
        transparent: true,
        opacity: 0.58,
        depthWrite: false
      });
      const mistPoints = new THREE.Points(mistGeo, mistMat);
      scene.add(mistPoints);

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

      buildInstancedSkyline(THREE, scene, Math.round(28 * scale), -24, -68, 75, 26, rng, state);
    } else if (id === 'quebec') {
      // Château Frontenac (0, 10, -58)
      addBox(THREE, scene, 44, 10, 26, 0x57534e, 0, 5, -58, { map: stoneTex, roughness: 0.92 });
      const ch = new THREE.Group();
      ch.position.set(0, 10, -58);
      addBox(THREE, ch, 22, 14, 14, 0x9a3412, 0, 7, 0, { map: stoneTex, castShadow: true });
      addBox(THREE, ch, 9, 22, 9, 0xb45309, 0, 11, 0, { map: stoneTex, castShadow: true });
      addCone(THREE, ch, 6.2, 11, 8, 0x2dd4bf, 0, 27.5, 0, { metalness: 0.35, roughness: 0.45 });
      addCyl(THREE, ch, 3.2, 3.2, 16, 10, 0x9a3412, -11, 8, 5, { map: stoneTex });
      addCone(THREE, ch, 3.6, 8, 8, 0x2dd4bf, -11, 20, 5, { metalness: 0.35, roughness: 0.45 });
      addCyl(THREE, ch, 3.2, 3.2, 16, 10, 0x9a3412, 11, 8, 5, { map: stoneTex });
      addCone(THREE, ch, 3.6, 8, 8, 0x2dd4bf, 11, 20, 5, { metalness: 0.35, roughness: 0.45 });
      scene.add(ch);

      // Montreal Inclined Tower (-72, 0, 44)
      addBox(THREE, scene, 4.5, 34, 4.5, 0xe2e8f0, -72, 15, 44, { map: concreteTex, rz: -0.45, castShadow: true });
      addCyl(THREE, scene, 12, 14, 4, 20, 0x475569, -62, 2, 44, { map: concreteTex });
      buildInstancedSkyline(THREE, scene, Math.round(22 * scale), 54, -46, 55, 18, rng, state);
    } else if (id === 'british-columbia') {
      // Canada Place Sails (-18, 0, -48)
      addBox(THREE, scene, 26, 3, 12, 0x334155, -18, 1.5, -48, { map: concreteTex });
      for (let i = 0; i < 5; i += 1) {
        addCone(THREE, scene, 2.8, 11, 4, 0xf8fafc, -26 + i * 4.2, 8.5, -48, { roughness: 0.45, castShadow: true });
      }
      // Lions Gate Bridge (62, 0, -18) with suspension cables
      addBox(THREE, scene, 56, 1.8, 5, 0x10b981, 62, 11, -18, { metalness: 0.55, roughness: 0.35 });
      addBox(THREE, scene, 2, 24, 5, 0x059669, 44, 12, -18, { metalness: 0.6, roughness: 0.35 });
      addBox(THREE, scene, 2, 24, 5, 0x059669, 80, 12, -18, { metalness: 0.6, roughness: 0.35 });
      addBox(THREE, scene, 20, 0.25, 0.25, 0x34d399, 34, 18, -18, { rz: 0.48, metalness: 0.7 });
      addBox(THREE, scene, 20, 0.25, 0.25, 0x34d399, 90, 18, -18, { rz: -0.48, metalness: 0.7 });

      buildInstancedMountains(THREE, scene, Math.round(24 * scale), 150, -96, 54, true, rng);
      buildInstancedSkyline(THREE, scene, Math.round(20 * scale), -36, -68, 50, 22, rng, state);
    } else if (id === 'alberta') {
      // Calgary Tower (0, 0, -52)
      addCyl(THREE, scene, 2.0, 2.9, 36, 14, 0xdbeafe, 0, 18, -52, { map: concreteTex, castShadow: true });
      addCyl(THREE, scene, 4.6, 3.8, 3.2, 18, 0xf59e0b, 0, 36, -52, { metalness: 0.45, roughness: 0.25, emissive: 0xd97706, emissiveIntensity: 0.35 });
      addCyl(THREE, scene, 0.3, 0.8, 9, 8, 0xffffff, 0, 42, -52, { metalness: 0.7 });
      buildInstancedSkyline(THREE, scene, Math.round(20 * scale), 0, -64, 54, 24, rng, state);

      // Banff Rockies & Lake Louise turquoise basin (68, 0, -68)
      buildInstancedMountains(THREE, scene, Math.round(26 * scale), 160, -96, 62, true, rng);
      const louise = new THREE.Mesh(
        new THREE.CircleGeometry(18, 28),
        mat(THREE, 0x14b8a6, { roughness: 0.12, metalness: 0.4, bumpMap: waterBump, bumpScale: 0.14, emissive: 0x0d9488, emissiveIntensity: 0.15 })
      );
      louise.rotation.x = -Math.PI / 2;
      louise.position.set(68, 0.12, -68);
      scene.add(louise);
    } else if (id === 'national-capital') {
      // Parliament Hill & Peace Tower (0, 0, -56)
      addBox(THREE, scene, 36, 11, 14, 0xd6d3d1, 0, 5.5, -56, { map: stoneTex, roughness: 0.85, castShadow: true });
      addBox(THREE, scene, 37, 2.5, 15, 0x2dd4bf, 0, 12.2, -56, { metalness: 0.35, roughness: 0.45 });
      addBox(THREE, scene, 6.2, 32, 6.2, 0xe7e5e4, 0, 16, -50, { map: stoneTex, roughness: 0.85, castShadow: true });
      addCone(THREE, scene, 4.4, 9, 4, 0x2dd4bf, 0, 36.5, -50, { metalness: 0.35, roughness: 0.45 });
      addBox(THREE, scene, 2.6, 2.6, 0.4, 0xfef08a, 0, 26, -46.8, { emissive: 0xfacc15, emissiveIntensity: 0.7 });

      // Rideau Canal waterway (46, 0, -16)
      addBox(THREE, scene, 12, 0.18, 120, 0x1e6b8a, 46, 0.1, -16, { bumpMap: waterBump, roughness: 0.14, metalness: 0.42 });
      // Alexandra Bridge (-58, 0, -44)
      addBox(THREE, scene, 42, 1.5, 4.5, 0x64748b, -58, 8, -44, { metalness: 0.6, roughness: 0.4 });
      addBox(THREE, scene, 42, 2.4, 0.35, 0x475569, -58, 9.8, -42, { metalness: 0.65 });
      addBox(THREE, scene, 1.5, 9, 4.5, 0x475569, -70, 4.5, -44, { map: stoneTex });
      addBox(THREE, scene, 1.5, 9, 4.5, 0x475569, -46, 4.5, -44, { map: stoneTex });
    } else if (id === 'nova-scotia') {
      // Peggy's Cove Lighthouse (0, 4, -52)
      addCyl(THREE, scene, 9, 13, 4.5, 9, 0x64748b, 0, 2.25, -52, { map: stoneTex, roughness: 0.92 });
      addCyl(THREE, scene, 2.2, 3.6, 16, 10, 0xf8fafc, 0, 12, -52, { map: concreteTex, castShadow: true });
      addCyl(THREE, scene, 2.4, 2.4, 3.2, 10, 0xef4444, 0, 21.6, -52, { metalness: 0.35, roughness: 0.35 });
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), mat(THREE, 0xfef08a, { emissive: 0xfde047, emissiveIntensity: 1.8 }));
      lamp.position.set(0, 23.8, -52);
      scene.add(lamp);
      state.beaconMeshes.push(lamp);

      const bCount = Math.round(65 * scale);
      const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(2.4, 0), mat(THREE, 0x6b7280, { map: stoneTex, roughness: 0.9 }), bCount);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < bCount; i += 1) {
        dummy.position.set(-70 + rng() * 140, 0.6, -65 + rng() * 60);
        dummy.scale.set(0.8 + rng() * 1.8, 0.5 + rng() * 0.9, 0.8 + rng() * 1.6);
        dummy.rotation.set(rng(), rng(), rng());
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);
      }
      rocks.instanceMatrix.needsUpdate = true;
      scene.add(rocks);
    } else if (id === 'newfoundland') {
      // Signal Hill & Cabot Tower (0, 12, -56)
      addCyl(THREE, scene, 14, 22, 12, 10, 0x4b5563, 0, 6, -56, { map: stoneTex, roughness: 0.92 });
      addBox(THREE, scene, 8, 12, 8, 0x9a3412, 0, 18, -56, { map: stoneTex, castShadow: true });
      addBox(THREE, scene, 4.5, 6, 4.5, 0x7c2d12, 0, 27, -56, { map: stoneTex });

      // Jellybean Row (-52, 0, -18)
      const jelly = [0xef4444, 0xfacc15, 0x3b82f6, 0x10b981, 0xf97316, 0xa855f7];
      for (let i = 0; i < 6; i += 1) {
        const h = 7.5 + (i % 2) * 1.5;
        addBox(THREE, scene, 5.2, h, 6, jelly[i], -66 + i * 5.6, h * 0.5, -18, { map: woodTex, castShadow: true });
        addCone(THREE, scene, 4.0, 2.6, 4, 0x334155, -66 + i * 5.6, h + 1.3, -18);
      }

      // Drifting Tabular Atlantic Icebergs (66, 0, -48)
      const bergs = [];
      for (let i = 0; i < 4; i += 1) {
        const b = addBox(THREE, scene, 12 + i * 2, 8 + (i % 2) * 4, 10, 0xe0f2fe, 52 + i * 18, 3.5, -52 - i * 14, { roughness: 0.25, metalness: 0.15 });
        bergs.push(b);
      }
      state.animators.push(function (t) {
        for (let i = 0; i < bergs.length; i += 1) {
          bergs[i].position.y = 3.2 + Math.sin(t * 0.9 + i) * 0.35;
        }
      });
    } else if (id === 'new-brunswick') {
      // Hopewell Rocks Flowerpot Sea Stacks (0, 0, -52)
      const stacks = [[-14, -52], [0, -54], [14, -50], [26, -58]];
      for (let i = 0; i < stacks.length; i += 1) {
        const sx = stacks[i][0];
        const sz = stacks[i][1];
        addCyl(THREE, scene, 3.6, 2.2, 13, 9, 0xb45309, sx, 6.5, sz, { map: stoneTex, castShadow: true });
        addCone(THREE, scene, 3.2, 5.5, 7, 0x15803d, sx, 15.5, sz);
      }
      addBox(THREE, scene, 26, 16, 18, 0x9a3412, -56, 8, -34, { map: stoneTex });
      addBox(THREE, scene, 40, 1.8, 5, 0x64748b, 64, 10, 28, { metalness: 0.5 });
      addCyl(THREE, scene, 1.5, 1.5, 12, 8, 0x475569, 48, 6, 28, { map: concreteTex });
      addCyl(THREE, scene, 1.5, 1.5, 12, 8, 0x475569, 80, 6, 28, { map: concreteTex });
    } else if (id === 'prince-edward-island') {
      // Curved Multi-Span Confederation Bridge (20, 0, -58)
      for (let i = 0; i < 9; i += 1) {
        const bx = -20 + i * 11;
        const bz = -58 - Math.sin(i * 0.35) * 10;
        addBox(THREE, scene, 12, 1.6, 4.5, 0xe2e8f0, bx, 10, bz, { map: concreteTex, ry: Math.cos(i * 0.35) * 0.15 });
        addCyl(THREE, scene, 1.1, 1.6, 10, 8, 0xcbd5e1, bx, 5, bz, { map: concreteTex });
      }
      addBox(THREE, scene, 12, 6, 9, 0xf8fafc, -52, 3, 22, { map: woodTex, castShadow: true });
      addCone(THREE, scene, 8.5, 5, 4, 0x15803d, -52, 8.5, 22);
      addBox(THREE, scene, 22, 6, 14, 0xb91c1c, -64, 3, -32, { map: stoneTex });
      addCyl(THREE, scene, 1.8, 2.6, 12, 12, 0xf8fafc, -64, 12, -32, { map: concreteTex });
      addCyl(THREE, scene, 2.0, 2.0, 2.2, 12, 0xef4444, -64, 19, -32);
    } else if (id === 'manitoba') {
      // Canadian Museum for Human Rights (0, 0, -54)
      addBox(THREE, scene, 22, 10, 14, 0x94a3b8, 0, 5, -54, { map: stoneTex, castShadow: true });
      addCone(THREE, scene, 5, 28, 8, 0x38bdf8, 0, 19, -54, { roughness: 0.15, metalness: 0.7, transparent: true, opacity: 0.82, emissive: 0x0284c7, emissiveIntensity: 0.25 });
      addBox(THREE, scene, 14, 0.16, 80, 0x1d5f82, 36, 0.1, -24, { ry: 0.35, bumpMap: waterBump, roughness: 0.15, metalness: 0.42 });
      buildAuroraCurtains(THREE, scene, state.auroraMeshes);
    } else if (id === 'saskatchewan') {
      // Regina Legislative Dome (0, 0, -56)
      addBox(THREE, scene, 32, 10, 12, 0xe7e5e4, 0, 5, -56, { map: stoneTex, castShadow: true });
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(5.5, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        mat(THREE, 0x2dd4bf, { metalness: 0.35, roughness: 0.4 })
      );
      dome.position.set(0, 10, -56);
      scene.add(dome);
      addCyl(THREE, scene, 2.2, 2.2, 6, 12, 0xd6d3d1, 0, 12, -56, { map: stoneTex });

      // Grain Elevators (-54, 0, -24)
      for (let i = 0; i < 3; i += 1) {
        addBox(THREE, scene, 6.5, 18, 6.5, 0xb91c1c, -62 + i * 9, 9, -24, { map: woodTex, castShadow: true });
        addCone(THREE, scene, 4.6, 4.5, 4, 0x7f1d1d, -62 + i * 9, 20.25, -24);
      }
      const wascana = new THREE.Mesh(
        new THREE.CircleGeometry(22, 28),
        mat(THREE, 0x1e6b8a, { bumpMap: waterBump, roughness: 0.15, metalness: 0.42 })
      );
      wascana.rotation.x = -Math.PI / 2;
      wascana.position.set(58, 0.1, 26);
      scene.add(wascana);
    } else if (id === 'yukon') {
      // SS Klondike Sternwheeler (18, 0, -42)
      addBox(THREE, scene, 22, 4, 7, 0xf8fafc, 18, 2, -42, { map: woodTex, castShadow: true });
      addBox(THREE, scene, 15, 3.5, 5.5, 0xe2e8f0, 18, 5.75, -42, { map: woodTex });
      const wheel = addCyl(THREE, scene, 2.6, 2.6, 4.8, 12, 0xef4444, 30, 3, -42, { rx: Math.PI / 2 });
      state.animators.push(function (t) { wheel.rotation.y = t * 1.4; });

      for (let i = 0; i < 4; i += 1) {
        addBox(THREE, scene, 6, 7, 7, 0x92400e, -62 + i * 7.5, 3.5, 24, { map: woodTex });
      }
      buildInstancedMountains(THREE, scene, Math.round(24 * scale), 160, -98, 68, true, rng);
    } else if (id === 'northwest-territories') {
      // Diamond Mine Headframe (-58, 0, -56)
      addBox(THREE, scene, 10, 24, 10, 0x475569, -58, 12, -56, { metalness: 0.55, roughness: 0.4, castShadow: true });
      addCyl(THREE, scene, 4.5, 4.5, 2, 16, 0x38bdf8, -58, 24.5, -56, { emissive: 0x0284c7, emissiveIntensity: 0.5 });
      buildAuroraCurtains(THREE, scene, state.auroraMeshes);
    } else if (id === 'nunavut') {
      // Monumental Inuksuk (0, 0, -50)
      addBox(THREE, scene, 3.2, 6.5, 2.2, 0x64748b, -2.5, 3.25, -50, { map: stoneTex, roughness: 0.92, castShadow: true });
      addBox(THREE, scene, 3.2, 6.5, 2.2, 0x64748b, 2.5, 3.25, -50, { map: stoneTex, roughness: 0.92, castShadow: true });
      addBox(THREE, scene, 10.5, 2.6, 2.8, 0x94a3b8, 0, 7.8, -50, { map: stoneTex, roughness: 0.92, castShadow: true });
      addBox(THREE, scene, 5.5, 4.2, 2.6, 0x64748b, 0, 11.2, -50, { map: stoneTex, roughness: 0.92, castShadow: true });
      addBox(THREE, scene, 3.4, 3.2, 2.4, 0x94a3b8, 0, 14.9, -50, { map: stoneTex, roughness: 0.92, castShadow: true });

      for (let i = 0; i < 8; i += 1) {
        addBox(THREE, scene, 11 + rng() * 8, 0.7, 9 + rng() * 6, 0xdbeafe, 42 + (i % 4) * 14, 0.1, -20 - Math.floor(i / 4) * 18, { roughness: 0.25 });
      }
      buildInstancedMountains(THREE, scene, Math.round(20 * scale), 150, -96, 56, true, rng);
      buildAuroraCurtains(THREE, scene, state.auroraMeshes);
    }
  }

  function buildLandmarkMarkers(THREE, scene, province, state) {
    const accent = new THREE.Color(province.climate.accent);
    for (let i = 0; i < province.landmarks.length; i += 1) {
      const lm = province.landmarks[i];
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.6, 3.2, 28),
        new THREE.MeshBasicMaterial({ color: accent, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(lm.coords[0], 0.18, lm.coords[2]);
      scene.add(ring);

      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 16, 8),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.28 })
      );
      pillar.position.set(lm.coords[0], 8, lm.coords[2]);
      scene.add(pillar);

      state.landmarkMarkers.push({ id: lm.id, ring, pillar });
    }
  }

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
    buildProvinceLandmarks(THREE, scene, province, scale, rng, state);
    buildLandmarkMarkers(THREE, scene, province, state);

    return {
      scene: scene,
      fogDensityBase: state.lights.fogDensityBase,
      lights: state.lights,
      waterMesh: state.waterMesh,
      auroraMeshes: state.auroraMeshes,
      beaconMeshes: state.beaconMeshes,
      landmarkMarkers: state.landmarkMarkers,
      emissiveTargets: {
        streetlightMat: state.streetlightMat,
        buildingMat: state.buildingMat
      },
      update: function (elapsed) {
        if (state.lights && state.lights.skyMat && state.lights.skyMat.uniforms && state.lights.skyMat.uniforms.uTime) {
          state.lights.skyMat.uniforms.uTime.value = elapsed;
        }
        if (state.waterBump) {
          state.waterBump.offset.x = (elapsed * 0.025) % 1;
          state.waterBump.offset.y = (elapsed * 0.015) % 1;
        }
        for (let i = 0; i < state.animators.length; i += 1) {
          state.animators[i](elapsed);
        }
        for (let i = 0; i < state.auroraMeshes.length; i += 1) {
          const a = state.auroraMeshes[i];
          a.position.x = (-20 + i * 25) + Math.sin(elapsed * 0.35 + i) * 6;
          a.material.opacity = 0.18 + Math.sin(elapsed * 0.9 + i * 1.3) * 0.08;
        }
        for (let i = 0; i < state.beaconMeshes.length; i += 1) {
          state.beaconMeshes[i].material.emissiveIntensity = 1.0 + Math.sin(elapsed * 3.2) * 0.65;
        }
      }
    };
  }

  global.CanadaLandmarks = {
    buildProvinceWorld: buildProvinceWorld
  };
})(typeof window !== 'undefined' ? window : globalThis);
