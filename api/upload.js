import { put } from '@vercel/blob';
import { enforceRateLimit, applySecurityHeaders, validatePathname, verifyFirebaseIdToken, handleCors } from './_security.js';

// Primary Storage Tokens
const readBlobToken = (name, fallback = '') => process.env[name] || fallback;
const TOKENS = {
  default: readBlobToken('BLOB_READ_WRITE_TOKEN', ''),
  media: readBlobToken('BLOB_READ_WRITE_TOKEN_MEDIA', ''),
  profile: readBlobToken('BLOB_READ_WRITE_TOKEN_PROFILE', ''),
  background: readBlobToken('BLOB_READ_WRITE_TOKEN_BACKGROUNDS', ''),
};
const BACKUP_VAULTS = [
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_1', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_2', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_3', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_4', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_5', ''),
];
const PRIVATE_VAULTS = {
  1: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_1', ''), name: 'PRIVATE VAULT 1' },
  2: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_2', ''), name: 'PRIVATE VAULT 2' },
};
const REELS_VAULTS = {
  0: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_0', ''), access: 'public', name: 'NEX-REELS VAULT 0' },
  1: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_1', ''), access: 'private', name: 'NEX-REELS VAULT 1' },
  2: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_2', ''), access: 'private', name: 'NEX-REELS VAULT 2' },
  3: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_3', ''), access: 'private', name: 'NEX-REELS VAULT 3' },
  4: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_4', ''), access: 'private', name: 'NEX-REELS VAULT 4' },
  5: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_5', ''), access: 'private', name: 'NEX-REELS VAULT 5' },
};
const STATUS_VAULTS = {
  1: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_1', ''), access: 'private', name: 'NEX-STATUS VAULT 1' },
  2: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_2', ''), access: 'private', name: 'NEX-STATUS VAULT 2' },
  3: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_3', ''), access: 'private', name: 'NEX-STATUS VAULT 3' },
  4: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_4', ''), access: 'private', name: 'NEX-STATUS VAULT 4' },
  5: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_5', ''), access: 'private', name: 'NEX-STATUS VAULT 5' },
};

// Security constants
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB per file limit
const DANGEROUS_EXTENSIONS = /\.(html?|php\d?|phtml|exe|bat|cmd|sh|cgi|pl|py|js|ts|jsx|tsx|jar|msi|vbs|svg|asp|aspx|jsp)$/i;
const ALLOWED_MIME_PREFIXES = [
  'image/',
  'video/',
  'audio/',
  'text/',
  'application/pdf',
  'application/octet-stream',
  'application/vnd.',
  'application/msword',
  'application/zip',
  'application/x-zip',
  'application/x-rar',
  'application/x-7z',
  'application/json'
];

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  applySecurityHeaders(res);
  if (!enforceRateLimit(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  let authenticatedUser = null;
  try {
    authenticatedUser = await verifyFirebaseIdToken(req);
  } catch (error) {
    console.warn('Firebase token verification notice:', error.message);
  }

  const rawFilename = req.headers['x-filename'] || req.query.filename || `upload_${Date.now()}`;
  const uploadType = req.headers['x-upload-type'] || req.query.type || 'media';
  const vaultParam = req.headers['x-vault-index'] !== undefined ? req.headers['x-vault-index'] : req.query.vault;

  // Reels allow public stream sharing; private or account uploads require authentication
  if (!authenticatedUser && uploadType !== 'reels' && uploadType !== 'reel') {
    return res.status(401).json({ error: 'Sign in is required to upload files.' });
  }

  if (authenticatedUser && !rawFilename.split('/').includes(authenticatedUser.uid) && uploadType !== 'reels' && uploadType !== 'reel') {
    return res.status(403).json({ error: 'Uploads must be stored under the signed-in user ID.' });
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
    const tokensToTry = [token, ...BACKUP_VAULTS.filter(t => t && t !== token)].filter(Boolean);
    if (!tokensToTry.length) {
      return res.status(503).json({ error: 'Blob storage is not configured on the server.' });
    }

    // Read the entire request body buffer to enable retry/failover across backup vaults
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    // Primary attempt + automatic failover to the 5 backup vaults
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
