// app/studio/games/lib/aiAnimator.ts
// Gemini 3.8 / LLM Animation Keyframe Parser for Game Dev Lab

export interface Keyframe {
  time: number; // 0.0 to 1.0 (normalized)
  spineRotation: [number, number, number];
  headRotation: [number, number, number];
  leftArm: [number, number, number];
  rightArm: [number, number, number];
  leftLeg: [number, number, number];
  rightLeg: [number, number, number];
  cameraOrbitSpeed: number;
}

export interface VFXEvent {
  type: 'water_freeze' | 'particle_shatter' | 'logo_formation' | 'zero_g' | 'shockwave';
  at: number; // Normalized time (0.0 to 1.0)
  duration: number;
  target: string;
  intensity: number;
}

export interface AnimationScript {
  id: string;
  prompt: string;
  style: string;
  durationSeconds: number;
  unrealMode: boolean;
  keyframes: Keyframe[];
  vfxEvents: VFXEvent[];
  cameraPath: Array<{ time: number; position: [number, number, number]; target: [number, number, number] }>;
}

/**
 * Parses user animation prompt and synthesizes complete impossible keyframe sequence.
 */
export function generateAnimationFromPrompt(
  prompt: string,
  style: string = 'NEX Unreal',
  unrealMode: boolean = true
): AnimationScript {
  const p = prompt.toLowerCase();

  const isBackflip = p.includes('backflip') || p.includes('flip') || p.includes('spin') || p.includes('dodge');
  const isFreeze = p.includes('freeze') || p.includes('ice') || p.includes('cold');
  const isShatter = p.includes('shatter') || p.includes('smash') || p.includes('explode') || p.includes('particle');
  const isLogo = p.includes('logo') || p.includes('nex');

  // Synthesize keyframes (10 sampling intervals)
  const keyframes: Keyframe[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10.0;
    let spineRotX = 0;
    let spineRotY = 0;
    let spineRotZ = 0;
    let camSpeed = 1.0;

    if (unrealMode) {
      if (t < 0.3) {
        // Jump prep and early launch
        spineRotX = t * Math.PI * 3.0;
        camSpeed = 1.5;
      } else if (t <= 0.6) {
        // Impossible mid-air freeze catch & 360 Matrix rotation
        spineRotX = Math.PI * 4.0 + Math.sin(t * Math.PI * 4) * 0.5;
        spineRotY = (t - 0.3) * Math.PI * 6.0; // 1080 deg spin
        camSpeed = 8.0; // Matrix 360 bullet time camera spin
      } else {
        // Supersonic dive and impact recovery
        spineRotX = Math.PI * 6.0;
        spineRotY = 0;
        camSpeed = 2.0;
      }
    } else {
      spineRotX = t * Math.PI * 2.0;
    }

    keyframes.push({
      time: t,
      spineRotation: [spineRotX, spineRotY, spineRotZ],
      headRotation: [0, Math.sin(t * Math.PI * 2) * 0.4, 0],
      leftArm: [Math.sin(t * Math.PI * 4) * 1.2, 0, Math.cos(t * Math.PI * 4) * 0.8],
      rightArm: [-Math.sin(t * Math.PI * 4) * 1.2, 0, -Math.cos(t * Math.PI * 4) * 0.8],
      leftLeg: [Math.cos(t * Math.PI * 2) * 0.8, 0, 0],
      rightLeg: [-Math.cos(t * Math.PI * 2) * 0.8, 0, 0],
      cameraOrbitSpeed: camSpeed
    });
  }

  // Synthesize VFX events
  const vfxEvents: VFXEvent[] = [];
  if (isFreeze || unrealMode) {
    vfxEvents.push({
      type: 'water_freeze',
      at: 0.35,
      duration: 0.25,
      target: 'iphone_water_surface',
      intensity: 2.5
    });
  }

  if (isShatter || unrealMode) {
    vfxEvents.push({
      type: 'particle_shatter',
      at: 0.50,
      duration: 0.3,
      target: 'phones_collision_core',
      intensity: 3.0
    });
  }

  if (isLogo || unrealMode) {
    vfxEvents.push({
      type: 'logo_formation',
      at: 0.65,
      duration: 0.35,
      target: 'shards_to_nex_logo',
      intensity: 2.8
    });
  }

  // Camera 360 Matrix orbit path
  const cameraPath = [
    { time: 0.0, position: [0, 3, 10] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
    { time: 0.4, position: [8, 6, 2] as [number, number, number], target: [0, 4, 0] as [number, number, number] },
    { time: 0.6, position: [-6, 5, -8] as [number, number, number], target: [0, 4, 0] as [number, number, number] },
    { time: 1.0, position: [0, 2, 8] as [number, number, number], target: [0, 1, 0] as [number, number, number] }
  ];

  return {
    id: `anim-${Date.now()}`,
    prompt,
    style,
    durationSeconds: unrealMode ? 6.0 : 4.0,
    unrealMode,
    keyframes,
    vfxEvents,
    cameraPath
  };
}
