# AURUM-IX // High-Luxury FPS Shooter Game Asset
**Engineered by NEXIUM AI // NEXO-TECHNOLOGIES**

A production-grade, AAA-quality High-Luxury First-Person Shooter (FPS) game asset suite with 24-Karat Gold plating, brushed titanium damascene, procedural recoil physics, procedural Web Audio sound synthesis, and multi-engine game SDK integration.

---

## 📁 Asset Directory Structure

```
C:\Users\Baha\Desktop\ASSET\
├── index.html                   # Interactive 3D Playable WebGL Demo & Asset Viewer (WASD + PointerLock)
├── generate_glb.py              # Procedural glTF 2.0 Binary GLB Generator (Python Standard Library)
├── models/
│   ├── luxury_plasma_railgun.glb # Complete 3D Weapon Model (Gold, Titanium, Holographic Scope, Plasma Core)
│   └── combat_target_drone.glb   # Floating Combat Target Drone Model (Gold Shield Rings, Sensor Eye)
├── textures/                    # 2K PBR Metallic & Roughness Maps
│   ├── Metal034_*               # 2K Gold / Brass / Bronze PBR Maps (Color, Roughness, Normal, Metalness)
│   └── Metal048A_*              # 2K Titanium / Damascus Steel PBR Maps (Color, Roughness, Normal, Metalness)
├── unity/
│   └── LuxuryFPSController.cs   # Unity 3D C# Weapon Controller (Sway, ADS, Recoil, Audio, Raycast)
├── unreal5/
│   ├── LuxuryWeaponActor.h      # Unreal Engine 5 C++ Actor Header
│   └── LuxuryWeaponActor.cpp    # Unreal Engine 5 C++ Actor Implementation
├── godot4/
│   └── luxury_fps_weapon.gd     # Godot 4.x GDScript FPS Controller
└── r3f/
    └── LuxuryFPSWeapon.tsx      # React Three Fiber / Next.js Component for WebGL & Three.js Apps
```

---

## 🎮 Playable Interactive Demo (`index.html`)

Simply double-click `index.html` to open it in Chrome, Edge, or any modern web browser:

| Control | Action |
|---|---|
| **W, A, S, D** | Move around the luxury obsidian cyber-arena |
| **Mouse** | Aim and look around |
| **Left Click** | Fire Plasma Railgun with procedural recoil kick and light flash |
| **Right Click** | Aim Down Sights (ADS) through the diamond crystal holographic optic |
| **R** | Mechanical Titanium Reload sequence |
| **F** | Weapon Inspect animation (360° rotation) |
| **Escape** | Release cursor from PointerLock |

---

## 🛠️ Engine Integration Guides

### 1. Unity (URP / HDRP)
1. Drag `models/luxury_plasma_railgun.glb` into your Unity `Assets/Models` folder.
2. Attach `unity/LuxuryFPSController.cs` to your player camera or weapon holder object.
3. Assign the weapon transform and camera in the Inspector.

### 2. Unreal Engine 5
1. Import `models/luxury_plasma_railgun.glb` as a Static or Skeletal Mesh.
2. Add `unreal5/LuxuryWeaponActor.h` and `.cpp` to your C++ Source folder.
3. Configure the `MuzzleSocket` socket on the barrel end.

### 3. Godot 4.x
1. Import the `.glb` into Godot's FileSystem dock.
2. Attach `godot4/luxury_fps_weapon.gd` to your `WeaponHolder` Node3D.
3. Connect your input actions (`fire`, `ads`).

### 4. React Three Fiber (R3F) & Next.js
```tsx
import { Canvas } from '@react-three/fiber';
import { LuxuryFPSWeapon } from './r3f/LuxuryFPSWeapon';

export default function FPSScene() {
  return (
    <Canvas camera={{ fov: 75 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 15]} intensity={1.8} />
      <LuxuryFPSWeapon isAiming={false} goldRoughness={0.1} coreGlow={2.5} />
    </Canvas>
  );
}
```

---

## ⚡ 100% Procedural Audio
No audio files required! The web interactive demo uses the browser's native **Web Audio API** to generate sub-bass titanium punch waves, high-frequency plasma zaps, mechanical chamber clicks, and golden harmonic hit chimes in real-time.
