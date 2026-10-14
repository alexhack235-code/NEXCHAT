'use client';

import React, { useState } from 'react';
import { X, Key, Cpu, Check, AlertCircle, RefreshCw, Shield } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[540px] rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[#0E0E12] shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] p-6 overflow-hidden flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#1A1A1E] border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-[#5E6AD2]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-white">AI Engine Configuration</h3>
              <p className="font-mono text-[11px] text-[#F5F5F0]/50">Gemini API credentials & model architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#F5F5F0]/50 hover:text-white hover:bg-[#1A1A1E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-mono text-xs text-[#F5F5F0]/80">
            <Cpu className="w-3.5 h-3.5 text-[#5E6AD2]" />
            <span>Gemini Neural Thinking Model</span>
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#1A1A1E] border border-[rgba(255,255,255,0.1)] text-[#F5F5F0] font-mono text-xs outline-none focus:border-[#5E6AD2] transition-colors"
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (Ultra-Fast Neural Engine — Recommended)</option>
            <option value="gemini-3-flash-preview">gemini-3-flash-preview (Thinking Preview)</option>
            <option value="gemini-flash-latest">gemini-flash-latest (General Fast Model)</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep Thinking Pro)</option>
          </select>
          <p className="font-mono text-[10px] text-[#F5F5F0]/40">
            The Pro Thinking model synthesizes the highest fidelity motion tokens and typography pairings.
          </p>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-mono text-xs text-[#F5F5F0]/80">
              <Shield className="w-3.5 h-3.5 text-[#5E6AD2]" />
              <span>Google AI Studio API Key</span>
            </label>
            <button
              onClick={() => setShowKey(!showKey)}
              className="font-mono text-[10px] text-[#5E6AD2] hover:underline"
            >
              {showKey ? 'Hide key' : 'Show key'}
            </button>
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy... (leave blank to use system default key)"
            className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#1A1A1E] border border-[rgba(255,255,255,0.1)] text-[#F5F5F0] font-mono text-xs outline-none focus:border-[#5E6AD2] transition-colors"
          />
          <p className="font-mono text-[10px] text-[#F5F5F0]/40">
            Get your key free at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[#5E6AD2] hover:underline"
            >
              aistudio.google.com/apikey
            </a>
            . Stored locally in your browser session.
          </p>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-[10px] font-mono text-xs flex items-center gap-2 ${
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

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <button
            onClick={testConnection}
            disabled={testing}
            className="btn-press flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-[#1A1A1E] hover:bg-[#25252A] text-white font-mono text-xs border border-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50"
          >
            {testing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5E6AD2]" />
            ) : (
              <Check className="w-3.5 h-3.5 text-[#5E6AD2]" />
            )}
            <span>Test Connection</span>
          </button>

          <button
            onClick={onClose}
            className="btn-press px-5 py-2 rounded-[8px] bg-[#5E6AD2] hover:bg-[#4D58B8] text-white font-mono text-xs font-medium tracking-wide transition-colors shadow-[0_0_16px_rgba(94,106,210,0.3)]"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
