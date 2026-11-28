import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';
import crypto from 'crypto';
import { WebSocket } from 'undici';
import { spawn } from 'child_process';

/**
 * NEXCHAT /api/tts
 * Serverless function for Neural Text-to-Speech synthesis via Edge Neural TTS.
 * Accepts POST { text, voice, rate }
 * Returns audio/mpeg binary MP3.
 */

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const SEC_MS_GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;

let cachedToken = null;
let cachedTokenExpiresAt = 0;

/**
 * Retrieve Sec-MS-GEC v2 authorization token.
 */
async function getSecMsGecToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt) {
    return cachedToken;
  }

  // Attempt using system edge_tts module if Python is available
  try {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync(
      'python',
      ['-c', 'from edge_tts.drm import generate_sec_ms_gec_v2; print(generate_sec_ms_gec_v2())'],
      { timeout: 3500 }
    );
    const token = (stdout || '').trim();
    if (token && token.length > 20) {
      cachedToken = token;
      cachedTokenExpiresAt = now + 4 * 60 * 1000;
      return token;
    }
  } catch (_) {}

  // Fallback v1 token calculation
  try {
    const ticks = BigInt(Math.floor(Date.now() / 1000 + 11644473600)) * 10000000n;
    const roundedTicks = ticks - (ticks % 3000000000n);
    const strToHash = `${roundedTicks}${TRUSTED_CLIENT_TOKEN}`;
    const token = crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
    return token;
  } catch (_) {
    return '';
  }
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

/**
 * Direct Edge Neural TTS WebSocket synthesis
 */
function synthesizeViaWebSocket({ text, voice, rate }) {
  return new Promise(async (resolve, reject) => {
    let timer = null;
    let ws = null;

    try {
      const token = await getSecMsGecToken();
      const connectionId = crypto.randomUUID().replace(/-/g, '');
      const voiceName = voice || 'en-US-JennyNeural';
      const rateStr = formatRate(rate);

      let url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectionId}`;
      if (token) {
        url += `&Sec-MS-GEC=${encodeURIComponent(token)}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;
      }

      const headers = {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'
      };
      if (token) {
        headers['Sec-MS-GEC'] = token;
        headers['Sec-MS-GEC-Version'] = SEC_MS_GEC_VERSION;
      }

      ws = new WebSocket(url, { headers });
      const audioChunks = [];

      timer = setTimeout(() => {
        try { ws.close(); } catch (_) {}
        reject(new Error('Edge TTS WebSocket synthesis timed out (4s)'));
      }, 4000);

      ws.onopen = () => {
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
        ws.send(configMsg);

        const requestId = crypto.randomUUID().replace(/-/g, '');
        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voiceName}'><prosody pitch='+0Hz' rate='${rateStr}' volume='+0%'>${escapeXml(text)}</prosody></voice></speak>`;
        const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
        ws.send(ssmlMsg);
      };

      ws.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          if (event.data.includes('Path:turn.end')) {
            clearTimeout(timer);
            try { ws.close(); } catch (_) {}
            const fullBuffer = Buffer.concat(audioChunks);
            resolve(fullBuffer);
          }
        } else {
          try {
            const buf = Buffer.from(await event.data.arrayBuffer());
            if (buf.length >= 2) {
              const headerLen = buf.readUInt16BE(0);
              if (buf.length >= 2 + headerLen) {
                const header = buf.subarray(2, 2 + headerLen).toString('utf8');
                if (header.includes('Path:audio')) {
                  const audio = buf.subarray(2 + headerLen);
                  if (audio.length > 0) {
                    audioChunks.push(audio);
                  }
                }
              }
            }
          } catch (e) {
            console.error('[TTS WS] Chunk parse error:', e);
          }
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timer);
        reject(err?.error || err || new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        clearTimeout(timer);
        if (audioChunks.length > 0) {
          resolve(Buffer.concat(audioChunks));
        } else {
          reject(new Error('WebSocket closed before receiving audio'));
        }
      };
    } catch (err) {
      if (timer) clearTimeout(timer);
      reject(err);
    }
  });
}

/**
 * Fallback Edge TTS synthesis via edge-tts python engine
 */
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
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`Edge TTS engine process exited with code ${code}: ${errOutput}`));
      }
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
    const raw = text || message || '';
    const clean = cleanTextForSpeech(raw);

    if (!clean) {
      return res.status(400).json({ error: 'No text provided for speech synthesis' });
    }

    let mp3Buffer = null;

    // 1. Direct Edge Neural TTS WebSocket
    try {
      mp3Buffer = await synthesizeViaWebSocket({
        text: clean,
        voice,
        rate
      });
    } catch (wsErr) {
      console.warn('[API /api/tts] WebSocket failed, invoking fallback neural engine:', wsErr?.message || wsErr);
      // 2. High-reliability fallback neural engine
      try {
        mp3Buffer = await synthesizeViaEdgeEngine({
          text: clean,
          voice,
          rate
        });
      } catch (fbErr) {
        console.error('[API /api/tts] Fallback runner also failed:', fbErr?.message || fbErr);
        throw wsErr;
      }
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
