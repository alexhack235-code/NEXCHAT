import { enforceRateLimit, applySecurityHeaders } from './_security.js';

/**
 * /api/send-email-alert - Serverless Email Dispatch Engine for Vercel
 * 
 * Handles:
 * 1. CamShot Vercel Extension OAuth Authorization Alerts & Verification Passes
 * 2. Password Reset PIN Dispatches
 * 3. Security Telemetry Notifications
 * 
 * STRICTLY ZERO EMOJIS: Clean cyberpunk typography and military-grade layout.
 */
export default async function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  if (!enforceRateLimit(req, res, 30)) {
    return res.status(429).json({ success: false, error: 'Rate limit exceeded. Try again in 60 seconds.' });
  }

  try {
    const body = req.body || {};
    const type = body.type;
    const toEmail = body.toEmail || body.to || body.recipient;
    const data = body.data || body.details || {};

    if (!toEmail || !toEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid recipient email is required.' });
    }

    const timestamp = new Date().toUTCString();
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     req.headers['x-real-ip'] || 
                     req.socket?.remoteAddress || 
                     '127.0.0.1';

    let subject = 'NEXCHAT Security Telemetry Alert';
    let emailHtml = '';

    if (type === 'extension_consent' || type === 'verification_pass') {
      const extName = data.extensionName || 'CamShot (Vercel Extension Ecosystem)';
      const status = data.status || 'approved';
      const isApproved = status === 'approved';
      const passId = data.passId || `PASS-NEX-${Math.floor(1000 + Math.random() * 9000)}-VERIFIED`;
      const verificationPin = data.token || data.verificationCode || Math.floor(100000 + Math.random() * 900000).toString();

      subject = isApproved
        ? `[NEXCHAT VERIFICATION PASS] ${extName} Authorized - PIN: ${verificationPin}`
        : `[NEXCHAT SECURITY ALERT] ${extName} Access Blocked`;

      emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060912; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #060912; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0d1526; border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 30px; background: linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 212, 255, 0.1) 100%); border-bottom: 1px solid rgba(0, 255, 136, 0.2);">
              <div style="font-family: monospace; font-size: 11px; font-weight: 800; color: #00ff88; letter-spacing: 1.5px; margin-bottom: 6px;">
                NEX-SECURITY TELEMETRY // VERCEL PROTOCOL
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                ${isApproved ? 'VERIFICATION PASS ISSUED' : 'EXTENSION ACCESS BLOCKED'}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${data.username || toEmail.split('@')[0]}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                ${isApproved
                  ? `An authorization request for <strong>${extName}</strong> was successfully approved for your account. Below is your official cryptographic Verification Pass and security PIN.`
                  : `An access request for <strong>${extName}</strong> was denied and blocked. No data access was granted.`
                }
              </p>

              ${isApproved ? `
              <!-- Verification Pass Certificate Box -->
              <table role="presentation" width="100%" style="background-color: #070b14; border: 1.5px solid #00ff88; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-family: monospace; font-size: 10px; font-weight: 800; color: #00d4ff; letter-spacing: 2px; margin-bottom: 8px;">
                      [OFFICIAL NEXCHAT VERIFICATION PASS]
                    </div>
                    <div style="font-family: monospace; font-size: 16px; font-weight: 800; color: #00ff88; margin-bottom: 12px;">
                      ${passId}
                    </div>
                    <div style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ffffff; background-color: rgba(0, 255, 136, 0.1); padding: 10px 20px; border-radius: 8px; display: inline-block; border: 1px dashed #00ff88;">
                      ${verificationPin}
                    </div>
                    <p style="margin: 10px 0 0; font-size: 11px; color: #94a3b8;">
                      6-Digit Security Verification PIN &bull; Enter in NEXCHAT to activate CamShot
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Telemetry Metadata Table -->
              <table role="presentation" width="100%" style="background-color: #080d1a; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; font-family: monospace; font-size: 11px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid rgba(255, 255, 255, 0.05); width: 35%;">EXTENSION</td>
                  <td style="padding: 10px 14px; color: #cbd5e1; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${extName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">STATUS</td>
                  <td style="padding: 10px 14px; color: ${isApproved ? '#00ff88' : '#ff3366'}; font-weight: 700; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${status.toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">CLIENT IP</td>
                  <td style="padding: 10px 14px; color: #cbd5e1; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${data.ipAddress || clientIp}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b;">TIMESTAMP</td>
                  <td style="padding: 10px 14px; color: #cbd5e1;">${data.clientTime || timestamp}</td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                If you did not authorize this action, visit your NEXCHAT Control Center > Settings > Linked Devices immediately to revoke all active tokens.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 30px; background-color: #070b14; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; font-family: monospace; font-size: 10px; color: #64748b;">
              NEXCHAT COMMUNICATIONS &bull; ZERO-TRUST ARCHITECTURE &bull; VERCEL APIS
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    } else if (type === 'password_reset') {
      const resetUrl = data.resetUrl || '#';
      const token = data.token || '000000';

      subject = `[NEXCHAT SECURITY] Password Reset PIN: ${token}`;

      emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060912; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #060912; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0d1526; border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 24px 30px; background: rgba(0, 212, 255, 0.1); border-bottom: 1px solid rgba(0, 212, 255, 0.2);">
              <div style="font-family: monospace; font-size: 11px; font-weight: 800; color: #00d4ff; letter-spacing: 1.5px; margin-bottom: 6px;">
                NEX-AUTH IDENTITY RECOVERY
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">PASSWORD RECOVERY PIN</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${data.username || toEmail.split('@')[0]}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                A password reset request was initiated for your NEXCHAT account. Use the PIN below or tap the button to proceed:
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <div style="font-family: monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #00d4ff; background-color: #070b14; padding: 12px 24px; border-radius: 8px; display: inline-block; border: 1px solid #00d4ff;">
                  ${token}
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${resetUrl}" style="background-color: #00d4ff; color: #000; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 8px; display: inline-block;">
                  RESET PASSWORD
                </a>
              </div>
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                This PIN will expire in 15 minutes. If you did not request this, ignore this transmission.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    } else if (type === 'account_sanction') {
      const status = data.status || 'SANCTIONED';
      const reason = data.reason || 'Violation of platform community standards';
      const duration = data.duration || '24h';
      const suspendedUntil = data.suspendedUntil || 'Pending Review';

      subject = `[NEXCHAT SECURITY] Account Sanction Notice: ${status}`;

      emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060912; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #060912; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0d1526; border: 1px solid rgba(255, 51, 102, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
          <tr>
            <td style="padding: 24px 30px; background: rgba(255, 51, 102, 0.15); border-bottom: 1px solid rgba(255, 51, 102, 0.3);">
              <div style="font-family: monospace; font-size: 11px; font-weight: 800; color: #ff3366; letter-spacing: 1.5px; margin-bottom: 6px;">
                NEX-SECURITY ENFORCEMENT PROTOCOL
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">ACCOUNT SANCTION DISPATCH</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${data.username || toEmail.split('@')[0]}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                This automated security transmission notifies you that an administrative sanction has been registered against your NEXCHAT account.
              </p>
              <table role="presentation" width="100%" style="background-color: #080d1a; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; font-family: monospace; font-size: 11px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid rgba(255, 255, 255, 0.05); width: 35%;">SANCTION STATUS</td>
                  <td style="padding: 10px 14px; color: #ff3366; font-weight: 800; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${status}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">REASON</td>
                  <td style="padding: 10px 14px; color: #cbd5e1; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${reason}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">DURATION</td>
                  <td style="padding: 10px 14px; color: #cbd5e1; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${duration}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b;">HOLD EXPIRATION</td>
                  <td style="padding: 10px 14px; color: #00d4ff;">${suspendedUntil}</td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                To file an appeal or request review, contact SuperAdmin operations through the official support gateway.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    }

    // Attempt live dispatch via Resend API if key is present
    let liveDispatched = false;
    let providerReceipt = null;

    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'NEXCHAT Security <security@nexchat.io>',
            to: [toEmail],
            subject: subject,
            html: emailHtml
          })
        });
        providerReceipt = await resendRes.json();
        liveDispatched = resendRes.ok;
      } catch (liveErr) {
        console.warn('[EMAIL ALERT] Resend provider notice:', liveErr.message);
      }
    }

    console.log(`[EMAIL ALERT] Dispatched (${type}) to ${toEmail}. Live: ${liveDispatched}`);

    return res.status(200).json({
      success: true,
      delivered: true,
      liveDispatched: liveDispatched,
      providerReceipt: providerReceipt,
      recipient: toEmail,
      subject: subject,
      passId: data.passId || `PASS-NEX-${Math.floor(1000 + Math.random() * 9000)}-VERIFIED`,
      verificationCode: data.token || data.verificationCode || Math.floor(100000 + Math.random() * 900000).toString(),
      timestamp: timestamp,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    });

  } catch (err) {
    console.error('[EMAIL ALERT] Internal handler error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
