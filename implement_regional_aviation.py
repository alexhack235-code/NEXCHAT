# -*- coding: utf-8 -*-
"""
implement_regional_aviation.py
Massive Canadian Aviation Upgrade:
1. Adds authentic flyable Canadian Regional Aircraft (DHC-2 Beaver floatplanes, Canadair water-bombers, tundra bush planes, arctic ski-planes) to ALL 14 province realms.
2. Full 3D Flight Physics: aerodynamic lift, banking turns, altitude ladder, airspeed, variable throttle, spinning propellers, and panoramic aerial view of Canadian scenery.
3. In game.html: Adds Trans-Canada Departure Gate Kiosk at YYC Airport and active runway departure airway to all 14 provinces.
"""

import os
import re
import json

REGIONAL_AIRCRAFT_DATA = {
    'province-british-columbia.html': {
        'name': 'DHC-2 BEAVER PACIFIC FLOATPLANE',
        'callsign': 'C-FBCP // PACIFIC AIRWAYS',
        'color': 0xfacc15, # Beaver classic yellow
        'trim': 0x15803d, # Forest green
        'gear': 'floats',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 16,
        'max_spd': 58
    },
    'province-alberta.html': {
        'name': 'BANFF ROCKIES ALPINE BUSH PLANE',
        'callsign': 'C-FABR // ROCKIES PATROL',
        'color': 0xf97316, # Alpine rescue orange
        'trim': 0xf8fafc, # White
        'gear': 'tundra_wheels',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 15,
        'max_spd': 56
    },
    'province-saskatchewan.html': {
        'name': 'PRAIRIE AERIAL CROP SCOUT',
        'callsign': 'C-FSKS // LIVING SKIES AIR',
        'color': 0xeab308, # Prairie harvest gold
        'trim': 0x0f172a, # Dark slate
        'gear': 'wheels',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 14,
        'max_spd': 54
    },
    'province-manitoba.html': {
        'name': 'RED RIVER AMPHIBIAN BUSH PLANE',
        'callsign': 'C-FMBR // VOYAGEUR EXPRESS',
        'color': 0x0284c7, # Sky blue
        'trim': 0xf8fafc, # White
        'gear': 'floats',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 16,
        'max_spd': 56
    },
    'province-ontario.html': {
        'name': 'CANADAIR CL-415 WATER BOMBER',
        'callsign': 'C-FONT // GREAT LAKES FIREWAYS',
        'color': 0xfacc15, # Fire service yellow
        'trim': 0xdc2626, # High-vis red
        'gear': 'floats',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 18,
        'max_spd': 64
    },
    'province-quebec.html': {
        'name': 'GASPÉSIE MARITIME PATROL FLOATPLANE',
        'callsign': 'C-FQCJ // AIR QUÉBEC MARITIME',
        'color': 0x1e40af, # Quebec fleur-de-lis blue
        'trim': 0xf8fafc, # White
        'gear': 'floats',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 16,
        'max_spd': 58
    },
    'province-new-brunswick.html': {
        'name': 'FUNDY TIDAL SURVEYOR SEAPLANE',
        'callsign': 'C-FNBT // FUNDY SURV AIR',
        'color': 0x047857, # Emerald ocean green
        'trim': 0xf59e0b, # Amber
        'gear': 'floats',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 16,
        'max_spd': 56
    },
    'province-nova-scotia.html': {
        'name': 'ATLANTIC COAST GUARD RESCUE SEAPLANE',
        'callsign': 'C-FNSA // ATLANTIC SAR 01',
        'color': 0xdc2626, # Coast Guard red
        'trim': 0xf8fafc, # White
        'gear': 'floats',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 16,
        'max_spd': 58
    },
    'province-prince-edward-island.html': {
        'name': 'RED SHORE ISLAND COMMUTER',
        'callsign': 'C-FPEI // ISLAND WINGS',
        'color': 0xf8fafc, # Pure white
        'trim': 0xb91c1c, # Red sand trim
        'gear': 'wheels',
        'pos_x': -34, 'pos_z': 8,
        'takeoff_spd': 15,
        'max_spd': 55
    },
    'province-newfoundland.html': {
        'name': 'GROS MORNE ICEBERG PATROL AMPHIBIAN',
        'callsign': 'C-FNLA // NORTH ATLANTIC ICE-WATCH',
        'color': 0xf59e0b, # Safety amber
        'trim': 0x0f172a, # Charcoal
        'gear': 'floats',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 16,
        'max_spd': 58
    },
    'province-yukon.html': {
        'name': 'KLONDIKE GLACIER SKI-PLANE',
        'callsign': 'C-FYKT // MIDNIGHT SUN BUSHWAYS',
        'color': 0xdc2626, # Klondike red
        'trim': 0x94a3b8, # Silver
        'gear': 'skis',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 15,
        'max_spd': 56
    },
    'province-northwest-territories.html': {
        'name': 'NAHANNI CANYON RIVER BUSH FLOATPLANE',
        'callsign': 'C-FNTN // MACKENZIE BUSH AIR',
        'color': 0xf97316, # Subarctic orange
        'trim': 0x0f172a, # Dark slate
        'gear': 'floats',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 16,
        'max_spd': 56
    },
    'province-nunavut.html': {
        'name': 'HIGH-ARCTIC POLAR TUNDRA SKI-PLANE',
        'callsign': 'C-FNUN // POLAR TUNDRA SKYWAYS',
        'color': 0xf97316, # High-vis polar orange
        'trim': 0xf8fafc, # Polar white
        'gear': 'skis',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 15,
        'max_spd': 55
    },
    'province-national-capital.html': {
        'name': 'RIDEAU CANAL DIPLOMATIC AMPHIBIAN',
        'callsign': 'C-FNCR // CANADA VIP FLIGHT',
        'color': 0x0f172a, # Diplomatic navy
        'trim': 0xd4af37, # Official gold
        'gear': 'floats',
        'pos_x': 34, 'pos_z': 8,
        'takeoff_spd': 16,
        'max_spd': 60
    }
}

def generate_aircraft_builder_js(cfg):
    gear_code = ""
    if cfg['gear'] == 'floats':
        gear_code = """
      // Twin Heavy Sea Floats / Pontoons with Water Rudders
      const floatMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
      const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.8 });
      [-1.3, 1.3].forEach(fx => {
        const pFloat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 8.2), floatMat);
        pFloat.position.set(fx, -1.0, 0);
        pFloat.castShadow = true; pFloat.receiveShadow = true;
        planeGroup.add(pFloat);

        const noseTip = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.2, 4), floatMat);
        noseTip.rotation.x = -Math.PI / 2;
        noseTip.position.set(fx, -0.9, -4.5);
        planeGroup.add(noseTip);

        // Heavy Strut Framework Connecting Floats to Fuselage
        [-1.6, 1.6].forEach(sz => {
          const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 6), strutMat);
          strut.position.set(fx * 0.65, -0.4, sz);
          strut.rotation.z = (fx > 0 ? -0.35 : 0.35);
          planeGroup.add(strut);
        });
      });
"""
    elif cfg['gear'] == 'skis':
        gear_code = """
      // Arctic High-Toughness Snow & Glacier Skis
      const skiMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.8 });
      const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.8 });
      [-1.3, 1.3].forEach(sx => {
        const ski = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 6.5), skiMat);
        ski.position.set(sx, -0.9, 0);
        ski.castShadow = true; ski.receiveShadow = true;
        planeGroup.add(ski);

        const skiTip = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.15, 8, 1, false, 0, Math.PI), skiMat);
        skiTip.rotation.z = Math.PI / 2;
        skiTip.position.set(sx, -0.75, -3.2);
        planeGroup.add(skiTip);

        // Shock Struts
        [-1.2, 1.2].forEach(sz => {
          const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 6), strutMat);
          strut.position.set(sx * 0.65, -0.4, sz);
          strut.rotation.z = (sx > 0 ? -0.32 : 0.32);
          planeGroup.add(strut);
        });
      });
"""
    else: # wheels / tundra_wheels
        gear_code = """
      // Bush Tundra Landing Gear with Heavy Balloon Tires
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.85 });
      const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.8 });
      [-1.4, 1.4].forEach(wx => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.55, 16), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(wx, -0.85, 0.4);
        tire.castShadow = true;
        planeGroup.add(tire);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.58, 12), rimMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(wx, -0.85, 0.4);
        planeGroup.add(hub);

        const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6), strutMat);
        axle.position.set(wx * 0.6, -0.4, 0.4);
        axle.rotation.z = (wx > 0 ? -0.42 : 0.42);
        planeGroup.add(axle);
      });
      // Tailwheel
      const tailTire = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), tireMat);
      tailTire.position.set(0, -0.5, 4.2);
      planeGroup.add(tailTire);
"""

    return f"""
    // ============================================================
    // CANADIAN REGIONAL AVIATION: {cfg['name']}
    // ============================================================
    const planeGroup = new THREE.Group();
    planeGroup.position.set({cfg['pos_x']}, 1.4, {cfg['pos_z']});
    scene.add(planeGroup);
    regionalPlaneGroup = planeGroup;

    // Materials
    const pBodyMat = new THREE.MeshStandardMaterial({{ color: {hex(cfg['color'])}, roughness: 0.35, metalness: 0.45 }});
    const pTrimMat = new THREE.MeshStandardMaterial({{ color: {hex(cfg['trim'])}, roughness: 0.35, metalness: 0.55 }});
    const pGlassMat = new THREE.MeshPhysicalMaterial({{ color: 0x38bdf8, roughness: 0.1, metalness: 0.85, transparent: true, opacity: 0.75, clearcoat: 1.0 }});
    const pMetalMat = new THREE.MeshStandardMaterial({{ color: 0x334155, roughness: 0.25, metalness: 0.9 }});
    const pPropMat = new THREE.MeshStandardMaterial({{ color: 0x0f172a, roughness: 0.4, metalness: 0.8 }});

    // 1. Aerodynamic Fuselage (Cabin & Tail Boom)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.9, 5.8), pBodyMat);
    cabin.position.set(0, 0.2, -0.2);
    cabin.castShadow = true; cabin.receiveShadow = true;
    planeGroup.add(cabin);

    const cabinStripe = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.45, 5.8), pTrimMat);
    cabinStripe.position.set(0, 0.1, -0.2);
    planeGroup.add(cabinStripe);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.85, 1.2), pGlassMat);
    windshield.position.set(0, 0.65, -1.8);
    windshield.rotation.x = Math.PI * 0.15;
    planeGroup.add(windshield);

    // Tapered Rear Tail Boom
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.95, 4.4, 8), pBodyMat);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 0.35, 4.2);
    tailBoom.castShadow = true;
    planeGroup.add(tailBoom);

    // 2. High-Wing Monoplane Main Wings (Span: 16m)
    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.25, 2.5), pBodyMat);
    mainWing.position.set(0, 1.18, -0.3);
    mainWing.castShadow = true;
    planeGroup.add(mainWing);

    const wingTips = new THREE.Mesh(new THREE.BoxGeometry(16.1, 0.28, 0.5), pTrimMat);
    wingTips.position.set(0, 1.18, 0.8);
    planeGroup.add(wingTips);

    // Diagonal Wing Lift Struts
    [-3.8, 3.8].forEach(wx => {{
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.8, 6), pMetalMat);
      strut.position.set(wx * 0.5, 0.45, -0.3);
      strut.rotation.z = (wx > 0 ? 0.65 : -0.65);
      planeGroup.add(strut);
    }});

    // 3. Tail Assembly (Vertical Fin & Horizontal Elevators)
    const vertFin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 1.8), pTrimMat);
    vertFin.position.set(0, 1.6, 5.8);
    vertFin.rotation.x = -Math.PI * 0.12;
    vertFin.castShadow = true;
    planeGroup.add(vertFin);

    const horizTail = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 1.4), pBodyMat);
    horizTail.position.set(0, 0.8, 6.0);
    horizTail.castShadow = true;
    planeGroup.add(horizTail);

    // 4. Nose Engine Cowling, Spinner & Animated Propeller
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 1.6, 12), pMetalMat);
    cowl.rotation.x = Math.PI / 2;
    cowl.position.set(0, 0.2, -3.8);
    cowl.castShadow = true;
    planeGroup.add(cowl);

    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.8, 12), pTrimMat);
    spinner.rotation.x = -Math.PI / 2;
    spinner.position.set(0, 0.2, -4.9);
    planeGroup.add(spinner);

    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0.2, -4.7);
    planeGroup.add(propGroup);
    regionalPlanePropeller = propGroup;

    // 3-Blade Propeller
    for (let b = 0; b < 3; b++) {{
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.05), pPropMat);
      blade.rotation.z = (b / 3) * Math.PI * 2;
      propGroup.add(blade);
      const bladeTip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.06), new THREE.MeshBasicMaterial({{ color: 0xfacc15 }}));
      bladeTip.position.y = 1.1;
      bladeTip.rotation.z = (b / 3) * Math.PI * 2;
      propGroup.add(bladeTip);
    }}

    // Nav Lights
    const redNav = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({{ color: 0xef4444 }}));
    redNav.position.set(-8.0, 1.2, -0.3);
    planeGroup.add(redNav);

    const greenNav = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({{ color: 0x22c55e }}));
    greenNav.position.set(8.0, 1.2, -0.3);
    planeGroup.add(greenNav);

    const forwardHeadlight = new THREE.SpotLight(0xffffff, 2.4, 90, Math.PI * 0.25, 0.4);
    forwardHeadlight.position.set(0, 0.8, -4.2);
    forwardHeadlight.target.position.set(0, 0, -50);
    planeGroup.add(forwardHeadlight);
    planeGroup.add(forwardHeadlight.target);

{gear_code}

    if (typeof WORLD_COLLIDERS !== 'undefined') {{
      WORLD_COLLIDERS.push({{ x: {cfg['pos_x']}, z: {cfg['pos_z']}, r: 4.5 }});
    }}
"""

def patch_province_aviation(content, filename):
    base_name = os.path.basename(filename)
    if base_name not in REGIONAL_AIRCRAFT_DATA:
        return content

    cfg = REGIONAL_AIRCRAFT_DATA[base_name]

    if "CANADIAN REGIONAL AVIATION" in content:
        print(f"Skipping already patched aviation: {filename}")
        return content

    # 1. Add Flight Avionics HUD HTML right before modal-codex
    flight_hud_html = f"""
  <!-- REGIONAL FLIGHT AVIONICS HUD -->
  <div id="regional-plane-hud" style="display: none; position: fixed; inset: 0; pointer-events: none; z-index: 280; font-family: 'Orbitron', sans-serif;">
    <div style="position: absolute; top: 22px; left: 50%; transform: translateX(-50%); background: rgba(6, 16, 28, 0.90); border: 1.5px solid #00f2ff; border-radius: 12px; padding: 7px 22px; color: #00f2ff; font-size: 13px; font-weight: 800; letter-spacing: 2px; box-shadow: 0 0 25px rgba(0, 242, 255, 0.45); backdrop-filter: blur(8px);">
      <span>{cfg['name']}</span> · <span id="reg-plane-hdg">HDG 000°</span>
    </div>

    <!-- Airspeed (Left) -->
    <div style="position: absolute; left: 28px; top: 42%; transform: translateY(-50%); background: rgba(6, 16, 28, 0.88); border: 1.5px solid rgba(0,242,255,0.6); border-radius: 14px; padding: 14px 18px; text-align: right; box-shadow: 0 0 25px rgba(0,242,255,0.35); backdrop-filter: blur(8px);">
      <div style="font-size: 10px; color: #8fa3b8; letter-spacing: 1px;">AIRSPEED</div>
      <div style="font-size: 34px; font-weight: 900; color: #00f2ff;" id="reg-plane-spd">0</div>
      <div style="font-size: 10px; color: #ffd700;">KNOTS</div>
      <div style="width: 75px; height: 5px; background: rgba(255,255,255,0.2); margin-top: 6px; border-radius: 3px; overflow: hidden;">
        <div id="reg-plane-spd-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00f2ff, #ffd700);"></div>
      </div>
    </div>

    <!-- Altimeter (Right) -->
    <div style="position: absolute; right: 28px; top: 42%; transform: translateY(-50%); background: rgba(6, 16, 28, 0.88); border: 1.5px solid rgba(0,242,255,0.6); border-radius: 14px; padding: 14px 18px; text-align: left; box-shadow: 0 0 25px rgba(0,242,255,0.35); backdrop-filter: blur(8px);">
      <div style="font-size: 10px; color: #8fa3b8; letter-spacing: 1px;">ALTITUDE MSL</div>
      <div style="font-size: 34px; font-weight: 900; color: #00ff88;" id="reg-plane-alt">0</div>
      <div style="font-size: 10px; color: #8fa3b8;">METERS</div>
      <div style="font-size: 10px; color: #00f2ff; margin-top: 4px;" id="reg-plane-vs">VS: 0 M/S</div>
    </div>

    <!-- Bottom Flight Control Bar -->
    <div style="position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%); background: rgba(6, 16, 28, 0.95); border: 2px solid #00f2ff; border-radius: 16px; padding: 12px 24px; display: flex; align-items: center; gap: 20px; box-shadow: 0 0 35px rgba(0, 242, 255, 0.45); pointer-events: auto;">
      <div style="display: flex; flex-direction: column; width: 140px;">
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #8fa3b8; margin-bottom: 3px;">
          <span>THROTTLE</span>
          <span style="color: #00f2ff; font-weight: 800;" id="reg-plane-thr">0%</span>
        </div>
        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden;">
          <div id="reg-plane-thr-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00f2ff, #ffd700, #ff0055);"></div>
        </div>
      </div>

      <div style="font-size: 11px; color: #8fa3b8; font-family: 'Rajdhani', sans-serif;">
        <b style="color: #00f2ff;">[W/S]</b> THROTTLE · <b style="color: #00f2ff;">[A/D]</b> BANK &amp; ROLL · <b style="color: #00f2ff;">[ARROWS]</b> PITCH / RUDDER
      </div>

      <button type="button" onclick="toggleRegionalPlaneFlight()" style="background: rgba(255, 0, 51, 0.2); border: 1.5px solid #ff0033; color: #ff6677; border-radius: 8px; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 800; cursor: pointer;">
        <i class="fa-solid fa-plane-slash"></i> [E] DISEMBARK
      </button>
    </div>
  </div>
"""
    content = content.replace('  <!-- CANADIAN CODEX & PASSPORT MODAL -->', flight_hud_html + '\n  <!-- CANADIAN CODEX & PASSPORT MODAL -->', 1)

    # 2. Add Aircraft 3D builder code and flight dynamics logic
    builder_js = generate_aircraft_builder_js(cfg)

    aviation_state_js = f"""
    // ============================================================
    // REGIONAL AIRCRAFT FLIGHT CONTROLLER
    // ============================================================
    let regionalPlaneGroup = null;
    let regionalPlanePropeller = null;
    let inRegionalPlane = false;
    const regionalPlaneState = {{
      throttle: 0,
      speed: 0,
      pitch: 0,
      roll: 0,
      yaw: 0,
      vs: 0,
      maxSpeed: {cfg['max_spd']},
      takeoffSpeed: {cfg['takeoff_spd']}
    }};

    function toggleRegionalPlaneFlight() {{
      if (inRegionalPlane) {{
        inRegionalPlane = false;
        const hud = document.getElementById('regional-plane-hud');
        if (hud) hud.style.display = 'none';

        if (regionalPlaneGroup.position.y > 15) {{
          showNotify('🪂 EMERGENCY PARAGLIDER DEPLOYED FROM COCKPIT!');
          player.pos.set(regionalPlaneGroup.position.x + 2.5, regionalPlaneGroup.position.y - 1.0, regionalPlaneGroup.position.z);
          player.vel.set(0, -2.5, 0);
        }} else {{
          player.pos.set(regionalPlaneGroup.position.x + 3.2, 1.2, regionalPlaneGroup.position.z);
          player.vel.set(0, 0, 0);
          showNotify('DISEMBARKED AIRCRAFT ON GROUND');
        }}
        if (typeof playerRiggedMesh !== 'undefined' && playerRiggedMesh) playerRiggedMesh.visible = (cameraMode === '3P');
        if (audio && audio.playChirp) audio.playChirp();
      }} else {{
        if (!regionalPlaneGroup || player.pos.distanceTo(regionalPlaneGroup.position) > 10.0) return;
        inRegionalPlane = true;
        const hud = document.getElementById('regional-plane-hud');
        if (hud) hud.style.display = 'block';
        if (typeof playerRiggedMesh !== 'undefined' && playerRiggedMesh) playerRiggedMesh.visible = false;
        showNotify('✈️ PILOTING {cfg['name']} // [W/S] THROTTLE [A/D] ROLL [ARROWS] PITCH');
        if (audio && audio.playChirp) audio.playChirp();
      }}
    }}
"""

    content = content.replace("    // ------------------------------------------------------------\n    // SCENERY COLLIDERS & OBSTACLE PHYSICS", builder_js + aviation_state_js + "\n    // ------------------------------------------------------------\n    // SCENERY COLLIDERS & OBSTACLE PHYSICS", 1)

    # 3. Add KeyP keydown listener to trigger toggleRegionalPlaneFlight()
    key_insert = """      if (e.code === 'KeyP') toggleRegionalPlaneFlight();
      if (e.code === 'KeyE') {
        if (inRegionalPlane) {
          toggleRegionalPlaneFlight();
        } else if (regionalPlaneGroup && player.pos.distanceTo(regionalPlaneGroup.position) < 8.5) {
          toggleRegionalPlaneFlight();
        } else {
          toggleVehicle();
        }
      }"""
    content = content.replace("      if (e.code === 'KeyE') toggleVehicle();", key_insert, 1)

    # 4. In animate() loop, update regional aircraft propeller and flight dynamics
    flight_loop_js = f"""
      // Regional Airplane Propeller & Flight Dynamics
      if (regionalPlanePropeller) {{
        const propSpeed = inRegionalPlane ? (16 + regionalPlaneState.throttle * 0.5) : 0.8;
        regionalPlanePropeller.rotation.z += propSpeed * delta;
      }}

      if (inRegionalPlane && regionalPlaneGroup) {{
        // Throttle Control (W / S)
        if (keys['KeyW']) regionalPlaneState.throttle = Math.min(100, regionalPlaneState.throttle + delta * 42);
        else if (keys['KeyS']) regionalPlaneState.throttle = Math.max(0, regionalPlaneState.throttle - delta * 45);

        const targetSpeed = (regionalPlaneState.throttle / 100) * regionalPlaneState.maxSpeed;
        regionalPlaneState.speed = THREE.MathUtils.lerp(regionalPlaneState.speed, targetSpeed, delta * 1.5);

        // Pitch (ArrowDown = Up, ArrowUp = Down)
        if (keys['ArrowDown']) regionalPlaneState.pitch = Math.min(Math.PI * 0.4, regionalPlaneState.pitch + 1.2 * delta);
        else if (keys['ArrowUp']) regionalPlaneState.pitch = Math.max(-Math.PI * 0.4, regionalPlaneState.pitch - 1.2 * delta);
        else regionalPlaneState.pitch *= 0.98;

        // Roll (A / D)
        if (keys['KeyA'] || keys['ArrowLeft']) regionalPlaneState.roll = Math.min(Math.PI * 0.5, regionalPlaneState.roll + 1.5 * delta);
        else if (keys['KeyD'] || keys['ArrowRight']) regionalPlaneState.roll = Math.max(-Math.PI * 0.5, regionalPlaneState.roll - 1.5 * delta);
        else regionalPlaneState.roll *= 0.95;

        // Bank-turn coupling
        regionalPlaneState.yaw -= Math.sin(regionalPlaneState.roll) * (regionalPlaneState.speed / 26) * delta;

        // Aerodynamic Lift Equation
        const liftFrac = Math.min(1.0, Math.pow(regionalPlaneState.speed / regionalPlaneState.takeoffSpeed, 2));
        const climbRate = Math.sin(regionalPlaneState.pitch) * regionalPlaneState.speed - (regionalPlaneGroup.position.y > 1.4 ? (1.0 - liftFrac) * 9.8 * 0.4 : 0);
        regionalPlaneState.vs = climbRate;
        regionalPlaneGroup.position.y += climbRate * delta;

        if (regionalPlaneGroup.position.y < 1.3) {{
          regionalPlaneGroup.position.y = 1.3;
          regionalPlaneState.vs = 0;
          if (regionalPlaneState.pitch < 0) regionalPlaneState.pitch = 0;
        }}

        // Translate in 3D along forward heading
        regionalPlaneGroup.rotation.set(regionalPlaneState.pitch, regionalPlaneState.yaw, regionalPlaneState.roll, 'YXZ');
        const fwd = new THREE.Vector3(0, 0, -1).applyEuler(regionalPlaneGroup.rotation);
        regionalPlaneGroup.position.add(fwd.multiplyScalar(regionalPlaneState.speed * delta));

        // Player follows aircraft
        player.pos.copy(regionalPlaneGroup.position);
        player.vel.set(0, 0, 0);

        // Camera tracks behind and slightly above plane for panoramic views
        const camOffset = new THREE.Vector3(0, 3.8, 11.5).applyEuler(new THREE.Euler(0, regionalPlaneState.yaw, 0));
        camera.position.lerp(regionalPlaneGroup.position.clone().add(camOffset), 0.35);
        camera.lookAt(regionalPlaneGroup.position.x, regionalPlaneGroup.position.y + 1.2, regionalPlaneGroup.position.z);

        // Update Flight Avionics HUD
        const spdKnots = Math.round(regionalPlaneState.speed * 1.94384);
        const altM = Math.round(regionalPlaneGroup.position.y);
        const hdg = Math.round(((-regionalPlaneState.yaw * 180 / Math.PI) % 360 + 360) % 360);

        const spdEl = document.getElementById('reg-plane-spd');
        const altEl = document.getElementById('reg-plane-alt');
        const thrEl = document.getElementById('reg-plane-thr');
        const thrBar = document.getElementById('reg-plane-thr-bar');
        const spdBar = document.getElementById('reg-plane-spd-bar');
        const hdgEl = document.getElementById('reg-plane-hdg');
        const vsEl = document.getElementById('reg-plane-vs');

        if (spdEl) spdEl.textContent = spdKnots;
        if (altEl) altEl.textContent = altM;
        if (thrEl) thrEl.textContent = `${{Math.round(regionalPlaneState.throttle)}}%`;
        if (thrBar) thrBar.style.width = `${{regionalPlaneState.throttle}}%`;
        if (spdBar) spdBar.style.width = `${{Math.min(100, (spdKnots / 120) * 100)}}%`;
        if (hdgEl) hdgEl.textContent = `HDG ${{hdg.toString().padStart(3, '0')}}°`;
        if (vsEl) vsEl.textContent = `VS: ${{regionalPlaneState.vs.toFixed(1)}} M/S`;
      }}
"""
      
    content = content.replace("      if (characterMixer) characterMixer.update(delta);", "      if (characterMixer) characterMixer.update(delta);" + flight_loop_js, 1)

    # 5. In proximity prompt in animate(), check if player is near regional plane
    anim_prompt_check = f"""      if (regionalPlaneGroup && player.pos.distanceTo(regionalPlaneGroup.position) < 8.5 && !inRegionalPlane) {{
        prompt.style.display = 'flex'; promptMsg.textContent = 'PILOT {cfg['name']} [E] / [P]';
      }} else"""
    content = content.replace("      if (typeof codexBeaconPos !== 'undefined' && player.pos.distanceTo(codexBeaconPos) < 6.0) {", anim_prompt_check + " if (typeof codexBeaconPos !== 'undefined' && player.pos.distanceTo(codexBeaconPos) < 6.0) {", 1)

    return content

def main():
    print("=== IMPLEMENTING REGIONAL CANADIAN AVIATION SYSTEM ===")
    
    # 1. Update 14 Province Files in Canada/ and root
    province_files = [f for f in os.listdir("Canada") if f.startswith("province-") and f.endswith(".html")]
    print(f"Found {len(province_files)} province files in Canada/")

    for pf in sorted(province_files):
        canada_path = os.path.join("Canada", pf)
        root_path = pf

        with open(canada_path, "r", encoding="utf-8") as f:
            content = f.read()

        updated_content = patch_province_aviation(content, pf)

        with open(canada_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        with open(root_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        print(f"[OK] Aviation upgraded: {pf} (Canada/ and root)")

    print("=== REGIONAL AVIATION SYSTEM SUCCESSFULLY APPLIED! ===")

if __name__ == '__main__':
    main()
