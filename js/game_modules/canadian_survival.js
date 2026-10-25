// js/game_modules/canadian_survival.js
// Canadian Coldness & Survival Hypothermia Simulation System for NEXCHAT

class CanadianSurvivalSystem {
  constructor(options = {}) {
    this.ambientTemp = options.ambientTemp || -22; // -22°C baseline
    this.windChill = options.windChill || -31;
    this.warmth = 100; // 0 to 100%
    this.health = 100; // 0 to 100%
    this.thermosCharges = 3;
    this.maxThermosCharges = 3;
    this.thermosCooldown = 0;
    this.isNearWarmthSource = false;
    this.currentWarmthSource = null;
    this.isBlackout = false;
    this.rescueCallback = options.onRescue || null;

    // Thermal gear definitions
    this.gearTiers = [
      { name: 'Standard Urban Jacket', insulation: 1.0, color: '#4da6ff' },
      { name: 'Expedition Down Parka', insulation: 2.6, color: '#ffaa00' },
      { name: 'Quantum Heated Cyber-Suit', insulation: 6.0, color: '#00ffcc' }
    ];
    this.currentGearIndex = 1; // Default to Expedition Down Parka

    this.heatSources = []; // Array of { pos: Vector3, radius: number, name: string, healRate: number }

    this.initHUD();
    this.bindKeys();
  }

  addHeatSource(pos, radius = 10, name = 'Campfire', healRate = 18) {
    this.heatSources.push({ pos, radius, name, healRate });
  }

  initHUD() {
    // Frostbite vignette overlay
    let frost = document.getElementById('frostbiteOverlay');
    if (!frost) {
      frost = document.createElement('div');
      frost.id = 'frostbiteOverlay';
      frost.style.cssText = `
        position: fixed; inset: 0; pointer-events: none; z-index: 850;
        box-shadow: inset 0 0 100px 30px rgba(180, 230, 255, 0.0);
        transition: box-shadow 0.4s ease;
      `;
      document.body.appendChild(frost);
    }
    this.frostOverlay = frost;

    // Survival HUD container
    let hud = document.getElementById('survivalHud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'survivalHud';
      hud.style.cssText = `
        position: fixed; top: 70px; left: 24px; z-index: 860;
        background: rgba(10, 20, 32, 0.82); border: 1px solid rgba(0, 230, 255, 0.4);
        border-radius: 8px; padding: 10px 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #e0f4ff; font-size: 12px; min-width: 210px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      `;
      hud.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-weight:700; letter-spacing:0.8px; color:#00e5ff;">SURVIVAL BIO-TELEMETRY</span>
          <span id="ambientTempReadout" style="font-weight:bold; color:#70d6ff;">-22°C</span>
        </div>
        <!-- Health Bar -->
        <div style="margin-bottom:6px;">
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
            <span>HEALTH</span>
            <span id="healthVal">100%</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.12); border-radius:3px; overflow:hidden;">
            <div id="healthFill" style="width:100%; height:100%; background:#2ed573; transition:width 0.2s linear;"></div>
          </div>
        </div>
        <!-- Warmth Bar -->
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
            <span>BODY WARMTH</span>
            <span id="warmthVal">100%</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.12); border-radius:3px; overflow:hidden;">
            <div id="warmthFill" style="width:100%; height:100%; background:#00e5ff; transition:width 0.2s linear;"></div>
          </div>
        </div>
        <!-- Gear & Thermos Status -->
        <div style="display:flex; justify-content:space-between; font-size:11px; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px;">
          <span>[T] GEAR: <strong id="gearName" style="color:#ffaa00;">Parka</strong></span>
          <span>[C] THERMOS: <strong id="thermosCount" style="color:#ffdd59;">3/3</strong></span>
        </div>
        <div id="warmthPrompt" style="display:none; margin-top:6px; padding:4px 6px; background:rgba(255,165,0,0.2); border:1px solid #ffa500; border-radius:4px; font-size:11px; color:#ffd32a; text-align:center;">
          <i class="fa-solid fa-fire"></i> Near Warmth: Campfire (+Warmth)
        </div>
      `;
      document.body.appendChild(hud);
    }

    this.tempElem = document.getElementById('ambientTempReadout');
    this.healthVal = document.getElementById('healthVal');
    this.healthFill = document.getElementById('healthFill');
    this.warmthVal = document.getElementById('warmthVal');
    this.warmthFill = document.getElementById('warmthFill');
    this.gearElem = document.getElementById('gearName');
    this.thermosElem = document.getElementById('thermosCount');
    this.warmthPrompt = document.getElementById('warmthPrompt');
    this.updateHUD();
  }

  bindKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'KeyT') {
        this.cycleGear();
      } else if (e.code === 'KeyC') {
        this.drinkThermos();
      }
    });
  }

  cycleGear() {
    this.currentGearIndex = (this.currentGearIndex + 1) % this.gearTiers.length;
    const gear = this.gearTiers[this.currentGearIndex];
    if (this.gearElem) {
      this.gearElem.innerText = gear.name.split(' ')[0];
      this.gearElem.style.color = gear.color;
    }
    if (window.cyberAudio && window.cyberAudio.playChirp) {
      window.cyberAudio.playChirp();
    }
    this.showFloatingNotice(`Equipped: ${gear.name} (${gear.insulation}x Insulation)`);
  }

  drinkThermos() {
    if (this.thermosCharges <= 0) {
      this.showFloatingNotice('Thermos empty! Refill at Cafes or Campfires.');
      return;
    }
    if (this.warmth >= 98) {
      this.showFloatingNotice('Warmth is already near maximum.');
      return;
    }
    this.thermosCharges--;
    this.warmth = Math.min(100, this.warmth + 38);
    if (this.thermosElem) this.thermosElem.innerText = `${this.thermosCharges}/${this.maxThermosCharges}`;
    if (window.cyberAudio && window.cyberAudio.playLootChime) {
      window.cyberAudio.playLootChime();
    }
    this.showFloatingNotice(`Sipped Hot Canadian Roast (+38% Warmth)`);
    this.updateHUD();
  }

  refillThermos() {
    if (this.thermosCharges < this.maxThermosCharges) {
      this.thermosCharges = this.maxThermosCharges;
      if (this.thermosElem) this.thermosElem.innerText = `${this.thermosCharges}/${this.maxThermosCharges}`;
      this.showFloatingNotice('Thermos refilled with steaming maple roast!');
    }
  }

  update(playerPos, dt = 0.016) {
    if (this.isBlackout) return;

    // Check proximity to warmth sources
    let nearSource = null;
    if (playerPos) {
      for (const src of this.heatSources) {
        const dx = playerPos.x - src.pos.x;
        const dy = (playerPos.y || 0) - (src.pos.y || 0);
        const dz = playerPos.z - src.pos.z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist <= src.radius) {
          nearSource = src;
          break;
        }
      }
    }

    const currentGear = this.gearTiers[this.currentGearIndex];

    if (nearSource) {
      // Rapid warming
      this.isNearWarmthSource = true;
      this.currentWarmthSource = nearSource;
      const rate = nearSource.healRate || 18;
      this.warmth = Math.min(100, this.warmth + rate * dt);
      this.health = Math.min(100, this.health + (rate * 0.4) * dt);
      this.refillThermos();

      if (this.warmthPrompt) {
        this.warmthPrompt.style.display = 'block';
        this.warmthPrompt.innerHTML = `<i class="fa-solid fa-fire"></i> Warmth Zone: <strong>${nearSource.name}</strong> (+Warmth/Healing)`;
      }
    } else {
      this.isNearWarmthSource = false;
      this.currentWarmthSource = null;
      if (this.warmthPrompt) this.warmthPrompt.style.display = 'none';

      // Deplete warmth based on insulation
      const depletionRate = 1.3 / (currentGear.insulation || 1.0);
      this.warmth = Math.max(0, this.warmth - depletionRate * dt);
    }

    // Hypothermia health loss when warmth hits 0
    if (this.warmth <= 0) {
      const damageRate = 3.8; // HP per second
      this.health = Math.max(0, this.health - damageRate * dt);

      // Frostbite vignette glow
      if (this.frostOverlay) {
        this.frostOverlay.style.boxShadow = `inset 0 0 120px 45px rgba(100, 200, 255, 0.55)`;
      }

      if (this.health <= 0) {
        this.triggerBlackoutRescue();
      }
    } else {
      // Scale frost vignette according to warmth
      if (this.frostOverlay) {
        const coldRatio = (100 - this.warmth) / 100;
        const alpha = Math.max(0, (coldRatio - 0.4) * 0.7);
        this.frostOverlay.style.boxShadow = `inset 0 0 ${Math.floor(alpha * 120)}px ${Math.floor(alpha * 40)}px rgba(130, 210, 255, ${alpha.toFixed(2)})`;
      }
    }

    this.updateHUD();
  }

  updateHUD() {
    if (this.warmthVal) this.warmthVal.innerText = `${Math.round(this.warmth)}%`;
    if (this.warmthFill) {
      this.warmthFill.style.width = `${this.warmth}%`;
      this.warmthFill.style.background = this.warmth < 25 ? '#ff4757' : (this.warmth < 50 ? '#ffa502' : '#00e5ff');
    }

    if (this.healthVal) this.healthVal.innerText = `${Math.round(this.health)}%`;
    if (this.healthFill) {
      this.healthFill.style.width = `${this.health}%`;
      this.healthFill.style.background = this.health < 30 ? '#ff4757' : '#2ed573';
    }
  }

  triggerBlackoutRescue() {
    this.isBlackout = true;
    const fade = document.createElement('div');
    fade.id = 'blackoutFade';
    fade.style.cssText = `
      position:fixed; inset:0; background:#000000; z-index:9999;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      color:#fff; font-family:sans-serif; text-align:center; opacity:0; transition:opacity 1s ease;
    `;
    fade.innerHTML = `
      <div style="font-size:32px; color:#ff4757; font-weight:bold; margin-bottom:12px;">HYPOTHERMIC COLLAPSE</div>
      <p style="font-size:16px; color:#ccc; max-width:480px; line-height:1.6;">
        Parks Canada & Calgary Search & Rescue deployed emergency thermal sled.
        You have been evacuated to Central Library Emergency Shelter with warm foil blankets.
      </p>
      <div style="margin-top:20px; font-size:13px; color:#00e5ff;">STABILIZING VITALS...</div>
    `;
    document.body.appendChild(fade);

    setTimeout(() => { fade.style.opacity = '1'; }, 50);

    setTimeout(() => {
      this.warmth = 85;
      this.health = 90;
      this.thermosCharges = 3;
      if (this.rescueCallback) {
        this.rescueCallback();
      }
      fade.style.opacity = '0';
      setTimeout(() => {
        fade.remove();
        this.isBlackout = false;
        this.updateHUD();
      }, 1000);
    }, 4000);
  }

  showFloatingNotice(msg) {
    let el = document.getElementById('survivalNotice');
    if (!el) {
      el = document.createElement('div');
      el.id = 'survivalNotice';
      el.style.cssText = `
        position:fixed; top:190px; left:24px; z-index:870;
        background:rgba(12,24,38,0.9); border:1px solid #00e5ff;
        border-radius:6px; padding:6px 12px; font-size:11px; color:#fff;
        pointer-events:none; transition:opacity 0.4s ease;
      `;
      document.body.appendChild(el);
    }
    el.innerText = msg;
    el.style.opacity = '1';
    clearTimeout(this._noticeTimer);
    this._noticeTimer = setTimeout(() => {
      if (el) el.style.opacity = '0';
    }, 2500);
  }
}

window.CanadianSurvivalSystem = CanadianSurvivalSystem;
