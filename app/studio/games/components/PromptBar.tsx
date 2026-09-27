'use client';

import React, { useState } from 'react';

interface PromptBarProps {
  onAnimate: (prompt: string, style: string) => void;
  isAnimating: boolean;
  unrealMode: boolean;
}

export default function PromptBar({ onAnimate, isAnimating, unrealMode }: PromptBarProps) {
  const [prompt, setPrompt] = useState(
    'Animate my Mixamo character doing a triple backflip, catching iPhone 18 mid-air as it freezes, then landing and smashing it into ice particles that form NEX logo - make it MAD unrealistic, 2x speed, zero gravity at peak'
  );
  const [style, setStyle] = useState('NEX Unreal');

  const styles = ['NEX Unreal', 'Cyberpunk', 'Anime', 'Realistic', 'Cartoon'];

  const madPresets = [
    {
      id: 'water_freeze',
      icon: '❄️',
      name: 'Water Freeze',
      prompt: 'iPhone 18 plunges into liquid nitrogen, time stops at 0.05x speed, water droplets freeze mid-air into sharp ice needles'
    },
    {
      id: 'phone_smash',
      icon: '💥',
      name: 'Phone Smash',
      prompt: 'iPhone 18 and Galaxy S26 collide in mid-air, shatter into 10,000 glowing neon glass shards that magnetically assemble into the NEX logo'
    },
    {
      id: 'zero_g_fight',
      icon: '🌌',
      name: 'Zero-G Fight',
      prompt: 'Two cyber shinobi fight in zero gravity, 1080° mid-air spins, inverted momentum and time-reversal kicks'
    },
    {
      id: 'bullet_time',
      icon: '🕶️',
      name: 'Bullet Time Matrix',
      prompt: 'Character performs impossible 360° backbend Matrix dodge while camera orbits at 10x supersonic speed'
    },
    {
      id: 'giant_jump',
      icon: '🦘',
      name: 'Giant Jump',
      prompt: 'Character jumps 50 meters high with 3x squash and stretch, defying gravitational pull and creating a ground shockwave'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isAnimating) return;
    onAnimate(prompt, style);
  };

  return (
    <div className="w-full bg-[#101014] border-b border-white/10 p-3 select-none flex flex-col gap-2.5">
      {/* Top Row: Style selector & MAD Presets */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1 shrink-0">
            MAD Presets:
          </span>
          {madPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setPrompt(preset.prompt);
                onAnimate(preset.prompt, style);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-xs transition shrink-0 group"
            >
              <span>{preset.icon}</span>
              <span className="font-semibold text-[11px]">{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Style Selector */}
        <div className="flex items-center gap-1 bg-[#181820] p-0.5 rounded-lg border border-white/10">
          <span className="text-[10px] text-neutral-500 font-bold px-2">STYLE:</span>
          {styles.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                style === s
                  ? unrealMode
                    ? 'bg-[#00FF88] text-black font-bold'
                    : 'bg-white/20 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Prompt Bar Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type impossible animation prompt (e.g. 360° Matrix dodge with frozen iPhone shattering into NEX logo)..."
            className="w-full bg-[#08080a] border border-white/15 focus:border-[#00FF88] rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition font-sans shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
              Gemini 3.8 AI
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isAnimating || !prompt.trim()}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer disabled:opacity-50 ${
            unrealMode
              ? 'bg-[#00FF88] hover:bg-[#00dd77] text-black shadow-lg shadow-[#00FF88]/25'
              : 'bg-[#FE2C55] hover:bg-[#e0254b] text-white shadow-lg shadow-[#FE2C55]/25'
          }`}
        >
          {isAnimating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Animate (AI)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
