import { get } from '@vercel/blob';
import { enforceRateLimit, applySecurityHeaders, validatePathname } from './_security.js';

const TOKENS = {
  profile: process.env.BLOB_READ_WRITE_TOKEN_PROFILE || 'vercel_blob_rw_6jE4Rmq8yxXdf44A_5LFgLj0KyQo2FJL2ZlfAsZi0sz1TkT',
  media: process.env.BLOB_READ_WRITE_TOKEN_MEDIA || 'vercel_blob_rw_gtJQxz5ceKzxuHQ4_dSB2eVkAN67doAK5FQCOAskpTim8yJ',
};

// NEX-REELS Multi-Vault Storage Tokens (Vault 0 through 5)
const REELS_VAULT_TOKENS = {
  0: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_0 || 'vercel_blob_rw_BhENzDN0lLwjdIAc_FeCMjgQ6ASj6UV0CRO2WVISkvZreOS',
  1: process.env.BLOB_READ_WRITE_TOKEN_REELS_VAULT_1 || '',
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
  } else if (type === 'reels' || vaultParam !== undefined) {
    const vIdx = parseInt(vaultParam || '0', 10);
    token = REELS_VAULT_TOKENS[vIdx] || '';
  } else if (type === 'profile') {
    token = process.env.BLOB_READ_WRITE_TOKEN_PROFILE || TOKENS.profile;
  } else {
    token = process.env.BLOB_READ_WRITE_TOKEN_MEDIA || TOKENS.media;
  }

  if (!token) {
    return res.status(400).json({ error: 'Storage vault token not configured for this partition.' });
  }

  try {
    const result = await get(pathname, {
      access: 'private',
      token: token,
    });

    if (!result) {
      return res.status(404).send('Media not found');
    }

    const contentType = result.blob?.contentType || (type === 'status' ? 'image/jpeg' : 'video/mp4');

    // Strict Security & Anti-Hacking Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self' data: blob:; img-src 'self' data: blob:; sandbox");
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'private, max-age=86400, stale-while-revalidate=86400');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');

    // Stream the binary data
    const stream = result.stream;
    if (stream && typeof stream.pipe === 'function') {
      stream.pipe(res);
    } else if (stream && typeof stream.getReader === 'function') {
      const reader = stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      const buffer = Buffer.from(await result.blob.arrayBuffer());
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error serving private blob:', error);
    return res.status(500).json({ error: error.message || 'Error serving blob' });
  }
}
