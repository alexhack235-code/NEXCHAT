import React, { useState } from 'react';

export default function LeftSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onOpenTextStatus,
  onOpenPhotoStatus,
  onLog
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | unread | groups | logs

  const filteredChats = chats.filter((chat) => {
    // Filter type
    if (activeFilter === 'unread' && (!chat.unreadCount || chat.unreadCount === 0)) return false;
    if (activeFilter === 'groups' && !chat.isGroup) return false;
    if (activeFilter === 'logs' && chat.id !== 'nexchat-system') return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesName = chat.name.toLowerCase().includes(q);
    const lastMsg = chat.messages[chat.messages.length - 1];
    const matchesMsg = lastMsg?.text?.toLowerCase().includes(q) || lastMsg?.code?.toLowerCase().includes(q);
    return matchesName || matchesMsg;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#111b21] border-r border-white/10 select-none">
      {/* 1. Header (NEXCHAT_ logo with glitch effect + Action icons) */}
      <div className="h-16 px-4 bg-[#111b21] flex items-center justify-between border-b border-white/5 z-10">
        <div className="flex items-center gap-2">
          {/* Logo with Glitch Effect */}
          <div className="relative group cursor-pointer" onClick={() => onLog?.('[SYSTEM] NEXCHAT Terminal Core v4.8 Active')}>
            <span className="font-display font-black text-xl tracking-wider text-[#00FF88] drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]">
              NEXCHAT<span className="animate-pulse">_</span>
            </span>
            <div className="text-[9px] font-mono text-[#00D4FF] tracking-widest -mt-1 uppercase">
              nexchat.terminal
            </div>
          </div>
        </div>

        {/* Action Icons: Status, Communities, New Chat, Menu */}
        <div className="flex items-center gap-1 text-white/70">
          {/* Status trigger */}
          <button 
            onClick={() => {
              onLog?.('[STATUS] Opened Photo Status Editor');
              onOpenPhotoStatus();
            }}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-[#00FF88] transition-colors relative"
            title="Status / Stories"
          >
            <span className="text-lg">⭕</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00FF88]"></span>
          </button>

          {/* Text Status shortcut */}
          <button 
            onClick={() => {
              onLog?.('[STATUS] Opened Text Status Creator');
              onOpenTextStatus();
            }}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-[#00FF88] transition-colors font-bold text-xs"
            title="Create Text Status"
          >
            Aa
          </button>

          {/* Communities icon */}
          <button 
            onClick={() => onLog?.('[COMMUNITY] Loaded Operative Network')}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            title="Communities"
          >
            👥
          </button>

          {/* New Chat icon */}
          <button 
            onClick={() => onLog?.('[CHAT] Initiated New Chat session')}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            title="New Chat"
          >
            💬
          </button>

          {/* 3-Dots Menu */}
          <button 
            onClick={() => onLog?.('[MENU] Opened Options Dropdown')}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-white transition-colors text-lg"
            title="Menu"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="p-3 bg-[#111b21]">
        <div className="flex items-center gap-2 bg-[#202c33] rounded-lg px-3 py-1.5 border border-white/5 focus-within:border-[#00FF88]/50 transition-colors">
          <span className="text-white/40 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full bg-transparent text-sm text-white placeholder-white/40 border-none outline-none font-sans"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-white/40 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* 3. Filter Pills (All | Unread | Groups | Terminal Logs) */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'groups', label: 'Groups' },
            { id: 'logs', label: 'Terminal Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                onLog?.(`[FILTER] Switched filter to: ${tab.label}`);
              }}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#00a884] text-[#111b21] font-bold shadow-md'
                  : 'bg-[#202c33] text-white/60 hover:text-white hover:bg-[#202c33]/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat List (15 dummy chats with avatar, NEX green ring, timestamps, blue ticks) */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {filteredChats.map((chat) => {
          const isActive = chat.id === activeChatId;
          const lastMsg = chat.messages[chat.messages.length - 1];

          return (
            <div
              key={chat.id}
              onClick={() => {
                onSelectChat(chat.id);
                onLog?.(`[SYSTEM] Opened chat: ${chat.name}`);
              }}
              className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-150 ${
                isActive 
                  ? 'bg-[#2a3942] border-l-4 border-[#00FF88]' 
                  : 'hover:bg-[#202c33]/60'
              }`}
            >
              {/* Avatar with Status Ring */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full p-[2px] ${
                  chat.statusRing ? 'ring-2 ring-[#00FF88] ring-offset-2 ring-offset-[#111b21]' : ''
                }`}>
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-full h-full rounded-full object-cover bg-black"
                  />
                </div>
                {chat.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00FF88] border-2 border-[#111b21]"></span>
                )}
              </div>

              {/* Chat Meta: Name, Last Message, Time, Badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-semibold truncate ${
                    isActive ? 'text-white' : 'text-white/90'
                  }`}>
                    {chat.id === 'nexchat-system' ? (
                      <span className="text-[#00FF88] flex items-center gap-1">
                        {chat.name} <span className="text-[10px] bg-[#00FF88]/20 px-1 rounded text-[#00FF88]">PRO</span>
                      </span>
                    ) : (
                      chat.name
                    )}
                  </h4>
                  <span className={`text-[11px] font-mono whitespace-nowrap ml-2 ${
                    chat.unreadCount > 0 ? 'text-[#00FF88] font-bold' : 'text-white/40'
                  }`}>
                    {lastMsg?.timestamp || '10:00 AM'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-1 truncate pr-2">
                    {lastMsg?.sender === 'me' && (
                      <span className="text-[#53bdeb] text-xs">✓✓</span>
                    )}
                    {lastMsg?.type === 'voice' && <span>🎤 Voice note</span>}
                    {lastMsg?.type === 'poll' && <span>📊 Poll</span>}
                    {lastMsg?.type === 'file' && <span>📄 {lastMsg.fileName}</span>}
                    {lastMsg?.type === 'code' && <span className="font-mono text-[#00FF88]">{'</>'} Code block</span>}
                    {lastMsg?.type === 'text' && <span className="truncate">{lastMsg.text}</span>}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {chat.isMuted && <span className="text-white/30 text-[10px]">🔇</span>}
                    {chat.isPinned && <span className="text-white/40 text-[10px]">📌</span>}
                    {chat.unreadCount > 0 && (
                      <span className="bg-[#00a884] text-[#111b21] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
