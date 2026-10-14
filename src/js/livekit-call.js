/**
 * LiveKit Cloud Call Service for NEXCHAT
 * Replaces complex manual STUN/TURN WebRTC logic with LiveKit Cloud (Free 10,000 mins/month, no credit card).
 * Loaded via ESM CDN for zero-dependency Vite compatibility.
 */

let activeRoom = null;
let localTracks = [];

// Default LiveKit Cloud Configuration (can be overridden via window.LIVEKIT_CONFIG)
const DEFAULT_LIVEKIT_CONFIG = {
  // LiveKit Cloud URL (e.g. wss://nexchat-xxxx.livekit.cloud)
  wsUrl: window.LIVEKIT_CONFIG?.wsUrl || 'wss://demo.livekit.cloud',
};

/**
 * Loads the LiveKit Client SDK dynamically from CDN ESM
 */
async function loadLiveKitSDK() {
  if (window.LivekitClient) {
    return window.LivekitClient;
  }
  try {
    const sdk = await import('https://cdn.jsdelivr.net/npm/livekit-client@2.6.4/+esm');
    window.LivekitClient = sdk;
    return sdk;
  } catch (err) {
    console.warn('Failed to load LiveKit via jsdelivr, trying esm.sh fallback:', err);
    const sdkFallback = await import('https://esm.sh/livekit-client@2.6.4');
    window.LivekitClient = sdkFallback;
    return sdkFallback;
  }
}

/**
 * Joins a LiveKit call room for a given call ID.
 *
 * @param {object} params
 * @param {string} params.callId - The Firestore call document ID
 * @param {string} params.participantName - Current user's display name or UID
 * @param {boolean} [params.isVideo=false] - Whether video is enabled
 * @param {string} [params.token] - LiveKit JWT token (if provided by backend)
 * @param {string} [params.wsUrl] - LiveKit WebSocket URL
 * @param {HTMLVideoElement|HTMLAudioElement} [params.localMediaEl] - Element to attach local camera preview
 * @param {HTMLVideoElement|HTMLAudioElement} [params.remoteMediaEl] - Element to attach incoming remote media
 * @param {function():void} [params.onConnected] - Callback when connected
 * @param {function(string):void} [params.onDisconnected] - Callback when disconnected
 * @returns {Promise<any>} The connected LiveKit Room instance
 */
export async function joinCall({
  callId,
  participantName,
  isVideo = false,
  token = null,
  wsUrl = null,
  localMediaEl = null,
  remoteMediaEl = null,
  onConnected = null,
  onDisconnected = null,
}) {
  if (activeRoom) {
    await leaveCall();
  }

  const { Room, RoomEvent, createLocalTracks, Track } = await loadLiveKitSDK();
  const serverUrl = wsUrl || window.LIVEKIT_CONFIG?.wsUrl || DEFAULT_LIVEKIT_CONFIG.wsUrl;
  
  // Use provided token or generate a sandbox room token
  const roomToken = token || window.LIVEKIT_CONFIG?.token || await generateDevToken(callId, participantName);

  activeRoom = new Room({
    adaptiveStream: true,
    dynacast: true,
    publishDefaults: {
      simulcast: true,
    }
  });

  // Handle incoming remote tracks (audio/video from the other chatter)
  activeRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    console.log(` Remote track subscribed: ${track.kind} from ${participant.identity}`);
    if (remoteMediaEl) {
      track.attach(remoteMediaEl);
    } else {
      const el = track.attach();
      el.id = `remote-${track.kind}-${participant.identity}`;
      document.body.appendChild(el);
    }
  });

  activeRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
    track.detach();
  });

  activeRoom.on(RoomEvent.Disconnected, (reason) => {
    console.log('LiveKit room disconnected:', reason);
    cleanUpLocalTracks();
    activeRoom = null;
    if (onDisconnected) onDisconnected(reason);
  });

  try {
    // 1. Connect to LiveKit Room
    await activeRoom.connect(serverUrl, roomToken);
    console.log(` Connected to LiveKit Room: ${callId}`);

    // 2. Publish local camera & microphone tracks
    localTracks = await createLocalTracks({
      audio: true,
      video: isVideo ? { resolution: { width: 640, height: 480 } } : false,
    });

    for (const track of localTracks) {
      await activeRoom.localParticipant.publishTrack(track);
      if (track.kind === Track.Kind.Video && localMediaEl) {
        track.attach(localMediaEl);
      }
    }

    if (onConnected) onConnected(activeRoom);
    return activeRoom;
  } catch (err) {
    console.error('Failed to connect to LiveKit room:', err);
    cleanUpLocalTracks();
    activeRoom = null;
    throw err;
  }
}

/**
 * Leaves the active LiveKit call and releases all camera/mic tracks
 */
export async function leaveCall() {
  if (activeRoom) {
    try {
      await activeRoom.disconnect();
    } catch (e) {
      console.warn('Error disconnecting room:', e);
    }
    activeRoom = null;
  }
  cleanUpLocalTracks();
}

/**
 * Mute or unmute microphone
 */
export async function toggleMic(enabled) {
  if (!activeRoom) return;
  await activeRoom.localParticipant.setMicrophoneEnabled(enabled);
}

/**
 * Enable or disable camera video
 */
export async function toggleCamera(enabled) {
  if (!activeRoom) return;
  await activeRoom.localParticipant.setCameraEnabled(enabled);
}

function cleanUpLocalTracks() {
  for (const track of localTracks) {
    try {
      track.stop();
      track.detach();
    } catch {}
  }
  localTracks = [];
}

/**
 * Simple sandbox token generator for LiveKit development
 */
async function generateDevToken(roomName, identity) {
  // If backend token endpoint exists, fetch it
  try {
    const res = await fetch(`/api/livekit-token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity || 'user')}`);
    if (res.ok) {
      const data = await res.json();
      if (data.token) return data.token;
    }
  } catch {}

  // Fallback to placeholder token if not configured yet
  return 'sandbox_token_demo';
}
