/**
 * NEX Storage API Gateway Client for NEXCHAT (Web)
 * Decoupled client communicating with the standalone NEX-STORAGE-API microservice.
 * Shields the browser client from holding master Cloudinary/Vercel secrets.
 */

class StorageApiClient {
  constructor(baseUrl = 'https://nex-storage-api.vercel.app') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setBaseUrl(url) {
    if (url && typeof url === 'string') {
      this.baseUrl = url.trim().replace(/\/+$/, '');
    }
  }

  /**
   * Converts a File or Blob object to a Base64 data URL
   * @param {File|Blob} file 
   * @returns {Promise<string>}
   */
  async fileToBase64(file) {
    if (typeof file === 'string') return file; // Already Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * API 1: Upload Media (Status Post, Reel, Video, Audio)
   * Handled by Cloudinary 25-Vault Pool with automatic failover.
   * 
   * @param {File|Blob|string} file 
   * @param {Object} options 
   * @param {string} [options.fileName='status_post']
   * @param {string} [options.fileType='image'] - 'image' | 'video' | 'audio'
   * @param {string} [options.category='status'] - 'status' | 'reel' | 'chat_media'
   * @param {string} [options.userId='anonymous']
   * @returns {Promise<{ success: boolean, url: string, vaultId?: number, publicId?: string }>}
   */
  async uploadMedia(file, options = {}) {
    const {
      fileName = 'status_media',
      fileType = 'image',
      category = 'status',
      userId = 'anonymous',
    } = options;

    try {
      const base64Data = await this.fileToBase64(file);

      const response = await fetch(`${this.baseUrl}/api/storage/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64Data,
          fileName,
          fileType,
          category,
          userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Storage Gateway error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (err) {
      console.warn('[StorageApiClient] API upload failed:', err.message);
      throw err;
    }
  }

  /**
   * API 2: Upload Profile Picture / Avatar & General Photos
   * Handled by Vercel Blob Storage with primary/fallback token cascading.
   * 
   * @param {File|Blob|string} file 
   * @param {Object} options 
   * @param {string} [options.fileName='avatar.jpg']
   * @param {string} [options.userId='anonymous']
   * @param {string} [options.type='avatar'] - 'avatar' | 'banner' | 'general_pic'
   * @returns {Promise<{ success: boolean, url: string, pathname?: string }>}
   */
  async uploadProfile(file, options = {}) {
    const {
      fileName = 'avatar.jpg',
      userId = 'anonymous',
      type = 'avatar',
    } = options;

    try {
      const base64Data = await this.fileToBase64(file);

      const response = await fetch(`${this.baseUrl}/api/storage/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64Data,
          fileName,
          userId,
          type,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Profile Storage Gateway error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (err) {
      console.warn('[StorageApiClient] Profile API upload failed:', err.message);
      throw err;
    }
  }

  /**
   * Health Check
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/api/storage/health`);
      return res.ok;
    } catch (_) {
      return false;
    }
  }
}

export const storageApiClient = new StorageApiClient();
export { StorageApiClient };
