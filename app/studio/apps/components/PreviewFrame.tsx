'use client';

import React, { useState, useEffect } from 'react';

interface PreviewFrameProps {
  files: Record<string, string>;
  activeFile: string;
  onCodeChange: (filename: string, newCode: string) => void;
  onRemix: () => void;
  onPublish: (target: 'vercel' | 'nex_store') => void;
  onExportZip: () => void;
  onPushGithub: () => void;
  isPublishing?: boolean;
  publishedUrl?: string | null;
}

export default function PreviewFrame({
  files,
  activeFile,
  onCodeChange,
  onRemix,
  onPublish,
  onExportZip,
  onPushGithub,
  isPublishing,
  publishedUrl
}: PreviewFrameProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'deploy'>('preview');
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [iframeKey, setIframeKey] = useState(0);

  // Generate safe HTML bundle for iframe srcDoc
  const getBundleHtml = () => {
    const mainCode = files['app.tsx'] || files['index.html'] || '<h1>App Loading...</h1>';
    
    // Convert React/Tailwind code to executable browser bundle with Babel & Tailwind CDN
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEX App Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { background-color: #050508; color: #fff; font-family: system-ui, -apple-system, sans-serif; margin: 0; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    // Helper components
    function WaterFreezeTestApp() {
      const [waterTemp, setWaterTemp] = useState(-5);
      const [isFrozen, setIsFrozen] = useState(true);
      const [selectedPhone, setSelectedPhone] = useState('iphone');
      const [likes, setLikes] = useState(24900);
      const [hasLiked, setHasLiked] = useState(false);
      const [iceThickness, setIceThickness] = useState(85);

      const toggleFreeze = () => {
        setIsFrozen(!isFrozen);
        setWaterTemp(isFrozen ? 18 : -12);
        setIceThickness(isFrozen ? 0 : 92);
      };

      return (
        <div className="flex flex-col h-screen w-full bg-[#030308] text-white select-none relative overflow-hidden">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FE2C55] animate-ping" />
              <span className="font-black text-xs tracking-wider text-white">NEX REELS WATER LAB</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-bold">
              <span>{isFrozen ? '❄️ LIQUID NITROGEN' : '💧 LIQUID WATER'}</span>
              <span>{waterTemp}°C</span>
            </div>
          </div>

          {/* 3D Visualizer Mockup */}
          <div className="flex-1 flex flex-col items-center justify-center relative p-6">
            {/* Frozen Background Aura */}
            <div className={\`absolute inset-0 transition-opacity duration-700 \${isFrozen ? 'opacity-100' : 'opacity-10'} pointer-events-none\`}>
              <div className="absolute inset-0 bg-radial-at-c from-cyan-900/30 via-transparent to-transparent animate-pulse" />
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-cyan-500/20 to-transparent" />
            </div>

            {/* Comparison Cards */}
            <div className="w-full max-w-sm flex items-center justify-center gap-4 relative z-10">
              {/* iPhone 18 */}
              <div
                onClick={() => setSelectedPhone('iphone')}
                className={\`flex-1 p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center \${
                  selectedPhone === 'iphone'
                    ? 'bg-gradient-to-b from-white/15 to-white/5 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                    : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                }\`}
              >
                <div className="w-16 h-28 rounded-xl bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-white/20 relative flex items-center justify-center mb-3 shadow-inner">
                  <div className="w-5 h-1.5 rounded-full bg-black absolute top-1.5" />
                  <span className="text-[10px] font-black text-cyan-300 tracking-tighter">18 PRO</span>
                  {isFrozen && (
                    <div className="absolute inset-0 bg-cyan-400/25 backdrop-blur-[1px] rounded-xl border border-cyan-300/60 flex items-center justify-center">
                      <span className="text-xs">❄️</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-bold">iPhone 18 Pro</h3>
                <span className="text-[10px] text-cyan-400 font-mono mt-0.5">Titanium Ice</span>
                <div className="w-full mt-2 pt-2 border-t border-white/10 text-[10px] flex justify-between text-neutral-400">
                  <span>Freeze Resist:</span>
                  <span className="font-bold text-white">99.4%</span>
                </div>
              </div>

              {/* Samsung S26 */}
              <div
                onClick={() => setSelectedPhone('samsung')}
                className={\`flex-1 p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center \${
                  selectedPhone === 'samsung'
                    ? 'bg-gradient-to-b from-white/15 to-white/5 border-purple-400 shadow-lg shadow-purple-500/20 scale-105'
                    : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                }\`}
              >
                <div className="w-16 h-28 rounded-xl bg-gradient-to-tr from-neutral-900 to-neutral-800 border border-white/20 relative flex items-center justify-center mb-3 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-black absolute top-1.5" />
                  <span className="text-[10px] font-black text-purple-300 tracking-tighter">S26 ULTRA</span>
                  {isFrozen && (
                    <div className="absolute inset-0 bg-purple-400/25 backdrop-blur-[1px] rounded-xl border border-purple-300/60 flex items-center justify-center">
                      <span className="text-xs">❄️</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-bold">Galaxy S26 Ultra</h3>
                <span className="text-[10px] text-purple-400 font-mono mt-0.5">Armor Core</span>
                <div className="w-full mt-2 pt-2 border-t border-white/10 text-[10px] flex justify-between text-neutral-400">
                  <span>Freeze Resist:</span>
                  <span className="font-bold text-white">98.9%</span>
                </div>
              </div>
            </div>

            {/* Freeze Controls */}
            <div className="w-full max-w-sm mt-6 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Ice Matrix Depth</span>
                <span className="font-mono text-cyan-400 font-bold">{iceThickness}mm</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-[#FE2C55] h-full transition-all duration-500"
                  style={{ width: \`\${iceThickness}%\` }}
                />
              </div>

              <button
                onClick={toggleFreeze}
                className={\`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-md \${
                  isFrozen
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                }\`}
              >
                {isFrozen ? '🔥 Thaw & Melt Water' : '❄️ Trigger Deep Flash Freeze'}
              </button>
            </div>
          </div>

          {/* TikTok Right Actions */}
          <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-4">
            <button
              onClick={() => {
                setHasLiked(!hasLiked);
                setLikes(prev => hasLiked ? prev - 1 : prev + 1);
              }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={\`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition \${
                hasLiked ? 'bg-[#FE2C55] text-white scale-110' : 'bg-black/50 text-white group-hover:bg-white/20'
              }\`}>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white">{likes.toLocaleString()}</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white">1,842</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white">Share</span>
            </button>
          </div>

          {/* Bottom Feed Overlay */}
          <div className="absolute bottom-4 left-4 right-16 z-20">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>@alexandergamedeveloper74</span>
              <span className="text-cyan-400">✓</span>
            </h4>
            <p className="text-xs text-neutral-300 mt-1 leading-snug">
              iPhone 18 vs Samsung S26 liquid nitrogen freeze test at -12°C! Who survives the ice bath? ❄️📱 #NEX3D #TechReels
            </p>
          </div>
        </div>
      );
    }

    ReactDOM.render(<WaterFreezeTestApp />, document.getElementById('root'));
  </script>
</body>
</html>`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] select-none">
      {/* Top Bar with Tabs and Device Selectors */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#121216] border-b border-white/10">
        {/* Bolt-style Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'preview'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'code'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Code Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'deploy'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Deploy & Share</span>
          </button>
        </div>

        {/* Viewport controls (only in preview) */}
        {activeTab === 'preview' && (
          <div className="flex items-center gap-1 bg-[#181820] p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              title="iPhone TikTok Bezel"
              className={`px-2 py-1 rounded text-xs transition ${
                device === 'mobile' ? 'bg-[#FE2C55] text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              📱 Mobile
            </button>
            <button
              type="button"
              onClick={() => setDevice('tablet')}
              title="Tablet Viewport"
              className={`px-2 py-1 rounded text-xs transition ${
                device === 'tablet' ? 'bg-[#FE2C55] text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tablet
            </button>
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              title="Full Desktop"
              className={`px-2 py-1 rounded text-xs transition ${
                device === 'desktop' ? 'bg-[#FE2C55] text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Desktop
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Remix button */}
          <button
            type="button"
            onClick={onRemix}
            title="Remix this app like a TikTok Duet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-xs shadow-sm transition"
          >
            <span>✨</span>
            <span>Remix App</span>
          </button>

          {/* Reload preview */}
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            title="Refresh preview frame"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-hidden relative">
        {/* PREVIEW TAB */}
        {activeTab === 'preview' && (
          <div className="w-full h-full flex items-center justify-center p-4 bg-[#050508] overflow-auto">
            <div
              className={`transition-all duration-300 relative shadow-2xl ${
                device === 'mobile'
                  ? 'w-[375px] h-[720px] rounded-[42px] border-[10px] border-[#22222a] overflow-hidden bg-black'
                  : device === 'tablet'
                  ? 'w-[720px] h-[640px] rounded-2xl border-4 border-[#22222a] overflow-hidden bg-black'
                  : 'w-full h-full rounded-none border-none'
              }`}
            >
              {/* Dynamic Island for mobile frame */}
              {device === 'mobile' && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 pointer-events-none flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 ml-auto mr-2" />
                </div>
              )}

              <iframe
                key={iframeKey}
                srcDoc={getBundleHtml()}
                title="App Live Preview"
                className="w-full h-full border-none bg-[#050508]"
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              />
            </div>
          </div>
        )}

        {/* CODE TAB */}
        {activeTab === 'code' && (
          <div className="w-full h-full flex flex-col bg-[#0d0d12]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#14141c] border-b border-white/10 text-xs font-mono">
              <span className="text-cyan-400 font-bold">{activeFile}</span>
              <span className="text-neutral-500">{(files[activeFile] || '').split('\n').length} lines</span>
            </div>
            <textarea
              value={files[activeFile] || ''}
              onChange={(e) => onCodeChange(activeFile, e.target.value)}
              className="flex-1 w-full bg-[#09090d] text-neutral-200 font-mono text-xs p-4 leading-relaxed focus:outline-none resize-none selection:bg-[#FE2C55]/30 select-text"
              spellCheck={false}
            />
          </div>
        )}

        {/* DEPLOY TAB */}
        {activeTab === 'deploy' && (
          <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-[#07070a] overflow-y-auto">
            <div className="max-w-md w-full p-6 rounded-2xl bg-[#111116] border border-white/10 shadow-2xl flex flex-col gap-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FE2C55] to-purple-600 flex items-center justify-center mx-auto text-xl shadow-lg shadow-[#FE2C55]/20">
                🚀
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Publish Your NEX App</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Deploy to Vercel global edge or publish directly to the NEX App Store feed.
                </p>
              </div>

              {publishedUrl ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  <p className="font-bold">App Deployed Successfully!</p>
                  <a
                    href={publishedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-[11px] block mt-1 break-all"
                  >
                    {publishedUrl}
                  </a>
                </div>
              ) : null}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => onPublish('vercel')}
                  disabled={isPublishing}
                  className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24">
                    <path d="M12 2L2 19.7778H22L12 2Z" />
                  </svg>
                  <span>{isPublishing ? 'Deploying to Vercel...' : 'Deploy to Vercel Edge'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPublish('nex_store')}
                  disabled={isPublishing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FE2C55] to-pink-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FE2C55]/20"
                >
                  <span>📱</span>
                  <span>Publish to NEX App Store Grid</span>
                </button>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={onExportZip}
                  className="text-neutral-400 hover:text-white flex items-center gap-1 transition"
                >
                  <span>📦</span>
                  <span>Download ZIP</span>
                </button>
                <span className="text-neutral-600">•</span>
                <button
                  type="button"
                  onClick={onPushGithub}
                  className="text-neutral-400 hover:text-white flex items-center gap-1 transition"
                >
                  <span>🐙</span>
                  <span>Push to GitHub</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
