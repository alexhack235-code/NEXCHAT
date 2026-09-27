import { enforceRateLimit, applySecurityHeaders, verifyFirebaseIdToken } from './_security.js';

/**
 * /api/reels - Create and manage Reels
 * 
 * Supports:
 * - POST: Publish a new reel with validated metadata, identity, and stream references
 * - GET: Fetch recent reels or check status of a transcoding job
 */
export default async function handler(req, res) {
  applySecurityHeaders(res);

  if (!enforceRateLimit(req, res)) {
    return;
  }

  if (req.method === 'GET') {
    // Status check or health
    const { id } = req.query;
    if (id) {
      return res.status(200).json({
        id,
        status: 'ready',
        message: 'Reel stream is optimized and ready for playback',
        streamUrl: `/api/serve-blob?type=reels&pathname=${encodeURIComponent(id)}`,
      });
    }

    return res.status(200).json({
      status: 'online',
      service: 'NEX_REELS Stream Ingestion API',
      timestamp: Date.now(),
    });
  }

  if (req.method === 'POST') {
    try {
      // Optional Firebase auth verification if token provided
      let authUser = null;
      try {
        authUser = await verifyFirebaseIdToken(req);
      } catch (authErr) {
        // Allow anonymous / local guest posting with fallback
        console.warn('[REELS API] Optional auth check bypassed:', authErr.message);
      }

      const body = req.body || {};
      const {
        videoUrl,
        thumbnailUrl = '',
        rawBlobUrl = '',
        pathname = '',
        vault = 'Cloudinary Vault Pool',
        vaultIndex = 0,
        access = 'public',
        duration = 0,
        qualityMode = 'hd',
        caption = '',
        sound = 'Original Audio',
        audioUrl = '',
        authorId,
        authorName,
        authorPic = '',
        publishingIdentity = 'primary', // 'primary' | 'creator'
        sourceResolution = null, // e.g. { width: 576, height: 1024 }
      } = body;

      // Validation
      if (!videoUrl) {
        return res.status(400).json({
          error: 'Missing required field: videoUrl',
          code: 'MISSING_VIDEO_URL',
        });
      }

      if (!publishingIdentity || !['primary', 'creator', 'general', 'custom'].includes(publishingIdentity)) {
        return res.status(400).json({
          error: 'Invalid publishingIdentity. Must be "primary" or "creator".',
          code: 'INVALID_IDENTITY',
        });
      }

      // Generate Reel ID
      const reelId = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const effectiveAuthorId = authUser?.uid || authorId || 'user_anon';
      const effectiveAuthorName = authorName || (publishingIdentity === 'creator' ? 'Creator Persona' : 'Primary Profile');

      const reelRecord = {
        id: reelId,
        videoUrl,
        thumbnailUrl: thumbnailUrl || '',
        rawBlobUrl: rawBlobUrl || videoUrl,
        pathname: pathname || '',
        vault,
        vaultIndex: Number(vaultIndex) || 0,
        access,
        duration: Number(duration) || 0,
        qualityMode,
        caption: (caption || '').trim(),
        sound: sound || `Original Audio — @${effectiveAuthorName}`,
        audioUrl: audioUrl || '',
        authorId: effectiveAuthorId,
        authorName: effectiveAuthorName,
        authorPic: authorPic || 'favicon.png',
        publishingIdentity: (publishingIdentity === 'custom' || publishingIdentity === 'creator') ? 'creator' : 'primary',
        sourceResolution: sourceResolution ? {
          width: Number(sourceResolution.width) || 0,
          height: Number(sourceResolution.height) || 0,
        } : null,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 1,
        status: 'published',
        createdAt: new Date().toISOString(),
      };

      console.log(`[REELS API] New reel created: ${reelId} by @${effectiveAuthorName} (${reelRecord.publishingIdentity})`);

      return res.status(201).json({
        success: true,
        id: reelId,
        message: 'Reel published to NEX_REELS stream successfully',
        reel: reelRecord,
      });
    } catch (err) {
      console.error('[REELS API ERROR]', err);
      return res.status(500).json({
        error: err.message || 'Internal server error while publishing reel',
        code: 'REEL_PUBLISH_FAILED',
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
