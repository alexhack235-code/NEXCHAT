import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type AssetMountTarget = 'player' | 'vehicle' | 'landmark' | 'drone';

export interface AssetPreset {
  id: string;
  name: string;
  category: 'character' | 'vehicle' | 'landmark' | 'drone';
  url: string;
  target: AssetMountTarget;
  scale: number;
  description: string;
  source: string;
}

export interface LoadedAssetData {
  id: string;
  name: string;
  url: string;
  target: AssetMountTarget;
  group: THREE.Group;
  mixer?: THREE.AnimationMixer;
  animations?: THREE.AnimationClip[];
  meshCount: number;
  triangleCount: number;
  vertexCount: number;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  errorMessage?: string;
}

export const ONLINE_ASSET_PRESETS: AssetPreset[] = [
  {
    id: 'specops_cesium',
    name: 'TACTICAL OPERATIVE // CESIUM-MAN',
    category: 'character',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    target: 'player',
    scale: 1.1,
    description: 'High-poly rigged spec-ops tactical operative model with skeletal motion frames.',
    source: 'Khronos glTF Sample Models (Open Access)',
  },
  {
    id: 'cyber_mech',
    name: 'EXPRESSIVE BATTLE DROID // ROBOT-X',
    category: 'character',
    url: 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    target: 'player',
    scale: 0.5,
    description: 'Full sci-fi autonomous combat android with articulated limbs and head servo tracking.',
    source: 'Three.js Official Assets CDN',
  },
  {
    id: 'damaged_helmet_pbr',
    name: 'COMBAT CYBER HELMET // ULTRA PBR',
    category: 'landmark',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    target: 'landmark',
    scale: 4.8,
    description: 'Ultra-realistic AAA damaged tactical visor with roughness, metalness, and normal maps.',
    source: 'Khronos glTF Sample Models (Open Access)',
  },
  {
    id: 'boombox_core',
    name: 'QUANTUM SONIC TRANSMITTER',
    category: 'landmark',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    target: 'landmark',
    scale: 60.0,
    description: 'PBR military audio relay unit with high-frequency electromagnetic baffles.',
    source: 'Khronos glTF Sample Models (Open Access)',
  },
  {
    id: 'local_character',
    name: 'LOCAL CUSTOM OPERATIVE',
    category: 'character',
    url: '/models/character.glb',
    target: 'player',
    scale: 1.0,
    description: 'Offline asset placed in public/models/character.glb. 0ms latency, zero CORS.',
    source: 'Local Workspace Storage',
  },
  {
    id: 'local_car',
    name: 'LOCAL CUSTOM COMBAT CAR',
    category: 'vehicle',
    url: '/models/car.glb',
    target: 'vehicle',
    scale: 1.0,
    description: 'Offline asset placed in public/models/car.glb. Replaces active vehicle chassis.',
    source: 'Local Workspace Storage',
  },
];

type AssetMountCallback = (data: LoadedAssetData) => void;

class AssetLoaderService {
  private loader: GLTFLoader;
  private listeners: Set<AssetMountCallback> = new Set();
  private loadedCache: Map<string, LoadedAssetData> = new Map();
  public activeAssets: Record<AssetMountTarget, LoadedAssetData | null> = {
    player: null,
    vehicle: null,
    landmark: null,
    drone: null,
  };

  constructor() {
    this.loader = new GLTFLoader();
  }

  public subscribe(callback: AssetMountCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(data: LoadedAssetData) {
    this.listeners.forEach((cb) => cb(data));
  }

  public async loadAsset(
    url: string,
    target: AssetMountTarget,
    customName?: string,
    targetScale = 1.0,
    onProgress?: (percent: number) => void
  ): Promise<LoadedAssetData> {
    const id = `${target}_${url}`;
    const name = customName || url.split('/').pop()?.replace('.glb', '').replace('.gltf', '') || 'IMPORTED_ASSET';

    const assetRecord: LoadedAssetData = {
      id,
      name,
      url,
      target,
      group: new THREE.Group(),
      meshCount: 0,
      triangleCount: 0,
      vertexCount: 0,
      status: 'loading',
    };

    this.notify(assetRecord);

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const root = gltf.scene;
          let meshCount = 0;
          let triangleCount = 0;
          let vertexCount = 0;

          // Compute Bounding Box to normalize scale and center position
          const box = new THREE.Box3().setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          // Center mesh around origin
          root.position.x = -center.x;
          root.position.y = -box.min.y; // Pin base to ground
          root.position.z = -center.z;

          // Scale normalization if model is too large or small
          let normalizedScale = targetScale;
          if (maxDim > 0 && (maxDim > 50 || maxDim < 0.1)) {
            normalizedScale = (2.0 / maxDim) * targetScale;
          }

          const container = new THREE.Group();
          container.add(root);
          container.scale.setScalar(normalizedScale);

          // Traverse meshes for PBR enhancement and shadow maps
          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              meshCount++;

              if (mesh.geometry) {
                const geom = mesh.geometry;
                if (geom.index) {
                  triangleCount += geom.index.count / 3;
                } else if (geom.attributes.position) {
                  triangleCount += geom.attributes.position.count / 3;
                }
                if (geom.attributes.position) {
                  vertexCount += geom.attributes.position.count;
                }
              }

              // Enhance standard materials with physical reflections
              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat) => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.envMapIntensity = 1.4;
                    mat.roughness = Math.min(mat.roughness, 0.7);
                  }
                });
              }
            }
          });

          // Animation setup
          let mixer: THREE.AnimationMixer | undefined;
          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(root);
            const firstAction = mixer.clipAction(gltf.animations[0]);
            firstAction.play();
          }

          const completeData: LoadedAssetData = {
            id,
            name,
            url,
            target,
            group: container,
            mixer,
            animations: gltf.animations,
            meshCount,
            triangleCount: Math.round(triangleCount),
            vertexCount,
            status: 'loaded',
          };

          this.loadedCache.set(id, completeData);
          this.activeAssets[target] = completeData;
          this.notify(completeData);
          resolve(completeData);
        },
        (xhr) => {
          if (xhr.lengthComputable && onProgress) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            onProgress(percent);
          }
        },
        (error) => {
          const errText = error instanceof Error ? error.message : 'Network/CORS error while loading 3D asset';
          const failedData: LoadedAssetData = {
            id,
            name,
            url,
            target,
            group: new THREE.Group(),
            meshCount: 0,
            triangleCount: 0,
            vertexCount: 0,
            status: 'error',
            errorMessage: errText,
          };
          this.notify(failedData);
          reject(new Error(errText));
        }
      );
    });
  }

  public removeAsset(target: AssetMountTarget) {
    const existing = this.activeAssets[target];
    if (existing) {
      this.activeAssets[target] = null;
      this.notify({
        ...existing,
        status: 'idle',
      });
    }
  }
}

export const assetLoader = new AssetLoaderService();
