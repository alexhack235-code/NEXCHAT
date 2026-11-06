/**
 * =============================================================================
 * NEXCHAT UNIFIED CROSS-DEVICE WEBRTC AIR-DROP RADAR MESH ENGINE (v6.0)
 * Module: src/js/p2p-airdrop-engine.js
 * Namespaces: window.NexMeshSync.AirDrop & window.NexAirDropMesh
 * Architecture: Zero-Cloud LAN Radar • WebRTC DataChannel • SHA-256 Integrity
 * Colorway: Deep Obsidian (#060913) | Cyber-Emerald (#00ff66) | Quantum Cyan (#00f2fe)
 * Strictly ZERO Unicode Emojis (FontAwesome 6 Icon Matrix Only)
 * =============================================================================
 */

(function(global) {
  'use strict';

  // Dynamic Chunking Bounds
  const CHUNK_MIN = 64 * 1024;       // 64 KB
  const CHUNK_DEFAULT = 128 * 1024;   // 128 KB
  const CHUNK_MAX = 256 * 1024;       // 256 KB
  const BACKPRESSURE_LIMIT = 4 * 1024 * 1024; // 4 MB throttle guard

  class NexAirDropEngine {
    constructor() {
      this.nodeId = 'node_' + Math.random().toString(36).substring(2, 9);
      this.localUser = null;
      this.radarChannelName = 'nex_airdrop_radar_channel';
      this.radarChannel = null;
      this.discoveredPeers = new Map(); // peerNodeId -> peer data
      this.selectedPeerId = null;
      this.selectedFile = null;
      this.stagedFile = null;
      this.peerConnections = new Map(); // peerNodeId -> RTCPeerConnection
      this.dataChannels = new Map();    // peerNodeId -> RTCDataChannel
      this.isTransferring = false;
      this.currentTransferStats = { bytesSent: 0, totalBytes: 0, startTime: 0, speedBps: 0 };
      this.currentReceiverContext = null;
      this.incomingOffer = null;
      this.beaconTimer = null;

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
        if (this.beaconTimer) clearInterval(this.beaconTimer);
        this.beaconTimer = setInterval(() => this.broadcastPresenceBeacon(), 3500);
      } catch (err) {
        console.warn('[NEX-AIRDROP] BroadcastChannel unavailable for radar:', err);
      }
    }

    broadcastPresenceBeacon() {
      if (!this.radarChannel) return;
      const uid = this.localUser?.uid || global.myUID || this.nodeId;
      const username = this.localUser?.username || global.myUsername || 'Local_Peer';

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
          global.dispatchEvent(new CustomEvent('nex:mesh:peer_discovered', {
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
        if (!peer.isActiveChat && now - peer.lastSeen > 14000) {
          this.discoveredPeers.delete(key);
          if (this.selectedPeerId === key) this.selectedPeerId = null;
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
    // 2. Active Chat Peer Auto-Detection
    // -------------------------------------------------------------------------
    populateActiveChatPeer() {
      const activeContact = global.currentChatContact || global.activeChatUser || null;
      const activeChatName = global.activeChatTitle || (activeContact ? activeContact.username || activeContact.displayName : null);
      const activeChatId = global.activeChatId || (activeContact ? activeContact.id || activeContact.uid : null);

      if (activeChatId && activeChatName) {
        const virtualNodeId = 'peer_active_' + String(activeChatId).substring(0, 8);
        this.discoveredPeers.set(virtualNodeId, {
          nodeId: virtualNodeId,
          uid: activeChatId,
          username: activeChatName,
          deviceType: 'mobile',
          lastSeen: Date.now() + 600000,
          isActiveChat: true,
          radarPos: { x: 50, y: 18 } // Top 12 o'clock polar position
        });

        if (!this.selectedPeerId) {
          this.selectPeer(virtualNodeId);
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3. WebRTC Peer Connection (Host LAN + STUN Fallback)
    // -------------------------------------------------------------------------
    createPeerConnection(targetNodeId) {
      if (this.peerConnections.has(targetNodeId)) {
        const existingPc = this.peerConnections.get(targetNodeId);
        if (existingPc.signalingState !== 'closed') return existingPc;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
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
    // 4. Sender Pipeline: Dynamic Chunks, Backpressure & SHA-256 Checksums
    // -------------------------------------------------------------------------
    async initiateBeamToNode(targetNodeId) {
      const file = this.selectedFile || this.stagedFile;
      if (!file) {
        if (typeof global.showNotif === 'function') {
          global.showNotif('Please select or drop a file to beam first.', 'warning');
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
        senderUsername: this.localUser?.username || global.myUsername || 'Peer Node',
        meta: {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          lastModified: file.lastModified
        }
      });

      this.showTransferHUD(targetName, file.size);
      if (typeof global.showNotif === 'function') {
        global.showNotif('Beam proposal sent to ' + targetName + '...', 'info', 2500);
      }
    }

    async beginStreamingChunks(targetNodeId, sessionId) {
      const dc = this.dataChannels.get(targetNodeId);
      if (!dc) return;

      const file = this.selectedFile || this.stagedFile;
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
          if (offset >= totalBytes) this.finalizeSenderTransfer(dc, sessionId, file);
          return;
        }

        // Dynamic Sizing based on WebRTC buffer headroom
        let chunkSize = CHUNK_DEFAULT;
        if (dc.bufferedAmount < 1024 * 1024) {
          chunkSize = CHUNK_MAX; // Headroom available: 256KB
        } else if (dc.bufferedAmount > 3 * 1024 * 1024) {
          chunkSize = CHUNK_MIN; // Back off to 64KB
        }

        // Backpressure Guard: Pause stream when queue exceeds threshold
        if (dc.bufferedAmount > BACKPRESSURE_LIMIT) {
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

    async finalizeSenderTransfer(dc, sessionId, file) {
      this.isTransferring = false;
      dc.send(JSON.stringify({ type: 'AIRDROP_STREAM_EOF', sessionId: sessionId }));
      
      const hudProgress = document.getElementById('airdropProgressBar');
      const hudPct = document.getElementById('airdropPercentBadge');
      if (hudProgress) hudProgress.style.width = '100%';
      if (hudPct) hudPct.textContent = '100% COMPLETE';

      // Save sender copy to local air-gap sandbox ($0 cloud bandwidth)
      if (global.NexGallerySandbox && typeof global.NexGallerySandbox.saveMediaItem === 'function') {
        try {
          await global.NexGallerySandbox.saveMediaItem({
            name: file.name,
            type: global.NexGallerySandbox.detectMediaType(file.type, file.name),
            mimeType: file.type,
            blob: file,
            size: file.size,
            chatId: global.activeChatId || 'p2p_airdrop',
            senderName: 'You (P2P Beam)'
          });
        } catch (_) {}
      }

      if (typeof global.showNotif === 'function') {
        global.showNotif('Air-Drop beam of "' + file.name + '" completed!', 'success', 3500);
      }
      if (typeof global.playLuxuryChimeSound === 'function') global.playLuxuryChimeSound();

      setTimeout(() => {
        const hud = document.getElementById('airdropTransferHud');
        if (hud) hud.style.display = 'none';
      }, 3000);
    }

    handleTransferDeclined(signal) {
      this.isTransferring = false;
      const hud = document.getElementById('airdropTransferHud');
      if (hud) hud.style.display = 'none';
      if (typeof global.showNotif === 'function') {
        global.showNotif('Peer declined the Air-Drop transfer.', 'warning');
      }
    }

    // -------------------------------------------------------------------------
    // 5. Receiver Pipeline: Assembly, Verification & Blob Reconstruction
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
          console.warn('[NEX-AIRDROP] Checksum failure on chunk #' + chunkIndex);
        }
      };

      this.currentReceiverContext = {
        senderNodeId,
        setMeta: (meta) => { incomingMeta = meta; }
      };
    }

    handleIncomingTransferOffer(signal) {
      this.incomingOffer = signal;
      const tray = document.getElementById('airdropReceiverTray');
      const senderEl = document.getElementById('airdropIncomingSender');
      const fileEl = document.getElementById('airdropIncomingFileName');
      const sizeEl = document.getElementById('airdropIncomingFileSize');

      if (senderEl) senderEl.textContent = '@' + (signal.senderUsername || signal.senderNodeId);
      if (fileEl) fileEl.textContent = signal.meta.name;
      if (sizeEl) sizeEl.textContent = this.formatBytes(signal.meta.size) + ' • Direct WebRTC';

      if (this.currentReceiverContext) {
        this.currentReceiverContext.setMeta(signal.meta);
      }

      const acceptBtn = document.getElementById('airdropAcceptBtn');
      const declineBtn = document.getElementById('airdropDeclineBtn');

      if (acceptBtn) {
        acceptBtn.disabled = false;
        acceptBtn.innerHTML = '<i class="fa-solid fa-download"></i> Accept & Stream';
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
          this.incomingOffer = null;
        };
      }

      if (tray) tray.style.display = 'block';
      this.openModal();
      if (typeof global.playLuxuryChimeSound === 'function') global.playLuxuryChimeSound();
    }

    async saveReceivedBlob(blob, filename) {
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

      // Automatically quarantine into Air-Gap Gallery Sandbox
      if (global.NexGallerySandbox && typeof global.NexGallerySandbox.saveMediaItem === 'function') {
        try {
          await global.NexGallerySandbox.saveMediaItem({
            name: filename,
            type: global.NexGallerySandbox.detectMediaType(blob.type, filename),
            mimeType: blob.type,
            blob: blob,
            size: blob.size,
            chatId: global.activeChatId || 'p2p_airdrop',
            senderName: this.incomingOffer?.senderUsername || 'AirDrop Peer'
          });
        } catch (_) {}
      }

      if (typeof global.showNotif === 'function') {
        global.showNotif('Received "' + filename + '" via Air-Drop!', 'success', 4000);
      }
      if (typeof global.playLuxuryChimeSound === 'function') global.playLuxuryChimeSound();
      this.incomingOffer = null;
    }

    // -------------------------------------------------------------------------
    // 6. UI Rendering & DOM Synchronizers
    // -------------------------------------------------------------------------
    initDOM() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindUIEvents());
      } else {
        this.bindUIEvents();
      }
    }

    bindUIEvents() {
      const closeBtn = document.getElementById('closeAirDropModalBtn');
      if (closeBtn) closeBtn.onclick = () => this.closeModal();

      const fileInput = document.getElementById('airdropFileInput');
      const stagingClick = document.getElementById('airdropStagingClick');
      const browseBtn = document.getElementById('airdropSelectFileBtn');
      const sendBtn = document.getElementById('airdropSendBtn');
      const dropZone = document.getElementById('airdropRadarStage');
      const stagingBar = document.getElementById('airdropFileStaging');

      const triggerFilePick = () => fileInput && fileInput.click();
      if (stagingClick) stagingClick.onclick = triggerFilePick;
      if (browseBtn) browseBtn.onclick = triggerFilePick;

      if (fileInput) {
        fileInput.onchange = (e) => {
          if (e.target.files && e.target.files.length > 0) {
            this.stageSelectedFile(e.target.files[0]);
          }
        };
      }

      if (sendBtn) {
        sendBtn.onclick = () => this.handleSendBtnClick();
      }

      // Drag and Drop support
      [dropZone, stagingBar].forEach((el) => {
        if (!el) return;
        el.ondragover = (e) => {
          e.preventDefault();
          el.classList.add('drag-active');
        };
        el.ondragleave = () => el.classList.remove('drag-active');
        el.ondrop = (e) => {
          e.preventDefault();
          el.classList.remove('drag-active');
          const file = e.dataTransfer?.files?.[0];
          if (file) this.stageSelectedFile(file);
        };
      });
    }

    handleSendBtnClick() {
      if (!this.selectedFile && !this.stagedFile) {
        if (typeof global.showNotif === 'function') {
          global.showNotif('Please select or drop a file to beam first.', 'warning');
        }
        return;
      }

      if (!this.selectedPeerId) {
        const firstKey = this.discoveredPeers.keys().next().value;
        if (firstKey) {
          this.selectPeer(firstKey);
        } else {
          if (typeof global.showNotif === 'function') {
            global.showNotif('Scanning radar for nearby peers... Tap a blip to beam.', 'info');
          }
          return;
        }
      }

      this.initiateBeamToNode(this.selectedPeerId);
    }

    stageSelectedFile(file) {
      this.selectedFile = file;
      this.stagedFile = file;
      const nameEl = document.getElementById('airdropSelectedFileName');
      const sizeEl = document.getElementById('airdropSelectedFileSize');
      const sendBtn = document.getElementById('airdropSendBtn');

      if (nameEl) nameEl.textContent = file.name;
      if (sizeEl) sizeEl.textContent = this.formatBytes(file.size) + ' • Ready to beam';
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
      }

      if (typeof global.showNotif === 'function') {
        global.showNotif('Staged "' + file.name + '" (' + this.formatBytes(file.size) + '). Tap node on radar to beam.', 'info', 2500);
      }
    }

    selectPeer(peerId) {
      this.selectedPeerId = peerId;
      const peer = this.discoveredPeers.get(peerId);
      const targetLabel = document.getElementById('airdropHudTargetNode');
      if (targetLabel && peer) {
        targetLabel.textContent = peer.username + ' [' + peer.nodeId.substring(0, 8) + ']';
      }
      this.renderRadarBlips();
    }

    renderRadarBlips() {
      const container = document.getElementById('airdropRadarBlipsContainer');
      if (!container) return;

      container.innerHTML = '';
      this.discoveredPeers.forEach((peer, peerId) => {
        const blip = document.createElement('div');
        const isSelected = this.selectedPeerId === peerId;
        const isActiveChat = !!peer.isActiveChat;

        blip.className = 'radar-node-blip' + (isSelected ? ' is-selected' : '') + (isActiveChat ? ' is-active-chat' : '');
        blip.style.left = peer.radarPos.x + '%';
        blip.style.top = peer.radarPos.y + '%';
        blip.title = (isActiveChat ? '[Active Chat] ' : '') + '@' + peer.username + ' (' + peer.deviceType + ') - Tap to select / beam';

        const iconClass = isActiveChat ? 'fa-user-astronaut' : (peer.deviceType === 'mobile' ? 'fa-mobile-screen' : (peer.deviceType === 'tablet' ? 'fa-tablet-screen-button' : 'fa-laptop'));

        blip.innerHTML = 
          '<div class="blip-core"><i class="fa-solid ' + iconClass + '"></i></div>' +
          '<span class="blip-label">' + peer.username + '</span>';

        blip.addEventListener('click', () => {
          this.selectPeer(peerId);
        });

        blip.addEventListener('dblclick', () => {
          this.selectPeer(peerId);
          this.handleSendBtnClick();
        });

        container.appendChild(blip);
      });
    }

    showTransferHUD(targetName, totalBytes) {
      const hud = document.getElementById('airdropTransferHud');
      const targetEl = document.getElementById('airdropHudTargetNode');
      const totalEl = document.getElementById('airdropTotalBytes');

      if (targetEl) targetEl.textContent = targetName;
      if (totalEl) totalEl.textContent = this.formatBytes(totalBytes);
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

      if (bar) bar.style.width = pct + '%';
      if (speedEl) speedEl.textContent = speedMBps + ' MB/s';
      if (transEl) transEl.textContent = this.formatBytes(stats.bytesSent);
      if (pctEl) pctEl.textContent = pct + '%';
      if (etaEl) etaEl.textContent = 'ETA: ' + etaSec + 's';
    }

    updateReceiverTrayProgress(receivedBytes, totalBytes) {
      const pct = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
      const acceptBtn = document.getElementById('airdropAcceptBtn');
      if (acceptBtn) {
        acceptBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Streaming ' + pct + '% (' + this.formatBytes(receivedBytes) + ')';
      }
    }

    formatBytes(bytes) {
      if (!bytes || bytes <= 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    openModal() {
      const modal = document.getElementById('nexAirDropModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
      }
      this.populateActiveChatPeer();
      this.broadcastPresenceBeacon();
      this.renderRadarBlips();
    }

    openRadar() {
      this.openModal();
    }

    openRadarModal() {
      this.openModal();
    }

    closeModal() {
      const modal = document.getElementById('nexAirDropModal');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
      this.isTransferring = false;
    }

    stageFile(file) {
      this.stageSelectedFile(file);
    }

    initiateTransfer() {
      this.handleSendBtnClick();
    }
  }

  // Bind to Global Master Namespaces
  const airdropEngine = new NexAirDropEngine();
  if (!global.NexMeshSync) global.NexMeshSync = {};
  global.NexMeshSync.AirDrop = airdropEngine;
  global.NexAirDropMesh = airdropEngine;

})(typeof window !== 'undefined' ? window : globalThis);
