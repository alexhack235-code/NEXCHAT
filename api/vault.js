import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';

/**
 * NEXCHAT /api/vault - Secure Media Storage Target Gateway
 * Fetches dynamic upload targets from the dedicated COLD-VAULT microservice.
 */

const COLD_VAULT_API_URL = process.env.COLD_VAULT_API_URL || 'https://cold-vault-api.vercel.app/api/vault';
const NEXCHAT_SECRET = process.env.NEXCHAT_SECRET || 'NEXCHAT_ULTRA_12345';

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  // GET /api/vault: Health check
  if (req.method === 'GET') {
    try {
      const resp = await fetch(COLD_VAULT_API_URL, {
        headers: { 'x-nexchat-secret': NEXCHAT_SECRET }
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(502).json({ error: 'Cold Vault unreachable', details: err.message });
    }
  }

  // POST /api/vault: Request upload target OR report failure
  if (req.method === 'POST') {
    if (!enforceRateLimit(req, res)) return;

    try {
      const resp = await fetch(COLD_VAULT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexchat-secret': NEXCHAT_SECRET
        },
        body: JSON.stringify(req.body || {})
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Vault dispatch error', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
