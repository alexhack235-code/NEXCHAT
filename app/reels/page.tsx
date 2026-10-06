'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================
export interface ReelItem {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  isFollowing?: boolean;
  caption: string;
  hashtags: string[];
  soundTitle: string;
  soundArtist: string;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  qualityBadge?: string;
}

// Initial realistic fallback data for high-velocity playback
const INITIAL_REELS: ReelItem[] = [
  {
    id: 'reel_nullsec_01',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-a-futuristic-city-at-night-42352-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
    authorId: 'nullsec_core',
    authorName: 'Nullsec',
    authorHandle: 'Nullsec',
    authorAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&h=200&q=80',
    isFollowing: false,
    caption: 'Running zero-knowledge telemetry across distributed neural clusters. Rate this setup 1-10! #Nullsec #stopchatcontrol #cyberpunk #nexchat #4k60fps',
    hashtags: ['#Nullsec', '#stopchatcontrol', '#cyberpunk', '#nexchat'],
    soundTitle: 'Original Sound — Nullsec',
    soundArtist: 'Nullsec',
    likesCount: 12100,
    commentsCount: 499,
    bookmarksCount: 1700,
    sharesCount: 952,
    isLiked: false,
    isBookmarked: false,
    qualityBadge: '4K 60FPS',
  },
  {
    id: 'reel_alexander_02',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-code-and-data-on-a-computer-monitor-in-a-dark-room-42867-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    authorId: 'alexander_dev',
    authorName: 'Alexander',
    authorHandle: 'alexandergamedeveloper74',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
    isFollowing: true,
    caption: 'Compiling Unreal 5.4 procedural shaders in 4K Ultra HD. Lossless keyframes running smoothly on the NEX stream protocol #gaming #tech #cyberpunk',
    hashtags: ['#gaming', '#tech', '#cyberpunk', '#4k'],
    soundTitle: 'Cyber Drift 2077 (Remix)',
    soundArtist: 'ChronEX Synth',
    likesCount: 28400,
    commentsCount: 1120,
    bookmarksCount: 4320,
    sharesCount: 2410,
    isLiked: true,
    isBookmarked: false,
    qualityBadge: '1080p FHD',
  },
  {
    id: 'reel_cyber_03',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-keyboard-41382-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    authorId: 'cyber_vortex',
    authorName: 'Vortex Protocol',
    authorHandle: 'vortex_protocol',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
    isFollowing: false,
    caption: 'End-to-end encrypted WebSocket telemetry verified. Hardware terminal controls linked with ChronEX Companion #nexchat #tech #viral',
    hashtags: ['#nexchat', '#tech', '#viral'],
    soundTitle: 'Neural Static (Bass Boost)',
    soundArtist: 'HoloByte',
    likesCount: 8430,
    commentsCount: 312,
    bookmarksCount: 920,
    sharesCount: 415,
    isLiked: false,
    isBookmarked: true,
    qualityBadge: '720p HD',
  },
];

export default function ReelsFeedPage() {
  const [reels, setReels] = useState<ReelItem[]>(INITIAL_REELS);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'following' | 'friends' | 'foryou'>('foryou');
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState<boolean>(false);
  const [activeCommentsReel, setActiveCommentsReel] = useState<ReelItem | null>(null);
  const [commentInputText, setCommentInputText] = useState<string>('');
  const [commentsList, setCommentsList] = useState<Array<{ id: string; user: string; avatar: string; text: string; time: string; likes: number }>>([
    { id: 'c1', user: 'cipher_punk', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', text: 'The compression quality on this stream is insane 🔥', time: '2h ago', likes: 42 },
    { id: 'c2', user: 'neon_rider', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'What bitrate is this running at?', time: '4h ago', likes: 18 },
    { id: 'c3', user: 'quantum_dev', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', text: 'Clean 60fps keyframes without any drops.', time: '6h ago', likes: 7 },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Load dynamic reels from /api/reels API
  useEffect(() => {
    async function fetchApiReels() {
      try {
        const res = await fetch('/api/reels');
        if (res.ok) {
          const data = await res.json();
          if (data.reels && Array.isArray(data.reels) && data.reels.length > 0) {
            const mapped: ReelItem[] = data.reels.map((r: any) => ({
              id: r.id,
              videoUrl: r.videoUrl,
              thumbnailUrl: r.thumbnailUrl || undefined,
              authorId: r.authorId || 'creator',
              authorName: r.authorName || 'Creator',
              authorHandle: r.authorName || 'creator',
              authorAvatar: r.authorPic || 'favicon.png',
              caption: r.caption || '',
              hashtags: r.caption?.match(/#[a-zA-Z0-9_]+/g) || ['#nexchat'],
              soundTitle: r.sound || 'Original Audio',
              soundArtist: r.authorName || 'Creator',
              likesCount: r.likesCount || 0,
              commentsCount: r.commentsCount || 0,
              bookmarksCount: 0,
              sharesCount: r.sharesCount || 0,
              qualityBadge: r.qualityMode === '4k' ? '4K 60FPS' : '1080p FHD',
            }));
            setReels((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const newItems = mapped.filter((item) => !existingIds.has(item.id));
              return newItems.length > 0 ? [...newItems, ...prev] : prev;
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch /api/reels:', err);
      }
    }
    fetchApiReels();
  }, []);

  // --------------------------------------------------------------------------
  // INTERSECTION OBSERVER: PLAY ONLY CURRENT VISIBLE REEL & PRELOAD NEXT
  // --------------------------------------------------------------------------
  useEffect(() => {
    const options: IntersectionObserverInit = {
      root: containerRef.current,
      threshold: 0.65,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.getAttribute('data-index'));
        if (entry.isIntersecting) {
          setActiveIndex(index);
          const video = videoRefs.current[index];
          if (video) {
            video.currentTime = 0;
            video.play().catch(() => {});
          }

          // Preload next video metadata and buffer
          if (index + 1 < reels.length) {
            const nextVideo = videoRefs.current[index + 1];
            if (nextVideo) {
              nextVideo.preload = 'auto';
            }
          }
        } else {
          const video = videoRefs.current[index];
          if (video) {
            video.pause();
          }
        }
      });
    }, options);

    const cards = containerRef.current?.querySelectorAll('.reel-card-target');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [reels]);

  // Handle Like Toggle
  const handleToggleLike = useCallback((index: number) => {
    setReels((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const nextLiked = !r.isLiked;
        return {
          ...r,
          isLiked: nextLiked,
          likesCount: nextLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
        };
      })
    );
  }, []);

  // Handle Bookmark Toggle
  const handleToggleBookmark = useCallback((index: number) => {
    setReels((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const nextBookmarked = !r.isBookmarked;
        return {
          ...r,
          isBookmarked: nextBookmarked,
          bookmarksCount: nextBookmarked ? r.bookmarksCount + 1 : Math.max(0, r.bookmarksCount - 1),
        };
      })
    );
  }, []);

  // Handle Follow Toggle
  const handleToggleFollow = useCallback((index: number) => {
    setReels((prev) =>
      prev.map((r, i) => (i === index ? { ...r, isFollowing: !r.isFollowing } : r))
    );
  }, []);

  // Open Comments Sheet
  const handleOpenComments = (reel: ReelItem) => {
    setActiveCommentsReel(reel);
    setIsCommentsOpen(true);
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInputText.trim()) return;

    const newComment = {
      id: `c_${Date.now()}`,
      user: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      text: commentInputText.trim(),
      time: 'Just now',
      likes: 0,
    };

    setCommentsList((prev) => [newComment, ...prev]);
    setCommentInputText('');

    if (activeCommentsReel) {
      setReels((prev) =>
        prev.map((r) =>
          r.id === activeCommentsReel.id ? { ...r, commentsCount: r.commentsCount + 1 } : r
        )
      );
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black text-white font-sans overflow-hidden select-none">
      {/* ===================================================================== */}
      {/* 1. TOP FEED NAVIGATION: Following • Friends • For You + Search        */}
      {/* ===================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        {/* Left: Live Stream Badge / Brand */}
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/reels"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all text-xs font-bold text-white tracking-wide"
          >
            <span className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88] animate-pulse"></span>
            <span>LIVE</span>
          </Link>
        </div>

        {/* Center: Centered Tabs (CamShot Feed Mode) */}
        <div className="pointer-events-auto flex items-center gap-5 text-sm font-semibold tracking-wide">
          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`transition-colors py-1 relative ${
              activeTab === 'following' ? 'text-white font-bold' : 'text-white/60 hover:text-white/80'
            }`}
          >
            Following
            {activeTab === 'following' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-full"></span>
            )}
          </button>

          <span className="text-white/20 text-xs font-light">•</span>

          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`transition-colors py-1 relative ${
              activeTab === 'friends' ? 'text-white font-bold' : 'text-white/60 hover:text-white/80'
            }`}
          >
            Friends
            {activeTab === 'friends' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-full"></span>
            )}
          </button>

          <span className="text-white/20 text-xs font-light">•</span>

          <button
            type="button"
            onClick={() => setActiveTab('foryou')}
            className={`transition-colors py-1 relative ${
              activeTab === 'foryou' ? 'text-white font-bold text-base' : 'text-white/60 hover:text-white/80'
            }`}
          >
            For You
            {activeTab === 'foryou' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-white rounded-full"></span>
            )}
          </button>
        </div>

        {/* Right: Search Icon */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
            title="Search"
          >
            <svg className="w-5 h-5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. REELS VERTICAL FEED SNAP CONTAINER (100dvh snap-y snap-mandatory)  */}
      {/* ===================================================================== */}
      <div
        ref={containerRef}
        className="w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-none scroll-smooth relative z-10"
      >
        {reels.map((reel, index) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            index={index}
            isActive={index === activeIndex}
            setVideoRef={(el) => {
              videoRefs.current[index] = el;
            }}
            onToggleLike={() => handleToggleLike(index)}
            onToggleBookmark={() => handleToggleBookmark(index)}
            onToggleFollow={() => handleToggleFollow(index)}
            onOpenComments={() => handleOpenComments(reel)}
            onOpenMoreSheet={() => {
              setActiveCommentsReel(reel);
              setIsMoreSheetOpen(true);
            }}
          />
        ))}
      </div>

      {/* ===================================================================== */}
      {/* 3. CAMSHOT CLEAN BOTTOM NAVIGATION (Home | Friends | + | Inbox | Me)  */}
      {/* ===================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-black/90 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-around px-2 text-white">
        <Link href="/reels" className="flex flex-col items-center gap-0.5 text-white">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
          </svg>
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        <Link href="/reels" className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span className="text-[10px] font-semibold">Friends</span>
        </Link>

        {/* Center Accent "+" Create Button */}
        <Link
          href="/upload"
          className="relative group active:scale-90 transition-transform flex items-center justify-center"
          title="Create Reel"
        >
          <div className="w-11 h-7.5 rounded-lg bg-white flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.3)]">
            <div className="absolute -left-1 w-6 h-7.5 rounded-lg bg-cyan-400 -z-10 group-hover:-left-1.5 transition-all"></div>
            <div className="absolute -right-1 w-6 h-7.5 rounded-lg bg-[#FF004F] -z-10 group-hover:-right-1.5 transition-all"></div>
            <svg className="w-4 h-4 text-black font-extrabold" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
        </Link>

        <Link href="/chat" className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors relative">
          <div className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.974-.94 4.09 4.09 0 00.32-1.397A7.514 7.514 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-[#FF004F] text-[9px] font-extrabold text-white">
              11
            </span>
          </div>
          <span className="text-[10px] font-semibold">Inbox</span>
        </Link>

        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-[10px] font-semibold">Profile</span>
        </Link>
      </nav>

      {/* ===================================================================== */}
      {/* 4. COMMENTS SHEET (Drawer sliding from bottom)                        */}
      {/* ===================================================================== */}
      {isCommentsOpen && activeCommentsReel && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="flex-1 w-full"
            onClick={() => setIsCommentsOpen(false)}
          />
          <div className="w-full max-w-lg mx-auto h-[65vh] bg-[#12161F] border-t border-white/10 rounded-t-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-wide">
                {activeCommentsReel.commentsCount} comments
              </span>
              <button
                type="button"
                onClick={() => setIsCommentsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {commentsList.map((comm) => (
                <div key={comm.id} className="flex items-start gap-3 text-xs">
                  <img src={comm.avatar} alt={comm.user} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold text-white/80 mr-1.5">@{comm.user}</span>
                    <span className="text-white/40 text-[10px]">{comm.time}</span>
                    <p className="text-white/90 mt-0.5 leading-relaxed">{comm.text}</p>
                  </div>
                  <button className="flex flex-col items-center gap-0.5 text-white/40 hover:text-rose-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    <span className="text-[10px]">{comm.likes}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={commentInputText}
                onChange={(e) => setCommentInputText(e.target.value)}
                placeholder="Add comment..."
                className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#00FF88]"
              />
              <button
                type="submit"
                disabled={!commentInputText.trim()}
                className="px-4 py-2 rounded-full bg-[#00FF88] text-black font-bold text-xs disabled:opacity-40"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. MORE SHEET (Cleanly holds Tip, AI Companion, Stream Telemetry)      */}
      {/* ===================================================================== */}
      {isMoreSheetOpen && activeCommentsReel && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-1 w-full" onClick={() => setIsMoreSheetOpen(false)} />
          <div className="w-full max-w-md mx-auto bg-[#12161F] border-t border-white/10 rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Stream & Creator Actions</h3>
              <button onClick={() => setIsMoreSheetOpen(false)} className="text-xs text-white/50 hover:text-white">Close</button>
            </div>

            {/* 3 Secondary Utility Actions mapped from the previous cluttered rail */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  alert(`Tipped 50 NEX Tokens to @${activeCommentsReel.authorHandle}!`);
                  setIsMoreSheetOpen(false);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all text-center"
              >
                <span className="text-xl">🪙</span>
                <span className="text-xs font-bold text-white">Send Tip</span>
                <span className="text-[10px] text-white/40">Support Creator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert('ChronEX AI Companion: Neural score 99.4% Virality.');
                  setIsMoreSheetOpen(false);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all text-center"
              >
                <span className="text-xl">🤖</span>
                <span className="text-xs font-bold text-white">ChronEX AI</span>
                <span className="text-[10px] text-white/40">Neural Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Stream link copied to clipboard!');
                  setIsMoreSheetOpen(false);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all text-center"
              >
                <span className="text-xl">🔗</span>
                <span className="text-xs font-bold text-white">Copy Link</span>
                <span className="text-[10px] text-white/40">Share Stream</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SINGLE REEL CARD COMPONENT (Mobile-first True Fullscreen 100dvh)
// ============================================================================
interface ReelCardProps {
  reel: ReelItem;
  index: number;
  isActive: boolean;
  setVideoRef: (el: HTMLVideoElement | null) => void;
  onToggleLike: () => void;
  onToggleBookmark: () => void;
  onToggleFollow: () => void;
  onOpenComments: () => void;
  onOpenMoreSheet: () => void;
}

function ReelCard({
  reel,
  index,
  isActive,
  setVideoRef,
  onToggleLike,
  onToggleBookmark,
  onToggleFollow,
  onOpenComments,
  onOpenMoreSheet,
}: ReelCardProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showPlayIcon, setShowPlayIcon] = useState<boolean>(false);
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);
  const [burstCoords, setBurstCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isExpandedCaption, setIsExpandedCaption] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef<number>(0);

  // Sync Video Playback on Active Change
  useEffect(() => {
    if (localVideoRef.current) {
      if (isActive) {
        localVideoRef.current.currentTime = 0;
        localVideoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        localVideoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  // Video Time Update for Scrubber Line
  const handleTimeUpdate = () => {
    if (localVideoRef.current && localVideoRef.current.duration) {
      const pct = (localVideoRef.current.currentTime / localVideoRef.current.duration) * 100;
      setProgressPct(pct);
    }
  };

  // Video Tap: Single Tap Play/Pause | Double Tap Heart Burst
  const handleVideoTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const delta = now - lastTapRef.current;

    if (delta < 300) {
      // Double Tap -> Trigger Heart Burst & Like
      const rect = e.currentTarget.getBoundingClientRect();
      setBurstCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);

      if (!reel.isLiked) {
        onToggleLike();
      }
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;

    // Single Tap -> Play / Pause
    if (localVideoRef.current) {
      if (localVideoRef.current.paused) {
        localVideoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        localVideoRef.current.pause();
        setIsPlaying(false);
      }
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 500);
    }
  };

  return (
    <div
      data-index={index}
      className="reel-card-target relative w-full h-[100dvh] snap-start snap-always bg-black flex items-center justify-center overflow-hidden"
    >
      {/* --------------------------------------------------------------------- */}
      {/* VIDEO STAGE: True Fullscreen 100dvh, object-cover                     */}
      {/* --------------------------------------------------------------------- */}
      <div
        onClick={handleVideoTap}
        className="relative w-full h-full max-w-[480px] mx-auto cursor-pointer overflow-hidden flex items-center justify-center bg-black"
      >
        <video
          ref={(el) => {
            localVideoRef.current = el;
            setVideoRef(el);
          }}
          src={reel.videoUrl}
          playsInline
          loop
          muted={false}
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-cover select-none"
        />

        {/* Play/Pause Pulse Overlay Indicator */}
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-110 transition-transform">
              {isPlaying ? (
                <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Double-Tap Heart Burst */}
        {showHeartBurst && (
          <div
            style={{ left: burstCoords.x, top: burstCoords.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-in zoom-in-50 fade-in duration-300"
          >
            <svg
              className="w-24 h-24 text-[#FF004F] fill-[#FF004F] drop-shadow-[0_0_20px_rgba(255,0,79,0.8)]"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )}

        {/* Subtle Ambient Vignette at Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

        {/* ------------------------------------------------------------------- */}
        {/* RIGHT ACTION RAIL: CAMSHOT 5-ACTION STREAM INTERACTION               */}
        {/* All white, subtle drop-shadow, count in white below icon, 24px gap  */}
        {/* ------------------------------------------------------------------- */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-5 pointer-events-auto"
        >
          {/* Action 1: Avatar with Follow "+" Badge */}
          <div className="relative flex flex-col items-center mb-1">
            <Link href={`/profile`}>
              <img
                src={reel.authorAvatar}
                alt={reel.authorName}
                className="w-11 h-11 rounded-full object-cover border-2 border-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              />
            </Link>
            {!reel.isFollowing && (
              <button
                type="button"
                onClick={onToggleFollow}
                className="absolute -bottom-1.5 w-4.5 h-4.5 rounded-full bg-[#FF004F] text-white flex items-center justify-center text-xs font-black shadow-md hover:scale-110 active:scale-95 transition-transform"
                title="Follow"
              >
                +
              </button>
            )}
          </div>

          {/* Action 2: Heart (Like) */}
          <button
            type="button"
            onClick={onToggleLike}
            className="flex flex-col items-center gap-1 active:scale-125 transition-transform"
            title="Like"
          >
            <svg
              className={`w-7 h-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-colors ${
                reel.isLiked ? 'text-[#FF004F] fill-[#FF004F]' : 'text-white fill-none stroke-white stroke-2'
              }`}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {formatCount(reel.likesCount)}
            </span>
          </button>

          {/* Action 3: Comment Bubble */}
          <button
            type="button"
            onClick={onOpenComments}
            className="flex flex-col items-center gap-1 active:scale-125 transition-transform"
            title="Comments"
          >
            <svg
              className="w-7 h-7 text-white fill-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              viewBox="0 0 24 24"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            <span className="text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {formatCount(reel.commentsCount)}
            </span>
          </button>

          {/* Action 4: Bookmark (Save) */}
          <button
            type="button"
            onClick={onToggleBookmark}
            className="flex flex-col items-center gap-1 active:scale-125 transition-transform"
            title="Bookmark"
          >
            <svg
              className={`w-7 h-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-colors ${
                reel.isBookmarked ? 'text-[#FFD700] fill-[#FFD700]' : 'text-white fill-none stroke-white stroke-2'
              }`}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            <span className="text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {formatCount(reel.bookmarksCount)}
            </span>
          </button>

          {/* Action 5: Share Arrow */}
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: reel.authorName, text: reel.caption, url: window.location.href }).catch(() => {});
              } else {
                onOpenMoreSheet();
              }
            }}
            className="flex flex-col items-center gap-1 active:scale-125 transition-transform"
            title="Share"
          >
            <svg
              className="w-7 h-7 text-white fill-none stroke-white stroke-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            <span className="text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {formatCount(reel.sharesCount)}
            </span>
          </button>

          {/* Rotating Vinyl Sound Disc at Bottom */}
          <button
            type="button"
            onClick={onOpenMoreSheet}
            className="mt-1 w-10 h-10 rounded-full bg-gradient-to-tr from-[#151922] via-[#242b38] to-[#0A0D13] border-2 border-white/20 flex items-center justify-center text-white/80 shadow-[0_0_12px_rgba(0,0,0,0.8)] animate-spin"
            style={{ animationDuration: '6s' }}
            title="More stream info"
          >
            <div className="w-4 h-4 rounded-full bg-black border border-white/30 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
            </div>
          </button>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* BOTTOM METADATA OVERLAY (Left-aligned, clean, NO floating pills!)  */}
        {/* ------------------------------------------------------------------- */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-3.5 right-20 bottom-16 z-20 flex flex-col gap-1.5 pointer-events-auto"
        >
          {/* Username Bold 15px */}
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="text-[15px] font-extrabold text-white tracking-wide hover:underline drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
            >
              @{reel.authorHandle}
            </Link>
            {reel.qualityBadge && (
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-black/60 text-[#00FF88] border border-[#00FF88]/30">
                {reel.qualityBadge}
              </span>
            )}
          </div>

          {/* Caption with "See more" Toggle to prevent clipping */}
          <div className="text-xs text-white/95 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
            <p className={isExpandedCaption ? 'block' : 'line-clamp-2'}>
              {reel.caption}
            </p>
            {reel.caption.length > 70 && (
              <button
                type="button"
                onClick={() => setIsExpandedCaption(!isExpandedCaption)}
                className="text-white/60 font-bold hover:text-white mt-0.5 inline-block text-[11px]"
              >
                {isExpandedCaption ? 'See less' : '... See more'}
              </button>
            )}
          </div>

          {/* Sound Attribution Row (clean text without blocking pills) */}
          <div className="flex items-center gap-2 mt-1 text-[11px] text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
            <span className="text-xs">🎵</span>
            <span className="truncate max-w-[200px] font-medium">
              {reel.soundTitle}
            </span>
          </div>

          {/* Search Row: Q Search • Hashtag > */}
          <div className="mt-1 flex items-center justify-between px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-white/70 max-w-[240px]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-white/90">Q</span>
              <span className="text-white/50">Search • {reel.hashtags[0] || 'NEX Stream'}</span>
            </div>
            <span className="text-white/40 text-xs">›</span>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* BOTTOM SCRUBBER BAR: 1.5px White / 30% Opacity Track                */}
        {/* ------------------------------------------------------------------- */}
        <div className="absolute left-0 right-0 bottom-14 z-30 h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_6px_#fff]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Format Large Counts (e.g. 12100 -> 12.1K)
function formatCount(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return String(num);
}
