// js/game_military_aviation.js
// NEXUS MILITARY & NAVAL AVIATION EXPANSION ENGINE
// Canadian Armed Forces Base, HMCS Calgary Aircraft Carrier (CVN-88),
// Sky Fighter Jet Cockpit View, Police Cruisers, and Cybersecurity HQ

(function(window) {
  'use strict';

  // Global registries for military and aviation assets
  window.militaryAviationState = {
    isEnlisted: false,
    lastSalaryClaim: 0,
    salaryCad: 10000,
    fighterJets: [],
    patrolJets: [],
    policeCruisers: [],
    carrierCatapultReady: true,
    cockpitViewActive: false
  };

  // ============================================================
  // 1. HMCS CALGARY (CVN-88) AIRCRAFT CARRIER
  // ============================================================
  function buildAircraftCarrierHMCSCalgary() {
    if (typeof scene === 'undefined' || !scene) return;

    const carrierGroup = new THREE.Group();
    carrierGroup.position.set(-340, 1.2, 340);
    scene.add(carrierGroup);

    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1a2330, roughness: 0.8, metalness: 0.35 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x0f1520, roughness: 0.92, metalness: 0.2 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
    const waterBayMat = new THREE.MeshStandardMaterial({ color: 0x09263f, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.88 });

    // Harbor Water Basin (380m x 260m)
    const harborWater = new THREE.Mesh(new THREE.PlaneGeometry(420, 320), waterBayMat);
    harborWater.rotation.x = -Math.PI / 2;
    harborWater.position.set(0, -0.6, 0);
    carrierGroup.add(harborWater);

    // Main Carrier Hull (280m long, 55m beam, 16m draft)
    const hullLength = 260, hullWidth = 52, hullHeight = 12;
    const hullGeo = new THREE.BoxGeometry(hullWidth, hullHeight, hullLength);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = hullHeight / 2 - 2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    carrierGroup.add(hull);

    // Bow Tapering (Angled prow)
    const bowGeo = new THREE.ConeGeometry(hullWidth * 0.55, 45, 4);
    const bowMesh = new THREE.Mesh(bowGeo, hullMat);
    bowMesh.rotation.x = -Math.PI / 2;
    bowMesh.rotation.y = Math.PI / 4;
    bowMesh.position.set(0, hullHeight / 2 - 2, -(hullLength / 2 + 20));
    carrierGroup.add(bowMesh);

    // Main Flight Deck Surface (Y = 10.2)
    const deckGeo = new THREE.BoxGeometry(hullWidth + 14, 1.2, hullLength + 35);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = hullHeight + 0.6;
    deck.receiveShadow = true;
    carrierGroup.add(deck);

    // Angled Landing Runway Markings (Centerline & Dashes)
    const runwayZLen = hullLength + 20;
    for (let rz = -runwayZLen / 2 + 15; rz <= runwayZLen / 2 - 15; rz += 18) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 10), yellowLineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.rotation.z = 0.12; // 7-degree angled deck
      dash.position.set(-6 + (rz * 0.12), hullHeight + 1.25, rz);
      carrierGroup.add(dash);
    }

    // Catapult 1 & 2 Tracks (Bow Catapults)
    [-12, 8].forEach(cx => {
      const cTrack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 95), steelMat);
      cTrack.position.set(cx, hullHeight + 1.25, -55);
      carrierGroup.add(cTrack);

      const blastDeflector = new THREE.Mesh(new THREE.BoxGeometry(10, 3.5, 0.8), steelMat);
      blastDeflector.rotation.x = -0.4;
      blastDeflector.position.set(cx, hullHeight + 2.5, -5);
      carrierGroup.add(blastDeflector);
    });

    // 4 Arresting Wires (Cross-deck cables for carrier trap landings)
    for (let w = 0; w < 4; w++) {
      const wire = new THREE.Mesh(new THREE.BoxGeometry(32, 0.2, 0.2), steelMat);
      wire.position.set(-6, hullHeight + 1.35, 65 + (w * 10));
      carrierGroup.add(wire);
    }

    // Island Superstructure (Starboard / Right Side Command Tower)
    const island = new THREE.Group();
    island.position.set(hullWidth / 2 - 2, hullHeight + 1.2, -15);

    const islandBase = new THREE.Mesh(new THREE.BoxGeometry(12, 18, 38), steelMat);
    islandBase.position.y = 9;
    islandBase.castShadow = true;
    island.add(islandBase);

    // Flight Ops Bridge Windows (Panoramic Green Glass)
    const bridgeGlass = new THREE.Mesh(new THREE.BoxGeometry(12.4, 2.8, 16), new THREE.MeshStandardMaterial({
      color: 0x00f2ff,
      emissive: 0x00f2ff,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.85
    }));
    bridgeGlass.position.set(0, 16.5, -8);
    island.add(bridgeGlass);

    // Radar Mast & Rotating Air-Search Scanner
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 22, 8), steelMat);
    mast.position.set(0, 26, 0);
    island.add(mast);

    const radarBar = new THREE.Mesh(new THREE.BoxGeometry(9, 1.8, 0.8), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    radarBar.position.set(0, 34, 0);
    island.add(radarBar);
    carrierGroup._radarBar = radarBar;

    // Carrier Number Billboard "CVN-88 // HMCS CALGARY"
    const cvnSign = createMilitaryBannerTexture('HMCS CALGARY // CVN-88', 'ROYAL CANADIAN NAVY // PACIFIC TASKFORCE');
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(24, 7), new THREE.MeshBasicMaterial({ map: cvnSign, transparent: true }));
    signMesh.rotation.y = Math.PI / 2;
    signMesh.position.set(6.2, 12, 0);
    island.add(signMesh);

    carrierGroup.add(island);

    // Parked Naval Sky Fighter Jet on Catapult 1 (Ready to board!)
    const navalJet = buildNavalFighterJetMesh();
    navalJet.position.set(-12, hullHeight + 2.2, -8);
    carrierGroup.add(navalJet);
    carrierGroup._navalJet = navalJet;

    // Register into global airportPlanes array for flight physics, avionics, and HUD
    const carrierJetData = {
      id: 'f99_naval',
      name: 'CF-188 NAVAL GHOST JET',
      mesh: navalJet,
      maxSpeed: 82.0,
      takeoffSpeed: 18.0,
      pitchRate: 1.6,
      rollRate: 2.4,
      yawRate: 1.1,
      hasAfterburner: true,
      isVTOL: false
    };
    if (typeof airportPlanes !== 'undefined' && Array.isArray(airportPlanes)) {
      airportPlanes.push(carrierJetData);
    }
    window.carrierFighterJetData = carrierJetData;

    // Interactive Boarding Zone on Carrier Deck
    if (typeof registerCityCollider === 'function') {
      registerCityCollider({
        x: carrierGroup.position.x - 12,
        z: carrierGroup.position.z - 8,
        hw: 8, hd: 8, world: 'earth',
        isTrigger: true,
        type: 'aircraft_carrier_jet'
      });
    }

    console.log('✅ [CANADIAN FORCES] HMCS Calgary (CVN-88) Aircraft Carrier deployed at Deepwater Harbor.');
  }

  // Helper: Build a sleek Canadian CF-188 / F-99 Ghost Naval Fighter Jet
  function buildNavalFighterJetMesh() {
    const jet = new THREE.Group();
    const camoMat = new THREE.MeshStandardMaterial({ color: 0x222c38, roughness: 0.45, metalness: 0.85 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });
    const engineGlow = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

    // Fuselage
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 16), camoMat);
    fuselage.castShadow = true;
    jet.add(fuselage);

    // Nose Cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4.5, 8), camoMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0, -10.2);
    jet.add(nose);

    // Cockpit Bubble
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), canopyMat);
    canopy.scale.set(0.9, 0.9, 2.2);
    canopy.position.set(0, 0.95, -4.5);
    jet.add(canopy);

    // Swept Delta Wings
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.18, 5.5), camoMat);
    wingL.position.set(-4.2, 0, 1.5);
    wingL.rotation.y = -0.35;
    jet.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.18, 5.5), camoMat);
    wingR.position.set(4.2, 0, 1.5);
    wingR.rotation.y = 0.35;
    jet.add(wingR);

    // Twin Canted Vertical Stabilizers
    [-1.2, 1.2].forEach(tx => {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 2.6), camoMat);
      tail.position.set(tx, 1.8, 6.2);
      tail.rotation.z = (tx < 0 ? -0.22 : 0.22);
      jet.add(tail);
    });

    // Twin Afterburner Nozzles
    [-0.65, 0.65].forEach(ex => {
      const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 1.2, 12), engineGlow);
      noz.rotation.x = Math.PI / 2;
      noz.position.set(ex, 0, 8.2);
      jet.add(noz);
    });

    return jet;
  }

  // ============================================================
  // 2. CFB CALGARY CANADIAN MILITARY BASE (NOW HIRING $10,000 CAD)
  // ============================================================
  function buildCanadianMilitaryBase() {
    if (typeof scene === 'undefined' || !scene) return;

    const baseGroup = new THREE.Group();
    baseGroup.position.set(-230, 0, 160);
    scene.add(baseGroup);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1b232c, roughness: 0.9, metalness: 0.2 });
    const camoMat = new THREE.MeshStandardMaterial({ color: 0x273526, roughness: 0.8, metalness: 0.3 }); // CADPAT Green
    const redMapleMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });

    // Perimeter Security Blast Walls
    const wallLen = 140, wallWid = 110;
    const wallH = 5.5;

    // West Wall
    const wWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, wallH, wallWid), wallMat);
    wWall.position.set(-wallLen / 2, wallH / 2, 0);
    baseGroup.add(wWall);

    // East Wall
    const eWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, wallH, wallWid), wallMat);
    eWall.position.set(wallLen / 2, wallH / 2, 0);
    baseGroup.add(eWall);

    // North Wall with Guard Gate Opening
    const nWall1 = new THREE.Mesh(new THREE.BoxGeometry((wallLen - 24) / 2, wallH, 1.6), wallMat);
    nWall1.position.set(-wallLen / 4 - 6, wallH / 2, -wallWid / 2);
    baseGroup.add(nWall1);

    const nWall2 = new THREE.Mesh(new THREE.BoxGeometry((wallLen - 24) / 2, wallH, 1.6), wallMat);
    nWall2.position.set(wallLen / 4 + 6, wallH / 2, -wallWid / 2);
    baseGroup.add(nWall2);

    // Guard Gate Checkpoint Barrier
    const gateArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 14, 8), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
    gateArm.rotation.z = Math.PI / 2;
    gateArm.position.set(0, 1.2, -wallWid / 2);
    baseGroup.add(gateArm);

    // 4 Corner Guard Watchtowers with Searchlights
    [
      [-wallLen / 2, -wallWid / 2],
      [wallLen / 2, -wallWid / 2],
      [-wallLen / 2, wallWid / 2],
      [wallLen / 2, wallWid / 2]
    ].forEach(([tx, tz]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, 14, 8), wallMat);
      tower.position.set(tx, 7, tz);
      baseGroup.add(tower);

      const lightHead = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), goldMat);
      lightHead.position.set(tx, 14.5, tz);
      baseGroup.add(lightHead);
    });

    // 2 Aircraft / Combat Vehicle Hangars
    [-30, 30].forEach(hx => {
      const hangar = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 55, 16, 1, false, 0, Math.PI), camoMat);
      hangar.rotation.x = Math.PI / 2;
      hangar.position.set(hx, 0, 15);
      baseGroup.add(hangar);
    });

    // Canadian Armored Combat Vehicle (LAV 6.0 8x8)
    const lav = buildCanadianLAVVehicle();
    lav.position.set(0, 1.2, 15);
    baseGroup.add(lav);

    // ============================================================
    // GIANT HOLOGRAPHIC RECRUITMENT BILLBOARD ($10,000 CAD WEEKLY)
    // ============================================================
    const recruitTex = createMilitaryRecruitBanner();
    const recruitBanner = new THREE.Mesh(new THREE.PlaneGeometry(36, 12), new THREE.MeshBasicMaterial({
      map: recruitTex,
      transparent: true,
      side: THREE.DoubleSide
    }));
    recruitBanner.position.set(0, 11, -wallWid / 2 - 2);
    baseGroup.add(recruitBanner);

    // Interactive Enlistment Kiosk Terminal at Gate Entrance
    const kioskGroup = new THREE.Group();
    kioskGroup.position.set(0, 0, -wallWid / 2 + 10);

    const kioskBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 2.4, 8), steelMat);
    kioskBase.position.y = 1.2;
    kioskGroup.add(kioskBase);

    const hologramScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      emissive: 0x00f2ff,
      side: THREE.DoubleSide
    }));
    hologramScreen.position.set(0, 2.6, 0.4);
    kioskGroup.add(hologramScreen);

    // 3D Canadian Maple Leaf Crest above kiosk
    const mapleLeaf = createMapleLeafMesh();
    mapleLeaf.position.set(0, 3.8, 0);
    mapleLeaf.scale.set(0.6, 0.6, 0.6);
    kioskGroup.add(mapleLeaf);
    baseGroup._kioskLeaf = mapleLeaf;

    baseGroup.add(kioskGroup);

    // Register trigger collider for Enlistment Interaction
    if (typeof registerCityCollider === 'function') {
      registerCityCollider({
        x: baseGroup.position.x,
        z: baseGroup.position.z - wallWid / 2 + 10,
        hw: 6, hd: 6, world: 'earth',
        isTrigger: true,
        type: 'military_enlist_terminal'
      });
    }

    console.log('✅ [CANADIAN FORCES] CFB Calgary Military Recruitment Base established ($10,000 CAD Weekly Pay).');
  }

  // Build Canadian Armed Forces LAV 6.0 Combat Vehicle
  function buildCanadianLAVVehicle() {
    const lav = new THREE.Group();
    const cadpatMat = new THREE.MeshStandardMaterial({ color: 0x223020, roughness: 0.7, metalness: 0.3 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0a0d11, roughness: 0.95 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 9.5), cadpatMat);
    body.position.y = 1.6;
    lav.add(body);

    // Turret & 25mm Bushmaster Autocannon
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 1.4, 8), cadpatMat);
    turret.position.set(0, 3.2, 0.5);
    lav.add(turret);

    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 5.5, 8), new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.9 }));
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(0, 3.4, -3.2);
    lav.add(cannon);

    // 8 All-Terrain Tires
    for (let side = -1; side <= 1; side += 2) {
      for (let ax = 0; ax < 4; ax++) {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.65, 12), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(side * 2.2, 0.7, -3.2 + (ax * 2.1));
        lav.add(tire);
      }
    }

    return lav;
  }

  // Build 3D Red Canadian Maple Leaf Emblem
  function createMapleLeafMesh() {
    const shape = new THREE.Shape();
    // Simplified heraldic maple leaf silhouette
    shape.moveTo(0, 1.8);
    shape.lineTo(0.3, 1.1); shape.lineTo(0.9, 1.4);
    shape.lineTo(0.65, 0.7); shape.lineTo(1.4, 0.6);
    shape.lineTo(0.8, 0.1); shape.lineTo(1.1, -0.4);
    shape.lineTo(0.3, -0.2); shape.lineTo(0.12, -0.9);
    shape.lineTo(-0.12, -0.9); shape.lineTo(-0.3, -0.2);
    shape.lineTo(-1.1, -0.4); shape.lineTo(-0.8, 0.1);
    shape.lineTo(-1.4, 0.6); shape.lineTo(-0.65, 0.7);
    shape.lineTo(-0.9, 1.4); shape.lineTo(-0.3, 1.1);
    shape.closePath();

    const extrudeSettings = { depth: 0.22, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.45, roughness: 0.3 });
    return new THREE.Mesh(geo, mat);
  }

  // ============================================================
  // 3. CANADIAN CENTRE FOR CYBER SECURITY HEADQUARTERS
  // ============================================================
  function buildCyberSecurityHeadquarters() {
    if (typeof scene === 'undefined' || !scene) return;

    const cseGroup = new THREE.Group();
    cseGroup.position.set(70, 0, -125);
    scene.add(cseGroup);

    const cyberBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0a1626,
      emissive: 0x00f2ff,
      emissiveIntensity: 0.18,
      roughness: 0.12,
      metalness: 0.92
    });
    const glassCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00f2ff,
      emissive: 0x00f2ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.75,
      roughness: 0.08
    });
    const steelTrim = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });

    // Hexagonal Fortress Podium Base (38m diameter, 14m high)
    const baseTower = new THREE.Mesh(new THREE.CylinderGeometry(24, 28, 16, 6), cyberBlueMat);
    baseTower.position.y = 8;
    baseTower.castShadow = true;
    baseTower.receiveShadow = true;
    cseGroup.add(baseTower);

    // Main 110-meter Hexagonal Quantum Cyber Spire
    const mainSpire = new THREE.Mesh(new THREE.CylinderGeometry(15, 22, 95, 6), cyberBlueMat);
    mainSpire.position.y = 16 + 47.5;
    mainSpire.castShadow = true;
    cseGroup.add(mainSpire);

    // Vertical Quantum Data Channels (Glowing Blue Fibre Beams)
    for (let c = 0; c < 6; c++) {
      const ang = (c / 6) * Math.PI * 2;
      const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 92, 0.8), glassCyanMat);
      conduit.position.set(Math.cos(ang) * 18.2, 63, Math.sin(ang) * 18.2);
      cseGroup.add(conduit);
    }

    // Revolving Cyber Shield Crest on Entrance Portal
    const shieldTex = createMilitaryBannerTexture('CANADIAN CENTRE FOR CYBER SECURITY', 'COMMUNICATIONS SECURITY ESTABLISHMENT // TOP SECRET CLEARANCE');
    const shieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), new THREE.MeshBasicMaterial({ map: shieldTex, transparent: true }));
    shieldMesh.position.set(0, 10.5, 27);
    cseGroup.add(shieldMesh);

    // Rooftop Satellite Uplink Radomes (Crypto Satellite Uplink)
    [
      [-8, -6], [8, -6], [0, 8]
    ].forEach(([dx, dz]) => {
      const radome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 12), steelTrim);
      radome.position.set(dx, 114, dz);
      cseGroup.add(radome);
    });

    console.log('✅ [CANADIAN CYBERSECURITY] CCCS / CSE Cyber Command Citadel deployed.');
  }

  // ============================================================
  // 4. AIR-DEFENSE SKY FIGHTER PATROLS & POLICE CRUISERS
  // ============================================================
  function initMilitaryAviationPatrols() {
    if (typeof scene === 'undefined' || !scene) return;

    // 3 Sky Fighter Jets in arrowhead tactical patrol formation (Alt: 160m)
    const patrolGroup = new THREE.Group();
    scene.add(patrolGroup);

    const f1 = buildNavalFighterJetMesh();
    const f2 = buildNavalFighterJetMesh();
    const f3 = buildNavalFighterJetMesh();

    f1.position.set(0, 160, 0);
    f2.position.set(-18, 158, 22);
    f3.position.set(18, 162, 22);

    patrolGroup.add(f1);
    patrolGroup.add(f2);
    patrolGroup.add(f3);

    window.militaryAviationState.patrolFormation = patrolGroup;
    window.militaryAviationState.patrolAngle = 0;

    // 2 Cyber Police Interceptor Cruisers patrolling outer avenues
    const policeMatWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const policeMatBlack = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.4 });
    const lightRed = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const lightBlue = new THREE.MeshBasicMaterial({ color: 0x0066ff });

    const cruisers = [];
    for (let p = 0; p < 2; p++) {
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 5.2), policeMatWhite);
      body.position.y = 0.8;
      car.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 2.6), policeMatBlack);
      roof.position.set(0, 1.7, -0.2);
      car.add(roof);

      // Lightbar (Red + Blue)
      const barR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.3), lightRed);
      barR.position.set(-0.45, 2.2, -0.2);
      car.add(barR);

      const barB = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.3), lightBlue);
      barB.position.set(0.45, 2.2, -0.2);
      car.add(barB);

      car.position.set(p === 0 ? -68 : 68, 0, p === 0 ? -120 : 120);
      scene.add(car);
      cruisers.push({ mesh: car, dir: (p === 0 ? 1 : -1), speed: 22, barR, barB });
    }
    window.militaryAviationState.policeCruisers = cruisers;
  }

  // Update loops for patrols, cruisers, and fighter jet cockpit HUD
  function updateMilitaryAviation(delta, now) {
    // 1. Rotate Aircraft Carrier Radar and Base Kiosk Crest
    if (typeof scene !== 'undefined' && scene) {
      scene.traverse(obj => {
        if (obj._radarBar) obj._radarBar.rotation.y += delta * 1.8;
        if (obj._kioskLeaf) obj._kioskLeaf.rotation.y += delta * 1.5;
      });
    }

    // 2. Air-Defense Sky Fighter Formation Flight Path (High altitude arrowhead orbit)
    const st = window.militaryAviationState;
    if (st && st.patrolFormation) {
      st.patrolAngle = (st.patrolAngle || 0) + delta * 0.22;
      const r = 520;
      const px = Math.cos(st.patrolAngle) * r;
      const pz = Math.sin(st.patrolAngle) * r;
      st.patrolFormation.position.set(px, 160 + Math.sin(st.patrolAngle * 2) * 15, pz);
      st.patrolFormation.rotation.y = -st.patrolAngle + Math.PI / 2;
    }

    // 3. Police Cruisers Patrol Drive & Strobe Lightbars
    if (st && st.policeCruisers) {
      const flash = Math.sin(now * 0.02) > 0;
      st.policeCruisers.forEach(c => {
        c.mesh.position.z += c.dir * c.speed * delta;
        if (c.mesh.position.z > 320) c.dir = -1;
        if (c.mesh.position.z < -320) c.dir = 1;
        c.mesh.rotation.y = c.dir > 0 ? 0 : Math.PI;

        if (c.barR && c.barB) {
          c.barR.material.color.setHex(flash ? 0xff0033 : 0x220005);
          c.barB.material.color.setHex(flash ? 0x001122 : 0x0066ff);
        }
      });
    }

    // 4. Proximity Check for Enlistment & Carrier Jet Catapult
    checkMilitaryProximity();

    // 5. Plane Cockpit View HUD and Avionics Instruments Update
    ensureCockpitHUDDOM();
    const cockHud = document.getElementById('plane-cockpit-hud');
    if (typeof gameState !== 'undefined' && gameState && gameState.inPlane && gameState.plane) {
      if (st.cockpitViewActive) {
        if (cockHud) cockHud.style.display = 'block';

        const pState = gameState.plane;
        const spdKnots = Math.round(pState.speed * 1.94384);
        const altMeters = Math.round(Math.max(0, (gameState.plane.mesh ? gameState.plane.mesh.position.y : 0)));
        const machVal = (spdKnots / 661.47).toFixed(2);
        const hdgDeg = Math.round(((-pState.yaw * 180 / Math.PI) % 360 + 360) % 360);
        const gForce = (1.0 + Math.abs(pState.roll) * 1.8 + Math.max(-0.8, (pState.vs || 0) * 0.08)).toFixed(1);

        // Update HUD readouts
        const elHdg = document.getElementById('cockpit-hud-heading');
        const elSpd = document.getElementById('cockpit-hud-spd');
        const elMach = document.getElementById('cockpit-hud-mach');
        const elG = document.getElementById('cockpit-hud-g');
        const elAlt = document.getElementById('cockpit-hud-alt');
        const elVs = document.getElementById('cockpit-hud-vs');
        const elLadder = document.getElementById('cockpit-hud-ladder');
        const elThr = document.getElementById('cockpit-hud-thr-val');
        const elAb = document.getElementById('cockpit-hud-ab-status');
        const elRpm = document.getElementById('cockpit-hud-rpm');
        const elEgt = document.getElementById('cockpit-hud-egt');
        const elFuel = document.getElementById('cockpit-hud-fuel');
        const elRadar = document.getElementById('cockpit-radar-sweep');

        if (elHdg) {
          const cardDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
          const card = cardDirs[Math.round(hdgDeg / 45) % 8];
          elHdg.textContent = `HDG ${hdgDeg.toString().padStart(3, '0')}° [${card}]`;
        }
        if (elSpd) elSpd.textContent = spdKnots;
        if (elMach) elMach.textContent = `M ${machVal}`;
        if (elG) elG.textContent = `${gForce} G`;
        if (elAlt) elAlt.textContent = altMeters.toLocaleString();
        if (elVs) {
          const vsVal = pState.vs || 0;
          elVs.textContent = `${vsVal >= 0 ? '+' : ''}${vsVal.toFixed(1)} M/S`;
          elVs.style.color = vsVal >= 0 ? '#00ff88' : '#ffaa00';
        }
        if (elLadder) {
          const degPitch = (pState.pitch || 0) * (180 / Math.PI);
          const degRoll = (pState.roll || 0) * (180 / Math.PI);
          elLadder.style.transform = `rotate(${-degRoll}deg) translateY(${degPitch * 3.5}px)`;
        }
        if (elThr) elThr.textContent = `${Math.round(pState.throttle)}%`;
        if (elAb) {
          elAb.textContent = pState.afterburner ? 'IGNITION [MAX]' : 'STANDBY';
          elAb.style.color = pState.afterburner ? '#ff3366' : '#8fa3b8';
        }
        if (elRpm) elRpm.textContent = `${(60 + (pState.throttle / 100) * 42).toFixed(1)}%`;
        if (elEgt) elEgt.textContent = `${Math.round(420 + (pState.throttle / 100) * 440)} °C`;
        if (elFuel) elFuel.textContent = `${Math.round(1800 + (pState.throttle / 100) * 4200)} PPH`;

        if (elRadar) {
          st._radarAngle = (st._radarAngle || 0) + delta * 140;
          elRadar.style.transform = `rotate(${st._radarAngle}deg)`;
        }
      } else {
        if (cockHud) cockHud.style.display = 'none';
      }
    } else {
      if (cockHud) cockHud.style.display = 'none';
      st.cockpitViewActive = false;
    }
  }

  // ============================================================
  // 5. CANADIAN ENLISTMENT ACTION ($10,000 CAD EVERY WEEK)
  // ============================================================
  function enlistInCanadianForces() {
    if (typeof gameState === 'undefined') return;

    const now = Date.now();
    const st = window.militaryAviationState;

    if (!st.isEnlisted) {
      st.isEnlisted = true;
      st.lastSalaryClaim = now;
      gameState.isMilitaryEnlisted = true;

      // Award $10,000 CAD signing bonus
      gameState.tokens = (gameState.tokens || 1250) + 10000;
      const tEl = document.getElementById('store-token-display');
      if (tEl) tEl.textContent = Number(gameState.tokens).toLocaleString();
      const lNex = document.getElementById('lobby-currency-nex');
      if (lNex) lNex.textContent = Number(gameState.tokens).toLocaleString();

      if (typeof cyberAudio !== 'undefined' && cyberAudio.playLootChime) {
        cyberAudio.playLootChime();
      }

      if (typeof showStoreNotification === 'function') {
        showStoreNotification('🇨🇦 ENLISTED IN CANADIAN FORCES: +$10,000 CAD SIGNING SALARY & MILITARY COMBAT CLEARANCE!');
      }

      // Automatically equip Titan Exo-Rig or Parka
      if (window.HyperRealismEngine && window.HyperRealismEngine.equipGear) {
        window.HyperRealismEngine.equipGear('exosuit');
      }
    } else {
      // Claim Weekly Pay Dispatch ($10,000 CAD)
      const elapsedMs = now - (st.lastSalaryClaim || 0);
      const oneWeekSimMs = 60000; // Simulated 60 seconds = 1 pay cycle for instant fun
      if (elapsedMs >= oneWeekSimMs) {
        st.lastSalaryClaim = now;
        gameState.tokens += 10000;
        const tEl = document.getElementById('store-token-display');
        if (tEl) tEl.textContent = Number(gameState.tokens).toLocaleString();
        if (typeof showStoreNotification === 'function') {
          showStoreNotification('🇨🇦 WEEKLY SALARY DISPATCH RECEIVED: +$10,000 CANADIAN DOLLARS DEPOSITED!');
        }
        if (typeof cyberAudio !== 'undefined' && cyberAudio.playLootChime) cyberAudio.playLootChime();
      } else {
        const secsLeft = Math.ceil((oneWeekSimMs - elapsedMs) / 1000);
        if (typeof showStoreNotification === 'function') {
          showStoreNotification(`🇨🇦 SOLDIER STATUS ACTIVE // NEXT $10,000 CAD PAYCHECK IN: ${secsLeft}S`);
        }
      }
    }
  }

  function checkMilitaryProximity() {
    if (typeof player === 'undefined' || !player || !player.pos) return;
    const px = player.pos.x, pz = player.pos.z;

    // Military Base Terminal (X: -230, Z: 105)
    const distBase = Math.hypot(px - (-230), pz - (105));
    if (distBase < 5.5 && !window._promptEnlistShown) {
      window._promptEnlistShown = true;
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('🇨🇦 [E] INTERACT WITH RECRUITMENT TERMINAL // ENLIST FOR $10,000 CAD SALARY!');
      }
      setTimeout(() => { window._promptEnlistShown = false; }, 8000);
    }

    // Aircraft Carrier Jet Catapult (X: -352, Z: 332)
    const distCarrierJet = Math.hypot(px - (-352), pz - (332));
    if (distCarrierJet < 9.0 && !window._promptCarrierShown && (!gameState || !gameState.inPlane)) {
      window._promptCarrierShown = true;
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('⚓ [E] BOARD CARRIER FIGHTER JET // CATAPULT LAUNCH READY!');
      }
      setTimeout(() => { window._promptCarrierShown = false; }, 8000);
    }
  }

  // Keyboard shortcut listener: Press E near base to enlist or near carrier to launch
  window.addEventListener('keydown', e => {
    if (e.key === 'e' || e.key === 'E') {
      if (typeof player !== 'undefined' && player && player.pos) {
        const distBase = Math.hypot(player.pos.x - (-230), player.pos.z - (105));
        if (distBase < 6.5) {
          enlistInCanadianForces();
          return;
        }

        const distCarrier = Math.hypot(player.pos.x - (-352), player.pos.z - (332));
        if (distCarrier < 12.0 && (!gameState || !gameState.inPlane)) {
          // Board Naval Jet and Catapult Launch
          if (typeof executePlaneFlightEntry === 'function' && window.carrierFighterJetData) {
            executePlaneFlightEntry(window.carrierFighterJetData);
            if (gameState && gameState.plane) {
              gameState.plane.throttle = 100;
              gameState.plane.afterburner = true;
              gameState.plane.speed = 85.0; // Instant catapult boost
              if (typeof showStoreNotification === 'function') {
                showStoreNotification('🚀 STEAM CATAPULT FIRED! HMCS CALGARY LAUNCH // AIRBORNE!');
              }
            }
            return;
          }
        }
      }
    }

    // [V] Key: Toggle Fighter Jet Cockpit View
    if (e.key === 'v' || e.key === 'V') {
      if (typeof gameState !== 'undefined' && gameState && gameState.inPlane) {
        togglePlaneCockpitView();
      }
    }
  });

  // Toggle Fighter Jet Cockpit View
  function togglePlaneCockpitView() {
    const st = window.militaryAviationState;
    st.cockpitViewActive = !st.cockpitViewActive;
    if (typeof showStoreNotification === 'function') {
      showStoreNotification(st.cockpitViewActive ? '✈️ COCKPIT HUD VIEW: ACTIVE [V]' : '✈️ CHASE CAMERA VIEW: ACTIVE [V]');
    }
    const cockHud = document.getElementById('plane-cockpit-hud');
    if (cockHud) {
      cockHud.style.display = st.cockpitViewActive ? 'block' : 'none';
    }
    if (typeof cyberAudio !== 'undefined' && cyberAudio.playClick) cyberAudio.playClick();
  }

  // ============================================================
  // 6. IN-COCKPIT HUD & FLIGHT INSTRUMENT DOM GENERATOR
  // ============================================================
  function ensureCockpitHUDDOM() {
    if (document.getElementById('plane-cockpit-hud')) return;

    const style = document.createElement('style');
    style.id = 'plane-cockpit-hud-style';
    style.textContent = `
      #plane-cockpit-hud {
        display: none;
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1200;
        font-family: 'Share Tech Mono', monospace, sans-serif;
        overflow: hidden;
      }
      .hud-canopy-vignette {
        position: absolute;
        inset: 0;
        box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.88), inset 0 50px 90px rgba(8, 14, 24, 0.75);
        border-top: 18px solid #080d14;
        border-left: 28px solid #080d14;
        border-right: 28px solid #080d14;
        pointer-events: none;
      }
      .hud-canopy-arch {
        position: absolute;
        top: -30px;
        left: 10%;
        right: 10%;
        height: 120px;
        border-top: 12px solid #141b24;
        border-radius: 50% 50% 0 0;
        opacity: 0.85;
        pointer-events: none;
      }
      /* Top Compass Tape */
      .hud-compass-bar {
        position: absolute;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: 380px;
        height: 38px;
        background: rgba(4, 24, 16, 0.75);
        border: 1.5px solid #00ff88;
        border-radius: 6px;
        color: #00ff88;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: 2px;
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
      }
      /* Collimated Green HUD Glass Center Area */
      .hud-glass-container {
        position: absolute;
        top: 48%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 460px;
        height: 420px;
        border: 1.5px dashed rgba(0, 255, 136, 0.25);
        border-radius: 20px;
        background: radial-gradient(circle, rgba(0, 255, 136, 0.04) 0%, transparent 70%);
        pointer-events: none;
      }
      .hud-pitch-ladder {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 220px;
        height: 220px;
        margin-left: -110px;
        margin-top: -110px;
        pointer-events: none;
        transition: transform 0.04s linear;
      }
      .hud-boresight {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        pointer-events: none;
      }
      .hud-boresight::before, .hud-boresight::after {
        content: '';
        position: absolute;
        background: #00ff88;
      }
      .hud-boresight::before { top: 9px; left: 0; width: 20px; height: 2px; }
      .hud-boresight::after { top: 0; left: 9px; width: 2px; height: 20px; }
      .hud-fpm {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 22px;
        height: 22px;
        border: 2px solid #00ff88;
        border-radius: 50%;
      }
      .hud-fpm::before {
        content: '';
        position: absolute;
        top: 9px;
        left: -8px;
        width: 6px;
        height: 2px;
        background: #00ff88;
      }
      .hud-fpm::after {
        content: '';
        position: absolute;
        top: 9px;
        right: -8px;
        width: 6px;
        height: 2px;
        background: #00ff88;
      }
      /* Left Tape (Airspeed & Mach) */
      .hud-left-tape {
        position: absolute;
        top: 48%;
        left: calc(50% - 290px);
        transform: translateY(-50%);
        width: 95px;
        background: rgba(4, 20, 14, 0.85);
        border: 1.5px solid #00ff88;
        border-radius: 8px;
        padding: 10px 8px;
        color: #00ff88;
        text-align: center;
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
      }
      /* Right Tape (Altitude & VS) */
      .hud-right-tape {
        position: absolute;
        top: 48%;
        right: calc(50% - 290px);
        transform: translateY(-50%);
        width: 110px;
        background: rgba(4, 20, 14, 0.85);
        border: 1.5px solid #00ff88;
        border-radius: 8px;
        padding: 10px 8px;
        color: #00ff88;
        text-align: center;
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
      }
      /* Bottom Dashboard Instrument Panel */
      .hud-cockpit-dashboard {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 185px;
        background: linear-gradient(180deg, rgba(10, 16, 24, 0.94) 0%, rgba(5, 8, 12, 0.98) 100%);
        border-top: 4px solid #1e293b;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 10px 24px;
        box-sizing: border-box;
        pointer-events: auto;
      }
      .hud-mfd {
        width: 220px;
        height: 155px;
        background: #060d14;
        border: 2px solid #00f2ff;
        border-radius: 10px;
        position: relative;
        overflow: hidden;
        box-shadow: inset 0 0 20px rgba(0, 242, 255, 0.25);
        padding: 8px;
        box-sizing: border-box;
        color: #00f2ff;
        font-size: 11px;
      }
      .hud-mfd-title {
        font-weight: 900;
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(0, 242, 255, 0.4);
        padding-bottom: 3px;
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
      }
      .radar-sweep-line {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 60px;
        height: 2px;
        background: linear-gradient(90deg, transparent, #00f2ff);
        transform-origin: 0 0;
      }
      .hud-cockpit-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .hud-view-toggle-btn {
        background: rgba(0, 255, 136, 0.18);
        border: 1.5px solid #00ff88;
        color: #00ff88;
        font-family: 'Orbitron', sans-serif;
        font-weight: 900;
        font-size: 13px;
        padding: 8px 18px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.15s ease;
      }
      .hud-view-toggle-btn:hover {
        background: rgba(0, 255, 136, 0.35);
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
      }
    `;
    document.head.appendChild(style);

    const hudDiv = document.createElement('div');
    hudDiv.id = 'plane-cockpit-hud';
    hudDiv.innerHTML = `
      <div class="hud-canopy-vignette"></div>
      <div class="hud-canopy-arch"></div>

      <!-- Top Heading Tape -->
      <div class="hud-compass-bar">
        <span id="cockpit-hud-heading">HDG 000° [NORTH]</span>
      </div>

      <!-- Left Airspeed / Mach Tape -->
      <div class="hud-left-tape">
        <div style="font-size: 10px; color: #8fa3b8;">AIRSPEED</div>
        <div id="cockpit-hud-spd" style="font-size: 24px; font-weight: 900;">0</div>
        <div style="font-size: 11px; margin-top: 2px;">KNOTS</div>
        <div style="margin-top: 8px; font-size: 10px; color: #8fa3b8;">MACH</div>
        <div id="cockpit-hud-mach" style="font-size: 16px; font-weight: 900; color: #ffaa00;">M 0.00</div>
        <div style="margin-top: 6px; font-size: 11px; color: #00ff88;" id="cockpit-hud-g">1.0 G</div>
      </div>

      <!-- Center Pitch Ladder & Collimated HUD Reticle -->
      <div class="hud-glass-container">
        <div class="hud-boresight"></div>
        <div class="hud-fpm" id="cockpit-hud-fpm"></div>
        <div class="hud-pitch-ladder" id="cockpit-hud-ladder">
          <svg width="220" height="220" viewBox="0 0 220 220" style="overflow: visible;">
            <!-- Pitch bars -->
            <line x1="40" y1="50" x2="85" y2="50" stroke="#00ff88" stroke-width="2"/>
            <line x1="135" y1="50" x2="180" y2="50" stroke="#00ff88" stroke-width="2"/>
            <text x="25" y="54" fill="#00ff88" font-size="11" font-family="monospace">+20</text>

            <line x1="55" y1="80" x2="85" y2="80" stroke="#00ff88" stroke-width="2"/>
            <line x1="135" y1="80" x2="165" y2="80" stroke="#00ff88" stroke-width="2"/>
            <text x="35" y="84" fill="#00ff88" font-size="11" font-family="monospace">+10</text>

            <!-- Horizon Line -->
            <line x1="20" y1="110" x2="90" y2="110" stroke="#00ff88" stroke-width="3"/>
            <line x1="130" y1="110" x2="200" y2="110" stroke="#00ff88" stroke-width="3"/>
            <circle cx="110" cy="110" r="4" fill="none" stroke="#00ff88" stroke-width="1.5"/>

            <line x1="55" y1="140" x2="85" y2="140" stroke="#00ff88" stroke-width="2" stroke-dasharray="4 3"/>
            <line x1="135" y1="140" x2="165" y2="140" stroke="#00ff88" stroke-width="2" stroke-dasharray="4 3"/>
            <text x="35" y="144" fill="#00ff88" font-size="11" font-family="monospace">-10</text>

            <line x1="40" y1="170" x2="85" y2="170" stroke="#00ff88" stroke-width="2" stroke-dasharray="4 3"/>
            <line x1="135" y1="170" x2="180" y2="170" stroke="#00ff88" stroke-width="2" stroke-dasharray="4 3"/>
            <text x="25" y="174" fill="#00ff88" font-size="11" font-family="monospace">-20</text>
          </svg>
        </div>
      </div>

      <!-- Right Altitude Tape -->
      <div class="hud-right-tape">
        <div style="font-size: 10px; color: #8fa3b8;">ALTITUDE</div>
        <div id="cockpit-hud-alt" style="font-size: 24px; font-weight: 900;">0</div>
        <div style="font-size: 11px; margin-top: 2px;">METERS</div>
        <div style="margin-top: 8px; font-size: 10px; color: #8fa3b8;">CLIMB RATE</div>
        <div id="cockpit-hud-vs" style="font-size: 14px; font-weight: 900; color: #00ff88;">+0.0 M/S</div>
        <div style="margin-top: 6px; font-size: 10px; color: #8fa3b8;" id="cockpit-hud-baro">BARO 29.92</div>
      </div>

      <!-- Cockpit Instrument Panel Dashboard -->
      <div class="hud-cockpit-dashboard">
        <!-- Left MFD: Tactical Air-Search Radar -->
        <div class="hud-mfd">
          <div class="hud-mfd-title">
            <span>TWS RADAR (80NM)</span>
            <span style="color:#00ff88;">ONLINE</span>
          </div>
          <div style="position:relative; width: 100%; height: 115px; border: 1px solid rgba(0,242,255,0.2); border-radius: 50%; overflow: hidden; margin: 0 auto;">
            <div style="position: absolute; inset: 20%; border: 1px dashed rgba(0,242,255,0.25); border-radius: 50%;"></div>
            <div style="position: absolute; inset: 40%; border: 1px dashed rgba(0,242,255,0.25); border-radius: 50%;"></div>
            <div class="radar-sweep-line" id="cockpit-radar-sweep"></div>
            <!-- Blips -->
            <div style="position: absolute; top: 25%; left: 60%; width: 6px; height: 6px; background: #00ff88; border-radius: 50%; box-shadow: 0 0 6px #00ff88;" title="CVN-88 Carrier"></div>
            <div style="position: absolute; top: 70%; left: 45%; width: 6px; height: 6px; background: #ffd700; border-radius: 50%; box-shadow: 0 0 6px #ffd700;" title="CFB Calgary Base"></div>
            <div style="position: absolute; top: 40%; left: 35%; width: 5px; height: 5px; background: #00f2ff; border-radius: 50%;" title="Metropolis Tower"></div>
          </div>
        </div>

        <!-- Center Master Arm & Controls -->
        <div class="hud-cockpit-center">
          <div style="display: flex; gap: 12px; align-items: center;">
            <button type="button" class="hud-view-toggle-btn" onclick="togglePlaneCockpitView()">
              <i class="fa-solid fa-camera"></i> [V] SWITCH VIEW
            </button>
            <div style="background: rgba(239, 68, 68, 0.18); border: 1.5px solid #ef4444; color: #ef4444; padding: 6px 14px; border-radius: 6px; font-weight: 900; font-size: 11px;">
              MASTER ARM: ARMED
            </div>
          </div>
          <div style="color: #94a3b8; font-size: 11px; text-align: center;">
            WEAPON: <span style="color: #00ff88; font-weight: 800;">AIM-120D AMRAAM (x4)</span> · <span style="color: #ffd700;">20MM CANNON: 450 RDS</span>
          </div>
          <div style="display: flex; gap: 16px; font-size: 11px;">
            <div>THROTTLE: <span id="cockpit-hud-thr-val" style="color: #00f2ff; font-weight: 900;">0%</span></div>
            <div>AFTERBURNER: <span id="cockpit-hud-ab-status" style="color: #8fa3b8; font-weight: 900;">STANDBY</span></div>
          </div>
        </div>

        <!-- Right MFD: Turbofan Engine Telemetry -->
        <div class="hud-mfd">
          <div class="hud-mfd-title">
            <span>ENGINE 1 & 2 DYNAMICS</span>
            <span style="color: #00ff88;">NOMINAL</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            <div style="display:flex; justify-content: space-between;">
              <span style="color:#8fa3b8;">N1 CORE RPM:</span>
              <span id="cockpit-hud-rpm" style="color:#00ff88; font-weight: 800;">94.2%</span>
            </div>
            <div style="display:flex; justify-content: space-between;">
              <span style="color:#8fa3b8;">EXHAUST TEMP:</span>
              <span id="cockpit-hud-egt" style="color:#ffaa00; font-weight: 800;">680 °C</span>
            </div>
            <div style="display:flex; justify-content: space-between;">
              <span style="color:#8fa3b8;">FUEL FLOW:</span>
              <span id="cockpit-hud-fuel" style="color:#00f2ff; font-weight: 800;">3,400 PPH</span>
            </div>
            <div style="display:flex; justify-content: space-between;">
              <span style="color:#8fa3b8;">HYD PRESSURE:</span>
              <span style="color:#00ff88; font-weight: 800;">3,050 PSI</span>
            </div>
            <div style="display:flex; justify-content: space-between;">
              <span style="color:#8fa3b8;">OXYGEN SYS:</span>
              <span style="color:#00ff88; font-weight: 800;">100% SECURE</span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(hudDiv);
  }

  // Helper Canvas Banners
  function createMilitaryBannerTexture(title, sub) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(6, 14, 24, 0.94)';
    ctx.fillRect(0, 0, 1024, 256);

    ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 1012, 244);

    ctx.fillStyle = '#00f2ff';
    ctx.font = '900 46px "Orbitron", sans-serif';
    ctx.fillText(`🇨🇦 ${title}`, 32, 90);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 24px "Rajdhani", sans-serif';
    ctx.fillText(sub, 36, 160);

    return new THREE.CanvasTexture(c);
  }

  function createMilitaryRecruitBanner() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 384;
    const ctx = c.getContext('2d');

    // Canadian Forces Crimson Red & Dark Camo Banner
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, '#7f1d1d');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 384);

    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 1008, 368);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px "Orbitron", sans-serif';
    ctx.fillText('🇨🇦 CANADIAN ARMED FORCES ENLISTMENT', 45, 85);

    ctx.fillStyle = '#ffd700';
    ctx.font = '900 52px "Orbitron", sans-serif';
    ctx.fillText('NOW HIRING OPERATIVES // $10,000 CAD WEEKLY', 45, 175);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 28px "Rajdhani", sans-serif';
    ctx.fillText('FULL COMBAT GEAR · AIR & GROUND CLEARANCE · APPROACH TERMINAL [E] TO ENLIST', 45, 250);

    ctx.fillStyle = '#22c55e';
    ctx.font = '800 24px monospace';
    ctx.fillText('>> STATUS: RECRUITMENT ACTIVE // CFB CALGARY 41 BRIGADE GROUP', 45, 320);

    return new THREE.CanvasTexture(c);
  }

  // Export functions to window
  window.buildAircraftCarrierHMCSCalgary = buildAircraftCarrierHMCSCalgary;
  window.buildCanadianMilitaryBase = buildCanadianMilitaryBase;
  window.buildCyberSecurityHeadquarters = buildCyberSecurityHeadquarters;
  window.initMilitaryAviationPatrols = initMilitaryAviationPatrols;
  window.updateMilitaryAviation = updateMilitaryAviation;
  window.enlistInCanadianForces = enlistInCanadianForces;
  window.togglePlaneCockpitView = togglePlaneCockpitView;
  window.ensureCockpitHUDDOM = ensureCockpitHUDDOM;

})(window);
