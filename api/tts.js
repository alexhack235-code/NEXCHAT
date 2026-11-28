import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';
import crypto from 'crypto';
import https from 'https';
import { spawn } from 'child_process';

/**
 * NEXCHAT /api/tts
 * Pure-Node Vercel Serverless Neural Text-to-Speech via Edge Neural TTS.
 * Zero external npm/Python dependencies.
 * Accepts POST { text, voice, rate } -> returns audio/mpeg binary MP3.
 */

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const SEC_MS_GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;
const WIN_EPOCH = 11644473600;

const SHA256_INITIAL = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
const SHA256_STATE = [0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A, 0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2];
const SHA256_SCHEDULE = [0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA, 0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6, 0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33, 0xD258B060, 0x72766564];
const SHA256_K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];
const SHA256_ADJ = 0xC9DC06A7;
const SHA256_BLOCK_K = [...SHA256_K.slice(0, 14), SHA256_ADJ, ...SHA256_K.slice(15)];
const CS64_COEFFS = [[0xE82E91B1, 0xB32700D0], [0x44DE24C6, 0x88DFF51D], [0x3BEB65BC, 0x29514038], [0xC89C5933, 0xB328CBDF], [0x8D1EC211, 0xD405B4D5], [0x314EF5D5, 0x26E55F3C], [0xE92491B1, 0x607801C6], [0xF0A5B9D5, 0x82B2C1FB], [0x06064CF3, 0xFA51A3DA], [0xDA79FA60, 0x207CC464], [0xBED20560, 0x3C3C74F3], [0x89F9C9F8, 0xD2D14B61], [0x35FA38C6, 0xBB04A2C1], [0xCB49E3C6, 0xC5626167]];
const CS64_FACTOR = 0x82893933;
const CS64_ADJ0 = 0xF2F90B1A;
const CS64_ADJ1 = 0x0B1A0000;

let clockSkewSeconds = 0;

const mul32 = (a, b) => Math.imul(a | 0, b | 0) >>> 0;
const rotr = (v, n) => ((v >>> n) | (v << (32 - n))) >>> 0;
const rol16 = (v) => ((v << 16) | (v >>> 16)) >>> 0;
const sigma0 = (v) => (rotr(v, 7) ^ rotr(v, 18) ^ (v >>> 3)) >>> 0;
const sigma1 = (v) => (rotr(v, 17) ^ rotr(v, 19) ^ (v >>> 10)) >>> 0;

function expandSchedule(w, start = 16) {
  for (let i = start; i < 64; i++) {
    w[i] = (sigma1(w[i - 2]) + w[i - 7] + sigma0(w[i - 15]) + w[i - 16]) >>> 0;
  }
}

function shaRounds(st, w, first = 0) {
  let [a, b, c, d, e, f, g, h] = st;
  const kArr = first === 14 ? SHA256_BLOCK_K : SHA256_K;
  for (let i = first; i < 64; i++) {
    const s1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
    const ch = ((e & f) ^ ((~e) & g)) >>> 0;
    const t1 = (h + s1 + ch + kArr[i] + w[i]) >>> 0;
    const s0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
    const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
    const t2 = (s0 + maj) >>> 0;
    h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
  }
  return [a, b, c, d, e, f, g, h];
}

function sha256V2(buf) {
  const w0 = new Array(64).fill(0);
  w0[14] = ((buf[0] << 16) | (buf[1] << 8) | buf[2]) >>> 0;
  w0[15] = buf.readUInt32BE(3);
  for (let i = 16; i < 30; i++) {
    let val = SHA256_SCHEDULE[i - 16];
    if (i - 2 >= 14) val = (val + (i === 16 ? (sigma1(w0[i - 2]) ^ 0x000B92C0) : sigma1(w0[i - 2]))) >>> 0;
    if (i - 7 >= 14) val = (val + w0[i - 7]) >>> 0;
    if (i - 15 >= 14) val = (val + (i === 29 ? (sigma0(w0[i - 15]) ^ 0x059C0B80) : sigma0(w0[i - 15]))) >>> 0;
    w0[i] = val >>> 0;
  }
  w0[30] = (sigma1(w0[28]) + w0[23] + sigma0(w0[15]) + w0[14] + SHA256_ADJ - SHA256_K[14]) >>> 0;
  expandSchedule(w0, 31);
  const rk = shaRounds(SHA256_STATE, w0, 14);
  let state = SHA256_INITIAL.map((x, i) => (x + rk[i]) >>> 0);
  const rem = buf.subarray(7);
  const len = 57 + buf.length;
  const padZero = (55 - (len % 64) + 64) % 64;
  const padded = Buffer.concat([rem, Buffer.from([0x80]), Buffer.alloc(padZero), Buffer.alloc(8)]);
  padded.writeBigUInt64BE(BigInt(len) * 8n, padded.length - 8);
  for (let off = 0; off < padded.length; off += 64) {
    const w = new Array(64).fill(0);
    for (let j = 0; j < 16; j++) w[j] = padded.readUInt32BE(off + j * 4);
    expandSchedule(w, 16);
    const rk2 = shaRounds(state, w, 0);
    state = state.map((x, i) => (x + rk2[i]) >>> 0);
  }
  const out = Buffer.alloc(32);
  state.forEach((x, i) => out.writeUInt32BE(x >>> 0, i * 4));
  return out;
}

function cs64(data, digest) {
  const keyA = (digest.readUInt32LE(0) | 1) >>> 0;
  const keyB = (digest.readUInt32LE(4) | 1) >>> 0;
  const factors = [mul32(keyA, CS64_FACTOR), mul32(keyB, CS64_FACTOR)];
  const terms = CS64_COEFFS.map(([c], i) => mul32(c, factors[i % 2]));
  const offsets = CS64_COEFFS.map(([, o]) => o >>> 0);
  const raw = Buffer.concat([Buffer.from([0]), data]);
  const pad = Buffer.concat([raw, Buffer.alloc((4 - (raw.length % 4)) % 4)]);
  const words = [];
  for (let i = 0; i < pad.length; i += 4) words.push(pad.readUInt32LE(i));
  if (words.length % 2) words.push(0);
  words.forEach((w, i) => {
    let t = mul32(w, i % 2 === 0 ? keyA : keyB);
    let o = mul32(rol16(w), i % 2 === 0 ? 0xEF0569FB : 0xC31713DB);
    if (i === 0) { t = (t + mul32(CS64_ADJ0, factors[0])) >>> 0; o = (o + CS64_ADJ1) >>> 0; }
    terms.push(t);
    offsets.push(o);
  });
  let swapAcc = 0, swapLast = 0, state = 0, acc = 0;
  for (let i = 0; i < terms.length; i += 2) {
    const x = terms[i], y = terms[i + 1];
    let t = rol16((offsets[i] + x) >>> 0);
    let q = mul32(t, 0x76F50F34);
    swapAcc = (swapAcc + mul32(rol16(q), 0xC3EFEA97) + q) >>> 0;
    t = rol16((offsets[i + 1] + y) >>> 0);
    q = mul32(t, 0x1881CE3C);
    swapLast = (mul32(rol16(q), 0x35BD1EC9) + q) >>> 0;
    swapAcc = (swapAcc + swapLast) >>> 0;
    state = (mul32(state, keyA) + x) >>> 0;
    state = mul32(rol16(state), 0xCF98B111);
    state = mul32(rol16(state), 0x87085B9F);
    state = mul32(rol16(state), 0x12CEB96D);
    state = mul32(rol16(state), 0x257E1D83);
    acc = (acc + state) >>> 0;
    t = (mul32(state, keyB) + y) >>> 0;
    t = mul32(rol16(t), 0xA27416F5);
    t = mul32(rol16(t), 0xD38396FF);
    state = mul32(rol16(mul32(rol16(t), 0x7C932B89)), 0xBFA49F69);
    acc = (acc + state) >>> 0;
  }
  const out = Buffer.alloc(8);
  out.writeUInt32LE((swapLast ^ state) >>> 0, 0);
  out.writeUInt32LE((swapAcc ^ acc) >>> 0, 4);
  return out.toString('hex').toUpperCase();
}

function generateSecMsGecV2() {
  let ticks = Math.floor(Date.now() / 1000 + clockSkewSeconds) + WIN_EPOCH;
  ticks -= ticks % 300;
  const ticks100ns = BigInt(ticks) * 10000000n;
  const data = Buffer.from(ticks100ns.toString() + TRUSTED_CLIENT_TOKEN, 'ascii');
  const dig = sha256V2(data);
  return `${cs64(data, dig)}-${dig.toString('hex').toUpperCase()}`;
}

function cleanTextForSpeech(raw) {
  if (!raw) return '';
  let clean = String(raw);
  clean = clean.replace(/```[\s\S]*?```/g, ' ');
  clean = clean.replace(/`([^`]+)`/g, '$1');
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  clean = clean.replace(/^[#\-*>]+\s*/gm, '');
  clean = clean.replace(/\|.+?\|/g, ' ');
  clean = clean.replace(/[*_]{1,3}/g, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  if (clean.length > 1200) {
    clean = clean.slice(0, 1200).trim();
  }
  return clean;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRate(rate) {
  if (typeof rate === 'string' && (rate.endsWith('%') || rate.endsWith('Hz'))) {
    return rate;
  }
  const num = parseFloat(rate);
  if (isNaN(num) || num === 1.0) return '+0%';
  const pct = Math.round((num - 1.0) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function encodeWsTextFrame(str) {
  const payload = Buffer.from(str, 'utf8');
  const maskKey = crypto.randomBytes(4);
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(6);
    header[0] = 0x81;
    header[1] = 0x80 | len;
    maskKey.copy(header, 2);
  } else if (len < 65536) {
    header = Buffer.alloc(8);
    header[0] = 0x81;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
    maskKey.copy(header, 4);
  } else {
    header = Buffer.alloc(14);
    header[0] = 0x81;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(len), 2);
    maskKey.copy(header, 10);
  }
  const masked = Buffer.allocUnsafe(len);
  for (let i = 0; i < len; i++) {
    masked[i] = payload[i] ^ maskKey[i & 3];
  }
  return Buffer.concat([header, masked]);
}

function encodeWsCloseFrame() {
  const maskKey = crypto.randomBytes(4);
  return Buffer.from([0x88, 0x80, maskKey[0], maskKey[1], maskKey[2], maskKey[3]]);
}

function synthesizeViaHttpsWs({ text, voice, rate }, allowRetry = true) {
  return new Promise((resolve, reject) => {
    const token = generateSecMsGecV2();
    const connectionId = crypto.randomUUID().replace(/-/g, '');
    const muid = crypto.randomBytes(16).toString('hex').toUpperCase();
    const wsKey = crypto.randomBytes(16).toString('base64');
    const voiceName = voice || 'en-US-JennyNeural';
    const rateStr = formatRate(rate);

    const pathQuery = `/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectionId}&Sec-MS-GEC=${encodeURIComponent(token)}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

    let settled = false;
    let activeSocket = null;
    const finish = (err, buf) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { if (activeSocket) activeSocket.destroy(); } catch (_) {}
      if (err) reject(err);
      else resolve(buf);
    };

    const timer = setTimeout(() => {
      finish(new Error('Edge TTS synthesis timed out (3.5s)'));
    }, 3500);

    const req = https.request({
      hostname: 'speech.platform.bing.com',
      port: 443,
      path: pathQuery,
      method: 'GET',
      family: 4,
      ALPNProtocols: ['http/1.1'],
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Key': wsKey,
        'Sec-WebSocket-Version': '13',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': `muid=${muid};`
      }
    });

    req.on('response', (res) => {
      if (res.statusCode === 403 && allowRetry && res.headers?.date) {
        const srvMs = Date.parse(res.headers.date);
        if (Number.isFinite(srvMs)) {
          clockSkewSeconds += (srvMs - Date.now()) / 1000;
          clearTimeout(timer);
          settled = true;
          res.resume();
          synthesizeViaHttpsWs({ text, voice, rate }, false).then(resolve, reject);
          return;
        }
      }
      res.resume();
      finish(new Error(`Edge TTS HTTP ${res.statusCode}`));
    });

    req.on('upgrade', (_res, socket, head) => {
      activeSocket = socket;
      const audioChunks = [];
      let rawBuf = head && head.length ? Buffer.from(head) : Buffer.alloc(0);
      let fragChunks = [];
      let fragOpcode = 0;

      const configMsg = 'Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n' +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
              }
            }
          }
        });
      const requestId = crypto.randomUUID().replace(/-/g, '');
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voiceName}'><prosody pitch='+0Hz' rate='${rateStr}' volume='+0%'>${escapeXml(text)}</prosody></voice></speak>`;
      const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;

      socket.write(encodeWsTextFrame(configMsg));
      socket.write(encodeWsTextFrame(ssmlMsg));

      const handleMessage = (opcode, data) => {
        if (opcode === 1) {
          const s = data.toString('utf8');
          if (s.includes('Path:turn.end')) {
            try { socket.write(encodeWsCloseFrame()); } catch (_) {}
            finish(null, Buffer.concat(audioChunks));
          }
        } else if (opcode === 2 && data.length >= 2) {
          const headerLen = data.readUInt16BE(0);
          if (data.length >= 2 + headerLen) {
            const hdr = data.subarray(2, 2 + headerLen).toString('utf8');
            if (hdr.includes('Path:audio')) {
              const audio = data.subarray(2 + headerLen);
              if (audio.length > 0) audioChunks.push(audio);
            }
          }
        }
      };

      const processFrames = () => {
        while (rawBuf.length >= 2) {
          const b0 = rawBuf[0];
          const b1 = rawBuf[1];
          const fin = (b0 & 0x80) !== 0;
          const opcode = b0 & 0x0f;
          const masked = (b1 & 0x80) !== 0;
          let payloadLen = b1 & 0x7f;
          let offset = 2;
          if (payloadLen === 126) {
            if (rawBuf.length < 4) return;
            payloadLen = rawBuf.readUInt16BE(2);
            offset = 4;
          } else if (payloadLen === 127) {
            if (rawBuf.length < 10) return;
            payloadLen = Number(rawBuf.readBigUInt64BE(2));
            offset = 10;
          }
          if (masked) offset += 4;
          if (rawBuf.length < offset + payloadLen) return;
          const frameData = rawBuf.subarray(offset, offset + payloadLen);
          rawBuf = rawBuf.subarray(offset + payloadLen);

          if (opcode === 8) {
            if (audioChunks.length > 0) finish(null, Buffer.concat(audioChunks));
            else finish(new Error('Edge TTS WebSocket closed without audio'));
            return;
          }
          if (opcode === 9) {
            const pong = Buffer.allocUnsafe(2 + frameData.length);
            pong[0] = 0x8a; pong[1] = 0x80 | frameData.length;
            continue;
          }
          if (opcode === 10) continue;

          if (opcode !== 0) {
            fragOpcode = opcode;
            fragChunks = [frameData];
          } else {
            fragChunks.push(frameData);
          }
          if (fin) {
            const full = fragChunks.length === 1 ? fragChunks[0] : Buffer.concat(fragChunks);
            fragChunks = [];
            handleMessage(fragOpcode, full);
            if (settled) return;
          }
        }
      };

      socket.on('data', (chunk) => {
        rawBuf = rawBuf.length ? Buffer.concat([rawBuf, chunk]) : chunk;
        processFrames();
      });
      socket.on('error', (err) => finish(err));
      socket.on('close', () => {
        if (audioChunks.length > 0) finish(null, Buffer.concat(audioChunks));
        else finish(new Error('Edge TTS socket closed cleanly with 0 audio chunks'));
      });
    });

    req.on('error', (err) => finish(err));
    req.end();
  });
}

function synthesizeViaEdgeEngine({ text, voice, rate }) {
  return new Promise((resolve, reject) => {
    const voiceName = voice || 'en-US-JennyNeural';
    const rateStr = formatRate(rate);
    const script = [
      'import sys, json, asyncio, edge_tts',
      'payload = json.loads(sys.stdin.read())',
      'async def synthesize():',
      '    c = edge_tts.Communicate(payload["text"], payload["voice"], rate=payload["rate"])',
      '    async for chunk in c.stream():',
      '        if chunk["type"] == "audio":',
      '            sys.stdout.buffer.write(chunk["data"])',
      '    sys.stdout.buffer.flush()',
      'asyncio.run(synthesize())'
    ].join('\n');
    const proc = spawn('python', ['-c', script]);
    const chunks = [];
    let errOutput = '';
    proc.stdout.on('data', (d) => chunks.push(d));
    proc.stderr.on('data', (d) => { errOutput += d.toString(); });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`Edge TTS fallback exited ${code}: ${errOutput}`));
    });
    proc.stdin.write(JSON.stringify({ text, voice: voiceName, rate: rateStr }));
    proc.stdin.end();
  });
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  if (!enforceRateLimit(req, res, 60)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text = '', message = '', voice = 'en-US-JennyNeural', rate = 1.0 } = req.body || {};
    const clean = cleanTextForSpeech(text || message || '');

    if (!clean) {
      return res.status(400).json({ error: 'No text provided for speech synthesis' });
    }

    let mp3Buffer = null;
    try {
      mp3Buffer = await synthesizeViaHttpsWs({ text: clean, voice, rate });
    } catch (wsErr) {
      mp3Buffer = await synthesizeViaEdgeEngine({ text: clean, voice, rate });
    }

    if (!mp3Buffer || mp3Buffer.length === 0) {
      return res.status(502).json({ error: 'Edge TTS synthesis returned empty audio' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', mp3Buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return res.status(200).send(mp3Buffer);
  } catch (err) {
    console.error('[API /api/tts] Synthesis error:', err);
    return res.status(502).json({
      error: 'Upstream TTS service failure',
      details: err?.message || String(err)
    });
  }
}
