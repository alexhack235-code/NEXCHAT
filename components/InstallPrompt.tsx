'use client';

import React, { useState, useEffect } from 'react';

// Inline SVG Lucide-compatible icons (Zero dependencies, Zero Mojibake, Zero Emoji)
const DownloadIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ChevronLeftIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const XIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if dismissed recently or running standalone
    const isDismissed = localStorage.getItem('nexchat_install_dismissed');
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );

    if (isDismissed || isStandalone) {
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Auto-prompt after brief delay if not standalone
    const timer = setTimeout(() => {
      if (!isDismissed && !isStandalone) {
        setShowModal(true);
      }
    }, 3500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleDownload = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        localStorage.removeItem('nexchat_install_dismissed');
      }
      setDeferredPrompt(null);
    } else {
      // Default to Google Play Store / PWA target
      window.open('https://play.google.com/store/apps/details?id=com.nexchat.app', '_blank');
    }
    setShowModal(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('nexchat_install_dismissed', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 w-full h-[100dvh] bg-[#0b141a] flex flex-col overflow-hidden select-none animate-[tgSlideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
      {/* Telegram Mobile Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0b141a] shrink-0 min-h-[54px]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleDismiss}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Back"
            aria-label="Back"
          >
            <ChevronLeftIcon className="w-5 h-5 text-[#00a884]" />
          </button>
          <h1 className="text-base font-bold text-white tracking-wide">Install NEXCHAT</h1>
        </div>
        <button 
          type="button"
          onClick={handleDismiss}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Close"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-center text-center gap-5">
        <div className="relative">
          <img 
            src="/favicons/icon-192.png" 
            alt="NEXCHAT App Icon" 
            className="w-24 h-24 rounded-3xl shadow-2xl shadow-[#00a884]/20 border border-[#00a884]/40" 
          />
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-[#00a884] text-[10px] font-black tracking-wider uppercase text-black">
            PRO PWA
          </span>
        </div>

        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-bold tracking-wide text-white">Experience NEXCHAT Native</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Instant push notifications, zero latency end-to-end encryption, and full offline sync directly on your mobile device.
          </p>
        </div>

        <div className="w-full max-w-xs p-3.5 rounded-2xl bg-[#202c33]/50 border border-white/5 text-left text-xs text-neutral-300 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[#00a884]">✓</span>
            <span>Always-on Quantum Air-Gap Protection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00a884]">✓</span>
            <span>60FPS Cyber Video Call Pipeline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00a884]">✓</span>
            <span>Biometric App & Decoy Vault Lock</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 z-20 p-4 border-t border-white/10 bg-[#0b141a] pb-[calc(16px+env(safe-area-inset-bottom,0px))] flex flex-col gap-2.5">
        <button 
          type="button"
          onClick={handleDownload}
          className="w-full h-[50px] rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00a884]/25"
        >
          <DownloadIcon className="w-4 h-4" />
          <span>Download on Google Play</span>
        </button>
        <button 
          type="button"
          onClick={handleDismiss}
          className="w-full h-[44px] rounded-full text-neutral-400 hover:text-white font-medium text-xs transition-colors flex items-center justify-center cursor-pointer"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
