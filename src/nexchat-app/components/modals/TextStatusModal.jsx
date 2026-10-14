import { Palette, X } from 'lucide-react';
import React, { useState } from 'react';

const PALETTES = [
  '#0b141a', // Dark Obsidian / NEX Void
  '#005c4b', // Classic Emerald Dark
  '#59287a', // Deep Violet
  '#792138', // Crimson Berry
  '#1b3b5f', // Deep Royal Blue
  '#8f5318', // Warm Amber
  '#0d47a1', // Cobalt
  '#1f2c34', // Slate
];

const FONTS = [
  { id: 'sans', name: 'Sans', fontClass: 'font-sans' },
  { id: 'serif', name: 'Serif', fontClass: 'font-serif' },
  { id: 'mono', name: 'Mono', fontClass: 'font-mono' },
  { id: 'cursive', name: 'Script', fontClass: 'italic font-serif' },
  { id: 'cyber', name: 'Orbitron', fontClass: 'font-display uppercase tracking-widest' },
];

export default function TextStatusModal({ isOpen, onClose, onSave, onLog }) {
  const [text, setText] = useState("Debugging 12k+ lines in chat.js is real ");
  const [bgIndex, setBgIndex] = useState(1);
  const [fontIndex, setFontIndex] = useState(0);

  if (!isOpen) return null;

  const cycleBg = () => {
    setBgIndex((prev) => (prev + 1) % PALETTES.length);
    onLog?.('[STATUS] Changed status background palette');
  };

  const cycleFont = () => {
    setFontIndex((prev) => (prev + 1) % FONTS.length);
    onLog?.(`[STATUS] Switched font style to ${FONTS[(fontIndex + 1) % FONTS.length].name}`);
  };

  const handleDone = () => {
    if (text.trim()) {
      onSave?.({
        text,
        bg: PALETTES[bgIndex],
        font: FONTS[fontIndex].fontClass,
        timestamp: 'Just now',
      });
      onLog?.(`[STATUS] Created Text Status: "${text.substring(0, 30)}..."`);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 transition-all duration-300"
      style={{ backgroundColor: PALETTES[bgIndex] }}
    >
      {/* Top Action Bar */}
      <div className="flex items-center justify-between text-white/90">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/20 text-xl transition-colors"
          title="Back"
        >
          <X className="w-4 h-4 inline" />
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={cycleBg}
            className="p-2.5 rounded-full hover:bg-black/20 transition-transform active:scale-90"
            title="Change background color"
          >
            <Palette className="w-4 h-4 inline" />
          </button>
          <button 
            onClick={cycleFont}
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 font-bold text-sm tracking-wider"
            title="Change typography"
          >
            Aa
          </button>
          <button 
            className="p-2 rounded-full hover:bg-black/20 text-lg"
            title="Mention @ contact"
          >
            @
          </button>
          <button 
            onClick={handleDone}
            className="px-4 py-1.5 rounded-full bg-[#00FF88] text-black font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#00FF88]/30"
          >
            Done
          </button>
        </div>
      </div>

      {/* Center Typing Area 1:1 */}
      <div className="flex-1 flex items-center justify-center max-w-xl mx-auto w-full px-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a status..."
          autoFocus
          rows={4}
          className={`w-full bg-transparent text-center text-3xl md:text-4xl text-white placeholder-white/40 border-none outline-none resize-none leading-relaxed drop-shadow-md ${FONTS[fontIndex].fontClass}`}
        />
      </div>

      {/* Bottom Font & Emoji Quick Select */}
      <div className="flex items-center justify-between max-w-md mx-auto w-full py-4 text-white/80">
        <div className="flex items-center gap-2">
          {FONTS.map((f, i) => (
            <button
              key={f.id}
              onClick={() => {
                setFontIndex(i);
                onLog?.(`[STATUS] Font selected: ${f.name}`);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                fontIndex === i 
                  ? 'bg-white text-black shadow-md' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="text-xs text-white/50 font-mono">
          {text.length} / 140
        </div>
      </div>
    </div>
  );
}
