/**
 * NEXCHAT Multi-Vault Cloudinary Media Storage Pipeline
 * Supports direct client-side unsigned uploads for Reels, Videos, Avatars, and Media
 * with automatic sequential failover across multiple Cloudinary accounts / keys.
 * 
 * ZERO backend required • ZERO Vercel dependencies • Works on localhost, GitHub Pages, Firebase
 */

// ─── CLOUDINARY VAULT POOL (MULTIPLE KEYS / ACCOUNTS) ───
export const CLOUDINARY_VAULT_POOL = [
  {
    id: 1,
    name: 'Cloudinary Vault 1 (Primary - Active)',
    cloudName: 'kkiyeyj8',
    uploadPreset: 'ml_default',
    folder: 'nexchat-media',
    active: true,
  },
  {
    id: 2,
    name: 'Cloudinary Vault 2 (NEX-VAULT - Active)',
    cloudName: 'l7roj4t8',
    uploadPreset: 'NEX-VAULT',
    folder: 'nexchat-media',
    active: true,
  },
  {
    id: 3,
    name: 'Cloudinary Vault 3 (NEXVAULT2 - Active)',
    cloudName: 'bll4dbye',
    uploadPreset: 'NEXVAULT2',
    folder: 'nexchat-media',
    active: true,
  },
  {
    id: 4,
    name: 'Cloudinary Vault 4 (Backup)',
    cloudName: '',
    uploadPreset: '',
    folder: 'nexchat-media',
    active: false,
  },
  {
    id: 5,
    name: 'Cloudinary Vault 5 (Backup)',
    cloudName: '',
    uploadPreset: '',
    folder: 'nexchat-media',
    active: false,
  },
];

/**
 * Retrieves all currently active and configured Cloudinary vaults.
 * Supports runtime customization via window.CLOUDINARY_VAULTS or localStorage.
 * @returns {Array<{id: number, name: string, cloudName: string, uploadPreset: string, folder: string}>}
 */
export function getActiveCloudinaryVaults() {
  // Check runtime window override
  if (typeof window !== 'undefined' && Array.isArray(window.CLOUDINARY_VAULTS) && window.CLOUDINARY_VAULTS.length > 0) {
    return window.CLOUDINARY_VAULTS.filter(v => v.cloudName && v.uploadPreset);
  }

  // Check localStorage override
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('nexchat_cloudinary_vaults');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(v => v.cloudName && v.uploadPreset);
        }
      }
    } catch {}
  }

  // Fallback to static pool
  return CLOUDINARY_VAULT_POOL.filter(v => Boolean(v.cloudName && v.uploadPreset));
}

/**
 * Registers a new Cloudinary vault into the runtime pool.
 * @param {string} cloudName 
 * @param {string} uploadPreset 
 * @param {string} [name] 
 */
export function registerCloudinaryVault(cloudName, uploadPreset, name = null) {
  if (!cloudName || !uploadPreset) return;
  const vaults = getActiveCloudinaryVaults();
  const newVault = {
    id: vaults.length + 1,
    name: name || `Cloudinary Vault ${vaults.length + 1}`,
    cloudName: cloudName.trim(),
    uploadPreset: uploadPreset.trim(),
    folder: 'nexchat-media',
    active: true,
  };
  vaults.push(newVault);
  if (typeof window !== 'undefined') {
    window.CLOUDINARY_VAULTS = vaults;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('nexchat_cloudinary_vaults', JSON.stringify(vaults));
    } catch {}
  }
  console.log(`[CLOUDINARY POOL] Registered new vault: ${newVault.name} (${newVault.cloudName})`);
  return newVault;
}

/**
 * Uploads media (video, image, or auto) to Cloudinary with sequential failover across all configured vaults.
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

  const vaults = getActiveCloudinaryVaults();
  if (vaults.length === 0) {
    throw new Error('No active Cloudinary vaults are configured in the pool.');
  }

  const resourceType = options.resourceType || (file.type && file.type.startsWith('video/') ? 'video' : 'image');
  const folder = options.folder || 'nexchat-media';
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);

  let lastError = null;

  for (let i = 0; i < vaults.length; i++) {
    const vault = vaults[i];
    try {
      if (i > 0 && options.onVaultSwitch) {
        options.onVaultSwitch(vaults[i - 1].name, vault.name);
      }
      console.log(`[CLOUDINARY POOL] Attempting upload to ${vault.name} (${vault.cloudName})...`);

      const result = await uploadToSingleCloudinaryVault(file, vault, resourceType, folder, fileSizeMb, options.onProgress);
      console.log(`[CLOUDINARY POOL] Successfully uploaded to ${vault.name}:`, result.secure_url);
      return {
        ...result,
        vault: vault.name,
        cloudName: vault.cloudName,
      };
    } catch (err) {
      console.warn(`[CLOUDINARY POOL] ${vault.name} failed:`, err.message);
      lastError = err;
      // Cascade to next vault in pool
    }
  }

  throw new Error(`All Cloudinary vaults in the pool failed. Last error: ${lastError?.message || 'Unknown'}`);
}

/**
 * Executes upload to a specific single Cloudinary vault endpoint.
 * @private
 */
function uploadToSingleCloudinaryVault(file, vault, resourceType, folder, fileSizeMb, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(vault.cloudName)}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', vault.uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }

    xhr.open('POST', endpoint, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          const uploadedMb = (e.loaded / (1024 * 1024)).toFixed(2);
          onProgress(percent, `${uploadedMb} / ${fileSizeMb} MB`, vault.name);
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
            format: res.format || (resourceType === 'video' ? 'mp4' : 'jpg'),
            bytes: res.bytes || file.size,
            fileName: file.name || `${res.public_id}.${res.format || 'bin'}`,
            fileType: file.type || `${resourceType}/octet-stream`,
            fileSize: file.size,
          });
        } catch (err) {
          reject(new Error(`Failed to parse Cloudinary response from ${vault.name}: ${err.message}`));
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
      reject(new Error(`Network connection error to ${vault.name}`));
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
 * Legacy config getter for backward compatibility
 */
export function getCloudinaryConfig() {
  const active = getActiveCloudinaryVaults();
  return active[0] || CLOUDINARY_VAULT_POOL[0];
}
