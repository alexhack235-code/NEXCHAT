import { put } from '@vercel/blob';
import { enforceRateLimit, applySecurityHeaders, validatePathname } from './_security.js';

const TOKENS = {
  profile: process.env.BLOB_READ_WRITE_TOKEN_PROFILE || 'vercel_blob_rw_6jE4Rmq8yxXdf44A_5LFgLj0KyQo2FJL2ZlfAsZi0sz1TkT',
  media: process.env.BLOB_READ_WRITE_TOKEN_MEDIA || 'vercel_blob_rw_gtJQxz5ceKzxuHQ4_dSB2eVkAN67doAK5FQCOAskpTim8yJ',
};

// NEX-REELS Multi-Vault Storage Configuration (Vault 0 through 5)
const REELS_VAULTS = {
  0: {
    token: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_0 || 'vercel_blob_rw_BhENzDN0lLwjdIAc_FeCMjgQ6ASj6UV0CRO2WVISkvZreOS',
    access: 'public',
    name: 'NEX-REELS VAULT 0',
  },
  1: {
    token: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_1 || '',
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
    // 1. Security Check: Payload Size Guard (anti-DoS / wallet exhaustion)
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

    // 2. Security Check: Path Traversal & dangerous extension checks
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
        error: 'Forbidden file extension. Executable, script, or markup files are strictly prohibited.',
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

    // Clean filename: allow only alphanumeric, underscores, dots, hyphens, and slashes
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
      accessMode = 'private'; // All status vaults are private
      vaultInfo = {
        name: vaultConfig.name,
        index: vIdx,
        access: 'private',
        category: 'status',
      };
    } else if (uploadType === 'reels' || uploadType === 'reel' || (vaultParam !== undefined && uploadType !== 'profile')) {
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
    } else if (uploadType === 'profile') {
      token = process.env.BLOB_READ_WRITE_TOKEN_PROFILE || TOKENS.profile;
      accessMode = 'public';
    } else {
      token = process.env.BLOB_READ_WRITE_TOKEN_MEDIA || TOKENS.media;
    }

    if (!token) {
      return res.status(500).json({ error: 'Storage token is not configured on this server.' });
    }

    const blob = await put(sanitizedFilename, req, {
      access: accessMode,
      token: token,
    });

    // If private blob (Status Vaults 1-5 or Reels Vaults 1-5), route via secure streaming proxy
    let playableUrl = blob.url;
    if (accessMode === 'private' && vaultInfo) {
      playableUrl = `/api/serve-blob?type=${vaultInfo.category || uploadType}&vault=${vaultInfo.index}&pathname=${encodeURIComponent(blob.pathname)}`;
    }

    return res.status(200).json({
      url: playableUrl,
      downloadUrl: blob.downloadUrl || playableUrl,
      rawBlobUrl: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      type: uploadType,
      access: accessMode,
      vault: vaultInfo ? vaultInfo.name : null,
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
