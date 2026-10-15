# -*- coding: utf-8 -*-
"""
implement_next_level_features.py
Injects:
1. Canadian Passport & Codex Holographic Lore Terminals across all 14 realms + Calgary
2. Rideable C-Train Transit Loop in Calgary (game.html)
3. Circular Cyberpunk HUD Radar / Minimap across all realms + game.html
4. Procedural Atmospheric Regional Weather FX (Snow flurries, Aurora ribbons, Coastal mist)
"""

import os
import re
import json

PROVINCE_CODEX_INFO = {
    'province-british-columbia.html': {
        'id': 'british-columbia',
        'name': 'British Columbia',
        'motto': 'Splendor Sine Occasu (Splendour without diminishment)',
        'capital': 'Victoria',
        'landmarkName': 'Lions Gate Bridge & Pacific Cascadia Fjord',
        'fact': 'Home to Pacific Rim National Park Reserve and temperate coastal rainforests with ancient Western red cedars over 800 years old.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'mist'
    },
    'province-alberta.html': {
        'id': 'alberta',
        'name': 'Alberta',
        'motto': 'Fortis et Liber (Strong and free)',
        'capital': 'Edmonton',
        'landmarkName': 'Banff Rocky Mountains & Calgary Tower',
        'fact': 'Established in 1885, Banff National Park is Canada\'s oldest national park, renowned for Lake Louise, Moraine Lake, and glacial peaks.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'none'
    },
    'province-saskatchewan.html': {
        'id': 'saskatchewan',
        'name': 'Saskatchewan',
        'motto': 'Multis E Gentibus Vires (From many peoples, strength)',
        'capital': 'Regina',
        'landmarkName': 'Wascana Legislative Dome & Prairie Grain Terminal',
        'fact': 'The "Land of Living Skies" contains Grasslands National Park, preserving one of North America\'s rarest mixed-grass prairie ecosystems.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'none'
    },
    'province-manitoba.html': {
        'id': 'manitoba',
        'name': 'Manitoba',
        'motto': 'Gloriosus et Liber (Glorious and free)',
        'capital': 'Winnipeg',
        'landmarkName': 'The Forks & Historic Red River Trading Post',
        'fact': 'The Forks has been a meeting place for Indigenous peoples for over 6,000 years, connecting the Red and Assiniboine Rivers.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'none'
    },
    'province-ontario.html': {
        'id': 'ontario',
        'name': 'Ontario',
        'motto': 'Ut Incepit Fidelis Sic Permanet (Loyal she began, loyal she remains)',
        'capital': 'Toronto',
        'landmarkName': 'Cyber CN Tower & Bruce Peninsula Escarpment',
        'fact': 'Bruce Peninsula National Park protects the dramatic dolomite cliffs of the Niagara Escarpment and thousand-year-old cliffside cedars.',
        'pos_x': 28, 'pos_z': 12,
        'weather': 'none'
    },
    'province-quebec.html': {
        'id': 'quebec',
        'name': 'Québec',
        'motto': 'Je me souviens (I remember)',
        'capital': 'Québec City',
        'landmarkName': 'Château Frontenac & Gaspésie Maritime Settlement',
        'fact': 'Forillon National Park at the tip of the Gaspé Peninsula features soaring sea cliffs, Appalachian mountain ridges, and nesting seabird colonies.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'none'
    },
    'province-new-brunswick.html': {
        'id': 'new-brunswick',
        'name': 'New Brunswick',
        'motto': 'Spem Reduxit (Hope restored)',
        'capital': 'Fredericton',
        'landmarkName': 'Hopewell Rocks & Fundy Tidal Research Station',
        'fact': 'The Bay of Fundy experiences the highest tidal range in the world—up to 16 meters (53 feet) twice every single day.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'mist'
    },
    'province-nova-scotia.html': {
        'id': 'nova-scotia',
        'name': 'Nova Scotia',
        'motto': 'Munit Haec et Altera Vincit (One defends and the other conquers)',
        'capital': 'Halifax',
        'landmarkName': 'Halifax Star Citadel & Peggy\'s Cove Lighthouse',
        'fact': 'Peggy\'s Cove sits upon massive 400-million-year-old Devonian granite batholith rocks smoothed by glaciers during the last ice age.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'mist'
    },
    'province-prince-edward-island.html': {
        'id': 'prince-edward-island',
        'name': 'Prince Edward Island',
        'motto': 'Parva Sub Ingenti (The small under the protection of the great)',
        'capital': 'Charlottetown',
        'landmarkName': 'Confederation Bridge & Red Sand Dunes',
        'fact': 'PEI National Park preserves delicate coastal sand dunes and iron-rich red sandstone cliffs formed in the Permian period 280 million years ago.',
        'pos_x': 28, 'pos_z': 12,
        'weather': 'none'
    },
    'province-newfoundland.html': {
        'id': 'newfoundland',
        'name': 'Newfoundland & Labrador',
        'motto': 'Quaerite Prime Regnum Dei (Seek ye first the kingdom of God)',
        'capital': 'St. John\'s',
        'landmarkName': 'Signal Hill Marconi Tower & Outport Fishing Stage',
        'fact': 'Gros Morne National Park offers rare exposed Earth\'s mantle rocks (peridotite) formed deep below the ocean floor via continental plate collision.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'mist'
    },
    'province-yukon.html': {
        'id': 'yukon',
        'name': 'Yukon Territory',
        'motto': 'Land of the Midnight Sun',
        'capital': 'Whitehorse',
        'landmarkName': 'Klondike Gold Boomtown & Mount Logan',
        'fact': 'Kluane National Park and Reserve protects Mount Logan (5,959m), the highest peak in Canada, and the world\'s largest non-polar icefield.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'snow'
    },
    'province-northwest-territories.html': {
        'id': 'northwest-territories',
        'name': 'Northwest Territories',
        'motto': 'Aurora Capital of the World',
        'capital': 'Yellowknife',
        'landmarkName': 'Nahanni River Canyon & Mackenzie Freight Depot',
        'fact': 'Nahanni National Park Reserve was among the first four world heritage sites registered by UNESCO in 1978, featuring Virginia Falls (twice Niagara\'s height).',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'snow_aurora'
    },
    'province-nunavut.html': {
        'id': 'nunavut',
        'name': 'Territory of Nunavut',
        'motto': 'Nunavut Sannginivut (Nunavut our strength)',
        'capital': 'Iqaluit',
        'landmarkName': 'Monumental Inukshuk & Polar Geodesic Outpost',
        'fact': 'Auyuittuq National Park ("The land that never melts") showcases dramatic granite peaks like Mount Thor, featuring the world\'s greatest vertical cliff drop (1,250m).',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'snow_aurora'
    },
    'province-national-capital.html': {
        'id': 'national-capital',
        'name': 'National Capital Region',
        'motto': 'Capital Core of Canada',
        'capital': 'Ottawa / Gatineau',
        'landmarkName': 'Parliament Peace Tower & Rideau Canal Lockkeeper',
        'fact': 'The Rideau Canal (opened 1832) is the oldest continuously operated canal system in North America and a UNESCO World Heritage site.',
        'pos_x': -28, 'pos_z': 12,
        'weather': 'none'
    }
}

def generate_weather_js(weather_type):
    if weather_type == 'snow':
        return """
    // ------------------------------------------------------------
    // REGIONAL ATMOSPHERIC WEATHER: ARCTIC SNOW FLURRIES
    // ------------------------------------------------------------
    const snowCount = 220;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i += 3) {
      snowPos[i] = (Math.random() - 0.5) * 180;
      snowPos[i + 1] = Math.random() * 45;
      snowPos[i + 2] = (Math.random() - 0.5) * 180;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.75, transparent: true, opacity: 0.85 });
    weatherParticleSystem = new THREE.Points(snowGeo, snowMat);
    distantDecorGroup.add(weatherParticleSystem);

    function updateWeather(delta) {
      if (!weatherParticleSystem || qualityMode === 'low') return;
      const arr = weatherParticleSystem.geometry.attributes.position.array;
      for (let i = 1; i < snowCount * 3; i += 3) {
        arr[i] -= delta * 11.0;
        if (arr[i] < 0) arr[i] = 45;
      }
      weatherParticleSystem.geometry.attributes.position.needsUpdate = true;
    }
"""
    elif weather_type == 'snow_aurora':
        return """
    // ------------------------------------------------------------
    // REGIONAL ATMOSPHERIC WEATHER: SNOW + AURORA BOREALIS CURTAIN
    // ------------------------------------------------------------
    const snowCount = 220;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i += 3) {
      snowPos[i] = (Math.random() - 0.5) * 180;
      snowPos[i + 1] = Math.random() * 45;
      snowPos[i + 2] = (Math.random() - 0.5) * 180;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.75, transparent: true, opacity: 0.85 });
    weatherParticleSystem = new THREE.Points(snowGeo, snowMat);
    distantDecorGroup.add(weatherParticleSystem);

    const auroraGeo = new THREE.PlaneGeometry(360, 52, 24, 4);
    const auroraMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    auroraCurtainMesh = new THREE.Mesh(auroraGeo, auroraMat);
    auroraCurtainMesh.position.set(0, 95, -280);
    auroraCurtainMesh.rotation.x = Math.PI * 0.08;
    distantDecorGroup.add(auroraCurtainMesh);

    function updateWeather(delta, now) {
      if (qualityMode === 'low') return;
      if (weatherParticleSystem) {
        const arr = weatherParticleSystem.geometry.attributes.position.array;
        for (let i = 1; i < snowCount * 3; i += 3) {
          arr[i] -= delta * 11.0;
          if (arr[i] < 0) arr[i] = 45;
        }
        weatherParticleSystem.geometry.attributes.position.needsUpdate = true;
      }
      if (auroraCurtainMesh) {
        auroraCurtainMesh.material.opacity = 0.28 + Math.sin(now * 0.0016) * 0.14;
        auroraCurtainMesh.rotation.z = Math.sin(now * 0.0008) * 0.04;
      }
    }
"""
    elif weather_type == 'mist':
        return """
    // ------------------------------------------------------------
    // REGIONAL ATMOSPHERIC WEATHER: COASTAL MIST & SEA STREAKS
    // ------------------------------------------------------------
    const mistCount = 180;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount * 3; i += 3) {
      mistPos[i] = (Math.random() - 0.5) * 180;
      mistPos[i + 1] = Math.random() * 32;
      mistPos[i + 2] = (Math.random() - 0.5) * 180;
    }
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    const mistMat = new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.65, transparent: true, opacity: 0.60 });
    weatherParticleSystem = new THREE.Points(mistGeo, mistMat);
    distantDecorGroup.add(weatherParticleSystem);

    function updateWeather(delta) {
      if (!weatherParticleSystem || qualityMode === 'low') return;
      const arr = weatherParticleSystem.geometry.attributes.position.array;
      for (let i = 1; i < mistCount * 3; i += 3) {
        arr[i] -= delta * 15.0;
        if (arr[i] < 0) arr[i] = 32;
      }
      weatherParticleSystem.geometry.attributes.position.needsUpdate = true;
    }
"""
    else:
        return """
    function updateWeather(delta, now) {}
"""

def patch_province_content(content, filename):
    base_name = os.path.basename(filename)
    if base_name not in PROVINCE_CODEX_INFO:
        return content

    info = PROVINCE_CODEX_INFO[base_name]

    if "CANADIAN CODEX & PASSPORT SYSTEM" in content:
        print(f"Skipping already patched: {filename}")
        return content

    # 1. Inject CSS before </style>
    css_patch = """
    /* TACTICAL HUD RADAR & CANADIAN CODEX MODAL */
    #radar-container { position: fixed; top: 82px; right: 16px; width: 130px; height: 154px; background: rgba(14, 18, 26, 0.88); border: 1.5px solid rgba(0, 242, 255, 0.4); border-radius: 16px; padding: 6px; z-index: 95; backdrop-filter: blur(10px); box-shadow: 0 0 25px rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; pointer-events: none; }
    #hud-radar-canvas { width: 116px; height: 116px; border-radius: 50%; }
    #modal-codex { position: fixed; inset: 0; background: rgba(6, 12, 22, 0.92); backdrop-filter: blur(14px); z-index: 350; display: none; align-items: center; justify-content: center; padding: 20px; }
    #modal-codex.visible { display: flex; }
  </style>"""
    content = content.replace("  </style>", css_patch, 1)

    # 2. Inject HTML before modal-map
    html_patch = f"""
  <!-- TACTICAL CYBER HUD RADAR -->
  <div id="radar-container">
    <div style="font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #00f2ff; margin-bottom: 2px; display: flex; justify-content: space-between; width: 100%; padding: 0 4px;">
      <span><i class="fa-solid fa-satellite-dish"></i> RADAR</span>
      <span id="radar-dist-lbl" style="color: #ffd700;">--m</span>
    </div>
    <canvas id="hud-radar-canvas" width="116" height="116"></canvas>
    <div id="radar-target-lbl" style="font-family: 'Rajdhani', sans-serif; font-size: 10px; font-weight: 700; color: #8fa3b8; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; text-align: center; margin-top: 2px;">
      LANDMARK
    </div>
  </div>

  <!-- CANADIAN CODEX & PASSPORT MODAL -->
  <div id="modal-codex">
    <div class="modal-box" style="max-width: 660px; border: 2px solid #00f2ff; box-shadow: 0 0 50px rgba(0, 242, 255, 0.45); background: rgba(8, 14, 24, 0.97);">
      <div class="modal-header" style="background: rgba(0, 242, 255, 0.08); border-bottom: 1.5px solid rgba(0, 242, 255, 0.3);">
        <h2 style="color: #00f2ff;"><i class="fa-brands fa-canadian-maple-leaf" style="color: #ff3366;"></i> CANADIAN CODEX &amp; PASSPORT</h2>
        <button type="button" class="modal-close" onclick="closeCodexModal()">&times;</button>
      </div>
      <div style="padding: 22px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
          <div>
            <div id="codex-realm-name" style="font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 900; color: #fff;">{info['name'].upper()}</div>
            <div id="codex-realm-motto" style="font-size: 12px; color: #38bdf8; font-style: italic;">{info['motto']}</div>
          </div>
          <div id="codex-stamp-badge" style="background: rgba(255, 215, 0, 0.15); border: 1.5px solid #ffd700; border-radius: 10px; padding: 7px 12px; color: #ffd700; font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 900; text-align: center;">
            <i class="fa-solid fa-stamp"></i> PASSPORT STAMPED
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: rgba(255,255,255,0.03); border-radius: 10px; padding: 10px;">
          <div><span style="color: #94a3b8; font-size: 11px;">CAPITAL CITY:</span><div id="codex-realm-capital" style="font-weight: 700; color: #fff;">{info['capital']}</div></div>
          <div><span style="color: #94a3b8; font-size: 11px;">SIGNATURE LANDMARK:</span><div id="codex-realm-landmark" style="font-weight: 700; color: #ffd700;">{info['landmarkName']}</div></div>
        </div>
        <div>
          <div style="font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 800; color: #00f2ff; margin-bottom: 5px;">
            <i class="fa-solid fa-landmark"></i> PARKS CANADA &amp; GEOGRAPHICAL ARCHIVES
          </div>
          <div id="codex-realm-lore" style="font-size: 13px; line-height: 1.55; color: #cbd5e1; background: rgba(0,0,0,0.3); border-left: 3px solid #00f2ff; padding: 10px 14px; border-radius: 0 8px 8px 0;">
            {info['fact']}
          </div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
            <span>CANADIAN PASSPORT COMPLETION</span>
            <span id="codex-progress-text" style="color: #ffd700; font-weight: 800;">1 / 14 REALMS</span>
          </div>
          <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
            <div id="codex-progress-bar" style="background: linear-gradient(90deg, #00f2ff, #ffd700); height: 100%; width: 7%;"></div>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button type="button" class="btn-hud" onclick="closeCodexModal()" style="background: rgba(0, 242, 255, 0.2); border-color: #00f2ff; color: #fff; padding: 9px 18px;">DISMISS CODEX [ESC]</button>
        </div>
      </div>
    </div>
  </div>

  <div class="province-modal" id="modal-map">"""
    content = content.replace('  <div class="province-modal" id="modal-map">', html_patch, 1)

    # 3. Inject JS Setup right after regionalGroup closing or before WORLD_COLLIDERS
    realm_json = json.dumps(info)
    weather_js = generate_weather_js(info['weather'])

    js_setup = f"""
    // ------------------------------------------------------------
    // CANADIAN CODEX & PASSPORT SYSTEM + HUD RADAR + WEATHER
    // ------------------------------------------------------------
    const REALM_CODEX_DATA = {realm_json};
    const codexBeaconPos = new THREE.Vector3({info['pos_x']}, 0, {info['pos_z']});
    const codexTerminalGroup = new THREE.Group();
    codexTerminalGroup.position.copy(codexBeaconPos);
    scene.add(codexTerminalGroup);

    const codexBaseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 1.2, 8), new THREE.MeshStandardMaterial({{ color: 0x0f172a, roughness: 0.3, metalness: 0.85 }}));
    codexBaseMesh.position.y = 0.6;
    codexBaseMesh.castShadow = true;
    codexTerminalGroup.add(codexBaseMesh);

    const codexPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 8), new THREE.MeshStandardMaterial({{ color: 0x38bdf8, roughness: 0.2, metalness: 0.9 }}));
    codexPillar.position.y = 1.9;
    codexTerminalGroup.add(codexPillar);

    const codexHoloDisc = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 8, 24), new THREE.MeshBasicMaterial({{ color: 0x00f2ff, wireframe: true }}));
    codexHoloDisc.rotation.x = Math.PI / 2;
    codexHoloDisc.position.y = 2.4;
    codexTerminalGroup.add(codexHoloDisc);

    const codexCenterCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), new THREE.MeshBasicMaterial({{ color: 0xff3366 }}));
    codexCenterCore.position.y = 2.4;
    codexTerminalGroup.add(codexCenterCore);

    const codexLight = new THREE.PointLight(0x00f2ff, 1.6, 22);
    codexLight.position.set(0, 2.5, 0);
    codexTerminalGroup.add(codexLight);

    let weatherParticleSystem = null;
    let auroraCurtainMesh = null;
{weather_js}

    function openCodexModal() {{
      const modal = document.getElementById('modal-codex');
      if (!modal) return;
      if (document.exitPointerLock) document.exitPointerLock();

      let stamps = [];
      try {{
        stamps = JSON.parse(localStorage.getItem('BS_PASSPORT_STAMPS') || '[]');
      }} catch (e) {{ stamps = []; }}

      const realmId = REALM_CODEX_DATA.id;
      const isNewStamp = !stamps.includes(realmId);
      if (isNewStamp) {{
        stamps.push(realmId);
        localStorage.setItem('BS_PASSPORT_STAMPS', JSON.stringify(stamps));
        tokens += 500;
        localStorage.setItem('BS_TOKENS', tokens.toString());
        const tEl = document.getElementById('token-val');
        if (tEl) tEl.textContent = tokens.toLocaleString();
        showNotify(`🍁 CANADIAN PASSPORT STAMPED: ${{REALM_CODEX_DATA.name.toUpperCase()}} (+500 NEX)! [${{stamps.length}}/14]`);
        if (typeof audio !== 'undefined' && audio.playLootChime) audio.playLootChime();
      }}

      document.getElementById('codex-realm-name').textContent = REALM_CODEX_DATA.name.toUpperCase();
      document.getElementById('codex-realm-motto').textContent = REALM_CODEX_DATA.motto;
      document.getElementById('codex-realm-capital').textContent = REALM_CODEX_DATA.capital;
      document.getElementById('codex-realm-landmark').textContent = REALM_CODEX_DATA.landmarkName;
      document.getElementById('codex-realm-lore').textContent = REALM_CODEX_DATA.fact;

      const progressCount = stamps.length;
      document.getElementById('codex-progress-text').textContent = `${{progressCount}} / 14 REALMS`;
      document.getElementById('codex-progress-bar').style.width = `${{Math.round((progressCount / 14) * 100)}}%`;

      modal.classList.add('visible');
    }}

    function closeCodexModal() {{
      const modal = document.getElementById('modal-codex');
      if (modal) modal.classList.remove('visible');
    }}

    function updateRadar(pPos, pYaw, lPos, vPos, cPos) {{
      const canvas = document.getElementById('hud-radar-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2, r = w / 2 - 2;
      const maxRange = 320;

      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 12, 22, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 242, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2); ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
      ctx.stroke();

      const offset = pYaw;
      const cardinals = [
        {{ label: 'N', a: -Math.PI / 2 + offset, c: '#ff3366' }},
        {{ label: 'E', a: 0 + offset, c: '#8fa3b8' }},
        {{ label: 'S', a: Math.PI / 2 + offset, c: '#8fa3b8' }},
        {{ label: 'W', a: Math.PI + offset, c: '#8fa3b8' }}
      ];
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      cardinals.forEach(cd => {{
        const lx = cx + Math.cos(cd.a) * (r - 9);
        const ly = cy + Math.sin(cd.a) * (r - 9);
        ctx.fillStyle = cd.c;
        ctx.fillText(cd.label, lx, ly);
      }});

      function project(wx, wz) {{
        const dx = wx - pPos.x;
        const dz = wz - pPos.z;
        const rotX = dx * Math.cos(pYaw) - dz * Math.sin(pYaw);
        const rotZ = dx * Math.sin(pYaw) + dz * Math.cos(pYaw);
        const dist = Math.hypot(rotX, rotZ);
        const scale = Math.min(dist / maxRange, 0.92);
        const ang = Math.atan2(rotZ, rotX);
        return {{ x: cx + Math.cos(ang) * (r * scale), y: cy + Math.sin(ang) * (r * scale), dist: Math.round(dist) }};
      }}

      if (lPos) {{
        const lp = project(lPos.x, lPos.z);
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(lp.x, lp.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        const distEl = document.getElementById('radar-dist-lbl');
        if (distEl) distEl.textContent = `${{lp.dist}}m`;
      }}

      if (cPos) {{
        const cp = project(cPos.x, cPos.z);
        ctx.fillStyle = '#00f2ff';
        ctx.shadowColor = '#00f2ff'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(cp.x, cp.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }}

      if (vPos) {{
        const vp = project(vPos.x, vPos.z);
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(vp.x - 3, vp.y - 3, 6, 6);
      }}

      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#00f2ff';
      ctx.shadowColor = '#00f2ff'; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4, 5);
      ctx.lineTo(0, 3);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }}

    // ------------------------------------------------------------
    // SCENERY COLLIDERS & OBSTACLE PHYSICS
    // ------------------------------------------------------------"""

    content = content.replace("    // ------------------------------------------------------------\n    // SCENERY COLLIDERS & OBSTACLE PHYSICS\n    // ------------------------------------------------------------", js_setup, 1)

    # Add collider in WORLD_COLLIDERS
    content = content.replace("    const WORLD_COLLIDERS = [", f"    const WORLD_COLLIDERS = [\n      {{ x: {info['pos_x']}, z: {info['pos_z']}, r: 3.0 }},", 1)

    # 4. Inject into handleInteractions()
    handle_insert = """    function handleInteractions() {
      if (typeof codexBeaconPos !== 'undefined' && player.pos.distanceTo(codexBeaconPos) < 6.0) {
        openCodexModal();
        return;
      }"""
    content = content.replace("    function handleInteractions() {", handle_insert, 1)

    # 5. Inject into Escape key listener
    esc_insert = """      if (e.code === 'Escape') {
        const codexM = document.getElementById('modal-codex');
        if (codexM && codexM.classList.contains('visible')) { closeCodexModal(); return; }"""
    content = content.replace("      if (e.code === 'Escape') {", esc_insert, 1)

    # 6. Inject into animate() loop
    anim_prompt = """      const prompt = document.getElementById('interact-prompt');
      const promptMsg = document.getElementById('prompt-msg');
      if (typeof codexBeaconPos !== 'undefined' && player.pos.distanceTo(codexBeaconPos) < 6.0) {
        prompt.style.display = 'flex'; promptMsg.textContent = 'ACCESS CANADIAN CODEX [F]';
      } else"""
    content = content.replace("      const prompt = document.getElementById('interact-prompt');\n      const promptMsg = document.getElementById('prompt-msg');\n      if", anim_prompt, 1)

    # Loop updates
    loop_update = """      if (characterMixer) characterMixer.update(delta);
      if (typeof codexHoloDisc !== 'undefined' && codexHoloDisc) {
        codexHoloDisc.rotation.y += delta * 1.8;
        codexHoloDisc.position.y = 2.4 + Math.sin(now * 0.003) * 0.12;
      }
      if (typeof updateWeather === 'function') updateWeather(delta, now);
      if (typeof updateRadar === 'function') {
        const cruiserPos = (typeof cruiserGroup !== 'undefined' && cruiserGroup) ? cruiserGroup.position : null;
        updateRadar(player.pos, player.yaw, new THREE.Vector3(0, 0, -200), cruiserPos, (typeof codexBeaconPos !== 'undefined' ? codexBeaconPos : null));
      }"""
    content = content.replace("      if (characterMixer) characterMixer.update(delta);", loop_update, 1)

    return content

def patch_game_html(content):
    if "CALGARY_METROPOLIS_ADVANCED_FEATURES" in content:
        print("Skipping already patched: game.html")
        return content

    # 1. Extend track bed and add C-Train Platforms in buildCalgaryMetropolis()
    # Replace trackBed and rails
    old_track = """      // C-Train LRT Track Passing Through Library Portal (X: 85, Z: -120 to +20)
      const trackBed = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.25, 140), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 }));
      trackBed.position.set(85, 0.12, -50);
      calgaryMetropolisGroup.add(trackBed);

      [-1.2, 1.2].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 140), lrtTrackMat);
        rail.position.set(85 + rx, 0.3, -50);
        calgaryMetropolisGroup.add(rail);
      });

      // Calgary Transit C-Train Siemens S200 Car (Stationary on Track at X: 85, Z: -75)
      const ctrainCar = new THREE.Group();
      ctrainCar.position.set(85, 0.4, -75);
      calgaryMetropolisGroup.add(ctrainCar);"""

    new_track = """      // C-Train LRT Track Extended Through Library to Scotia Place (X: 85, Z: -120 to +90, Length: 210m)
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
      calgaryCTrainMesh = ctrainCar;"""

    content = content.replace(old_track, new_track, 1)

    # 2. Add C-Train Headlights and Alberta/Calgary Codex Pedestal in buildCalgaryMetropolis
    old_flame = """      calgaryTowerTorchLight = new THREE.PointLight(0xffaa22, 2.5, 180);
      calgaryTowerTorchLight.position.set(-35, 193, -45);
      calgaryMetropolisGroup.add(calgaryTowerTorchLight);

      registerCityCollider({ type: 'solid', x: -35, z: -45, hw: 14, hd: 14, world: 'earth' });"""

    new_flame = """      calgaryTowerTorchLight = new THREE.PointLight(0xffaa22, 2.5, 180);
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
      registerCityCollider({ type: 'solid', x: -35, z: -32, hw: 3.5, hd: 3.5, world: 'earth' });"""

    content = content.replace(old_flame, new_flame, 1)

    # 3. Add C-Train passenger HUD and Radar markup in game.html
    radar_markup = """
  <!-- CALGARY METROPOLIS TACTICAL HUD RADAR -->
  <div id="city-radar-container" style="position: fixed; top: 78px; right: 18px; width: 130px; height: 154px; background: rgba(8, 14, 24, 0.90); border: 1.5px solid rgba(0, 242, 255, 0.45); border-radius: 16px; padding: 6px; z-index: 180; backdrop-filter: blur(10px); box-shadow: 0 0 25px rgba(0,0,0,0.65); display: flex; flex-direction: column; align-items: center; pointer-events: none;">
    <div style="font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #00f2ff; margin-bottom: 2px; display: flex; justify-content: space-between; width: 100%; padding: 0 4px;">
      <span><i class="fa-solid fa-satellite-dish"></i> RADAR</span>
      <span id="city-radar-dist-lbl" style="color: #ffd700;">CALGARY</span>
    </div>
    <canvas id="city-hud-radar-canvas" width="116" height="116" style="width: 116px; height: 116px; border-radius: 50%;"></canvas>
    <div id="city-radar-target-lbl" style="font-family: 'Rajdhani', sans-serif; font-size: 10px; font-weight: 700; color: #8fa3b8; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; text-align: center; margin-top: 2px;">
      CENTRAL METROPOLIS
    </div>
  </div>

  <!-- CALGARY TRANSIT C-TRAIN PASSENGER HUD -->
  <div id="ctrain-passenger-hud" style="display: none; position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(8, 14, 24, 0.95); border: 2px solid #ef4444; border-radius: 16px; padding: 14px 24px; z-index: 250; font-family: 'Rajdhani', sans-serif; align-items: center; gap: 20px; box-shadow: 0 0 40px rgba(239, 68, 68, 0.45); pointer-events: auto;">
    <div style="font-size: 32px; color: #ef4444;"><i class="fa-solid fa-train-subway"></i></div>
    <div>
      <div style="font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
        CALGARY TRANSIT // C-TRAIN ROUTE 202
      </div>
      <div id="ctrain-station-banner" style="font-size: 12px; color: #38bdf8; font-weight: 700;">
        EN ROUTE: CENTRAL LIBRARY &amp; SCOTIA PLACE ARENA
      </div>
    </div>
    <button type="button" onclick="exitCalgaryCTrain()" style="background: rgba(239, 68, 68, 0.2); border: 1.5px solid #ef4444; color: #fca5a5; border-radius: 10px; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.2s;">
      <i class="fa-solid fa-door-open"></i> [E] DISEMBARK
    </button>
  </div>
"""
    # Insert right before </body>
    content = content.replace("</body>", radar_markup + "\n</body>", 1)

    # 4. Add Global C-Train & Radar Variables + Boarding logic
    c_train_js = """
    // ============================================================
    // CALGARY_METROPOLIS_ADVANCED_FEATURES: C-TRAIN, CODEX, RADAR
    // ============================================================
    let calgaryCTrainMesh = null;
    let calgaryCodexRing = null;
    let calgaryCTrainZ = -75;
    let calgaryCTrainDir = 1;
    let calgaryCTrainStopTimer = 0;
    gameState.inCalgaryCTrain = false;

    function boardCalgaryCTrain() {
      if (gameState.inCalgaryCTrain) return;
      gameState.inCalgaryCTrain = true;
      const hud = document.getElementById('ctrain-passenger-hud');
      if (hud) hud.style.display = 'flex';
      showStoreNotification('🚊 BOARDED CALGARY TRANSIT C-TRAIN! ENJOYING SCENIC SKYLINE TOUR!');
      if (cyberAudio && cyberAudio.playMaglevTrainSound) cyberAudio.playMaglevTrainSound();
    }

    function exitCalgaryCTrain() {
      if (!gameState.inCalgaryCTrain) return;
      gameState.inCalgaryCTrain = false;
      const hud = document.getElementById('ctrain-passenger-hud');
      if (hud) hud.style.display = 'none';
      if (calgaryCTrainMesh) {
        player.pos.set(80.5, 1.2, calgaryCTrainMesh.position.z);
        player.vel.set(0, 0, 0);
      }
      showStoreNotification('DISEMBARKED C-TRAIN AT STATION PLATFORM');
    }

    function updateCalgaryCTrain(delta, now) {
      if (!calgaryCTrainMesh) return;

      // Handle station dwelling
      if (calgaryCTrainStopTimer > 0) {
        calgaryCTrainStopTimer -= delta;
        const banner = document.getElementById('ctrain-station-banner');
        if (banner) {
          const isAtLib = Math.abs(calgaryCTrainZ - (-50)) < 6;
          banner.textContent = isAtLib ? 'STATION STOP: CALGARY CENTRAL LIBRARY / EAST VILLAGE' : 'STATION STOP: SCOTIA PLACE ARENA / CULTURE DISTRICT';
        }
      } else {
        const trainSpeed = 14.0 * delta * calgaryCTrainDir;
        calgaryCTrainZ += trainSpeed;

        // Check station stop triggers
        if (Math.abs(calgaryCTrainZ - (-50)) < 0.6) {
          calgaryCTrainStopTimer = 4.5;
        } else if (Math.abs(calgaryCTrainZ - 75) < 0.6) {
          calgaryCTrainStopTimer = 4.5;
        }

        if (calgaryCTrainZ > 82) {
          calgaryCTrainZ = 82;
          calgaryCTrainDir = -1;
          calgaryCTrainStopTimer = 3.5;
        } else if (calgaryCTrainZ < -115) {
          calgaryCTrainZ = -115;
          calgaryCTrainDir = 1;
          calgaryCTrainStopTimer = 3.5;
        }

        const banner = document.getElementById('ctrain-station-banner');
        if (banner) {
          banner.textContent = (calgaryCTrainDir > 0) ? 'NEXT STOP: SCOTIA PLACE ARENA' : 'NEXT STOP: CALGARY CENTRAL LIBRARY';
        }
      }

      calgaryCTrainMesh.position.z = calgaryCTrainZ;

      // Passenger camera attachment
      if (gameState.inCalgaryCTrain) {
        player.pos.set(85, 1.8, calgaryCTrainZ);
        player.vel.set(0, 0, 0);
        if (camera) {
          camera.position.set(83.8, 3.2, calgaryCTrainZ + 1.2);
          // Look toward downtown icons (Calgary Tower, The Bow, Telus Sky)
          camera.lookAt(-10, 35, calgaryCTrainZ - 15);
        }
      }
    }

    function updateCalgaryCityRadar() {
      const canvas = document.getElementById('city-hud-radar-canvas');
      if (!canvas || !player.pos) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2, r = w / 2 - 2;
      const maxRange = 450;

      ctx.clearRect(0, 0, w, h);

      // Radar Scope Background
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 12, 22, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Range Rings
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2); ctx.stroke();

      // Rotating Cardinals
      const pYaw = player.yaw || 0;
      const cardinals = [
        { label: 'N', a: -Math.PI / 2 + pYaw, c: '#ff3366' },
        { label: 'E', a: 0 + pYaw, c: '#8fa3b8' },
        { label: 'S', a: Math.PI / 2 + pYaw, c: '#8fa3b8' },
        { label: 'W', a: Math.PI + pYaw, c: '#8fa3b8' }
      ];
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      cardinals.forEach(cd => {
        const lx = cx + Math.cos(cd.a) * (r - 9);
        const ly = cy + Math.sin(cd.a) * (r - 9);
        ctx.fillStyle = cd.c;
        ctx.fillText(cd.label, lx, ly);
      });

      function project(wx, wz) {
        const dx = wx - player.pos.x;
        const dz = wz - player.pos.z;
        const rotX = dx * Math.cos(pYaw) - dz * Math.sin(pYaw);
        const rotZ = dx * Math.sin(pYaw) + dz * Math.cos(pYaw);
        const dist = Math.hypot(rotX, rotZ);
        const scale = Math.min(dist / maxRange, 0.92);
        const ang = Math.atan2(rotZ, rotX);
        return { x: cx + Math.cos(ang) * (r * scale), y: cy + Math.sin(ang) * (r * scale), dist: Math.round(dist) };
      }

      // Landmarks: Calgary Tower, The Bow, Central Library, Scotia Place, YYC Airport
      const landmarks = [
        { name: 'CALGARY TOWER', x: -35, z: -45, col: '#ef4444' },
        { name: 'THE BOW', x: 25, z: -85, col: '#38bdf8' },
        { name: 'CENTRAL LIBRARY', x: 85, z: -50, col: '#f59e0b' },
        { name: 'SCOTIA PLACE', x: 85, z: 75, col: '#10b981' },
        { name: 'YYC AIRPORT', x: 450, z: -220, col: '#a855f7' }
      ];

      let closestDist = Infinity;
      let closestName = 'CALGARY DOWNTOWN';

      landmarks.forEach(lm => {
        const p = project(lm.x, lm.z);
        ctx.fillStyle = lm.col;
        ctx.shadowColor = lm.col; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (p.dist < closestDist) {
          closestDist = p.dist;
          closestName = lm.name;
        }
      });

      // C-Train Blip
      if (calgaryCTrainMesh) {
        const cp = project(85, calgaryCTrainMesh.position.z);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cp.x - 3, cp.y - 3, 6, 6);
      }

      const distLbl = document.getElementById('city-radar-dist-lbl');
      if (distLbl) distLbl.textContent = `${closestDist}m`;
      const targetLbl = document.getElementById('city-radar-target-lbl');
      if (targetLbl) targetLbl.textContent = closestName;

      // Center Player Indicator (Arrow facing UP)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#00f2ff';
      ctx.shadowColor = '#00f2ff'; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4, 5);
      ctx.lineTo(0, 3);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
"""
    # Insert right before function handleInteractions()
    content = content.replace("    function handleInteractions() {", c_train_js + "\n    function handleInteractions() {", 1)

    # 5. In handleInteractions(): check C-Train exit/boarding and Calgary Tower Codex
    old_interactions = """    function handleInteractions() {
      if (!player.pos) return;

      // In-Plane or In-Train Exit handlers
      if (gameState.inPlane) {
        executePlaneFlightExit();
        return;
      }
      if (gameState.inTrain) {
        exitMaglevTrain();
        return;
      }"""

    new_interactions = """    function handleInteractions() {
      if (!player.pos) return;

      // In-Calgary-CTrain Exit handler
      if (gameState.inCalgaryCTrain) {
        exitCalgaryCTrain();
        return;
      }

      // Check Calgary Tower Base Codex Terminal Interaction (X: -35, Z: -32)
      if (Math.hypot(player.pos.x - (-35), player.pos.z - (-32)) < 5.5) {
        let stamps = [];
        try { stamps = JSON.parse(localStorage.getItem('BS_PASSPORT_STAMPS') || '[]'); } catch (e) { stamps = []; }
        if (!stamps.includes('alberta')) {
          stamps.push('alberta');
          localStorage.setItem('BS_PASSPORT_STAMPS', JSON.stringify(stamps));
          gameState.tokens = (gameState.tokens || 1250) + 500;
          localStorage.setItem('BS_TOKENS', gameState.tokens.toString());
          const tEl = document.getElementById('hud-tokens');
          if (tEl) tEl.textContent = gameState.tokens.toLocaleString();
          showStoreNotification('🍁 CANADIAN PASSPORT STAMPED: ALBERTA / CALGARY (+500 NEX)! [' + stamps.length + '/14]');
          if (cyberAudio && cyberAudio.playLootChime) cyberAudio.playLootChime();
        } else {
          showStoreNotification('🍁 ALBERTA ARCHIVES: EST. 1885 BANFF ROCKIES, CALGARY TOWER & SCOTIA PLACE SYNCHRONIZED!');
        }
        return;
      }

      // Check C-Train Boarding near train or at stations
      if (calgaryCTrainMesh && Math.hypot(player.pos.x - 85, player.pos.z - calgaryCTrainMesh.position.z) < 7.0) {
        boardCalgaryCTrain();
        return;
      }
      if ((Math.hypot(player.pos.x - 80.5, player.pos.z - (-50)) < 6.0 || Math.hypot(player.pos.x - 80.5, player.pos.z - 75) < 6.0) && calgaryCTrainMesh && Math.hypot(player.pos.x - 85, player.pos.z - calgaryCTrainMesh.position.z) < 14.0) {
        boardCalgaryCTrain();
        return;
      }

      // In-Plane or In-Train Exit handlers
      if (gameState.inPlane) {
        executePlaneFlightExit();
        return;
      }
      if (gameState.inTrain) {
        exitMaglevTrain();
        return;
      }"""

    content = content.replace(old_interactions, new_interactions, 1)

    # 6. In KeyE listener: handle C-Train
    old_key_e = "if (e.code === 'KeyE') toggleVehicleMode();"
    new_key_e = """if (e.code === 'KeyE') {
        if (gameState.inCalgaryCTrain) {
          exitCalgaryCTrain();
        } else if (calgaryCTrainMesh && Math.hypot(player.pos.x - 85, player.pos.z - calgaryCTrainMesh.position.z) < 7.0) {
          boardCalgaryCTrain();
        } else {
          toggleVehicleMode();
        }
      }"""
    content = content.replace(old_key_e, new_key_e, 1)

    # 7. In animate() loop: call updateCalgaryCTrain and updateCalgaryCityRadar
    old_anim_hook = "      // Update Lively Metropolis Civilian Population (45+ Animated NPCs)"
    new_anim_hook = """      // Update Calgary C-Train Transit Motion & Tactical City Radar
      if (typeof updateCalgaryCTrain === 'function') updateCalgaryCTrain(delta, now);
      if (typeof updateCalgaryCityRadar === 'function') updateCalgaryCityRadar();
      if (calgaryCodexRing) calgaryCodexRing.rotation.y += delta * 1.8;

      // Update Lively Metropolis Civilian Population (45+ Animated NPCs)"""
    content = content.replace(old_anim_hook, new_anim_hook, 1)

    # 8. In initProvincesHighwayGrid(): add Passport progress and stamped badges
    old_grid_setup = """      if (tokensEl) tokensEl.textContent = Number(currentTokens).toLocaleString();
      if (!grid) return;
      grid.innerHTML = '';

      CANADIAN_PROVINCES.forEach(p => {"""

    new_grid_setup = """      if (tokensEl) tokensEl.textContent = Number(currentTokens).toLocaleString();
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
        const isStamped = stamps.includes(p.id);"""

    content = content.replace(old_grid_setup, new_grid_setup, 1)

    # In each card, display the stamped badge
    old_card_badge = """            <span class="prov-card-abbr">${p.abbr}</span>
          </div>"""

    new_card_badge = """            <span class="prov-card-abbr">${p.abbr} ${isStamped ? '<i class="fa-solid fa-stamp" style="color: #ffd700; margin-left: 4px;" title="Passport Stamped"></i>' : ''}</span>
          </div>"""

    content = content.replace(old_card_badge, new_card_badge, 1)

    # Add claimExosuitReward handler
    exosuit_fn = """
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
"""
    content = content.replace("function loadProvinceTag(file, name) {", exosuit_fn + "\n    function loadProvinceTag(file, name) {", 1)

    return content

def main():
    print("=== IMPLEMENTING ADVANCED CANADIAN FEATURES ===")
    
    # 1. Update 14 Province Files in Canada/ and root
    province_files = [f for f in os.listdir("Canada") if f.startswith("province-") and f.endswith(".html")]
    print(f"Found {len(province_files)} province files in Canada/")

    for pf in sorted(province_files):
        canada_path = os.path.join("Canada", pf)
        root_path = pf

        with open(canada_path, "r", encoding="utf-8") as f:
            content = f.read()

        updated_content = patch_province_content(content, pf)

        with open(canada_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        with open(root_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        print(f"[OK] Patched {pf} (Canada/ and root)")

    # 2. Update game.html
    print("Patching game.html...")
    with open("game.html", "r", encoding="utf-8") as f:
        game_content = f.read()

    updated_game = patch_game_html(game_content)

    with open("game.html", "w", encoding="utf-8") as f:
        f.write(updated_game)
    print("[OK] Patched game.html")

    print("=== ALL FEATURES SUCCESSFULLY INJECTED! ===")

if __name__ == '__main__':
    main()
