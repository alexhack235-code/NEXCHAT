/**
 * NEXCHAT Automated Sentinel Emailer Test Suite
 * Tests TLS SMTP handshake, authentication, all HTML templates, and live dispatch
 */
const {
  sendNotificationEmail,
  sendViaGmailSMTP,
  createPasswordResetEmail,
  createDeviceLinkEmail,
  createOfflineMessageEmail,
  createExtensionConsentEmail,
  CONFIG
} = require('./src/js/email-dispatcher.cjs');

async function runTestSuite() {
  console.log('========================================================================');
  console.log('🧪 NEXCHAT SENTINEL EMAIL DISPATCHER TEST SUITE');
  console.log('========================================================================\n');

  console.log('1. Checking configuration:');
  console.log('   - GMAIL_USER:', CONFIG.GMAIL_USER ? CONFIG.GMAIL_USER : '❌ NOT CONFIGURED');
  console.log('   - GMAIL_APP_PASS:', CONFIG.GMAIL_APP_PASS ? '******** (configured)' : '❌ NOT CONFIGURED');
  console.log('   - SENDER_NAME:', CONFIG.FROM_NAME);
  
  if (!CONFIG.GMAIL_USER || !CONFIG.GMAIL_APP_PASS) {
    console.error('\n❌ Fatal: Gmail credentials missing in email-config.json');
    process.exit(1);
  }

  console.log('\n2. Testing HTML Email Templates rendering:');
  try {
    const p1 = createPasswordResetEmail({
      username: 'Alex',
      resetUrl: 'http://localhost:8080/reset.html',
      token: '849201',
      ipAddress: '192.168.1.100',
      expiresMinutes: 15
    });
    console.log('   ✔ Password Reset template rendered (size:', p1.length, 'bytes)');

    const p2 = createDeviceLinkEmail({
      username: 'Alex',
      deviceType: 'CyberDeck Pro Workstation',
      browser: 'Chrome 130 (x86_64)',
      os: 'Windows 11 Pro',
      ipAddress: '192.168.1.100',
      revokeUrl: 'http://localhost:8080/chat.html?action=manage_devices'
    });
    console.log('   ✔ Device Link Alert template rendered (size:', p2.length, 'bytes)');

    const p3 = createOfflineMessageEmail({
      recipientName: 'Alex',
      senderName: 'NEXBOT Sentinel',
      messageSnippet: 'Zero-trust cryptographic enclave verification is complete.',
      chatUrl: 'http://localhost:8080/chat.html'
    });
    console.log('   ✔ Offline Message template rendered (size:', p3.length, 'bytes)');

    const p4 = createExtensionConsentEmail({
      username: 'Alex',
      extensionName: 'NEX-REELS CamShot Pro',
      extensionId: 'nex-reels-camshot',
      status: 'approved',
      scopes: ['read:profile', 'write:media_vault', 'sync:chat_feed'],
      ipAddress: '192.168.1.100',
      clientTime: new Date().toUTCString(),
      revokeUrl: 'http://localhost:8080/chat.html?action=manage_extensions'
    });
    console.log('   ✔ Extension Consent (Granted) template rendered (size:', p4.length, 'bytes)');

    const p5 = createExtensionConsentEmail({
      username: 'Alex',
      extensionName: 'Untrusted Module X',
      extensionId: 'untrusted-mod',
      status: 'denied',
      scopes: ['read:contacts', 'admin:system'],
      ipAddress: '192.168.1.100',
      clientTime: new Date().toUTCString(),
      revokeUrl: 'http://localhost:8080/chat.html?action=manage_extensions'
    });
    console.log('   ✔ Extension Consent (Blocked) template rendered (size:', p5.length, 'bytes)');
  } catch (err) {
    console.error('❌ Template rendering failed:', err);
    process.exit(1);
  }

  console.log('\n3. Testing Live Native TLS SMTP Dispatch:');
  const recipient = process.argv[2] || CONFIG.GMAIL_USER;
  console.log(`   - Target Recipient: ${recipient}`);

  try {
    const result = await sendNotificationEmail({
      to: recipient,
      subject: '⚡ NEXCHAT Sentinel Mailer Diagnostic Verification',
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
              <td align="right" valign="top">
                <img src="cid:nexchat-logo" alt="NEXCHAT" width="46" height="46" style="border-radius:12px; border:2px solid #00f076; display:block;" onerror="this.src='https://raw.githubusercontent.com/alexhack235-code/NEXCHAT/main/logo.jpg'" />
              </td>
            </tr>
          </table>
          <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">Your automated email dispatch pipeline is fully verified. Native TLS SMTP handshake to smtp.gmail.com:465 completed successfully with embedded brand attachments.</p>
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px; margin:16px 0; font-family:monospace; font-size:12px; color:#00d4ff;">
            <div>Provider: ${CONFIG.FROM_NAME}</div>
            <div>Sender: ${CONFIG.GMAIL_USER}</div>
            <div>Timestamp: ${new Date().toISOString()}</div>
          </div>
        </div>
      `
    });

    console.log('\n   ✔ Live Dispatch Succeeded!');
    console.log('   - Provider:', result.provider);
    console.log('   - Message ID:', result.details?.messageId || 'OK');
    console.log('\n========================================================================');
    console.log('🎉 ALL EMAIL TESTS COMPLETED WITH 100% SUCCESS');
    console.log('========================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Live Dispatch Failed:', err.message);
    process.exit(1);
  }
}

runTestSuite();
