/**
 * NEXCHAT - Advanced Report System & Activity Monitoring Suite
 * -------------------------------------------------------------
 * 1. NexReportSystem: Multi-tier categories, sub-reasons, severity ratings,
 *    message history snapshot capture, evidence attachment, WhatsApp escalation hotline.
 * 2. NexActivityMonitor: User session activity ledger, privacy toggles,
 *    group telemetry velocity, admin event auditing, and interactive audit drawer.
 *
 * STRICTLY ZERO EMOJIS: Clean typography, FontAwesome vector icons only.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. REPORT SYSTEM ENGINE
  // =========================================================================

  const REPORT_CATEGORIES = {
    HARASSMENT: {
      id: 'HARASSMENT',
      label: 'Harassment & Bullying',
      icon: 'fa-user-ninja',
      color: '#ef4444',
      subReasons: [
        'Direct Threats of Violence',
        'Persistent Verbal Abuse & Stalking',
        'Doxxing & Personal Data Exposure',
        'Blackmail & Coercion',
        'Hate Speech & Targeted Slurs'
      ]
    },
    SPAM_SCAM: {
      id: 'SPAM_SCAM',
      label: 'Spam, Scam & Financial Fraud',
      icon: 'fa-triangle-exclamation',
      color: '#f59e0b',
      subReasons: [
        'Crypto / Token Investment Scam',
        'Phishing & Credential Harvester Link',
        'Automated Bot Message Flooding',
        'Impersonating Platform Staff / Admin',
        'Pyramid Scheme / MLM Promotion'
      ]
    },
    INAPPROPRIATE: {
      id: 'INAPPROPRIATE',
      label: 'Inappropriate & Harmful Content',
      icon: 'fa-radiation',
      color: '#ec4899',
      subReasons: [
        'Explicit Adult / NSFW Media',
        'Graphic Violence & Gore',
        'Self-Harm / Suicide Promotion',
        'Child Endangerment or Exploitation',
        'Illegal Goods Distribution'
      ]
    },
    IMPERSONATION: {
      id: 'IMPERSONATION',
      label: 'Impersonation & Fake Identity',
      icon: 'fa-masks-theater',
      color: '#06b6d4',
      subReasons: [
        'Cloned Profile & Stolen Avatar',
        'Posing as a Verified Creator',
        'Posing as Government or Official Authority',
        'Deceptive Parody Without Disclosure'
      ]
    },
    GROUP_VIOLATION: {
      id: 'GROUP_VIOLATION',
      label: 'Group Raiding & Community Abuse',
      icon: 'fa-users-slash',
      color: '#8b5cf6',
      subReasons: [
        'Coordinated Channel Raiding',
        'Mass Message Flooding / Freezing',
        'Unauthorized Member Scraping',
        'Malicious Media Injection'
      ]
    },
    OTHER: {
      id: 'OTHER',
      label: 'Other Terms Violation',
      icon: 'fa-flag',
      color: '#94a3b8',
      subReasons: [
        'Intellectual Property / Copyright Infringement',
        'Suspected Compromised Account',
        'Circumventing Platform Ban',
        'General Terms of Service Violation'
      ]
    }
  };

  const SEVERITY_LEVELS = {
    LOW: { id: 'LOW', label: 'Low', badge: 'LOW', color: '#94a3b8', desc: 'Minor annoyance or isolated spam' },
    MEDIUM: { id: 'MEDIUM', label: 'Medium', badge: 'MED', color: '#00f2ff', desc: 'Repeated offensive conduct or spam' },
    HIGH: { id: 'HIGH', label: 'High', badge: 'HIGH', color: '#f59e0b', desc: 'Direct harassment, scam, or threats' },
    CRITICAL: { id: 'CRITICAL', label: 'Critical Sev-1', badge: 'CRITICAL', color: '#ff3b30', desc: 'Immediate physical safety danger or criminal threat' }
  };

  let activeReportTarget = {
    targetUid: null,
    targetUsername: 'User',
    targetType: 'user', // 'user' or 'group'
    groupId: null,
    groupName: null
  };

  let attachedEvidenceDataUrl = null;

  function captureRecentMessagesEvidence(maxMessages = 5) {
    const messages = [];
    try {
      const container = document.getElementById('messages-area') || document.querySelector('.messages-container');
      if (!container) return messages;

      const bubbleEls = container.querySelectorAll('.chat-bubble, .message-bubble, .message-item');
      const start = Math.max(0, bubbleEls.length - maxMessages);
      for (let i = start; i < bubbleEls.length; i++) {
        const el = bubbleEls[i];
        const text = el.querySelector('.message-text, .bubble-text, p')?.textContent?.trim() || el.textContent?.trim() || '';
        const time = el.querySelector('.message-time, .time-stamp')?.textContent?.trim() || new Date().toLocaleTimeString();
        const isOwn = el.classList.contains('own') || el.classList.contains('sent');
        const sender = isOwn ? 'You' : (activeReportTarget.targetUsername || 'Reported Party');
        if (text) {
          messages.push({
            sender,
            text: text.substring(0, 280),
            timestamp: time
          });
        }
      }
    } catch (e) {
      console.warn('[REPORT EVIDENCE CAPTURE]', e);
    }
    return messages;
  }

  function createReportModalElements() {
    let modal = document.getElementById('nexAdvancedReportModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'nexAdvancedReportModal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(4, 7, 15, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 10000;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow-y: auto;
    `;

    modal.innerHTML = `
      <div class="nex-report-card" style="
        background: linear-gradient(135deg, #090e1a 0%, #0f172a 100%);
        border: 1px solid rgba(255, 59, 48, 0.35);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 59, 48, 0.15);
        border-radius: 18px;
        max-width: 620px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        padding: 24px;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(255, 59, 48, 0.15); border: 1px solid #ff3b30; color: #ff3b30; display: flex; align-items: center; justify-content: center; font-size: 19px;">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #fff; letter-spacing: 0.3px;">
                Cryptographic Incident Report Console
              </h3>
              <div style="font-size: 11.5px; color: #94a3b8; margin-top: 2px;">
                Verified provenance report dispatched to SuperAdmin &amp; Security Sentinel
              </div>
            </div>
          </div>
          <button type="button" id="btnNexReportClose" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Target Banner -->
        <div style="background: rgba(255, 59, 48, 0.06); border: 1px solid rgba(255, 59, 48, 0.25); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #ff3b30; font-weight: 700; letter-spacing: 0.5px;">Target of Report</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff; margin-top: 2px;" id="nexReportTargetName">@user</div>
            <div style="font-size: 10.5px; font-family: monospace; color: #94a3b8; margin-top: 1px;" id="nexReportTargetMeta">UID: --</div>
          </div>
          <span id="nexReportTargetTypeBadge" class="badge" style="background: rgba(255, 59, 48, 0.2); border: 1px solid #ff3b30; color: #ff3b30; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">
            DIRECT USER
          </span>
        </div>

        <!-- Category Selection -->
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px;">
            1. Select Primary Violation Category
          </label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" id="nexReportCategoriesGrid">
            <!-- Injected via JS -->
          </div>
        </div>

        <!-- Sub-reason Chips -->
        <div style="margin-bottom: 16px;" id="nexReportSubReasonsWrap">
          <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px;">
            2. Specific Infraction Detail
          </label>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="nexReportSubReasonsList">
            <!-- Injected dynamically based on category -->
          </div>
        </div>

        <!-- Severity Level -->
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px;">
            3. Assessed Severity Level
          </label>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;" id="nexReportSeverityGrid">
            <!-- Injected via JS -->
          </div>
        </div>

        <!-- Evidence: Last 5 Messages Toggle -->
        <div style="background: rgba(0, 242, 255, 0.04); border: 1px solid rgba(0, 242, 255, 0.2); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 12.5px; color: #00f2ff; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-clock-rotate-left"></i> Attach Chat Context Snapshot
              </strong>
              <p style="font-size: 11px; color: #94a3b8; margin: 3px 0 0 0;">
                Cryptographically snapshots the last 5 messages as tamper-evident proof
              </p>
            </div>
            <label class="luxury-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
              <input type="checkbox" id="nexReportIncludeHistoryToggle" checked style="opacity: 0; width: 0; height: 0;">
              <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #00f2ff; transition: .3s; border-radius: 24px;"></span>
            </label>
          </div>
          <div id="nexReportMessagesPreviewBox" style="margin-top: 10px; max-height: 100px; overflow-y: auto; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 8px 10px; font-family: monospace; font-size: 10.5px; color: #cbd5e1; line-height: 1.4;">
            <!-- Populated via JS -->
          </div>
        </div>

        <!-- Evidence Attachment (Screenshot / Image) -->
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #cbd5e1;">
              4. Evidence Screenshot (Optional)
            </label>
            <span style="font-size: 10.5px; color: #94a3b8;">PNG, JPG, WebP up to 5MB</span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <label style="flex: 1; border: 1px dashed rgba(255,255,255,0.2); border-radius: 10px; padding: 10px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: #00f2ff;">
              <i class="fa-solid fa-camera"></i>
              <span id="nexReportFileInputLabel">Select or drop screenshot</span>
              <input type="file" id="nexReportEvidenceFileInput" accept="image/*" style="display: none;">
            </label>
            <div id="nexReportThumbPreview" style="display: none; width: 44px; height: 44px; border-radius: 8px; overflow: hidden; border: 1px solid #00f2ff; position: relative;">
              <img id="nexReportThumbImg" src="" style="width: 100%; height: 100%; object-fit: cover;">
              <button type="button" id="btnRemoveReportThumb" style="position: absolute; top: 0; right: 0; background: rgba(255,0,0,0.85); color: #fff; border: none; font-size: 9px; width: 14px; height: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Description & Detailed Explanation -->
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 800; color: #ff3b30; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-align-left"></i> 5. Detailed Explanation &amp; Incident Context (Sent to Admin Dashboard)
            </label>
            <span id="nexReportCharCounter" style="font-size: 10.5px; color: #94a3b8;">0 / 1000</span>
          </div>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8;">
            Please explain in detail what happened so administrators can review this incident immediately:
          </p>
          <textarea id="nexReportDescriptionInput" rows="3" placeholder="Explain what happened in detail. Include quotes of what was said, context of the infraction, and any details to assist the Admin Review Desk..." style="
            width: 100%;
            box-sizing: border-box;
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 10px;
            padding: 10px 12px;
            color: #fff;
            font-size: 12px;
            font-family: inherit;
            line-height: 1.45;
            resize: vertical;
            outline: none;
          "></textarea>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 10px;">
            <button type="button" id="btnSubmitNexReport" style="
              flex: 1.5;
              padding: 12px;
              background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
              color: #fff;
              border: none;
              border-radius: 10px;
              font-weight: 800;
              font-size: 13px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              <i class="fa-solid fa-flag"></i> Submit Incident Report
            </button>
            <button type="button" id="btnCancelNexReport" style="
              flex: 1;
              padding: 12px;
              background: rgba(255,255,255,0.06);
              color: #cbd5e1;
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 10px;
              font-weight: 600;
              font-size: 12.5px;
              cursor: pointer;
            ">
              Cancel
            </button>
          </div>

          <!-- Emergency WhatsApp Escalation Button -->
          <button type="button" id="btnEscalateReportWhatsapp" style="
            width: 100%;
            padding: 9px 12px;
            background: rgba(37, 211, 102, 0.08);
            border: 1px solid rgba(37, 211, 102, 0.35);
            color: #25d366;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
          ">
            <i class="fa-brands fa-whatsapp"></i> Emergency Escalation to Hotline (+234 905 434 5858)
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind event listeners
    modal.querySelector('#btnNexReportClose')?.addEventListener('click', closeReportModal);
    modal.querySelector('#btnCancelNexReport')?.addEventListener('click', closeReportModal);
    modal.querySelector('#btnSubmitNexReport')?.addEventListener('click', handleReportSubmit);
    modal.querySelector('#btnEscalateReportWhatsapp')?.addEventListener('click', handleEmergencyWhatsappDispatch);

    // File input thumbnail
    const fileInput = modal.querySelector('#nexReportEvidenceFileInput');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        if (typeof window.showNotif === 'function') window.showNotif('File size exceeds 5MB limit.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        attachedEvidenceDataUrl = ev.target.result;
        const thumbBox = modal.querySelector('#nexReportThumbPreview');
        const thumbImg = modal.querySelector('#nexReportThumbImg');
        const labelEl = modal.querySelector('#nexReportFileInputLabel');
        if (thumbBox && thumbImg) {
          thumbImg.src = attachedEvidenceDataUrl;
          thumbBox.style.display = 'block';
        }
        if (labelEl) labelEl.textContent = file.name.substring(0, 18) + '...';
      };
      reader.readAsDataURL(file);
    });

    modal.querySelector('#btnRemoveReportThumb')?.addEventListener('click', () => {
      attachedEvidenceDataUrl = null;
      const thumbBox = modal.querySelector('#nexReportThumbPreview');
      const labelEl = modal.querySelector('#nexReportFileInputLabel');
      if (thumbBox) thumbBox.style.display = 'none';
      if (labelEl) labelEl.textContent = 'Select or drop screenshot';
      if (fileInput) fileInput.value = '';
    });

    // Character counter
    const descInput = modal.querySelector('#nexReportDescriptionInput');
    const counter = modal.querySelector('#nexReportCharCounter');
    descInput?.addEventListener('input', () => {
      const len = descInput.value.length;
      if (counter) counter.textContent = `${len} / 1000`;
      if (len > 1000) descInput.value = descInput.value.substring(0, 1000);
    });

    // Message History Toggle preview
    const historyToggle = modal.querySelector('#nexReportIncludeHistoryToggle');
    const previewBox = modal.querySelector('#nexReportMessagesPreviewBox');
    historyToggle?.addEventListener('change', () => {
      if (previewBox) {
        previewBox.style.display = historyToggle.checked ? 'block' : 'none';
      }
    });

    // Backdrop click close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeReportModal();
    });

    return modal;
  }

  let selectedCategoryKey = 'HARASSMENT';
  let selectedSubReasonText = 'Direct Threats of Violence';
  let selectedSeverityKey = 'MEDIUM';

  function renderCategoryOptions(modal) {
    const grid = modal.querySelector('#nexReportCategoriesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.values(REPORT_CATEGORIES).forEach(cat => {
      const isSelected = cat.id === selectedCategoryKey;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = `
        background: ${isSelected ? cat.color + '1a' : 'rgba(255,255,255,0.03)'};
        border: 1px solid ${isSelected ? cat.color : 'rgba(255,255,255,0.1)'};
        color: ${isSelected ? '#fff' : '#cbd5e1'};
        padding: 9px 12px;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11.5px;
        font-weight: ${isSelected ? '700' : '500'};
      `;
      btn.innerHTML = `<i class="fa-solid ${cat.icon}" style="color: ${cat.color}; width: 14px;"></i> <span>${cat.label}</span>`;
      btn.addEventListener('click', () => {
        selectedCategoryKey = cat.id;
        selectedSubReasonText = cat.subReasons[0];
        renderCategoryOptions(modal);
        renderSubReasonOptions(modal);
      });
      grid.appendChild(btn);
    });
  }

  function renderSubReasonOptions(modal) {
    const container = modal.querySelector('#nexReportSubReasonsList');
    if (!container) return;
    container.innerHTML = '';

    const cat = REPORT_CATEGORIES[selectedCategoryKey] || REPORT_CATEGORIES.HARASSMENT;
    cat.subReasons.forEach(sub => {
      const isSelected = sub === selectedSubReasonText;
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.style.cssText = `
        background: ${isSelected ? cat.color + '26' : 'rgba(255,255,255,0.04)'};
        border: 1px solid ${isSelected ? cat.color : 'rgba(255,255,255,0.09)'};
        color: ${isSelected ? '#fff' : '#94a3b8'};
        padding: 4px 10px;
        border-radius: 14px;
        cursor: pointer;
        font-size: 10.5px;
        font-weight: ${isSelected ? '700' : '500'};
      `;
      pill.textContent = sub;
      pill.addEventListener('click', () => {
        selectedSubReasonText = sub;
        renderSubReasonOptions(modal);
      });
      container.appendChild(pill);
    });
  }

  function renderSeverityOptions(modal) {
    const grid = modal.querySelector('#nexReportSeverityGrid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.values(SEVERITY_LEVELS).forEach(sev => {
      const isSelected = sev.id === selectedSeverityKey;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = `
        background: ${isSelected ? sev.color + '26' : 'rgba(255,255,255,0.03)'};
        border: 1px solid ${isSelected ? sev.color : 'rgba(255,255,255,0.1)'};
        color: ${isSelected ? sev.color : '#cbd5e1'};
        padding: 6px 4px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 700;
        text-align: center;
      `;
      btn.textContent = sev.badge;
      btn.title = sev.desc;
      btn.addEventListener('click', () => {
        selectedSeverityKey = sev.id;
        renderSeverityOptions(modal);
      });
      grid.appendChild(btn);
    });
  }

  function openReportModal(opts = {}) {
    const modal = createReportModalElements();

    const targetUid = opts.targetUid || window.currentChatUser || (typeof myUID !== 'undefined' ? myUID : 'unknown');
    const targetUsername = opts.targetUsername || window.currentChatName || 'User';
    const targetType = opts.targetType || (window.currentChatType === 'group' ? 'group' : 'user');
    const groupId = opts.groupId || (targetType === 'group' ? targetUid : null);
    const groupName = opts.groupName || (targetType === 'group' ? targetUsername : null);

    activeReportTarget = {
      targetUid,
      targetUsername,
      targetType,
      groupId,
      groupName
    };

    const targetNameEl = modal.querySelector('#nexReportTargetName');
    const targetMetaEl = modal.querySelector('#nexReportTargetMeta');
    const typeBadge = modal.querySelector('#nexReportTargetTypeBadge');

    if (targetNameEl) {
      targetNameEl.textContent = (targetType === 'group' ? '# ' : '@') + targetUsername;
    }
    if (targetMetaEl) {
      targetMetaEl.textContent = `UID / ID: ${targetUid}`;
    }
    if (typeBadge) {
      typeBadge.textContent = targetType === 'group' ? 'COMMUNITY GROUP' : 'DIRECT USER';
      typeBadge.style.color = targetType === 'group' ? '#c084fc' : '#ff3b30';
      typeBadge.style.borderColor = targetType === 'group' ? '#c084fc' : '#ff3b30';
    }

    renderCategoryOptions(modal);
    renderSubReasonOptions(modal);
    renderSeverityOptions(modal);

    // Populate recent messages evidence preview
    const previewBox = modal.querySelector('#nexReportMessagesPreviewBox');
    const recentMsgs = captureRecentMessagesEvidence(5);
    if (previewBox) {
      if (recentMsgs.length > 0) {
        previewBox.innerHTML = recentMsgs.map(m => `
          <div style="margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="color: #00f2ff; font-weight: 700;">${m.sender}:</span>
            <span style="color: #cbd5e1;"> ${m.text}</span>
            <span style="color: #64748b; font-size: 9.5px; float: right;">${m.timestamp}</span>
          </div>
        `).join('');
      } else {
        previewBox.innerHTML = '<span style="color: #64748b; font-style: italic;">No recent messages in active view buffer.</span>';
      }
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeReportModal() {
    const modal = document.getElementById('nexAdvancedReportModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  async function handleReportSubmit() {
    const modal = document.getElementById('nexAdvancedReportModal');
    if (!modal) return;

    const desc = modal.querySelector('#nexReportDescriptionInput')?.value?.trim() || '';
    if (!desc || desc.length < 5) {
      if (typeof window.showNotif === 'function') window.showNotif('Please provide an explanation (at least 5 characters).', 'warning');
      return;
    }

    const includeHistory = modal.querySelector('#nexReportIncludeHistoryToggle')?.checked !== false;
    const evidenceMsgs = includeHistory ? captureRecentMessagesEvidence(5) : [];

    const reporterUid = (typeof myUID !== 'undefined' && myUID) ? myUID : (localStorage.getItem('myUID') || 'Guest_' + Date.now().toString(36));
    const reporterName = (typeof myUsername !== 'undefined' && myUsername) ? myUsername : (localStorage.getItem('myUsername') || 'Reporter');

    const ticketId = 'REP-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 900 + 100);

    const reportPayload = {
      ticketId,
      reportedBy: reporterUid,
      reporterUsername: reporterName,
      reportedUser: activeReportTarget.targetUid,
      reportedUsername: activeReportTarget.targetUsername,
      chatType: activeReportTarget.targetType,
      groupId: activeReportTarget.groupId,
      groupName: activeReportTarget.groupName,
      category: selectedCategoryKey,
      subReason: selectedSubReasonText,
      severity: selectedSeverityKey,
      description: desc,
      explanation: desc, // Dedicated explanation field for admin dashboard
      evidenceMessages: evidenceMsgs,
      hasEvidenceAttachment: !!attachedEvidenceDataUrl,
      evidenceAttachment: attachedEvidenceDataUrl || null,
      status: 'pending',
      reviewed: false,
      reviewedBy: null,
      reviewNotes: null,
      timestamp: new Date().toISOString(),
      platform: navigator.userAgent.substring(0, 100)
    };

    const submitBtn = modal.querySelector('#btnSubmitNexReport');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Report...';
    }

    try {
      // 1. Write to Firestore 'reports' collection via helper or window.db
      if (typeof window.saveReportToFirestore === 'function') {
        try {
          await window.saveReportToFirestore(reportPayload);
        } catch (dbErr) {
          console.warn('[FIRESTORE REPORT WRITE NOTIFICATION]', dbErr.message);
        }
      } else if (window.db) {
        try {
          if (typeof window.db.collection === 'function') {
            await window.db.collection('reports').add(reportPayload);
          }
        } catch (dbErr) {
          console.warn('[FIRESTORE REPORT WRITE NOTIFICATION]', dbErr.message);
        }
      }

      // 2. Save in shared admin reports inbox for instant Admin Dashboard synchronization
      try {
        const adminInbox = JSON.parse(localStorage.getItem('nex_admin_reports_inbox') || '[]');
        adminInbox.unshift(reportPayload);
        localStorage.setItem('nex_admin_reports_inbox', JSON.stringify(adminInbox.slice(0, 100)));
      } catch (_) {}

      // 3. Save in localStorage user reports history
      try {
        const stored = JSON.parse(localStorage.getItem('nex_user_reports') || '[]');
        stored.unshift({
          ticketId,
          targetUsername: activeReportTarget.targetUsername,
          category: selectedCategoryKey,
          severity: selectedSeverityKey,
          description: desc,
          explanation: desc,
          timestamp: reportPayload.timestamp,
          status: 'pending'
        });
        localStorage.setItem('nex_user_reports', JSON.stringify(stored.slice(0, 50)));
      } catch (_) {}

      // Dispatch real-time report event
      document.dispatchEvent(new CustomEvent('nexReportSubmitted', { detail: { reportPayload } }));

      // 3. Log to Activity Monitor
      if (window.NexActivityMonitor) {
        window.NexActivityMonitor.logActivity('REPORT_FILED', `Filed ${selectedSeverityKey} report for @${activeReportTarget.targetUsername}`, {
          ticketId,
          target: activeReportTarget.targetUsername,
          category: selectedCategoryKey
        });
      }

      // 4. Notify user (clean non-blocking notification)
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Incident report ${ticketId} lodged for @${activeReportTarget.targetUsername}. Sent to Admin Dashboard.`, 'success', 3500);
      }

      closeReportModal();

      // Reset form
      const descInput = modal.querySelector('#nexReportDescriptionInput');
      if (descInput) descInput.value = '';
      attachedEvidenceDataUrl = null;
      const thumbBox = modal.querySelector('#nexReportThumbPreview');
      if (thumbBox) thumbBox.style.display = 'none';

    } catch (err) {
      if (typeof window.showNotif === 'function') window.showNotif('Failed to submit report: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-flag"></i> Submit Incident Report';
      }
    }
  }

  function handleEmergencyWhatsappDispatch() {
    const target = activeReportTarget.targetUsername || 'Target';
    const uid = activeReportTarget.targetUid || '--';
    const reporter = (typeof myUsername !== 'undefined' && myUsername) ? myUsername : (localStorage.getItem('myUsername') || 'Reporter');
    const msg = `NEXCHAT EMERGENCY SEV-1 INCIDENT DISPATCH\nHotline: +234 905 434 5858\n\nReporter: @${reporter}\nReported Target: @${target} (UID: ${uid})\nViolation Category: ${selectedCategoryKey} (${selectedSubReasonText})\nSeverity: ${selectedSeverityKey}\n\nPlease inspect this incident immediately on the SuperAdmin Console.`;
    const url = `https://wa.me/2349054345858?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }


  // =========================================================================
  // 2. ACTIVITY MONITOR & TELEMETRY LEDGER
  // =========================================================================

  const DEFAULT_TOGGLES = {
    telemetryLogging: true,
    groupTelemetry: true,
    typingPulse: true,
    screenshotAlert: true,
    mediaAutoDownload: 'wifi',
    linkPreview: true,
    ghostMode: false,
    activityBroadcasting: true
  };

  class ActivityMonitorEngine {
    constructor() {
      this.storageKey = 'nex_activity_ledger_v2';
      this.togglesKey = 'nex_activity_toggles_v2';
      this.maxEntries = 150;
      this.toggles = this.loadToggles();
      this.initScreenshotSentinel();
    }

    loadToggles() {
      try {
        const saved = JSON.parse(localStorage.getItem(this.togglesKey) || '{}');
        return { ...DEFAULT_TOGGLES, ...saved };
      } catch (_) {
        return { ...DEFAULT_TOGGLES };
      }
    }

    saveToggles(newToggles) {
      this.toggles = { ...this.toggles, ...newToggles };
      try {
        localStorage.setItem(this.togglesKey, JSON.stringify(this.toggles));
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('nex:toggles_updated', { detail: this.toggles }));
    }

    getToggle(key) {
      return this.toggles[key] !== undefined ? this.toggles[key] : DEFAULT_TOGGLES[key];
    }

    setToggle(key, value) {
      this.saveToggles({ [key]: value });
    }

    logActivity(type, title, metadata = {}) {
      if (!this.getToggle('telemetryLogging')) return;

      const entry = {
        id: 'ACT_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
        type, // 'MESSAGE_SENT', 'ROOM_JOIN', 'CALL_START', 'REPORT_FILED', 'SECURITY_ALERT', 'ADMIN_ACTION'
        title,
        metadata,
        timestamp: new Date().toISOString()
      };

      try {
        const list = this.getActivities();
        list.unshift(entry);
        if (list.length > this.maxEntries) list.pop();
        localStorage.setItem(this.storageKey, JSON.stringify(list));
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('nex:activity_logged', { detail: entry }));
    }

    getActivities(filterType = 'ALL') {
      try {
        const raw = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        if (filterType === 'ALL') return raw;
        return raw.filter(item => item.type === filterType);
      } catch (_) {
        return [];
      }
    }

    clearActivities() {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('nex:activity_cleared'));
    }

    exportActivitiesJson() {
      const data = this.getActivities();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexchat_activity_ledger_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    initScreenshotSentinel() {
      // Listen to printscreen / keyboard shortcuts
      window.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen' && this.getToggle('screenshotAlert')) {
          this.logActivity('SECURITY_ALERT', 'Screenshot capture shortcut detected on active window', { key: e.key });
          if (typeof window.showNotif === 'function') {
            window.showNotif('Screenshot alert: Screen capture event recorded.', 'info', 2500);
          }
        }
      });
    }

    openActivityAuditModal() {
      let modal = document.getElementById('nexActivityAuditModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nexActivityAuditModal';
        modal.style.cssText = `
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(4, 7, 15, 0.85);
          backdrop-filter: blur(8px);
          z-index: 10001;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `;
        document.body.appendChild(modal);
      }

      const activities = this.getActivities();

      modal.innerHTML = `
        <div style="
          background: #090e1a;
          border: 1px solid rgba(0, 242, 255, 0.3);
          box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0, 242, 255, 0.15);
          border-radius: 18px;
          max-width: 680px;
          width: 100%;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          padding: 24px;
          color: #f8fafc;
        ">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(0,242,255,0.15); border: 1px solid #00f2ff; color: #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 17px;">
                <i class="fa-solid fa-chart-line"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #fff;">My Activity &amp; Telemetry Audit Trail</h3>
                <div style="font-size: 11px; color: #94a3b8;">Client-side immutable session ledger (${activities.length} events logged)</div>
              </div>
            </div>
            <button type="button" id="btnCloseActivityAuditModal" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Controls Bar -->
          <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-activity-filter active" data-filter="ALL" style="padding: 4px 10px; border-radius: 6px; background: rgba(0,242,255,0.2); border: 1px solid #00f2ff; color: #00f2ff; font-size: 11px; font-weight: 700; cursor: pointer;">All (${activities.length})</button>
              <button type="button" class="btn-activity-filter" data-filter="MESSAGE_SENT" style="padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 11px; cursor: pointer;">Messages</button>
              <button type="button" class="btn-activity-filter" data-filter="REPORT_FILED" style="padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 11px; cursor: pointer;">Reports</button>
              <button type="button" class="btn-activity-filter" data-filter="SECURITY_ALERT" style="padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 11px; cursor: pointer;">Security</button>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" id="btnExportActivityJson" style="padding: 4px 10px; border-radius: 6px; background: rgba(0,255,102,0.12); border: 1px solid #00ff66; color: #00ff66; font-size: 11px; font-weight: 700; cursor: pointer;">
                <i class="fa-solid fa-download"></i> JSON Export
              </button>
              <button type="button" id="btnClearActivityLogs" style="padding: 4px 10px; border-radius: 6px; background: rgba(255,59,48,0.12); border: 1px solid #ff3b30; color: #ff3b30; font-size: 11px; cursor: pointer;">
                <i class="fa-solid fa-trash"></i> Clear
              </button>
            </div>
          </div>

          <!-- Activity Timeline Container -->
          <div id="nexActivityTimelineList" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
            ${this.renderActivityListHtml(activities)}
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      modal.querySelector('#btnCloseActivityAuditModal')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.querySelector('#btnExportActivityJson')?.addEventListener('click', () => {
        this.exportActivitiesJson();
      });

      modal.querySelector('#btnClearActivityLogs')?.addEventListener('click', () => {
        if (confirm('Clear all logged activity events from this client?')) {
          this.clearActivities();
          const list = modal.querySelector('#nexActivityTimelineList');
          if (list) list.innerHTML = this.renderActivityListHtml([]);
        }
      });

      modal.querySelectorAll('.btn-activity-filter').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.btn-activity-filter').forEach(b => {
            b.style.background = 'rgba(255,255,255,0.04)';
            b.style.borderColor = 'rgba(255,255,255,0.1)';
            b.style.color = '#94a3b8';
          });
          btn.style.background = 'rgba(0,242,255,0.2)';
          btn.style.borderColor = '#00f2ff';
          btn.style.color = '#00f2ff';
          const filter = btn.getAttribute('data-filter');
          const filtered = this.getActivities(filter);
          const list = modal.querySelector('#nexActivityTimelineList');
          if (list) list.innerHTML = this.renderActivityListHtml(filtered);
        });
      });
    }

    renderActivityListHtml(items) {
      if (!items || items.length === 0) {
        return '<div style="text-align: center; color: #64748b; padding: 30px; font-size: 12px; font-style: italic;">No activity events recorded yet in this session.</div>';
      }

      return items.map(act => {
        const time = new Date(act.timestamp).toLocaleTimeString();
        let icon = 'fa-circle-dot';
        let color = '#94a3b8';

        if (act.type === 'MESSAGE_SENT') { icon = 'fa-paper-plane'; color = '#00ff66'; }
        else if (act.type === 'REPORT_FILED') { icon = 'fa-flag'; color = '#ff3b30'; }
        else if (act.type === 'SECURITY_ALERT') { icon = 'fa-shield-halved'; color = '#f59e0b'; }
        else if (act.type === 'ROOM_JOIN') { icon = 'fa-arrow-right-to-bracket'; color = '#00f2ff'; }
        else if (act.type === 'ADMIN_ACTION') { icon = 'fa-gavel'; color = '#c084fc'; }

        return `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <span style="color: ${color}; margin-top: 2px; font-size: 13px;"><i class="fa-solid ${icon}"></i></span>
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #fff;">${escapeHtml(act.title)}</div>
                <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 2px;">Type: ${act.type}</div>
              </div>
            </div>
            <span style="font-size: 10px; color: #94a3b8; font-family: monospace; white-space: nowrap;">${time}</span>
          </div>
        `;
      }).join('');
    }

    renderGroupActivitySection(groupData, containerEl) {
      if (!containerEl) return;

      const membersCount = groupData.members?.length || 0;
      const adminsCount = groupData.admins?.length || 1;
      const suspendedCount = groupData.suspendedMembers?.length || 0;
      const isLoggingEnabled = this.getToggle('groupTelemetry');

      containerEl.innerHTML = `
        <div style="background: rgba(0, 242, 255, 0.04); border: 1px solid rgba(0, 242, 255, 0.2); border-radius: 12px; padding: 14px; margin-top: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-chart-simple" style="color: #00f2ff;"></i>
              <strong style="color: #fff; font-size: 13px;">Community Telemetry &amp; Velocity</strong>
            </div>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; cursor: pointer;">
              <input type="checkbox" id="nexGroupTelemetryToggle" ${isLoggingEnabled ? 'checked' : ''} style="accent-color: #00f2ff;">
              <span>Active</span>
            </label>
          </div>

          <!-- Quick Metrics Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px; text-align: center;">
              <div style="font-size: 15px; font-weight: 800; color: #00ff66; font-family: monospace;">${membersCount}</div>
              <div style="font-size: 10px; color: #94a3b8;">Total Members</div>
            </div>
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px; text-align: center;">
              <div style="font-size: 15px; font-weight: 800; color: #00f2ff; font-family: monospace;">${adminsCount}</div>
              <div style="font-size: 10px; color: #94a3b8;">Officers</div>
            </div>
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px; text-align: center;">
              <div style="font-size: 15px; font-weight: 800; color: ${suspendedCount > 0 ? '#ff3b30' : '#94a3b8'}; font-family: monospace;">${suspendedCount}</div>
              <div style="font-size: 10px; color: #94a3b8;">Suspended</div>
            </div>
          </div>

          <!-- Activity Health Pill -->
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; padding: 6px 10px; background: rgba(0,0,0,0.25); border-radius: 6px;">
            <span style="color: #94a3b8;">Channel Health Status:</span>
            <span style="color: #00ff66; font-weight: 700; display: flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-shield-check"></i> NORMAL ENCRYPTED VELOCITY
            </span>
          </div>
        </div>
      `;

      containerEl.querySelector('#nexGroupTelemetryToggle')?.addEventListener('change', (e) => {
        this.setToggle('groupTelemetry', e.target.checked);
        if (typeof window.showNotif === 'function') {
          window.showNotif(`Group telemetry logging: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, 'info', 1800);
        }
      });
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Global Singleton Expositions
  window.NexReportSystem = {
    REPORT_CATEGORIES,
    SEVERITY_LEVELS,
    openReportModal,
    closeReportModal,
    handleReportSubmit
  };

  window.NexActivityMonitor = new ActivityMonitorEngine();

  // Backward compatibility global shortcuts
  window.openReportModal = openReportModal;
  window.closeReportModal = closeReportModal;
  window.openActivityAuditModal = () => window.NexActivityMonitor.openActivityAuditModal();

})();
