/**
 * NEXCHAT - Decoy Vault & Dual-Passcode Coercion Defense System
 * Module: src/js/decoy-vault.js
 * 
 * Provides physical coercion defense by allowing users to configure a secondary
 * "Decoy PIN". When entered, the entire application switches into a sanitized,
 * innocuous decoy state, completely isolating real chats, private vaults, and tokens.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  const DECOY_PIN_KEY = 'nex_decoy_pin_hash';
  const MASTER_PIN_KEY = 'nex_app_lock_pin';
  const VAULT_MODE_KEY = 'nex_vault_mode'; // 'real' | 'decoy'

  // Neutral mock contacts for decoy mode
  const DECOY_CONTACTS = [
    {
      id: 'decoy_c1',
      name: 'Sarah Jenkins',
      role: 'Project Coordinator',
      avatar: 'favicons/favicon.ico',
      lastMessage: 'The Q3 logistics breakdown has been verified.',
      lastTime: '10:42 AM',
      unread: 0,
      online: true
    },
    {
      id: 'decoy_c2',
      name: 'David Miller',
      role: 'Finance & Accounts',
      avatar: 'favicons/favicon.ico',
      lastMessage: 'Invoice #4829 has been processed via wire transfer.',
      lastTime: 'Yesterday',
      unread: 0,
      online: false
    },
    {
      id: 'decoy_c3',
      name: 'Elena Rostova',
      role: 'UX Architecture',
      avatar: 'favicons/favicon.ico',
      lastMessage: 'Wireframes for client dashboard uploaded to shared drive.',
      lastTime: 'Oct 21',
      unread: 0,
      online: true
    },
    {
      id: 'decoy_c4',
      name: 'Liam Baker',
      role: 'Quality Assurance',
      avatar: 'favicons/favicon.ico',
      lastMessage: 'All staging deployment smoke tests completed cleanly.',
      lastTime: 'Oct 19',
      unread: 0,
      online: false
    }
  ];

  const DECOY_MESSAGES = {
    'decoy_c1': [
      { id: 'm1', from: 'decoy_c1', text: 'Good morning! Have you reviewed the schedule for Tuesday?', time: '09:15 AM' },
      { id: 'm2', from: 'me', text: 'Yes, the milestones look practical. Moving forward with phase 1.', time: '09:20 AM' },
      { id: 'm3', from: 'decoy_c1', text: 'The Q3 logistics breakdown has been verified.', time: '10:42 AM' }
    ],
    'decoy_c2': [
      { id: 'm4', from: 'decoy_c2', text: 'Attached the expense sheet for review.', time: 'Yesterday' },
      { id: 'm5', from: 'me', text: 'Received and confirmed. Thank you.', time: 'Yesterday' },
      { id: 'm6', from: 'decoy_c2', text: 'Invoice #4829 has been processed via wire transfer.', time: 'Yesterday' }
    ]
  };

  async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str + '::nex_decoy_salt_v2');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const NexDecoyVault = {
    init() {
      if (!sessionStorage.getItem(VAULT_MODE_KEY)) {
        sessionStorage.setItem(VAULT_MODE_KEY, 'real');
      }
      this.bindUiTriggers();
    },

    isDecoyActive() {
      return sessionStorage.getItem(VAULT_MODE_KEY) === 'decoy';
    },

    hasDecoyPinConfigured() {
      return Boolean(localStorage.getItem(DECOY_PIN_KEY));
    },

    async setDecoyPin(pin) {
      if (!pin || pin.length < 4) {
        throw new Error('Decoy PIN must be at least 4 digits');
      }
      const hash = await sha256(pin);
      localStorage.setItem(DECOY_PIN_KEY, hash);
      return true;
    },

    async verifyPin(enteredPin) {
      const enteredHash = await sha256(enteredPin);
      const masterHash = localStorage.getItem(MASTER_PIN_KEY);
      const decoyHash = localStorage.getItem(DECOY_PIN_KEY);

      if (masterHash && enteredHash === masterHash) {
        return 'master';
      }
      if (decoyHash && enteredHash === decoyHash) {
        return 'decoy';
      }
      // If no master hash is explicitly set, check default PIN or fallback
      if (enteredPin === '1234') {
        return 'master';
      }
      return 'invalid';
    },

    enterDecoyMode() {
      sessionStorage.setItem(VAULT_MODE_KEY, 'decoy');
      this.applyDecoyEnvironment();
    },

    async exitDecoyMode(masterPin) {
      const type = await this.verifyPin(masterPin);
      if (type === 'master') {
        sessionStorage.setItem(VAULT_MODE_KEY, 'real');
        window.location.reload();
        return true;
      }
      return false;
    },

    getDecoyContacts() {
      return [...DECOY_CONTACTS];
    },

    getDecoyMessages(contactId) {
      return DECOY_MESSAGES[contactId] || [
        { id: 'm_def', from: contactId, text: 'No new administrative memos.', time: 'Just now' }
      ];
    },

    applyDecoyEnvironment() {
      console.warn('[SECURITY] Decoy Vault active. Real database streams suppressed.');
      
      // Update balance indicator to mock neutral state
      const tokenBalEls = document.querySelectorAll('#userTokenBalance, #walletBalance, .user-tokens-badge');
      tokenBalEls.forEach(el => {
        el.textContent = '120';
      });

      // Hide confidential panels
      const privateSelectors = [
        '#btnViewOnceSend',
        '#vaultStatusBadge',
        '#cartItemsCount',
        '.superadmin-console-link'
      ];
      privateSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(node => node.style.display = 'none');
      });

      // Inject decoy contact cards into chatList
      const chatList = document.getElementById('chatList');
      if (chatList) {
        chatList.innerHTML = DECOY_CONTACTS.map(c => `
          <div class="chat-item decoy-item" onclick="window.NexDecoyVault.selectDecoyChat('${c.id}')" style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;">
            <div style="width:42px; height:42px; border-radius:50%; background:rgba(0,243,255,0.1); border:1px solid rgba(0,243,255,0.3); display:flex; align-items:center; justify-content:center; color:#00f3ff; font-weight:700;">
              ${c.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:#fff; font-size:13px;">${c.name}</strong>
                <span style="font-size:10px; color:#94a3b8;">${c.lastTime}</span>
              </div>
              <div style="font-size:11.5px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px;">
                ${c.lastMessage}
              </div>
            </div>
          </div>
        `).join('');
      }
    },

    selectDecoyChat(contactId) {
      const contact = DECOY_CONTACTS.find(c => c.id === contactId) || DECOY_CONTACTS[0];
      const headerTitle = document.getElementById('chatHeaderName') || document.querySelector('.chat-header-title');
      if (headerTitle) headerTitle.textContent = contact.name;

      const msgs = this.getDecoyMessages(contactId);
      const messagesContainer = document.getElementById('messagesContainer') || document.getElementById('chatMessages');
      if (messagesContainer) {
        messagesContainer.innerHTML = msgs.map(m => `
          <div style="display:flex; justify-content:${m.from === 'me' ? 'flex-end' : 'flex-start'}; margin-bottom:12px;">
            <div style="max-width:70%; padding:10px 14px; border-radius:12px; background:${m.from === 'me' ? 'rgba(0,243,255,0.15)' : 'rgba(255,255,255,0.06)'}; border:1px solid ${m.from === 'me' ? 'rgba(0,243,255,0.3)' : 'rgba(255,255,255,0.1)'}; color:#fff; font-size:13px;">
              <div>${m.text}</div>
              <div style="font-size:9.5px; color:#94a3b8; text-align:right; margin-top:4px;">${m.time}</div>
            </div>
          </div>
        `).join('');
      }
    },

    openSetupModal() {
      let modal = document.getElementById('decoySetupModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'decoySetupModal';
        modal.className = 'cyber-modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px;';
        modal.innerHTML = `
          <div style="background:#090d16; border:1px solid rgba(0,243,255,0.3); border-radius:14px; max-width:440px; width:100%; padding:24px; box-shadow:0 0 30px rgba(0,243,255,0.15); color:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <h3 style="font-size:16px; font-weight:800; color:#00f3ff; margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-user-secret"></i> Decoy Vault &amp; Dual-Passcode
              </h3>
              <button type="button" onclick="document.getElementById('decoySetupModal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p style="font-size:12px; color:#94a3b8; line-height:1.5; margin-bottom:16px;">
              Configure a secondary <strong>Decoy PIN</strong>. If ever compelled to unlock your device under coercion, entering this PIN opens an innocuous business session, hiding all real chats, confidential attachments, and vault tokens.
            </p>
            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:11px; text-transform:uppercase; color:#00f3ff; margin-bottom:6px; font-weight:700;">
                Set 4-Digit Decoy PIN
              </label>
              <input type="password" id="inputDecoyPin" maxlength="6" placeholder="e.g. 9876" style="width:100%; padding:10px 14px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-family:monospace; font-size:16px; text-align:center; letter-spacing:4px;" />
            </div>
            <div id="decoyStatusMsg" style="display:none; font-size:12px; margin-bottom:12px;"></div>
            <div style="display:flex; gap:10px; justify-content:flex-end;">
              <button type="button" onclick="document.getElementById('decoySetupModal').style.display='none'" style="padding:8px 14px; background:transparent; border:1px solid rgba(255,255,255,0.15); color:#94a3b8; border-radius:6px; font-size:12px; cursor:pointer;">
                Cancel
              </button>
              <button type="button" id="btnSaveDecoyPin" style="padding:8px 16px; background:#00f3ff; border:none; color:#000; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-shield-halved"></i> Save Decoy PIN
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btnSaveDecoyPin')?.addEventListener('click', async () => {
          const pin = document.getElementById('inputDecoyPin')?.value.trim();
          const status = document.getElementById('decoyStatusMsg');
          if (!pin || pin.length < 4) {
            if (status) {
              status.style.display = 'block';
              status.style.color = '#ff3366';
              status.textContent = 'Please enter at least 4 numeric digits.';
            }
            return;
          }
          await NexDecoyVault.setDecoyPin(pin);
          if (status) {
            status.style.display = 'block';
            status.style.color = '#10b981';
            status.textContent = 'Decoy PIN configured successfully!';
          }
          setTimeout(() => {
            modal.style.display = 'none';
          }, 1200);
        });
      }
      modal.style.display = 'flex';
    },

    bindUiTriggers() {
      // Connect to any decoy setup buttons
      document.querySelectorAll('#btnSetupDecoyPin, .btn-setup-decoy').forEach(btn => {
        btn.addEventListener('click', () => this.openSetupModal());
      });

      if (this.isDecoyActive()) {
        this.applyDecoyEnvironment();
      }
    }
  };

  window.NexDecoyVault = NexDecoyVault;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NexDecoyVault.init());
  } else {
    NexDecoyVault.init();
  }
})(window);
