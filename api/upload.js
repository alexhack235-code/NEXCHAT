import { put } from '@vercel/blob';
import { enforceRateLimit, applySecurityHeaders, validatePathname } from './_security.js';

// Primary Storage Tokens
const TOKENS = {
  default: process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_R4RmXAAr4Lb0ofNq_2XNk166CeMNYPUChKxuBlukPMkj0XO',
  media: process.env.BLOB_READ_WRITE_TOKEN_MEDIA || 'vercel_blob_rw_R4RmXAAr4Lb0ofNq_2XNk166CeMNYPUChKxuBlukPMkj0XO',
  profile: process.env.BLOB_READ_WRITE_TOKEN_PROFILE || 'vercel_blob_rw_1Z4MEej7ip5Jg9Wz_ggfb5Dc875zyDAesscTkLSCJHTAd3x',
  background: process.env.BLOB_READ_WRITE_TOKEN_BACKGROUNDS || 'vercel_blob_rw_XAJz4dhkF8UAvds3_Vz2gcF2BOX9o6vYTitpsddNVptAM9N',
};

// 5 General Backup Storage Vaults for Auto-Failover
const BACKUP_VAULTS = [
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_1 || 'vercel_blob_rw_qcdPawgue5dGCBux_gJOdIRUwQuPubNnqhyQGsJEz8rRL46',
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_2 || 'vercel_blob_rw_R29NmygDYq5JNlCP_HeT8UNIzVbzaXvlpaWRnlLW5JK1uMW',
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_3 || 'vercel_blob_rw_Ml2xzmRr7zfPbbNR_5ledwKe6WoX6FU9Uo3czUBOMTzXph7',
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_4 || 'vercel_blob_rw_XqXC45KxrpuccoHS_BfdjMCGndscRb8141ZuH35srLp2ruX',
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_5 || 'vercel_blob_rw_SboFYX9ACstEsmLG_dAAe8Nmg8MYaEGDJh2TuyZxM1Loy8l',
];

// Private Storage Vaults (Served exclusively through secure streaming proxy)
const PRIVATE_VAULTS = {
  1: {
    token: process.env.BLOB_READ_WRITE_TOKEN_PRIVATE_1 || 'vercel_blob_rw_tqRnUFMUwpg0yuA9_uikx2vQ93pZEASEmqbTT4vCg9m8jjE',
    name: 'PRIVATE VAULT 1',
  },
  2: {
    token: process.env.BLOB_READ_WRITE_TOKEN_PRIVATE_2 || 'vercel_blob_rw_sjHClcYCD5zg7FSx_jyWNaUo5tgKubvWNtYrgmWdwNJzAly',
    name: 'PRIVATE VAULT 2',
  },
};

// NEX-REELS Multi-Vault Storage Configuration (Vault 0 through 5)
const REELS_VAULTS = {
  0: {
    token: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_0 || 'vercel_blob_rw_BhENzDN0lLwjdIAc_FeCMjgQ6ASj6UV0CRO2WVISkvZreOS',
    access: 'public',
    name: 'NEX-REELS VAULT 0',
  },
  1: {
    token: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_1 || 'vercel_blob_rw_qcdPawgue5dGCBux_gJOdIRUwQuPubNnqhyQGsJEz8rRL46',
    access: 'private',
    name: 'NEX-REELS VAULT 1',
  },
  2: {
    token: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_2 || 'vercel_blob_rw_41fMTewMnneecj66_m9wzI7Hq1VRyGgavZImXnXPaW0qj4Z',
    access: 'private',
    name: 'NEX-REELS VAULT 2',
  },
  3: {
    token: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_3 || 'vercel_blob_rw_ltFBt2fWKQe9Wzdh_CPdwwVqNJ2GhFNjGRPZX27fLOIcd1e',
    access: 'private',
    name: 'NEX-REELS VAULT 3',
  },
  4: {
    token: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_4 || 'vercel_blob_rw_6Yh5YOITkL5nf0IK_xkUI0EI90M0cMPw2VB51U6mFYfIxcr',
    access: 'private',
    name: 'NEX-REELS VAULT 4',
  },
  5: {
    token: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_5 || 'vercel_blob_rw_y1HadAzcNfzpiVWe_lYPjiveKnhMBRrW87gn88HbK3qTQPj',
    access: 'private',
    name: 'NEX-REELS VAULT 5',
  },
};

// NEX-STATUS Multi-Vault Storage Configuration (Vault 1 through 5, all private)
const STATUS_VAULTS = {
  1: {
    token: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_1 || 'vercel_blob_rw_jCNrgY96DrgBtoUm_INH2vNcllZzjIqVnvsdaRoz5tqs4eW',
    access: 'private',
    name: 'NEX-STATUS VAULT 1',
  },
  2: {
    token: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_2 || 'vercel_blob_rw_7IvHQcdI5lb3oN8t_KaHnvD4QZ7X5HN6pnyD2ZbaBHhc3Ge',
    access: 'private',
    name: 'NEX-STATUS VAULT 2',
  },
  3: {
    token: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_3 || 'vercel_blob_rw_J0e8RZ3glwBgsqKQ_nDWdloFydWRjlWLMWTu4K0TkZrchVc',
    access: 'private',
    name: 'NEX-STATUS VAULT 3',
  },
  4: {
    token: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_4 || 'vercel_blob_rw_aiBRkSDHg0K7Hq8g_CIwlPJETUqINLvIOUluiH9oKpAAJLp',
    access: 'private',
    name: 'NEX-STATUS VAULT 4',
  },
  5: {
    token: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_5 || 'vercel_blob_rw_b9u0Ll5xZBhFcaAD_CCX5iYxp0wLqESQ3JxfLDCSVpV5bwT',
    access: 'private',
    name: 'NEX-STATUS VAULT 5',
  },
};

// Security constants
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB per file limit
const DANGEROUS_EXTENSIONS = /\.(html?|php\d?|phtml|exe|bat|cmd|sh|cgi|pl|py|js|ts|jsx|tsx|jar|msi|vbs|svg|asp|aspx|jsp)$/i;
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'application/pdf', 'application/octet-stream'];

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (!enforceRateLimit(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    // 1. Security Check: Payload Size Guard
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_BYTES) {
      return res.status(413).json({
        error: 'Payload Too Large. Max allowed upload is 50MB.',
        code: 'PAYLOAD_TOO_LARGE'
      });
    }

    const rawFilename = req.headers['x-filename'] || req.query.filename || `upload_${Date.now()}`;
    const uploadType = req.headers['x-upload-type'] || req.query.type || 'media';
    const vaultParam = req.headers['x-vault-index'] !== undefined ? req.headers['x-vault-index'] : req.query.vault;

    // 2. Security Check: Path Traversal
    if (
      rawFilename.includes('..') ||
      rawFilename.includes('\\') ||
      rawFilename.includes('\0') ||
      rawFilename.includes('%00') ||
      rawFilename.includes('%2e%2e')
    ) {
      return res.status(400).json({ error: 'Invalid pathname: Path traversal detected.', code: 'PATH_TRAVERSAL_DETECTED' });
    }

    if (DANGEROUS_EXTENSIONS.test(rawFilename)) {
      return res.status(400).json({
        error: 'Forbidden file extension. Executable or script files are strictly prohibited.',
        code: 'DANGEROUS_FILE_EXTENSION'
      });
    }

    // 3. Security Check: Content-Type MIME type inspection
    const reqContentType = req.headers['content-type'] || '';
    if (reqContentType && !ALLOWED_MIME_PREFIXES.some(prefix => reqContentType.toLowerCase().startsWith(prefix))) {
      return res.status(415).json({
        error: `Unsupported Media Type: "${reqContentType}". Only images, videos, audio, and documents are permitted.`,
        code: 'UNSUPPORTED_MEDIA_TYPE'
      });
    }

    // Clean filename
    const sanitizedFilename = rawFilename.replace(/[^a-zA-Z0-9_\-\.\/]/g, '_');

    let token = '';
    let accessMode = req.headers['x-access-mode'] || req.query.access || 'public';
    let vaultInfo = null;

    if (uploadType === 'status') {
      const vIdx = parseInt(vaultParam || '1', 10);
      const vaultConfig = STATUS_VAULTS[vIdx];

      if (!vaultConfig || !vaultConfig.token) {
        return res.status(400).json({
          error: `Status Vault ${vIdx} is not configured or token is missing.`,
          code: 'STATUS_VAULT_TOKEN_MISSING',
          vaultIndex: vIdx,
        });
      }

      token = vaultConfig.token;
      accessMode = 'private';
      vaultInfo = {
        name: vaultConfig.name,
        index: vIdx,
        access: 'private',
        category: 'status',
      };
    } else if (uploadType === 'reels' || uploadType === 'reel' || (vaultParam !== undefined && uploadType !== 'profile' && uploadType !== 'background')) {
      const vIdx = parseInt(vaultParam || '0', 10);
      const vaultConfig = REELS_VAULTS[vIdx];

      if (!vaultConfig || !vaultConfig.token) {
        return res.status(400).json({
          error: `Reels Vault ${vIdx} is not configured or token is missing.`,
          code: 'REELS_VAULT_TOKEN_MISSING',
          vaultIndex: vIdx,
        });
      }

      token = vaultConfig.token;
      accessMode = vaultConfig.access;
      vaultInfo = {
        name: vaultConfig.name,
        index: vIdx,
        access: vaultConfig.access,
        category: 'reels',
      };
    } else if (uploadType === 'private') {
      const pIdx = parseInt(vaultParam || '1', 10);
      const pConfig = PRIVATE_VAULTS[pIdx] || PRIVATE_VAULTS[1];
      token = pConfig.token;
      accessMode = 'private';
      vaultInfo = {
        name: pConfig.name,
        index: pIdx,
        access: 'private',
        category: 'private',
      };
    } else if (uploadType === 'background' || uploadType === 'chat-background' || uploadType === 'wallpaper') {
      token = process.env.BLOB_READ_WRITE_TOKEN_BACKGROUNDS || TOKENS.background;
      accessMode = 'public';
      vaultInfo = {
        name: 'NEXCHAT WALLPAPERS',
        access: 'public',
        category: 'background',
      };
    } else if (uploadType === 'profile') {
      token = process.env.BLOB_READ_WRITE_TOKEN_PROFILE || TOKENS.profile;
      accessMode = 'public';
    } else {
      token = process.env.BLOB_READ_WRITE_TOKEN_MEDIA || TOKENS.media;
    }

    if (!token) {
      token = TOKENS.default;
    }

    // Read the entire request body buffer to enable retry/failover across backup vaults
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    // Primary attempt + automatic failover to the 5 backup vaults
    const tokensToTry = [token, ...BACKUP_VAULTS.filter(t => t && t !== token)];
    let lastError = null;
    let successfulBlob = null;

    for (const candidateToken of tokensToTry) {
      try {
        successfulBlob = await put(sanitizedFilename, bodyBuffer, {
          access: accessMode,
          token: candidateToken,
          contentType: reqContentType || undefined,
        });
        if (successfulBlob) break;
      } catch (err) {
        console.warn(`[BLOB VAULT WARNING] Upload attempt with token prefix ${candidateToken.slice(0, 20)}... failed:`, err.message);
        lastError = err;
      }
    }

    if (!successfulBlob) {
      throw lastError || new Error('All storage vaults failed to accept upload.');
    }

    const blob = successfulBlob;

    // If private blob, route via secure streaming proxy
    let playableUrl = blob.url;
    if (accessMode === 'private') {
      playableUrl = `/api/serve-blob?type=${vaultInfo ? (vaultInfo.category || uploadType) : uploadType}&vault=${vaultInfo ? vaultInfo.index : 1}&pathname=${encodeURIComponent(blob.pathname)}`;
    }

    return res.status(200).json({
      url: playableUrl,
      downloadUrl: blob.downloadUrl || playableUrl,
      rawBlobUrl: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      type: uploadType,
      access: accessMode,
      vault: vaultInfo ? vaultInfo.name : 'PRIMARY',
      vaultIndex: vaultInfo ? vaultInfo.index : null,
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    return res.status(500).json({
      error: error.message || 'Upload failed',
      code: error.code || 'BLOB_UPLOAD_ERROR',
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // Stream binary data directly to Vercel Blob
  },
};
