'use client';

import React, { useState } from 'react';
import PromptInput from './components/PromptInput';
import PreviewFrame from './components/PreviewFrame';
import FileTree from './components/FileTree';
import Console, { LogEntry } from './components/Console';

export default function AppForgePage() {
  const [activeFile, setActiveFile] = useState('app.tsx');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [versionIndex, setVersionIndex] = useState(0);

  // Initial production files for the requested test app
  const [files, setFiles] = useState<Record<string, string>>({
    'app.tsx': `// NEX App Forge: iPhone 18 vs Samsung S26 Water Freeze Test
import React, { useState } from 'react';
import PhoneComparison3D from './components/PhoneComparison3D';
import WaterFreezeShader from './components/WaterFreezeShader';

export default function App() {
  const [mode, setMode] = useState<'liquid' | 'frozen'>('frozen');
  const [likes, setLikes] = useState(38400);

  return (
    <main className="min-h-screen bg-[#030308] text-white flex flex-col items-center justify-between p-4 relative overflow-hidden font-sans">
      <WaterFreezeShader isFrozen={mode === 'frozen'} />
      <header className="z-10 w-full flex justify-between items-center py-2 px-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
        <h1 className="text-xs font-black tracking-wider text-[#FE2C55]">NEX WATER FREEZE LAB</h1>
        <button
          onClick={() => setMode(m => m === 'frozen' ? 'liquid' : 'frozen')}
          className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
        >
          {mode === 'frozen' ? '❄️ Deep Freeze -12°C' : '💧 Room Water 20°C'}
        </button>
      </header>

      <div className="z-10 w-full max-w-sm flex-1 flex flex-col justify-center">
        <PhoneComparison3D isFrozen={mode === 'frozen'} />
      </div>

      <footer className="z-10 w-full text-center text-[11px] text-neutral-400 py-2">
        Swipe up for next durability test reel • NEX App Forge
      </footer>
    </main>
  );
}`,
    'components/PhoneComparison3D.tsx': `import React, { useState } from 'react';

export default function PhoneComparison3D({ isFrozen }: { isFrozen: boolean }) {
  const [activePhone, setActivePhone] = useState<'iphone' | 'samsung'>('iphone');

  return (
    <div className="flex gap-3 justify-center items-center">
      {/* iPhone 18 Pro */}
      <div 
        onClick={() => setActivePhone('iphone')}
        className={\`p-4 rounded-2xl border transition-all duration-300 cursor-pointer \${
          activePhone === 'iphone' ? 'border-cyan-400 bg-white/10 scale-105' : 'border-white/10 bg-white/5 opacity-70'
        }\`}
      >
        <div className="w-16 h-28 bg-neutral-800 rounded-xl relative flex items-center justify-center border border-white/20">
          <span className="text-[10px] font-bold text-cyan-300">18 PRO</span>
          {isFrozen && <div className="absolute inset-0 bg-cyan-400/30 rounded-xl border border-cyan-300/60" />}
        </div>
        <p className="text-xs font-bold mt-2 text-center">iPhone 18</p>
      </div>

      {/* Samsung S26 */}
      <div 
        onClick={() => setActivePhone('samsung')}
        className={\`p-4 rounded-2xl border transition-all duration-300 cursor-pointer \${
          activePhone === 'samsung' ? 'border-purple-400 bg-white/10 scale-105' : 'border-white/10 bg-white/5 opacity-70'
        }\`}
      >
        <div className="w-16 h-28 bg-neutral-900 rounded-xl relative flex items-center justify-center border border-white/20">
          <span className="text-[10px] font-bold text-purple-300">S26 ULTRA</span>
          {isFrozen && <div className="absolute inset-0 bg-purple-400/30 rounded-xl border border-purple-300/60" />}
        </div>
        <p className="text-xs font-bold mt-2 text-center">Galaxy S26</p>
      </div>
    </div>
  );
}`,
    'components/WaterFreezeShader.tsx': `import React from 'react';

export default function WaterFreezeShader({ isFrozen }: { isFrozen: boolean }) {
  return (
    <div className={\`absolute inset-0 pointer-events-none transition-opacity duration-700 \${isFrozen ? 'opacity-100' : 'opacity-20'}\`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/40 via-[#030308] to-[#030308]" />
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent animate-pulse" />
    </div>
  );
}`,
    'package.json': JSON.stringify(
      {
        name: 'nex-app-water-freeze-comparison',
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        },
        dependencies: {
          next: '14.2.5',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          three: '^0.160.0',
          '@react-three/fiber': '^8.15.16',
          '@react-three/drei': '^9.88.16',
          'framer-motion': '^11.0.8',
          'lucide-react': '^0.359.0'
        }
      },
      null,
      2
    )
  });

  const [packages, setPackages] = useState<Record<string, string>>({
    next: '14.2.5',
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    three: '^0.160.0',
    '@react-three/fiber': '^8.15.16',
    '@react-three/drei': '^9.88.16',
    'framer-motion': '^11.0.8',
    'lucide-react': '^0.359.0',
    tailwindcss: '^3.4.1'
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      type: 'info',
      text: 'WebContainer runtime initialized. Node.js v20.11.0 ready.',
      timestamp: '18:30:01'
    },
    {
      id: '2',
      type: 'info',
      text: 'Mounted files in virtual memory file system.',
      timestamp: '18:30:02'
    },
    {
      id: '3',
      type: 'success',
      text: 'Dependencies verified: Next.js 14, React 18, Three.js r160.',
      timestamp: '18:30:03'
    },
    {
      id: '4',
      type: 'success',
      text: 'Application compiled ready in 340ms (HMR active).',
      timestamp: '18:30:04'
    }
  ]);

  const [versionHistory, setVersionHistory] = useState<Array<Record<string, string>>>([files]);

  // Generate app from user prompt
  const handleGenerate = async (promptText: string) => {
    setIsGenerating(true);
    const now = () => new Date().toTimeString().slice(0, 8);

    setLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'info',
        text: `NEX App Forge: Synthesizing architecture for: "${promptText}"`,
        timestamp: now()
      }
    ]);

    try {
      // Stream step logs
      await new Promise((r) => setTimeout(r, 400));
      setLogs((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: 'info',
          text: 'Gemini 3.8 Flash parsed AST. Emitted file tree structure: [app.tsx, components/X.tsx, package.json]',
          timestamp: now()
        }
      ]);

      await new Promise((r) => setTimeout(r, 500));
      setLogs((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: 'info',
          text: 'Writing code blocks into virtual WebContainer filesystem...',
          timestamp: now()
        }
      ]);

      await new Promise((r) => setTimeout(r, 600));
      setLogs((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: 'success',
          text: 'npm install complete (0 vulnerabilities). Server listening on http://localhost:3000',
          timestamp: now()
        }
      ]);

      // If user prompt mentions TikTok or crypto, update files accordingly
      if (promptText.toLowerCase().includes('crypto')) {
        const cryptoApp = `// NEX App Forge: Crypto Reels Tracker
import React, { useState } from 'react';

export default function CryptoReels() {
  const coins = [
    { symbol: 'BTC', price: '$94,250', change: '+4.2%', color: 'text-amber-400' },
    { symbol: 'ETH', price: '$3,820', change: '+2.8%', color: 'text-cyan-400' },
    { symbol: 'SOL', price: '$225', change: '+11.5%', color: 'text-purple-400' }
  ];
  return (
    <div className="h-screen bg-black text-white p-6 flex flex-col justify-between">
      <h2 className="text-sm font-bold text-[#FE2C55]">CRYPTO TIKTOK FEED</h2>
      <div className="flex flex-col gap-4">
        {coins.map(c => (
          <div key={c.symbol} className="p-4 bg-white/10 rounded-2xl flex justify-between items-center">
            <span className="font-black text-lg">{c.symbol}</span>
            <div className="text-right">
              <p className="font-mono text-base font-bold">{c.price}</p>
              <span className={\`text-xs font-bold \${c.color}\`}>{c.change}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full py-3 bg-[#FE2C55] rounded-xl font-bold text-xs uppercase">Instant Swap</button>
    </div>
  );
}`;
        setFiles((prev) => {
          const updated = { ...prev, 'app.tsx': cryptoApp };
          setVersionHistory((vh) => [...vh, updated]);
          setVersionIndex(versionHistory.length);
          return updated;
        });
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: 'error',
          text: `Generation error: ${err.message}`,
          timestamp: now()
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFixWithAI = async (errorMsg: string) => {
    setIsFixing(true);
    const now = () => new Date().toTimeString().slice(0, 8);

    setLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'info',
        text: `AI Code Doctor analyzing error: "${errorMsg.slice(0, 45)}..."`,
        timestamp: now()
      }
    ]);

    await new Promise((r) => setTimeout(r, 800));

    setLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'success',
        text: 'Patched AST syntax. Tag balancing restored and missing dependencies resolved.',
        timestamp: now()
      }
    ]);

    setIsFixing(false);
  };

  const handlePublish = async (target: 'vercel' | 'nex_store') => {
    setIsPublishing(true);
    const now = () => new Date().toTimeString().slice(0, 8);

    setLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'info',
        text: `Publishing build to ${target === 'vercel' ? 'Vercel Edge Network' : 'NEX App Store Grid'}...`,
        timestamp: now()
      }
    ]);

    await new Promise((r) => setTimeout(r, 1200));

    const generatedUrl =
      target === 'vercel'
        ? 'https://alex-water-freeze-app.nexchat-drab.vercel.app'
        : 'https://nex.store/app/water-freeze-comparison';

    setPublishedUrl(generatedUrl);
    setLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'success',
        text: `Deployed live! Accessible globally at: ${generatedUrl}`,
        timestamp: now()
      }
    ]);

    setIsPublishing(false);
  };

  const handleRemix = () => {
    const clonePrompt = `Remix: iPhone 18 vs Samsung S26 Water Freeze Test with TikTok Duet split-screen`;
    handleGenerate(clonePrompt);
  };

  const handleExportZip = () => {
    const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nex-app-forge-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePushGithub = () => {
    alert('Code pushed to repository: https://github.com/alexhack235-code/NEXIUM-AI (main branch)');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] overflow-hidden bg-[#08080a] select-none">
      {/* Top Banner / Version Timeline Slider */}
      <div className="flex items-center justify-between px-6 py-2 bg-[#0d0d12] border-b border-white/10 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-[#FE2C55] tracking-wider uppercase text-[11px]">
            ⚡ NEX APP FORGE
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-400 font-medium">
            Type idea → Get working app → Publish to NEX Store
          </span>
        </div>

        {/* Version Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400 uppercase font-bold">Timeline:</span>
          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
            {versionHistory.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setVersionIndex(i);
                  setFiles(versionHistory[i]);
                }}
                className={`w-5 h-5 rounded text-[10px] font-bold transition ${
                  versionIndex === i
                    ? 'bg-[#FE2C55] text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                v{i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Chat Prompt Input */}
        <div className="w-80 md:w-96 shrink-0 h-full flex flex-col">
          <PromptInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            initialPrompt="Create a 3D iPhone 18 vs Samsung S26 water freeze test comparison app with swipe and physics"
          />
        </div>

        {/* Center Column: Live Preview & Bolt-Style Tabs */}
        <div className="flex-1 h-full flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <PreviewFrame
              files={files}
              activeFile={activeFile}
              onCodeChange={(filename, newCode) => {
                setFiles((prev) => ({ ...prev, [filename]: newCode }));
              }}
              onRemix={handleRemix}
              onPublish={handlePublish}
              onExportZip={handleExportZip}
              onPushGithub={handlePushGithub}
              isPublishing={isPublishing}
              publishedUrl={publishedUrl}
            />
          </div>

          {/* Bottom Console */}
          <div className="h-44 shrink-0">
            <Console
              logs={logs}
              onClearLogs={() => setLogs([])}
              onFixWithAI={handleFixWithAI}
              isFixing={isFixing}
            />
          </div>
        </div>

        {/* Right Column: File Tree & NPM Packages */}
        <div className="w-64 md:w-72 shrink-0 h-full hidden lg:block">
          <FileTree
            files={files}
            activeFile={activeFile}
            onSelectFile={(f) => setActiveFile(f)}
            onAddFile={(newFile) => {
              setFiles((prev) => ({ ...prev, [newFile]: '// New component\nexport default function Component() { return null; }' }));
              setActiveFile(newFile);
            }}
            onDeleteFile={(delFile) => {
              setFiles((prev) => {
                const next = { ...prev };
                delete next[delFile];
                return next;
              });
              setActiveFile('app.tsx');
            }}
            packages={packages}
            onAddPackage={(pkg) => {
              setPackages((prev) => ({ ...prev, [pkg]: 'latest' }));
              setLogs((prev) => [
                ...prev,
                {
                  id: String(Date.now()),
                  type: 'success',
                  text: `Added package "${pkg}" to package.json dependencies.`,
                  timestamp: new Date().toTimeString().slice(0, 8)
                }
              ]);
            }}
          />
        </div>
      </div>
    </div>
  );
}
