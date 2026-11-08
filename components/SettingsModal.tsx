'use client';

import React, { useState } from 'react';
import { X, Key, Cpu, Check, AlertCircle, RefreshCw, Shield, ChevronLeft } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  model,
  setModel,
}: SettingsModalProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Test ping connection for AI tool',
          apiKey: apiKey || undefined,
          model,
        }),
      });

      const data = await res.json();
      if (res.ok && data.prompt) {
        setTestResult({
          success: true,
          message: `Connected successfully! Responded via ${data.modelUsed}.`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to connect with provided key.',
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Network error contacting generation endpoint.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 w-full h-[100dvh] bg-[#0b141a] flex flex-col overflow-hidden animate-[tgSlideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] select-none"
    >
      {/* 2. Header: Always top bar: Back < + Title + X, px-4 py-3, border-b border-white/10, sticky top-0 */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0b141a] shrink-0 min-h-[54px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5 text-[#00a884]" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#202c33] border border-white/10 flex items-center justify-center text-[#00a884]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Settings & AI Config</h3>
              <p className="text-[11px] text-[#8696a0]">Gemini API credentials & neural models</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 3. Content: flex-1 overflow-y-auto px-4 py-4, scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Model Selection */}
        <div className="space-y-2.5 bg-[#202c33]/50 p-4 rounded-2xl border border-white/5">
          <label className="flex items-center gap-2 text-xs font-semibold text-white/90">
            <Cpu className="w-4 h-4 text-[#00a884]" />
            <span>Gemini Neural Thinking Model</span>
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl bg-[#2a3942] border border-white/10 text-white font-mono text-xs outline-none focus:border-[#00a884] transition-colors"
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (Ultra-Fast Neural Engine — Recommended)</option>
            <option value="gemini-3-flash-preview">gemini-3-flash-preview (Thinking Preview)</option>
            <option value="gemini-flash-latest">gemini-flash-latest (General Fast Model)</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep Thinking Pro)</option>
          </select>
          <p className="text-[11.5px] text-[#8696a0] leading-relaxed">
            The Pro Thinking model synthesizes the highest fidelity motion tokens and typography pairings.
          </p>
        </div>

        {/* API Key Input */}
        <div className="space-y-2.5 bg-[#202c33]/50 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-white/90">
              <Shield className="w-4 h-4 text-[#00a884]" />
              <span>Google AI Studio API Key</span>
            </label>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-[#00a884] hover:underline font-mono"
            >
              {showKey ? 'Hide key' : 'Show key'}
            </button>
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy... (leave blank to use system default pool)"
            className="w-full px-3.5 py-3 rounded-xl bg-[#2a3942] border border-white/10 text-white font-mono text-xs outline-none focus:border-[#00a884] transition-colors"
          />
          <p className="text-[11.5px] text-[#8696a0] leading-relaxed">
            Get your key free at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[#00a884] hover:underline"
            >
              aistudio.google.com/apikey
            </a>
            . Stored securely in your client device session.
          </p>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/40 border border-red-500/30 text-red-300'
            }`}
          >
            {testResult.success ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* 4. Bottom Action: Sticky bottom: p-4 border-t border-white/10, button w-full h-[50px] rounded-full */}
      <div className="sticky bottom-0 z-20 p-4 border-t border-white/10 bg-[#0b141a] pb-[calc(16px+env(safe-area-inset-bottom,0px))] flex items-center gap-3">
        <button
          type="button"
          onClick={testConnection}
          disabled={testing}
          className="h-[50px] px-5 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-white text-sm font-medium border border-white/10 transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          {testing ? <RefreshCw className="w-4 h-4 animate-spin text-[#00a884]" /> : <Check className="w-4 h-4 text-[#00a884]" />}
          <span>Test Ping</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-[50px] rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-[15.5px] font-semibold tracking-wide transition-colors shadow-lg shadow-[#00a884]/25 flex items-center justify-center cursor-pointer"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}

export default SettingsModal;
