/**
 * Canada Landmarks & Procedural Biome Builder (Three.js r128)
 * Exposes `window.CanadaLandmarks.buildProvinceWorld(scene, province, qualityTier)`
 * Uses InstancedMesh for forests, wheat, skylines, rocks/icebergs, and mountain ridges.
 */
(function (global) {
  'use strict';

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

  function mat(THREE, color, opts) {
    const o = opts || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: o.roughness !== undefined ? o.roughness : 0.72,
      metalness: o.metalness !== undefined ? o.metalness : 0.12,
      emissive: o.emissive !== undefined ? o.emissive : 0x000000,
      emissiveIntensity: o.emissiveIntensity !== undefined ? o.emissiveIntensity : 0,
      transparent: !!o.transparent,
      opacity: o.opacity !== undefined ? o.opacity : 1.0,
      side: o.side !== undefined ? o.side : THREE.FrontSide
    });
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
    scene.background = new THREE.Color(c.skyHorizon);
    scene.fog = new THREE.FogExp2(c.fogColor, qualityTier === 'battery' ? 0.0042 : 0.0032);

    const hemi = new THREE.HemisphereLight(c.sunColor, c.groundColor, 0.72);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(c.sunColor, 1.15);
    sun.position.set(75, 110, 55);
    if (qualityTier !== 'battery') {
      sun.castShadow = true;
      sun.shadow.mapSize.width = qualityTier === 'ultra' ? 2048 : 1024;
      sun.shadow.mapSize.height = qualityTier === 'ultra' ? 2048 : 1024;
      sun.shadow.camera.near = 10;
      sun.shadow.camera.far = 320;
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

    // Gradient sky dome
    const skyGeo = new THREE.SphereGeometry(420, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(c.skyTop) },
        bottomColor: { value: new THREE.Color(c.skyHorizon) }
      },
      vertexShader: 'varying vec3 vWorldPosition; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWorldPosition = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
      fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; varying vec3 vWorldPosition; void main(){ float h = normalize(vWorldPosition).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h,0.0),0.65),0.0)), 1.0); }'
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);

    return { hemi, sun, fill, skyMesh, skyMat };
  }

  function buildGroundAndHighway(THREE, scene, province) {
    const c = province.climate;
    const groundGeo = new THREE.PlaneGeometry(520, 520, 48, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position;
    const isFlat = province.biome === 'living-skies-wheat' || province.biome === 'prairie-lake' || province.biome === 'subarctic-shield';
    const amp = isFlat ? 0.6 : 2.2;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromRoad = Math.abs(x);
      if (distFromRoad > 14 && Math.abs(z) > 10) {
        const hill = Math.sin(x * 0.045) * Math.cos(z * 0.045) * amp + Math.sin((x + z) * 0.02) * amp;
        pos.setY(i, Math.max(-0.4, hill * Math.min(1, (distFromRoad - 14) / 22)));
      }
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, mat(THREE, c.groundColor, { roughness: 0.92, metalness: 0.04 }));
    ground.receiveShadow = true;
    scene.add(ground);

    // Trans-Canada / Provincial Highway strip along Z
    const isIceRoad = province.id === 'northwest-territories' || province.id === 'nunavut';
    const roadColor = isIceRoad ? 0x9ec5de : 0x262b33;
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 460),
      mat(THREE, roadColor, { roughness: isIceRoad ? 0.35 : 0.85, metalness: isIceRoad ? 0.2 : 0.05 })
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

    // Water body (lake, river, fjord, or ocean)
    const waterGeo = new THREE.PlaneGeometry(520, 260);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: c.waterColor,
      roughness: isIceRoad ? 0.28 : 0.16,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, -0.35, -185);
    if (province.biome === 'atlantic-iceberg' || province.biome === 'granite-lighthouse' || province.biome === 'fundy-coast') {
      waterMesh.position.set(0, -0.35, -145);
    }
    scene.add(waterMesh);

    return { ground, road, waterMesh };
  }

  function buildInstancedForest(THREE, scene, province, scale, rng) {
    const biome = province.biome;
    if (biome === 'arctic-tundra') return;

    const isWheat = biome === 'living-skies-wheat';
    if (isWheat) {
      const count = Math.round(900 * scale);
      const stalkGeo = new THREE.ConeGeometry(0.16, 1.5, 4);
      stalkGeo.translate(0, 0.75, 0);
      const wheat = new THREE.InstancedMesh(stalkGeo, mat(THREE, 0xd4a024, { roughness: 0.85 }), count);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < count; i += 1) {
        const side = rng() > 0.5 ? 1 : -1;
        const x = side * (12 + rng() * 140);
        const z = -120 + rng() * 240;
        dummy.position.set(x, 0, z);
        dummy.rotation.set((rng() - 0.5) * 0.12, rng() * Math.PI * 2, (rng() - 0.5) * 0.12);
        const s = 0.75 + rng() * 0.6;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        wheat.setMatrixAt(i, dummy.matrix);
      }
      wheat.instanceMatrix.needsUpdate = true;
      scene.add(wheat);
      return;
    }

    const treeCount = Math.round((biome === 'subarctic-shield' ? 90 : 180) * scale);
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.4, 6);
    trunkGeo.translate(0, 1.2, 0);
    const crownGeo = new THREE.ConeGeometry(1.7, 5.2, 7);
    crownGeo.translate(0, 4.4, 0);

    const isMaple = biome === 'great-lakes-metro' || biome === 'capital-canal' || biome === 'red-sand-island';
    const crownColor = isMaple ? 0x2d6a3e : (biome === 'subarctic-shield' ? 0x1e4231 : 0x1b4d34);

    const trunks = new THREE.InstancedMesh(trunkGeo, mat(THREE, 0x4b3621, { roughness: 0.9 }), treeCount);
    const crowns = new THREE.InstancedMesh(crownGeo, mat(THREE, crownColor, { roughness: 0.8 }), treeCount);

    const dummy = new THREE.Object3D();
    let placed = 0;
    let attempts = 0;
    while (placed < treeCount && attempts < treeCount * 4) {
      attempts += 1;
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (14 + rng() * 135);
      const z = -95 + rng() * 220;
      // Keep clear of central landmark plazas
      if (Math.abs(x) < 18 && Math.abs(z + 52) < 22) continue;
      const s = 0.7 + rng() * 0.85;
      dummy.position.set(x, 0, z);
      dummy.rotation.y = rng() * Math.PI * 2;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      trunks.setMatrixAt(placed, dummy.matrix);
      crowns.setMatrixAt(placed, dummy.matrix);
      placed += 1;
    }
    trunks.count = placed;
    crowns.count = placed;
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    scene.add(trunks);
    scene.add(crowns);
  }

  function buildInstancedMountains(THREE, scene, count, xRange, zBase, maxHeight, snowCap, rng) {
    const mGeo = new THREE.ConeGeometry(16, 1, 6);
    mGeo.translate(0, 0.5, 0);
    const rock = new THREE.InstancedMesh(mGeo, mat(THREE, 0x525b66, { roughness: 0.92 }), count);
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

  function buildInstancedSkyline(THREE, scene, count, centerX, centerZ, spreadX, maxH, rng) {
    const bGeo = new THREE.BoxGeometry(1, 1, 1);
    bGeo.translate(0, 0.5, 0);
    const bMat = mat(THREE, 0x3b4d63, { roughness: 0.35, metalness: 0.55 });
    const buildings = new THREE.InstancedMesh(bGeo, bMat, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const x = centerX + (rng() - 0.5) * spreadX;
      const z = centerZ + (rng() - 0.5) * 34;
      const w = 4 + rng() * 6;
      const d = 4 + rng() * 6;
      const h = 10 + rng() * maxH;
      dummy.position.set(x, 0, z);
      dummy.rotation.y = 0;
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      buildings.setMatrixAt(i, dummy.matrix);
    }
    buildings.instanceMatrix.needsUpdate = true;
    scene.add(buildings);
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

    if (id === 'ontario') {
      // CN Tower (0, 0, -55)
      const cn = new THREE.Group();
      cn.position.set(0, 0, -55);
      addCyl(THREE, cn, 2.2, 5.2, 46, 12, 0xcbd5e1, 0, 23, 0, { castShadow: true });
      addCyl(THREE, cn, 6.2, 5.4, 4.2, 18, 0xe2e8f0, 0, 46, 0, { castShadow: true });
      addCyl(THREE, cn, 5.8, 5.8, 1.4, 18, 0x38bdf8, 0, 46.2, 0, { emissive: 0x0ea5e9, emissiveIntensity: 0.45 });
      addCyl(THREE, cn, 0.4, 1.8, 18, 8, 0xf1f5f9, 0, 57, 0);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 10), mat(THREE, 0xff2244, { emissive: 0xff2244, emissiveIntensity: 1.6 }));
      beacon.position.set(0, 66.5, 0);
      cn.add(beacon);
      state.beaconMeshes.push(beacon);
      scene.add(cn);

      // Rogers-style Dome (-42, 0, -42)
      const dome = new THREE.Mesh(new THREE.SphereGeometry(12, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(THREE, 0xdbeafe, { roughness: 0.4, metalness: 0.3 }));
      dome.position.set(-42, 0, -42);
      scene.add(dome);
      addCyl(THREE, scene, 12.6, 13, 3.5, 20, 0x334155, -42, 1.75, -42);

      // Niagara Falls (78, 0, 52)
      addBox(THREE, scene, 26, 12, 16, 0x475569, 78, 6, 44);
      const falls = addBox(THREE, scene, 20, 12.2, 2.5, 0x38bdf8, 78, 6, 52, { emissive: 0x0284c7, emissiveIntensity: 0.35, transparent: true, opacity: 0.82 });
      state.animators.push(function (t) { falls.material.opacity = 0.72 + Math.sin(t * 4.5) * 0.12; });

      buildInstancedSkyline(THREE, scene, Math.round(28 * scale), -24, -68, 75, 26, rng);
    } else if (id === 'quebec') {
      // Château Frontenac (0, 10, -58)
      addBox(THREE, scene, 44, 10, 26, 0x57534e, 0, 5, -58); // Cap Diamant cliff
      const ch = new THREE.Group();
      ch.position.set(0, 10, -58);
      addBox(THREE, ch, 22, 14, 14, 0x9a3412, 0, 7, 0, { castShadow: true });
      addBox(THREE, ch, 9, 22, 9, 0xb45309, 0, 11, 0, { castShadow: true });
      addCone(THREE, ch, 6.2, 11, 8, 0x2dd4bf, 0, 27.5, 0);
      addCyl(THREE, ch, 3.2, 3.2, 16, 10, 0x9a3412, -11, 8, 5);
      addCone(THREE, ch, 3.6, 8, 8, 0x2dd4bf, -11, 20, 5);
      addCyl(THREE, ch, 3.2, 3.2, 16, 10, 0x9a3412, 11, 8, 5);
      addCone(THREE, ch, 3.6, 8, 8, 0x2dd4bf, 11, 20, 5);
      scene.add(ch);

      // Montreal Inclined Tower (-72, 0, 44)
      const olympic = addBox(THREE, scene, 4.5, 34, 4.5, 0xe2e8f0, -72, 15, 44, { rz: -0.45, castShadow: true });
      addCyl(THREE, scene, 12, 14, 4, 18, 0x475569, -62, 2, 44);
      void olympic;
      buildInstancedSkyline(THREE, scene, Math.round(22 * scale), 54, -46, 55, 18, rng);
    } else if (id === 'british-columbia') {
      // Canada Place Sails (-18, 0, -48)
      addBox(THREE, scene, 26, 3, 12, 0x334155, -18, 1.5, -48);
      for (let i = 0; i < 5; i += 1) {
        addCone(THREE, scene, 2.8, 11, 4, 0xf8fafc, -26 + i * 4.2, 8.5, -48, { castShadow: true });
      }
      // Lions Gate Bridge (62, 0, -18)
      addBox(THREE, scene, 56, 1.8, 5, 0x10b981, 62, 11, -18);
      addBox(THREE, scene, 2, 24, 5, 0x059669, 44, 12, -18);
      addBox(THREE, scene, 2, 24, 5, 0x059669, 80, 12, -18);

      buildInstancedMountains(THREE, scene, Math.round(24 * scale), 150, -96, 54, true, rng);
      buildInstancedSkyline(THREE, scene, Math.round(20 * scale), -36, -68, 50, 22, rng);
    } else if (id === 'alberta') {
      // Calgary Tower (0, 0, -52)
      addCyl(THREE, scene, 2.0, 2.8, 36, 12, 0xdbeafe, 0, 18, -52, { castShadow: true });
      addCyl(THREE, scene, 4.6, 3.8, 3.2, 16, 0xf59e0b, 0, 36, -52, { emissive: 0xd97706, emissiveIntensity: 0.35 });
      addCyl(THREE, scene, 0.3, 0.8, 9, 8, 0xffffff, 0, 42, -52);
      buildInstancedSkyline(THREE, scene, Math.round(20 * scale), 0, -64, 54, 24, rng);

      // Banff Rockies & Lake Louise turquoise basin (68, 0, -68)
      buildInstancedMountains(THREE, scene, Math.round(26 * scale), 160, -96, 62, true, rng);
      const louise = new THREE.Mesh(new THREE.CircleGeometry(18, 24), mat(THREE, 0x14b8a6, { roughness: 0.15, emissive: 0x0d9488, emissiveIntensity: 0.2 }));
      louise.rotation.x = -Math.PI / 2;
      louise.position.set(68, 0.12, -68);
      scene.add(louise);
    } else if (id === 'national-capital') {
      // Parliament Hill & Peace Tower (0, 0, -56)
      addBox(THREE, scene, 36, 11, 14, 0xd6d3d1, 0, 5.5, -56, { castShadow: true });
      addBox(THREE, scene, 37, 2.5, 15, 0x2dd4bf, 0, 12.2, -56); // Copper roof
      addBox(THREE, scene, 6.2, 32, 6.2, 0xe7e5e4, 0, 16, -50, { castShadow: true }); // Peace Tower
      addCone(THREE, scene, 4.4, 9, 4, 0x2dd4bf, 0, 36.5, -50);
      // Clock face glow
      addBox(THREE, scene, 2.6, 2.6, 0.4, 0xfef08a, 0, 26, -46.8, { emissive: 0xfacc15, emissiveIntensity: 0.7 });

      // Rideau Canal waterway (46, 0, -16)
      addBox(THREE, scene, 12, 0.18, 120, 0x1e6b8a, 46, 0.1, -16);
      // Alexandra Bridge (-58, 0, -44)
      addBox(THREE, scene, 42, 1.5, 4.5, 0x64748b, -58, 8, -44);
      addBox(THREE, scene, 1.5, 9, 4.5, 0x475569, -70, 4.5, -44);
      addBox(THREE, scene, 1.5, 9, 4.5, 0x475569, -46, 4.5, -44);
    } else if (id === 'nova-scotia') {
      // Peggy's Cove Lighthouse (0, 4, -52)
      addCyl(THREE, scene, 9, 13, 4.5, 9, 0x64748b, 0, 2.25, -52); // Granite outcrop
      addCyl(THREE, scene, 2.2, 3.6, 16, 8, 0xf8fafc, 0, 12, -52, { castShadow: true });
      addCyl(THREE, scene, 2.4, 2.4, 3.2, 8, 0xef4444, 0, 21.6, -52);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), mat(THREE, 0xfef08a, { emissive: 0xfde047, emissiveIntensity: 1.8 }));
      lamp.position.set(0, 23.8, -52);
      scene.add(lamp);
      state.beaconMeshes.push(lamp);

      // Instanced granite boulders
      const bCount = Math.round(65 * scale);
      const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(2.4, 0), mat(THREE, 0x6b7280, { roughness: 0.9 }), bCount);
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
      addCyl(THREE, scene, 14, 22, 12, 10, 0x4b5563, 0, 6, -56);
      addBox(THREE, scene, 8, 12, 8, 0x9a3412, 0, 18, -56, { castShadow: true });
      addBox(THREE, scene, 4.5, 6, 4.5, 0x7c2d12, 0, 27, -56);

      // Jellybean Row (-52, 0, -18)
      const jelly = [0xef4444, 0xfacc15, 0x3b82f6, 0x10b981, 0xf97316, 0xa855f7];
      for (let i = 0; i < 6; i += 1) {
        addBox(THREE, scene, 5.2, 7.5 + (i % 2) * 1.5, 6, jelly[i], -66 + i * 5.6, 3.75, -18, { castShadow: true });
      }

      // Drifting Tabular Atlantic Icebergs (66, 0, -48)
      const bergs = [];
      for (let i = 0; i < 4; i += 1) {
        const b = addBox(THREE, scene, 12 + i * 2, 8 + (i % 2) * 4, 10, 0xe0f2fe, 52 + i * 18, 3.5, -52 - i * 14, { roughness: 0.3 });
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
        addCyl(THREE, scene, 3.6, 2.2, 13, 9, 0xb45309, sx, 6.5, sz, { castShadow: true });
        addCone(THREE, scene, 3.2, 5.5, 7, 0x15803d, sx, 15.5, sz);
      }
      // Bay of Fundy Red Cliffs (-56, 0, -34)
      addBox(THREE, scene, 26, 16, 18, 0x9a3412, -56, 8, -34);
      // Saint John Harbour Span (64, 0, 28)
      addBox(THREE, scene, 40, 1.8, 5, 0x64748b, 64, 10, 28);
      addCyl(THREE, scene, 1.5, 1.5, 12, 8, 0x475569, 48, 6, 28);
      addCyl(THREE, scene, 1.5, 1.5, 12, 8, 0x475569, 80, 6, 28);
    } else if (id === 'prince-edward-island') {
      // Curved Multi-Span Confederation Bridge (20, 0, -58)
      for (let i = 0; i < 9; i += 1) {
        const bx = -20 + i * 11;
        const bz = -58 - Math.sin(i * 0.35) * 10;
        addBox(THREE, scene, 12, 1.6, 4.5, 0xe2e8f0, bx, 10, bz, { ry: Math.cos(i * 0.35) * 0.15 });
        addCyl(THREE, scene, 1.1, 1.6, 10, 8, 0xcbd5e1, bx, 5, bz);
      }
      // Green Gables (-52, 0, 22)
      addBox(THREE, scene, 12, 6, 9, 0xf8fafc, -52, 3, 22, { castShadow: true });
      addCone(THREE, scene, 8.5, 5, 4, 0x15803d, -52, 8.5, 22);
      // Red Iron Cliffs & Point Prim Lighthouse (-64, 0, -32)
      addBox(THREE, scene, 22, 6, 14, 0xb91c1c, -64, 3, -32);
      addCyl(THREE, scene, 1.8, 2.6, 12, 12, 0xf8fafc, -64, 12, -32);
      addCyl(THREE, scene, 2.0, 2.0, 2.2, 12, 0xef4444, -64, 19, -32);
    } else if (id === 'manitoba') {
      // Canadian Museum for Human Rights (0, 0, -54)
      addBox(THREE, scene, 22, 10, 14, 0x94a3b8, 0, 5, -54, { castShadow: true });
      addCone(THREE, scene, 5, 28, 8, 0x38bdf8, 0, 19, -54, { transparent: true, opacity: 0.82, emissive: 0x0284c7, emissiveIntensity: 0.25 });
      // Forks Confluence (36, 0, -24)
      addBox(THREE, scene, 14, 0.16, 80, 0x1d5f82, 36, 0.1, -24, { ry: 0.35 });
      buildAuroraCurtains(THREE, scene, state.auroraMeshes);
    } else if (id === 'saskatchewan') {
      // Regina Legislative Dome (0, 0, -56)
      addBox(THREE, scene, 32, 10, 12, 0xe7e5e4, 0, 5, -56, { castShadow: true });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(5.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(THREE, 0x2dd4bf));
      dome.position.set(0, 10, -56);
      scene.add(dome);
      addCyl(THREE, scene, 2.2, 2.2, 6, 12, 0xd6d3d1, 0, 12, -56);

      // Grain Elevators (-54, 0, -24)
      for (let i = 0; i < 3; i += 1) {
        addBox(THREE, scene, 6.5, 18, 6.5, 0xb91c1c, -62 + i * 9, 9, -24, { castShadow: true });
        addCone(THREE, scene, 4.6, 4.5, 4, 0x7f1d1d, -62 + i * 9, 20.25, -24);
      }
      // Wascana Lake (58, 0, 26)
      const wascana = new THREE.Mesh(new THREE.CircleGeometry(22, 24), mat(THREE, 0x1e6b8a, { roughness: 0.2 }));
      wascana.rotation.x = -Math.PI / 2;
      wascana.position.set(58, 0.1, 26);
      scene.add(wascana);
    } else if (id === 'yukon') {
      // SS Klondike Sternwheeler (18, 0, -42)
      addBox(THREE, scene, 22, 4, 7, 0xf8fafc, 18, 2, -42, { castShadow: true });
      addBox(THREE, scene, 15, 3.5, 5.5, 0xe2e8f0, 18, 5.75, -42);
      const wheel = addCyl(THREE, scene, 2.6, 2.6, 4.8, 12, 0xef4444, 30, 3, -42, { rx: Math.PI / 2 });
      state.animators.push(function (t) { wheel.rotation.y = t * 1.4; });

      // Dawson Boardwalk (-52, 0, 24)
      for (let i = 0; i < 4; i += 1) {
        addBox(THREE, scene, 6, 7, 7, 0x92400e, -62 + i * 7.5, 3.5, 24);
      }
      buildInstancedMountains(THREE, scene, Math.round(24 * scale), 160, -98, 68, true, rng);
    } else if (id === 'northwest-territories') {
      // Diamond Mine Headframe (-58, 0, -56)
      addBox(THREE, scene, 10, 24, 10, 0x475569, -58, 12, -56, { castShadow: true });
      addCyl(THREE, scene, 4.5, 4.5, 2, 16, 0x38bdf8, -58, 24.5, -56, { emissive: 0x0284c7, emissiveIntensity: 0.5 });
      buildAuroraCurtains(THREE, scene, state.auroraMeshes);
    } else if (id === 'nunavut') {
      // Monumental Inuksuk (0, 0, -50)
      addBox(THREE, scene, 3.2, 6.5, 2.2, 0x64748b, -2.5, 3.25, -50, { castShadow: true });
      addBox(THREE, scene, 3.2, 6.5, 2.2, 0x64748b, 2.5, 3.25, -50, { castShadow: true });
      addBox(THREE, scene, 10.5, 2.6, 2.8, 0x94a3b8, 0, 7.8, -50, { castShadow: true });
      addBox(THREE, scene, 5.5, 4.2, 2.6, 0x64748b, 0, 11.2, -50, { castShadow: true });
      addBox(THREE, scene, 3.4, 3.2, 2.4, 0x94a3b8, 0, 14.9, -50, { castShadow: true });

      // Sea Ice Plates (56, 0, -28)
      for (let i = 0; i < 8; i += 1) {
        addBox(THREE, scene, 11 + rng() * 8, 0.7, 9 + rng() * 6, 0xdbeafe, 42 + (i % 4) * 14, 0.1, -20 - Math.floor(i / 4) * 18);
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
      waterMesh: null
    };

    state.lights = buildSkyAndLighting(THREE, scene, province, tier);
    const groundInfo = buildGroundAndHighway(THREE, scene, province);
    state.waterMesh = groundInfo.waterMesh;

    buildInstancedForest(THREE, scene, province, scale, rng);
    buildProvinceLandmarks(THREE, scene, province, scale, rng, state);
    buildLandmarkMarkers(THREE, scene, province, state);

    return {
      lights: state.lights,
      waterMesh: state.waterMesh,
      auroraMeshes: state.auroraMeshes,
      beaconMeshes: state.beaconMeshes,
      landmarkMarkers: state.landmarkMarkers,
      update: function (elapsed) {
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
