import React, { useState, useRef, useEffect } from 'react';

const HELP_BANNER = `
╔═════════════════════════════════════════════════════════════════════╗
║                   ⚡ NEXCHAT TERMINAL CORE v4.8 ⚡                  ║
║                  Control your chats directly via CLI                ║
╚═════════════════════════════════════════════════════════════════════╝

Available Commands:
  help                     - Show this command reference
  ls chats                 - List all conversations and online status
  ls unread                - List chats with unread messages
  open <name>              - Open chat by name or ID (e.g. 'open Alex')
  send <message>           - Send text to active conversation
  sendcode <code>          - Send formatted code snippet to active chat
  call <name>              - Launch 1:1 WhatsApp Voice Calling screen
  videocall <name>         - Open encrypted Video Mesh Grid
  status text [your text]  - Open 1:1 WhatsApp Text Status Creator
  status photo             - Open 1:1 Photo Status Editor with B&W filters
  pin <name>               - Toggle pinned status for contact
  mute <name>              - Toggle mute notifications
  archive <name>           - Archive specified chat
  theme <hacker|whatsapp>  - Switch application color theme
  encrypt                  - Execute quantum matrix cipher animation
  clear                    - Wipe terminal buffer
`;

export default function TerminalPanel({
  chats,
  activeChat,
  onSelectChat,
  onSendMessage,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenTextStatus,
  onOpenPhotoStatus,
  onUpdateChatStatus,
  logs = [],
  onThemeChange
}) {
  const [history, setHistory] = useState([
    { type: 'system', text: 'NEXCHAT Terminal OS [Version 4.8.1-quantum]' },
    { type: 'system', text: '(c) 2026 NEXO-TECH. End-to-end encrypted relay connected.' },
    { type: 'system', text: 'Type "help" for a list of interactive chat commands.\n' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isMatrixStreaming, setIsMatrixStreaming] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, logs, isMatrixStreaming]);

  // Command Parser
  const handleCommand = (e) => {
    e.preventDefault();
    const raw = inputValue.trim();
    if (!raw) return;

    // Add to prompt history
    const newEntry = { type: 'input', text: `nex@NEXCHAT:~$ ${raw}` };
    const updated = [...history, newEntry];
    setCmdHistory((prev) => [raw, ...prev]);
    setHistoryIdx(-1);
    setInputValue('');

    const lower = raw.toLowerCase();
    const args = raw.split(' ');
    const cmd = args[0].toLowerCase();
    const targetName = args.slice(1).join(' ').trim();

    if (cmd === 'help') {
      updated.push({ type: 'output', text: HELP_BANNER });
    } 
    else if (cmd === 'clear') {
      setHistory([]);
      return;
    } 
    else if (cmd === 'ls') {
      const sub = args[1]?.toLowerCase();
      if (sub === 'unread') {
        const unread = chats.filter((c) => c.unreadCount > 0);
        if (unread.length === 0) {
          updated.push({ type: 'output', text: '✓ No unread messages in queue.' });
        } else {
          const lines = unread.map((c) => `[UNREAD: ${c.unreadCount}] ${c.name} (id: ${c.id})`);
          updated.push({ type: 'output', text: lines.join('\n') });
        }
      } else {
        const lines = chats.map((c, i) => {
          const status = c.isOnline ? 'ONLINE' : 'OFFLINE';
          const pin = c.isPinned ? '📌' : '  ';
          const unread = c.unreadCount > 0 ? `(${c.unreadCount} unread)` : '';
          return `${(i + 1).toString().padStart(2, ' ')}. [${status.padEnd(7, ' ')}] ${pin} ${c.name.padEnd(24, ' ')} ${unread}`;
        });
        updated.push({ type: 'output', text: `Total Conversations: ${chats.length}\n` + lines.join('\n') });
      }
    } 
    else if (cmd === 'open') {
      if (!targetName) {
        updated.push({ type: 'error', text: 'Usage: open <name>' });
      } else {
        const match = chats.find((c) => c.name.toLowerCase().includes(targetName.toLowerCase()) || c.id === targetName);
        if (match) {
          onSelectChat(match.id);
          updated.push({ type: 'success', text: `✓ Successfully opened chat session: ${match.name}` });
        } else {
          updated.push({ type: 'error', text: `✗ Contact not found: "${targetName}"` });
        }
      }
    } 
    else if (cmd === 'send') {
      const msgText = args.slice(1).join(' ');
      if (!activeChat) {
        updated.push({ type: 'error', text: '✗ No active chat open. Use "open <name>" first.' });
      } else if (!msgText) {
        updated.push({ type: 'error', text: 'Usage: send <message text>' });
      } else {
        onSendMessage({
          id: `msg-${Date.now()}`,
          sender: 'me',
          type: 'text',
          text: msgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        });
        updated.push({ type: 'success', text: `✓ Message dispatched to ${activeChat.name}: "${msgText}"` });
      }
    } 
    else if (cmd === 'sendcode') {
      const codeSnippet = args.slice(1).join(' ');
      if (!activeChat) {
        updated.push({ type: 'error', text: '✗ No active chat open. Use "open <name>" first.' });
      } else {
        onSendMessage({
          id: `msg-${Date.now()}`,
          sender: 'me',
          type: 'code',
          code: codeSnippet || `// NEX Terminal Generated Snippet\nconst cipherKey = 'NEX_${Date.now()}';\nconsole.log('Zero knowledge proof verified.');`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        });
        updated.push({ type: 'success', text: `✓ Code snippet embedded into ${activeChat.name}` });
      }
    } 
    else if (cmd === 'call') {
      const name = targetName || activeChat?.name || "+1 (218) 296-1795";
      onStartVoiceCall(name);
      updated.push({ type: 'success', text: `[WEBRTC] Establishing encrypted voice link with: ${name}` });
    } 
    else if (cmd === 'videocall') {
      const name = targetName || activeChat?.name || "Peer Operative";
      onStartVideoCall(name);
      updated.push({ type: 'success', text: `[WEBRTC-VIDEO] Spawning video mesh room for: ${name}` });
    } 
    else if (cmd === 'status') {
      const sub = args[1]?.toLowerCase();
      if (sub === 'photo') {
        onOpenPhotoStatus();
        updated.push({ type: 'success', text: '✓ Opened 1:1 Photo Status Editor with B&W Chandelier' });
      } else if (sub === 'text') {
        const textPayload = args.slice(2).join(' ') || "Debugging 12k+ lines in chat.js is real 😭💔";
        onOpenTextStatus(textPayload);
        updated.push({ type: 'success', text: `✓ Opened 1:1 Text Status Creator: "${textPayload}"` });
      } else {
        updated.push({ type: 'output', text: 'Usage: status photo | status text <your status>' });
      }
    } 
    else if (cmd === 'pin' || cmd === 'mute') {
      if (!targetName) {
        updated.push({ type: 'error', text: `Usage: ${cmd} <name>` });
      } else {
        const match = chats.find((c) => c.name.toLowerCase().includes(targetName.toLowerCase()));
        if (match) {
          onUpdateChatStatus(match.id, cmd);
          updated.push({ type: 'success', text: `✓ Toggled ${cmd} for ${match.name}` });
        } else {
          updated.push({ type: 'error', text: `✗ Contact not found: "${targetName}"` });
        }
      }
    } 
    else if (cmd === 'encrypt') {
      setIsMatrixStreaming(true);
      updated.push({ type: 'output', text: '[CRYPTO] Generating 4096-bit AES-GCM ephemeral matrix stream...' });
      setTimeout(() => {
        setIsMatrixStreaming(false);
        setHistory((prev) => [
          ...prev,
          { type: 'success', text: '✓ Quantum Key Exchange complete. Peer cipher verified.' }
        ]);
      }, 3500);
    } 
    else if (cmd === 'theme') {
      const t = args[1]?.toLowerCase();
      if (['hacker', 'whatsapp', 'dark'].includes(t)) {
        onThemeChange?.(t);
        updated.push({ type: 'success', text: `✓ Switched theme mode to: ${t}` });
      } else {
        updated.push({ type: 'error', text: 'Usage: theme <hacker | whatsapp | dark>' });
      }
    } 
    else {
      updated.push({ type: 'error', text: `Command not found: "${cmd}". Type "help" for command catalog.` });
    }

    setHistory(updated);
  };

  // Keyboard navigation through command history
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0 && historyIdx < cmdHistory.length - 1) {
        const next = historyIdx + 1;
        setHistoryIdx(next);
        setInputValue(cmdHistory[next]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const next = historyIdx - 1;
        setHistoryIdx(next);
        setInputValue(cmdHistory[next]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputValue('');
      }
    }
  };

  return (
    <div className={`w-full h-full flex flex-col bg-[#0a0e13] border-l border-[#00FF88]/20 font-mono text-xs text-[#00FF88] select-text relative shadow-2xl ${
      isMobileExpanded ? 'fixed inset-x-0 bottom-0 top-16 z-40' : ''
    }`}>
      {/* 1. Terminal Header */}
      <div className="h-12 px-4 bg-[#070b0f] border-b border-[#00FF88]/20 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] inline-block"></span>
          </div>
          <span className="text-[#00FF88] font-bold text-xs tracking-wider">nex@NEXCHAT:~$</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#00FF88]/10 text-[#00FF88] px-2 py-0.5 rounded border border-[#00FF88]/30 font-bold uppercase">
            LIVE SYNC
          </span>
          <button
            onClick={() => setHistory([])}
            className="text-white/40 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-white/10"
            title="Clear buffer"
          >
            clear
          </button>
          {/* Mobile expand toggle */}
          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="md:hidden text-white/60 hover:text-white px-2 py-0.5 rounded"
          >
            {isMobileExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* 2. Terminal Screen Buffer */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0a0e13] leading-relaxed cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Render Buffer History */}
        {history.map((item, idx) => (
          <div key={idx} className="whitespace-pre-wrap break-all">
            {item.type === 'input' && (
              <span className="text-white font-bold">{item.text}</span>
            )}
            {item.type === 'system' && (
              <span className="text-white/60">{item.text}</span>
            )}
            {item.type === 'output' && (
              <span className="text-[#00FF88]">{item.text}</span>
            )}
            {item.type === 'success' && (
              <span className="text-[#00FF88] font-bold">{item.text}</span>
            )}
            {item.type === 'error' && (
              <span className="text-red-400 font-bold">{item.text}</span>
            )}
          </div>
        ))}

        {/* Live UI Activity Stream Logs */}
        {logs.map((log, i) => (
          <div key={`log-${i}`} className="text-[#00D4FF] text-[11px] flex items-center gap-2">
            <span className="text-white/30 text-[10px]">[{log.time}]</span>
            <span className="font-semibold">{log.message}</span>
          </div>
        ))}

        {/* Matrix Streaming Visualizer */}
        {isMatrixStreaming && (
          <div className="py-2 text-[#00FF88] font-mono text-[10px] space-y-0.5 animate-pulse">
            <div>01001110 01000101 01011000 01000011 01001000 01000001 01010100</div>
            <div>[CIPHER] 4096-bit Ephemeral Public Key: 0x9f4a8b1c2e3d4e5f6a7b8c9d0e1f2a3b</div>
            <div>[STATUS] SYMMETRIC RATIO COMPRESSION: ACTIVE</div>
            <div>[RELAY] ENCRYPTING SOCKET BUFFERS: 100% OK</div>
          </div>
        )}

        {/* 3. Interactive Input Line with Blinking Cursor */}
        <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2">
          <span className="text-[#00FF88] font-bold flex-shrink-0">nex@NEXCHAT:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[#00FF88] font-mono text-xs border-none outline-none caret-[#00FF88]"
            autoFocus
            spellCheck="false"
            autoComplete="off"
          />
        </form>
        <div ref={bottomRef} />
      </div>

      {/* Quick Command Bar Footer */}
      <div className="px-3 py-2 bg-[#070b0f] border-t border-[#00FF88]/15 flex items-center gap-1.5 overflow-x-auto text-[10px] no-scrollbar">
        <span className="text-white/40 uppercase tracking-widest text-[9px] mr-1">Quick:</span>
        {['help', 'ls chats', 'ls unread', 'status photo', 'status text', 'call Alex', 'encrypt'].map((cmd) => (
          <button
            key={cmd}
            onClick={() => {
              setInputValue(cmd);
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 bg-[#00FF88]/10 hover:bg-[#00FF88]/20 border border-[#00FF88]/30 rounded text-[#00FF88] whitespace-nowrap active:scale-95 transition-all"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
