import chatHandler from './chat.js';

/**
 * NEXCHAT /api/ai Vercel Serverless Gateway
 * Direct proxy alias to /api/chat
 */
export default async function handler(req, res) {
  return await chatHandler(req, res);
}
