// js/game_military_aviation.js
// NEXUS MILITARY & NAVAL AVIATION EXPANSION ENGINE
// Canadian Armed Forces Base, HMCS Calgary Aircraft Carrier (CVN-88),
// Sky Fighter Jet Cockpit View, Police Cruisers, and Cybersecurity HQ

(function(window) {
  'use strict';

  // Global registries for military, aviation, vehicle and cyber assets
  window.militaryAviationState = {
    isEnlisted: false,
    lastSalaryClaim: 0,
    salaryCad: 10000,
    fighterJets: [],
    patrolJets: [],
    policeCruisers: [],
    carrierCatapultReady: true,
    cockpitViewActive: false,
    // Aerial & Naval Dogfight Combat Systems
    projectiles: [],
    explosions: [],
    hostileDrones: [],
    lockedTarget: null,
    lastCannonTime: 0,
    lastMissileTime: 0,
    missileStock: 6,
    tailhookDown: false,
    trapCatchState: null,
    // Canadian LAV 6.0 8x8 Combat Vehicle
    isPilotingLAV: false,
    lavVehicleMesh: null,
    lavSpeed: 0,
    lavHeading: 0,
    lavTurretAngle: 0,
    lastLAVCannonTime: 0,
    lavSmokeCharges: 3,
    // FLIR Thermal Recon Visor
    thermalVisorActive: false,
    // CCCS Cyber Threat Console
    cyberModalOpen: false,
    cyberThreatsDefused: [false, false, false]
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
    carrierGroup._arrestingWires = [];
    for (let w = 0; w < 4; w++) {
      const wire = new THREE.Mesh(new THREE.BoxGeometry(32, 0.2, 0.2), steelMat);
      wire.position.set(-6, hullHeight + 1.35, 65 + (w * 10));
      carrierGroup.add(wire);
      carrierGroup._arrestingWires.push(wire);
    }

    // IFLOLS (Improved Fresnel Lens Optical Landing System / "The Meatball")
    const iflolsGroup = new THREE.Group();
    iflolsGroup.position.set(-hullWidth / 2 - 2, hullHeight + 1.4, 75);

    const iflolsPole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 3.8, 8), steelMat);
    iflolsPole.position.y = 1.9;
    iflolsGroup.add(iflolsPole);

    const iflolsBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 2.2), steelMat);
    iflolsBox.position.y = 3.6;
    iflolsGroup.add(iflolsBox);

    // Green Datum Reference Light Bars
    [-0.8, 0.8].forEach(dy => {
      const datum = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 2.4), greenLightMat);
      datum.position.set(-0.8, 3.6 + dy, 0);
      iflolsGroup.add(datum);
    });

    // Amber "Meatball" Glidepath Lens (Centers on optimal 3.0 deg approach)
    const meatball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    meatball.position.set(-0.85, 3.6, 0);
    iflolsGroup.add(meatball);
    carrierGroup._iflolsMeatball = meatball;

    carrierGroup.add(iflolsGroup);

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

    // Twin 20mm Vulcan Gatling Cannon Barrels at Wing Roots
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x11161f, metalness: 0.95, roughness: 0.2 });
    [-1.35, 1.35].forEach(gx => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 8), gunMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(gx, -0.15, -2.5);
      jet.add(barrel);
    });

    // 4 Underwing Weapons Pylons with AIM-120D AMRAAM Missiles
    const missileWhiteMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.3 });
    const finDarkMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    jet._underwingMissiles = [];
    [-3.4, -1.9, 1.9, 3.4].forEach((px, i) => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 1.8), camoMat);
      pylon.position.set(px, -0.22, 1.2);
      jet.add(pylon);

      const mGroup = new THREE.Group();
      mGroup.position.set(px, -0.42, 1.2);
      const mBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 8), missileWhiteMat);
      mBody.rotation.x = Math.PI / 2;
      mGroup.add(mBody);
      const mNose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.6, 8), finDarkMat);
      mNose.rotation.x = -Math.PI / 2;
      mNose.position.z = -1.6;
      mGroup.add(mNose);
      jet.add(mGroup);
      jet._underwingMissiles.push(mGroup);
    });

    // Articulated Carrier Tailhook Assembly
    const tailhookPivot = new THREE.Group();
    tailhookPivot.position.set(0, -0.55, 6.2);
    const hookArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), gunMat);
    hookArm.rotation.x = 0.55;
    hookArm.position.set(0, -0.6, 1.1);
    tailhookPivot.add(hookArm);
    const hookShoe = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.45), gunMat);
    hookShoe.position.set(0, -1.65, 2.0);
    tailhookPivot.add(hookShoe);
    jet.add(tailhookPivot);
    jet._tailhook = tailhookPivot;

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
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
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
    baseGroup._lav = lav;
    window.militaryAviationState.lavVehicleMesh = lav;

    // Register trigger collider for Boarding LAV 6.0 Combat Vehicle
    if (typeof registerCityCollider === 'function') {
      registerCityCollider({
        x: baseGroup.position.x,
        z: baseGroup.position.z + 15,
        hw: 7, hd: 7, world: 'earth',
        isTrigger: true,
        type: 'military_lav_vehicle'
      });
    }

    // ============================================================
    // CANADIAN ARMED FORCES TACTICAL ARMORY & RECON DEPOT
    // ============================================================
    const armoryGroup = new THREE.Group();
    armoryGroup.position.set(-25, 0, 10);

    const armoryBldg = new THREE.Mesh(new THREE.BoxGeometry(16, 6.5, 18), wallMat);
    armoryBldg.position.y = 3.25;
    armoryGroup.add(armoryBldg);

    // Armory Signboard
    const armoryTex = createMilitaryBannerTexture('TACTICAL ARMORY & RECON DEPOT', 'C7A2 RIFLES · FLIR THERMAL VISORS · CADPAT COMBAT RIGS');
    const armorySign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.6), new THREE.MeshBasicMaterial({ map: armoryTex, transparent: true }));
    armorySign.position.set(0, 5.2, 9.1);
    armoryGroup.add(armorySign);

    // Interactive Armory Kiosk Terminal
    const armoryKiosk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.2), steelMat);
    armoryKiosk.position.set(0, 1.1, 9.8);
    armoryGroup.add(armoryKiosk);

    const armoryHolo = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide
    }));
    armoryHolo.position.set(0, 2.4, 9.9);
    armoryGroup.add(armoryHolo);

    baseGroup.add(armoryGroup);

    // Register trigger collider for Tactical Armory Interaction
    if (typeof registerCityCollider === 'function') {
      registerCityCollider({
        x: baseGroup.position.x - 25,
        z: baseGroup.position.z + 20,
        hw: 6, hd: 6, world: 'earth',
        isTrigger: true,
        type: 'military_armory_terminal'
      });
    }

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
    const steelDark = new THREE.MeshStandardMaterial({ color: 0x11161d, metalness: 0.9, roughness: 0.25 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0a0d11, roughness: 0.95 });
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 9.5), cadpatMat);
    body.position.y = 1.6;
    lav.add(body);

    // Front Headlights
    [-1.6, 1.6].forEach(hx => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.2), headlightMat);
      hl.position.set(hx, 1.8, -4.8);
      lav.add(hl);
    });

    // Turret & 25mm Bushmaster Autocannon Assembly
    const turretGroup = new THREE.Group();
    turretGroup.position.set(0, 2.7, 0.5);

    const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 1.2, 8), cadpatMat);
    turretGroup.add(turret);

    // Commander Hatch Cupola
    const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.35, 8), steelDark);
    hatch.position.set(0.45, 0.75, 0.3);
    turretGroup.add(hatch);

    // Smoke Grenade Discharger Clusters (4 barrels per side)
    [-1.45, 1.45].forEach((sx, idx) => {
      for (let sm = 0; sm < 4; sm++) {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 6), steelDark);
        tube.rotation.x = -0.4;
        tube.rotation.z = (sx < 0 ? -0.4 : 0.4);
        tube.position.set(sx, 0.45, -0.4 + sm * 0.25);
        turretGroup.add(tube);
      }
    });

    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 5.5, 8), steelDark);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(0, 0.2, -3.2);
    turretGroup.add(cannon);

    // Cannon Muzzle Brake
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.5), steelDark);
    muzzle.position.set(0, 0.2, -5.9);
    turretGroup.add(muzzle);

    lav.add(turretGroup);
    lav._turretGroup = turretGroup;
    lav._cannon = cannon;

    // 8 All-Terrain Tires
    lav._tires = [];
    for (let side = -1; side <= 1; side += 2) {
      for (let ax = 0; ax < 4; ax++) {
        const tirePivot = new THREE.Group();
        tirePivot.position.set(side * 2.2, 0.7, -3.2 + (ax * 2.1));

        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.65, 12), tireMat);
        tire.rotation.z = Math.PI / 2;
        tirePivot.add(tire);

        lav.add(tirePivot);
        lav._tires.push({ pivot: tirePivot, mesh: tire, isFront: (ax <= 1), side });
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

    // 3D Holographic Cyber War Room Console & Quantum Terminal
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, 0, 24);

    const consolePodium = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 1.4, 8), steelTrim);
    consolePodium.position.y = 0.7;
    consoleGroup.add(consolePodium);

    // Floating Rotating Wireframe Earth Globe
    const globeMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), globeMat);
    globe.position.y = 2.4;
    consoleGroup.add(globe);
    cseGroup._cyberGlobe = globe;

    // Glowing Holographic Display Screen
    const holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      emissive: 0x00f2ff,
      side: THREE.DoubleSide
    }));
    holoScreen.position.set(0, 3.8, 0.2);
    consoleGroup.add(holoScreen);

    cseGroup.add(consoleGroup);

    // Register trigger collider for Cyber Command Console
    if (typeof registerCityCollider === 'function') {
      registerCityCollider({
        x: cseGroup.position.x,
        z: cseGroup.position.z + 24,
        hw: 6, hd: 6, world: 'earth',
        isTrigger: true,
        type: 'cyber_command_terminal'
      });
    }

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

  // ============================================================
  // WEB AUDIO MILITARY ACOUSTICS SYNTHESIZER
  // ============================================================
  function playMilitarySFX(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._milAudioCtx) window._milAudioCtx = new AudioCtx();
      const ctx = window._milAudioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      if (type === 'cannon') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'missile_launch') {
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(3400, now + 0.35);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'explosion') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.65);
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      } else if (type === 'autocannon') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.16);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'cable_trap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.5);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'lock_tone') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1750, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'visor') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(2200, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'cyber_beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch (e) {}
  }

  // ============================================================
  // CANADIAN AURORA BOREALIS (NORTHERN LIGHTS)
  // ============================================================
  function buildCanadianAuroraBorealis() {
    if (typeof scene === 'undefined' || !scene || window.militaryAviationState.auroraMesh) return;

    const auroraGroup = new THREE.Group();
    auroraGroup.position.set(0, 215, -620);

    // Layer 1: Radiant Emerald Green Curtain
    const geo1 = new THREE.PlaneGeometry(850, 110, 48, 12);
    const mat1 = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const curtain1 = new THREE.Mesh(geo1, mat1);
    auroraGroup.add(curtain1);

    // Layer 2: Radiant Violet & Electric Magenta Curtain
    const geo2 = new THREE.PlaneGeometry(820, 95, 48, 12);
    const mat2 = new THREE.MeshBasicMaterial({
      color: 0x9d4edd,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const curtain2 = new THREE.Mesh(geo2, mat2);
    curtain2.position.set(20, 15, 30);
    curtain2.rotation.y = 0.12;
    auroraGroup.add(curtain2);

    scene.add(auroraGroup);
    window.militaryAviationState.auroraMesh = { group: auroraGroup, curtain1, curtain2, geo1, geo2 };
    console.log('🌌 [NORTHERN LIGHTS] Canadian Aurora Borealis celestial curtain active.');
  }

  function updateCanadianAuroraBorealis(now) {
    const a = window.militaryAviationState.auroraMesh;
    if (!a) return;
    const time = now * 0.0012;

    const pos1 = a.geo1.attributes.position;
    for (let i = 0; i < pos1.count; i++) {
      const u = pos1.getX(i);
      const v = pos1.getY(i);
      const zOffset = Math.sin(time * 1.5 + u * 0.015) * 22 + Math.cos(time * 0.9 + v * 0.03) * 14;
      pos1.setZ(i, zOffset);
    }
    pos1.needsUpdate = true;

    const pos2 = a.geo2.attributes.position;
    for (let i = 0; i < pos2.count; i++) {
      const u = pos2.getX(i);
      const zOffset = Math.cos(time * 1.3 + u * 0.018) * 26;
      pos2.setZ(i, zOffset);
    }
    pos2.needsUpdate = true;
  }

  // ============================================================
  // HOSTILE RENEGADE SKY-RAIDER DRONES (AERIAL DOGFIGHT TARGETS)
  // ============================================================
  function initHostileSkyRaiders() {
    if (typeof scene === 'undefined' || !scene || window.militaryAviationState.hostileDrones.length > 0) return;

    const sectors = [
      { name: 'BANDIT-01 // SKY PIRATE', x: -320, y: 160, z: 220, r: 180, spd: 0.32 },
      { name: 'BANDIT-02 // IRON TALON', x: -180, y: 195, z: -290, r: 210, spd: 0.28 },
      { name: 'BANDIT-03 // CYBER WASP', x: 210, y: 210, z: 140, r: 190, spd: 0.35 },
      { name: 'BANDIT-04 // SHADOW WRAITH', x: -360, y: 175, z: 490, r: 230, spd: 0.25 }
    ];

    const drones = [];
    sectors.forEach((sec, idx) => {
      const dGroup = new THREE.Group();
      dGroup.position.set(sec.x, sec.y, sec.z);

      const dMat = new THREE.MeshStandardMaterial({ color: 0x0f141c, metalness: 0.95, roughness: 0.25 });
      const redEyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
      const thrusterMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

      // Stealth Delta Wing Body
      const body = new THREE.Mesh(new THREE.ConeGeometry(3.6, 7.8, 4), dMat);
      body.rotation.x = -Math.PI / 2;
      body.rotation.y = Math.PI / 4;
      dGroup.add(body);

      // Glowing Hostile Optic Sensor Eye
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), redEyeMat);
      eye.position.set(0, 0.4, -3.8);
      dGroup.add(eye);

      // Twin Thrusters
      [-1.4, 1.4].forEach(tx => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.2, 8), thrusterMat);
        t.rotation.x = Math.PI / 2;
        t.position.set(tx, 0, 3.8);
        dGroup.add(t);
      });

      // 3D Billboard Canvas for Health Bar
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, 4.5, 0);
      sprite.scale.set(14, 3.5, 1);
      dGroup.add(sprite);

      scene.add(dGroup);

      const droneData = {
        name: sec.name,
        mesh: dGroup,
        center: new THREE.Vector3(sec.x, sec.y, sec.z),
        radius: sec.r,
        angle: (idx * Math.PI) / 2,
        speed: sec.spd,
        health: 100,
        maxHealth: 100,
        canvas, ctx, tex,
        isDestroyed: false,
        respawnTimer: 0
      };
      drones.push(droneData);
      renderDroneHealthBar(droneData);
    });

    window.militaryAviationState.hostileDrones = drones;
    console.log('🛸 [DOGFIGHT COMBAT] 4 Hostile Renegade Sky-Raider Drones airborne over airspace.');
  }

  function renderDroneHealthBar(drone) {
    const ctx = drone.ctx;
    ctx.clearRect(0, 0, 256, 64);

    ctx.fillStyle = 'rgba(6, 12, 20, 0.9)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#ff0044';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 250, 58);

    ctx.fillStyle = '#ff0044';
    ctx.font = 'bold 20px "Orbitron", monospace, sans-serif';
    ctx.fillText(drone.name, 12, 26);

    const hpFrac = Math.max(0, drone.health / drone.maxHealth);
    ctx.fillStyle = '#220005';
    ctx.fillRect(12, 36, 232, 18);
    ctx.fillStyle = hpFrac > 0.4 ? '#ff0044' : '#ffaa00';
    ctx.fillRect(12, 36, 232 * hpFrac, 18);

    drone.tex.needsUpdate = true;
  }

  function updateHostileSkyRaiders(delta, now) {
    const st = window.militaryAviationState;
    if (!st.hostileDrones) return;

    const pPos = (typeof player !== 'undefined' && player && player.pos) ? player.pos : null;

    st.hostileDrones.forEach(drone => {
      if (drone.isDestroyed) {
        drone.respawnTimer -= delta;
        if (drone.respawnTimer <= 0) {
          drone.isDestroyed = false;
          drone.health = drone.maxHealth;
          drone.mesh.visible = true;
          renderDroneHealthBar(drone);
        }
        return;
      }

      // Orbital flight around sector waypoint
      drone.angle += drone.speed * delta;
      let targetX = drone.center.x + Math.cos(drone.angle) * drone.radius;
      let targetZ = drone.center.z + Math.sin(drone.angle) * drone.radius;
      let targetY = drone.center.y + Math.sin(drone.angle * 2.0) * 12;

      // Evasive maneuvers if player jet approaches within 260m
      if (pPos && pPos.distanceTo(drone.mesh.position) < 260) {
        const away = drone.mesh.position.clone().sub(pPos).normalize();
        targetX += away.x * 45;
        targetZ += away.z * 45;
        targetY += 15;
      }

      drone.mesh.position.x = THREE.MathUtils.lerp(drone.mesh.position.x, targetX, delta * 1.5);
      drone.mesh.position.y = THREE.MathUtils.lerp(drone.mesh.position.y, targetY, delta * 1.5);
      drone.mesh.position.z = THREE.MathUtils.lerp(drone.mesh.position.z, targetZ, delta * 1.5);

      drone.mesh.rotation.y = -drone.angle + Math.PI / 2;
    });
  }

  function destroyHostileDrone(drone) {
    if (drone.isDestroyed) return;
    drone.isDestroyed = true;
    drone.mesh.visible = false;
    drone.respawnTimer = 35.0; // Respawns in 35 seconds

    playMilitarySFX('explosion');

    // Spawn massive multi-sphere fireball explosion
    const boomPos = drone.mesh.position.clone();
    for (let b = 0; b < 4; b++) {
      const expGeo = new THREE.SphereGeometry(3.5 + b * 1.5, 10, 10);
      const expMat = new THREE.MeshBasicMaterial({
        color: (b % 2 === 0 ? 0xff3300 : 0xffea00),
        transparent: true,
        opacity: 0.95
      });
      const expMesh = new THREE.Mesh(expGeo, expMat);
      expMesh.position.copy(boomPos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      ));
      scene.add(expMesh);
      window.militaryAviationState.explosions.push({
        mesh: expMesh,
        scaleSpeed: 14 + b * 4,
        life: 0.9 + b * 0.2,
        maxLife: 0.9 + b * 0.2
      });
    }

    // Award +$2,500 CAD Dogfight Bounty
    if (typeof gameState !== 'undefined') {
      gameState.tokens = (gameState.tokens || 1250) + 2500;
      const tEl = document.getElementById('store-token-display');
      if (tEl) tEl.textContent = Number(gameState.tokens).toLocaleString();
      const lNex = document.getElementById('lobby-currency-nex');
      if (lNex) lNex.textContent = Number(gameState.tokens).toLocaleString();
    }

    if (typeof showStoreNotification === 'function') {
      showStoreNotification(`🎯 DOGFIGHT KILL CONFIRMED: ${drone.name} NEUTRALIZED (+ $2,500 CAD BOUNTY)!`);
    }
    if (typeof cyberAudio !== 'undefined' && cyberAudio.playLootChime) cyberAudio.playLootChime();
  }

  // ============================================================
  // WEAPON FIRING & BALLISTICS SIMULATION
  // ============================================================
  function fireJetCannon() {
    if (typeof gameState === 'undefined' || !gameState.inPlane || !gameState.plane) return;
    const now = Date.now();
    const st = window.militaryAviationState;
    if (now - (st.lastCannonTime || 0) < 90) return;
    st.lastCannonTime = now;

    playMilitarySFX('cannon');

    const pMesh = gameState.plane.mesh;
    if (!pMesh) return;

    st._cannonSide = -(st._cannonSide || 1);
    const muzzleOffset = new THREE.Vector3(st._cannonSide * 1.35, -0.15, -4.5).applyEuler(pMesh.rotation);
    const spawnPos = pMesh.position.clone().add(muzzleOffset);

    const tracerGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
    tracerGeo.rotateX(Math.PI / 2);
    const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const tracer = new THREE.Mesh(tracerGeo, tracerMat);
    tracer.position.copy(spawnPos);
    tracer.rotation.copy(pMesh.rotation);
    scene.add(tracer);

    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(pMesh.rotation);
    const projVel = fwd.clone().multiplyScalar(260).add(fwd.clone().multiplyScalar(gameState.plane.speed));

    st.projectiles.push({
      mesh: tracer,
      vel: projVel,
      type: 'cannon',
      life: 2.2,
      damage: 25
    });
  }

  function fireJetMissile() {
    if (typeof gameState === 'undefined' || !gameState.inPlane || !gameState.plane) return;
    const now = Date.now();
    const st = window.militaryAviationState;
    if (now - (st.lastMissileTime || 0) < 1100) return;

    if (st.missileStock <= 0) {
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('⚠️ AMRAAM MISSILES DEPLETED // RELOADING PAYLOAD (10S)...');
      }
      setTimeout(() => {
        st.missileStock = 6;
        const countEl = document.getElementById('cockpit-missile-count');
        if (countEl) countEl.textContent = '6';
        if (typeof showStoreNotification === 'function') {
          showStoreNotification('🚀 AIM-120D AMRAAM PAYLOAD RESTOCKED (6/6 READY)!');
        }
      }, 10000);
      return;
    }

    st.missileStock--;
    st.lastMissileTime = now;
    const countEl = document.getElementById('cockpit-missile-count');
    if (countEl) countEl.textContent = st.missileStock;

    playMilitarySFX('missile_launch');

    const pMesh = gameState.plane.mesh;
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(pMesh.rotation);

    let bestTarget = null;
    let bestDist = 550;
    st.hostileDrones.forEach(drone => {
      if (drone.isDestroyed) return;
      const toDrone = drone.mesh.position.clone().sub(pMesh.position);
      const d = toDrone.length();
      if (d < bestDist) {
        const dot = fwd.dot(toDrone.normalize());
        if (dot > 0.55) {
          bestDist = d;
          bestTarget = drone;
        }
      }
    });

    const mGroup = new THREE.Group();
    const pylonX = (st.missileStock % 2 === 0 ? -2.2 : 2.2);
    mGroup.position.copy(pMesh.position).add(new THREE.Vector3(pylonX, -0.6, 0).applyEuler(pMesh.rotation));
    mGroup.rotation.copy(pMesh.rotation);

    const mBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0xecf0f1 }));
    mBody.rotation.x = Math.PI / 2;
    mGroup.add(mBody);

    const mFlame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.4, 8), new THREE.MeshBasicMaterial({ color: 0xff5500 }));
    mFlame.rotation.x = Math.PI / 2;
    mFlame.position.z = 2.0;
    mGroup.add(mFlame);

    scene.add(mGroup);

    const vel = fwd.clone().multiplyScalar(95 + gameState.plane.speed);
    st.projectiles.push({
      mesh: mGroup,
      vel: vel,
      type: 'missile',
      target: bestTarget,
      life: 4.5,
      damage: 100
    });

    if (bestTarget) {
      playMilitarySFX('lock_tone');
      if (typeof showStoreNotification === 'function') {
        showStoreNotification(`🚀 AIM-120D AMRAAM LAUNCHED: RADAR LOCK ON [${bestTarget.name}]!`);
      }
    } else {
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('🚀 AIM-120D AMRAAM FIRED (UNGUIDED BORESIGHT)');
      }
    }
  }

  function spawnExplosion(pos, radius, colorHex) {
    const geo = new THREE.SphereGeometry(radius || 2.0, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex || 0xff6600, transparent: true, opacity: 0.9 });
    const exp = new THREE.Mesh(geo, mat);
    exp.position.copy(pos);
    scene.add(exp);
    window.militaryAviationState.explosions.push({
      mesh: exp,
      scaleSpeed: 10.0,
      life: 0.65,
      maxLife: 0.65
    });
  }

  function updateMilitaryProjectiles(delta) {
    const st = window.militaryAviationState;

    // Update active projectiles
    for (let i = st.projectiles.length - 1; i >= 0; i--) {
      const p = st.projectiles[i];
      p.life -= delta;

      if (p.type === 'missile' && p.target && !p.target.isDestroyed) {
        const toTarget = p.target.mesh.position.clone().sub(p.mesh.position);
        const dist = toTarget.length();
        if (dist < 6.0) {
          destroyHostileDrone(p.target);
          p.life = 0;
        } else {
          const steer = toTarget.normalize().multiplyScalar(220);
          p.vel.lerp(steer, delta * 5.0);
          p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), p.vel.clone().normalize());
        }
      }

      p.mesh.position.addScaledVector(p.vel, delta);

      // Check bullet/shell collision with hostile drones
      st.hostileDrones.forEach(drone => {
        if (drone.isDestroyed) return;
        if (p.mesh.position.distanceTo(drone.mesh.position) < 5.5) {
          drone.health -= (p.damage || 25);
          renderDroneHealthBar(drone);
          spawnExplosion(p.mesh.position, 1.2, 0xffcc00);
          p.life = 0;
          if (drone.health <= 0) {
            destroyHostileDrone(drone);
          }
        }
      });

      // Ground impact for shells
      if (p.type === 'lav_shell' && p.mesh.position.y <= 1.2) {
        spawnExplosion(p.mesh.position, 2.5, 0xff5500);
        p.life = 0;
      }

      if (p.life <= 0) {
        scene.remove(p.mesh);
        st.projectiles.splice(i, 1);
      }
    }

    // Update explosions
    for (let e = st.explosions.length - 1; e >= 0; e--) {
      const exp = st.explosions[e];
      exp.life -= delta;
      const s = 1.0 + (exp.scaleSpeed * (exp.maxLife - exp.life));
      exp.mesh.scale.set(s, s, s);
      exp.mesh.material.opacity = Math.max(0, exp.life / exp.maxLife);

      if (exp.life <= 0) {
        scene.remove(exp.mesh);
        st.explosions.splice(e, 1);
      }
    }
  }

  // ============================================================
  // CARRIER ARRESTOR WIRE TRAP RECOVERY SYSTEM
  // ============================================================
  function toggleCarrierTailhook() {
    const st = window.militaryAviationState;
    st.tailhookDown = !st.tailhookDown;

    if (typeof gameState !== 'undefined' && gameState.inPlane && gameState.plane && gameState.plane.mesh) {
      if (gameState.plane.mesh._tailhook) {
        gameState.plane.mesh._tailhook.rotation.x = st.tailhookDown ? 0.75 : 0;
      }
    }

    const hookStatusEl = document.getElementById('cockpit-hook-status');
    if (hookStatusEl) {
      hookStatusEl.textContent = st.tailhookDown ? 'DOWN [ARMED]' : 'UP [H]';
      hookStatusEl.style.color = st.tailhookDown ? '#00ff88' : '#00f2ff';
    }

    if (typeof showStoreNotification === 'function') {
      showStoreNotification(st.tailhookDown ? '⚓ TAILHOOK DEPLOYED // ARMED FOR CARRIER 3-WIRE TRAP LANDING [H]' : '⚓ TAILHOOK RETRACTED [H]');
    }
    if (typeof cyberAudio !== 'undefined' && cyberAudio.playClick) cyberAudio.playClick();
  }

  function checkCarrierTrapLanding(pMesh, pState, delta) {
    const st = window.militaryAviationState;
    if (!st.tailhookDown || !pMesh || !pState || pState.speed < 12.0) return;

    const px = pMesh.position.x;
    const py = pMesh.position.y;
    const pz = pMesh.position.z;

    // Carrier Deck Surface Bounds:
    // Center (-340, 1.2, 340). Angled deck runway spans Z: 390 to 445, X: -362 to -326, Y: 11.0 to 14.8
    if (px >= -362 && px <= -326 && pz >= 392 && pz <= 442 && py >= 11.0 && py <= 14.8) {
      if (!st.trapCatchState) {
        st.trapCatchState = {
          trappedTime: Date.now(),
          rewarded: false
        };
        playMilitarySFX('cable_trap');
      }

      // Instant arrestor cable tension deceleration
      pState.speed = THREE.MathUtils.lerp(pState.speed, 0, delta * 7.5);
      pState.throttle = 0;

      if (pState.speed < 1.0 && !st.trapCatchState.rewarded) {
        st.trapCatchState.rewarded = true;
        gameState.tokens = (gameState.tokens || 1250) + 5000;
        const tEl = document.getElementById('store-token-display');
        if (tEl) tEl.textContent = Number(gameState.tokens).toLocaleString();

        if (typeof showStoreNotification === 'function') {
          showStoreNotification('⚓ OK 3-WIRE! PERFECT CARRIER TRAP RECOVERY (+ $5,000 CAD CARRIER FLIGHT BONUS)!');
        }
        if (typeof cyberAudio !== 'undefined' && cyberAudio.playLootChime) {
          cyberAudio.playLootChime();
        }
        setTimeout(() => { st.trapCatchState = null; }, 5000);
      }
    }
  }

  // ============================================================
  // CANADIAN ARMED FORCES LAV 6.0 (8X8 COMBAT VEHICLE) DRIVING
  // ============================================================
  function boardCanadianLAV() {
    const st = window.militaryAviationState;
    if (st.isPilotingLAV || !st.lavVehicleMesh) return;

    st.isPilotingLAV = true;
    if (typeof gameState !== 'undefined') gameState.inVehicle = true;

    if (typeof player !== 'undefined' && player.pos) {
      player.pos.copy(st.lavVehicleMesh.position).add(new THREE.Vector3(0, 3.2, 0));
      player.vel.set(0, 0, 0);
    }

    const lavHud = document.getElementById('lav-vehicle-hud');
    if (lavHud) lavHud.style.display = 'flex';

    if (typeof showStoreNotification === 'function') {
      showStoreNotification('🇨🇦 PILOTING CANADIAN FORCES LAV 6.0 // 8X8 ALL-TERRAIN COMBAT SYSTEM [E: EXIT]!');
    }
    playMilitarySFX('autocannon');
  }

  function exitCanadianLAV() {
    const st = window.militaryAviationState;
    if (!st.isPilotingLAV || !st.lavVehicleMesh) return;

    st.isPilotingLAV = false;
    st.lavSpeed = 0;
    if (typeof gameState !== 'undefined') gameState.inVehicle = false;

    if (typeof player !== 'undefined' && player.pos) {
      player.pos.copy(st.lavVehicleMesh.position).add(new THREE.Vector3(4.5, 0.5, 0));
      player.vel.set(0, 0, 0);
    }

    const lavHud = document.getElementById('lav-vehicle-hud');
    if (lavHud) lavHud.style.display = 'none';

    if (typeof showStoreNotification === 'function') {
      showStoreNotification('🇨🇦 DISMOUNTED CANADIAN FORCES LAV 6.0 [ON FOOT]');
    }
  }

  function updateCanadianLAV(delta, now) {
    const st = window.militaryAviationState;
    if (!st.isPilotingLAV || !st.lavVehicleMesh) return;

    const lav = st.lavVehicleMesh;
    const k = (typeof keys !== 'undefined') ? keys : {};

    // 8x8 Acceleration & Braking
    let targetSpeed = 0;
    if (k['KeyW'] || k['ArrowUp']) targetSpeed = 32.0; // ~115 km/h
    else if (k['KeyS'] || k['ArrowDown']) targetSpeed = -14.0;

    st.lavSpeed = THREE.MathUtils.lerp(st.lavSpeed, targetSpeed, delta * 2.8);

    // Multi-axle Steering
    let steerInput = 0;
    if (k['KeyA'] || k['ArrowLeft']) steerInput = 1;
    if (k['KeyD'] || k['ArrowRight']) steerInput = -1;

    st.lavHeading = (st.lavHeading || 0) + steerInput * (1.2 + Math.abs(st.lavSpeed) * 0.02) * delta;
    lav.rotation.y = st.lavHeading;

    // Move Forward Vector
    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), st.lavHeading);
    lav.position.addScaledVector(fwd, st.lavSpeed * delta);

    // Roll 8 tires
    if (lav._tires) {
      lav._tires.forEach(tObj => {
        tObj.mesh.rotation.x += st.lavSpeed * delta * 2.2;
        if (tObj.isFront) {
          tObj.pivot.rotation.y = THREE.MathUtils.lerp(tObj.pivot.rotation.y, steerInput * 0.35, delta * 8.0);
        }
      });
    }

    // Lock player position to vehicle
    if (typeof player !== 'undefined' && player.pos) {
      player.pos.copy(lav.position).add(new THREE.Vector3(0, 3.2, 0));
      player.vel.set(0, 0, 0);
    }

    // Third-person armored vehicle follow camera
    if (typeof camera !== 'undefined' && camera) {
      const camBack = new THREE.Vector3(0, 4.8, 14.0).applyAxisAngle(new THREE.Vector3(0, 1, 0), st.lavHeading);
      camera.position.copy(lav.position).add(camBack);
      camera.lookAt(lav.position.clone().add(new THREE.Vector3(0, 2.2, 0)));
    }

    // Update HUD
    const spdEl = document.getElementById('lav-hud-spd');
    if (spdEl) spdEl.textContent = `${Math.round(Math.abs(st.lavSpeed) * 3.6)} KM/H`;
  }

  function fireLAVBushmaster() {
    const st = window.militaryAviationState;
    if (!st.isPilotingLAV || !st.lavVehicleMesh) return;
    const now = Date.now();
    if (now - (st.lastLAVCannonTime || 0) < 220) return;
    st.lastLAVCannonTime = now;

    playMilitarySFX('autocannon');

    const lav = st.lavVehicleMesh;
    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), st.lavHeading);
    const spawnPos = lav.position.clone().add(new THREE.Vector3(0, 2.9, 0)).addScaledVector(fwd, 6.2);

    const shellGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const shellMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.position.copy(spawnPos);
    scene.add(shell);

    st.projectiles.push({
      mesh: shell,
      vel: fwd.clone().multiplyScalar(180),
      type: 'lav_shell',
      life: 2.5,
      damage: 75
    });
  }

  function deployLAVSmokeScreen() {
    const st = window.militaryAviationState;
    if (!st.isPilotingLAV || !st.lavVehicleMesh) return;
    if ((st.lavSmokeCharges || 0) <= 0) {
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('⚠️ SMOKE SCREEN EMPTY // RELOADING CHARGES...');
      }
      return;
    }
    st.lavSmokeCharges--;
    playMilitarySFX('missile_launch');

    const lav = st.lavVehicleMesh;
    for (let s = 0; s < 6; s++) {
      const ang = (s / 6) * Math.PI * 2;
      const smokeGeo = new THREE.SphereGeometry(2.5, 8, 8);
      const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.85 });
      const puff = new THREE.Mesh(smokeGeo, smokeMat);
      puff.position.copy(lav.position).add(new THREE.Vector3(Math.cos(ang) * 6.5, 1.8, Math.sin(ang) * 6.5));
      scene.add(puff);
      st.explosions.push({ mesh: puff, scaleSpeed: 3.5, life: 3.0, maxLife: 3.0 });
    }

    if (typeof showStoreNotification === 'function') {
      showStoreNotification(`💨 360° SMOKE SCREEN DEPLOYED (${st.lavSmokeCharges} CHARGES LEFT)!`);
    }
  }

  // ============================================================
  // TACTICAL ARMORY & FLIR THERMAL RECON VISOR
  // ============================================================
  function accessTacticalArmory() {
    if (typeof gameState === 'undefined') return;
    gameState.tokens = (gameState.tokens || 1250) + 1000;
    const tEl = document.getElementById('store-token-display');
    if (tEl) tEl.textContent = Number(gameState.tokens).toLocaleString();

    playMilitarySFX('visor');
    if (typeof showStoreNotification === 'function') {
      showStoreNotification('🇨🇦 TACTICAL ARMORY LOADOUT EQUIPPED // CADPAT CAMO & FLIR THERMAL VISOR ACTIVE [T]!');
    }
  }

  function toggleThermalReconVisor() {
    const st = window.militaryAviationState;
    st.thermalVisorActive = !st.thermalVisorActive;

    const overlay = document.getElementById('thermal-recon-visor-overlay');
    if (overlay) overlay.style.display = st.thermalVisorActive ? 'block' : 'none';

    playMilitarySFX('visor');
    if (typeof showStoreNotification === 'function') {
      showStoreNotification(st.thermalVisorActive ? '👁️ FLIR THERMAL RECON VISOR: ONLINE [T]' : '👁️ FLIR THERMAL RECON VISOR: STANDBY [T]');
    }
  }

  function updateThermalReconVisor() {
    const container = document.getElementById('thermal-targets-container');
    if (!container || typeof camera === 'undefined' || !camera) return;

    let html = '';
    const st = window.militaryAviationState;

    // Track Hostile Drones
    if (st.hostileDrones) {
      st.hostileDrones.forEach(drone => {
        if (drone.isDestroyed) return;
        const proj = drone.mesh.position.clone().project(camera);
        if (proj.z < 1.0 && Math.abs(proj.x) < 0.95 && Math.abs(proj.y) < 0.95) {
          const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
          const dist = Math.round(camera.position.distanceTo(drone.mesh.position));
          html += `
            <div style="position:absolute; left:${sx}px; top:${sy}px; transform:translate(-50%,-50%); border:1.5px solid #ff0044; width:34px; height:34px; pointer-events:none;">
              <div style="position:absolute; top:-16px; left:0; font-size:10px; font-weight:900; color:#ff0044; white-space:nowrap;">
                ${drone.name} [HEAT: 142°C // ${dist}M]
              </div>
            </div>
          `;
        }
      });
    }

    // Track Active LAV Engine
    if (st.lavVehicleMesh) {
      const proj = st.lavVehicleMesh.position.clone().add(new THREE.Vector3(0, 1.8, 0)).project(camera);
      if (proj.z < 1.0 && Math.abs(proj.x) < 0.95 && Math.abs(proj.y) < 0.95) {
        const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
        const dist = Math.round(camera.position.distanceTo(st.lavVehicleMesh.position));
        html += `
          <div style="position:absolute; left:${sx}px; top:${sy}px; transform:translate(-50%,-50%); border:1.5px solid #ffaa00; width:44px; height:28px; pointer-events:none;">
            <div style="position:absolute; top:-16px; left:0; font-size:10px; font-weight:900; color:#ffaa00; white-space:nowrap;">
              LAV 6.0 TURBINE [HEAT: 88°C // ${dist}M]
            </div>
          </div>
        `;
      }
    }

    container.innerHTML = html;
  }

  // ============================================================
  // CCCS CYBER COMMAND THREAT DEFUSAL MATRIX
  // ============================================================
  function openCyberThreatMatrix() {
    const st = window.militaryAviationState;
    st.cyberModalOpen = true;
    const modal = document.getElementById('cccs-cyber-threat-modal');
    if (modal) modal.style.display = 'flex';
    playMilitarySFX('cyber_beep');
  }

  function defuseCyberThreat(threatIndex) {
    const st = window.militaryAviationState;
    st.cyberThreatsDefused[threatIndex] = true;
    playMilitarySFX('cyber_beep');

    const card = document.getElementById(`cyber-threat-card-${threatIndex}`);
    if (card) {
      card.style.borderColor = '#22c55e';
      card.innerHTML = `<span style="color:#22c55e; font-weight:900;">✅ DEFUSED // CRYPTO COUNTER-PAYLOAD ACTIVE</span>`;
    }

    if (st.cyberThreatsDefused.every(v => v === true)) {
      setTimeout(() => {
        if (typeof gameState !== 'undefined') {
          gameState.tokens = (gameState.tokens || 1250) + 5000;
          const tEl = document.getElementById('store-token-display');
          if (tEl) tEl.textContent = Number(gameState.tokens).toLocaleString();
        }
        if (typeof showStoreNotification === 'function') {
          showStoreNotification('🛡️ CCCS NATIONAL CYBER THREAT DEFUSED // +$5,000 CAD BOUNTY AWARDED!');
        }
        if (typeof cyberAudio !== 'undefined' && cyberAudio.playLootChime) cyberAudio.playLootChime();

        const modal = document.getElementById('cccs-cyber-threat-modal');
        if (modal) modal.style.display = 'none';
        st.cyberModalOpen = false;
        setTimeout(() => { st.cyberThreatsDefused = [false, false, false]; }, 30000);
      }, 900);
    }
  }

  // ============================================================
  // MAIN MILITARY AVIATION SIMULATION UPDATE LOOP
  // ============================================================
  function updateMilitaryAviation(delta, now) {
    // 1. Rotate Aircraft Carrier Radar and Base Kiosk Crest
    if (typeof scene !== 'undefined' && scene) {
      scene.traverse(obj => {
        if (obj._radarBar) obj._radarBar.rotation.y += delta * 1.8;
        if (obj._kioskLeaf) obj._kioskLeaf.rotation.y += delta * 1.5;
        if (obj._cyberGlobe) obj._cyberGlobe.rotation.y += delta * 0.9;
      });
    }

    const st = window.militaryAviationState;

    // 2. Air-Defense Sky Fighter Formation Flight Path
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

    // 4. Ensure Northern Lights & Hostile Drones are initialized
    if (!st.auroraMesh) buildCanadianAuroraBorealis();
    if (!st.hostileDrones || st.hostileDrones.length === 0) initHostileSkyRaiders();

    // 5. Update Aurora Borealis Waves
    updateCanadianAuroraBorealis(now);

    // 6. Update Hostile Drones AI & Dogfight Evasion
    updateHostileSkyRaiders(delta, now);

    // 7. Update Projectiles & Detonations
    updateMilitaryProjectiles(delta);

    // 8. Update Canadian LAV 6.0 8x8 Vehicle Physics
    updateCanadianLAV(delta, now);

    // 9. Carrier Arrestor Trap Landing Check
    if (typeof gameState !== 'undefined' && gameState && gameState.inPlane && gameState.plane) {
      checkCarrierTrapLanding(gameState.plane.mesh, gameState.plane, delta);
    }

    // 10. Update FLIR Thermal Recon Visor Overlays
    if (st.thermalVisorActive) {
      updateThermalReconVisor();
    }

    // 11. Proximity Check for Enlistment, LAV, Armory, and Cyber Terminal
    checkMilitaryProximity();

    // 12. Floating Tactical Bar display in plane mode
    ensureCockpitHUDDOM();
    const tacBar = document.getElementById('plane-tactical-bar');
    if (tacBar) {
      tacBar.style.display = (typeof gameState !== 'undefined' && gameState && gameState.inPlane && !st.cockpitViewActive) ? 'flex' : 'none';
    }

    // 13. Plane Cockpit View HUD and Avionics Instruments Update
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

        // HUD Collimated Reticle Target Box
        const targetBox = document.getElementById('cockpit-hud-target-box');
        const targetLabel = document.getElementById('cockpit-hud-target-label');
        if (targetBox && targetLabel && typeof camera !== 'undefined' && camera) {
          let nearestInView = null;
          let minDist = 550;
          st.hostileDrones.forEach(d => {
            if (d.isDestroyed) return;
            const dist = camera.position.distanceTo(d.mesh.position);
            if (dist < minDist) {
              const proj = d.mesh.position.clone().project(camera);
              if (proj.z < 1.0 && Math.abs(proj.x) < 0.85 && Math.abs(proj.y) < 0.85) {
                minDist = dist;
                nearestInView = { drone: d, proj, dist };
              }
            }
          });

          if (nearestInView) {
            targetBox.style.display = 'block';
            const scrX = (nearestInView.proj.x * 0.5 + 0.5) * 460;
            const scrY = (-nearestInView.proj.y * 0.5 + 0.5) * 420;
            targetBox.style.left = `${scrX}px`;
            targetBox.style.top = `${scrY}px`;
            const isLocked = nearestInView.dist < 420;
            targetBox.style.borderColor = isLocked ? '#ef4444' : '#00ff88';
            targetLabel.style.color = isLocked ? '#ef4444' : '#00ff88';
            targetLabel.textContent = isLocked ? `[LOCKED // ${Math.round(nearestInView.dist)}M // AIM-120D]` : `[TARGET // ${Math.round(nearestInView.dist)}M]`;
          } else {
            targetBox.style.display = 'none';
          }
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
  // CANADIAN ENLISTMENT ACTION ($10,000 CAD EVERY WEEK)
  // ============================================================
  function enlistInCanadianForces() {
    if (typeof gameState === 'undefined') return;

    const now = Date.now();
    const st = window.militaryAviationState;

    if (!st.isEnlisted) {
      st.isEnlisted = true;
      st.lastSalaryClaim = now;
      gameState.isMilitaryEnlisted = true;

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

      if (window.HyperRealismEngine && window.HyperRealismEngine.equipGear) {
        window.HyperRealismEngine.equipGear('exosuit');
      }
    } else {
      const elapsedMs = now - (st.lastSalaryClaim || 0);
      const oneWeekSimMs = 60000;
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
    const st = window.militaryAviationState;

    // 1. Military Base Terminal (X: -230, Z: 105)
    const distBase = Math.hypot(px - (-230), pz - (105));
    if (distBase < 5.5 && !window._promptEnlistShown) {
      window._promptEnlistShown = true;
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('🇨🇦 [E] INTERACT WITH RECRUITMENT TERMINAL // ENLIST FOR $10,000 CAD SALARY!');
      }
      setTimeout(() => { window._promptEnlistShown = false; }, 8000);
    }

    // 2. Aircraft Carrier Jet Catapult (X: -352, Z: 332)
    const distCarrierJet = Math.hypot(px - (-352), pz - (332));
    if (distCarrierJet < 9.0 && !window._promptCarrierShown && (!gameState || !gameState.inPlane)) {
      window._promptCarrierShown = true;
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('⚓ [E] BOARD CARRIER FIGHTER JET // CATAPULT LAUNCH READY!');
      }
      setTimeout(() => { window._promptCarrierShown = false; }, 8000);
    }

    // 3. Canadian LAV 6.0 Combat Vehicle (X: -230, Z: 175)
    const distLAV = Math.hypot(px - (-230), pz - (175));
    if (distLAV < 6.5 && !window._promptLAVShown && !st.isPilotingLAV) {
      window._promptLAVShown = true;
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('🇨🇦 [E] BOARD CANADIAN FORCES LAV 6.0 COMBAT VEHICLE (8X8)!');
      }
      setTimeout(() => { window._promptLAVShown = false; }, 8000);
    }

    // 4. Tactical Armory Depot (X: -255, Z: 170)
    const distArmory = Math.hypot(px - (-255), pz - (170));
    if (distArmory < 6.0 && !window._promptArmoryShown) {
      window._promptArmoryShown = true;
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('🇨🇦 [E] ACCESS TACTICAL ARMORY // EQUIP CADPAT GEAR & FLIR THERMAL VISOR!');
      }
      setTimeout(() => { window._promptArmoryShown = false; }, 8000);
    }

    // 5. CCCS Cyber Command Terminal (X: 70, Z: -101)
    const distCyber = Math.hypot(px - (70), pz - (-101));
    if (distCyber < 6.0 && !window._promptCyberShown) {
      window._promptCyberShown = true;
      if (typeof showStoreNotification === 'function') {
        showStoreNotification('🛡️ [E] ACCESS CCCS NATIONAL CYBER DEFENSE TERMINAL ($5,000 CAD BOUNTY)!');
      }
      setTimeout(() => { window._promptCyberShown = false; }, 8000);
    }
  }

  // Keyboard shortcut listener
  window.addEventListener('keydown', e => {
    const st = window.militaryAviationState;

    if (e.key === 'e' || e.key === 'E') {
      if (st.isPilotingLAV) {
        exitCanadianLAV();
        return;
      }

      if (typeof player !== 'undefined' && player && player.pos) {
        const px = player.pos.x, pz = player.pos.z;

        // LAV 6.0 Boarding
        const distLAV = Math.hypot(px - (-230), pz - (175));
        if (distLAV < 7.5 && (!gameState || !gameState.inPlane)) {
          boardCanadianLAV();
          return;
        }

        // Tactical Armory
        const distArmory = Math.hypot(px - (-255), pz - (170));
        if (distArmory < 6.5) {
          accessTacticalArmory();
          return;
        }

        // CCCS Cyber Terminal
        const distCyber = Math.hypot(px - (70), pz - (-101));
        if (distCyber < 6.5) {
          openCyberThreatMatrix();
          return;
        }

        // Base Recruitment
        const distBase = Math.hypot(px - (-230), pz - (105));
        if (distBase < 6.5) {
          enlistInCanadianForces();
          return;
        }

        // Carrier Jet Catapult
        const distCarrier = Math.hypot(px - (-352), pz - (332));
        if (distCarrier < 12.0 && (!gameState || !gameState.inPlane)) {
          if (typeof executePlaneFlightEntry === 'function' && window.carrierFighterJetData) {
            executePlaneFlightEntry(window.carrierFighterJetData);
            if (gameState && gameState.plane) {
              gameState.plane.throttle = 100;
              gameState.plane.afterburner = true;
              gameState.plane.speed = 85.0;
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

    // [H] Key: Toggle Carrier Tailhook
    if (e.key === 'h' || e.key === 'H') {
      if (typeof gameState !== 'undefined' && gameState && gameState.inPlane) {
        toggleCarrierTailhook();
      }
    }

    // [R] Key: Fire AIM-120D AMRAAM Guided Missile
    if (e.key === 'r' || e.key === 'R') {
      if (typeof gameState !== 'undefined' && gameState && gameState.inPlane) {
        fireJetMissile();
      }
    }

    // [T] Key: Toggle FLIR Thermal Recon Visor
    if (e.key === 't' || e.key === 'T') {
      toggleThermalReconVisor();
    }

    // [F] Key: Fire LAV 25mm Bushmaster Autocannon
    if (e.key === 'f' || e.key === 'F') {
      if (st.isPilotingLAV) {
        fireLAVBushmaster();
      }
    }

    // [G] Key: Deploy LAV Smoke Screen
    if (e.key === 'g' || e.key === 'G') {
      if (st.isPilotingLAV) {
        deployLAVSmokeScreen();
      }
    }

    // [Space] Key: Fire 20mm Vulcan Gatling Cannon when in plane
    if (e.code === 'Space') {
      if (typeof gameState !== 'undefined' && gameState && gameState.inPlane) {
        fireJetCannon();
      }
    }
  });

  // Mouse Primary Click Fire Handler
  window.addEventListener('mousedown', e => {
    if (e.button === 0) {
      if (typeof gameState !== 'undefined' && gameState && gameState.inPlane) {
        fireJetCannon();
      } else if (window.militaryAviationState && window.militaryAviationState.isPilotingLAV) {
        fireLAVBushmaster();
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
        <!-- Dynamic HUD Target Box -->
        <div id="cockpit-hud-target-box" style="display:none; position:absolute; width:48px; height:48px; border:2px solid #00ff88; transform:translate(-50%,-50%); pointer-events:none; transition:border-color 0.1s ease;">
          <div id="cockpit-hud-target-label" style="position:absolute; top:-16px; left:0; font-size:10px; font-weight:900; color:#00ff88; white-space:nowrap;">TARGET [SCAN]</div>
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
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button id="cockpit-btn-gun" type="button" onclick="window.fireJetCannon()" style="background: rgba(255, 204, 0, 0.22); border: 1.5px solid #ffcc00; color: #ffcc00; font-family: 'Share Tech Mono', monospace; font-weight: 900; font-size: 11px; padding: 5px 12px; border-radius: 6px; cursor: pointer;">
              🔫 20MM VULCAN [SPACE]
            </button>
            <button id="cockpit-btn-missile" type="button" onclick="window.fireJetMissile()" style="background: rgba(239, 68, 68, 0.25); border: 1.5px solid #ef4444; color: #ef4444; font-family: 'Share Tech Mono', monospace; font-weight: 900; font-size: 11px; padding: 5px 12px; border-radius: 6px; cursor: pointer;">
              🚀 AIM-120D [R] (<span id="cockpit-missile-count">6</span>)
            </button>
            <button id="cockpit-btn-hook" type="button" onclick="window.toggleCarrierTailhook()" style="background: rgba(0, 242, 255, 0.22); border: 1.5px solid #00f2ff; color: #00f2ff; font-family: 'Share Tech Mono', monospace; font-weight: 900; font-size: 11px; padding: 5px 12px; border-radius: 6px; cursor: pointer;">
              ⚓ HOOK: <span id="cockpit-hook-status">UP [H]</span>
            </button>
            <button id="cockpit-btn-thermal" type="button" onclick="window.toggleThermalReconVisor()" style="background: rgba(34, 197, 94, 0.22); border: 1.5px solid #22c55e; color: #22c55e; font-family: 'Share Tech Mono', monospace; font-weight: 900; font-size: 11px; padding: 5px 12px; border-radius: 6px; cursor: pointer;">
              👁️ THERMAL [T]
            </button>
          </div>
          <div style="display: flex; gap: 16px; font-size: 11px; margin-top: 4px;">
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

    // 2. Floating Tactical Bar for 3rd-person plane chase camera
    if (!document.getElementById('plane-tactical-bar')) {
      const tacBar = document.createElement('div');
      tacBar.id = 'plane-tactical-bar';
      tacBar.style.cssText = 'display:none; position:fixed; bottom:24px; right:24px; z-index:1150; flex-direction:column; gap:8px; pointer-events:auto;';
      tacBar.innerHTML = `
        <button type="button" onclick="window.fireJetCannon()" style="background:rgba(255,204,0,0.88); border:2px solid #fff; color:#000; font-family:'Orbitron',sans-serif; font-weight:900; font-size:12px; padding:10px 16px; border-radius:8px; cursor:pointer; box-shadow:0 0 15px rgba(255,204,0,0.5);">
          🔫 20MM CANNON [SPACE]
        </button>
        <button type="button" onclick="window.fireJetMissile()" style="background:rgba(239,68,68,0.88); border:2px solid #fff; color:#fff; font-family:'Orbitron',sans-serif; font-weight:900; font-size:12px; padding:10px 16px; border-radius:8px; cursor:pointer; box-shadow:0 0 15px rgba(239,68,68,0.5);">
          🚀 AIM-120D MISSILE [R]
        </button>
        <button type="button" onclick="window.toggleCarrierTailhook()" style="background:rgba(0,242,255,0.88); border:2px solid #fff; color:#000; font-family:'Orbitron',sans-serif; font-weight:900; font-size:12px; padding:10px 16px; border-radius:8px; cursor:pointer; box-shadow:0 0 15px rgba(0,242,255,0.5);">
          ⚓ TAILHOOK [H]
        </button>
        <button type="button" onclick="window.togglePlaneCockpitView()" style="background:rgba(0,255,136,0.88); border:2px solid #fff; color:#000; font-family:'Orbitron',sans-serif; font-weight:900; font-size:12px; padding:10px 16px; border-radius:8px; cursor:pointer; box-shadow:0 0 15px rgba(0,255,136,0.5);">
          ✈️ COCKPIT HUD [V]
        </button>
      `;
      document.body.appendChild(tacBar);
    }

    // 3. Canadian Armed Forces LAV 6.0 8x8 Combat Vehicle HUD
    if (!document.getElementById('lav-vehicle-hud')) {
      const lavHud = document.createElement('div');
      lavHud.id = 'lav-vehicle-hud';
      lavHud.style.cssText = 'display:none; position:fixed; bottom:25px; left:50%; transform:translateX(-50%); background:rgba(10,16,24,0.94); border:2px solid #22c55e; border-radius:12px; padding:12px 28px; color:#fff; font-family:\'Share Tech Mono\',monospace; z-index:1150; flex-direction:column; align-items:center; gap:8px; box-shadow:0 0 25px rgba(34,197,94,0.35); pointer-events:auto;';
      lavHud.innerHTML = `
        <div style="display:flex; justify-content:space-between; width:100%; gap:24px; font-size:14px; font-weight:900; color:#22c55e; border-bottom:1px solid rgba(34,197,94,0.4); padding-bottom:4px;">
          <span>🇨🇦 CANADIAN ARMED FORCES // LAV 6.0 (8X8)</span>
          <span id="lav-hud-spd">0 KM/H</span>
        </div>
        <div style="display:flex; gap:12px; margin-top:4px;">
          <button type="button" onclick="window.fireLAVBushmaster()" style="background:rgba(239,68,68,0.25); border:1.5px solid #ef4444; color:#ef4444; font-family:monospace; font-weight:900; font-size:12px; padding:8px 16px; border-radius:6px; cursor:pointer;">
            💥 25MM BUSHMASTER [CLICK / F]
          </button>
          <button type="button" onclick="window.deployLAVSmokeScreen()" style="background:rgba(148,163,184,0.25); border:1.5px solid #94a3b8; color:#e2e8f0; font-family:monospace; font-weight:900; font-size:12px; padding:8px 16px; border-radius:6px; cursor:pointer;">
            💨 SMOKE SCREEN [G]
          </button>
          <button type="button" onclick="window.exitCanadianLAV()" style="background:rgba(34,197,94,0.25); border:1.5px solid #22c55e; color:#22c55e; font-family:monospace; font-weight:900; font-size:12px; padding:8px 16px; border-radius:6px; cursor:pointer;">
            🚪 DISMOUNT [E]
          </button>
        </div>
      `;
      document.body.appendChild(lavHud);
    }

    // 4. FLIR Thermal Recon Visor Fullscreen Overlay
    if (!document.getElementById('thermal-recon-visor-overlay')) {
      const visorDiv = document.createElement('div');
      visorDiv.id = 'thermal-recon-visor-overlay';
      visorDiv.style.cssText = 'display:none; position:fixed; inset:0; pointer-events:none; z-index:1300; background:radial-gradient(circle, transparent 40%, rgba(0,25,35,0.7) 100%);';
      visorDiv.innerHTML = `
        <div style="position:absolute; inset:0; background:repeating-linear-gradient(0deg, rgba(0,242,255,0.03) 0px, rgba(0,242,255,0.03) 2px, transparent 2px, transparent 4px);"></div>
        <div style="position:absolute; top:20px; left:25px; color:#00f2ff; font-family:'Share Tech Mono',monospace; font-size:13px; font-weight:900; letter-spacing:1px; line-height:1.5;">
          <div>🇨🇦 CANADIAN FORCES FLIR RECON SYSTEM</div>
          <div>IR SPECTRUM: 8-14μm LWIR · GAIN: AUTO-CALIBRATED</div>
          <div>THERMAL SENSITIVITY: 0.04°C · AMBIENT: -4.5°C [CALGARY ALBERTA]</div>
        </div>
        <div style="position:absolute; top:20px; right:25px; color:#00ff88; font-family:'Share Tech Mono',monospace; font-size:13px; font-weight:900; text-align:right;">
          <div>STATUS: RECON ACTIVE [T: TOGGLE]</div>
          <div>BATTERY: 98% [NOMINAL]</div>
        </div>
        <div style="position:absolute; top:50%; left:50%; width:60px; height:60px; transform:translate(-50%,-50%); border:1px solid rgba(0,242,255,0.4); border-radius:50%;"></div>
        <div id="thermal-targets-container"></div>
      `;
      document.body.appendChild(visorDiv);
    }

    // 5. CCCS Cyber Command Threat Mitigation Modal
    if (!document.getElementById('cccs-cyber-threat-modal')) {
      const modalDiv = document.createElement('div');
      modalDiv.id = 'cccs-cyber-threat-modal';
      modalDiv.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(3,8,16,0.92); z-index:2100; align-items:center; justify-content:center; backdrop-filter:blur(8px); font-family:\'Share Tech Mono\',monospace;';
      modalDiv.innerHTML = `
        <div style="width:720px; max-width:92vw; background:#070d18; border:2px solid #00f2ff; border-radius:12px; padding:24px; box-shadow:0 0 35px rgba(0,242,255,0.3); color:#fff;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #00f2ff; padding-bottom:10px; margin-bottom:16px;">
            <div>
              <div style="color:#00f2ff; font-size:18px; font-weight:900; font-family:'Orbitron',sans-serif;">🇨🇦 CCCS NATIONAL CYBER DEFENSE TERMINAL</div>
              <div style="color:#94a3b8; font-size:11px;">COMMUNICATIONS SECURITY ESTABLISHMENT // THREAT MITIGATION MATRIX</div>
            </div>
            <button type="button" onclick="document.getElementById('cccs-cyber-threat-modal').style.display='none'" style="background:transparent; border:none; color:#ef4444; font-size:20px; cursor:pointer; font-weight:900;">✕</button>
          </div>
          <div style="margin-bottom:16px; color:#e2e8f0; font-size:12px;">
            DEFENSE DIRECTIVE: Active malicious intrusions detected targeting Canadian critical infrastructure. Deploy cryptographic counter-payloads to defuse threats and secure the national grid for <span style="color:#ffd700; font-weight:900;">$5,000 CAD BOUNTY</span>.
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div id="cyber-threat-card-0" style="background:#0b1322; border:1.5px solid #ef4444; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="color:#ef4444; font-weight:900; font-size:13px;">🚨 QUANTUM RANSOMWARE WORM // ARCTIC RADAR NODE</div>
                <div style="color:#94a3b8; font-size:11px;">Target: Alert Bay Coastal Radar · Vector: Port 443 SCADA</div>
              </div>
              <button type="button" onclick="window.defuseCyberThreat(0)" style="background:rgba(239,68,68,0.25); border:1.5px solid #ef4444; color:#ef4444; font-weight:900; padding:6px 14px; border-radius:6px; cursor:pointer;">
                🛡️ DEPLOY COUNTER-PAYLOAD
              </button>
            </div>
            <div id="cyber-threat-card-1" style="background:#0b1322; border:1.5px solid #ffaa00; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="color:#ffaa00; font-weight:900; font-size:13px;">⚠️ TERABIT DDOS FLOOD // TRANS-CANADA RAILWAYS</div>
                <div style="color:#94a3b8; font-size:11px;">Target: Calgary Maglev Network · Vector: 1.4 Tbps SYN Flood</div>
              </div>
              <button type="button" onclick="window.defuseCyberThreat(1)" style="background:rgba(255,170,0,0.25); border:1.5px solid #ffaa00; color:#ffaa00; font-weight:900; padding:6px 14px; border-radius:6px; cursor:pointer;">
                🛡️ DEPLOY COUNTER-PAYLOAD
              </button>
            </div>
            <div id="cyber-threat-card-2" style="background:#0b1322; border:1.5px solid #38bdf8; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="color:#38bdf8; font-weight:900; font-size:13px;">⚡ ZERO-DAY CRYPTO-EXPLOIT // FEDERAL ENERGY GRID</div>
                <div style="color:#94a3b8; font-size:11px;">Target: Alberta Hydro Substation · Vector: Zero-Day Memory Buffer</div>
              </div>
              <button type="button" onclick="window.defuseCyberThreat(2)" style="background:rgba(56,189,248,0.25); border:1.5px solid #38bdf8; color:#38bdf8; font-weight:900; padding:6px 14px; border-radius:6px; cursor:pointer;">
                🛡️ DEPLOY COUNTER-PAYLOAD
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalDiv);
    }
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

  // ============================================================
  // BULLETPROOF ANTI-BLACK-SCREEN & RESCUE RESTORATION WATCHDOG
  // ============================================================
  function emergencyUnblackScreen() {
    console.warn('[RESCUE SYSTEM] Executing Emergency Unblack Screen restoration...');

    // 1. Force hide all potential dark fullscreen overlays and modals
    const overlaysToHide = [
      'launch-lock-overlay',
      'start-overlay',
      'plane-cockpit-hud',
      'plane-tactical-bar',
      'thermal-recon-visor-overlay',
      'cccs-cyber-threat-modal',
      'metro-cutscene-overlay',
      'space-blackout-overlay'
    ];
    overlaysToHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.style.opacity = '0';
      }
    });

    // 2. Clear aviation state flags
    if (window.militaryAviationState) {
      window.militaryAviationState.cockpitViewActive = false;
      window.militaryAviationState.thermalVisorActive = false;
    }

    // 3. Rescue player and camera coordinates if NaN or out-of-bounds
    if (typeof player !== 'undefined' && player) {
      if (!player.pos || isNaN(player.pos.x) || isNaN(player.pos.y) || isNaN(player.pos.z) || player.pos.y < -10) {
        if (typeof THREE !== 'undefined' && player.pos && player.pos.set) {
          player.pos.set(0, 1.2, 0);
        } else if (typeof THREE !== 'undefined') {
          player.pos = new THREE.Vector3(0, 1.2, 0);
        }
      }
      if (player.vel && player.vel.set) player.vel.set(0, 0, 0);
      player.yaw = 0;
      player.pitch = 0;
      player.isGrounded = true;
    }

    if (typeof camera !== 'undefined' && camera) {
      if (!camera.position || isNaN(camera.position.x) || isNaN(camera.position.y) || isNaN(camera.position.z) || camera.position.y < -5) {
        if (camera.position && camera.position.set) {
          camera.position.set(0, 2.8, 0);
        }
      }
      if (typeof camera.lookAt === 'function') {
        camera.lookAt(0, 2.8, -50);
      }
    }

    // 4. Force vibrant day sky & lighting so scene is bright and visible
    if (typeof scene !== 'undefined' && scene) {
      if (typeof THREE !== 'undefined') {
        scene.background = new THREE.Color(0x5a9ee6);
        if (scene.fog) {
          scene.fog.color.setHex(0xbeddfa);
          scene.fog.density = 0.0009;
        }
      }
    }
    if (typeof hemiLight !== 'undefined' && hemiLight) {
      hemiLight.intensity = 1.6;
    }
    if (typeof ambientLight !== 'undefined' && ambientLight) {
      ambientLight.intensity = 0.8;
    }

    // 5. Uncull all distant groups and switch graphics to Safe Mode
    if (window.HyperRealismEngine && typeof window.HyperRealismEngine.restoreSafeDisplay === 'function') {
      window.HyperRealismEngine.restoreSafeDisplay();
    }
    if (typeof setLowEndTurboMode === 'function') {
      setLowEndTurboMode(true);
    }

    // 6. Force immediate render frame
    if (typeof renderer !== 'undefined' && renderer && typeof scene !== 'undefined' && typeof camera !== 'undefined') {
      try {
        renderer.render(scene, camera);
      } catch (err) {
        console.warn('[RESCUE SYSTEM] Render retry warning:', err);
      }
    }

    // 7. Audible & Visual Feedback
    if (typeof showStoreNotification === 'function') {
      showStoreNotification('✅ SCREEN RESCUED // SAFE VIEW RESTORED');
    }
    if (typeof cyberAudio !== 'undefined' && cyberAudio.playLootChime) {
      cyberAudio.playLootChime();
    }
  }

  // Autonomous Watchdog: runs every 2.5 seconds to auto-correct stuck states
  setInterval(() => {
    try {
      if (typeof isEngineInitialized !== 'undefined' && isEngineInitialized) {
        // Check if player is falling into void
        if (typeof player !== 'undefined' && player && player.pos) {
          if (player.pos.y < -35 || isNaN(player.pos.x) || isNaN(player.pos.y)) {
            console.warn('[Watchdog] Player in void or NaN. Auto-rescuing...');
            emergencyUnblackScreen();
          }
        }
        // Check stuck cockpit hud when not in plane
        if (typeof gameState !== 'undefined' && (!gameState || !gameState.inPlane)) {
          const cEl = document.getElementById('plane-cockpit-hud');
          if (cEl && cEl.style.display !== 'none') cEl.style.display = 'none';
        }
      }
    } catch (e) {}
  }, 2500);

  // Global Hotkey: F8 or Double-Escape triggers rescue
  let lastEscTime = 0;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F8') {
      e.preventDefault();
      emergencyUnblackScreen();
    } else if (e.key === 'Escape') {
      const now = performance.now();
      if (now - lastEscTime < 450) {
        emergencyUnblackScreen();
      }
      lastEscTime = now;
    }
  });

  // Export functions to window
  window.buildAircraftCarrierHMCSCalgary = buildAircraftCarrierHMCSCalgary;
  window.buildCanadianMilitaryBase = buildCanadianMilitaryBase;
  window.buildCyberSecurityHeadquarters = buildCyberSecurityHeadquarters;
  window.initMilitaryAviationPatrols = initMilitaryAviationPatrols;
  window.updateMilitaryAviation = updateMilitaryAviation;
  window.enlistInCanadianForces = enlistInCanadianForces;
  window.togglePlaneCockpitView = togglePlaneCockpitView;
  window.ensureCockpitHUDDOM = ensureCockpitHUDDOM;
  window.playMilitarySFX = playMilitarySFX;
  window.buildCanadianAuroraBorealis = buildCanadianAuroraBorealis;
  window.initHostileSkyRaiders = initHostileSkyRaiders;
  window.fireJetCannon = fireJetCannon;
  window.fireJetMissile = fireJetMissile;
  window.toggleCarrierTailhook = toggleCarrierTailhook;
  window.boardCanadianLAV = boardCanadianLAV;
  window.exitCanadianLAV = exitCanadianLAV;
  window.fireLAVBushmaster = fireLAVBushmaster;
  window.deployLAVSmokeScreen = deployLAVSmokeScreen;
  window.accessTacticalArmory = accessTacticalArmory;
  window.toggleThermalReconVisor = toggleThermalReconVisor;
  window.openCyberThreatMatrix = openCyberThreatMatrix;
  window.defuseCyberThreat = defuseCyberThreat;
  window.emergencyUnblackScreen = emergencyUnblackScreen;

})(window);
