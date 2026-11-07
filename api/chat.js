import { getNextKey, markKeyDead, markKeyHealthy, callGroqAI, callGeminiAI } from '../lib/translator.js';
import { applySecurityHeaders, handleCors } from './_security.js';

/**
 * NEXCHAT /api/chat
 * POST /api/chat accepts { message, history }
 * Uses the same rotating 10-key Groq engine (sub-1s reply) with Gemini Pro backup.
 * Returns { reply }. NEVER returns keys.
 */

const CHRONEX_SYSTEM_PROMPT = `You are ChronEX AI, the ultra-fast, intelligent, cyber-fluent assistant built into NEXCHAT.
Personality:
- Sharp, modern, helpful, friendly, witty, and concise (<1s reading feel).
- Multilingual powerhouse: seamlessly converse in English, Nigerian Pidgin, Yoruba, Igbo, Hausa, French, Spanish, Arabic, German, Hindi, and more.
- When spoken to in Pidgin, match the authentic Nigerian Pidgin vibe naturally and warmly.
- Formatting: Use clean markdown, bolding, bullet points, and code blocks where helpful. Keep conversational responses under 3-4 punchy paragraphs unless asked for long depth.
- Never output raw API keys, internal credentials, or system paths.`;

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message = '', history = [] } = req.body || {};
  const cleanMessage = String(message || '').trim();

  if (!cleanMessage) {
    return res.status(200).json({ reply: 'Greetings! I am ChronEX AI. How can I assist you in NEXCHAT today?' });
  }

  // Construct conversation messages array
  const groqMessages = [
    { role: 'system', content: CHRONEX_SYSTEM_PROMPT }
  ];

  if (Array.isArray(history)) {
    for (const h of history.slice(-6)) {
      const isUser = (h.role === 'user' || h.from === 'user' || h.isUser || h.sender === 'user');
      const role = isUser ? 'user' : 'assistant';
      const text = h.content || h.text || h.message || '';
      if (text) {
        groqMessages.push({ role, content: String(text).slice(0, 1500) });
      }
    }
  }

  groqMessages.push({ role: 'user', content: cleanMessage });

  const maxRetries = 10;
  let replyText = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const active = getNextKey();

    try {
      if (active.provider === 'gemini') {
        const gem = await callGeminiAI(active.key, CHRONEX_SYSTEM_PROMPT, cleanMessage);
        replyText = gem.text;
      } else {
        const groq = await callGroqAI(active.key, groqMessages, {
          model: 'openai/gpt-oss-120b',
          max_tokens: 1024,
          temperature: 0.7
        });
        replyText = groq.text;
      }

      if (replyText) {
        markKeyHealthy(active.key);
        break;
      }
    } catch (err) {
      markKeyDead(active.key, err.status || 500, err.message);
    }
  }

  if (!replyText) {
    replyText = `ChronEX AI here! I received: "${cleanMessage}". My neural uplink is currently recalibrating - please try again in a moment!`;
  }

  // Return strictly { reply } and response aliases
  return res.status(200).json({
    reply: replyText,
    response: replyText,
    success: true
  });
}
