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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-[700px] rounded-[20px] bg-[#0C0C10] border border-[rgba(255,255,255,0.1)] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden font-mono text-xs flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-[#181824] to-transparent border-b border-[rgba(255,255,255,0.08)] flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#5E6AD2]/20 border border-[#5E6AD2]/40 flex items-center justify-center text-[#5E6AD2] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-tight">
                  PRODUCTION 3D/4D STARTER REPOSITORIES
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  NEXT.JS 14 APP ROUTER
                </span>
              </div>
              <p className="text-[11px] text-[#F5F5F0]/60 mt-1 leading-relaxed">
                Skip 8 hours of Three.js rigging. Ready-to-deploy codebases with pre-configured 3D assets, Lenis smooth scrolling, and responsive viewports.
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

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="p-4 rounded-[12px] bg-[#121218] border border-[rgba(255,255,255,0.06)] hover:border-[#5E6AD2]/40 transition-colors flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{repo.title}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-[#F5F5F0]/60 border border-white/10">
                      {repo.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#F5F5F0]/70 mt-1 leading-relaxed">{repo.desc}</p>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className="text-sm font-bold text-white block">{repo.price}</span>
                  <span className="text-[9px] text-[#F5F5F0]/40 block">One-Time</span>
                </div>
              </div>

              {/* Stack tags */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                {repo.stack.map((tech, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-black/40 text-[#F5F5F0]/60 border border-white/5">
                    {tech}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[10px] text-[#F5F5F0]/50 font-mono">
                  <Terminal className="w-3 h-3 text-[#5E6AD2]" />
                  <span>git clone ready with .env.example</span>
                </div>

                <a
                  href={`https://buy.stripe.com/test_demo_repo_${repo.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1C1C26] hover:bg-[#282836] border border-white/10 text-white font-mono text-[11px] font-semibold transition-colors"
                >
                  <span>Get Repo Access ({repo.price})</span>
                  <ExternalLink className="w-3 h-3 text-[#5E6AD2]" />
                </a>
              </div>
            </div>
          ))}

          {/* All-Access Bundle */}
          <div className="p-4 rounded-[12px] bg-gradient-to-r from-amber-950/20 via-[#1C1C28] to-indigo-950/20 border border-amber-500/30 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-xs">All-Access Production Starter Bundle</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-semibold">
                  BEST VALUE
                </span>
              </div>
              <p className="text-[10px] text-[#F5F5F0]/60 mt-1">
                Get all 3 starter repositories + every upcoming 3D/4D scrollytelling template forever.
              </p>
            </div>

            <a
              href="https://buy.stripe.com/test_demo_bundle"
              target="_blank"
              rel="noreferrer"
              className="btn-press px-4 py-2 rounded-[9px] bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold font-mono text-xs flex items-center gap-1.5 shrink-0 shadow-[0_0_16px_rgba(255,184,0,0.25)]"
            >
              <span>Get All Repos ($59)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
