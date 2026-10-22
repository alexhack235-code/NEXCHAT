/**
 * NEXCHAT Zero-Dependency Gmail & Security Email Dispatcher
 * Pure Node.js TLS SMTP Client (smtp.gmail.com:465) + Resend / Webhook Fallbacks
 * 100% Free Forever • No external npm modules required.
 */

const tls = require('tls');
const fs = require('fs');
const path = require('path');

// Configuration from environment variables or local fallback config
const CONFIG = {
  GMAIL_USER: process.env.GMAIL_USER || '',
  GMAIL_APP_PASS: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASS || '',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  FROM_NAME: 'NEXCHAT Sentinel',
  APP_BASE_URL: process.env.APP_BASE_URL || 'https://nexchat-drab.vercel.app',
};

// Check for local email-config.json if environment variables are not set
const localConfigPath = path.join(__dirname, '..', '..', 'email-config.json');
if (fs.existsSync(localConfigPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
    if (raw.gmailUser) CONFIG.GMAIL_USER = raw.gmailUser;
    if (raw.gmailAppPassword) CONFIG.GMAIL_APP_PASS = raw.gmailAppPassword;
    if (raw.resendApiKey) CONFIG.RESEND_API_KEY = raw.resendApiKey;
    if (raw.appBaseUrl) CONFIG.APP_BASE_URL = raw.appBaseUrl;
  } catch (e) {
    console.warn('[EMAIL] Could not parse email-config.json:', e.message);
  }
}

/**
 * Resolves any relative or localhost URL into a globally reachable HTTPS URL (e.g. Vercel production)
 * Prevents "localhost cannot be reached" errors when users click links on mobile phones or external devices.
 */
function resolvePublicUrl(urlPath, fallbackRelative = '') {
  const publicBase = (CONFIG.APP_BASE_URL || 'https://nexchat-drab.vercel.app').replace(/\/+$/, '');

  if (!urlPath) {
    return `${publicBase}/${fallbackRelative.replace(/^\/+/, '')}`;
  }

  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    // If it points to localhost or 127.0.0.1, convert host to the live public web app
    if (urlPath.includes('localhost') || urlPath.includes('127.0.0.1')) {
      try {
        const u = new URL(urlPath);
        return `${publicBase}${u.pathname}${u.search}${u.hash}`;
      } catch (_) {
        return `${publicBase}/${fallbackRelative.replace(/^\/+/, '')}`;
      }
    }
    return urlPath;
  }

  return `${publicBase}/${urlPath.replace(/^\/+/, '')}`;
}

// Preload official NEXCHAT logo for inline MIME attachment (prevents blank/missing logo in Gmail)
let LOGO_BASE64 = '';
const localLogoPath = path.join(__dirname, '..', '..', 'logo.jpg');
if (fs.existsSync(localLogoPath)) {
  try {
    LOGO_BASE64 = fs.readFileSync(localLogoPath).toString('base64').replace(/(.{76})/g, '$1\r\n');
  } catch (e) {
    console.warn('[EMAIL] Could not read logo.jpg for attachment:', e.message);
  }
}

/**
 * Sends an email via pure native TLS SMTP (smtp.gmail.com:465)
 */
function sendViaGmailSMTP(to, subject, htmlContent) {
  return new Promise((resolve, reject) => {
    if (!CONFIG.GMAIL_USER || !CONFIG.GMAIL_APP_PASS) {
      return reject(new Error('GMAIL_USER or GMAIL_APP_PASSWORD is not configured.'));
    }

    const socket = tls.connect({
      host: 'smtp.gmail.com',
      port: 465,
      rejectUnauthorized: true,
    });

    let step = 0;
    const cleanPass = CONFIG.GMAIL_APP_PASS.replace(/\s+/g, '');

    socket.setEncoding('utf8');

    socket.on('data', (data) => {
      const code = parseInt(data.substring(0, 3), 10);

      // Step 0: Server Greeting (220)
      if (step === 0 && code === 220) {
        socket.write('EHLO localhost\r\n');
        step = 1;
      }
      // Step 1: EHLO Response (250) -> Start AUTH LOGIN
      else if (step === 1 && code === 250) {
        socket.write('AUTH LOGIN\r\n');
        step = 2;
      }
      // Step 2: Username prompt (334) -> Send base64 email
      else if (step === 2 && code === 334) {
        socket.write(Buffer.from(CONFIG.GMAIL_USER).toString('base64') + '\r\n');
        step = 3;
      }
      // Step 3: Password prompt (334) -> Send base64 app password
      else if (step === 3 && code === 334) {
        socket.write(Buffer.from(cleanPass).toString('base64') + '\r\n');
        step = 4;
      }
      // Step 4: Auth Succeeded (235) -> MAIL FROM
      else if (step === 4 && code === 235) {
        socket.write(`MAIL FROM:<${CONFIG.GMAIL_USER}>\r\n`);
        step = 5;
      }
      // Step 5: MAIL FROM Accepted (250) -> RCPT TO
      else if (step === 5 && code === 250) {
        socket.write(`RCPT TO:<${to}>\r\n`);
        step = 6;
      }
      // Step 6: RCPT TO Accepted (250) -> DATA
      else if (step === 6 && code === 250) {
        socket.write('DATA\r\n');
        step = 7;
      }
      // Step 7: Ready for message (354) -> Send Headers, HTML Body & Inline Attached Logo
      else if (step === 7 && code === 354) {
        const boundary = '----=_Part_NexChat_' + Date.now();
        let emailData = '';

        if (LOGO_BASE64) {
          emailData = [
            `From: "${CONFIG.FROM_NAME}" <${CONFIG.GMAIL_USER}>`,
            `To: <${to}>`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/related; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: 7bit',
            '',
            htmlContent,
            '',
            `--${boundary}`,
            'Content-Type: image/jpeg; name="logo.jpg"',
            'Content-Transfer-Encoding: base64',
            'Content-ID: <nexchat-logo>',
            'Content-Disposition: inline; filename="logo.jpg"',
            '',
            LOGO_BASE64,
            '',
            `--${boundary}--`,
            '\r\n.\r\n',
          ].join('\r\n');
        } else {
          emailData = [
            `From: "${CONFIG.FROM_NAME}" <${CONFIG.GMAIL_USER}>`,
            `To: <${to}>`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: text/html; charset=UTF-8`,
            '',
            htmlContent,
            '\r\n.\r\n',
          ].join('\r\n');
        }

        socket.write(emailData);
        step = 8;
      }
      // Step 8: Email queued/sent (250) -> QUIT
      else if (step === 8 && code === 250) {
        socket.write('QUIT\r\n');
        socket.end();
        resolve({ success: true, messageId: data.trim() });
      } else if (code >= 400) {
        socket.end();
        reject(new Error(`SMTP Error [${code}]: ${data.trim()}`));
      }
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.setTimeout(12000, () => {
      socket.destroy();
      reject(new Error('SMTP connection timed out after 12s'));
    });
  });
}

/**
 * High-level email dispatcher with automatic fallback to local sandbox log
 */
async function sendNotificationEmail({ to, subject, htmlContent }) {
  console.log(`[EMAIL DISPATCHER] Dispatching alert to: ${to} | Subject: "${subject}"`);

  // 1. Try Gmail SMTP if configured
  if (CONFIG.GMAIL_USER && CONFIG.GMAIL_APP_PASS) {
    try {
      const res = await sendViaGmailSMTP(to, subject, htmlContent);
      console.log(`[EMAIL DISPATCHER] Successfully sent via Gmail SMTP to: ${to}`);
      return { success: true, provider: 'gmail_smtp', details: res };
    } catch (err) {
      console.error(`[EMAIL DISPATCHER] Gmail SMTP attempt failed:`, err.message);
    }
  }

  // 2. Try Resend if configured
  if (CONFIG.RESEND_API_KEY && typeof fetch !== 'undefined') {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${CONFIG.FROM_NAME} <onboarding@resend.dev>`,
          to: [to],
          subject: subject,
          html: htmlContent,
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        console.log(`[EMAIL DISPATCHER] Successfully sent via Resend API to: ${to}`);
        return { success: true, provider: 'resend', details: data };
      }
    } catch (err) {
      console.error(`[EMAIL DISPATCHER] Resend API attempt failed:`, err.message);
    }
  }

  // 3. Fallback: Local Sandbox Dev Logger (guarantees zero app crash and instant visibility)
  console.log(`========================================================================`);
  console.log(`[SANDBOX EMAIL SIMULATOR] Email queued for: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`------------------------------------------------------------------------`);
  console.log(`HTML BODY PREVIEW:\n${htmlContent.substring(0, 300)}...`);
  console.log(`NOTE: To send REAL emails to Gmail inboxes, add your Gmail App Password to email-config.json`);
  console.log(`========================================================================`);

  return { success: true, provider: 'sandbox_simulator', simulated: true };
}

// ══════════════════════════════════════════════════════════════════════
// HIGH-FIDELITY CYBERPUNK HTML EMAIL TEMPLATES
// ══════════════════════════════════════════════════════════════════════

/**
 * Enterprise-Grade Password Reset & Cryptographic Key Recovery Email
 */
function createPasswordResetEmail({ username, resetUrl, token, ipAddress, expiresMinutes = 15 }) {
  const pin = token || Math.floor(100000 + Math.random() * 900000).toString();
  const urlWithToken = resetUrl
    ? (resetUrl.includes('token=') ? resetUrl : (resetUrl.includes('?') ? `${resetUrl}&token=${pin}` : `${resetUrl}?token=${pin}`))
    : `reset.html?token=${pin}`;
  const directLink = resolvePublicUrl(urlWithToken, `reset.html?token=${pin}`);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NEXCHAT Security Key Recovery</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #03060d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #070c18; border-radius: 18px; border: 1px solid rgba(0, 240, 118, 0.35); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(0, 240, 118, 0.15); overflow: hidden;">
        
        <!-- Header Banner with Neon Glow -->
        <tr>
          <td style="background: linear-gradient(135deg, rgba(6, 14, 28, 0.98), rgba(10, 22, 45, 0.95)); padding: 28px 32px; border-bottom: 1px solid rgba(0, 240, 118, 0.25);">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #00f076; text-transform: uppercase; background: rgba(0, 240, 118, 0.1); border: 1px solid rgba(0, 240, 118, 0.35); padding: 4px 12px; border-radius: 9999px; margin-bottom: 10px;">
                    CONFIDENTIAL &bull; SINGLE-USE RECOVERY
                  </span>
                  <h1 style="margin: 6px 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                    NEXCHAT <span style="color: #00d4ff;">//</span> KEY VAULT
                  </h1>
                  <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">
                    Encrypted Master Password &amp; Session Reset Authorization
                  </p>
                </td>
                <td align="right" valign="top">
                  <img src="cid:nexchat-logo" alt="NEXCHAT Logo" width="48" height="48" style="border-radius: 12px; border: 1.5px solid #00f076; box-shadow: 0 0 14px rgba(0, 240, 118, 0.4); display: block;" onerror="this.src='https://raw.githubusercontent.com/alexhack235-code/NEXCHAT/main/logo.jpg'" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Main Content Area -->
        <tr>
          <td style="padding: 32px 32px 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; color: #f8fafc; font-weight: 600;">
              Hello <span style="color: #00f076;">${username || 'NEXCHAT User'}</span>,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; color: #cbd5e1; line-height: 1.65;">
              A formal request has been received to reset the master access credentials for your NEXCHAT cryptographic account. If you initiated this request, please use the secure authorization details below.
            </p>

            <!-- 6-Digit One-Time PIN Container -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
              <tr>
                <td align="center" style="background: rgba(12, 19, 38, 0.9); border: 1.5px dashed rgba(0, 212, 255, 0.5); border-radius: 14px; padding: 22px 16px;">
                  <span style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">
                    ONE-TIME VERIFICATION PIN
                  </span>
                  <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #00f076; margin: 10px 0 6px; text-shadow: 0 0 14px rgba(0, 240, 118, 0.5);">
                    ${pin}
                  </div>
                  <span style="font-size: 12px; color: #64748b;">
                    Expires in <strong style="color: #e2e8f0;">${expiresMinutes} minutes</strong> &bull; Single-use only
                  </span>
                </td>
              </tr>
            </table>

            <!-- Primary 1-Click Action Button Routing Directly to reset.html -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
              <tr>
                <td align="center">
                  <a href="${directLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00f076 0%, #00d4ff 100%); color: #050811; text-decoration: none; font-size: 14px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; padding: 15px 36px; border-radius: 9999px; box-shadow: 0 6px 20px rgba(0, 240, 118, 0.4);">
                    RESET ENCRYPTED CREDENTIALS &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Security Audit & Telemetry Card -->
            <div style="background: rgba(8, 14, 28, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 20px; margin: 26px 0 20px;">
              <span style="font-size: 10px; font-weight: 800; color: #00d4ff; letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 10px;">
                SECURITY AUDIT TELEMETRY
              </span>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 12.5px; color: #cbd5e1;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Request Source:</td>
                  <td style="padding: 4px 0; color: #f8fafc; font-weight: 600; text-align: right;">NEXCHAT Recovery Gateway</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Client IP Address:</td>
                  <td style="padding: 4px 0; color: #00f076; font-family: monospace; font-weight: 600; text-align: right;">${ipAddress || 'Verified Primary IP'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Timestamp (UTC):</td>
                  <td style="padding: 4px 0; color: #f8fafc; text-align: right;">${new Date().toUTCString()}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Cryptographic Enclave:</td>
                  <td style="padding: 4px 0; color: #00d4ff; text-align: right;">AES-256-GCM / SHA-256</td>
                </tr>
              </table>
            </div>

            <!-- Direct URL Fallback -->
            <p style="margin: 20px 0 6px; font-size: 12px; color: #64748b; line-height: 1.5;">
              Button not working? Copy and paste this secure link directly into your browser:
            </p>
            <div style="background: rgba(4, 7, 16, 0.8); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 10px 14px; word-break: break-all; font-family: monospace; font-size: 11px; color: #00d4ff;">
              ${directLink}
            </div>

            <!-- Security Warning Advisory -->
            <div style="border-left: 3px solid #fe2c55; background: rgba(254, 44, 85, 0.08); border-radius: 4px; padding: 12px 16px; margin-top: 24px;">
              <p style="margin: 0; font-size: 12.5px; color: #fda4af; line-height: 1.5;">
                <strong>Did not request this password reset?</strong> Your account is completely safe. No changes can occur without this email token. If you suspect unauthorized activity, please review your active sessions in Settings &rarr; Linked Devices immediately.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #040710; padding: 22px 32px; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
            <p style="margin: 0 0 6px; font-size: 11.5px; color: #64748b;">
              This is an automated cryptographic security transmission from <strong>NEXCHAT Sentinel</strong>.
            </p>
            <p style="margin: 0; font-size: 10.5px; color: #475569;">
              NEXO-TECH Security Enclave &bull; Zero-Trust Architecture &bull; All Rights Reserved 2026
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Enterprise-Grade Device Link Security Alert Email
 */
function createDeviceLinkEmail({ username, deviceType, browser, os, ipAddress, revokeUrl }) {
  const killUrl = resolvePublicUrl(revokeUrl, 'chat.html?action=manage_devices');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NEXCHAT Security Alert: New Device Linked</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #03060d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #070c18; border-radius: 18px; border: 1px solid rgba(254, 44, 85, 0.4); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(254, 44, 85, 0.15); overflow: hidden;">
        
        <!-- Red Alert Header -->
        <tr>
          <td style="background: linear-gradient(135deg, rgba(30, 8, 16, 0.98), rgba(12, 19, 35, 0.95)); padding: 28px 32px; border-bottom: 1px solid rgba(254, 44, 85, 0.3);">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #fe2c55; text-transform: uppercase; background: rgba(254, 44, 85, 0.12); border: 1px solid rgba(254, 44, 85, 0.4); padding: 4px 12px; border-radius: 9999px; margin-bottom: 10px;">
                    SECURITY ALERT &bull; NEW DEVICE PAIRED
                  </span>
                  <h1 style="margin: 6px 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                    NEXCHAT <span style="color: #fe2c55;">//</span> DEVICE SENTINEL
                  </h1>
                  <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">
                    A secondary client has been authorized to access your encrypted chats
                  </p>
                </td>
                <td align="right" valign="top">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right: 10px;" valign="middle">
                        <img src="cid:nexchat-logo" alt="NEXCHAT Logo" width="44" height="44" style="border-radius: 12px; border: 1.5px solid #fe2c55; box-shadow: 0 0 14px rgba(254, 44, 85, 0.4); display: block;" onerror="this.src='https://raw.githubusercontent.com/alexhack235-code/NEXCHAT/main/logo.jpg'" />
                      </td>
                      <td valign="middle">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(254, 44, 85, 0.15); border: 1px solid #fe2c55; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 44px; font-size: 20px;">
                          🚨
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding: 32px 32px 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; color: #f8fafc; font-weight: 600;">
              Hello <strong style="color: #00d4ff;">${username || 'NEXCHAT User'}</strong>,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; color: #cbd5e1; line-height: 1.65;">
              A new device was successfully paired via the QR Code pairing protocol and granted access to your active conversations.
            </p>

            <!-- Device Specifications Card -->
            <div style="background: rgba(12, 19, 38, 0.85); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 14px; padding: 20px; margin: 22px 0;">
              <span style="font-size: 10px; font-weight: 800; color: #00d4ff; letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 12px;">
                CONNECTED DEVICE TELEMETRY
              </span>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #cbd5e1;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Device Category:</td>
                  <td style="padding: 6px 0; color: #00d4ff; font-weight: 700; text-align: right;">${deviceType || 'Desktop Client'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Browser &amp; OS:</td>
                  <td style="padding: 6px 0; color: #f8fafc; font-weight: 600; text-align: right;">${browser} on ${os}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Network IP Address:</td>
                  <td style="padding: 6px 0; color: #00f076; font-family: monospace; font-weight: 600; text-align: right;">${ipAddress || 'Verified IP'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Pairing Timestamp:</td>
                  <td style="padding: 6px 0; color: #f8fafc; text-align: right;">${new Date().toUTCString()}</td>
                </tr>
              </table>
            </div>

            <!-- Emergency Kill Switch Button -->
            <p style="margin: 0 0 16px; font-size: 13.5px; color: #fda4af; line-height: 1.5;">
              If you did not pair this device, someone else may have scanned your QR code. Terminate this session immediately:
            </p>
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 28px;">
              <tr>
                <td align="center">
                  <a href="${killUrl}" target="_blank" style="display: inline-block; background: #fe2c55; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 15px 36px; border-radius: 9999px; box-shadow: 0 6px 20px rgba(254, 44, 85, 0.4);">
                    TERMINATE THIS SESSION NOW &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #040710; padding: 22px 32px; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #64748b;">
              NEXCHAT End-to-End Cryptographic Enclave &bull; Automated Hardware Sentinel
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Enterprise-Grade Offline Message Digest Email
 */
function createOfflineMessageEmail({ recipientName, senderName, messageSnippet, chatUrl }) {
  const directChat = resolvePublicUrl(chatUrl, 'chat.html');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NEXCHAT New Message</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #03060d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #070c18; border-radius: 18px; border: 1px solid rgba(0, 240, 118, 0.35); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(0, 240, 118, 0.15); overflow: hidden;">
        
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, rgba(6, 14, 28, 0.98), rgba(10, 22, 45, 0.95)); padding: 28px 32px; border-bottom: 1px solid rgba(0, 240, 118, 0.25);">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #00f076; text-transform: uppercase; background: rgba(0, 240, 118, 0.1); border: 1px solid rgba(0, 240, 118, 0.35); padding: 4px 12px; border-radius: 9999px; margin-bottom: 10px;">
                    ENCRYPTED DISPATCH &bull; UNREAD ACTIVITY
                  </span>
                  <h1 style="margin: 6px 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                    NEXCHAT <span style="color: #00d4ff;">//</span> CHAT RELAY
                  </h1>
                </td>
                <td align="right" valign="top">
                  <img src="cid:nexchat-logo" alt="NEXCHAT Logo" width="48" height="48" style="border-radius: 12px; border: 1.5px solid #00f076; box-shadow: 0 0 14px rgba(0, 240, 118, 0.4); display: block;" onerror="this.src='https://raw.githubusercontent.com/alexhack235-code/NEXCHAT/main/logo.jpg'" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding: 32px 32px 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; color: #f8fafc; font-weight: 600;">
              Hello <span style="color: #00f076;">${recipientName || 'there'}</span>,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; color: #cbd5e1; line-height: 1.65;">
              <strong>${senderName || 'A contact'}</strong> sent you an encrypted message while your client was offline:
            </p>

            <div style="background: rgba(12, 19, 38, 0.9); border-left: 4px solid #00f076; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14.5px; color: #f1f5f9; font-style: italic; line-height: 1.6;">
                "${messageSnippet || '[Encrypted Secure Attachment]'}"
              </p>
            </div>

            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 26px 0;">
              <tr>
                <td align="center">
                  <a href="${directChat}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00f076 0%, #00d4ff 100%); color: #050811; text-decoration: none; font-size: 14px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; padding: 15px 36px; border-radius: 9999px; box-shadow: 0 6px 20px rgba(0, 240, 118, 0.4);">
                    OPEN ENCRYPTED CHAT &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #040710; padding: 22px 32px; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #64748b;">
              NEXCHAT Cryptographic Vault &bull; Zero-Trust Notification Service
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Enterprise-Grade Extension Preview & Permission Consent Security Email
 */
function createExtensionConsentEmail({ username, extensionName, extensionId, status, scopes, ipAddress, clientTime, revokeUrl }) {
  const isApproved = (status === 'approved' || status === 'granted' || status === 'yes');
  const directUrl = resolvePublicUrl(revokeUrl, 'chat.html?action=manage_extensions');
  const name = extensionName || 'NEX-REELS (CamShot)';
  const defaultScopes = scopes && scopes.length ? scopes : [
    'read:profile',
    'write:media_vault',
    'sync:chat_feed',
    'security:telemetry'
  ];

  const primaryColor = isApproved ? '#00f076' : '#fe2c55';
  const secondaryColor = isApproved ? '#00d4ff' : '#ff758c';
  const statusBadge = isApproved ? 'ACCESS AUTHORIZED &bull; ACTIVE' : 'ACCESS DENIED &bull; BLOCKED';
  const statusText = isApproved ? 'AUTHORIZED // ACTIVE' : 'BLOCKED // FORBIDDEN';
  const statusIcon = isApproved ? '🛡️' : '🛑';
  const headerGradient = isApproved 
    ? 'linear-gradient(135deg, rgba(6, 24, 18, 0.98), rgba(8, 22, 45, 0.95))'
    : 'linear-gradient(135deg, rgba(34, 8, 16, 0.98), rgba(20, 10, 28, 0.95))';
  const borderColor = isApproved ? 'rgba(0, 240, 118, 0.35)' : 'rgba(254, 44, 85, 0.4)';
  const glowColor = isApproved ? 'rgba(0, 240, 118, 0.15)' : 'rgba(254, 44, 85, 0.15)';

  const scopesHtml = defaultScopes.map(scope => {
    let scopeDesc = '';
    if (scope === 'read:profile') scopeDesc = 'Read user identity, avatar, and verification badges';
    else if (scope === 'write:media_vault') scopeDesc = 'Upload & save recorded clips to shared media storage';
    else if (scope === 'sync:chat_feed') scopeDesc = 'Cross-post reels into active chat groups and contacts';
    else if (scope === 'security:telemetry') scopeDesc = 'End-to-end cryptographic session telemetry';
    else scopeDesc = 'Module ecosystem integration';

    const checkIcon = isApproved ? '✔' : '✖';
    const checkColor = isApproved ? '#00f076' : '#fe2c55';

    return `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <td style="padding: 8px 0; vertical-align: top; width: 24px; color: ${checkColor}; font-weight: bold; font-size: 14px;">
          ${checkIcon}
        </td>
        <td style="padding: 8px 0; vertical-align: top;">
          <code style="background: rgba(255, 255, 255, 0.06); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11.5px; color: ${secondaryColor}; font-weight: 600;">${scope}</code>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">${scopeDesc}</div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NEXCHAT Security: Extension Permission ${isApproved ? 'Granted' : 'Blocked'}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #03060d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #070c18; border-radius: 18px; border: 1px solid ${borderColor}; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 24px ${glowColor}; overflow: hidden;">
        
        <!-- Header Banner with Neon Glow -->
        <tr>
          <td style="background: ${headerGradient}; padding: 28px 32px; border-bottom: 1px solid ${borderColor};">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 2px; color: ${primaryColor}; text-transform: uppercase; background: rgba(255, 255, 255, 0.08); border: 1px solid ${primaryColor}; padding: 4px 12px; border-radius: 9999px; margin-bottom: 10px;">
                    ${statusBadge}
                  </span>
                  <h1 style="margin: 6px 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                    NEX-ECOSYSTEM <span style="color: ${secondaryColor};">//</span> PERMISSION HUB
                  </h1>
                  <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">
                    Vercel-Style OAuth Extension Authorization Record
                  </p>
                </td>
                <td align="right" valign="top">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right: 12px;" valign="middle">
                        <img src="cid:nexchat-logo" alt="NEXCHAT Logo" width="46" height="46" style="border-radius: 12px; border: 1.5px solid ${primaryColor}; box-shadow: 0 0 14px ${glowColor}; display: block;" onerror="this.src='https://raw.githubusercontent.com/alexhack235-code/NEXCHAT/main/logo.jpg'" />
                      </td>
                      <td valign="middle">
                        <div style="width: 46px; height: 46px; border-radius: 14px; background: rgba(255, 255, 255, 0.06); border: 1.5px solid ${primaryColor}; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 46px; font-size: 22px;">
                          ${statusIcon}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Main Content Area -->
        <tr>
          <td style="padding: 32px 32px 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; color: #f8fafc; font-weight: 600;">
              Hello <span style="color: ${secondaryColor};">${username || 'Alex'}</span>,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; color: #cbd5e1; line-height: 1.65;">
              ${isApproved 
                ? `You have explicitly <strong>AUTHORIZED</strong> the module <strong style="color: #ffffff;">${name}</strong> to access your NEXCHAT ecosystem account. The requested scopes have been bound to your secure session.`
                : `You have explicitly <strong>DENIED &amp; BLOCKED</strong> the module <strong style="color: #ffffff;">${name}</strong> from accessing your NEXCHAT account. Zero user data, tokens, or media were exchanged.`}
            </p>

            <!-- Extension Details Card -->
            <div style="background: rgba(12, 19, 38, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 20px; margin: 22px 0;">
              <span style="font-size: 10px; font-weight: 800; color: ${secondaryColor}; letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 12px;">
                EXTENSION TELEMETRY &amp; PERMISSION AUDIT
              </span>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #cbd5e1;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Target Module:</td>
                  <td style="padding: 5px 0; color: #f8fafc; font-weight: 700; text-align: right;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Provider / Vendor:</td>
                  <td style="padding: 5px 0; color: #94a3b8; text-align: right;">NEXO-TECH Verified Enclave</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Consent Status:</td>
                  <td style="padding: 5px 0; color: ${primaryColor}; font-weight: 800; text-align: right;">${statusText}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Client IP Address:</td>
                  <td style="padding: 5px 0; color: #00f076; font-family: monospace; font-weight: 600; text-align: right;">${ipAddress || 'Verified Primary IP'}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Authorization Timestamp:</td>
                  <td style="padding: 5px 0; color: #f8fafc; text-align: right;">${clientTime || new Date().toUTCString()}</td>
                </tr>
              </table>
            </div>

            <!-- Scopes Requested / Evaluated -->
            <div style="background: rgba(8, 14, 28, 0.9); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
              <span style="font-size: 10.5px; font-weight: 800; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 10px;">
                ${isApproved ? 'GRANTED ACCESS SCOPES' : 'BLOCKED / DENIED SCOPES'}
              </span>
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                ${scopesHtml}
              </table>
            </div>

            <!-- Direct 1-Click Management Action -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 20px;">
              <tr>
                <td align="center">
                  <a href="${directUrl}" target="_blank" style="display: inline-block; background: ${isApproved ? 'linear-gradient(135deg, #00f076 0%, #00d4ff 100%)' : '#fe2c55'}; color: ${isApproved ? '#050811' : '#ffffff'}; text-decoration: none; font-size: 13.5px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; padding: 15px 36px; border-radius: 9999px; box-shadow: 0 6px 20px ${isApproved ? 'rgba(0, 240, 118, 0.4)' : 'rgba(254, 44, 85, 0.4)'};">
                    ${isApproved ? 'MANAGE OR REVOKE ACCESS &rarr;' : 'REVIEW SECURITY SETTINGS &rarr;'}
                  </a>
                </td>
              </tr>
            </table>

            <!-- Security Assurance Note -->
            <p style="margin: 18px 0 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
              You can modify or revoke extension access at any time from your NEXCHAT Settings &rarr; Ecosystem Hub.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #040710; padding: 22px 32px; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
            <p style="margin: 0 0 6px; font-size: 11px; color: #64748b;">
              This is an automated cryptographic security transmission from <strong>NEX-ECOSYSTEM Sentinel</strong>.
            </p>
            <p style="margin: 0; font-size: 10px; color: #475569;">
              NEXO-TECH OAuth Enclave &bull; Zero-Trust Authorization &bull; All Rights Reserved 2026
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

module.exports = {
  sendNotificationEmail,
  sendViaGmailSMTP,
  createPasswordResetEmail,
  createDeviceLinkEmail,
  createOfflineMessageEmail,
  createExtensionConsentEmail,
  resolvePublicUrl,
  CONFIG,
};
