'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

const MANIFESTO_WORDS = [
  'WE', 'DO', 'NOT', 'BUILD', 'TOYS.',
  'NEXCHAT', 'IS', 'AN', 'UNCOMPROMISING', 'ENCRYPTED', 'COMMUNICATIONS', 'ARCHITECTURE.',
  'DISASSEMBLED', 'IN', 'PURE', '3D', 'CAD', 'SPACE,',
  'EVERY', 'PACKET', 'IS', 'SEALED.',
  'EVERY', 'VIEWPORT', 'IS', 'ISOLATED.',
  'ZERO', 'LAYOUT', 'SHIFT.',
  'ZERO', 'PIXEL', 'OVERFLOW.',
  'ZERO', 'KNOWLEDGE', 'PROOF.'
];

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: any;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, end], [0.12, 1.0]);
  const color = useTransform(progress, [start, end], ['#4A5568', index % 4 === 0 ? '#00FF88' : '#FFFFFF']);

  return (
    <motion.span
      style={{ opacity, color }}
      className="inline-block mr-3 sm:mr-4 font-black transition-colors"
    >
      {word}
    </motion.span>
  );
}

export function Manifesto() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section
      ref={containerRef}
      className="relative min-h-[140vh] py-32 flex items-center justify-center bg-[#05080C] border-y border-white/5 px-6"
    >
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-block px-3.5 py-1 rounded-full bg-[rgba(0,255,136,0.08)] border border-[rgba(0,255,136,0.25)] text-xs font-mono text-[#00FF88] mb-8">
          // ARCHITECTURAL MANIFESTO
        </div>

        <div className="font-orbitron text-2xl sm:text-4xl md:text-5xl leading-tight sm:leading-snug select-none tracking-tight">
          {MANIFESTO_WORDS.map((w, idx) => (
            <Word
              key={idx}
              word={w}
              index={idx}
              total={MANIFESTO_WORDS.length}
              progress={scrollYProgress}
            />
          ))}
        </div>

        <div className="mt-12 text-xs font-mono text-[#8696A0] tracking-widest uppercase">
          [SCROLL DOWN TO REVEAL FULL AXIOM]
        </div>
      </div>
    </section>
  );
}
