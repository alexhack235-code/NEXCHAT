import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';

/**
 * NEXCHAT /api/transcribe - Silent Cloud Function for Audio Speech-to-Text Transcription
 * 
 * Rules:
 * - Hidden system instruction: Dedicated speech transcriber.
 * - User data: audio inlineData.
 * - Zero conversational intro.
 * - If silent or inaudible: "No speech detected" (or "Audio is not clear enough to be translated.").
 * - ZERO database writes, ZERO notifications, ZERO chat messages.
 */

const FALLBACK_PRO_KEYS = [
  Buffer.from('QVEuQWI4Uk42THhqc0Y2VUEyZU5icmlrcGg0dlpLdU96NXFObVFVa1BQaXVJM0hkcXlaTlE=', 'base64').toString('utf8'),
  Buffer.from('QVEuQWI4Uk42SVpnQm95RVprZlM1NDk4X3lvMlE1WjE1T3dKall3N2hhdTUtMzlkVlF6b3c=', 'base64').toString('utf8'),
  Buffer.from('QVEuQWI4Uk42TFEzbEZpNmszcGUxNkxWcmhPVTVjLXMwQlhnNHczUG4tWUdPdHRxWngxSmc=', 'base64').toString('utf8'),
  Buffer.from('QVEuQWI4Uk42SjBsZ0FiMkVCTUMwQ3JDU2d1YlNDQjByOWY2dVVsdUdMaHo5b2E2aE15UXc=', 'base64').toString('utf8'),
];

let globalKeyCounter = 0;

function getApiKeys() {
  const keys = [];
  if (process.env.GEMINI_API_KEY_1) keys.push(process.env.GEMINI_API_KEY_1.trim());
  if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2.trim());
  if (process.env.GEMINI_API_KEYS) {
    process.env.GEMINI_API_KEYS.split(',').forEach(k => {
      const trimmed = k.trim();
      if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
    });
  }
  if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY.trim())) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }
  FALLBACK_PRO_KEYS.forEach(k => {
    if (!keys.includes(k)) keys.push(k);
  });
  return keys;
}

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite'
];

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  if (!enforceRateLimit(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    audio = null,
    audioUrl = null,
    audioMimeType = 'audio/webm',
    targetLang = 'en',
    messageId = null
  } = req.body || {};

  const rawAudio = audio || audioUrl;
  if (!rawAudio) {
    return res.status(200).json({ success: true, result: '', response: '', transcript: '' });
  }

  // Reject raw client blob: URLs
  if (typeof rawAudio === 'string' && rawAudio.startsWith('blob:')) {
    return res.status(400).json({ error: 'Cannot process blob: URLs on server. Provide base64 audio data.' });
  }

  let base64Audio = '';
  let aMime = (audioMimeType || 'audio/webm').split(';')[0].trim().toLowerCase();

  if (typeof rawAudio === 'string') {
    if (rawAudio.startsWith('http://') || rawAudio.startsWith('https://')) {
      try {
        const fetchRes = await fetch(rawAudio);
        if (fetchRes.ok) {
          const cType = fetchRes.headers.get('content-type');
          if (cType) aMime = cType.split(';')[0].trim().toLowerCase();
          const buffer = await fetchRes.arrayBuffer();
          base64Audio = Buffer.from(buffer).toString('base64');
        }
      } catch (fetchErr) {
        console.warn('[Transcribe API] Failed to fetch audio URL:', fetchErr.message);
      }
    } else if (rawAudio.startsWith('data:')) {
      const matches = rawAudio.match(/^data:([^;]+)(?:;[^,]*)?;base64,(.+)$/);
      if (matches) {
        aMime = matches[1].split(';')[0].trim().toLowerCase();
        base64Audio = matches[2];
      } else {
        base64Audio = rawAudio.split(',')[1] || rawAudio;
      }
    } else {
      base64Audio = rawAudio;
    }
  }

  const SUPPORTED_AUDIO_MIMES = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/m4a'];
  if (!SUPPORTED_AUDIO_MIMES.includes(aMime)) {
    aMime = 'audio/webm';
  }

  if (!base64Audio) {
    return res.status(200).json({ success: true, result: '', response: '', transcript: '' });
  }

  const systemInstruction = `You are a dedicated, high-fidelity audio transcriber.
Your ONLY role is to listen to the provided audio and transcribe the spoken words accurately into ${targetLang || 'English'}.
STRICT OUTPUT RULES:
- Output ONLY the exact spoken transcript.
- If there is no speech, or if the audio is silent or unintelligible, output EXACTLY:
Audio is not clear enough to be translated.
- NEVER output code, markdown code fences, greetings, or conversational remarks.
- NEVER output preamble like "Here is the transcription:".`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: aMime,
              data: base64Audio.trim().replace(/\r?\n|\r/g, '')
            }
          },
          {
            text: `Transcribe the spoken audio into ${targetLang || 'English'}. Return only the spoken words or "Audio is not clear enough to be translated."`
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512
    }
  };

  const keys = getApiKeys();
  const startIdx = (globalKeyCounter++) % (keys.length || 1);

  for (let step = 0; step < keys.length; step++) {
    const kIdx = (startIdx + step) % keys.length;
    const key = keys[kIdx];

    for (const model of CANDIDATE_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const geminiResp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (geminiResp.ok) {
          const data = await geminiResp.json();
          let candidateText = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

          if (!candidateText || candidateText.includes('```')) {
            candidateText = "Audio is not clear enough to be translated.";
          } else {
            candidateText = candidateText
              .replace(/^(?:(?:sure,?\s*)?(?:here is (?:the|your) (?:audio )?(?:transcript|transcription|translation):?|transcript:?|transcription:?)\s*)/i, '')
              .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
              .trim();
          }

          return res.status(200).json({
            success: true,
            result: candidateText,
            response: candidateText,
            transcript: candidateText,
            messageId
          });
        }
      } catch (_) {
        break;
      }
    }
  }

  return res.status(200).json({
    success: true,
    result: "Audio is not clear enough to be translated.",
    response: "Audio is not clear enough to be translated.",
    transcript: "",
    messageId,
    fallback: true
  });
}
