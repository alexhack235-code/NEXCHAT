/**
 * ============================================================================
 * NEXCHAT AUTONOMOUS HEALING & ERROR INCIDENT CLIENT
 * ============================================================================
 * Automatically captures runtime exceptions and forwards telemetry to the
 * dedicated Auto-Healer microservice (/api/auto-heal) for instant root-cause
 * classification and autonomous patch generation.
 * ============================================================================
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.__NEXCHAT_AUTO_HEAL_INITIALIZED__) return;
  window.__NEXCHAT_AUTO_HEAL_INITIALIZED__ = true;

  let lastIncidentTime = 0;
  const INCIDENT_THROTTLE_MS = 10000; // Max 1 auto-report per 10s
  const incidentHistory = [];

  class NexchatAutoHealClient {
    constructor() {
      this.enabled = true;
      this.initGlobalListeners();
    }

    initGlobalListeners() {
      // 1. Uncaught Javascript Runtime Exceptions
      window.addEventListener('error', (event) => {
        if (!this.enabled) return;
        const error = event.error || {};
        const message = event.message || error.message || 'Unknown runtime error';
        const filename = event.filename || 'client-app.js';
        const lineno = event.lineno || 0;
        const colno = event.colno || 0;
        const stack = error.stack || `${message} at ${filename}:${lineno}:${colno}`;

        this.reportIncident({
          errorLog: `Uncaught Exception: ${message} at ${filename}:${lineno}:${colno}`,
          stack,
          fileName: filename
        });
      });

      // 2. Unhandled Promise Rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (!this.enabled) return;
        const reason = event.reason;
        const message = reason?.message || String(reason) || 'Unhandled promise rejection';
        const stack = reason?.stack || message;

        this.reportIncident({
          errorLog: `Unhandled Promise Rejection: ${message}`,
          stack,
          fileName: 'async-task.js'
        });
      });
    }

    /**
     * Reports an incident to /api/auto-heal with rate throttling
     */
    async reportIncident({ errorLog, stack = '', fileName = 'client.js', fileContent = '' }) {
      const now = Date.now();
      if (now - lastIncidentTime < INCIDENT_THROTTLE_MS) {
        return; // Throttled to avoid cascade loops
      }
      lastIncidentTime = now;

      // Filter out noisy third-party extension errors
      if (
        fileName.includes('chrome-extension://') ||
        fileName.includes('moz-extension://') ||
        errorLog.includes('ResizeObserver')
      ) {
        return;
      }

      const payload = {
        errorLog,
        stack,
        fileName,
        fileContent
      };

      incidentHistory.push({
        timestamp: new Date().toISOString(),
        error: errorLog
      });
      if (incidentHistory.length > 50) incidentHistory.shift();

      try {
        const resp = await fetch('/api/auto-heal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data && data.success) {
            console.info(
              `%c[NEXCHAT AUTO-HEAL] Incident diagnosed: [${data.errorType}] ${data.rootCause} (Attempt ${data.attempt}, ${data.timeToHeal})`,
              'color: #00FF9D; font-weight: bold;'
            );
          }
        }
      } catch (_) {
        // Silent failure so user UI is never impacted
      }
    }

    /**
     * Manual healing trigger: can heal an arbitrary piece of broken code
     */
    async healCode(code, errorLog, fileName = 'snippet.js') {
      try {
        const resp = await fetch('/api/auto-heal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileContent: code,
            errorLog,
            fileName
          })
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (err) {
        return { success: false, error: err.message };
      }
      return { success: false, error: 'Healing request failed' };
    }

    /**
     * Checks health of the Auto-Healer microservice
     */
    async checkHealth() {
      try {
        const resp = await fetch('/api/auto-heal');
        if (resp.ok) return await resp.json();
      } catch (e) {
        return { status: 'offline', error: e.message };
      }
      return { status: 'error' };
    }
  }

  window.nexchatAutoHeal = new NexchatAutoHealClient();
})();
