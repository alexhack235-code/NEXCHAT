import { applySecurityHeaders, handleCors } from './_security.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let emailConfig = null;
    try {
      const dispatcher = require('../src/js/email-dispatcher.cjs');
      emailConfig = dispatcher.CONFIG;
    } catch (_) {}

    const isConfigured = !!(
      process.env.BREVO_API_KEY ||
      process.env.SMTP_HOST ||
      (emailConfig && emailConfig.smtp && emailConfig.smtp.host)
    );

    const provider = process.env.BREVO_API_KEY ? 'brevo' : 'smtp';
    const user = process.env.SMTP_USER || (emailConfig?.smtp?.user) || 'support@nexchat.internal';
    const server = process.env.SMTP_HOST || (emailConfig?.smtp?.host) || 'smtp-relay.brevo.com';

    return res.status(200).json({
      configured: isConfigured,
      provider: provider,
      user: user,
      server: server,
      timestamp: Date.now()
    });
  } catch (err) {
    return res.status(200).json({
      configured: false,
      provider: 'sandbox',
      user: 'sandbox@nexchat.internal',
      server: 'localhost',
      timestamp: Date.now()
    });
  }
}
