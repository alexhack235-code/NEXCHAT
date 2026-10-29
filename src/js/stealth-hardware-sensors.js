/**
 * =============================================================================
 * NEXCHAT - STEALTH HARDWARE SENSORS & GESTURE ENCLAVE (v1.0)
 * Global Namespace: window.NexStealthSensors
 * =============================================================================
 * Capabilities:
 * 1. Acoustic Knuckle Knock Reveal:
 *    Evaluates chassis jerk impulse (jz = |az - az_prev| / dt > 160 m/s^3)
 *    paired with a capacitive touch veto (>= 140ms touch gap) to detect 2 or 3
 *    rhythmic physical raps on the phone's back or side casing.
 * 2. Gyroscope 45-Degree Horizon Angle Lock:
 *    Monitors deviceorientation (pitch beta, roll gamma) and calculates elliptic
 *    viewing distance rho. Messages dynamically scramble with heavy obsidian
 *    blur and opacity reduction unless the phone is tilted at the calibrated angle.
 * 3. 100% Non-Forced Opt-In: Strictly disabled by default.
 *
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs only.
 * PURE WINDOWS CRLF LINE ENDINGS. ES2022 COMPLIANT.
 * =============================================================================
 */

(function (global) {
  'use strict';

  const STORAGE_KEY_KNOCK_ENABLED = 'nex_knuckle_knock_enabled';
  const STORAGE_KEY_KNOCK_COUNT = 'nex_knuckle_knock_count';
  const STORAGE_KEY_HORIZON_ENABLED = 'nex_horizon_lock_enabled';
  const STORAGE_KEY_HORIZON_ANGLE = 'nex_horizon_target_angle';
  const STORAGE_KEY_HORIZON_TOLERANCE = 'nex_horizon_tolerance';

  const DEFAULT_KNOCK_THRESHOLD = 160; // m/s^3 jerk vector
  const DEFAULT_TARGET_PITCH = 42;    // 42 degrees reading angle
  const DEFAULT_PITCH_TOLERANCE = 8.5; // +- 8.5 degrees
  const DEFAULT_ROLL_TOLERANCE = 11.0; // +- 11 degrees
  const TOUCH_VETO_WINDOW_MS = 140;   // Invalidate knock if touch event occurred within 140ms
  const KNOCK_MIN_GAP_MS = 110;       // Reject mechanical bounce / ringing
  const KNOCK_MAX_GAP_MS = 460;       // Maximum gap between consecutive knocks

  class StealthHardwareSensorsEngine {
    constructor() {
      this._knockHistory = [];
      this._lastTouchTime = 0;
      this._lastAccel = null;
      this._lastAccelTime = 0;
      this._motionBound = false;
      this._orientationBound = false;
      this._touchBound = false;
      this._scrambleActive = false;
      this._desktopBypass = false;

      this.init();
    }

    init() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      this.bindTouchVeto();

      if (this.isKnuckleKnockEnabled()) {
        this.startMotionSensor();
      }

      if (this.isHorizonLockEnabled()) {
        this.startOrientationSensor();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    // ------------------------------------------------------------------------
    // PREFERENCE ACCESSORS (STRICT OPT-IN: DEFAULT FALSE)
    // ------------------------------------------------------------------------
    isKnuckleKnockEnabled() {
      try {
        return localStorage.getItem(STORAGE_KEY_KNOCK_ENABLED) === 'true';
      } catch (_) {
        return false;
      }
    }

    setKnuckleKnockEnabled(enabled) {
      try {
        localStorage.setItem(STORAGE_KEY_KNOCK_ENABLED, enabled ? 'true' : 'false');
        if (enabled) {
          this.startMotionSensor();
        } else {
          this.stopMotionSensor();
        }
      } catch (_) {}
    }

    getKnockCountRequired() {
      try {
        const val = parseInt(localStorage.getItem(STORAGE_KEY_KNOCK_COUNT), 10);
        return val === 2 ? 2 : 3;
      } catch (_) {
        return 3;
      }
    }

    setKnockCountRequired(count) {
      try {
        localStorage.setItem(STORAGE_KEY_KNOCK_COUNT, count === 2 ? '2' : '3');
      } catch (_) {}
    }

    isHorizonLockEnabled() {
      try {
        return localStorage.getItem(STORAGE_KEY_HORIZON_ENABLED) === 'true';
      } catch (_) {
        return false;
      }
    }

    setHorizonLockEnabled(enabled) {
      try {
        localStorage.setItem(STORAGE_KEY_HORIZON_ENABLED, enabled ? 'true' : 'false');
        if (enabled) {
          this.startOrientationSensor();
          this.updateHudVisibility(true);
        } else {
          this.stopOrientationSensor();
          this.clearScramble();
          this.updateHudVisibility(false);
        }
      } catch (_) {}
    }

    getTargetPitchAngle() {
      try {
        const val = parseFloat(localStorage.getItem(STORAGE_KEY_HORIZON_ANGLE));
        return !isNaN(val) ? val : DEFAULT_TARGET_PITCH;
      } catch (_) {
        return DEFAULT_TARGET_PITCH;
      }
    }

    setTargetPitchAngle(deg) {
      try {
        localStorage.setItem(STORAGE_KEY_HORIZON_ANGLE, String(deg));
      } catch (_) {}
    }

    // ------------------------------------------------------------------------
    // TOUCH VETO LISTENER (CAPACITIVE GUARD)
    // ------------------------------------------------------------------------
    bindTouchVeto() {
      if (this._touchBound) return;
      this._touchBound = true;

      const markTouch = () => {
        this._lastTouchTime = Date.now();
        // Screen touched: discard any accumulated knuckle knock sequence
        this._knockHistory = [];
      };

      window.addEventListener('touchstart', markTouch, { passive: true, capture: true });
      window.addEventListener('pointerdown', markTouch, { passive: true, capture: true });
    }

    // ------------------------------------------------------------------------
    // 1. ACOUSTIC KNUCKLE KNOCK REVEAL (JERK TELEMETRY)
    // ------------------------------------------------------------------------
    startMotionSensor() {
      if (this._motionBound) return;
      this._motionBound = true;
      this._onDeviceMotion = this.handleDeviceMotion.bind(this);

      // Check iOS 13+ DeviceMotionEvent permission requirement
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS requires user gesture for permission; listener attached
        window.addEventListener('devicemotion', this._onDeviceMotion, false);
      } else if (typeof window !== 'undefined') {
        window.addEventListener('devicemotion', this._onDeviceMotion, false);
      }
    }

    stopMotionSensor() {
      if (!this._motionBound) return;
      this._motionBound = false;
      if (this._onDeviceMotion) {
        window.removeEventListener('devicemotion', this._onDeviceMotion, false);
      }
      this._knockHistory = [];
    }

    handleDeviceMotion(event) {
      if (!this.isKnuckleKnockEnabled()) return;

      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const curZ = acc.z || 0;
      const now = Date.now();

      if (this._lastAccel !== null && this._lastAccelTime > 0) {
        const dt = (now - this._lastAccelTime) / 1000; // in seconds
        if (dt > 0.005 && dt < 0.2) {
          const deltaZ = Math.abs(curZ - this._lastAccel.z);
          const jerkZ = deltaZ / dt; // m/s^3

          // Update live meter widget in settings if open
          this.updateKnockTelemetryMeter(jerkZ);

          // Test Jerk threshold (chassis knock impulse)
          if (jerkZ >= DEFAULT_KNOCK_THRESHOLD) {
            // Check capacitive screen touch veto
            const touchGap = now - this._lastTouchTime;
            if (touchGap >= TOUCH_VETO_WINDOW_MS) {
              this.registerKnockImpulse(now, jerkZ);
            }
          }
        }
      }

      this._lastAccel = { z: curZ };
      this._lastAccelTime = now;
    }

    registerKnockImpulse(now, jerkZ) {
      if (this._knockHistory.length === 0) {
        this._knockHistory.push(now);
        return;
      }

      const lastKnock = this._knockHistory[this._knockHistory.length - 1];
      const gap = now - lastKnock;

      // Check interval window (110ms to 460ms)
      if (gap >= KNOCK_MIN_GAP_MS && gap <= KNOCK_MAX_GAP_MS) {
        this._knockHistory.push(now);

        const required = this.getKnockCountRequired();
        if (this._knockHistory.length >= required) {
          this._knockHistory = [];
          this.triggerKnockRevealSuccess();
        }
      } else if (gap > KNOCK_MAX_GAP_MS) {
        // Sequence timed out, reset and start new chain with this knock
        this._knockHistory = [now];
      }
      // If gap < KNOCK_MIN_GAP_MS, it's mechanical chatter, ignore.
    }

    triggerKnockRevealSuccess() {
      try {
        if (navigator.vibrate) {
          navigator.vibrate([40, 50, 40]);
        }
      } catch (_) {}

      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification('Chassis knuckle knock verified. Revealing stealth enclave.', 'success', 2200);
      }

      if (window.NexChatVanish && typeof window.NexChatVanish.triggerRevealSequence === 'function') {
        window.NexChatVanish.triggerRevealSequence();
      }
    }

    updateKnockTelemetryMeter(jerkZ) {
      const meterEl = document.getElementById('knuckleKnockLiveMeter');
      const valEl = document.getElementById('knuckleKnockLiveVal');
      if (meterEl && valEl) {
        const pct = Math.min(100, Math.round((jerkZ / (DEFAULT_KNOCK_THRESHOLD * 1.5)) * 100));
        meterEl.style.width = pct + '%';
        valEl.textContent = Math.round(jerkZ) + ' m/s³';
      }
    }

    // ------------------------------------------------------------------------
    // 2. GYROSCOPE 45-DEGREE HORIZON ANGLE LOCK
    // ------------------------------------------------------------------------
    startOrientationSensor() {
      if (this._orientationBound) return;
      this._orientationBound = true;
      this._onOrientation = this.handleDeviceOrientation.bind(this);

      if (typeof window !== 'undefined') {
        window.addEventListener('deviceorientation', this._onOrientation, false);
      }
    }

    stopOrientationSensor() {
      if (!this._orientationBound) return;
      this._orientationBound = false;
      if (this._onOrientation) {
        window.removeEventListener('deviceorientation', this._onOrientation, false);
      }
      this.clearScramble();
    }

    handleDeviceOrientation(event) {
      if (!this.isHorizonLockEnabled()) return;
      if (this._desktopBypass) {
        this.clearScramble();
        return;
      }

      // beta: front-to-back tilt in degrees (-180 to 180)
      // gamma: left-to-right tilt in degrees (-90 to 90)
      const beta = event.beta;
      const gamma = event.gamma;

      if (beta === null || beta === undefined) return;

      const targetBeta = this.getTargetPitchAngle();
      const deltaBeta = DEFAULT_PITCH_TOLERANCE;
      const deltaGamma = DEFAULT_ROLL_TOLERANCE;

      // Elliptic distance formula:
      // rho = sqrt(((beta - targetBeta) / deltaBeta)^2 + (gamma / deltaGamma)^2)
      const normBeta = (beta - targetBeta) / deltaBeta;
      const normGamma = (gamma || 0) / deltaGamma;
      const rho = Math.sqrt(normBeta * normBeta + normGamma * normGamma);

      let scrambleFactor = 0.0;
      if (rho > 1.0) {
        // Linearly ramp scramble from 0.0 to 1.0
        scrambleFactor = Math.min(1.0, (rho - 1.0) / 0.70);
      }

      this.applyScramble(scrambleFactor, beta, gamma);
    }

    applyScramble(scrambleFactor, beta, gamma) {
      const root = document.documentElement;
      root.style.setProperty('--horizon-scramble-factor', scrambleFactor.toFixed(3));
      root.style.setProperty('--horizon-blur', (scrambleFactor * 16).toFixed(1) + 'px');
      root.style.setProperty('--horizon-opacity', (1.0 - scrambleFactor * 0.94).toFixed(2));

      const chatContainers = document.querySelectorAll('#chatMessages, #chatMessagesContainer, .chat-conversation-area');
      if (scrambleFactor > 0.05) {
        chatContainers.forEach(c => c.classList.add('horizon-locked'));
        this._scrambleActive = true;
      } else {
        chatContainers.forEach(c => c.classList.remove('horizon-locked'));
        this._scrambleActive = false;
      }

      this.updateHud(beta, scrambleFactor);
    }

    clearScramble() {
      const root = document.documentElement;
      root.style.setProperty('--horizon-scramble-factor', '0');
      root.style.setProperty('--horizon-blur', '0px');
      root.style.setProperty('--horizon-opacity', '1');

      const chatContainers = document.querySelectorAll('#chatMessages, #chatMessagesContainer, .chat-conversation-area');
      chatContainers.forEach(c => c.classList.remove('horizon-locked'));
      this._scrambleActive = false;

      this.updateHud(this.getTargetPitchAngle(), 0.0);
    }

    updateHud(beta, scrambleFactor) {
      const hudAngle = document.getElementById('horizonHudAngle');
      const hudStatus = document.getElementById('horizonHudStatus');
      const liveReadout = document.getElementById('horizonLiveAngleReadout');

      const displayBeta = Math.round(beta || this.getTargetPitchAngle());

      if (hudAngle) hudAngle.textContent = displayBeta + '°';
      if (liveReadout) liveReadout.textContent = displayBeta + '°';

      if (hudStatus) {
        if (scrambleFactor > 0.05) {
          hudStatus.textContent = 'SECURED';
          hudStatus.className = 'horizon-badge-scrambled';
        } else {
          hudStatus.textContent = 'OPTIMAL';
          hudStatus.className = 'horizon-badge-clear';
        }
      }
    }

    updateHudVisibility(visible) {
      const hud = document.getElementById('horizonReticleHud');
      if (hud) {
        hud.style.display = visible ? 'flex' : 'none';
      }
    }

    calibrateCurrentAngle() {
      // Calibrate pitch from the currently detected angle or fallback
      let currentPitch = DEFAULT_TARGET_PITCH;
      const liveReadout = document.getElementById('horizonLiveAngleReadout');
      if (liveReadout && liveReadout.textContent) {
        const parsed = parseInt(liveReadout.textContent, 10);
        if (!isNaN(parsed) && parsed >= 20 && parsed <= 80) {
          currentPitch = parsed;
        }
      }

      this.setTargetPitchAngle(currentPitch);

      const slider = document.getElementById('settingHorizonTargetAngle');
      const label = document.getElementById('horizonTargetAngleVal');
      if (slider) slider.value = String(currentPitch);
      if (label) label.textContent = currentPitch + '°';

      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification('Calibrated Horizon Lock to ' + currentPitch + '°', 'success', 2000);
      }
    }

    bindDOM() {
      // Wire Desktop HUD click to toggle temporary bypass
      const hud = document.getElementById('horizonReticleHud');
      if (hud && !hud.dataset.bound) {
        hud.dataset.bound = 'true';
        hud.addEventListener('click', () => {
          this._desktopBypass = !this._desktopBypass;
          if (this._desktopBypass) {
            this.clearScramble();
            if (typeof window.safeShowNotification === 'function') {
              window.safeShowNotification('Horizon Lock temporarily bypassed (Desktop mode)', 'info', 1800);
            }
          }
        });
      }

      // Alt key press bypass listener
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Alt' && this.isHorizonLockEnabled()) {
          this._desktopBypass = true;
          this.clearScramble();
        }
      });
      window.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
          this._desktopBypass = false;
        }
      });

      this.updateHudVisibility(this.isHorizonLockEnabled());
    }
  }

  // Initialize and mount on global
  const engine = new StealthHardwareSensorsEngine();
  global.NexStealthSensors = engine;
  global.nexStealthSensors = engine;

})(typeof window !== 'undefined' ? window : this);
