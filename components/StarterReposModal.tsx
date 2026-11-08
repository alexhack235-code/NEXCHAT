'use client';

import React from 'react';
import {
  X,
  Layers,
  ExternalLink,
  Code2,
  Terminal,
  CheckCircle2,
  Sparkles,
  Download,
  ChevronLeft,
} from 'lucide-react';

interface StarterReposModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StarterReposModal({ isOpen, onClose }: StarterReposModalProps) {
  if (!isOpen) return null;

  const repos = [
    {
      id: 'apple-3d',
      title: 'Apple Titanium 3D Scrollytelling Repo',
      tag: 'Next.js 14 + Three.js',
      price: '$24',
      desc: 'Complete production repository with rigged 3D titanium chassis GLTF model, Lenis 400vh pinned timeline, and SVG telemetry callout coordinates.',
      stack: ['Next.js 14 App Router', 'Three.js / React Three Fiber', 'Lenis Scroll lerp 0.05', 'Tailwind CSS'],
      demoUrl: 'https://github.com/docforge-templates/apple-titanium-3d',
    },
    {
      id: 'cyberpunk-4d',
      title: 'Cyberpunk 4D Nuclear Shader Core Repo',
      tag: 'WebGL + GLSL Shaders',
      price: '$24',
      desc: 'High-performance WebGL shader flythrough with dynamic vertex warp, chromatic aberration tied to scroll velocity, and live monospace terminal HUD.',
      stack: ['Custom GLSL Shaders', 'Post-processing Bloom', 'Tailwind CSS', 'Geist Mono Typography'],
      demoUrl: 'https://github.com/docforge-templates/cyberpunk-4d-core',
    },
    {
      id: 'fintech-bento',
      title: 'Fintech Precision 60fps Bento Grid Repo',
      tag: 'Tailwind + Framer Motion',
      price: '$19',
      desc: 'Stripe-inspired 12-column responsive Bento grid platform with mouse-tilt 3D perspective, ambient purple glowing orbs, and WCAG AAA compliance.',
      stack: ['Framer Motion', 'Lenis Inertia', 'Lucide Vector Glyphs', 'Instrument Serif'],
      demoUrl: 'https://github.com/docforge-templates/fintech-bento-grid',
    },
  ];

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
            <div className="w-8 h-8 rounded-lg bg-[#202c33] border border-white/10 flex items-center justify-center text-[#00a884]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-tight">
                  Starter Repositories
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  NEXT.JS 14
                </span>
              </div>
              <p className="text-[11px] text-[#8696a0]">Ready-to-deploy codebases with pre-configured 3D assets</p>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {repos.map((repo) => (
          <div
            key={repo.id}
            className="p-4 rounded-2xl bg-[#202c33]/60 border border-white/5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm block">{repo.title}</span>
                <span className="text-[11px] text-[#00a884] font-semibold">{repo.tag}</span>
              </div>
              <span className="text-sm font-bold text-white bg-white/10 px-2.5 py-1 rounded-full">
                {repo.price}
              </span>
            </div>

            <p className="text-xs text-[#8696a0] leading-relaxed">{repo.desc}</p>

            <div className="flex flex-wrap gap-1.5">
              {repo.stack.map((item, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-[#2a3942] border border-white/5 text-[10px] text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <a
                href={repo.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#00a884] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Live Preview & Repo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://alexhack235.gumroad.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Get Codebase</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Bottom Action: Sticky bottom: p-4 border-t border-white/10, button w-full h-[50px] rounded-full */}
      <div className="sticky bottom-0 z-20 p-4 border-t border-white/10 bg-[#0b141a] pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-[50px] rounded-full bg-[#202c33] hover:bg-[#2a3942] text-white text-[15px] font-semibold border border-white/10 transition-colors flex items-center justify-center cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default StarterReposModal;
