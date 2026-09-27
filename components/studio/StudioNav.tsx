'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function StudioNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: '3D Studio',
      href: '/studio',
      badge: 'R3F / Three.js',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      name: 'App Forge',
      href: '/studio/apps',
      badge: 'v0 + Bolt',
      badgeColor: 'bg-[#FE2C55]/10 text-[#FE2C55] border-[#FE2C55]/30',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      name: 'Game Dev Lab',
      href: '/studio/games',
      badge: 'Unreal Engine 5',
      badgeColor: 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      )
    },
    {
      name: 'NEX Reels',
      href: '/reels',
      badge: 'TikTok 3D',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link href="/studio" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FE2C55] via-purple-600 to-[#00FF88] p-[1.5px] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#0a0a0a] rounded-[10px] flex items-center justify-center font-black text-white text-xs tracking-wider">
              NEX
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-white">NEX STUDIO</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">v3.8</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">Create Apps & Impossible Unreal Games</p>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-1 bg-[#121214] p-1 rounded-xl border border-white/5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/studio' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${item.badgeColor} font-bold`}>
                {item.badge}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gemini 3.8 + Rust Engine Active</span>
        </div>

        <Link
          href="/profile"
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-xs font-medium text-white"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FE2C55] to-[#00FF88] flex items-center justify-center text-[10px] font-bold">
            A
          </div>
          <span>alexander</span>
        </Link>
      </div>
    </header>
  );
}
