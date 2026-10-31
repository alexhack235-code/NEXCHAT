/**
 * NEXCHAT Fortress Internal Authentication & Origin Gatekeeper Middleware
 * Enforces zero-trust air-gap architecture: direct backend calls without valid
 * x-defender-origin-secret or x-internal-auth header from Fortress Cloud Defender
 * WAF proxy are rejected with 403 Forbidden.
 * 
 * STRICT COMPLIANCE:
 * - Strictly 0 Unicode emojis
 * - Pure Windows CRLF line endings
 */

const DEFENDER_SECRET = process.env.DEFENDER_ORIGIN_SECRET || 'nexchat_super_secure_origin_secret_2026';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'd0caa6a4b13a2c24c4d7267d2a99a39f3d6e9b9a9506199f545d4043b8e975b4';

function internalAuth(req, res, next) {
  // Allow health check endpoint for Render/Kubernetes keep-alive
  if (req.path === '/health' || req.path === '/ping' || req.path === '/api/health') {
    return next();
  }

  // Allow preflight OPTIONS to negotiate headers if applicable
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Incoming traffic MUST carry the Defender origin secret or internal auth
  const incomingSecret = req.headers['x-defender-origin-secret'] || req.headers['x-internal-auth'];

  if (!incomingSecret || (incomingSecret !== DEFENDER_SECRET && incomingSecret !== INTERNAL_SECRET)) {
    return res.status(403).json({
      error: 'ACCESS_DENIED_DIRECT_BACKEND_FORBIDDEN',
      message: 'Direct backend connection rejected. Traffic must route exclusively through Fortress Defender.'
    });
  }

  next();
}

module.exports = internalAuth;
module.exports.internalAuth = internalAuth;
module.exports.DEFENDER_SECRET = DEFENDER_SECRET;
module.exports.INTERNAL_SECRET = INTERNAL_SECRET;
