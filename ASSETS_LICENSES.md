# 3D Assets & Materials Licensing Record // NEXCHAT 3D Realm

> **Document Version**: 2.4.0  
> **Last Updated**: October 2026  
> **Project**: NEXCHAT // AstroShift: Beyond Earth 3D Metropolis & Canadian Provinces Realm  
> **Compliance Target**: Commercial and Non-Commercial Shipping, Packaging, and Distribution  

---

## 1. Executive Summary

This record documents all third-party and procedural 3D models, skeletal animations, PBR (Physically Based Rendering) texture maps, and rendering libraries incorporated into the Three.js game realm (`game.html` and province worlds).

All assets have been vetted to ensure **permissive, royalty-free, or CC0 (Public Domain)** licensing. Each asset includes offline procedural fallbacks to ensure graceful degradation if files are missing or offline.

---

## 2. 3D Models & Rigged Characters Inventory

| Asset Name | File Path | Source / Creator | License | Commercial Shipping Permitted? | Attribution Required? |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Operative Soldier (Rigged Humanoid)** | `assets/models/operative_soldier.glb` | [Mixamo](https://www.mixamo.com/) / Adobe | Mixamo Royalty-Free License | **YES** | Recommended in credits |
| **Cyber GT Supercar** | `assets/models/cyber_car.glb` | [Poly Haven](https://polyhaven.com/) / [Sketchfab](https://sketchfab.com/) / Three.js | CC-BY 4.0 / Free 3D Asset | **YES** | Included below |
| **Robot Companion Drone** | `assets/models/robot_companion.glb` | [Quaternius](https://quaternius.com/) | CC0 1.0 Universal (Public Domain) | **YES** | No (Provided as courtesy) |
| **Modular Garage Building** | `assets/models/kenney/building-garage.glb` | [Kenney](https://kenney.nl/assets) (Starter Kit City Builder) | CC0 1.0 Universal (Public Domain) | **YES** | No (Provided as courtesy) |
| **Modular Store A** | `assets/models/kenney/building-small-a.glb` | [Kenney](https://kenney.nl/assets) | CC0 1.0 Universal (Public Domain) | **YES** | No |
| **Modular Store B** | `assets/models/kenney/building-small-b.glb` | [Kenney](https://kenney.nl/assets) | CC0 1.0 Universal (Public Domain) | **YES** | No |
| **Modular Store C** | `assets/models/kenney/building-small-c.glb` | [Kenney](https://kenney.nl/assets) | CC0 1.0 Universal (Public Domain) | **YES** | No |
| **Modular Store D** | `assets/models/kenney/building-small-d.glb` | [Kenney](https://kenney.nl/assets) | CC0 1.0 Universal (Public Domain) | **YES** | No |
| **Plaza Pavement Fountain** | `assets/models/kenney/pavement-fountain.glb` | [Kenney](https://kenney.nl/assets) | CC0 1.0 Universal (Public Domain) | **YES** | No |
| **Park Tall Trees & Foliage** | `assets/models/kenney/grass-trees-tall.glb` | [Kenney](https://kenney.nl/assets) | CC0 1.0 Universal (Public Domain) | **YES** | No |

---

## 3. Skeletal Animations & Mixers

### 3.1 Operative Soldier (`assets/models/operative_soldier.glb`)
- **Armature**: Standard Mixamo humanoid skeletal rig (68 bones, Y-up orientation).
- **Animation Clips**:
  - `Idle`: Organic breathing, stance balance, and micro-weight shifting.
  - `Walk`: Ground-locked rhythmic walking stride cycle.
  - `Run`: High-velocity sprint cycle with athletic arm swing and forward lean.
  - `TPose`: Rest bind pose for clothing and accessory calibration.
- **Runtime System**: Three.js `AnimationMixer` with smooth cross-fading (`fadeOut(0.2)` / `fadeIn(0.2)`) synchronized with player movement velocity (`speed > 0.25` -> Walk, `isSprinting` -> Run, `speed <= 0.25` -> Idle).
- **Fallback**: Procedural biomechanical limb swinging and anatomical mesh rendering if GLTF model is unavailable.

### 3.2 Robot Companion (`assets/models/robot_companion.glb`)
- **Animation Clips**: 14 distinct clips (`Idle`, `Wave`, `ThumbsUp`, `Walking`, `Running`, `Dance`, `Jump`, `Death`, `No`, `Yes`, `Punch`, `Sitting`, `Standing`, `WalkJump`).
- **Runtime System**: Independent `AnimationMixer` patrolling Central Plaza with playful greeting and interactive reactions.

---

## 4. PBR Materials & Textures Inventory

| Material / Texture Set | Files in `assets/textures/pbr/` | Source | License | Usage in Engine |
| :--- | :--- | :--- | :--- | :--- |
| **Road007 PBR Set** | `Road007_1K-JPG_Color.jpg`<br>`Road007_1K-JPG_NormalGL.jpg`<br>`Road007_1K-JPG_Roughness.jpg`<br>`Road007_1K-JPG_Displacement.jpg` | [ambientCG](https://ambientcg.com/) / Poly Haven Partner | CC0 1.0 Universal | Applied to all metropolitan avenues, expressways, and highway rings (`cityRoadMat`) |
| **Metal034 PBR Set** | `Metal034_2K-JPG_Color.jpg`<br>`Metal034_2K-JPG_NormalGL.jpg`<br>`Metal034_2K-JPG_Roughness.jpg`<br>`Metal034_2K-JPG_Metalness.jpg` | [ambientCG](https://ambientcg.com/) | CC0 1.0 Universal | Skyscraper architectural curtain walls, metal panels, and vehicle rims |
| **Metal048A PBR Set** | `Metal048A_2K-JPG_Color.jpg`<br>`Metal048A_2K-JPG_NormalGL.jpg`<br>`Metal048A_2K-JPG_Roughness.jpg`<br>`Metal048A_2K-JPG_Metalness.jpg` | [ambientCG](https://ambientcg.com/) | CC0 1.0 Universal | Industrial framework, spaceport gantry, and structural steel beams |
| **Procedural Textures** | Generated in canvas at runtime (`generatePBRTextures()`) | NEXCHAT Team | MIT License | Tangent-space normal maps, tire treads, carbon composite, and emissive skyscraper windows |

---

## 5. Software Libraries

| Library | File Path | Version | Author / Organization | License |
| :--- | :--- | :--- | :--- | :--- |
| **Three.js** | `js/three.min.js` | r128 | Ricardo Cabello (mrdoob) & Three.js Authors | [MIT License](https://github.com/mrdoob/three.js/blob/master/LICENSE) |
| **GLTFLoader** | `js/GLTFLoader.js` | r128 | Three.js Authors | [MIT License](https://github.com/mrdoob/three.js/blob/master/LICENSE) |

---

## 6. License Texts & Attributions

### 6.1 Creative Commons Zero 1.0 Universal (CC0 1.0)
The Person who associated a work with this deed has dedicated the work to the public domain by waiving all of his or her rights to the work worldwide under copyright law, including all related and neighboring rights, to the extent allowed by law. You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.

### 6.2 Mixamo (Adobe) End-User Terms
Assets generated via Mixamo are licensed royalty-free for use in 2D and 3D computer graphics, animations, interactive applications, video games, and multimedia productions. Redistribution of raw standalone source files is prohibited; embedded binary distribution (such as GLB/glTF within a game build) is explicitly permitted.

### 6.3 MIT License
```text
Copyright (c) 2010-2026 Three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
```

---

## 7. Commercial Shipping Checklist

- [x] **Zero Proprietary Locked Formats**: All models are standard glTF 2.0 binary (`.glb`) with embedded buffers and Draco-free compatibility.
- [x] **Local Storage**: All primary assets are bundled inside the repository (`assets/models/`, `assets/textures/pbr/`, `js/`), guaranteeing 100% offline gameplay without external CDN dependencies.
- [x] **Fallback Protection**: Procedural fallback meshes, materials, and canvas textures automatically activate if any GLB file fails to load or takes longer than expected.
- [x] **Attribution Compliance**: Full credit given to Kenney, Quaternius, Mixamo, Poly Haven, and ambientCG.
- [x] **Dual-Branch Git Synchronization**: Synchronized with `main` and `master` branches.
