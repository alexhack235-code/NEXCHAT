# -*- coding: utf-8 -*-
"""
implement_canadian_coldness.py
Injects:
1. Canadian Coldness & Survival Hypothermia Mechanic:
   - Body Warmth Bar & Temperature Indicator (e.g. -24°C to -42°C Windchill).
   - Warmth drops over time when exposed to outdoor Canadian winter elements.
   - Thermal Gear selector: Arctic Goose Parka (85%), Buffalo Plaid & Tuque (50%), Light Shirt (15%), or Aurora Exosuit (100%).
   - When Warmth bar hits 0%, frostbite ice vignette overlay covers screen and HEALTH DECREASES from hypothermia!
   - If Health drops to 0, hypothermia blackout triggers emergency rescue to heated outpost.
2. Heat Sources & Authentic Canadian Features:
   - Crackling Birch Campfires in all 14 realms (+40% warmth/sec).
   - Banff Geothermal Upper Hot Springs in Alberta with steaming mineral pool (100% warmth & rapid healing).
   - Traditional Maple Sugar Shack (Cabane à sucre) with Maple Taffy on Snow (Tire sur la neige) in ON, QC, NCR.
   - Canadian Bull Moose in BC, AB, MB, ON, NB and Arctic Polar Bear in Nunavut.
   - Insulated Hot Canadian Maple Coffee Thermos ([C]) to restore +35% warmth on the go.
   - Full integration in game.html (Calgary Metropolis) with heated C-Train, Central Library, and Stephen Ave fire towers.
"""

import os
import re
import json

PROVINCE_CLIMATE_DATA = {
    'province-british-columbia.html': {
        'temp': '-8°C',
        'cold_rate': 1.8,
        'feature': 'moose',
        'feature_name': 'PACIFIC COASTAL FORESTRY & MOOSE HABITAT'
    },
    'province-alberta.html': {
        'temp': '-24°C',
        'cold_rate': 2.9,
        'feature': 'hot_springs',
        'feature_name': 'BANFF GEOTHERMAL UPPER HOT SPRINGS'
    },
    'province-saskatchewan.html': {
        'temp': '-26°C',
        'cold_rate': 3.0,
        'feature': 'campfire',
        'feature_name': 'PRAIRIE GRAIN ELEVATOR CAMPFIRE'
    },
    'province-manitoba.html': {
        'temp': '-28°C',
        'cold_rate': 3.1,
        'feature': 'moose',
        'feature_name': 'RED RIVER BOREAL MARSH & MOOSE'
    },
    'province-ontario.html': {
        'temp': '-18°C',
        'cold_rate': 2.3,
        'feature': 'sugar_shack',
        'feature_name': 'TRADITIONAL MAPLE SUGAR SHACK (CABANE À SUCRE)'
    },
    'province-quebec.html': {
        'temp': '-20°C',
        'cold_rate': 2.4,
        'feature': 'sugar_shack',
        'feature_name': 'CABANE À SUCRE TRADITIONNELLE // TIRE SUR LA NEIGE'
    },
    'province-new-brunswick.html': {
        'temp': '-16°C',
        'cold_rate': 2.2,
        'feature': 'moose',
        'feature_name': 'FUNDY COASTAL TIMBER & MOOSE'
    },
    'province-nova-scotia.html': {
        'temp': '-12°C',
        'cold_rate': 2.0,
        'feature': 'campfire',
        'feature_name': 'PEGGY\'S COVE HARBOUR HEARTH'
    },
    'province-prince-edward-island.html': {
        'temp': '-14°C',
        'cold_rate': 2.1,
        'feature': 'campfire',
        'feature_name': 'RED DUNES FARMSTEAD FIRE'
    },
    'province-newfoundland.html': {
        'temp': '-15°C',
        'cold_rate': 2.3,
        'feature': 'campfire',
        'feature_name': 'OUTPORT STAGE GEAR LOFT STOVE'
    },
    'province-yukon.html': {
        'temp': '-34°C',
        'cold_rate': 3.5,
        'feature': 'campfire',
        'feature_name': 'KLONDIKE PROSPECTOR WOOD STOVE'
    },
    'province-northwest-territories.html': {
        'temp': '-36°C',
        'cold_rate': 3.6,
        'feature': 'campfire',
        'feature_name': 'MACKENZIE DEPOT FREIGHT HEARTH'
    },
    'province-nunavut.html': {
        'temp': '-42°C',
        'cold_rate': 4.0,
        'feature': 'polar_bear',
        'feature_name': 'HIGH-ARCTIC POLAR TUNDRA // POLAR BEAR'
    },
    'province-national-capital.html': {
        'temp': '-18°C',
        'cold_rate': 2.3,
        'feature': 'sugar_shack',
        'feature_name': 'RIDEAU CANAL WINTER SHACK & MAPLE TAFFY'
    }
}

def generate_canadian_feature_3d(feature_type, filename):
    if feature_type == 'hot_springs':
        return """
    // ------------------------------------------------------------
    // CANADIAN FEATURE: BANFF UPPER GEOTHERMAL HOT SPRINGS (x: -36, z: -35)
    // ------------------------------------------------------------
    const hotSpringsGroup = new THREE.Group();
    hotSpringsGroup.position.set(-36, 0, -35);
    scene.add(hotSpringsGroup);

    // Natural Limestone Retaining Pool Basin
    const poolBasin = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.5, 1.4, 20), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.1 }));
    poolBasin.position.y = 0.7;
    poolBasin.castShadow = true; poolBasin.receiveShadow = true;
    hotSpringsGroup.add(poolBasin);

    // Steaming Geothermal Turquoise Mineral Water
    const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.82, clearcoat: 1.0 });
    const mineralWater = new THREE.Mesh(new THREE.CylinderGeometry(7.8, 7.8, 0.4, 20), waterMat);
    mineralWater.position.y = 1.1;
    hotSpringsGroup.add(mineralWater);

    // Rising Geothermal Steam Particles
    const steamGeo = new THREE.BufferGeometry();
    const steamCount = 45;
    const steamPos = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount * 3; i += 3) {
      steamPos[i] = (Math.random() - 0.5) * 12.0;
      steamPos[i + 1] = 1.2 + Math.random() * 4.5;
      steamPos[i + 2] = (Math.random() - 0.5) * 12.0;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    const steamMat = new THREE.PointsMaterial({ color: 0xe0f2fe, size: 1.4, transparent: true, opacity: 0.45, depthWrite: false });
    const steamParticles = new THREE.Points(steamGeo, steamMat);
    hotSpringsGroup.add(steamParticles);

    // Wooden Boardwalk Approach & Handrail
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
    const springBoardwalk = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.35, 10.0), boardMat);
    springBoardwalk.position.set(0, 0.18, 10);
    springBoardwalk.castShadow = true;
    hotSpringsGroup.add(springBoardwalk);

    // Official Banff Hot Springs Signboard
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));
    signBoard.position.set(0, 2.2, 14.5);
    hotSpringsGroup.add(signBoard);

    if (typeof WORLD_COLLIDERS !== 'undefined') {
      WORLD_COLLIDERS.push({ x: -36, z: -35, r: 8.5 });
    }
"""
    elif feature_type == 'sugar_shack':
        return """
    // ------------------------------------------------------------
    // CANADIAN FEATURE: TRADITIONAL MAPLE SUGAR SHACK (CABANE À SUCRE) (x: -36, z: -35)
    // ------------------------------------------------------------
    const sugarShackGroup = new THREE.Group();
    sugarShackGroup.position.set(-36, 0, -35);
    scene.add(sugarShackGroup);

    const timberMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const redTinMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.3 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });

    // Sugar Shack Log Cabin
    const shackCabin = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.5, 7.0), timberMat);
    shackCabin.position.y = 2.25;
    shackCabin.castShadow = true; shackCabin.receiveShadow = true;
    sugarShackGroup.add(shackCabin);

    // Gabled Red Tin Roof with Steam Cupola
    const shackRoof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 2.8, 4), redTinMat);
    shackRoof.position.y = 5.8;
    shackRoof.rotation.y = Math.PI / 4;
    shackRoof.scale.set(1.1, 1.0, 0.9);
    sugarShackGroup.add(shackRoof);

    // Steaming Maple Evaporator Smokestack
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 }));
    stack.position.set(1.8, 6.2, 0);
    sugarShackGroup.add(stack);

    // Fresh Snow Trough for Maple Taffy (Tire sur la neige)
    const troughWood = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.85, 1.4), timberMat);
    troughWood.position.set(0, 0.45, 5.2);
    troughWood.castShadow = true;
    sugarShackGroup.add(troughWood);

    const snowFill = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.3, 1.1), snowMat);
    snowFill.position.set(0, 0.85, 5.2);
    sugarShackGroup.add(snowFill);

    // Golden Boiled Maple Ribbon on Snow
    const mapleRibbon = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.15, 0.5), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.1 }));
    mapleRibbon.position.set(0, 1.0, 5.2);
    sugarShackGroup.add(mapleRibbon);

    if (typeof WORLD_COLLIDERS !== 'undefined') {
      WORLD_COLLIDERS.push({ x: -36, z: -35, r: 6.5 });
    }
"""
    elif feature_type == 'moose':
        return """
    // ------------------------------------------------------------
    // CANADIAN WILDLIFE: MAJESTIC CANADIAN BULL MOOSE (x: -55, z: 35)
    // ------------------------------------------------------------
    const mooseGroup = new THREE.Group();
    mooseGroup.position.set(-55, 0, 35);
    mooseGroup.rotation.y = Math.PI * 0.25;
    scene.add(mooseGroup);

    const mooseFurMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.65 });

    // Massive Body & High Shoulder Hump
    const mooseBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 4.4), mooseFurMat);
    mooseBody.position.y = 2.8;
    mooseBody.castShadow = true;
    mooseGroup.add(mooseBody);

    const shoulderHump = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.1, 2.0), mooseFurMat);
    shoulderHump.position.set(0, 4.2, -0.6);
    mooseGroup.add(shoulderHump);

    // Long Slender Legs
    [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 2.6, 6), mooseFurMat);
      leg.position.set(lx, 1.3, lz);
      leg.castShadow = true;
      mooseGroup.add(leg);
    });

    // Neck & Elongated Head with Dewlap Bell
    const neck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.8), mooseFurMat);
    neck.position.set(0, 3.8, -2.2);
    neck.rotation.x = -Math.PI * 0.15;
    mooseGroup.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 2.0), mooseFurMat);
    head.position.set(0, 4.4, -3.2);
    mooseGroup.add(head);

    const dewlap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), mooseFurMat);
    dewlap.position.set(0, 3.4, -2.6);
    mooseGroup.add(dewlap);

    // Broad Sweeping Palmate Antlers (Span: 2.8m)
    [-1.2, 1.2].forEach(ax => {
      const palm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.2), antlerMat);
      palm.position.set(ax, 5.2, -3.0);
      palm.rotation.z = (ax > 0 ? -0.25 : 0.25);
      palm.rotation.x = Math.PI * 0.1;
      palm.castShadow = true;
      mooseGroup.add(palm);

      for (let t = 0; t < 4; t++) {
        const tine = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 4), antlerMat);
        tine.position.set(ax + (ax > 0 ? 0.6 : -0.6), 5.4 + t * 0.1, -3.4 + t * 0.3);
        tine.rotation.x = -Math.PI * 0.3;
        mooseGroup.add(tine);
      }
    });

    if (typeof WORLD_COLLIDERS !== 'undefined') {
      WORLD_COLLIDERS.push({ x: -55, z: 35, r: 3.2 });
    }
"""
    elif feature_type == 'polar_bear':
        return """
    // ------------------------------------------------------------
    // CANADIAN WILDLIFE: ARCTIC POLAR BEAR (x: -55, z: 35)
    // ------------------------------------------------------------
    const polarBearGroup = new THREE.Group();
    polarBearGroup.position.set(-55, 0, 35);
    scene.add(polarBearGroup);

    const polarFurMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.95 });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    // Heavy Muscular Polar Bear Body
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 4.6), polarFurMat);
    pBody.position.y = 2.2;
    pBody.castShadow = true;
    polarBearGroup.add(pBody);

    // Heavy Limbs
    [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]].forEach(([px, pz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 2.0, 8), polarFurMat);
      leg.position.set(px, 1.0, pz);
      leg.castShadow = true;
      polarBearGroup.add(leg);
    });

    // Tapered Head & Dark Snout
    const pNeck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 2.0), polarFurMat);
    pNeck.position.set(0, 2.6, -2.4);
    polarBearGroup.add(pNeck);

    const pHead = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.8), polarFurMat);
    pHead.position.set(0, 2.9, -3.4);
    polarBearGroup.add(pHead);

    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), blackMat);
    snout.position.set(0, 2.8, -4.3);
    polarBearGroup.add(snout);

    if (typeof WORLD_COLLIDERS !== 'undefined') {
      WORLD_COLLIDERS.push({ x: -55, z: 35, r: 3.5 });
    }
"""
    else:
        return ""

def patch_province_coldness(content, filename):
    base_name = os.path.basename(filename)
    if base_name not in PROVINCE_CLIMATE_DATA:
        return content

    info = PROVINCE_CLIMATE_DATA[base_name]

    if "CANADIAN COLDNESS & SURVIVAL HYPOTHERMIA" in content:
        print(f"Skipping already patched coldness: {filename}")
        return content

    # 1. Add Survival HUD CSS before </style>
    css_patch = """
    /* CANADIAN COLDNESS & SURVIVAL VITALITY HUD */
    .survival-hud-bar {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(10, 16, 26, 0.94);
      border: 1.5px solid rgba(0, 242, 255, 0.45);
      border-radius: 14px;
      padding: 8px 18px;
      z-index: 120;
      backdrop-filter: blur(10px);
      box-shadow: 0 0 25px rgba(0, 0, 0, 0.65);
      pointer-events: auto;
    }
    .vital-item {
      display: flex;
      flex-direction: column;
      width: 125px;
    }
    .vital-header {
      display: flex;
      justify-content: space-between;
      font-family: 'Orbitron', sans-serif;
      font-size: 10px;
      font-weight: 800;
      margin-bottom: 3px;
    }
    .vital-track {
      width: 100%;
      height: 7px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      overflow: hidden;
    }
    .vital-fill {
      height: 100%;
      transition: width 0.15s ease;
    }
    .vital-fill.hp {
      background: linear-gradient(90deg, #ef4444, #22c55e);
    }
    .vital-fill.warmth {
      background: linear-gradient(90deg, #ef4444, #f59e0b, #00f2ff);
    }
    .vital-gear {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-gear {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(0, 242, 255, 0.35);
      border-radius: 8px;
      color: #38bdf8;
      font-family: 'Rajdhani', sans-serif;
      font-size: 11px;
      font-weight: 800;
      padding: 5px 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-gear:hover {
      background: rgba(0, 242, 255, 0.2);
      border-color: #00f2ff;
      color: #fff;
    }
    #frostbite-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 260;
      opacity: 0;
      transition: opacity 0.35s ease;
      box-shadow: inset 0 0 90px rgba(0, 242, 255, 0.8), inset 0 0 180px rgba(224, 242, 254, 0.6);
      background: radial-gradient(circle at center, transparent 35%, rgba(186, 230, 253, 0.25) 75%, rgba(224, 242, 254, 0.65) 100%);
    }
  </style>"""
    content = content.replace("  </style>", css_patch, 1)

    # 2. Add Survival HUD HTML before <div class="province-hud">
    survival_hud_html = f"""
  <!-- CANADIAN COLDNESS & SURVIVAL VITALITY HUD -->
  <div class="survival-hud-bar">
    <!-- HEALTH BAR -->
    <div class="vital-item">
      <div class="vital-header">
        <span style="color: #fca5a5;"><i class="fa-solid fa-heart-pulse" style="color: #ef4444;"></i> HEALTH</span>
        <span id="vital-hp-val" style="color: #22c55e;">100%</span>
      </div>
      <div class="vital-track"><div id="vital-hp-fill" class="vital-fill hp" style="width: 100%;"></div></div>
    </div>

    <!-- WARMTH / BODY HEAT BAR -->
    <div class="vital-item">
      <div class="vital-header">
        <span style="color: #93c5fd;"><i class="fa-solid fa-temperature-half" id="vital-temp-icon" style="color: #38bdf8;"></i> WARMTH (<span id="vital-temp-c">{info['temp']}</span>)</span>
        <span id="vital-warmth-val" style="color: #00f2ff;">100%</span>
      </div>
      <div class="vital-track"><div id="vital-warmth-fill" class="vital-fill warmth" style="width: 100%;"></div></div>
    </div>

    <!-- THERMAL GEAR & HOT THERMOS -->
    <div class="vital-gear">
      <button type="button" class="btn-gear" id="btn-gear-toggle" onclick="cycleWinterGear()" title="Cycle Canadian Winter Thermal Gear [T]">
        <span id="gear-label">🇨🇦 ARCTIC GOOSE PARKA (85%)</span> [T]
      </button>
      <button type="button" class="btn-gear" onclick="drinkHotMapleThermos()" title="Drink Hot Canadian Maple Coffee [C]">
        <span id="thermos-label">☕ HOT THERMOS (3)</span> [C]
      </button>
    </div>
  </div>

  <!-- FROSTBITE ICE VIGNETTE OVERLAY -->
  <div id="frostbite-overlay"></div>
"""
    content = content.replace('  <div class="province-hud">', survival_hud_html + '\n  <div class="province-hud">', 1)

    # 3. Add 3D Campfire & Canadian Feature in 3D scene
    campfire_3d = """
    // ------------------------------------------------------------
    // CANADIAN CRACKLING BIRCH CAMPFIRE (x: -24, z: 25)
    // ------------------------------------------------------------
    const campfireGroup = new THREE.Group();
    campfireGroup.position.set(-24, 0, 25);
    scene.add(campfireGroup);

    // Stone Ring (Circular River Fieldstones)
    const stoneRingMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    for (let s = 0; s < 10; s++) {
      const sAng = (s / 10) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), stoneRingMat);
      stone.position.set(Math.cos(sAng) * 1.5, 0.25, Math.sin(sAng) * 1.5);
      stone.rotation.set(s * 0.4, s * 0.8, 0);
      campfireGroup.add(stone);
    }

    // Glowing Charcoal Embers & Stacked Birch Logs
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const embers = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.25, 12), emberMat);
    embers.position.y = 0.15;
    campfireGroup.add(embers);

    const birchMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
    for (let l = 0; l < 4; l++) {
      const logMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.8, 6), birchMat);
      logMesh.rotation.z = Math.PI * 0.35;
      logMesh.rotation.y = (l / 4) * Math.PI * 2;
      logMesh.position.set(0, 0.45, 0);
      campfireGroup.add(logMesh);
    }

    // Dancing Campfire Flame Cone
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7700 });
    const flameCone = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.4, 8), flameMat);
    flameCone.position.y = 0.95;
    campfireGroup.add(flameCone);

    const campfireLight = new THREE.PointLight(0xff7700, 2.2, 18);
    campfireLight.position.set(0, 1.4, 0);
    campfireGroup.add(campfireLight);
"""
    feature_3d = generate_canadian_feature_3d(info['feature'], filename)

    # 4. Add Coldness / Warmth / Health Mechanics in JS
    coldness_logic_js = f"""
    // ============================================================
    // CANADIAN COLDNESS & SURVIVAL HYPOTHERMIA MECHANICS
    // ============================================================
    const PROVINCE_COLD_RATE = {info['cold_rate']};
    let playerHealth = 100;
    let playerWarmth = 100;
    let thermosCharges = 3;
    let mapleSpeedBoostTimer = 0;
    let selectedGearIndex = 0;

    const WINTER_GEAR_TYPES = [
      {{ id: 'parka', name: '🇨🇦 ARCTIC GOOSE PARKA (85% INSULATION)', mult: 0.15 }},
      {{ id: 'tuque', name: '🇨🇦 BUFFALO PLAID & TUQUE (50% INSULATION)', mult: 0.50 }},
      {{ id: 'flannel', name: '🇨🇦 LIGHT VOYAGEUR SHIRT (15% INSULATION)', mult: 0.85 }},
      {{ id: 'exosuit', name: '🇨🇦 AURORA QUANTUM EXOSUIT (100% SHIELD)', mult: 0.00 }}
    ];

    function cycleWinterGear() {{
      selectedGearIndex = (selectedGearIndex + 1) % WINTER_GEAR_TYPES.length;
      const gear = WINTER_GEAR_TYPES[selectedGearIndex];
      const lbl = document.getElementById('gear-label');
      if (lbl) lbl.textContent = gear.name;
      showNotify(`EQUIPPED ${{gear.name}}`);
      if (audio && audio.playChirp) audio.playChirp();
    }}

    function drinkHotMapleThermos() {{
      if (thermosCharges <= 0) {{
        showNotify('☕ THERMOS EMPTY! REFILL NEAR CAMPFIRE, CABIN STOVE OR HOT SPRINGS');
        return;
      }}
      thermosCharges--;
      playerWarmth = Math.min(100, playerWarmth + 35);
      const thLbl = document.getElementById('thermos-label');
      if (thLbl) thLbl.textContent = `☕ HOT THERMOS (${{thermosCharges}})`;
      showNotify(`☕ SIPPED HOT CANADIAN MAPLE COFFEE (+35% WARMTH)! [${{thermosCharges}} LEFT]`);
      if (audio && audio.playChirp) audio.playChirp();
    }}

    function updateCanadianColdness(delta, now) {{
      // Check Heat Proximity
      const distToCampfire = Math.hypot(player.pos.x - (-24), player.pos.z - 25);
      const isNearCampfire = distToCampfire < 5.8;

      // Special Provincial Heat Sources
      let isNearHotSprings = false;
      let isNearSugarShack = false;
      {"isNearHotSprings = Math.hypot(player.pos.x - (-36), player.pos.z - (-35)) < 8.2;" if info['feature'] == 'hot_springs' else ""}
      {"isNearSugarShack = Math.hypot(player.pos.x - (-36), player.pos.z - (-35)) < 5.2;" if info['feature'] == 'sugar_shack' else ""}

      const isInsideHeatedVehicle = (typeof inPatrolCruiser !== 'undefined' && inPatrolCruiser) || (typeof inRegionalPlane !== 'undefined' && inRegionalPlane);

      // Refill thermos near heat
      if ((isNearCampfire || isNearHotSprings || isNearSugarShack) && thermosCharges < 3) {{
        thermosCharges = 3;
        const thLbl = document.getElementById('thermos-label');
        if (thLbl) thLbl.textContent = '☕ HOT THERMOS (3)';
      }}

      // Hot Springs Soak Recovery
      if (isNearHotSprings) {{
        playerWarmth = 100;
        playerHealth = Math.min(100, playerHealth + delta * 15.0);
      }} else if (isNearCampfire) {{
        playerWarmth = Math.min(100, playerWarmth + delta * 38.0);
      }} else if (isInsideHeatedVehicle) {{
        playerWarmth = Math.min(100, playerWarmth + delta * 14.0);
      }} else {{
        // Outdoor Coldness Drain based on Gear Insulation
        const gear = WINTER_GEAR_TYPES[selectedGearIndex];
        const effectiveDrain = PROVINCE_COLD_RATE * gear.mult;
        playerWarmth = Math.max(0, playerWarmth - effectiveDrain * delta);
      }}

      // Hypothermia & Health Depletion
      const frostOverlay = document.getElementById('frostbite-overlay');
      if (playerWarmth <= 0) {{
        // BELOW ZERO WARMTH: HYPOTHERMIA DAMAGE
        playerHealth = Math.max(0, playerHealth - delta * 5.2);
        if (frostOverlay) frostOverlay.style.opacity = '0.85';

        // Camera shiver effect
        if (camera) {{
          camera.position.x += (Math.random() - 0.5) * 0.04;
          camera.position.y += (Math.random() - 0.5) * 0.04;
        }}

        if (playerHealth <= 0) {{
          // Hypothermia Collapse & Emergency Rescue to heated outpost
          playerHealth = 100;
          playerWarmth = 100;
          player.pos.set(0, 1.2, 45);
          showNotify('❄️ HYPOTHERMIA COLLAPSE! EMERGENCY MEDICAL RESCUE TO WARM OUTPOST (+100% WARMTH)');
          if (audio && audio.playChirp) audio.playChirp();
        }}
      }} else {{
        if (frostOverlay) {{
          const frostFrac = Math.max(0, (20 - playerWarmth) / 20);
          frostOverlay.style.opacity = (frostFrac * 0.65).toFixed(2);
        }}
        // Natural Health Regeneration when Warm
        if (playerWarmth > 45 && playerHealth < 100) {{
          playerHealth = Math.min(100, playerHealth + delta * 2.8);
        }}
      }}

      // Maple Speed Boost Timer
      if (mapleSpeedBoostTimer > 0) {{
        mapleSpeedBoostTimer -= delta;
      }}

      // Update Survival HUD Elements
      const hpFill = document.getElementById('vital-hp-fill');
      const hpVal = document.getElementById('vital-hp-val');
      const warmthFill = document.getElementById('vital-warmth-fill');
      const warmthVal = document.getElementById('vital-warmth-val');

      if (hpFill) hpFill.style.width = `${{Math.round(playerHealth)}}%`;
      if (hpVal) hpVal.textContent = `${{Math.round(playerHealth)}}%`;
      if (warmthFill) warmthFill.style.width = `${{Math.round(playerWarmth)}}%`;
      if (warmthVal) {{
        warmthVal.textContent = (playerWarmth <= 0) ? 'FROSTBITE!' : `${{Math.round(playerWarmth)}}%`;
        warmthVal.style.color = (playerWarmth <= 0) ? '#ef4444' : '#00f2ff';
      }}
    }}
"""

    content = content.replace("    // ------------------------------------------------------------\n    // SCENERY COLLIDERS & OBSTACLE PHYSICS", campfire_3d + feature_3d + coldness_logic_js + "\n    // ------------------------------------------------------------\n    // SCENERY COLLIDERS & OBSTACLE PHYSICS", 1)

    # 5. Add Keybinds [T] and [C] to keydown listener
    key_cold_insert = """      if (e.code === 'KeyT') cycleWinterGear();
      if (e.code === 'KeyC') drinkHotMapleThermos();"""
    content = content.replace("      if (e.code === 'KeyP') toggleRegionalPlaneFlight();", key_cold_insert + "\n      if (e.code === 'KeyP') toggleRegionalPlaneFlight();", 1)

    # 6. In handleInteractions(), add Sugar Shack maple taffy interaction if feature is sugar_shack
    if info['feature'] == 'sugar_shack':
        shack_interaction = """      if (Math.hypot(player.pos.x - (-36), player.pos.z - (-35)) < 5.5) {
        playerWarmth = Math.min(100, playerWarmth + 50);
        mapleSpeedBoostTimer = 18.0;
        showNotify('🍁 ENJOYED FRESH MAPLE TAFFY ON SNOW (TIRE SUR LA NEIGE)! (+50% WARMTH & MAPLE SPRINT BOOST)');
        if (audio && audio.playLootChime) audio.playLootChime();
        return;
      }"""
        content = content.replace("    function handleInteractions() {", "    function handleInteractions() {\n" + shack_interaction, 1)

    # 7. In animate() loop, call updateCanadianColdness and animate campfire flame
    anim_cold_hook = """      if (typeof updateCanadianColdness === 'function') updateCanadianColdness(delta, now);
      if (typeof flameCone !== 'undefined' && flameCone) {
        flameCone.scale.y = 1.0 + Math.sin(now * 0.012) * 0.15;
        campfireLight.intensity = 2.0 + Math.sin(now * 0.015) * 0.4;
      }"""
    content = content.replace("      if (characterMixer) characterMixer.update(delta);", "      if (characterMixer) characterMixer.update(delta);\n" + anim_cold_hook, 1)

    # 8. In animate() prompt checking, show prompt for campfire, hot springs, or sugar shack
    prompt_heat_hook = f"""      if (Math.hypot(player.pos.x - (-24), player.pos.z - 25) < 5.5) {{
        prompt.style.display = 'flex'; promptMsg.textContent = 'WARM UP BY CRACKLING CAMPFIRE (+WARMTH)';
      }} else {"if (Math.hypot(player.pos.x - (-36), player.pos.z - (-35)) < 7.5) { prompt.style.display = 'flex'; promptMsg.textContent = 'SOAK IN BANFF HOT SPRINGS (100% WARMTH & HP)'; } else " if info['feature'] == 'hot_springs' else ""}{"if (Math.hypot(player.pos.x - (-36), player.pos.z - (-35)) < 5.2) { prompt.style.display = 'flex'; promptMsg.textContent = 'POUR HOT MAPLE TAFFY ON SNOW [F]'; } else " if info['feature'] == 'sugar_shack' else ""}"""

    content = content.replace("      if (regionalPlaneGroup && player.pos.distanceTo(regionalPlaneGroup.position) < 8.5 && !inRegionalPlane) {", prompt_heat_hook + "if (regionalPlaneGroup && player.pos.distanceTo(regionalPlaneGroup.position) < 8.5 && !inRegionalPlane) {", 1)

    return content

def patch_game_coldness(content):
    if "CANADIAN_COLDNESS_METROPOLIS" in content:
        print("Skipping already patched coldness: game.html")
        return content

    # 1. Add Survival HUD and Frostbite Vignette HTML to game.html
    survival_hud_game = """
  <!-- CALGARY METROPOLIS CANADIAN COLDNESS & SURVIVAL HUD -->
  <div id="city-survival-hud" style="position: fixed; top: 18px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 16px; background: rgba(8, 14, 24, 0.94); border: 1.5px solid rgba(0, 242, 255, 0.45); border-radius: 14px; padding: 8px 18px; z-index: 220; backdrop-filter: blur(10px); box-shadow: 0 0 25px rgba(0,0,0,0.65); pointer-events: auto;">
    <!-- HEALTH -->
    <div style="display: flex; flex-direction: column; width: 125px;">
      <div style="display: flex; justify-content: space-between; font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 800; margin-bottom: 3px;">
        <span style="color: #fca5a5;"><i class="fa-solid fa-heart-pulse" style="color: #ef4444;"></i> HEALTH</span>
        <span id="city-hp-val" style="color: #22c55e;">100%</span>
      </div>
      <div style="width: 100%; height: 7px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden;">
        <div id="city-hp-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #ef4444, #22c55e); transition: width 0.15s ease;"></div>
      </div>
    </div>

    <!-- WARMTH -->
    <div style="display: flex; flex-direction: column; width: 125px;">
      <div style="display: flex; justify-content: space-between; font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 800; margin-bottom: 3px;">
        <span style="color: #93c5fd;"><i class="fa-solid fa-temperature-half" style="color: #38bdf8;"></i> WARMTH (<span id="city-temp-val">-18°C</span>)</span>
        <span id="city-warmth-val" style="color: #00f2ff;">100%</span>
      </div>
      <div style="width: 100%; height: 7px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden;">
        <div id="city-warmth-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #ef4444, #f59e0b, #00f2ff); transition: width 0.15s ease;"></div>
      </div>
    </div>

    <!-- GEAR & THERMOS -->
    <div style="display: flex; align-items: center; gap: 8px;">
      <button type="button" onclick="cycleCityWinterGear()" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(0,242,255,0.35); border-radius: 8px; color: #38bdf8; font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 800; padding: 5px 10px; cursor: pointer;">
        <span id="city-gear-label">🇨🇦 ARCTIC GOOSE PARKA (85%)</span> [T]
      </button>
      <button type="button" onclick="drinkCityHotThermos()" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(0,242,255,0.35); border-radius: 8px; color: #ffd700; font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 800; padding: 5px 10px; cursor: pointer;">
        <span id="city-thermos-label">☕ HOT THERMOS (3)</span> [C]
      </button>
    </div>
  </div>

  <!-- CITY FROSTBITE ICE VIGNETTE -->
  <div id="city-frostbite-overlay" style="position: fixed; inset: 0; pointer-events: none; z-index: 260; opacity: 0; transition: opacity 0.35s ease; box-shadow: inset 0 0 90px rgba(0, 242, 255, 0.8), inset 0 0 180px rgba(224, 242, 254, 0.6); background: radial-gradient(circle at center, transparent 35%, rgba(186, 230, 253, 0.25) 75%, rgba(224, 242, 254, 0.65) 100%);"></div>
"""
    content = content.replace("</body>", survival_hud_game + "\n</body>", 1)

    # 2. Add Coldness Logic in JS
    city_cold_js = """
    // ============================================================
    // CANADIAN_COLDNESS_METROPOLIS: SURVIVAL HYPOTHERMIA IN CALGARY
    // ============================================================
    let cityWarmth = 100;
    let cityThermosCharges = 3;
    let cityGearIndex = 0;
    const CITY_WINTER_GEAR = [
      { id: 'parka', name: '🇨🇦 ARCTIC GOOSE PARKA (85%)', mult: 0.15 },
      { id: 'tuque', name: '🇨🇦 BUFFALO PLAID & TUQUE (50%)', mult: 0.50 },
      { id: 'suit', name: '🇨🇦 DOWNTOWN CASUAL (15%)', mult: 0.85 },
      { id: 'exosuit', name: '🇨🇦 AURORA QUANTUM EXOSUIT (100%)', mult: 0.00 }
    ];

    function cycleCityWinterGear() {
      cityGearIndex = (cityGearIndex + 1) % CITY_WINTER_GEAR.length;
      const g = CITY_WINTER_GEAR[cityGearIndex];
      const lbl = document.getElementById('city-gear-label');
      if (lbl) lbl.textContent = g.name;
      showStoreNotification(`EQUIPPED ${g.name}`);
    }

    function drinkCityHotThermos() {
      if (cityThermosCharges <= 0) {
        showStoreNotification('☕ THERMOS EMPTY! REFILL INSIDE CENTRAL LIBRARY OR NEAR PATIO HEATERS');
        return;
      }
      cityThermosCharges--;
      cityWarmth = Math.min(100, cityWarmth + 35);
      const thLbl = document.getElementById('city-thermos-label');
      if (thLbl) thLbl.textContent = `☕ HOT THERMOS (${cityThermosCharges})`;
      showStoreNotification(`☕ SIPPED HOT CANADIAN MAPLE COFFEE (+35% WARMTH)! [${cityThermosCharges} LEFT]`);
      if (cyberAudio && cyberAudio.playChirp) cyberAudio.playChirp();
    }

    function updateCalgaryCityColdness(delta) {
      if (gameState.currentWorld !== 'earth' || !player.pos) return;

      // Calgary Heat Sources: Inside C-Train, Inside Central Library, Stephen Ave Patio Fire Torches, Inside Vehicles
      const isInsideCTrain = (gameState.inCalgaryCTrain || gameState.inTrain);
      const isInsidePlane = (gameState.inPlane || gameState.inVehicle);
      const isInsideLibrary = (Math.hypot(player.pos.x - 85, player.pos.z - (-50)) < 16.0);
      const isNearStephenFire = (Math.hypot(player.pos.x - 0, player.pos.z - (-60)) < 12.0);

      const isWarmZone = isInsideCTrain || isInsidePlane || isInsideLibrary || isNearStephenFire;

      if (isWarmZone) {
        cityWarmth = Math.min(100, cityWarmth + delta * 24.0);
        if (cityThermosCharges < 3) {
          cityThermosCharges = 3;
          const thLbl = document.getElementById('city-thermos-label');
          if (thLbl) thLbl.textContent = '☕ HOT THERMOS (3)';
        }
      } else {
        const gear = CITY_WINTER_GEAR[cityGearIndex];
        cityWarmth = Math.max(0, cityWarmth - 2.2 * gear.mult * delta);
      }

      // Frostbite & Health Depletion
      const frost = document.getElementById('city-frostbite-overlay');
      if (cityWarmth <= 0) {
        // Hypothermia damage
        gameState.health = Math.max(0, (gameState.health || 100) - delta * 4.8);
        if (frost) frost.style.opacity = '0.85';
        if (camera) {
          camera.position.x += (Math.random() - 0.5) * 0.03;
          camera.position.y += (Math.random() - 0.5) * 0.03;
        }

        if (gameState.health <= 0) {
          // Hypothermia blackout & rescue to Central Library Atrium
          gameState.health = 100;
          cityWarmth = 100;
          player.pos.set(85, 1.2, -50);
          showStoreNotification('❄️ HYPOTHERMIA COLLAPSE! RESCUED TO HEATED CENTRAL LIBRARY (+100% WARMTH)');
        }
      } else {
        if (frost) {
          const fFrac = Math.max(0, (20 - cityWarmth) / 20);
          frost.style.opacity = (fFrac * 0.65).toFixed(2);
        }
        if (cityWarmth > 50 && gameState.health < 100) {
          gameState.health = Math.min(100, (gameState.health || 100) + delta * 2.5);
        }
      }

      // Update HUD
      const hpFill = document.getElementById('city-hp-fill');
      const hpVal = document.getElementById('city-hp-val');
      const wFill = document.getElementById('city-warmth-fill');
      const wVal = document.getElementById('city-warmth-val');

      if (hpFill) hpFill.style.width = `${Math.round(gameState.health || 100)}%`;
      if (hpVal) hpVal.textContent = `${Math.round(gameState.health || 100)}%`;
      if (wFill) wFill.style.width = `${Math.round(cityWarmth)}%`;
      if (wVal) {
        wVal.textContent = (cityWarmth <= 0) ? 'FROSTBITE!' : `${Math.round(cityWarmth)}%`;
        wVal.style.color = (cityWarmth <= 0) ? '#ef4444' : '#00f2ff';
      }
    }
"""
    content = content.replace("    function handleInteractions() {", city_cold_js + "\n    function handleInteractions() {", 1)

    # 3. Add KeyT and KeyC in game.html keydown
    content = content.replace("if (e.code === 'KeyV') toggleCameraPerspective();", "if (e.code === 'KeyV') toggleCameraPerspective();\n      if (e.code === 'KeyT') cycleCityWinterGear();\n      if (e.code === 'KeyC' && gameState.flightMode !== 'starship') drinkCityHotThermos();", 1)

    # 4. In animate() loop, update Calgary coldness
    content = content.replace("if (typeof updateCalgaryCTrain === 'function') updateCalgaryCTrain(delta, now);", "if (typeof updateCalgaryCTrain === 'function') updateCalgaryCTrain(delta, now);\n      if (typeof updateCalgaryCityColdness === 'function') updateCalgaryCityColdness(delta);", 1)

    return content

def main():
    print("=== IMPLEMENTING CANADIAN COLDNESS & SURVIVAL HYPOTHERMIA ===")
    
    # 1. Update 14 Province Files in Canada/ and root
    province_files = [f for f in os.listdir("Canada") if f.startswith("province-") and f.endswith(".html")]
    print(f"Found {len(province_files)} province files in Canada/")

    for pf in sorted(province_files):
        canada_path = os.path.join("Canada", pf)
        root_path = pf

        with open(canada_path, "r", encoding="utf-8") as f:
            content = f.read()

        updated_content = patch_province_coldness(content, pf)

        with open(canada_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        with open(root_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        print(f"[OK] Coldness & survival applied: {pf} (Canada/ and root)")

    # 2. Update game.html (Calgary Metropolis)
    print("Patching game.html with Calgary Coldness system...")
    with open("game.html", "r", encoding="utf-8") as f:
        game_content = f.read()

    updated_game = patch_game_coldness(game_content)

    with open("game.html", "w", encoding="utf-8") as f:
        f.write(updated_game)
    print("[OK] Coldness & survival applied to game.html")

    print("=== ALL CANADIAN COLDNESS FEATURES SUCCESSFULLY APPLIED! ===")

if __name__ == '__main__':
    main()
