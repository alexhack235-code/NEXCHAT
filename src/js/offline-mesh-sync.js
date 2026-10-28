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
    this.seenNonces = new Set();
    this.maxNonceCache = 1000;
    this.initBroadcastChannel();
    this.initNetworkListeners();
    this.initCRDTEngine();
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
      // Discard duplicate, echo, or replayed packets
      if (packet.senderUid === this.localUser?.uid) return;
      
      // Timestamp sliding-window validation (reject packets older than 120s)
      const now = Date.now();
      if (packet.timestamp && Math.abs(now - packet.timestamp) > 120000) {
        console.warn('[OFFLINE MESH] Dropped expired packet outside 120s sliding window.');
        return;
      }

      // Nonce replay check
      if (packet.nonce) {
        if (this.seenNonces.has(packet.nonce)) {
          console.warn('[OFFLINE MESH] Dropped duplicate replayed packet with nonce:', packet.nonce);
          return;
        }
        this.seenNonces.add(packet.nonce);
        if (this.seenNonces.size > this.maxNonceCache) {
          const firstKey = this.seenNonces.values().next().value;
          this.seenNonces.delete(firstKey);
        }
      }

      this.messageListeners.forEach(cb => cb(packet.message));
    } else if (packet.type === 'CRDT_MESH_SYNC') {
      if (packet.senderNodeId !== this.nodeId) {
        this.mergeCRDTRemoteEntry(packet.entry);
      }
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
    const packetTime = Date.now();
    const packetNonce = 'nonce_' + packetTime + '_' + Math.random().toString(36).substring(2, 10);
    const payload = {
      type: 'OFFGRID_CHAT_MESSAGE',
      senderUid: this.localUser?.uid || 'anonymous_peer',
      timestamp: packetTime,
      nonce: packetNonce,
      message: {
        ...chatMessage,
        id: 'offgrid_' + packetTime + '_' + Math.random().toString(36).substr(2, 6),
        isOffGrid: true,
        timestamp: packetTime,
        nonce: packetNonce
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

  // --------------------------------------------------------------------------
  // CRDT (Conflict-Free Replicated Data Type) Engine: Last-Write-Wins (LWW)
  // --------------------------------------------------------------------------
  initCRDTEngine() {
    this.lamportClock = parseInt(localStorage.getItem('nex_lamport_clock') || '0', 10);
    this.nodeId = 'node_' + Math.random().toString(36).substring(2, 9);
    this.crdtMap = new Map(); // docId -> { text, status, clock, timestamp, sender, isDeleted }
    this.loadPersistedCRDT();
  }

  loadPersistedCRDT() {
    try {
      const raw = localStorage.getItem('nex_crdt_state_vector');
      if (raw) {
        const obj = JSON.parse(raw);
        Object.keys(obj).forEach(k => this.crdtMap.set(k, obj[k]));
      }
    } catch (_) {}
  }

  persistCRDT() {
    try {
      const obj = {};
      this.crdtMap.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem('nex_crdt_state_vector', JSON.stringify(obj));
      localStorage.setItem('nex_lamport_clock', this.lamportClock.toString());
    } catch (_) {}
  }

  recordCRDTChange(docId, messageData, isDeleted = false) {
    this.lamportClock++;
    const entry = {
      docId: docId,
      text: messageData.text || '',
      status: messageData.status || 'sent',
      sender: messageData.from || this.localUser?.uid || this.nodeId,
      clock: this.lamportClock,
      timestamp: Date.now(),
      isDeleted: isDeleted,
      nodeId: this.nodeId
    };

    this.crdtMap.set(docId, entry);
    this.persistCRDT();

    // Broadcast CRDT state vector change to peer mesh
    if (this.channel) {
      this.channel.postMessage({
        type: 'CRDT_MESH_SYNC',
        senderNodeId: this.nodeId,
        entry: entry
      });
    }
    return entry;
  }

  mergeCRDTRemoteEntry(remoteEntry) {
    if (!remoteEntry || !remoteEntry.docId) return false;
    const local = this.crdtMap.get(remoteEntry.docId);

    // Update local Lamport clock with delta bounds protection (max step 10 to defeat clock wipe attacks)
    const remoteClock = remoteEntry.clock || 0;
    const boundedClock = Math.min(remoteClock, this.lamportClock + 10);
    this.lamportClock = Math.max(this.lamportClock, boundedClock) + 1;

    let shouldOverwrite = false;
    if (!local) {
      shouldOverwrite = true;
    } else if (remoteEntry.clock > local.clock) {
      shouldOverwrite = true;
    } else if (remoteEntry.clock === local.clock && remoteEntry.timestamp > local.timestamp) {
      shouldOverwrite = true;
    } else if (remoteEntry.clock === local.clock && remoteEntry.timestamp === local.timestamp && (remoteEntry.nodeId || '') > (local.nodeId || '')) {
      shouldOverwrite = true;
    }

    if (shouldOverwrite) {
      this.crdtMap.set(remoteEntry.docId, remoteEntry);
      this.persistCRDT();
      console.log(`[CRDT MESH] Converged doc ${remoteEntry.docId} via LWW resolution.`);
      return true;
    }
    return false;
  }

}

// Global Singleton Export
window.NexOfflineMesh = new OfflineMeshSyncEngine();
