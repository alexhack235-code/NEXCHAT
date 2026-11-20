/**
 * NEXCHAT Multi-Vault ImageKit Storage Engine (src/js/imagekit-vault.js)
 * High-speed direct client-to-CDN uploads across a pool of up to 30 ImageKit accounts.
 * Features automatic quota failover, upload progress telemetry, and zero server egress.
 */

/**
 * Fetches authentication parameters for a specific ImageKit vault or via round-robin.
 * 
 * @param {number} [vaultIndex] - Optional explicit vault index (1..30)
 * @returns {Promise<{vaultIndex: number, vaultName: string, totalActiveVaults: number, availableVaultIndices: number[], token: string, expire: number, signature: string, publicKey: string, urlEndpoint: string}>}
 */
export async function getImageKitAuthParameters(vaultIndex) {
  const url = vaultIndex ? `/api/imagekit-auth?vault=${vaultIndex}` : '/api/imagekit-auth';
  const resp = await fetch(url);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `ImageKit Auth failed with status ${resp.status}`);
  }
  return await resp.json();
}

/**
 * Uploads media to a specific ImageKit vault instance.
 */
async function uploadToSingleVault(file, authData, options = {}) {
  const folder = options.folder || '/nexchat-media';
  const cleanName = (options.fileName || file.name || `media_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', cleanName);
  formData.append('publicKey', authData.publicKey);
  formData.append('signature', authData.signature);
  formData.append('expire', String(authData.expire));
  formData.append('token', authData.token);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'true');

  if (Array.isArray(options.tags) && options.tags.length) {
    formData.append('tags', options.tags.join(','));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload', true);

    if (xhr.upload && typeof options.onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          const loadedMb = (e.loaded / (1024 * 1024)).toFixed(2);
          const totalMb = (e.total / (1024 * 1024)).toFixed(2);
          options.onProgress(percent, `${loadedMb} / ${totalMb} MB`, authData.vaultName);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url: res.url,
            downloadUrl: res.url,
            fileId: res.fileId,
            name: res.name,
            size: res.size,
            filePath: res.filePath,
            thumbnailUrl: res.thumbnailUrl || res.url,
            fileType: res.fileType,
            vault: authData.vaultName || `ImageKit Vault ${authData.vaultIndex}`,
            vaultIndex: authData.vaultIndex
          });
        } catch (parseErr) {
          reject(new Error('Failed to parse ImageKit response'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.message || `ImageKit returned status ${xhr.status}`));
        } catch (_) {
          reject(new Error(`ImageKit HTTP error ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network connection error to ImageKit CDN'));
    xhr.ontimeout = () => reject(new Error('ImageKit upload timed out after 90 seconds'));
    xhr.timeout = 90000;

    xhr.send(formData);
  });
}

/**
 * Universal upload method with automatic cascading failover across all 30 ImageKit vaults.
 * If Vault 1 fails or hits monthly bandwidth quotas, it seamlessly cascades to Vault 2, 3, etc.
 * 
 * @param {File|Blob} file
 * @param {object} [options]
 * @param {string} [options.folder]
 * @param {string} [options.fileName]
 * @param {function(number, string, string):void} [options.onProgress] - (percent, formattedMb, vaultName)
 * @param {function(string, string):void} [options.onVaultSwitch] - (fromVault, toVault)
 * @returns {Promise<{url: string, fileId: string, name: string, size: number, filePath: string, thumbnailUrl: string, vault: string, vaultIndex: number}>}
 */
export async function uploadToImageKit(file, options = {}) {
  if (!file) throw new Error('No file provided for ImageKit upload');

  // Step 1: Initial auth fetch to get available vaults pool
  const initialAuth = await getImageKitAuthParameters();
  const availableIndices = initialAuth.availableVaultIndices || [initialAuth.vaultIndex];

  let currentAuth = initialAuth;
  let lastError = null;

  for (let i = 0; i < availableIndices.length; i++) {
    const vaultIdx = availableIndices[i];

    // If cascading past the first attempt, fetch specific auth for next vault
    if (i > 0) {
      try {
        if (typeof options.onVaultSwitch === 'function') {
          options.onVaultSwitch(`ImageKit Vault ${availableIndices[i - 1]}`, `ImageKit Vault ${vaultIdx}`);
        }
        currentAuth = await getImageKitAuthParameters(vaultIdx);
      } catch (authErr) {
        console.warn(`[IMAGEKIT-POOL] Failed auth for Vault ${vaultIdx}, skipping:`, authErr.message);
        continue;
      }
    }

    try {
      console.log(`[IMAGEKIT-POOL] Attempting upload to ${currentAuth.vaultName}...`);
      const result = await uploadToSingleVault(file, currentAuth, options);
      console.log(`[IMAGEKIT-POOL] Successfully stored in ${currentAuth.vaultName}:`, result.url);
      return result;
    } catch (uploadErr) {
      console.warn(`[IMAGEKIT-POOL] ${currentAuth.vaultName} failed:`, uploadErr.message);
      lastError = uploadErr;
      // Cascade to the next vault in the pool
    }
  }

  throw new Error(`All ${availableIndices.length} ImageKit vaults failed. Last error: ${lastError?.message || 'Upload unavailable'}`);
}
