'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Lock, 
  Mic, 
  BarChart2, 
  FileText, 
  Download, 
  Check, 
  CheckCheck, 
  Paperclip, 
  Send, 
  Camera, 
  Image as ImageIcon, 
  User, 
  Smile, 
  Zap, 
  Heart,
  Flame,
  ThumbsUp,
  Trash2,
  Pin,
  X,
  Volume2
} from 'lucide-react';
import VoiceNotePlayer from './VoiceNotePlayer.jsx';

const EMOJI_REGEX = /[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{200D}\u{FE0E}\u{FE0F}]/gu;

// Formatter for rich text (*bold*, _italic_, ~strike~, ```code```)
function renderFormattedText(text) {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3);
      return (
        <pre key={idx} className="my-1.5 p-2.5 rounded-md bg-black/60 font-mono text-xs text-[#00FF88] overflow-x-auto border border-[#00FF88]/20">
          <code>{code}</code>
        </pre>
      );
    }

    const tokens = [];
    const inlineRegex = /(\*([^*]+)\*|_([^_]+)_|~([^~]+)~)/g;
    let match;
    let lastIndex = 0;

    while ((match = inlineRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(part.substring(lastIndex, match.index));
      }
      if (match[2]) {
        tokens.push(<strong key={match.index} className="font-bold text-white">{match[2]}</strong>);
      } else if (match[3]) {
        tokens.push(<em key={match.index} className="italic text-white/90">{match[3]}</em>);
      } else if (match[4]) {
        tokens.push(<del key={match.index} className="line-through text-white/60">{match[4]}</del>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < part.length) {
      tokens.push(part.substring(lastIndex));
    }

    return <span key={idx}>{tokens}</span>;
  });
}

// Spawn Ash Particles for NEX 180ms Ash-Fade effect
function spawnAshParticles(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const particleCount = 8;
  const container = document.body;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'nex-ash-particle';
    const size = 3 + Math.random() * 4;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${rect.left + Math.random() * rect.width}px`;
    particle.style.top = `${rect.top + Math.random() * rect.height}px`;

    const driftX = (Math.random() - 0.5) * 40;
    const driftY = -15 - Math.random() * 30;
    particle.style.setProperty('--ash-drift-x', `${driftX}px`);
    particle.style.setProperty('--ash-drift-y', `${driftY}px`);

    container.appendChild(particle);
    setTimeout(() => {
      try {
        particle.remove();
      } catch (_) {}
    }, 200);
  }
}

export default function CenterChat({
  activeChat,
  onSendMessage,
  onDeleteMessage,
  onStartVoiceCall,
  onStartVideoCall,
  onLog
}) {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionAnchorId, setReactionAnchorId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deletingMsgIds, setDeletingMsgIds] = useState(new Set());
  const [pinnedPreview, setPinnedPreview] = useState(null);

  // Push-to-Talk Mic Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(0);

  const messagesEndRef = useRef(null);
  const messageElementsRef = useRef(new Map());

  // 1. Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  // 2. Strict PTT Cleanup on Component Unmount
  useEffect(() => {
    return () => {
      // Clean up any ongoing recording when unmounted
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
            mediaRecorderRef.current.stop();
          } catch (_) {}
        }
        if (audioStreamRef.current) {
          try {
            audioStreamRef.current.getTracks().forEach((track) => track.stop());
          } catch (_) {}
          audioStreamRef.current = null;
        }
      }
    };
  }, []);

  // 3. Deduplicate messages by message.id to guarantee 1 player per message ID
  const deduplicatedMessages = useMemo(() => {
    if (!activeChat?.messages) return [];
    const seen = new Map();
    for (const msg of activeChat.messages) {
      const id = msg.id || msg.clientMsgId || msg.docId || msg.timestamp;
      if (!seen.has(id)) {
        seen.set(id, msg);
      }
    }
    return Array.from(seen.values());
  }, [activeChat?.messages]);

  // 4. Fast Ash-Fade Delete Animation (180ms Snappy NEX Style)
  const triggerDeleteWithAshFade = useCallback((msgId, forEveryone = false) => {
    if (!msgId || deletingMsgIds.has(msgId)) return;

    // Close any context menu
    setActiveMenuId(null);

    // Mark as deleting
    setDeletingMsgIds((prev) => new Set(prev).add(msgId));

    // Locate DOM element and apply ash class + particle puff
    const domEl = messageElementsRef.current.get(msgId);
    if (domEl) {
      domEl.classList.add('nex-delete-ash');
      spawnAshParticles(domEl);
    }

    onLog?.(`[DELETE] Starting NEX Ash-Fade on ${msgId} (180ms)`);

    // Exactly 180ms fast NEX ash animation then remove from list
    setTimeout(() => {
      if (typeof onDeleteMessage === 'function') {
        onDeleteMessage(msgId, forEveryone);
      }
      setDeletingMsgIds((prev) => {
        const next = new Set(prev);
        next.delete(msgId);
        return next;
      });
      messageElementsRef.current.delete(msgId);
      onLog?.(`[DELETE] Media ${msgId} completely purged with ash animation.`);
    }, 180);
  }, [deletingMsgIds, onDeleteMessage, onLog]);

  // 5. PTT Voice Note: Start on User Gesture ONLY (MouseDown / TouchStart)
  const handleMicPressStart = async (e) => {
    e.preventDefault();

    // Guard: Never start if already recording
    if (isRecordingRef.current) return;

    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingElapsed(0);
    recordingStartTimeRef.current = Date.now();
    audioChunksRef.current = [];

    // Start timer interval (updates elapsed display every 100ms)
    recordingTimerRef.current = setInterval(() => {
      const ms = Date.now() - recordingStartTimeRef.current;
      setRecordingElapsed(Math.floor(ms / 1000));
    }, 100);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Double-check if user already released while awaiting permissions
        if (!isRecordingRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        audioStreamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(100);
        onLog?.('[VOICE] PTT Mic pressed: Recording started.');
      } else {
        onLog?.('[VOICE] MediaDevices not supported, simulated recording started.');
      }
    } catch (err) {
      console.warn('[VOICE] Mic permission failed, fallback active:', err);
    }
  };

  // 6. PTT Voice Note: Stop on User Gesture (MouseUp / TouchEnd / MouseLeave)
  const handleMicPressEnd = (e) => {
    e?.preventDefault();

    // Guard: Ignore if not recording
    if (!isRecordingRef.current) return;

    isRecordingRef.current = false;
    setIsRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const elapsedMs = Date.now() - recordingStartTimeRef.current;
    const elapsedSeconds = Math.max(1, Math.round(elapsedMs / 1000));

    // CRITICAL REQUIREMENT: Discard if under 2 seconds!
    if (elapsedMs < 2000) {
      onLog?.(`[VOICE] Voice note duration ${elapsedMs}ms is under 2.0s -> DISCARDED.`);
      // Cleanup stream and recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
      if (audioStreamRef.current) {
        try {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch (_) {}
        audioStreamRef.current = null;
      }
      audioChunksRef.current = [];
      return;
    }

    // Process valid audio (>= 2 seconds)
    const formattedDuration = `0:${elapsedSeconds < 10 ? '0' : ''}${elapsedSeconds}`;

    const finalizeAndSendVoice = (blobUrl) => {
      onSendMessage({
        id: `voice-${Date.now()}`,
        sender: 'me',
        type: 'voice',
        duration: formattedDuration,
        audioUrl: blobUrl || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      });
      onLog?.(`[VOICE] Sent genuine voice note (${formattedDuration})`);
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        let blobUrl = null;
        if (audioChunksRef.current.length > 0) {
          const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mime });
          blobUrl = URL.createObjectURL(audioBlob);
        }
        finalizeAndSendVoice(blobUrl);

        if (audioStreamRef.current) {
          try {
            audioStreamRef.current.getTracks().forEach((t) => t.stop());
          } catch (_) {}
          audioStreamRef.current = null;
        }
      };
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {
        finalizeAndSendVoice(null);
      }
    } else {
      finalizeAndSendVoice(null);
      if (audioStreamRef.current) {
        try {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch (_) {}
        audioStreamRef.current = null;
      }
    }
  };

  if (!activeChat) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#101a24] text-white/60 p-6 select-none">
        <div className="w-20 h-20 rounded-full bg-[#111b21] border border-[#00FF88]/30 flex items-center justify-center text-4xl mb-4 shadow-xl shadow-[#00FF88]/10 animate-pulse">
          <Zap className="w-10 h-10 text-[#00FF88]" />
        </div>
        <h3 className="text-xl font-bold font-display text-white">NEXCHAT WEB TERMINAL</h3>
        <p className="text-sm text-white/50 max-w-sm text-center mt-2">
          Select a chat from the left or type <code className="text-[#00FF88] font-mono bg-black/40 px-1.5 py-0.5 rounded">open [name]</code> in the right terminal panel.
        </p>
      </div>
    );
  }

  const handleSend = (e) => {
    e?.preventDefault();
    const cleanText = (inputText || '').replace(EMOJI_REGEX, '').trim();
    if (!cleanText) return;

    onSendMessage({
      id: `msg-${Date.now()}`,
      sender: 'me',
      type: 'text',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    });

    onLog?.(`[CHAT] Sent message to ${activeChat.name}: "${cleanText.substring(0, 30)}"`);
    setInputText('');
  };

  const handleVotePoll = (msgId, optIdx) => {
    onLog?.(`[POLL] Voted for option #${optIdx + 1} in poll`);
  };

  const handleAddReaction = (msgId, label) => {
    onLog?.(`[REACTION] Reacted with [${label}] to message ${msgId}`);
    setReactionAnchorId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#101a24] relative overflow-hidden select-none">
      {/* 1. Top Bar */}
      <div className="h-16 px-4 bg-[#111b21] border-b border-white/5 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0 cursor-pointer">
            <img
              src={activeChat.avatar || '/favicons/icon-192.png'}
              alt={activeChat.name}
              className="w-10 h-10 rounded-full object-cover bg-black"
            />
            {activeChat.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00FF88] border-2 border-[#111b21]"></span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
              {activeChat.name}
              {activeChat.id === 'nexchat-system' && (
                <span className="text-[10px] bg-[#00FF88]/20 text-[#00FF88] px-1.5 py-0.5 rounded font-mono">
                  VERIFIED E2E
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#00FF88] font-mono truncate">
              {activeChat.lastSeen || (activeChat.isOnline ? 'Online' : 'Encrypted')}
            </p>
          </div>
        </div>

        {/* Top Right Action Icons: Strictly Video Call, Voice Call, and 3-dots menu */}
        <div className="flex items-center gap-1 text-white/70">
          <button 
            onClick={() => {
              onLog?.(`[VIDEOCALL] Triggered video mesh with ${activeChat.name}`);
              onStartVideoCall(activeChat.name);
            }}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-[#00FF88] transition-colors"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          <button 
            onClick={() => {
              onLog?.(`[CALL] Triggered voice call with ${activeChat.name}`);
              onStartVoiceCall(activeChat.name);
            }}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-[#00FF88] transition-colors"
            title="Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button 
            onClick={() => onLog?.('[CHAT] More options clicked')}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            title="Menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Message Chip Preview Bar (Small text preview, NOT duplicate audio player) */}
      {pinnedPreview && (
        <div className="bg-[#182229] border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs text-[#00FF88] z-10">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 text-[#00FF88] flex-shrink-0" />
            <span className="font-mono text-[11px] text-white/70">Pinned:</span>
            <span className="truncate text-white/90">{pinnedPreview.text || `[Media: Voice Note ${pinnedPreview.duration || ''}]`}</span>
          </div>
          <button 
            onClick={() => setPinnedPreview(null)}
            className="p-1 text-white/50 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Messages Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,255,136,0.05) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        />

        <div className="flex justify-center my-3 relative z-10">
          <div className="bg-[#182229]/90 border border-[#00FF88]/20 rounded-lg px-3.5 py-1.5 text-xs text-[#00FF88] font-mono text-center max-w-md shadow-md flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Messages and calls are end-to-end encrypted. No one outside of this chat, not even NEXCHAT, can read or listen to them.</span>
          </div>
        </div>

        {/* Deduplicated Messages Feed: Keyed by msg.id to prevent duplicate React renders */}
        {(() => {
          let lastDatePill = null;
          return deduplicatedMessages.map((msg) => {
            const isMe = msg.sender === 'me';
            const msgId = msg.id || msg.clientMsgId || msg.docId || msg.timestamp;
            const dateStr = msg.date || (msg.timestamp?.includes('/') ? msg.timestamp.split(' ')[0] : '29 October 2026');
            const showPill = dateStr && dateStr !== lastDatePill;
            if (showPill) lastDatePill = dateStr;

            return (
              <React.Fragment key={msgId}>
                {showPill && (
                  <div className="flex justify-center my-2 relative z-10">
                    <span className="nex-date-separator-pill bg-[#182229] border border-white/10 rounded-full px-3 py-1 text-[11px] text-white/70 font-sans shadow">
                      {dateStr}
                    </span>
                  </div>
                )}
                <div
                  ref={(el) => {
                    if (el) messageElementsRef.current.set(msgId, el);
                  }}
                  className={`flex flex-col group relative z-10 ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-md relative transition-transform duration-100 ${
                  isMe
                    ? 'bg-[#005c4b] text-white rounded-tr-xs'
                    : 'bg-[#202c33] text-white rounded-tl-xs'
                }`}
              >
                {/* WhatsApp-structure Sender Row: 1 line, Left: ~ Name + Badge, Right: Phone or username */}
                {activeChat.isGroup && !isMe && (
                  <div className="flex items-center justify-between gap-2 mb-1 text-[11.5px] font-semibold leading-none">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[#00FF88] truncate font-bold">~ {msg.author || msg.senderName || 'Operative'}</span>
                      {msg.role && (
                        <span className="text-[9px] bg-white/10 text-white/80 px-1 py-0.5 rounded font-mono uppercase flex-shrink-0">
                          {msg.role}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/40 font-mono flex-shrink-0 w-[110px] text-right truncate">
                      {msg.phone || msg.handle || '+234 704 893 9620'}
                    </span>
                  </div>
                )}

                {/* Text Messages */}
                {msg.type === 'text' && (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {renderFormattedText(msg.text)}
                  </div>
                )}

                {/* Code Messages */}
                {msg.type === 'code' && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#00FF88] pb-1 border-b border-white/10 mb-1.5">
                      <span>{'// Code Snippet'}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard?.writeText(msg.code);
                          onLog?.('[SYSTEM] Copied code snippet to clipboard');
                        }}
                        className="hover:underline text-[10px]"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="bg-[#0a0f16] text-[#00FF88] p-3 rounded-lg font-mono text-xs overflow-x-auto border border-[#00FF88]/30">
                      <code>{msg.code}</code>
                    </pre>
                  </div>
                )}

                {/* Voice Messages: Render Unified VoiceNotePlayer (EXACTLY ONE player per message) */}
                {msg.type === 'voice' && (
                  <VoiceNotePlayer
                    msg={msg}
                    isMe={isMe}
                    onLog={onLog}
                    onDelete={(id) => triggerDeleteWithAshFade(id, false)}
                  />
                )}

                {/* Poll Messages */}
                {msg.type === 'poll' && (
                  <div className="min-w-[240px] pt-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white mb-2">
                      <BarChart2 className="w-4 h-4 text-[#00FF88]" />
                      <span>{msg.question}</span>
                    </div>
                    <div className="space-y-2">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleVotePoll(msgId, i)}
                          className="w-full text-left bg-black/30 hover:bg-black/50 p-2.5 rounded-lg border border-white/10 transition-all text-xs"
                        >
                          <div className="flex justify-between font-medium mb-1">
                            <span>{opt.text}</span>
                            <span className="font-mono text-[#00FF88]">{opt.votes} votes</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#00FF88] rounded-full" 
                              style={{ width: `${Math.min(100, opt.votes * 25)}%` }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Messages */}
                {msg.type === 'file' && (
                  <div className="flex items-center gap-3 bg-black/30 p-2.5 rounded-lg border border-white/10 min-w-[220px]">
                    <div className="w-10 h-10 rounded-lg bg-[#00FF88]/20 border border-[#00FF88]/40 flex items-center justify-center text-xl text-[#00FF88]">
                      <FileText className="w-5 h-5 text-[#00FF88]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{msg.fileName}</p>
                      <p className="text-[10px] text-white/50 font-mono">{msg.fileSize} · GZ Archive</p>
                    </div>
                    <button 
                      onClick={() => onLog?.(`[FILE] Downloaded ${msg.fileName}`)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                      title="Download File"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Timestamp & Status Checkmarks */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-white/50 font-mono">
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline" />
                  )}
                </div>

                {/* Hanging Reactions at bottom-left outside bubble */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="absolute -bottom-2.5 left-2 bg-[#202c33] border border-white/10 rounded-full px-1.5 py-0.5 text-xs shadow-md flex items-center gap-1 z-10">
                    {msg.reactions.map((r, i) => (
                      <span key={i}>{r}</span>
                    ))}
                  </div>
                )}

                {/* Floating Quick Action Row on Hover */}
                <div className="absolute -top-3.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-20">
                  <button
                    type="button"
                    onClick={() => setReactionAnchorId(reactionAnchorId === msgId ? null : msgId)}
                    className="bg-[#202c33] border border-white/20 p-1 rounded-full text-xs hover:border-[#00FF88] shadow-md flex items-center justify-center"
                    title="React"
                  >
                    <Smile className="w-3.5 h-3.5 text-gray-300" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMenuId(activeMenuId === msgId ? null : msgId)}
                    className="bg-[#202c33] border border-white/20 p-1 rounded-full text-xs hover:border-red-400 shadow-md flex items-center justify-center text-white/60 hover:text-red-400 transition-colors"
                    title="Message Options & Delete"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Message Dropdown Menu: Fast Ash-Fade Delete Options */}
                {activeMenuId === msgId && (
                  <div className="absolute right-0 top-6 bg-[#1a1a1a] border border-white/20 rounded-xl p-1.5 shadow-2xl z-30 min-w-[160px] text-xs font-sans">
                    <button
                      type="button"
                      onClick={() => triggerDeleteWithAshFade(msgId, false)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Delete for me</span>
                    </button>
                    {isMe && (
                      <button
                        type="button"
                        onClick={() => triggerDeleteWithAshFade(msgId, true)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete for everyone</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setPinnedPreview(msg);
                        setActiveMenuId(null);
                        onLog?.(`[PIN] Pinned message ${msgId}`);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-[#00FF88] flex items-center gap-2 transition-colors border-t border-white/10 mt-1 pt-1"
                    >
                      <Pin className="w-3.5 h-3.5 text-[#00FF88]" />
                      <span>Pin preview</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Reaction Popover */}
              {reactionAnchorId === msgId && (
                <div className="bg-[#202c33] border border-white/20 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-2 mt-1 z-20">
                  <button onClick={() => handleAddReaction(msgId, 'Like')} className="hover:scale-125 transition-transform p-1">
                    <ThumbsUp className="w-4 h-4 text-blue-400" />
                  </button>
                  <button onClick={() => handleAddReaction(msgId, 'Heart')} className="hover:scale-125 transition-transform p-1">
                    <Heart className="w-4 h-4 text-purple-500 fill-purple-500" />
                  </button>
                  <button onClick={() => handleAddReaction(msgId, 'Flame')} className="hover:scale-125 transition-transform p-1">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  </button>
                  <button onClick={() => handleAddReaction(msgId, 'Smile')} className="hover:scale-125 transition-transform p-1">
                    <Smile className="w-4 h-4 text-yellow-400" />
                  </button>
                </div>
              )}
            </div>
          </React.Fragment>
          );
        });
      })()}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Attachment Popup Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-12 bg-[#202c33] border border-white/10 rounded-2xl p-3 shadow-2xl grid grid-cols-3 gap-3 z-30">
          {[
            { icon: <Camera className="w-5 h-5 text-[#00FF88]" />, label: 'Camera', action: () => onLog?.('[ATTACH] Camera activated') },
            { icon: <ImageIcon className="w-5 h-5 text-[#00FF88]" />, label: 'Gallery', action: () => onLog?.('[ATTACH] Image gallery opened') },
            { icon: <FileText className="w-5 h-5 text-[#00FF88]" />, label: 'Document', action: () => onLog?.('[ATTACH] Document picker opened') },
            { icon: <BarChart2 className="w-5 h-5 text-[#00FF88]" />, label: 'Poll', action: () => onLog?.('[ATTACH] Poll creator opened') },
            { icon: <User className="w-5 h-5 text-[#00FF88]" />, label: 'Contact', action: () => onLog?.('[ATTACH] Contact shared') },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.action();
                setShowAttachMenu(false);
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all text-center"
            >
              <span className="w-10 h-10 rounded-full bg-[#111b21] flex items-center justify-center text-xl shadow-md border border-white/5">
                {item.icon}
              </span>
              <span className="text-[11px] text-white/80 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 4. Bottom Input Bar with Strict PTT Hold-to-Record Mic */}
      <form onSubmit={handleSend} className="h-16 px-4 bg-[#111b21] border-t border-white/5 flex items-center gap-3 z-10 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            onLog?.('[ACTION] Stamping quick reaction');
          }}
          className="p-2 text-white/60 hover:text-white transition-colors"
          title="Reaction"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className={`p-2 transition-colors ${
            showAttachMenu ? 'text-[#00FF88]' : 'text-white/60 hover:text-white'
          }`}
          title="Attach"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* If Recording: Display Hold-to-Record Audio Wave Pulse & Elapsed Timer */}
        {isRecording ? (
          <div className="flex-1 bg-[#1a262e] border border-[#00FF88]/40 rounded-lg px-4 py-2 flex items-center justify-between text-sm animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-white font-mono font-bold text-xs tracking-wide">RECORDING VOICE NOTE...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60 font-mono">Hold to talk, release to send</span>
              <span className="text-xs bg-red-500/20 text-red-400 font-mono px-2 py-0.5 rounded border border-red-500/30">
                0:{recordingElapsed < 10 ? '0' : ''}{recordingElapsed}
              </span>
            </div>
          </div>
        ) : (
          <input
            type="text"
            value={inputText}
            inputMode="text"
            autoFocus={false}
            onChange={(e) => setInputText(e.target.value.replace(EMOJI_REGEX, ''))}
            placeholder="Type a message (supports *bold*, _italic_, ~strike~, ```code```)"
            className="flex-1 bg-[#2a3942] text-white text-sm px-4 py-2.5 rounded-lg border-none outline-none placeholder-white/40 focus:ring-1 focus:ring-[#00FF88]/50 font-sans"
          />
        )}

        {inputText.trim() ? (
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#00FF88] text-black font-bold flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-[#00a884]/30"
            title="Send"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        ) : (
          /* Push-To-Talk Mic Button:
             - Starts ONLY on active user gesture: onMouseDown or onTouchStart
             - Stops on onMouseUp, onMouseLeave, onTouchEnd
             - Discards recordings < 2s duration
          */
          <button
            type="button"
            onMouseDown={handleMicPressStart}
            onMouseUp={handleMicPressEnd}
            onMouseLeave={handleMicPressEnd}
            onTouchStart={handleMicPressStart}
            onTouchEnd={handleMicPressEnd}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 select-none ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-110 ring-4 ring-red-500/30'
                : 'bg-white/10 hover:bg-[#00FF88] hover:text-black text-white/80'
            }`}
            title="Hold to Record Voice Note (release to send, <2s discarded)"
          >
            <Mic className={`w-5 h-5 ${isRecording ? 'animate-bounce text-white' : ''}`} />
          </button>
        )}
      </form>
    </div>
  );
}
