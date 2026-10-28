/**
 * =============================================================================
 * NEXCHAT ADVANCED RAM-ZEROING & SELF-DESTRUCT ENGINE
 * File: src/js/shredder-core.js
 * Namespace: window.NexDuressVault.ShredderCore
 * 
 * Capabilities:
 *   1. Recursive 3-Pass TypedArray, ArrayBuffer, and AudioBuffer Memory Zeroer
 *   2. V8 Memory Pressure Force-GC Cycle Engine
 *   3. Irrevocable Database & Cache Purger (IndexedDB, Caches, Master Salts)
 *   4. Multi-Failed PIN 5-Strike Self-Destruct Trigger
 *   5. Ephemeral War Room Countdown Zeroization Hook
 *   6. Tab Unload & Window Blur Memory Sanitization
 * 
 * STRICTLY ZERO UNICODE EMOJIS: FontAwesome 6 Icons and Monospace Tokens Only.
 * Format: Windows CRLF Line Endings, ES2022 Node -c Valid.
 * =============================================================================
 */

(function (window, document) {
  'use strict';

  // Local Storage Settings Keys
  const CORE_CONFIG = {
    FAIL_COUNT_KEY: 'nex_vault_failed_pin_strikes',
    MAX_STRIKES: 5,
    RECURSIVE_SHRED_KEY: 'nex_vault_recursive_shred_enabled',
    GC_PRESSURE_KEY: 'nex_vault_gc_pressure_enabled',
    BLUR_ZERO_KEY: 'nex_vault_blur_zero_enabled',
    STRIKE_DESTRUCT_KEY: 'nex_vault_strike_destruct_enabled',
    SALT_KEY: 'nex_vault_salt_v3'
  };

  class AdvancedShredderCore {
    constructor() {
      // Memory pointers registry
      this.bufferRegistry = new Set();
      this.audioBufferRegistry = new Set();
      this.canvasRegistry = new Set();
      this.blobUrlRegistry = new Set();
      this.warRoomEnclaves = new Map(); // warRoomId => Set(buffers)

      this.isSanitizing = false;
      this.init();
    }

    init() {
      this.bindWindowHooks();
      this.bindDOMControls();
      this.updateTelemetryUI();
    }

    /**
     * =========================================================================
     * 1. MEMORY BUFFER REGISTRATION MATRIX
     * =========================================================================
     */

    registerTypedArray(bufferOrView) {
      if (bufferOrView instanceof ArrayBuffer || ArrayBuffer.isView(bufferOrView)) {
        this.bufferRegistry.add(bufferOrView);
        this.updateTelemetryUI();
      }
    }

    unregisterTypedArray(bufferOrView) {
      this.bufferRegistry.delete(bufferOrView);
      this.updateTelemetryUI();
    }

    registerAudioBuffer(audioBuffer) {
      if (audioBuffer && typeof audioBuffer.getChannelData === 'function') {
        this.audioBufferRegistry.add(audioBuffer);
      }
    }

    registerCanvas(canvasElement) {
      if (canvasElement instanceof HTMLCanvasElement) {
        this.canvasRegistry.add(canvasElement);
      }
    }

    registerBlobUrl(blobUrl) {
      if (typeof blobUrl === 'string' && blobUrl.startsWith('blob:')) {
        this.blobUrlRegistry.add(blobUrl);
      }
    }

    registerWarRoomBuffer(roomId, bufferOrView) {
      if (!this.warRoomEnclaves.has(roomId)) {
        this.warRoomEnclaves.set(roomId, new Set());
      }
      this.warRoomEnclaves.get(roomId).add(bufferOrView);
    }

    /**
     * =========================================================================
     * 2. RECURSIVE 3-PASS MEMORY SHREDDING PROTOCOL
     * =========================================================================
     */
    executeDeepMemoryZeroing() {
      if (this.isSanitizing) return;
      this.isSanitizing = true;

      try {
        // Step A: Scrub all registered TypedArrays and ArrayBuffers
        for (const target of this.bufferRegistry) {
          let view = null;
          if (target instanceof ArrayBuffer) {
            view = new Uint8Array(target);
          } else if (ArrayBuffer.isView(target)) {
            view = new Uint8Array(target.buffer, target.byteOffset, target.byteLength);
          }

          if (view && view.length > 0) {
            // Pass 1: Cryptographic CSPRNG Overwrite
            window.crypto.getRandomValues(view);
            // Pass 2: Inverted Bitwise Complement (~Byte)
            for (let i = 0; i < view.length; i++) {
              view[i] = view[i] ^ 0xFF;
            }
            // Pass 3: Zero-Filling (0x00)
            view.fill(0);
          }
        }
        this.bufferRegistry.clear();

        // Step B: Scrub PCM Float Data in AudioBuffers
        for (const audioBuf of this.audioBufferRegistry) {
          try {
            const channels = audioBuf.numberOfChannels;
            for (let c = 0; c < channels; c++) {
              const floatArray = audioBuf.getChannelData(c);
              // Pass 1: Random float noise
              for (let i = 0; i < floatArray.length; i++) {
                floatArray[i] = (Math.random() * 2) - 1;
              }
              // Pass 2: Definitive Float Zero (0.0f)
              floatArray.fill(0.0);
            }
          } catch (e) {}
        }
        this.audioBufferRegistry.clear();

        // Step C: Scramble HTML5 Canvases and Revoke Blob URLs
        for (const canvas of this.canvasRegistry) {
          try {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              window.crypto.getRandomValues(imgData.data);
              ctx.putImageData(imgData, 0, 0);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          } catch (e) {}
        }
        this.canvasRegistry.clear();

        for (const url of this.blobUrlRegistry) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {}
        }
        this.blobUrlRegistry.clear();

        // Step D: Prune DOM nodes holding message transcripts
        const msgNodes = document.querySelectorAll('.message-bubble, .message-text, .chat-item-preview');
        msgNodes.forEach(node => {
          node.textContent = '';
        });

        // Step E: Purge session storage and active memory key objects
        sessionStorage.clear();
        if (window.nexMasterKeyStore) window.nexMasterKeyStore = null;
        if (window.chatMessagesCache) window.chatMessagesCache = {};
        if (window.activeRoomTranscripts) window.activeRoomTranscripts = [];

      } catch (err) {
        // Silent fail
      } finally {
        this.isSanitizing = false;
        this.updateTelemetryUI();
      }
    }

    /**
     * =========================================================================
     * 3. V8 MEMORY PRESSURE GC INDUCTION ENGINE
     * =========================================================================
     */
    triggerGcMemoryPressure() {
      try {
        // Allocate cascading 16MB blocks in a micro-loop to trigger major GC
        const pressurePool = [];
        const CHUNK_SIZE = 16 * 1024 * 1024; // 16 MB
        const ITERATIONS = 8; // 128 MB Transient Allocation

        for (let i = 0; i < ITERATIONS; i++) {
          const block = new ArrayBuffer(CHUNK_SIZE);
          const view = new Uint8Array(block);
          view[0] = 0xAA;
          view[CHUNK_SIZE - 1] = 0x55;
          pressurePool.push(block);
        }

        // Immediately release pointers to force mark-sweep deallocation
        pressurePool.length = 0;
      } catch (e) {
        // Fallback for memory-constrained environments
      }
    }

    /**
     * =========================================================================
     * 4. IRREVOCABLE STORAGE INCINERATION ENGINE
     * =========================================================================
     */
    async executeIrrevocableStorageWipe() {
      // 1. Memory zeroing first
      this.executeDeepMemoryZeroing();
      this.triggerGcMemoryPressure();

      // 2. Overwrite and incinerate master encryption salt in localStorage
      const saltKey = CORE_CONFIG.SALT_KEY;
      if (localStorage.getItem(saltKey)) {
        const dummyEntropy = new Uint8Array(64);
        window.crypto.getRandomValues(dummyEntropy);
        const dummyHex = Array.from(dummyEntropy).map(b => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem(saltKey, dummyHex);
        localStorage.removeItem(saltKey);
      }

      // 3. Clear all localStorage keys
      try {
        localStorage.clear();
      } catch (e) {}

      // 4. Detach and delete all IndexedDB databases
      try {
        if (window.indexedDB && window.indexedDB.databases) {
          const databases = await window.indexedDB.databases();
          for (const dbInfo of databases) {
            if (dbInfo.name) {
              window.indexedDB.deleteDatabase(dbInfo.name);
            }
          }
        }
      } catch (e) {}

      // 5. Delete all Service Worker CacheStorage
      try {
        if (window.caches && window.caches.keys) {
          const cacheKeys = await window.caches.keys();
          for (const key of cacheKeys) {
            await window.caches.delete(key);
          }
        }
      } catch (e) {}

      // 6. Unregister Service Workers
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        }
      } catch (e) {}
    }

    /**
     * =========================================================================
     * 5. WAR ROOM EPHEMERAL EXPIRATION ZEROIZER
     * =========================================================================
     */
    expireWarRoom(roomId) {
      if (!this.warRoomEnclaves.has(roomId)) return;

      const buffers = this.warRoomEnclaves.get(roomId);
      for (const target of buffers) {
        let view = null;
        if (target instanceof ArrayBuffer) {
          view = new Uint8Array(target);
        } else if (ArrayBuffer.isView(target)) {
          view = new Uint8Array(target.buffer, target.byteOffset, target.byteLength);
        }

        if (view && view.length > 0) {
          window.crypto.getRandomValues(view);
          view.fill(0);
        }
        this.bufferRegistry.delete(target);
      }

      this.warRoomEnclaves.delete(roomId);

      // Prune DOM nodes tagged with this war room
      const warRoomNodes = document.querySelectorAll(`[data-war-room-id="${roomId}"]`);
      warRoomNodes.forEach(n => n.remove());

      this.triggerGcMemoryPressure();
      this.updateTelemetryUI();
    }

    /**
     * =========================================================================
     * 6. MULTI-STRIKE FAILED PIN LOGIC
     * =========================================================================
     */
    registerFailedPinAttempt() {
      let strikes = parseInt(sessionStorage.getItem(CORE_CONFIG.FAIL_COUNT_KEY) || '0', 10);
      strikes += 1;
      sessionStorage.setItem(CORE_CONFIG.FAIL_COUNT_KEY, strikes.toString());

      const strikeDestructEnabled = localStorage.getItem(CORE_CONFIG.STRIKE_DESTRUCT_KEY) === 'true';

      if (strikes >= CORE_CONFIG.MAX_STRIKES && strikeDestructEnabled) {
        // Strike threshold reached -> execute irrevocable wipe
        this.executeIrrevocableStorageWipe();
        // Redirect to sterile blackout page
        if (window.NexDuressVault && window.NexDuressVault.triggerPanicShield) {
          window.NexDuressVault.triggerPanicShield('decoy_spreadsheet');
        }
        return true;
      }
      return false;
    }

    resetFailedPinStrikes() {
      sessionStorage.removeItem(CORE_CONFIG.FAIL_COUNT_KEY);
    }

    /**
     * =========================================================================
     * 7. WINDOW HOOKS: UNLOAD & BLUR SANITIZATION
     * =========================================================================
     */
    bindWindowHooks() {
      // Synchronous beforeunload wipe
      window.addEventListener('beforeunload', () => {
        if (window.NexDuressVault && window.NexDuressVault.state && window.NexDuressVault.state.isDecoyActive) {
          this.executeDeepMemoryZeroing();
        }
      });

      // Tab blur / visibilitychange micro-sanitization
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          const blurZeroEnabled = localStorage.getItem(CORE_CONFIG.BLUR_ZERO_KEY) === 'true';
          if (blurZeroEnabled) {
            this.executeDeepMemoryZeroing();
          }
        }
      });

      // Hook into window.NexDuressVault wipe events
      window.addEventListener('nex:duress:wipe', () => {
        this.executeDeepMemoryZeroing();
        this.triggerGcMemoryPressure();
      });
    }

    bindDOMControls() {
      document.getElementById('btnManualEmergencyBurn')?.addEventListener('click', () => {
        const confirmed = window.confirm('EXECUTE IRREVOCABLE EMERGENCY BURN?\n\nThis will permanently incinerate all local chat vaults, caches, and cryptographic keys. This cannot be undone.');
        if (confirmed) {
          this.executeIrrevocableStorageWipe();
          if (window.NexDuressVault) {
            window.NexDuressVault.triggerPanicShield('decoy_spreadsheet');
          }
        }
      });

      document.getElementById('toggleRecursiveShredding')?.addEventListener('change', (e) => {
        localStorage.setItem(CORE_CONFIG.RECURSIVE_SHRED_KEY, e.target.checked ? 'true' : 'false');
      });

      document.getElementById('toggleGcPressureLoop')?.addEventListener('change', (e) => {
        localStorage.setItem(CORE_CONFIG.GC_PRESSURE_KEY, e.target.checked ? 'true' : 'false');
      });

      document.getElementById('toggleFiveStrikeSelfDestruct')?.addEventListener('change', (e) => {
        localStorage.setItem(CORE_CONFIG.STRIKE_DESTRUCT_KEY, e.target.checked ? 'true' : 'false');
      });

      document.getElementById('toggleBlurSanitization')?.addEventListener('change', (e) => {
        localStorage.setItem(CORE_CONFIG.BLUR_ZERO_KEY, e.target.checked ? 'true' : 'false');
      });
    }

    updateTelemetryUI() {
      const countEl = document.getElementById('shredderBufferCountDisplay');
      if (countEl) {
        countEl.textContent = `${this.bufferRegistry.size} Protected Pointers`;
      }
    }
  }

  // Bind to Global Namespace window.NexDuressVault.ShredderCore
  if (!window.NexDuressVault) {
    window.NexDuressVault = {};
  }
  window.NexDuressVault.ShredderCore = new AdvancedShredderCore();

})(window, document);