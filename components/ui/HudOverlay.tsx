'use client';

import React from 'react';
import { useNexStore } from '@/lib/store';
import { Activity, Shield, Cpu, Lock, Layers } from 'lucide-react';

const WAYPOINTS = [
  { step: 1, label: 'NEXCORE PRISM', range: '0-25%' },
  { step: 2, label: 'CAD DISASSEMBLY', range: '25-50%' },
  { step: 3, label: 'TERMINAL TUNNEL', range: '50-75%' },
  { step: 4, label: 'CONVERGENCE', range: '75-90%' },
  { step: 5, label: 'PRODUCTION UNLOCK', range: '90-100%' },
];

export function HudOverlay() {
  const scrollProgress = useNexStore((s) => s.scrollProgress);
  const activeWaypoint = useNexStore((s) => s.activeWaypoint);
  const cipherPackets = useNexStore((s) => s.cipherPackets);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden flex flex-col justify-between p-4 sm:p-8">
      {/* 1. Precision SVG Corner Reticles in #00FF88 */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00FF88]/60" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00FF88]/60" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00FF88]/60" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00FF88]/60" />

      {/* 2. Top Telemetry Stream */}
      <div className="flex items-start justify-between pt-16 sm:pt-14 w-full">
        {/* Left Telemetry Feed */}
        <div className="bg-[#0A0E13]/85 backdrop-blur-md border border-[rgba(0,255,136,0.18)] p-2.5 sm:p-3 rounded-lg font-mono text-[10px] sm:text-[11px] text-[#8696A0] max-w-xs shadow-xl">
          <div className="flex items-center gap-2 text-[#00FF88] font-bold pb-1 border-b border-white/5 mb-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>NEX_CAD_TELEMETRY // STREAM</span>
          </div>
          <div className="space-y-0.5">
            <div>NODES: <span className="text-[#00FF88] font-bold">147,353</span> LINES</div>
            <div>SOCKET: <span className="text-[#00F2FF]">AES-GCM-256</span> VERIFIED</div>
            <div>BUDGET: <span className="text-white font-semibold">60 FPS (16.6ms)</span></div>
          </div>
        </div>

        {/* Right Active Waypoint Tag */}
        <div className="bg-[#0A0E13]/85 backdrop-blur-md border border-[rgba(0,242,255,0.2)] p-2.5 sm:p-3 rounded-lg font-mono text-right text-[10px] sm:text-[11px] shadow-xl">
          <div className="flex items-center justify-end gap-2 text-[#00F2FF] font-bold pb-1 border-b border-white/5 mb-1.5">
            <Activity className="w-3.5 h-3.5 text-[#00F2FF]" />
            <span>WAYPOINT_STATE</span>
          </div>
          <div className="text-white font-bold font-orbitron text-xs sm:text-sm">
            {WAYPOINTS[activeWaypoint - 1]?.label || 'INITIALIZING'}
          </div>
          <div className="text-[#00FF88] font-mono text-[10px]">
            SCRUB: {(scrollProgress * 100).toFixed(1)}% [{WAYPOINTS[activeWaypoint - 1]?.range}]
          </div>
        </div>
      </div>

      {/* 3. Center Left Waypoint Track Indicator */}
      <div className="hidden lg:flex flex-col gap-2.5 absolute left-8 top-1/2 -translate-y-1/2">
        <div className="text-[9px] font-mono tracking-widest uppercase text-white/40 mb-1">
          // SCROLLWAY
        </div>
        {WAYPOINTS.map((wp) => {
          const isActive = wp.step === activeWaypoint;
          return (
            <div
              key={wp.step}
              className={`flex items-center gap-2.5 transition-all duration-300 font-mono text-[10px] ${
                isActive ? 'text-[#00FF88] font-bold translate-x-2' : 'text-white/40'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  isActive ? 'bg-[#00FF88] ring-4 ring-[#00FF88]/20' : 'bg-white/20'
                }`}
              />
              <span>0{wp.step} // {wp.label}</span>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Status Pill & Scrub Progress Bar */}
      <div className="w-full flex flex-col items-center gap-3 pb-2 sm:pb-4">
        {/* Progress Bar Line */}
        <div className="w-full max-w-xl h-1 bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#00FF88] via-[#00F2FF] to-[#00FF88] transition-all duration-75"
            style={{ width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }}
          />
        </div>

        {/* Floating Bottom Telemetry Pill */}
        <div className="flex items-center gap-3 sm:gap-6 px-4 sm:px-6 py-2 rounded-full bg-[#0A0E13]/90 border border-[rgba(0,255,136,0.25)] font-mono text-[10px] sm:text-xs text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-1.5 text-[#00FF88]">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-bold">E2E CIPHER ACTIVE</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5 text-[#00F2FF]">
            <Layers className="w-3.5 h-3.5" />
            <span>PACKETS: {cipherPackets.toLocaleString()}</span>
          </div>
          <span className="text-white/20 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-white/60">
            <span>SCRUB: LENIS 0.05 LERP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
