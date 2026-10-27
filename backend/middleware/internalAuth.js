/**
 * NEXCHAT Fortress Internal Authentication Middleware
 * Enforces zero-trust air-gap architecture: direct backend calls without valid
 * x-internal-auth header from Fortress Cloud Defender WAF proxy are rejected with 403 Forbidden.
 */

function internalAuth(req, res, next) {
  // Allow preflight OPTIONS to negotiate headers if applicable
  if (req.method === 'OPTIONS') {
    return next();
  }

  const incomingSecret = req.headers['x-internal-auth'];
  const expectedSecret = process.env.INTERNAL_SECRET || 'd0caa6a4b13a2c24c4d7267d2a99a39f3d6e9b9a9506199f545d4043b8e975b4';

  if (!incomingSecret || incomingSecret !== expectedSecret) {
    return res.status(403).json({
      error: 'Forbidden: Direct backend access prohibited. All requests must route through Fortress Cloud Defender Proxy.'
    });
  }

  next();
}

module.exports = internalAuth;
module.exports.internalAuth = internalAuth;
