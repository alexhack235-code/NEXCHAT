/**
 * Canada Landmarks & Procedural Biome Builder (Three.js r128)
 * Exposes `window.CanadaLandmarks.buildProvinceWorld(scene, province, qualityTier)`
 * Uses cached procedural CanvasTextures, shared BufferGeometries, and InstancedMesh
 * for 60 FPS performance with zero per-frame allocations.
 *
 * Full 1000-metre Trans-Canada Highway corridor (z ∈ [-500, +500], terrain width 520m).
 * Dense roadside biomes, overhead Trans-Canada highway gantry signs spanning across the road,
 * roadside signage, curbs/guardrails/streetlights across z ∈ [-490, +490], stepped-back city
 * architecture (|x| >= 16) preserving camera clearance, functional buildings at x = ±8.2, z ∈ [2, 28],
 * and distinct real-life Canadian architecture & scenery for all 14 provinces and territories.
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
    if (qualityTier === 'balanced') return 0.75;
    return 1.0;
  }

  function getCachedTexture(THREE, key, size, drawFn, opts) {
    if (TEX_CACHE[key]) return TEX_CACHE[key];
    const o = opts || {};
    const canvas = document.createElement('canvas');
    if (typeof size === 'number') {
      canvas.width = size;
      canvas.height = size;
    } else {
      canvas.width = size.w || 256;
      canvas.height = size.h || 256;
    }
    const ctx = canvas.getContext('2d');
    drawFn(ctx, canvas.width, canvas.height);
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
      for (let i = 0; i < 2600; i += 1) {
        const x = rng() * s, y = rng() * s, r = 1 + rng() * (isSnow ? 4.8 : 3.4), v = rng();
        if (isSnow) ctx.fillStyle = v > 0.78 ? 'rgba(203,213,225,0.32)' : (v > 0.35 ? 'rgba(255,255,255,0.38)' : 'rgba(148,163,184,0.22)');
        else if (isShield) ctx.fillStyle = v > 0.7 ? 'rgba(100,116,139,0.30)' : (v > 0.35 ? 'rgba(74,107,68,0.32)' : 'rgba(180,165,160,0.24)');
        else if (isRed) ctx.fillStyle = v > 0.65 ? 'rgba(185,28,28,0.28)' : (v > 0.3 ? 'rgba(180,83,9,0.28)' : 'rgba(217,119,6,0.18)');
        else if (isPrairie) ctx.fillStyle = v > 0.65 ? 'rgba(161,132,48,0.28)' : (v > 0.3 ? 'rgba(84,122,58,0.26)' : 'rgba(120,96,48,0.20)');
        else ctx.fillStyle = v > 0.68 ? 'rgba(34,84,45,0.30)' : (v > 0.32 ? 'rgba(82,128,64,0.25)' : 'rgba(78,64,46,0.20)');
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = isSnow ? 'rgba(255,255,255,0.18)' : 'rgba(20,40,20,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 480; i += 1) {
        const x = rng() * s, y = rng() * s;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rng() - 0.5) * 6, y - 2 - rng() * 5); ctx.stroke();
      }
    }, { rx: 28, ry: 28, srgb: true });

    const bump = getCachedTexture(THREE, keyBase + '_bump', 256, function (ctx, s) {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
      const bRng = mulberry32(hashString(keyBase + '_b'));
      for (let i = 0; i < 2400; i += 1) {
        const shade = Math.floor(85 + bRng() * 90);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        ctx.fillRect(bRng() * s, bRng() * s, 2 + bRng() * 3, 2 + bRng() * 3);
      }
    }, { rx: 28, ry: 28, srgb: false });
    return { map, bump };
  }

  function getRoadTextures(THREE, isIceRoad, isPackedSnow) {
    let key = 'road_asphalt';
    if (isPackedSnow) key = 'road_packed_snow';
    else if (isIceRoad) key = 'road_ice';

    const rng = mulberry32(hashString(key));
    const map = getCachedTexture(THREE, key + '_diff', 256, function (ctx, s) {
      if (isPackedSnow) {
        // Nunavut packed polar snow & hardpack ice trail
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 3800; i += 1) {
          const x = rng() * s, y = rng() * s, v = rng();
          ctx.fillStyle = v > 0.6 ? 'rgba(241,245,249,0.55)' : (v > 0.3 ? 'rgba(186,230,253,0.35)' : 'rgba(148,163,184,0.30)');
          ctx.fillRect(x, y, 2, 2);
        }
        // Packed snow tyre tracks
        const trackL = ctx.createLinearGradient(s * 0.16, 0, s * 0.44, 0);
        trackL.addColorStop(0, 'rgba(0,0,0,0)');
        trackL.addColorStop(0.5, 'rgba(100,116,139,0.32)');
        trackL.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = trackL; ctx.fillRect(s * 0.16, 0, s * 0.28, s);

        const trackR = ctx.createLinearGradient(s * 0.56, 0, s * 0.84, 0);
        trackR.addColorStop(0, 'rgba(0,0,0,0)');
        trackR.addColorStop(0.5, 'rgba(100,116,139,0.32)');
        trackR.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = trackR; ctx.fillRect(s * 0.56, 0, s * 0.28, s);

        // Cyan-white ice track edges
        ctx.fillStyle = 'rgba(224,242,254,0.7)';
        ctx.fillRect(s * 0.045, 0, s * 0.03, s);
        ctx.fillRect(s * 0.925, 0, s * 0.03, s);
      } else if (isIceRoad) {
        // NWT Great Slave Lake winter ice road
        ctx.fillStyle = '#9ec5de';
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 3600; i += 1) {
          const x = rng() * s, y = rng() * s, v = rng();
          ctx.fillStyle = v > 0.5 ? 'rgba(224,242,254,0.32)' : 'rgba(125,175,205,0.26)';
          ctx.fillRect(x, y, 1.5, 1.5);
        }
        const trackGradL = ctx.createLinearGradient(s * 0.18, 0, s * 0.42, 0);
        trackGradL.addColorStop(0, 'rgba(0,0,0,0)');
        trackGradL.addColorStop(0.5, 'rgba(186,230,253,0.30)');
        trackGradL.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = trackGradL; ctx.fillRect(s * 0.18, 0, s * 0.24, s);

        const trackGradR = ctx.createLinearGradient(s * 0.58, 0, s * 0.82, 0);
        trackGradR.addColorStop(0, 'rgba(0,0,0,0)');
        trackGradR.addColorStop(0.5, 'rgba(186,230,253,0.30)');
        trackGradR.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = trackGradR; ctx.fillRect(s * 0.58, 0, s * 0.24, s);

        ctx.fillStyle = 'rgba(224,242,254,0.75)';
        ctx.fillRect(s * 0.045, 0, s * 0.022, s);
        ctx.fillRect(s * 0.933, 0, s * 0.022, s);
      } else {
        // Heavy-duty Trans-Canada asphalt
        ctx.fillStyle = '#262b33';
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 3600; i += 1) {
          const x = rng() * s, y = rng() * s, v = rng();
          ctx.fillStyle = v > 0.55 ? 'rgba(71,85,105,0.28)' : 'rgba(15,23,42,0.34)';
          ctx.fillRect(x, y, 1.5, 1.5);
        }
        const trackGradL = ctx.createLinearGradient(s * 0.18, 0, s * 0.42, 0);
        trackGradL.addColorStop(0, 'rgba(0,0,0,0)');
        trackGradL.addColorStop(0.5, 'rgba(12,16,22,0.32)');
        trackGradL.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = trackGradL; ctx.fillRect(s * 0.18, 0, s * 0.24, s);

        const trackGradR = ctx.createLinearGradient(s * 0.58, 0, s * 0.82, 0);
        trackGradR.addColorStop(0, 'rgba(0,0,0,0)');
        trackGradR.addColorStop(0.5, 'rgba(12,16,22,0.32)');
        trackGradR.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = trackGradR; ctx.fillRect(s * 0.58, 0, s * 0.24, s);

        ctx.fillStyle = 'rgba(241,245,249,0.78)';
        ctx.fillRect(s * 0.045, 0, s * 0.022, s);
        ctx.fillRect(s * 0.933, 0, s * 0.022, s);
      }
    }, { rx: 1, ry: 75, srgb: true });

    const bump = getCachedTexture(THREE, key + '_bump', 256, function (ctx, s) {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
      const bRng = mulberry32(hashString(key + '_b'));
      for (let i = 0; i < 3000; i += 1) {
        const shade = Math.floor(95 + bRng() * 75);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        ctx.fillRect(bRng() * s, bRng() * s, 1.5, 1.5);
      }
    }, { rx: 1, ry: 75, srgb: false });
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
    }, { rx: 18, ry: 9, srgb: false });
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

  function getPinkGraniteTexture(THREE) {
    return getCachedTexture(THREE, 'pink_granite_diff', 256, function (ctx, s) {
      ctx.fillStyle = '#9e807c'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(8821);
      for (let i = 0; i < 2800; i += 1) {
        const v = rng();
        if (v > 0.6) ctx.fillStyle = 'rgba(214,148,136,0.38)';
        else if (v > 0.3) ctx.fillStyle = 'rgba(74,68,70,0.35)';
        else ctx.fillStyle = 'rgba(240,210,205,0.28)';
        ctx.fillRect(rng() * s, rng() * s, 2 + rng() * 3, 2 + rng() * 2);
      }
      ctx.strokeStyle = 'rgba(50,40,42,0.45)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 18; i += 1) {
        const y0 = rng() * s;
        ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(s, y0 + (rng() - 0.5) * 30); ctx.stroke();
      }
    }, { rx: 3, ry: 3, srgb: true });
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

  function getFoliageTexture(THREE, foliageType) {
    const key = 'foliage_' + (foliageType || 'conifer');
    return getCachedTexture(THREE, key, 128, function (ctx, s) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s);
      const rng = mulberry32(hashString(key));
      for (let i = 0; i < 900; i += 1) {
        const shade = Math.floor(175 + rng() * 80);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        if (foliageType === 'conifer' || foliageType === 'pine') {
          const x = rng() * s, y = rng() * s; ctx.fillRect(x, y, 2, 5);
        } else {
          ctx.beginPath(); ctx.arc(rng() * s, rng() * s, 2 + rng() * 3.5, 0, Math.PI * 2); ctx.fill();
        }
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

  // ─── Canadian Overhead Gantry Sign Texture (Large Green Trans-Canada Sign) ───

  function getOverheadGantrySignTexture(THREE, destText, subText, routeCode, exitText) {
    const key = 'gantry_' + destText + '_' + (routeCode || 'TCH1') + '_' + (exitText || '');
    return getCachedTexture(THREE, key, { w: 512, h: 256 }, function (ctx, w, h) {
      // Canadian Highway green background
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 0, w, h);

      // White reflective outer border
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Inner thin border
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, w - 36, h - 36);

      // Route Shield on the left
      const shieldW = 90, shieldH = 100, sx = 28, sy = 28;
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(sx, sy, shieldW, shieldH, 12) : ctx.rect(sx, sy, shieldW, shieldH);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Maple Leaf symbol & route code
      ctx.fillStyle = '#dc2626';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u{1F341}', sx + shieldW * 0.5, sy + 36);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(routeCode || '1', sx + shieldW * 0.5, sy + 74);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('TRANS-CANADA', sx + shieldW * 0.5, sy + 92);

      // Exit / Header badge (if present)
      if (exitText) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(w - 140, 18, 120, 32);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(exitText, w - 80, 40);
      }

      // Destination in clean bold highway typography
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.font = 'bold 36px sans-serif';
      const parts = destText.split('/');
      ctx.fillText(parts[0].trim(), 135, exitText ? 82 : 72);
      if (parts[1]) {
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#f1f5f9';
        ctx.fillText(parts[1].trim(), 135, exitText ? 124 : 116);
      }

      // Sub-text / distance indicator with white arrow
      if (subText) {
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(subText, 135, h - 54);
      }

      // Action line / lane indicator
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(135, h - 34); ctx.lineTo(w - 38, h - 34);
      ctx.stroke();

      // White lane arrows at bottom
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2193   THRU TRAFFIC   \u2193', (w + 135) * 0.5, h - 14);
    }, { srgb: true });
  }

  // Canadian Highway sign texture (ground mounted)
  function getHighwaySignTexture(THREE, destText, subText) {
    const key = 'hwy_sign_' + destText;
    return getCachedTexture(THREE, key, 256, function (ctx, s) {
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, s - 12, s - 12);
      // Maple leaf shield
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(s * 0.35, 10, s * 0.3, s * 0.28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TCH', s * 0.5, 42);
      ctx.font = '22px sans-serif';
      ctx.fillText('\u{1F341}', s * 0.5, 70);
      // Destination text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      const words = destText.split('/');
      ctx.fillText(words[0].trim(), s * 0.5, s * 0.60);
      if (words[1]) ctx.fillText(words[1].trim(), s * 0.5, s * 0.76);
      if (subText) {
        ctx.font = '17px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
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

  // Railway Crossing Crossbuck Texture
  function getRailwayCrossbuckTexture(THREE) {
    return getCachedTexture(THREE, 'railway_crossbuck', 128, function (ctx, s) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 5; ctx.strokeRect(2, 2, s - 4, s - 4);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('RAILWAY', s * 0.5, 52);
      ctx.fillText('CROSSING', s * 0.5, 82);
    }, { srgb: true });
  }

  // Avalanche Hazard portal warning stripes (yellow/black diagonal chevron)
  function getHazardStripesTexture(THREE) {
    return getCachedTexture(THREE, 'hazard_stripes_yb', 128, function (ctx, s) {
      ctx.fillStyle = '#facc15'; ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#0f172a';
      const stripeW = 24;
      for (let x = -s; x < s * 2; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x + stripeW, 0); ctx.lineTo(x + stripeW - s, s); ctx.lineTo(x - s, s); ctx.closePath();
        ctx.fill();
      }
    }, { rx: 4, ry: 1, srgb: true });
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
    if (opts && opts.ry) mesh.rotation.y = opts.ry;
    if (opts && opts.rz) mesh.rotation.z = opts.rz;
    if (opts && opts.castShadow) mesh.castShadow = true;
    if (opts && opts.receiveShadow) mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCone(THREE, parent, r, h, seg, color, x, y, z, opts) {
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(THREE, color, opts));
    mesh.position.set(x, y, z);
    if (opts && opts.rx) mesh.rotation.x = opts.rx;
    if (opts && opts.ry) mesh.rotation.y = opts.ry;
    if (opts && opts.rz) mesh.rotation.z = opts.rz;
    if (opts && opts.castShadow) mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // ─── Sky & Lighting ───────────────────────────────────────────────────────

  function buildSkyAndLighting(THREE, scene, province, qualityTier) {
    const c = province.climate;
    const fogDensityBase = qualityTier === 'battery' ? 0.0034 : 0.0019;
    scene.background = new THREE.Color(c.skyHorizon);
    scene.fog = new THREE.FogExp2(c.fogColor, fogDensityBase);

    const hemi = new THREE.HemisphereLight(c.skyTop, c.groundColor, 0.74);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(c.sunColor, 1.25);
    sun.position.set(90, 130, 65);
    if (qualityTier !== 'battery') {
      sun.castShadow = true;
      sun.shadow.mapSize.width = qualityTier === 'ultra' ? 2048 : 1024;
      sun.shadow.mapSize.height = qualityTier === 'ultra' ? 2048 : 1024;
      sun.shadow.camera.near = 10;
      sun.shadow.camera.far = 600;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.03;
      const d = 260;
      sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
      sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    }
    scene.add(sun);

    const fill = new THREE.DirectionalLight(c.accent, 0.28);
    fill.position.set(-85, 45, -70);
    scene.add(fill);

    // Atmospheric gradient sky dome
    const skyGeo = new THREE.SphereGeometry(520, 32, 20);
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

  // ─── Ground & 1000m Highway Corridor ─────────────────────────────────────

  function buildGroundAndHighway(THREE, scene, province, scale) {
    const c = province.climate;
    const biome = province.biome;
    const isNunavut = province.id === 'nunavut';
    const isNWT = province.id === 'northwest-territories';
    const isIceRoad = isNWT;
    const isPackedSnow = isNunavut;

    // Full 1000m corridor terrain: 520m wide, 1040m long (z: -520 to +520)
    const groundGeo = new THREE.PlaneGeometry(520, 1040, 96, 192);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const baseCol = new THREE.Color(c.groundColor);
    const rockCol = new THREE.Color(biome === 'red-sand-island' || biome === 'fundy-coast' ? 0x9a4a2a : (province.id === 'ontario' ? 0x9e807c : 0x64748b));
    const peakCol = new THREE.Color(biome === 'arctic-tundra' || biome === 'klondike-glacier' || biome === 'rockies-foothills' ? 0xe2e8f0 : 0x4b5d44);
    const tmpCol = new THREE.Color();

    const isFlat = biome === 'living-skies-wheat' || biome === 'prairie-lake';
    const amp = isFlat ? 0.7 : (biome === 'pacific-fjord' || biome === 'rockies-foothills' ? 3.6 : 2.5);
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i), z = pos.getZ(i);
      const distFromRoad = Math.abs(x);
      let y = 0;
      if (distFromRoad > 15 && Math.abs(z) > 10) {
        const hill = Math.sin(x * 0.032) * Math.cos(z * 0.032) * amp + Math.sin((x + z) * 0.016) * amp * 0.6;
        y = Math.max(-0.4, hill * Math.min(1, (distFromRoad - 15) / 22));
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

    // ── Full 1000m road (z: -500 to +500) ──
    const roadTex = getRoadTextures(THREE, isIceRoad, isPackedSnow);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(11.2, 1000),
      mat(THREE, 0xffffff, {
        map: roadTex.map, bumpMap: roadTex.bump, bumpScale: 0.08,
        roughness: isPackedSnow ? 0.45 : (isIceRoad ? 0.32 : 0.78),
        metalness: isPackedSnow ? 0.12 : (isIceRoad ? 0.22 : 0.06)
      })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.05;
    road.receiveShadow = true;
    scene.add(road);

    // Centre dashed line across full 1000m (100 dashes from z = -495 to +495)
    const dashCount = 100;
    const dashGeo = new THREE.PlaneGeometry(0.28, 4.5);
    dashGeo.rotateX(-Math.PI / 2);
    const dashColor = isPackedSnow ? 0x7dd3fc : (isIceRoad ? 0x38bdf8 : 0xfbbf24);
    const dashMat = new THREE.MeshBasicMaterial({ color: dashColor });
    const dashes = new THREE.InstancedMesh(dashGeo, dashMat, dashCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < dashCount; i += 1) {
      dummy.position.set(0, 0.08, -495 + i * 10);
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
      dummy.updateMatrix(); dashes.setMatrixAt(i, dummy.matrix);
    }
    dashes.instanceMatrix.needsUpdate = true;
    scene.add(dashes);

    // Concrete curbs — full 1000m across z ∈ [-500, +500]
    const concreteTex = getConcreteTexture(THREE);
    const curbGeo = new THREE.BoxGeometry(0.45, 0.24, 1000);
    const curbMat = mat(THREE, 0xcbd5e1, { map: concreteTex, roughness: 0.85, metalness: 0.05 });
    const curbL = new THREE.Mesh(curbGeo, curbMat); curbL.position.set(-5.78, 0.12, 0); curbL.receiveShadow = true; scene.add(curbL);
    const curbR = new THREE.Mesh(curbGeo, curbMat); curbR.position.set(5.78, 0.12, 0); curbR.receiveShadow = true; scene.add(curbR);

    // Galvanized guardrails — full 1000m across z ∈ [-500, +500]
    const railGeo = new THREE.BoxGeometry(0.14, 0.32, 1000);
    const railMat = mat(THREE, 0x94a3b8, { roughness: 0.38, metalness: 0.65 });
    const railL = new THREE.Mesh(railGeo, railMat); railL.position.set(-6.32, 0.64, 0); scene.add(railL);
    const railR = new THREE.Mesh(railGeo, railMat); railR.position.set(6.32, 0.64, 0); scene.add(railR);

    // Instanced guardrail posts (every 8m over 984m across z ∈ [-492, +492] = 124 × 2 sides)
    const postSpacing = 8;
    const postHalfCount = Math.floor(984 / postSpacing);
    const postGeo = new THREE.BoxGeometry(0.18, 0.82, 0.18);
    const postMat = mat(THREE, 0x64748b, { roughness: 0.45, metalness: 0.6 });
    const posts = new THREE.InstancedMesh(postGeo, postMat, postHalfCount * 2);
    let pIdx = 0;
    for (let i = 0; i < postHalfCount; i += 1) {
      const z = -492 + i * postSpacing;
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
      dummy.position.set(-6.35, 0.41, z); dummy.updateMatrix(); posts.setMatrixAt(pIdx++, dummy.matrix);
      dummy.position.set(6.35, 0.41, z); dummy.updateMatrix(); posts.setMatrixAt(pIdx++, dummy.matrix);
    }
    posts.count = pIdx;
    posts.instanceMatrix.needsUpdate = true;
    scene.add(posts);

    // Instanced streetlights across z ∈ [-480, +480] (every ~24m alternating sides = 40 lamps)
    const lampCount = Math.max(20, Math.round(40 * scale));
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
      const z = -480 + (i / Math.max(1, lampCount - 1)) * 960;
      dummy.position.set(x, 0, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); poles.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x - side * 0.72, 6.1, z); dummy.updateMatrix(); arms.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x - side * 1.35, 6.0, z); dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix);
    }
    poles.instanceMatrix.needsUpdate = true; arms.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    scene.add(poles); scene.add(arms); scene.add(heads);

    // Sidewalks across 1000m corridor (x = ±8.2, width 3.5m)
    const concMat = mat(THREE, 0xcbd5e1, { map: concreteTex, roughness: 0.88 });
    const sidewalkGeoL = new THREE.BoxGeometry(3.5, 0.12, 1000);
    const sidewalkGeoR = new THREE.BoxGeometry(3.5, 0.12, 1000);
    const swL = new THREE.Mesh(sidewalkGeoL, concMat);
    swL.position.set(-8.2, 0.06, 0); swL.receiveShadow = true; scene.add(swL);
    const swR = new THREE.Mesh(sidewalkGeoR, concMat);
    swR.position.set(8.2, 0.06, 0); swR.receiveShadow = true; scene.add(swR);

    // ── Overhead Trans-Canada Highway Gantries across the road ──
    buildOverheadGantries(THREE, scene, province);

    // ── Roadside Canadian Highway Signs along the drive ──
    buildHighwaySigns(THREE, scene, province);

    // ── Water body ──
    const waterBump = getWaterBumpTexture(THREE);
    const waterGeo = new THREE.PlaneGeometry(520, 360);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: c.waterColor, roughness: isPackedSnow ? 0.35 : (isIceRoad ? 0.24 : 0.12), metalness: 0.48,
      bumpMap: waterBump, bumpScale: 0.18, transparent: true, opacity: 0.88
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(190, -0.35, -240);
    if (biome === 'atlantic-iceberg' || biome === 'granite-lighthouse' || biome === 'fundy-coast' || biome === 'pacific-fjord') {
      waterMesh.position.set(180, -0.35, -160);
    }
    scene.add(waterMesh);

    return { ground, road, waterMesh, waterBump, streetlightMat };
  }

  // ─── Overhead Trans-Canada Highway Gantries ───────────────────────────────

  const PROVINCE_GANTRY_DATA = {
    'ontario': [
      { z: -380, dest: 'TORONTO / HWY 401', sub: 'CN Tower / Harbourfront 12 km', route: '401', exit: 'EXIT 15' },
      { z: -180, dest: 'NIAGARA FALLS / QEW', sub: 'Horseshoe Falls / Mist 32 km', route: 'QEW', exit: 'EXIT 28' },
      { z:  160, dest: 'OTTAWA / HWY 416', sub: 'National Capital Region 75 km', route: '416', exit: 'EXIT 42' },
      { z:  380, dest: 'CANADIAN SHIELD / TCH', sub: 'Pink Granite Cuts & Muskoka Lakes', route: 'TCH 17', exit: 'NORTH' }
    ],
    'quebec': [
      { z: -380, dest: 'QUÉBEC / AUTOROUTE 20', sub: 'Château Frontenac / Cap Diamant 15 km', route: 'AUT 20', exit: 'SORTIE 18' },
      { z: -180, dest: 'MONTRÉAL / CENTRE-VILLE', sub: 'Tour Olympique / Pont Jacques-Cartier 24 km', route: 'AUT 40', exit: 'SORTIE 26' },
      { z:  160, dest: 'FLEUVE SAINT-LAURENT', sub: 'Côte-de-Beaupré / Église Historique', route: 'AUT 138', exit: 'EST' },
      { z:  380, dest: 'SAGUENAY / FJORD', sub: 'Parc National / Laurentides', route: 'AUT 175', exit: 'NORD' }
    ],
    'british-columbia': [
      { z: -380, dest: 'VANCOUVER / HWY 1', sub: 'Canada Place / Lions Gate 18 km', route: 'TCH 1', exit: 'EXIT 12' },
      { z: -180, dest: 'SEA-TO-SKY / HWY 99', sub: 'Howe Sound Fjord / Whistler 52 km', route: 'BC 99', exit: 'SCENIC' },
      { z:  160, dest: 'ROCK GALLERY / SHED', sub: 'Highway Avalanche Shed / Steep Grade Ahead', route: 'BC 99', exit: 'CAUTION' },
      { z:  380, dest: 'PACIFIC FJORD / FERRY', sub: 'Horseshoe Bay Terminal 25 km', route: 'TCH 1', exit: 'WEST' }
    ],
    'alberta': [
      { z: -380, dest: 'BANFF NATIONAL PARK', sub: 'Banff Springs / Bow Valley 14 km', route: 'TCH 1', exit: 'PARK' },
      { z: -180, dest: 'WILDLIFE OVERPASS', sub: 'Forested Bear & Elk Crossing Ahead 500m', route: 'TCH 1', exit: 'WILDLIFE' },
      { z:  160, dest: 'LAKE LOUISE / GLACIER', sub: 'Turquoise Basin / Victoria Glacier 45 km', route: 'TCH 1', exit: 'EXIT 34' },
      { z:  380, dest: 'CALGARY / HWY 2', sub: 'Bow River Valley / Calgary Tower 30 km', route: 'HWY 2', exit: 'EXIT 55' }
    ],
    'national-capital': [
      { z: -380, dest: 'PARLIAMENT HILL / COLLINE', sub: 'Peace Tower & Heritage Blocks 8 km', route: '417', exit: 'EXIT 10' },
      { z: -180, dest: 'CANAL RIDEAU LOCKS', sub: 'UNESCO Skateway & Lockmaster 4 km', route: '417', exit: 'HERITAGE' },
      { z:  160, dest: 'ALEXANDRA BRIDGE', sub: 'Interprovincial Span to Gatineau 6 km', route: 'AUT 5', exit: 'CROSSING' },
      { z:  380, dest: 'GATINEAU PARK / PARC', sub: 'Champlain Lookout / Mackenzie King', route: 'QC 105', exit: 'NORTH' }
    ],
    'nova-scotia': [
      { z: -380, dest: 'PEGGY\'S COVE / HWY 333', sub: 'Peggy\'s Point Lighthouse 12 km', route: 'NS 333', exit: 'LIGHTHOUSE' },
      { z: -180, dest: 'HALIFAX / CITADEL HILL', sub: 'Historic Harbour & Pier 21 22 km', route: 'HWY 102', exit: 'EXIT 4' },
      { z:  160, dest: 'FISHING STAGES / SHACKS', sub: 'Pastel Wooden Docks & Lobster Traps', route: 'NS 333', exit: 'COASTAL' },
      { z:  380, dest: 'CABOT TRAIL / CAPE BRETON', sub: 'Highland Coastal Cliffs 90 km', route: 'TCH 105', exit: 'SCENIC' }
    ],
    'newfoundland': [
      { z: -380, dest: 'ST. JOHN\'S / TRANS-CANADA', sub: 'Signal Hill / Cabot Tower 10 km', route: 'TCH 1', exit: 'MILE 0' },
      { z: -180, dest: 'JELLYBEAN ROW / HARBOUR', sub: 'Victorian Jewel-Tone Saltbox Houses', route: 'TCH 1', exit: 'HISTORIC' },
      { z:  160, dest: 'ICEBERG ALLEY / COAST', sub: 'Drifting Arctic Tabular Bergs 5 km', route: 'ROUTE 10', exit: 'OCEAN' },
      { z:  380, dest: 'GROS MORNE / TABLELANDS', sub: 'Flat-Topped Fjord Cliffs 110 km', route: 'ROUTE 430', exit: 'UNESCO' }
    ],
    'new-brunswick': [
      { z: -380, dest: 'HOPEWELL ROCKS / FUNDY', sub: 'World\'s Highest Tides / Sea Stacks 15 km', route: 'TCH 2', exit: 'EXIT 19' },
      { z: -180, dest: 'HARTLAND COVERED BRIDGE', sub: 'World\'s Longest Covered Bridge 28 km', route: 'NB 105', exit: 'SPAN' },
      { z:  160, dest: 'SAINT JOHN / REVERSING FALLS', sub: 'Fundy Tidal Gorge & Harbour Span 18 km', route: 'HWY 1', exit: 'BAY' },
      { z:  380, dest: 'FREDERICTON / MONCTON', sub: 'Miramichi River Salmon Route', route: 'TCH 2', exit: 'TRANS-CANADA' }
    ],
    'prince-edward-island': [
      { z: -380, dest: 'CONFEDERATION BRIDGE', sub: '12.9 km Northumberland Strait Marine Span', route: 'TCH 1', exit: 'GATEWAY' },
      { z: -180, dest: 'CAVENDISH / GREEN GABLES', sub: 'Anne of Green Gables Heritage Farm 20 km', route: 'PE 6', exit: 'HERITAGE' },
      { z:  160, dest: 'CHARLOTTETOWN / HARBOUR', sub: 'Birthplace of Confederation 15 km', route: 'TCH 1', exit: 'CAPITAL' },
      { z:  380, dest: 'RED SAND CLIFFS / POINT PRIM', sub: 'Rust-Red Sandstone Shore & Lighthouse', route: 'PE 1', exit: 'SCENIC' }
    ],
    'manitoba': [
      { z: -380, dest: 'WINNIPEG / TRANS-CANADA', sub: 'Museum for Human Rights / Spire 14 km', route: 'TCH 1', exit: 'EXIT 8' },
      { z: -180, dest: 'EXCHANGE DISTRICT / HERITAGE', sub: 'Terracotta Chicago-Style Warehouses', route: 'HWY 75', exit: 'HISTORIC' },
      { z:  160, dest: 'THE FORKS / RIVER CONFLUENCE', sub: 'Red & Assiniboine Rivers 8 km', route: 'TCH 1', exit: 'THE FORKS' },
      { z:  380, dest: 'CHURCHILL / HUDSON BAY', sub: 'Polar Bear Capital & Auroral Oval', route: 'HWY 6', exit: 'SUBARCTIC' }
    ],
    'saskatchewan': [
      { z: -380, dest: 'REGINA / TRANS-CANADA', sub: 'Legislative Dome & Wascana Centre 15 km', route: 'TCH 1', exit: 'EXIT 14' },
      { z: -180, dest: 'GRAIN ELEVATOR ROW', sub: 'Historic Wooden Prairie Sentinels', route: 'TCH 1', exit: 'RAILWAY' },
      { z:  160, dest: 'UKRAINIAN PRAIRIE CHURCH', sub: 'Triple Onion Domes & Banya Spire', route: 'TCH 1', exit: 'HERITAGE' },
      { z:  380, dest: 'SASKATOON / LIVING SKIES', sub: 'Golden Wheat Plains & Big Sky', route: 'HWY 11', exit: 'YELLOWHEAD' }
    ],
    'yukon': [
      { z: -380, dest: 'WHITEHORSE / ALASKA HWY', sub: 'SS Klondike Sternwheeler 12 km', route: 'AK HWY', exit: 'MILE 918' },
      { z: -180, dest: 'DAWSON CITY / GOLD RUSH', sub: 'Klondike Boardwalk & Eldorado Saloon', route: 'KLONDIKE 2', exit: 'BONANZA' },
      { z:  160, dest: 'MOUNT LOGAN / KLUANE', sub: 'Canada\'s Highest Peak (5,959 m)', route: 'AK HWY', exit: 'ICEFIELDS' },
      { z:  380, dest: 'DEMPSTER HWY / ARCTIC CIRCLE', sub: 'Tombstone Peaks & Tundra Trail', route: 'DEMPSTER 5', exit: 'NORTH' }
    ],
    'northwest-territories': [
      { z: -380, dest: 'YELLOWKNIFE / INGRAHAM TRAIL', sub: 'Elevated Permafrost Buildings & Stilt Homes', route: 'NWT 4', exit: 'OLD TOWN' },
      { z: -180, dest: 'GREAT SLAVE ICE ROAD', sub: 'Dettah Winter Crossing / Frozen Lake', route: 'ICE ROAD', exit: 'CROSSING' },
      { z:  160, dest: 'DIAMOND MINE HEADFRAME', sub: 'Precambrian Shield Granite 16 km', route: 'NWT 3', exit: 'MINE' },
      { z:  380, dest: 'TAIGA / DRUNKEN FOREST', sub: 'Muskeg & Stunted Black Spruce Taiga', route: 'MACKENZIE 1', exit: 'AURORA' }
    ],
    'nunavut': [
      { z: -380, dest: 'IQALUIT / POLAR ROUTE', sub: 'Monumental Inuksuk / Frobisher Bay 8 km', route: 'POLAR 1', exit: 'ARCTIC' },
      { z: -180, dest: 'INUKSUK STONE SENTINEL', sub: 'Traditional Inuit Navigation Marker 500m', route: 'TRAIL', exit: 'INUKSUIT' },
      { z:  160, dest: 'HIGH ARCTIC RESEARCH STATION', sub: 'Insulated Polar Domes & Science Pods', route: 'POLAR 1', exit: 'RESEARCH' },
      { z:  380, dest: 'BAFFIN ISLAND FJORD PEAKS', sub: 'Sea Ice Pack & Glaciated Spires 35 km', route: 'TRAIL', exit: 'POLAR' }
    ]
  };

  function buildOverheadGantries(THREE, scene, province) {
    const list = PROVINCE_GANTRY_DATA[province.id] || PROVINCE_GANTRY_DATA['ontario'];
    const steelMat = mat(THREE, 0x64748b, { roughness: 0.38, metalness: 0.75 });
    const concMat = mat(THREE, 0x94a3b8, { roughness: 0.85, metalness: 0.1 });

    for (let i = 0; i < list.length; i += 1) {
      const g = list[i];
      const gGroup = new THREE.Group();
      gGroup.position.set(0, 0, g.z);

      // Dual support columns flanking the highway (at x = -7.8 and +7.8, road is 11.2m wide)
      // Concrete footings
      addBox(THREE, gGroup, 0.9, 0.7, 0.9, 0x94a3b8, -7.8, 0.35, 0, { roughness: 0.85 });
      addBox(THREE, gGroup, 0.9, 0.7, 0.9, 0x94a3b8,  7.8, 0.35, 0, { roughness: 0.85 });

      // Steel vertical tubular columns
      addCyl(THREE, gGroup, 0.22, 0.26, 6.6, 8, 0x64748b, -7.8, 3.8, 0, { metalness: 0.75, roughness: 0.4 });
      addCyl(THREE, gGroup, 0.22, 0.26, 6.6, 8, 0x64748b,  7.8, 3.8, 0, { metalness: 0.75, roughness: 0.4 });

      // Diagonal side braces
      addBox(THREE, gGroup, 1.4, 0.12, 0.12, 0x64748b, -8.3, 1.5, 0, { rz: 0.6, metalness: 0.7 });
      addBox(THREE, gGroup, 1.4, 0.12, 0.12, 0x64748b,  8.3, 1.5, 0, { rz: -0.6, metalness: 0.7 });

      // Horizontal steel truss bridge beams spanning 16.2m across the highway
      addBox(THREE, gGroup, 16.2, 0.22, 0.22, 0x64748b, 0, 5.4, 0, { metalness: 0.75, roughness: 0.4 });
      addBox(THREE, gGroup, 16.2, 0.22, 0.22, 0x64748b, 0, 6.8, 0, { metalness: 0.75, roughness: 0.4 });

      // Diagonal truss lattice struts
      for (let tx = -7.0; tx <= 7.0; tx += 2.0) {
        addBox(THREE, gGroup, 2.2, 0.10, 0.10, 0x64748b, tx, 6.1, 0, { rz: 0.65, metalness: 0.75 });
      }

      // Catwalk maintenance platform along the truss
      addBox(THREE, gGroup, 15.6, 0.08, 0.7, 0x475569, 0, 5.25, 0, { metalness: 0.65, roughness: 0.5 });
      addBox(THREE, gGroup, 15.6, 0.75, 0.04, 0x64748b, 0, 5.65, 0.35, { metalness: 0.7 });

      // Overhead green highway signboards
      const signTex = getOverheadGantrySignTexture(THREE, g.dest, g.sub, g.route, g.exit);
      const signMat = new THREE.MeshStandardMaterial({
        map: signTex, emissiveMap: signTex, emissive: 0xffffff,
        emissiveIntensity: 0.18, roughness: 0.45, metalness: 0.2
      });

      // North-facing sign (faces traffic driving from -z towards +z)
      const signMeshN = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 2.6), signMat);
      signMeshN.position.set(0, 6.1, -0.22);
      gGroup.add(signMeshN);

      // South-facing sign (faces traffic driving from +z towards -z)
      const signMeshS = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 2.6), signMat);
      signMeshS.position.set(0, 6.1, 0.22);
      signMeshS.rotation.y = Math.PI;
      gGroup.add(signMeshS);

      // Sign backing enclosure
      addBox(THREE, gGroup, 8.7, 2.7, 0.38, 0x334155, 0, 6.1, 0, { roughness: 0.6, metalness: 0.4 });

      // Overhead luminaire lamps lighting the sign face
      for (let lx = -3.2; lx <= 3.2; lx += 2.1) {
        addBox(THREE, gGroup, 0.10, 0.10, 0.85, 0x475569, lx, 7.15, -0.45, { metalness: 0.6 });
        addBox(THREE, gGroup, 0.45, 0.14, 0.24, 0xfef08a, lx, 7.1, -0.85, { emissive: 0xfef08a, emissiveIntensity: 0.6 });
      }

      scene.add(gGroup);
    }
  }

  // ─── Canadian Roadside Highway Signs ──────────────────────────────────────

  function buildHighwaySigns(THREE, scene, province) {
    const signs = [
      { z: -440, dest: 'TRANS-CANADA HWY 1', sub: 'National Highway Corridor', side: 1 },
      { z: -320, dest: 'BANFF NATIONAL PARK', sub: 'Scenic Route', side: -1 },
      { z: -240, dest: 'LAKE LOUISE / JASPER', sub: 'Rocky Mountain Corridor', side: 1 },
      { z: -100, dest: 'PROVINCE WELCOME', sub: province.name, side: -1, speed: true },
      { z:    0, dest: 'TORONTO / HWY 401', sub: 'Trans-Canada', side: 1, speed: true },
      { z:  100, dest: 'PEGGY\'S COVE', sub: 'Atlantic Scenic Coast', side: -1 },
      { z:  240, dest: 'ST. JOHN\'S / MILE 0', sub: 'Signal Hill 14 km', side: 1 },
      { z:  340, dest: 'NIAGARA FALLS', sub: 'QEW / Scenic Parkway', side: -1, speed: true },
      { z:  440, dest: 'PACIFIC FJORD', sub: 'Sea-to-Sky Route', side: 1 }
    ];

    for (let i = 0; i < signs.length; i += 1) {
      const s = signs[i];
      const sx = s.side * 14.5;

      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 5.5, 6),
        mat(THREE, 0x64748b, { roughness: 0.5, metalness: 0.6 })
      );
      post.position.set(sx, 2.75, s.z);
      scene.add(post);

      const signTex = getHighwaySignTexture(THREE, s.dest, s.sub);
      const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.8, 2.8),
        new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.5 })
      );
      signMesh.position.set(sx, 5.0, s.z);
      signMesh.rotation.y = s.side > 0 ? Math.PI : 0;
      scene.add(signMesh);

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

  // ─── Instanced Forest (Full 1000m corridor: z ∈ [-490, +490]) ─────────────

  function buildInstancedForest(THREE, scene, province, scale, rng) {
    const biome = province.biome;

    if (biome === 'arctic-tundra') {
      const rCount = Math.round(110 * scale);
      const rGeo = new THREE.DodecahedronGeometry(1.1, 0);
      const rocks = new THREE.InstancedMesh(rGeo, mat(THREE, 0x64748b, { roughness: 0.92 }), rCount);
      const dummy = new THREE.Object3D(), tmp = new THREE.Color();
      for (let i = 0; i < rCount; i += 1) {
        const side = rng() > 0.5 ? 1 : -1;
        const rx = side * (16 + rng() * 190), rz = -485 + rng() * 970;
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
      const count = Math.round(1800 * scale);
      const stalkGeo = new THREE.ConeGeometry(0.16, 1.5, 4);
      stalkGeo.translate(0, 0.75, 0);
      const wheat = new THREE.InstancedMesh(stalkGeo, mat(THREE, 0xffffff, { roughness: 0.85 }), count);
      const dummy = new THREE.Object3D(), tmp = new THREE.Color();
      for (let i = 0; i < count; i += 1) {
        const side = rng() > 0.5 ? 1 : -1;
        const x = side * (12 + rng() * 200), z = -485 + rng() * 970;
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

    // Dense pine/maple/spruce/Douglas-fir forest flanking the 1000m highway
    const isOntario = province.id === 'ontario';
    const isBC = province.id === 'british-columbia';
    const isDeciduous = isOntario || biome === 'great-lakes-metro' || biome === 'capital-canal' || biome === 'red-sand-island' || biome === 'st-lawrence-citadel';
    const treeCount = Math.round((biome === 'subarctic-shield' ? 220 : 420) * scale);
    const barkTex = getBarkTexture(THREE);
    const foliageTex = getFoliageTexture(THREE, isDeciduous ? 'deciduous' : 'conifer');

    // Douglas firs in BC are towering
    const trunkH = isBC ? 4.2 : 2.7;
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.38, trunkH, 7);
    trunkGeo.translate(0, trunkH * 0.5, 0);
    const trunkMat = mat(THREE, 0x5c4028, { map: barkTex.map, bumpMap: barkTex.bump, bumpScale: 0.12, roughness: 0.92 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    trunks.castShadow = scale > 0.5;

    const layerGeos = isDeciduous
      ? [new THREE.DodecahedronGeometry(1.5, 1), new THREE.DodecahedronGeometry(1.3, 1), new THREE.DodecahedronGeometry(1.1, 1)]
      : [new THREE.ConeGeometry(2.1, 3.2, 8), new THREE.ConeGeometry(1.6, 2.8, 8), new THREE.ConeGeometry(1.1, 2.4, 8)];

    if (isDeciduous) {
      layerGeos[0].translate(0, 3.5, 0); layerGeos[1].translate(0.55, 4.2, 0.35); layerGeos[2].translate(-0.45, 4.5, -0.35);
    } else {
      const bY = isBC ? 2.5 : 0;
      layerGeos[0].translate(0, 3.1 + bY, 0); layerGeos[1].translate(0, 4.6 + bY, 0); layerGeos[2].translate(0, 5.9 + bY, 0);
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
    while (placed < treeCount && attempts < treeCount * 6) {
      attempts += 1;
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (15 + rng() * 200);
      const z = -485 + rng() * 970;
      if (Math.abs(x) < 18 && Math.abs(z + 52) < 22) continue;
      if (Math.abs(x) < 17 && z > -6 && z < 36) continue;

      const s = (isBC ? 1.05 : 0.72) + rng() * 0.85, sy = s * (isBC ? 1.45 : 1.0) * (0.88 + rng() * 0.28);
      dummy.position.set(x, 0, z);
      dummy.rotation.set((rng() - 0.5) * 0.06, rng() * Math.PI * 2, (rng() - 0.5) * 0.06);
      dummy.scale.set(s, sy, s); dummy.updateMatrix();
      trunks.setMatrixAt(placed, dummy.matrix);

      for (let l = 0; l < layers.length; l += 1) {
        dummy.rotation.y += l * 0.85; dummy.updateMatrix();
        layers[l].setMatrixAt(placed, dummy.matrix);
        if (isOntario) {
          // Rich autumn scarlet, burnt-orange, and golden sugar maples mixed with dark pines
          const roll = rng();
          if (roll > 0.65) tmpCol.setHex(0xdc2626); // Scarlet maple
          else if (roll > 0.38) tmpCol.setHex(0xea580c); // Burnt orange
          else if (roll > 0.20) tmpCol.setHex(0xca8a04); // Golden birch/maple
          else tmpCol.setHex(0x1e3a1e); // White pine evergreen
        } else if (isDeciduous) {
          if (rng() > 0.80) tmpCol.setHSL(0.04 + rng() * 0.06, 0.75, 0.40 + rng() * 0.08);
          else tmpCol.setHSL(0.32 + (rng() - 0.5) * 0.08, 0.45 + rng() * 0.15, 0.25 + rng() * 0.10);
        } else {
          const baseHue = isBC ? 0.35 : (biome === 'subarctic-shield' ? 0.38 : 0.36);
          tmpCol.setHSL(baseHue + (rng() - 0.5) * 0.05, 0.44 + rng() * 0.14, 0.18 + rng() * 0.08);
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

  // ─── Mountains & Horizon Ridges ───────────────────────────────────────────

  function buildInstancedMountains(THREE, scene, count, xRange, zBase, maxHeight, snowCap, rng) {
    const mGeo = new THREE.ConeGeometry(18, 1, 7);
    mGeo.translate(0, 0.5, 0);
    const stoneTex = getStoneTexture(THREE);
    const rock = new THREE.InstancedMesh(mGeo, mat(THREE, 0x525b66, { map: stoneTex, roughness: 0.92 }), count);
    const snow = snowCap ? new THREE.InstancedMesh(mGeo, mat(THREE, 0xeef5fc, { roughness: 0.55 }), count) : null;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const x = -xRange + (i / Math.max(1, count - 1)) * xRange * 2 + (rng() - 0.5) * 16;
      const z = zBase - rng() * 75;
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

  // ─── Instanced City Skyline (Stepped back: |x| >= 16) ─────────────────────

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
      let x = centerX + (rng() - 0.5) * spreadX;
      if (Math.abs(x) < 18) x = x < 0 ? -22 - rng() * 12 : 22 + rng() * 12;
      const z = centerZ + (rng() - 0.5) * 44;
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
      const geo = new THREE.PlaneGeometry(180, 28, 20, 4);
      const m = new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
      const ribbon = new THREE.Mesh(geo, m);
      ribbon.position.set(-25 + i * 26, 64 + i * 7, -130 - i * 20);
      ribbon.rotation.x = 0.35; ribbon.rotation.y = (i - 1) * 0.22;
      scene.add(ribbon); auroraMeshes.push(ribbon);
    }
  }

  // ─── Roadside Structures across 1000m corridor ────────────────────────────

  function buildRoadsideStructures(THREE, scene, province, scale, rng) {
    const biome = province.biome;
    const stoneTex = getStoneTexture(THREE);
    const woodTex = getWoodTexture(THREE);
    const concreteTex = getConcreteTexture(THREE);

    // 1. Alpine Chalets / Canadian Cabins along the 1000m drive (stepped back: |x| >= 20)
    const chaletPositions = [
      { x: -22, z: -420 }, { x: 24, z: -360 }, { x: -22, z: -290 },
      { x:  24, z: -230 }, { x: -24, z: -140 }, { x:  24, z: 120 },
      { x: -22, z:  190 }, { x: 24, z:  270 }, { x: -24, z: 350 },
      { x:  22, z:  430 }
    ];
    for (let i = 0; i < chaletPositions.length; i += 1) {
      const cp = chaletPositions[i];
      const h = 4.5 + rng() * 2.5, w = 7 + rng() * 4;
      addBox(THREE, scene, w, h, 7, 0x78350f, cp.x, h * 0.5, cp.z, { map: woodTex, castShadow: true });
      addBox(THREE, scene, w + 1.2, 0.3, 8, 0x374151, cp.x, h + 1.5, cp.z, { ry: 0, castShadow: true });
      addCone(THREE, scene, (w + 1.2) * 0.6, 3.2, 4, 0x374151, cp.x, h + 3.1, cp.z, { castShadow: true });
      addBox(THREE, scene, 0.8, 2.5, 0.8, 0x64748b, cp.x + w * 0.3, h + 2.5, cp.z - 1.5, { map: stoneTex });
      if (biome === 'rockies-foothills' || biome === 'klondike-glacier' || biome === 'arctic-tundra') {
        addBox(THREE, scene, w + 0.4, 0.5, 7.4, 0xf8fafc, cp.x, h + 1.6, cp.z, { roughness: 0.5 });
      }
    }

    // 2. Trans-Canada Rest Stop / Gas Stations (stepped back: |x| = 26)
    const restStops = [{ x: -26, z: 90 }, { x: 26, z: -160 }, { x: -26, z: 320 }];
    for (let i = 0; i < restStops.length; i += 1) {
      const rs = restStops[i];
      addBox(THREE, scene, 18, 0.4, 10, 0x334155, rs.x, 5.2, rs.z, { map: concreteTex, castShadow: true });
      addCyl(THREE, scene, 0.2, 0.25, 5.2, 6, 0x475569, rs.x - 7, 2.6, rs.z - 3, {});
      addCyl(THREE, scene, 0.2, 0.25, 5.2, 6, 0x475569, rs.x + 7, 2.6, rs.z - 3, {});
      addBox(THREE, scene, 8, 4, 10, 0xe2e8f0, rs.x, 2, rs.z + 8, { map: concreteTex, castShadow: true });
      addBox(THREE, scene, 8.4, 0.3, 10.4, 0x334155, rs.x, 4.2, rs.z + 8, {});
      addBox(THREE, scene, 3.2, 1.2, 0.2, 0xc8102e, rs.x, 5.8, rs.z + 2.8, { emissive: 0xc8102e, emissiveIntensity: 0.3 });
    }

    // 3. Distant Mountain Ridges framing both sides across 1000m corridor
    const ridgeGeo = new THREE.BoxGeometry(1, 1, 1);
    ridgeGeo.translate(0, 0.5, 0);
    const ridgeMat = mat(THREE, 0x334155, { roughness: 0.98, metalness: 0 });
    const ridgeCount = 36;
    const ridges = new THREE.InstancedMesh(ridgeGeo, ridgeMat, ridgeCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < ridgeCount; i += 1) {
      const side = i % 2 === 0 ? 1 : -1;
      const rx = side * (180 + rng() * 60);
      const rz = -480 + (i / (ridgeCount - 1)) * 960;
      const rh = 35 + rng() * 55, rw = 45 + rng() * 65;
      dummy.position.set(rx, 0, rz); dummy.rotation.set(0, rng() * 0.3, 0); dummy.scale.set(rw, rh, 28 + rng() * 32);
      dummy.updateMatrix(); ridges.setMatrixAt(i, dummy.matrix);
    }
    ridges.instanceMatrix.needsUpdate = true;
    scene.add(ridges);

    // Snow caps on ridges for mountain biomes
    if (biome === 'rockies-foothills' || biome === 'klondike-glacier' || biome === 'arctic-tundra' || biome === 'pacific-fjord') {
      const capCount = 18;
      const caps = new THREE.InstancedMesh(ridgeGeo, mat(THREE, 0xeef5fc, { roughness: 0.5 }), capCount);
      for (let i = 0; i < capCount; i += 1) {
        const side = i % 2 === 0 ? 1 : -1;
        const rx = side * (185 + rng() * 55);
        const rz = -460 + (i / (capCount - 1)) * 920;
        const rh = 22 + rng() * 26, rw = 22 + rng() * 32;
        const baseH = 35 + rng() * 55;
        dummy.position.set(rx, baseH * 0.6, rz); dummy.rotation.set(0, 0, 0); dummy.scale.set(rw, rh, 14 + rng() * 18);
        dummy.updateMatrix(); caps.setMatrixAt(i, dummy.matrix);
      }
      caps.instanceMatrix.needsUpdate = true;
      scene.add(caps);
    }
  }

  // ─── Starting City Block (Stepped back: |x| >= 16) ────────────────────────

  function buildStartingCityBlock(THREE, scene, province, scale, rng, state) {
    const concreteTex = getConcreteTexture(THREE);
    const stoneTex = getStoneTexture(THREE);
    const bTex = getBuildingTextures(THREE);

    // 1. Downtown skyline clusters stepped back at |x| = 36
    buildInstancedSkyline(THREE, scene, Math.round(20 * scale), -36, -55, 46, 28, rng, state);
    buildInstancedSkyline(THREE, scene, Math.round(16 * scale),  36, -55, 40, 22, rng, null);

    // 2. Mid-rise commercial strip — left side (stepped back at x = -19)
    const commercialLeft = [
      { w: 9, h: 8, d: 7, x: -19, z: -85, color: 0x94a3b8 },
      { w: 8, h: 12, d: 7, x: -19, z: -72, color: 0x64748b },
      { w: 10, h: 6, d: 8, x: -20, z: -60, color: 0xa8a29e },
      { w: 9, h: 9, d: 7, x: -19, z: -47, color: 0x7dd3fc },
      { w: 8, h: 7, d: 8, x: -19, z: -34, color: 0x94a3b8 },
      { w: 9, h: 5, d: 7, x: -20, z: -22, color: 0x64748b }
    ];
    for (let i = 0; i < commercialLeft.length; i += 1) {
      const b = commercialLeft[i];
      addBox(THREE, scene, b.w, b.h, b.d, b.color, b.x, b.h * 0.5, b.z, { map: bTex.map, roughness: 0.42, metalness: 0.35, castShadow: true });
      addBox(THREE, scene, b.w + 1.2, 1.5, b.d + 1.2, 0x334155, b.x, 0.75, b.z, { map: concreteTex });
      addBox(THREE, scene, b.w + 0.4, 0.5, b.d + 0.4, 0x475569, b.x, b.h + 0.25, b.z, { roughness: 0.65 });
    }

    // 3. Mid-rise commercial strip — right side (stepped back at x = +19)
    const commercialRight = [
      { w: 9, h: 10, d: 7, x: 20, z: -88, color: 0x475569 },
      { w: 10, h: 7, d: 8, x: 20, z: -76, color: 0x64748b },
      { w: 8, h: 14, d: 7, x: 19, z: -63, color: 0x94a3b8 },
      { w: 10, h: 6, d: 8, x: 20, z: -50, color: 0x7dd3fc },
      { w: 9, h: 8, d: 7, x: 20, z: -38, color: 0x475569 },
      { w: 10, h: 5, d: 7, x: 20, z: -25, color: 0xa8a29e }
    ];
    for (let i = 0; i < commercialRight.length; i += 1) {
      const b = commercialRight[i];
      addBox(THREE, scene, b.w, b.h, b.d, b.color, b.x, b.h * 0.5, b.z, { map: bTex.map, roughness: 0.42, metalness: 0.35, castShadow: true });
      addBox(THREE, scene, b.w + 1.2, 1.5, b.d + 1.2, 0x334155, b.x, 0.75, b.z, { map: concreteTex });
      addBox(THREE, scene, b.w + 0.4, 0.5, b.d + 0.4, 0x475569, b.x, b.h + 0.25, b.z, { roughness: 0.65 });
    }

    // 4. Street-level storefronts (stepped back at |x| = 17 to ensure chase camera clearance)
    const storefronts = [
      { x: -17, z: -12, color: 0xfef3c7, h: 4 },
      { x:  17, z:  -8, color: 0xdbeafe, h: 4.5 },
      { x: -17, z:   5, color: 0xfce7f3, h: 3.8 },
      { x:  17, z:  10, color: 0xecfdf5, h: 4.2 },
      { x: -17, z:  20, color: 0xfef3c7, h: 4 },
      { x:  17, z:  30, color: 0xdbeafe, h: 3.8 },
      { x: -17, z:  38, color: 0xecfdf5, h: 4.5 },
      { x:  17, z:  44, color: 0xfce7f3, h: 4 }
    ];
    for (let i = 0; i < storefronts.length; i += 1) {
      const sf = storefronts[i];
      addBox(THREE, scene, 6.5, sf.h, 6, sf.color, sf.x, sf.h * 0.5, sf.z, { map: concreteTex, roughness: 0.65, castShadow: true });
      addBox(THREE, scene, 6.8, 0.3, 2.2, 0xc8102e, sf.x, sf.h + 0.15, sf.z - 1.2, { roughness: 0.5 });
      addBox(THREE, scene, 7.0, 0.3, 6.4, 0x64748b, sf.x, sf.h + 0.3, sf.z, {});
    }

    // 5. Canadian Heritage Civic block
    addBox(THREE, scene, 20, 10, 12, 0xd6d3d1, -40, 5, 30, { map: stoneTex, roughness: 0.88, castShadow: true });
    addBox(THREE, scene, 20.5, 2.5, 12.5, 0xd6d3d1, -40, 11.25, 30, { map: stoneTex });
    addCyl(THREE, scene, 2.0, 2.0, 7, 12, 0xd6d3d1, -40, 14.5, 25, { map: stoneTex, castShadow: true });
    addCone(THREE, scene, 2.4, 4.5, 4, 0x2dd4bf, -40, 20, 25, { metalness: 0.35, roughness: 0.45 });

    // 6. Central parking pad near functional buildings
    addBox(THREE, scene, 22, 0.08, 36, 0x1e293b, 0, 0.04, 14, { roughness: 0.92 });
  }

  // ─── Real-Life Architecture & Scenery for All 14 Provinces ───────────────

  function buildProvinceLandmarks(THREE, scene, province, scale, rng, state) {
    const id = province.id;
    const concreteTex = getConcreteTexture(THREE);
    const stoneTex = getStoneTexture(THREE);
    const woodTex = getWoodTexture(THREE);
    const waterBump = getWaterBumpTexture(THREE);
    const pinkGraniteTex = getPinkGraniteTexture(THREE);

    function lmCoords(idx, defX, defY, defZ) {
      const lm = province.landmarks && province.landmarks[idx];
      if (lm && lm.coords) return lm.coords;
      return [defX, defY, defZ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. ONTARIO: Pink-Grey Shield Rock Cuts, Autumn Maples & CN Tower
    // ──────────────────────────────────────────────────────────────────────────
    if (id === 'ontario') {
      // Canadian Shield Pink-Grey Granite Rock Cuts flanking highway
      const rockCutGeo = new THREE.BoxGeometry(4.5, 5.5, 18);
      const rockCutMat = mat(THREE, 0xffffff, { map: pinkGraniteTex, roughness: 0.90 });
      const cutCount = 20;
      const cuts = new THREE.InstancedMesh(rockCutGeo, rockCutMat, cutCount * 2);
      const dummy = new THREE.Object3D();
      let cIdx = 0;
      for (let i = 0; i < cutCount; i += 1) {
        const cz = -360 + (i / (cutCount - 1)) * 720;
        if (cz > -50 && cz < 50) continue; // Leave central hub clear
        const hL = 4.0 + rng() * 3.5, hR = 4.0 + rng() * 3.5;
        dummy.position.set(-11.5, hL * 0.5, cz); dummy.scale.set(1.0 + rng() * 0.4, hL / 5.5, 1.0);
        dummy.rotation.set((rng() - 0.5) * 0.08, (rng() - 0.5) * 0.1, (rng() - 0.5) * 0.08);
        dummy.updateMatrix(); cuts.setMatrixAt(cIdx++, dummy.matrix);

        dummy.position.set(11.5, hR * 0.5, cz); dummy.scale.set(1.0 + rng() * 0.4, hR / 5.5, 1.0);
        dummy.rotation.set((rng() - 0.5) * 0.08, (rng() - 0.5) * 0.1, (rng() - 0.5) * 0.08);
        dummy.updateMatrix(); cuts.setMatrixAt(cIdx++, dummy.matrix);
      }
      cuts.count = cIdx;
      cuts.instanceMatrix.needsUpdate = true;
      scene.add(cuts);

      // CN Tower (stepped back at x = -26, z = -65 to preserve chase camera clearance)
      const cnC = lmCoords(0, 0, 0, -65);
      const cnX = -26, cnZ = cnC[2];
      const cn = new THREE.Group();
      cn.position.set(cnX, 0, cnZ);
      addCyl(THREE, cn, 2.2, 5.4, 48, 14, 0xdbe4ee, 0, 24, 0, { map: concreteTex, roughness: 0.75, castShadow: true });
      for (let r = 0; r < 3; r += 1) {
        const ang = (r / 3) * Math.PI * 2;
        addBox(THREE, cn, 1.3, 44, 1.8, 0xcbd5e1, Math.sin(ang) * 3.1, 22, Math.cos(ang) * 3.1, { ry: ang, map: concreteTex });
      }
      addCyl(THREE, cn, 6.4, 5.4, 4.4, 24, 0xe2e8f0, 0, 48, 0, { map: concreteTex, metalness: 0.25, castShadow: true });
      addCyl(THREE, cn, 6.0, 6.0, 1.6, 24, 0x38bdf8, 0, 48.2, 0, { roughness: 0.15, metalness: 0.7, emissive: 0x0ea5e9, emissiveIntensity: 0.5 });
      addCyl(THREE, cn, 2.5, 2.8, 2.4, 16, 0x94a3b8, 0, 56.5, 0, { metalness: 0.5 });
      addCyl(THREE, cn, 0.35, 1.6, 18, 10, 0xf1f5f9, 0, 60, 0, { metalness: 0.65, roughness: 0.3 });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 10), mat(THREE, 0xff2244, { emissive: 0xff2244, emissiveIntensity: 1.6 }));
      beacon.position.set(0, 69.5, 0); cn.add(beacon); state.beaconMeshes.push(beacon); scene.add(cn);

      // Rogers-style Dome (x = -52, z = -120)
      const domeC = lmCoords(1, -48, 0, -120);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(THREE, 0xdbeafe, { map: concreteTex, roughness: 0.38, metalness: 0.32 }));
      dome.position.set(domeC[0], 0, domeC[2]); scene.add(dome);
      addCyl(THREE, scene, 14.6, 15.2, 4.0, 24, 0x334155, domeC[0], 2.0, domeC[2], { map: concreteTex, metalness: 0.35 });

      // Niagara Falls Horseshoe Cataract at landmark 2
      const niaC = lmCoords(2, 82, 0, 205);
      addBox(THREE, scene, 30, 14, 18, 0x475569, niaC[0], 7, niaC[2] - 8, { map: stoneTex, roughness: 0.9 });
      const falls = addBox(THREE, scene, 24, 13.5, 2.8, 0x7dd3fc, niaC[0], 6.8, niaC[2], {
        bumpMap: waterBump, bumpScale: 0.25, roughness: 0.2, emissive: 0x0284c7, emissiveIntensity: 0.35, transparent: true, opacity: 0.85
      });
      const mistCount = Math.round(90 * scale);
      const mistPos = new Float32Array(mistCount * 3), mistBase = new Float32Array(mistCount * 3);
      for (let i = 0; i < mistCount; i += 1) {
        const mx = niaC[0] + (rng() - 0.5) * 24, my = 0.5 + rng() * 7.0, mz = niaC[2] + rng() * 6.0;
        mistPos[i * 3] = mx; mistPos[i * 3 + 1] = my; mistPos[i * 3 + 2] = mz;
        mistBase[i * 3] = mx; mistBase[i * 3 + 1] = my; mistBase[i * 3 + 2] = mz;
      }
      const mistGeo = new THREE.BufferGeometry();
      mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
      const mistMat = new THREE.PointsMaterial({ size: 5.0, map: getMistSpriteTexture(THREE), transparent: true, opacity: 0.6, depthWrite: false });
      const mistPoints = new THREE.Points(mistGeo, mistMat); scene.add(mistPoints);
      state.animators.push(function (t) {
        falls.material.opacity = 0.74 + Math.sin(t * 4.5) * 0.1;
        const arr = mistGeo.attributes.position.array;
        for (let i = 0; i < mistCount; i += 1) {
          const i3 = i * 3;
          arr[i3] = mistBase[i3] + Math.sin(t * 0.9 + i) * 0.8;
          arr[i3 + 1] = ((mistBase[i3 + 1] + t * 2.1) % 7.5) + 0.4;
        }
        mistGeo.attributes.position.needsUpdate = true;
      });

      // Toronto waterfront skyline cluster
      buildInstancedSkyline(THREE, scene, Math.round(28 * scale), -45, -95, 75, 26, rng, state);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. QUEBEC: French-Canadian Silver Church, Heritage Houses & Château
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'quebec') {
      // Silver-spired French-Canadian parish stone church (x = -32, z = 130)
      const chX = -32, chZ = 130;
      addBox(THREE, scene, 16, 12, 28, 0x78716c, chX, 6, chZ, { map: stoneTex, roughness: 0.9, castShadow: true });
      // Galvanized tin steep roof
      addCone(THREE, scene, 11, 8, 4, 0xcbd5e1, chX, 16, chZ, { metalness: 0.65, roughness: 0.35, ry: Math.PI / 4 });
      // Soaring bell tower / clocher
      addBox(THREE, scene, 5.5, 18, 5.5, 0x78716c, chX, 9, chZ - 13, { map: stoneTex, castShadow: true });
      addBox(THREE, scene, 4.5, 4.0, 4.5, 0x64748b, chX, 20, chZ - 13, { metalness: 0.5 });
      // Gleaming silver spire reaching 34m
      addCone(THREE, scene, 3.2, 12, 8, 0xf1f5f9, chX, 28, chZ - 13, { metalness: 0.85, roughness: 0.2 });
      // Silver cross
      addBox(THREE, scene, 0.2, 2.2, 0.2, 0xffffff, chX, 35, chZ - 13, { emissive: 0xffffff, emissiveIntensity: 0.5 });
      addBox(THREE, scene, 1.4, 0.2, 0.2, 0xffffff, chX, 35.4, chZ - 13, { emissive: 0xffffff, emissiveIntensity: 0.5 });

      // Row of Steep-roofed heritage village houses with curved bell-cast eaves
      const villageX = 24;
      for (let i = 0; i < 5; i += 1) {
        const vz = 75 + i * 28;
        addBox(THREE, scene, 9, 6.5, 10, 0xf8fafc, villageX, 3.25, vz, { map: woodTex, castShadow: true });
        // Steep tin/copper mansard roof with bell-cast eaves
        addCone(THREE, scene, 7.5, 5.5, 4, i % 2 === 0 ? 0xef4444 : 0x2dd4bf, villageX, 9.25, vz, { ry: Math.PI / 4, metalness: 0.3 });
        // Stone end-chimneys
        addBox(THREE, scene, 0.9, 3.5, 0.9, 0x78716c, villageX + 3.8, 8.5, vz, { map: stoneTex });
      }

      // Château Frontenac at landmark 0 (x = -24, z = -68)
      const cfC = lmCoords(0, 0, 10, -68);
      const cfX = -26, cfZ = cfC[2];
      addBox(THREE, scene, 44, 10, 26, 0x57534e, cfX, 5, cfZ, { map: stoneTex, roughness: 0.92 });
      const ch = new THREE.Group(); ch.position.set(cfX, 10, cfZ);
      addBox(THREE, ch, 22, 14, 14, 0x9a3412, 0, 7, 0, { map: stoneTex, castShadow: true });
      addBox(THREE, ch, 9, 22, 9, 0xb45309, 0, 11, 0, { map: stoneTex, castShadow: true });
      addCone(THREE, ch, 6.2, 11, 8, 0x2dd4bf, 0, 27.5, 0, { metalness: 0.35, roughness: 0.45 });
      addCyl(THREE, ch, 3.2, 3.2, 16, 10, 0x9a3412, -11, 8, 5, { map: stoneTex });
      addCone(THREE, ch, 3.6, 8, 8, 0x2dd4bf, -11, 20, 5, { metalness: 0.35, roughness: 0.45 });
      addCyl(THREE, ch, 3.2, 3.2, 16, 10, 0x9a3412, 11, 8, 5, { map: stoneTex });
      addCone(THREE, ch, 3.6, 8, 8, 0x2dd4bf, 11, 20, 5, { metalness: 0.35, roughness: 0.45 });
      scene.add(ch);

      // Montreal Inclined Tower at landmark 1
      const mtlC = lmCoords(1, -78, 0, 210);
      addBox(THREE, scene, 4.5, 34, 4.5, 0xe2e8f0, mtlC[0], 15, mtlC[2], { map: concreteTex, rz: -0.45, castShadow: true });
      addCyl(THREE, scene, 12, 14, 4, 20, 0x475569, mtlC[0] + 10, 2, mtlC[2], { map: concreteTex });
      buildInstancedSkyline(THREE, scene, Math.round(22 * scale), cfX + 54, cfZ - 46, 55, 18, rng, state);

    // ──────────────────────────────────────────────────────────────────────────
    // 3. BRITISH COLUMBIA: Highway Avalanche Shed, Towering Firs & Howe Sound
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'british-columbia') {
      // Highway Avalanche Shed / Rock Gallery (z ∈ [-170, -125], length 45m spanning highway!)
      const shedZStart = -170, shedZEnd = -125, shedLen = shedZEnd - shedZStart;
      const shedMidZ = (shedZStart + shedZEnd) * 0.5;
      const hazardTex = getHazardStripesTexture(THREE);

      // Mountain-side solid concrete retaining wall (x = -6.4)
      addBox(THREE, scene, 0.9, 6.2, shedLen, 0x475569, -6.4, 3.1, shedMidZ, { map: concreteTex, castShadow: true });

      // Sloped reinforced concrete roof (sloped down towards the fjord so avalanches slide off)
      const roof = addBox(THREE, scene, 13.8, 0.45, shedLen, 0x334155, 0.2, 6.3, shedMidZ, { map: concreteTex });
      roof.rotation.z = -0.10;

      // Heavy timber ceiling cross-beams
      for (let bz = shedZStart + 4; bz <= shedZEnd - 4; bz += 6) {
        addBox(THREE, scene, 13.2, 0.35, 0.4, 0x5c4028, 0.2, 6.0, bz, { map: woodTex });
      }

      // Outer pillars facing the fjord (x = +6.4, allowing views of Howe Sound!)
      for (let pz = shedZStart + 3; pz <= shedZEnd - 3; pz += 6.5) {
        addBox(THREE, scene, 0.7, 5.8, 0.8, 0x475569, 6.4, 2.9, pz, { map: concreteTex });
      }

      // Portal entrances with yellow/black diagonal hazard stripes
      const portalMat = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.4 });
      const portalN = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.8, 0.3), portalMat);
      portalN.position.set(0.2, 6.4, shedZStart - 0.2); scene.add(portalN);
      const portalS = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.8, 0.3), portalMat);
      portalS.position.set(0.2, 6.4, shedZEnd + 0.2); scene.add(portalS);

      // Sea-to-Sky sheer granite cliffs along mountain side (x = -35 to -70)
      for (let i = 0; i < 7; i += 1) {
        const cx = -38 - (i % 2) * 12, cz = -320 + i * 85;
        addBox(THREE, scene, 26, 42 + (i % 3) * 12, 45, 0x475569, cx, 20, cz, { map: stoneTex, roughness: 0.95 });
      }

      // Canada Place Sails at landmark 0 (x = -22, z = -72)
      const cpC = lmCoords(0, -18, 0, -72);
      addBox(THREE, scene, 26, 3, 12, 0x334155, cpC[0], 1.5, cpC[2], { map: concreteTex });
      for (let i = 0; i < 5; i += 1) addCone(THREE, scene, 2.8, 11, 4, 0xf8fafc, cpC[0] - 10 + i * 4.2, 8.5, cpC[2], { roughness: 0.45, castShadow: true });

      // Lions Gate Bridge at landmark 1
      const lgC = lmCoords(1, 70, 0, -140);
      addBox(THREE, scene, 56, 1.8, 5, 0x10b981, lgC[0], 11, lgC[2], { metalness: 0.55, roughness: 0.35 });
      addBox(THREE, scene, 2, 24, 5, 0x059669, lgC[0] - 18, 12, lgC[2], { metalness: 0.6 });
      addBox(THREE, scene, 2, 24, 5, 0x059669, lgC[0] + 18, 12, lgC[2], { metalness: 0.6 });
      addBox(THREE, scene, 20, 0.25, 0.25, 0x34d399, lgC[0] - 28, 18, lgC[2], { rz: 0.48, metalness: 0.7 });
      addBox(THREE, scene, 20, 0.25, 0.25, 0x34d399, lgC[0] + 28, 18, lgC[2], { rz: -0.48, metalness: 0.7 });

      // Coast Mountains massifs
      buildInstancedMountains(THREE, scene, Math.round(30 * scale), 190, -220, 68, true, rng);
      buildInstancedSkyline(THREE, scene, Math.round(20 * scale), cpC[0] - 18, cpC[2] - 20, 50, 22, rng, state);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. ALBERTA: Banff Wildlife Overpass, Banff Springs Hotel & Hoodoos
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'alberta') {
      // Banff Forested Wildlife Overpass spanning over Trans-Canada Highway at z = -120
      const woZ = -120;
      const woGroup = new THREE.Group();
      woGroup.position.set(0, 0, woZ);

      // Heavy curved concrete arch abutments flanking the road
      addBox(THREE, woGroup, 1.8, 6.2, 22, 0x64748b, -7.5, 3.1, 0, { map: concreteTex });
      addBox(THREE, woGroup, 1.8, 6.2, 22, 0x64748b,  7.5, 3.1, 0, { map: concreteTex });

      // Concrete arch bridge span over the highway (clearance: 5.8m)
      addBox(THREE, woGroup, 16.8, 1.0, 22, 0x475569, 0, 6.4, 0, { map: concreteTex });

      // Vegetated earth berm on top of the overpass
      addBox(THREE, woGroup, 16.0, 0.8, 21.6, 0x365314, 0, 7.3, 0, { roughness: 0.95 });

      // Rustic wooden privacy/sound fences along both edges of overpass
      addBox(THREE, woGroup, 16.4, 1.8, 0.3, 0x78350f, 0, 8.2, -10.8, { map: woodTex });
      addBox(THREE, woGroup, 16.4, 1.8, 0.3, 0x78350f, 0, 8.2,  10.8, { map: woodTex });

      // Living pine & spruce trees planted on top of the overpass for wildlife
      for (let tx = -5.5; tx <= 5.5; tx += 2.8) {
        for (let tz = -7.5; tz <= 7.5; tz += 5.0) {
          addCone(THREE, woGroup, 1.2, 3.2, 6, 0x14532d, tx + (rng() - 0.5) * 0.8, 9.2, tz + (rng() - 0.5) * 0.8);
        }
      }
      scene.add(woGroup);

      // Banff Springs Hotel chateau silhouette (x = -28, z = -215)
      const banffC = lmCoords(1, -80, 0, -215);
      const banff = new THREE.Group(); banff.position.set(-28, 0, banffC[2]);
      addBox(THREE, banff, 48, 12, 26, 0x57534e, 0, 6, 0, { map: stoneTex, roughness: 0.92, castShadow: true });
      addBox(THREE, banff, 18, 24, 18, 0x9a3412, 0, 18, 0, { map: stoneTex, castShadow: true });
      addCone(THREE, banff, 10, 14, 8, 0x2dd4bf, 0, 37, 0, { metalness: 0.35, roughness: 0.45 });
      for (let tx = -1; tx <= 1; tx += 2) {
        for (let tz = -1; tz <= 1; tz += 2) {
          addCyl(THREE, banff, 3.2, 3.5, 20, 10, 0x9a3412, tx * 22, 10, tz * 11, { map: stoneTex, castShadow: true });
          addCone(THREE, banff, 3.8, 9, 8, 0x2dd4bf, tx * 22, 24, tz * 11, { metalness: 0.35 });
        }
      }
      scene.add(banff);

      // Jagged Rockies peaks behind Banff
      buildInstancedMountains(THREE, scene, Math.round(34 * scale), 200, banffC[2] - 25, 82, true, rng);

      // Turquoise Lake Louise Basin at landmark 2
      const louiseC = lmCoords(2, 72, 0, 120);
      const louise = new THREE.Mesh(
        new THREE.CircleGeometry(24, 32),
        mat(THREE, 0x14b8a6, { roughness: 0.12, metalness: 0.4, bumpMap: waterBump, bumpScale: 0.14, emissive: 0x0d9488, emissiveIntensity: 0.25 })
      );
      louise.rotation.x = -Math.PI / 2; louise.position.set(louiseC[0], 0.12, louiseC[2]); scene.add(louise);
      buildInstancedMountains(THREE, scene, Math.round(18 * scale), 130, louiseC[2] - 30, 75, true, rng);

      // Alberta Badlands Terracotta Hoodoos at z = 180
      for (let i = 0; i < 8; i += 1) {
        const hx = 65 - 24 + i * 7, hz = 180 + (rng() - 0.5) * 22;
        const hh = 10 + rng() * 8;
        addCyl(THREE, scene, 1.4 + rng() * 0.8, 2.6 + rng() * 1.0, hh, 7, 0xb45309, hx, hh * 0.5, hz, { map: stoneTex, castShadow: true });
        addBox(THREE, scene, 3.5 + rng() * 2, 2.0, 3.5 + rng() * 2, 0x92400e, hx, hh + 1.0, hz, { map: stoneTex });
      }

      // Calgary Tower (stepped back at x = -24, z = -65)
      const calC = lmCoords(0, 0, 0, -65);
      addCyl(THREE, scene, 2.0, 2.9, 36, 14, 0xdbeafe, -24, 18, calC[2], { map: concreteTex, castShadow: true });
      addCyl(THREE, scene, 4.6, 3.8, 3.2, 18, 0xf59e0b, -24, 36, calC[2], { metalness: 0.45, roughness: 0.25, emissive: 0xd97706, emissiveIntensity: 0.35 });
      addCyl(THREE, scene, 0.3, 0.8, 9, 8, 0xffffff, -24, 42, calC[2], { metalness: 0.7 });
      buildInstancedSkyline(THREE, scene, Math.round(22 * scale), -35, calC[2] - 14, 56, 26, rng, state);

    // ──────────────────────────────────────────────────────────────────────────
    // 5. NATIONAL CAPITAL: Rideau Canal Embankments & Gothic Heritage Blocks
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'national-capital') {
      // Parliament Hill Centre Block & Peace Tower (stepped back at x = -26, z = -70)
      const parlC = lmCoords(0, 0, 0, -70);
      const px = -26, pz = parlC[2];
      addBox(THREE, scene, 36, 11, 14, 0xd6d3d1, px, 5.5, pz, { map: stoneTex, roughness: 0.85, castShadow: true });
      addBox(THREE, scene, 37, 2.5, 15, 0x2dd4bf, px, 12.2, pz, { metalness: 0.35, roughness: 0.45 });
      // Peace Tower
      addBox(THREE, scene, 6.2, 34, 6.2, 0xe7e5e4, px, 17, pz + 6, { map: stoneTex, roughness: 0.85, castShadow: true });
      addCone(THREE, scene, 4.4, 9, 4, 0x2dd4bf, px, 38.5, pz + 6, { metalness: 0.35, roughness: 0.45 });
      addBox(THREE, scene, 2.6, 2.6, 0.4, 0xfef08a, px, 27, pz + 9.8, { emissive: 0xfacc15, emissiveIntensity: 0.7 });

      // Gothic copper-roofed heritage blocks (East Block & West Block style)
      addBox(THREE, scene, 24, 10, 12, 0xd6d3d1, 28, 5, -70, { map: stoneTex, castShadow: true });
      addBox(THREE, scene, 25, 2.8, 13, 0x2dd4bf, 28, 11.4, -70, { metalness: 0.35, roughness: 0.45 });
      addCone(THREE, scene, 3.2, 6, 4, 0x2dd4bf, 28 - 9, 15.8, -70);
      addCone(THREE, scene, 3.2, 6, 4, 0x2dd4bf, 28 + 9, 15.8, -70);

      // Rideau Canal stone embankments with canal lock gates (x = 38, z ∈ [-160, 120])
      addBox(THREE, scene, 12, 0.22, 180, 0x1e6b8a, 42, 0.1, -20, { bumpMap: waterBump, roughness: 0.14, metalness: 0.42 });
      // Limestone canal walls
      addBox(THREE, scene, 1.2, 1.2, 180, 0x78716c, 35.4, 0.6, -20, { map: stoneTex });
      addBox(THREE, scene, 1.2, 1.2, 180, 0x78716c, 48.6, 0.6, -20, { map: stoneTex });
      // Canal lock timber gates
      for (let lz = -120; lz <= 80; lz += 50) {
        addBox(THREE, scene, 12, 2.2, 0.5, 0x78350f, 42, 1.1, lz, { map: woodTex });
      }

      // Alexandra Interprovincial Bridge cantilever truss at landmark 2
      const abC = lmCoords(2, -62, 0, 200);
      addBox(THREE, scene, 46, 1.8, 4.8, 0x64748b, abC[0], 8, abC[2], { metalness: 0.6, roughness: 0.4 });
      addBox(THREE, scene, 46, 2.6, 0.35, 0x475569, abC[0], 10, abC[2] + 2, { metalness: 0.65 });
      addBox(THREE, scene, 1.6, 10, 4.8, 0x475569, abC[0] - 14, 5, abC[2], { map: stoneTex });
      addBox(THREE, scene, 1.6, 10, 4.8, 0x475569, abC[0] + 14, 5, abC[2], { map: stoneTex });

    // ──────────────────────────────────────────────────────────────────────────
    // 6. SASKATCHEWAN: Historic Grain Elevators, Railway & Onion-Domed Church
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'saskatchewan') {
      // Row of Historic Wooden Prairie Grain Elevators along rail tracks (x = -28, z ∈ [-240, -140])
      const crossbuckTex = getRailwayCrossbuckTexture(THREE);
      const elevZ = [-230, -185, -140];
      const elevColors = [0xb91c1c, 0xd97706, 0x15803d];
      const elevNames = ['SASKATCHEWAN POOL', 'PIONEER GRAIN', 'WHEAT POOL'];

      for (let i = 0; i < 3; i += 1) {
        const ez = elevZ[i], ec = elevColors[i];
        // Main tall grain elevator shaft
        addBox(THREE, scene, 8.5, 24, 8.5, ec, -28, 12, ez, { map: woodTex, castShadow: true });
        addCone(THREE, scene, 6.2, 5.0, 4, ec, -28, 26.5, ez, { ry: Math.PI / 4 });
        // Grain annex bins
        addBox(THREE, scene, 6.0, 16, 6.0, ec, -28, 8, ez + 7.5, { map: woodTex });
        addCone(THREE, scene, 4.2, 3.8, 4, ec, -28, 17.9, ez + 7.5, { ry: Math.PI / 4 });
        // White lettering sign
        addBox(THREE, scene, 0.2, 2.5, 6.8, 0xffffff, -23.6, 17, ez, { emissive: 0xffffff, emissiveIntensity: 0.1 });
      }

      // Transcontinental Railway parallel to highway (x = -18, full z corridor)
      // Crushed stone ballast bed
      addBox(THREE, scene, 2.8, 0.12, 980, 0x64748b, -18, 0.06, 0, { roughness: 0.95 });
      // Steel rails
      addBox(THREE, scene, 0.08, 0.14, 980, 0x334155, -18.6, 0.18, 0, { metalness: 0.8 });
      addBox(THREE, scene, 0.08, 0.14, 980, 0x334155, -17.4, 0.18, 0, { metalness: 0.8 });
      // Railway crossbuck sign
      const cbMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshStandardMaterial({ map: crossbuckTex, roughness: 0.5 }));
      cbMesh.position.set(-15.5, 2.8, -190); scene.add(cbMesh);
      addCyl(THREE, scene, 0.08, 0.08, 3.0, 6, 0x475569, -15.5, 1.5, -190);

      // Onion-Domed Ukrainian/Orthodox Prairie Church (x = 34, z = 160)
      const uchX = 34, uchZ = 160;
      addBox(THREE, scene, 14, 8, 20, 0xf8fafc, uchX, 4, uchZ, { map: woodTex, castShadow: true });
      addCone(THREE, scene, 9.5, 5.5, 4, 0x2dd4bf, uchX, 10.75, uchZ, { ry: Math.PI / 4, metalness: 0.4 });
      // Three ornate gilded/green onion domes (banyas)
      const domeOffsets = [-5, 0, 5];
      for (let d = 0; d < 3; d += 1) {
        const dz = uchZ + domeOffsets[d];
        const dh = d === 1 ? 16 : 14;
        addCyl(THREE, scene, 1.2, 1.2, 4, 10, 0xf8fafc, uchX, dh - 2, dz);
        // Onion dome bulb
        const banya = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.75), mat(THREE, 0xfacc15, { metalness: 0.75, roughness: 0.2 }));
        banya.position.set(uchX, dh + 0.5, dz); scene.add(banya);
        // Byzantine Cross
        addBox(THREE, scene, 0.1, 1.6, 0.1, 0xfacc15, uchX, dh + 2.8, dz, { emissive: 0xfacc15, emissiveIntensity: 0.5 });
      }

      // Regina Legislative building dome at landmark 0
      const regC = lmCoords(0, 0, 0, -70);
      addBox(THREE, scene, 32, 10, 12, 0xe7e5e4, -26, 5, regC[2], { map: stoneTex, castShadow: true });
      const skDome = new THREE.Mesh(new THREE.SphereGeometry(5.5, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(THREE, 0x2dd4bf, { metalness: 0.35, roughness: 0.4 }));
      skDome.position.set(-26, 10, regC[2]); scene.add(skDome);

    // ──────────────────────────────────────────────────────────────────────────
    // 7. MANITOBA: Terracotta Exchange District Warehouses & CMHR Spire
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'manitoba') {
      // Historic Exchange District Terracotta Warehouse Blocks (x = -24, z ∈ [-130, -40] and x = 24, z ∈ [50, 140])
      const whZ = [-110, -70, 70, 110];
      for (let i = 0; i < whZ.length; i += 1) {
        const wx = i < 2 ? -25 : 25, wz = whZ[i];
        // 4-storey Chicago-school terracotta brick warehouse
        addBox(THREE, scene, 12, 15, 14, 0x9a3412, wx, 7.5, wz, { map: stoneTex, roughness: 0.85, castShadow: true });
        // Heavy rusticated stone base & cornice
        addBox(THREE, scene, 12.6, 3.0, 14.6, 0x57534e, wx, 1.5, wz, { map: stoneTex });
        addBox(THREE, scene, 13.0, 1.2, 15.0, 0xb45309, wx, 15.6, wz, { roughness: 0.7 });
        // Rooftop timber water tower
        addCyl(THREE, scene, 1.6, 1.6, 3.2, 10, 0x78350f, wx + 3, 18, wz, { map: woodTex });
      }

      // Canadian Museum for Human Rights (CMHR) at landmark 0
      const cmhrC = lmCoords(0, 0, 0, -68);
      const cmhrX = -26, cmhrZ = cmhrC[2];
      addBox(THREE, scene, 24, 11, 15, 0x94a3b8, cmhrX, 5.5, cmhrZ, { map: stoneTex, castShadow: true });
      addCone(THREE, scene, 5.5, 30, 8, 0x38bdf8, cmhrX, 20.5, cmhrZ, { roughness: 0.15, metalness: 0.7, transparent: true, opacity: 0.82, emissive: 0x0284c7, emissiveIntensity: 0.35 });

      // The Forks Red & Assiniboine River Confluence
      const wpgC = lmCoords(1, 44, 0, 115);
      addBox(THREE, scene, 16, 0.16, 90, 0x1d5f82, wpgC[0], 0.1, wpgC[2], { ry: 0.35, bumpMap: waterBump, roughness: 0.15, metalness: 0.42 });
      buildAuroraCurtains(THREE, scene, state.auroraMeshes);

    // ──────────────────────────────────────────────────────────────────────────
    // 8. NEW BRUNSWICK: Bay of Fundy Flowerpot Rocks & Covered Wooden Bridge
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'new-brunswick') {
      // Bay of Fundy Flowerpot Rocks at landmark 0 (narrow base, wide top with dwarf spruce)
      const hwC = lmCoords(0, 0, 0, -65);
      const stacks = [[-26, hwC[2]], [-26, hwC[2] - 18], [34, -135], [34, -115]];
      for (let i = 0; i < stacks.length; i += 1) {
        addCyl(THREE, scene, 4.0, 2.2, 14, 9, 0xb45309, stacks[i][0], 7.0, stacks[i][1], { map: stoneTex, castShadow: true });
        addCone(THREE, scene, 3.6, 6.0, 7, 0x15803d, stacks[i][0], 16.5, stacks[i][1]);
      }

      // Hartland-Style Covered Wooden Bridge spanning a river branch at x = 45, z = 140
      const brX = 45, brZ = 140;
      // Red weathered wooden covered tunnel structure
      addBox(THREE, scene, 9, 5.5, 38, 0xb91c1c, brX, 4.0, brZ, { map: woodTex, castShadow: true });
      // Shingled gabled roof
      addCone(THREE, scene, 7, 3.5, 4, 0x374151, brX, 8.2, brZ, { ry: Math.PI / 4 });
      // Portal entrances with white trim
      addBox(THREE, scene, 9.4, 0.4, 0.4, 0xffffff, brX, 6.6, brZ - 19);
      addBox(THREE, scene, 9.4, 0.4, 0.4, 0xffffff, brX, 6.6, brZ + 19);
      // Stone river piers
      addCyl(THREE, scene, 2.0, 2.5, 6, 8, 0x78716c, brX, 1.5, brZ - 12, { map: stoneTex });
      addCyl(THREE, scene, 2.0, 2.5, 6, 8, 0x78716c, brX, 1.5, brZ + 12, { map: stoneTex });

      // Coastal Lighthouse (x = -48, z = 260)
      addCyl(THREE, scene, 2.2, 3.6, 16, 10, 0xf8fafc, -48, 8, 260, { map: concreteTex, castShadow: true });
      addCyl(THREE, scene, 2.4, 2.4, 3.0, 10, 0xef4444, -48, 17.5, 260);

    // ──────────────────────────────────────────────────────────────────────────
    // 9. PRINCE EDWARD ISLAND: Red Cliffs, Green Gables & Confederation Bridge
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'prince-edward-island') {
      // Vivid Rust-Red Sandstone Cliffs flanking roadside (x = -32 to -65)
      for (let i = 0; i < 6; i += 1) {
        addBox(THREE, scene, 24, 8 + (i % 2) * 4, 32, 0xb91c1c, -45, 4, -260 + i * 90, { map: stoneTex, roughness: 0.95 });
      }

      // Green Gables Heritage Farmhouse at landmark 1 (x = -32, z = 125)
      const ggC = lmCoords(1, -58, 0, 125);
      const ggX = -32, ggZ = ggC[2];
      addBox(THREE, scene, 13, 7, 10, 0xf8fafc, ggX, 3.5, ggZ, { map: woodTex, castShadow: true });
      // Distinctive emerald green gables
      addCone(THREE, scene, 9.2, 5.5, 4, 0x15803d, ggX, 9.75, ggZ, { ry: Math.PI / 4 });
      // Wrap-around porch
      addBox(THREE, scene, 14.5, 0.4, 3.5, 0xf8fafc, ggX, 0.2, ggZ - 6);
      // Red PEI barn
      addBox(THREE, scene, 16, 9, 12, 0xb91c1c, ggX - 18, 4.5, ggZ + 8, { map: woodTex });

      // Confederation Bridge piers & marine spans crossing Northumberland Strait
      const confC = lmCoords(0, 20, 0, -78);
      for (let i = 0; i < 9; i += 1) {
        const bx = confC[0] + i * 12, bz = confC[2] - Math.sin(i * 0.35) * 12;
        addBox(THREE, scene, 13, 1.8, 5, 0xe2e8f0, bx, 11, bz, { map: concreteTex, ry: Math.cos(i * 0.35) * 0.15 });
        addCyl(THREE, scene, 1.3, 1.9, 11, 8, 0xcbd5e1, bx, 5.5, bz, { map: concreteTex });
      }

    // ──────────────────────────────────────────────────────────────────────────
    // 10. NOVA SCOTIA: Peggy's Cove Granite & Pastel Fishing Shacks
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'nova-scotia') {
      // Peggy's Cove Glacially Scoured Granite Boulders
      const bCount = Math.round(75 * scale);
      const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(2.5, 0), mat(THREE, 0x6b7280, { map: stoneTex, roughness: 0.92 }), bCount);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < bCount; i += 1) {
        dummy.position.set(-26 - rng() * 55, 0.6, -160 + rng() * 220);
        dummy.scale.set(0.8 + rng() * 1.8, 0.5 + rng() * 0.9, 0.8 + rng() * 1.6);
        dummy.rotation.set(rng(), rng(), rng()); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
      }
      rocks.instanceMatrix.needsUpdate = true; scene.add(rocks);

      // Pastel Wooden Fishing Shacks on stilts over water with wharves & lobster traps
      const shacksZ = [90, 120, 150, 180];
      const pastels = [0x38bdf8, 0xfde047, 0xef4444, 0xa855f7];
      for (let i = 0; i < 4; i += 1) {
        const sz = shacksZ[i], col = pastels[i];
        // Wooden wharf / dock on pilings
        addBox(THREE, scene, 12, 0.3, 10, 0x78350f, 32, 1.5, sz, { map: woodTex });
        addCyl(THREE, scene, 0.2, 0.2, 3, 6, 0x5c4028, 28, 0, sz - 3);
        addCyl(THREE, scene, 0.2, 0.2, 3, 6, 0x5c4028, 36, 0, sz - 3);
        // Pastel fishing shack
        addBox(THREE, scene, 7, 5, 6, col, 32, 4.2, sz, { map: woodTex, castShadow: true });
        addCone(THREE, scene, 5.2, 3.2, 4, 0x374151, 32, 8.0, sz, { ry: Math.PI / 4 });
        // Stacked lobster traps
        addBox(THREE, scene, 1.5, 0.8, 1.2, 0x92400e, 27.5, 2.0, sz + 2);
      }

      // Peggy's Point Lighthouse at landmark 0
      const pcC = lmCoords(0, 0, 4, -72);
      const pcX = -26, pcZ = pcC[2];
      addCyl(THREE, scene, 9, 13, 4.5, 9, 0x64748b, pcX, 2.25, pcZ, { map: stoneTex, roughness: 0.92 });
      addCyl(THREE, scene, 2.2, 3.6, 16, 10, 0xf8fafc, pcX, 12, pcZ, { map: concreteTex, castShadow: true });
      addCyl(THREE, scene, 2.4, 2.4, 3.2, 10, 0xef4444, pcX, 21.6, pcZ, { metalness: 0.35 });
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), mat(THREE, 0xfef08a, { emissive: 0xfde047, emissiveIntensity: 1.8 }));
      lamp.position.set(pcX, 23.8, pcZ); scene.add(lamp); state.beaconMeshes.push(lamp);

      // Halifax Citadel star ramparts
      const hfxC = lmCoords(1, 0, 0, 80);
      addBox(THREE, scene, 34, 8, 22, 0x78716c, -45, 4, hfxC[2], { map: stoneTex, castShadow: true });

    // ──────────────────────────────────────────────────────────────────────────
    // 11. NEWFOUNDLAND: Jellybean Row Jewel-Tone Houses & Drifting Icebergs
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'newfoundland') {
      // Jellybean Row continuous terrace of vibrant jewel-toned saltbox houses (x = -26, z ∈ [-150, -60])
      const jelly = [0xef4444, 0xfacc15, 0x3b82f6, 0x10b981, 0xf97316, 0xa855f7, 0x06b6d4];
      for (let i = 0; i < 7; i += 1) {
        const jz = -145 + i * 13;
        const jh = 8.5 + (i % 2) * 1.8;
        // Jewel-tone clapboard house
        addBox(THREE, scene, 7.5, jh, 8.5, jelly[i], -26, jh * 0.5, jz, { map: woodTex, castShadow: true });
        // Contrasting white cornerboard & trim
        addBox(THREE, scene, 7.8, jh, 0.3, 0xffffff, -26, jh * 0.5, jz + 4.3);
        // Roof
        addCone(THREE, scene, 5.5, 3.2, 4, 0x334155, -26, jh + 1.6, jz, { ry: Math.PI / 4 });
        // Stepped front entrance stairs
        addBox(THREE, scene, 1.8, 0.8, 1.5, 0xffffff, -21.8, 0.4, jz);
      }

      // Drifting Icebergs in Iceberg Alley (floating offshore with animation)
      const icebergs = [];
      const bergZ = [120, 180, 240, 300];
      for (let i = 0; i < 4; i += 1) {
        const b = addBox(THREE, scene, 16 + i * 3, 10 + (i % 2) * 5, 14, 0xe0f2fe, 75 + i * 16, 4.5, bergZ[i], {
          roughness: 0.22, metalness: 0.15, transparent: true, opacity: 0.92
        });
        icebergs.push(b);
      }
      state.animators.push(function (t) {
        for (let i = 0; i < icebergs.length; i += 1) {
          icebergs[i].position.y = 4.2 + Math.sin(t * 0.85 + i * 1.2) * 0.4;
          icebergs[i].rotation.y = Math.sin(t * 0.2 + i) * 0.05;
        }
      });

      // Signal Hill Cabot Tower atop rocky hill at landmark 0
      const shC = lmCoords(0, 0, 12, -75);
      const shX = -32, shZ = shC[2];
      addCyl(THREE, scene, 14, 22, 12, 10, 0x4b5563, shX, 6, shZ, { map: stoneTex, roughness: 0.92 });
      addBox(THREE, scene, 8, 12, 8, 0x9a3412, shX, 18, shZ, { map: stoneTex, castShadow: true });
      addBox(THREE, scene, 4.5, 6, 4.5, 0x7c2d12, shX, 27, shZ, { map: stoneTex });

      // Gros Morne flat-topped tablelands plateau cliffs
      for (let i = 0; i < 5; i += 1) {
        addBox(THREE, scene, 55, 38, 50, 0x9a3412, 180, 19, -280 + i * 110, { map: stoneTex, roughness: 0.95 });
      }

    // ──────────────────────────────────────────────────────────────────────────
    // 12. YUKON: Klondike Gold Rush Boardwalk & Mount Logan Glaciers
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'yukon') {
      // Dawson City Klondike Gold Rush False-Front Storefronts & Boardwalk (x = -24, z ∈ [80, 200])
      const shops = ['ELDORADO SALOON', 'KLONDIKE MINING TRADING CO.', 'YUKON ASSAY OFFICE', 'BONANZA HOTEL'];
      for (let i = 0; i < 4; i += 1) {
        const sz = 90 + i * 28;
        // Wooden building
        addBox(THREE, scene, 8.5, 6.5, 8.5, 0x92400e, -24, 3.25, sz, { map: woodTex, castShadow: true });
        // False front facade extending high
        addBox(THREE, scene, 8.8, 3.5, 0.4, 0x78350f, -19.6, 8.25, sz, { map: woodTex });
        // Continuous raised wooden boardwalk sidewalk
        addBox(THREE, scene, 3.2, 0.35, 28, 0x78350f, -18.0, 0.35, sz, { map: woodTex });
      }

      // SS Klondike Sternwheeler at landmark 0 (with animated revolving paddle wheel)
      const ssC = lmCoords(0, 18, 0, -62);
      const ssX = 24, ssZ = ssC[2];
      addBox(THREE, scene, 24, 4, 8, 0xf8fafc, ssX, 2, ssZ, { map: woodTex, castShadow: true });
      addBox(THREE, scene, 16, 4, 6, 0xe2e8f0, ssX, 6, ssZ, { map: woodTex });
      const wheel = addCyl(THREE, scene, 3.2, 3.2, 5.5, 12, 0xef4444, ssX + 14, 3.2, ssZ, { rx: Math.PI / 2 });
      state.animators.push(function (t) { wheel.rotation.y = t * 1.5; });

      // Mount Logan glacier peaks (Canada's highest peak 5,959m)
      buildInstancedMountains(THREE, scene, Math.round(30 * scale), 200, -230, 85, true, rng);

    // ──────────────────────────────────────────────────────────────────────────
    // 13. NORTHWEST TERRITORIES: Elevated Permafrost Buildings & Ice Road
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'northwest-territories') {
      // Elevated Permafrost Buildings on Stilts with Insulated Utilidor Ducts (x = -24, z ∈ [-130, -20])
      const pz = [-120, -85, -50];
      for (let i = 0; i < 3; i += 1) {
        const bz = pz[i];
        // Heavy steel/timber stilts (clearance 1.6m above frozen ground)
        addCyl(THREE, scene, 0.22, 0.22, 1.8, 6, 0x475569, -27, 0.9, bz - 3);
        addCyl(THREE, scene, 0.22, 0.22, 1.8, 6, 0x475569, -21, 0.9, bz - 3);
        addCyl(THREE, scene, 0.22, 0.22, 1.8, 6, 0x475569, -27, 0.9, bz + 3);
        addCyl(THREE, scene, 0.22, 0.22, 1.8, 6, 0x475569, -21, 0.9, bz + 3);
        // Elevated modular dwelling
        addBox(THREE, scene, 8.5, 5.0, 8.5, i % 2 === 0 ? 0x0284c7 : 0xe2e8f0, -24, 4.3, bz, { map: concreteTex, castShadow: true });
        // Metal snow stairs down to ground
        addBox(THREE, scene, 1.8, 1.6, 2.5, 0x64748b, -19.2, 0.8, bz);
      }
      // Above-ground silver insulated Utilidor pipeline connecting the buildings
      addBox(THREE, scene, 0.5, 0.5, 80, 0x94a3b8, -20.0, 1.2, -85, { metalness: 0.8, roughness: 0.3 });

      // Diamond Mine Industrial Headframe at landmark 0
      const dmC = lmCoords(0, -65, 0, -135);
      addBox(THREE, scene, 12, 28, 12, 0x475569, dmC[0], 14, dmC[2], { metalness: 0.6, roughness: 0.4, castShadow: true });
      addCyl(THREE, scene, 5.5, 5.5, 2.5, 16, 0x38bdf8, dmC[0], 29, dmC[2], { emissive: 0x0284c7, emissiveIntensity: 0.6 });

      buildAuroraCurtains(THREE, scene, state.auroraMeshes);

    // ──────────────────────────────────────────────────────────────────────────
    // 14. NUNAVUT: Packed Snow Corridor, Stone Inuksuit & Polar Domes
    // ──────────────────────────────────────────────────────────────────────────
    } else if (id === 'nunavut') {
      // Traditional Stone Inuksuk Monuments along rocky headlands
      const inuksukLocs = [
        { x: -24, z: -66 },
        { x:  26, z: 110 },
        { x: -38, z: 220 }
      ];
      for (let k = 0; k < inuksukLocs.length; k += 1) {
        const inu = inuksukLocs[k];
        // Stacked granite legs
        addBox(THREE, scene, 1.8, 4.2, 1.5, 0x64748b, inu.x - 1.5, 2.1, inu.z, { map: stoneTex, roughness: 0.95 });
        addBox(THREE, scene, 1.8, 4.2, 1.5, 0x64748b, inu.x + 1.5, 2.1, inu.z, { map: stoneTex, roughness: 0.95 });
        // Torso / waist slab
        addBox(THREE, scene, 6.2, 1.8, 1.8, 0x78716c, inu.x, 5.1, inu.z, { map: stoneTex, roughness: 0.95 });
        // Chest
        addBox(THREE, scene, 3.4, 2.8, 1.8, 0x64748b, inu.x, 7.4, inu.z, { map: stoneTex, roughness: 0.95 });
        // Outstretched horizontal arms slab
        addBox(THREE, scene, 7.8, 1.2, 1.6, 0x78716c, inu.x, 9.4, inu.z, { map: stoneTex, roughness: 0.95 });
        // Head stone
        addBox(THREE, scene, 2.2, 2.2, 1.6, 0x94a3b8, inu.x, 11.1, inu.z, { map: stoneTex, roughness: 0.95 });
      }

      // Insulated Polar Community Geodesic Domes & High Arctic Research Pods on stilts
      const domeLocs = [{ x: -26, z: 80 }, { x: -26, z: 140 }, { x: 30, z: -140 }];
      for (let i = 0; i < domeLocs.length; i += 1) {
        const dl = domeLocs[i];
        // Stilts
        addCyl(THREE, scene, 0.2, 0.2, 1.5, 6, 0x64748b, dl.x - 3, 0.75, dl.z);
        addCyl(THREE, scene, 0.2, 0.2, 1.5, 6, 0x64748b, dl.x + 3, 0.75, dl.z);
        // Geodesic insulated polar dome
        const pod = new THREE.Mesh(new THREE.SphereGeometry(4.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), mat(THREE, 0xf1f5f9, { roughness: 0.35, metalness: 0.2 }));
        pod.position.set(dl.x, 1.5, dl.z); scene.add(pod);
      }

      // Arctic Sea Ice Floes & Tabular Bergs in Frobisher Bay
      const floeC = lmCoords(1, 64, 0, 120);
      for (let i = 0; i < 9; i += 1) {
        addBox(THREE, scene, 13 + rng() * 8, 0.9, 11 + rng() * 6, 0xdbeafe, floeC[0] + (i % 3) * 16, 0.2, floeC[2] - Math.floor(i / 3) * 20, { roughness: 0.25 });
      }

      // Baffin Island glaciated peaks
      buildInstancedMountains(THREE, scene, Math.round(26 * scale), 180, -220, 65, true, rng);
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

  // ─── Functional Buildings (Gameplay Hubs at x = ±8.2, z ∈ [2, 28]) ─────────

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
          a.position.x = (-25 + i * 26) + Math.sin(elapsed * 0.35 + i) * 6;
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
