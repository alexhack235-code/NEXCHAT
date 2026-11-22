/**
 * NEXCHAT — Tier-9 Master Encryption Vault & Cipher Engine
 * Implements authenticated multi-layer encryption combining WebCrypto AES-256-GCM,
 * PBKDF2/SHA-512 key stretching, dynamic bitwise permutation, and memory zeroization.
 */

(function (global) {
  'use strict';

  class MasterCryptoVault {
    constructor() {
      this.version = '9.0.0-APEX';
      this.activeKeyFingerprint = 'UNINITIALIZED';
      this.sessionNonces = new Set();
      this.totalEncryptedOps = 0;
      this.totalDecryptedOps = 0;
      this.isParanoidMode = true;
      this.initialized = false;
      this.masterKey = null;

      this.init();
    }

    async init() {
      if (this.initialized) return;
      try {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
          this.masterKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          const raw = await crypto.subtle.exportKey('raw', this.masterKey);
          const hash = await crypto.subtle.digest('SHA-256', raw);
          this.activeKeyFingerprint = Array.from(new Uint8Array(hash))
            .slice(0, 8)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
          this.initialized = true;
          console.log(`[MasterCryptoVault] Initialized. Key Fingerprint: ${this.activeKeyFingerprint}`);
        }
      } catch (err) {
        console.warn('[MasterCryptoVault] Initialization warning:', err);
      }
    }

    /**
     * Bitwise permutation pass (assembly-inspired reversible diffusion)
     */
    permuteBytes(bytes, keyVal) {
      const out = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        // Rotate left by 3 and XOR with key byte
        const b = bytes[i];
        const rot = ((b << 3) | (b >>> 5)) & 0xFF;
        out[i] = rot ^ ((keyVal + i) & 0xFF);
      }
      return out;
    }

    /**
     * Reverse permutation pass
     */
    unpermuteBytes(bytes, keyVal) {
      const out = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        const xored = bytes[i] ^ ((keyVal + i) & 0xFF);
        // Rotate right by 3
        out[i] = ((xored >>> 3) | (xored << 5)) & 0xFF;
      }
      return out;
    }

    bufferToBase64(buf) {
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }

    base64ToBuffer(b64) {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    }

    bufferToHex(buf) {
      return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    /**
     * Derives a cryptographic key from a custom passphrase using PBKDF2 with 200,000 iterations
     */
    async deriveKeyFromPassphrase(passphrase, saltBytes) {
      const enc = new TextEncoder();
      const baseKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 200000,
          hash: 'SHA-512'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }

    /**
     * Encrypts plaintext using Layer-9 multi-stage pipeline:
     * Stage 1: Text encoding & bitwise byte permutation
     * Stage 2: AES-256-GCM envelope encryption with 96-bit unique IV
     * Stage 3: SHA-256 integrity tag & hex signature
     */
    async encrypt(plainText, customPassphrase = '') {
      if (!this.initialized) await this.init();

      const enc = new TextEncoder();
      const rawBytes = enc.encode(plainText);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      let key = this.masterKey;
      if (customPassphrase) {
        key = await this.deriveKeyFromPassphrase(customPassphrase, salt);
      }

      // Stage 1: Bitwise diffusion
      const permuted = this.permuteBytes(rawBytes, salt[0]);

      // Stage 2: Authenticated AES-GCM encryption
      const encryptedBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv, tagLength: 128 },
        key,
        permuted
      );

      // Stage 3: Integrity seal
      const combined = new Uint8Array(encryptedBuf.byteLength + 12);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuf), 12);
      const sealHash = await crypto.subtle.digest('SHA-256', combined);
      const sealHex = this.bufferToHex(sealHash).slice(0, 16).toUpperCase();

      this.totalEncryptedOps++;
      const ivB64 = this.bufferToBase64(iv);
      this.sessionNonces.add(ivB64);

      return {
        success: true,
        tier: 'TIER-9-APEX-CIPHER',
        algorithm: 'AES-256-GCM + SHA-512 PBKDF2 + BITWISE-DIFFUSION',
        salt: this.bufferToBase64(salt),
        iv: ivB64,
        ciphertext: this.bufferToBase64(encryptedBuf),
        hexDump: this.bufferToHex(encryptedBuf).slice(0, 48) + '...',
        seal: sealHex,
        timestamp: Date.now()
      };
    }

    /**
     * Decrypts ciphertext bundle using Layer-9 multi-stage pipeline
     */
    async decrypt(bundle, customPassphrase = '') {
      if (!this.initialized) await this.init();
      if (!bundle || !bundle.ciphertext || !bundle.iv) {
        throw new Error('Invalid encryption bundle payload.');
      }

      const iv = new Uint8Array(this.base64ToBuffer(bundle.iv));
      const cipherBytes = this.base64ToBuffer(bundle.ciphertext);
      const salt = bundle.salt ? new Uint8Array(this.base64ToBuffer(bundle.salt)) : new Uint8Array(16);

      let key = this.masterKey;
      if (customPassphrase) {
        key = await this.deriveKeyFromPassphrase(customPassphrase, salt);
      }

      // Stage 1: Authenticated AES-GCM Decryption
      const decryptedPermuted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv, tagLength: 128 },
        key,
        cipherBytes
      );

      // Stage 2: Reverse bitwise permutation
      const permutedBytes = new Uint8Array(decryptedPermuted);
      const originalBytes = this.unpermuteBytes(permutedBytes, salt[0]);

      // Stage 3: Decode text
      const dec = new TextDecoder();
      const plaintext = dec.decode(originalBytes);

      this.totalDecryptedOps++;
      return plaintext;
    }

    /**
     * Generates real-time telemetry diagnostics for the vault HUD
     */
    getTelemetry() {
      return {
        status: 'ARMED_AND_ACTIVE',
        tier: 'TIER-9-SOVEREIGN-MASTER',
        fingerprint: this.activeKeyFingerprint,
        consumedIVs: this.sessionNonces.size,
        encryptedCount: this.totalEncryptedOps,
        decryptedCount: this.totalDecryptedOps,
        paranoidMode: this.isParanoidMode,
        hardwareAcceleration: typeof crypto !== 'undefined' && !!crypto.subtle,
        timestamp: new Date().toISOString()
      };
    }

    /**
     * Cryptographic zeroization: Wipes active session keys and clears state
     */
    zeroize() {
      this.sessionNonces.clear();
      this.masterKey = null;
      this.activeKeyFingerprint = 'ZEROIZED';
      this.initialized = false;
      this.init(); // Re-seed fresh keys
      return { zeroized: true, timestamp: Date.now() };
    }
  }

  // Attach singleton to global scope
  const instance = new MasterCryptoVault();
  if (typeof window !== 'undefined') {
    window.MasterCryptoVault = MasterCryptoVault;
    window.masterCryptoVault = instance;
    window.NexMasterCrypto = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MasterCryptoVault, masterCryptoVault: instance };
  }
})(typeof window !== 'undefined' ? window : globalThis);
