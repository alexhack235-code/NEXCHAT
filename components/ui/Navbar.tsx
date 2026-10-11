'use client';

import React from 'react';
import { ShieldCheck, Terminal, Radio, ArrowUpRight } from 'lucide-react';

export function Navbar() {
  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full bg-[#0A0E13]/85 backdrop-blur-xl border border-[rgba(0,255,136,0.2)] shadow-2xl shadow-black/80">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="font-orbitron font-black text-lg sm:text-xl tracking-wider text-[#00FF88] drop-shadow-[0_0_12px_rgba(0,255,136,0.6)]">
              &gt; NEXCHAT<span className="animate-pulse text-white">_</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(0,255,136,0.08)] border border-[rgba(0,255,136,0.25)] text-[10px] font-mono text-[#00FF88]">
            <ShieldCheck className="w-3 h-3 text-[#00FF88]" />
            <span>VERIFIED ARCHITECTURE</span>
          </div>
        </div>

        {/* Telemetry Status Badge */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-xs text-[#8696A0]">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#111B21] border border-white/5">
            <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
            <span className="text-[#00FF88] font-bold">MESH: ONLINE</span>
            <span className="text-white/30">|</span>
            <span className="text-[#00F2FF]">24H_EPHEMERAL</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PLAY 3D GAME CTA */}
          <a
            href="/game"
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600/30 to-emerald-600/30 hover:from-red-600/50 hover:to-emerald-600/50 border border-red-500/50 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            <Radio className="w-3.5 h-3.5 text-[#00FF88] animate-pulse" />
            <span>PLAY 3D GAME</span>
          </a>

          <a
            href="#hacker-terminal"
            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-[#00FF88]" />
            <span>Terminal</span>
          </a>

          <a
            href="#bento-grid"
            className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-full bg-gradient-to-r from-[#00FF88] to-[#00F2FF] hover:brightness-110 text-black font-mono font-bold text-xs shadow-lg shadow-[#00FF88]/20 transition-all active:scale-95"
          >
            <span>Launch Core</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-black" />
          </a>
        </div>
      </nav>
    </header>
  );
}
