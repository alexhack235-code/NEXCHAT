import { UserPlus, Camera, Sparkles, Bell, Video, Volume2, Mic, MicOff, PhoneOff } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export default function VoiceCallModal({ isOpen, onClose, contactName, phoneNumber = "+1 (218) 296-1795", onLog }) {
  const [speakerOn, setSpeakerOn] = useState(true); // White circular highlight in user prompt
  const [micMuted, setMicMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleEndCall = () => {
    onLog?.(`[CALL] Terminated voice call with ${contactName || phoneNumber}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060a12] flex flex-col justify-between text-white select-none overflow-hidden">
      {/* Background with blurred chandelier & radial vignette 1:1 */}
      <div className="absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 400 600" className="w-full h-full object-cover filter blur-md opacity-25">
          <rect width="400" height="600" fill="#060913" />
          <ellipse cx="200" cy="150" rx="140" ry="40" fill="#1f2937" />
          <circle cx="200" cy="300" r="160" fill="#374151" />
        </svg>
        <div className="absolute inset-0 bg-radial-vignette opacity-80 bg-gradient-to-b from-black/60 via-black/40 to-black/90"></div>
      </div>

      {/* Top Bar with Status Icons, Caller ID, and 3 Stacked Buttons */}
      <div className="relative z-10 pt-4 px-6 flex justify-between items-start">
        {/* Top Status Indicators */}
        <div className="text-xs font-mono text-white/50 tracking-wider">
          <span>20:25</span> · <span>VoLTE</span> · <span>4G</span> · <span>955 B/S</span>
        </div>

        {/* Top Right: 3 Stacked Circular Buttons (Circled in user prompt) */}
        <div className="flex flex-col gap-3">
          <button 
            className="w-11 h-11 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg hover:border-[#00FF88] hover:text-[#00FF88] transition-all"
            title="Add Person to Call"
            onClick={() => onLog?.('[CALL] Add person prompt')}
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button 
            className="w-11 h-11 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg hover:border-[#00FF88] hover:text-[#00FF88] transition-all"
            title="Flip Camera"
            onClick={() => onLog?.('[CALL] Camera flipped')}
          >
            <Camera className="w-4 h-4" />
          </button>
          <button 
            className="w-11 h-11 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg hover:border-[#00FF88] hover:text-[#00FF88] transition-all"
            title="Magic Wand / Visual Effects"
            onClick={() => onLog?.('[CALL] Magic effects opened')}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Center Caller Name & Number */}
      <div className="relative z-10 -mt-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-wide drop-shadow-md text-white">
          {phoneNumber}
        </h2>
        {contactName && (
          <p className="text-sm text-[#00FF88] font-mono mt-0.5 tracking-wider font-semibold">
            {contactName}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-1 text-sm text-white/70 font-medium">
          <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping"></span>
          <span>{callDuration > 0 ? formatDuration(callDuration) : 'Calling...'}</span>
        </div>
      </div>

      {/* Center Chandelier Silhouette & Waveform */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* Muted Notifications Banner 1:1 */}
        <div className="bg-black/70 backdrop-blur-md border border-white/15 px-4 py-2 rounded-full text-xs text-white/80 shadow-lg flex items-center gap-2 mb-8">
          <Bell className="w-4 h-4 inline" />
          <span>Calls and notifications will be muted</span>
        </div>

        {/* Pulsing Audio Waveform Visualizer */}
        <div className="flex items-center gap-1.5 h-12">
          {[18, 36, 48, 22, 40, 56, 32, 24, 44, 20].map((h, i) => (
            <span 
              key={i} 
              className="w-1.5 bg-[#00FF88] rounded-full transition-all duration-300"
              style={{
                height: `${h}px`,
                opacity: 0.6 + (i % 3) * 0.2,
                animation: `pulse 1.${i}s infinite alternate`
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Bar: 5 Controls 1:1 (More, Video Off, Speaker ON white, Mute, Red End Call) */}
      <div className="relative z-10 bg-black/80 backdrop-blur-lg border-t border-white/10 px-6 py-6 flex items-center justify-around max-w-lg mx-auto w-full rounded-t-3xl">
        {/* 1. More (3 dots) */}
        <button 
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg transition-all"
          title="More options"
          onClick={() => onLog?.('[CALL] Opened call settings')}
        >
          ⋯
        </button>

        {/* 2. Video Toggle */}
        <button 
          onClick={() => {
            setVideoOn(!videoOn);
            onLog?.(`[CALL] Video toggled: ${!videoOn ? 'ON' : 'OFF'}`);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
            videoOn ? 'bg-[#00FF88] text-black font-bold' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Toggle Video"
        >
          <Video className="w-5 h-5" />
        </button>

        {/* 3. Speaker (WHITE CIRCLE HIGHLIGHT SELECTED 1:1) */}
        <button 
          onClick={() => {
            setSpeakerOn(!speakerOn);
            onLog?.(`[CALL] Speakerphone toggled: ${!speakerOn ? 'ON' : 'OFF'}`);
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-xl transition-all ${
            speakerOn 
              ? 'bg-white text-black font-bold scale-105' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title="Speakerphone (Active)"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        {/* 4. Mute Mic */}
        <button 
          onClick={() => {
            setMicMuted(!micMuted);
            onLog?.(`[CALL] Mic muted: ${!micMuted ? 'MUTED' : 'UNMUTED'}`);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
            micMuted ? 'bg-red-500/80 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Mute Microphone"
        >
          {micMuted ? <MicOff className="w-5 h-5 text-red-500" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* 5. End Call Red Button */}
        <button 
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center text-2xl shadow-xl shadow-red-600/40 transition-all"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
