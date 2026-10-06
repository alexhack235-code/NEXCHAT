import { NextResponse } from 'next/server';

/**
 * Next.js App Router Route Handler: /api/reels
 * Handles POST requests to ingest reel metadata and GET requests to poll reel stream status or retrieve the feed.
 */

export interface ReelRecord {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  rawBlobUrl?: string;
  pathname?: string;
  vault?: string;
  vaultIndex?: number;
  access?: string;
  duration?: number;
  qualityMode?: string;
  caption?: string;
  sound?: string;
  audioUrl?: string;
  authorId?: string;
  authorName?: string;
  authorPic?: string;
  publishingIdentity?: string;
  sourceResolution?: { width: number; height: number } | null;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  viewsCount?: number;
  poll?: {
    question: string;
    options: Array<{ text: string; votes: number }>;
  } | null;
  hasBounty?: boolean;
  bountyAmount?: number;
  status: string;
  createdAt: string;
}

// Global in-memory feed initialized with seed reels so feed is never empty
const storedReels: ReelRecord[] = [
  {
    id: 'seed-reel-chronex-ai',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/hourglass_timer.mp4',
    thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/hourglass_timer.jpg',
    authorId: 'chronex_ai',
    authorName: 'ChronEX AI',
    authorPic: 'chronex-ai.jpg',
    caption: 'ChronEX AI v4.0 is now live across NEXCHAT! Real-time neural models, code debugging, and instant multi-language translation. #ChronEX #AI #FutureTech #NEXCHAT',
    sound: 'Quantum Neural Drift — NEX_Records',
    qualityMode: 'fhd',
    duration: 15,
    likesCount: 48200,
    commentsCount: 3,
    sharesCount: 9100,
    viewsCount: 194000,
    publishingIdentity: 'creator',
    poll: {
      question: 'Which ChronEX AI model do you use most?',
      options: [
        { text: '⚡ Ultra Fast (Lite)', votes: 142 },
        { text: '🧠 Deep Neural (Flash)', votes: 89 },
      ],
    },
    hasBounty: true,
    bountyAmount: 10,
    status: 'published',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-reel-gaming-hub',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/finish_line.mp4',
    thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/finish_line.jpg',
    authorId: 'pixel_warlord',
    authorName: 'Pixel Warlord',
    authorPic: 'chronex-ai.jpg',
    caption: 'Sprint to the finish in the NEX Gaming Hub Grand Finals! Down to 0.2 seconds on the clock. #GamingHub #Esports #Clutch #Speedrun #NEXCHAT',
    sound: 'Cyberpunk Drift Phonk — DEMON_BEATS',
    qualityMode: 'fhd',
    duration: 22,
    likesCount: 72400,
    commentsCount: 3,
    sharesCount: 14800,
    viewsCount: 320000,
    publishingIdentity: 'creator',
    poll: {
      question: 'Who wins the rematch tonight?',
      options: [
        { text: '🎮 Pixel Warlord', votes: 68 },
        { text: '🔥 Steve FPS', votes: 44 },
      ],
    },
    hasBounty: true,
    bountyAmount: 10,
    status: 'published',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-reel-motion-design',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/wave.mp4',
    thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/wave.jpg',
    authorId: 'motion_nexus',
    authorName: 'Motion Nexus',
    authorPic: 'logo.jpg',
    caption: 'Liquid neon physics simulation rendered with GPU particles. 60 FPS fluid dynamics study for our new NEX UI theme. #MotionDesign #3D #Blender #UIUX #CyberAesthetics',
    sound: 'Midnight City Glide — K-Trap Labs',
    qualityMode: '4k',
    duration: 18,
    likesCount: 56100,
    commentsCount: 3,
    sharesCount: 8700,
    viewsCount: 242000,
    publishingIdentity: 'creator',
    poll: {
      question: 'Want liquid neon live wallpapers in NEXCHAT?',
      options: [
        { text: '💎 YES 100%', votes: 312 },
        { text: '🖤 Keep Onyx Dark', votes: 28 },
      ],
    },
    status: 'published',
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const found = storedReels.find((r) => r.id === id);
    if (found) {
      return NextResponse.json({
        id: found.id,
        status: 'ready',
        message: 'Reel stream is optimized and ready for playback',
        streamUrl: found.videoUrl,
        reel: found,
      });
    }
    return NextResponse.json(
      { error: 'Reel not found', code: 'REEL_NOT_FOUND' },
      { status: 404 }
    );
  }

  // Return the full feed of reels
  return NextResponse.json({
    status: 'online',
    service: 'CamShot Stream API',
    count: storedReels.length,
    reels: storedReels,
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
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
      poll = null,
      hasBounty = false,
      bountyAmount = 0,
    } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Missing required field: videoUrl', code: 'MISSING_VIDEO_URL' },
        { status: 400 }
      );
    }

    // Gracefully normalize publishing identity without throwing a 400 error
    const normalizedIdentity =
      publishingIdentity === 'custom' || publishingIdentity === 'creator'
        ? 'creator'
        : 'primary';

    const reelId = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const reelRecord: ReelRecord = {
      id: reelId,
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      rawBlobUrl: rawBlobUrl || videoUrl,
      pathname: pathname || '',
      vault,
      vaultIndex: Number(vaultIndex) || 0,
      access,
      duration: typeof duration === 'number' ? duration : parseFloat(duration) || 0,
      qualityMode,
      caption: (caption || '').trim(),
      sound: sound || `Original Audio — @${authorName}`,
      audioUrl: audioUrl || '',
      authorId: authorId || 'user_anon',
      authorName: authorName || 'Creator',
      authorPic: authorPic || 'favicon.png',
      publishingIdentity: normalizedIdentity,
      sourceResolution: sourceResolution
        ? {
            width: Number(sourceResolution.width) || 0,
            height: Number(sourceResolution.height) || 0,
          }
        : null,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 1,
      poll: poll && poll.question ? poll : null,
      hasBounty: Boolean(hasBounty),
      bountyAmount: hasBounty ? (Number(bountyAmount) || 10) : 0,
      status: 'published',
      createdAt: new Date().toISOString(),
    };

    // Prepend to active feed store
    storedReels.unshift(reelRecord);

    return NextResponse.json(
      {
        success: true,
        id: reelId,
        message: 'Reel published to CamShot stream successfully',
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
