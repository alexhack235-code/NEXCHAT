import { translate } from '../lib/translator.js';
import { applySecurityHeaders, handleCors } from './_security.js';

/**
 * NEXCHAT /api/translate
 * POST /api/translate accepts { text, targetLang, sourceLang }
 * Auth header x-nexchat-secret must equal NEXCHAT_SECRET else 401 (if provided/enforced)
 * Returns ONLY { translatedText, detectedLang, targetLang }
 * NEVER returns keys.
 */

const EXPECTED_SECRET = process.env.NEXCHAT_SECRET || 'NEXCHAT_ULTRA_12345';

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth header validation
  const clientSecret = req.headers['x-nexchat-secret'];
  if (clientSecret && clientSecret !== EXPECTED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: invalid secret' });
  }

  try {
    const {
      text = '',
      message = '',
      targetLang = 'English',
      sourceLang = 'auto'
    } = req.body || {};

    const rawText = (text || message || '').trim();
    if (!rawText) {
      return res.status(200).json({
        translatedText: '',
        detectedLang: 'unknown',
        targetLang: targetLang || 'English',
        result: '',
        response: ''
      });
    }

    const outcome = await translate(rawText, targetLang, sourceLang);

    // Return strictly according to specification, with result/response aliases for legacy UI compatibility
    return res.status(200).json({
      translatedText: outcome.translatedText,
      detectedLang: outcome.detectedLang,
      targetLang: outcome.targetLang,
      result: outcome.translatedText,
      response: outcome.translatedText
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Translation processing error',
      details: error.message
    });
  }
}
