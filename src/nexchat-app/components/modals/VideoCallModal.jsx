import React, { useState } from 'react';

export default function VideoCallModal({ isOpen, onClose, contactName = "Alex Vance", onLog }) {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#070b12] flex flex-col justify-between text-white p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between z-10 bg-black/40 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#00FF88] animate-ping"></span>
          <span className="font-bold text-sm">NEX Encrypted Video Mesh</span>
          <span className="text-xs text-white/50 font-mono">| {contactName}</span>
        </div>
        <button 
          onClick={() => {
            onLog?.(`[VIDEOCALL] Left video room with ${contactName}`);
            onClose();
          }} 
          className="text-white/70 hover:text-white text-lg"
        >
          ✕
        </button>
      </div>

      {/* Video Call Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {/* Remote Participant 1 */}
        <div className="relative bg-[#0c1424] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600" 
            alt="Participant" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF88]"></span>
            <span>{contactName}</span>
          </div>
        </div>

        {/* Local Participant (You) */}
        <div className="relative bg-[#0a0e17] rounded-2xl overflow-hidden border border-[#00FF88]/30 flex items-center justify-center shadow-lg shadow-[#00FF88]/10">
          {isCameraOn ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0c1626] to-[#040810]">
              <div className="w-24 h-24 rounded-full border-2 border-[#00FF88] p-1 mb-3">
                <img src="logo.jpg" alt="You" className="w-full h-full rounded-full object-cover" />
              </div>
              <p className="font-mono text-xs text-[#00FF88]">NEX Operative (You)</p>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="w-1 h-3 bg-[#00FF88] rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/50 font-mono text-sm">
              <span>📷 Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-semibold">
            You (Encrypted)
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-black/60 backdrop-blur-lg border border-white/10 px-6 py-4 rounded-2xl flex items-center justify-center gap-6 max-w-md mx-auto w-full">
        <button 
          onClick={() => {
            setIsCameraOn(!isCameraOn);
            onLog?.(`[VIDEOCALL] Camera toggled ${!isCameraOn ? 'ON' : 'OFF'}`);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
            isCameraOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/80'
          }`}
          title="Toggle Camera"
        >
          {isCameraOn ? '📹' : '🚫'}
        </button>

        <button 
          onClick={() => {
            setIsMuted(!isMuted);
            onLog?.(`[VIDEOCALL] Mic toggled ${!isMuted ? 'MUTED' : 'UNMUTED'}`);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
            isMuted ? 'bg-red-500/80' : 'bg-white/10 hover:bg-white/20'
          }`}
          title="Toggle Mic"
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        <button 
          onClick={() => {
            setIsScreenSharing(!isScreenSharing);
            onLog?.(`[VIDEOCALL] Screen sharing toggled ${!isScreenSharing ? 'ON' : 'OFF'}`);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
            isScreenSharing ? 'bg-[#00FF88] text-black font-bold' : 'bg-white/10 hover:bg-white/20'
          }`}
          title="Share Screen"
        >
          🖥️
        </button>

        <button 
          onClick={() => {
            onLog?.(`[VIDEOCALL] Ended call with ${contactName}`);
            onClose();
          }}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-xl shadow-lg shadow-red-600/30"
          title="End Video Call"
        >
          📞
        </button>
      </div>
    </div>
  );
}
