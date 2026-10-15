// js/game_modules/calgary_metropolis.js
// Authentic Calgary Metropolis procedural architecture & dynamic C-Train LRT loop

class CalgaryMetropolis {
  constructor(scene, colliders = []) {
    this.scene = scene;
    this.colliders = colliders;
    this.landmarks = [];
    this.cTrainCars = [];
    this.cTrainTrackT = 0;
    this.cranes = [];
    this.ledPixels = [];

    this.initMaterials();
    this.buildGroundAndPlazas();
    this.buildCalgaryTower();
    this.buildTheBow();
    this.buildTelusSky();
    this.buildBrookfieldPlace();
    this.buildCentralLibrary();
    this.buildScotiaPlaceArena();
    this.buildBanffHotSprings();
    this.buildSugarShack();
    this.buildCTrainLRT();
    this.buildStreetFurniture();
  }

  initMaterials() {
    this.matGlass = new THREE.MeshStandardMaterial({
      color: 0x1a3b5c,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85
    });

    this.matConcrete = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.8,
      metalness: 0.2
    });

    this.matSteel = new THREE.MeshStandardMaterial({
      color: 0x718096,
      roughness: 0.4,
      metalness: 0.7
    });

    this.matNeonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.matNeonRed = new THREE.MeshBasicMaterial({ color: 0xff3838 });
    this.matNeonAmber = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  }

  addCollider(mesh, halfWidth, halfHeight, halfDepth) {
    if (!mesh) return;
    this.colliders.push({
      mesh: mesh,
      pos: mesh.position,
      box: new THREE.Box3().setFromObject(mesh)
    });
  }

  buildGroundAndPlazas() {
    // City base asphalt / snow ground
    const groundGeo = new THREE.PlaneGeometry(1600, 1600, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e272e,
      roughness: 0.88,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Downtown avenue grid markings
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x0f141c });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x485460 });

    for (let x = -300; x <= 300; x += 150) {
      const roadX = new THREE.Mesh(new THREE.PlaneGeometry(24, 800), roadMat);
      roadX.rotation.x = -Math.PI / 2;
      roadX.position.set(x, 0.05, 0);
      this.scene.add(roadX);

      // Center dash
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(1, 800), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.06, 0);
      this.scene.add(dash);
    }

    for (let z = -300; z <= 300; z += 150) {
      const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(800, 24), roadMat);
      roadZ.rotation.x = -Math.PI / 2;
      roadZ.position.set(0, 0.05, z);
      this.scene.add(roadZ);
    }
  }

  buildCalgaryTower() {
    // 191m Calgary Tower at [0, 0, -80]
    const root = new THREE.Group();
    root.position.set(0, 0, -80);

    // Base pavilion
    const base = new THREE.Mesh(new THREE.CylinderGeometry(18, 22, 12, 16), this.matConcrete);
    base.position.y = 6;
    base.castShadow = true;
    root.add(base);

    // Flared concrete shaft (up to 155m)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 9.5, 145, 16), this.matConcrete);
    shaft.position.y = 80;
    shaft.castShadow = true;
    root.add(shaft);

    // Vertical external glass elevator column
    const elevatorCol = new THREE.Mesh(new THREE.BoxGeometry(2.5, 140, 2), this.matGlass);
    elevatorCol.position.set(0, 80, 5.5);
    root.add(elevatorCol);

    // Observation Pod (The Drum) at 155m-170m
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(17, 13, 15, 24), this.matSteel);
    pod.position.y = 158;
    root.add(pod);

    // Observation glass windows
    const podGlass = new THREE.Mesh(new THREE.CylinderGeometry(17.2, 16.5, 5, 24, 1, true), this.matGlass);
    podGlass.position.y = 159;
    root.add(podGlass);

    // Red accent trim
    const podTrim = new THREE.Mesh(new THREE.TorusGeometry(17.3, 0.4, 8, 24), this.matNeonRed);
    podTrim.rotation.x = Math.PI / 2;
    podTrim.position.y = 163;
    root.add(podTrim);

    // Spire and Olympic flame cauldron (191m total height)
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 2.5, 26, 8), this.matSteel);
    spire.position.y = 179;
    root.add(spire);

    // Aeronautical warning beacon
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), this.matNeonRed);
    beacon.position.y = 192;
    root.add(beacon);
    this.calgaryBeacon = beacon;

    this.scene.add(root);
    this.addCollider(base);

    this.landmarks.push({
      name: 'Calgary Tower (191m)',
      pos: new THREE.Vector3(0, 0, -80),
      color: '#ff3b30',
      size: 5,
      pulse: true
    });
  }

  buildTheBow() {
    // 236m The Bow crescent-shaped tower at [90, 0, -120]
    const root = new THREE.Group();
    root.position.set(90, 0, -120);

    const levels = 8;
    const totalH = 210;
    const curveRadius = 38;

    for (let i = 0; i < levels; i++) {
      const h = totalH / levels;
      const y = h * i + h / 2;
      const taper = 1.0 - (i / levels) * 0.22;

      // Crescent facade arc using cylinder segment
      const bowMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(curveRadius * taper, curveRadius * taper, h - 0.4, 20, 1, false, 0, Math.PI),
        this.matGlass
      );
      bowMesh.position.y = y;
      bowMesh.rotation.y = Math.PI * 0.75;
      root.add(bowMesh);

      // Diagrid steel diagonal beams
      const diagrid = new THREE.Mesh(
        new THREE.TorusGeometry(curveRadius * taper, 0.4, 6, 16, Math.PI),
        this.matSteel
      );
      diagrid.rotation.x = Math.PI / 2;
      diagrid.position.y = y;
      diagrid.rotation.z = Math.PI * 0.75;
      root.add(diagrid);
    }

    // Flat back atrium wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(45, totalH, 6), this.matConcrete);
    backWall.position.set(0, totalH / 2, -12);
    root.add(backWall);

    this.scene.add(root);
    this.addCollider(backWall);

    this.landmarks.push({
      name: 'The Bow (236m)',
      pos: new THREE.Vector3(90, 0, -120),
      color: '#00e5ff',
      size: 4.5
    });
  }

  buildTelusSky() {
    // 222m Telus Sky with twisting pixelated facade at [-95, 0, -110]
    const root = new THREE.Group();
    root.position.set(-95, 0, -110);

    const floors = 22;
    const totalH = 195;
    const floorH = totalH / floors;

    for (let i = 0; i < floors; i++) {
      const y = i * floorH + floorH / 2;
      const frac = i / floors;
      // Bottom is wide rectangle, twisting into step-backs at top
      const w = 32 - frac * 12;
      const d = 26 - frac * 10;

      const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, floorH - 0.25, d), this.matGlass);
      floorMesh.position.y = y;
      // Slight twist / shift
      floorMesh.position.x = frac * 4;
      root.add(floorMesh);

      // Pixelated dynamic LED strip along facade edges
      if (i % 2 === 0) {
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.3, floorH * 0.7, d * 0.9), ledMat);
        led.position.set(floorMesh.position.x - w / 2 - 0.2, y, 0);
        root.add(led);
        this.ledPixels.push(ledMat);
      }
    }

    this.scene.add(root);
    const colBox = new THREE.Mesh(new THREE.BoxGeometry(32, totalH, 26), this.matConcrete);
    colBox.position.set(-95, totalH / 2, -110);
    this.addCollider(colBox);

    this.landmarks.push({
      name: 'Telus Sky (222m)',
      pos: new THREE.Vector3(-95, 0, -110),
      color: '#00ff88',
      size: 4.5
    });
  }

  buildBrookfieldPlace() {
    // 247m Brookfield Place East (Tallest in Calgary) at [40, 0, -210]
    const root = new THREE.Group();
    root.position.set(40, 0, -210);

    const totalH = 235;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(36, totalH, 30), this.matGlass);
    tower.position.y = totalH / 2;
    root.add(tower);

    // Rounded vertical corners
    const cornerGeo = new THREE.CylinderGeometry(2, 2, totalH, 12);
    [[-18, -15], [18, -15], [-18, 15], [18, 15]].forEach(([cx, cz]) => {
      const cMesh = new THREE.Mesh(cornerGeo, this.matSteel);
      cMesh.position.set(cx, totalH / 2, cz);
      root.add(cMesh);
    });

    // Glowing architectural crown at night
    const crown = new THREE.Mesh(new THREE.BoxGeometry(32, 10, 26), this.matNeonCyan);
    crown.position.y = totalH + 4;
    root.add(crown);

    this.scene.add(root);
    this.addCollider(tower);

    this.landmarks.push({
      name: 'Brookfield Place (247m)',
      pos: new THREE.Vector3(40, 0, -210),
      color: '#3b82f6',
      size: 4.5
    });
  }

  buildCentralLibrary() {
    // Snøhetta Calgary Central Library with cedar archway at [-100, 0, 40]
    const root = new THREE.Group();
    root.position.set(-100, 0, 40);

    // Curved wood-lined underpass tunnel (allows LRT track to run right underneath)
    const libraryBase = new THREE.Mesh(new THREE.BoxGeometry(45, 18, 65), this.matGlass);
    libraryBase.position.y = 14;
    root.add(libraryBase);

    // Cedar arch underpass
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
    const archRoof = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 66, 16, 1, false, 0, Math.PI), woodMat);
    archRoof.rotation.z = Math.PI / 2;
    archRoof.position.y = 8;
    root.add(archRoof);

    // Geometric fritted hexagonal facade texture
    const fritMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, wireframe: true });
    const fritMesh = new THREE.Mesh(new THREE.BoxGeometry(45.4, 18.2, 65.4), fritMat);
    fritMesh.position.y = 14;
    root.add(fritMesh);

    this.scene.add(root);
    this.addCollider(libraryBase);

    this.landmarks.push({
      name: 'Central Library (Snøhetta)',
      pos: new THREE.Vector3(-100, 0, 40),
      color: '#f59e0b',
      size: 4
    });
  }

  buildScotiaPlaceArena() {
    // Scotia Place 2026 active construction site at [130, 0, 60]
    const root = new THREE.Group();
    root.position.set(130, 0, 60);

    // Oval arena foundation bowl
    const arenaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(40, 36, 16, 24), arenaMat);
    bowl.position.y = 8;
    root.add(bowl);

    // Perimeter security hoarding fence
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const fence = new THREE.Mesh(new THREE.CylinderGeometry(48, 48, 4, 24, 1, true), fenceMat);
    fence.position.y = 2;
    root.add(fence);

    // Concrete foundation pilings & steel rebar
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const px = Math.cos(a) * 34;
      const pz = Math.sin(a) * 34;
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 24, 8), steelMat);
      pile.position.set(px, 12, pz);
      root.add(pile);
    }

    // 2 Active Tower Cranes (animated rotation)
    const crane1 = this.createTowerCrane(-20, 0, -20);
    const crane2 = this.createTowerCrane(22, 0, 20);
    root.add(crane1.group);
    root.add(crane2.group);
    this.cranes.push(crane1, crane2);

    this.scene.add(root);
    this.addCollider(bowl);

    this.landmarks.push({
      name: 'Scotia Place Site (2026 Event Centre)',
      pos: new THREE.Vector3(130, 0, 60),
      color: '#f97316',
      size: 4.5
    });
  }

  createTowerCrane(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const mastMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5 });
    // Mast (60m)
    const mast = new THREE.Mesh(new THREE.BoxGeometry(2.5, 60, 2.5), mastMat);
    mast.position.y = 30;
    group.add(mast);

    // Rotating jib assembly
    const jibGroup = new THREE.Group();
    jibGroup.position.y = 60;

    // Operator cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 4), new THREE.MeshBasicMaterial({ color: 0x1e293b }));
    cab.position.set(0, 1.5, 2);
    jibGroup.add(cab);

    // Main jib arm (40m long)
    const jibArm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 42), mastMat);
    jibArm.position.set(0, 2, 18);
    jibGroup.add(jibArm);

    // Counter-jib & concrete counterweight
    const counterJib = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 14), mastMat);
    counterJib.position.set(0, 2, -7);
    jibGroup.add(counterJib);

    const cWeight = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 4), this.matConcrete);
    cWeight.position.set(0, 2, -12);
    jibGroup.add(cWeight);

    // Red warning blinker
    const blinker = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), this.matNeonRed);
    blinker.position.set(0, 4, 38);
    jibGroup.add(blinker);

    group.add(jibGroup);
    return { group, jibGroup, rotSpeed: (Math.random() - 0.5) * 0.4 };
  }

  buildBanffHotSprings() {
    // Steaming Banff Upper Hot Springs geothermal pool at [-120, 0, -40]
    const root = new THREE.Group();
    root.position.set(-120, 0, -40);

    // Natural stone rim
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57606f, roughness: 0.9 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(12, 1.8, 8, 24), stoneMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.8;
    root.add(rim);

    // Steaming mineral water pool
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2ed573,
      metalness: 0.6,
      roughness: 0.2,
      transparent: true,
      opacity: 0.78
    });
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(11.8, 11.8, 1.2, 24), waterMat);
    pool.position.y = 0.6;
    root.add(pool);

    // Surrounding alpine fir trees
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x1e3725, roughness: 0.9 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d271d });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tx = Math.cos(a) * 18;
      const tz = Math.sin(a) * 18;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 3), trunkMat);
      trunk.position.set(tx, 1.5, tz);
      root.add(trunk);
      const pine = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 8), treeMat);
      pine.position.set(tx, 6, tz);
      root.add(pine);
    }

    this.scene.add(root);

    this.landmarks.push({
      name: 'Banff Hot Springs (+Warmth & Health)',
      pos: new THREE.Vector3(-120, 0, -40),
      color: '#10b981',
      size: 4
    });
  }

  buildSugarShack() {
    // Sugar Shack (Cabane à Sucre) at [-60, 0, 110]
    const root = new THREE.Group();
    root.position.set(-60, 0, 110);

    const logMat = new THREE.MeshStandardMaterial({ color: 0x7c4a24, roughness: 0.85 });
    // Cabin body
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 10), logMat);
    cabin.position.y = 3.5;
    root.add(cabin);

    // Pitched snow roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf1f2f6, roughness: 0.7 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(11, 4.5, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 9;
    root.add(roof);

    // Stone chimney
    const chimMat = new THREE.MeshStandardMaterial({ color: 0x57606f });
    const chim = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), chimMat);
    chim.position.set(4, 7, 2);
    root.add(chim);

    // Maple leaf sign
    const signMat = new THREE.MeshBasicMaterial({ color: 0xff4757 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(4, 1.8, 0.2), signMat);
    sign.position.set(0, 5, 5.2);
    root.add(sign);

    this.scene.add(root);
    this.addCollider(cabin);

    this.landmarks.push({
      name: 'Sugar Shack (Cabane à Sucre)',
      pos: new THREE.Vector3(-60, 0, 110),
      color: '#ef4444',
      size: 4
    });
  }

  buildCTrainLRT() {
    // Elevated C-Train Track Loop winding through downtown
    this.trackCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-150, 8, -150),
      new THREE.Vector3(-80, 8, -50),
      new THREE.Vector3(-100, 8, 40),  // Pass through library underpass
      new THREE.Vector3(0, 8, 120),
      new THREE.Vector3(120, 8, 80),
      new THREE.Vector3(140, 8, -70),
      new THREE.Vector3(40, 8, -160)
    ], true);

    const trackPts = this.trackCurve.getPoints(120);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const railGeo = new THREE.BufferGeometry().setFromPoints(trackPts);
    const railLine = new THREE.Line(railGeo, new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 }));
    this.scene.add(railLine);

    // Support pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    for (let i = 0; i < trackPts.length; i += 12) {
      const pt = trackPts[i];
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, pt.y, 8), pillarMat);
      pil.position.set(pt.x, pt.y / 2, pt.z);
      this.scene.add(pil);
    }

    // 3-car Siemens S200 C-Train Consist
    this.trainRoot = new THREE.Group();
    const carMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const redStripe = new THREE.MeshBasicMaterial({ color: 0xdc2626 });

    for (let c = 0; c < 3; c++) {
      const carGroup = new THREE.Group();
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 12), carMat);
      carGroup.add(carBody);

      // Red livery stripe
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.7, 12.1), redStripe);
      stripe.position.y = 0.2;
      carGroup.add(stripe);

      // Windows
      const win = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.8, 9), this.matGlass);
      win.position.y = 0.8;
      carGroup.add(win);

      this.trainRoot.add(carGroup);
      this.cTrainCars.push(carGroup);
    }

    this.scene.add(this.trainRoot);
  }

  buildStreetFurniture() {
    // Streetlights and benches
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let x = -180; x <= 180; x += 90) {
      for (let z = -180; z <= 180; z += 90) {
        if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;
        const lamp = new THREE.Group();
        lamp.position.set(x + 12, 0, z + 12);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 9, 8), lampMat);
        pole.position.y = 4.5;
        lamp.add(pole);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), glowMat);
        head.position.y = 9;
        lamp.add(head);

        this.scene.add(lamp);
      }
    }
  }

  update(dt = 0.016) {
    // Animate Calgary Tower beacon blink
    if (this.calgaryBeacon) {
      const b = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
      this.calgaryBeacon.material.color.setRGB(1.0 * b, 0.1 * b, 0.1 * b);
    }

    // Animate Telus Sky dynamic LED facade
    if (this.ledPixels && this.ledPixels.length > 0) {
      const t = Date.now() * 0.003;
      this.ledPixels.forEach((mat, idx) => {
        const hue = (t + idx * 0.08) % 1.0;
        mat.color.setHSL(hue, 1.0, 0.5);
      });
    }

    // Animate Scotia Place tower cranes
    this.cranes.forEach(crane => {
      crane.jibGroup.rotation.y += crane.rotSpeed * dt;
    });

    // Animate C-Train along Catmull-Rom track
    if (this.trackCurve && this.cTrainCars.length > 0) {
      this.cTrainTrackT = (this.cTrainTrackT + dt * 0.025) % 1.0;

      for (let i = 0; i < this.cTrainCars.length; i++) {
        const offsetT = (this.cTrainTrackT - i * 0.045 + 1.0) % 1.0;
        const pos = this.trackCurve.getPointAt(offsetT);
        const tangent = this.trackCurve.getTangentAt(offsetT).normalize();

        const car = this.cTrainCars[i];
        car.position.copy(pos);
        // Look in direction of travel
        const lookTarget = pos.clone().add(tangent);
        car.lookAt(lookTarget);
      }
    }
  }
}

window.CalgaryMetropolis = CalgaryMetropolis;
