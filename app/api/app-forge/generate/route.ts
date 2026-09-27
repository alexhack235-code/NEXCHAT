import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, template } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const isCrypto = prompt.toLowerCase().includes('crypto');
    const isWater = prompt.toLowerCase().includes('water') || prompt.toLowerCase().includes('freeze');

    let mainAppCode = '';

    if (isWater) {
      mainAppCode = `// NEX App Forge: iPhone 18 vs Samsung S26 Water Freeze Test
import React, { useState } from 'react';

export default function App() {
  const [frozen, setFrozen] = useState(true);
  const [likes, setLikes] = useState(25400);

  return (
    <div className="h-screen bg-[#030308] text-white flex flex-col justify-between p-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xs font-black text-[#FE2C55]">NEX WATER FREEZE LAB</h1>
        <button 
          onClick={() => setFrozen(!frozen)}
          className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold"
        >
          {frozen ? '❄️ Liquid Nitrogen -12°C' : '💧 Room Water 20°C'}
        </button>
      </header>
      <div className="flex justify-around items-center my-auto">
        <div className="p-4 bg-white/5 rounded-2xl border border-cyan-400/40 text-center">
          <p className="font-bold">iPhone 18 Pro</p>
          <span className="text-xs text-cyan-400">Titanium Ice</span>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-purple-400/40 text-center">
          <p className="font-bold">Galaxy S26 Ultra</p>
          <span className="text-xs text-purple-400">Armor Core</span>
        </div>
      </div>
      <footer className="text-center text-xs text-neutral-500">Swipe for more durability reels</footer>
    </div>
  );
};`;
    } else if (isCrypto) {
      mainAppCode = `// NEX App Forge: Crypto Reels Tracker
import React from 'react';

export default function App() {
  return (
    <div className="h-screen bg-black text-white p-6 flex flex-col justify-between">
      <h2 className="text-xs font-black text-[#FE2C55]">CRYPTO REELS</h2>
      <div className="space-y-4">
        <div className="p-4 bg-white/10 rounded-2xl flex justify-between">
          <span className="font-bold">BTC</span>
          <span className="font-mono text-amber-400">$94,200</span>
        </div>
        <div className="p-4 bg-white/10 rounded-2xl flex justify-between">
          <span className="font-bold">ETH</span>
          <span className="font-mono text-cyan-400">$3,850</span>
        </div>
      </div>
      <button className="w-full py-3 bg-[#FE2C55] rounded-xl font-bold text-xs uppercase">Instant Buy</button>
    </div>
  );
};`;
    } else {
      mainAppCode = `// NEX App Forge: Custom App
import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#08080c] text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-sm font-bold text-[#FE2C55]">Generated NEX Application</h1>
      <p className="text-xs text-neutral-400 mt-2">${prompt}</p>
    </div>
  );
};`;
    }

    const files = {
      'app.tsx': mainAppCode,
      'package.json': JSON.stringify(
        {
          name: 'nex-generated-app',
          version: '1.0.0',
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            tailwindcss: '^3.4.1'
          }
        },
        null,
        2
      )
    };

    return NextResponse.json({
      success: true,
      prompt,
      files,
      generationTimeMs: 420
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
