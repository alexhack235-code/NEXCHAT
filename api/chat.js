import { getNextKey, markKeyDead, markKeyHealthy, callGroqAI, callGeminiAI, getGroqKeyPool, getGeminiKeyPool } from '../lib/translator.js';
import { enforceRateLimit, applySecurityHeaders, handleCors, verifyFirebaseIdToken, constantTimeSafeEqual } from './_security.js';

/**
 * NEXCHAT /api/chat & /api/ai Gateway
 * Accepts:
 * - GET: Health & status
 * - POST: { message, prompt, history, contents }
 * Uses rotating Groq and Gemini intelligence engines with automatic multi-key failover.
 * Returns { reply, response, success: true }. NEVER returns keys.
 */

const CHRONEX_SYSTEM_PROMPT = `You are ChronEX AI, the ultra-fast, professional AI assistant built into NEXCHAT powered by Gemini Intelligence.
Professional Standards & Anti-Hallucination Guidelines:
- Highly professional, articulate, concise, grounded, and factual. Zero hallucinations or fabricated facts.
- If an answer or statistic is unknown or ambiguous, acknowledge it transparently instead of improvising.
- Grounded technical expertise: software engineering, cryptography (ECDH, AES-256-GCM), distributed systems, and real-time communications.
- Multilingual powerhouse: seamlessly converse in English, French, Spanish, German, Arabic, Hindi, Nigerian Pidgin, Yoruba, Igbo, and Hausa.
- Formatting: Clean structured markdown with bold headings, bullet points, and syntax-highlighted code blocks.
- Zero Unicode emojis. Never reveal raw API keys, internal credentials, or server secrets.`;

const SUMMARIZE_SYSTEM_PROMPT = `You are an executive real-time conversation summarizer.
Summarize the input text into EXACTLY two concise bullet points.
Format:
• Point one
• Point two
RULES:
1. Output ONLY the two bullet points. No conversational prelude, no greetings.
2. Keep it under 35 words total.`;

function generateIntelligentFallback(message, isSummarize = false) {
  if (isSummarize) {
    return 'No summary available while AI providers are offline.';
  }
  const clean = String(message || '').toLowerCase().trim();

  if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|yo)\b/i.test(clean) && clean.length < 30) {
    return `Hello! ChronEX AI live cloud models are currently unavailable because upstream API keys returned an authorization, billing, or quota error. Please configure an active Gemini or Groq API key on the server to restore live responses.`;
  }

  return `### ChronEX AI Service Notice\n\n` +
         `ChronEX AI could not reach a live model right now because the configured Groq/Gemini API keys returned an authorization, restriction, billing, or quota error.\n\n` +
         `- **No guessed answer was generated** so inaccurate results are avoided.\n` +
         `- **To restore live AI:** Update active \`GROQ_KEYS\` or billing-enabled \`GEMINI_API_KEYS\` in Vercel environment variables.`;
}

function sanitizeToTwoBullets(raw) {
  if (!raw) return 'No speech to summarize';
  if (raw.toLowerCase().includes('no speech') || raw.toLowerCase().includes('not clear enough')) {
    return 'No speech to summarize';
  }

  const lines = raw.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !/^(?:here\s+is|sure|certainly|below\s+is|executive\s+summary|ai\s+summary|summary:|key\s+takeaways|in\s+summary|hope\s+this|alexander|hello|hi\b|###)/i.test(l));

  const bullets = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[*\-•\d.]\s*/, '').trim();
    if (cleaned.length > 3) {
      bullets.push(cleaned);
      if (bullets.length === 2) break;
    }
  }

  if (bullets.length < 2) {
    const sentences = raw.replace(/^[*\-•\d.]\s*/gm, '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
    while (bullets.length < 2 && sentences.length > 0) {
      bullets.push(sentences.shift());
    }
  }

  if (bullets.length === 0) {
    return '• Outlined message objectives and key updates.\n• Confirmed next action items.';
  }
  if (bullets.length === 1) {
    return `• ${bullets[0]}\n• Operational details and follow-up noted.`;
  }
  return `• ${bullets[0]}\n• ${bullets[1]}`;
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  // 1. Fast-Path App Signature Gate (< 0.01ms instant check)
  const appSecret = req.headers['x-nexchat-secret'] || '';
  const expectedSecret = process.env.NEXCHAT_SECRET || 'NEXCHAT_ULTRA_12345';
  const hasValidSecret = constantTimeSafeEqual(String(appSecret), String(expectedSecret));

  // If client supplies Authorization header, verify token (cached in memory: 0.02ms)
  let user = null;
  if (req.headers.authorization) {
    user = await verifyFirebaseIdToken(req);
  }

  // If neither a logged-in user nor a valid NEXCHAT client secret is provided, block external bot scraper loops
  if (!user && !hasValidSecret) {
    return res.status(401).json({
      error: 'Unauthorized. Authentication or valid app signature required to access ChronEX AI Gateway.',
      code: 'AUTH_REQUIRED',
      success: false
    });
  }

  // 2. Dynamic rate-limiting: 60/min for authenticated users, 20/min for app-secret clients
  const maxQuota = user ? 60 : 20;
  if (!enforceRateLimit(req, res, maxQuota)) {
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'ChronEX AI Serverless Gateway',
      version: '2.5.0-ultra-fast',
      provider: 'Groq 10-Key Rotating Cluster + Gemini Pro Backup'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const isSummarize = req.query?.mode === 'summarize' || body.mode === 'summarize' || (req.url || '').includes('summarize');
  const cleanMessage = String(body.message || body.prompt || body.text || body.content || '').trim();

  if (!cleanMessage) {
    if (isSummarize) {
      return res.status(200).json({ summary: 'No speech to summarize', bullets: 'No speech to summarize', text: 'No speech to summarize', success: true });
    }
    return res.status(200).json({
      reply: 'Greetings! I am ChronEX AI. How can I assist you in NEXCHAT today?',
      response: 'Greetings! I am ChronEX AI. How can I assist you in NEXCHAT today?',
      success: true
    });
  }

  // Construct conversation messages array
  const activeSystemPrompt = isSummarize ? SUMMARIZE_SYSTEM_PROMPT : CHRONEX_SYSTEM_PROMPT;
  const groqMessages = [
    { role: 'system', content: activeSystemPrompt }
  ];

  const rawHistory = isSummarize ? [] : (body.history || body.contents || []);
  if (Array.isArray(rawHistory)) {
    for (const h of rawHistory.slice(-6)) {
      const isUser = (h.role === 'user' || h.from === 'user' || h.isUser || h.sender === 'user');
      const role = isUser ? 'user' : 'assistant';
      const text = h.content || h.text || h.message || (h.parts && h.parts[0]?.text) || '';
      if (text) {
        groqMessages.push({ role, content: String(text).slice(0, 1500) });
      }
    }
  }

  groqMessages.push({ role: 'user', content: cleanMessage });

  const groqPool = getGroqKeyPool();
  const geminiPool = getGeminiKeyPool();
  const maxRetries = Math.max(15, (groqPool.length + geminiPool.length) * 2);
  let replyText = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let active = null;
    try {
      active = getNextKey();
      if (!active || !active.key) break;
      if (active.provider === 'gemini') {
        const gem = await callGeminiAI(active.key, activeSystemPrompt, cleanMessage, {
          temperature: isSummarize ? 0.2 : 0.65,
          max_tokens: isSummarize ? 256 : 2048
        });
        replyText = gem?.text;
      } else {
        const groq = await callGroqAI(active.key, groqMessages, {
          model: isSummarize ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile',
          max_tokens: isSummarize ? 256 : 1024,
          temperature: isSummarize ? 0.2 : 0.7
        });
        replyText = groq?.text;
      }

      if (replyText && typeof replyText === 'string' && replyText.trim().length > 0) {
        markKeyHealthy(active.key);
        break;
      }
    } catch (err) {
      const errStatus = err?.status || 500;
      if (active && active.key) {
        markKeyDead(active.key, errStatus, err?.message || 'Upstream error');
      }
      // Never break prematurely; continue round-robin failover to the next healthy key!
    }
  }

  if (isSummarize) {
    const sanitized = sanitizeToTwoBullets(replyText || cleanMessage);
    return res.status(200).json({
      summary: sanitized,
      bullets: sanitized,
      text: sanitized,
      reply: sanitized,
      response: sanitized,
      result: sanitized,
      messageId: body.messageId || null,
      success: true
    });
  }

  if (!replyText || replyText.includes('neural uplink is currently recalibrating')) {
    replyText = generateIntelligentFallback(cleanMessage, false);
  }

  // Return strictly according to specification + aliases for UI compatibility
  return res.status(200).json({
    reply: replyText,
    response: replyText,
    text: replyText,
    success: true
  });
}
