// js/game_modules/tactical_radar.js
// High-performance 120px circular canvas tactical HUD radar for Calgary Metropolis

class TacticalRadar {
  constructor(canvasId = 'radarCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      // Auto-create if not present
      this.canvas = document.createElement('canvas');
      this.canvas.id = canvasId;
      this.canvas.width = 120;
      this.canvas.height = 120;
      this.canvas.style.cssText = 'position:fixed;bottom:24px;right:24px;width:120px;height:120px;border-radius:50%;background:rgba(8,16,28,0.78);border:2px solid rgba(0,240,255,0.45);box-shadow:0 0 18px rgba(0,240,255,0.25);z-index:900;pointer-events:none;';
      document.body.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');
    this.range = 350; // detection radius in game units
    this.targets = [];
    this.sweepAngle = 0;
  }

  setTargets(targets) {
    this.targets = targets; // array of { pos: Vector3, label: string, color: string, type: string }
  }

  update(playerPos, playerHeading, dt = 0.016) {
    if (!this.ctx || !playerPos) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = cx - 4;

    this.sweepAngle = (this.sweepAngle + dt * 2.5) % (Math.PI * 2);

    // Clear background
    ctx.clearRect(0, 0, w, h);

    // Radar background disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 14, 24, 0.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 230, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Concentric range rings
    [0.33, 0.66, 1.0].forEach(frac => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * frac, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rotating sweep cone
    const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    sweepGrad.addColorStop(0, 'rgba(0, 255, 200, 0.25)');
    sweepGrad.addColorStop(1, 'rgba(0, 255, 200, 0.0)');
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, this.sweepAngle, this.sweepAngle + 0.55);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    // Compass cardinal markers relative to player heading
    const cardinals = [
      { text: 'N', angle: 0 },
      { text: 'E', angle: Math.PI / 2 },
      { text: 'S', angle: Math.PI },
      { text: 'W', angle: (Math.PI * 3) / 2 }
    ];

    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    cardinals.forEach(card => {
      const relAngle = card.angle - playerHeading - Math.PI / 2;
      const tx = cx + Math.cos(relAngle) * (r - 9);
      const ty = cy + Math.sin(relAngle) * (r - 9);
      ctx.fillStyle = card.text === 'N' ? '#ff3b30' : 'rgba(0, 240, 255, 0.7)';
      ctx.fillText(card.text, tx, ty);
    });

    // Blips
    if (this.targets && this.targets.length > 0) {
      this.targets.forEach(tgt => {
        if (!tgt.pos) return;
        const dx = tgt.pos.x - playerPos.x;
        const dz = tgt.pos.z - playerPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > this.range) return;

        // Angle in world space
        const worldAngle = Math.atan2(dz, dx);
        // Transform relative to player heading
        const relAngle = worldAngle - playerHeading - Math.PI / 2;
        const scaleDist = (dist / this.range) * (r - 8);

        const bx = cx + Math.cos(relAngle) * scaleDist;
        const by = cy + Math.sin(relAngle) * scaleDist;

        ctx.beginPath();
        ctx.arc(bx, by, tgt.size || 3.5, 0, Math.PI * 2);
        ctx.fillStyle = tgt.color || '#00ffcc';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        if (tgt.pulse) {
          ctx.beginPath();
          ctx.arc(bx, by, (tgt.size || 3.5) + (Math.sin(Date.now() * 0.006) + 1) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = tgt.color || '#00ffcc';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      });
    }

    // Player marker (center triangle pointing forward = UP)
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5.5);
    ctx.lineTo(cx - 4, cy + 4.5);
    ctx.lineTo(cx + 4, cy + 4.5);
    ctx.closePath();
    ctx.fillStyle = '#ffcc00';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

window.TacticalRadar = TacticalRadar;
