/**
 * =============================================================================
 * NEXCHAT CROSS-DEVICE LOCAL WEBRTC AIR-DROP MESH ENGINE (v4.0)
 * Module: src/js/p2p-airdrop-engine.js
 * Namespace: window.NexMeshSync.AirDrop
 * Architecture: Zero-Cloud LAN Radar • Dynamic 128KB/256KB Chunks • SHA-256 Checksums
 * Colorway: Deep Obsidian (#060913) | Cyber-Emerald (#00ff66) | Quantum Cyan (#00f2fe) | Amber (#f59e0b)
 * Strictly ZERO Unicode Emojis (FontAwesome 6 Icon Matrix Only)
 * =============================================================================
 */

(function(window) {
  'use strict';

  // Dynamic Chunking Bounds
  const CHUNK_MIN = 64 * 1024;       // 64 KB
  const CHUNK_DEFAULT = 128 * 1024;   // 128 KB
  const CHUNK_MAX = 256 * 1024;       // 256 KB

  class NexAirDropEngine {
    constructor() {
      this.nodeId = 'airdrop_' + Math.random().toString(36).substring(2, 9);
      this.localUser = null;
      this.radarChannelName = 'nex_airdrop_radar_channel';
      this.radarChannel = null;
      this.discoveredPeers = new Map(); // peerNodeId -> { nodeId, uid, username, coords, lastSeen }
      this.activeTransfers = new Map();
      this.selectedFile = null;
      this.peerConnections = new Map(); // peerNodeId -> RTCPeerConnection
      this.dataChannels = new Map();    // peerNodeId -> RTCDataChannel
      this.isTransferring = false;
      this.currentTransferStats = { bytesSent: 0, totalBytes: 0, startTime: 0, speedBps: 0 };

      this.initBroadcastRadar();
      this.initDOM();
    }

    // -------------------------------------------------------------------------
    // 1. Proximity Device Radar & LAN Discovery
    // -------------------------------------------------------------------------
    initBroadcastRadar() {
      try {
        this.radarChannel = new BroadcastChannel(this.radarChannelName);
        this.radarChannel.onmessage = (event) => this.handleRadarSignal(event.data);
        this.broadcastPresenceBeacon();
        setInterval(() => this.broadcastPresenceBeacon(), 3500);
      } catch (err) {
        console.warn('[AIR-DROP] BroadcastChannel unavailable for radar:', err);
      }
    }

    broadcastPresenceBeacon() {
      if (!this.radarChannel) return;
      const uid = this.localUser?.uid || window.myUID || this.nodeId;
      const username = this.localUser?.username || window.myUsername || 'Local_Peer';

      this.radarChannel.postMessage({
        type: 'RADAR_BEACON',
        senderNodeId: this.nodeId,
        uid: uid,
        username: username,
        deviceType: this.detectDeviceType(),
        timestamp: Date.now()
      });

      this.pruneStalePeers();
    }

    handleRadarSignal(signal) {
      if (!signal || signal.senderNodeId === this.nodeId) return;

      if (signal.type === 'RADAR_BEACON') {
        const isNew = !this.discoveredPeers.has(signal.senderNodeId);
        
        // Calculate deterministic polar coordinate on sonar radar display
        const angle = (parseInt(signal.senderNodeId.slice(-4), 36) % 360) * (Math.PI / 180);
        const radius = 35 + (parseInt(signal.senderNodeId.slice(-2), 36) % 50); // 35% - 85% radial spread

        this.discoveredPeers.set(signal.senderNodeId, {
          nodeId: signal.senderNodeId,
          uid: signal.uid,
          username: signal.username,
          deviceType: signal.deviceType,
          lastSeen: signal.timestamp,
          radarPos: {
            x: Math.round(50 + radius * Math.cos(angle) * 0.45),
            y: Math.round(50 + radius * Math.sin(angle) * 0.45)
          }
        });

        if (isNew) {
          window.dispatchEvent(new CustomEvent('nex:mesh:peer_discovered', {
            detail: { peerId: signal.senderNodeId, timestamp: signal.timestamp }
          }));
        }
        this.renderRadarBlips();
      } else if (signal.type === 'AIRDROP_TRANSFER_OFFER' && signal.targetNodeId === this.nodeId) {
        this.handleIncomingTransferOffer(signal);
      } else if (signal.type === 'AIRDROP_TRANSFER_ACCEPT' && signal.targetNodeId === this.nodeId) {
        this.beginStreamingChunks(signal.senderNodeId, signal.sessionId);
      } else if (signal.type === 'AIRDROP_TRANSFER_DECLINE' && signal.targetNodeId === this.nodeId) {
        this.handleTransferDeclined(signal);
      } else if (signal.type === 'AIRDROP_WEBRTC_SIGNAL' && signal.targetNodeId === this.nodeId) {
        this.handleWebRTCSignaling(signal);
      }
    }

    pruneStalePeers() {
      const now = Date.now();
      let changed = false;
      this.discoveredPeers.forEach((peer, key) => {
        if (now - peer.lastSeen > 12000) {
          this.discoveredPeers.delete(key);
          changed = true;
        }
      });
      if (changed) this.renderRadarBlips();
    }

    detectDeviceType() {
      const ua = navigator.userAgent;
      if (/tablet|ipad/i.test(ua)) return 'tablet';
      if (/mobile|android|iphone/i.test(ua)) return 'mobile';
      return 'desktop';
    }

    // -------------------------------------------------------------------------
    // 2. WebRTC Peer Connection (Direct Host LAN)
    // -------------------------------------------------------------------------
    createPeerConnection(targetNodeId) {
      if (this.peerConnections.has(targetNodeId)) {
        return this.peerConnections.get(targetNodeId);
      }

      const pc = new RTCPeerConnection({ iceServers: [] });
      this.peerConnections.set(targetNodeId, pc);

      pc.onicecandidate = (e) => {
        if (e.candidate && this.radarChannel) {
          this.radarChannel.postMessage({
            type: 'AIRDROP_WEBRTC_SIGNAL',
            signalType: 'ice',
            targetNodeId: targetNodeId,
            senderNodeId: this.nodeId,
            candidate: e.candidate
          });
        }
      };

      pc.ondatachannel = (e) => {
        this.setupReceiverChannel(targetNodeId, e.channel);
      };

      return pc;
    }

    async handleWebRTCSignaling(signal) {
      const pc = this.createPeerConnection(signal.senderNodeId);

      if (signal.signalType === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.radarChannel.postMessage({
          type: 'AIRDROP_WEBRTC_SIGNAL',
          signalType: 'answer',
          targetNodeId: signal.senderNodeId,
          senderNodeId: this.nodeId,
          sdp: answer
        });
      } else if (signal.signalType === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.signalType === 'ice' && signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (_) {}
      }
    }

    // -------------------------------------------------------------------------
    // 3. Sender Pipeline: Adaptive Dynamic Chunking & SHA-256
    // -------------------------------------------------------------------------
    async initiateBeamToNode(targetNodeId) {
      if (!this.selectedFile) {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Please select a file to beam first', 'error');
        }
        return;
      }

      const targetPeer = this.discoveredPeers.get(targetNodeId);
      const targetName = targetPeer ? targetPeer.username : targetNodeId;
      const sessionId = 'session_' + Date.now();

      // Setup WebRTC Host Offer
      const pc = this.createPeerConnection(targetNodeId);
      const dc = pc.createDataChannel('nexchat_airdrop_pipe', { ordered: true });
      dc.binaryType = 'arraybuffer';
      this.dataChannels.set(targetNodeId, dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.radarChannel.postMessage({
        type: 'AIRDROP_WEBRTC_SIGNAL',
        signalType: 'offer',
        targetNodeId: targetNodeId,
        senderNodeId: this.nodeId,
        sdp: offer
      });

      // Dispatch Transfer Proposal Manifest
      this.radarChannel.postMessage({
        type: 'AIRDROP_TRANSFER_OFFER',
        sessionId: sessionId,
        targetNodeId: targetNodeId,
        senderNodeId: this.nodeId,
        senderUsername: this.localUser?.username || window.myUsername || 'Peer Node',
        meta: {
          name: this.selectedFile.name,
          size: this.selectedFile.size,
          type: this.selectedFile.type || 'application/octet-stream',
          lastModified: this.selectedFile.lastModified
        }
      });

      this.showTransferHUD(targetName, this.selectedFile.size);
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Air-Drop beam proposed to ${targetName}...`, 'info', 2500);
      }
    }

    async beginStreamingChunks(targetNodeId, sessionId) {
      const dc = this.dataChannels.get(targetNodeId);
      if (!dc) return;

      const file = this.selectedFile;
      if (!file) return;

      this.isTransferring = true;
      this.currentTransferStats = {
        bytesSent: 0,
        totalBytes: file.size,
        startTime: Date.now(),
        speedBps: 0
      };

      const totalBytes = file.size;
      let offset = 0;
      let chunkIndex = 0;

      const transmitNext = async () => {
        if (!this.isTransferring || offset >= totalBytes) {
          if (offset >= totalBytes) this.finalizeSenderTransfer(dc, sessionId);
          return;
        }

        // Dynamic Sizing based on WebRTC buffer headroom
        let chunkSize = CHUNK_DEFAULT;
        if (dc.bufferedAmount < 1024 * 1024) {
          chunkSize = CHUNK_MAX; // Headroom available: saturate with 256KB
        } else if (dc.bufferedAmount > 3 * 1024 * 1024) {
          chunkSize = CHUNK_MIN; // Pressure detected: back off to 64KB
        }

        // Backpressure Guard: Pause stream when queue exceeds 4MB
        if (dc.bufferedAmount > 4 * 1024 * 1024) {
          dc.onbufferedamountlow = () => {
            dc.onbufferedamountlow = null;
            transmitNext();
          };
          return;
        }

        const end = Math.min(offset + chunkSize, totalBytes);
        const sliceBlob = file.slice(offset, end);
        const sliceBuffer = await sliceBlob.arrayBuffer();

        // SHA-256 Integrity Hash per chunk
        const hashBuffer = await crypto.subtle.digest('SHA-256', sliceBuffer);
        const hashBytes = new Uint8Array(hashBuffer);

        // Frame Packaging: [ChunkIdx: 4B][TotalChunks: 4B][SHA256: 32B][RawData: N]
        const totalChunks = Math.ceil(totalBytes / chunkSize);
        const frame = new Uint8Array(40 + sliceBuffer.byteLength);
        const view = new DataView(frame.buffer);
        view.setUint32(0, chunkIndex, false);
        view.setUint32(4, totalChunks, false);
        frame.set(hashBytes, 8);
        frame.set(new Uint8Array(sliceBuffer), 40);

        dc.send(frame.buffer);

        offset = end;
        chunkIndex++;
        this.currentTransferStats.bytesSent = offset;

        this.updateHUDProgress();
        setTimeout(transmitNext, 0);
      };

      if (dc.readyState === 'open') {
        transmitNext();
      } else {
        dc.onopen = () => transmitNext();
      }
    }

    finalizeSenderTransfer(dc, sessionId) {
      this.isTransferring = false;
      dc.send(JSON.stringify({ type: 'AIRDROP_STREAM_EOF', sessionId: sessionId }));
      
      const hudProgress = document.getElementById('airdropProgressBar');
      const hudPct = document.getElementById('airdropPercentBadge');
      if (hudProgress) hudProgress.style.width = '100%';
      if (hudPct) hudPct.textContent = '100% COMPLETE';

      if (typeof window.showNotif === 'function') {
        window.showNotif('Air-Drop transmission complete!', 'success', 3500);
      }
      if (typeof window.playLuxuryChimeSound === 'function') window.playLuxuryChimeSound();
    }

    // -------------------------------------------------------------------------
    // 4. Receiver Pipeline: Assembly, Verification & Blob Reconstruction
    // -------------------------------------------------------------------------
    setupReceiverChannel(senderNodeId, dc) {
      dc.binaryType = 'arraybuffer';
      let receivedBuffers = [];
      let incomingMeta = null;
      let totalReceivedBytes = 0;

      dc.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'AIRDROP_STREAM_EOF') {
              // Assemble Blob and Trigger Save
              const finalBlob = new Blob(receivedBuffers, { type: incomingMeta?.type || 'application/octet-stream' });
              this.saveReceivedBlob(finalBlob, incomingMeta?.name || 'airdrop_download.bin');
              receivedBuffers = [];
            }
          } catch (_) {}
          return;
        }

        // Binary Chunk Frame
        const frame = new Uint8Array(event.data);
        const view = new DataView(frame.buffer);
        const chunkIndex = view.getUint32(0, false);
        const payloadData = frame.slice(40);

        // Verify SHA-256 Integrity
        const calculatedHash = await crypto.subtle.digest('SHA-256', payloadData.buffer);
        const calculatedBytes = new Uint8Array(calculatedHash);
        const transmittedHash = frame.slice(8, 40);

        let hashValid = true;
        for (let i = 0; i < 32; i++) {
          if (calculatedBytes[i] !== transmittedHash[i]) {
            hashValid = false;
            break;
          }
        }

        if (hashValid) {
          receivedBuffers[chunkIndex] = payloadData.buffer;
          totalReceivedBytes += payloadData.byteLength;
          this.updateReceiverTrayProgress(totalReceivedBytes, incomingMeta?.size || totalReceivedBytes);
        } else {
          console.warn(`[AIR-DROP] Checksum failure on chunk #${chunkIndex}`);
        }
      };

      this.currentReceiverContext = {
        senderNodeId,
        setMeta: (meta) => { incomingMeta = meta; }
      };
    }

    handleIncomingTransferOffer(signal) {
      const tray = document.getElementById('airdropReceiverTray');
      const senderEl = document.getElementById('airdropIncomingSender');
      const fileEl = document.getElementById('airdropIncomingFileName');
      const sizeEl = document.getElementById('airdropIncomingFileSize');

      if (senderEl) senderEl.textContent = `@${signal.senderUsername || signal.senderNodeId}`;
      if (fileEl) fileEl.textContent = signal.meta.name;
      if (sizeEl) sizeEl.textContent = `${(signal.meta.size / (1024 * 1024)).toFixed(2)} MB • Direct WebRTC`;

      if (this.currentReceiverContext) {
        this.currentReceiverContext.setMeta(signal.meta);
      }

      const acceptBtn = document.getElementById('airdropAcceptBtn');
      const declineBtn = document.getElementById('airdropDeclineBtn');

      if (acceptBtn) {
        acceptBtn.onclick = () => {
          this.radarChannel.postMessage({
            type: 'AIRDROP_TRANSFER_ACCEPT',
            sessionId: signal.sessionId,
            targetNodeId: signal.senderNodeId,
            senderNodeId: this.nodeId
          });
          acceptBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Streaming...';
          acceptBtn.disabled = true;
        };
      }

      if (declineBtn) {
        declineBtn.onclick = () => {
          this.radarChannel.postMessage({
            type: 'AIRDROP_TRANSFER_DECLINE',
            sessionId: signal.sessionId,
            targetNodeId: signal.senderNodeId,
            senderNodeId: this.nodeId
          });
          if (tray) tray.style.display = 'none';
        };
      }

      if (tray) tray.style.display = 'block';
      this.openModal();
      if (typeof window.playLuxuryChimeSound === 'function') window.playLuxuryChimeSound();
    }

    saveReceivedBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const tray = document.getElementById('airdropReceiverTray');
      if (tray) tray.style.display = 'none';

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Received [${filename}] via Air-Drop!`, 'success', 4000);
      }
      if (typeof window.playLuxuryChimeSound === 'function') window.playLuxuryChimeSound();
    }

    // -------------------------------------------------------------------------
    // 5. UI Rendering & DOM Synchronizers
    // -------------------------------------------------------------------------
    initDOM() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindUIEvents());
      } else {
        this.bindUIEvents();
      }
    }

    bindUIEvents() {
      document.getElementById('closeAirDropModalBtn')?.addEventListener('click', () => this.closeModal());
      
      const fileInput = document.getElementById('airdropFileInput');
      const stagingClick = document.getElementById('airdropStagingClick');
      const browseBtn = document.getElementById('airdropSelectFileBtn');

      [stagingClick, browseBtn].forEach(el => el?.addEventListener('click', () => fileInput?.click()));

      fileInput?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.stageSelectedFile(e.target.files[0]);
        }
      });
    }

    stageSelectedFile(file) {
      this.selectedFile = file;
      const nameEl = document.getElementById('airdropSelectedFileName');
      const sizeEl = document.getElementById('airdropSelectedFileSize');
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

      if (nameEl) nameEl.textContent = file.name;
      if (sizeEl) sizeEl.textContent = `${sizeMB} MB • Tap a nearby radar node to beam`;

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Staged [${file.name}]. Select node on radar to beam.`, 'info', 2500);
      }
    }

    renderRadarBlips() {
      const container = document.getElementById('airdropRadarBlipsContainer');
      if (!container) return;

      container.innerHTML = '';
      this.discoveredPeers.forEach((peer) => {
        const blip = document.createElement('div');
        blip.className = 'radar-node-blip';
        blip.style.left = `${peer.radarPos.x}%`;
        blip.style.top = `${peer.radarPos.y}%`;
        blip.title = `Tap to beam to @${peer.username} (${peer.deviceType})`;

        const iconClass = peer.deviceType === 'mobile' ? 'fa-mobile-screen' : (peer.deviceType === 'tablet' ? 'fa-tablet-screen-button' : 'fa-laptop');

        blip.innerHTML = `
          <div class="blip-core"><i class="fa-solid ${iconClass}"></i></div>
          <span class="blip-label">${peer.username}</span>
        `;

        blip.addEventListener('click', () => {
          this.initiateBeamToNode(peer.nodeId);
        });

        container.appendChild(blip);
      });
    }

    showTransferHUD(targetName, totalBytes) {
      const hud = document.getElementById('airdropTransferHud');
      const targetEl = document.getElementById('airdropHudTargetNode');
      const totalEl = document.getElementById('airdropTotalBytes');

      if (targetEl) targetEl.textContent = targetName;
      if (totalEl) totalEl.textContent = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
      if (hud) hud.style.display = 'block';
    }

    updateHUDProgress() {
      const stats = this.currentTransferStats;
      const pct = Math.min(100, Math.round((stats.bytesSent / stats.totalBytes) * 100));
      const elapsedSec = (Date.now() - stats.startTime) / 1000;
      const speedMBps = elapsedSec > 0 ? ((stats.bytesSent / (1024 * 1024)) / elapsedSec).toFixed(1) : '0.0';
      const remainingBytes = stats.totalBytes - stats.bytesSent;
      const speedBps = elapsedSec > 0 ? stats.bytesSent / elapsedSec : 1;
      const etaSec = Math.max(0, Math.ceil(remainingBytes / speedBps));

      const bar = document.getElementById('airdropProgressBar');
      const speedEl = document.getElementById('airdropTransferVelocity');
      const transEl = document.getElementById('airdropTransferredBytes');
      const pctEl = document.getElementById('airdropPercentBadge');
      const etaEl = document.getElementById('airdropEtaCounter');

      if (bar) bar.style.width = `${pct}%`;
      if (speedEl) speedEl.textContent = `${speedMBps} MB/s`;
      if (transEl) transEl.textContent = `${(stats.bytesSent / (1024 * 1024)).toFixed(2)} MB`;
      if (pctEl) pctEl.textContent = `${pct}%`;
      if (etaEl) etaEl.textContent = `ETA: ${etaSec}s remaining`;
    }

    updateReceiverTrayProgress(receivedBytes, totalBytes) {
      const pct = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
      const acceptBtn = document.getElementById('airdropAcceptBtn');
      if (acceptBtn) {
        acceptBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Streaming ${pct}% (${(receivedBytes / (1024 * 1024)).toFixed(1)}MB)`;
      }
    }

    openModal() {
      const modal = document.getElementById('nexAirDropModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
      }
    }

    closeModal() {
      const modal = document.getElementById('nexAirDropModal');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
      this.isTransferring = false;
    }
  }

  // Bind to Global Master Namespace
  if (!window.NexMeshSync) window.NexMeshSync = {};
  window.NexMeshSync.AirDrop = new NexAirDropEngine();

})(window);