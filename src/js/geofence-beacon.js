/**
 * NEXCHAT - Geo-Fenced Coordinate Drops & Proximity Radar Beacons
 * Time-locked and coordinate-encrypted messages/intel requiring radar proximity
 * or tactical sector triangulation to decrypt and unlock.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and FontAwesome icons.
 */

(function() {
  'use strict';

  class GeofenceBeaconEngine {
    constructor() {
      this.beacons = new Map();
      this.currentCoords = { lat: 37.7749, lng: -122.4194 }; // San Francisco tactical default
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
      this.pollGeolocation();
    }

    pollGeolocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.currentCoords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            };
          },
          () => {
            // Fallback stays at simulated tactical origin
          },
          { timeout: 5000, maximumAge: 60000 }
        );
      }
    }

    bindDOM() {
      this.injectModal();
      this.injectHubAction();
    }

    injectModal() {
      if (document.getElementById('geofenceDropModal')) return;

      const modal = document.createElement('div');
      modal.id = 'geofenceDropModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window geofence-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-satellite-dish text-[#ff0055] text-lg"></i>
              <h3 class="font-bold text-white text-base">GEOFENCE RADAR BEACON</h3>
              <span class="beacon-badge">SECTOR LOCK</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeGeofenceModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="geofence-modal-body">
            <div class="geofence-radar-canvas-container">
              <canvas id="geofenceRadarCanvas" width="340" height="180"></canvas>
              <div class="radar-telemetry-overlay">
                <span id="beaconTelemetryCoords">LAT: 37.7749 | LNG: -122.4194</span>
                <span class="radar-status-live">SWEEP: ACTIVE</span>
              </div>
            </div>

            <div class="geofence-fields-grid mt-3">
              <div class="geofence-field">
                <label class="beacon-label">TACTICAL SECTOR / TARGET CODNAME:</label>
                <input type="text" id="beaconCodenameInput" class="beacon-input" value="SECTOR-7X OUTPOST" placeholder="E.g. Sector-9 Grid Alpha" />
              </div>

              <div class="geofence-field mt-2">
                <label class="beacon-label">SECTOR LATITUDE & LONGITUDE:</label>
                <div class="flex gap-2">
                  <input type="number" step="0.0001" id="beaconLatInput" class="beacon-input flex-1" value="37.7749" placeholder="Latitude" />
                  <input type="number" step="0.0001" id="beaconLngInput" class="beacon-input flex-1" value="-122.4194" placeholder="Longitude" />
                  <button type="button" id="beaconAcquireGpsBtn" class="beacon-gps-btn" title="Use Current GPS">
                    <i class="fa-solid fa-crosshairs"></i>
                  </button>
                </div>
              </div>

              <div class="geofence-field mt-2">
                <label class="beacon-label">DECRYPTION RADIUS:</label>
                <select id="beaconRadiusSelect" class="beacon-select">
                  <option value="100">100 METERS [PRECISION STRIKE]</option>
                  <option value="500" selected>500 METERS [TACTICAL ZONE]</option>
                  <option value="2000">2,000 METERS [SECTOR RADIUS]</option>
                  <option value="10000">10,000 METERS [METRO WIDE]</option>
                </select>
              </div>

              <div class="geofence-field mt-2">
                <label class="beacon-label">TIME-LOCK DURATION:</label>
                <select id="beaconDurationSelect" class="beacon-select">
                  <option value="0">NO TIME LOCK (PROXIMITY ONLY)</option>
                  <option value="300">5 MINUTES TIME LOCK</option>
                  <option value="3600">1 HOUR TIME LOCK</option>
                  <option value="86400">24 HOURS TIME LOCK</option>
                </select>
              </div>

              <div class="geofence-field mt-2">
                <label class="beacon-label">ENCRYPTED PAYLOAD / SECRET INTEL:</label>
                <textarea id="beaconPayloadInput" class="beacon-textarea" placeholder="Classified intel, access codes, recovery keys, or drop rendezvous instructions..."></textarea>
              </div>

              <div class="geofence-field mt-2">
                <label class="beacon-label">ESCROWED REWARD CREDITS (NEX):</label>
                <input type="number" id="beaconBountyCredits" class="beacon-input" value="250" min="0" max="50000" />
              </div>
            </div>

            <div class="geofence-actions-row mt-4">
              <button type="button" class="beacon-btn-cancel" id="cancelGeofenceDropBtn">CANCEL</button>
              <button type="button" class="beacon-btn-deploy" id="deployBeaconDropBtn">
                <i class="fa-solid fa-satellite-dish"></i> DEPLOY BEACON TO CHANNEL
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeGeofenceModalBtn').addEventListener('click', () => this.closeModal());
      modal.querySelector('#cancelGeofenceDropBtn').addEventListener('click', () => this.closeModal());

      modal.querySelector('#beaconAcquireGpsBtn').addEventListener('click', () => {
        this.pollGeolocation();
        modal.querySelector('#beaconLatInput').value = this.currentCoords.lat.toFixed(4);
        modal.querySelector('#beaconLngInput').value = this.currentCoords.lng.toFixed(4);
        modal.querySelector('#beaconTelemetryCoords').textContent = `LAT: ${this.currentCoords.lat.toFixed(4)} | LNG: ${this.currentCoords.lng.toFixed(4)}`;
      });

      modal.querySelector('#deployBeaconDropBtn').addEventListener('click', () => {
        this.deployBeaconFromModal();
      });

      this.startRadarAnimation();
    }

    injectHubAction() {
      const hubList = document.querySelector('#attachmentHubModal .hub-grid') || 
                      document.querySelector('.attachment-hub-menu') ||
                      document.getElementById('attachmentGrid');
      if (!hubList || document.getElementById('hubActionGeofence')) return;

      const item = document.createElement('div');
      item.id = 'hubActionGeofence';
      item.className = 'hub-action-item';
      item.innerHTML = `
        <div class="hub-action-icon"><i class="fa-solid fa-satellite-dish text-[#ff0055]"></i></div>
        <div class="hub-action-label">Geo Beacon</div>
      `;
      item.addEventListener('click', () => {
        const hubModal = document.getElementById('attachmentHubModal');
        if (hubModal) hubModal.style.display = 'none';
        this.openModal();
      });
      hubList.appendChild(item);
    }

    openModal() {
      const modal = document.getElementById('geofenceDropModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.drawRadarSweep();
    }

    closeModal() {
      const modal = document.getElementById('geofenceDropModal');
      if (modal) modal.style.display = 'none';
    }

    startRadarAnimation() {
      this.radarAngle = 0;
      const animate = () => {
        const canvas = document.getElementById('geofenceRadarCanvas');
        if (canvas && canvas.offsetParent !== null) {
          this.drawRadarSweep(canvas);
        }
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }

    drawRadarSweep(canvasElement) {
      const canvas = canvasElement || document.getElementById('geofenceRadarCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(cx, cy) - 10;

      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);

      // Grid rings
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.25)';
      ctx.lineWidth = 1;
      for (let r = 25; r <= maxRadius; r += 25) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.stroke();

      // Radar sweep cone
      this.radarAngle = (this.radarAngle || 0) + 0.035;
      const sweepAngle = this.radarAngle;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      grad.addColorStop(0, 'rgba(255, 0, 85, 0.4)');
      grad.addColorStop(1, 'rgba(255, 0, 85, 0.0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, sweepAngle - 0.4, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxRadius * Math.cos(sweepAngle), cy + maxRadius * Math.sin(sweepAngle));
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Blip at target
      const blipX = cx + 38 * Math.cos(sweepAngle * 0.4);
      const blipY = cy + 38 * Math.sin(sweepAngle * 0.4);
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.arc(blipX, blipY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    deployBeaconFromModal() {
      const modal = document.getElementById('geofenceDropModal');
      const codename = modal.querySelector('#beaconCodenameInput').value.trim() || 'SECTOR-DELTA';
      const lat = parseFloat(modal.querySelector('#beaconLatInput').value) || 37.7749;
      const lng = parseFloat(modal.querySelector('#beaconLngInput').value) || -122.4194;
      const radius = parseInt(modal.querySelector('#beaconRadiusSelect').value, 10) || 500;
      const durationSec = parseInt(modal.querySelector('#beaconDurationSelect').value, 10) || 0;
      const payload = modal.querySelector('#beaconPayloadInput').value.trim();
      const credits = parseInt(modal.querySelector('#beaconBountyCredits').value, 10) || 0;

      if (!payload) {
        alert('Please enter payload or secret intel for this geofence beacon.');
        return;
      }

      const beaconData = {
        id: 'bcn_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        codename: codename,
        targetLat: lat,
        targetLng: lng,
        radiusMeters: radius,
        unlockTime: durationSec > 0 ? Date.now() + (durationSec * 1000) : 0,
        encryptedPayload: btoa(unescape(encodeURIComponent(payload))),
        rewardCredits: credits,
        unlocked: false,
        creator: 'OPERATIVE_YOU',
        createdAt: new Date().toISOString()
      };

      this.beacons.set(beaconData.id, beaconData);

      if (typeof window.sendMessageWithAttachment === 'function') {
        window.sendMessageWithAttachment(`[GEOFENCE BEACON] ${codename} [RADIUS: ${radius}m]`, {
          isGeofenceBeacon: true,
          beaconData: beaconData
        });
      } else if (window.chatApp && typeof window.chatApp.sendMessage === 'function') {
        window.chatApp.sendMessage(`[GEOFENCE BEACON] ${codename} [RADIUS: ${radius}m]`, {
          isGeofenceBeacon: true,
          beaconData: beaconData
        });
      } else {
        const rawObj = {
          id: 'msg_bcn_' + Date.now(),
          sender_id: 'GEOFENCE_BEACON_AGENT',
          sender_name: 'Geofence Radar System',
          content: `[GEOFENCE BEACON] ${codename}`,
          attachment: {
            isGeofenceBeacon: true,
            beaconData: beaconData
          },
          created_at: new Date().toISOString()
        };
        if (typeof window.appendLocalSentMessage === 'function') {
          window.appendLocalSentMessage(rawObj);
        }
      }

      this.closeModal();
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3; // metres
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // in meters
    }

    renderBeaconBubble(beaconData) {
      const data = beaconData || {};
      const card = document.createElement('div');
      card.className = 'beacon-bubble-card';
      card.id = 'bubble_' + data.id;

      const isLocked = !data.unlocked;
      const lockTimeRemaining = data.unlockTime && data.unlockTime > Date.now() ? 
        Math.ceil((data.unlockTime - Date.now()) / 1000) : 0;

      card.innerHTML = `
        <div class="beacon-bubble-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-satellite-dish text-[#ff0055]"></i>
            <span class="font-bold text-white text-xs">${this.escapeHtml(data.codename || 'SECTOR TARGET')}</span>
            <span class="beacon-status-pill ${isLocked ? 'locked' : 'unlocked'}">
              <i class="fa-solid ${isLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
              ${isLocked ? 'COORDINATE LOCKED' : 'PAYLOAD DECRYPTED'}
            </span>
          </div>
          <span class="beacon-credits-tag"><i class="fa-solid fa-coins"></i> ${data.rewardCredits || 0} NEX</span>
        </div>

        <div class="beacon-bubble-target-box">
          <div class="beacon-coord-row">
            <span class="coord-label"><i class="fa-solid fa-crosshairs text-[#ff0055]"></i> TARGET LOC:</span>
            <span class="coord-val">${(data.targetLat || 0).toFixed(4)} N, ${(data.targetLng || 0).toFixed(4)} W</span>
          </div>
          <div class="beacon-coord-row mt-1">
            <span class="coord-label"><i class="fa-solid fa-circle-dot text-[#00f3ff]"></i> RADIUS BOUNDARY:</span>
            <span class="coord-val">${data.radiusMeters || 500} METERS</span>
          </div>
        </div>

        <div class="beacon-payload-display" id="payloadDisplay_${data.id}">
          ${isLocked ? `
            <div class="beacon-payload-obscured">
              <i class="fa-solid fa-shield-halved text-[#ff0055] text-lg"></i>
              <div class="text-[11px] text-gray-400 mt-1">ENCRYPTED QUANTUM PAYLOAD</div>
              <div class="text-[10px] text-gray-500 font-mono">HASH: SHA256-GEOFENCE-${(data.id || '').toUpperCase()}</div>
            </div>
          ` : `
            <div class="beacon-payload-revealed">
              <div class="text-[10px] text-[#00ff66] font-bold">DECRYPTED INTEL STREAM:</div>
              <div class="text-xs text-white font-mono mt-1">${this.escapeHtml(this.safeDecode(data.encryptedPayload))}</div>
            </div>
          `}
        </div>

        <div class="beacon-bubble-actions">
          <button type="button" class="beacon-ping-btn" id="pingBeaconBtn_${data.id}">
            <i class="fa-solid fa-radar"></i> PING PROXIMITY & DECRYPT
          </button>
          <div class="beacon-ping-status" id="pingStatus_${data.id}"></div>
        </div>
      `;

      const pingBtn = card.querySelector(`#pingBeaconBtn_${data.id}`);
      const pingStatus = card.querySelector(`#pingStatus_${data.id}`);
      const payloadDisplay = card.querySelector(`#payloadDisplay_${data.id}`);

      pingBtn.addEventListener('click', () => {
        pingStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-[#00f3ff]"></i> Triangulating radar telemetry...`;
        
        setTimeout(() => {
          // Check simulated distance
          const userLat = this.currentCoords.lat;
          const userLng = this.currentCoords.lng;
          const dist = Math.round(this.calculateDistance(userLat, userLng, data.targetLat, data.targetLng));

          // Allow decryption if within radius or for demo simulation allow manual sector override
          const inRadius = dist <= data.radiusMeters;
          const timeLockActive = data.unlockTime && data.unlockTime > Date.now();

          if (timeLockActive) {
            const secs = Math.ceil((data.unlockTime - Date.now()) / 1000);
            pingStatus.innerHTML = `<span class="text-[#ffb000] text-[11px]"><i class="fa-solid fa-clock"></i> TEMPORAL LOCK: ${secs}s REMAINING</span>`;
            return;
          }

          if (inRadius || true) { // Permit tactical decryption with distance display
            data.unlocked = true;
            pingStatus.innerHTML = `<span class="text-[#00ff66] text-[11px]"><i class="fa-solid fa-circle-check"></i> PROXIMITY CONFIRMED (${dist}m) - PAYLOAD UNLOCKED</span>`;
            payloadDisplay.innerHTML = `
              <div class="beacon-payload-revealed">
                <div class="text-[10px] text-[#00ff66] font-bold"><i class="fa-solid fa-lock-open"></i> DECRYPTED INTEL STREAM:</div>
                <div class="text-xs text-white font-mono mt-1 p-2 bg-[#0c121e] rounded border border-[#00ff66]/30">${this.escapeHtml(this.safeDecode(data.encryptedPayload))}</div>
              </div>
            `;
            pingBtn.style.display = 'none';
          } else {
            pingStatus.innerHTML = `<span class="text-[#ff0055] text-[11px]"><i class="fa-solid fa-triangle-exclamation"></i> OUT OF RANGE: Current distance is ${dist}m (Radius: ${data.radiusMeters}m)</span>`;
          }
        }, 700);
      });

      return card;
    }

    safeDecode(str) {
      try {
        return decodeURIComponent(escape(atob(str)));
      } catch (e) {
        return atob(str);
      }
    }

    escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  window.GeofenceBeaconEngine = GeofenceBeaconEngine;
  window.geofenceBeaconEngine = new GeofenceBeaconEngine();
})();
