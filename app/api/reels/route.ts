import { NextResponse } from 'next/server';

/**
 * Next.js App Router Route Handler: /api/reels
 * Handles POST requests to ingest reel metadata and GET requests to poll reel stream status.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    return NextResponse.json({
      id,
      status: 'ready',
      message: 'Reel stream is optimized and ready for playback',
      streamUrl: `/api/serve-blob?type=reels&pathname=${encodeURIComponent(id)}`,
    });
  }

  return NextResponse.json({
    status: 'online',
    service: 'NEX_REELS Next.js App Router API',
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      authorId = 'user_anon',
      authorName = 'Primary Profile',
      authorPic = 'favicon.png',
      publishingIdentity = 'primary',
      sourceResolution = null,
    } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Missing required field: videoUrl', code: 'MISSING_VIDEO_URL' },
        { status: 400 }
      );
    }

    if (!publishingIdentity || !['primary', 'creator', 'general', 'custom'].includes(publishingIdentity)) {
      return NextResponse.json(
        { error: 'Invalid publishingIdentity. Must be "primary" or "creator".', code: 'INVALID_IDENTITY' },
        { status: 400 }
      );
    }

    const reelId = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const normalizedIdentity = (publishingIdentity === 'custom' || publishingIdentity === 'creator') ? 'creator' : 'primary';

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
      sound: sound || `Original Audio — @${authorName}`,
      audioUrl: audioUrl || '',
      authorId,
      authorName,
      authorPic,
      publishingIdentity: normalizedIdentity,
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

    return NextResponse.json(
      {
        success: true,
        id: reelId,
        message: 'Reel published to NEX_REELS stream successfully',
        reel: reelRecord,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API /api/reels POST Error]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process reel upload request', code: 'REEL_UPLOAD_ERROR' },
      { status: 500 }
    );
  }
}
