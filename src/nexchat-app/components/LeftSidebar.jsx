import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  MoreVertical, 
  Search, 
  X, 
  CheckCheck, 
  Mic, 
  BarChart2, 
  FileText, 
  VolumeX, 
  Pin 
} from 'lucide-react';

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
      {/* 1. Header Toolbar */}
      <div className="h-16 px-4 bg-[#111b21] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer group" onClick={onOpenPhotoStatus}>
            <img
              src="/favicons/icon-192.png"
              alt="My Avatar"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00FF88]/40 group-hover:ring-[#00FF88] transition-all"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FF88] rounded-full border-2 border-[#111b21]"></span>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider font-display text-white">NEX_OPERATIVE</h2>
            <span className="text-[10px] text-[#00FF88] font-mono tracking-widest uppercase">ONLINE</span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-white/70">
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
            <Users className="w-4 h-4" />
          </button>

          {/* New Chat icon */}
          <button 
            onClick={() => onLog?.('[CHAT] Initiated New Chat session')}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            title="New Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* 3-Dots Menu */}
          <button 
            onClick={() => onLog?.('[MENU] Opened Options Dropdown')}
            className="p-2.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            title="Menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="p-3 bg-[#111b21]">
        <div className="flex items-center gap-2 bg-[#202c33] rounded-lg px-3 py-1.5 border border-white/5 focus-within:border-[#00FF88]/50 transition-colors">
          <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
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
              className="text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'groups', label: 'Groups' },
            { id: 'logs', label: 'Terminal Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#00a884] text-black font-semibold'
                  : 'bg-[#202c33] text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat List Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {filteredChats.map((chat) => {
          const isActive = chat.id === activeChatId;
          const lastMsg = chat.messages[chat.messages.length - 1];

          return (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={chat.avatar || '/favicons/icon-192.png'}
                  alt={chat.name}
                  className="w-12 h-12 rounded-full object-cover bg-black"
                />
                {chat.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00FF88] border-2 border-[#111b21]"></span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1">
                    {chat.name}
                    {chat.id === 'nexchat-system' && (
                      <span className="text-[10px] text-[#00FF88] font-mono">SYS</span>
                    )}
                  </h3>
                  <span className={`text-[11px] font-mono ${chat.unreadCount > 0 ? 'text-[#00FF88] font-bold' : 'text-white/40'}`}>
                    {lastMsg?.timestamp || '10:00 AM'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-1 truncate pr-2">
                    {lastMsg?.sender === 'me' && (
                      <CheckCheck className="w-3 h-3 text-[#53bdeb] inline" />
                    )}
                    {lastMsg?.type === 'voice' && <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Voice note</span>}
                    {lastMsg?.type === 'poll' && <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Poll</span>}
                    {lastMsg?.type === 'file' && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {lastMsg.fileName}</span>}
                    {lastMsg?.type === 'code' && <span className="font-mono text-[#00FF88]">{'</>'} Code block</span>}
                    {lastMsg?.type === 'text' && <span className="truncate">{lastMsg.text}</span>}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {chat.isMuted && <VolumeX className="w-3 h-3 text-white/30" />}
                    {chat.isPinned && <Pin className="w-3 h-3 text-white/40" />}
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
