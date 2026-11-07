import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';

/**
 * NEXCHAT /api/translate - Silent Cloud Function for Machine Translation
 * 
 * Rules:
 * - Hidden system instruction: Direct translation only. No intro, no conversational filler, no quotes.
 * - User data: ONLY the text to translate.
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
    text = '',
    message = '',
    targetLang = 'en',
    messageId = null
  } = req.body || {};

  const cleanText = (text || message || '').trim();
  if (!cleanText) {
    return res.status(200).json({ success: true, result: '', response: '' });
  }

  // Hidden System Instruction: Separate from User Message!
  const systemInstruction = `You are a professional, direct neural translator.
Your ONLY task is to return the exact translation into ${targetLang || 'English'}.
STRICT RULES:
- Return ONLY the direct translation.
- No introduction, no conversational filler.
- Do NOT say "I have received", "I am ready", "Here is the translation", or similar greetings.
- Do NOT wrap in quotes.
- Do NOT explain your output.
- Do NOT output code or markdown formatting.`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: cleanText }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024
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
          
          // Clean quotes, code blocks, or greetings if any slipped through
          candidateText = candidateText
            .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
            .replace(/^(?:(?:here\s+is\s+(?:the\s+)?translation:?|translation:?)\s*)/i, '')
            .trim();

          if (candidateText) {
            return res.status(200).json({
              success: true,
              result: candidateText,
              response: candidateText,
              targetLang,
              messageId
            });
          }
        }
      } catch (_) {
        break;
      }
    }
  }

  // Local fallback: Return clean text if remote API fails
  return res.status(200).json({
    success: true,
    result: cleanText,
    response: cleanText,
    targetLang,
    fallback: true
  });
}
