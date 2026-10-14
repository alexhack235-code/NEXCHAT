'use client';

import React, { useEffect, useRef } from 'react';
// @ts-ignore
import Lenis from 'lenis';
import { useNexStore } from '@/lib/store';
import NexCoreCanvas from '@/components/3d/NexCoreCanvas';
import { Navbar } from '@/components/ui/Navbar';
import { HudOverlay } from '@/components/ui/HudOverlay';
import { FeatureBento } from '@/components/ui/FeatureBento';
import { Manifesto } from '@/components/ui/Manifesto';
import { Footer } from '@/components/ui/Footer';

export default function NexChatLandingPage() {
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const setScrollProgress = useNexStore((s) => s.setScrollProgress);

  useEffect(() => {
    // 1. Initialize Lenis Smooth Scrolling Engine
    const lenis = new Lenis({
      lerp: 0.05,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
      syncTouch: true,
      autoRaf: false,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);

      // Measure 500vh Scrollytelling Track Progress (0.0 to 1.0)
      if (scrollTrackRef.current) {
        const rect = scrollTrackRef.current.getBoundingClientRect();
        const totalScrollableHeight = rect.height - window.innerHeight;
        if (totalScrollableHeight > 0) {
          const currentScrolled = -rect.top;
          const progress = Math.min(
            1,
            Math.max(0, currentScrolled / totalScrollableHeight)
          );
          setScrollProgress(progress);
        }
      }

      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [setScrollProgress]);

  return (
    <main className="w-full bg-[#05080C] text-[#F8FAFC] min-h-screen relative overflow-x-hidden selection:bg-[#00FF88] selection:text-black">
      {/* 1. Floating Top Glassmorphism Navigation Bar */}
      <Navbar />

      {/* 2. The 500vh 3D Scrollytelling Track (Video-Like Scrub) */}
      <div
        ref={scrollTrackRef}
        className="relative w-full h-[500vh] bg-[#05080C]"
      >
        <div className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden">
          {/* Three.js Exploded CAD Disassembly WebGL Canvas */}
          <NexCoreCanvas />

          {/* Fixed Telemetry HUD Overlay (Reticles, Waypoints, Live Stream) */}
          <HudOverlay />
        </div>
      </div>

      {/* 3. Feature Bento Grid (4 Subsystems) */}
      <FeatureBento />

      {/* 4. Manifesto Section (Scroll-illuminated word reveal) */}
      <Manifesto />

      {/* 5. Production Footer with 20vw Typography Mask */}
      <Footer />
    </main>
  );
}
