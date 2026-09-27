'use client';

import React from 'react';

interface UnrealToggleProps {
  enabled: boolean;
  onToggle: (state: boolean) => void;
}

export default function UnrealToggle({ enabled, onToggle }: UnrealToggleProps) {
  return (
    <div
      onClick={() => onToggle(!enabled)}
      className={`cursor-pointer select-none px-3.5 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-2.5 ${
        enabled
          ? 'bg-[#00FF88]/15 border-[#00FF88] shadow-lg shadow-[#00FF88]/20 text-[#00FF88]'
          : 'bg-white/5 border-white/10 hover:border-white/20 text-neutral-400'
      }`}
    >
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            enabled ? 'bg-[#00FF88] shadow-sm shadow-[#00FF88]' : 'bg-neutral-600'
          }`}
        />
        {enabled && (
          <div className="absolute inset-0 rounded-full bg-[#00FF88] animate-ping opacity-75" />
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider">
            {enabled ? 'UNREAL ENGINE MODE: ACTIVE' : 'UNREAL PHYSICS: OFF'}
          </span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
              enabled
                ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40'
                : 'bg-white/10 text-neutral-400'
            }`}
          >
            {enabled ? 'DEFYING REALITY' : 'NORMAL'}
          </span>
        </div>
        <span className="text-[9px] text-neutral-400 font-mono">
          {enabled ? 'Gravity -9.8 • 0.05x Bullet Time • Particle Logo' : 'Standard Newtonian kinematics'}
        </span>
      </div>
    </div>
  );
}
