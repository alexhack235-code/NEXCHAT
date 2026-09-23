import { get } from '@vercel/blob';
import { enforceRateLimit, applySecurityHeaders, validatePathname } from './_security.js';

// Primary Storage Tokens
const TOKENS = {
  default: process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_R4RmXAAr4Lb0ofNq_2XNk166CeMNYPUChKxuBlukPMkj0XO',
  media: process.env.BLOB_READ_WRITE_TOKEN_MEDIA || 'vercel_blob_rw_R4RmXAAr4Lb0ofNq_2XNk166CeMNYPUChKxuBlukPMkj0XO',
  profile: process.env.BLOB_READ_WRITE_TOKEN_PROFILE || 'vercel_blob_rw_1Z4MEej7ip5Jg9Wz_ggfb5Dc875zyDAesscTkLSCJHTAd3x',
  background: process.env.BLOB_READ_WRITE_TOKEN_BACKGROUNDS || 'vercel_blob_rw_XAJz4dhkF8UAvds3_Vz2gcF2BOX9o6vYTitpsddNVptAM9N',
};

// 5 General Backup Storage Tokens
const BACKUP_TOKENS = [
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_1 || 'vercel_blob_rw_qcdPawgue5dGCBux_gJOdIRUwQuPubNnqhyQGsJEz8rRL46',
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_2 || 'vercel_blob_rw_R29NmygDYq5JNlCP_HeT8UNIzVbzaXvlpaWRnlLW5JK1uMW',
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_3 || 'vercel_blob_rw_Ml2xzmRr7zfPbbNR_5ledwKe6WoX6FU9Uo3czUBOMTzXph7',
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_4 || 'vercel_blob_rw_XqXC45KxrpuccoHS_BfdjMCGndscRb8141ZuH35srLp2ruX',
  process.env.BLOB_READ_WRITE_TOKEN_BACKUP_5 || 'vercel_blob_rw_SboFYX9ACstEsmLG_dAAe8Nmg8MYaEGDJh2TuyZxM1Loy8l',
];

// Dedicated Private Storage Tokens
const PRIVATE_TOKENS = {
  1: process.env.BLOB_READ_WRITE_TOKEN_PRIVATE_1 || 'vercel_blob_rw_tqRnUFMUwpg0yuA9_uikx2vQ93pZEASEmqbTT4vCg9m8jjE',
  2: process.env.BLOB_READ_WRITE_TOKEN_PRIVATE_2 || 'vercel_blob_rw_sjHClcYCD5zg7FSx_jyWNaUo5tgKubvWNtYrgmWdwNJzAly',
};

// NEX-REELS Multi-Vault Storage Tokens (Vault 0 through 5)
const REELS_VAULT_TOKENS = {
  0: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_0 || 'vercel_blob_rw_BhENzDN0lLwjdIAc_FeCMjgQ6ASj6UV0CRO2WVISkvZreOS',
  1: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_1 || 'vercel_blob_rw_qcdPawgue5dGCBux_gJOdIRUwQuPubNnqhyQGsJEz8rRL46',
  2: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_2 || 'vercel_blob_rw_41fMTewMnneecj66_m9wzI7Hq1VRyGgavZImXnXPaW0qj4Z',
  3: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_3 || 'vercel_blob_rw_ltFBt2fWKQe9Wzdh_CPdwwVqNJ2GhFNjGRPZX27fLOIcd1e',
  4: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_4 || 'vercel_blob_rw_6Yh5YOITkL5nf0IK_xkUI0EI90M0cMPw2VB51U6mFYfIxcr',
  5: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_5 || 'vercel_blob_rw_y1HadAzcNfzpiVWe_lYPjiveKnhMBRrW87gn88HbK3qTQPj',
};

// NEX-STATUS Multi-Vault Storage Tokens (Vault 1 through 5)
const STATUS_VAULT_TOKENS = {
  1: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_1 || 'vercel_blob_rw_jCNrgY96DrgBtoUm_INH2vNcllZzjIqVnvsdaRoz5tqs4eW',
  2: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_2 || 'vercel_blob_rw_7IvHQcdI5lb3oN8t_KaHnvD4QZ7X5HN6pnyD2ZbaBHhc3Ge',
  3: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_3 || 'vercel_blob_rw_J0e8RZ3glwBgsqKQ_nDWdloFydWRjlWLMWTu4K0TkZrchVc',
  4: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_4 || 'vercel_blob_rw_aiBRkSDHg0K7Hq8g_CIwlPJETUqINLvIOUluiH9oKpAAJLp',
  5: process.env.BLOB_READ_WRITE_TOKEN_STATUS_VAULT_5 || 'vercel_blob_rw_b9u0Ll5xZBhFcaAD_CCX5iYxp0wLqESQ3JxfLDCSVpV5bwT',
};

// Security constants
const DANGEROUS_EXTENSIONS = /\.(html?|php\d?|phtml|exe|bat|cmd|sh|cgi|pl|py|js|ts|jsx|tsx|jar|msi|vbs|svg|asp|aspx|jsp)$/i;

export default async function handler(req, res) {
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
