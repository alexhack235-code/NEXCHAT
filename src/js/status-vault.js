/**
 * NEX-STATUS Multi-Vault Sequential Media Storage Router
 * Manages uploading ephemeral status media (photos & videos) to NEX-STATUS VAULT 1 through 5.
 * All Status Vaults are configured as private blob partitions with proxy streaming.
 */
import { uploadVideoToCloudinary } from './cloudinary.js';

export const STATUS_VAULTS = [
  { index: 1, name: 'NEX-STATUS VAULT 1', access: 'private', configured: true },
  { index: 2, name: 'NEX-STATUS VAULT 2', access: 'private', configured: true },
  { index: 3, name: 'NEX-STATUS VAULT 3', access: 'private', configured: true },
  { index: 4, name: 'NEX-STATUS VAULT 4', access: 'private', configured: true },
  { index: 5, name: 'NEX-STATUS VAULT 5', access: 'private', configured: true },
];

/**
 * Uploads status media to a specific Status Vault via /api/upload.
 * @private
 */
function uploadToSingleStatusVault(file, vaultIndex, options = {}) {
  const cleanName = (file.name || 'status_media').replace(/[^a-zA-Z0-9._-]/g, '_');
  const uid = options.uid || 'anon';
  const filename = `status/${uid}/${Date.now()}_${cleanName}`;
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const vault = STATUS_VAULTS.find(v => v.index === vaultIndex) || { name: `NEX-STATUS VAULT ${vaultIndex}`, access: 'private' };

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `/api/upload?type=status&vault=${vaultIndex}&filename=${encodeURIComponent(filename)}`;

    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('x-filename', filename);
    xhr.setRequestHeader('x-upload-type', 'status');
    xhr.setRequestHeader('x-vault-index', String(vaultIndex));
    xhr.setRequestHeader('x-access-mode', 'private');

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
            access: 'private',
            fileName: file.name || cleanName,
            fileSize: file.size,
            fileType: file.type || (file.name?.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : 'image/jpeg'),
            mediaType: file.type || 'image/jpeg',
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
        reject(new Error(`${vault.name} returned status ${xhr.status} (${errCode})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error(`Network error uploading to ${vault.name}`));
    };

    xhr.send(file);
  });
}

/**
 * Uploads a status photo or video, cascading sequentially through NEX-STATUS VAULT 1 through 5.
 * If a vault reaches capacity or throws an error, it auto-switches to the next vault.
 * If all 5 vaults are exhausted, it gracefully falls back to Cloudinary, then local base64.
 *
 * @param {File|Blob} file - The image or video file
 * @param {object} [options]
 * @param {string} [options.uid] - Author UID
 * @param {number} [options.startVault=1] - Starting vault index (1 through 5)
 * @param {function(number, string, string):void} [options.onProgress] - (percent, formattedMb, vaultName)
 * @param {function(string, string):void} [options.onVaultSwitch] - (fromVault, toVault)
 * @returns {Promise<{url: string, vault: string, fileName: string, fileSize: number, fileType: string, mediaType: string}>}
 */
export async function uploadStatusMedia(file, options = {}) {
  if (!file) {
    throw new Error('No media file provided for status upload.');
  }

  // Sequential vault progression: 1 -> 2 -> 3 -> 4 -> 5
  const vaultOrder = [1, 2, 3, 4, 5];
  const startIndex = options.startVault !== undefined ? Math.max(1, Math.min(5, options.startVault)) : 1;
  const orderedVaults = [
    ...vaultOrder.filter(v => v >= startIndex),
    ...vaultOrder.filter(v => v < startIndex),
  ];

  let lastError = null;

  for (const vaultIdx of orderedVaults) {
    const vaultInfo = STATUS_VAULTS.find(v => v.index === vaultIdx);
    try {
      if (options.onVaultSwitch && vaultIdx !== startIndex) {
        options.onVaultSwitch(`NEX-STATUS VAULT ${startIndex}`, vaultInfo?.name || `Vault ${vaultIdx}`);
      }
      console.log(`[NEX-STATUS] Attempting upload to ${vaultInfo?.name} (private)...`);

      const result = await uploadToSingleStatusVault(file, vaultIdx, options);
      console.log(`[NEX-STATUS] Successfully stored in ${vaultInfo?.name}:`, result.url);
      return result;
    } catch (err) {
      console.warn(`[NEX-STATUS] ${vaultInfo?.name} upload failed:`, err.message);
      lastError = err;
      // Cascade to the next status vault
    }
  }

  // Fallback 1: Cloudinary Universal Media
  console.warn('[NEX-STATUS] All 5 Status Vaults exhausted or unavailable. Cascading to Cloudinary backup pipeline...');
  try {
    const isVideo = file.type && file.type.startsWith('video/');
    if (isVideo) {
      const cldRes = await uploadVideoToCloudinary(file, {
        folder: 'nexchat-statuses',
        onProgress: (percent, msg) => {
          if (options.onProgress) {
            options.onProgress(percent, msg, 'Cloudinary Backup Vault');
          }
        },
      });
      return {
        url: cldRes.secure_url || cldRes.downloadURL,
        rawBlobUrl: cldRes.secure_url || cldRes.downloadURL,
        pathname: cldRes.public_id,
        vault: 'Cloudinary Global Vault',
        vaultIndex: -1,
        access: 'public',
        fileName: file.name,
        fileSize: file.size,
        fileType: 'video/mp4',
        mediaType: 'video/mp4',
      };
    }
  } catch (cldErr) {
    console.warn('[NEX-STATUS] Cloudinary fallback failed:', cldErr);
  }

  // Fallback 2: Base64 / Local Object URL (ensures client-side flow never blocks)
  console.warn('[NEX-STATUS] Using client-side Base64 / Object URL fallback.');
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        url: e.target.result,
        rawBlobUrl: e.target.result,
        pathname: `local/status_${file.name}`,
        vault: 'Local Device Vault',
        vaultIndex: -2,
        access: 'local',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'image/jpeg',
        mediaType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = () => {
      const objUrl = URL.createObjectURL(file);
      resolve({
        url: objUrl,
        rawBlobUrl: objUrl,
        pathname: `local/status_${file.name}`,
        vault: 'Local Object Vault',
        vaultIndex: -2,
        access: 'local',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'image/jpeg',
        mediaType: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);
  });
}
