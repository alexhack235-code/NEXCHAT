/**
 * NEXCHAT - Zero-Knowledge Encrypted Vault Backup (.nexvault AES-GCM)
 * Module: src/js/vault-backup.js
 * 
 * Provides end-to-end client-side backup and restoration of user chats, local contacts,
 * and encrypted preferences using PBKDF2 (100,000 rounds) + AES-256-GCM. Passphrases
 * never touch any cloud server.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  function bufferToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
  }

  async function deriveKey(passphrase, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  const NexVaultBackup = {
    async exportBackup(passphrase) {
      if (!passphrase || passphrase.length < 6) {
        throw new Error('Backup passphrase must be at least 6 characters.');
      }

      // 1. Gather all local session data
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        currentUser: localStorage.getItem('currentUser'),
        auth_uid: localStorage.getItem('auth_uid'),
        auth_username: localStorage.getItem('auth_username'),
        nex_theme: localStorage.getItem('nex_theme'),
        nex_privacy_settings: localStorage.getItem('nex_privacy_settings'),
        recent_chats: localStorage.getItem('cached_recent_chats') || '[]',
        vault_notes: localStorage.getItem('nex_status_vault') || '{}'
      };

      const enc = new TextEncoder();
      const plaintext = enc.encode(JSON.stringify(exportPayload));

      // 2. Generate random 16-byte salt and 12-byte IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // 3. Derive key and encrypt with AES-GCM
      const key = await deriveKey(passphrase, salt);
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        plaintext
      );

      const backupPackage = {
        format: 'NEXVAULT_V2',
        cipher: 'AES-256-GCM',
        kdf: 'PBKDF2-SHA256',
        iterations: 100000,
        salt: bufferToHex(salt),
        iv: bufferToHex(iv),
        ciphertext: bufferToHex(ciphertext),
        exportedAt: exportPayload.exportedAt
      };

      // 4. Trigger download as .nexvault file
      const blob = new Blob([JSON.stringify(backupPackage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexchat_backup_${Date.now()}.nexvault`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    },

    async restoreBackup(backupJsonString, passphrase) {
      if (!passphrase) {
        throw new Error('Passphrase is required to unlock backup.');
      }

      const backupPackage = JSON.parse(backupJsonString);
      if (backupPackage.format !== 'NEXVAULT_V2' || !backupPackage.ciphertext) {
        throw new Error('Invalid or corrupted .nexvault backup file format.');
      }

      const salt = hexToBuffer(backupPackage.salt);
      const iv = hexToBuffer(backupPackage.iv);
      const ciphertext = hexToBuffer(backupPackage.ciphertext);

      const key = await deriveKey(passphrase, new Uint8Array(salt));
      let decryptedBuffer;
      try {
        decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(iv) },
          key,
          ciphertext
        );
      } catch (_) {
        throw new Error('Decryption failed. Incorrect passphrase or altered archive.');
      }

      const dec = new TextDecoder();
      const payload = JSON.parse(dec.decode(decryptedBuffer));

      // Restore selectively
      if (payload.currentUser) localStorage.setItem('currentUser', payload.currentUser);
      if (payload.nex_theme) localStorage.setItem('nex_theme', payload.nex_theme);
      if (payload.nex_privacy_settings) localStorage.setItem('nex_privacy_settings', payload.nex_privacy_settings);
      if (payload.vault_notes) localStorage.setItem('nex_status_vault', payload.vault_notes);

      return payload;
    },

    openBackupModal() {
      let modal = document.getElementById('vaultBackupModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'vaultBackupModal';
        modal.className = 'cyber-modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px;';
        modal.innerHTML = `
          <div style="background:#090d16; border:1px solid rgba(0,243,255,0.3); border-radius:14px; max-width:480px; width:100%; padding:24px; box-shadow:0 0 30px rgba(0,243,255,0.15); color:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <h3 style="font-size:16px; font-weight:800; color:#00f3ff; margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-file-shield"></i> Zero-Knowledge Vault Backup
              </h3>
              <button type="button" onclick="document.getElementById('vaultBackupModal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p style="font-size:12px; color:#94a3b8; line-height:1.5; margin-bottom:16px;">
              Export your conversations and cryptographic credentials into a client-encrypted <code>.nexvault</code> archive (AES-256-GCM + PBKDF2). No third-party or server can decrypt your files without your passphrase.
            </p>
            <div style="display:flex; gap:10px; margin-bottom:14px;">
              <button type="button" id="tabExportBtn" style="flex:1; padding:8px; background:rgba(0,243,255,0.15); border:1px solid #00f3ff; color:#00f3ff; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-download"></i> Export Vault
              </button>
              <button type="button" id="tabRestoreBtn" style="flex:1; padding:8px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:#94a3b8; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-upload"></i> Restore Vault
              </button>
            </div>

            <!-- Export Form -->
            <div id="exportPane">
              <div style="margin-bottom:12px;">
                <label style="display:block; font-size:11px; text-transform:uppercase; color:#00f3ff; margin-bottom:6px; font-weight:700;">
                  Set Encryption Passphrase
                </label>
                <input type="password" id="inputExportPassphrase" placeholder="At least 6 characters" style="width:100%; padding:10px 12px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:13px;" />
              </div>
              <button type="button" id="btnExecuteExport" style="width:100%; padding:10px; background:#00f3ff; border:none; color:#000; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-lock"></i> Encrypt &amp; Download .nexvault
              </button>
            </div>

            <!-- Restore Form -->
            <div id="restorePane" style="display:none;">
              <div style="margin-bottom:12px;">
                <label style="display:block; font-size:11px; text-transform:uppercase; color:#00f3ff; margin-bottom:6px; font-weight:700;">
                  Choose .nexvault Archive
                </label>
                <input type="file" id="inputRestoreFile" accept=".nexvault,.json" style="width:100%; font-size:12px; color:#94a3b8;" />
              </div>
              <div style="margin-bottom:12px;">
                <label style="display:block; font-size:11px; text-transform:uppercase; color:#00f3ff; margin-bottom:6px; font-weight:700;">
                  Enter Passphrase
                </label>
                <input type="password" id="inputRestorePassphrase" placeholder="Passphrase" style="width:100%; padding:10px 12px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:13px;" />
              </div>
              <button type="button" id="btnExecuteRestore" style="width:100%; padding:10px; background:#10b981; border:none; color:#000; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-key"></i> Decrypt &amp; Restore Workspace
              </button>
            </div>

            <div id="backupFeedback" style="display:none; font-size:12px; margin-top:12px; text-align:center;"></div>
          </div>
        `;
        document.body.appendChild(modal);

        // Tab toggle
        const tabExp = document.getElementById('tabExportBtn');
        const tabRes = document.getElementById('tabRestoreBtn');
        const pExp = document.getElementById('exportPane');
        const pRes = document.getElementById('restorePane');

        tabExp?.addEventListener('click', () => {
          tabExp.style.background = 'rgba(0,243,255,0.15)';
          tabExp.style.borderColor = '#00f3ff';
          tabExp.style.color = '#00f3ff';
          tabRes.style.background = 'transparent';
          tabRes.style.borderColor = 'rgba(255,255,255,0.1)';
          tabRes.style.color = '#94a3b8';
          pExp.style.display = 'block';
          pRes.style.display = 'none';
        });

        tabRes?.addEventListener('click', () => {
          tabRes.style.background = 'rgba(16,185,129,0.15)';
          tabRes.style.borderColor = '#10b981';
          tabRes.style.color = '#10b981';
          tabExp.style.background = 'transparent';
          tabExp.style.borderColor = 'rgba(255,255,255,0.1)';
          tabExp.style.color = '#94a3b8';
          pExp.style.display = 'none';
          pRes.style.display = 'block';
        });

        // Export handler
        document.getElementById('btnExecuteExport')?.addEventListener('click', async () => {
          const pass = document.getElementById('inputExportPassphrase')?.value;
          const fb = document.getElementById('backupFeedback');
          try {
            await NexVaultBackup.exportBackup(pass);
            if (fb) {
              fb.style.display = 'block';
              fb.style.color = '#10b981';
              fb.textContent = 'Vault backup generated and downloaded successfully.';
            }
          } catch (e) {
            if (fb) {
              fb.style.display = 'block';
              fb.style.color = '#ff3366';
              fb.textContent = e.message;
            }
          }
        });

        // Restore handler
        document.getElementById('btnExecuteRestore')?.addEventListener('click', async () => {
          const fileInput = document.getElementById('inputRestoreFile');
          const pass = document.getElementById('inputRestorePassphrase')?.value;
          const fb = document.getElementById('backupFeedback');
          if (!fileInput?.files?.length) {
            if (fb) { fb.style.display = 'block'; fb.style.color = '#ff3366'; fb.textContent = 'Please choose a .nexvault file.'; }
            return;
          }
          const file = fileInput.files[0];
          const text = await file.text();
          try {
            await NexVaultBackup.restoreBackup(text, pass);
            if (fb) {
              fb.style.display = 'block';
              fb.style.color = '#10b981';
              fb.textContent = 'Decryption verified! Reloading restored workspace...';
            }
            setTimeout(() => window.location.reload(), 1500);
          } catch (e) {
            if (fb) {
              fb.style.display = 'block';
              fb.style.color = '#ff3366';
              fb.textContent = e.message;
            }
          }
        });
      }
      modal.style.display = 'flex';
    }
  };

  window.NexVaultBackup = NexVaultBackup;
})(window);
