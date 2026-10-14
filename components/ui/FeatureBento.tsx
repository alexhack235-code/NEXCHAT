'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNexStore } from '@/lib/store';
import {
  ShieldCheck,
  Film,
  Flame,
  Terminal,
  CheckCheck,
  Send,
  Lock,
  Sliders,
  Volume2,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export function FeatureBento() {
  const {
    ttlSeconds,
    setTtlSeconds,
    terminalLogs,
    addTerminalLog,
    clearTerminalLogs,
    incrementPackets,
  } = useNexStore();

  // Card 1 state: Packet simulator
  const [testMsg, setTestMsg] = useState('');
  const [cipherStream, setCipherStream] = useState<
    Array<{ plain: string; hash: string; delivered: boolean }>
  >([
    {
      plain: 'Quantum key exchange verified',
      hash: '3f8a9e...e2e4',
      delivered: true,
    },
    {
      plain: 'Exploded CAD telemetry operational',
      hash: '91bc40...aa12',
      delivered: true,
    },
  ]);

  const handleSendPacket = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testMsg.trim()) return;
    const hash = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setCipherStream((prev) => [
      ...prev.slice(-3),
      { plain: testMsg, hash: `${hash}...sha512`, delivered: true },
    ]);
    setTestMsg('');
    incrementPackets();
    addTerminalLog(`[E2E_DISPATCH] Packet broadcast: ${hash}...`, 'success');
  };

  // Card 4 state: Terminal command field
  const [cmdInput, setCmdInput] = useState('');

  const executeCmd = (cmd: string) => {
    if (!cmd.trim()) return;
    const clean = cmd.trim().toLowerCase();
    addTerminalLog(`nex@NEXCHAT:~$ ${cmd}`, 'info');

    if (clean === 'help') {
      addTerminalLog('Commands: help | ls chats | encrypt | status | clear', 'info');
    } else if (clean === 'ls chats') {
      addTerminalLog('1. [ONLINE] NexChat Core System (AES-256)', 'success');
      addTerminalLog('2. [ONLINE] Operative Mesh Relay', 'success');
      addTerminalLog('3. [OFFLINE] Vault Storage Node 04', 'warn');
    } else if (clean === 'encrypt') {
      addTerminalLog('01001110 01000101 01011000 01000011 01001000 01000001 01010100', 'success');
      addTerminalLog('[CIPHER] Quantum Key Exchange complete. Socket encrypted.', 'success');
    } else if (clean === 'status') {
      addTerminalLog('[VAULT] 24H Ephemeral Multi-Blob Storage active (1-5 slots)', 'info');
    } else if (clean === 'clear') {
      clearTerminalLogs();
    } else {
      addTerminalLog(`Command not recognized: "${cmd}". Type "help"`, 'error');
    }
    setCmdInput('');
  };

  return (
    <section id="bento-grid" className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-24 relative z-20">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(0,255,136,0.08)] border border-[rgba(0,255,136,0.25)] text-xs font-mono text-[#00FF88] mb-4">
          <Terminal className="w-3.5 h-3.5" />
          <span>FOUR-SUBSYSTEM ARCHITECTURE // BENTO MATRIX</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-orbitron tracking-tight text-white mb-4">
          ENGINEERED FOR <span className="text-[#00FF88] drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]">ZERO COMPROMISE</span>
        </h2>
        <p className="text-sm sm:text-base text-[#8696A0] font-sans">
          Four independent engines working in seamless synchronized choreography. Zero layout shift, zero pixel overflow.
        </p>
      </div>

      {/* Bento Grid (12-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CARD 1 (Span 8): Zero-Knowledge Messaging Core */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="lg:col-span-8 rounded-2xl bg-[#0A0E13] border border-[rgba(0,255,136,0.18)] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-[rgba(0,255,136,0.4)] transition-all"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00FF88]/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-orbitron text-white">
                    Zero-Knowledge Messaging Core
                  </h3>
                  <p className="text-xs font-mono text-[#8696A0]">Subsystem 01 // AES-GCM-256 Engine</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-[#00FF88]/15 border border-[#00FF88]/30 text-[10px] font-mono text-[#00FF88] font-bold">
                16,989 LINES
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#8696A0] leading-relaxed mb-6">
              Client-side cryptographic pipeline. Messages are sealed with ephemeral keys before hitting network sockets. The server never observes plaintext.
            </p>

            {/* Interactive Packet Dispatcher */}
            <div className="bg-[#111B21] rounded-xl p-4 border border-white/5 space-y-3">
              <div className="text-[11px] font-mono text-[#00FF88] flex items-center justify-between">
                <span>// LIVE CIPHER PACKET PIPELINE</span>
                <span className="text-white/40">SHA-512 SECURE</span>
              </div>

              {/* Stream List */}
              <div className="space-y-2">
                {cipherStream.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#00FF88]" />
                      <span className="text-white">{item.plain}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#8696A0] text-[11px]">
                      <span className="text-[#00F2FF]">{item.hash}</span>
                      <CheckCheck className="w-4 h-4 text-[#00FF88]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendPacket} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Encrypt & transmit custom packet payload..."
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#00FF88]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00FF88] hover:brightness-110 text-black font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit</span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* CARD 2 (Span 4): 9:16 Reels Engine */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="lg:col-span-4 rounded-2xl bg-[#0A0E13] border border-[rgba(0,255,136,0.18)] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-[rgba(0,255,136,0.4)] transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00F2FF]/10 border border-[#00F2FF]/30 flex items-center justify-center text-[#00F2FF]">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-orbitron text-white">9:16 Reels Stage</h3>
                  <p className="text-xs font-mono text-[#8696A0]">Subsystem 02 // Video Feed</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8696A0] leading-relaxed mb-4">
              Zero-collision layout architecture with isolated z-index layers. Captions, action rail, and audio visualizer never collide.
            </p>

            {/* Simulated 9:16 Stage Card */}
            <div className="aspect-[9/12] max-w-[200px] mx-auto rounded-xl bg-gradient-to-b from-[#111B21] to-[#05080C] border border-[#00FF88]/30 p-3 relative flex flex-col justify-between overflow-hidden shadow-xl">
              {/* Top Bar */}
              <div className="flex justify-between items-center text-[10px] font-mono text-[#00FF88]">
                <span>LIVE // 60FPS</span>
                <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
              </div>

              {/* Center Audio Spectrum Simulator */}
              <div className="flex items-center justify-center gap-1 h-12">
                {[4, 12, 8, 16, 6, 14, 10, 18, 7, 12, 5].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-[#00FF88] rounded-full animate-pulse"
                    style={{
                      height: `${h * 2}px`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Bottom Captions Container */}
              <div className="bg-black/60 backdrop-blur-md rounded-lg p-2 border border-white/10">
                <div className="text-[10px] font-bold text-white font-mono truncate">
                  @operative_mesh
                </div>
                <div className="text-[9px] text-[#8696A0] truncate">
                  Subsystem decoupled: zero layout jitter
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 3 (Span 4): Ghost Protocol Shredder */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="lg:col-span-4 rounded-2xl bg-[#0A0E13] border border-[rgba(0,255,136,0.18)] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-[rgba(0,255,136,0.4)] transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-orbitron text-white">Ghost Protocol</h3>
                  <p className="text-xs font-mono text-[#8696A0]">Subsystem 03 // TTL Shredder</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8696A0] leading-relaxed mb-6">
              Autonomous self-destruct timers. Ephemeral messages expire and overwrite memory buffers automatically across peers.
            </p>

            {/* Interactive TTL Slider */}
            <div className="bg-[#111B21] rounded-xl p-4 border border-white/5 space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#8696A0]">CONFIGURED TTL:</span>
                <span className="text-red-400 font-bold text-sm">
                  {ttlSeconds < 60
                    ? `${ttlSeconds} SECONDS`
                    : ttlSeconds < 3600
                    ? `${Math.floor(ttlSeconds / 60)} MINUTES`
                    : `${Math.floor(ttlSeconds / 3600)} HOURS`}
                </span>
              </div>

              <input
                type="range"
                min="5"
                max="86400"
                step="5"
                value={ttlSeconds}
                onChange={(e) => setTtlSeconds(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>5s (Instant)</span>
                <span>1h</span>
                <span>24h (Max)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 4 (Span 8): Hacker Terminal Subsystem */}
        <motion.div
          id="hacker-terminal"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="lg:col-span-8 rounded-2xl bg-[#0A0E13] border border-[rgba(0,255,136,0.18)] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-[rgba(0,255,136,0.4)] transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88]">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-orbitron text-white">
                    Hacker Terminal OS
                  </h3>
                  <p className="text-xs font-mono text-[#8696A0]">Subsystem 04 // 2-Way Synchronized CLI</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#00FF88]">
                <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
                <span>LIVE SYNC</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#8696A0] leading-relaxed mb-4">
              Full synchronized control bridge. Dispatch commands to query encryption, inspect node status, and trigger simulated call streams.
            </p>

            {/* Quick Command Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-mono">
              <span className="text-white/40 text-[11px]">Quick:</span>
              {['help', 'ls chats', 'encrypt', 'status', 'clear'].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => executeCmd(cmd)}
                  className="px-2.5 py-1 rounded bg-[#00FF88]/10 hover:bg-[#00FF88]/20 border border-[#00FF88]/30 text-[#00FF88] text-[11px] transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Terminal Screen Console */}
            <div className="bg-[#070B0F] border border-[#00FF88]/20 rounded-xl p-4 font-mono text-xs text-[#00FF88] space-y-2 h-48 overflow-y-auto scrollbar-thin">
              {terminalLogs.map((log) => (
                <div key={log.id} className="leading-relaxed">
                  <span className="text-white/30">[{log.time}]</span>{' '}
                  <span
                    className={
                      log.type === 'error'
                        ? 'text-red-400 font-bold'
                        : log.type === 'success'
                        ? 'text-[#00FF88] font-bold'
                        : log.type === 'warn'
                        ? 'text-yellow-400'
                        : 'text-[#00F2FF]'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Terminal Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeCmd(cmdInput);
              }}
              className="flex items-center gap-2 mt-3 bg-[#070B0F] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono"
            >
              <span className="text-[#00FF88] font-bold">nex@NEXCHAT:~$</span>
              <input
                type="text"
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                placeholder="Type command ('help', 'ls chats', 'encrypt')..."
                className="flex-1 bg-transparent text-[#00FF88] outline-none placeholder-white/30"
              />
              <button type="submit" className="text-white/50 hover:text-white">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
