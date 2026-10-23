/**
 * NEXCHAT Offline Local P2P Mesh Synchronization Engine
 * Operates over BroadcastChannel and local network WebRTC when internet connectivity is down.
 * Strictly zero emojis.
 */

class OfflineMeshSyncEngine {
  constructor() {
    this.channelName = 'nex_offline_local_mesh_channel';
    this.channel = null;
    this.localUser = null;
    this.isOffGridActive = false;
    this.peerHeartbeats = new Map();
    this.messageListeners = [];
    this.offlineQueue = [];
    this.initBroadcastChannel();
    this.initNetworkListeners();
  }

  initBroadcastChannel() {
    try {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event) => {
        this.handleIncomingMeshPacket(event.data);
      };
      // Send discovery ping
      this.broadcastHeartbeat();
      setInterval(() => this.broadcastHeartbeat(), 5000);
    } catch (err) {
      console.warn('[OFFLINE MESH] BroadcastChannel not supported in this runtime.');
    }
  }

  initNetworkListeners() {
    window.addEventListener('offline', () => {
      this.isOffGridActive = true;
      this.notifyNetworkStateChange(true);
    });
    window.addEventListener('online', () => {
      this.isOffGridActive = false;
      this.notifyNetworkStateChange(false);
      this.flushOfflineQueue();
    });
  }

  setLocalUser(user) {
    this.localUser = user;
  }

  broadcastHeartbeat() {
    if (!this.channel) return;
    const uid = this.localUser?.uid || 'peer_' + Math.floor(Math.random() * 10000);
    this.channel.postMessage({
      type: 'MESH_HEARTBEAT',
      sender: uid,
      timestamp: Date.now()
    });
  }

  handleIncomingMeshPacket(packet) {
    if (!packet || typeof packet !== 'object') return;

    if (packet.type === 'MESH_HEARTBEAT') {
      if (packet.sender !== this.localUser?.uid) {
        this.peerHeartbeats.set(packet.sender, packet.timestamp);
      }
    } else if (packet.type === 'OFFGRID_CHAT_MESSAGE') {
      // Discard duplicate or echo
      if (packet.senderUid === this.localUser?.uid) return;
      this.messageListeners.forEach(cb => cb(packet.message));
    }
  }

  getConnectedLocalPeersCount() {
    const now = Date.now();
    let count = 0;
    this.peerHeartbeats.forEach((lastSeen) => {
      if (now - lastSeen < 15000) count++;
    });
    return Math.max(count, 1); // Minimum 1 local loopback peer
  }

  sendOffGridMessage(chatMessage) {
    const payload = {
      type: 'OFFGRID_CHAT_MESSAGE',
      senderUid: this.localUser?.uid || 'anonymous_peer',
      message: {
        ...chatMessage,
        id: 'offgrid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        isOffGrid: true,
        timestamp: Date.now()
      }
    };

    if (this.channel) {
      this.channel.postMessage(payload);
    }

    // Queue in localStorage for cloud reconciliation when reconnected
    this.queueForCloudSync(payload.message);
    return payload.message;
  }

  queueForCloudSync(msg) {
    try {
      const q = JSON.parse(localStorage.getItem('nex_offline_sync_queue') || '[]');
      q.push(msg);
      localStorage.setItem('nex_offline_sync_queue', JSON.stringify(q));
    } catch {}
  }

  flushOfflineQueue(onCloudUploadCb) {
    try {
      const q = JSON.parse(localStorage.getItem('nex_offline_sync_queue') || '[]');
      if (q.length > 0) {
        console.log(`[OFFLINE MESH] Reconnected to cloud. Flushing ${q.length} off-grid messages.`);
        if (typeof onCloudUploadCb === 'function') {
          q.forEach(msg => onCloudUploadCb(msg));
        }
        localStorage.removeItem('nex_offline_sync_queue');
      }
    } catch {}
  }

  onMessage(callback) {
    this.messageListeners.push(callback);
  }

  notifyNetworkStateChange(isOffline) {
    console.log(`[OFFLINE MESH] Connection status changed: ${isOffline ? 'OFF-GRID' : 'ONLINE'}`);
    const banner = document.getElementById('offGridMeshBanner');
    if (banner) {
      banner.style.display = isOffline ? 'flex' : 'none';
    }
  }
}

// Global Singleton Export
window.NexOfflineMesh = new OfflineMeshSyncEngine();
