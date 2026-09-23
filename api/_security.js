/**
 * NEXCHAT Server-Side Security Middleware & Anti-Abuse Engine
 * Protects serverless functions against DDoS, brute force, path traversal,
 * unauthorized access, and malicious file injection.
 */

// Sliding window IP rate limit store: Map<ip, { count: number, resetAt: number }>
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 requests/min per IP

// Periodic memory cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

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
 * Enforces per-IP sliding window rate limiting.
 * Returns true if allowed, false if rate limited.
 * 
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {number} [maxLimit=MAX_REQUESTS_PER_WINDOW]
 * @returns {boolean}
 */
export function enforceRateLimit(req, res, maxLimit = MAX_REQUESTS_PER_WINDOW) {
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
    res.status(429).json({
      error: 'Too Many Requests. Rate limit exceeded. Try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: retryAfterSec,
    });
    return false;
  }

  return true;
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
