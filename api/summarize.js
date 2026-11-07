import { getNextKey, markKeyDead, markKeyHealthy, callGroqAI, callGeminiAI } from '../lib/translator.js';
import { enforceRateLimit, applySecurityHeaders, handleCors } from './_security.js';

/**
 * NEXCHAT /api/summarize - Silent Cloud Function for Executive Voice / Text Summarization
 * 
 * Rules:
 * - Hidden system instruction: Exactly 2 bullet points starting with "• ".
 * - Zero greeting, zero "I have received", zero "I am fully synchronized".
 * - If speech/content is empty: "No speech to summarize".
 * - ZERO database writes, ZERO notifications, ZERO chat messages.
 */

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

  if (!enforceRateLimit(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    text = '',
    message = '',
    messageId = null
  } = req.body || {};

  const cleanText = (text || message || '').trim();
  if (!cleanText || cleanText.toLowerCase().includes('no speech detected') || cleanText.toLowerCase().includes('not clear enough')) {
    return res.status(200).json({
      success: true,
      result: 'No speech to summarize',
      response: 'No speech to summarize',
      messageId
    });
  }

  const systemInstruction = `You are an executive voice note summarizer.
Your ONLY task is to summarize the provided transcript into EXACTLY 2 concise bullet points.
STRICT RULES:
- Output ONLY 2 bullet points, each starting with "• ".
- Zero conversational intro, zero greeting, zero pleasantries, zero closing.
- Do NOT say "I have received", "I am ready", "Here is the summary", or "ChronEX Neural Cognition".
- If the content has no meaningful speech or is blank, return "No speech to summarize".`;

  const userPrompt = `Transcript to summarize into 2 bullets:\n"${cleanText}"`;

  // Rotate through keys
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const active = getNextKey();

    try {
      let rawText = '';
      if (active.provider === 'gemini') {
        const gem = await callGeminiAI(active.key, systemInstruction, userPrompt);
        rawText = gem.text;
      } else {
        const groq = await callGroqAI(active.key, [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ], {
          max_tokens: 256,
          temperature: 0.1
        });
        rawText = groq.text;
      }

      if (rawText) {
        const cleanSummary = sanitizeToTwoBullets(rawText);
        markKeyHealthy(active.key);
        return res.status(200).json({
          success: true,
          result: cleanSummary,
          response: cleanSummary,
          messageId
        });
      }
    } catch (err) {
      if (err.status === 429 || err.status === 401 || err.status === 408) {
        markKeyDead(active.key, err.status || 500, err.message);
      }
    }
  }

  // Fallback 2-bullet extraction from text
  const localFallback = sanitizeToTwoBullets(cleanText);
  return res.status(200).json({
    success: true,
    result: localFallback,
    response: localFallback,
    messageId,
    fallback: true
  });
}
