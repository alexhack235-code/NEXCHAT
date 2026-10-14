'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  PhysicsSettings,
  computeAcrobaticPose,
  computePhoneTrajectory,
  generateNEXLogoPoints
} from '../lib/unrealPhysics';

interface Viewport3DProps {
  currentTime: number; // 0.0 to 1.0 (normalized)
  settings: PhysicsSettings;
  characterId: string;
  environmentId: string;
  activeVFX: string[];
}

export default function Viewport3D({
  currentTime,
  settings,
  characterId,
  environmentId,
  activeVFX
}: Viewport3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState(60);
  const [vertexCount, setVertexCount] = useState('118,400');

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const charMeshRef = useRef<THREE.Group | null>(null);
  const iphoneRef = useRef<THREE.Group | null>(null);
  const samsungRef = useRef<THREE.Group | null>(null);
  const particleSysRef = useRef<THREE.Points | null>(null);
  const logoTargetsRef = useRef<Float32Array | null>(null);
  const randomShardOriginsRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060609);
    scene.fog = new THREE.FogExp2(0x060609, 0.035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 11);
    cameraRef.current = camera;

    // 3. Renderer with Antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00ff88, 2.5);
    dirLight.position.set(5, 12, 7);
    scene.add(dirLight);

    const pinkRimLight = new THREE.SpotLight(0xfe2c55, 3.5);
    pinkRimLight.position.set(-6, 8, -4);
    scene.add(pinkRimLight);

    // 5. Cryo Stage Grid Floor
    const grid = new THREE.GridHelper(30, 30, 0x00ff88, 0x1f1f2e);
    grid.position.y = 0;
    scene.add(grid);

    // 6. Rigged Acrobatic Character (Cyborg Shinobi Group)
    const charGroup = new THREE.Group();

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.28, 1.2, 16);
    const charMat = new THREE.MeshStandardMaterial({
      color: 0x121218,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x003322,
      emissiveIntensity: 0.5
    });
    const torso = new THREE.Mesh(torsoGeo, charMat);
    torso.position.y = 1.4;
    charGroup.add(torso);

    // Head with Cyber Visor
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const head = new THREE.Mesh(headGeo, charMat);
    head.position.y = 2.25;
    const visorGeo = new THREE.BoxGeometry(0.32, 0.08, 0.2);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 2.25, 0.18);
    charGroup.add(head);
    charGroup.add(visor);

    // Limbs
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x222230, metalness: 0.8, roughness: 0.3 });
    const armLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), limbMat);
    armLeft.position.set(-0.55, 1.4, 0);
    charGroup.add(armLeft);

    const armRight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), limbMat);
    armRight.position.set(0.55, 1.4, 0);
    charGroup.add(armRight);

    scene.add(charGroup);
    charMeshRef.current = charGroup;

    // 7. iPhone 18 Pro Model
    const iphoneGroup = new THREE.Group();
    const phoneGeo = new THREE.BoxGeometry(0.7, 1.4, 0.08);
    const iphoneMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a2433,
      metalness: 0.95,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const iphoneMesh = new THREE.Mesh(phoneGeo, iphoneMat);
    iphoneGroup.add(iphoneMesh);
    scene.add(iphoneGroup);
    iphoneRef.current = iphoneGroup;

    // 8. Samsung Galaxy S26 Ultra Model
    const samsungGroup = new THREE.Group();
    const samsungMat = new THREE.MeshPhysicalMaterial({
      color: 0x2c1538,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0
    });
    const samsungMesh = new THREE.Mesh(phoneGeo, samsungMat);
    samsungGroup.add(samsungMesh);
    scene.add(samsungGroup);
    samsungRef.current = samsungGroup;

    // 9. Particle System: 10,000 Shards for Explosion & NEX Logo Formation
    const PARTICLE_COUNT = 10000;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    const randomOrigins = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      // Initial burst origins
      randomOrigins[idx] = (Math.random() - 0.5) * 6;
      randomOrigins[idx + 1] = 4.0 + (Math.random() - 0.5) * 4;
      randomOrigins[idx + 2] = (Math.random() - 0.5) * 6;

      particlePositions[idx] = 0;
      particlePositions[idx + 1] = -100; // Hidden initially
      particlePositions[idx + 2] = 0;
    }

    randomShardOriginsRef.current = randomOrigins;
    logoTargetsRef.current = generateNEXLogoPoints(PARTICLE_COUNT);

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      color: 0x00ff88,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.85
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particleSysRef.current = particles;

    // Window resize handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Render loop
    let reqId: number;
    let frameCount = 0;
    let lastTime = performance.now();

    const animateLoop = () => {
      reqId = requestAnimationFrame(animateLoop);
      renderer.render(scene, camera);

      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
    };

    animateLoop();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D Scene when currentTime or settings change
  useEffect(() => {
    if (!charMeshRef.current || !iphoneRef.current || !samsungRef.current || !particleSysRef.current) return;

    // 1. Character Kinematics
    const pose = computeAcrobaticPose(currentTime, settings);
    charMeshRef.current.position.set(...pose.position);
    charMeshRef.current.rotation.set(...pose.rotation);
    charMeshRef.current.scale.set(...pose.scale);

    // 2. Phone Trajectories
    const iphoneTraj = computePhoneTrajectory(currentTime, true, settings);
    const samsungTraj = computePhoneTrajectory(currentTime, false, settings);

    if (iphoneTraj.shattered) {
      iphoneRef.current.position.set(0, -100, 0); // Hide
    } else {
      iphoneRef.current.position.set(...iphoneTraj.position);
      iphoneRef.current.rotation.set(...iphoneTraj.rotation);
    }

    if (samsungTraj.shattered) {
      samsungRef.current.position.set(0, -100, 0); // Hide
    } else {
      samsungRef.current.position.set(...samsungTraj.position);
      samsungRef.current.rotation.set(...samsungTraj.rotation);
    }

    // 3. 10,000 Particle Explosion & Magnetic Logo Assembly
    const posAttr = particleSysRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const origins = randomShardOriginsRef.current;
    const logoTargets = logoTargetsRef.current;

    if (currentTime < 0.45 || !origins || !logoTargets) {
      // Hide particles before collision
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] = -100;
      }
    } else if (currentTime < 0.65) {
      // Explosion outwards from collision point [0, 4.0, 0]
      const explodeProg = (currentTime - 0.45) / 0.2;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] = origins[i] * explodeProg;
        positions[i + 1] = 4.0 + (origins[i + 1] - 4.0) * explodeProg;
        positions[i + 2] = origins[i + 2] * explodeProg;
      }
      (particleSysRef.current.material as THREE.PointsMaterial).color.setHex(0xfe2c55); // Red energy
    } else {
      // Magnetic pull into NEX Logo Target Formation
      const assembleProg = Math.min(1.0, (currentTime - 0.65) / 0.35);
      const ease = 1 - Math.pow(1 - assembleProg, 3); // Cubic ease out
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] = THREE.MathUtils.lerp(origins[i], logoTargets[i], ease);
        positions[i + 1] = THREE.MathUtils.lerp(origins[i + 1], logoTargets[i + 1], ease);
        positions[i + 2] = THREE.MathUtils.lerp(origins[i + 2], logoTargets[i + 2], ease);
      }
      (particleSysRef.current.material as THREE.PointsMaterial).color.setHex(0x00ff88); // Neon Green NEX Logo
    }
    posAttr.needsUpdate = true;

    // 4. Matrix 360 Orbit Camera
    if (cameraRef.current) {
      if (settings.unrealMode && currentTime >= 0.3 && currentTime <= 0.6) {
        // High speed 360 camera spin during Matrix hover catch
        const orbitAngle = currentTime * Math.PI * 6.0;
        cameraRef.current.position.x = Math.sin(orbitAngle) * 9;
        cameraRef.current.position.z = Math.cos(orbitAngle) * 9;
        cameraRef.current.position.y = 5.0;
        cameraRef.current.lookAt(0, 3.5, 0);
      } else {
        cameraRef.current.position.set(0, 4, 11);
        cameraRef.current.lookAt(0, 2.5, 0);
      }
    }
  }, [currentTime, settings]);

  return (
    <div className="w-full h-full relative select-none bg-black overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Telemetry HUD Overlay */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1 font-mono text-[10px] text-neutral-400 bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-[#00FF88] font-bold">UNREAL ENGINE 5.4 SHADER PIPELINE</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>FPS:</span>
          <span className="text-emerald-400 font-bold">{fps} FPS</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Particles:</span>
          <span className="text-white font-bold">{vertexCount} vertices</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Physics Mode:</span>
          <span className={settings.unrealMode ? 'text-[#00FF88] font-bold' : 'text-neutral-300'}>
            {settings.unrealMode ? 'DEFYING REALITY' : 'NEWTONIAN'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>VFX State:</span>
          <span className="text-cyan-400 font-bold">
            {currentTime >= 0.65 ? '✨ NEX LOGO ACTIVE' : currentTime >= 0.45 ? '💥 SHARD BLAST' : currentTime >= 0.35 ? '❄️ NITROGEN FREEZE' : '🏃 BACKFLIP LAUNCH'}
          </span>
        </div>
      </div>

      {/* Water Freeze Vignette when Active */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          currentTime >= 0.35 && currentTime <= 0.65 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-cyan-950/20 to-cyan-500/30" />
      </div>
    </div>
  );
}
