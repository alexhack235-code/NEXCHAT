'use client';

import React, { FC } from 'react';
import { ChevronLeft } from 'lucide-react';
//  { useState, useEffect, useRef } from 'react';
import UnrealToggle from './components/UnrealToggle';
import PromptBar from './components/PromptBar';
import Viewport3D from './components/Viewport3D';
import Timeline from './components/Timeline';
import PhysicsPanel from './components/PhysicsPanel';
import AssetLibrary from './components/AssetLibrary';
import {
  PhysicsSettings,
  DEFAULT_UNREAL_SETTINGS,
  DEFAULT_REALISTIC_SETTINGS
} from './lib/unrealPhysics';
import { generateAnimationFromPrompt } from './lib/aiAnimator';

export default function GameLabPage() {
  const [unrealMode, setUnrealMode] = useState(true);
  const [settings, setSettings] = useState<PhysicsSettings>(DEFAULT_UNREAL_SETTINGS);
  const [currentTime, setCurrentTime] = useState(0.0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(6.0);
  const [timeScale, setTimeScale] = useState(0.05); // Matrix Bullet Time by default

  const [selectedCharacter, setSelectedCharacter] = useState('mixamo_ninja');
  const [selectedEnvironment, setSelectedEnvironment] = useState('water_lab');
  const [activeVFX, setActiveVFX] = useState<string[]>([
    'water_freeze',
    'shard_explosion',
    'nex_logo_formation'
  ]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exportModal, setExportModal] = useState<string | null>(null);

  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Animation timeline loop
  useEffect(() => {
    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000.0;
      lastTimeRef.current = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const delta = (dt * (settings.unrealMode ? timeScale * 10 : timeScale)) / duration;
          const next = prev + delta;
          return next >= 1.0 ? 0.0 : next;
        });
      }
      animRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, timeScale, duration, settings.unrealMode]);

  // Handle Unreal Mode Toggle
  const handleToggleUnreal = (enabled: boolean) => {
    setUnrealMode(enabled);
    if (enabled) {
      setSettings(DEFAULT_UNREAL_SETTINGS);
      setTimeScale(0.05); // Bullet time
    } else {
      setSettings(DEFAULT_REALISTIC_SETTINGS);
      setTimeScale(1.0);
    }
  };

  // AI Animation generation from prompt via Gemini Game Engine
  const handleAnimatePrompt = async (promptText: string, style: string) => {
    setIsAnimating(true);
    try {
      const res = await fetch('/api/game-lab/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, style, unrealMode })
      });
      if (res.ok) {
        const data = await res.json();
        setDuration(data.duration || 6.0);
        if (data.physics?.timeScale) {
          setTimeScale(data.physics.timeScale);
        }
      } else {
        const anim = generateAnimationFromPrompt(promptText, style, unrealMode);
        setDuration(anim.durationSeconds);
      }
    } catch (e) {
      const anim = generateAnimationFromPrompt(promptText, style, unrealMode);
      setDuration(anim.durationSeconds);
    }
    setCurrentTime(0.0);
    setIsPlaying(true);
    setIsAnimating(false);
  };

  // Handle Exports
  const handleExport = (format: 'fbx' | 'reels' | 'spritesheet' | 'lottie') => {
    setExportModal(format);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] overflow-hidden bg-[#07070a] select-none text-white">
      {/* Top Bar with Unreal Engine Toggle */}
      <div className="flex items-center justify-between px-6 py-2 bg-[#0c0c10] border-b border-white/10 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-[#00FF88] tracking-wider uppercase text-[11px] flex items-center gap-1.5">
            <span>🎮</span>
            <span>NEX GAME DEV LAB</span>
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-400 font-medium hidden md:inline">
            Create Impossible Animations • Defy Physics • For Game Devs
          </span>
        </div>

        {/* Unreal Engine Reality Disabler */}
        <UnrealToggle enabled={unrealMode} onToggle={handleToggleUnreal} />
      </div>

      {/* Prompt Bar with Presets */}
      <PromptBar
        onAnimate={handleAnimatePrompt}
        isAnimating={isAnimating}
        unrealMode={unrealMode}
      />

      {/* Main Viewport & Control Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Asset Library */}
        <div className="w-64 md:w-72 shrink-0 h-full hidden lg:block">
          <AssetLibrary
            selectedCharacter={selectedCharacter}
            onSelectCharacter={setSelectedCharacter}
            selectedEnvironment={selectedEnvironment}
            onSelectEnvironment={setSelectedEnvironment}
            activeVFX={activeVFX}
            onToggleVFX={(id) => {
              setActiveVFX((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              );
            }}
          />
        </div>

        {/* Center: 3D Viewport */}
        <div className="flex-1 h-full flex flex-col min-w-0 relative">
          <div className="flex-1 relative">
            <Viewport3D
              currentTime={currentTime}
              settings={settings}
              characterId={selectedCharacter}
              environmentId={selectedEnvironment}
              activeVFX={activeVFX}
            />
          </div>

          {/* Bottom Timeline */}
          <div className="h-28 shrink-0">
            <Timeline
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onPlayToggle={() => setIsPlaying(!isPlaying)}
              onSeek={(val) => {
                setCurrentTime(val);
                setIsPlaying(false);
              }}
              timeScale={timeScale}
              onSpeedChange={setTimeScale}
              onExport={handleExport}
              unrealMode={unrealMode}
            />
          </div>
        </div>

        {/* Right Column: Physics Panel */}
        <div className="w-64 md:w-72 shrink-0 h-full hidden md:block">
          <PhysicsPanel
            settings={settings}
            onChange={(up) => setSettings((prev) => ({ ...prev, ...up }))}
            onReset={(m) => {
              if (m === 'unreal') {
                setSettings(DEFAULT_UNREAL_SETTINGS);
                setTimeScale(0.05);
              } else {
                setSettings(DEFAULT_REALISTIC_SETTINGS);
                setTimeScale(1.0);
              }
            }}
          />
        </div>
      </div>

      {/* Export Modal */}
      {exportModal && (
        <div className="fixed inset-0 z-50 w-full h-[100dvh] bg-[#0b141a] flex flex-col overflow-hidden select-none">
          <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0b141a] shrink-0 min-h-[54px]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExportModal(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Back"
              >
                <ChevronLeft className="w-5 h-5 text-[#00a884]" />
              </button>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                {exportModal === 'reels'
                  ? 'Post to NEX Reels'
                  : exportModal === 'fbx'
                  ? 'Export for Unreal Engine 5 / Unity'
                  : 'Export Spritesheet / JSON'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setExportModal(null)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center mx-auto text-2xl text-[#00a884]">
              {exportModal === 'reels' ? '🎬' : exportModal === 'fbx' ? '📦' : '🎞️'}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {exportModal === 'reels'
                  ? 'Post to NEX Reels'
                  : exportModal === 'fbx'
                  ? 'Export for Unreal Engine 5 / Unity'
                  : 'Export Spritesheet / JSON'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                {exportModal === 'reels'
                  ? 'Auto-publishes 1080x1920 60FPS video with title: "Made in NEX Game Lab 🔥"'
                  : 'Bakes bone transforms, morph targets, and particle vertex buffers.'}
              </p>
            </div>

            <div className="w-full max-w-md p-4 rounded-2xl bg-[#202c33]/60 border border-white/5 text-xs font-mono text-left text-neutral-300 space-y-1">
              <p>• Bone Rig: Mixamo Rigged Bipedal</p>
              <p>• Particle Shards: 10,000 Points (NEX Logo)</p>
              <p>• Physics Engine: Rapier3D + Inverted Graviton</p>
              <p>• Duration: {duration}s @ 60 FPS</p>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 p-4 border-t border-white/10 bg-[#0b141a] pb-[calc(16px+env(safe-area-inset-bottom,0px))] flex gap-3">
            <button
              type="button"
              onClick={() => setExportModal(null)}
              className="flex-1 h-[50px] rounded-full bg-[#202c33] hover:bg-[#2a3942] text-white font-semibold text-sm transition-colors flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                alert(
                  exportModal === 'reels'
                    ? 'Reel posted to NEX Feed! Title: "Made in NEX Game Lab 🔥"'
                    : 'File exported successfully!'
                );
                setExportModal(null);
              }}
              className="flex-1 h-[50px] rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold text-sm uppercase tracking-wider shadow-lg shadow-[#00a884]/25 transition-colors flex items-center justify-center cursor-pointer"
            >
              Confirm Export
            </button>
          </div>
        </div>
      )}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(
                    exportModal === 'reels'
                      ? 'Reel posted to NEX Feed! Title: "Made in NEX Game Lab 🔥"'
                      : 'File exported successfully!'
                  );
                  setExportModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#00FF88] hover:bg-[#00dd77] text-black font-bold text-xs uppercase tracking-wider"
              >
                Confirm Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
