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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-[620px] rounded-[20px] bg-[#0C0C10] border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(255,184,0,0.1)] overflow-hidden font-mono text-xs flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-b from-amber-950/20 to-transparent border-b border-amber-500/20 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-tight">
                  PRO ARCHITECT: FOUNDER PASS
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
                  ONE-TIME LIFETIME
                </span>
              </div>
              <p className="text-[11px] text-[#F5F5F0]/60 mt-1 leading-relaxed">
                No monthly subscriptions. Pay once, own lifetime access to God-Mode Neural Deliberation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-[#F5F5F0]/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                desc: 'Zero extra charge for Claude 3.7 Sonnet, OpenAI o3, or Gemini 2.5.',
                icon: Sparkles,
              },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="p-3 rounded-[10px] bg-[#121218] border border-white/5 flex items-start gap-2.5"
                >
                  <Icon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block text-[11px]">{b.title}</span>
                    <span className="text-[10px] text-[#F5F5F0]/50 block mt-0.5 leading-normal">{b.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-[14px] bg-[#14141E] border border-amber-500/30 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">$29</span>
                <span className="text-xs text-[#F5F5F0]/40 line-through">$300/yr</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  SAVE 90%
                </span>
              </div>
              <span className="text-[10px] text-[#F5F5F0]/60 block mt-0.5">
                Single payment. Valid for lifetime across all personal devices.
              </span>
            </div>

            <a
              href="https://buy.stripe.com/test_demo_founder_pass"
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                // Auto-unlock demo for preview
                setIsProUnlocked(true);
              }}
              className="btn-press px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold font-mono text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,184,0,0.3)] hover:brightness-110 transition-all shrink-0"
            >
              <span>Get Founder Pass ($29)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* License Key Activation Section */}
          <form onSubmit={handleActivateKey} className="p-3.5 rounded-[12px] bg-[#101016] border border-white/10 flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#F5F5F0]/60 flex items-center gap-1.5">
              <Key className="w-3 h-3 text-[#5E6AD2]" />
              <span>Already have a license key?</span>
            </span>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                placeholder="PRO-XXXX-XXXX-XXXX"
                className="flex-1 px-3 py-2 rounded-[8px] bg-[#1A1A22] border border-white/10 text-white font-mono text-xs outline-none focus:border-[#5E6AD2]"
              />
              <button
                type="submit"
                className="btn-press px-3.5 py-2 rounded-[8px] bg-[#1E1E28] hover:bg-[#282836] border border-white/15 text-white font-mono text-xs font-semibold"
              >
                Activate
              </button>
            </div>

            {activationError && (
              <span className="text-[10px] text-red-400 font-mono mt-0.5">{activationError}</span>
            )}
            {activationSuccess && (
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Founder Pass activated! God-Mode Neural Core unlocked.</span>
              </span>
            )}
          </form>

          {/* The Anti-Bounce Generous Creator Pass */}
          <div className="p-3 rounded-[12px] bg-[#0E0E14] border border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <div>
                <span className="text-[10px] font-semibold text-white block">Student or Indie Developer?</span>
                <span className="text-[9px] text-[#F5F5F0]/50 block">We never want price to block you from building great software.</span>
              </div>
            </div>

            <button
              onClick={handleIndieUnlock}
              type="button"
              className="btn-press px-2.5 py-1.5 rounded-[7px] bg-[#181822] hover:bg-[#222230] border border-white/10 text-[#00FFA3] text-[10px] font-semibold shrink-0"
            >
              Unlock Free Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
