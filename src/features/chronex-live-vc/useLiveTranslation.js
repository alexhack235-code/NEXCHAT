import { useState, useEffect, useRef, useCallback } from 'react';
import { fastTranslateAsync } from '../../js/fast-translator-core.js';
import { chronexLiveVcDsp } from '../../js/chronex-live-vc-dsp.js';

/**
 * useLiveTranslation Hook for ChronEX Live VC
 * Provides real-time Speech-to-Text (STT), sub-150ms translation,
 * speech synthesis TTS playback in listener's language, and live subtitles.
 * 
 * STRICT COMPLIANCE:
 * - Strictly 0 Unicode emojis (FontAwesome 6 icons only).
 * - Pure Windows CRLF line endings.
 */

export const VC_SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', tag: 'EN', flagIcon: 'fa-earth-americas' },
  { code: 'tr', name: 'Turkish', tag: 'TR', flagIcon: 'fa-moon' },
  { code: 'es', name: 'Spanish', tag: 'ES', flagIcon: 'fa-globe' },
  { code: 'fr', name: 'French', tag: 'FR', flagIcon: 'fa-tower-broadcast' },
  { code: 'de', name: 'German', tag: 'DE', flagIcon: 'fa-shield' },
  { code: 'ar', name: 'Arabic', tag: 'AR', flagIcon: 'fa-landmark' },
  { code: 'yo', name: 'Yoruba', tag: 'YO', flagIcon: 'fa-drum' },
  { code: 'ha', name: 'Hausa', tag: 'HA', flagIcon: 'fa-shield-halved' },
  { code: 'ig', name: 'Igbo', tag: 'IG', flagIcon: 'fa-crown' },
  { code: 'pcm', name: 'Nigerian Pidgin', tag: 'PCM', flagIcon: 'fa-bolt' },
  { code: 'pt', name: 'Portuguese', tag: 'PT', flagIcon: 'fa-compass' },
  { code: 'ru', name: 'Russian', tag: 'RU', flagIcon: 'fa-satellite' },
  { code: 'zh', name: 'Chinese', tag: 'ZH', flagIcon: 'fa-dragon' },
  { code: 'ja', name: 'Japanese', tag: 'JA', flagIcon: 'fa-sun' },
  { code: 'hi', name: 'Hindi', tag: 'HI', flagIcon: 'fa-om' },
  { code: 'it', name: 'Italian', tag: 'IT', flagIcon: 'fa-pizza-slice' },
  { code: 'sw', name: 'Swahili', tag: 'SW', flagIcon: 'fa-mountain' }
];

export function useLiveTranslation({
  roomId = 'default_vc',
  speakLang: initialSpeakLang = 'en',
  hearLang: initialHearLang = 'en',
  isChronexActive = true,
  currentUser = { id: 'me', name: 'User' }
}) {
  const [speakLang, setSpeakLang] = useState(initialSpeakLang);
  const [hearLang, setHearLang] = useState(initialHearLang);
  const [isLiveActive, setIsLiveActive] = useState(isChronexActive);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [subtitles, setSubtitles] = useState(null);
  const [activeSpeakers, setActiveSpeakers] = useState(new Set());
  const [captionsHistory, setCaptionsHistory] = useState([]);

  const recognitionRef = useRef(null);
  const isHoldingMicRef = useRef(false);
  const synthRef = useRef(typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

  // Tactical Acoustic Engine lifecycle (Join / Leave chimes & DSP cleanup)
  useEffect(() => {
    chronexLiveVcDsp.playJoinChime();
    return () => {
      chronexLiveVcDsp.playLeaveChime();
      chronexLiveVcDsp.stopVadMonitoring();
      chronexLiveVcDsp.detachMediaStream();
    };
  }, []);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      console.warn('[LiveVC] Native SpeechRecognition not supported in this browser environment.');
      return;
    }

    try {
      const recognizer = new SpeechClass();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = speakLang === 'pcm' ? 'en-NG' : speakLang;

      recognizer.onstart = () => {
        setIsMicActive(true);
        setActiveSpeakers(prev => new Set(prev).add(currentUser.id));
      };

      recognizer.onend = () => {
        setIsMicActive(false);
        setActiveSpeakers(prev => {
          const next = new Set(prev);
          next.delete(currentUser.id);
          return next;
        });

        // Auto restart if hands-free is enabled
        if (!isPushToTalk && isMicActive) {
          try { recognizer.start(); } catch (_) {}
        }
      };

      recognizer.onresult = async (event) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += trans;
          } else {
            interimChunk += trans;
          }
        }

        const currentText = (finalChunk || interimChunk).trim();
        if (currentText) {
          handleLocalUtterance(currentText, Boolean(finalChunk));
        }
      };

      recognizer.onerror = (e) => {
        if (e.error !== 'no-speech') {
          console.warn('[LiveVC] Speech recognition notice:', e.error);
        }
      };

      recognitionRef.current = recognizer;
    } catch (err) {
      console.warn('[LiveVC] Init SpeechRecognition failed:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, [speakLang, currentUser.id, isPushToTalk]);

  // Handle local speaking utterance
  const handleLocalUtterance = useCallback(async (rawText, isFinal = false) => {
    // Show local subtitle in current speaker's language
    const localCaption = {
      speakerId: currentUser.id,
      speakerName: currentUser.name || 'You',
      originalText: rawText,
      speakLang: speakLang,
      translatedText: rawText,
      hearLang: speakLang,
      timestamp: Date.now()
    };

    setSubtitles(localCaption);

    if (isFinal) {
      setCaptionsHistory(prev => [localCaption, ...prev.slice(0, 20)]);

      // Broadcast utterance to remote peers (via Socket.io or window event)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chronex-live-vc-broadcast', {
          detail: {
            roomId,
            senderId: currentUser.id,
            senderName: currentUser.name || 'User',
            text: rawText,
            speakLang,
            voicePitch: chronexLiveVcDsp.getVoicePitchMultiplier() || 1.0,
            timestamp: Date.now()
          }
        }));
      }
    }
  }, [currentUser, speakLang, roomId]);

  // Handle incoming remote utterance (Translate -> Subtitle -> TTS)
  const receiveRemoteUtterance = useCallback(async ({
    senderId,
    senderName,
    text,
    senderSpeakLang = 'en',
    voicePitch = 1.0
  }) => {
    if (!text || senderId === currentUser.id) return;

    // Play subtle high-frequency shimmer when peer translation is received
    chronexLiveVcDsp.playTranslationReceivedChime();

    setActiveSpeakers(prev => new Set(prev).add(senderId));
    setTimeout(() => {
      setActiveSpeakers(prev => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    }, 2800);

    let translatedOutput = text;

    // Run real-time translation if ChronEX Live is ON and sender language differs from hearLang
    if (isLiveActive && senderSpeakLang !== hearLang) {
      try {
        translatedOutput = await fastTranslateAsync(text, hearLang);
      } catch (_) {
        translatedOutput = text;
      }
    }

    const captionPayload = {
      speakerId: senderId,
      speakerName: senderName || 'Peer',
      originalText: text,
      speakLang: senderSpeakLang,
      translatedText: translatedOutput,
      hearLang: hearLang,
      timestamp: Date.now()
    };

    setSubtitles(captionPayload);
    setCaptionsHistory(prev => [captionPayload, ...prev.slice(0, 20)]);

    // Synthesize translated voice in listener's language (TTS)
    if (synthRef.current && isLiveActive) {
      try {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(translatedOutput);
        utterance.lang = hearLang === 'pcm' ? 'en-NG' : hearLang;
        utterance.pitch = voicePitch || 1.0;
        utterance.rate = 1.05;
        synthRef.current.speak(utterance);
      } catch (synthErr) {
        console.warn('[LiveVC] TTS playback notice:', synthErr);
      }
    }
  }, [currentUser.id, isLiveActive, hearLang]);

  // Listen for broadcast events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e) => {
      const data = e.detail;
      if (data && data.roomId === roomId && data.senderId !== currentUser.id) {
        receiveRemoteUtterance(data);
      }
    };

    window.addEventListener('chronex-live-vc-peer-utterance', handler);
    return () => window.removeEventListener('chronex-live-vc-peer-utterance', handler);
  }, [roomId, currentUser.id, receiveRemoteUtterance]);

  // Push to talk handlers
  const startPushToTalk = useCallback(() => {
    isHoldingMicRef.current = true;
    chronexLiveVcDsp.playPttOnChime();
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (_) {}
    }
  }, []);

  const stopPushToTalk = useCallback(() => {
    isHoldingMicRef.current = false;
    chronexLiveVcDsp.playPttOffChime();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
  }, []);

  const toggleHandsFreeMic = useCallback(() => {
    if (isMicActive) {
      setIsMicActive(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    } else {
      setIsMicActive(true);
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (_) {}
      }
    }
  }, [isMicActive]);

  return {
    speakLang,
    setSpeakLang,
    hearLang,
    setHearLang,
    isLiveActive,
    setIsLiveActive,
    isMicActive,
    isPushToTalk,
    setIsPushToTalk,
    subtitles,
    activeSpeakers,
    captionsHistory,
    startPushToTalk,
    stopPushToTalk,
    toggleHandsFreeMic,
    receiveRemoteUtterance
  };
}

export default useLiveTranslation;
