'use client';

import React from 'react';
import { PhysicsSettings, DEFAULT_UNREAL_SETTINGS, DEFAULT_REALISTIC_SETTINGS } from '../lib/unrealPhysics';

interface PhysicsPanelProps {
  settings: PhysicsSettings;
  onChange: (updated: Partial<PhysicsSettings>) => void;
  onReset: (mode: 'unreal' | 'realistic') => void;
}

export default function PhysicsPanel({ settings, onChange, onReset }: PhysicsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-[#0d0d12] border-l border-white/10 p-3 select-none text-xs text-neutral-300 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88]" />
          <h3 className="font-bold text-white uppercase text-[11px] tracking-wider">Physics Engine</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onReset('unreal')}
            className="px-2 py-0.5 rounded bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold text-[10px] hover:bg-[#00FF88]/25 transition"
          >
            Unreal
          </button>
          <button
            type="button"
            onClick={() => onReset('realistic')}
            className="px-2 py-0.5 rounded bg-white/10 text-neutral-400 font-bold text-[10px] hover:text-white transition"
          >
            Real
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Gravity */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold">Gravity Acceleration</span>
            <span className={`font-mono font-bold ${settings.gravity < 0 ? 'text-[#00FF88]' : 'text-white'}`}>
              {settings.gravity.toFixed(1)} m/s²
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={settings.gravity}
            onChange={(e) => onChange({ gravity: parseFloat(e.target.value) })}
            className="w-full accent-[#00FF88] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
            <span>-10 (Float Up)</span>
            <span>0 (Zero-G)</span>
            <span>+10 (Earth)</span>
          </div>
        </div>

        {/* Time Scale (Matrix Slow-Mo) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold">Time Scale (Dilation)</span>
            <span className="font-mono font-bold text-cyan-400">
              {settings.timeScale.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="3.0"
            step="0.05"
            value={settings.timeScale}
            onChange={(e) => onChange({ timeScale: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
            <span>0.05x (Bullet Time)</span>
            <span>1.0x (Normal)</span>
            <span>3.0x (Hyper)</span>
          </div>
        </div>

        {/* Exaggeration Factor */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold">Unreal Exaggeration</span>
            <span className="font-mono font-bold text-[#FE2C55]">
              {settings.exaggeration.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.2"
            value={settings.exaggeration}
            onChange={(e) => onChange({ exaggeration: parseFloat(e.target.value) })}
            className="w-full accent-[#FE2C55] cursor-pointer"
          />
          <span className="text-[10px] text-neutral-400">
            Multiplies acrobatic jump height and flip velocity.
          </span>
        </div>

        {/* Bounciness / Restitution */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold">Bounciness (Restitution)</span>
            <span className="font-mono font-bold text-amber-400">
              {settings.bounciness.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.5"
            step="0.1"
            value={settings.bounciness}
            onChange={(e) => onChange({ bounciness: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Water Freeze Trigger Point */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold">Freeze Trigger Point</span>
            <span className="font-mono font-bold text-blue-300">
              {(settings.freezePoint * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={settings.freezePoint}
            onChange={(e) => onChange({ freezePoint: parseFloat(e.target.value) })}
            className="w-full accent-blue-400 cursor-pointer"
          />
        </div>

        {/* Pass-Through Collision Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
          <div className="flex flex-col">
            <span className="font-semibold text-white text-[11px]">Phase Through Matter</span>
            <span className="text-[10px] text-neutral-400">Objects pass through water and mesh</span>
          </div>
          <button
            type="button"
            onClick={() => onChange({ collisionEnabled: !settings.collisionEnabled })}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              !settings.collisionEnabled ? 'bg-[#00FF88]' : 'bg-neutral-600'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black absolute top-0.5 transition-transform ${
                !settings.collisionEnabled ? 'left-4.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
