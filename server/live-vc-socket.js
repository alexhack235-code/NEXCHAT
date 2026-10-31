/**
 * NEXCHAT - ChronEX Live VC Socket.IO Relay Server
 * Module: server/live-vc-socket.js
 * 
 * Flow:
 * 1. Client emits 'join-live-vc' with speakLang and hearLang.
 * 2. Client speaks -> emits 'voice-chunk' with raw transcript in speakLang.
 * 3. Server relays translation -> emits 'translated-voice' to peers in their individual hearLang.
 * 4. WebRTC peer signaling for low-latency P2P audio streaming.
 * 
 * STRICT COMPLIANCE:
 * - Strictly 0 Unicode emojis (FontAwesome 6 glyphs or text only).
 * - Pure Windows CRLF line endings.
 */

const https = require('https');

// Room State: roomId -> Map<socketId, participantData>
const liveVcRooms = new Map();

/**
 * Fast server-side translation helper via GTX endpoint (sub-150ms)
 */
async function translateText(text, targetLang) {
  if (!text || !targetLang || targetLang === 'en') return text;
  return new Promise((resolve) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
            const translated = parsed[0].map(item => item[0]).filter(Boolean).join('').trim();
            if (translated) return resolve(translated);
          }
        } catch (_) {}
        resolve(text);
      });
    }).on('error', () => {
      resolve(text);
    });
  });
}

function registerLiveVcSocketHandlers(io) {
  if (!io) return;

  io.on('connection', (socket) => {
    console.log(`[ChronEX Live VC] Peer connected: ${socket.id}`);

    // 1. Join Live VC Room
    socket.on('join-live-vc', ({ roomId, uid, username, avatar, speakLang = 'en', hearLang = 'en' }) => {
      if (!roomId) return;

      socket.join(roomId);

      if (!liveVcRooms.has(roomId)) {
        liveVcRooms.set(roomId, new Map());
      }

      const roomMap = liveVcRooms.get(roomId);
      const participant = {
        socketId: socket.id,
        uid: uid || socket.id,
        username: username || 'User',
        avatar: avatar || 'logo.jpg',
        speakLang,
        hearLang,
        isSpeaking: false,
        joinedAt: Date.now()
      };

      roomMap.set(socket.id, participant);

      // Broadcast updated participant roster to room
      const participantsList = Array.from(roomMap.values());
      io.to(roomId).emit('live-vc-roster', {
        roomId,
        participants: participantsList
      });

      console.log(`[ChronEX Live VC] User ${participant.username} (${participant.speakLang}->${participant.hearLang}) joined room ${roomId}`);
    });

    // 2. Client Speaks: Receives 'voice-chunk' -> Relays 'translated-voice'
    socket.on('voice-chunk', async (data) => {
      const { roomId, text, speakLang } = data || {};
      if (!roomId || !text) return;

      const roomMap = liveVcRooms.get(roomId);
      if (!roomMap) return;

      const sender = roomMap.get(socket.id) || { username: 'Speaker', uid: socket.id, speakLang: speakLang || 'en' };

      // Broadcast speaking status to show visualizer ring
      socket.to(roomId).emit('peer-speaking-state', {
        uid: sender.uid,
        socketId: socket.id,
        isSpeaking: true
      });

      // Deliver translated voice / subtitles to each peer based on their unique hearLang
      for (const [peerSocketId, peer] of roomMap.entries()) {
        if (peerSocketId === socket.id) continue;

        let translated = text;
        const targetLang = peer.hearLang || 'en';

        if (sender.speakLang !== targetLang) {
          translated = await translateText(text, targetLang);
        }

        io.to(peerSocketId).emit('translated-voice', {
          senderId: sender.uid,
          senderName: sender.username,
          originalText: text,
          speakLang: sender.speakLang || speakLang || 'en',
          targetLang,
          translatedText: translated,
          timestamp: Date.now()
        });
      }

      setTimeout(() => {
        socket.to(roomId).emit('peer-speaking-state', {
          uid: sender.uid,
          socketId: socket.id,
          isSpeaking: false
        });
      }, 1500);
    });

    // 3. WebRTC Direct P2P Signaling (Offer, Answer, ICE Candidate)
    socket.on('webrtc-signal', ({ roomId, targetSocketId, signalData }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-signal', {
          fromSocketId: socket.id,
          signalData
        });
      } else if (roomId) {
        socket.to(roomId).emit('webrtc-signal', {
          fromSocketId: socket.id,
          signalData
        });
      }
    });

    // 4. Update Language Preferences
    socket.on('update-live-vc-lang', ({ roomId, speakLang, hearLang }) => {
      const roomMap = liveVcRooms.get(roomId);
      if (roomMap && roomMap.has(socket.id)) {
        const participant = roomMap.get(socket.id);
        if (speakLang) participant.speakLang = speakLang;
        if (hearLang) participant.hearLang = hearLang;
        io.to(roomId).emit('live-vc-roster', {
          roomId,
          participants: Array.from(roomMap.values())
        });
      }
    });

    // 5. Leave Room
    const handleLeave = () => {
      for (const [roomId, roomMap] of liveVcRooms.entries()) {
        if (roomMap.has(socket.id)) {
          const leavingUser = roomMap.get(socket.id);
          roomMap.delete(socket.id);

          io.to(roomId).emit('live-vc-roster', {
            roomId,
            participants: Array.from(roomMap.values())
          });

          io.to(roomId).emit('peer-left-vc', {
            uid: leavingUser?.uid,
            socketId: socket.id
          });

          if (roomMap.size === 0) {
            liveVcRooms.delete(roomId);
          }
          break;
        }
      }
    };

    socket.on('leave-live-vc', handleLeave);
    socket.on('disconnect', handleLeave);
  });
}

module.exports = { registerLiveVcSocketHandlers, liveVcRooms };
