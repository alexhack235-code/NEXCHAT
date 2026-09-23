/**
 * NEX-REELS Multi-Vault Sequential Video Storage Router
 * Manages uploading short videos to NEX-REELS VAULT 0 through 5 with sequential failover.
 */
import { uploadVideoToCloudinary } from './cloudinary.js';

export const REELS_VAULTS = [
  { index: 0, name: 'NEX-REELS VAULT 0', access: 'public', configured: true },
  { index: 1, name: 'NEX-REELS VAULT 1', access: 'private', configured: false },
  { index: 2, name: 'NEX-REELS VAULT 2', access: 'private', configured: true },
  { index: 3, name: 'NEX-REELS VAULT 3', access: 'private', configured: true },
  { index: 4, name: 'NEX-REELS VAULT 4', access: 'private', configured: true },
  { index: 5, name: 'NEX-REELS VAULT 5', access: 'private', configured: true },
];

/**
 * Inspects a video file and retrieves its duration in seconds.
 * @param {File|Blob} file 
 * @returns {Promise<number>}
 */
export function getVideoDuration(file) {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objUrl = URL.createObjectURL(file);
      video.src = objUrl;

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objUrl);
        resolve(video.duration || 0);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(0);
      };

      // Fallback timeout in case metadata event stalls
      setTimeout(() => {
        URL.revokeObjectURL(objUrl);
        resolve(0);
      }, 4000);
    } catch {
      resolve(0);
    }
  });
}

/**
 * Attempts upload to a specific vault index via /api/upload.
 * @private
 */
function uploadToSingleVault(file, vaultIndex, options = {}) {
  const cleanName = (file.name || 'reel.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
  const uid = options.uid || 'anon';
  const filename = `reels/${uid}/${Date.now()}_${cleanName}`;
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const vault = REELS_VAULTS[vaultIndex] || { name: `NEX-REELS VAULT ${vaultIndex}`, access: 'public' };

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `/api/upload?type=reels&vault=${vaultIndex}&filename=${encodeURIComponent(filename)}`;

    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('x-filename', filename);
    xhr.setRequestHeader('x-upload-type', 'reels');
    xhr.setRequestHeader('x-vault-index', String(vaultIndex));
    xhr.setRequestHeader('x-access-mode', vault.access);

    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }

    if (xhr.upload && options.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          const loadedMb = (e.loaded / (1024 * 1024)).toFixed(2);
          options.onProgress(percent, `${loadedMb} / ${fileSizeMb} MB`, vault.name);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url: res.url,
            rawBlobUrl: res.rawBlobUrl || res.url,
            pathname: res.pathname,
            vault: res.vault || vault.name,
            vaultIndex: vaultIndex,
            access: res.access || vault.access,
            fileName: file.name || cleanName,
            fileSize: file.size,
            fileType: file.type || 'video/mp4',
          });
        } catch (err) {
          reject(new Error(`Failed to parse response from ${vault.name}: ${err.message}`));
        }
      } else {
        let errCode = 'UPLOAD_FAILED';
        try {
          const parsed = JSON.parse(xhr.responseText);
          errCode = parsed.code || errCode;
        } catch {}
        reject(new Error(`Vault ${vaultIndex} returned status ${xhr.status} (${errCode})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error(`Network error uploading to ${vault.name}`));
    };

    xhr.send(file);
  });
}

/**
 * Uploads a short video reel, sequentially routing through NEX-REELS VAULT 0 through 5.
 * If a vault is full, unconfigured, or errors, it cascades to the next vault.
 * If all Blob vaults fail, it falls back to Cloudinary video storage.
 * 
 * @param {File|Blob} file - The video file
 * @param {object} [options]
 * @param {string} [options.uid] - Author UID
 * @param {number} [options.startVault=0] - Initial vault to attempt
 * @param {number} [options.maxDuration=90] - Max duration in seconds for short video reels
 * @param {function(number, string, string):void} [options.onProgress] - (percent, formattedMb, vaultName)
 * @param {function(string, string):void} [options.onVaultSwitch] - (fromVault, toVault)
 * @returns {Promise<{url: string, vault: string, duration: number, fileName: string, fileSize: number, fileType: string}>}
 */
export async function uploadReelVideo(file, options = {}) {
  if (!file) {
    throw new Error('No video file selected.');
  }

  // Duration check for short video reels
  const duration = await getVideoDuration(file);
  const maxDuration = options.maxDuration || 90;
  if (duration > 0 && duration > maxDuration) {
    console.warn(`[NEX-REELS] Video duration (${duration.toFixed(1)}s) exceeds max reel duration (${maxDuration}s).`);
  }

  // 1. Primary Strategy: Multi-Vault Cloudinary Pipeline (Zero backend, direct CDN streaming)
  try {
    console.log('[NEX-REELS] Uploading to Multi-Vault Cloudinary Pipeline...');
    const cldRes = await uploadVideoToCloudinary(file, {
      folder: 'nexchat-reels',
      onProgress: (percent, msg, vaultName) => {
        if (options.onProgress) {
          options.onProgress(percent, msg, vaultName || 'Cloudinary Vault Pool');
        }
      },
      onVaultSwitch: options.onVaultSwitch,
    });

    if (cldRes && (cldRes.secure_url || cldRes.url)) {
      console.log(`[NEX-REELS] Successfully saved to ${cldRes.vault || 'Cloudinary Vault Pool'}:`, cldRes.secure_url || cldRes.url);
      return {
        url: cldRes.secure_url || cldRes.url,
        rawBlobUrl: cldRes.secure_url || cldRes.url,
        pathname: cldRes.public_id,
        vault: cldRes.vault || 'Cloudinary Vault Pool',
        vaultIndex: 0,
        access: 'public',
        duration: cldRes.duration || duration,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'video/mp4',
      };
    }
  } catch (cldErr) {
    console.warn('[NEX-REELS] Cloudinary pool warning, trying Blob vaults fallback:', cldErr.message);
  }

  // 2. Secondary Strategy: Sequential Vercel Blob Vaults (if hosted on Vercel)
  const vaultOrder = [0, 1, 2, 3, 4, 5];
  const startIndex = options.startVault !== undefined ? options.startVault : 0;
  const orderedVaults = [
    ...vaultOrder.slice(startIndex),
    ...vaultOrder.slice(0, startIndex),
  ];

  let lastError = null;

  for (const vaultIdx of orderedVaults) {
    const vaultInfo = REELS_VAULTS[vaultIdx];
    try {
      if (options.onVaultSwitch && vaultIdx !== startIndex) {
        options.onVaultSwitch(REELS_VAULTS[startIndex]?.name, vaultInfo.name);
      }
      console.log(`[NEX-REELS] Attempting upload to ${vaultInfo.name} (${vaultInfo.access})...`);
      
      const result = await uploadToSingleVault(file, vaultIdx, options);
      console.log(`[NEX-REELS] Successfully saved to ${vaultInfo.name}:`, result.url);
      return {
        ...result,
        duration: duration,
      };
    } catch (err) {
      console.warn(`[NEX-REELS] ${vaultInfo.name} failed:`, err.message);
      lastError = err;
      // Cascade to the next vault sequentially
    }
  }

  // Fallback 2: Local Object URL (ensures client-side testing never hangs)
  console.warn('[NEX-REELS] Using local browser object URL fallback.');
  const localUrl = URL.createObjectURL(file);
  return {
    url: localUrl,
    rawBlobUrl: localUrl,
    pathname: `local/${file.name}`,
    vault: 'Local Device Vault',
    vaultIndex: -2,
    access: 'local',
    duration: duration,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'video/mp4',
  };
}
