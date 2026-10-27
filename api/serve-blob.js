import { get } from '@vercel/blob';
import { enforceRateLimit, applySecurityHeaders, validatePathname, handleCors } from './_security.js';

// Primary Storage Tokens
const readBlobToken = (name, fallback = '') => process.env[name] || fallback;
const TOKENS = {
  default: readBlobToken('BLOB_READ_WRITE_TOKEN', ''),
  media: readBlobToken('BLOB_READ_WRITE_TOKEN_MEDIA', ''),
  profile: readBlobToken('BLOB_READ_WRITE_TOKEN_PROFILE', ''),
  background: readBlobToken('BLOB_READ_WRITE_TOKEN_BACKGROUNDS', ''),
};
const BACKUP_TOKENS = [
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_1', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_2', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_3', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_4', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_5', ''),
];
const PRIVATE_TOKENS = {
  1: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_1', ''),
  2: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_2', ''),
};
const REELS_VAULT_TOKENS = {
  0: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_0', ''),
  1: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_1', ''),
  2: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_2', ''),
  3: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_3', ''),
  4: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_4', ''),
  5: readBlobToken('BLOB_READ_WRITE_TOKEN_REELS_VAULT_5', ''),
};
const STATUS_VAULT_TOKENS = {
  1: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_1', ''),
  2: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_2', ''),
  3: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_3', ''),
  4: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_4', ''),
  5: readBlobToken('BLOB_READ_WRITE_TOKEN_STATUS_VAULT_5', ''),
};

// Security constants
const DANGEROUS_EXTENSIONS = /\.(html?|php\d?|phtml|exe|bat|cmd|sh|cgi|pl|py|js|ts|jsx|tsx|jar|msi|vbs|svg|asp|aspx|jsp)$/i;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  applySecurityHeaders(res);
  if (!enforceRateLimit(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Only GET is supported.' });
  }

  const rawPathname = req.query.pathname;
  if (!rawPathname) {
    return res.status(400).json({ error: 'Missing pathname query parameter' });
  }

  // Security Check 1: Prevent Directory Traversal & Null Byte Injection
  if (
    rawPathname.includes('..') ||
    rawPathname.includes('\\') ||
    rawPathname.includes('\0') ||
    rawPathname.includes('%00') ||
    rawPathname.includes('%2e%2e')
  ) {
    return res.status(400).json({ error: 'Invalid pathname: Path traversal attempt detected.' });
  }

  // Security Check 2: Block Dangerous File Extensions
  if (DANGEROUS_EXTENSIONS.test(rawPathname)) {
    return res.status(403).json({ error: 'Access to prohibited file types is forbidden.' });
  }

  // Safe decoded pathname
  const pathname = decodeURIComponent(rawPathname);

  const vaultParam = req.query.vault;
  const type = req.query.type || 'media';

  let token = '';
  if (type === 'status') {
    const vIdx = parseInt(vaultParam || '1', 10);
    token = STATUS_VAULT_TOKENS[vIdx] || '';
  } else if (type === 'reels') {
    const vIdx = parseInt(vaultParam || '0', 10);
    token = REELS_VAULT_TOKENS[vIdx] || '';
  } else if (type === 'private') {
    const pIdx = parseInt(vaultParam || '1', 10);
    token = PRIVATE_TOKENS[pIdx] || PRIVATE_TOKENS[1];
  } else if (type === 'background' || type === 'wallpaper') {
    token = process.env.BLOB_READ_WRITE_TOKEN_BACKGROUNDS || TOKENS.background;
  } else if (type === 'profile') {
    token = process.env.BLOB_READ_WRITE_TOKEN_PROFILE || TOKENS.profile;
  } else {
    token = process.env.BLOB_READ_WRITE_TOKEN_MEDIA || TOKENS.media;
  }

  const candidateTokens = [token, ...Object.values(PRIVATE_TOKENS), ...BACKUP_TOKENS, TOKENS.default].filter(Boolean);

  let result = null;
  for (const t of candidateTokens) {
    try {
      result = await get(pathname, {
        access: 'private',
        token: t,
      });
      if (result) break;
    } catch (e) {
      // try next token
    }
  }

  if (!result) {
    return res.status(404).send('Media not found');
  }

  try {
    const contentType = result.blob?.contentType || (type === 'status' ? 'image/jpeg' : 'video/mp4');

    // Strict Security & Anti-Hacking Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self' data: blob:; img-src 'self' data: blob:; sandbox");
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'private, max-age=86400, stale-while-revalidate=86400');
    res.setHeader('Content-Type', contentType);

    // Stream the private blob directly to client
    if (result.stream && typeof result.stream.pipe === 'function') {
      return result.stream.pipe(res);
    } else if (result.stream) {
      const { Readable } = await import('stream');
      const nodeStream = Readable.fromWeb(result.stream);
      return nodeStream.pipe(res);
    } else {
      const buffer = Buffer.from(await result.blob.arrayBuffer());
      return res.status(200).send(buffer);
    }
  } catch (streamError) {
    console.error('Error streaming private blob:', streamError);
    if (!res.headersSent) {
      return res.status(500).send('Streaming error');
    }
  }
}
