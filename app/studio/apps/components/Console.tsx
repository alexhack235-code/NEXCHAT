'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'warn' | 'error';
  text: string;
  timestamp: string;
}

interface ConsoleProps {
  logs: LogEntry[];
  onClearLogs?: () => void;
  onFixWithAI?: (errorMessage: string) => void;
  isFixing?: boolean;
}

export default function Console({
  logs,
  onClearLogs,
  onFixWithAI,
  isFixing
}: ConsoleProps) {
  const [commandInput, setCommandInput] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const latestError = logs.slice().reverse().find((l) => l.type === 'error');

  const getLogStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400 bg-red-500/10 border-l-2 border-red-500 pl-2';
      case 'warn':
        return 'text-amber-300';
      case 'success':
        return 'text-emerald-400 font-semibold';
      case 'info':
      default:
        return 'text-neutral-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08080a] border-t border-white/10 font-mono text-xs select-none">
      {/* Console Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f0f13] border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-neutral-300 text-[11px] uppercase tracking-wider">
            WebContainer Terminal & Logs
          </span>
          <span className="text-[10px] text-neutral-500">
            ({logs.length} events)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Fix button if error present */}
          {latestError && onFixWithAI && (
            <button
              type="button"
              onClick={() => onFixWithAI(latestError.text)}
              disabled={isFixing}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] tracking-wide transition shadow-sm animate-bounce cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{isFixing ? 'AI Patching...' : 'Fix Error with AI'}</span>
            </button>
          )}

          {onClearLogs && (
            <button
              type="button"
              onClick={onClearLogs}
              title="Clear terminal logs"
              className="text-neutral-500 hover:text-white text-[11px] px-1.5 py-0.5 rounded hover:bg-white/5 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 font-mono text-[11px] leading-relaxed scrollbar-thin select-text"
      >
        {logs.map((log) => (
          <div key={log.id} className={`flex items-start gap-2 ${getLogStyle(log.type)}`}>
            <span className="text-neutral-600 text-[10px] shrink-0 select-none">
              [{log.timestamp}]
            </span>
            <span className="break-all">{log.text}</span>
          </div>
        ))}
      </div>

      {/* Terminal Input Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0d] border-t border-white/5">
        <span className="text-emerald-400 font-bold">$</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Run command (e.g. npm run test, npx prettier --write)..."
          className="flex-1 bg-transparent text-white placeholder-neutral-600 text-xs focus:outline-none"
        />
      </div>
    </div>
  );
}
