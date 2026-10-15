// js/game_modules/yyc_aviation.js
// Calgary International Airport (YYC) & 3 Flyable Aircraft Flight Dynamics System

class YYCAviation {
  constructor(scene, colliders = []) {
    this.scene = scene;
    this.colliders = colliders;
    this.aircraftList = [];
    this.activeAircraft = null;
    this.gearDown = true;
    this.avionicsHUD = null;
    this.radarDish = null;

    this.initAirportGround();
    this.initATCTower();
    this.initHangarsAndTerminal();
    this.initAircraftFleet();
    this.initAvionicsHUD();
    this.bindFlightKeys();
  }

  initAirportGround() {
    // YYC Airport Zone located at [350, 0, -350]
    const root = new THREE.Group();
    root.position.set(350, 0, -350);

    // Main Runway 17L/35R (400m long x 45m wide)
    const rwyMat = new THREE.MeshStandardMaterial({ color: 0x181e26, roughness: 0.95 });
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(45, 450), rwyMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, 0.08, 0);
    root.add(runway);

    // Runway threshold piano keys
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let k = -16; k <= 16; k += 4) {
      const stripe1 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 24), lineMat);
      stripe1.rotation.x = -Math.PI / 2;
      stripe1.position.set(k, 0.1, -200);
      root.add(stripe1);

      const stripe2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 24), lineMat);
      stripe2.rotation.x = -Math.PI / 2;
      stripe2.position.set(k, 0.1, 200);
      root.add(stripe2);
    }

    // Runway centerline dashes
    for (let z = -170; z <= 170; z += 30) {
      const centerDash = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 18), lineMat);
      centerDash.rotation.x = -Math.PI / 2;
      centerDash.position.set(0, 0.1, z);
      root.add(centerDash);
    }

    // Runway Edge Lights (white/green/red)
    const lightMatWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let z = -220; z <= 220; z += 25) {
      const lLeft = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), lightMatWhite);
      lLeft.position.set(-23.5, 0.4, z);
      root.add(lLeft);

      const lRight = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), lightMatWhite);
      lRight.position.set(23.5, 0.4, z);
      root.add(lRight);
    }

    // Tarmac apron
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x222a35, roughness: 0.9 });
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(180, 200), apronMat);
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(115, 0.07, 0);
    root.add(apron);

    this.scene.add(root);
  }

  initATCTower() {
    // 91m Calgary YYC Air Traffic Control Tower (Tallest in Canada) at [480, 0, -320]
    const root = new THREE.Group();
    root.position.set(480, 0, -320);

    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    // Tall slender concrete shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 7.5, 76, 16), shaftMat);
    shaft.position.y = 38;
    root.add(shaft);

    // Flared cab support collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(11, 6, 6, 16), shaftMat);
    collar.position.y = 79;
    root.add(collar);

    // Double-canted glass control cab
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.88
    });
    const cab = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 11, 7, 16), cabMat);
    cab.position.y = 85.5;
    root.add(cab);

    // Roof & radome
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 1.5, 16), shaftMat);
    roof.position.y = 89.8;
    root.add(roof);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
    beacon.position.y = 92;
    root.add(beacon);
    this.atcBeacon = beacon;

    this.scene.add(root);
    if (this.colliders) {
      this.colliders.push({ pos: new THREE.Vector3(480, 40, -320), box: new THREE.Box3().setFromObject(shaft) });
    }
  }

  initHangarsAndTerminal() {
    // YYC Terminal Pier at [480, 0, -420]
    const root = new THREE.Group();
    root.position.set(480, 0, -420);

    const termMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.8 });

    const pier = new THREE.Mesh(new THREE.BoxGeometry(32, 14, 110), termMat);
    pier.position.y = 7;
    root.add(pier);

    const pierGlass = new THREE.Mesh(new THREE.BoxGeometry(32.4, 6, 100), glassMat);
    pierGlass.position.y = 8.5;
    root.add(pierGlass);

    // Hangar at [480, 0, -220]
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4 });
    const hangar = new THREE.Mesh(new THREE.BoxGeometry(50, 18, 60), hangarMat);
    hangar.position.set(0, 9, 200);
    root.add(hangar);

    // Rotating Airport Surveillance Radar Dish on hangar roof
    const radarRoot = new THREE.Group();
    radarRoot.position.set(0, 20, 200);
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.4, 16, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xff8c00 }));
    dish.rotation.x = Math.PI / 2;
    radarRoot.add(dish);
    root.add(radarRoot);
    this.radarDish = radarRoot;

    this.scene.add(root);
  }

  initAircraftFleet() {
    // 1. Apex F-99 Stealth Interceptor parked at [440, 1.8, -350]
    const f99 = this.createApexF99();
    f99.position.set(440, 1.8, -350);
    this.scene.add(f99);
    this.aircraftList.push({
      id: 'f99',
      name: 'Apex F-99 Stealth Jet',
      mesh: f99,
      type: 'jet',
      speed: 0,
      throttle: 0,
      maxSpeed: 175,
      acceleration: 48,
      turnRate: 1.8,
      liftCoeff: 0.65,
      pitch: 0,
      roll: 0,
      yaw: 0,
      isAirborne: false
    });

    // 2. Cyber Aeroliner parked at [440, 2.5, -310]
    const liner = this.createAeroliner();
    liner.position.set(440, 2.5, -310);
    this.scene.add(liner);
    this.aircraftList.push({
      id: 'liner',
      name: 'Cyber Aeroliner',
      mesh: liner,
      type: 'airliner',
      speed: 0,
      throttle: 0,
      maxSpeed: 95,
      acceleration: 24,
      turnRate: 1.1,
      liftCoeff: 0.85,
      pitch: 0,
      roll: 0,
      yaw: 0,
      isAirborne: false
    });

    // 3. VTOL Sky-Lander parked at [440, 2.0, -390]
    const vtol = this.createVTOL();
    vtol.position.set(440, 2.0, -390);
    this.scene.add(vtol);
    this.aircraftList.push({
      id: 'vtol',
      name: 'VTOL Sky-Lander',
      mesh: vtol,
      type: 'vtol',
      speed: 0,
      throttle: 0,
      maxSpeed: 110,
      acceleration: 32,
      turnRate: 1.5,
      liftCoeff: 1.2,
      pitch: 0,
      roll: 0,
      yaw: 0,
      isAirborne: false,
      rotors: vtol.userData.rotors
    });
  }

  createApexF99() {
    const group = new THREE.Group();
    const fuselageMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.75 });
    const burnerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Fuselage
    const fuse = new THREE.Mesh(new THREE.ConeGeometry(1.6, 15, 6), fuselageMat);
    fuse.rotation.x = Math.PI / 2;
    fuse.position.z = 2;
    group.add(fuse);

    // Cockpit canopy
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.8, 5, 6), canopyMat);
    canopy.rotation.x = Math.PI / 2;
    canopy.position.set(0, 0.8, 1);
    group.add(canopy);

    // Delta wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 3);
    wingShape.lineTo(6.5, -4);
    wingShape.lineTo(-6.5, -4);
    wingShape.closePath();
    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const wings = new THREE.Mesh(wingGeo, fuselageMat);
    wings.rotation.x = -Math.PI / 2;
    wings.position.y = 0.1;
    group.add(wings);

    // Twin canted vertical stabilizers
    const finGeo = new THREE.BoxGeometry(0.2, 2.5, 3);
    const finL = new THREE.Mesh(finGeo, fuselageMat);
    finL.position.set(-1.8, 1.2, -4);
    finL.rotation.z = -0.28;
    group.add(finL);

    const finR = new THREE.Mesh(finGeo, fuselageMat);
    finR.position.set(1.8, 1.2, -4);
    finR.rotation.z = 0.28;
    group.add(finR);

    // Twin Afterburner exhausts
    const burnL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.2, 8), burnerMat);
    burnL.rotation.x = Math.PI / 2;
    burnL.position.set(-0.8, 0, -5.5);
    group.add(burnL);

    const burnR = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.2, 8), burnerMat);
    burnR.rotation.x = Math.PI / 2;
    burnR.position.set(0.8, 0, -5.5);
    group.add(burnR);

    return group;
  }

  createAeroliner() {
    const group = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const blueStripe = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });

    // Fuselage cylinder
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 26, 16), whiteMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Nose cone
    const nose = new THREE.Mesh(new THREE.SphereGeometry(2.0, 16, 12), whiteMat);
    nose.position.z = 13;
    group.add(nose);

    // Cockpit windows
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.6, 2.5), glassMat);
    win.position.set(0, 0.8, 12);
    group.add(win);

    // Swept wings
    const wingGeo = new THREE.BoxGeometry(26, 0.3, 4);
    const wings = new THREE.Mesh(wingGeo, whiteMat);
    wings.position.set(0, -0.2, 1);
    group.add(wings);

    // Twin Turbofans
    const engineGeo = new THREE.CylinderGeometry(1.0, 1.0, 4.5, 12);
    const engL = new THREE.Mesh(engineGeo, whiteMat);
    engL.rotation.x = Math.PI / 2;
    engL.position.set(-6, -1.2, 2);
    group.add(engL);

    const engR = new THREE.Mesh(engineGeo, whiteMat);
    engR.rotation.x = Math.PI / 2;
    engR.position.set(6, -1.2, 2);
    group.add(engR);

    // T-Tail fin
    const vFin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 4.5), whiteMat);
    vFin.position.set(0, 3.2, -11.5);
    group.add(vFin);

    const hTail = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 2.2), blueStripe);
    hTail.position.set(0, 5.8, -12);
    group.add(hTail);

    return group;
  }

  createVTOL() {
    const group = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });

    // Chassis
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 10), hullMat);
    group.add(hull);

    // Cockpit windscreen
    const screen = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 2.8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    screen.position.set(0, 0.8, 3.8);
    group.add(screen);

    // Dual stub wings
    const wing = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 2.2), hullMat);
    wing.position.set(0, 0.8, 0);
    group.add(wing);

    // Tilt rotors on wing tips
    const rotors = [];
    [-7, 7].forEach(rx => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.5, 8), hullMat);
      nacelle.position.set(rx, 1.2, 0);
      group.add(nacelle);

      const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.05, 16), rotorMat);
      disc.position.set(rx, 2.5, 0);
      group.add(disc);
      rotors.push(disc);
    });

    group.userData.rotors = rotors;
    return group;
  }

  initAvionicsHUD() {
    let hud = document.getElementById('avionicsHUD');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'avionicsHUD';
      hud.style.cssText = `
        display:none; position:fixed; top:20px; left:50%; transform:translateX(-50%);
        background:rgba(5, 15, 25, 0.85); border:1px solid #00f0ff; box-shadow:0 0 25px rgba(0,240,255,0.4);
        border-radius:8px; padding:10px 18px; color:#00f0ff; font-family:monospace; font-size:12px;
        z-index:920; pointer-events:none; min-width:440px; text-shadow:0 0 5px #00f0ff;
      `;
      hud.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,240,255,0.3); padding-bottom:4px; margin-bottom:6px;">
          <span id="aircraftName" style="font-weight:bold; letter-spacing:1px;">AVIONICS ACTIVE</span>
          <span id="gearStatus" style="color:#2ed573;">GEAR DOWN [G]</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; text-align:center;">
          <div>AIRSPEED<br><strong id="hudSpeed" style="font-size:16px; color:#fff;">0 KTS</strong></div>
          <div>ALTITUDE<br><strong id="hudAlt" style="font-size:16px; color:#fff;">0 FT</strong></div>
          <div>THROTTLE<br><strong id="hudThrottle" style="font-size:16px; color:#fff;">0%</strong></div>
          <div>HEADING<br><strong id="hudHeading" style="font-size:16px; color:#fff;">000°</strong></div>
        </div>
        <div style="margin-top:6px; font-size:10px; color:#94a3b8; text-align:center;">
          [W/S] THROTTLE | [A/D] RUDDER | [UP/DOWN] PITCH | [Q/E] ROLL | [G] GEAR | [E] EXIT AIRCRAFT
        </div>
      `;
      document.body.appendChild(hud);
    }
    this.avionicsHUD = hud;
  }

  bindFlightKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'KeyG' && this.activeAircraft) {
        this.gearDown = !this.gearDown;
        const gearElem = document.getElementById('gearStatus');
        if (gearElem) {
          gearElem.innerText = this.gearDown ? 'GEAR DOWN [G]' : 'GEAR UP [G]';
          gearElem.style.color = this.gearDown ? '#2ed573' : '#ffaa00';
        }
        if (window.cyberAudio && window.cyberAudio.playChirp) window.cyberAudio.playChirp();
      }
    });
  }

  tryBoardOrExit(playerPos, camera) {
    if (this.activeAircraft) {
      // Exit aircraft
      const exitPos = this.activeAircraft.mesh.position.clone().add(new THREE.Vector3(5, 0, 0));
      exitPos.y = Math.max(0, exitPos.y);
      this.activeAircraft.throttle = 0;
      this.activeAircraft.speed = 0;
      this.activeAircraft = null;
      if (this.avionicsHUD) this.avionicsHUD.style.display = 'none';
      if (window.cyberAudio && window.cyberAudio.stopJetEngineSound) window.cyberAudio.stopJetEngineSound();
      return { exited: true, exitPos };
    } else {
      // Check proximity to any aircraft
      for (const ac of this.aircraftList) {
        const dist = playerPos.distanceTo(ac.mesh.position);
        if (dist <= 12) {
          this.activeAircraft = ac;
          if (this.avionicsHUD) {
            this.avionicsHUD.style.display = 'block';
            document.getElementById('aircraftName').innerText = ac.name.toUpperCase();
          }
          if (window.cyberAudio && window.cyberAudio.playLootChime) window.cyberAudio.playLootChime();
          return { boarded: true, aircraft: ac };
        }
      }
      return { none: true };
    }
  }

  update(dt = 0.016, keys = {}, camera = null) {
    // Animate radar dish
    if (this.radarDish) {
      this.radarDish.rotation.y += dt * 1.8;
    }

    // Animate ATC beacon
    if (this.atcBeacon) {
      const b = (Math.sin(Date.now() * 0.007) + 1) * 0.5;
      this.atcBeacon.material.color.setRGB(1.0 * b, 0.2 * b, 0.2 * b);
    }

    // If active aircraft being piloted
    const ac = this.activeAircraft;
    if (!ac) return;

    // Throttle controls
    if (keys['KeyW']) ac.throttle = Math.min(100, ac.throttle + dt * 40);
    if (keys['KeyS']) ac.throttle = Math.max(0, ac.throttle - dt * 45);

    // Target speed from throttle
    const targetSpeed = (ac.throttle / 100) * ac.maxSpeed;
    ac.speed += (targetSpeed - ac.speed) * dt * (ac.acceleration / 30);

    // Audio update
    if (window.cyberAudio && window.cyberAudio.playJetEngineSound) {
      window.cyberAudio.playJetEngineSound(ac.throttle, ac.speed);
    }

    // Pitch, Roll, Yaw
    const pitchInput = (keys['ArrowDown'] ? 1 : 0) - (keys['ArrowUp'] ? 1 : 0);
    const yawInput = (keys['KeyA'] ? 1 : 0) - (keys['KeyD'] ? -1 : 0);
    const rollInput = (keys['KeyQ'] ? 1 : 0) - (keys['KeyE'] ? 1 : 0);

    if (ac.speed > 15 || ac.type === 'vtol') {
      ac.mesh.rotateX(pitchInput * ac.turnRate * dt);
      ac.mesh.rotateY(yawInput * ac.turnRate * 0.7 * dt);
      ac.mesh.rotateZ(rollInput * ac.turnRate * 1.2 * dt);
    }

    // Forward translation along local Z forward
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(ac.mesh.quaternion);
    ac.mesh.position.addScaledVector(forward, ac.speed * dt);

    // Altitude floor / ground clamp
    if (ac.mesh.position.y < 1.8) {
      ac.mesh.position.y = 1.8;
      // Level out on ground
      ac.mesh.rotation.x *= 0.92;
      ac.mesh.rotation.z *= 0.92;
    }

    // VTOL rotor spin animation
    if (ac.rotors && ac.rotors.length > 0) {
      ac.rotors.forEach(r => {
        r.rotation.y += (ac.speed + 40) * dt * 0.5;
      });
    }

    // Update Avionics HUD
    const speedKts = Math.round(ac.speed * 1.94);
    const altFt = Math.round(ac.mesh.position.y * 3.28);
    const headingDeg = Math.round(((THREE.MathUtils.radToDeg(-ac.mesh.rotation.y) % 360) + 360) % 360);

    const hudSpeed = document.getElementById('hudSpeed');
    if (hudSpeed) hudSpeed.innerText = `${speedKts} KTS`;
    const hudAlt = document.getElementById('hudAlt');
    if (hudAlt) hudAlt.innerText = `${altFt} FT`;
    const hudThrottle = document.getElementById('hudThrottle');
    if (hudThrottle) hudThrottle.innerText = `${Math.round(ac.throttle)}%`;
    const hudHeading = document.getElementById('hudHeading');
    if (hudHeading) hudHeading.innerText = `${String(headingDeg).padStart(3, '0')}°`;

    // Chase camera sync
    if (camera) {
      const cameraOffset = new THREE.Vector3(0, 6, -18).applyQuaternion(ac.mesh.quaternion);
      camera.position.copy(ac.mesh.position).add(cameraOffset);
      camera.lookAt(ac.mesh.position.clone().add(new THREE.Vector3(0, 2, 8).applyQuaternion(ac.mesh.quaternion)));
    }
  }
}

window.YYCAviation = YYCAviation;
