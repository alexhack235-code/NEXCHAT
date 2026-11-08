import { get } from '@vercel/blob';
import { enforceRateLimit, applySecurityHeaders, validatePathname, verifyFirebaseIdToken, handleCors } from './_security.js';

// Primary Storage Tokens
const readBlobToken = (name, fallback = '') => process.env[name] || fallback;
const TOKENS = {
  default: readBlobToken('BLOB_READ_WRITE_TOKEN', ''),
  media: readBlobToken('BLOB_READ_WRITE_TOKEN_MEDIA', ''),
  profile: readBlobToken('BLOB_READ_WRITE_TOKEN_PROFILE', ''),
  background: readBlobToken('BLOB_READ_WRITE_TOKEN_BACKGROUNDS', ''),
};

// 5 Public Storage Pools
const PUBLIC_TOKENS = {
  1: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_1', ''),
  2: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_2', ''),
  3: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_3', ''),
  4: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_4', ''),
  5: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_5', ''),
};

const BACKUP_TOKENS = [
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_1', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_2', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_3', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_4', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_5', ''),
  ...Object.values(PUBLIC_TOKENS),
].filter(Boolean);

// 5 Private Storage Vaults (Sensitive Data: E2EE Keys, Vault Docs, Audio Notes)
const PRIVATE_TOKENS = {
  1: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_1', ''),
  2: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_2', ''),
  3: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_3', ''),
  4: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_4', ''),
  5: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_5', ''),
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

  // SECURITY PROTOCOL: Authenticate before serving sensitive private blobs
  if (type === 'private') {
    let authenticatedUser = null;
    try {
      authenticatedUser = await verifyFirebaseIdToken(req);
    } catch (authErr) {
      console.warn('[AUTH NOTICE] Private blob token check error:', authErr.message);
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        error: 'Unauthorized: Valid Firebase session token required to access private encrypted blobs.',
        code: 'PRIVATE_BLOB_AUTH_REQUIRED'
      });
    }

    // STRICT BOLA/IDOR PREVENTION: Ensure user owns this private storage resource or is SuperAdmin
    const SUPERADMIN_UID = 'ZhvqSK7NNtQUP1sqszYfo1kzXSb2';
    const isOwner = pathname.split('/').includes(authenticatedUser.uid) || authenticatedUser.uid === SUPERADMIN_UID;
    if (!isOwner) {
      return res.status(403).json({
        error: 'Forbidden: You do not own this private storage resource.',
        code: 'PRIVATE_BLOB_FORBIDDEN'
      });
    }
  }

  let token = '';
  let candidateTokens = [];

  if (type === 'status') {
    const vIdx = parseInt(vaultParam || '1', 10);
    token = STATUS_VAULT_TOKENS[vIdx] || '';
    candidateTokens = [token, ...Object.values(STATUS_VAULT_TOKENS)].filter(Boolean);
  } else if (type === 'reels') {
    const vIdx = parseInt(vaultParam || '0', 10);
    token = REELS_VAULT_TOKENS[vIdx] || '';
    candidateTokens = [token, ...Object.values(REELS_VAULT_TOKENS)].filter(Boolean);
  } else if (type === 'private') {
    const pIdx = parseInt(vaultParam || '1', 10);
    token = PRIVATE_TOKENS[pIdx] || PRIVATE_TOKENS[1];
    candidateTokens = [token, ...Object.values(PRIVATE_TOKENS)].filter(Boolean);
  } else if (type === 'background' || type === 'wallpaper') {
    token = process.env.BLOB_READ_WRITE_TOKEN_BACKGROUNDS || PUBLIC_TOKENS[3] || TOKENS.background;
    candidateTokens = [token, ...Object.values(PUBLIC_TOKENS), ...BACKUP_TOKENS, TOKENS.default].filter(Boolean);
  } else if (type === 'profile') {
    token = process.env.BLOB_READ_WRITE_TOKEN_PROFILE || PUBLIC_TOKENS[2] || TOKENS.profile;
    candidateTokens = [token, ...Object.values(PUBLIC_TOKENS), ...BACKUP_TOKENS, TOKENS.default].filter(Boolean);
  } else {
    token = process.env.BLOB_READ_WRITE_TOKEN_MEDIA || PUBLIC_TOKENS[1] || TOKENS.media;
    candidateTokens = [token, ...Object.values(PUBLIC_TOKENS), ...BACKUP_TOKENS, TOKENS.default].filter(Boolean);
  }

  // Primary attempt: Query COLD-VAULT microservice for instant multi-vault resolution
  const COLD_VAULT_BLOB_URL = process.env.COLD_VAULT_BLOB_URL || 'https://cold-vault-api.vercel.app/api/blob';
  const NEXCHAT_SECRET = process.env.NEXCHAT_SECRET || 'NEXCHAT_ULTRA_12345';
  let result = null;

  try {
    const coldQuery = `${COLD_VAULT_BLOB_URL}?pathname=${encodeURIComponent(pathname)}&type=${encodeURIComponent(type)}&vault=${encodeURIComponent(vaultParam || '1')}`;
    const coldResp = await fetch(coldQuery, {
      headers: { 'x-nexchat-secret': NEXCHAT_SECRET },
      redirect: 'manual'
    });

    if (coldResp.status === 302 || coldResp.status === 301) {
      const loc = coldResp.headers.get('location');
      if (loc) {
        return res.redirect(302, loc);
      }
    }
  } catch (coldErr) {
    console.warn('[COLD-VAULT] Fallback to secondary local tokens:', coldErr.message);
  }

  // Secondary attempt: Local fallback tokens if COLD-VAULT unreachable
  for (const t of candidateTokens) {
    try {
      result = await get(pathname, {
        access: type === 'private' ? 'private' : undefined,
        token: t,
      });
      if (result) break;
    } catch (e) {
      // Failover to next candidate token in the vault pool
    }
  }

  if (!result) {
    return res.status(404).send('Media not found');
  }

  try {
    const contentType = result.blob?.contentType || (type === 'status' ? 'image/jpeg' : 'application/octet-stream');

    // Strict Security & Anti-Hacking Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self' data: blob:; img-src 'self' data: blob:; sandbox");
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    if (type === 'private') {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
    }
    res.setHeader('Content-Type', contentType);

    // Stream the blob directly to client
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
    console.error('Error streaming blob:', streamError);
    if (!res.headersSent) {
      return res.status(500).send('Streaming error');
    }
  }
}
