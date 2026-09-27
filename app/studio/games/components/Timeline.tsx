'use client';

import React from 'react';

interface TimelineProps {
  currentTime: number; // 0.0 to 1.0 (normalized)
  duration: number; // in seconds
  isPlaying: boolean;
  onPlayToggle: () => void;
  onSeek: (normalizedTime: number) => void;
  timeScale: number;
  onSpeedChange: (speed: number) => void;
  onExport: (format: 'fbx' | 'reels' | 'spritesheet' | 'lottie') => void;
  unrealMode: boolean;
}

export default function Timeline({
  currentTime,
  duration,
  isPlaying,
  onPlayToggle,
  onSeek,
  timeScale,
  onSpeedChange,
  onExport,
  unrealMode
}: TimelineProps) {
  const currentSeconds = (currentTime * duration).toFixed(2);
  const totalSeconds = duration.toFixed(2);

  const tracks = [
    { id: 'character', name: '🏃 Character Rig', keyframes: [0.0, 0.2, 0.45, 0.7, 1.0], color: 'bg-emerald-400' },
    { id: 'phones', name: '📱 iPhone 18 & S26', keyframes: [0.0, 0.25, 0.45], color: 'bg-cyan-400' },
    { id: 'freeze', name: '❄️ Water Freeze GLSL', keyframes: [0.35, 0.55], color: 'bg-blue-400' },
    { id: 'shatter', name: '💥 10k Particle Shatter', keyframes: [0.45, 0.65], color: 'bg-red-400' },
    { id: 'logo', name: '✨ NEX Logo Assembly', keyframes: [0.65, 0.85, 1.0], color: 'bg-[#00FF88]' },
    { id: 'camera', name: '🎥 360° Matrix Orbit', keyframes: [0.0, 0.3, 0.6, 1.0], color: 'bg-purple-400' }
  ];

  const speedOptions = [0.05, 0.25, 0.5, 1.0, 2.0];

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(progress);
  };

  return (
    <div className="w-full bg-[#0c0c10] border-t border-white/10 p-3 select-none flex flex-col gap-2 font-sans">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between">
        {/* Play/Pause & Timecode */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPlayToggle}
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition ${
              unrealMode
                ? 'bg-[#00FF88] text-black hover:bg-[#00dd77]'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Timecode display */}
          <div className="font-mono text-xs text-neutral-300 flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
            <span className={unrealMode ? 'text-[#00FF88] font-bold' : 'text-white'}>
              00:{currentSeconds.padStart(5, '0')}
            </span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">00:{totalSeconds.padStart(5, '0')}</span>
          </div>

          {/* Speed Presets */}
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
            {speedOptions.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onSpeedChange(spd)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                  timeScale === spd
                    ? unrealMode
                      ? 'bg-[#00FF88] text-black font-bold'
                      : 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {spd === 0.05 ? '0.05x (Matrix)' : `${spd}x`}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onExport('fbx')}
            title="Export FBX/GLB for Unreal Engine 5"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-[11px] font-semibold transition"
          >
            <span>📦</span>
            <span>Unreal FBX</span>
          </button>

          <button
            type="button"
            onClick={() => onExport('reels')}
            title="Export MP4 and post to NEX Reels"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-[#FE2C55] to-pink-600 hover:opacity-90 text-white text-[11px] font-bold shadow-sm transition"
          >
            <span>🎬</span>
            <span>Post to Reels</span>
          </button>

          <button
            type="button"
            onClick={() => onExport('spritesheet')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-[10px] transition hidden sm:flex"
          >
            <span>🎞️</span>
            <span>Sprites</span>
          </button>

          <button
            type="button"
            onClick={() => onExport('lottie')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-[10px] transition hidden sm:flex"
          >
            <span>📄</span>
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Tracks & Playhead Container */}
      <div
        onClick={handleTrackClick}
        className="w-full bg-[#08080b] rounded-xl border border-white/10 p-2 cursor-pointer relative overflow-hidden flex flex-col gap-1.5"
      >
        {/* Playhead Vertical Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none transition-all duration-75"
          style={{ left: `${currentTime * 100}%` }}
        >
          <div className="w-2.5 h-2.5 bg-red-500 -ml-1 rounded-full shadow-md shadow-red-500/50" />
        </div>

        {/* Track Rows */}
        {tracks.map((trk) => (
          <div
            key={trk.id}
            className="flex items-center justify-between h-5 bg-white/[0.02] hover:bg-white/[0.05] rounded px-2 relative"
          >
            <span className="text-[10px] font-mono text-neutral-400 font-semibold z-10 select-none">
              {trk.name}
            </span>

            {/* Keyframe Diamonds */}
            {trk.keyframes.map((kf, idx) => (
              <div
                key={idx}
                className={`absolute w-2 h-2 rotate-45 ${trk.color} opacity-85 shadow-sm`}
                style={{ left: `${kf * 100}%`, transform: 'translateX(-50%) rotate(45deg)' }}
                title={`Keyframe at ${(kf * duration).toFixed(2)}s`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
