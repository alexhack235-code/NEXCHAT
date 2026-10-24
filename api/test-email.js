import { applySecurityHeaders } from './_security.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { sendNotificationEmail, CONFIG } = require('../src/js/email-dispatcher.cjs');

/**
 * /api/test-email - Instant Verification Endpoint for TLS SMTP
 * Zero external dependencies. Strictly 0 Unicode emojis.
 */
export default async function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST or GET.' });
  }

  const toEmail = (req.body && (req.body.toEmail || req.body.to)) ||
                  req.query?.to ||
                  CONFIG.GMAIL_USER ||
                  'oyewoletodoroki@gmail.com';

  try {
    const result = await sendNotificationEmail({
      to: toEmail,
      subject: '[NEXCHAT SENTINEL] Native TLS SMTP Diagnostic Verification',
      htmlContent: `
        <div style="background:#060913; color:#f8fafc; padding:28px 24px; border-radius:14px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; border:1px solid #00f076; max-width:600px; margin:0 auto;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <td>
                <span style="font-size:10px; font-weight:800; letter-spacing:2px; color:#00f076; text-transform:uppercase; background:rgba(0,240,118,0.1); border:1px solid rgba(0,240,118,0.35); padding:3px 10px; border-radius:9999px;">
                  DIAGNOSTIC PASSED
                </span>
                <h2 style="color:#ffffff; margin:8px 0 0; font-size:20px; font-weight:800;">NEXCHAT SENTINEL LIVE TEST</h2>
              </td>
            </tr>
          </table>
          <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">
            Your automated email dispatch pipeline is fully verified. Native TLS SMTP handshake to smtp.gmail.com:465 completed successfully.
          </p>
          <div style="background:rgba(255,255,255,0.05); padding:12px 16px; border-radius:8px; font-family:monospace; font-size:11px; color:#94a3b8; margin-top:16px;">
            <div>Target: ${toEmail}</div>
            <div>Timestamp: ${new Date().toUTCString()}</div>
            <div>Status: 250 OK Delivered</div>
          </div>
        </div>
      `
    });

    return res.status(200).json({
      success: result.success,
      provider: result.provider || 'gmail_smtp',
      details: result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
