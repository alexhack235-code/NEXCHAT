// app/studio/games/lib/unrealPhysics.ts
// Physics solver that defies reality when Unreal Mode is active

export interface PhysicsSettings {
  gravity: number; // -10.0 to +10.0 m/s^2
  timeScale: number; // 0.05 to 5.0
  mass: number;
  bounciness: number;
  unrealMode: boolean;
  exaggeration: number; // 1.0 to 5.0
  freezePoint: number; // Normalized time 0.0 to 1.0
  collisionEnabled: boolean;
}

export const DEFAULT_UNREAL_SETTINGS: PhysicsSettings = {
  gravity: -9.8, // Inverted gravity: float up
  timeScale: 0.05, // Bullet time Matrix slow-mo
  mass: 1.0,
  bounciness: 1.8,
  unrealMode: true,
  exaggeration: 2.5,
  freezePoint: 0.45,
  collisionEnabled: false
};

export const DEFAULT_REALISTIC_SETTINGS: PhysicsSettings = {
  gravity: 9.8,
  timeScale: 1.0,
  mass: 1.0,
  bounciness: 0.4,
  unrealMode: false,
  exaggeration: 1.0,
  freezePoint: 0.0,
  collisionEnabled: true
};

/**
 * Computes impossible acrobatic character trajectory (e.g. 1080° triple backflip + mid-air hang).
 */
export function computeAcrobaticPose(
  normalizedTime: number,
  settings: PhysicsSettings
): {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isFloating: boolean;
} {
  const t = normalizedTime; // 0.0 to 1.0
  const ex = settings.unrealMode ? settings.exaggeration : 1.0;

  let y = 0;
  let rotX = 0;
  let rotY = 0;
  let rotZ = 0;
  let scaleY = 1.0;
  let scaleXZ = 1.0;

  if (settings.unrealMode) {
    // Impossible triple backflip with apex hover
    if (t < 0.2) {
      // Launch and jump
      const progress = t / 0.2;
      y = Math.sin(progress * Math.PI * 0.5) * 4.5 * ex;
      rotX = progress * Math.PI * 2; // 360 flip
      scaleY = 1.0 + 0.3 * Math.sin(progress * Math.PI); // Squash and stretch
    } else if (t < 0.6) {
      // Apex zero-gravity hover & freeze catch
      const apexProgress = (t - 0.2) / 0.4;
      y = 4.5 * ex + Math.sin(apexProgress * Math.PI) * 0.8;
      rotX = Math.PI * 2 + apexProgress * Math.PI * 4; // Additional 720 spins = 1080 total
      rotY = Math.sin(apexProgress * Math.PI * 2) * Math.PI * 0.5;
      scaleY = 0.9;
    } else {
      // Supersonic slam landing
      const landProgress = (t - 0.6) / 0.4;
      y = (1.0 - landProgress) * 4.5 * ex;
      rotX = Math.PI * 6; // 3 full flips
      if (landProgress > 0.8) {
        // Impact squash
        scaleY = 0.55;
        scaleXZ = 1.35;
      }
    }
  } else {
    // Realistic parabola
    y = Math.sin(t * Math.PI) * 2.5;
    rotX = t * Math.PI * 2;
  }

  return {
    position: [0, Math.max(0, y), 0],
    rotation: [rotX, rotY, rotZ],
    scale: [scaleXZ, scaleY, scaleXZ],
    isFloating: settings.unrealMode && t >= 0.2 && t <= 0.6
  };
}

/**
 * Computes Phone 3D trajectories (iPhone 18 & Galaxy S26)
 */
export function computePhoneTrajectory(
  normalizedTime: number,
  isIPhone: boolean,
  settings: PhysicsSettings
): {
  position: [number, number, number];
  rotation: [number, number, number];
  isFrozen: boolean;
  shattered: boolean;
} {
  const t = normalizedTime;
  const side = isIPhone ? -1 : 1;

  if (settings.unrealMode) {
    if (t < 0.45) {
      // Mid-air collision path
      const p = t / 0.45;
      const x = side * (4.0 - p * 3.4);
      const y = 2.5 + Math.sin(p * Math.PI) * 2.2;
      const z = Math.cos(p * Math.PI * 2) * 0.5;
      return {
        position: [x, y, z],
        rotation: [p * 8, side * p * 6, 0],
        isFrozen: p > 0.6,
        shattered: false
      };
    } else {
      // Shattered at t >= 0.45 into particles
      return {
        position: [0, 4.0, 0],
        rotation: [0, 0, 0],
        isFrozen: true,
        shattered: true
      };
    }
  }

  // Realistic arc
  const x = side * (3.0 - t * 2.0);
  const y = Math.max(0, Math.sin(t * Math.PI) * 2.0);
  return {
    position: [x, y, 0],
    rotation: [t * 4, 0, 0],
    isFrozen: false,
    shattered: false
  };
}

/**
 * Generates 3D coordinates for the NEX Logo target formation.
 * Generates points for the letters N, E, X in 3D space.
 */
export function generateNEXLogoPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  let idx = 0;

  for (let i = 0; i < count; i++) {
    const letter = i % 3; // 0: 'N', 1: 'E', 2: 'X'
    const subProg = (i / count);
    let x = 0, y = 0, z = (Math.random() - 0.5) * 0.4;

    if (letter === 0) {
      // Letter 'N' (x between -3.0 and -1.2)
      const seg = Math.random();
      if (seg < 0.35) {
        // Left bar
        x = -2.8;
        y = (Math.random() - 0.5) * 2.4;
      } else if (seg < 0.7) {
        // Right bar
        x = -1.6;
        y = (Math.random() - 0.5) * 2.4;
      } else {
        // Diagonal
        const d = Math.random();
        x = -2.8 + d * 1.2;
        y = 1.2 - d * 2.4;
      }
    } else if (letter === 1) {
      // Letter 'E' (x between -0.8 and +0.8)
      const seg = Math.random();
      if (seg < 0.4) {
        // Spine
        x = -0.6;
        y = (Math.random() - 0.5) * 2.4;
      } else if (seg < 0.6) {
        // Top bar
        x = -0.6 + Math.random() * 1.1;
        y = 1.2;
      } else if (seg < 0.8) {
        // Mid bar
        x = -0.6 + Math.random() * 0.8;
        y = 0.0;
      } else {
        // Bottom bar
        x = -0.6 + Math.random() * 1.1;
        y = -1.2;
      }
    } else {
      // Letter 'X' (x between +1.4 and +3.0)
      const seg = Math.random();
      const d = Math.random();
      if (seg < 0.5) {
        // Diagonal 1
        x = 1.6 + d * 1.3;
        y = -1.2 + d * 2.4;
      } else {
        // Diagonal 2
        x = 1.6 + d * 1.3;
        y = 1.2 - d * 2.4;
      }
    }

    positions[idx++] = x;
    positions[idx++] = y + 4.0; // Float around y = 4.0
    positions[idx++] = z;
  }

  return positions;
}
