/**
 * NEXCHAT Server-Side Security Middleware & Anti-Abuse Engine
 * Upgraded with Protocol 1 (SQLi/NoSQLi WAF) & Protocol 2 (Edge Rate Limiting)
 * Protects serverless functions against DDoS, brute force, path traversal,
 * unauthorized access, malicious injection, and credential spraying.
 */

import { firebaseConfig } from '../firebase-public-config.js';

// Sliding window IP rate limit store: Map<ip, { count: number, resetAt: number }>
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 requests/min per IP

/**
 * DEFENSE PROTOCOL 1: SQL Injection & NoSQL Injection Detection Patterns
 */
export const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
  /(['";])\s*(OR|AND)\s+\d+\s*[=<>]/i,          // ' OR 1=1
  /(--|#|\/\*|\*\/)/,                              // SQL comments
  /(\bWAITFOR\b\s+\bDELAY\b)/i,                   // Time-based blind SQLi
  /(\bBENCHMARK\b\s*\()/i,                         // MySQL benchmark
  /(\bSLEEP\b\s*\()/i,                             // MySQL sleep
  /(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)/i,   // File operations
  /(\bCHAR\b\s*\()/i,                              // CHAR() encoding bypass
  /(\bCONCAT\b\s*\()/i,                            // String concatenation attacks
  /(0x[0-9a-fA-F]+)/,                              // Hex-encoded payloads
  /(%27|%22|%23|%3B)/i,                            // URL-encoded quotes/semicolons
  /(\$where|\$regex|\$gt|\$lt|\$ne|\$in|\$nin|\$or|\$and|\$not|\$expr)/i, // NoSQL MongoDB operators
];

// Periodic memory cleanup every 5 minutes (unref prevents blocking serverless process exit)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

/**
 * Extracts client IP address accurately from standard proxy headers.
 * @param {import('http').IncomingMessage} req 
 * @returns {string}
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * DEFENSE PROTOCOL 1: WAF Inspector
 * Intercepts SQLi / NoSQLi injection payloads across URL, query, body, and headers.
 * Returns true if safe, false if blocked.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean}
 */
export function enforceWaf(req, res) {
  try {
    const rawUrl = req.url || '';
    let decodedUrl = rawUrl;
    try { decodedUrl = decodeURIComponent(rawUrl); } catch (_) {}

    const targets = [
      rawUrl,
      decodedUrl,
      JSON.stringify(req.query || {}),
      JSON.stringify(req.body || {}),
      req.headers['user-agent'] || '',
      req.headers['referer'] || ''
    ];
    const combined = targets.join(' ');

    for (const pattern of sqlInjectionPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(combined)) {
        const ip = getClientIp(req);
        console.error(`[WAF BLOCK] SQLi/NoSQLi detected from ${ip}: ${combined.slice(0, 160)}`);
        res.setHeader('Content-Type', 'application/json');
        res.status(403).json({
          error: 'Request blocked by security filter',
          code: 'WAF_VIOLATION'
        });
        return false;
      }
    }
  } catch (_) {
    // Fail safe
  }
  return true;
}

/**
 * Enforces per-IP sliding window rate limiting + automatic WAF inspection.
 * Returns true if allowed, false if rate limited or blocked by WAF.
 * 
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {number} [maxLimit=MAX_REQUESTS_PER_WINDOW]
 * @returns {boolean}
 */
export function enforceRateLimit(req, res, maxLimit = MAX_REQUESTS_PER_WINDOW) {
  // 1. Run WAF inspection first
  if (!enforceWaf(req, res)) {
    return false;
  }

  // 2. Run sliding-window rate limit
  const ip = getClientIp(req);
  const now = Date.now();

  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, record);
    return true;
  }

  record.count++;
  if (record.count > maxLimit) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    console.warn(`[SECURITY WARNING] Rate limit exceeded for IP: ${ip} (${record.count} reqs).`);
    res.setHeader('Retry-After', String(retryAfterSec));
    res.setHeader('Content-Type', 'application/json');
    res.status(429).json({
      error: 'Too many requests. Please slow down.',
      code: 'RATE_LIMITED',
      retryAfterSeconds: retryAfterSec,
    });
    return false;
  }

  return true;
}

export async function verifyFirebaseIdToken(req) {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: match[1] }),
  });
  if (!response.ok) return null;

  const payload = await response.json();
  const user = payload.users?.[0];
  return user?.localId ? { uid: user.localId, email: user.email || null } : null;
}

/**
 * Applies strict defense-in-depth HTTP security headers to all outgoing responses.
 * @param {import('http').ServerResponse} res 
 */
export function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self' data: blob:; img-src 'self' data: blob:; sandbox");
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
}

/**
 * Prohibited file extensions (anti-malware, anti-script execution, anti-XSS).
 */
export const DANGEROUS_EXTENSIONS = /\.(html?|php\d?|phtml|exe|bat|cmd|sh|cgi|pl|py|js|ts|jsx|tsx|jar|msi|vbs|svg|asp|aspx|jsp|phar)$/i;

/**
 * Validates pathnames against directory traversal, null bytes, and malicious characters.
 * @param {string} pathname 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePathname(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return { valid: false, error: 'Pathname is required and must be a string.' };
  }

  if (
    pathname.includes('..') ||
    pathname.includes('\\') ||
    pathname.includes('\0') ||
    pathname.includes('%00') ||
    pathname.includes('%2e%2e') ||
    pathname.includes('%2E%2E')
  ) {
    return { valid: false, error: 'Path traversal detected.' };
  }

  if (DANGEROUS_EXTENSIONS.test(pathname)) {
    return { valid: false, error: 'Prohibited file extension.' };
  }

  return { valid: true };
}

/**
 * Universal CORS and Preflight handler for web and Capacitor native clients.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} true if preflight OPTIONS was handled and terminated
 */
export function handleCors(req, res) {
  const allowedOrigins = [
    'https://nexchat-drab.vercel.app',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost'
  ];
  const origin = req.headers.origin;

  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('https://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('https://127.0.0.1:')
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Filename, X-Upload-Type, X-Vault-Index, X-Access-Mode, Range');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
