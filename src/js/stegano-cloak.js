/**
 * NEXCHAT - Steganographic Pixel Cloak Engine
 * HTML5 Canvas Least Significant Bit (LSB) cryptographic steganography,
 * covert image encoding & extraction, and decoy carrier generation.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  const MAGIC_HEADER = 'NEXSTEG1:';

  class SteganoCloakEngine {
    constructor() {
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    bindDOM() {
      this.injectModal();
      this.injectHubAction();
    }

    injectModal() {
      if (document.getElementById('steganoCloakModal')) return;

      const modal = document.createElement('div');
      modal.id = 'steganoCloakModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window stegano-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-user-secret text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">STEGANOGRAPHIC PIXEL CLOAK</h3>
              <span class="stegano-tag">LSB PIXEL CYPHER</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeSteganoModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="stegano-modal-body">
            <p class="text-xs text-gray-300 text-center mb-3">
              Embed encrypted intelligence invisibly inside an innocent image carrier using Least Significant Bit (LSB) pixel modification. Only operatives with the cloak extractor can reveal the payload.
            </p>

            <div class="stegano-tabs-row">
              <button type="button" class="stegano-tab-btn active" data-tab="encode">ENCODE & DISPATCH</button>
              <button type="button" class="stegano-tab-btn" data-tab="decode">DECODE EXTRACTOR</button>
            </div>

            <!-- Encode Tab -->
            <div class="stegano-tab-content" id="steganoTabEncode">
              <div class="stegano-field mt-3">
                <label class="stegano-label">SECRET INTEL / PAYLOAD TO CLOAK:</label>
                <textarea id="steganoSecretInput" class="stegano-text-area" rows="3" placeholder="Enter top-secret message, coordinates, or cryptographic keys..."></textarea>
              </div>

              <div class="stegano-field mt-3">
                <label class="stegano-label">CARRIER IMAGE SOURCE:</label>
                <div class="flex gap-2">
                  <button type="button" id="useDefaultCarrierBtn" class="stegano-opt-btn active">Generate Cyber Decoy Carrier</button>
                  <label class="stegano-upload-label">
                    <span>Upload Custom Image</span>
                    <input type="file" id="steganoUploadFile" accept="image/png,image/jpeg" style="display:none;" />
                  </label>
                </div>
              </div>

              <button type="button" id="confirmEncodeSteganoBtn" class="stegano-submit-btn mt-4">
                <i class="fa-solid fa-lock"></i> ENCODE LSB & DISPATCH CLOAKED ATTACHMENT
              </button>
            </div>

            <!-- Decode Tab -->
            <div class="stegano-tab-content" id="steganoTabDecode" style="display: none;">
              <div class="stegano-field mt-3">
                <label class="stegano-label">SELECT CLOAKED IMAGE FOR EXTRACTION:</label>
                <input type="file" id="steganoDecodeFileInput" accept="image/png,image/jpeg" class="stegano-file-input" />
              </div>

              <div class="stegano-extracted-box mt-3" id="steganoExtractedBox">
                <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">EXTRACTED INTEL VIEWPORT:</span>
                <pre class="stegano-extracted-text mt-1" id="steganoExtractedOutput">No cloak decrypted yet.</pre>
              </div>

              <button type="button" id="executeDecodeBtn" class="stegano-submit-btn mt-3">
                <i class="fa-solid fa-key"></i> EXTRACT HIDDEN LSB INTEL
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
    }

    bindModalEvents() {
      const modal = document.getElementById('steganoCloakModal');
      document.getElementById('closeSteganoModalBtn')?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });

      // Tabs
      const tabs = document.querySelectorAll('.stegano-tab-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const isEncode = tab.dataset.tab === 'encode';
          const encEl = document.getElementById('steganoTabEncode');
          const decEl = document.getElementById('steganoTabDecode');
          if (encEl) encEl.style.display = isEncode ? 'block' : 'none';
          if (decEl) decEl.style.display = isEncode ? 'none' : 'block';
        });
      });

      // Confirm encode
      document.getElementById('confirmEncodeSteganoBtn')?.addEventListener('click', () => {
        const textInput = document.getElementById('steganoSecretInput');
        const text = textInput ? textInput.value.trim() : '';
        if (!text) {
          if (typeof window.showNotif === 'function') window.showNotif('Please enter secret intel to cloak', 'error');
          return;
        }

        // [FORTRESS AI Cloud Defender: Steganography Ingress Guard]
        if (window.fortressGuard) {
          const inspection = window.fortressGuard(text, 'Steganography Cloak');
          if (!inspection.safe) return;
        }

        this.generateCloakedAttachment(text);
        if (modal) modal.style.display = 'none';
        if (textInput) textInput.value = '';
      });

      // Execute decode file
      document.getElementById('executeDecodeBtn')?.addEventListener('click', () => {
        const fileInp = document.getElementById('steganoDecodeFileInput');
        const file = fileInp?.files?.[0];
        if (!file) {
          if (typeof window.showNotif === 'function') window.showNotif('Please select a carrier image', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          this.decodeImageSrc(e.target.result, (extracted) => {
            const out = document.getElementById('steganoExtractedOutput');
            if (out) out.textContent = extracted;
            if (typeof window.showNotif === 'function') {
              window.showNotif('Decrypted covert payload from LSB pixel matrix', 'success', 2500);
            }
            if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
          });
        };
        reader.readAsDataURL(file);
      });
    }

    injectHubAction() {
      const hub = document.getElementById('attachmentPopupHub');
      if (hub && !document.getElementById('hubActionSteganoCloak')) {
        const item = document.createElement('div');
        item.className = 'attach-hub-item';
        item.id = 'hubActionSteganoCloak';
        item.innerHTML = `
          <div class="attach-hub-icon icon-stegano"><i class="fa-solid fa-user-secret"></i></div>
          <span>Pixel Cloak</span>
        `;
        item.addEventListener('click', () => {
          hub.style.display = 'none';
          this.openModal();
        });
        hub.appendChild(item);
      }
    }

    openModal() {
      const modal = document.getElementById('steganoCloakModal');
      if (!modal) return;
      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    generateCloakedAttachment(secretText) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      // Draw cyber pattern decoy carrier
      const grad = ctx.createLinearGradient(0, 0, 300, 200);
      grad.addColorStop(0, '#061325');
      grad.addColorStop(0.5, '#0b2447');
      grad.addColorStop(1, '#19376d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 300, 200);

      // Cyber lines & shapes
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(150, 100, 60, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#00ff66';
      ctx.font = '700 12px monospace';
      ctx.fillText('[TACTICAL RECON DRONE TELEMETRY]', 20, 30);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 10px monospace';
      ctx.fillText('SECTOR 04 // LAT: 45.192 N, LNG: 9.214 E', 20, 50);

      // Encode Secret Text into LSB
      const fullPayload = MAGIC_HEADER + secretText;
      const imgData = ctx.getImageData(0, 0, 300, 200);
      this.encodeBitsIntoData(imgData.data, fullPayload);
      ctx.putImageData(imgData, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');

      const attachment = {
        fileType: 'stegano_cloak',
        isSteganoCloak: true,
        downloadURL: dataUrl,
        fileName: 'covert_recon_matrix.png',
        cloakPayload: secretText
      };

      if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage(`Dispatched Steganographic Pixel Cloak Image`, attachment, false, 'sent');
      }

      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (partnerId) {
          window.sendSupabaseMessage({
            from: window.myUID || 'u_current',
            to: partnerId,
            text: "",
            attachment: attachment,
            chatType: window.currentChatType || 'direct'
          }).catch(() => {});
        }
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif('Pixel Cloak encoded and dispatched to channel', 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    encodeBitsIntoData(data, text) {
      const bitStr = this.stringToBits(text);
      let bitIdx = 0;

      for (let i = 0; i < data.length && bitIdx < bitStr.length; i += 4) {
        // Red
        data[i] = (data[i] & ~1) | parseInt(bitStr[bitIdx++], 10);
        if (bitIdx < bitStr.length) {
          // Green
          data[i + 1] = (data[i + 1] & ~1) | parseInt(bitStr[bitIdx++], 10);
        }
        if (bitIdx < bitStr.length) {
          // Blue
          data[i + 2] = (data[i + 2] & ~1) | parseInt(bitStr[bitIdx++], 10);
        }
      }
    }

    decodeImageSrc(src, cb) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const extracted = this.extractBitsFromData(imgData.data);
        cb(extracted);
      };
      img.src = src;
    }

    stringToBits(str) {
      let bits = '';
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        const b = code.toString(2).padStart(8, '0');
        bits += b;
      }
      // Null terminator (16 zeros)
      bits += '0000000000000000';
      return bits;
    }

    extractBitsFromData(data) {
      let bits = '';
      let result = '';

      for (let i = 0; i < data.length; i += 4) {
        bits += (data[i] & 1);
        bits += (data[i + 1] & 1);
        bits += (data[i + 2] & 1);

        while (bits.length >= 8) {
          const byteStr = bits.slice(0, 8);
          bits = bits.slice(8);
          const byteVal = parseInt(byteStr, 2);
          if (byteVal === 0) {
            // Null terminator reached
            return this.verifyHeader(result);
          }
          result += String.fromCharCode(byteVal);
        }
      }
      return this.verifyHeader(result);
    }

    verifyHeader(str) {
      if (str.startsWith(MAGIC_HEADER)) {
        return str.slice(MAGIC_HEADER.length);
      }
      return '[NO VALID STEGANO CLOAK IDENTIFIED IN CARRIER PIXELS]';
    }

    renderCloakBubble(attachment) {
      const wrap = document.createElement('div');
      wrap.className = 'stegano-bubble-card';

      wrap.innerHTML = `
        <div class="stegano-bubble-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-user-secret text-[#00ff66]"></i>
            <span class="stegano-bubble-title">STEGANO PIXEL CLOAK</span>
          </div>
          <span class="stegano-bubble-tag">LSB ARMORED</span>
        </div>

        <div class="stegano-image-wrap mt-2">
          <img src="${attachment.downloadURL}" alt="Covert Carrier" class="stegano-carrier-preview" />
        </div>

        <div class="stegano-reveal-bar mt-2">
          <button type="button" class="stegano-decrypt-btn">
            <i class="fa-solid fa-key"></i> EXTRACT COVERT INTEL
          </button>
        </div>

        <div class="stegano-covert-display mt-2" style="display: none;">
          <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">DECRYPTED PAYLOAD:</span>
          <p class="stegano-uncloaked-text mt-1">${attachment.cloakPayload || 'Payload decrypted from pixel bits.'}</p>
        </div>
      `;

      const btn = wrap.querySelector('.stegano-decrypt-btn');
      const display = wrap.querySelector('.stegano-covert-display');

      btn?.addEventListener('click', () => {
        if (display) display.style.display = display.style.display === 'none' ? 'block' : 'none';
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
      });

      return wrap;
    }
    revealInBubble(triggerEl) {
      if (!triggerEl) return;
      const card = triggerEl.closest('.stegano-cloak-card') || triggerEl.closest('.message-bubble');
      if (!card) return;

      const img = card.querySelector('img');
      const holoCard = card.querySelector('.stegano-hologram-card');
      const holoText = card.querySelector('.stegano-holo-text');

      if (!img || !holoCard) return;

      if (holoCard.style.display !== 'none') {
        holoCard.style.display = 'none';
        return;
      }

      holoCard.style.display = 'block';
      if (holoText) holoText.textContent = 'Decoding LSB pixel matrix...';

      const cachedPayload = card.dataset.cloakPayload;
      if (cachedPayload) {
        if (holoText) holoText.textContent = cachedPayload;
        try {
          if (navigator.vibrate) navigator.vibrate([30, 50]);
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
        } catch (_) {}
        return;
      }

      this.decodeImageSrc(img.src, (extracted) => {
        if (holoText) {
          holoText.textContent = extracted;
          card.dataset.cloakPayload = extracted;
        }
        try {
          if (navigator.vibrate) navigator.vibrate([30, 50]);
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
        } catch (_) {}
      });
    }
  }

  window.steganoCloakEngine = new SteganoCloakEngine();
  window.NexSteganoCloak = window.steganoCloakEngine;
})();
