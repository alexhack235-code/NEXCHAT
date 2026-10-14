'use client';

import React, { useState, useRef, useEffect } from 'react';

interface PromptInputProps {
  onGenerate: (prompt: string, options?: { attachment?: string; style?: string }) => void;
  isGenerating: boolean;
  initialPrompt?: string;
}

export default function PromptInput({ onGenerate, isGenerating, initialPrompt }: PromptInputProps) {
  const [prompt, setPrompt] = useState(
    initialPrompt ||
      'Create a 3D iPhone 18 vs Samsung S26 water freeze test comparison app with swipe and physics'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = [
    {
      label: '❄️ iPhone vs S26 Water Test',
      prompt: 'Create a 3D iPhone 18 vs Samsung S26 water freeze test comparison app with swipe and physics',
      badge: 'POPULAR'
    },
    {
      label: '📱 TikTok Clone',
      prompt: 'Create a TikTok video reel clone with vertical swipe, sound waves, heart like animation, and comment drawer',
      badge: 'TRENDING'
    },
    {
      label: '📈 Crypto Reels Tracker',
      prompt: 'Create a live crypto price tracker like TikTok reels with interactive swipe charts and buy buttons',
      badge: 'FINTECH'
    },
    {
      label: '🤖 AI Agent Studio',
      prompt: 'Create a sleek AI code companion with real-time terminal output, model selector, and syntax highlighting',
      badge: 'DEV'
    },
    {
      label: '🛍️ Cyberpunk Shop',
      prompt: 'Create a futuristic cyberpunk streetwear store with 3D interactive neon cards and cart checkout',
      badge: 'ECOMMERCE'
    }
  ];

  const quickEmojis = ['🔥', '⚡', '❄️', '💎', '🚀', '📱', '🎮', '👑', '💧', '✨'];

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not natively supported in this browser. Voice simulation active.');
      setIsRecording(!isRecording);
      if (!isRecording) {
        setTimeout(() => {
          setPrompt((prev) => prev + ' with liquid physics and real-time swipe');
          setIsRecording(false);
        }, 2500);
      }
      return;
    }

    // Native Web Speech API
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      if (!isRecording) {
        recognition.start();
      } else {
        recognition.stop();
      }
    } catch {
      setIsRecording(!isRecording);
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt, { attachment: attachment || undefined });
  };

  return (
    <div className="flex flex-col h-full bg-[#111114] border-r border-white/10 p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FE2C55]/20 border border-[#FE2C55]/40 flex items-center justify-center text-[#FE2C55]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">App Prompt Architect</h2>
            <p className="text-[11px] text-neutral-400">Powered by Gemini 3.8 Flash</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] font-bold border border-[#FE2C55]/30">
          v0 + Bolt AI
        </span>
      </div>

      {/* Preset Chips */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
          One-Click Templates
        </label>
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {templates.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => setPrompt(tpl.prompt)}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-left text-xs transition group"
            >
              <span className="font-medium text-neutral-200 group-hover:text-white truncate">
                {tpl.label}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 font-bold ml-2 shrink-0">
                {tpl.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Prompt Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Describe Your App Idea
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a 3D iPhone 18 vs Samsung S26 water freeze test comparison app with swipe and physics..."
              rows={6}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FE2C55] transition resize-none leading-relaxed font-sans"
            />
            {attachment && (
              <div className="mt-2 flex items-center justify-between px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-neutral-300">
                <span className="truncate flex items-center gap-1.5">
                  📎 <span className="font-mono text-[11px]">{attachment}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-neutral-500 hover:text-white text-xs ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Quick Emoji Bar */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold mr-1 shrink-0">Emojis:</span>
            {quickEmojis.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setPrompt((prev) => prev + ' ' + em)}
                className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10 transition shrink-0"
              >
                {em}
              </button>
            ))}
          </div>

          {/* Controls toolbar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {/* Attachment */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileAttach}
                accept="image/*,.json,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file / image mockup"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition text-xs flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-[11px] font-medium hidden sm:inline">Attach</span>
              </button>

              {/* Voice Input */}
              <button
                type="button"
                onClick={handleVoiceToggle}
                title="Dictate prompt with Voice"
                className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition ${
                  isRecording
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-[11px] font-medium hidden sm:inline">
                  {isRecording ? 'Listening...' : 'Voice'}
                </span>
              </button>
            </div>

            <span className="text-[10px] text-neutral-500 font-mono">
              {prompt.length} chars
            </span>
          </div>
        </div>

        {/* Generate App Red Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FE2C55] to-[#FF0055] hover:opacity-95 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#FE2C55]/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Synthesizing App in WebContainer...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate App (NEX Forge)</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-neutral-500 mt-2">
            Builds multi-file Next.js 14 + Tailwind app in &lt; 3 seconds
          </p>
        </div>
      </form>
    </div>
  );
}
