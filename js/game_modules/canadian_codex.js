// js/game_modules/canadian_codex.js
// Canadian Heritage Codex, Passport & Trans-Canada Highway Navigation System

class CanadianCodexSystem {
  constructor() {
    this.provinces = [
      { id: 'alberta', name: 'Alberta', capital: 'Edmonton / Calgary Hub', file: 'province-alberta.html', icon: '', landmark: 'Banff Rockies & Calgary Tower', stamp: true },
      { id: 'bc', name: 'British Columbia', capital: 'Victoria / Vancouver', file: 'province-british-columbia.html', icon: 'fa-tree', landmark: 'Pacific Rim & Sea-to-Sky', stamp: false },
      { id: 'saskatchewan', name: 'Saskatchewan', capital: 'Regina', file: 'province-saskatchewan.html', icon: 'fa-wheat-awn', landmark: 'Wascana Centre & Grain Elevators', stamp: false },
      { id: 'manitoba', name: 'Manitoba', capital: 'Winnipeg', file: 'province-manitoba.html', icon: 'fa-paw', landmark: 'The Forks & Churchill Polar Coast', stamp: false },
      { id: 'ontario', name: 'Ontario', capital: 'Toronto', file: 'province-ontario.html', icon: '', landmark: 'CN Tower & Algonquin Wilderness', stamp: false },
      { id: 'quebec', name: 'Quebec', capital: 'Quebec City', file: 'province-quebec.html', icon: '', landmark: 'Château Frontenac & Mont Tremblant', stamp: false },
      { id: 'nb', name: 'New Brunswick', capital: 'Fredericton', file: 'province-new-brunswick.html', icon: 'fa-water', landmark: 'Hopewell Rocks & Bay of Fundy', stamp: false },
      { id: 'ns', name: 'Nova Scotia', capital: 'Halifax', file: 'province-nova-scotia.html', icon: 'fa-anchor', landmark: "Peggy's Cove Lighthouse & Citadel", stamp: false },
      { id: 'pei', name: 'Prince Edward Island', capital: 'Charlottetown', file: 'province-prince-edward-island.html', icon: '', landmark: 'Green Gables & Red Sandstone Shores', stamp: false },
      { id: 'nl', name: 'Newfoundland & Labrador', capital: "St. John's", file: 'province-newfoundland.html', icon: 'fa-icicles', landmark: 'Signal Hill & Gros Morne Fjords', stamp: false },
      { id: 'yukon', name: 'Yukon', capital: 'Whitehorse', file: 'province-yukon.html', icon: '', landmark: 'Miles Canyon & Klondike Gold Trail', stamp: false },
      { id: 'nwt', name: 'Northwest Territories', capital: 'Yellowknife', file: 'province-northwest-territories.html', icon: 'fa-star', landmark: 'Aurora Capital & Great Slave Lake', stamp: false },
      { id: 'nunavut', name: 'Nunavut', capital: 'Iqaluit', file: 'province-nunavut.html', icon: '', landmark: 'Frobisher Bay & Arctic Inuksuk Trails', stamp: false },
      { id: 'ncr', name: 'National Capital Region', capital: 'Ottawa-Gatineau', file: 'province-national-capital.html', icon: '', landmark: 'Parliament Peace Tower & Rideau Canal', stamp: false }
    ];

    this.loadState();
    this.createCodexModal();
    this.createHighwayModal();
    this.bindKeys();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('nex_canada_stamps');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.provinces.forEach(p => {
          if (parsed[p.id]) p.stamp = true;
        });
      }
    } catch (e) {
      console.warn('Could not read saved stamps:', e);
    }
  }

  saveState() {
    try {
      const map = {};
      this.provinces.forEach(p => { map[p.id] = p.stamp; });
      localStorage.setItem('nex_canada_stamps', JSON.stringify(map));
    } catch (e) {
      console.warn('Could not save stamps:', e);
    }
  }

  bindKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'KeyF') {
        this.toggleCodex();
      } else if (e.code === 'KeyH') {
        this.toggleHighway();
      }
    });
  }

  createCodexModal() {
    let modal = document.getElementById('canadianCodexModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'canadianCodexModal';
      modal.style.cssText = `
        display:none; position:fixed; inset:0; z-index:950;
        background:rgba(4, 10, 18, 0.85); backdrop-filter:blur(10px);
        align-items:center; justify-content:center; padding:20px;
        font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      document.body.appendChild(modal);
    }
    this.codexModal = modal;
  }

  createHighwayModal() {
    let modal = document.getElementById('highwayModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'highwayModal';
      modal.style.cssText = `
        display:none; position:fixed; inset:0; z-index:960;
        background:rgba(3, 8, 16, 0.88); backdrop-filter:blur(12px);
        align-items:center; justify-content:center; padding:20px;
        font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      document.body.appendChild(modal);
    }
    this.highwayModal = modal;
  }

  toggleCodex() {
    if (!this.codexModal) return;
    const isVisible = this.codexModal.style.display === 'flex';
    if (isVisible) {
      this.codexModal.style.display = 'none';
    } else {
      this.renderCodex();
      this.codexModal.style.display = 'flex';
      if (window.cyberAudio && window.cyberAudio.playChirp) window.cyberAudio.playChirp();
    }
  }

  toggleHighway() {
    if (!this.highwayModal) return;
    const isVisible = this.highwayModal.style.display === 'flex';
    if (isVisible) {
      this.highwayModal.style.display = 'none';
    } else {
      this.renderHighway();
      this.highwayModal.style.display = 'flex';
      if (window.cyberAudio && window.cyberAudio.playChirp) window.cyberAudio.playChirp();
    }
  }

  renderCodex() {
    const stampedCount = this.provinces.filter(p => p.stamp).length;
    const allCompleted = stampedCount === this.provinces.length;

    let itemsHtml = this.provinces.map(p => `
      <div style="background:rgba(18,32,48,0.7); border:1px solid ${p.stamp ? '#00ffcc' : 'rgba(255,255,255,0.1)'}; border-radius:8px; padding:12px; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:18px;">${p.icon}</span>
            <span style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; background:${p.stamp ? 'rgba(0,255,204,0.15)' : 'rgba(255,255,255,0.06)'}; color:${p.stamp ? '#00ffcc' : '#888'};">
              ${p.stamp ? '[VERIFIED] DISCOVERED' : 'LOCKED'}
            </span>
          </div>
          <div style="font-weight:700; color:#fff; font-size:13px; margin-bottom:2px;">${p.name}</div>
          <div style="font-size:11px; color:#70d6ff; margin-bottom:4px;">${p.capital}</div>
          <div style="font-size:11px; color:#aaa; line-height:1.3;">${p.landmark}</div>
        </div>
        <div style="margin-top:10px; display:flex; gap:6px;">
          <a href="${p.file}" style="flex:1; text-align:center; padding:6px; background:rgba(0,229,255,0.15); border:1px solid #00e5ff; color:#00e5ff; text-decoration:none; font-size:11px; font-weight:bold; border-radius:4px; transition:background 0.2s;">VISIT REALM</a>
        </div>
      </div>
    `).join('');

    this.codexModal.innerHTML = `
      <div style="background:linear-gradient(145deg, #0d1b2a, #1b263b); border:2px solid #00e5ff; box-shadow:0 0 35px rgba(0,229,255,0.3); border-radius:12px; width:100%; max-width:880px; max-height:85vh; display:flex; flex-direction:column; overflow:hidden; color:#fff;">
        <div style="padding:16px 20px; border-bottom:1px solid rgba(0,229,255,0.3); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2 style="margin:0; font-size:18px; color:#00e5ff; letter-spacing:1px; display:flex; align-items:center; gap:8px;">
              <i class="fa-brands fa-canadian-maple-leaf"></i> CANADIAN HERITAGE CODEX & PASSPORT
            </h2>
            <div style="font-size:12px; color:#aaa; margin-top:2px;">
              Documenting all 10 Provinces & 3 Territories of the Great White North
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="background:rgba(0,255,204,0.1); border:1px solid #00ffcc; padding:4px 10px; border-radius:6px; font-size:12px; color:#00ffcc;">
              PASSPORT STAMPS: <strong>${stampedCount} / 14</strong> (+${stampedCount * 500} NEX)
            </div>
            <button onclick="document.getElementById('canadianCodexModal').style.display='none'" style="background:transparent; border:none; color:#ff4757; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
          </div>
        </div>
        
        <div style="padding:16px 20px; overflow-y:auto; flex:1; display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:12px;">
          ${itemsHtml}
        </div>

        <div style="padding:12px 20px; border-top:1px solid rgba(255,255,255,0.1); background:rgba(6,12,20,0.8); display:flex; justify-content:space-between; align-items:center; font-size:12px;">
          <span style="color:#888;">Press [F] to close codex | Press [H] for Trans-Canada Highway Warp</span>
          <span style="color:${allCompleted ? '#00ffcc' : '#ffaa00'}; font-weight:bold;">
            ${allCompleted ? '[TROPHY] GRAND MASTER CANADIAN EXPLORER UNLOCKED (+5,000 NEX)' : 'Explore all realms to unlock Aurora Borealis Quantum Exosuit'}
          </span>
        </div>
      </div>
    `;
  }

  renderHighway() {
    let cards = this.provinces.map(p => `
      <div style="background:rgba(15,26,42,0.85); border:1px solid rgba(0,229,255,0.3); border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:24px;">${p.icon}</span>
          <div>
            <div style="font-weight:700; color:#fff; font-size:13px;">${p.name}</div>
            <div style="font-size:11px; color:#70d6ff;">${p.landmark}</div>
          </div>
        </div>
        <a href="${p.file}" style="padding:6px 14px; background:#00e5ff; color:#0a101a; text-decoration:none; font-weight:bold; font-size:11px; border-radius:4px; letter-spacing:0.5px; white-space:nowrap;">
          HYPER-WARP <i class="fa-solid fa-rocket"></i>
        </a>
      </div>
    `).join('');

    this.highwayModal.innerHTML = `
      <div style="background:linear-gradient(145deg, #0a1128, #1c2541); border:2px solid #00e5ff; box-shadow:0 0 40px rgba(0,229,255,0.3); border-radius:12px; width:100%; max-width:820px; max-height:85vh; display:flex; flex-direction:column; overflow:hidden; color:#fff;">
        <div style="padding:16px 20px; border-bottom:1px solid rgba(0,229,255,0.3); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2 style="margin:0; font-size:18px; color:#00e5ff; letter-spacing:1px; display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-road"></i> TRANS-CANADA HIGHWAY HYPERSPACE PORTAL [H]
            </h2>
            <div style="font-size:12px; color:#aaa; margin-top:2px;">
              7,821 km Coast-to-Coast High-Speed Gravitational Transit Network
            </div>
          </div>
          <button onclick="document.getElementById('highwayModal').style.display='none'" style="background:transparent; border:none; color:#ff4757; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
        </div>
        
        <div style="padding:16px 20px; overflow-y:auto; flex:1; display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:12px;">
          ${cards}
        </div>

        <div style="padding:12px 20px; border-top:1px solid rgba(255,255,255,0.1); background:rgba(5,10,18,0.9); text-align:right; font-size:11px; color:#aaa;">
          Instant cross-province warp powered by Canadian Trans-Planetary Grid
        </div>
      </div>
    `;
  }
}

window.CanadianCodexSystem = CanadianCodexSystem;
