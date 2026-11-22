/**
 * NEXCHAT REAL-TIME CRASHLYTICS & ERROR LOGGING ENGINE
 * Lightweight frontend Sentry / Firebase Crashlytics architecture
 * Captures:
 * 1. Uncaught runtime exceptions (window.onerror)
 * 2. Unhandled Promise rejections (window.onunhandledrejection)
 * 3. Network fetch & API error catches (API dispatchers)
 * 4. Firebase permission & Firestore transaction catches
 * 5. Syncs live to LocalStorage buffer & Firestore 'systemErrors' collection
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'nex_recent_errors';
  const MAX_ERRORS_STORED = 60;

  class NexCrashlyticsEngine {
    constructor() {
      this.listeners = new Set();
      this.initListeners();
    }

    initListeners() {
      if (typeof window === 'undefined') return;

      // 1. Uncaught Global Errors
      window.addEventListener('error', (event) => {
        this.logError({
          type: 'FRONTEND_EXCEPTION',
          message: event.message || 'Unknown window error',
          filename: event.filename || 'unknown',
          lineno: event.lineno || 0,
          colno: event.colno || 0,
          stack: event.error?.stack || '',
          severity: 'error'
        });
      });

      // 2. Unhandled Promise Rejections
      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const msg = (reason && typeof reason === 'object') ? (reason.message || JSON.stringify(reason)) : String(reason);
        this.logError({
          type: 'UNHANDLED_PROMISE',
          message: msg || 'Unhandled Promise Rejection',
          stack: reason?.stack || '',
          severity: 'warning'
        });
      });

      console.log('⚡ [CRASHLYTICS] Real-time error interceptor armed.');
    }

    logError(errPayload) {
      try {
        const now = new Date();
        const errorRecord = {
          id: 'err_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
          timestamp: now.toISOString(),
          timeFormatted: now.toLocaleTimeString(),
          type: errPayload.type || 'RUNTIME_ERROR',
          message: String(errPayload.message || 'Unknown error').slice(0, 500),
          stack: String(errPayload.stack || '').slice(0, 1000),
          filename: errPayload.filename || '',
          url: typeof window !== 'undefined' ? window.location.pathname : '',
          severity: errPayload.severity || 'error',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          isMobile: typeof window !== 'undefined' ? window.innerWidth < 900 : false,
          userUid: (typeof window !== 'undefined' && (window.myUID || window.auth?.currentUser?.uid)) || 'anonymous'
        };

        // 1. Store locally in sliding buffer
        const existing = this.getRecentErrors();
        existing.unshift(errorRecord);
        if (existing.length > MAX_ERRORS_STORED) existing.pop();

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        } catch (_) {}

        // 2. Broadcast to any active dashboard listeners
        this.notifyListeners(errorRecord);

        // 3. Sync to Firestore 'systemErrors' if Firestore db is active and available
        if (typeof window !== 'undefined' && window.db && typeof window.addDoc === 'function' && typeof window.collection === 'function') {
          try {
            window.addDoc(window.collection(window.db, 'systemErrors'), {
              ...errorRecord,
              serverSyncedAt: (typeof window.serverTimestamp === 'function' ? window.serverTimestamp() : now.toISOString())
            }).catch(() => {});
          } catch (_) {}
        }

        return errorRecord;
      } catch (e) {
        console.warn('[CRASHLYTICS] Error while logging error:', e);
      }
    }

    getRecentErrors() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }

    clearErrors() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        this.notifyListeners(null);
      } catch (_) {}
    }

    subscribe(callback) {
      if (typeof callback === 'function') {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
      }
    }

    notifyListeners(newError) {
      for (const cb of this.listeners) {
        try { cb(newError, this.getRecentErrors()); } catch (_) {}
      }
    }
  }

  global.NexCrashlytics = new NexCrashlyticsEngine();
})(typeof window !== 'undefined' ? window : globalThis);
