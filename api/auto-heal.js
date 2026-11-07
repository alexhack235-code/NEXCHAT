import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';

/**
 * NEXCHAT /api/auto-heal - Autonomous Self-Repair Gateway
 * Connects NEXCHAT to the dedicated 10-key Auto-Healer Microservice
 */

const HEAL_MICROSERVICE_URL = process.env.AUTO_HEAL_API_URL || 'https://auto-healer-api.vercel.app/api/heal';
const NEXCHAT_SECRET = process.env.NEXCHAT_SECRET || 'NEXCHAT_ULTRA_12345';

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  // Health check query: GET /api/auto-heal
  if (req.method === 'GET') {
    try {
      const resp = await fetch(HEAL_MICROSERVICE_URL, {
        headers: { 'x-nexchat-secret': NEXCHAT_SECRET }
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(502).json({
        error: 'Auto-Healer microservice unreachable',
        details: err.message
      });
    }
  }

  // Healing action: POST /api/auto-heal
  if (req.method === 'POST') {
    if (!enforceRateLimit(req, res)) return;

    const {
      errorLog = '',
      fileContent = '',
      fileName = 'runtime-incident.js',
      stack = ''
    } = req.body || {};

    const fullError = [errorLog, stack].filter(Boolean).join('\n');
    if (!fullError && !fileContent) {
      return res.status(400).json({ error: 'Missing errorLog or fileContent' });
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);

      const resp = await fetch(HEAL_MICROSERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexchat-secret': NEXCHAT_SECRET
        },
        body: JSON.stringify({
          errorLog: fullError,
          fileContent: fileContent || `// Incident captured at ${new Date().toISOString()}\n// Target: ${fileName}\nfunction handleIncident() { /* auto-repaired */ }`,
          fileName
        }),
        signal: controller.signal
      });

      clearTimeout(timer);
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(500).json({
        error: 'Healing engine request failed',
        details: err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
