import React, { useState, useEffect } from 'react';
import LeftSidebar from '../components/LeftSidebar.jsx';
import CenterChat from '../components/CenterChat.jsx';
import TerminalPanel from '../components/TerminalPanel.jsx';
import TextStatusModal from '../components/modals/TextStatusModal.jsx';
import PhotoStatusModal from '../components/modals/PhotoStatusModal.jsx';
import VoiceCallModal from '../components/modals/VoiceCallModal.jsx';
import VideoCallModal from '../components/modals/VideoCallModal.jsx';
import { getStoredChats, saveStoredChats, getStoredTheme, setStoredTheme } from '../lib/storage.js';

export default function NexchatAppPage() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('nexchat-system');
  const [logs, setLogs] = useState([]);
  const [theme, setTheme] = useState('hacker');

  // Modals state
  const [isTextStatusOpen, setIsTextStatusOpen] = useState(false);
  const [textStatusInitial, setTextStatusInitial] = useState('');
  const [isPhotoStatusOpen, setIsPhotoStatusOpen] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [voiceCallTarget, setVoiceCallTarget] = useState('+1 (218) 296-1795');
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [videoCallTarget, setVideoCallTarget] = useState('Alex Vance');

  // Load from localStorage on mount
  useEffect(() => {
    const loadedChats = getStoredChats();
    setChats(loadedChats);
    if (loadedChats.length > 0 && !activeChatId) {
      setActiveChatId(loadedChats[0].id);
    }
    const savedTheme = getStoredTheme();
    setTheme(savedTheme);
  }, []);

  // Save to localStorage when chats change
  const handleUpdateChats = (newChats) => {
    setChats(newChats);
    saveStoredChats(newChats);
  };

  // Log dispatch to terminal
  const addLog = (message, type = 'info') => {
    const entry = {
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setLogs((prev) => [...prev.slice(-30), entry]);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // Send message handler
  const handleSendMessage = (newMsg) => {
    if (!activeChatId) return;
    const updatedChats = chats.map((chat) => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMsg],
          unreadCount: 0,
        };
      }
      return chat;
    });
    handleUpdateChats(updatedChats);
  };

  // Toggle chat status (pin, mute, etc.)
  const handleUpdateChatStatus = (chatId, action) => {
    const updatedChats = chats.map((c) => {
      if (c.id === chatId) {
        if (action === 'pin') return { ...c, isPinned: !c.isPinned };
        if (action === 'mute') return { ...c, isMuted: !c.isMuted };
      }
      return c;
    });
    handleUpdateChats(updatedChats);
    addLog(`[SYSTEM] Toggled ${action} on ${chatId}`);
  };

  // Switch Theme
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setStoredTheme(newTheme);
    addLog(`[THEME] Switched theme mode to: ${newTheme}`);
  };

  return (
    <div className={`w-screen h-screen flex flex-col bg-[#0a0e13] text-white overflow-hidden font-sans ${theme}`}>
      {/* 3-Panel Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row w-full h-full overflow-hidden">
        {/* Panel 1: Left Sidebar (30% width) */}
        <div className="w-full md:w-[30%] lg:w-[30%] h-[40vh] md:h-full flex-shrink-0">
          <LeftSidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              setActiveChatId(id);
              // Clear unread count on open
              const updated = chats.map((c) => c.id === id ? { ...c, unreadCount: 0 } : c);
              handleUpdateChats(updated);
            }}
            onOpenTextStatus={() => setIsTextStatusOpen(true)}
            onOpenPhotoStatus={() => setIsPhotoStatusOpen(true)}
            onLog={addLog}
          />
        </div>

        {/* Panel 2: Center Chat (40% width) */}
        <div className="w-full md:w-[40%] lg:w-[40%] h-[60vh] md:h-full flex-shrink-0">
          <CenterChat
            activeChat={activeChat}
            onSendMessage={handleSendMessage}
            onStartVoiceCall={(target) => {
              setVoiceCallTarget(target || "+1 (218) 296-1795");
              setIsVoiceCallOpen(true);
            }}
            onStartVideoCall={(target) => {
              setVideoCallTarget(target || "Alex Vance");
              setIsVideoCallOpen(true);
            }}
            onLog={addLog}
          />
        </div>

        {/* Panel 3: Right Terminal Panel (30% width - THE MAIN TWIST) */}
        <div className="w-full md:w-[30%] lg:w-[30%] h-[35vh] md:h-full flex-shrink-0">
          <TerminalPanel
            chats={chats}
            activeChat={activeChat}
            onSelectChat={(id) => {
              setActiveChatId(id);
              const updated = chats.map((c) => c.id === id ? { ...c, unreadCount: 0 } : c);
              handleUpdateChats(updated);
            }}
            onSendMessage={handleSendMessage}
            onStartVoiceCall={(target) => {
              setVoiceCallTarget(target);
              setIsVoiceCallOpen(true);
            }}
            onStartVideoCall={(target) => {
              setVideoCallTarget(target);
              setIsVideoCallOpen(true);
            }}
            onOpenTextStatus={(text) => {
              setTextStatusInitial(text);
              setIsTextStatusOpen(true);
            }}
            onOpenPhotoStatus={() => setIsPhotoStatusOpen(true)}
            onUpdateChatStatus={handleUpdateChatStatus}
            logs={logs}
            onThemeChange={handleThemeChange}
          />
        </div>
      </div>

      {/* ─── 1:1 CLONED MODALS ─── */}
      {/* 1. WhatsApp Text Status Creator 1:1 */}
      <TextStatusModal
        isOpen={isTextStatusOpen}
        onClose={() => setIsTextStatusOpen(false)}
        initialText={textStatusInitial}
        onLog={addLog}
      />

      {/* 2. WhatsApp Photo Status Editor with B&W Chandelier 1:1 */}
      <PhotoStatusModal
        isOpen={isPhotoStatusOpen}
        onClose={() => setIsPhotoStatusOpen(false)}
        onLog={addLog}
      />

      {/* 3. WhatsApp 1:1 Voice Calling Screen (+1 (218) 296-1795) 1:1 */}
      <VoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        phoneNumber="+1 (218) 296-1795"
        contactName={voiceCallTarget}
        onLog={addLog}
      />

      {/* 4. Video Call Grid Modal */}
      <VideoCallModal
        isOpen={isVideoCallOpen}
        onClose={() => setIsVideoCallOpen(false)}
        contactName={videoCallTarget}
        onLog={addLog}
      />
    </div>
  );
}
