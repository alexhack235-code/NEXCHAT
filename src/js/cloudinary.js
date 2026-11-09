/**
 * NEXCHAT Multi-Vault Cloudinary Media Storage Pipeline (Cold-Vault Powered)
 * 
 * Security:
 * - ZERO hardcoded Cloudinary credentials or master presets in the repository.
 * - Dynamic upload targets are fetched on-demand from the secure COLD-VAULT microservice (/api/vault).
 * - Direct client-to-CDN upload (supports 100MB+ full-speed uploads with no server payload bottlenecks).
 * - Automatic failover across 34 quarantined accounts.
 */

/**
 * Retrieves the current dynamic vault target from COLD-VAULT.
 */
async function fetchTargetVault(resourceType = 'auto', folder = 'nexchat-media') {
  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceType, folder, action: 'dispatch' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.target) {
        return data.target;
      }
    }
  } catch (err) {
    console.warn('[COLD-VAULT] Failed to fetch dynamic vault target:', err.message);
  }
  return null;
}

/**
 * Reports a failed vault to COLD-VAULT for automatic 5-minute quarantine
 */
async function reportVaultFailure(vaultId, reason) {
  try {
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'report_failure', vaultId, reason })
    });
  } catch (_) {}
}

/**
 * Uploads media (video, image, or auto) to Cloudinary with sequential failover across COLD-VAULT accounts.
 * 
 * @param {File|Blob} file - The file to upload
 * @param {object} [options]
 * @param {'auto'|'image'|'video'|'raw'} [options.resourceType='auto'] - Cloudinary resource type
 * @param {string} [options.folder='nexchat-media'] - Destination folder
 * @param {function(number, string, string):void} [options.onProgress] - (percent, formattedMb, vaultName)
 * @param {function(string, string):void} [options.onVaultSwitch] - (fromVault, toVault)
 * @returns {Promise<{secure_url: string, downloadURL: string, public_id: string, format: string, bytes: number, vault: string}>}
 */
export async function uploadMediaToCloudinary(file, options = {}) {
  if (!file) {
    throw new Error('No file provided for Cloudinary upload.');
  }

  let resourceType = options.resourceType;
  if (!resourceType) {
    const mime = (file.type || '').toLowerCase();
    if (mime.startsWith('video/') || mime.startsWith('audio/')) {
      resourceType = 'video';
    } else if (mime.startsWith('image/')) {
      resourceType = 'image';
    } else {
      resourceType = 'auto';
    }
  }

  const folder = options.folder || 'nexchat-media';
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);

  // Attempt up to 3 automatic vault switches if an account quota is exhausted
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const target = await fetchTargetVault(resourceType, folder);
    if (!target) {
      throw new Error('COLD-VAULT: Unable to acquire active media upload target.');
    }

    try {
      console.log(`[COLD-VAULT] Uploading to ${target.vaultName} (${target.cloudName})...`);
      const result = await uploadToSingleCloudinaryVault(file, target, resourceType, folder, fileSizeMb, options.onProgress, options);
      console.log(`[COLD-VAULT] Upload complete via ${target.vaultName}:`, result.secure_url);
      return {
        ...result,
        vault: target.vaultName,
        cloudName: target.cloudName
      };
    } catch (err) {
      console.warn(`[COLD-VAULT] Upload to ${target.vaultName} failed:`, err.message);
      lastError = err;
      await reportVaultFailure(target.vaultId, err.message);
      // Retry with next dispatched vault
    }
  }

  throw new Error(`Media upload failed across all attempted vaults. Last error: ${lastError?.message || 'Unknown'}`);
}

/**
 * Executes direct upload to the Cloudinary endpoint.
 * @private
 */
function uploadToSingleCloudinaryVault(file, vault, resourceType, folder, fileSizeMb, onProgress, options = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 45000;
    xhr.ontimeout = () => reject(new Error('Cloudinary upload timed out after 45s'));
    const endpoint = vault.uploadUrl || `https://api.cloudinary.com/v1_1/${encodeURIComponent(vault.cloudName)}/${resourceType}/upload`;

    if (typeof options.onXHRCreated === 'function') {
      try {
        options.onXHRCreated(xhr);
      } catch (cbErr) {
        console.warn('[CLOUDINARY] onXHRCreated error:', cbErr);
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', vault.uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }

    xhr.open('POST', endpoint, true);

    xhr.onabort = () => {
      reject(new DOMException('Upload aborted by user', 'AbortError'));
    };

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          const uploadedMb = (e.loaded / (1024 * 1024)).toFixed(2);
          onProgress(percent, `${uploadedMb} / ${fileSizeMb} MB`, vault.vaultName || vault.name);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            secure_url: res.secure_url,
            downloadURL: res.secure_url,
            url: res.secure_url,
            public_id: res.public_id,
            duration: res.duration || 0,
            format: res.format || (file.name ? file.name.split('.').pop() : (resourceType === 'video' ? 'mp4' : 'jpg')),
            bytes: res.bytes || file.size,
            fileName: file.name || `${res.public_id}.${res.format || (resourceType === 'video' ? 'mp4' : 'jpg')}`,
            fileType: file.type || `${resourceType}/octet-stream`,
            fileSize: file.size,
          });
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      } else {
        let errMessage = `Cloudinary returned HTTP status ${xhr.status}`;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed.error && parsed.error.message) {
            errMessage = parsed.error.message;
          }
        } catch {}
        reject(new Error(errMessage));
      }
    };

    xhr.onerror = () => {
      reject(new Error(`Network connection error to Cloudinary CDN`));
    };

    xhr.send(formData);
  });
}

/**
 * Convenience wrapper for video uploads (Reels, Video Notes)
 */
export async function uploadVideoToCloudinary(file, options = {}) {
  return uploadMediaToCloudinary(file, {
    ...options,
    resourceType: 'video',
    folder: options.folder || 'nexchat-reels',
  });
}

/**
 * Convenience wrapper for image uploads (Profile Avatars, Status Photos)
 */
export async function uploadImageToCloudinary(file, options = {}) {
  return uploadMediaToCloudinary(file, {
    ...options,
    resourceType: 'image',
    folder: options.folder || 'nexchat-avatars',
  });
}

/**
 * Convenience wrapper for audio uploads (Voice Notes, Audio Files)
 */
export async function uploadAudioToCloudinary(file, options = {}) {
  return uploadMediaToCloudinary(file, {
    ...options,
    resourceType: 'video',
    folder: options.folder || 'nexchat-voice',
  });
}

/**
 * Convenience wrapper for document uploads (PDF, TXT, DOCX, ZIP)
 */
export async function uploadDocumentToCloudinary(file, options = {}) {
  return uploadMediaToCloudinary(file, {
    ...options,
    resourceType: 'auto',
    folder: options.folder || 'nexchat-docs',
  });
}

/**
 * Backward compatibility getters
 */
export function getActiveCloudinaryVaults() {
  return [{ name: 'COLD-VAULT Dynamic Pool', cloudName: 'dynamic', uploadPreset: 'cold-vault' }];
}

export function registerCloudinaryVault() {
  console.info('[COLD-VAULT] Vaults are managed server-side in COLD-VAULT.');
}

export function getCloudinaryConfig() {
  return { name: 'COLD-VAULT Dynamic Pool', cloudName: 'dynamic', uploadPreset: 'cold-vault' };
}
