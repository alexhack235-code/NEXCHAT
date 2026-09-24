import React, { useState, useRef, useEffect } from 'react';

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

    // Replace bold, italic, strikethrough in inline text
    let formatted = part;
    const tokens = [];
    let cur = 0;

    // Regex for *bold*, _italic_, ~strike~
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

export default function CenterChat({
  activeChat,
  onSendMessage,
  onStartVoiceCall,
  onStartVideoCall,
  onLog
}) {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeVoicePlaying, setActiveVoicePlaying] = useState(null);
  const [reactionAnchorId, setReactionAnchorId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  if (!activeChat) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#101a24] text-white/60 p-6 select-none">
        <div className="w-20 h-20 rounded-full bg-[#111b21] border border-[#00FF88]/30 flex items-center justify-center text-4xl mb-4 shadow-xl shadow-[#00FF88]/10 animate-pulse">
          ⚡
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
    if (!inputText.trim()) return;

    onSendMessage({
      id: `msg-${Date.now()}`,
      sender: 'me',
      type: 'text',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    });

    onLog?.(`[CHAT] Sent message to ${activeChat.name}: "${inputText.substring(0, 30)}"`);
    setInputText('');
  };

  const handleVotePoll = (msgId, optIdx) => {
    onLog?.(`[POLL] Voted for option #${optIdx + 1} in poll`);
  };

  const handleAddReaction = (msgId, emoji) => {
    onLog?.(`[REACTION] Reacted with ${emoji} to message ${msgId}`);
    setReactionAnchorId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#101a24] relative overflow-hidden select-none">
      {/* 1. Top Bar (Avatar, Name, Online/Last Seen, Search, Voice Call, Video Call, More) */}
      <div className="h-16 px-4 bg-[#111b21] border-b border-white/5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0 cursor-pointer">
            <img
              src={activeChat.avatar}
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

        {/* Top Right Action Icons */}
        <div className="flex items-center gap-1 text-white/70">
          <button 
            onClick={() => onLog?.('[CHAT] Search in conversation')}
            className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            title="Search conversation"
          >
            🔍
          </button>

          {/* Voice Call Button (1:1 with user's calling screen) */}
          <button 
            onClick={() => {
              onLog?.(`[CALL] Triggered voice call with ${activeChat.name}`);
              onStartVoiceCall(activeChat.name);
            }}
            className="p-2 rounded-full hover:bg-white/10 hover:text-[#00FF88] transition-colors"
            title="Voice Call"
          >
            📞
          </button>

          {/* Video Call Button */}
          <button 
            onClick={() => {
              onLog?.(`[VIDEOCALL] Triggered video mesh with ${activeChat.name}`);
              onStartVideoCall(activeChat.name);
            }}
            className="p-2 rounded-full hover:bg-white/10 hover:text-[#00FF88] transition-colors"
            title="Video Call"
          >
            📹
          </button>

          <button 
            onClick={() => onLog?.('[CHAT] More options clicked')}
            className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors text-lg"
            title="More"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* 2. Chat Area: Encrypted Doodle Background + Faint Terminal Code Pattern */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {/* Layer 1: Encrypted doodle vector background pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,255,136,0.05) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        />

        {/* Layer 2: Faint scrolling terminal code background */}
        <div className="absolute inset-0 pointer-events-none opacity-5 font-mono text-[10px] text-[#00FF88] overflow-hidden leading-relaxed p-4 select-none">
          {`01001110 01000101 01011000 01000011 01001000 01000001 01010100
AES-GCM-256 QUANTUM KEY EXCHANGE ESTABLISHED
NEX_SOCKET_RELAY: PORT 443 -> PEER [OK]
ZERO_KNOWLEDGE_PROTOCOL: VERIFIED SHA-512
nex@NEXCHAT:~$ ping relay.nexchat.terminal -c 4
64 bytes from 10.0.0.1: icmp_seq=1 ttl=64 time=0.214 ms
[SYSTEM_AUDIT] BUFFER INTEGRITY: 100% SECURE`.repeat(8)}
        </div>

        {/* System E2E Security Badge */}
        <div className="flex justify-center my-3 relative z-10">
          <div className="bg-[#182229]/90 border border-[#00FF88]/20 rounded-lg px-3.5 py-1.5 text-xs text-[#00FF88] font-mono text-center max-w-md shadow-md">
            🔒 Messages and calls are end-to-end encrypted. No one outside of this chat, not even NEXCHAT, can read or listen to them.
          </div>
        </div>

        {/* Messages Feed */}
        {activeChat.messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <div
              key={msg.id}
              className={`flex flex-col group relative z-10 ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble Container */}
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-md relative transition-transform duration-100 ${
                  isMe
                    ? 'bg-[#005c4b] text-white rounded-tr-xs'
                    : 'bg-[#202c33] text-white rounded-tl-xs'
                }`}
              >
                {/* Author for groups */}
                {activeChat.isGroup && !isMe && msg.author && (
                  <div className="text-[11px] font-bold text-[#00FF88] mb-0.5">
                    {msg.author}
                  </div>
                )}

                {/* A. TEXT MESSAGE WITH RICH FORMATTING (*bold*, _italic_, ~strike~, ```code```) */}
                {msg.type === 'text' && (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {renderFormattedText(msg.text)}
                  </div>
                )}

                {/* B. CODE BLOCK MESSAGE WITH SYNTAX HIGHLIGHT */}
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

                {/* C. VOICE NOTE WITH NEON GREEN WAVEFORM */}
                {msg.type === 'voice' && (
                  <div className="flex items-center gap-3 py-1 min-w-[200px]">
                    <button
                      onClick={() => {
                        const next = activeVoicePlaying === msg.id ? null : msg.id;
                        setActiveVoicePlaying(next);
                        onLog?.(`[AUDIO] Voice note ${next ? 'playing' : 'paused'} (${msg.duration})`);
                      }}
                      className="w-10 h-10 rounded-full bg-[#00FF88] text-black font-bold flex items-center justify-center flex-shrink-0 shadow-md"
                    >
                      {activeVoicePlaying === msg.id ? '⏸' : '▶'}
                    </button>

                    <div className="flex-1">
                      {/* Neon Waveform Bars */}
                      <div className="flex items-center gap-0.5 h-6">
                        {[12, 20, 16, 24, 18, 14, 22, 26, 12, 18, 24, 16, 20, 14, 22].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              activeVoicePlaying === msg.id
                                ? 'bg-[#00FF88] animate-pulse'
                                : 'bg-white/40'
                            }`}
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-white/50 font-mono mt-1">
                        <span>{msg.duration}</span>
                        <span>🎤 PTT</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* D. POLL MESSAGE WITH SELECTABLE VOTES */}
                {msg.type === 'poll' && (
                  <div className="min-w-[240px] pt-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white mb-2">
                      <span>📊</span>
                      <span>{msg.question}</span>
                    </div>
                    <div className="space-y-2">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleVotePoll(msg.id, i)}
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

                {/* E. FILE ATTACHMENT MESSAGE */}
                {msg.type === 'file' && (
                  <div className="flex items-center gap-3 bg-black/30 p-2.5 rounded-lg border border-white/10 min-w-[220px]">
                    <div className="w-10 h-10 rounded-lg bg-[#00FF88]/20 border border-[#00FF88]/40 flex items-center justify-center text-xl text-[#00FF88]">
                      📄
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
                      ⬇
                    </button>
                  </div>
                )}

                {/* Timestamp and Double Blue Ticks */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-white/50 font-mono">
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <span className="text-[#53bdeb] text-xs">✓✓</span>
                  )}
                </div>

                {/* Hover Message Actions / Quick Reaction Bar */}
                <button
                  onClick={() => setReactionAnchorId(reactionAnchorId === msg.id ? null : msg.id)}
                  className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#202c33] border border-white/20 px-2 py-0.5 rounded-full text-xs hover:border-[#00FF88] shadow-md"
                  title="React"
                >
                  😀+
                </button>
              </div>

              {/* Reaction Picker Popover */}
              {reactionAnchorId === msg.id && (
                <div className="bg-[#202c33] border border-white/20 rounded-full px-3 py-1 shadow-2xl flex items-center gap-2 mt-1 z-20 animate-in fade-in zoom-in-95">
                  {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'].map((em) => (
                    <button
                      key={em}
                      onClick={() => handleAddReaction(msg.id, em)}
                      className="hover:scale-125 transition-transform text-base p-1"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Attachment Popup Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-12 bg-[#202c33] border border-white/10 rounded-2xl p-3 shadow-2xl grid grid-cols-3 gap-3 z-30 animate-in fade-in slide-in-from-bottom-2">
          {[
            { icon: '📸', label: 'Camera', action: () => onLog?.('[ATTACH] Camera activated') },
            { icon: '🖼️', label: 'Gallery', action: () => onLog?.('[ATTACH] Image gallery opened') },
            { icon: '📄', label: 'Document', action: () => onLog?.('[ATTACH] Document picker opened') },
            { icon: '📊', label: 'Poll', action: () => onLog?.('[ATTACH] Poll creator opened') },
            { icon: '👤', label: 'Contact', action: () => onLog?.('[ATTACH] Contact shared') },
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

      {/* 4. Bottom Input Bar (Emoji, Attach, Input, Mic / Send) */}
      <form onSubmit={handleSend} className="h-16 px-4 bg-[#111b21] border-t border-white/5 flex items-center gap-3 z-10">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            onLog?.('[EMOJI] Emoji drawer toggled');
          }}
          className="p-2 text-white/60 hover:text-white text-xl transition-colors"
          title="Emoji"
        >
          😊
        </button>

        {/* Attach Button */}
        <button
          type="button"
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className={`p-2 text-xl transition-colors ${
            showAttachMenu ? 'text-[#00FF88]' : 'text-white/60 hover:text-white'
          }`}
          title="Attach"
        >
          📎
        </button>

        {/* Text Input with Rich Formatting Support */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message (supports *bold*, _italic_, ~strike~, ```code```)"
          className="flex-1 bg-[#2a3942] text-white text-sm px-4 py-2.5 rounded-lg border-none outline-none placeholder-white/40 focus:ring-1 focus:ring-[#00FF88]/50 font-sans"
        />

        {/* Send or Mic Button */}
        {inputText.trim() ? (
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#00FF88] text-black font-bold flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-[#00a884]/30"
            title="Send"
          >
            ➤
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onLog?.('[VOICE] Recorded 5s push-to-talk voice note')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#00FF88] hover:text-black text-white/80 flex items-center justify-center transition-all active:scale-95"
            title="Record Voice Note"
          >
            🎤
          </button>
        )}
      </form>
    </div>
  );
}
