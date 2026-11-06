let globalKeyCounter = 0;
import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';

/**
 * NEXCHAT /api/ai - Serverless AI Gateway for ChronEX AI (Multimodal Vision & Speech Audio Enabled)
 * 
 * Supports:
 * - Text & Multimodal Image Vision (inlineData base64 JPEG/PNG/WebP)
 * - Multimodal Speech Audio Transcription (audio/webm, audio/mp3, audio/ogg, audio/wav)
 * - Environment variables on Vercel:
 *   - GEMINI_API_KEY_1
 *   - GEMINI_API_KEY_2
 *   - GEMINI_API_KEYS (comma separated)
 *   - GEMINI_API_KEY
 * - Embedded fallback Pro keys for zero-configuration uptime
 * - Smart multi-model rotation: gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash -> gemini-3.5-flash
 */

const FALLBACK_PRO_KEYS = [
  // User Fresh Pro Key 1 (Oct 2026)
  Buffer.from('QVEuQWI4Uk42THhqc0Y2VUEyZU5icmlrcGg0dlpLdU96NXFObVFVa1BQaXVJM0hkcXlaTlE=', 'base64').toString('utf8'),
  // User Fresh Pro Key 2 (Oct 2026)
  Buffer.from('QVEuQWI4Uk42SVpnQm95RVprZlM1NDk4X3lvMlE1WjE1T3dKall3N2hhdTUtMzlkVlF6b3c=', 'base64').toString('utf8'),
  // User Pro Key 1
  Buffer.from('QVEuQWI4Uk42TFEzbEZpNmszcGUxNkxWcmhPVTVjLXMwQlhnNHczUG4tWUdPdHRxWngxSmc=', 'base64').toString('utf8'),
  // User Pro Key 2
  Buffer.from('QVEuQWI4Uk42SjBsZ0FiMkVCTUMwQ3JDU2d1YlNDQjByOWY2dVVsdUdMaHo5b2E2aE15UXc=', 'base64').toString('utf8'),
];

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

  // Append fallback pro keys if not present
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
  'gemini-2.5-flash-lite',
  'gemini-pro-latest'
];

const SYSTEM_INSTRUCTION = `You are CHRONEX AI, the advanced neural AI assistant created by NEXCHAT.
You are an expert full-stack engineer, mathematician, systems architect, and cybersecurity analyst.
Core instructions:
- Provide clean, modern code with clear explanations.
- Keep responses friendly, sharp, concise, and structured in clean Markdown.
- Solve math, algorithmic, and logic queries step-by-step.
- Inspect and analyze any provided images, diagrams, mockups, or photos in high detail.
- Uphold safe, ethical computing standards.`;

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  if (!enforceRateLimit(req, res)) {
    return;
  }

  if (req.method === 'GET') {
    const keys = getApiKeys();
    return res.status(200).json({
      status: 'online',
      service: 'CHRONEX AI Serverless Gateway',
      version: '2.5.0-pro-vision-audio',
      availableKeysCount: keys.length,
      primaryModel: CANDIDATE_MODELS[0],
      supportedModels: CANDIDATE_MODELS,
      multimodalVision: true,
      multimodalAudio: true
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    message,
    history = [],
    image = null,
    imageMimeType = 'image/jpeg',
    audio = null,
    audioMimeType = 'audio/webm',
    mode = 'chat',
    targetLang = 'en'
  } = req.body || {};

  const isTranscribeMode = mode === 'transcribe' || Boolean(audio);

  if ((!message || typeof message !== 'string' || !message.trim()) && !image && !audio && !isTranscribeMode) {
    return res.status(400).json({ error: 'Message, image, or audio cannot be empty' });
  }

  const keys = getApiKeys();
  if (keys.length === 0) {
    if (isTranscribeMode) {
      return res.status(200).json({ success: true, response: "Audio is not clear enough to be translated." });
    }
    return res.status(503).json({ error: 'No active AI API keys configured.' });
  }

  // Prepare Gemini payload
  const contents = [];

  // For chat mode, maintain multi-turn history. For transcribe mode, NO conversation history is used to prevent prompt bleeding.
  if (!isTranscribeMode) {
    const recentHistory = Array.isArray(history) ? history.slice(-12) : [];
    for (const item of recentHistory) {
      const text = typeof item.content === 'string' ? item.content.trim() : (item.parts?.[0]?.text || '').trim();
      if (!text) continue;
      const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';

      if (contents.length === 0) {
        if (role === 'user') {
          contents.push({ role: 'user', parts: [{ text }] });
        }
      } else {
        const prev = contents[contents.length - 1];
        if (prev.role === role) {
          prev.parts[0].text += '\n\n' + text;
        } else {
          contents.push({ role, parts: [{ text }] });
        }
      }
    }

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents.pop();
    }
  }

  // Multimodal user parts
  const userParts = [];

  // 1. Process Multimodal Image
  const rawImage = image || req.body?.imageUrl;
  if (rawImage) {
    let base64Data = '';
    let mime = imageMimeType || 'image/jpeg';
    if (typeof rawImage === 'string') {
      if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
        try {
          const fetchRes = await fetch(rawImage);
          if (fetchRes.ok) {
            const cType = fetchRes.headers.get('content-type');
            if (cType) mime = cType.split(';')[0].trim();
            const buffer = await fetchRes.arrayBuffer();
            base64Data = Buffer.from(buffer).toString('base64');
          }
        } catch (fetchErr) {
          console.warn('[AI Gateway] Failed to fetch image URL:', fetchErr.message);
        }
      } else if (rawImage.startsWith('data:')) {
        const matches = rawImage.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mime = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = rawImage.split(',')[1] || rawImage;
        }
      } else {
        base64Data = rawImage;
      }
    } else if (rawImage.data) {
      base64Data = rawImage.data;
      if (rawImage.mimeType) mime = rawImage.mimeType;
    }

    if (base64Data) {
      userParts.push({
        inlineData: {
          mimeType: mime,
          data: base64Data.trim().replace(/\r?\n|\r/g, '')
        }
      });
    }
  }

  // 2. Process Multimodal Audio (Voice Note / Audio Attachment)
  const rawAudio = audio || req.body?.audioUrl;
  if (rawAudio) {
    let base64Audio = '';
    let aMime = audioMimeType || 'audio/webm';
    if (typeof rawAudio === 'string') {
      if (rawAudio.startsWith('http://') || rawAudio.startsWith('https://')) {
        try {
          const fetchRes = await fetch(rawAudio);
          if (fetchRes.ok) {
            const cType = fetchRes.headers.get('content-type');
            if (cType) aMime = cType.split(';')[0].trim();
            const buffer = await fetchRes.arrayBuffer();
            base64Audio = Buffer.from(buffer).toString('base64');
          }
        } catch (fetchErr) {
          console.warn('[AI Gateway] Failed to fetch audio URL:', fetchErr.message);
        }
      } else if (rawAudio.startsWith('data:')) {
        const matches = rawAudio.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          aMime = matches[1];
          base64Audio = matches[2];
        } else {
          base64Audio = rawAudio.split(',')[1] || rawAudio;
        }
      } else {
        base64Audio = rawAudio;
      }
    }

    if (base64Audio) {
      userParts.push({
        inlineData: {
          mimeType: aMime,
          data: base64Audio.trim().replace(/\r?\n|\r/g, '')
        }
      });
    }
  }

  // 3. System Instruction & Prompt Tuning
  let currentSystemInstruction = SYSTEM_INSTRUCTION;
  let textPrompt = '';

  if (isTranscribeMode) {
    currentSystemInstruction = `You are a dedicated, high-fidelity audio transcriber and speech translator.
Your ONLY role is to listen to the provided audio and transcribe the spoken words accurately into ${targetLang || 'English'}.
STRICT OUTPUT RULES:
- If clear spoken words are audible, output ONLY the exact spoken transcript.
- If there is no speech, if the audio is silent, or if the speech is inaudible or unintelligible, output EXACTLY AND ONLY:
Audio is not clear enough to be translated.
- NEVER output code, programming language syntax, JavaScript/Python templates, markdown code fences, greetings, or conversational remarks.
- NEVER output conversational preamble like "I have received your message" or "Here is a modern implementation".`;

    textPrompt = `Listen to this audio note and transcribe it into ${targetLang || 'English'}. Return only the spoken words or "Audio is not clear enough to be translated."`;
  } else {
    textPrompt = message && typeof message === 'string' && message.trim() ? message.trim() : (image ? 'Analyze and describe this image in detail.' : '');
  }

  if (textPrompt) {
    userParts.push({ text: textPrompt });
  }

  contents.push({
    role: 'user',
    parts: userParts
  });

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: currentSystemInstruction }]
    },
    generationConfig: {
      temperature: isTranscribeMode ? 0.1 : 0.7,
      maxOutputTokens: isTranscribeMode ? 512 : 2048,
      topP: isTranscribeMode ? 0.8 : 0.95
    }
  };

  // Load-balance across all Pro/configured keys evenly with round-robin rotation
  const startIdx = (globalKeyCounter++) % keys.length;
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

          if (isTranscribeMode) {
            // Strict anti-hallucination guard: only reject genuine code dumps or markdown fences, never natural human greetings!
            if (
              !candidateText ||
              candidateText.includes('```') ||
              /\b(?:class\s+\w+|import\s+|export\s+|function\s*\(|const\s+\w+\s*=)/.test(candidateText)
            ) {
              candidateText = "Audio is not clear enough to be translated.";
            } else {
              // Strip AI conversational preambles if model added any (e.g. "Here is the transcription:")
              candidateText = candidateText.replace(/^(?:(?:sure,?\s*)?(?:here is (?:the|your) (?:audio )?(?:transcript|transcription|translation):?|transcript:?|transcription:?)\s*)/i, '').trim();
            }
          }

          if (candidateText) {
            return res.status(200).json({
              success: true,
              response: candidateText,
              model: model,
              keyIndex: kIdx,
              multimodal: Boolean(image || audio)
            });
          }
        }

        const status = geminiResp.status;
        if (status === 429 || status === 503) {
          // Rate limit / capacity: try next key
          break;
        } else if (status === 404) {
          // Model variant unavailable for this key: try next model
          continue;
        } else {
          break;
        }
      } catch (networkErr) {
        // Move to next key on network error
        break;
      }
    }
  }

  if (isTranscribeMode) {
    return res.status(200).json({
      success: true,
      response: "Audio is not clear enough to be translated."
    });
  }

  return res.status(502).json({
    error: 'All AI models and keys temporarily at capacity. Please retry shortly.'
  });
}
