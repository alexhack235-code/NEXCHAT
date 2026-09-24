'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Sample Fallback Data for Creator Profile
const DEMO_REELS = [
  {
    id: 'demo-reel-1',
    authorName: 'alexandergamedeveloper74',
    caption: 'Cyberpunk 2077 Night City 4K RTX Overdrive 🚀 Testing NEX 60FPS video engine!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=720&q=80',
    likesCount: 14200,
    commentsCount: 384,
    sharesCount: 2100,
    views: 89400,
    sound: 'Night City Synths — Alexander',
  },
  {
    id: 'demo-reel-2',
    authorName: 'alexandergamedeveloper74',
    caption: 'Procedural neon highway animation rendered in Unreal Engine 5.4 ⚡',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=720&q=80',
    likesCount: 9830,
    commentsCount: 212,
    sharesCount: 1540,
    views: 64200,
    sound: 'Cyber Bassline 140BPM',
  },
  {
    id: 'demo-reel-3',
    authorName: 'alexandergamedeveloper74',
    caption: 'Real-time neural shader test on Android mobile GPU 🎮 #gamedev #nexchat',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=720&q=80',
    likesCount: 23100,
    commentsCount: 640,
    sharesCount: 4200,
    views: 142000,
    sound: 'Original Audio — @alexandergamedeveloper74',
  },
  {
    id: 'demo-reel-4',
    authorName: 'alexandergamedeveloper74',
    caption: 'ChronEX AI auto-routing test across 14 multi-cloud media vaults 🔥',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=720&q=80',
    likesCount: 18400,
    commentsCount: 490,
    sharesCount: 3100,
    views: 98100,
    sound: 'Synthwave Odyssey — ChronEX',
  },
];

const DEMO_PICS = [
  {
    id: 'pic-1',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=85',
    caption: 'Neon Grid concept render for NEXCHAT UI',
    likes: 1240,
  },
  {
    id: 'pic-2',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=85',
    caption: 'Game engine development workstation setup',
    likes: 2450,
  },
  {
    id: 'pic-3',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=85',
    caption: 'Cyberpunk character design in ZBrush',
    likes: 3100,
  },
  {
    id: 'pic-4',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=85',
    caption: 'Multi-vault encryption particle effects',
    likes: 1890,
  },
  {
    id: 'pic-5',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=85',
    caption: 'Retro-futuristic hardware debug session',
    likes: 950,
  },
  {
    id: 'pic-6',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=85',
    caption: 'Golden hour inspiration for outdoor skyboxes',
    likes: 1670,
  },
];

export default function CreatorProfilePage({ params }) {
  const usernameParam = params?.username || 'alexandergamedeveloper74';
  const cleanUsername = usernameParam.replace(/^@/, '');

  // UI State
  const [activeTab, setActiveTab] = useState('reels'); // 'reels' | 'pics' | 'liked' | 'vault'
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(28400);
  const [activePlayingReel, setActivePlayingReel] = useState(null);
  const [activeViewingPic, setActiveViewingPic] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Check initial follow state from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nex_followed_authors') || '[]');
      if (saved.includes(cleanUsername)) {
        setIsFollowing(true);
      }
    } catch {}
  }, [cleanUsername]);

  const handleFollowToggle = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('nex_followed_authors') || '[]');
      if (isFollowing) {
        const next = saved.filter((u) => u !== cleanUsername);
        localStorage.setItem('nex_followed_authors', JSON.stringify(next));
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      } else {
        saved.push(cleanUsername);
        localStorage.setItem('nex_followed_authors', JSON.stringify(saved));
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch {
      setIsFollowing(!isFollowing);
    }
  };

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      navigator.share({
        title: `NEXCHAT: @${cleanUsername}`,
        text: `Check out @${cleanUsername}'s reels and photos on NEXCHAT!`,
        url: url,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Filtered Reels
  const filteredReels = useMemo(() => {
    if (!searchFilter.trim()) return DEMO_REELS;
    return DEMO_REELS.filter((r) =>
      r.caption.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [searchFilter]);

  // Format number
  const formatNum = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  return (
    <div className="w-full min-h-screen bg-[#07090E] text-white flex flex-col font-sans selection:bg-[#39FF14] selection:text-black">
      {/* ─── Top Ambient Sci-Fi Glow ─── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-56 bg-gradient-to-b from-[#39FF14]/10 via-[#00f3ff]/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* ─── Main Container (Mobile-first responsive width) ─── */}
      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col min-h-screen border-x border-white/5 bg-[#0A0D14]/80 backdrop-blur-2xl shadow-2xl">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0A0D14]/90 backdrop-blur-md border-b border-white/5">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = '/reels.html';
              }
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all active:scale-95"
            title="Back to Reels"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 font-bold text-sm tracking-wide">
            <span>@{cleanUsername}</span>
            <svg className="w-4 h-4 text-[#39FF14]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all active:scale-95"
              title="Share Profile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col items-center px-6 pt-5 pb-4 text-center">
          {/* Avatar with Neon Pulsing Border */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#39FF14] via-[#00f3ff] to-[#39FF14] shadow-[0_0_24px_rgba(57,255,20,0.35)] animate-pulse">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80"
                alt="Avatar"
                className="w-full h-full rounded-full object-cover bg-black border-2 border-black"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#39FF14] text-black font-black text-xs flex items-center justify-center border-2 border-black shadow-md">
              ⚡
            </div>
          </div>

          {/* Name & Tag */}
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
            Alexander Vance
          </h1>
          <span className="text-xs font-semibold text-[#00f3ff] mt-0.5">
            @{cleanUsername}
          </span>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 mt-4 w-full py-2.5 px-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold text-white">142</span>
              <span className="text-[11px] text-gray-400 font-medium">Following</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold text-white">{formatNum(followersCount)}</span>
              <span className="text-[11px] text-gray-400 font-medium">Followers</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-base font-extrabold text-[#39FF14]">195.2K</span>
              <span className="text-[11px] text-gray-400 font-medium">Likes</span>
            </div>
          </div>

          {/* Action Buttons: Follow, Message, Link */}
          <div className="flex items-center gap-2.5 w-full mt-4">
            <button
              onClick={handleFollowToggle}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 ${
                isFollowing
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-[#39FF14] text-black shadow-[0_0_16px_rgba(57,255,20,0.4)] hover:brightness-110'
              }`}
            >
              <span>{isFollowing ? '✓ Following' : '+ Follow'}</span>
            </button>

            <a
              href={`/chat.html?chatWith=${encodeURIComponent(cleanUsername)}`}
              className="flex-1 py-2.5 rounded-xl font-semibold text-xs bg-white/5 hover:bg-white/10 border border-white/15 text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Message</span>
            </a>

            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white transition-all active:scale-95"
              title="Copy Profile Link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          </div>

          {/* Bio Box */}
          <div className="mt-3.5 px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-300 leading-relaxed text-left w-full">
            <p>
              🎮 <strong className="text-white">Game Developer & Cyber Visualist</strong> • Directing next-gen 4K 60FPS video feeds & multi-vault Cloudinary cloud streams.
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-[#39FF14]">
              <span className="flex items-center gap-1">📍 Night City / NEX-Core</span>
              <span className="flex items-center gap-1">🔗 nexchat.dev/@{cleanUsername}</span>
            </div>
          </div>
        </section>

        {/* ─── Unique 3-Tab Navigator (Reels, Pics, Liked) ─── */}
        <div className="sticky top-[57px] z-20 flex border-t border-b border-white/10 bg-[#0A0D14]/95 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'reels' ? 'text-[#39FF14]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Reels ({filteredReels.length})</span>
            {activeTab === 'reels' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#39FF14]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pics')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'pics' ? 'text-[#39FF14]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Pics ({DEMO_PICS.length})</span>
            {activeTab === 'pics' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#39FF14]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'liked' ? 'text-[#39FF14]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Liked</span>
            {activeTab === 'liked' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#39FF14]" />
            )}
          </button>
        </div>

        {/* ─── Media Grids Content ─── */}
        <div className="flex-1 p-1 overflow-y-auto">
          {/* TAB 1: 3-Column Reels Grid */}
          {activeTab === 'reels' && (
            <div className="grid grid-cols-3 gap-1">
              {filteredReels.map((reel) => (
                <motion.div
                  key={reel.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActivePlayingReel(reel)}
                  className="relative aspect-[9/16] bg-[#141923] rounded-lg overflow-hidden cursor-pointer group shadow-sm"
                >
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.caption}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                  
                  {/* Play Count Badge */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-bold text-white drop-shadow-md">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>{formatNum(reel.views)}</span>
                  </div>

                  {/* Likes Badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-pink-400 bg-black/60 px-1.5 py-0.5 rounded-full">
                    <span>❤️</span>
                    <span>{formatNum(reel.likesCount)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* TAB 2: Photos & Pics Grid */}
          {activeTab === 'pics' && (
            <div className="grid grid-cols-3 gap-1">
              {DEMO_PICS.map((pic) => (
                <motion.div
                  key={pic.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveViewingPic(pic)}
                  className="relative aspect-square bg-[#141923] rounded-lg overflow-hidden cursor-pointer group"
                >
                  <img
                    src={pic.url}
                    alt={pic.caption}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                  <div className="absolute bottom-1.5 right-1.5 text-[10px] font-bold text-white/90 bg-black/50 px-1.5 py-0.5 rounded">
                    ❤️ {formatNum(pic.likes)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* TAB 3: Liked Videos */}
          {activeTab === 'liked' && (
            <div className="grid grid-cols-3 gap-1">
              {filteredReels.slice(0, 2).map((reel) => (
                <div
                  key={'liked-' + reel.id}
                  onClick={() => setActivePlayingReel(reel)}
                  className="relative aspect-[9/16] bg-[#141923] rounded-lg overflow-hidden cursor-pointer"
                >
                  <img src={reel.thumbnailUrl} alt="Reel" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 text-xs font-bold text-red-500 bg-black/60 px-1.5 py-0.5 rounded-full">
                    ❤️ {formatNum(reel.likesCount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Video Modal Player ─── */}
        <AnimatePresence>
          {activePlayingReel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-2"
            >
              <button
                onClick={() => setActivePlayingReel(null)}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg"
              >
                ✕
              </button>

              <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <video
                  src={activePlayingReel.videoUrl}
                  autoPlay
                  loop
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                  <span className="font-bold text-sm text-white drop-shadow">
                    @{activePlayingReel.authorName}
                  </span>
                  <p className="text-xs text-gray-200 mt-0.5 drop-shadow line-clamp-2">
                    {activePlayingReel.caption}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Photo Lightbox Modal ─── */}
        <AnimatePresence>
          {activeViewingPic && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveViewingPic(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 cursor-pointer"
            >
              <button
                onClick={() => setActiveViewingPic(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-lg"
              >
                ✕
              </button>
              <img
                src={activeViewingPic.url}
                alt={activeViewingPic.caption}
                className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <p className="mt-3 text-sm text-gray-300 font-medium">
                {activeViewingPic.caption}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        {copiedLink && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0A0D14] border border-[#39FF14] text-[#39FF14] px-4 py-2 rounded-full text-xs font-bold shadow-xl">
            Profile link copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
}
