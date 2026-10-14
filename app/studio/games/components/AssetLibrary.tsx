'use client';

import React, { useState } from 'react';

interface AssetLibraryProps {
  selectedCharacter: string;
  onSelectCharacter: (charId: string) => void;
  selectedEnvironment: string;
  onSelectEnvironment: (envId: string) => void;
  activeVFX: string[];
  onToggleVFX: (vfxId: string) => void;
}

export default function AssetLibrary({
  selectedCharacter,
  onSelectCharacter,
  selectedEnvironment,
  onSelectEnvironment,
  activeVFX,
  onToggleVFX
}: AssetLibraryProps) {
  const [tab, setTab] = useState<'chars' | 'props' | 'vfx' | 'envs'>('chars');

  const characters = [
    { id: 'mixamo_ninja', name: 'Mixamo Cyber Shinobi', type: 'Rigged FBX', icon: '🥷' },
    { id: 'cyborg_soldier', name: 'Titan Mech Soldier', type: 'Bipedal Bones', icon: '🤖' },
    { id: 'anime_valkyrie', name: 'Quantum Valkyrie', type: 'Exaggerated Rig', icon: '⚡' },
    { id: 'neon_android', name: 'Neon Android 2099', type: 'Morph Targets', icon: '🦾' }
  ];

  const props = [
    { id: 'iphone_18', name: 'iPhone 18 Pro Ice', type: 'Refractive Glass', icon: '📱' },
    { id: 'samsung_s26', name: 'Galaxy S26 Ultra', type: 'Armor Titanium', icon: '📱' },
    { id: 'plasma_katana', name: 'Zero-G Katana', type: 'Laser Mesh', icon: '🗡️' },
    { id: 'water_chamber', name: 'Cryo Water Pod', type: 'Volumetric Glass', icon: '🧪' }
  ];

  const vfx = [
    { id: 'water_freeze', name: 'Liquid Nitrogen Freeze', type: 'Custom GLSL Shader', icon: '❄️' },
    { id: 'shard_explosion', name: '10k Glass Shard Burst', type: 'Compute Particles', icon: '💥' },
    { id: 'nex_logo_formation', name: 'NEX Logo Magnetic Pull', type: 'Vector Field Attractor', icon: '✨' },
    { id: 'bullet_time_trails', name: 'Matrix Speed Trails', type: 'Ribbon Geometry', icon: '🕶️' }
  ];

  const environments = [
    { id: 'water_lab', name: 'Cryogenic Testing Lab', type: 'Interior Neon', icon: '🔬' },
    { id: 'neo_tokyo', name: 'Cyberpunk Neo-Tokyo', type: 'Outdoor Wet City', icon: '🏙️' },
    { id: 'orbital_arena', name: 'Zero-G Orbital Station', type: 'Deep Space Void', icon: '🌌' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d0d12] border-r border-white/10 select-none text-xs text-neutral-300">
      {/* Category Tabs */}
      <div className="grid grid-cols-4 p-1.5 bg-[#121218] border-b border-white/10 gap-1 text-[10px] font-bold">
        <button
          type="button"
          onClick={() => setTab('chars')}
          className={`py-1 rounded text-center transition ${
            tab === 'chars' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Actors
        </button>
        <button
          type="button"
          onClick={() => setTab('props')}
          className={`py-1 rounded text-center transition ${
            tab === 'props' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Props
        </button>
        <button
          type="button"
          onClick={() => setTab('vfx')}
          className={`py-1 rounded text-center transition ${
            tab === 'vfx' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          VFX
        </button>
        <button
          type="button"
          onClick={() => setTab('envs')}
          className={`py-1 rounded text-center transition ${
            tab === 'envs' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Stage
        </button>
      </div>

      {/* Asset Grid List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin flex flex-col gap-1.5">
        {tab === 'chars' && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-1">
              Mixamo Rigged Characters
            </span>
            {characters.map((c) => {
              const isSelected = selectedCharacter === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCharacter(c.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#00FF88]/15 border-[#00FF88] text-white shadow-sm'
                      : 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{c.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-100">{c.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{c.type}</span>
                    </div>
                  </div>
                  {isSelected && <span className="text-[#00FF88] font-bold text-xs">● Active</span>}
                </div>
              );
            })}
          </>
        )}

        {tab === 'props' && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-1">
              Devices & Physics Objects
            </span>
            {props.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{p.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-neutral-100">{p.name}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{p.type}</span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 font-mono">
                  In Scene
                </span>
              </div>
            ))}
          </>
        )}

        {tab === 'vfx' && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-1">
              Unreal Shaders & Particles
            </span>
            {vfx.map((v) => {
              const active = activeVFX.includes(v.id);
              return (
                <div
                  key={v.id}
                  onClick={() => onToggleVFX(v.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    active
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{v.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-100">{v.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{v.type}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      active ? 'bg-purple-500 text-white' : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {active ? 'ON' : 'OFF'}
                  </span>
                </div>
              );
            })}
          </>
        )}

        {tab === 'envs' && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-1">
              3D Stages & Lighting Rigs
            </span>
            {environments.map((e) => {
              const isSelected = selectedEnvironment === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => onSelectEnvironment(e.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400 text-white'
                      : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{e.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-100">{e.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{e.type}</span>
                    </div>
                  </div>
                  {isSelected && <span className="text-cyan-400 font-bold text-xs">● Active</span>}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* MoCap Video Upload */}
      <div className="p-3 border-t border-white/10 bg-[#0a0a0e] flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-bold text-neutral-400">Video MoCap AI Extractor</span>
        <button
          type="button"
          onClick={() => alert('MediaPipe Pose & Kalidokit extractor ready: upload TikTok reel to extract skeletal rig with 2x exaggeration!')}
          className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
        >
          <span>📹</span>
          <span>Upload Dance Reel (.mp4)</span>
        </button>
      </div>
    </div>
  );
}
