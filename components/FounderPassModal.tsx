'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Crown,
  CheckCircle2,
  Sparkles,
  Key,
  ShieldCheck,
  Zap,
  ArrowRight,
  Heart,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

interface FounderPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProUnlocked: boolean;
  setIsProUnlocked: (val: boolean) => void;
}

export function FounderPassModal({
  isOpen,
  onClose,
  isProUnlocked,
  setIsProUnlocked,
}: FounderPassModalProps) {
  const [licenseInput, setLicenseInput] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);

  if (!isOpen) return null;

  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');

    const trimmed = licenseInput.trim().toUpperCase();
    if (!trimmed) {
      setActivationError('Please enter a license key.');
      return;
    }

    // Accepts any valid founder license format or custom key
    if (trimmed.length >= 8 || trimmed.startsWith('PRO-') || trimmed.startsWith('FOUNDER-')) {
      localStorage.setItem('prompt_forge_pro_key', trimmed);
      setIsProUnlocked(true);
      setActivationSuccess(true);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB800', '#5E6AD2', '#FFFFFF', '#00FFA3'],
      });

      setTimeout(() => {
        setActivationSuccess(false);
        onClose();
      }, 1800);
    } else {
      setActivationError('Invalid license key format. Keys start with PRO- or FOUNDER-.');
    }
  };

  const handleIndieUnlock = () => {
    localStorage.setItem('prompt_forge_pro_key', 'COMMUNITY-CREATOR-PASS');
    setIsProUnlocked(true);
    setActivationSuccess(true);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00FFA3', '#5E6AD2', '#FFFFFF'],
    });

    setTimeout(() => {
      setActivationSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 w-full h-[100dvh] bg-[#0b141a] flex flex-col overflow-hidden animate-[tgSlideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] select-none"
    >
      {/* 2. Top Bar: Back < + Title + X, px-4 py-3, border-b border-white/10, sticky top-0 */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0b141a] shrink-0 min-h-[54px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5 text-[#00a884]" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-tight">Founder Pass</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
                  LIFETIME
                </span>
              </div>
              <p className="text-[11px] text-[#8696a0]">God-Mode Neural Reasoning & Architect Core</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 3. Content: flex-1 overflow-y-auto px-4 py-4, scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: '32k God-Mode Reasoning',
              desc: 'Full O3-Max chain-of-thought with 4-agent Council deliberation.',
              icon: Zap,
            },
            {
              title: 'Quantum Layout Surgeon',
              desc: 'Unlimited AST diagnoses & Apple-grade architectural restructures.',
              icon: ShieldCheck,
            },
            {
              title: 'Production Code Exports',
              desc: '1-click clean .tsx component & Windows .bat script downloads.',
              icon: CheckCircle2,
            },
            {
              title: 'All Future Models Included',
              desc: 'Zero API markup or rate limits. Continuous evergreen upgrades.',
              icon: Sparkles,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-[#202c33]/60 border border-white/5 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.title}</span>
              </div>
              <p className="text-[11.5px] text-[#8696a0] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* License Activation Form */}
        <form onSubmit={handleActivateKey} className="flex flex-col gap-2.5 p-4 rounded-2xl bg-[#202c33]/50 border border-white/5">
          <label className="flex items-center gap-2 text-xs font-semibold text-white/90">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Have a license key or gumroad order?</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={licenseInput}
              onChange={(e) => setLicenseInput(e.target.value)}
              placeholder="PRO-XXXX-XXXX-XXXX"
              className="flex-1 px-3.5 py-3 rounded-xl bg-[#2a3942] border border-white/10 text-white font-mono text-xs outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-[#2a3942] hover:bg-[#34444e] border border-white/15 text-white text-xs font-semibold"
            >
              Activate
            </button>
          </div>

          {activationError && (
            <span className="text-xs text-red-400 font-mono mt-0.5">{activationError}</span>
          )}
          {activationSuccess && (
            <span className="text-xs text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Founder Pass activated! God-Mode Neural Core unlocked.</span>
            </span>
          )}
        </form>

        {/* Generous Creator Pass */}
        <div className="p-4 rounded-2xl bg-[#202c33]/40 border border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Heart className="w-4 h-4 text-pink-400 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-white block">Student or Indie Developer?</span>
              <span className="text-[11px] text-[#8696a0] block">We never want price to block you from building great software.</span>
            </div>
          </div>

          <button
            onClick={handleIndieUnlock}
            type="button"
            className="px-3.5 py-2 rounded-full bg-[#202c33] hover:bg-[#2a3942] border border-[#00a884]/40 text-[#00a884] text-xs font-semibold shrink-0 cursor-pointer"
          >
            Unlock Free
          </button>
        </div>
      </div>

      {/* 4. Bottom Action: Sticky bottom: p-4 border-t border-white/10, button w-full h-[50px] rounded-full */}
      <div className="sticky bottom-0 z-20 p-4 border-t border-white/10 bg-[#0b141a] pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
        <a
          href="https://alexhack235.gumroad.com"
          target="_blank"
          rel="noreferrer"
          className="w-full h-[50px] rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-[15.5px] font-semibold tracking-wide transition-colors shadow-lg shadow-[#00a884]/25 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Claim Lifetime Pass ($29)</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default FounderPassModal;
