import { Lightbulb, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';

const FILTERS = [
  { id: 'normal', name: 'Normal', icon: '—', css: 'none', bg: '#202c33' },
  { id: 'peach', name: 'Warm', label: 'Warm', css: 'sepia(0.35) saturate(1.7) hue-rotate(-20deg)', bg: '#fbb6ce' },
  { id: 'bw', name: 'B&W', label: 'B&W', css: 'grayscale(1) contrast(1.4) brightness(1.05)', bg: '#64748b' },
  { id: 'sepia', name: 'Sepia', label: 'Sepia', css: 'sepia(0.85) contrast(1.15)', bg: '#fb923c' },
  { id: 'cyan', name: 'Cyan', label: 'Cyan', css: 'hue-rotate(150deg) saturate(2) brightness(0.95)', bg: '#38bdf8' },
];

export default function PhotoStatusModal({ isOpen, onClose, onLog }) {
  const [selectedFilter, setSelectedFilter] = useState('bw'); // B&W default selected as requested
  const [rotation, setRotation] = useState(0);
  const [exposure, setExposure] = useState(false);
  const [activeTab, setActiveTab] = useState('filters');

  if (!isOpen) return null;

  const currentFilterObj = FILTERS.find((f) => f.id === selectedFilter) || FILTERS[2];

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    onLog?.(`[STATUS-PHOTO] Image rotated by 90° -> ${nextRot}°`);
  };

  const handleToggleExposure = () => {
    setExposure(!exposure);
    onLog?.(`[STATUS-PHOTO] Auto-exposure toggled: ${!exposure ? 'ON' : 'OFF'}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080d14] flex flex-col justify-between text-white select-none">
      {/* Top Bar 1:1 */}
      <div className="flex items-center justify-between px-5 py-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onClose} 
          className="text-2xl hover:text-[#00FF88] transition-colors p-1"
          title="Back"
        >
          ←
        </button>

        {/* 3 Buttons on Right (Circle highlighted in user prompt) */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRotate}
            className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center hover:border-[#00FF88] hover:text-[#00FF88] transition-all active:scale-90"
            title="Rotate 90 degrees"
          >
            ↻
          </button>
          <button 
            onClick={handleToggleExposure}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              exposure 
                ? 'bg-[#00FF88] text-black border-[#00FF88]' 
                : 'bg-black/60 border-white/20 hover:border-white/50 text-white'
            }`}
            title="Toggle Light / Bulb"
          >
            <Lightbulb className="w-4 h-4 inline" />
          </button>
          <button 
            className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center hover:border-white/50 transition-all"
            title="Sticker mask"
          >
            <Sparkles className="w-4 h-4 inline" />
          </button>
        </div>
      </div>

      {/* Center Chandelier Photo with Real CSS Filter & Transform */}
      <div className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
        <div 
          className="relative max-w-sm w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex items-center justify-center bg-black border border-white/10"
        >
          {/* Authentic Chandelier graphic */}
          <div 
            className="w-full h-full flex flex-col items-center justify-center transition-transform duration-300"
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: `${currentFilterObj.css} ${exposure ? 'brightness(1.3) contrast(1.1)' : ''}`,
            }}
          >
            <svg viewBox="0 0 400 500" className="w-full h-full object-contain p-6">
              <defs>
                <radialGradient id="chandelierGlow" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#d1d5db" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#111827" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="400" height="500" fill="#030712" />
              {/* Ceiling ceiling plate */}
              <ellipse cx="200" cy="50" rx="90" ry="24" fill="#1f2937" stroke="#9ca3af" strokeWidth="2" />
              <line x1="200" y1="50" x2="200" y2="120" stroke="#d1d5db" strokeWidth="4" />
              {/* Central tiered chandelier rings */}
              <circle cx="200" cy="220" r="140" fill="url(#chandelierGlow)" />
              <ellipse cx="200" cy="140" rx="60" ry="16" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <ellipse cx="200" cy="200" rx="110" ry="28" fill="none" stroke="#f9fafb" strokeWidth="4" />
              <ellipse cx="200" cy="260" rx="80" ry="20" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              {/* Crystal drops */}
              {[40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340, 360].map((x, i) => (
                <g key={i}>
                  <line x1={x} y1="200" x2={x} y2={230 + (i % 3) * 20} stroke="#9ca3af" strokeWidth="1.5" />
                  <polygon 
                    points={`${x},${230 + (i % 3) * 20} ${x - 5},${245 + (i % 3) * 20} ${x},${260 + (i % 3) * 20} ${x + 5},${245 + (i % 3) * 20}`} 
                    fill="#ffffff" 
                    opacity="0.85" 
                  />
                </g>
              ))}
              <text x="200" y="440" textAnchor="middle" fill="#9ca3af" fontSize="14" fontFamily="monospace">
                NEX PHOTO STATUS // CHANDELIER
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Filter Controls (1:1 with user's circled screenshot) */}
      <div className="bg-[#050811]/95 backdrop-blur-md border-t border-white/10 pt-4 pb-6 px-4 flex flex-col items-center gap-3">
        {/* Selected Filter Black Pill Label */}
        <div className="bg-black/90 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 shadow-md">
          {currentFilterObj.name}
        </div>

        {/* 5 Filter Circles Carousel */}
        <div className="flex items-center gap-4 py-1">
          {FILTERS.map((f) => {
            const isSelected = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFilter(f.id);
                  onLog?.(`[STATUS-PHOTO] Filter selected: ${f.name}`);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isSelected 
                    ? 'ring-4 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg' 
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: f.bg }}
                title={f.name}
              >
                {f.id === 'normal' ? '—' : f.name === 'B&W' ? 'B&W' : ''}
              </button>
            );
          })}
        </div>

        {/* Bottom Tabs: Effects, Filters (selected with green dot), Background */}
        <div className="flex items-center gap-8 mt-2 text-xs font-semibold text-white/60">
          <button 
            onClick={() => setActiveTab('effects')}
            className={`pb-1 transition-colors ${activeTab === 'effects' ? 'text-white' : 'hover:text-white'}`}
          >
            Effects
          </button>

          <button 
            onClick={() => setActiveTab('filters')}
            className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
              activeTab === 'filters' 
                ? 'text-white border-[#00FF88]' 
                : 'border-transparent hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"></span>
            Filters
          </button>

          <button 
            onClick={() => setActiveTab('background')}
            className={`pb-1 transition-colors ${activeTab === 'background' ? 'text-white' : 'hover:text-white'}`}
          >
            Background
          </button>
        </div>
      </div>
    </div>
  );
}
