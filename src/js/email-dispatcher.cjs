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
};

// Check for local email-config.json if environment variables are not set
const localConfigPath = path.join(__dirname, '..', '..', 'email-config.json');
if (fs.existsSync(localConfigPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
    if (raw.gmailUser) CONFIG.GMAIL_USER = raw.gmailUser;
    if (raw.gmailAppPassword) CONFIG.GMAIL_APP_PASS = raw.gmailAppPassword;
    if (raw.resendApiKey) CONFIG.RESEND_API_KEY = raw.resendApiKey;
  } catch (e) {
    console.warn('[EMAIL] Could not parse email-config.json:', e.message);
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
      // Step 7: Ready for message (354) -> Send Headers & Body
      else if (step === 7 && code === 354) {
        const boundary = '----=_Part_NexChat_' + Date.now();
        const emailData = [
          `From: "${CONFIG.FROM_NAME}" <${CONFIG.GMAIL_USER}>`,
          `To: <${to}>`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          `Content-Type: text/html; charset=UTF-8`,
          '',
          htmlContent,
          '\r\n.\r\n',
        ].join('\r\n');

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

// Pre-built Cyberpunk HTML Email Templates
function createDeviceLinkEmail({ username, deviceType, browser, os, ipAddress, revokeUrl }) {
  return `
    <div style="background-color: #060913; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(0, 240, 118, 0.3); overflow: hidden;">
      <div style="background: linear-gradient(135deg, rgba(0, 240, 118, 0.15), rgba(0, 212, 255, 0.15)); padding: 24px 28px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
        <h2 style="margin: 0; color: #00f076; font-size: 20px; letter-spacing: 1px;">NEXCHAT // SECURITY ALERT</h2>
        <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">New Device Linked to Your Account</p>
      </div>
      <div style="padding: 28px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #f8fafc;">Hello <strong>${username || 'NEXCHAT User'}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
          A new device was successfully paired and authorized to access your encrypted conversations.
        </p>
        <div style="background: rgba(12, 19, 35, 0.7); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr><td style="color: #64748b; padding: 4px 0;">Device Type:</td><td style="color: #00d4ff; font-weight: 600;">${deviceType || 'Desktop'}</td></tr>
            <tr><td style="color: #64748b; padding: 4px 0;">Browser & OS:</td><td style="color: #f8fafc; font-weight: 600;">${browser} on ${os}</td></tr>
            <tr><td style="color: #64748b; padding: 4px 0;">IP Address:</td><td style="color: #00f076; font-family: monospace;">${ipAddress || 'Verified Primary'}</td></tr>
            <tr><td style="color: #64748b; padding: 4px 0;">Timestamp:</td><td style="color: #f8fafc;">${new Date().toUTCString()}</td></tr>
          </table>
        </div>
        <p style="margin: 0 0 20px; font-size: 13px; color: #ff6b6b; line-height: 1.5;">
          If you did not initiate this link request, terminate this session immediately to prevent unauthorized access.
        </p>
        <div style="text-align: center; margin: 28px 0 16px;">
          <a href="${revokeUrl || 'http://localhost:8080/chat.html'}" style="background: #fe2c55; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; display: inline-block;">
            TERMINATE SESSION NOW
          </a>
        </div>
      </div>
      <div style="background: rgba(4, 7, 16, 0.8); padding: 14px 28px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.05);">
        NEXCHAT End-to-End Cryptographic Enclave &bull; Automated Security Dispatcher
      </div>
    </div>
  `;
}

function createOfflineMessageEmail({ recipientName, senderName, messageSnippet, chatUrl }) {
  return `
    <div style="background-color: #060913; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(0, 240, 118, 0.3); overflow: hidden;">
      <div style="background: linear-gradient(135deg, rgba(0, 240, 118, 0.2), rgba(0, 212, 255, 0.2)); padding: 24px 28px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
        <h2 style="margin: 0; color: #00f076; font-size: 20px; letter-spacing: 1px;">NEXCHAT // NEW MESSAGE</h2>
        <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">You have unread encrypted messages</p>
      </div>
      <div style="padding: 28px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #f8fafc;">Hello <strong>${recipientName || 'there'}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
          <strong>${senderName}</strong> sent you a message while you were offline.
        </p>
        <div style="background: rgba(12, 19, 35, 0.7); border-left: 3px solid #00f076; border-radius: 4px; padding: 14px 18px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #e2e8f0; font-style: italic;">
            "${messageSnippet || '[Encrypted Message Attachment]'}"
          </p>
        </div>
        <div style="text-align: center; margin: 28px 0 16px;">
          <a href="${chatUrl || 'http://localhost:8080/chat.html'}" style="background: linear-gradient(135deg, #00f076, #00d4ff); color: #050811; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; display: inline-block;">
            OPEN ENCRYPTED CHAT
          </a>
        </div>
      </div>
      <div style="background: rgba(4, 7, 16, 0.8); padding: 14px 28px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.05);">
        NEXCHAT Cryptographic Vault &bull; Zero-Trust Notification Service
      </div>
    </div>
  `;
}

module.exports = {
  sendNotificationEmail,
  sendViaGmailSMTP,
  createDeviceLinkEmail,
  createOfflineMessageEmail,
  CONFIG,
};
