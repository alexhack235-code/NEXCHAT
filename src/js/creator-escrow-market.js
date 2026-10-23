/**
 * NEXCHAT Creator Digital Collectibles (Cyber Badges) & Multi-Sig P2P Escrow Market
 * Decentralized peer-to-peer token escrow and cryptographic collector badges.
 * Strictly zero emojis.
 */

class CreatorEscrowMarketEngine {
  constructor() {
    this.storageKey = 'nex_escrow_contracts_vault';
    this.badgesKey = 'nex_creator_badges_vault';
    this.initDefaultBadges();
  }

  initDefaultBadges() {
    if (!localStorage.getItem(this.badgesKey)) {
      const defaultCatalog = [
        {
          id: 'badge_neural_titan',
          title: 'Neural Titan Tier 1',
          rarity: 'Legendary',
          color: '#00f2ff',
          icon: 'fa-brain-circuit',
          description: 'Awarded to creators with over 100K neural stream engagements.',
          price: 2500,
          minted: 142
        },
        {
          id: 'badge_cyber_pioneer',
          title: 'Cyber Pioneer Zero',
          rarity: 'Mythic',
          color: '#ff0055',
          icon: 'fa-microchip',
          description: 'Genesis cohort badge cryptographically stamped on block zero.',
          price: 5000,
          minted: 58
        },
        {
          id: 'badge_quantum_elite',
          title: 'Quantum Vanguard',
          rarity: 'Ultra Rare',
          color: '#00ff88',
          icon: 'fa-atom',
          description: 'Top-tier P2P liquidity provider and mesh node operator.',
          price: 1800,
          minted: 310
        },
        {
          id: 'badge_apex_operative',
          title: 'Apex Sovereign',
          rarity: 'Exotic Gold',
          color: '#fbbf24',
          icon: 'fa-shield-halved',
          description: 'Multi-sig validator with zero dispute arbitration sanctions.',
          price: 3200,
          minted: 95
        }
      ];
      localStorage.setItem(this.badgesKey, JSON.stringify(defaultCatalog));
    }
  }

  getBadges() {
    try {
      return JSON.parse(localStorage.getItem(this.badgesKey) || '[]');
    } catch {
      return [];
    }
  }

  getContracts() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}

    // Initial mock contracts for demonstration
    const initial = [
      {
        id: 'escrow_tx_9011',
        buyer: 'alex_cyber',
        seller: 'sarah_creator',
        item: 'Exclusive 4K Hologram Master File + Commercial Rights',
        amount: 850,
        currency: 'NEX_CREDITS',
        status: 'LOCKED',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        multiSigRequirement: '2-of-2 Signature Authorization'
      },
      {
        id: 'escrow_tx_9012',
        buyer: 'david_crypto',
        seller: 'elena_vfx',
        item: 'Cyberpunk 3D Avatar Rig for CamShot Live Streams',
        amount: 1400,
        currency: 'NEX_CREDITS',
        status: 'DISPUTED',
        disputeReason: 'Asset geometry failed WebGL shader compile threshold on mobile device.',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        multiSigRequirement: 'SuperAdmin Arbitration Escalation'
      },
      {
        id: 'escrow_tx_9013',
        buyer: 'marcus_stream',
        seller: 'neon_rider',
        item: 'High-Bitrate Custom Synthwave Audio Track License',
        amount: 350,
        currency: 'NEX_CREDITS',
        status: 'RELEASED',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        multiSigRequirement: 'Buyer & Seller Multi-Sig Completed'
      }
    ];
    localStorage.setItem(this.storageKey, JSON.stringify(initial));
    return initial;
  }

  saveContracts(contracts) {
    localStorage.setItem(this.storageKey, JSON.stringify(contracts));
    window.dispatchEvent(new CustomEvent('nex_escrow_updated', { detail: { contracts } }));
  }

  createContract({ buyer, seller, item, amount }) {
    const contracts = this.getContracts();
    const newTx = {
      id: 'escrow_tx_' + Math.floor(1000 + Math.random() * 9000),
      buyer: buyer || 'local_user',
      seller: seller || 'verified_merchant',
      item: item || 'Digital Collectible Asset',
      amount: parseInt(amount, 10) || 100,
      currency: 'NEX_CREDITS',
      status: 'LOCKED',
      createdAt: new Date().toISOString(),
      multiSigRequirement: '2-of-2 Signature Authorization'
    };
    contracts.unshift(newTx);
    this.saveContracts(contracts);
    return newTx;
  }

  releaseEscrow(contractId) {
    const contracts = this.getContracts();
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return false;
    contract.status = 'RELEASED';
    contract.releasedAt = new Date().toISOString();
    this.saveContracts(contracts);
    return true;
  }

  disputeEscrow(contractId, reason = 'Buyer filed non-delivery or specification dispute') {
    const contracts = this.getContracts();
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return false;
    contract.status = 'DISPUTED';
    contract.disputeReason = reason;
    contract.disputedAt = new Date().toISOString();
    this.saveContracts(contracts);
    return true;
  }

  openMarketModal() {
    let modal = document.getElementById('nexEscrowMarketModal');
    if (modal) modal.remove();

    const contracts = this.getContracts();
    const badges = this.getBadges();

    modal = document.createElement('div');
    modal.id = 'nexEscrowMarketModal';
    modal.className = 'nextgen-modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="nextgen-modal-card" style="max-width: 840px; width: 95vw; max-height: 88vh; overflow-y: auto;">
        <div class="nextgen-modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-gem" style="color: #00f2ff; font-size: 18px;"></i>
            <h3 style="margin: 0; font-size: 15px; color: #fff; font-weight: 800; letter-spacing: 0.5px;">
              CREATOR COLLECTIBLES &amp; MULTI-SIG P2P ESCROW
            </h3>
          </div>
          <button type="button" class="nextgen-modal-close" id="closeEscrowModalBtn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style="padding: 18px;">
          <!-- Tabs -->
          <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
            <button type="button" class="nex-escrow-tab-btn active" id="tabEscrowContractsBtn" style="padding: 6px 14px; background: rgba(0,242,255,0.15); border: 1px solid #00f2ff; color: #fff; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer;">
              <i class="fa-solid fa-handshake"></i> Active P2P Escrows (${contracts.length})
            </button>
            <button type="button" class="nex-escrow-tab-btn" id="tabCollectiblesBtn" style="padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer;">
              <i class="fa-solid fa-award"></i> Digital Collectibles (${badges.length})
            </button>
            <button type="button" class="nex-escrow-tab-btn" id="tabCreateEscrowBtn" style="padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer;">
              <i class="fa-solid fa-plus"></i> Open New Escrow
            </button>
          </div>

          <!-- Section 1: Contracts Table -->
          <div id="escrowContractsView">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${contracts.map(c => {
                let badgeColor = '#00ff88';
                if (c.status === 'LOCKED') badgeColor = '#00f2ff';
                if (c.status === 'DISPUTED') badgeColor = '#ff0055';
                return `
                  <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                      <div>
                        <span style="font-family: monospace; font-size: 11px; color: #94a3b8;">${c.id}</span>
                        <strong style="display: block; font-size: 13px; color: #fff; margin-top: 2px;">${c.item}</strong>
                      </div>
                      <span style="background: ${badgeColor}22; border: 1px solid ${badgeColor}; color: ${badgeColor}; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-family: monospace;">
                        ${c.status}
                      </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: #94a3b8; margin-top: 8px; flex-wrap: wrap; gap: 8px;">
                      <span>Buyer: <strong style="color: #cbd5e1;">@${c.buyer}</strong> &bull; Seller: <strong style="color: #cbd5e1;">@${c.seller}</strong></span>
                      <span style="font-family: monospace; font-size: 12px; font-weight: 700; color: #fbbf24;">
                        <i class="fa-solid fa-coins"></i> ${c.amount} ${c.currency}
                      </span>
                    </div>
                    ${c.disputeReason ? `
                      <div style="margin-top: 8px; padding: 6px 10px; background: rgba(255,0,85,0.1); border-left: 3px solid #ff0055; font-size: 11px; color: #ff88a8;">
                        Dispute Notice: ${c.disputeReason}
                      </div>
                    ` : ''}
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                      ${c.status === 'LOCKED' ? `
                        <button type="button" class="nex-escrow-action-release" data-id="${c.id}" style="padding: 5px 12px; background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; border-radius: 5px; font-size: 11px; font-weight: 700; cursor: pointer;">
                          <i class="fa-solid fa-check"></i> Release Funds
                        </button>
                        <button type="button" class="nex-escrow-action-dispute" data-id="${c.id}" style="padding: 5px 12px; background: rgba(255,0,85,0.15); border: 1px solid #ff0055; color: #ff0055; border-radius: 5px; font-size: 11px; font-weight: 700; cursor: pointer;">
                          <i class="fa-solid fa-triangle-exclamation"></i> Dispute
                        </button>
                      ` : ''}
                      <span style="font-size: 10.5px; color: #64748b; align-self: center; font-family: monospace;">
                        ${c.multiSigRequirement}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Section 2: Collectibles Grid -->
          <div id="escrowCollectiblesView" style="display: none;">
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
              ${badges.map(b => `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid ${b.color}44; border-radius: 10px; padding: 14px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 8px; right: 8px; font-size: 9.5px; font-weight: 800; color: ${b.color}; background: ${b.color}15; padding: 2px 6px; border-radius: 4px;">
                    ${b.rarity}
                  </div>
                  <div style="width: 50px; height: 50px; border-radius: 50%; margin: 10px auto; background: ${b.color}20; border: 2px solid ${b.color}; display: flex; align-items: center; justify-content: center; font-size: 20px; color: ${b.color};">
                    <i class="fa-solid ${b.icon}"></i>
                  </div>
                  <h4 style="margin: 0 0 4px 0; font-size: 12.5px; color: #fff;">${b.title}</h4>
                  <p style="font-size: 10px; color: #94a3b8; margin: 0 0 10px 0; min-height: 28px; line-height: 1.3;">${b.description}</p>
                  <button type="button" class="nex-claim-badge-btn" data-id="${b.id}" style="width: 100%; padding: 6px; background: ${b.color}25; border: 1px solid ${b.color}; color: #fff; font-size: 11px; font-weight: 700; border-radius: 6px; cursor: pointer;">
                    Claim (${b.price} CR)
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 3: Create Escrow Form -->
          <div id="escrowCreateView" style="display: none;">
            <form id="nexCreateEscrowForm" style="display: flex; flex-direction: column; gap: 12px; max-width: 450px;">
              <div>
                <label style="display: block; font-size: 11.5px; color: #cbd5e1; margin-bottom: 4px; font-weight: 700;">Seller Username</label>
                <input type="text" id="escrowSellerInput" required placeholder="@creator_handle" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 12px;">
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; color: #cbd5e1; margin-bottom: 4px; font-weight: 700;">Item / Service Description</label>
                <input type="text" id="escrowItemInput" required placeholder="Custom 3D Rig / Audio License" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 12px;">
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; color: #cbd5e1; margin-bottom: 4px; font-weight: 700;">Escrow Amount (CR)</label>
                <input type="number" id="escrowAmountInput" required min="10" value="500" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; font-size: 12px;">
              </div>
              <button type="submit" style="margin-top: 6px; padding: 9px; background: linear-gradient(135deg, #00f2ff, #00ff88); color: #000; font-weight: 800; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                <i class="fa-solid fa-lock"></i> Lock Credits in Multi-Sig Escrow
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event Handlers
    modal.querySelector('#closeEscrowModalBtn').onclick = () => modal.remove();

    const contractsView = modal.querySelector('#escrowContractsView');
    const collectiblesView = modal.querySelector('#escrowCollectiblesView');
    const createView = modal.querySelector('#escrowCreateView');
    const tabBtns = modal.querySelectorAll('.nex-escrow-tab-btn');

    const switchTab = (activeBtn, viewToShow) => {
      tabBtns.forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.borderColor = 'rgba(255,255,255,0.1)';
        btn.style.color = '#94a3b8';
      });
      activeBtn.classList.add('active');
      activeBtn.style.background = 'rgba(0,242,255,0.15)';
      activeBtn.style.borderColor = '#00f2ff';
      activeBtn.style.color = '#fff';

      contractsView.style.display = 'none';
      collectiblesView.style.display = 'none';
      createView.style.display = 'none';
      viewToShow.style.display = 'block';
    };

    modal.querySelector('#tabEscrowContractsBtn').onclick = () => switchTab(modal.querySelector('#tabEscrowContractsBtn'), contractsView);
    modal.querySelector('#tabCollectiblesBtn').onclick = () => switchTab(modal.querySelector('#tabCollectiblesBtn'), collectiblesView);
    modal.querySelector('#tabCreateEscrowBtn').onclick = () => switchTab(modal.querySelector('#tabCreateEscrowBtn'), createView);

    // Release & Dispute Listeners
    modal.querySelectorAll('.nex-escrow-action-release').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        this.releaseEscrow(id);
        this.openMarketModal(); // re-render
      };
    });

    modal.querySelectorAll('.nex-escrow-action-dispute').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const reason = prompt('State the dispute reason for SuperAdmin Chrono-Arbitration:');
        if (reason) {
          this.disputeEscrow(id, reason);
          this.openMarketModal();
        }
      };
    });

    // Claim Badges
    modal.querySelectorAll('.nex-claim-badge-btn').forEach(btn => {
      btn.onclick = () => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Minted to Profile!';
        btn.style.background = 'rgba(0,255,136,0.2)';
        btn.style.borderColor = '#00ff88';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      };
    });

    // Create Escrow Form
    const createForm = modal.querySelector('#nexCreateEscrowForm');
    createForm.onsubmit = (e) => {
      e.preventDefault();
      const seller = modal.querySelector('#escrowSellerInput').value.trim();
      const item = modal.querySelector('#escrowItemInput').value.trim();
      const amount = modal.querySelector('#escrowAmountInput').value.trim();

      this.createContract({ seller, item, amount });
      this.openMarketModal();
    };
  }
}

// Global Singleton Export
window.NexEscrowMarket = new CreatorEscrowMarketEngine();
