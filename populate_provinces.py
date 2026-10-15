# -*- coding: utf-8 -*-
"""
populate_provinces.py
Injects geographically authentic regional scenery, settlement architecture,
and updated collision boundaries into all 14 Canadian province and territory realms.
"""

import os
import re

SCENERY_DEFINITIONS = {
    'province-british-columbia.html': {
        'name': 'British Columbia - Pacific Cascadia & Burrard Harbour',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: PACIFIC CASCADIA
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const woodDarkMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.9 });
      const woodPlankMat = new THREE.MeshStandardMaterial({ color: 0x3d2d22, roughness: 0.85 });
      const shingleMat = new THREE.MeshStandardMaterial({ color: 0x221812, roughness: 0.88 });
      const redCedarWallMat = new THREE.MeshStandardMaterial({ color: 0x482a1c, roughness: 0.82 });
      const mossRockMat = new THREE.MeshStandardMaterial({ color: 0x2c382b, roughness: 0.95 });
      const needleMat = new THREE.MeshStandardMaterial({ color: 0x0e2b1b, roughness: 0.75 });
      const ironMat = new THREE.MeshStandardMaterial({ color: 0x1a1e20, metalness: 0.85, roughness: 0.35 });

      // 1. Coastal Timber Fishing Dock Pier (x: -38, z: -15)
      const pierGroup = new THREE.Group();
      pierGroup.position.set(-38, 0, -15);
      regionalGroup.add(pierGroup);

      const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 24), woodPlankMat);
      pierDeck.position.y = 1.0;
      pierDeck.castShadow = true; pierDeck.receiveShadow = true;
      pierGroup.add(pierDeck);

      for (let px of [-4.2, 0, 4.2]) {
        for (let pz of [-10, -5, 0, 5, 10]) {
          const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 3.2, 8), woodDarkMat);
          pile.position.set(px, 0.4, pz);
          pile.castShadow = true;
          pierGroup.add(pile);
        }
      }

      [-8, 0, 8].forEach(bz => {
        const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.8, 8), ironMat);
        bollard.position.set(4.5, 1.6, bz);
        pierGroup.add(bollard);
      });
      const dockLamp = new THREE.PointLight(0xffaa44, 1.4, 28);
      dockLamp.position.set(0, 3.5, 0);
      pierGroup.add(dockLamp);

      // 2. Harbourmaster Shack / Fish House (x: -46, z: -15)
      const shackGroup = new THREE.Group();
      shackGroup.position.set(-46, 0, -15);
      regionalGroup.add(shackGroup);

      const shackBase = new THREE.Mesh(new THREE.BoxGeometry(8, 5.2, 11), redCedarWallMat);
      shackBase.position.y = 2.6;
      shackBase.castShadow = true; shackBase.receiveShadow = true;
      shackGroup.add(shackBase);

      const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(7.5, 3.2, 4), shingleMat);
      roofMesh.position.y = 6.8;
      roofMesh.rotation.y = Math.PI / 4;
      roofMesh.scale.set(1.1, 1.0, 1.4);
      roofMesh.castShadow = true;
      shackGroup.add(roofMesh);

      for (let i = 0; i < 4; i++) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.4), woodDarkMat);
        crate.position.set(3.5, 0.45 + (i > 1 ? 0.9 : 0), -3 + (i % 2) * 1.6);
        crate.castShadow = true;
        shackGroup.add(crate);
      }

      // 3. Shoreline Driftwood Logs & Coastal Mossy Boulders
      const driftLogs = [
        { x: 34, z: 12, ry: 0.3, len: 14, r: 0.65 },
        { x: -32, z: 25, ry: -0.4, len: 12, r: 0.55 }
      ];
      driftLogs.forEach(dl => {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(dl.r * 0.85, dl.r, dl.len, 8), woodDarkMat);
        log.rotation.z = Math.PI / 2;
        log.rotation.y = dl.ry;
        log.position.set(dl.x, 0.4, dl.z);
        log.castShadow = true; log.receiveShadow = true;
        regionalGroup.add(log);
      });

      const mossBoulders = [
        { x: 34, z: -30, s: 4.8 },
        { x: -32, z: -70, s: 5.2 },
        { x: 42, z: 2, s: 3.6 }
      ];
      mossBoulders.forEach(mb => {
        const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(mb.s, 1), mossRockMat);
        boulder.position.set(mb.x, mb.s * 0.55, mb.z);
        boulder.rotation.set(0.3, 0.7, 0.2);
        boulder.scale.set(1.2, 0.85, 1.1);
        boulder.castShadow = true; boulder.receiveShadow = true;
        regionalGroup.add(boulder);
      });

      // 4. Pacific Red Cedar & Coastal Hemlock Trees
      const treeCoords = [
        { x: -35, z: 5, h: 14, w: 5 },
        { x: -52, z: 8, h: 18, w: 6 },
        { x: 36, z: -15, h: 15, w: 5.5 },
        { x: 48, z: -40, h: 17, w: 6.2 },
        { x: -36, z: -45, h: 13, w: 4.8 }
      ];
      treeCoords.forEach(tc => {
        const tree = new THREE.Group();
        tree.position.set(tc.x, 0, tc.z);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, tc.h * 0.4, 7), woodDarkMat);
        trunk.position.y = tc.h * 0.2;
        trunk.castShadow = true;
        tree.add(trunk);
        for (let t = 0; t < 3; t++) {
          const tier = new THREE.Mesh(new THREE.ConeGeometry(tc.w * (1 - t * 0.22), tc.h * 0.35, 7), needleMat);
          tier.position.y = tc.h * (0.35 + t * 0.22);
          tier.castShadow = true;
          tree.add(tier);
        }
        distantDecorGroup.add(tree);
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: 10, r: 14 }",
            "{ x: 0, z: 190, r: 14 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 180, z: 80, r: 8 }",
            "{ x: -55, z: -20, r: 8 }",
            "{ x: 55, z: -20, r: 8 }",
            "{ x: -46, z: -15, r: 7 }",
            "{ x: -38, z: -15, r: 6 }",
            "{ x: 34, z: -30, r: 4.5 }",
            "{ x: -32, z: -70, r: 4.5 }"
        ]
    },

    'province-alberta.html': {
        'name': 'Alberta - Rocky Mountain Alpine Ranger Outpost & Moraine',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: BANFF ROCKIES & FOOTHILLS
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const logMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.88 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x241710, roughness: 0.9 });
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x62666a, roughness: 0.92 });
      const woodDeckMat = new THREE.MeshStandardMaterial({ color: 0x483222, roughness: 0.85 });
      const moraineRockMat = new THREE.MeshStandardMaterial({ color: 0x767c82, roughness: 0.94 });
      const pineMat = new THREE.MeshStandardMaterial({ color: 0x162c1b, roughness: 0.78 });

      // 1. Alpine Ranger Log Outpost & Observation Platform (x: -48, z: -15)
      const outpostGroup = new THREE.Group();
      outpostGroup.position.set(-48, 0, -15);
      regionalGroup.add(outpostGroup);

      const cabinBase = new THREE.Mesh(new THREE.BoxGeometry(11, 5.5, 9), logMat);
      cabinBase.position.y = 2.75;
      cabinBase.castShadow = true; cabinBase.receiveShadow = true;
      outpostGroup.add(cabinBase);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(8.5, 3.4, 4), roofMat);
      roof.position.y = 7.2;
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.3, 1.0, 1.1);
      roof.castShadow = true;
      outpostGroup.add(roof);

      const chimney = new THREE.Mesh(new THREE.BoxGeometry(2.0, 8.5, 2.2), stoneMat);
      chimney.position.set(4.5, 4.25, 0);
      chimney.castShadow = true;
      outpostGroup.add(chimney);

      // Elevated observation platform with handrail
      const deck = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.35, 5.2), woodDeckMat);
      deck.position.set(-5.5, 4.2, 0);
      deck.castShadow = true;
      outpostGroup.add(deck);

      for (let sx of [-7.8, -3.2]) {
        for (let sz of [-2.4, 2.4]) {
          const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4.2, 8), logMat);
          stilt.position.set(sx, 2.1, sz);
          stilt.castShadow = true;
          outpostGroup.add(stilt);
        }
      }

      const deckLamp = new THREE.PointLight(0xffb044, 1.3, 26);
      deckLamp.position.set(-5.5, 5.8, 0);
      outpostGroup.add(deckLamp);

      // 2. Trailhead Sign & Bench
      const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 0.3), logMat);
      signPost.position.set(-34, 1.2, 5);
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.15), woodDeckMat);
      signBoard.position.set(-34, 2.0, 5);
      regionalGroup.add(signPost); regionalGroup.add(signBoard);

      // 3. Rustic Split-Rail Fencing
      for (let fz = 20; fz >= -50; fz -= 14) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 6), logMat);
        post.position.set(-32, 0.8, fz);
        post.castShadow = true;
        regionalGroup.add(post);
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 14, 6), logMat);
        rail.rotation.x = Math.PI / 2;
        rail.position.set(-32, 1.1, fz - 7);
        rail.castShadow = true;
        regionalGroup.add(rail);
      }

      // 4. Glacial Moraine Limestone Boulders
      const moraineRocks = [
        { x: 38, z: -10, s: 5.2 },
        { x: 42, z: -45, s: 5.6 },
        { x: -36, z: 15, s: 3.8 }
      ];
      moraineRocks.forEach(mr => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(mr.s, 1), moraineRockMat);
        rock.position.set(mr.x, mr.s * 0.52, mr.z);
        rock.rotation.set(0.4, 0.9, 0.1);
        rock.scale.set(1.25, 0.8, 1.1);
        rock.castShadow = true; rock.receiveShadow = true;
        regionalGroup.add(rock);
      });

      // 5. Alpine Lodgepole Pines & Foothills Conifers
      const pineCoords = [
        { x: -36, z: -10, h: 16, w: 4.5 },
        { x: -55, z: 12, h: 18, w: 5.0 },
        { x: 36, z: 12, h: 14, w: 4.2 },
        { x: 48, z: -25, h: 19, w: 5.2 },
        { x: -38, z: -55, h: 15, w: 4.6 }
      ];
      pineCoords.forEach(pc => {
        const tree = new THREE.Group();
        tree.position.set(pc.x, 0, pc.z);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, pc.h * 0.45, 7), logMat);
        trunk.position.y = pc.h * 0.225;
        trunk.castShadow = true;
        tree.add(trunk);
        for (let t = 0; t < 3; t++) {
          const tier = new THREE.Mesh(new THREE.ConeGeometry(pc.w * (1 - t * 0.2), pc.h * 0.35, 7), pineMat);
          tier.position.y = pc.h * (0.38 + t * 0.22);
          tier.castShadow = true;
          tree.add(tier);
        }
        distantDecorGroup.add(tree);
      });
    })();
''',
        'colliders': [
            "{ x: 120, z: -100, r: 34 }",
            "{ x: -80, z: -120, r: 14 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -48, z: -15, r: 8 }",
            "{ x: 38, z: -10, r: 5 }",
            "{ x: 42, z: -45, r: 5 }"
        ]
    },

    'province-saskatchewan.html': {
        'name': 'Saskatchewan - Prairie Grain Silos, Windmill & Farmstead',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: PRAIRIE GRAIN ELEVATOR & FARMSTEAD
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const siloSteelMat = new THREE.MeshStandardMaterial({ color: 0x8e98a0, metalness: 0.65, roughness: 0.35 });
      const siloRoofMat = new THREE.MeshStandardMaterial({ color: 0x768088, metalness: 0.7, roughness: 0.4 });
      const barnRedMat = new THREE.MeshStandardMaterial({ color: 0x6e1b18, roughness: 0.85 });
      const metalRoofMat = new THREE.MeshStandardMaterial({ color: 0x3d444c, metalness: 0.5, roughness: 0.5 });
      const latticeMat = new THREE.MeshStandardMaterial({ color: 0x7c848c, metalness: 0.75, roughness: 0.3 });
      const strawMat = new THREE.MeshStandardMaterial({ color: 0xb4964c, roughness: 0.95 });
      const woodFenceMat = new THREE.MeshStandardMaterial({ color: 0x483626, roughness: 0.9 });

      // 1. Twin Corrugated Galvanized Steel Grain Silos (x: -52, z: -25)
      const siloGroup = new THREE.Group();
      siloGroup.position.set(-52, 0, -25);
      regionalGroup.add(siloGroup);

      [-4.5, 4.5].forEach(sx => {
        const silo = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 17, 16), siloSteelMat);
        silo.position.set(sx, 8.5, 0);
        silo.castShadow = true; silo.receiveShadow = true;
        siloGroup.add(silo);

        const cap = new THREE.Mesh(new THREE.ConeGeometry(4.4, 3.2, 16), siloRoofMat);
        cap.position.set(sx, 18.6, 0);
        cap.castShadow = true;
        siloGroup.add(cap);
      });

      // Bucket elevator leg tower & connecting catwalk
      const elevatorLeg = new THREE.Mesh(new THREE.BoxGeometry(2.2, 22, 2.2), siloSteelMat);
      elevatorLeg.position.set(0, 11, 4.8);
      elevatorLeg.castShadow = true;
      siloGroup.add(elevatorLeg);

      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 1.8), latticeMat);
      catwalk.position.set(0, 17.2, 0);
      siloGroup.add(catwalk);

      // 2. Machine Shed / Tractor Barn (x: -56, z: 15)
      const shedGroup = new THREE.Group();
      shedGroup.position.set(-56, 0, 15);
      regionalGroup.add(shedGroup);

      const shedBody = new THREE.Mesh(new THREE.BoxGeometry(12, 5.8, 14), barnRedMat);
      shedBody.position.y = 2.9;
      shedBody.castShadow = true; shedBody.receiveShadow = true;
      shedGroup.add(shedBody);

      const shedRoof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3.2, 4), metalRoofMat);
      shedRoof.position.y = 7.4;
      shedRoof.rotation.y = Math.PI / 4;
      shedRoof.scale.set(1.15, 1.0, 1.35);
      shedRoof.castShadow = true;
      shedGroup.add(shedRoof);

      // 3. Vintage Aermotor Steel Windmill Pump (x: 38, z: -10)
      const windGroup = new THREE.Group();
      windGroup.position.set(38, 0, -10);
      regionalGroup.add(windGroup);

      const towerLattice = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.4, 16, 4), latticeMat);
      towerLattice.position.y = 8;
      towerLattice.castShadow = true;
      windGroup.add(towerLattice);

      const rotorWheel = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.12, 10), latticeMat);
      rotorWheel.rotation.x = Math.PI / 2;
      rotorWheel.position.set(0, 16, 0.6);
      windGroup.add(rotorWheel);

      const tailVane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 1.6), latticeMat);
      tailVane.position.set(0, 16, -1.2);
      windGroup.add(tailVane);

      const stockTank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.0, 12), siloSteelMat);
      stockTank.position.y = 0.5;
      stockTank.castShadow = true;
      windGroup.add(stockTank);

      // 4. Cattle Corral Fencing & Round Hay Bales
      for (let cz = 12; cz >= -45; cz -= 14) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 6), woodFenceMat);
        post.position.set(36, 0.8, cz);
        regionalGroup.add(post);
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 14, 6), woodFenceMat);
        rail.rotation.x = Math.PI / 2;
        rail.position.set(36, 1.1, cz - 7);
        regionalGroup.add(rail);
      }

      const hayBales = [
        { x: 46, z: 6, ry: 0.2 },
        { x: 48, z: -30, ry: -0.4 },
        { x: 50, z: -14, ry: 0.6 }
      ];
      hayBales.forEach(hb => {
        const bale = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.2, 12), strawMat);
        bale.rotation.z = Math.PI / 2;
        bale.rotation.y = hb.ry;
        bale.position.set(hb.x, 1.6, hb.z);
        bale.castShadow = true; bale.receiveShadow = true;
        regionalGroup.add(bale);
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: -140, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 120, z: -60, r: 12 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -52, z: -25, r: 8.5 }",
            "{ x: -56, z: 15, r: 7.5 }",
            "{ x: 38, z: -10, r: 4.5 }"
        ]
    },

    'province-manitoba.html': {
        'name': 'Manitoba - Pioneer Trading Post, Canoe Racks & Marsh Boardwalk',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: RED RIVER TRADING POST & BOREAL MARSH
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const logTimberMat = new THREE.MeshStandardMaterial({ color: 0x38281b, roughness: 0.9 });
      const cedarShakeMat = new THREE.MeshStandardMaterial({ color: 0x241810, roughness: 0.88 });
      const fieldstoneMat = new THREE.MeshStandardMaterial({ color: 0x545856, roughness: 0.92 });
      const birchMat = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.85 });
      const boardwalkMat = new THREE.MeshStandardMaterial({ color: 0x443426, roughness: 0.88 });
      const reedMat = new THREE.MeshStandardMaterial({ color: 0x2d4022, roughness: 0.75 });
      const spruceMat = new THREE.MeshStandardMaterial({ color: 0x142b1b, roughness: 0.78 });

      // 1. Hudson's Bay Pioneer Log Trading Post (x: -46, z: -15)
      const postGroup = new THREE.Group();
      postGroup.position.set(-46, 0, -15);
      regionalGroup.add(postGroup);

      const mainCabin = new THREE.Mesh(new THREE.BoxGeometry(11, 5.2, 9), logTimberMat);
      mainCabin.position.y = 2.6;
      mainCabin.castShadow = true; mainCabin.receiveShadow = true;
      postGroup.add(mainCabin);

      const cabinRoof = new THREE.Mesh(new THREE.ConeGeometry(8.5, 3.2, 4), cedarShakeMat);
      cabinRoof.position.y = 6.8;
      cabinRoof.rotation.y = Math.PI / 4;
      cabinRoof.scale.set(1.3, 1.0, 1.1);
      cabinRoof.castShadow = true;
      postGroup.add(cabinRoof);

      const stoneChimney = new THREE.Mesh(new THREE.BoxGeometry(2.2, 7.8, 2.2), fieldstoneMat);
      stoneChimney.position.set(4.4, 3.9, 0);
      stoneChimney.castShadow = true;
      postGroup.add(stoneChimney);

      // Veranda porch
      const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(11, 0.3, 3.5), cedarShakeMat);
      porchRoof.position.set(0, 3.8, 5.5);
      postGroup.add(porchRoof);
      for (let px of [-4.5, 0, 4.5]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.8, 6), logTimberMat);
        pillar.position.set(px, 1.9, 7.0);
        postGroup.add(pillar);
      }

      // Trading post lantern
      const pLamp = new THREE.PointLight(0xffb244, 1.4, 26);
      pLamp.position.set(0, 3.2, 6.0);
      postGroup.add(pLamp);

      // 2. Fur Pelts & Equipment Cache Shed (x: -48, z: 18)
      const cacheShed = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.2, 6.5), logTimberMat);
      cacheShed.position.set(-48, 2.1, 18);
      cacheShed.castShadow = true; cacheShed.receiveShadow = true;
      regionalGroup.add(cacheShed);
      const cacheRoof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.4, 4), cedarShakeMat);
      cacheRoof.position.set(-48, 5.4, 18);
      cacheRoof.rotation.y = Math.PI / 4;
      cacheRoof.scale.set(1.2, 1.0, 1.2);
      regionalGroup.add(cacheRoof);

      // 3. Voyageur Canoe Rack (x: -36, z: -5)
      const canoeRack = new THREE.Group();
      canoeRack.position.set(-36, 0, -5);
      regionalGroup.add(canoeRack);

      for (let cx of [-2.4, 2.4]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), logTimberMat);
        post.position.set(cx, 1.3, 0);
        canoeRack.add(post);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 1.6), logTimberMat);
        arm.position.set(cx, 1.8, 0);
        canoeRack.add(arm);
      }

      const canoe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 6.2), birchMat);
      canoe.position.set(0, 2.05, 0);
      canoe.rotation.z = Math.PI; // upside down to dry
      canoe.castShadow = true;
      canoeRack.add(canoe);

      // 4. Elevated Marsh Boardwalk & River Reeds (x: 36, z: 15 to -40)
      const boardwalk = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.4, 55), boardwalkMat);
      boardwalk.position.set(36, 0.6, -12);
      boardwalk.castShadow = true; boardwalk.receiveShadow = true;
      regionalGroup.add(boardwalk);

      for (let bz = 12; bz >= -36; bz -= 12) {
        for (let bx of [34.5, 37.5]) {
          const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.4, 6), logTimberMat);
          stilt.position.set(bx, 0.3, bz);
          regionalGroup.add(stilt);
        }
      }

      // 5. River Reed Marsh Patches
      const reedClusters = [
        { x: 32, z: 5 }, { x: 42, z: -15 }, { x: 33, z: -35 }
      ];
      reedClusters.forEach(rc => {
        for (let r = 0; r < 7; r++) {
          const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 5), reedMat);
          reed.position.set(rc.x + (Math.random() - 0.5) * 3, 1.1, rc.z + (Math.random() - 0.5) * 3);
          reed.rotation.z = (Math.random() - 0.5) * 0.25;
          distantDecorGroup.add(reed);
        }
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: -140, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 90, z: 80, r: 16 }",
            "{ x: -90, z: 80, r: 16 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -46, z: -15, r: 8 }",
            "{ x: -48, z: 18, r: 6 }",
            "{ x: 36, z: -12, r: 5 }"
        ]
    },

    'province-ontario.html': {
        'name': 'Ontario - Bruce Peninsula Escarpment, Trail Pavilion & Shoreline Creek',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: BRUCE ESCARPMENT & GREAT LAKES
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const dolostoneMat = new THREE.MeshStandardMaterial({ color: 0x888c8e, roughness: 0.94 });
      const timberMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.88 });
      const cedarShakeMat = new THREE.MeshStandardMaterial({ color: 0x261a12, roughness: 0.9 });
      const pineNeedleMat = new THREE.MeshStandardMaterial({ color: 0x183320, roughness: 0.76 });
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x004466, metalness: 0.85, roughness: 0.15, transparent: true, opacity: 0.85 });

      // 1. Bruce Peninsula Stratified Limestone Escarpment Bluffs
      const escarpmentBluffs = [
        { x: -42, z: 10, w: 14, h: 7, d: 10 },
        { x: -48, z: -40, w: 16, h: 8.5, d: 12 },
        { x: 52, z: -20, w: 15, h: 7.5, d: 11 }
      ];
      escarpmentBluffs.forEach(b => {
        const bluffGroup = new THREE.Group();
        bluffGroup.position.set(b.x, 0, b.z);
        regionalGroup.add(bluffGroup);

        for (let l = 0; l < 4; l++) {
          const layerH = b.h * 0.28;
          const layerW = b.w * (1 - l * 0.12);
          const layerD = b.d * (1 - l * 0.12);
          const ledge = new THREE.Mesh(new THREE.BoxGeometry(layerW, layerH, layerD), dolostoneMat);
          ledge.position.set((Math.random() - 0.5) * 1.5, layerH * (0.5 + l), (Math.random() - 0.5) * 1.5);
          ledge.castShadow = true; ledge.receiveShadow = true;
          bluffGroup.add(ledge);
        }
      });

      // 2. Bruce Trail Marker Pavilion & Kiosk (x: 48, z: 15)
      const pavGroup = new THREE.Group();
      pavGroup.position.set(48, 0, 15);
      regionalGroup.add(pavGroup);

      const pavFloor = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.4, 7.5), dolostoneMat);
      pavFloor.position.y = 0.2;
      pavFloor.castShadow = true;
      pavGroup.add(pavFloor);

      // Four corner fieldstone masonry pillars
      for (let px of [-4.0, 4.0]) {
        for (let pz of [-3.0, 3.0]) {
          const col = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.2, 0.7), dolostoneMat);
          col.position.set(px, 2.3, pz);
          col.castShadow = true;
          pavGroup.add(col);
        }
      }

      const pavRoof = new THREE.Mesh(new THREE.ConeGeometry(7.5, 2.6, 4), cedarShakeMat);
      pavRoof.position.y = 5.6;
      pavRoof.rotation.y = Math.PI / 4;
      pavRoof.scale.set(1.3, 1.0, 1.1);
      pavRoof.castShadow = true;
      pavGroup.add(pavRoof);

      // Interpretive map kiosk board
      const kiosk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.2), timberMat);
      kiosk.position.set(0, 2.2, 0);
      pavGroup.add(kiosk);

      const pavLamp = new THREE.PointLight(0xffaa44, 1.3, 22);
      pavLamp.position.set(0, 4.2, 0);
      pavGroup.add(pavLamp);

      // 3. Rustic Stone Footbridge over Creek Inlet (x: -40, z: -20)
      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.set(-40, 0, -20);
      regionalGroup.add(bridgeGroup);

      const archDeck = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.2, 13), dolostoneMat);
      archDeck.position.y = 1.0;
      archDeck.castShadow = true; archDeck.receiveShadow = true;
      bridgeGroup.add(archDeck);

      // Creek water ribbon beneath
      const creek = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 6.0), waterMat);
      creek.position.set(0, 0.2, 0);
      bridgeGroup.add(creek);

      // 4. Windswept Georgian Bay White Pines
      const pineCoords = [
        { x: -35, z: 28, h: 14 },
        { x: -52, z: -10, h: 17 },
        { x: 38, z: 32, h: 13 },
        { x: 44, z: -40, h: 16 }
      ];
      pineCoords.forEach(pc => {
        const pine = new THREE.Group();
        pine.position.set(pc.x, 0, pc.z);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, pc.h * 0.45, 6), timberMat);
        trunk.position.y = pc.h * 0.225;
        trunk.rotation.z = 0.12; // characteristic wind lean
        trunk.castShadow = true;
        pine.add(trunk);

        for (let t = 0; t < 3; t++) {
          const tier = new THREE.Mesh(new THREE.ConeGeometry(5.0 * (1 - t * 0.2), pc.h * 0.32, 6), pineNeedleMat);
          tier.position.set((t * 0.4), pc.h * (0.36 + t * 0.22), 0);
          tier.castShadow = true;
          pine.add(tier);
        }
        distantDecorGroup.add(pine);
      });
    })();
''',
        'colliders': [
            "{ x: 150, z: -180, r: 24 }",
            "{ x: -65, z: 45, r: 9 }",
            "{ x: -65, z: 0, r: 7 }",
            "{ x: -65, z: -45, r: 8 }",
            "{ x: 65, z: 45, r: 8 }",
            "{ x: 65, z: -45, r: 8 }",
            "{ x: 0, z: 220, r: 18 }",
            "{ x: 0, z: -300, r: 18 }",
            "{ x: 48, z: 15, r: 7 }",
            "{ x: -42, z: 10, r: 6 }",
            "{ x: -48, z: -40, r: 6 }",
            "{ x: 52, z: -20, r: 6 }",
            "{ x: -40, z: -20, r: 5 }"
        ]
    },

    'province-quebec.html': {
        'name': 'Quebec - Gaspésie Timber Cottages, Wayside Cross & Cod Flakes',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: GASPÉSIE & ST. LAWRENCE
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const cottageWallMat = new THREE.MeshStandardMaterial({ color: 0xd8ded8, roughness: 0.85 });
      const redTinRoofMat = new THREE.MeshStandardMaterial({ color: 0x8a1c18, metalness: 0.38, roughness: 0.5 });
      const stoneFoundMat = new THREE.MeshStandardMaterial({ color: 0x5a5854, roughness: 0.94 });
      const timberDarkMat = new THREE.MeshStandardMaterial({ color: 0x36261a, roughness: 0.9 });
      const slateRockMat = new THREE.MeshStandardMaterial({ color: 0x343940, roughness: 0.92 });
      const whiteCrossMat = new THREE.MeshStandardMaterial({ color: 0xe2e2de, roughness: 0.8 });

      // 1. Traditional French-Canadian Timber Cottages with Steep Red-Tin Roofs
      const cottages = [
        { x: -50, z: -10, ry: 0.1 },
        { x: -54, z: 25, ry: -0.2 }
      ];
      cottages.forEach(c => {
        const cGroup = new THREE.Group();
        cGroup.position.set(c.x, 0, c.z);
        cGroup.rotation.y = c.ry;
        regionalGroup.add(cGroup);

        const found = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.8, 8.5), stoneFoundMat);
        found.position.y = 0.4;
        cGroup.add(found);

        const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 4.6, 8), cottageWallMat);
        walls.position.y = 3.1;
        walls.castShadow = true; walls.receiveShadow = true;
        cGroup.add(walls);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(7.8, 4.2, 4), redTinRoofMat);
        roof.position.y = 7.4;
        roof.rotation.y = Math.PI / 4;
        roof.scale.set(1.25, 1.0, 1.1);
        roof.castShadow = true;
        cGroup.add(roof);

        // Dormer window
        const dormer = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), redTinRoofMat);
        dormer.position.set(0, 6.2, 3.2);
        cGroup.add(dormer);
      });

      // 2. Historic Roadside Wayside Cross (Croix de Chemin at x: -34, z: 8)
      const crossGroup = new THREE.Group();
      crossGroup.position.set(-34, 0, 8);
      regionalGroup.add(crossGroup);

      const crossBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), stoneFoundMat);
      crossBase.position.y = 0.3;
      crossGroup.add(crossBase);

      const crossShaft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6.0, 0.35), whiteCrossMat);
      crossShaft.position.y = 3.3;
      crossShaft.castShadow = true;
      crossGroup.add(crossShaft);

      const crossArm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.35), whiteCrossMat);
      crossArm.position.y = 4.8;
      crossArm.castShadow = true;
      crossGroup.add(crossArm);

      // 3. Cod Drying Flakes (Râteliers à morue at x: 38, z: -15)
      const flakeGroup = new THREE.Group();
      flakeGroup.position.set(38, 0, -15);
      regionalGroup.add(flakeGroup);

      const flakeDeck = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 5.0), timberDarkMat);
      flakeDeck.position.y = 1.4;
      flakeDeck.castShadow = true;
      flakeGroup.add(flakeDeck);

      for (let fx of [-5, 0, 5]) {
        for (let fz of [-2, 2]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.5, 6), timberDarkMat);
          post.position.set(fx, 0.75, fz);
          flakeGroup.add(post);
        }
      }

      // 4. St. Lawrence Appalachian Slate Rock Ledges
      const slateRocks = [
        { x: 42, z: 15, s: 4.8 },
        { x: 44, z: -45, s: 5.4 }
      ];
      slateRocks.forEach(sr => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(sr.s, 1), slateRockMat);
        rock.position.set(sr.x, sr.s * 0.48, sr.z);
        rock.scale.set(1.4, 0.7, 1.1);
        rock.castShadow = true; rock.receiveShadow = true;
        regionalGroup.add(rock);
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: -160, r: 28 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 120, z: -40, r: 14 }",
            "{ x: -120, z: -40, r: 14 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -50, z: -10, r: 7.5 }",
            "{ x: -54, z: 25, r: 7.5 }",
            "{ x: 38, z: -15, r: 6 }",
            "{ x: 44, z: -45, r: 6 }"
        ]
    },

    'province-new-brunswick.html': {
        'name': 'New Brunswick - Bay of Fundy Tidal Research Cabin & Mudstone Cliffs',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: BAY OF FUNDY TIDAL OUTPOST
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const shingleGreyMat = new THREE.MeshStandardMaterial({ color: 0x443e38, roughness: 0.9 });
      const timberStiltMat = new THREE.MeshStandardMaterial({ color: 0x2e2218, roughness: 0.92 });
      const fundyMudstoneMat = new THREE.MeshStandardMaterial({ color: 0x582c22, roughness: 0.95 });
      const trapLathMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.88 });
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x727a80, metalness: 0.7, roughness: 0.35 });

      // 1. Fundy Tidal Research Cabin on Heavy Timber Pilings (x: -46, z: -15)
      const cabinGroup = new THREE.Group();
      cabinGroup.position.set(-46, 0, -15);
      regionalGroup.add(cabinGroup);

      const cabinBase = new THREE.Mesh(new THREE.BoxGeometry(10, 4.8, 8), shingleGreyMat);
      cabinBase.position.y = 3.6;
      cabinBase.castShadow = true; cabinBase.receiveShadow = true;
      cabinGroup.add(cabinBase);

      const cabinRoof = new THREE.Mesh(new THREE.ConeGeometry(7.6, 2.8, 4), timberStiltMat);
      cabinRoof.position.y = 7.4;
      cabinRoof.rotation.y = Math.PI / 4;
      cabinRoof.scale.set(1.3, 1.0, 1.1);
      cabinRoof.castShadow = true;
      cabinGroup.add(cabinRoof);

      // Elevated pilings
      for (let px of [-4.0, 4.0]) {
        for (let pz of [-3.0, 3.0]) {
          const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 2.8, 8), timberStiltMat);
          stilt.position.set(px, 1.4, pz);
          stilt.castShadow = true;
          cabinGroup.add(stilt);
        }
      }

      // Observation cupola & anemometer
      const cupola = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.4, 8), metalMat);
      cupola.position.y = 9.2;
      cabinGroup.add(cupola);
      const cupLight = new THREE.PointLight(0xffa844, 1.3, 24);
      cupLight.position.set(0, 9.4, 0);
      cabinGroup.add(cupLight);

      // 2. Stacked Lobster Traps & Rope Pallets (x: -36, z: 5)
      const trapGroup = new THREE.Group();
      trapGroup.position.set(-36, 0, 5);
      regionalGroup.add(trapGroup);

      for (let i = 0; i < 6; i++) {
        const trap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.1), trapLathMat);
        trap.position.set((i % 2) * 1.8, 0.35 + Math.floor(i / 2) * 0.75, (i % 3) * 0.4);
        trap.castShadow = true;
        trapGroup.add(trap);
      }

      // 3. Salt Fish Storage Shed (x: 48, z: 15)
      const shed = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4.4, 8.5), shingleGreyMat);
      shed.position.set(48, 2.2, 15);
      shed.castShadow = true; shed.receiveShadow = true;
      regionalGroup.add(shed);
      const shedRoof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.6, 4), timberStiltMat);
      shedRoof.position.set(48, 5.7, 15);
      shedRoof.rotation.y = Math.PI / 4;
      shedRoof.scale.set(1.2, 1.0, 1.3);
      regionalGroup.add(shedRoof);

      // 4. Fundy Conglomerate Red-Brown Mudstone Rocks
      const mudRocks = [
        { x: 40, z: -35, s: 5.6 },
        { x: -34, z: -45, s: 5.0 },
        { x: 46, z: -10, s: 4.2 }
      ];
      mudRocks.forEach(mr => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(mr.s, 1), fundyMudstoneMat);
        rock.position.set(mr.x, mr.s * 0.52, mr.z);
        rock.scale.set(1.2, 0.9, 1.15);
        rock.castShadow = true; rock.receiveShadow = true;
        regionalGroup.add(rock);
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: -140, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 100, z: -40, r: 16 }",
            "{ x: -100, z: -40, r: 16 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -46, z: -15, r: 7 }",
            "{ x: 48, z: 15, r: 6.5 }",
            "{ x: 40, z: -35, r: 6 }",
            "{ x: -34, z: -45, r: 5.5 }"
        ]
    },

    'province-nova-scotia.html': {
        'name': 'Nova Scotia - Lighthouse Keeper Cottage, Granite Headlands & Net Shed',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: ATLANTIC LIGHTHOUSE COVE
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const whiteClapMat = new THREE.MeshStandardMaterial({ color: 0xe0e4e6, roughness: 0.85 });
      const redTrimRoofMat = new THREE.MeshStandardMaterial({ color: 0x8a1c18, metalness: 0.35, roughness: 0.5 });
      const weatheredWoodMat = new THREE.MeshStandardMaterial({ color: 0x36302a, roughness: 0.9 });
      const peggyGraniteMat = new THREE.MeshStandardMaterial({ color: 0x8c8680, roughness: 0.92 });
      const copperFoghornMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.85, roughness: 0.3 });

      // 1. Classic Lighthouse Keeper's Cottage (x: -48, z: -15)
      const cottageGroup = new THREE.Group();
      cottageGroup.position.set(-48, 0, -15);
      regionalGroup.add(cottageGroup);

      const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 4.8, 8.5), whiteClapMat);
      walls.position.y = 2.4;
      walls.castShadow = true; walls.receiveShadow = true;
      cottageGroup.add(walls);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(7.8, 3.2, 4), redTrimRoofMat);
      roof.position.y = 6.4;
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.25, 1.0, 1.1);
      roof.castShadow = true;
      cottageGroup.add(roof);

      const brickChimney = new THREE.Mesh(new THREE.BoxGeometry(1.8, 6.8, 1.8), redTrimRoofMat);
      brickChimney.position.set(0, 4.4, 0);
      cottageGroup.add(brickChimney);

      // Porch lantern
      const porchLamp = new THREE.PointLight(0xffb244, 1.3, 24);
      porchLamp.position.set(0, 3.2, 4.8);
      cottageGroup.add(porchLamp);

      // 2. Timber Net-Drying Shed & Salt Herring Barrels (x: -52, z: 20)
      const netShed = new THREE.Mesh(new THREE.BoxGeometry(8, 4.6, 7), weatheredWoodMat);
      netShed.position.set(-52, 2.3, 20);
      netShed.castShadow = true;
      regionalGroup.add(netShed);

      for (let b = 0; b < 3; b++) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 1.3, 10), weatheredWoodMat);
        barrel.position.set(-36, 0.65, 2 + b * 1.4);
        barrel.castShadow = true;
        regionalGroup.add(barrel);
      }

      // 3. Foghorn Pedestal (x: 34, z: 0)
      const hornPed = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.2, 8), weatheredWoodMat);
      hornPed.position.set(34, 1.1, 0);
      const hornCone = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 10), copperFoghornMat);
      hornCone.rotation.x = Math.PI / 2;
      hornCone.position.set(34, 2.4, 0.6);
      regionalGroup.add(hornPed); regionalGroup.add(hornCone);

      // 4. Peggy's Cove Glacial-Smoothed Granite Sea Headlands
      const headlands = [
        { x: 36, z: -20, s: 5.8 },
        { x: 44, z: 10, s: 5.4 },
        { x: -34, z: -50, s: 5.2 }
      ];
      headlands.forEach(h => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(h.s, 1), peggyGraniteMat);
        rock.position.set(h.x, h.s * 0.48, h.z);
        rock.scale.set(1.3, 0.75, 1.2);
        rock.castShadow = true; rock.receiveShadow = true;
        regionalGroup.add(rock);
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: -150, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 120, z: -20, r: 14 }",
            "{ x: -120, z: -20, r: 14 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -48, z: -15, r: 7.5 }",
            "{ x: -52, z: 20, r: 6.5 }",
            "{ x: 36, z: -20, r: 6 }",
            "{ x: 44, z: 10, r: 6 }",
            "{ x: -34, z: -50, r: 5.5 }"
        ]
    },

    'province-prince-edward-island.html': {
        'name': 'Prince Edward Island - Red Gambrel Barn, Farmhouse & Red Sandstone Cliffs',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: RED SOIL FARMLAND & DUNES
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const barnRedMat = new THREE.MeshStandardMaterial({ color: 0x7a1816, roughness: 0.82 });
      const farmhouseWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe8ece8, roughness: 0.85 });
      const redSandstoneMat = new THREE.MeshStandardMaterial({ color: 0x8a301a, roughness: 0.95 });
      const siloSilverMat = new THREE.MeshStandardMaterial({ color: 0x98a2aa, metalness: 0.7, roughness: 0.35 });
      const strawMat = new THREE.MeshStandardMaterial({ color: 0xb4964c, roughness: 0.95 });
      const cedarFenceMat = new THREE.MeshStandardMaterial({ color: 0x483626, roughness: 0.9 });

      // 1. Classic PEI Red Gambrel-Roof Dairy Barn & Silo (x: 52, z: -15)
      const barnGroup = new THREE.Group();
      barnGroup.position.set(52, 0, -15);
      regionalGroup.add(barnGroup);

      const barnBody = new THREE.Mesh(new THREE.BoxGeometry(13, 6.0, 16), barnRedMat);
      barnBody.position.y = 3.0;
      barnBody.castShadow = true; barnBody.receiveShadow = true;
      barnGroup.add(barnBody);

      const gambrelRoof = new THREE.Mesh(new THREE.ConeGeometry(10.5, 4.5, 4), barnRedMat);
      gambrelRoof.position.y = 8.2;
      gambrelRoof.rotation.y = Math.PI / 4;
      gambrelRoof.scale.set(1.15, 1.0, 1.35);
      gambrelRoof.castShadow = true;
      barnGroup.add(gambrelRoof);

      // Cylindrical silage silo
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 12, 14), siloSilverMat);
      silo.position.set(-8.5, 6.0, 0);
      silo.castShadow = true;
      barnGroup.add(silo);

      // 2. White Island Farmhouse (x: 56, z: 22)
      const houseGroup = new THREE.Group();
      houseGroup.position.set(56, 0, 22);
      regionalGroup.add(houseGroup);

      const houseBody = new THREE.Mesh(new THREE.BoxGeometry(10, 6.2, 8.5), farmhouseWhiteMat);
      houseBody.position.y = 3.1;
      houseBody.castShadow = true; houseBody.receiveShadow = true;
      houseGroup.add(houseBody);

      const houseRoof = new THREE.Mesh(new THREE.ConeGeometry(7.8, 3.2, 4), barnRedMat);
      houseRoof.position.y = 7.8;
      houseRoof.rotation.y = Math.PI / 4;
      houseRoof.scale.set(1.25, 1.0, 1.1);
      houseGroup.add(houseRoof);

      // 3. Post-and-Wire Cedar Paddock Fence
      for (let pz = 35; pz >= -60; pz -= 14) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 6), cedarFenceMat);
        post.position.set(34, 0.8, pz);
        regionalGroup.add(post);
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 14, 4), cedarFenceMat);
        wire.rotation.x = Math.PI / 2;
        wire.position.set(34, 1.1, pz - 7);
        regionalGroup.add(wire);
      }

      // 4. Cylindrical Agricultural Hay Bales
      const bales = [
        { x: -38, z: 10 }, { x: -44, z: -20 }, { x: -40, z: -50 }
      ];
      bales.forEach(b => {
        const bale = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.2, 12), strawMat);
        bale.rotation.z = Math.PI / 2;
        bale.position.set(b.x, 1.6, b.z);
        bale.castShadow = true;
        regionalGroup.add(bale);
      });

      // 5. Red Sandstone Soil Bluffs & Dunes
      const redBluffs = [
        { x: -36, z: -10, s: 5.0 },
        { x: -46, z: 30, s: 5.2 }
      ];
      redBluffs.forEach(rb => {
        const bluff = new THREE.Mesh(new THREE.DodecahedronGeometry(rb.s, 1), redSandstoneMat);
        bluff.position.set(rb.x, rb.s * 0.48, rb.z);
        bluff.scale.set(1.4, 0.7, 1.2);
        bluff.castShadow = true; bluff.receiveShadow = true;
        regionalGroup.add(bluff);
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: -150, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 120, z: 40, r: 16 }",
            "{ x: -120, z: 40, r: 16 }",
            "{ x: 65, z: 20, r: 8 }",
            "{ x: 65, z: -40, r: 8 }",
            "{ x: 52, z: -15, r: 8.5 }",
            "{ x: 56, z: 22, r: 7.5 }",
            "{ x: -36, z: -10, r: 5 }",
            "{ x: -46, z: 30, r: 5 }"
        ]
    },

    'province-newfoundland.html': {
        'name': 'Newfoundland - Outport Fishing Stage on Stilts & Gros Morne Tablelands',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: COASTAL OUTPORT STAGE & TABLELANDS
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const ochreRedMat = new THREE.MeshStandardMaterial({ color: 0x6e221c, roughness: 0.85 });
      const weatheredStiltMat = new THREE.MeshStandardMaterial({ color: 0x2e2016, roughness: 0.92 });
      const tablelandRockMat = new THREE.MeshStandardMaterial({ color: 0x784422, roughness: 0.95 });
      const doryTimberMat = new THREE.MeshStandardMaterial({ color: 0x3d2c1e, roughness: 0.88 });

      // 1. Traditional Outport Fishing Stage on Shore Stilts (x: -44, z: -15)
      const stageGroup = new THREE.Group();
      stageGroup.position.set(-44, 0, -15);
      regionalGroup.add(stageGroup);

      const stageBody = new THREE.Mesh(new THREE.BoxGeometry(10, 4.8, 8.5), ochreRedMat);
      stageBody.position.y = 3.6;
      stageBody.castShadow = true; stageBody.receiveShadow = true;
      stageGroup.add(stageBody);

      const stageRoof = new THREE.Mesh(new THREE.ConeGeometry(7.6, 2.8, 4), weatheredStiltMat);
      stageRoof.position.y = 7.4;
      stageRoof.rotation.y = Math.PI / 4;
      stageRoof.scale.set(1.3, 1.0, 1.1);
      stageRoof.castShadow = true;
      stageGroup.add(stageRoof);

      // Shore timber stilts in tidal rocks
      for (let sx of [-4.2, 0, 4.2]) {
        for (let sz of [-3.2, 3.2]) {
          const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 2.6, 6), weatheredStiltMat);
          stilt.position.set(sx, 1.3, sz);
          stilt.castShadow = true;
          stageGroup.add(stilt);
        }
      }

      // Exterior wharf stage head with fish-splitting table
      const wharfHead = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.4, 5.0), weatheredStiltMat);
      wharfHead.position.set(0, 1.4, 6.5);
      stageGroup.add(wharfHead);

      const lamp = new THREE.PointLight(0xffaa44, 1.4, 24);
      lamp.position.set(0, 3.2, 5.0);
      stageGroup.add(lamp);

      // 2. Red-Ochre Gear Store / Twine Loft (x: -50, z: 18)
      const storeShed = new THREE.Mesh(new THREE.BoxGeometry(8, 5.2, 7.5), ochreRedMat);
      storeShed.position.set(-50, 2.6, 18);
      storeShed.castShadow = true;
      regionalGroup.add(storeShed);

      // 3. Hauled Newfoundland Dory Workboats on Slipways
      const dories = [
        { x: -35, z: 2, ry: 0.2 },
        { x: 38, z: -5, ry: -0.3 }
      ];
      dories.forEach(d => {
        const boat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 6.2), doryTimberMat);
        boat.position.set(d.x, 0.45, d.z);
        boat.rotation.y = d.ry;
        boat.castShadow = true;
        regionalGroup.add(boat);
      });

      // 4. Gros Morne Tableland Rust-Orange Peridotite Rocks
      const tableRocks = [
        { x: 42, z: -30, s: 5.8 },
        { x: 46, z: 15, s: 5.4 }
      ];
      tableRocks.forEach(tr => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(tr.s, 1), tablelandRockMat);
        rock.position.set(tr.x, tr.s * 0.52, tr.z);
        rock.scale.set(1.25, 0.8, 1.15);
        rock.castShadow = true; rock.receiveShadow = true;
        regionalGroup.add(rock);
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: -150, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 120, z: -40, r: 16 }",
            "{ x: -120, z: -40, r: 16 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -44, z: -15, r: 7.5 }",
            "{ x: -50, z: 18, r: 6.5 }",
            "{ x: 42, z: -30, r: 6 }",
            "{ x: 46, z: 15, r: 6 }"
        ]
    },

    'province-yukon.html': {
        'name': 'Yukon - Klondike Gold Rush False-Front Boomtown, Sluice Flume & Boiler',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: KLONDIKE GOLD RUSH BOOMTOWN
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const frontierWoodMat = new THREE.MeshStandardMaterial({ color: 0x483222, roughness: 0.88 });
      const logSodMat = new THREE.MeshStandardMaterial({ color: 0x322216, roughness: 0.92 });
      const rustIronMat = new THREE.MeshStandardMaterial({ color: 0x382820, metalness: 0.8, roughness: 0.4 });
      const timberFlumeMat = new THREE.MeshStandardMaterial({ color: 0x3e2c1c, roughness: 0.86 });

      // 1. Klondike Gold-Rush Saloon / Mercantile with False-Front Parapet (x: -46, z: -15)
      const saloonGroup = new THREE.Group();
      saloonGroup.position.set(-46, 0, -15);
      regionalGroup.add(saloonGroup);

      const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(11, 6.2, 9), frontierWoodMat);
      mainBuilding.position.y = 3.1;
      mainBuilding.castShadow = true; mainBuilding.receiveShadow = true;
      saloonGroup.add(mainBuilding);

      // Iconic boomtown false-front parapet wall extending above roof
      const falseFront = new THREE.Mesh(new THREE.BoxGeometry(11.2, 2.8, 0.4), frontierWoodMat);
      falseFront.position.set(0, 7.6, 4.5);
      falseFront.castShadow = true;
      saloonGroup.add(falseFront);

      // Wooden boardwalk porch with square timber columns
      const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.4, 3.2), frontierWoodMat);
      porchFloor.position.set(0, 0.2, 5.8);
      saloonGroup.add(porchFloor);

      for (let px of [-5.0, 0, 5.0]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.8, 0.24), frontierWoodMat);
        col.position.set(px, 2.1, 7.2);
        saloonGroup.add(col);
      }

      const saloonLamp = new THREE.PointLight(0xffb244, 1.4, 26);
      saloonLamp.position.set(0, 3.4, 6.2);
      saloonGroup.add(saloonLamp);

      // 2. Prospector Round-Log Cabin with Sod Roof (x: -52, z: 20)
      const cabinGroup = new THREE.Group();
      cabinGroup.position.set(-52, 0, 20);
      regionalGroup.add(cabinGroup);

      const logBody = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 7), logSodMat);
      logBody.position.y = 2.25;
      logBody.castShadow = true; logBody.receiveShadow = true;
      cabinGroup.add(logBody);

      const sodRoof = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.6, 7.6), logSodMat);
      sodRoof.position.y = 4.8;
      cabinGroup.add(sodRoof);

      // Galvanized stovepipe
      const stovepipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), rustIronMat);
      stovepipe.position.set(2.4, 5.8, 1.5);
      cabinGroup.add(stovepipe);

      // 3. Elevated Timber Sluice Box Flume Trestle (x: 36, z: 10 to -40)
      const flumeGroup = new THREE.Group();
      flumeGroup.position.set(36, 0, -15);
      regionalGroup.add(flumeGroup);

      const flumeTrough = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 50), timberFlumeMat);
      flumeTrough.position.y = 3.6;
      flumeTrough.rotation.x = -0.04; // slight washwater incline
      flumeTrough.castShadow = true;
      flumeGroup.add(flumeTrough);

      for (let fz = -20; fz <= 20; fz += 10) {
        for (let fx of [-0.6, 0.6]) {
          const trestleLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.6, 0.18), timberFlumeMat);
          trestleLeg.position.set(fx, 1.8, fz);
          trestleLeg.castShadow = true;
          flumeGroup.add(trestleLeg);
        }
      }

      // 4. Vintage Riveted Cast-Iron Steam Mining Boiler (x: 46, z: -15)
      const boilerGroup = new THREE.Group();
      boilerGroup.position.set(46, 0, -15);
      regionalGroup.add(boilerGroup);

      const boilerTank = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.8, 12), rustIronMat);
      boilerTank.rotation.x = Math.PI / 2;
      boilerTank.position.y = 1.8;
      boilerTank.castShadow = true;
      boilerGroup.add(boilerTank);

      const smokestack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 5.5, 8), rustIronMat);
      smokestack.position.set(0, 5.2, -1.6);
      smokestack.castShadow = true;
      boilerGroup.add(smokestack);
    })();
''',
        'colliders': [
            "{ x: 0, z: -150, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 120, z: -40, r: 16 }",
            "{ x: -120, z: -40, r: 16 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -46, z: -15, r: 8 }",
            "{ x: -52, z: 20, r: 6.5 }",
            "{ x: 46, z: -15, r: 5.5 }",
            "{ x: 36, z: -15, r: 5 }"
        ]
    },

    'province-northwest-territories.html': {
        'name': 'Northwest Territories - Mackenzie Freight Depot, Wall-Tent & Elevated Food Cache',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: MACKENZIE RIVER FREIGHT OUTPOST
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const depotWoodMat = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.88 });
      const tinRoofMat = new THREE.MeshStandardMaterial({ color: 0x555e66, metalness: 0.6, roughness: 0.4 });
      const canvasMat = new THREE.MeshStandardMaterial({ color: 0xb5a88c, roughness: 0.95 });
      const drumRedMat = new THREE.MeshStandardMaterial({ color: 0x8a201c, metalness: 0.75, roughness: 0.35 });
      const drumBlueMat = new THREE.MeshStandardMaterial({ color: 0x1c4472, metalness: 0.75, roughness: 0.35 });
      const canyonRockMat = new THREE.MeshStandardMaterial({ color: 0x6a655d, roughness: 0.95 });

      // 1. Subarctic River Freight Warehouse Depot (x: -48, z: -15)
      const depotGroup = new THREE.Group();
      depotGroup.position.set(-48, 0, -15);
      regionalGroup.add(depotGroup);

      const warehouse = new THREE.Mesh(new THREE.BoxGeometry(13, 5.8, 11), depotWoodMat);
      warehouse.position.y = 2.9;
      warehouse.castShadow = true; warehouse.receiveShadow = true;
      depotGroup.add(warehouse);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(9.6, 3.2, 4), tinRoofMat);
      roof.position.y = 7.4;
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.2, 1.0, 1.3);
      roof.castShadow = true;
      depotGroup.add(roof);

      // Loading dock platform
      const dockPlatform = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.8, 4.0), depotWoodMat);
      dockPlatform.position.set(0, 0.4, 7.5);
      depotGroup.add(dockPlatform);

      const depotLamp = new THREE.PointLight(0xffb244, 1.4, 26);
      depotLamp.position.set(0, 4.2, 6.0);
      depotGroup.add(depotLamp);

      // 2. Prospector Heavy Canvas Wall-Tent (x: -40, z: 22)
      const tentGroup = new THREE.Group();
      tentGroup.position.set(-40, 0, 22);
      regionalGroup.add(tentGroup);

      const tentPlatform = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.4, 6.8), depotWoodMat);
      tentPlatform.position.y = 0.2;
      tentGroup.add(tentPlatform);

      const tentBody = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.0, 6.4), canvasMat);
      tentBody.position.y = 1.9;
      tentBody.castShadow = true;
      tentGroup.add(tentBody);

      // 3. Traditional Elevated Northern Food Cache on 4 Stilts (x: -36, z: -40)
      const cacheGroup = new THREE.Group();
      cacheGroup.position.set(-36, 0, -40);
      regionalGroup.add(cacheGroup);

      const cacheBox = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 3.6), depotWoodMat);
      cacheBox.position.y = 5.2;
      cacheBox.castShadow = true;
      cacheGroup.add(cacheBox);

      for (let px of [-1.4, 1.4]) {
        for (let pz of [-1.4, 1.4]) {
          const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 6), depotWoodMat);
          stilt.position.set(px, 2.1, pz);
          stilt.castShadow = true;
          cacheGroup.add(stilt);
        }
      }

      // 4. Arctic Steel Fuel Drum Cache (x: 38, z: 5)
      const drumGroup = new THREE.Group();
      drumGroup.position.set(38, 0, 5);
      regionalGroup.add(drumGroup);

      for (let d = 0; d < 8; d++) {
        const mat = (d % 2 === 0) ? drumRedMat : drumBlueMat;
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.15, 10), mat);
        drum.position.set((d % 4) * 1.1, 0.6, Math.floor(d / 4) * 1.1);
        drum.castShadow = true;
        drumGroup.add(drum);
      }

      // 5. Nahanni Canyon River Boulders
      const canyonRocks = [
        { x: 42, z: -25, s: 5.2 },
        { x: 46, z: 20, s: 4.8 }
      ];
      canyonRocks.forEach(cr => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(cr.s, 1), canyonRockMat);
        rock.position.set(cr.x, cr.s * 0.5, cr.z);
        rock.scale.set(1.3, 0.85, 1.1);
        rock.castShadow = true;
        regionalGroup.add(rock);
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: -150, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -48, z: -15, r: 8 }",
            "{ x: -40, z: 22, r: 5 }",
            "{ x: -36, z: -40, r: 4.5 }",
            "{ x: 38, z: 5, r: 4 }",
            "{ x: 42, z: -25, r: 5.5 }"
        ]
    },

    'province-nunavut.html': {
        'name': 'Nunavut - Geodesic Research Dome, Qamutik Sleds & Talus Moraine',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: HIGH-ARCTIC POLAR OUTPOST
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const domeOrangeMat = new THREE.MeshStandardMaterial({ color: 0xdd5511, metalness: 0.3, roughness: 0.5 });
      const domeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe0e6ea, metalness: 0.25, roughness: 0.45 });
      const qamutikWoodMat = new THREE.MeshStandardMaterial({ color: 0x6a4e32, roughness: 0.9 });
      const talusRockMat = new THREE.MeshStandardMaterial({ color: 0x5a5c60, roughness: 0.95 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x889098, metalness: 0.8, roughness: 0.3 });

      // 1. High-Arctic Geodesic Research Polar Habitat (x: -48, z: -15)
      const domeGroup = new THREE.Group();
      domeGroup.position.set(-48, 0, -15);
      regionalGroup.add(domeGroup);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(6.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeOrangeMat);
      dome.castShadow = true; dome.receiveShadow = true;
      domeGroup.add(dome);

      // Airlock entry tunnel
      const airlock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 4.5), domeWhiteMat);
      airlock.position.set(0, 1.3, 5.0);
      airlock.castShadow = true;
      domeGroup.add(airlock);

      const domeLight = new THREE.PointLight(0x00ffcc, 1.5, 26);
      domeLight.position.set(0, 3.2, 5.2);
      domeGroup.add(domeLight);

      // 2. Arctic Wind Telemetry & Solar Mast (x: -38, z: 18)
      const mastGroup = new THREE.Group();
      mastGroup.position.set(-38, 0, 18);
      regionalGroup.add(mastGroup);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 12, 8), steelMat);
      mast.position.y = 6;
      mast.castShadow = true;
      mastGroup.add(mast);

      const turbineRotor = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.08, 6), steelMat);
      turbineRotor.rotation.x = Math.PI / 2;
      turbineRotor.position.set(0, 12, 0.4);
      mastGroup.add(turbineRotor);

      const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.1), steelMat);
      solarPanel.position.set(0, 7.5, 0.6);
      solarPanel.rotation.x = -0.4;
      mastGroup.add(solarPanel);

      // 3. Handcrafted Wooden Qamutik Traditional Sleds (x: -34, z: 2)
      const qamutikGroup = new THREE.Group();
      qamutikGroup.position.set(-34, 0, 2);
      regionalGroup.add(qamutikGroup);

      [-0.7, 0.7].forEach(rx => {
        const runner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 6.2), qamutikWoodMat);
        runner.position.set(rx, 0.18, 0);
        qamutikGroup.add(runner);
      });
      for (let b = -2.5; b <= 2.5; b += 0.8) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.3), qamutikWoodMat);
        slat.position.set(0, 0.38, b);
        qamutikGroup.add(slat);
      }

      // 4. Insulated Polar Supplies Container (x: 44, z: 12)
      const container = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 3.2), domeWhiteMat);
      container.position.set(44, 1.6, 12);
      container.castShadow = true; container.receiveShadow = true;
      regionalGroup.add(container);

      // 5. Auyuittuq Granite Talus Boulder Moraine
      const talusRocks = [
        { x: 38, z: -20, s: 5.6 },
        { x: 42, z: -55, s: 5.8 },
        { x: -36, z: -50, s: 4.8 }
      ];
      talusRocks.forEach(tr => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(tr.s, 1), talusRockMat);
        rock.position.set(tr.x, tr.s * 0.5, tr.z);
        rock.scale.set(1.25, 0.8, 1.15);
        rock.castShadow = true; rock.receiveShadow = true;
        regionalGroup.add(rock);
      });
    })();
''',
        'colliders': [
            "{ x: 0, z: -150, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 120, z: 40, r: 16 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: -65, z: -40, r: 8 }",
            "{ x: -48, z: -15, r: 8 }",
            "{ x: -38, z: 18, r: 4.5 }",
            "{ x: 44, z: 12, r: 5.5 }",
            "{ x: 38, z: -20, r: 6 }",
            "{ x: 42, z: -55, r: 6 }"
        ]
    },

    'province-national-capital.html': {
        'name': 'National Capital Region - Stone Lockkeeper Cottage, Maple Allée & Monument',
        'code': '''
    // ------------------------------------------------------------
    // GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY: CONFEDERATION BOULEVARD & RIDEAU CANAL
    // ------------------------------------------------------------
    (function buildRegionalEnvironment() {
      const regionalGroup = new THREE.Group();
      scene.add(regionalGroup);

      const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0x8c8272, roughness: 0.9 });
      const slateRoofMat = new THREE.MeshStandardMaterial({ color: 0x2b3036, roughness: 0.88 });
      const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x283e34, metalness: 0.85, roughness: 0.3 });
      const granitePlinthMat = new THREE.MeshStandardMaterial({ color: 0x76787b, roughness: 0.92 });
      const lampIronMat = new THREE.MeshStandardMaterial({ color: 0x15181a, metalness: 0.9, roughness: 0.3 });
      const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xffcc77 });

      // Maple crown foliage colors (autumn palette)
      const mapleColors = [0xc43018, 0xd46816, 0xcca01c, 0xb82814];

      // 1. Heritage Stone Rideau Canal Lockkeeper Cottage (x: -48, z: -15)
      const cottageGroup = new THREE.Group();
      cottageGroup.position.set(-48, 0, -15);
      regionalGroup.add(cottageGroup);

      const cottageBody = new THREE.Mesh(new THREE.BoxGeometry(10, 5.2, 8), sandstoneMat);
      cottageBody.position.y = 2.6;
      cottageBody.castShadow = true; cottageBody.receiveShadow = true;
      cottageGroup.add(cottageBody);

      const cottageRoof = new THREE.Mesh(new THREE.ConeGeometry(7.8, 3.2, 4), slateRoofMat);
      cottageRoof.position.y = 6.8;
      cottageRoof.rotation.y = Math.PI / 4;
      cottageRoof.scale.set(1.25, 1.0, 1.1);
      cottageRoof.castShadow = true;
      cottageGroup.add(cottageRoof);

      const stoneChimney = new THREE.Mesh(new THREE.BoxGeometry(1.8, 7.8, 1.8), sandstoneMat);
      stoneChimney.position.set(0, 4.4, 0);
      cottageGroup.add(stoneChimney);

      const cottageLamp = new THREE.PointLight(0xffb244, 1.4, 24);
      cottageLamp.position.set(0, 3.2, 4.6);
      cottageGroup.add(cottageLamp);

      // 2. Confederation Boulevard Parkland Sugar Maple Allée
      const mapleCoords = [
        { x: -26, z: 30, c: 0 }, { x: -26, z: 5, c: 1 }, { x: -26, z: -20, c: 2 }, { x: -26, z: -45, c: 3 },
        { x: 26, z: 30, c: 1 }, { x: 26, z: 5, c: 0 }, { x: 26, z: -20, c: 3 }, { x: 26, z: -45, c: 2 }
      ];
      mapleCoords.forEach(mc => {
        const tree = new THREE.Group();
        tree.position.set(mc.x, 0, mc.z);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 4.2, 8), sandstoneMat);
        trunk.position.y = 2.1;
        trunk.castShadow = true;
        tree.add(trunk);

        const leafMat = new THREE.MeshStandardMaterial({ color: mapleColors[mc.c], roughness: 0.8 });
        const crown = new THREE.Mesh(new THREE.SphereGeometry(3.6, 10, 8), leafMat);
        crown.position.y = 6.2;
        crown.scale.set(1.15, 1.3, 1.15);
        crown.castShadow = true;
        tree.add(crown);
        distantDecorGroup.add(tree);
      });

      // 3. Classical Bronze Statuary Monument (x: 40, z: -15)
      const monumentGroup = new THREE.Group();
      monumentGroup.position.set(40, 0, -15);
      regionalGroup.add(monumentGroup);

      const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 4.5), granitePlinthMat);
      plinth.position.y = 0.9;
      plinth.castShadow = true;
      monumentGroup.add(plinth);

      const statue = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 2.2), bronzeMat);
      statue.position.y = 3.4;
      statue.castShadow = true;
      monumentGroup.add(statue);

      // 4. Cast-Iron Heritage 5-Globe Street Gas Lamps
      const lampCoords = [
        { x: -24, z: 20 }, { x: -24, z: -10 }, { x: -24, z: -40 },
        { x: 24, z: 20 }, { x: 24, z: -10 }, { x: 24, z: -40 }
      ];
      lampCoords.forEach(lc => {
        const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 5.0, 8), lampIronMat);
        lampPost.position.set(lc.x, 2.5, lc.z);
        lampPost.castShadow = true;
        regionalGroup.add(lampPost);

        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), lampGlowMat);
        globe.position.set(lc.x, 5.2, lc.z);
        regionalGroup.add(globe);

        const light = new THREE.PointLight(0xffb74d, 1.4, 18);
        light.position.set(lc.x, 5.2, lc.z);
        regionalGroup.add(light);
      });

      // 5. Stone Balustrade Garden Wall (x: 36, z: 15)
      const balustrade = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 14), sandstoneMat);
      balustrade.position.set(36, 0.6, 15);
      balustrade.castShadow = true;
      regionalGroup.add(balustrade);
    })();
''',
        'colliders': [
            "{ x: 0, z: -150, r: 24 }",
            "{ x: 0, z: -180, r: 5 }",
            "{ x: 120, z: -40, r: 16 }",
            "{ x: -120, z: -40, r: 16 }",
            "{ x: -65, z: -20, r: 8 }",
            "{ x: 65, z: -20, r: 8 }",
            "{ x: -65, z: 20, r: 8 }",
            "{ x: 65, z: 20, r: 8 }",
            "{ x: -48, z: -15, r: 7.5 }",
            "{ x: 40, z: -15, r: 5 }",
            "{ x: 36, z: 15, r: 4.5 }"
        ]
    }
}


def process_file(file_path):
    filename = os.path.basename(file_path)
    if filename not in SCENERY_DEFINITIONS:
        print(f"Skipping {filename} (no definition)")
        return False

    defn = SCENERY_DEFINITIONS[filename]
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if already injected
    if 'buildRegionalEnvironment' in content:
        print(f"File {filename} already has buildRegionalEnvironment; updating...")
        # Remove old injection block if present
        content = re.sub(
            r'\s*// -{10,}\s*// GEOGRAPHIC ENVIRONMENT & AUTHENTIC REGIONAL SCENERY.*?\n\s*\}\)\(\);',
            '',
            content,
            flags=re.DOTALL
        )

    # 1. Inject code before // SCENERY COLLIDERS
    anchor = re.search(r'(\s*// ------------------------------------------------------------\s*// SCENERY COLLIDERS)', content)
    if not anchor:
        print(f"ERROR: Scenery colliders anchor not found in {filename}")
        return False

    insert_idx = anchor.start()
    new_content = content[:insert_idx] + "\n" + defn['code'] + content[insert_idx:]

    # 2. Replace WORLD_COLLIDERS
    coll_pattern = re.compile(r'const WORLD_COLLIDERS = \[[^\]]*\];', re.DOTALL)
    coll_match = coll_pattern.search(new_content)
    if not coll_match:
        print(f"ERROR: Could not find WORLD_COLLIDERS in {filename}")
        return False

    colliders_str = "const WORLD_COLLIDERS = [\n      " + ",\n      ".join(defn['colliders']) + "\n    ];"
    new_content = coll_pattern.sub(colliders_str, new_content, count=1)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"SUCCESS: Injected authentic regional scenery into {filename} ({defn['name']})")
    return True


def main():
    print("Beginning injection across all 14 realm files...")
    success_count = 0
    for filename in sorted(SCENERY_DEFINITIONS.keys()):
        if process_file(filename):
            success_count += 1
    print(f"\nDone: {success_count}/{len(SCENERY_DEFINITIONS)} files successfully updated.")


if __name__ == '__main__':
    main()
