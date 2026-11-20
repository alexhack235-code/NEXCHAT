const net = require('net');
const tls = require('tls');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('email-config.json', 'utf8'));
const user = config.gmailUser;
const pass = config.gmailAppPassword.replace(/\s+/g, '');
const target = process.argv[2] || 'alexhack235@gmail.com';

console.log('Testing 587 STARTTLS dispatch to', target);

const rawSocket = net.connect(587, 'smtp.gmail.com');
rawSocket.setEncoding('utf8');

let step = 0;
rawSocket.on('data', (d) => {
  const code = parseInt(d.substring(0, 3), 10);
  console.log('STEP', step, 'CODE', code, d.trim().split('\n')[0]);
  if (step === 0 && code === 220) {
    rawSocket.write('EHLO localhost\r\n');
    step = 1;
  } else if (step === 1 && code === 250) {
    rawSocket.write('STARTTLS\r\n');
    step = 2;
  } else if (step === 2 && code === 220) {
    rawSocket.removeAllListeners('data');
    const sec = tls.connect({ socket: rawSocket, host: 'smtp.gmail.com' });
    sec.setEncoding('utf8');
    let secStep = 0;
    sec.on('data', (sd) => {
      const sc = parseInt(sd.substring(0, 3), 10);
      console.log('SEC STEP', secStep, 'SC', sc, sd.trim().split('\n')[0]);
      if (secStep === 0 && sc === 250) {
        sec.write('AUTH LOGIN\r\n');
        secStep = 1;
      } else if (secStep === 1 && sc === 334) {
        sec.write(Buffer.from(user).toString('base64') + '\r\n');
        secStep = 2;
      } else if (secStep === 2 && sc === 334) {
        sec.write(Buffer.from(pass).toString('base64') + '\r\n');
        secStep = 3;
      } else if (secStep === 3 && sc === 235) {
        console.log('>>> AUTHENTICATED SUCCESSFULLY! Sending MAIL FROM...');
        sec.write('MAIL FROM:<' + user + '>\r\n');
        secStep = 4;
      } else if (secStep === 4 && sc === 250) {
        console.log('>>> Sending RCPT TO...');
        sec.write('RCPT TO:<' + target + '>\r\n');
        secStep = 5;
      } else if (secStep === 5 && sc === 250) {
        console.log('>>> Sending DATA...');
        sec.write('DATA\r\n');
        secStep = 6;
      } else if (secStep === 6 && sc === 354) {
        console.log('>>> Delivering message body...');
        sec.write('From: "NEXCHAT Sentinel" <' + user + '>\r\nTo: <' + target + '>\r\nSubject: [NEXCHAT SECURITY] Password Reset PIN: 849201\r\n\r\nHello Alex,\r\n\r\nYour password reset verification code is: 849201\r\n\r\nThis PIN expires in 15 minutes.\r\n\r\n.\r\n');
        secStep = 7;
      } else if (secStep === 7 && sc === 250) {
        console.log('>>> EMAIL DISPATCH CONFIRMED! 250 OK: ' + sd.trim());
        sec.write('QUIT\r\n');
        sec.end();
        process.exit(0);
      }
    });
    sec.on('error', (e) => console.error('Sec err:', e.message));
    sec.write('EHLO localhost\r\n');
  }
});
rawSocket.on('error', (e) => console.error('Raw err:', e.message));
setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 15000);
