import { create } from 'zustand';

export interface TerminalLog {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface NexState {
  scrollProgress: number;
  activeWaypoint: number;
  activeTab: 'chat' | 'reels' | 'terminal';
  ttlSeconds: number;
  cipherPackets: number;
  peersCount: number;
  terminalLogs: TerminalLog[];
  setScrollProgress: (progress: number) => void;
  setActiveWaypoint: (wp: number) => void;
  setActiveTab: (tab: 'chat' | 'reels' | 'terminal') => void;
  setTtlSeconds: (seconds: number) => void;
  addTerminalLog: (text: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  clearTerminalLogs: () => void;
  incrementPackets: () => void;
}

export const useNexStore = create<NexState>((set) => ({
  scrollProgress: 0,
  activeWaypoint: 1,
  activeTab: 'chat',
  ttlSeconds: 300,
  cipherPackets: 147353,
  peersCount: 42,
  terminalLogs: [
    {
      id: 'init-1',
      time: '18:40:01',
      text: '[KERNEL] NEXCHAT Core Engine v4.8 booted',
      type: 'info',
    },
    {
      id: 'init-2',
      time: '18:40:02',
      text: '[SECURITY] Zero-Knowledge AES-GCM-256 socket linked',
      type: 'success',
    },
    {
      id: 'init-3',
      time: '18:40:04',
      text: '[CAD] 3-Subsystem Exploded Mesh loaded into memory',
      type: 'info',
    },
  ],
  setScrollProgress: (progress) => {
    let wp = 1;
    if (progress >= 0.90) wp = 5;
    else if (progress >= 0.75) wp = 4;
    else if (progress >= 0.50) wp = 3;
    else if (progress >= 0.25) wp = 2;
    set({ scrollProgress: progress, activeWaypoint: wp });
  },
  setActiveWaypoint: (wp) => set({ activeWaypoint: wp }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTtlSeconds: (seconds) => set({ ttlSeconds: seconds }),
  addTerminalLog: (text, type = 'info') =>
    set((state) => ({
      terminalLogs: [
        ...state.terminalLogs.slice(-25),
        {
          id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          text,
          type,
        },
      ],
    })),
  clearTerminalLogs: () => set({ terminalLogs: [] }),
  incrementPackets: () => set((state) => ({ cipherPackets: state.cipherPackets + 1 })),
}));
