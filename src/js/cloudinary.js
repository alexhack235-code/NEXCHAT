/**
 * Cloudinary Unsigned Upload Service for NEXCHAT Video Messages
 * Allows 100% free video uploads without backend API keys or credit card requirement.
 */

// Default Cloudinary configuration (can be customized via window.CLOUDINARY_CONFIG)
const DEFAULT_CONFIG = {
  cloudName: 'kkiyeyj8',
  uploadPreset: 'ml_default',
  folder: 'nexchat-videos',
};

/**
 * Gets active Cloudinary credentials
 */
export function getCloudinaryConfig() {
  const custom = window.CLOUDINARY_CONFIG || {};
  return {
    cloudName: custom.cloudName || DEFAULT_CONFIG.cloudName,
    uploadPreset: custom.uploadPreset || DEFAULT_CONFIG.uploadPreset,
    folder: custom.folder || DEFAULT_CONFIG.folder,
  };
}

/**
 * Uploads a video file to Cloudinary using an unsigned upload preset.
 * 
 * @param {File|Blob} file - The video file to upload
 * @param {object} [options]
 * @param {string} [options.folder] - Custom destination folder in Cloudinary
 * @param {function(number, string):void} [options.onProgress] - Progress callback (percentage, formatted string)
 * @returns {Promise<{secure_url: string, public_id: string, duration?: number, format: string, bytes: number}>}
 */
export async function uploadVideoToCloudinary(file, options = {}) {
  if (!file) {
    throw new Error('No video file provided for Cloudinary upload.');
  }

  const config = getCloudinaryConfig();
  const folder = options.folder || config.folder;
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/video/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }

    xhr.open('POST', endpoint, true);

    if (xhr.upload && options.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          const uploadedMb = (e.loaded / (1024 * 1024)).toFixed(2);
          options.onProgress(percent, `${uploadedMb} / ${fileSizeMb} MB`);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve({
            secure_url: result.secure_url,
            downloadURL: result.secure_url,
            public_id: result.public_id,
            duration: result.duration || 0,
            format: result.format || 'mp4',
            bytes: result.bytes || file.size,
            fileName: file.name || `${result.public_id}.${result.format || 'mp4'}`,
            fileType: file.type || 'video/mp4',
            fileSize: file.size,
          });
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response: ' + err.message));
        }
      } else {
        let errMessage = `Cloudinary upload failed with status ${xhr.status}`;
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error && errRes.error.message) {
            errMessage = errRes.error.message;
          }
        } catch {}
        console.warn('Cloudinary upload warning:', errMessage);
        reject(new Error(errMessage));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during Cloudinary video upload.'));
    };

    xhr.send(formData);
  });
}
