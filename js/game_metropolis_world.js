// js/game_metropolis_world.js
// Nexus Metropolis Architecture, Shopping Mall, Regional Aviation & Recreational World Subsystems
// Extracted from game.html for modularity and high performance (< 20,000-line compliance)


    // ============================================================
    // NEXUS GRAND MALL & SHOPPING GALLERIA ARCHITECTURE
    // ============================================================
    function buildShoppingMall() {
      const mallGroup = new THREE.Group();
      scene.add(mallGroup);

      // Shared High-Tech Materials
      const mallFloorMat = new THREE.MeshStandardMaterial({
        color: 0x141a26,
        roughness: 0.28,
        metalness: 0.65
      });
      const mallGlassMat = new THREE.MeshStandardMaterial({
        color: 0x00f2ff,
        transparent: true,
        opacity: 0.32,
        roughness: 0.1,
        metalness: 0.8
      });
      const mallTrimMat = new THREE.MeshStandardMaterial({
        color: 0x080d16,
        roughness: 0.35,
        metalness: 0.88
      });
      const neonYellowMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const neonGreenMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      const neonMagentaMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
      const neonOrangeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });

      // 1. Grand Atrium Main Floor (68m x 62m, centered at x: 0, z: 122)
      const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(68, 0.5, 62), mallFloorMat);
      floorMesh.position.set(0, 0.25, 122);
      floorMesh.receiveShadow = true;
      mallGroup.add(floorMesh);

      // Illuminated Main Walkway Concourse (North-South Promenade)
      const walkwayMat = new THREE.MeshBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: 0.35 });
      const mainWalkway = new THREE.Mesh(new THREE.PlaneGeometry(12, 60), walkwayMat);
      mainWalkway.rotation.x = -Math.PI / 2;
      mainWalkway.position.set(0, 0.51, 122);
      mallGroup.add(mainWalkway);

      // Cross Walkway Connecting East & West Wings
      const crossWalkway = new THREE.Mesh(new THREE.PlaneGeometry(64, 8), walkwayMat);
      crossWalkway.rotation.x = -Math.PI / 2;
      crossWalkway.position.set(0, 0.512, 122);
      mallGroup.add(crossWalkway);

      // 2. Translucent Glass Arched Barrel-Vault Ceiling (Height: 18m)
      const archTrussGeo = new THREE.TorusGeometry(32, 0.45, 8, 24, Math.PI);
      for (let az = 94; az <= 150; az += 14) {
        const truss = new THREE.Mesh(archTrussGeo, mallTrimMat);
        truss.position.set(0, 0.5, az);
        truss.rotation.z = Math.PI;
        mallGroup.add(truss);
      }
      const roofCyl = new THREE.CylinderGeometry(32, 32, 58, 24, 1, true, 0, Math.PI);
      const roofMesh = new THREE.Mesh(roofCyl, mallGlassMat);
      roofMesh.rotation.z = Math.PI / 2;
      roofMesh.rotation.y = Math.PI / 2;
      roofMesh.position.set(0, 0.5, 122);
      mallGroup.add(roofMesh);

      // 3. Grand Entrance Portico & Holographic Signage at z = 92
      const portalL = new THREE.Mesh(new THREE.BoxGeometry(4, 14, 4), mallTrimMat);
      portalL.position.set(-16, 7, 92);
      mallGroup.add(portalL);
      const portalR = new THREE.Mesh(new THREE.BoxGeometry(4, 14, 4), mallTrimMat);
      portalR.position.set(16, 7, 92);
      mallGroup.add(portalR);
      const portalBeam = new THREE.Mesh(new THREE.BoxGeometry(36, 3, 4), mallTrimMat);
      portalBeam.position.set(0, 14, 92);
      mallGroup.add(portalBeam);

      // Canvas-Generated 3D Header Signboard
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 1024;
      signCanvas.height = 128;
      const sctx = signCanvas.getContext('2d');
      if (sctx) {
        sctx.fillStyle = '#060c18';
        sctx.fillRect(0, 0, 1024, 128);
        sctx.strokeStyle = '#00f2ff';
        sctx.lineWidth = 6;
        sctx.strokeRect(6, 6, 1012, 116);
        sctx.fillStyle = '#ffd700';
        sctx.font = 'bold 44px Orbitron, sans-serif';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillText('⚡ NEXUS GRAND MALL & GALLERIA ⚡', 512, 50);
        sctx.fillStyle = '#00f2ff';
        sctx.font = '22px Orbitron, monospace';
        sctx.fillText('CYBER-ARMORY // EXO-SUITS // MOTORS // MED-BAY // ARCADE', 512, 94);
      }
      const signTex = new THREE.CanvasTexture(signCanvas);
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(32, 4), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
      signMesh.position.set(0, 14, 94.1);
      mallGroup.add(signMesh);

      const signMeshBack = signMesh.clone();
      signMeshBack.rotation.y = Math.PI;
      signMeshBack.position.set(0, 14, 89.9);
      mallGroup.add(signMeshBack);

      // 4. Central Concourse Plaza (x: 0, z: 122)
      // Floating Holographic Planetarium Globe
      const globeGeo = new THREE.SphereGeometry(2.4, 16, 16);
      const globeMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true, transparent: true, opacity: 0.65 });
      mallHoloPlaza = new THREE.Mesh(globeGeo, globeMat);
      mallHoloPlaza.position.set(0, 4.8, 122);
      mallGroup.add(mallHoloPlaza);

      const fountainMesh = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 1.0, 16), mallTrimMat);
      fountainMesh.position.set(0, 0.75, 122);
      mallGroup.add(fountainMesh);

      const fountainRing = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.14, 8, 24), neonCyanMat);
      fountainRing.rotation.x = Math.PI / 2;
      fountainRing.position.set(0, 1.25, 122);
      mallGroup.add(fountainRing);

      // 5. Store 1: CYBER-ARMORY (West Wing 1: x = -20, z = 110)
      buildStoreArmory(mallGroup, -20, 110);

      // 6. Store 2: EXO-CORE ATELIER (East Wing 1: x = 20, z = 110)
      buildStoreExoSuits(mallGroup, 20, 110);

      // 7. Store 3: HYPERION MOTORS SHOWROOM (West Wing 2: x = -20, z = 135)
      buildStoreMotors(mallGroup, -20, 135);

      // 8. Store 4: BIO-STIM MED-BAY (East Wing 2: x = 20, z = 135)
      buildStoreMedBay(mallGroup, 20, 135);

      // 9. Store 5: STARDUST CAFE & RETRO ARCADE (North Concourse: x = 0, z = 146)
      buildStoreArcade(mallGroup, 0, 146);

      // 10. Store 6: AERO-PROPULSION & JETPACK TECH STORE (South Galleria Entry: x = 0, z = 100)
      buildStoreJetpack(mallGroup, 0, 100);

      // Register Mall perimeter colliders
      registerCityCollider({ x: -34, z: 122, hw: 2, hd: 31, doorW: 0 }); // West outer wall
      registerCityCollider({ x: 34, z: 122, hw: 2, hd: 31, doorW: 0 });  // East outer wall
      registerCityCollider({ x: 0, z: 153, hw: 34, hd: 2, doorW: 0 });   // North back wall
      registerCityCollider({ x: 0, z: 91, hw: 34, hd: 2, doorW: 14 });   // South front wall with 14m entrance doorway
    }

    // STORE 1: CYBER-ARMORY
    function buildStoreArmory(parent, sx, sz) {
      const storeGroup = new THREE.Group();
      storeGroup.position.set(sx, 0, sz);
      parent.add(storeGroup);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x121822, roughness: 0.4, metalness: 0.8 });
      const orangeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

      // Store Signboard
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.6), frameMat);
      signMesh.position.set(0, 6.5, 5);
      storeGroup.add(signMesh);

      const signGlow = new THREE.Mesh(new THREE.BoxGeometry(15.6, 1.8, 0.7), orangeMat);
      signGlow.position.set(0, 6.5, 5);
      storeGroup.add(signGlow);

      // Weapon display pedestals (3 pedestals with floating tactical weapons)
      [-4.5, 0, 4.5].forEach((px, i) => {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 1.1, 14), frameMat);
        base.position.set(px, 0.55, 0);
        storeGroup.add(base);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.08, 8, 16), orangeMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(px, 1.1, 0);
        storeGroup.add(ring);

        // Weapon mesh
        const wepGroup = new THREE.Group();
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), frameMat);
        barrel.rotation.z = Math.PI / 2;
        wepGroup.add(barrel);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.1), frameMat);
        stock.position.set(-0.6, -0.05, 0);
        wepGroup.add(stock);
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), orangeMat);
        scope.rotation.z = Math.PI / 2;
        scope.position.set(0, 0.14, 0);
        wepGroup.add(scope);

        wepGroup.position.set(px, 1.7, 0);
        storeGroup.add(wepGroup);

        mallStoreRotatingPedestals.push({
          mesh: wepGroup,
          baseY: 1.7,
          rotSpeed: 1.2,
          bobAmp: 0.08,
          phase: i * 1.6
        });
      });

      // Terminal Console
      const desk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.1, 1.4), frameMat);
      desk.position.set(0, 0.55, 3.5);
      storeGroup.add(desk);

      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), orangeMat);
      screen.rotation.x = -Math.PI / 6;
      screen.position.set(0, 1.35, 3.3);
      storeGroup.add(screen);
    }

    // STORE 2: EXO-CORE ATELIER
    function buildStoreExoSuits(parent, sx, sz) {
      const storeGroup = new THREE.Group();
      storeGroup.position.set(sx, 0, sz);
      parent.add(storeGroup);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x121822, roughness: 0.4, metalness: 0.8 });
      const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

      // Signboard
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.6), frameMat);
      signMesh.position.set(0, 6.5, 5);
      storeGroup.add(signMesh);

      const signGlow = new THREE.Mesh(new THREE.BoxGeometry(15.6, 1.8, 0.7), cyanMat);
      signGlow.position.set(0, 6.5, 5);
      storeGroup.add(signGlow);

      // Mannequin Plinths (Left: Ghost Stealth, Right: Titan Juggernaut)
      [-3.5, 3.5].forEach((mx, i) => {
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.4, 16), frameMat);
        plinth.position.set(mx, 0.2, 0);
        storeGroup.add(plinth);

        const glowRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.08, 8, 20), cyanMat);
        glowRing.rotation.x = Math.PI / 2;
        glowRing.position.set(mx, 0.42, 0);
        storeGroup.add(glowRing);

        // Holographic Mannequin Silhouette
        const suitMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 1.4, 12),
          new THREE.MeshBasicMaterial({ color: i === 0 ? 0x00f2ff : 0xffd700, wireframe: true, transparent: true, opacity: 0.55 })
        );
        suitMesh.position.set(mx, 1.25, 0);
        storeGroup.add(suitMesh);

        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12),
          new THREE.MeshBasicMaterial({ color: i === 0 ? 0x00f2ff : 0xffd700, transparent: true, opacity: 0.75 })
        );
        headMesh.position.set(mx, 2.1, 0);
        storeGroup.add(headMesh);

        mallStoreRotatingPedestals.push({
          mesh: suitMesh,
          baseY: 1.25,
          rotSpeed: 0.6,
          bobAmp: 0.04,
          phase: i * 2.0
        });
      });

      // Central Calibrator Pedestal
      const desk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 1.0, 16), frameMat);
      desk.position.set(0, 0.5, 3.5);
      storeGroup.add(desk);

      const calibRing = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 8, 20), cyanMat);
      calibRing.rotation.x = Math.PI / 2;
      calibRing.position.set(0, 1.02, 3.5);
      storeGroup.add(calibRing);
    }

    // STORE 3: HYPERION MOTORS SHOWROOM
    function buildStoreMotors(parent, sx, sz) {
      const storeGroup = new THREE.Group();
      storeGroup.position.set(sx, 0, sz);
      parent.add(storeGroup);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x121822, roughness: 0.4, metalness: 0.8 });
      const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });

      // Signboard
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.6), frameMat);
      signMesh.position.set(0, 6.5, 5);
      storeGroup.add(signMesh);

      const signGlow = new THREE.Mesh(new THREE.BoxGeometry(15.6, 1.8, 0.7), goldMat);
      signGlow.position.set(0, 6.5, 5);
      storeGroup.add(signGlow);

      // Large Rotating Vehicle Turntable (radius: 4.8m)
      const turntableGroup = new THREE.Group();
      turntableGroup.position.set(0, 0.3, 0);
      storeGroup.add(turntableGroup);

      const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.0, 0.5, 24), frameMat);
      tableBase.position.y = 0.25;
      turntableGroup.add(tableBase);

      const tableRing = new THREE.Mesh(new THREE.TorusGeometry(4.82, 0.09, 8, 28), goldMat);
      tableRing.rotation.x = Math.PI / 2;
      tableRing.position.y = 0.51;
      turntableGroup.add(tableRing);

      // Concept 6x6 Rover Model (Scale Model)
      const miniRover = new THREE.Group();
      miniRover.position.set(-1.8, 0.7, 0);
      const rBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3, metalness: 0.8 })
      );
      miniRover.add(rBody);
      const rTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.3, 10), goldMat);
      rTurret.position.set(0.2, 0.5, 0);
      miniRover.add(rTurret);
      turntableGroup.add(miniRover);

      // Concept Hoverbike Model (Scale Model)
      const miniBike = new THREE.Group();
      miniBike.position.set(1.8, 0.75, 0);
      const bBody = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x00f2ff, roughness: 0.2, metalness: 0.9 })
      );
      bBody.rotation.z = Math.PI / 2;
      miniBike.add(bBody);
      const bRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.06, 6, 16), goldMat);
      bRing.rotation.y = Math.PI / 2;
      miniBike.add(bRing);
      turntableGroup.add(miniBike);

      mallStoreRotatingPedestals.push({
        mesh: turntableGroup,
        baseY: 0.3,
        rotSpeed: 0.45,
        bobAmp: 0,
        phase: 0
      });
    }

    // STORE 4: BIO-STIM MED-BAY & PHARMACY
    function buildStoreMedBay(parent, sx, sz) {
      const storeGroup = new THREE.Group();
      storeGroup.position.set(sx, 0, sz);
      parent.add(storeGroup);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x121822, roughness: 0.4, metalness: 0.8 });
      const greenMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

      // Signboard
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.6), frameMat);
      signMesh.position.set(0, 6.5, 5);
      storeGroup.add(signMesh);

      const signGlow = new THREE.Mesh(new THREE.BoxGeometry(15.6, 1.8, 0.7), greenMat);
      signGlow.position.set(0, 6.5, 5);
      storeGroup.add(signGlow);

      // Cryo-Regeneration Capsules (Left & Right)
      [-4.0, 4.0].forEach(cx => {
        const podBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.6, 16), frameMat);
        podBase.position.set(cx, 0.3, -1);
        storeGroup.add(podBase);

        const glassTube = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.8, 16),
          new THREE.MeshStandardMaterial({ color: 0x00ff88, transparent: true, opacity: 0.38, roughness: 0.1, metalness: 0.7 })
        );
        glassTube.position.set(cx, 1.8, -1);
        storeGroup.add(glassTube);

        const podCap = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.9, 0.5, 16), frameMat);
        podCap.position.set(cx, 3.3, -1);
        storeGroup.add(podCap);

        const innerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.4, 8), greenMat);
        innerCore.position.set(cx, 1.8, -1);
        storeGroup.add(innerCore);
        mallCryoBeacons.push(innerCore);
      });

      // Walk-in Bio-Stim Floor Healing Ring (Stepping inside regenerates player vitals)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.65 });
      const floorRing = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.15, 8, 24), ringMat);
      floorRing.rotation.x = Math.PI / 2;
      floorRing.position.set(0, 0.52, 2.0);
      storeGroup.add(floorRing);
      mallCryoBeacons.push(floorRing);

      const padMesh = new THREE.Mesh(new THREE.CircleGeometry(2.1, 20),
        new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.18 })
      );
      padMesh.rotation.x = -Math.PI / 2;
      padMesh.position.set(0, 0.51, 2.0);
      storeGroup.add(padMesh);
    }

    // STORE 6: AERO-PROPULSION & JETPACK TECH LAB
    function buildStoreJetpack(parent, sx, sz) {
      const storeGroup = new THREE.Group();
      storeGroup.position.set(sx, 0, sz);
      parent.add(storeGroup);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a1420, roughness: 0.35, metalness: 0.9 });
      const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.45, roughness: 0.1 });

      // Store Signboard Arch
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(18, 2.0, 0.6), frameMat);
      signMesh.position.set(0, 6.5, 0);
      storeGroup.add(signMesh);

      const signGlow = new THREE.Mesh(new THREE.BoxGeometry(17.6, 1.6, 0.7), cyanMat);
      signGlow.position.set(0, 6.5, 0);
      storeGroup.add(signGlow);

      // Central Rotating Display Pedestal for Advanced Jetpack
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 1.1, 16), frameMat);
      pedestal.position.set(0, 0.55, 0);
      storeGroup.add(pedestal);

      const pedRing = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.08, 8, 24), cyanMat);
      pedRing.rotation.x = Math.PI / 2;
      pedRing.position.set(0, 1.1, 0);
      storeGroup.add(pedRing);

      // 3D Display Jetpack Model
      const jpDisplay = new THREE.Group();
      jpDisplay.position.set(0, 2.2, 0);

      const jpMain = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), frameMat);
      jpDisplay.add(jpMain);

      // Dual Ion Thruster Tubes
      [-0.8, 0.8].forEach(tx => {
        const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.8, 12), frameMat);
        thruster.position.set(tx, -0.1, 0);
        jpDisplay.add(thruster);

        const plume = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.0, 8), cyanMat);
        plume.rotation.x = Math.PI;
        plume.position.set(tx, -1.2, 0);
        jpDisplay.add(plume);
      });

      storeGroup.add(jpDisplay);

      // Side Battery Display Pods
      [-5.5, 5.5].forEach((bx, idx) => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.9, 12), frameMat);
        pod.position.set(bx, 0.45, 0);
        storeGroup.add(pod);

        // Glowing battery cells
        const battMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), idx === 0 ? yellowMat : cyanMat);
        battMesh.position.set(bx, 1.4, 0);
        storeGroup.add(battMesh);
      });
    }

    // STORE 5: STARDUST CAFE & RETRO ARCADE
    function buildStoreArcade(parent, sx, sz) {
      const storeGroup = new THREE.Group();
      storeGroup.position.set(sx, 0, sz);
      parent.add(storeGroup);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x121822, roughness: 0.4, metalness: 0.8 });
      const pinkMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
      const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

      // Signboard
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(22, 2.2, 0.6), frameMat);
      signMesh.position.set(0, 6.5, -4);
      storeGroup.add(signMesh);

      const signGlow = new THREE.Mesh(new THREE.BoxGeometry(21.6, 1.8, 0.7), pinkMat);
      signGlow.position.set(0, 6.5, -4);
      storeGroup.add(signGlow);

      // Cyber Bar Counter
      const barMesh = new THREE.Mesh(new THREE.BoxGeometry(8, 1.1, 1.2), frameMat);
      barMesh.position.set(-4, 0.55, 0);
      storeGroup.add(barMesh);

      const barNeon = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.08, 0.1), pinkMat);
      barNeon.position.set(-4, 1.05, 0.6);
      storeGroup.add(barNeon);

      // Stools
      [-6, -4, -2].forEach(bx => {
        const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.75, 10), cyanMat);
        stool.position.set(bx, 0.38, 1.2);
        storeGroup.add(stool);
      });

      // 2 Retro 3D Arcade Cabinets
      [3.0, 5.2].forEach((ax, i) => {
        const cab = new THREE.Group();
        cab.position.set(ax, 0, 0);

        const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.0), frameMat);
        cabBody.position.y = 1.1;
        cab.add(cabBody);

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.65), i === 0 ? cyanMat : pinkMat);
        screen.position.set(0, 1.4, 0.51);
        cab.add(screen);

        const marquee = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.3, 0.3), i === 0 ? pinkMat : cyanMat);
        marquee.position.set(0, 2.1, 0.45);
        cab.add(marquee);

        storeGroup.add(cab);
      });
    }

    // ============================================================
    // REGIONAL CITIES & EXPANDED RECREATIONAL ACTIVITIES ENGINE
    // ============================================================

    // ------------------------------------------------------------
    // 1. NEO-KYOTO CYBER MEGACITY (EAST HORIZON at X: 480, Z: 350)
    // ------------------------------------------------------------
    
    // ============================================================
    // NEXUS APEX CAR CUSTOMS & MOD SHOP ARCHITECTURE (-85, 0, 45)
    // ============================================================
    
    // ============================================================
    // 8 SUPPLY LOOT CRATES SCATTERED ACROSS ICONIC LANDMARKS
    // ============================================================
    function buildSupplyLootCrates() {
      const crateLocs = [
        { name: 'Grand Mall Rooftop Atrium', x: 0, y: 36.2, z: 122, tokens: 250 },
        { name: 'Mechazilla 145m Tower High Platform', x: 104, y: 71.5, z: -100, tokens: 300 },
        { name: 'Apex Car Customs Tuning Pit', x: -85, y: 0.6, z: 45, tokens: 180 },
        { name: 'Subterranean -22m Subway Depot', x: 20, y: -20.5, z: 20, tokens: 200 },
        { name: 'Neo-Kyoto Imperial Pagoda Spire', x: 480, y: 52.0, z: 300, tokens: 350 },
        { name: 'Solaria Oasis Cantina Rooftop', x: -380, y: 18.5, z: 440, tokens: 220 },
        { name: 'Atlantis Oceanic Seafloor Dome', x: -480, y: 0.6, z: -380, tokens: 280 },
        { name: 'Central Coliseum Championship Podium', x: 0, y: 1.5, z: 0, tokens: 150 }
      ];

      const cMatGold = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.18 });
      const cMatDarkSteel = new THREE.MeshStandardMaterial({ color: 0x111923, metalness: 0.9, roughness: 0.3 });
      const cMatCyanGlow = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

      crateLocs.forEach((loc, idx) => {
        const crateGroup = new THREE.Group();
        crateGroup.position.set(loc.x, loc.y, loc.z);

        // Armored Vault Crate Box
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), cMatDarkSteel);
        box.position.y = 0.55;
        box.castShadow = true;
        crateGroup.add(box);

        // Gold Reinforced Corner Brackets
        const goldBand = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 1.45), cMatGold);
        goldBand.position.y = 0.55;
        crateGroup.add(goldBand);

        // Cyan Glowing Latch
        const latch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 1.48), cMatCyanGlow);
        latch.position.y = 0.55;
        crateGroup.add(latch);

        // Holographic Rotating Token Icon above Crate
        const holoCoin = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16), cMatGold);
        holoCoin.rotation.z = Math.PI / 2;
        holoCoin.position.y = 1.65;
        crateGroup.add(holoCoin);
        citySpinners.push(holoCoin);

        // Ground Glowing Beacon Ring
        const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.8, 24), cMatCyanGlow);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        crateGroup.add(ring);

        scene.add(crateGroup);

        supplyLootCrates.push({
          group: crateGroup,
          pos: new THREE.Vector3(loc.x, loc.y, loc.z),
          name: loc.name,
          tokens: loc.tokens,
          isAvailable: true,
          respawnTimer: 0
        });
      });
    }

    // ============================================================
    // ATLANTIS OCEANIC HYDRO-SKIMMER / CYBER JET-SKI (-480, 0, -380)
    // ============================================================
    function buildHydroSkimmer() {
      hydroSkimmerGroup = new THREE.Group();
      hydroSkimmerGroup.position.set(-480, 0.5, -380);
      scene.add(hydroSkimmerGroup);

      const hMatAqua = new THREE.MeshStandardMaterial({ color: 0x00d9ff, metalness: 0.9, roughness: 0.2 });
      const hMatCarbon = new THREE.MeshStandardMaterial({ color: 0x0b1017, metalness: 0.85, roughness: 0.35 });
      const hMatGlow = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

      // Catamaran Twin-Pontoon Hydrofoil Hulls
      [-0.8, 0.8].forEach(px => {
        const pontoon = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 4.2, 12), hMatAqua);
        pontoon.rotation.x = Math.PI / 2;
        pontoon.position.set(px, 0.3, 0);
        hydroSkimmerGroup.add(pontoon);

        const repulsorRing = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 8, 16), hMatGlow);
        repulsorRing.rotation.x = Math.PI / 2;
        repulsorRing.position.set(px, 0.15, 0);
        hydroSkimmerGroup.add(repulsorRing);
      });

      // Aerodynamic Pilot Deck & Racing Seat
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 3.2), hMatCarbon);
      deck.position.set(0, 0.55, -0.2);
      hydroSkimmerGroup.add(deck);

      // Handlebars & Digital Windshield
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.1), hMatGlow);
      screen.position.set(0, 1.15, 0.8);
      screen.rotation.x = Math.PI / 6;
      hydroSkimmerGroup.add(screen);

      // Water Rooster-Tail Spray Emitter Mesh
      const sprayGeo = new THREE.ConeGeometry(0.6, 2.8, 8);
      const sprayMat = new THREE.MeshBasicMaterial({ color: 0x88eeff, transparent: true, opacity: 0 });
      hydroSkimmerSpray = new THREE.Mesh(sprayGeo, sprayMat);
      hydroSkimmerSpray.rotation.x = -Math.PI / 2;
      hydroSkimmerSpray.position.set(0, 0.4, -2.6);
      hydroSkimmerGroup.add(hydroSkimmerSpray);
    }

    // ============================================================
    // CYBER RADIO & PROCEDURAL SYNTHWAVE PLAYER
    // ============================================================
    function cycleCyberRadio() {
      gameState.currentRadioStation = (gameState.currentRadioStation + 1) % gameState.radioStationNames.length;
      const stName = gameState.radioStationNames[gameState.currentRadioStation];

      cyberAudio.startCyberRadio(gameState.currentRadioStation);

      const hudBadge = document.getElementById('hud-radio-val');
      if (hudBadge) {
        hudBadge.textContent = (gameState.currentRadioStation === 0) ? '[📻 RADIO OFF]' : `[📻 ${stName}]`;
        hudBadge.style.color = (gameState.currentRadioStation === 0) ? '#8fa3b8' : '#00f2ff';
      }

      const carRadioLabel = document.getElementById('car-radio-station-name');
      if (carRadioLabel) {
        carRadioLabel.textContent = stName;
        carRadioLabel.style.color = (gameState.currentRadioStation === 0) ? '#8fa3b8' : '#00f2ff';
      }

      showStoreNotification(`🎵 RADIO TUNED: ${stName.toUpperCase()}`);
      cyberAudio.playClick();
    }

    // ============================================================
    // LOW-END TURBO & PERFORMANCE GUARDIAN ENGINE (60 FPS POTATO MODE)
    // ============================================================
    function toggleLowEndTurboMode() {
      const targetState = !gameState.settings.lowEndTurbo;
      setLowEndTurboMode(targetState);
    }

    function setLowEndTurboMode(enable) {
      gameState.settings.lowEndTurbo = enable;

      // 1. Dynamic Pixel Ratio & Real-Time Shadow Protection
      if (renderer) {
        renderer.setPixelRatio(enable ? 0.85 : Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.shadowMap.enabled = !enable;
      }
      if (sunLight) {
        sunLight.castShadow = !enable;
      }
      if (typeof kenneyBuildingsGroup !== 'undefined' && kenneyBuildingsGroup) {
        kenneyBuildingsGroup.traverse(c => {
          if (c.isMesh && enable) c.castShadow = false;
        });
      }

      // 2. Update HUD Badge
      const fpsBadge = document.getElementById('hud-fps-val');
      const fpsChip = document.getElementById('hud-fps-chip');
      const fpsIcon = document.getElementById('hud-fps-icon');

      if (enable) {
        if (fpsChip) {
          fpsChip.style.background = 'rgba(0, 255, 136, 0.28)';
          fpsChip.style.borderColor = '#00ff88';
        }
        if (fpsIcon) fpsIcon.style.color = '#ffd700';
        showStoreNotification('⚡ ULTRA LOW-END 60 FPS TURBO MODE ENGAGED! RESOLUTION & TRAFFIC SCALED!');
      } else {
        if (fpsChip) {
          fpsChip.style.background = 'rgba(0, 255, 136, 0.12)';
          fpsChip.style.borderColor = 'rgba(0, 255, 136, 0.4)';
        }
        if (fpsIcon) fpsIcon.style.color = '#00ff88';
        showStoreNotification('STANDARD GRAPHICS MODE RESTORED');
      }

      // 3. Update Settings UI Buttons
      const btnOn = document.getElementById('btn-lowend-enable');
      const btnOff = document.getElementById('btn-lowend-disable');
      if (btnOn && btnOff) {
        btnOn.classList.toggle('active', enable);
        btnOff.classList.toggle('active', !enable);
      }

      try {
        localStorage.setItem('ASTRO_LOW_END_TURBO', enable ? '1' : '0');
      } catch(e) {}
    }

    // ============================================================
    // CYBER POLICE BOUNTY PURSUIT & WANTED LEVEL ENGINE
    // ============================================================
    function triggerCrimeHeat(amount = 1) {
      gameState.wantedLevel = Math.min(5, gameState.wantedLevel + amount);
      gameState.wantedTimer = 35.0; // 35 seconds of police pursuit

      updateWantedHUD();
      cyberAudio.playPoliceSiren();

      // Dispatch Police Drones if heat is 2+
      if (gameState.wantedLevel >= 2 && policeDrones.length < gameState.wantedLevel) {
        spawnPolicePursuitDrone();
      }

      showStoreNotification(`⚠️ CRIME DETECTED! WANTED HEAT LEVEL: ${gameState.wantedLevel} STAR(S)!`);
    }

    function clearWantedLevel() {
      if (gameState.wantedLevel === 0) return;
      gameState.wantedLevel = 0;
      gameState.wantedTimer = 0;
      updateWantedHUD();

      // Dismiss drones
      policeDrones.forEach(d => { scene.remove(d.mesh); });
      policeDrones = [];

      showStoreNotification('🛡️ BOUNTY PURSUIT CLEARED! SAFEHOUSE ACCESSED!');
      cyberAudio.playLootChime();
    }

    function updateWantedHUD() {
      const heatChip = document.getElementById('hud-heat-chip');
      const starsEl = document.getElementById('hud-heat-stars');
      if (!heatChip || !starsEl) return;

      if (gameState.wantedLevel > 0) {
        heatChip.style.display = 'flex';
        let starStr = '';
        for (let i = 1; i <= 5; i++) {
          starStr += (i <= gameState.wantedLevel) ? '★' : '☆';
        }
        starsEl.textContent = starStr;
      } else {
        heatChip.style.display = 'none';
      }
    }

    function spawnPolicePursuitDrone() {
      if (!player.pos) return;
      const droneGroup = new THREE.Group();
      droneGroup.position.set(player.pos.x + (Math.random() * 40 - 20), player.pos.y + 12, player.pos.z + (Math.random() * 40 - 20));

      const dMatBlack = new THREE.MeshStandardMaterial({ color: 0x050a12, metalness: 0.9, roughness: 0.2 });
      const dMatRed = new THREE.MeshBasicMaterial({ color: 0xff0033 });
      const dMatBlue = new THREE.MeshBasicMaterial({ color: 0x0066ff });

      const dBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 1.8), dMatBlack);
      droneGroup.add(dBody);

      // Flashing Police Emergency Lights
      const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), dMatRed);
      lightR.position.set(-0.7, 0.3, 0);
      droneGroup.add(lightR);

      const lightB = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), dMatBlue);
      lightB.position.set(0.7, 0.3, 0);
      droneGroup.add(lightB);

      scene.add(droneGroup);

      policeDrones.push({
        mesh: droneGroup,
        lightR,
        lightB,
        speed: 18.0 + Math.random() * 6.0,
        hp: 80
      });
    }

function buildApexCarCustoms() {
      carCustomsGroup = new THREE.Group();
      carCustomsGroup.position.set(-85, 0, 45);
      scene.add(carCustomsGroup);

      const gMatDarkSteel = new THREE.MeshStandardMaterial({ color: 0x141a24, metalness: 0.88, roughness: 0.3 });
      const gMatChrome = new THREE.MeshStandardMaterial({ color: 0x8fa3b8, metalness: 0.95, roughness: 0.15 });
      const gMatGlass = new THREE.MeshStandardMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.35, roughness: 0.1 });
      const gMatCyanNeon = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const gMatAmberNeon = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      const gMatYellowCaution = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const gMatFloor = new THREE.MeshStandardMaterial({ color: 0x0d131a, roughness: 0.2, metalness: 0.65 });

      // 1. Polished Epoxy Concrete Garage Foundation & Driveway Apron
      const floor = new THREE.Mesh(new THREE.BoxGeometry(34, 0.6, 26), gMatFloor);
      floor.position.y = 0.3;
      floor.receiveShadow = true;
      carCustomsGroup.add(floor);

      // 2. High-Tech Garage Walls & Roof (Open Front Drive-In Portal facing East: +X)
      // Back wall (West: -X)
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 12, 26), gMatDarkSteel);
      backWall.position.set(-16.4, 6.0, 0);
      carCustomsGroup.add(backWall);

      // North side wall (+Z)
      const northWall = new THREE.Mesh(new THREE.BoxGeometry(34, 12, 1.2), gMatDarkSteel);
      northWall.position.set(0, 6.0, 12.4);
      carCustomsGroup.add(northWall);

      // South side wall (-Z)
      const southWall = new THREE.Mesh(new THREE.BoxGeometry(34, 12, 1.2), gMatDarkSteel);
      southWall.position.set(0, 6.0, -12.4);
      carCustomsGroup.add(southWall);

      // Roof Canopy
      const roof = new THREE.Mesh(new THREE.BoxGeometry(34.8, 1.2, 26.8), gMatDarkSteel);
      roof.position.y = 12.6;
      carCustomsGroup.add(roof);

      // Front Portal Fascia Posts (leaving wide 18m center opening for vehicles to drive in)
      [-10.5, 10.5].forEach(pz => {
        const pPost = new THREE.Mesh(new THREE.BoxGeometry(1.6, 12, 3.8), gMatDarkSteel);
        pPost.position.set(16.2, 6.0, pz);
        carCustomsGroup.add(pPost);
      });

      // Front Portal Header Beam with Chevron Striping
      const pHeader = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 26), gMatDarkSteel);
      pHeader.position.set(16.2, 10.6, 0);
      carCustomsGroup.add(pHeader);

      const cautionStrip = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.4, 18), gMatYellowCaution);
      cautionStrip.position.set(16.2, 9.0, 0);
      carCustomsGroup.add(cautionStrip);

      // 3. Roof Holographic Neon Marquee Sign
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 22), new THREE.MeshStandardMaterial({ color: 0x06090e, metalness: 0.9 }));
      signBoard.position.set(16.4, 14.2, 0);
      carCustomsGroup.add(signBoard);

      const signNeon = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.4, 20), gMatCyanNeon);
      signNeon.position.set(16.4, 14.2, 0);
      carCustomsGroup.add(signNeon);

      // Animated Rotating 3D Supercar Wireframe Hologram on Roof
      const holoCarGeo = new THREE.BoxGeometry(4.8, 1.2, 2.4);
      const holoCarMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true });
      const holoCar = new THREE.Mesh(holoCarGeo, holoCarMat);
      holoCar.position.set(0, 15.5, 0);
      carCustomsGroup.add(holoCar);
      citySpinners.push(holoCar);

      // 4. Rotating Hydraulic Vehicle Turntable in Garage Center
      carCustomsTurntable = new THREE.Group();
      carCustomsTurntable.position.set(0, 0.45, 0);
      carCustomsGroup.add(carCustomsTurntable);

      const tableDisc = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.3, 32), gMatDarkSteel);
      carCustomsTurntable.add(tableDisc);

      const tableNeonRing = new THREE.Mesh(new THREE.RingGeometry(4.8, 5.1, 32), gMatCyanNeon);
      tableNeonRing.rotation.x = -Math.PI / 2;
      tableNeonRing.position.y = 0.16;
      carCustomsTurntable.add(tableNeonRing);

      // Dual Red Hydraulic Vehicle Lift Pillars
      const rLiftMat = new THREE.MeshStandardMaterial({ color: 0xff0033, metalness: 0.8, roughness: 0.3 });
      [-2.8, 2.8].forEach(lx => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.5, 0.6), rLiftMat);
        pillar.position.set(lx, 2.75, 0);
        carCustomsTurntable.add(pillar);

        const liftArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 3.4), gMatChrome);
        liftArm.position.set(lx, 1.2, 0);
        carCustomsTurntable.add(liftArm);
      });

      // 5. Interior Garage Props: Nitrous Oxide Tanks, Racing Tires, Diagnostics
      // Nitrous Oxide Tanks (N2O Blue Cylinders)
      const nosMat = new THREE.MeshStandardMaterial({ color: 0x0066ff, metalness: 0.85, roughness: 0.25 });
      [-13, -11, -9].forEach(nz => {
        const nosBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.2, 16), nosMat);
        nosBottle.position.set(-14.2, 1.7, nz);
        carCustomsGroup.add(nosBottle);

        const nosValve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8), gMatChrome);
        nosValve.position.set(-14.2, 2.9, nz);
        carCustomsGroup.add(nosValve);
      });

      // Racing Tire Stacks
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x06080b, roughness: 0.95 });
      [6, 8.5, 11].forEach(tz => {
        for (let th = 0; th < 4; th++) {
          const tMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16), tireMat);
          tMesh.position.set(-14.2, 0.6 + th * 0.46, tz);
          carCustomsGroup.add(tMesh);
        }
      });

      // Wall Diagnostics Telemetry Screens
      [-4, 4].forEach(dz => {
        const diagScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.0), gMatCyanNeon);
        diagScreen.position.set(-15.6, 4.5, dz);
        diagScreen.rotation.y = Math.PI / 2;
        carCustomsGroup.add(diagScreen);
      });

      // Register spatial colliders for garage outer walls
      registerCityCollider({ x: -85 - 16.4, z: 45, hw: 0.6, hd: 13 });
      registerCityCollider({ x: -85, z: 45 + 12.4, hw: 17, hd: 0.6 });
      registerCityCollider({ x: -85, z: 45 - 12.4, hw: 17, hd: 0.6 });
    }

    // ============================================================
    // STARBASE LAUNCH PAD INFRASTRUCTURE, AIRLOCK & LAUNCH CONSOLE
    // ============================================================
    function buildStarbaseLaunchInfrastructure() {
      starbaseLaunchGroup = new THREE.Group();
      capeStarbaseGroup = starbaseLaunchGroup;
      scene.add(starbaseLaunchGroup);

      const padMat = new THREE.MeshStandardMaterial({ color: 0x181e26, roughness: 0.85, metalness: 0.3 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x2b3442, metalness: 0.9, roughness: 0.25 });
      const cautionMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      const redLaunchMat = new THREE.MeshStandardMaterial({ color: 0xff0022, emissive: 0xff0000, emissiveIntensity: 0.85, roughness: 0.2 });
      const greenAirlockMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x004466, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 });

      // ============================================================
      // CAPE STARBASE ISOLATED PENINSULA & CAUSEWAY BRIDGE
      // ============================================================
      // 1. Cape Starbase Peninsula Bedrock Berm (X: 550 to 740, Z: -640 to -460)
      const capeGround = new THREE.Mesh(new THREE.BoxGeometry(220, 1.2, 200), padMat);
      capeGround.position.set(650, 0.6, -550);
      capeGround.receiveShadow = true;
      starbaseLaunchGroup.add(capeGround);

      // 2. Concrete Hexagonal Launch Mount Table at (650, 0, -550)
      const mountTable = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 3.6, 6), padMat);
      mountTable.position.set(650, 1.8, -550);
      mountTable.receiveShadow = true;
      starbaseLaunchGroup.add(mountTable);

      const chevronRing = new THREE.Mesh(new THREE.RingGeometry(23.5, 25.5, 6), cautionMat);
      chevronRing.rotation.x = -Math.PI / 2;
      chevronRing.position.set(650, 3.65, -550);
      starbaseLaunchGroup.add(chevronRing);

      // 3. Deep Flame Trench / Exhaust Deflector directed South into Open Ocean
      const trench = new THREE.Mesh(new THREE.BoxGeometry(18, 3.0, 75), new THREE.MeshStandardMaterial({ color: 0x0a0e14, roughness: 0.95 }));
      trench.position.set(650, -0.4, -595);
      starbaseLaunchGroup.add(trench);

      // Water Deluge Spray Channel along Flame Trench
      const delugeChannel = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 70), waterMat);
      delugeChannel.position.set(650, 0.1, -595);
      starbaseLaunchGroup.add(delugeChannel);

      // 4. Ground Crew Ingress Airlock Building & Elevator Foyer at (634, 0, -550)
      const airlockBuilding = new THREE.Mesh(new THREE.BoxGeometry(11, 8.5, 9.5), steelMat);
      airlockBuilding.position.set(634, 4.25, -550);
      airlockBuilding.castShadow = true;
      starbaseLaunchGroup.add(airlockBuilding);

      // Massive Heavy Blast Doors (Facing West)
      physicalAirlockDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.2, 5.2), new THREE.MeshStandardMaterial({ color: 0x0f151e, metalness: 0.95, roughness: 0.2 }));
      physicalAirlockDoorMesh.position.set(628.3, 3.4, -550);
      starbaseLaunchGroup.add(physicalAirlockDoorMesh);

      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.8, 5.8), cautionMat);
      doorFrame.position.set(628.25, 3.4, -550);
      starbaseLaunchGroup.add(doorFrame);

      const airlockLight = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), greenAirlockMat);
      airlockLight.position.set(628.1, 7.0, -550);
      starbaseLaunchGroup.add(airlockLight);

      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 7.8), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
      signMesh.position.set(628.1, 8.2, -550);
      starbaseLaunchGroup.add(signMesh);

      const portalRing = new THREE.Mesh(new THREE.RingGeometry(1.6, 3.2, 32), cyanGlowMat);
      portalRing.rotation.x = -Math.PI / 2;
      portalRing.position.set(624.5, 0.15, -550);
      starbaseLaunchGroup.add(portalRing);
      citySpinners.push(portalRing);

      // High-Altitude Sky Laser Beacon (260m)
      const beaconGeo = new THREE.CylinderGeometry(0.5, 0.5, 260, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x00f2ff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      starbaseAirlockBeacon = new THREE.Mesh(beaconGeo, beaconMat);
      starbaseAirlockBeacon.position.set(634, 130, -550);
      starbaseLaunchGroup.add(starbaseAirlockBeacon);

      // Crew Access Arm (CAA) Walkway at Y: 71m
      const caaArm = new THREE.Mesh(new THREE.BoxGeometry(16, 3.2, 3.4), steelMat);
      caaArm.position.set(642, 71.0, -550);
      starbaseLaunchGroup.add(caaArm);

      const caaLight = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 0.3), greenAirlockMat);
      caaLight.position.set(642, 72.8, -548.2);
      starbaseLaunchGroup.add(caaLight);

      // 5. Cryogenic Propellant Tank Farm at (600, 0, -510)
      [[-8, -8], [8, -8]].forEach(([tx, tz]) => {
        const sphereTank = new THREE.Mesh(new THREE.SphereGeometry(6.5, 24, 24), steelMat);
        sphereTank.position.set(600 + tx, 7.5, -510 + tz);
        starbaseLaunchGroup.add(sphereTank);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.25, 8, 24), cautionMat);
        ring.position.set(600 + tx, 7.5, -510 + tz);
        starbaseLaunchGroup.add(ring);
      });

      // 2 Vertical Bullet Tanks
      [[-8, 8], [8, 8]].forEach(([tx, tz]) => {
        const bulletTank = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 18, 20), steelMat);
        bulletTank.position.set(600 + tx, 9.0, -510 + tz);
        starbaseLaunchGroup.add(bulletTank);
      });

      // Cryo Piping Manifold
      const cryoPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 55, 12), steelMat);
      cryoPipe.rotation.z = Math.PI / 2;
      cryoPipe.position.set(625, 2.5, -530);
      starbaseLaunchGroup.add(cryoPipe);

      // 6. Sound Suppression Water Deluge Tower at (610, 0, -570)
      const delugeTowerLegs = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 7.5, 34, 8), steelMat);
      delugeTowerLegs.position.set(610, 17, -570);
      starbaseLaunchGroup.add(delugeTowerLegs);

      const delugeWaterTank = new THREE.Mesh(new THREE.CylinderGeometry(8.0, 8.0, 12, 20), steelMat);
      delugeWaterTank.position.set(610, 39, -570);
      starbaseLaunchGroup.add(delugeWaterTank);

      const delugeMainPipe = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 45, 12), cautionMat);
      delugeMainPipe.rotation.z = Math.PI / 2;
      delugeMainPipe.position.set(630, 4.0, -560);
      starbaseLaunchGroup.add(delugeMainPipe);

      // 7. Reinforced Mission Control Bunker at Safe Standoff Distance (580, 0, -480)
      const bunkerMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 7.0, 15), padMat);
      bunkerMesh.position.set(580, 3.5, -480);
      bunkerMesh.castShadow = true;
      starbaseLaunchGroup.add(bunkerMesh);

      // Slanted Armored Viewing Windows overlooking the Launch Pad
      const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.8), new THREE.MeshPhysicalMaterial({
        color: 0x00f2ff,
        transparent: true,
        opacity: 0.65,
        roughness: 0.05,
        metalness: 0.9
      }));
      windowMesh.position.set(580, 4.2, -487.6);
      windowMesh.rotation.x = -Math.PI / 12;
      starbaseLaunchGroup.add(windowMesh);

      // Mission Control Console Desk inside Bunker
      const consoleDesk = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.2, 2.8), steelMat);
      consoleDesk.position.set(580, 1.1, -480);
      starbaseLaunchGroup.add(consoleDesk);

      [-1.8, 0, 1.8].forEach((sx, i) => {
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), (i === 1 ? cautionMat : cyanGlowMat));
        screen.position.set(580 + sx, 2.4, -480);
        screen.rotation.x = -Math.PI / 8;
        starbaseLaunchGroup.add(screen);
      });

      const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.25, 24), cautionMat);
      collarMesh.position.set(580, 2.3, -479.4);
      starbaseLaunchGroup.add(collarMesh);

      // GIANT GLOWING RED MUSHROOM LAUNCH BUTTON (At Cape Bunker)
      physicalLaunchButtonMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.3, 24), redLaunchMat);
      physicalLaunchButtonMesh.position.set(580, 2.48, -479.4);
      physicalLaunchButtonMesh.userData = { isLaunchButton: true };
      starbaseLaunchGroup.add(physicalLaunchButtonMesh);

      const holoSign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.2), cautionMat);
      holoSign.position.set(580, 3.6, -479.4);
      holoSign.rotation.x = -Math.PI / 12;
      starbaseLaunchGroup.add(holoSign);

      // 8. Cape Starbase Coastal Causeway Suspension Bridge (Airport Road -> Cape)
      // Connects from (340, 0, -220) to (580, 0, -480)
      const causewayDeck = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 340), padMat);
      causewayDeck.position.set(460, 4.5, -350);
      causewayDeck.rotation.y = Math.atan2(580 - 340, -480 - (-220));
      starbaseLaunchGroup.add(causewayDeck);

      // Bridge Pylons & Cable Towers
      [-50, 50].forEach(pOffset => {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(3.0, 42, 3.0), steelMat);
        pylon.position.set(460 + pOffset * 0.7, 21, -350 + pOffset * 0.7);
        starbaseLaunchGroup.add(pylon);

        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 70, 8), cyanGlowMat);
        cable.rotation.z = Math.PI / 4;
        cable.position.set(460 + pOffset * 0.7, 26, -350 + pOffset * 0.7);
        starbaseLaunchGroup.add(cable);
      });

      // Security Checkpoint Blast Gate at Bridge Entrance
      const gateSign = new THREE.Mesh(new THREE.BoxGeometry(14, 1.6, 0.4), cautionMat);
      gateSign.position.set(560, 7.2, -460);
      starbaseLaunchGroup.add(gateSign);

      // Register Colliders for Cape Starbase Structures
      registerCityCollider({ type: 'solid', x: 634, z: -550, hw: 6, hd: 5 });
      registerCityCollider({ type: 'solid', x: 580, z: -480, hw: 11, hd: 8 });
      registerCityCollider({ type: 'solid', x: 600, z: -510, hw: 14, hd: 14 });
      registerCityCollider({ type: 'solid', x: 610, z: -570, hw: 8, hd: 8 });
      registerCityCollider({ type: 'platform', x: 650, z: -550, hw: 26, hd: 26, topY: 3.65 });
      registerCityCollider({ type: 'platform', x: 460, z: -350, hw: 16, hd: 160, topY: 4.5 });
    }

    // ============================================================
    // CAR CUSTOMIZATION CONTROLLER & REAL-TIME STATE SYNC
    // ============================================================
    function openCarCustomsModal() {
      const modal = document.getElementById('modal-car-customs');
      if (modal) modal.style.display = 'block';
      cyberAudio.playLootChime();

      // If rover is nearby, place on turntable
      if (roverGroup && player.pos && player.pos.distanceTo(new THREE.Vector3(-85, 0, 45)) < 30) {
        teleportCarToGarage(false);
      }
      updateCarCustomsUI();
    }

    function closeCarCustomsModal() {
      const modal = document.getElementById('modal-car-customs');
      if (modal) modal.style.display = 'none';
      cyberAudio.playClick();
    }

    function updateCarCustomsUI() {
      const summaryEl = document.getElementById('customs-car-specs-summary');
      if (summaryEl && gameState.carCustoms) {
        summaryEl.textContent = `PAINT: ${gameState.carCustoms.paintName} · NITRO: ${gameState.carCustoms.nitroTier} (${gameState.carMaxNitro}) · ENGINE: ${gameState.carCustoms.engineTier}`;
      }
    }

    function setCarPaint(hexColor, name) {
      if (!gameState.carCustoms) gameState.carCustoms = {};
      gameState.carCustoms.paintColor = hexColor;
      gameState.carCustoms.paintName = name;
      applyCarCustoms();
      saveCarCustoms();
      showStoreNotification(`🏎️ CUSTOM CAR PAINT APPLIED: ${name.toUpperCase()}!`);
      cyberAudio.playClick();
    }

    function setCarUnderglow(val) {
      if (!gameState.carCustoms) gameState.carCustoms = {};
      gameState.carCustoms.underglow = val;
      applyCarCustoms();
      saveCarCustoms();
      showStoreNotification(`💡 UNDERGLOW NEON UPDATED: ${val.toUpperCase()}!`);
      cyberAudio.playClick();
    }

    function upgradeCarNitro(tierName, maxCap, rechargeRate, cost) {
      if (cost > 0) {
        if (gameState.tokens < cost) {
          showStoreNotification('⚠️ INSUFFICIENT NEX TOKENS FOR THIS NITRO UPGRADE!');
          cyberAudio.playClick();
          return;
        }
        gameState.tokens -= cost;
        document.getElementById('hud-tokens').textContent = gameState.tokens.toLocaleString();
      }

      gameState.carCustoms.nitroTier = tierName;
      gameState.carMaxNitro = maxCap;
      gameState.carNitro = maxCap;
      gameState.carNitroRechargeRate = rechargeRate;

      const tierLabel = document.getElementById('car-nitro-tier-label');
      if (tierLabel) tierLabel.textContent = tierName.toUpperCase();

      applyCarCustoms();
      saveCarCustoms();
      showStoreNotification(`⚡ NITRO UPGRADED: ${tierName.toUpperCase()} (CAPACITY: ${maxCap})!`);
      cyberAudio.playLootChime();
    }

    function upgradeCarEngine(tierName, topSpeed, cost) {
      if (cost > 0) {
        if (gameState.tokens < cost) {
          showStoreNotification('⚠️ INSUFFICIENT NEX TOKENS FOR THIS ENGINE TUNE!');
          cyberAudio.playClick();
          return;
        }
        gameState.tokens -= cost;
        document.getElementById('hud-tokens').textContent = gameState.tokens.toLocaleString();
      }

      gameState.carCustoms.engineTier = tierName;
      applyCarCustoms();
      saveCarCustoms();
      showStoreNotification(`⚙️ POWERTRAIN TUNED: ${tierName.toUpperCase()} (MAX: ${Math.round(topSpeed * 3.6)} KM/H)!`);
      cyberAudio.playLootChime();
    }

    function setCarSpoiler(style) {
      if (!gameState.carCustoms) gameState.carCustoms = {};
      gameState.carCustoms.spoiler = style;
      applyCarCustoms();
      saveCarCustoms();
      showStoreNotification(`🏁 AERO SPOILER UPDATED: ${style.toUpperCase()}!`);
      cyberAudio.playClick();
    }

    function setCarRims(colorHex) {
      if (!gameState.carCustoms) gameState.carCustoms = {};
      gameState.carCustoms.rimColor = colorHex;
      applyCarCustoms();
      saveCarCustoms();
      showStoreNotification('🛞 WHEEL ALLOY RIMS CUSTOMIZED!');
      cyberAudio.playClick();
    }

    function setCarCalipers(colorHex) {
      if (!gameState.carCustoms) gameState.carCustoms = {};
      gameState.carCustoms.caliperColor = colorHex;
      applyCarCustoms();
      saveCarCustoms();
      showStoreNotification('🛑 RACING BRAKE CALIPERS CUSTOMIZED!');
      cyberAudio.playClick();
    }

    function teleportCarToGarage(notify = true) {
      if (roverGroup) {
        roverGroup.position.set(-85, 0.45, 45);
        roverGroup.rotation.y = Math.PI / 2; // Face towards garage entrance
        roverCurrentSpeed = 0;
        roverSteerAngle = 0;
      }
      if (notify) {
        showStoreNotification('🏎️ CUSTOM ROVER SUMMONED ONTO GARAGE HYDRAULIC TURNTABLE!');
        cyberAudio.playLootChime();
      }
    }

    function driveOutOfGarage() {
      closeCarCustomsModal();
      if (roverGroup) {
        roverGroup.position.set(-72, 0, 45); // Drive right out onto West Boulevard
        roverGroup.rotation.y = Math.PI / 2;
        roverCurrentSpeed = 12.0;
        gameState.inVehicle = true;
      }
      showStoreNotification('🏎️ ENGINES ROARING! NITRO CHARGED AND READY TO ROLL!');
      cyberAudio.playNitroLoop();
      setTimeout(() => { cyberAudio.playNitroVent(); }, 400);
    }

    function applyCarCustoms() {
      const c = gameState.carCustoms;
      if (!c) return;

      // 1. Body Titanium Armor Paint
      if (roverTitaniumMat && c.paintColor) {
        roverTitaniumMat.color.set(c.paintColor);
      }

      // 2. Underglow Neon
      if (roverUnderglowLight && roverUnderglowMesh) {
        if (!c.underglow || c.underglow === 'off') {
          roverUnderglowLight.intensity = 0;
          roverUnderglowMesh.visible = false;
        } else if (c.underglow === 'rainbow') {
          roverUnderglowLight.intensity = 3.2;
          roverUnderglowMesh.visible = true;
          roverUnderglowLight.color.set('#00f2ff');
          roverUnderglowMesh.material.color.set('#00f2ff');
        } else {
          roverUnderglowLight.intensity = 3.2;
          roverUnderglowMesh.visible = true;
          roverUnderglowLight.color.set(c.underglow);
          roverUnderglowMesh.material.color.set(c.underglow);
        }
      }

      // 3. Spoiler Visibility & Style
      if (roverSpoilerMesh) {
        if (c.spoiler === 'none') {
          roverSpoilerMesh.visible = false;
        } else {
          roverSpoilerMesh.visible = true;
          if (c.spoiler === 'ducktail') {
            roverSpoilerMesh.scale.set(1.0, 0.45, 0.7);
          } else if (c.spoiler === 'twin_fin') {
            roverSpoilerMesh.scale.set(1.2, 1.2, 1.0);
          } else {
            roverSpoilerMesh.scale.set(1.0, 1.0, 1.0);
          }
        }
      }

      // 4. Caliper & Rims Colors
      if (roverBrakeCaliperMat && c.caliperColor) {
        roverBrakeCaliperMat.color.set(c.caliperColor);
      }
      if (roverWheelAlloyMat && c.rimColor) {
        roverWheelAlloyMat.color.set(c.rimColor);
      }

      updateCarCustomsUI();
    }

    function saveCarCustoms() {
      if (gameState.carCustoms) {
        try {
          localStorage.setItem('ASTRO_CAR_CUSTOMS', JSON.stringify(gameState.carCustoms));
          localStorage.setItem('ASTRO_CAR_MAX_NITRO', String(gameState.carMaxNitro));
          localStorage.setItem('ASTRO_CAR_NITRO_RECHARGE', String(gameState.carNitroRechargeRate));
        } catch(e) {}
      }
    }

    function loadSavedCarCustoms() {
      try {
        const saved = localStorage.getItem('ASTRO_CAR_CUSTOMS');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.assign(gameState.carCustoms, parsed);
        }
        const savedMaxN = localStorage.getItem('ASTRO_CAR_MAX_NITRO');
        if (savedMaxN) {
          gameState.carMaxNitro = parseFloat(savedMaxN);
          gameState.carNitro = gameState.carMaxNitro;
        }
        const savedRecharge = localStorage.getItem('ASTRO_CAR_NITRO_RECHARGE');
        if (savedRecharge) {
          gameState.carNitroRechargeRate = parseFloat(savedRecharge);
        }
      } catch(e) {}
    }

function buildNeoKyotoCity() {
      neoKyotoGroup = new THREE.Group();
      scene.add(neoKyotoGroup);

      const kMatTrim = new THREE.MeshStandardMaterial({ color: 0x140e1c, roughness: 0.35, metalness: 0.85 });
      const kMatVermilion = new THREE.MeshStandardMaterial({ color: 0xd92b2b, roughness: 0.3, metalness: 0.5 });
      const kMatGold = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.95 });
      const kMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const kMatPink = new THREE.MeshBasicMaterial({ color: 0xff007f });
      const kMatLantern = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      const kMatGlass = new THREE.MeshStandardMaterial({ color: 0x1a0f26, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });

      const cx = 480;
      const cz = 350;

      // City Foundation Plaza (160m x 160m dark granite podium)
      const plaza = new THREE.Mesh(new THREE.BoxGeometry(160, 0.4, 160), kMatTrim);
      plaza.position.set(cx, 0.2, cz);
      plaza.receiveShadow = true;
      neoKyotoGroup.add(plaza);

      // (A) 5-Tier Imperial Cyber Pagoda Tower (Height: 110m)
      const pagodaGroup = new THREE.Group();
      pagodaGroup.position.set(cx, 0, cz);

      const tierSizes = [
        { w: 26, h: 18, roofW: 32 },
        { w: 22, h: 16, roofW: 27 },
        { w: 18, h: 14, roofW: 22 },
        { w: 14, h: 12, roofW: 17 },
        { w: 10, h: 10, roofW: 13 }
      ];

      let curY = 0;
      tierSizes.forEach((tier, idx) => {
        // Chamber Body
        const chamber = new THREE.Mesh(new THREE.BoxGeometry(tier.w, tier.h, tier.w), kMatVermilion);
        chamber.position.y = curY + tier.h / 2;
        pagodaGroup.add(chamber);

        // Holographic Windows
        [-tier.w / 2 - 0.1, tier.w / 2 + 0.1].forEach(wx => {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(tier.w * 0.7, tier.h * 0.6), idx % 2 === 0 ? kMatCyan : kMatPink);
          win.position.set(wx, curY + tier.h / 2, 0);
          win.rotation.y = Math.PI / 2;
          pagodaGroup.add(win);
        });

        // Curved Eave Roof
        const roof = new THREE.Mesh(new THREE.ConeGeometry(tier.roofW * 0.72, 3.2, 4), kMatTrim);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = curY + tier.h + 1.2;
        pagodaGroup.add(roof);

        // Neon Eave Outline
        const eaveRing = new THREE.Mesh(new THREE.RingGeometry(tier.roofW * 0.45, tier.roofW * 0.52, 4), kMatCyan);
        eaveRing.rotation.x = -Math.PI / 2;
        eaveRing.rotation.z = Math.PI / 4;
        eaveRing.position.y = curY + tier.h + 0.2;
        pagodaGroup.add(eaveRing);

        curY += tier.h + 1.8;
      });

      // Spire Pinnacle Finial (Y: 95m to 110m)
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.2, 18, 8), kMatGold);
      spire.position.y = curY + 9;
      pagodaGroup.add(spire);

      const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), kMatPink);
      beacon.position.y = curY + 18;
      pagodaGroup.add(beacon);

      neoKyotoGroup.add(pagodaGroup);

      // (B) Grand Cyber Torii Gate (Avenue Entry at X: 480, Z: 280)
      const toriiGroup = new THREE.Group();
      toriiGroup.position.set(cx, 0, cz - 70);

      // Twin Main Pillars (22m tall)
      [-10, 10].forEach(px => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 24, 16), kMatVermilion);
        pillar.position.set(px, 12, 0);
        toriiGroup.add(pillar);

        const base = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 1.8, 16), kMatTrim);
        base.position.set(px, 0.9, 0);
        toriiGroup.add(base);
      });

      // Upper Crossbeam (Kasagi & Shimaki)
      const kasagi = new THREE.Mesh(new THREE.BoxGeometry(28, 1.8, 2.6), kMatTrim);
      kasagi.position.set(0, 24.2, 0);
      toriiGroup.add(kasagi);

      const kasagiGlow = new THREE.Mesh(new THREE.BoxGeometry(27.4, 0.2, 2.8), kMatPink);
      kasagiGlow.position.set(0, 24.2, 0);
      toriiGroup.add(kasagiGlow);

      const nuki = new THREE.Mesh(new THREE.BoxGeometry(23, 1.2, 1.6), kMatVermilion);
      nuki.position.set(0, 20.5, 0);
      toriiGroup.add(nuki);

      // Holographic Central Plaque (Gaku)
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 5.0), kMatCyan);
      plaque.position.set(0, 22.3, 1.4);
      toriiGroup.add(plaque);

      neoKyotoGroup.add(toriiGroup);

      // (C) Sakura Blossom Cyber Gardens (Cherry Blossom Park)
      const sakuraPositions = [
        [-38, -35], [-24, -45], [-45, -20], [-35, -55],
        [38, -35], [24, -45], [45, -20], [35, -55],
        [-40, 30], [-25, 45], [40, 30], [25, 45]
      ];

      sakuraPositions.forEach(([sx, sz], i) => {
        const tree = new THREE.Group();
        tree.position.set(cx + sx, 0, cz + sz);

        // Trunk
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 5.5, 8), kMatTrim);
        trunk.position.y = 2.75;
        tree.add(trunk);

        // Luminous Pink Foliage Cloud
        const foliageMat = new THREE.MeshBasicMaterial({ color: 0xff3399, transparent: true, opacity: 0.85 });
        const crown1 = new THREE.Mesh(new THREE.SphereGeometry(3.2, 8, 8), foliageMat);
        crown1.position.set(0, 6.2, 0);
        tree.add(crown1);

        const crown2 = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), foliageMat);
        crown2.position.set(1.4, 7.2, 0.8);
        tree.add(crown2);

        // Stone Garden Lantern
        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.4, 6), kMatTrim);
        lantern.position.set(2.2, 0.7, 1.5);
        tree.add(lantern);

        const lGlow = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), kMatLantern);
        lGlow.position.set(2.2, 1.5, 1.5);
        tree.add(lGlow);

        neoKyotoGroup.add(tree);
      });

      // (D) Neo-Kyoto Street Food Market Stalls (Ramen, Sushi, Boba)
      const marketStalls = [
        { name: 'RAMEN ラーメン', x: cx - 18, z: cz + 25, color: 0xff0055 },
        { name: 'SUSHI BAR 寿司', x: cx - 18, z: cz + 40, color: 0x00f2ff },
        { name: 'CYBER TEA お茶', x: cx + 18, z: cz + 25, color: 0x00ff88 },
        { name: 'BOBA LOUNGE', x: cx + 18, z: cz + 40, color: 0xffaa00 }
      ];

      marketStalls.forEach(stall => {
        const sGroup = new THREE.Group();
        sGroup.position.set(stall.x, 0, stall.z);

        // Counter
        const counter = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.1, 3.5), kMatTrim);
        counter.position.y = 0.55;
        sGroup.add(counter);

        // Awning Roof
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.3, 4.2), kMatVermilion);
        canopy.position.set(0, 3.2, 0);
        sGroup.add(canopy);

        // Glowing Signboard
        const signMat = new THREE.MeshBasicMaterial({ color: stall.color });
        const sign = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.8, 0.2), signMat);
        sign.position.set(0, 2.8, 2.0);
        sGroup.add(sign);

        // Stools
        [-2.0, 0, 2.0].forEach(bx => {
          const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.75, 8), kMatTrim);
          stool.position.set(bx, 0.38, 2.2);
          sGroup.add(stool);
        });

        neoKyotoGroup.add(sGroup);
      });

      // (E) Rooftop Club Nebula & DJ Lounge Terrace (Penthouse at X: 470, Y: 42, Z: 340)
      const clubTower = new THREE.Mesh(new THREE.BoxGeometry(28, 42, 28), kMatGlass);
      clubTower.position.set(cx - 50, 21, cz + 20);
      neoKyotoGroup.add(clubTower);

      // Dance Floor Roof
      const danceFloor = new THREE.Mesh(new THREE.BoxGeometry(26, 0.4, 26), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
      danceFloor.position.set(cx - 50, 42.2, cz + 20);
      danceFloor.name = 'clubNebulaDanceFloor';
      neoKyotoGroup.add(danceFloor);

      // DJ Console Table
      const djTable = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 2.2), kMatTrim);
      djTable.position.set(cx - 50, 43.0, cz + 30);
      neoKyotoGroup.add(djTable);

      const djHolo = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.2), kMatCyan);
      djHolo.position.set(cx - 50, 44.0, cz + 29.8);
      neoKyotoGroup.add(djHolo);

      // (F) Neo-Kyoto Hyperloop Station Terminal (X: 430, Z: 300)
      buildHyperloopStationMesh(neoKyotoGroup, cx - 50, cz - 50, 'NEO-KYOTO EAST TRANSIT', 0xff007f);
    }

    // ------------------------------------------------------------
    // 2. SOLARIA DESERT OASIS & SOLAR MEGA-CITY (SOUTH at X: -420, Z: 480)
    // ------------------------------------------------------------
    function buildSolariaCity() {
      solariaGroup = new THREE.Group();
      scene.add(solariaGroup);

      const sMatSand = new THREE.MeshStandardMaterial({ color: 0x8a6332, roughness: 0.9, metalness: 0.1 });
      const sMatMetal = new THREE.MeshStandardMaterial({ color: 0x4a453e, roughness: 0.4, metalness: 0.8 });
      const sMatSolar = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.15, metalness: 0.92 });
      const sMatGlow = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      const sMatAmber = new THREE.MeshBasicMaterial({ color: 0xff7700 });
      const sMatGlass = new THREE.MeshStandardMaterial({ color: 0x55aa99, transparent: true, opacity: 0.6, roughness: 0.1 });

      const cx = -420;
      const cz = 480;

      // Desert Dune Base Plaza
      const desertPlaza = new THREE.Mesh(new THREE.BoxGeometry(180, 0.4, 180), sMatSand);
      desertPlaza.position.set(cx, 0.2, cz);
      desertPlaza.receiveShadow = true;
      solariaGroup.add(desertPlaza);

      // (A) 95m Concentrating Solar Molten-Salt Thermal Tower
      const towerGroup = new THREE.Group();
      towerGroup.position.set(cx, 0, cz);

      // Tower Column
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 6.5, 95, 16), sMatMetal);
      tower.position.y = 47.5;
      towerGroup.add(tower);

      // Molten Salt Solar Receiver Core (Glows intense sun-gold)
      const receiver = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 10, 16), sMatGlow);
      receiver.position.y = 90;
      towerGroup.add(receiver);

      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.8, 14, 8), sMatMetal);
      spire.position.y = 100;
      towerGroup.add(spire);

      solariaGroup.add(towerGroup);

      // (B) Heliostat Solar Mirror Field (20 Parabolic Dual-Axis Mirrors)
      for (let ring = 1; ring <= 2; ring++) {
        const radius = 35 + ring * 22;
        const count = 10;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const mx = cx + Math.cos(angle) * radius;
          const mz = cz + Math.sin(angle) * radius;

          const hGroup = new THREE.Group();
          hGroup.position.set(mx, 0, mz);

          // Pylon
          const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.5, 8), sMatMetal);
          pylon.position.y = 1.75;
          hGroup.add(pylon);

          // Tilted Mirror Panel (Facing central tower)
          const mirror = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 0.2), sMatSolar);
          mirror.position.y = 3.6;
          mirror.lookAt(cx, 85, cz);
          hGroup.add(mirror);

          solariaGroup.add(hGroup);
        }
      }

      // (C) The Rusty Rotor Cantina (Desert Saloon with 10m Ceiling Fan)
      const cantinaGroup = new THREE.Group();
      cantinaGroup.position.set(cx + 60, 0, cz - 30);

      const saloon = new THREE.Mesh(new THREE.BoxGeometry(22, 6.5, 18), sMatMetal);
      saloon.position.y = 3.25;
      cantinaGroup.add(saloon);

      // Shaded Front Veranda
      const porch = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 6), sMatSand);
      porch.position.set(0, 0.2, 12);
      cantinaGroup.add(porch);

      // Glowing Cantina Neon Sign
      const cSign = new THREE.Mesh(new THREE.BoxGeometry(14, 1.6, 0.2), sMatAmber);
      cSign.position.set(0, 6.0, 9.1);
      cantinaGroup.add(cSign);

      // 10m Overhead Rotating Ceiling Fan
      const fanGroup = new THREE.Group();
      fanGroup.position.set(0, 6.8, 12);
      fanGroup.name = 'cantinaFanGroup';

      const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12), sMatMetal);
      fanGroup.add(fanHub);

      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 4.2), sMatMetal);
        blade.rotation.y = (b * Math.PI) / 2;
        blade.position.set(Math.sin(b * Math.PI / 2) * 2.2, 0, Math.cos(b * Math.PI / 2) * 2.2);
        fanGroup.add(blade);
      }
      cantinaGroup.add(fanGroup);

      solariaGroup.add(cantinaGroup);

      // (D) Pressurized Geodesic Bio-Dome
      const dome = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), sMatGlass);
      dome.position.set(cx - 55, 0, cz + 40);
      solariaGroup.add(dome);

      // (E) Target Shooting Carnival Range (X: -360, Z: 490)
      buildTargetShootingRange(solariaGroup, cx + 60, cz + 40);

      // (F) Solaria Hyperloop Station Terminal (X: -380, Z: 440)
      buildHyperloopStationMesh(solariaGroup, cx + 40, cz - 50, 'SOLARIA OASIS TRANSIT', 0xffaa00);
    }

    // ------------------------------------------------------------
    // 3. ATLANTIS MARINA & OCEAN TRENCH PORT (WEST at X: -520, Z: -420)
    // ------------------------------------------------------------
    function buildAtlantisCity() {
      atlantisGroup = new THREE.Group();
      scene.add(atlantisGroup);

      const aMatWater = new THREE.MeshStandardMaterial({
        color: 0x004466,
        roughness: 0.1,
        metalness: 0.85,
        transparent: true,
        opacity: 0.88
      });
      const aMatWood = new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.7, metalness: 0.2 });
      const aMatPier = new THREE.MeshStandardMaterial({ color: 0x141f28, roughness: 0.4, metalness: 0.8 });
      const aMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const aMatMarine = new THREE.MeshBasicMaterial({ color: 0x00d9ff });
      const aMatGlass = new THREE.MeshStandardMaterial({ color: 0x00bbdd, transparent: true, opacity: 0.5, roughness: 0.1 });

      const cx = -520;
      const cz = -420;

      // (A) Expansive Shimmering Ocean Water Basin (220m x 220m)
      const ocean = new THREE.Mesh(new THREE.BoxGeometry(220, 0.3, 220), aMatWater);
      ocean.position.set(cx, -0.15, cz);
      ocean.name = 'atlantisOceanMesh';
      atlantisGroup.add(ocean);

      // (B) 80m Bioluminescent Navigation Lighthouse Spire
      const lhGroup = new THREE.Group();
      lhGroup.position.set(cx + 60, 0, cz - 60);

      const lhTower = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 5.5, 78, 16), aMatPier);
      lhTower.position.y = 39;
      lhGroup.add(lhTower);

      // Lantern Room
      const lhRoom = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 6, 12), aMatGlass);
      lhRoom.position.y = 80;
      lhGroup.add(lhRoom);

      // 360-Degree Rotating Marine Searchlight Beam
      const beamGroup = new THREE.Group();
      beamGroup.position.y = 80;
      beamGroup.name = 'lighthouseBeamGroup';

      const searchlight = new THREE.Mesh(new THREE.ConeGeometry(8, 120, 8), new THREE.MeshBasicMaterial({
        color: 0x00f2ff,
        transparent: true,
        opacity: 0.32
      }));
      searchlight.rotation.x = Math.PI / 2;
      searchlight.position.set(0, 0, 60);
      beamGroup.add(searchlight);

      lhGroup.add(beamGroup);
      atlantisGroup.add(lhGroup);

      // (C) Boardwalk Promenade Pier (140m Long Pier extending into basin)
      const pier = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 130), aMatWood);
      pier.position.set(cx, 0.4, cz);
      pier.receiveShadow = true;
      atlantisGroup.add(pier);

      // Moored Luxury Cyber Hover-Yachts
      [-14, 14].forEach((yx, idx) => {
        const yacht = new THREE.Group();
        yacht.position.set(cx + yx, 0.4, cz + (idx === 0 ? -25 : 25));

        const hull = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.2, 18), aMatPier);
        hull.position.y = 1.1;
        yacht.add(hull);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.8, 10), aMatGlass);
        cabin.position.set(0, 2.8, -1.0);
        yacht.add(cabin);

        const neonTrim = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.1, 18.2), aMatMarine);
        neonTrim.position.y = 1.8;
        yacht.add(neonTrim);

        atlantisGroup.add(yacht);
      });

      // (D) Semi-Submerged Underwater Biosphere Marine Dome
      const subDome = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), aMatGlass);
      subDome.position.set(cx - 50, 0, cz + 40);
      atlantisGroup.add(subDome);

      // Floating Holographic Manta Ray inside dome
      const manta = new THREE.Group();
      manta.position.set(cx - 50, 4.5, cz + 40);
      manta.name = 'atlantisHoloManta';

      const mBody = new THREE.Mesh(new THREE.ConeGeometry(2.5, 6, 4), aMatCyan);
      mBody.rotation.x = Math.PI / 2;
      manta.add(mBody);

      atlantisGroup.add(manta);

      // (E) Atlantis Hyperloop Station Terminal (X: -470, Z: -370)
      buildHyperloopStationMesh(atlantisGroup, cx + 50, cz + 50, 'ATLANTIS MARINA TRANSIT', 0x00d9ff);
    }

    // Helper: Build Hyperloop Station Mesh
    function buildHyperloopStationMesh(parent, hx, hz, stationTitle, themeColor) {
      const hGroup = new THREE.Group();
      hGroup.position.set(hx, 0, hz);

      const sMatMetal = new THREE.MeshStandardMaterial({ color: 0x0f1622, roughness: 0.35, metalness: 0.9 });
      const sMatGlow = new THREE.MeshBasicMaterial({ color: themeColor });

      // Station Platform
      const platform = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 12), sMatMetal);
      platform.position.y = 0.3;
      hGroup.add(platform);

      // Hyperloop Vacuum Tube Section
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 28, 16), sMatMetal);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0, 2.8, -4.5);
      hGroup.add(tube);

      const tubeRing = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.15, 8, 24), sMatGlow);
      tubeRing.position.set(0, 2.8, -4.5);
      hGroup.add(tubeRing);

      // Station Gate Canopy
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 8), sMatMetal);
      canopy.position.set(0, 4.8, 1.0);
      hGroup.add(canopy);

      // Interactive Station Signboard
      const sign = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 0.3), sMatGlow);
      sign.position.set(0, 4.2, 4.8);
      hGroup.add(sign);

      parent.add(hGroup);
    }

    // ------------------------------------------------------------
    // 4. FUN RECREATIONAL ACTIVITIES ENGINE
    // ------------------------------------------------------------
    function buildRecreationalActivities() {
      recreationGroup = new THREE.Group();
      scene.add(recreationGroup);

      // (A) CENTRAL STADIUM KINETIC NEO-SOCCER BALL & HOLOGRAPHIC GOALS
      const ballMat = new THREE.MeshStandardMaterial({
        color: 0x00f2ff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.6,
        roughness: 0.15,
        metalness: 0.8
      });
      neoSoccerBall = new THREE.Mesh(new THREE.SphereGeometry(1.35, 16, 16), ballMat);
      neoSoccerBall.position.set(0, 1.35, 0);
      neoSoccerBall.castShadow = true;
      neoSoccerBall.userData = {
        vel: new THREE.Vector3(0, 0, 0),
        radius: 1.35,
        respawnTimer: 0
      };
      recreationGroup.add(neoSoccerBall);

      // 2 Holographic Goal Nets (Cyan North at Z: -52, Orange South at Z: 52)
      const goalCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true });
      const goalOrangeMat = new THREE.MeshBasicMaterial({ color: 0xff6600, wireframe: true });

      const goalNorth = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 4), goalCyanMat);
      goalNorth.position.set(0, 3, -52);
      goalNorth.userData = { team: 'cyan', z: -52 };
      recreationGroup.add(goalNorth);
      neoSoccerGoals.push(goalNorth);

      const goalSouth = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 4), goalOrangeMat);
      goalSouth.position.set(0, 3, 52);
      goalSouth.userData = { team: 'orange', z: 52 };
      recreationGroup.add(goalSouth);
      neoSoccerGoals.push(goalSouth);

      // (B) SPEEDWAY TIME-TRIAL RACING GATES (10 Checkpoints along expressways)
      speedwayGates = [
        new THREE.Vector3(0, 3.5, -120),
        new THREE.Vector3(0, 3.5, -350),
        new THREE.Vector3(150, 3.5, -450),
        new THREE.Vector3(350, 3.5, -200),
        new THREE.Vector3(450, 3.5, 100),
        new THREE.Vector3(250, 3.5, 350),
        new THREE.Vector3(0, 3.5, 450),
        new THREE.Vector3(-250, 3.5, 300),
        new THREE.Vector3(-350, 3.5, -100),
        new THREE.Vector3(-50, 3.5, -50)
      ];

      const gateGeo = new THREE.TorusGeometry(4.5, 0.25, 8, 24);
      const gateMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.65 });

      speedwayGates.forEach((gPos, idx) => {
        const ring = new THREE.Mesh(gateGeo, gateMat.clone());
        ring.position.copy(gPos);
        ring.name = `speedwayGate_${idx}`;
        ring.visible = false;
        recreationGroup.add(ring);
      });

      // (C) AEROGLIDER AERIAL SCORE RINGS (Skyline High-Altitude Gliding)
      aerialScoreRings = [
        new THREE.Vector3(0, 65, 80),
        new THREE.Vector3(60, 85, -60),
        new THREE.Vector3(-60, 95, -60),
        new THREE.Vector3(120, 110, -100),
        new THREE.Vector3(250, 90, 150),
        new THREE.Vector3(380, 120, 280),
        new THREE.Vector3(-250, 80, 250),
        new THREE.Vector3(-380, 100, -200)
      ];

      const aRingGeo = new THREE.TorusGeometry(6.0, 0.35, 8, 24);
      const aRingMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 });

      aerialScoreRings.forEach((pos, i) => {
        const aRing = new THREE.Mesh(aRingGeo, aRingMat.clone());
        aRing.position.copy(pos);
        aRing.rotation.x = Math.PI / 2;
        recreationGroup.add(aRing);
      });
    }

    // Helper: Target Shooting Carnival Range
    function buildTargetShootingRange(parent, rx, rz) {
      const rangeGroup = new THREE.Group();
      rangeGroup.position.set(rx, 0, rz);

      const rMatWood = new THREE.MeshStandardMaterial({ color: 0x221810, roughness: 0.8 });
      const rMatTarget = new THREE.MeshBasicMaterial({ color: 0xff0055 });

      // Booth Stall
      const booth = new THREE.Mesh(new THREE.BoxGeometry(16, 4.2, 5), rMatWood);
      booth.position.y = 2.1;
      rangeGroup.add(booth);

      // Signboard
      const sign = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 0.2), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      sign.position.set(0, 4.8, 2.5);
      rangeGroup.add(sign);

      // 6 Popup Target Dummies
      shootingTargets = [];
      [-6, -3.6, -1.2, 1.2, 3.6, 6].forEach((tx, idx) => {
        const tMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16), rMatTarget);
        tMesh.rotation.x = Math.PI / 2;
        tMesh.position.set(tx, 2.8, -12 - (idx % 2) * 5);
        tMesh.userData = { isUp: true, hitTime: 0, originY: 2.8 };
        rangeGroup.add(tMesh);
        shootingTargets.push(tMesh);
      });

      parent.add(rangeGroup);
    }

    // ------------------------------------------------------------
    // 5. UPDATE RECREATIONAL ACTIVITIES IN GAMELOOP
    // ------------------------------------------------------------
    function updateRecreationalActivities(delta, now) {
      if (gameState.currentWorld !== 'earth') return;

      // (A) KINETIC NEO-SOCCER BALL SIMULATION
      if (neoSoccerBall && player && player.pos) {
        const ball = neoSoccerBall;
        const bVel = ball.userData.vel;

        // Player Kick Physics (Impart momentum)
        const distToPlayer = ball.position.distanceTo(player.pos);
        if (distToPlayer < 2.5) {
          const kickDir = new THREE.Vector3().subVectors(ball.position, player.pos).normalize();
          kickDir.y = 0.2; // slight loft
          const playerSpeed = player.vel ? player.vel.length() : 4.0;
          const kickForce = 8.0 + playerSpeed * 2.2;
          bVel.addScaledVector(kickDir, kickForce);
          cyberAudio.playTargetHit();
        }

        // Apply velocity & friction
        ball.position.addScaledVector(bVel, delta);
        bVel.multiplyScalar(0.982); // turf rolling resistance

        // Keep on stadium ground
        ball.position.y = 1.35;

        // Stadium Boundary Wall Bounces (-56m to +56m)
        if (Math.abs(ball.position.x) > 52) {
          bVel.x *= -0.75;
          ball.position.x = Math.sign(ball.position.x) * 52;
        }

        // Check Goals
        if (!stadiumGoalCooldown) {
          neoSoccerGoals.forEach(g => {
            if (ball.position.distanceTo(g.position) < 5.0) {
              stadiumGoalCooldown = true;
              const scoringTeam = g.userData.team === 'cyan' ? 'orange' : 'cyan';
              stadiumScores[scoringTeam]++;

              cyberAudio.playGoalCheer();
              const banner = document.getElementById('stadium-goal-banner');
              const gText = document.getElementById('stadium-goal-text');
              const sText = document.getElementById('stadium-score-text');

              if (banner && gText && sText) {
                banner.style.display = 'block';
                gText.textContent = `⚽ GOAL! TEAM ${scoringTeam.toUpperCase()} SCORES!`;
                sText.textContent = `CYAN: ${stadiumScores.cyan} • ORANGE: ${stadiumScores.orange}`;
                setTimeout(() => { banner.style.display = 'none'; }, 4000);
              }

              // Reset ball to center circle after 2.5s
              setTimeout(() => {
                ball.position.set(0, 1.35, 0);
                bVel.set(0, 0, 0);
                stadiumGoalCooldown = false;
              }, 2500);
            }
          });
        }
      }

      // (B) LIGHTHOUSE BEAM & CANTINA FAN ROTATION
      const beam = scene.getObjectByName('lighthouseBeamGroup');
      if (beam) beam.rotation.y = now * 0.0018;

      const fan = scene.getObjectByName('cantinaFanGroup');
      if (fan) fan.rotation.y = now * 0.005;

      const danceFloor = scene.getObjectByName('clubNebulaDanceFloor');
      if (danceFloor) {
        const hue = (now * 0.0004) % 1;
        danceFloor.material.color.setHSL(hue, 0.9, 0.5);
      }

      // (C) SPEEDWAY TIME-TRIAL RACING TIMER & GATE DETECTION
      if (speedwayRaceActive && player && player.pos) {
        const elapsed = (now - speedwayStartTime) / 1000;
        const mins = Math.floor(elapsed / 60);
        const secs = (elapsed % 60).toFixed(2);
        const timerEl = document.getElementById('race-timer-display');
        if (timerEl) timerEl.textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // Check proximity to current target gate
        const targetGatePos = speedwayGates[speedwayCurrentGate];
        if (targetGatePos && player.pos.distanceTo(targetGatePos) < 12.0) {
          cyberAudio.playCheckpointChime();
          // Hide old ring, show next ring
          const oldRing = scene.getObjectByName(`speedwayGate_${speedwayCurrentGate}`);
          if (oldRing) oldRing.visible = false;

          speedwayCurrentGate++;
          const gateEl = document.getElementById('race-gate-display');
          if (gateEl) gateEl.textContent = `${speedwayCurrentGate} / ${speedwayGates.length}`;

          if (speedwayCurrentGate >= speedwayGates.length) {
            // FINISH RACE!
            finishSpeedwayRace(elapsed);
          } else {
            const nextRing = scene.getObjectByName(`speedwayGate_${speedwayCurrentGate}`);
            if (nextRing) nextRing.visible = true;
          }
        }
      }

      // (D) AEROGLIDER WINGSUIT FLIGHT
      if (isGliding && player && player.pos) {
        // Reduced descent gravity
        player.vel.y = Math.max(-1.8, player.vel.y);
        // Forward glide momentum based on camera facing
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        player.pos.addScaledVector(forward, 28.0 * delta);

        // Check Aerial Ring Collisions
        aerialScoreRings.forEach(ringPos => {
          if (player.pos.distanceTo(ringPos) < 7.0) {
            cyberAudio.playCheckpointChime();
            gliderScore += 100;
            player.vel.y = 8.0; // Altitude surge boost!
            const ringsVal = document.getElementById('glider-rings-val');
            if (ringsVal) ringsVal.textContent = gliderScore;
            showStoreNotification('⚡ AERIAL GLIDE RING ACCELERATION BOOST +100!');
          }
        });

        // Auto-land upon touching surface
        if (player.pos.y <= 1.35) {
          toggleAeroGlider();
          showStoreNotification('AEROGLIDER WINGS SAFELY STOWED ON TOUCHDOWN.');
        }
      }
    }

    // ------------------------------------------------------------
    // 6. INTERACTIVE RECREATION HANDLERS & MODAL CONTROLLERS
    // ------------------------------------------------------------
    function toggleAeroGlider() {
      isGliding = !isGliding;
      const hud = document.getElementById('aeroglider-flight-hud');
      if (isGliding) {
        if (hud) hud.style.display = 'flex';
        cyberAudio.playClick();
        showStoreNotification('🪂 AEROGLIDER DEPLOYED! PITCH & GLIDE ACROSS METROPOLIS!');
      } else {
        if (hud) hud.style.display = 'none';
        cyberAudio.playClick();
      }
    }

    // Speedway Race Controls
    function startSpeedwayRace() {
      speedwayRaceActive = true;
      speedwayStartTime = performance.now();
      speedwayCurrentGate = 0;

      const hud = document.getElementById('speedway-race-hud');
      if (hud) hud.style.display = 'flex';

      const gateEl = document.getElementById('race-gate-display');
      if (gateEl) gateEl.textContent = `0 / ${speedwayGates.length}`;

      // Show first gate
      speedwayGates.forEach((_, i) => {
        const ring = scene.getObjectByName(`speedwayGate_${i}`);
        if (ring) ring.visible = (i === 0);
      });

      cyberAudio.playCheckpointChime();
      showStoreNotification('🏁 METRO SPEEDWAY GP BEGUN! FLY THROUGH ALL 10 CHECKPOINTS!');
    }

    function abortSpeedwayRace() {
      speedwayRaceActive = false;
      const hud = document.getElementById('speedway-race-hud');
      if (hud) hud.style.display = 'none';

      speedwayGates.forEach((_, i) => {
        const ring = scene.getObjectByName(`speedwayGate_${i}`);
        if (ring) ring.visible = false;
      });
      showStoreNotification('SPEEDWAY TIME-TRIAL ABORTED.');
    }

    function finishSpeedwayRace(totalSeconds) {
      speedwayRaceActive = false;
      const hud = document.getElementById('speedway-race-hud');
      if (hud) hud.style.display = 'none';

      speedwayGates.forEach((_, i) => {
        const ring = scene.getObjectByName(`speedwayGate_${i}`);
        if (ring) ring.visible = false;
      });

      gameState.tokens += 250;
      document.getElementById('hud-tokens').textContent = gameState.tokens.toLocaleString();
      cyberAudio.playFanfare();
      showStoreNotification(`🏆 METRO SPEEDWAY VICTORY! TIME: ${totalSeconds.toFixed(2)}s • REWARD: +250 TOKENS!`);
    }

    // Hyperloop Modal Controls
    function openHyperloopModal() {
      const modal = document.getElementById('modal-hyperloop-transit');
      if (modal) modal.style.display = 'block';
      cyberAudio.playClick();
    }
    function closeHyperloopModal() {
      const modal = document.getElementById('modal-hyperloop-transit');
      if (modal) modal.style.display = 'none';
    }

    // DJ Mixer Controls
    function openDJMixerModal() {
      const modal = document.getElementById('modal-dj-mixer');
      if (modal) modal.style.display = 'block';
      cyberAudio.playClick();
    }
    function closeDJMixerModal() {
      const modal = document.getElementById('modal-dj-mixer');
      if (modal) modal.style.display = 'none';
      if (djInterval) { clearInterval(djInterval); djInterval = null; }
    }
    function updateDJBpm(val) {
      djBpm = parseInt(val);
      const lbl = document.getElementById('dj-bpm-label');
      if (lbl) lbl.textContent = `${djBpm} BPM`;
      if (djMixerActive) {
        clearInterval(djInterval);
        startDJLoop();
      }
    }
    function toggleDJTrack(trk) {
      djTracks[trk] = !djTracks[trk];
      const btn = document.getElementById(`dj-trk-${trk}`);
      if (btn) {
        if (djTracks[trk]) {
          btn.style.opacity = '1.0';
          btn.style.borderColor = '#00ff88';
        } else {
          btn.style.opacity = '0.4';
          btn.style.borderColor = '#444';
        }
      }
    }
    function toggleDJMaster() {
      djMixerActive = !djMixerActive;
      const btn = document.getElementById('dj-master-toggle');
      if (djMixerActive) {
        if (btn) { btn.textContent = 'STOP BEAT'; btn.style.background = '#ff0055'; }
        startDJLoop();
      } else {
        if (btn) { btn.textContent = 'START BEAT'; btn.style.background = '#a855f7'; }
        if (djInterval) { clearInterval(djInterval); djInterval = null; }
      }
    }
    function startDJLoop() {
      const intervalMs = (60 / djBpm / 2) * 1000;
      djInterval = setInterval(() => {
        djStep = (djStep + 1) % 8;
        if (!cyberAudio.ctx) return;
        const now = cyberAudio.ctx.currentTime;
        // Kick on 0, 4
        if (djTracks.kick && (djStep === 0 || djStep === 4)) {
          const osc = cyberAudio.ctx.createOscillator();
          const gain = cyberAudio.ctx.createGain();
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc.connect(gain); gain.connect(cyberAudio.ctx.destination);
          osc.start(now); osc.stop(now + 0.15);
        }
        // Hihat on 2, 6
        if (djTracks.hihat && (djStep === 2 || djStep === 6)) {
          const osc = cyberAudio.ctx.createOscillator();
          const gain = cyberAudio.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(8000, now);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(gain); gain.connect(cyberAudio.ctx.destination);
          osc.start(now); osc.stop(now + 0.06);
        }
        // Bass Synth
        if (djTracks.bass && djStep % 2 === 0) {
          const osc = cyberAudio.ctx.createOscillator();
          const gain = cyberAudio.ctx.createGain();
          osc.type = 'sawtooth';
          const freqs = [55, 65, 49, 73];
          osc.frequency.setValueAtTime(freqs[Math.floor(djStep / 2)], now);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain); gain.connect(cyberAudio.ctx.destination);
          osc.start(now); osc.stop(now + 0.16);
        }
      }, intervalMs);
    }
    function triggerDJDrop() {
      cyberAudio.playHyperloopBoom();
      showStoreNotification('🔥 SUB-BASS DROP INITIATED! ROOFTOP GOING WILD!');
    }

    // ------------------------------------------------------------
    // 7. PLAYABLE RETRO 2D ARCADE MINI-GAME (ASTRO-BLASTER 2099)
    // ------------------------------------------------------------
    let retroArcadeRunning = false;
    let retroArcadeLoopId = null;
    let retroArcadeScore = 0;
    let retroArcadeShield = 100;
    let retroArcadeShipX = 240;
    let retroArcadeLasers = [];
    let retroArcadeEnemies = [];
    let retroArcadeKeys = { left: false, right: false, fire: false };

    function openRetroArcadeModal() {
      const modal = document.getElementById('modal-retro-arcade');
      if (modal) modal.style.display = 'block';
      startNewArcadeGame();
    }
    function closeRetroArcadeModal() {
      const modal = document.getElementById('modal-retro-arcade');
      if (modal) modal.style.display = 'none';
      retroArcadeRunning = false;
      if (retroArcadeLoopId) cancelAnimationFrame(retroArcadeLoopId);
    }
    function startNewArcadeGame() {
      retroArcadeRunning = true;
      retroArcadeScore = 0;
      retroArcadeShield = 100;
      retroArcadeShipX = 240;
      retroArcadeLasers = [];
      retroArcadeEnemies = [];

      const high = localStorage.getItem('ASTRO_ARCADE_HIGH') || '0';
      const highEl = document.getElementById('arcade-high-score');
      if (highEl) highEl.textContent = high;

      if (retroArcadeLoopId) cancelAnimationFrame(retroArcadeLoopId);
      runRetroArcadeLoop();
    }

    window.addEventListener('keydown', e => {
      if (!retroArcadeRunning) return;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') retroArcadeKeys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') retroArcadeKeys.right = true;
      if (e.code === 'Space') {
        retroArcadeKeys.fire = true;
        fireRetroArcadeLaser();
      }
      if (e.code === 'Escape') closeRetroArcadeModal();
    });

    window.addEventListener('keyup', e => {
      if (!retroArcadeRunning) return;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') retroArcadeKeys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') retroArcadeKeys.right = false;
      if (e.code === 'Space') retroArcadeKeys.fire = false;
    });

    function fireRetroArcadeLaser() {
      retroArcadeLasers.push({ x: retroArcadeShipX - 10, y: 320 });
      retroArcadeLasers.push({ x: retroArcadeShipX + 10, y: 320 });
      cyberAudio.playArcadeLaser();
    }

    function runRetroArcadeLoop() {
      if (!retroArcadeRunning) return;
      const cvs = document.getElementById('retro-arcade-canvas');
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      const w = cvs.width;
      const h = cvs.height;

      // Update Ship
      if (retroArcadeKeys.left) retroArcadeShipX = Math.max(20, retroArcadeShipX - 6);
      if (retroArcadeKeys.right) retroArcadeShipX = Math.min(w - 20, retroArcadeShipX + 6);

      // Spawn Enemies
      if (Math.random() < 0.04) {
        retroArcadeEnemies.push({
          x: 20 + Math.random() * (w - 40),
          y: -10,
          speed: 1.8 + Math.random() * 2.2,
          radius: 12 + Math.random() * 8
        });
      }

      // Update Lasers
      for (let i = retroArcadeLasers.length - 1; i >= 0; i--) {
        retroArcadeLasers[i].y -= 9;
        if (retroArcadeLasers[i].y < -10) retroArcadeLasers.splice(i, 1);
      }

      // Update Enemies & Laser Collisions
      for (let eIdx = retroArcadeEnemies.length - 1; eIdx >= 0; eIdx--) {
        const en = retroArcadeEnemies[eIdx];
        en.y += en.speed;

        // Check Laser Collision
        for (let lIdx = retroArcadeLasers.length - 1; lIdx >= 0; lIdx--) {
          const lz = retroArcadeLasers[lIdx];
          const dist = Math.hypot(lz.x - en.x, lz.y - en.y);
          if (dist < en.radius + 4) {
            cyberAudio.playArcadeExplosion();
            retroArcadeScore += 50;
            gameState.tokens += 5; // Real tokens awarded!
            document.getElementById('hud-tokens').textContent = gameState.tokens.toLocaleString();
            retroArcadeEnemies.splice(eIdx, 1);
            retroArcadeLasers.splice(lIdx, 1);
            break;
          }
        }

        // Check Ship Collision
        if (en && Math.hypot(en.x - retroArcadeShipX, en.y - 330) < en.radius + 14) {
          cyberAudio.playHitSound();
          retroArcadeShield = Math.max(0, retroArcadeShield - 25);
          retroArcadeEnemies.splice(eIdx, 1);
          if (retroArcadeShield <= 0) {
            cyberAudio.playKillSound();
            showStoreNotification(`GAME OVER! FINAL ARCADE SCORE: ${retroArcadeScore}`);
            const curHigh = parseInt(localStorage.getItem('ASTRO_ARCADE_HIGH') || '0');
            if (retroArcadeScore > curHigh) localStorage.setItem('ASTRO_ARCADE_HIGH', '' + retroArcadeScore);
            retroArcadeRunning = false;
          }
        }
      }

      // Update HUD
      const sEl = document.getElementById('arcade-score');
      const lEl = document.getElementById('arcade-lives');
      if (sEl) sEl.textContent = retroArcadeScore;
      if (lEl) lEl.textContent = `${retroArcadeShield}%`;

      // Render 2D Arcade Frame
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, w, h);

      // Starfield dots
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 20; i++) {
        ctx.fillRect((i * 47) % w, (i * 31 + performance.now() * 0.05) % h, 2, 2);
      }

      // Draw Ship
      ctx.fillStyle = '#00f2ff';
      ctx.beginPath();
      ctx.moveTo(retroArcadeShipX, 315);
      ctx.lineTo(retroArcadeShipX - 16, 340);
      ctx.lineTo(retroArcadeShipX + 16, 340);
      ctx.closePath();
      ctx.fill();

      // Draw Lasers
      ctx.fillStyle = '#ff007f';
      retroArcadeLasers.forEach(lz => {
        ctx.fillRect(lz.x - 2, lz.y, 4, 12);
      });

      // Draw Enemies
      ctx.fillStyle = '#ff4400';
      retroArcadeEnemies.forEach(en => {
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      retroArcadeLoopId = requestAnimationFrame(runArcadeLoop);
    }

    // ============================================================
    // PERIMETER RAILWAY SYSTEM & GRAND CENTRAL RAILWAY STATION
    // ============================================================
    function buildPerimeterRailway() {
      railwayGroup = new THREE.Group();
      scene.add(railwayGroup);

      const trackMat = new THREE.MeshStandardMaterial({ color: 0x1a222e, roughness: 0.65, metalness: 0.85 });
      const railMat = new THREE.MeshStandardMaterial({ color: 0xc8d4e0, roughness: 0.2, metalness: 0.95 });
      const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x141a24, roughness: 0.8, metalness: 0.3 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.45, roughness: 0.1 });
      const cautionMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

      // 1. Perimeter Track Rectangular Guideway Ring (Elevated at Y: 7.5m)
      const segments = [
        { x1: -180, z1: -200, x2: 180, z2: -200, isX: true, len: 360 }, // North Track
        { x1: 180, z1: -200, x2: 180, z2: 180, isX: false, len: 380 },  // East Track (passes Grand Central)
        { x1: 180, z1: 180, x2: -180, z2: 180, isX: true, len: 360 },   // South Track
        { x1: -180, z1: 180, x2: -180, z2: -200, isX: false, len: 380 } // West Track
      ];

      segments.forEach(seg => {
        const cx = (seg.x1 + seg.x2) / 2;
        const cz = (seg.z1 + seg.z2) / 2;
        const deckGeo = seg.isX ? new THREE.BoxGeometry(seg.len, 0.9, 4.2) : new THREE.BoxGeometry(4.2, 0.9, seg.len);
        const deck = new THREE.Mesh(deckGeo, trackMat);
        deck.position.set(cx, 7.5, cz);
        deck.receiveShadow = true;
        railwayGroup.add(deck);

        [-1.2, 1.2].forEach(offset => {
          const railGeo = seg.isX ? new THREE.BoxGeometry(seg.len, 0.25, 0.3) : new THREE.BoxGeometry(0.3, 0.25, seg.len);
          const rail = new THREE.Mesh(railGeo, railMat);
          rail.position.set(seg.isX ? cx : cx + offset, 8.0, seg.isX ? cz + offset : cz);
          railwayGroup.add(rail);
        });

        const stripGeo = seg.isX ? new THREE.BoxGeometry(seg.len, 0.05, 0.35) : new THREE.BoxGeometry(0.35, 0.05, seg.len);
        const strip = new THREE.Mesh(stripGeo, cyanGlowMat);
        strip.position.set(cx, 8.02, cz);
        railwayGroup.add(strip);

        registerCityCollider({
          type: 'platform',
          x: cx,
          z: cz,
          hw: seg.isX ? seg.len / 2 : 2.5,
          hd: seg.isX ? 2.5 : seg.len / 2,
          topY: 7.5
        });
      });

      // Concrete Support Pillars along Perimeter (Every 30m)
      const pillarSpacing = 30;
      for (let px = -180; px <= 180; px += pillarSpacing) {
        [-200, 180].forEach(pz => {
          const p = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7.5, 2.4), pillarMat);
          p.position.set(px, 3.75, pz);
          p.castShadow = true;
          railwayGroup.add(p);
          registerCityCollider({ type: 'solid', x: px, z: pz, hw: 1.6, hd: 1.6 });
        });
      }
      for (let pz = -170; pz < 180; pz += pillarSpacing) {
        [-180, 180].forEach(px => {
          if (px === 180 && Math.abs(pz - 40) < 30) return; // Station concourse clearing
          const p = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7.5, 2.4), pillarMat);
          p.position.set(px, 3.75, pz);
          p.castShadow = true;
          railwayGroup.add(p);
          registerCityCollider({ type: 'solid', x: px, z: pz, hw: 1.6, hd: 1.6 });
        });
      }

      // ============================================================
      // 2. NEXUS GRAND CENTRAL RAILWAY STATION AT (180, 0, 40)
      // ============================================================
      const stX = 180, stZ = 40;
      const stHall = new THREE.Mesh(new THREE.BoxGeometry(18, 6.5, 48), pillarMat);
      stHall.position.set(stX - 10, 3.25, stZ);
      stHall.castShadow = true;
      railwayGroup.add(stHall);

      const stGlass = new THREE.Mesh(new THREE.PlaneGeometry(44, 5.0), glassMat);
      stGlass.position.set(stX - 19.1, 3.2, stZ);
      stGlass.rotation.y = -Math.PI / 2;
      railwayGroup.add(stGlass);

      const stSign = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 28), cyanGlowMat);
      stSign.position.set(stX - 19.2, 5.8, stZ);
      railwayGroup.add(stSign);

      const platW = 7.5, platL = 52;
      const platform = new THREE.Mesh(new THREE.BoxGeometry(platW, 0.45, platL), trackMat);
      platform.position.set(stX - 5.5, 7.5, stZ);
      platform.receiveShadow = true;
      railwayGroup.add(platform);

      const safeStrip = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, platL), cautionMat);
      safeStrip.position.set(stX - 2.0, 7.75, stZ);
      railwayGroup.add(safeStrip);

      const canopy = new THREE.Mesh(new THREE.CylinderGeometry(platW * 0.7, platW * 0.7, platL, 16, 1, true, 0, Math.PI), glassMat);
      canopy.rotation.x = Math.PI / 2;
      canopy.position.set(stX - 5.5, 11.2, stZ);
      railwayGroup.add(canopy);

      [-16, 16].forEach(sOffsetZ => {
        const numStairSteps = 16;
        const sRise = 7.25 / numStairSteps;
        const sDepth = 0.55;
        const sW = 3.2;
        for (let st = 0; st < numStairSteps; st++) {
          const sy = 0.25 + (st + 0.5) * sRise;
          const sx = (stX - 16) + (st + 0.5) * (10.5 / numStairSteps);
          const sz = stZ + sOffsetZ;
          const sStep = new THREE.Mesh(new THREE.BoxGeometry(sDepth, sRise, sW), trackMat);
          sStep.position.set(sx, sy, sz);
          railwayGroup.add(sStep);

          const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, sW * 0.94), cyanGlowMat);
          led.position.set(sx - sDepth / 2, sy + sRise / 2 + 0.01, sz);
          railwayGroup.add(led);
        }
      });

      registerCityCollider({ type: 'solid', x: stX - 10, z: stZ, hw: 10, hd: 25 });
      registerCityCollider({ type: 'platform', x: stX - 5.5, z: stZ, hw: 4.0, hd: 26, topY: 7.5 });

      // ============================================================
      // 3. AUTONOMOUS HIGH-SPEED METRO MAGLEV EXPRESS TRAIN
      // ============================================================
      maglevTrainMesh = new THREE.Group();
      maglevTrainMesh.position.set(stX, 8.2, stZ);
      railwayGroup.add(maglevTrainMesh);

      const loco = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 11), railMat);
      loco.position.set(0, 1.4, 0);
      maglevTrainMesh.add(loco);

      const noseCone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.5, 16), railMat);
      noseCone.rotation.x = Math.PI / 2;
      noseCone.position.set(0, 1.4, 6.8);
      maglevTrainMesh.add(noseCone);

      const hLight = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), cyanGlowMat);
      hLight.position.set(0, 1.4, 8.5);
      maglevTrainMesh.add(hLight);

      const coach = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 12), railMat);
      coach.position.set(0, 1.4, -12);
      maglevTrainMesh.add(coach);

      const winL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 10.5), glassMat);
      winL.position.set(-1.62, 1.6, -12);
      maglevTrainMesh.add(winL);
      const winR = winL.clone();
      winR.position.x = 1.62;
      maglevTrainMesh.add(winR);

      const lounge = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 11), railMat);
      lounge.position.set(0, 1.4, -24);
      maglevTrainMesh.add(lounge);

      const loungeGlass = new THREE.Mesh(new THREE.SphereGeometry(1.58, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
      loungeGlass.rotation.x = -Math.PI / 2;
      loungeGlass.position.set(0, 1.4, -29.2);
      maglevTrainMesh.add(loungeGlass);
    }

    // ============================================================
    // NEXUS INTERNATIONAL AERODROME & AIRPORT SYSTEM
    // ============================================================
    function buildNexusAerodrome() {
      airportGroup = new THREE.Group();
      scene.add(airportGroup);

      const tarmacMat = new THREE.MeshStandardMaterial({ color: 0x111620, roughness: 0.9, metalness: 0.2 });
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const edgeLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const thresholdGreenMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      const redEndLightMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
      const blueTaxiMat = new THREE.MeshBasicMaterial({ color: 0x0088ff });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x2b3442, metalness: 0.9, roughness: 0.25 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.45, roughness: 0.1 });
      const darkStealthMat = new THREE.MeshStandardMaterial({ color: 0x181e28, roughness: 0.4, metalness: 0.85 });

      // 1. Runway 09/27 (X: 320 to 740, Z: -220, Width: 26m, Length: 420m)
      const rCenter = 530, rZ = -220, rLen = 420, rW = 26;
      const runwayMesh = new THREE.Mesh(new THREE.BoxGeometry(rLen, 0.4, rW), tarmacMat);
      runwayMesh.position.set(rCenter, 0.2, rZ);
      runwayMesh.receiveShadow = true;
      airportGroup.add(runwayMesh);

      for (let rx = 345; rx <= 715; rx += 25) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(15, 1.0), lineMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(rx, 0.42, rZ);
        airportGroup.add(stripe);
      }

      for (let rx = 330; rx <= 730; rx += 28) {
        [-rW / 2 + 0.4, rW / 2 - 0.4].forEach(dz => {
          const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 8), edgeLightMat);
          lamp.position.set(rx, 0.5, rZ + dz);
          airportGroup.add(lamp);
        });
      }

      for (let ty = -rW / 2 + 2; ty <= rW / 2 - 2; ty += 3.5) {
        const gLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), thresholdGreenMat);
        gLight.position.set(325, 0.55, rZ + ty);
        airportGroup.add(gLight);
      }

      for (let ty = -rW / 2 + 2; ty <= rW / 2 - 2; ty += 3.5) {
        const rLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), redEndLightMat);
        rLight.position.set(735, 0.55, rZ + ty);
        airportGroup.add(rLight);
      }

      registerCityCollider({ type: 'platform', x: rCenter, z: rZ, hw: rLen / 2, hd: rW / 2, topY: 0.4 });

      // 2. Parallel Taxiway & Parking Apron
      const taxiway = new THREE.Mesh(new THREE.BoxGeometry(220, 0.35, 14), tarmacMat);
      taxiway.position.set(430, 0.18, -180);
      airportGroup.add(taxiway);

      for (let tx = 330; tx <= 530; tx += 20) {
        [-7.5, 7.5].forEach(dz => {
          const bLamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), blueTaxiMat);
          bLamp.position.set(tx, 0.5, -180 + dz);
          airportGroup.add(bLamp);
        });
      }

      // 3. Modern Airport Passenger Terminal at (380, 0, -145)
      const termMesh = new THREE.Mesh(new THREE.BoxGeometry(52, 12, 26), steelMat);
      termMesh.position.set(380, 6, -145);
      termMesh.castShadow = true;
      airportGroup.add(termMesh);

      const termGlass = new THREE.Mesh(new THREE.PlaneGeometry(48, 8), glassMat);
      termGlass.position.set(380, 6, -131.8);
      airportGroup.add(termGlass);

      const termSign = new THREE.Mesh(new THREE.BoxGeometry(44, 2.2, 0.4), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
      termSign.position.set(380, 11.5, -131.8);
      airportGroup.add(termSign);

      const jetway = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.6, 26), steelMat);
      jetway.position.set(390, 4.5, -165);
      airportGroup.add(jetway);

      // 4. Aircraft Maintenance Hangar at (480, 0, -145)
      const hangarMesh = new THREE.Mesh(new THREE.BoxGeometry(42, 16, 32), steelMat);
      hangarMesh.position.set(480, 8, -145);
      airportGroup.add(hangarMesh);

      const hangarOpening = new THREE.Mesh(new THREE.PlaneGeometry(36, 12), new THREE.MeshBasicMaterial({ color: 0x070b10 }));
      hangarOpening.position.set(480, 6.2, -128.8);
      airportGroup.add(hangarOpening);

      // 5. YYC 91m Air Traffic Control (ATC) Tower at (320, 0, -145) — Canada's Tallest ATC Tower
      const atcShaft = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 6.2, 78, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.2 }));
      atcShaft.position.set(320, 39, -145);
      atcShaft.castShadow = true;
      airportGroup.add(atcShaft);

      const atcCab = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 6.5, 9.0, 16), glassMat);
      atcCab.position.set(320, 82.5, -145);
      airportGroup.add(atcCab);

      atcRadarDish = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 0.5, 0.8, 16, 1, false, 0, Math.PI), steelMat);
      atcRadarDish.rotation.x = Math.PI / 4;
      atcRadarDish.position.set(320, 89.5, -145);
      airportGroup.add(atcRadarDish);

      const atcBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
      atcBeacon.position.set(320, 92.5, -145);
      airportGroup.add(atcBeacon);

      registerCityCollider({ type: 'solid', x: 320, z: -145, hw: 6.5, hd: 6.5 });

      // ============================================================
      // 6. THREE DISTINCT CONTROLLABLE AIRCRAFT
      // ============================================================
      airportPlanes = [];

      // PLANE 1: Apex F-99 Supersonic Stealth Interceptor (Runway Start: 350, 1.2, -220)
      const f99Group = new THREE.Group();
      f99Group.position.set(350, 1.2, -220);
      f99Group.rotation.y = -Math.PI / 2;
      airportGroup.add(f99Group);

      const f99Body = new THREE.Mesh(new THREE.ConeGeometry(1.6, 16, 8), darkStealthMat);
      f99Body.rotation.x = -Math.PI / 2;
      f99Body.position.set(0, 0.9, 0);
      f99Group.add(f99Body);

      const f99WingGeo = new THREE.BufferGeometry();
      const wingVerts = new Float32Array([
        0, 0.9, 2.0,   -6.5, 0.9, -5.5,   0, 0.9, -4.5,
        0, 0.9, 2.0,    0, 0.9, -4.5,     6.5, 0.9, -5.5
      ]);
      f99WingGeo.setAttribute('position', new THREE.BufferAttribute(wingVerts, 3));
      f99WingGeo.computeVertexNormals();
      const f99Wings = new THREE.Mesh(f99WingGeo, darkStealthMat);
      f99Group.add(f99Wings);

      [-1.8, 1.8].forEach((vx, idx) => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 2.8), darkStealthMat);
        fin.rotation.z = idx === 0 ? 0.28 : -0.28;
        fin.position.set(vx, 2.0, -4.5);
        f99Group.add(fin);
      });

      const f99Canopy = new THREE.Mesh(new THREE.ConeGeometry(0.85, 4.5, 8), glassMat);
      f99Canopy.rotation.x = -Math.PI / 2;
      f99Canopy.position.set(0, 1.5, 2.2);
      f99Group.add(f99Canopy);

      [-0.85, 0.85].forEach(ex => {
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.2, 12), steelMat);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(ex, 0.9, -7.5);
        f99Group.add(nozzle);

        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.48, 4.0, 8), new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.85 }));
        flame.rotation.x = -Math.PI / 2;
        flame.position.set(ex, 0.9, -9.8);
        f99Group.add(flame);
      });

      airportPlanes.push({
        id: 'f99',
        name: 'APEX F-99 STEALTH FIGHTER',
        mesh: f99Group,
        pos: f99Group.position,
        maxSpeed: 95,
        takeoffSpeed: 24,
        pitchRate: 1.6,
        rollRate: 2.2,
        yawRate: 1.0,
        hasAfterburner: true,
        isVTOL: false
      });

      // PLANE 2: Cyber Aeroliner (Twin-Turbofan Passenger Jet at Gate 1: 390, 1.2, -180)
      const airlinerGroup = new THREE.Group();
      airlinerGroup.position.set(390, 1.4, -180);
      airlinerGroup.rotation.y = -Math.PI / 2;
      airportGroup.add(airlinerGroup);

      const aFuse = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 22, 16), steelMat);
      aFuse.rotation.x = Math.PI / 2;
      aFuse.position.set(0, 1.6, 0);
      airlinerGroup.add(aFuse);

      const aNose = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.2, 16), steelMat);
      aNose.rotation.x = -Math.PI / 2;
      aNose.position.set(0, 1.6, 13.1);
      airlinerGroup.add(aNose);

      const aWing = new THREE.Mesh(new THREE.BoxGeometry(24, 0.28, 3.8), steelMat);
      aWing.position.set(0, 1.3, 0);
      airlinerGroup.add(aWing);

      [-12, 12].forEach(wx => {
        const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 1.4), darkStealthMat);
        winglet.position.set(wx, 2.0, 0);
        airlinerGroup.add(winglet);
      });

      [-4.2, 4.2].forEach(ex => {
        const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.8, 16), steelMat);
        engine.rotation.x = Math.PI / 2;
        engine.position.set(ex, 0.5, 1.0);
        airlinerGroup.add(engine);
      });

      const aTailVert = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.2, 3.2), steelMat);
      aTailVert.position.set(0, 3.6, -9.5);
      airlinerGroup.add(aTailVert);

      const aTailHoriz = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.22, 2.2), steelMat);
      aTailHoriz.position.set(0, 5.5, -10.0);
      airlinerGroup.add(aTailHoriz);

      [-1.62, 1.62].forEach(px => {
        const pWins = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.45), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
        pWins.position.set(px, 1.8, 0);
        pWins.rotation.y = px > 0 ? Math.PI / 2 : -Math.PI / 2;
        airlinerGroup.add(pWins);
      });

      airportPlanes.push({
        id: 'aeroliner',
        name: 'CYBER AEROLINER JET',
        mesh: airlinerGroup,
        pos: airlinerGroup.position,
        maxSpeed: 65,
        takeoffSpeed: 20,
        pitchRate: 1.0,
        rollRate: 1.2,
        yawRate: 0.8,
        hasAfterburner: false,
        isVTOL: false
      });

      // PLANE 3: VTOL Sky-Lander (Heavy Cargo Tilt-Rotor at Apron Helipad: 460, 1.2, -180)
      const vtolGroup = new THREE.Group();
      vtolGroup.position.set(460, 1.2, -180);
      vtolGroup.rotation.y = -Math.PI / 2;
      airportGroup.add(vtolGroup);

      const vtolBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.8, 14), darkStealthMat);
      vtolBody.position.set(0, 1.6, 0);
      vtolGroup.add(vtolBody);

      const vtolGlass = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 3.2), glassMat);
      vtolGlass.position.set(0, 1.8, 7.5);
      vtolGroup.add(vtolGlass);

      const vtolWing = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 2.8), steelMat);
      vtolWing.position.set(0, 2.6, 1.0);
      vtolGroup.add(vtolWing);

      [-8.0, 8.0].forEach(rx => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.8, 12), steelMat);
        pod.position.set(rx, 2.6, 1.0);
        vtolGroup.add(pod);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8), darkStealthMat);
        hub.position.set(rx, 4.1, 1.0);
        vtolGroup.add(hub);

        const bladeGeo = new THREE.BoxGeometry(5.8, 0.05, 0.35);
        const blade1 = new THREE.Mesh(bladeGeo, new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.7 }));
        blade1.position.set(rx, 4.2, 1.0);
        vtolGroup.add(blade1);
      });

      airportPlanes.push({
        id: 'vtol',
        name: 'VTOL SKY-LANDER',
        mesh: vtolGroup,
        pos: vtolGroup.position,
        maxSpeed: 55,
        takeoffSpeed: 10,
        pitchRate: 1.2,
        rollRate: 1.4,
        yawRate: 1.2,
        hasAfterburner: false,
        isVTOL: true
      });
    }

    // ============================================================
    // TRANS-CANADA HIGHWAY SYSTEM // 14 PROVINCES & TERRITORIES
    // ============================================================
    
    // ============================================================
    // CALGARY METROPOLIS: SKYLINE, YYC AIRPORT, CENTRAL LIBRARY & SCOTIA PLACE
    // Geographically Faithful Representation of Calgary, Alberta
    // ============================================================
    let calgaryMetropolisGroup = null;
    let calgaryTowerTorchLight = null;
    let scotiaCrane1 = null, scotiaCrane2 = null;

    function buildCalgaryMetropolis() {
      calgaryMetropolisGroup = new THREE.Group();
      scene.add(calgaryMetropolisGroup);

      // PBR Materials for Calgary Architectural Icons
      const towerRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.38, metalness: 0.45 });
      const towerConcreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85, metalness: 0.15 });
      const towerGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x00f2ff, roughness: 0.08, metalness: 0.88, transparent: true, opacity: 0.78, clearcoat: 1.0 });
      const torchFlameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

      const bowGlassMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.12, metalness: 0.88 });
      const bowDiagridMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.32, metalness: 0.85 });

      const telusSkyGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.9 });
      const telusLedMat1 = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
      const telusLedMat2 = new THREE.MeshBasicMaterial({ color: 0x0088ff });

      const brookfieldGlassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.10, metalness: 0.92 });
      const steelFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.8 });

      const libraryFacadeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.42, metalness: 0.35 });
      const libraryWoodMat = new THREE.MeshStandardMaterial({ color: 0x9a5b32, roughness: 0.72, metalness: 0.08 });
      const libraryGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.12, metalness: 0.7, transparent: true, opacity: 0.72 });

      const craneYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35, metalness: 0.65 });
      const concreteBowlMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.1 });
      const safetyOrangeMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const warningBeaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

      const lrtTrackMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });
      const lrtRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4, metalness: 0.3 });
      const lrtWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

      // ------------------------------------------------------------
      // 1. THE CALGARY TOWER (190m) — 101 9th Ave SW at (X: -35, Z: -45)
      // ------------------------------------------------------------
      const calgaryTowerGroup = new THREE.Group();
      calgaryTowerGroup.position.set(-35, 0, -45);
      calgaryMetropolisGroup.add(calgaryTowerGroup);

      // Flared Tripod Base & Pavilion (Ground to 18m)
      const cBase = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 15, 18, 16), towerConcreteMat);
      cBase.position.y = 9;
      cBase.castShadow = true; cBase.receiveShadow = true;
      calgaryTowerGroup.add(cBase);

      // Carmine Red Slender Column Shaft (18m to 155m)
      const cShaft = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.8, 137, 16), towerRedMat);
      cShaft.position.y = 86.5;
      cShaft.castShadow = true;
      calgaryTowerGroup.add(cShaft);

      // Revolving Sky 360 Restaurant Drum (155m to 167m)
      const cDrum = new THREE.Mesh(new THREE.CylinderGeometry(15, 13, 12, 32), towerGlassMat);
      cDrum.position.y = 161;
      calgaryTowerGroup.add(cDrum);

      const cDrumRoof = new THREE.Mesh(new THREE.ConeGeometry(15.2, 4.5, 32), towerConcreteMat);
      cDrumRoof.position.y = 169.25;
      calgaryTowerGroup.add(cDrumRoof);

      // Upper Space Deck Observation Level (170m to 178m)
      const cUpperDeck = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 6.5, 8, 20), towerConcreteMat);
      cUpperDeck.position.y = 174;
      calgaryTowerGroup.add(cUpperDeck);

      // Natural Gas Centennial Olympic Torch Spire & Flame (178m to 191m)
      const cSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.4, 14, 8), steelFrameMat);
      cSpire.position.y = 185;
      calgaryTowerGroup.add(cSpire);

      const cFlame = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.8, 8), torchFlameMat);
      cFlame.position.y = 193;
      calgaryTowerGroup.add(cFlame);

      calgaryTowerTorchLight = new THREE.PointLight(0xffaa22, 2.5, 180);
      calgaryTowerTorchLight.position.set(-35, 193, -45);
      calgaryMetropolisGroup.add(calgaryTowerTorchLight);

      // CALGARY TOWER PLAZA CODEX & ALBERTA PASSPORT TERMINAL (X: -35, Z: -32)
      const calgaryCodexGroup = new THREE.Group();
      calgaryCodexGroup.position.set(-35, 0, -32);
      calgaryMetropolisGroup.add(calgaryCodexGroup);

      const codexPed = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.85 }));
      codexPed.position.y = 0.6;
      calgaryCodexGroup.add(codexPed);

      const codexShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.9 }));
      codexShaft.position.y = 1.9;
      calgaryCodexGroup.add(codexShaft);

      const codexRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 24), new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true }));
      codexRing.rotation.x = Math.PI / 2;
      codexRing.position.y = 2.4;
      calgaryCodexGroup.add(codexRing);
      calgaryCodexRing = codexRing;

      const codexCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshBasicMaterial({ color: 0xff3366 }));
      codexCore.position.y = 2.4;
      calgaryCodexGroup.add(codexCore);

      const codexLight = new THREE.PointLight(0x00f2ff, 1.8, 22);
      codexLight.position.set(0, 2.5, 0);
      calgaryCodexGroup.add(codexLight);

      registerCityCollider({ type: 'solid', x: -35, z: -45, hw: 14, hd: 14, world: 'earth' });
      registerCityCollider({ type: 'solid', x: -35, z: -32, hw: 3.5, hd: 3.5, world: 'earth' });

      // ------------------------------------------------------------
      // 2. THE BOW SKYSCRAPER (236m) — 500 Centre St S at (X: 25, Z: -85)
      // Crescent Curved Aerodynamic Form with Diagrid Exoskeleton
      // ------------------------------------------------------------
      const bowGroup = new THREE.Group();
      bowGroup.position.set(25, 0, -85);
      calgaryMetropolisGroup.add(bowGroup);

      // Curved Elliptical Crescent Core Tower
      for (let segment = 0; segment < 5; segment++) {
        const segH = 46;
        const segScaleW = 1.0 - segment * 0.05;
        const segMesh = new THREE.Mesh(new THREE.CylinderGeometry(20 * segScaleW, 22 * segScaleW, segH, 24, 1, false, 0, Math.PI * 1.15), bowGlassMat);
        segMesh.rotation.y = Math.PI * 0.92;
        segMesh.position.set(0, segH * (0.5 + segment), 0);
        segMesh.castShadow = true; segMesh.receiveShadow = true;
        bowGroup.add(segMesh);
      }

      // Exterior Structural Steel Diagrid Triangulated Bracing Bands
      for (let dLevel = 0; dLevel < 12; dLevel++) {
        const diagY = 18 + dLevel * 18;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(21 - dLevel * 0.4, 0.5, 6, 24, Math.PI * 1.15), bowDiagridMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = Math.PI * 0.92;
        ring.position.set(0, diagY, 0);
        bowGroup.add(ring);
      }

      // Crown Curved Screen at Apex (236m)
      const bowCrown = new THREE.Mesh(new THREE.CylinderGeometry(16, 17.5, 8, 24, 1, false, 0, Math.PI * 1.15), bowDiagridMat);
      bowCrown.rotation.y = Math.PI * 0.92;
      bowCrown.position.set(0, 234, 0);
      bowGroup.add(bowCrown);

      const bowBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), warningBeaconMat);
      bowBeacon.position.set(0, 238, 0);
      bowGroup.add(bowBeacon);

      registerCityCollider({ type: 'solid', x: 25, z: -85, hw: 22, hd: 18, world: 'earth' });

      // ------------------------------------------------------------
      // 3. TELUS SKY (222m) — 685 Centre St S at (X: -20, Z: -80)
      // Twisting Pixelated Step-Back Facade with Northern Lights LEDs
      // ------------------------------------------------------------
      const telusGroup = new THREE.Group();
      telusGroup.position.set(-20, 0, -80);
      calgaryMetropolisGroup.add(telusGroup);

      // Base Commercial Block (0 to 80m)
      const telusBase = new THREE.Mesh(new THREE.BoxGeometry(22, 80, 22), telusSkyGlassMat);
      telusBase.position.y = 40;
      telusBase.castShadow = true; telusBase.receiveShadow = true;
      telusGroup.add(telusBase);

      // Twisting Step-Back Residential Terraces (80m to 222m)
      for (let t = 0; t < 7; t++) {
        const tH = 20;
        const tW = 20 - t * 1.6;
        const tRot = t * 0.04;
        const tMesh = new THREE.Mesh(new THREE.BoxGeometry(tW, tH, tW), telusSkyGlassMat);
        tMesh.position.set(t * 0.6, 80 + tH * (0.5 + t), t * 0.4);
        tMesh.rotation.y = tRot;
        tMesh.castShadow = true;
        telusGroup.add(tMesh);

        // LED Dynamic Art Strips along Balconies
        const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(tW + 0.4, 0.4, tW + 0.4), (t % 2 === 0 ? telusLedMat1 : telusLedMat2));
        ledStrip.position.set(t * 0.6, 80 + tH * (0.5 + t), t * 0.4);
        ledStrip.rotation.y = tRot;
        telusGroup.add(ledStrip);
      }

      registerCityCollider({ type: 'solid', x: -20, z: -80, hw: 16, hd: 16, world: 'earth' });

      // ------------------------------------------------------------
      // 4. BROOKFIELD PLACE EAST (247m) — 225 6th Ave SW at (X: -65, Z: -95)
      // Tallest Skyscraper in Calgary, Rounded Radius Glass Corners
      // ------------------------------------------------------------
      const brookfieldGroup = new THREE.Group();
      brookfieldGroup.position.set(-65, 0, -95);
      calgaryMetropolisGroup.add(brookfieldGroup);

      const bMain = new THREE.Mesh(new THREE.BoxGeometry(28, 240, 26), brookfieldGlassMat);
      bMain.position.y = 120;
      bMain.castShadow = true; bMain.receiveShadow = true;
      brookfieldGroup.add(bMain);

      const bCrown = new THREE.Mesh(new THREE.BoxGeometry(26, 7, 24), steelFrameMat);
      bCrown.position.y = 243.5;
      brookfieldGroup.add(bCrown);

      const bBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), warningBeaconMat);
      bBeacon.position.set(0, 248, 0);
      brookfieldGroup.add(bBeacon);

      registerCityCollider({ type: 'solid', x: -65, z: -95, hw: 18, hd: 17, world: 'earth' });

      // ------------------------------------------------------------
      // 5. CALGARY CENTRAL LIBRARY (Snøhetta / DIALOG) — 800 3 St SE, East Village at (X: 85, Z: -50)
      // Distinctive Polygonal Geometric Facade, Soaring Cedar Portal Arch
      // and Active C-Train Light Rail Transit (LRT) Line Passing Through!
      // ------------------------------------------------------------
      const libGroup = new THREE.Group();
      libGroup.position.set(85, 0, -50);
      calgaryMetropolisGroup.add(libGroup);

      // Main Curvilinear Geometric Building Body (42m x 22m x 28m)
      const libBody = new THREE.Mesh(new THREE.BoxGeometry(42, 22, 28), libraryFacadeMat);
      libBody.position.y = 11;
      libBody.castShadow = true; libBody.receiveShadow = true;
      libGroup.add(libBody);

      // Geometric Hexagonal/Polygonal Facade Glass Bands
      for (let fz of [-13.9, 13.9]) {
        for (let gx = -16; gx <= 16; gx += 8) {
          const hexGlass = new THREE.Mesh(new THREE.BoxGeometry(6.2, 5.5, 0.4), libraryGlassMat);
          hexGlass.position.set(gx, 11, fz);
          libGroup.add(hexGlass);
        }
      }

      // Soaring Western Red Cedar Wood-Lined Archway Portal (Spans C-Train Track)
      const archLining = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 29, 16, 1, true, 0, Math.PI), libraryWoodMat);
      archLining.rotation.z = Math.PI / 2;
      archLining.rotation.y = Math.PI / 2;
      archLining.position.set(0, 4.5, 0);
      libGroup.add(archLining);

      // Calgary Public Library Official 3D Signboard
      const libSign = new THREE.Mesh(new THREE.BoxGeometry(28, 1.8, 0.4), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }));
      libSign.position.set(0, 21.5, 14.2);
      libGroup.add(libSign);

      const libSignText = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 0.5), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      libSignText.position.set(0, 21.5, 14.3);
      libGroup.add(libSignText);

      // C-Train LRT Track Extended Through Library to Scotia Place (X: 85, Z: -120 to +90, Length: 210m)
      const trackBed = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.25, 210), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 }));
      trackBed.position.set(85, 0.12, -15);
      calgaryMetropolisGroup.add(trackBed);

      [-1.2, 1.2].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 210), lrtTrackMat);
        rail.position.set(85 + rx, 0.3, -15);
        calgaryMetropolisGroup.add(rail);
      });

      // Calgary Transit Station Platforms with Yellow Safety Tactile Edge Paving
      const platformMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
      const safetyYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });

      // Station 1: Central Library / East Village Station (X: 80.5, Z: -50)
      const plat1 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 34), platformMat);
      plat1.position.set(80.5, 0.25, -50);
      calgaryMetropolisGroup.add(plat1);
      const plat1Edge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.52, 34), safetyYellowMat);
      plat1Edge.position.set(82.1, 0.26, -50);
      calgaryMetropolisGroup.add(plat1Edge);

      // Station 2: Scotia Place / Arena District Station (X: 80.5, Z: 75)
      const plat2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 34), platformMat);
      plat2.position.set(80.5, 0.25, 75);
      calgaryMetropolisGroup.add(plat2);
      const plat2Edge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.52, 34), safetyYellowMat);
      plat2Edge.position.set(82.1, 0.26, 75);
      calgaryMetropolisGroup.add(plat2Edge);

      // Calgary Transit C-Train Siemens S200 Car (Dynamic Transit System)
      const ctrainCar = new THREE.Group();
      ctrainCar.position.set(85, 0.4, -75);
      calgaryMetropolisGroup.add(ctrainCar);
      calgaryCTrainMesh = ctrainCar;

      const lrtBody = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.4, 24), lrtWhiteMat);
      lrtBody.position.y = 1.9;
      ctrainCar.add(lrtBody);

      const lrtStripe = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.8, 24), lrtRedMat);
      lrtStripe.position.y = 1.4;
      ctrainCar.add(lrtStripe);

      const lrtGlass = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.1, 20), towerGlassMat);
      lrtGlass.position.y = 2.4;
      ctrainCar.add(lrtGlass);

      const pantograph = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 2.0), steelFrameMat);
      pantograph.position.set(0, 4.2, 0);
      ctrainCar.add(pantograph);

      registerCityCollider({ type: 'solid', x: 85, z: -50, hw: 22, hd: 16, world: 'earth' });

      // ------------------------------------------------------------
      // 6. CONFIRMED ACTIVE CALGARY CONSTRUCTION PROJECT (2025–2026):
      // SCOTIA PLACE (Calgary Event Centre / Future Home of Calgary Flames)
      // Location: 14th Ave SE & 5th St SE in Culture + Entertainment District at (X: 85, Z: 75)
      // Source Verified Live: https://www.scotiaplace.com/ & City of Calgary Major Projects
      // Active Status: Rising Structural Steel Framework, 2 Tower Cranes, Safety Hoarding & Concrete Bowl
      // ------------------------------------------------------------
      const scotiaGroup = new THREE.Group();
      scotiaGroup.position.set(85, 0, 75);
      calgaryMetropolisGroup.add(scotiaGroup);

      // Arena Concrete Foundation & Raked Seating Bowl (In Construction)
      const bowlFloor = new THREE.Mesh(new THREE.CylinderGeometry(28, 32, 4.5, 24), concreteBowlMat);
      bowlFloor.position.y = 2.25;
      bowlFloor.castShadow = true; bowlFloor.receiveShadow = true;
      scotiaGroup.add(bowlFloor);

      for (let tier = 1; tier <= 3; tier++) {
        const tierMesh = new THREE.Mesh(new THREE.CylinderGeometry(28 - tier * 4, 30 - tier * 4, 3.5, 24, 1, true), concreteBowlMat);
        tierMesh.position.y = 2.5 + tier * 3.2;
        scotiaGroup.add(tierMesh);
      }

      // Rising Structural Steel Skeleton Framework (Upright Columns & Diagonal Bracing)
      for (let col = 0; col < 16; col++) {
        const ang = (col / 16) * Math.PI * 2;
        const colX = Math.cos(ang) * 29;
        const colZ = Math.sin(ang) * 29;
        const colH = 26 + (col % 3) * 4;
        const steelCol = new THREE.Mesh(new THREE.BoxGeometry(1.2, colH, 1.2), steelFrameMat);
        steelCol.position.set(colX, colH / 2, colZ);
        steelCol.castShadow = true;
        scotiaGroup.add(steelCol);

        // Horizontal connecting steel beam
        if (col % 2 === 0) {
          const nextAng = ((col + 1) / 16) * Math.PI * 2;
          const beamLen = Math.hypot(Math.cos(nextAng) * 29 - colX, Math.sin(nextAng) * 29 - colZ);
          const steelBeam = new THREE.Mesh(new THREE.BoxGeometry(beamLen, 0.8, 0.8), steelFrameMat);
          steelBeam.position.set((colX + Math.cos(nextAng) * 29) / 2, colH * 0.8, (colZ + Math.sin(nextAng) * 29) / 2);
          steelBeam.rotation.y = -ang;
          scotiaGroup.add(steelBeam);
        }
      }

      // Staged Roof Trusses Spanning Arena (Under Active Installation)
      [-10, 0, 10].forEach(tz => {
        const truss = new THREE.Mesh(new THREE.BoxGeometry(54, 3.2, 1.0), steelFrameMat);
        truss.position.set(0, 28, tz);
        scotiaGroup.add(truss);
      });

      // Construction Tower Crane 1 (56m, North Work Zone at X: -18, Z: -15 relative to arena)
      const crane1Group = new THREE.Group();
      crane1Group.position.set(-18, 0, -15);
      scotiaGroup.add(crane1Group);

      const mast1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 56, 2.4), craneYellowMat);
      mast1.position.y = 28;
      mast1.castShadow = true;
      crane1Group.add(mast1);

      const cab1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.5, 3.8), craneYellowMat);
      cab1.position.y = 57;
      crane1Group.add(cab1);

      const jib1 = new THREE.Mesh(new THREE.BoxGeometry(44, 1.8, 1.8), craneYellowMat);
      jib1.position.set(16, 58, 0);
      crane1Group.add(jib1);

      const counterJib1 = new THREE.Mesh(new THREE.BoxGeometry(16, 1.8, 1.8), craneYellowMat);
      counterJib1.position.set(-8, 58, 0);
      crane1Group.add(counterJib1);

      const beaconC1 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), warningBeaconMat);
      beaconC1.position.set(36, 59, 0);
      crane1Group.add(beaconC1);

      // Construction Tower Crane 2 (48m, South Work Zone at X: 16, Z: 18)
      const crane2Group = new THREE.Group();
      crane2Group.position.set(16, 0, 18);
      scotiaGroup.add(crane2Group);

      const mast2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 48, 2.2), craneYellowMat);
      mast2.position.y = 24;
      mast2.castShadow = true;
      crane2Group.add(mast2);

      const cab2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 3.5), craneYellowMat);
      cab2.position.y = 49;
      crane2Group.add(cab2);

      const jib2 = new THREE.Mesh(new THREE.BoxGeometry(38, 1.6, 1.6), craneYellowMat);
      jib2.position.set(-14, 50, 0);
      crane2Group.add(jib2);

      const beaconC2 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), warningBeaconMat);
      beaconC2.position.set(-31, 51, 0);
      crane2Group.add(beaconC2);

      // Perimeter Construction Hoarding Fence (Safety Barrier)
      const fenceH = 2.8;
      const fenceMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const fenceStripeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

      const fenceNorth = new THREE.Mesh(new THREE.BoxGeometry(68, fenceH, 0.4), fenceMat);
      fenceNorth.position.set(0, fenceH / 2, -38);
      scotiaGroup.add(fenceNorth);

      const fenceSouth = new THREE.Mesh(new THREE.BoxGeometry(68, fenceH, 0.4), fenceMat);
      fenceSouth.position.set(0, fenceH / 2, 38);
      scotiaGroup.add(fenceSouth);

      const fenceWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, fenceH, 76), fenceMat);
      fenceWest.position.set(-34, fenceH / 2, 0);
      scotiaGroup.add(fenceWest);

      const fenceEast = new THREE.Mesh(new THREE.BoxGeometry(0.4, fenceH, 76), fenceMat);
      fenceEast.position.set(34, fenceH / 2, 0);
      scotiaGroup.add(fenceEast);

      // Official Project Site Notice Board
      const projectBillboard = new THREE.Mesh(new THREE.BoxGeometry(18, 4.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));
      projectBillboard.position.set(0, 3.8, 38.6);
      scotiaGroup.add(projectBillboard);

      const bannerText = new THREE.Mesh(new THREE.BoxGeometry(16.5, 3.0, 0.7), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      bannerText.position.set(0, 3.8, 38.8);
      scotiaGroup.add(bannerText);

      // Site Engineering Trailers & Equipment
      const trailer = new THREE.Mesh(new THREE.BoxGeometry(12, 3.4, 4.5), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 }));
      trailer.position.set(24, 1.7, 30);
      scotiaGroup.add(trailer);

      registerCityCollider({ type: 'solid', x: 85, z: 75, hw: 36, hd: 40, world: 'earth' });

      // ------------------------------------------------------------
      // 7. CALGARY STREET NAMES & PEDESTRIAN IDENTITY
      // ------------------------------------------------------------
      const calgarySigns = [
        { name: 'CENTRE ST S / 9 AVE SW', x: 0, z: -40, ry: 0 },
        { name: 'STEPHEN AVE WALKWAY', x: 0, z: -60, ry: Math.PI / 2 },
        { name: 'EAST VILLAGE / C-TRAIN WAY', x: 60, z: -50, ry: 0 },
        { name: 'CULTURE & ENTERTAINMENT DISTRICT / SCOTIA PLACE', x: 60, z: 50, ry: 0 }
      ];
      calgarySigns.forEach(s => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.5, 8), steelFrameMat);
        post.position.set(s.x, 2.25, s.z);
        calgaryMetropolisGroup.add(post);

        const board = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 0.12), new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.3 }));
        board.position.set(s.x, 4.2, s.z);
        board.rotation.y = s.ry;
        calgaryMetropolisGroup.add(board);
      });

      console.log('✅ [CALGARY METROPOLIS] Calgary Tower (190m), The Bow (236m), Telus Sky (222m), Brookfield Place (247m), Calgary Central Library (East Village), and Scotia Place active construction site integrated.');
    }


    const CANADIAN_PROVINCES = [
      { id: 'ontario', name: 'Ontario', abbr: 'ON', file: 'Canada/province-ontario.html', icon: 'fa-tower-observation', landmark: 'Cyber CN Tower & Highway 401', desc: 'Heartland of the Great Lakes and Canada\'s economic industrial power.' },
      { id: 'quebec', name: 'Québec', abbr: 'QC', file: 'Canada/province-quebec.html', icon: 'fa-monument', landmark: 'Château Frontenac & St. Lawrence Locks', desc: 'Historic French citadel, hydro-electric super-grid and winter bastion.' },
      { id: 'british-columbia', name: 'British Columbia', abbr: 'BC', file: 'Canada/province-british-columbia.html', icon: 'fa-tree', landmark: 'Lions Gate Bridge & Whistler Peak', desc: 'Pacific cascadia rainforests, mountain ranges and coastal seaplane ports.' },
      { id: 'alberta', name: 'Alberta', abbr: 'AB', file: 'Canada/province-alberta.html', icon: 'fa-fire-flame-curved', landmark: 'Calgary Stampede & Banff Rockies', desc: 'Energy capital, heavy exocraft haulers and high mountain glaciers.' },
      { id: 'manitoba', name: 'Manitoba', abbr: 'MB', file: 'Canada/province-manitoba.html', icon: 'fa-snowflake', landmark: 'The Forks & Esplanade Riel Bridge', desc: 'Gateway to the West, trans-continental rail hub and polar aurora station.' },
      { id: 'saskatchewan', name: 'Saskatchewan', abbr: 'SK', file: 'Canada/province-saskatchewan.html', icon: 'fa-wheat-awn', landmark: 'Wascana Legislative Dome & Potash Wells', desc: 'Land of the living skies, massive solar farms and autonomous agriculture.' },
      { id: 'nova-scotia', name: 'Nova Scotia', abbr: 'NS', file: 'Canada/province-nova-scotia.html', icon: 'fa-anchor', landmark: 'Halifax Star Citadel & Peggy\'s Cove', desc: 'Atlantic maritime naval fortress, historic Bluenose dock and tidal power.' },
      { id: 'new-brunswick', name: 'New Brunswick', abbr: 'NB', file: 'Canada/province-new-brunswick.html', icon: 'fa-water', landmark: 'Hopewell Rocks & Bay of Fundy Tides', desc: 'Appalachian cyber-corridor with the highest tidal surges in the world.' },
      { id: 'newfoundland', name: 'Newfoundland & Labrador', abbr: 'NL', file: 'Canada/province-newfoundland.html', icon: 'fa-tower-broadcast', landmark: 'Signal Hill Marconi Tower & Iceberg Alley', desc: 'First light of North America, transatlantic cables and iceberg interceptors.' },
      { id: 'prince-edward-island', name: 'Prince Edward Island', abbr: 'PE', file: 'Canada/province-prince-edward-island.html', icon: 'fa-bridge-water', landmark: 'Confederation Bridge & Red Sand Cliffs', desc: 'Cradle of Confederation, 13km causeway and coastal red sand dunes.' },
      { id: 'northwest-territories', name: 'Northwest Territories', abbr: 'NT', file: 'Canada/province-northwest-territories.html', icon: 'fa-gem', landmark: 'Diavik Diamond Mine & Slave Lake Ice Road', desc: 'Aurora capital of the Arctic, sub-zero trucking and kimberlite diamonds.' },
      { id: 'yukon', name: 'Yukon Territory', abbr: 'YT', file: 'Canada/province-yukon.html', icon: 'fa-mountain-sun', landmark: 'Klondike Gold Dredge & Mount Logan', desc: 'Historic Klondike gold territory and Canada\'s highest glacial summit.' },
      { id: 'nunavut', name: 'Territory of Nunavut', abbr: 'NU', file: 'Canada/province-nunavut.html', icon: 'fa-cubes-stacked', landmark: 'Giant Neon Inukshuk & Igloo Dome', desc: 'High Arctic sovereignty, endless tundra and aurora-cloaked settlements.' },
      { id: 'national-capital', name: 'National Capital Region', abbr: 'NCR', file: 'Canada/province-national-capital.html', icon: 'fa-landmark-dome', landmark: 'Parliament Peace Tower & Rideau Canal', desc: 'Federal core of Canada, Centennial Flame and national quantum archive.' }
    ];

    let transCanadaGateGroup = null;
    let transCanadaPortalRing = null;
    let transCanadaLight = null;
    let activeProvinceFile = null;

    function buildTransCanadaGateway() {
      transCanadaGateGroup = new THREE.Group();
      transCanadaGateGroup.position.set(0, 0, 560);
      scene.add(transCanadaGateGroup);

      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.85, roughness: 0.25 });
      const redNeonMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
      const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

      // Twin Heavy Support Columns (X = -18, +18)
      [-18, 18].forEach(px => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(5, 28, 5), pillarMat);
        pillar.position.set(px, 14, 0);
        transCanadaGateGroup.add(pillar);

        const neonStripe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 28, 5.2), redNeonMat);
        neonStripe.position.set(px + (px > 0 ? -2.4 : 2.4), 14, 0);
        transCanadaGateGroup.add(neonStripe);
      });

      // Overhead Cantilever Arch Bridge
      const arch = new THREE.Mesh(new THREE.BoxGeometry(42, 4.5, 6), pillarMat);
      arch.position.set(0, 28, 0);
      transCanadaGateGroup.add(arch);

      // Digital Highway LED Sign
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(32, 4, 1.2), new THREE.MeshStandardMaterial({ color: 0x0a1018, metalness: 0.9 }));
      signBoard.position.set(0, 25.5, 3.2);
      transCanadaGateGroup.add(signBoard);

      const signTrim = new THREE.Mesh(new THREE.BoxGeometry(32.4, 0.35, 1.4), cyanMat);
      signTrim.position.set(0, 23.4, 3.2);
      transCanadaGateGroup.add(signTrim);

      // Maple Leaf Crest Emblem at Apex
      const crestMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0xff3366, metalness: 0.9 }));
      crestMesh.rotation.x = Math.PI / 2;
      crestMesh.position.set(0, 31.5, 0);
      transCanadaGateGroup.add(crestMesh);

      // Rotating Trans-Canada Quantum Portal Ring
      const ringGeo = new THREE.TorusGeometry(12, 1.2, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true, transparent: true, opacity: 0.85 });
      transCanadaPortalRing = new THREE.Mesh(ringGeo, ringMat);
      transCanadaPortalRing.position.set(0, 14, 0);
      transCanadaGateGroup.add(transCanadaPortalRing);

      // Highway Portal Illumination
      transCanadaLight = new THREE.PointLight(0xff3366, 3.5, 90);
      transCanadaLight.position.set(0, 16, 6);
      transCanadaGateGroup.add(transCanadaLight);

      // Roadway Speed Decals & Chevrons on Ground
      const roadSlab = new THREE.Mesh(new THREE.PlaneGeometry(28, 120), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 }));
      roadSlab.rotation.x = -Math.PI / 2;
      roadSlab.position.set(0, 0.08, 0);
      transCanadaGateGroup.add(roadSlab);

      for (let s = -3; s <= 3; s++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 8), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.12, s * 16);
        transCanadaGateGroup.add(stripe);
      }

      registerCityCollider({ type: 'solid', x: -18, z: 560, hw: 3.5, hd: 3.5 });
      registerCityCollider({ type: 'solid', x: 18, z: 560, hw: 3.5, hd: 3.5 });
    }

    function toggleProvincesModal(forceOpen) {
      const modal = document.getElementById('modal-provinces-highway');
      if (!modal) return;
      const willShow = (forceOpen !== undefined) ? forceOpen : !modal.classList.contains('visible');
      if (willShow) {
        if (document.exitPointerLock) document.exitPointerLock();
        initProvincesHighwayGrid();
        modal.classList.add('visible');
        if (typeof cyberAudio !== 'undefined' && cyberAudio.playLootChime) cyberAudio.playLootChime();
      } else {
        modal.classList.remove('visible');
      }
    }

    function initProvincesHighwayGrid() {
      const grid = document.getElementById('highway-provinces-grid');
      const tokensEl = document.getElementById('highway-tokens-display');
      const currentTokens = (typeof gameState !== 'undefined' && gameState.tokens) ? gameState.tokens : (parseInt(localStorage.getItem('BS_TOKENS')) || 1250);
      const callsign = (typeof gameState !== 'undefined' && gameState.operativeCallsign) ? gameState.operativeCallsign : (localStorage.getItem('BS_OPERATIVE_CALLSIGN') || 'DEMONALEX');

      if (tokensEl) tokensEl.textContent = Number(currentTokens).toLocaleString();
      if (!grid) return;
      grid.innerHTML = '';

      let stamps = [];
      try { stamps = JSON.parse(localStorage.getItem('BS_PASSPORT_STAMPS') || '[]'); } catch (e) { stamps = []; }

      // Passport Progress Banner
      const passportHeader = document.createElement('div');
      passportHeader.style.gridColumn = '1 / -1';
      passportHeader.style.background = 'rgba(15, 23, 42, 0.95)';
      passportHeader.style.border = '1.5px solid #00f2ff';
      passportHeader.style.borderRadius = '14px';
      passportHeader.style.padding = '14px 20px';
      passportHeader.style.marginBottom = '6px';
      passportHeader.style.display = 'flex';
      passportHeader.style.justifyContent = 'space-between';
      passportHeader.style.alignItems = 'center';
      passportHeader.style.flexWrap = 'wrap';
      passportHeader.style.gap = '10px';

      const allStamped = (stamps.length >= 14);
      const exosuitClaimed = (localStorage.getItem('BS_AURORA_EXOSUIT_UNLOCKED') === 'true');

      passportHeader.innerHTML = `
        <div>
          <div style="font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 900; color: #00f2ff; display: flex; align-items: center; gap: 8px;">
            <i class="fa-brands fa-canadian-maple-leaf" style="color: #ff3366;"></i> CANADIAN EXPLORATION PASSPORT: ${stamps.length} / 14 REALMS DISCOVERED
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">
            Visit each province and territory codex terminal to collect passport stamps and earn NEX tokens.
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          ${allStamped ? `
            <button type="button" onclick="claimExosuitReward()" style="background: linear-gradient(135deg, #ffd700, #ff8800); border: none; border-radius: 8px; color: #05140e; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 900; cursor: pointer; box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);">
              ${exosuitClaimed ? '<i class="fa-solid fa-shield-halved"></i> EXOSUIT ACTIVE' : '<i class="fa-solid fa-trophy"></i> CLAIM AURORA EXOSUIT (+5,000 NEX)'}
            </button>
          ` : `
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 6px 14px; font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 800; color: #ffd700;">
              ${14 - stamps.length} STAMPS REMAINING
            </div>
          `}
        </div>
      `;
      grid.appendChild(passportHeader);

      CANADIAN_PROVINCES.forEach(p => {
        const isStamped = stamps.includes(p.id);
        const card = document.createElement('div');
        card.className = 'prov-card';
        card.innerHTML = `
          <div class="prov-card-header">
            <span class="prov-card-title"><i class="fa-solid ${p.icon}" style="color: #ff3366;"></i> ${p.name}</span>
            <span class="prov-card-abbr">${p.abbr} ${isStamped ? '<i class="fa-solid fa-stamp" style="color: #ffd700; margin-left: 4px;" title="Passport Stamped"></i>' : ''}</span>
          </div>
          <div class="prov-card-landmark"><i class="fa-solid fa-monument"></i> ${p.landmark}</div>
          <div class="prov-card-desc">${p.desc}</div>
          <div class="prov-card-actions">
            <button type="button" class="prov-btn-load" onclick="loadProvinceTag('${p.file}', '${p.name}')" title="Load directly in game viewport">
              <i class="fa-solid fa-laptop-code"></i> IN-GAME TAG
            </button>
            <a class="prov-btn-direct" href="${p.file}?tokens=${currentTokens}&callsign=${encodeURIComponent(callsign)}" title="Launch Fullscreen 3D World">
              <i class="fa-solid fa-rocket"></i> LAUNCH 3D
            </a>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    
    function claimExosuitReward() {
      if (localStorage.getItem('BS_AURORA_EXOSUIT_UNLOCKED') === 'true') {
        showStoreNotification('✨ AURORA BOREALIS QUANTUM EXOSUIT IS ALREADY EQUIPPED AND ACTIVE!');
        return;
      }
      localStorage.setItem('BS_AURORA_EXOSUIT_UNLOCKED', 'true');
      gameState.tokens = (gameState.tokens || 1250) + 5000;
      localStorage.setItem('BS_TOKENS', gameState.tokens.toString());
      const tEl = document.getElementById('hud-tokens');
      if (tEl) tEl.textContent = gameState.tokens.toLocaleString();
      showStoreNotification('🏆 CONGRATULATIONS! AURORA BOREALIS QUANTUM EXOSUIT UNLOCKED (+5,000 NEX)!');
      if (cyberAudio && cyberAudio.playLootChime) cyberAudio.playLootChime();
      initProvincesHighwayGrid();
    }

    function loadProvinceTag(file, name) {
      activeProvinceFile = file;
      const overlay = document.getElementById('province-loader-overlay');
      const frame = document.getElementById('province-viewport-frame');
      const titleEl = document.getElementById('province-loader-title');
      const currentTokens = (typeof gameState !== 'undefined' && gameState.tokens) ? gameState.tokens : (parseInt(localStorage.getItem('BS_TOKENS')) || 1250);
      const callsign = (typeof gameState !== 'undefined' && gameState.operativeCallsign) ? gameState.operativeCallsign : (localStorage.getItem('BS_OPERATIVE_CALLSIGN') || 'DEMONALEX');

      if (document.exitPointerLock) document.exitPointerLock();
      toggleProvincesModal(false);

      if (titleEl) titleEl.textContent = `PROVINCE // ${name.toUpperCase()}`;
      if (frame) {
        frame.src = `${file}?tokens=${currentTokens}&callsign=${encodeURIComponent(callsign)}`;
      }
      if (overlay) overlay.classList.add('active');

      if (typeof showStoreNotification === 'function') {
        showStoreNotification(`🍁 TRANS-CANADA HIGHWAY: CONNECTED TO ${name.toUpperCase()}!`);
      }
    }

    function closeProvinceLoader() {
      const overlay = document.getElementById('province-loader-overlay');
      const frame = document.getElementById('province-viewport-frame');
      if (overlay) overlay.classList.remove('active');
      if (frame) frame.src = 'about:blank';

      // Sync tokens that might have been earned inside the province
      const savedTokens = parseInt(localStorage.getItem('BS_TOKENS'));
      if (savedTokens && typeof gameState !== 'undefined') {
        gameState.tokens = Math.max(gameState.tokens || 0, savedTokens);
        const tEl = document.getElementById('hud-tokens');
        if (tEl) tEl.textContent = gameState.tokens.toLocaleString();
        const lNex = document.getElementById('lobby-currency-nex');
        if (lNex) lNex.textContent = gameState.tokens.toLocaleString();
        const sEl = document.getElementById('store-token-display');
        if (sEl) sEl.textContent = gameState.tokens.toLocaleString();
      }
    }

    function reloadProvinceFrame() {
      const frame = document.getElementById('province-viewport-frame');
      if (frame && activeProvinceFile) {
        const currentTokens = (typeof gameState !== 'undefined' && gameState.tokens) ? gameState.tokens : (parseInt(localStorage.getItem('BS_TOKENS')) || 1250);
        const callsign = (typeof gameState !== 'undefined' && gameState.operativeCallsign) ? gameState.operativeCallsign : (localStorage.getItem('BS_OPERATIVE_CALLSIGN') || 'DEMONALEX');
        frame.src = `${activeProvinceFile}?tokens=${currentTokens}&callsign=${encodeURIComponent(callsign)}`;
      }
    }

    function openProvinceNewTab() {
      if (activeProvinceFile) {
        const currentTokens = (typeof gameState !== 'undefined' && gameState.tokens) ? gameState.tokens : (parseInt(localStorage.getItem('BS_TOKENS')) || 1250);
        const callsign = (typeof gameState !== 'undefined' && gameState.operativeCallsign) ? gameState.operativeCallsign : (localStorage.getItem('BS_OPERATIVE_CALLSIGN') || 'DEMONALEX');
        window.open(`${activeProvinceFile}?tokens=${currentTokens}&callsign=${encodeURIComponent(callsign)}`, '_blank');
      }
    }

    // ============================================================
    // AIRCRAFT PILOTING & FLIGHT CONTROLLER
    // ============================================================
    let activeNearPlane = null;

    function boardTargetPlane() {
      if (!activeNearPlane) return;
      executePlaneFlightEntry(activeNearPlane);
    }

    function executePlaneFlightEntry(planeData) {
      activePilotPlane = planeData;
      gameState.inPlane = true;
      gameState.flightMode = 'plane';
      gameState.plane.isPiloted = true;
      gameState.plane.id = planeData.id;
      gameState.plane.name = planeData.name;
      gameState.plane.throttle = 0;
      gameState.plane.speed = 0;
      gameState.plane.pitch = 0;
      gameState.plane.roll = 0;
      gameState.plane.yaw = planeData.mesh.rotation.y;
      gameState.plane.altitude = planeData.mesh.position.y;
      gameState.plane.gearDown = true;
      gameState.plane.mesh = planeData.mesh;

      const hud = document.getElementById('plane-flight-hud');
      if (hud) hud.style.display = 'block';

      const callsignEl = document.getElementById('plane-hud-callsign');
      if (callsignEl) callsignEl.textContent = planeData.name;

      cyberAudio.playLootChime();
      showStoreNotification(`✈️ PILOTING ${planeData.name}! PRESS [W] TO ADVANCE THROTTLE!`);
    }

    function executePlaneFlightExit() {
      if (!gameState.inPlane || !activePilotPlane) return;
      const planePos = activePilotPlane.mesh.position.clone();
      const isHighAltitude = planePos.y > 15;

      gameState.inPlane = false;
      gameState.flightMode = 'none';
      gameState.plane.isPiloted = false;

      const hud = document.getElementById('plane-flight-hud');
      if (hud) hud.style.display = 'none';

      if (isHighAltitude) {
        player.pos.set(planePos.x + 8, planePos.y - 2, planePos.z + 8);
        player.vel.set(0, -2.5, 0);
        showStoreNotification('🪂 EMERGENCY EJECTION! PARACHUTE DEPLOYED — GLIDING TO SURFACE!');
        cyberAudio.playAirVent();
      } else {
        player.pos.set(planePos.x + 4, Math.max(1.2, planePos.y), planePos.z + 4);
        player.vel.set(0, 0, 0);
        showStoreNotification(`DISEMBARKED FROM ${activePilotPlane.name}.`);
        cyberAudio.playClick();
      }
      activePilotPlane = null;
    }

    function togglePlaneGear() {
      if (!gameState.inPlane) return;
      gameState.plane.gearDown = !gameState.plane.gearDown;
      const gearEl = document.getElementById('plane-hud-gear');
      if (gearEl) {
        if (gameState.plane.gearDown) {
          gearEl.textContent = 'GEAR: DOWN [G]';
          gearEl.style.color = '#00ff88';
          gearEl.style.borderColor = '#00ff88';
        } else {
          gearEl.textContent = 'GEAR: UP [G]';
          gearEl.style.color = '#ffaa00';
          gearEl.style.borderColor = '#ffaa00';
        }
      }
      cyberAudio.playClick();
    }

    // ============================================================
    // METRO MAGLEV TRAIN BOARDING & PASSENGER TOUR
    // ============================================================
    function boardMaglevTrain() {
      if (gameState.inTrain) return;
      gameState.inTrain = true;
      const hud = document.getElementById('train-passenger-hud');
      if (hud) hud.style.display = 'flex';
      showStoreNotification('🚆 BOARDED METRO MAGLEV EXPRESS! ENJOYING ELEVATED CITY SKYLINE TOUR!');
      cyberAudio.playMaglevTrainSound();
    }

    function exitMaglevTrain() {
      if (!gameState.inTrain) return;
      gameState.inTrain = false;
      const hud = document.getElementById('train-passenger-hud');
      if (hud) hud.style.display = 'none';

      if (maglevTrainMesh) {
        const tPos = maglevTrainMesh.position.clone();
        player.pos.set(tPos.x - 3.5, 7.5, tPos.z);
        player.vel.set(0, 0, 0);
      }
      showStoreNotification('DISEMBARKED FROM METRO MAGLEV EXPRESS.');
      cyberAudio.playClick();
    }

    // ============================================================
    // CITY LIVELINESS: ELEVATORS, SPINNERS & CYBER-TREES
    // ============================================================
    function buildCityLivelinessElements() {
      const liveGroup = new THREE.Group();
      scene.add(liveGroup);

      const chromeMat = new THREE.MeshStandardMaterial({ color: 0x8294a6, roughness: 0.2, metalness: 0.9 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.42, roughness: 0.1, metalness: 0.8 });
      const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

      // 1. Exterior Glass Skyscraper Elevators (4 Primary Landmarks)
      const elevatorLocations = [
        { x: -68, z: -68, minY: 4, maxY: 110, speed: 0.9, offset: 0 },
        { x: 68, z: -68, minY: 4, maxY: 125, speed: 1.1, offset: 1.8 },
        { x: -68, z: 68, minY: 4, maxY: 95, speed: 0.85, offset: 3.4 },
        { x: 68, z: 68, minY: 4, maxY: 130, speed: 1.2, offset: 4.9 }
      ];

      elevatorLocations.forEach(loc => {
        // Vertical exterior guide rail track
        const trackGeo = new THREE.BoxGeometry(0.8, loc.maxY - loc.minY + 12, 0.8);
        const track = new THREE.Mesh(trackGeo, chromeMat);
        track.position.set(loc.x, (loc.minY + loc.maxY) / 2, loc.z);
        liveGroup.add(track);

        // Moving Glass Elevator Cab
        const cab = new THREE.Group();
        cab.position.set(loc.x, loc.minY, loc.z);

        const cabFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.8, 3.6), glassMat);
        cab.add(cabFrame);

        const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 3.8), chromeMat);
        cabRoof.position.y = 1.9;
        cab.add(cabRoof);

        const cabFloor = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 3.8), chromeMat);
        cabFloor.position.y = -1.9;
        cab.add(cabFloor);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), yellowMat);
        beacon.position.set(0, -2.1, 1.8);
        cab.add(beacon);

        liveGroup.add(cab);

        cityElevators.push({
          mesh: cab,
          minY: loc.minY,
          maxY: loc.maxY,
          speed: loc.speed,
          offset: loc.offset,
          beacon: beacon
        });
      });

      // 2. Rotating Rooftop Radar Dishes & HVAC Turbines
      const spinnerLocations = [
        { x: -102, y: 135, z: -102, type: 'radar' },
        { x: 102, y: 145, z: -102, type: 'radar' },
        { x: -102, y: 128, z: 102, type: 'turbine' },
        { x: 102, y: 155, z: 102, type: 'radar' },
        { x: -34, y: 115, z: -102, type: 'turbine' },
        { x: 34, y: 120, z: -102, type: 'turbine' },
        { x: -34, y: 110, z: 68, type: 'radar' }
      ];

      spinnerLocations.forEach((s, i) => {
        if (s.type === 'radar') {
          const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 5, 8), chromeMat);
          mast.position.set(s.x, s.y + 2.5, s.z);
          liveGroup.add(mast);

          const dishGroup = new THREE.Group();
          dishGroup.position.set(s.x, s.y + 5.2, s.z);

          const dish = new THREE.Mesh(new THREE.ConeGeometry(2.4, 0.8, 16, 1, true), chromeMat);
          dish.rotation.x = Math.PI / 3;
          dishGroup.add(dish);

          const dishFeed = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), cyanMat);
          dishFeed.position.set(0, 0.4, 0.4);
          dishGroup.add(dishFeed);

          liveGroup.add(dishGroup);
          citySpinners.push({ mesh: dishGroup, speed: 0.8 + (i % 3) * 0.4, axis: 'y' });

        } else {
          // Industrial HVAC Rooftop Turbine
          const housing = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 2.0, 14), chromeMat);
          housing.position.set(s.x, s.y + 1.0, s.z);
          liveGroup.add(housing);

          const blades = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.15, 0.6), chromeMat);
          blades.position.set(s.x, s.y + 2.05, s.z);
          liveGroup.add(blades);

          citySpinners.push({ mesh: blades, speed: 4.5 + (i % 3) * 1.5, axis: 'y' });
        }
      });

      // 3. Holographic Bioluminescent Cyber-Trees along North Promenade
      [-14, 14].forEach(tx => {
        [66, 78, 88].forEach((tz, j) => {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 4.2, 8), chromeMat);
          trunk.position.set(tx, 2.1, tz);
          liveGroup.add(trunk);

          const trunkLine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.8, 0.4), cyanMat);
          trunkLine.position.set(tx, 2.1, tz);
          liveGroup.add(trunkLine);

          const canopyGeo = new THREE.DodecahedronGeometry(1.6, 1);
          const canopyMat = new THREE.MeshStandardMaterial({
            color: j % 2 === 0 ? 0x00f2ff : 0x00ff88,
            transparent: true,
            opacity: 0.68,
            roughness: 0.2,
            metalness: 0.8
          });
          const canopy = new THREE.Mesh(canopyGeo, canopyMat);
          canopy.position.set(tx, 4.8, tz);
          liveGroup.add(canopy);

          citySpinners.push({ mesh: canopy, speed: 0.35, axis: 'y' });
        });
      });
    }

    // ============================================================
    // FOOTSTEP DUST PARTICLE POOL
    // ============================================================
    function initFootstepDustPool() {
      const dustGeo = new THREE.CircleGeometry(0.28, 8);
      const dustMat = new THREE.MeshBasicMaterial({
        color: 0x8fa3b8,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      for (let i = 0; i < 16; i++) {
        const mesh = new THREE.Mesh(dustGeo, dustMat.clone());
        mesh.rotation.x = -Math.PI / 2;
        mesh.visible = false;
        scene.add(mesh);
        footstepDustParticles.push({
          mesh: mesh,
          life: 0,
          maxLife: 0.4
        });
      }
    }

    let lastDustTime = 0;
    function triggerFootstepDust(pos, xOffset) {
      const now = performance.now();
      if (now - lastDustTime < 180) return;
      lastDustTime = now;

      const p = footstepDustParticles.find(d => d.life <= 0);
      if (!p) return;

      p.mesh.position.set(pos.x + xOffset, 0.04, pos.z);
      p.mesh.scale.set(0.2, 0.2, 0.2);
      p.mesh.material.opacity = 0.55;
      p.mesh.visible = true;
      p.life = p.maxLife;
    }

    function updateFootstepDust(dt) {
      footstepDustParticles.forEach(p => {
        if (p.life > 0) {
          p.life -= dt;
          const prog = 1 - (p.life / p.maxLife);
          const s = 0.2 + prog * 0.65;
          p.mesh.scale.set(s, s, s);
          p.mesh.material.opacity = (1 - prog) * 0.55;
          if (p.life <= 0) p.mesh.visible = false;
        }
      });
    }

    // ============================================================
    // MALL & STORE PROXIMITY DETECTION
    // ============================================================
    function checkMallStoreProximity() {
      if (!player.pos) return;

      const stores = [
        { id: 'armory', title: 'CYBER-ARMORY', prompt: '[E] / [TAP] BROWSE WEAPONS & AMMO', x: -20, z: 110, r: 6.0 },
        { id: 'suits', title: 'EXO-SUITS ATELIER', prompt: '[E] / [TAP] CUSTOMIZE SUIT CAMO', x: 20, z: 110, r: 6.0 },
        { id: 'vehicles', title: 'HYPERION MOTORS', prompt: '[E] / [TAP] VIEW VEHICLE SHOWROOM', x: -20, z: 135, r: 6.0 },
        { id: 'medbay', title: 'BIO-STIM MED-BAY', prompt: '[E] / [TAP] RECHARGE VITALS & SHIELD', x: 20, z: 135, r: 6.0 },
        { id: 'arcade', title: 'STARDUST CAFE & ARCADE', prompt: '[E] / [TAP] PLAY ARCADE & CHILL', x: 0, z: 146, r: 6.0 },
        { id: 'jetpack', title: 'AERO-TECH JETPACK LAB', prompt: '[E] / [TAP] UPGRADE JETPACK BATTERIES', x: 0, z: 100, r: 7.0 },
        { id: 'armory', title: 'NEXUS GRAND MALL', prompt: '[E] / [TAP] ENTER SHOPPING MALL', x: 0, z: 92, r: 7.0 }
      ];

      let nearest = null;
      let minDist = 999;
      stores.forEach(s => {
        const dx = player.pos.x - s.x;
        const dz = player.pos.z - s.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < s.r && d < minDist) {
          minDist = d;
          nearest = s;
        }
      });

      const promptEl = document.getElementById('store-interact-prompt');
      const titleEl = document.getElementById('store-prompt-title');

      if (nearest) {
        nearbyStoreAction = nearest;
        if (promptEl) {
          promptEl.style.display = 'flex';
          if (titleEl) titleEl.textContent = nearest.title;
          const subEl = promptEl.querySelector('.store-prompt-sub');
          if (subEl) subEl.textContent = nearest.prompt;
        }

        // Med-Bay walk-in auto-healing ring
        if (nearest.id === 'medbay' && minDist < 3.2) {
          if (gameState.health < 100 || gameState.shield < 100) {
            gameState.health = Math.min(100, (gameState.health || 100) + 0.35);
            gameState.shield = Math.min(100, (gameState.shield || 100) + 0.35);
            const hpBar = document.getElementById('hud-hp-bar');
            const hpVal = document.getElementById('hud-hp-val');
            const shBar = document.getElementById('hud-shield-bar');
            const shVal = document.getElementById('hud-shield-val');
            if (hpBar) hpBar.style.width = gameState.health + '%';
            if (hpVal) hpVal.textContent = Math.round(gameState.health);
            if (shBar) shBar.style.width = gameState.shield + '%';
            if (shVal) shVal.textContent = Math.round(gameState.shield);
          }
        }

        // Open on key E
        if (keys['KeyE'] || keys['Keye'] || keys['e'] || keys['E']) {
          keys['KeyE'] = false;
          keys['Keye'] = false;
          keys['e'] = false;
          keys['E'] = false;
          toggleStoreModal(true, nearest.id);
        }

      } else {
        nearbyStoreAction = null;
        if (promptEl) promptEl.style.display = 'none';
      }
    }

    let mechazillaChopsticks = null;
    let cityCitizens = [];
