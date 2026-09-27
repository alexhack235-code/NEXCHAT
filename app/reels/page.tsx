// app/reels/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface ReelItem {
  id: string;
  author: string;
  avatar: string;
  verified: boolean;
  title: string;
  description: string;
  tags: string[];
  audioTrack: string;
  likes: number;
  commentsCount: number;
  sharesCount: number;
  studioType: 'apps' | 'games' | 'studio';
  studioLink: string;
  studioCta: string;
  themeColor: string;
  bgGradient: string;
  specimenType: '3d_freeze' | 'unreal_flip' | 'cyberpunk_city' | 'crypto_tracker';
}

export default function ReelsPage() {
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentsList, setCommentsList] = useState([
    { id: 'c1', user: 'lagos_coder', text: 'Omo this 3D freeze shader mad no cap! 🔥', time: '2m' },
    { id: 'c2', user: 'unreal_dev_alex', text: 'That 1080 spin catching the phone is insane!', time: '14m' },
    { id: 'c3', user: 'tech_reviewer', text: 'Does iPhone survive the liquid nitrogen? ❄️', time: '1h' }
  ]);

  const reelsContainerRef = useRef<HTMLDivElement>(null);

  const reelsData: ReelItem[] = [
    {
      id: 'reel_freeze_test',
      author: 'alexandergamedeveloper74',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      verified: true,
      title: 'iPhone 18 vs Samsung S26: -50°C Liquid Nitrogen Test ❄️',
      description: 'Tested both flagship devices in liquid nitrogen! Real-time WebGL ice crystal shader with instant thaw toggle. Swipe into App Forge to remix!',
      tags: ['#NEXReels', '#FreezeTest', '#iPhone18', '#GalaxyS26', '#WebContainers'],
      audioTrack: 'Alexander - Cryogenic Beats (Original Audio)',
      likes: 54200,
      commentsCount: 3120,
      sharesCount: 14800,
      studioType: 'apps',
      studioLink: '/studio/apps/iphone-compare',
      studioCta: 'Remix in App Forge 📱',
      themeColor: '#00F0FF',
      bgGradient: 'from-cyan-950/80 via-[#030308] to-black',
      specimenType: '3d_freeze'
    },
    {
      id: 'reel_unreal_flip',
      author: 'alexandergamedeveloper74',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      verified: true,
      title: '1080° Matrix Backflip into NEX Logo Shatter 🎮',
      description: 'Defying physics with gravity = -9.8 and 0.05x bullet time! 10,000 glass shards explode and assemble into NEX logo. Made in NEX Game Lab 🔥',
      tags: ['#UnrealEngine5', '#MadAnimation', '#DefyPhysics', '#NEXGameLab'],
      audioTrack: 'Hans Zimmer x Phonk - Bullet Time Matrix (NEX Remix)',
      likes: 89400,
      commentsCount: 6840,
      sharesCount: 32100,
      studioType: 'games',
      studioLink: '/studio/games',
      studioCta: 'Open in Game Dev Lab 🎮',
      themeColor: '#00FF88',
      bgGradient: 'from-emerald-950/80 via-[#030308] to-black',
      specimenType: 'unreal_flip'
    },
    {
      id: 'reel_cyberpunk_city',
      author: 'cyber_architect_99',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      verified: true,
      title: 'Neo-Tokyo 2099: Cyberpunk City Landing Page in <3s ⚡',
      description: 'Generated complete interactive 3D landing page with volumetric fog, dual neon spotlights, and flying aerocars using NEX 3D Studio.',
      tags: ['#Cyberpunk', '#ThreeJS', '#ReactThreeFiber', '#NEX3D'],
      audioTrack: 'Kavinsky - Nightcall (Cyberpunk Neon Remix)',
      likes: 38100,
      commentsCount: 1940,
      sharesCount: 8900,
      studioType: 'studio',
      studioLink: '/studio',
      studioCta: 'Launch in 3D Studio ⚡',
      themeColor: '#FE2C55',
      bgGradient: 'from-purple-950/80 via-[#030308] to-black',
      specimenType: 'cyberpunk_city'
    },
    {
      id: 'reel_crypto_tracker',
      author: 'lagos_crypto_dev',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      verified: true,
      title: 'TikTok-Style Crypto Live Price Tracker & Instant Swap 📈',
      description: 'Swipe-based crypto portfolio app created in WebContainer with live price ticks, 1-click Paystack tip jar, and instant swap.',
      tags: ['#CryptoReels', '#Fintech', '#BoltNew', '#Paystack'],
      audioTrack: 'Afrobeats x Tech - Asake Wave (Live Loop)',
      likes: 29700,
      commentsCount: 1450,
      sharesCount: 6200,
      studioType: 'apps',
      studioLink: '/studio/apps',
      studioCta: 'Fork in App Forge 📱',
      themeColor: '#FFD700',
      bgGradient: 'from-amber-950/80 via-[#030308] to-black',
      specimenType: 'crypto_tracker'
    }
  ];

  // Initialize likes map
  useEffect(() => {
    const initialLikes: Record<string, number> = {};
    reelsData.forEach((r) => {
      initialLikes[r.id] = r.likes;
    });
    setLikesMap(initialLikes);
  }, []);

  // Keyboard navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToReel(Math.min(reelsData.length - 1, activeReelIndex + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToReel(Math.max(0, activeReelIndex - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReelIndex]);

  const scrollToReel = (index: number) => {
    setActiveReelIndex(index);
    const container = reelsContainerRef.current;
    if (container) {
      const target = container.children[index] as HTMLElement;
      target?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    const container = reelsContainerRef.current;
    if (!container) return;
    const scrollY = container.scrollTop;
    const height = container.clientHeight;
    const index = Math.round(scrollY / height);
    if (index !== activeReelIndex && index >= 0 && index < reelsData.length) {
      setActiveReelIndex(index);
    }
  };

  const toggleLike = (reelId: string) => {
    const isCurrentlyLiked = likedReels[reelId];
    setLikedReels((prev) => ({ ...prev, [reelId]: !isCurrentlyLiked }));
    setLikesMap((prev) => ({
      ...prev,
      [reelId]: (prev[reelId] || 0) + (isCurrentlyLiked ? -1 : 1)
    }));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setCommentsList((prev) => [
      { id: `c-${Date.now()}`, user: 'you', text: commentInput.trim(), time: 'Just now' },
      ...prev
    ]);
    setCommentInput('');
  };

  const currentReel = reelsData[activeReelIndex] || reelsData[0];

  return (
    <div className="h-screen w-screen bg-black text-white flex justify-center overflow-hidden font-sans select-none relative">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <Link href="/studio" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FE2C55] via-purple-600 to-[#00FF88] p-[1.5px]">
            <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center font-black text-xs">
              NEX
            </div>
          </div>
          <span className="font-extrabold text-sm tracking-wider">NEX REELS</span>
        </Link>

        {/* Tab Switcher */}
        <div className="flex items-center gap-6 text-sm font-bold">
          <button className="text-neutral-400 hover:text-white transition">Following</button>
          <button className="text-white border-b-2 border-[#FE2C55] pb-1 font-black">For You</button>
          <Link href="/studio" className="text-neutral-400 hover:text-white transition flex items-center gap-1 text-xs">
            <span>✨ Studio Labs</span>
          </Link>
        </div>

        <Link
          href="/studio/apps"
          className="px-3.5 py-1.5 rounded-full bg-[#FE2C55] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#FE2C55]/30 flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Create Reel</span>
        </Link>
      </header>

      {/* Main Snap-Scroll Container */}
      <div
        ref={reelsContainerRef}
        onScroll={handleScroll}
        className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none relative"
      >
        {reelsData.map((reel, index) => {
          const isLiked = likedReels[reel.id];
          const likesCount = likesMap[reel.id] || reel.likes;

          return (
            <div
              key={reel.id}
              className={`w-full h-screen snap-start relative flex flex-col justify-between p-6 bg-gradient-to-b ${reel.bgGradient} overflow-hidden`}
            >
              {/* Dynamic 3D Specimen Visualizer Simulation */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {reel.specimenType === '3d_freeze' && (
                  <div className="relative w-64 h-96 flex items-center justify-center">
                    <div className="w-48 h-80 rounded-3xl bg-cyan-500/10 border-2 border-cyan-400/60 backdrop-blur-md shadow-2xl shadow-cyan-500/30 flex flex-col items-center justify-center animate-pulse">
                      <div className="w-12 h-2 rounded-full bg-cyan-400/40 mb-4" />
                      <span className="text-5xl my-4">❄️</span>
                      <p className="text-xs font-mono font-bold text-cyan-300">LIQUID NITROGEN -50°C</p>
                      <p className="text-[10px] text-neutral-400 mt-1">GLSL Ice Shader Active</p>
                    </div>
                  </div>
                )}

                {reel.specimenType === 'unreal_flip' && (
                  <div className="relative w-72 h-96 flex flex-col items-center justify-center">
                    <div className="w-56 h-80 rounded-3xl bg-emerald-500/10 border-2 border-[#00FF88]/60 backdrop-blur-md shadow-2xl shadow-[#00FF88]/30 flex flex-col items-center justify-center">
                      <span className="text-6xl animate-bounce">🥷</span>
                      <div className="mt-4 px-3 py-1 rounded-full bg-[#00FF88]/20 border border-[#00FF88]/40 text-[#00FF88] text-xs font-black">
                        1080° TRIPLE BACKFLIP
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-2 font-mono">10,000 Shards Assemble NEX Logo</p>
                    </div>
                  </div>
                )}

                {reel.specimenType === 'cyberpunk_city' && (
                  <div className="relative w-72 h-96 flex flex-col items-center justify-center">
                    <div className="w-56 h-80 rounded-3xl bg-purple-500/10 border-2 border-[#FE2C55]/60 backdrop-blur-md shadow-2xl shadow-[#FE2C55]/30 flex flex-col items-center justify-center">
                      <span className="text-6xl animate-pulse">🏙️</span>
                      <div className="mt-4 px-3 py-1 rounded-full bg-[#FE2C55]/20 border border-[#FE2C55]/40 text-[#FE2C55] text-xs font-black">
                        NEO-TOKYO 2099
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-2 font-mono">Flying Cars + Dual Neon Spots</p>
                    </div>
                  </div>
                )}

                {reel.specimenType === 'crypto_tracker' && (
                  <div className="relative w-72 h-96 flex flex-col items-center justify-center">
                    <div className="w-56 h-80 rounded-3xl bg-amber-500/10 border-2 border-amber-400/60 backdrop-blur-md shadow-2xl shadow-amber-500/30 flex flex-col items-center justify-center">
                      <span className="text-6xl">📈</span>
                      <p className="text-sm font-black text-amber-300 mt-4">$94,250.00 BTC</p>
                      <p className="text-[10px] text-emerald-400 font-mono mt-1">+12.4% 24H Swiped Loop</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Empty Space for Header Buffer */}
              <div className="h-16" />

              {/* Bottom Details & Direct Studio Lab CTA */}
              <div className="z-20 flex flex-col gap-3 pb-8 pr-16 select-text">
                {/* Author Info */}
                <div className="flex items-center gap-2.5">
                  <img
                    src={reel.avatar}
                    alt={reel.author}
                    className="w-10 h-10 rounded-full border border-white/20 object-cover shadow-md"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>@{reel.author}</span>
                      {reel.verified && <span className="text-[#00F0FF] text-xs font-bold">✓</span>}
                    </h3>
                    <span className="text-[10px] text-neutral-400">Original Creator • NEX Studio</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="font-bold text-base text-white leading-tight">{reel.title}</h2>
                  <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                    {reel.description}
                  </p>
                </div>

                {/* Hashtag Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {reel.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold text-neutral-300 hover:text-white transition"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Audio Track Marquee */}
                <div className="flex items-center gap-2 text-xs text-neutral-300 pt-1">
                  <span className="animate-spin text-sm">🎵</span>
                  <span className="font-medium truncate text-[11px]">{reel.audioTrack}</span>
                </div>

                {/* THE 1-SWIPE STUDIO ACTION BUTTON */}
                <div className="pt-2">
                  <Link
                    href={reel.studioLink}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black transition shadow-xl transform active:scale-95 hover:opacity-95"
                    style={{ backgroundColor: reel.themeColor }}
                  >
                    <span>⚡</span>
                    <span>{reel.studioCta}</span>
                  </Link>
                </div>
              </div>

              {/* Right Side TikTok Action Bar */}
              <div className="absolute right-4 bottom-20 z-30 flex flex-col items-center gap-5">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => toggleLike(reel.id)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-lg ${
                      isLiked
                        ? 'bg-[#FE2C55] text-white scale-110'
                        : 'bg-black/50 text-white group-hover:bg-white/20'
                    }`}
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white">
                    {likesCount.toLocaleString()}
                  </span>
                </button>

                {/* Comments Button */}
                <button
                  type="button"
                  onClick={() => setCommentsOpen(true)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-white/20 transition shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white">
                    {reel.commentsCount.toLocaleString()}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Reel link copied to clipboard!');
                  }}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-white/20 transition shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white">
                    {reel.sharesCount.toLocaleString()}
                  </span>
                </button>

                {/* Paystack Tip Jar Quick Button */}
                <Link
                  href="/studio/apps/iphone-compare"
                  className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-[#00C3F7] text-black font-black text-xl flex items-center justify-center shadow-lg shadow-cyan-500/40 hover:scale-105 transition"
                  title="Tip Alexander with Paystack"
                >
                  ₦
                </Link>

                {/* Spinning Sound Disc */}
                <div
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className={`w-12 h-12 rounded-full bg-gradient-to-tr from-neutral-800 to-black border-2 border-white/40 flex items-center justify-center shadow-2xl cursor-pointer ${
                    isPlayingAudio ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '4s' }}
                >
                  <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-[8px] font-black text-black">
                    ♪
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments Drawer Modal */}
      {commentsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121218] border-t border-white/10 rounded-t-3xl p-5 flex flex-col gap-4 max-h-[70vh] shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-extrabold text-sm text-white">
                Comments ({commentsList.length})
              </h3>
              <button
                type="button"
                onClick={() => setCommentsOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            {/* Comment List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {commentsList.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-[#FE2C55] flex items-center justify-center font-bold text-[10px] shrink-0">
                    {c.user[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{c.user}</span>
                      <span className="text-[10px] text-neutral-500">{c.time}</span>
                    </div>
                    <p className="text-neutral-300 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment on this 3D reel..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FE2C55]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#FE2C55] hover:opacity-90 text-white font-bold text-xs"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
