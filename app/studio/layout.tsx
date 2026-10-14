import React from 'react';
import StudioNav from '@/components/studio/StudioNav';

export const metadata = {
  title: 'NEX Studio | Create Apps & Unreal Game Animations',
  description: 'The first platform where watching reels, creating apps from prompts, and simulating impossible Unreal Engine 3D animations is seamless.',
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-[#FE2C55] selection:text-white">
      <StudioNav />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
