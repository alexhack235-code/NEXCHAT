'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// ==========================================
// FIREBASE CLIENT CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: 'AIzaSyCfT1UFmoGSAanbIDTLYGeFfPE7uCa74Fw',
  authDomain: 'nexchat-47326.firebaseapp.com',
  projectId: 'nexchat-47326',
  storageBucket: 'nexchat-47326.appspot.com',
  messagingSenderId: '327330605104',
  appId: '1:327330605104:web:ac43bb9adf7e4f1f1065f5',
  databaseURL: 'https://nexchat-47326-default-rtdb.firebaseio.com',
};

function getFirebaseDb() {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    return getFirestore(app);
  } catch (err) {
    console.warn('[Firebase] Firestore init fallback:', err);
    return null;
  }
}

// ==========================================
// TYPES & INTERFACES
// ==========================================
export interface StorySlide {
  id: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video' | 'text';
  caption: string;
  timeFormatted: string; // e.g. "03:56 AM"
  expiresIn: string; // e.g. "Expires in 21h"
  timestamp: number;
  bgGradient?: string;
}

export interface UserStatusGroup {
  userId: string;
  userName: string;
  avatarUrl: string;
  isMe?: boolean;
  isViewed: boolean;
  slides: StorySlide[];
  lastUpdated: number;
  timeLabel: string; // e.g. "Today, 03:56 AM"
}

// ==========================================
// INITIAL REALISTIC FALLBACK DATA
// (Ensures zero blank screens; matches user scenario)
// ==========================================
const INITIAL_DEMO_STATUSES: UserStatusGroup[] = [
  {
    userId: 'user-alexander',
    userName: '@ALEXANDER',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
    isViewed: false,
    lastUpdated: Date.now() - 1000 * 60 * 35,
    timeLabel: '03:56 AM',
    slides: [
      {
        id: 'alex-1',
        mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=85',
        mediaType: 'image',
        caption: 'Multi-vault Cloudinary cloud storage is active for high-speed media delivery.',
        timeFormatted: '03:56 AM',
        expiresIn: 'Expires in 21h',
        timestamp: Date.now() - 1000 * 60 * 35,
      },
      {
        id: 'alex-2',
        mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1080&q=85',
        mediaType: 'image',
        caption: 'Testing video stream compression & ultra-low latency playback.',
        timeFormatted: '04:10 AM',
        expiresIn: 'Expires in 22h',
        timestamp: Date.now() - 1000 * 60 * 20,
      },
    ],
  },
  {
    userId: 'user-sunnmisola',
    userName: 'Sunnmisola',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    isViewed: false,
    lastUpdated: Date.now() - 1000 * 60 * 55,
    timeLabel: '03:40 AM',
    slides: [
      {
        id: 'sun-1',
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=85',
        mediaType: 'image',
        caption: 'Early morning tranquility Focus mode on.',
        timeFormatted: '03:40 AM',
        expiresIn: 'Expires in 20h',
        timestamp: Date.now() - 1000 * 60 * 55,
      },
    ],
  },
  {
    userId: 'user-demon-alex',
    userName: 'DemonAlex',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80',
    isViewed: false,
    lastUpdated: Date.now() - 1000 * 60 * 120,
    timeLabel: '02:15 AM',
    slides: [
      {
        id: 'da-1',
        mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1080&q=85',
        mediaType: 'image',
        caption: 'Kernel 4.8 compiled without errors. Zero emoji policy enforced.',
        timeFormatted: '02:15 AM',
        expiresIn: 'Expires in 19h',
        timestamp: Date.now() - 1000 * 60 * 120,
      },
    ],
  },
  {
    userId: 'user-elena',
    userName: 'Elena Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    isViewed: true,
    lastUpdated: Date.now() - 1000 * 60 * 240,
    timeLabel: 'Yesterday, 11:30 PM',
    slides: [
      {
        id: 'el-1',
        mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1080&q=85',
        mediaType: 'image',
        caption: 'Arcade Quantum Pong leaderboard updated. Challenge accepted!',
        timeFormatted: '11:30 PM',
        expiresIn: 'Expires in 15h',
        timestamp: Date.now() - 1000 * 60 * 240,
      },
    ],
  },
  {
    userId: 'user-marcus',
    userName: 'Marcus Cole',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    isViewed: true,
    lastUpdated: Date.now() - 1000 * 60 * 360,
    timeLabel: 'Yesterday, 09:12 PM',
    slides: [
      {
        id: 'mc-1',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&q=85',
        mediaType: 'image',
        caption: 'Hardware diagnostics complete. Linode backend standing strong.',
        timeFormatted: '09:12 PM',
        expiresIn: 'Expires in 12h',
        timestamp: Date.now() - 1000 * 60 * 360,
      },
    ],
  },
];

export default function WhatsAppStatusPage() {
  const [statuses, setStatuses] = useState<UserStatusGroup[]>(INITIAL_DEMO_STATUSES);
  const [myStatus, setMyStatus] = useState<UserStatusGroup | null>(null);

  // Status Viewer State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [slideProgress, setSlideProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Text Status Creator State
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textStatusInput, setTextStatusInput] = useState('');
  const [textStatusBg, setTextStatusBg] = useState('#005C4B');

  // File Upload Ref for My Status
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Touch Swipe coordinates
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  // ==========================================
  // REAL-TIME FIRESTORE LISTENER
  // ==========================================
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) return;

    try {
      const q = query(collection(db, 'statuses'), orderBy('timestamp', 'desc'), limit(50));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) return;

          const now = Date.now();
          const groupsMap = new Map<string, UserStatusGroup>();

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const createdAt = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : (data.createdAtMs || now);
            const expiresAt = data.expiresAtMs || (createdAt + 24 * 60 * 60 * 1000);

            // Filter out expired statuses
            if (expiresAt <= now) return;

            const remainingMs = Math.max(0, expiresAt - now);
            const remHours = Math.floor(remainingMs / (1000 * 60 * 60));
            const remMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            const expiresInStr = remHours > 0 ? `Expires in ${remHours}h` : `Expires in ${remMins}m`;

            const dateObj = new Date(createdAt);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const uId = data.userId || 'anon';
            const uName = data.username || data.userName || '@User';
            const uAvatar = data.userAvatar || data.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80';

            const slide: StorySlide = {
              id: docSnap.id,
              mediaUrl: data.imageUrl || data.mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=85',
              mediaType: data.mediaType?.startsWith('video') ? 'video' : 'image',
              caption: data.caption || data.text || data.content || '',
              timeFormatted: timeStr,
              expiresIn: expiresInStr,
              timestamp: createdAt,
            };

            if (!groupsMap.has(uId)) {
              groupsMap.set(uId, {
                userId: uId,
                userName: uName,
                avatarUrl: uAvatar,
                isViewed: false,
                slides: [slide],
                lastUpdated: createdAt,
                timeLabel: timeStr,
              });
            } else {
              groupsMap.get(uId)!.slides.push(slide);
            }
          });

          if (groupsMap.size > 0) {
            setStatuses(Array.from(groupsMap.values()));
          }
        },
        (error) => {
          console.warn('[Firestore] Status subscription warning:', error);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('[Firestore] Error attaching status listener:', e);
    }
  }, []);

  // Compute flattened viewing list (My Status first if available, then other statuses)
  const allGroups: UserStatusGroup[] = React.useMemo(() => {
    const list: UserStatusGroup[] = [];
    if (myStatus && myStatus.slides.length > 0) {
      list.push(myStatus);
    }
    return list.concat(statuses);
  }, [myStatus, statuses]);

  const currentGroup = allGroups[activeGroupIndex] || allGroups[0];
  const currentSlide = currentGroup?.slides[activeSlideIndex] || currentGroup?.slides[0];

  // ==========================================
  // STORY VIEWER PROGRESS & AUTO-ADVANCE
  // ==========================================
  const handleNextSlide = useCallback(() => {
    if (!currentGroup) return;

    if (activeSlideIndex < currentGroup.slides.length - 1) {
      setActiveSlideIndex((prev) => prev + 1);
      setSlideProgress(0);
    } else {
      // Mark current group as viewed
      setStatuses((prev) =>
        prev.map((g) => (g.userId === currentGroup.userId ? { ...g, isViewed: true } : g))
      );

      // Advance to next user or close
      if (activeGroupIndex < allGroups.length - 1) {
        setActiveGroupIndex((prev) => prev + 1);
        setActiveSlideIndex(0);
        setSlideProgress(0);
      } else {
        setIsViewerOpen(false);
      }
    }
  }, [activeSlideIndex, currentGroup, activeGroupIndex, allGroups.length]);

  const handlePrevSlide = useCallback(() => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
      setSlideProgress(0);
    } else if (activeGroupIndex > 0) {
      const prevGroup = allGroups[activeGroupIndex - 1];
      setActiveGroupIndex((prev) => prev - 1);
      setActiveSlideIndex(prevGroup.slides.length - 1);
      setSlideProgress(0);
    }
  }, [activeSlideIndex, activeGroupIndex, allGroups]);

  useEffect(() => {
    if (!isViewerOpen || isPaused || !currentSlide) return;

    const SLIDE_DURATION = 5000; // 5 seconds per slide
    const INTERVAL_MS = 50;
    const increment = (INTERVAL_MS / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          handleNextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isViewerOpen, isPaused, currentSlide, handleNextSlide]);

  // ==========================================
  // USER ACTIONS & STATUS CREATION
  // ==========================================
  const openViewerForGroup = (groupIndex: number) => {
    setActiveGroupIndex(groupIndex);
    setActiveSlideIndex(0);
    setSlideProgress(0);
    setIsViewerOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const newSlide: StorySlide = {
      id: `my-${Date.now()}`,
      mediaUrl: previewUrl,
      mediaType: file.type.startsWith('video') ? 'video' : 'image',
      caption: 'Multi-vault Cloudinary cloud storage is active for high-speed media delivery.',
      timeFormatted: 'Just now',
      expiresIn: 'Expires in 24h',
      timestamp: Date.now(),
    };

    if (myStatus) {
      setMyStatus({
        ...myStatus,
        slides: [...myStatus.slides, newSlide],
        lastUpdated: Date.now(),
      });
    } else {
      setMyStatus({
        userId: 'my-uid',
        userName: 'My status',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
        isMe: true,
        isViewed: false,
        slides: [newSlide],
        lastUpdated: Date.now(),
        timeLabel: 'Just now',
      });
    }

    // Optional firestore write
    const db = getFirebaseDb();
    if (db) {
      addDoc(collection(db, 'statuses'), {
        userId: 'my-uid',
        username: 'My status',
        mediaUrl: previewUrl,
        mediaType: file.type,
        caption: 'Multi-vault Cloudinary cloud storage is active for high-speed media delivery.',
        timestamp: serverTimestamp(),
        createdAtMs: Date.now(),
        expiresAtMs: Date.now() + 24 * 60 * 60 * 1000,
      }).catch(() => {});
    }
  };

  const handlePostTextStatus = () => {
    if (!textStatusInput.trim()) return;

    const newSlide: StorySlide = {
      id: `text-${Date.now()}`,
      mediaUrl: '',
      mediaType: 'text',
      caption: textStatusInput.trim(),
      timeFormatted: 'Just now',
      expiresIn: 'Expires in 24h',
      timestamp: Date.now(),
      bgGradient: textStatusBg,
    };

    if (myStatus) {
      setMyStatus({
        ...myStatus,
        slides: [...myStatus.slides, newSlide],
        lastUpdated: Date.now(),
      });
    } else {
      setMyStatus({
        userId: 'my-uid',
        userName: 'My status',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
        isMe: true,
        isViewed: false,
        slides: [newSlide],
        lastUpdated: Date.now(),
        timeLabel: 'Just now',
      });
    }

    setTextStatusInput('');
    setIsTextModalOpen(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isViewerOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'Escape') {
        setIsViewerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, handleNextSlide, handlePrevSlide]);

  const recentUpdates = statuses.filter((s) => !s.isViewed);
  const viewedUpdates = statuses.filter((s) => s.isViewed);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0B141A] text-[#E9EDEF] select-none relative font-sans antialiased overflow-x-hidden">
      {/* Hidden File Input for uploading My Status */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Global CSS for scrollbar hiding */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ========================================================= */}
      {/* TOP APPBAR: Height 60px, bg #202C33, only "Status" h2 19px */}
      {/* ========================================================= */}
      <header className="h-[60px] bg-[#202C33] flex items-center justify-between px-4 py-3 border-b border-white/5 shadow-sm sticky top-0 z-30">
        <h2 className="text-[19px] font-bold text-[#E9EDEF] tracking-tight">Status</h2>
        <div className="flex items-center gap-4 text-[#8696A0]">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 hover:text-[#25D366] transition-colors rounded-full"
            title="Take Photo or Video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            className="p-1.5 hover:text-[#E9EDEF] transition-colors rounded-full"
            title="Options"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* STATUS HORIZONTAL LIST (64px circles)                     */}
      {/* Container: flex gap-3 overflow-x-auto scrollbar-hide...   */}
      {/* ========================================================= */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-3 py-4 bg-[#111B21] border-b border-white/5">
        {/* 1. MY STATUS */}
        <div className="relative flex flex-col items-center w-[72px] shrink-0">
          <div
            onClick={() => {
              if (myStatus && myStatus.slides.length > 0) {
                openViewerForGroup(0);
              } else {
                fileInputRef.current?.click();
              }
            }}
            className={`cursor-pointer transition-transform active:scale-95 ${
              myStatus && myStatus.slides.length > 0
                ? 'w-[60px] h-[60px] rounded-full p-[2.5px] bg-[#25D366]'
                : 'w-[56px] h-[56px]'
            }`}
          >
            <img
              src={
                myStatus?.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80'
              }
              alt="My status"
              className={`w-full h-full rounded-full object-cover ${
                myStatus && myStatus.slides.length > 0 ? 'border-[3px] border-[#111B21]' : 'ring-0'
              }`}
            />
          </div>

          {/* + Badge: absolute bottom-[20px] right-[8px] w-[22px] h-[22px] bg-[#25D366]... */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="absolute bottom-[20px] right-[8px] w-[22px] h-[22px] bg-[#25D366] rounded-full flex items-center justify-center border-[3px] border-[#111B21] text-white text-[14px] font-bold shadow-md hover:brightness-110 active:scale-90 transition-all select-none"
            title="Add status update"
          >
            +
          </button>

          <span className="text-[12.5px] text-[#E9EDEF] mt-1 truncate w-full text-center font-medium">
            My status
          </span>
        </div>

        {/* 2. OTHER STATUSES */}
        {statuses.map((item, index) => {
          const groupIdx = myStatus && myStatus.slides.length > 0 ? index + 1 : index;
          const isUnread = !item.isViewed;

          return (
            <div
              key={item.userId}
              onClick={() => openViewerForGroup(groupIdx)}
              className="w-[72px] shrink-0 flex flex-col items-center cursor-pointer transition-transform active:scale-95"
            >
              <div
                className={`w-[60px] h-[60px] rounded-full p-[2.5px] ${
                  isUnread ? 'bg-[#25D366]' : 'bg-[#8696A0]'
                }`}
              >
                <img
                  src={item.avatarUrl}
                  alt={item.userName}
                  className="w-full h-full rounded-full border-[3px] border-[#111B21] object-cover"
                />
              </div>
              <span className="text-[12.5px] text-[#E9EDEF] mt-1 w-full text-center truncate font-normal">
                {item.userName}
              </span>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* WHATSAPP ANDROID UPDATES BODY SECTION                     */}
      {/* ========================================================= */}
      <main className="flex-1 overflow-y-auto px-4 py-3 bg-[#0B141A]">
        {/* RECENT UPDATES SECTION */}
        {recentUpdates.length > 0 && (
          <section className="mb-4">
            <h3 className="text-[13px] font-semibold text-[#8696A0] uppercase tracking-wider mb-2">
              Recent updates
            </h3>
            <div className="space-y-1">
              {recentUpdates.map((item) => {
                const targetIdx = allGroups.findIndex((g) => g.userId === item.userId);
                return (
                  <div
                    key={item.userId}
                    onClick={() => openViewerForGroup(targetIdx >= 0 ? targetIdx : 0)}
                    className="flex items-center gap-3.5 py-2.5 px-1 rounded-xl cursor-pointer hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors"
                  >
                    <div className="w-[52px] h-[52px] rounded-full p-[2.5px] bg-[#25D366] shrink-0">
                      <img
                        src={item.avatarUrl}
                        alt={item.userName}
                        className="w-full h-full rounded-full border-[2.5px] border-[#0B141A] object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[16px] font-semibold text-[#E9EDEF] truncate">
                        {item.userName}
                      </h4>
                      <p className="text-[13px] text-[#8696A0] truncate">{item.timeLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* VIEWED UPDATES SECTION */}
        {viewedUpdates.length > 0 && (
          <section className="mb-6">
            <h3 className="text-[13px] font-semibold text-[#8696A0] uppercase tracking-wider mb-2">
              Viewed updates
            </h3>
            <div className="space-y-1">
              {viewedUpdates.map((item) => {
                const targetIdx = allGroups.findIndex((g) => g.userId === item.userId);
                return (
                  <div
                    key={item.userId}
                    onClick={() => openViewerForGroup(targetIdx >= 0 ? targetIdx : 0)}
                    className="flex items-center gap-3.5 py-2.5 px-1 rounded-xl cursor-pointer hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors opacity-80"
                  >
                    <div className="w-[52px] h-[52px] rounded-full p-[2.5px] bg-[#8696A0] shrink-0">
                      <img
                        src={item.avatarUrl}
                        alt={item.userName}
                        className="w-full h-full rounded-full border-[2.5px] border-[#0B141A] object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[16px] font-medium text-[#E9EDEF] truncate">
                        {item.userName}
                      </h4>
                      <p className="text-[13px] text-[#8696A0] truncate">{item.timeLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ========================================================= */}
      {/* FLOATING ACTION BUTTONS (Pencil + Camera)                 */}
      {/* ========================================================= */}
      <div className="fixed bottom-20 right-5 flex flex-col items-center gap-3 z-20">
        {/* Text Status Button */}
        <button
          onClick={() => setIsTextModalOpen(true)}
          className="w-10 h-10 rounded-full bg-[#202C33] text-[#8696A0] hover:text-[#E9EDEF] shadow-lg flex items-center justify-center border border-white/5 active:scale-95 transition-all"
          title="Create text status"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        {/* Camera Status Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 rounded-2xl bg-[#25D366] text-[#0B141A] shadow-xl flex items-center justify-center hover:brightness-105 active:scale-95 transition-all"
          title="Upload photo/video status"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* ========================================================= */}
      {/* WHATSAPP BOTTOM NAVIGATION BAR                             */}
      {/* ========================================================= */}
      <nav className="h-[64px] bg-[#202C33] border-t border-white/5 flex items-center justify-around px-2 z-20">
        <button className="flex flex-col items-center gap-1 text-[#8696A0] hover:text-[#E9EDEF] transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <span className="text-[11px] font-medium">Chats</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-[#25D366]">
          <div className="relative px-4 py-0.5 rounded-full bg-[#25D366]/15">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold">Status</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-[#8696A0] hover:text-[#E9EDEF] transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          <span className="text-[11px] font-medium">Communities</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-[#8696A0] hover:text-[#E9EDEF] transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.053 15.053 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.5 3.92c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.54c0-.55-.45-1-.99-1z" />
          </svg>
          <span className="text-[11px] font-medium">Calls</span>
        </button>
      </nav>

      {/* ========================================================= */}
      {/* STATUS VIEWER FULL-SCREEN (fixed inset-0 z-50 bg-black)    */}
      {/* ========================================================= */}
      {isViewerOpen && currentGroup && currentSlide && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
          onTouchStart={(e) => {
            touchStartXRef.current = e.touches[0].clientX;
            setIsPaused(true);
          }}
          onTouchEnd={(e) => {
            touchEndXRef.current = e.changedTouches[0].clientX;
            setIsPaused(false);
            const diffX = touchEndXRef.current - touchStartXRef.current;
            if (diffX > 50) {
              handlePrevSlide();
            } else if (diffX < -50) {
              handleNextSlide();
            }
          }}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
        >
          {/* Top Overlay Gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-20" />

          {/* Top Progress Bars (Segmented like Instagram / WhatsApp) */}
          <div className="relative z-30 pt-3 px-2 flex gap-1.5 w-full">
            {currentGroup.slides.map((slide, sIdx) => {
              let fillPercentage = 0;
              if (sIdx < activeSlideIndex) fillPercentage = 100;
              else if (sIdx === activeSlideIndex) fillPercentage = slideProgress;
              else fillPercentage = 0;

              return (
                <div key={slide.id} className="h-[2.5px] flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Top Header: Avatar + Name + Time top-left, Close X top-right */}
          <div className="relative z-30 flex items-center justify-between px-3 py-2 mt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsViewerOpen(false);
                }}
                className="text-white/90 hover:text-white p-1 rounded-full"
                title="Back"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <img
                src={currentGroup.avatarUrl}
                alt={currentGroup.userName}
                className="w-9 h-9 rounded-full object-cover border border-white/20"
              />
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[#E9EDEF] leading-tight drop-shadow">
                  {currentGroup.userName}
                </span>
                <span className="text-[12px] text-white/70 leading-tight">
                  {currentSlide.timeFormatted}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsViewerOpen(false);
              }}
              className="text-white/80 hover:text-white p-2 rounded-full active:scale-90 transition-transform"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Center Media Slide Area with Tap Left/Right Controls */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            {/* Left Tap Zone (Previous) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handlePrevSlide();
              }}
              className="absolute left-0 top-0 bottom-0 w-[30%] z-20 cursor-pointer"
              title="Previous"
            />

            {/* Right Tap Zone (Next) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleNextSlide();
              }}
              className="absolute right-0 top-0 bottom-0 w-[70%] z-20 cursor-pointer"
              title="Next"
            />

            {/* Render Slide Content */}
            {currentSlide.mediaType === 'text' ? (
              <div
                className="w-full h-full flex items-center justify-center px-8 text-center text-white text-2xl font-bold font-sans"
                style={{ background: currentSlide.bgGradient || '#005C4B' }}
              >
                <p className="max-w-md leading-relaxed">{currentSlide.caption}</p>
              </div>
            ) : currentSlide.mediaType === 'video' ? (
              <video
                src={currentSlide.mediaUrl}
                autoPlay
                playsInline
                muted
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <img
                src={currentSlide.mediaUrl}
                alt="Story media"
                className="max-h-full max-w-full object-contain pointer-events-none"
              />
            )}
          </div>

          {/* Bottom Caption & Old Info Overlay (time "03:56 AM", expires, caption) */}
          <div className="relative z-30 pb-5 pt-3 px-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2">
            {currentSlide.caption && currentSlide.mediaType !== 'text' && (
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center mx-auto max-w-xl w-full">
                <p className="text-[14.5px] text-[#E9EDEF] font-medium leading-relaxed">
                  {currentSlide.caption}
                </p>
                <div className="flex items-center justify-center gap-3 mt-2 text-[11.5px] text-[#8696A0]">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {currentSlide.timeFormatted}
                  </span>
                  <span>•</span>
                  <span className="text-[#25D366] font-semibold">{currentSlide.expiresIn}</span>
                </div>
              </div>
            )}

            {/* Quick Reply Bar (WhatsApp Android Style) */}
            <div className="flex items-center gap-2 max-w-xl mx-auto w-full mt-1">
              <input
                type="text"
                placeholder="Reply..."
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-sm text-[#E9EDEF] placeholder-white/50 focus:outline-none focus:border-[#25D366]"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-[#25D366] text-[#0B141A] flex items-center justify-center font-bold shrink-0 hover:brightness-110 active:scale-95 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  alert('Reply sent!');
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TEXT STATUS MODAL (WhatsApp Android Aa Editor)            */}
      {/* ========================================================= */}
      {isTextModalOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between p-6 select-none"
          style={{ background: textStatusBg }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsTextModalOpen(false)}
              className="text-white text-2xl p-2"
              title="Cancel"
            ><span className="text-lg font-bold">&times;</span></button>
            <div className="flex items-center gap-3">
              {/* Color switcher button */}
              <button
                onClick={() => {
                  const colors = ['#005C4B', '#5B21B6', '#1E3A8A', '#9D174D', '#B45309', '#15803D'];
                  const curIdx = colors.indexOf(textStatusBg);
                  const nextIdx = (curIdx + 1) % colors.length;
                  setTextStatusBg(colors[nextIdx]);
                }}
                className="w-8 h-8 rounded-full border-2 border-white/60 shadow flex items-center justify-center font-bold text-xs"
                title="Change background color"
              ><span className="text-xs font-mono">COLOR</span></button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <textarea
              autoFocus
              value={textStatusInput}
              onChange={(e) => setTextStatusInput(e.target.value)}
              placeholder="Type a status"
              maxLength={200}
              className="w-full bg-transparent text-white text-3xl font-bold text-center placeholder-white/40 focus:outline-none resize-none leading-relaxed"
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePostTextStatus}
              disabled={!textStatusInput.trim()}
              className="w-14 h-14 rounded-full bg-[#25D366] text-[#0B141A] shadow-xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
              title="Post status"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
