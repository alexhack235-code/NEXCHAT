/**
 * NEXCHAT VERCEL EDGE SECURITY MIDDLEWARE
 * Implements Edge WAF & Edge Rate Limiting across all routes and pages.
 * Directly resolves penetration test findings:
 * 1. SQL Injection / NoSQL Injection WAF filter -> returns HTTP 403 Forbidden
 * 2. Rapid Request / Password Spray Throttling -> returns HTTP 429 Too Many Requests
 */

const SQL_INJECTION_PATTERNS = [
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

// In-memory sliding window IP rate limiter for edge instances
const edgeRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_GLOBAL_PER_MIN = 60;
const MAX_AUTH_PER_MIN = 10;

// Cleanup stale edge entries periodically
function cleanupStaleLimits(now) {
  if (edgeRateLimitMap.size > 2000) {
    for (const [ip, data] of edgeRateLimitMap.entries()) {
      if (now > data.resetAt) {
        edgeRateLimitMap.delete(ip);
      }
    }
  }
}

export const config = {
  // Apply WAF and rate limiting to all routes except static media assets
  matcher: [
    '/((?!favicon\\.ico|_vercel|.*\\.(?:jpg|jpeg|png|gif|webp|svg|ico|css|woff|woff2|ttf|mp3|wav|ogg|glb|gltf|bin)).*)',
  ],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();

  // Skip static scripts, styles, and web assets from Edge rate limiting
  if (
    pathname.endsWith('.js') ||
    pathname.endsWith('.mjs') ||
    pathname.endsWith('.cjs') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.map') ||
    pathname.endsWith('.json') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/js/') ||
    pathname.startsWith('/css/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/favicons/')
  ) {
    return;
  }
  const search = url.search;
  const rawUrl = request.url;

  let decodedUrl = rawUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch (_) {}

  // =========================================================================
  // 1. DEFENSE PROTOCOL 1: EDGE WAF (SQLi & NoSQLi Filter)
  // =========================================================================
  const targets = [
    rawUrl,
    decodedUrl,
    search,
    request.headers.get('user-agent') || '',
    request.headers.get('referer') || '',
  ];
  const combined = targets.join(' ');

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(combined)) {
      return new Response(
        JSON.stringify({
          error: 'Request blocked by security filter',
          code: 'WAF_VIOLATION',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
          },
        }
      );
    }
  }

  // =========================================================================
  // 2. DEFENSE PROTOCOL 2: EDGE RATE LIMITING (Anti-Password Spray)
  // =========================================================================
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const isAuthRoute =
    pathname.includes('/auth') ||
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/reset');

  const maxAllowed = isAuthRoute ? MAX_AUTH_PER_MIN : MAX_GLOBAL_PER_MIN;
  const now = Date.now();
  cleanupStaleLimits(now);

  const trackerKey = `${clientIp}:${isAuthRoute ? 'auth' : 'all'}`;
  let record = edgeRateLimitMap.get(trackerKey);

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    edgeRateLimitMap.set(trackerKey, record);
  } else {
    record.count++;
  }

  if (record.count > maxAllowed) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return new Response(
      JSON.stringify({
        error: isAuthRoute
          ? 'Too many login attempts. Account protection active. Please retry in a few moments.'
          : 'Too many requests. Please slow down.',
        code: isAuthRoute ? 'AUTH_RATE_LIMITED' : 'RATE_LIMITED',
        retryAfterSeconds: retryAfterSec,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(maxAllowed),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
        },
      }
    );
  }

  // Continue to static files / rewrites
  return;
}
