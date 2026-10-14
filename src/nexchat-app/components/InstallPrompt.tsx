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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0f172a] border border-[#7C3AED]/40 p-6 text-center text-white shadow-2xl shadow-purple-900/40">
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          title="Close"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-3">
          <img 
            src="/favicons/icon-192.png" 
            alt="NEXCHAT App Icon" 
            className="w-16 h-16 rounded-2xl shadow-lg shadow-purple-600/30 border border-purple-500/30" 
          />
          <h2 className="text-xl font-bold tracking-wide text-white">DOWNLOAD NEXCHAT</h2>
          <p className="text-sm text-gray-300">Get app for your phone. For you better experience.</p>
          <div className="flex gap-3 w-full mt-2">
            <button 
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white shadow-lg hover:bg-green-500 active:scale-95 transition-all text-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Download on Google Play</span>
            </button>
            <button 
              onClick={handleDismiss}
              className="rounded-xl border border-gray-600 px-4 py-2.5 font-medium text-gray-300 hover:bg-white/10 active:scale-95 transition-all text-sm"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
