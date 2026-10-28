import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';

/**
 * NEXCHAT /api/ai - Serverless AI Gateway for ChronEX AI (Multimodal Vision Enabled)
 * 
 * Supports:
 * - Text & Multimodal Image Vision (inlineData base64 JPEG/PNG/WebP)
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
  'gemini-1.5-pro'
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
      version: '2.5.0-pro-vision',
      availableKeysCount: keys.length,
      primaryModel: CANDIDATE_MODELS[0],
      supportedModels: CANDIDATE_MODELS,
      multimodalVision: true
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [], image = null, imageMimeType = 'image/jpeg' } = req.body || {};
  if ((!message || typeof message !== 'string' || !message.trim()) && !image) {
    return res.status(400).json({ error: 'Message or image cannot be empty' });
  }

  const keys = getApiKeys();
  if (keys.length === 0) {
    return res.status(503).json({ error: 'No active AI API keys configured.' });
  }

  // Prepare Gemini payload
  const contents = [];
  const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
  for (const item of recentHistory) {
    const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';
    if (item.content) {
      contents.push({
        role,
        parts: [{ text: String(item.content) }]
      });
    }
  }

  // Multimodal user parts
  const userParts = [];
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

  const textPrompt = message && typeof message === 'string' && message.trim() ? message.trim() : (image ? 'Analyze and describe this image in detail.' : '');
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
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topP: 0.95
    }
  };

  // Try keys and models in order
  for (let kIdx = 0; kIdx < keys.length; kIdx++) {
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
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return res.status(200).json({
              success: true,
              response: candidateText,
              model: model,
              keyIndex: kIdx,
              multimodal: Boolean(image)
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

  return res.status(502).json({
    error: 'All AI models and keys temporarily at capacity. Please retry shortly.'
  });
}
