'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useNexStore } from '@/lib/store';

export default function NexCoreCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollProgress = useNexStore((s) => s.scrollProgress);
  const activeWaypoint = useNexStore((s) => s.activeWaypoint);

  // CAD Callout coordinates in screen space
  const [cadMarkers, setCadMarkers] = useState<{
    reels: { x: number; y: number; visible: boolean };
    chat: { x: number; y: number; visible: boolean };
    status: { x: number; y: number; visible: boolean };
  }>({
    reels: { x: 0, y: 0, visible: false },
    chat: { x: 0, y: 0, visible: false },
    status: { x: 0, y: 0, visible: false },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05080c, 0.045);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const emeraldLight = new THREE.PointLight(0x00ff88, 3.5, 20);
    emeraldLight.position.set(3, 4, 4);
    scene.add(emeraldLight);

    const cyanLight = new THREE.PointLight(0x00f2ff, 3.0, 20);
    cyanLight.position.set(-3, -3, 3);
    scene.add(cyanLight);

    // 3. Central Assembly Group
    const assemblyGroup = new THREE.Group();
    scene.add(assemblyGroup);

    // Geometry Helpers
    const isMobile = window.innerWidth < 768;
    const baseScale = isMobile ? 0.65 : 1.0;
    assemblyGroup.scale.set(baseScale, baseScale, baseScale);

    // --- MONOLITHIC NEXCORE PRISM ---
    const prismGeo = new THREE.BoxGeometry(2.4, 3.2, 1.2);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a141d,
      metalness: 0.85,
      roughness: 0.15,
      transmission: 0.6,
      transparent: true,
      opacity: 0.75,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    assemblyGroup.add(prismMesh);

    // Glowing Wireframe Edges on Prism
    const prismEdges = new THREE.EdgesGeometry(prismGeo);
    const prismWireMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.8,
    });
    const prismWire = new THREE.LineSegments(prismEdges, prismWireMat);
    prismMesh.add(prismWire);

    // Glowing Core Sphere Inside
    const coreGeo = new THREE.IcosahedronGeometry(0.55, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    prismMesh.add(coreMesh);

    // --- 3 EXPLODED CAD FLOATING PANES ---
    // Pane 1: Reels 9:16 Stage (Left)
    const reelsGeo = new THREE.PlaneGeometry(1.35, 2.4);
    const reelsMat = new THREE.MeshStandardMaterial({
      color: 0x0d1822,
      emissive: 0x00ff88,
      emissiveIntensity: 0.15,
      roughness: 0.3,
      metalness: 0.7,
      side: THREE.DoubleSide,
    });
    const reelsMesh = new THREE.Mesh(reelsGeo, reelsMat);
    const reelsEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(reelsGeo),
      new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 2 })
    );
    reelsMesh.add(reelsEdges);
    assemblyGroup.add(reelsMesh);

    // Pane 2: NexChat Core Messaging (Center)
    const chatGeo = new THREE.PlaneGeometry(1.6, 2.5);
    const chatMat = new THREE.MeshStandardMaterial({
      color: 0x101b26,
      emissive: 0x00f2ff,
      emissiveIntensity: 0.2,
      roughness: 0.2,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const chatMesh = new THREE.Mesh(chatGeo, chatMat);
    const chatEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(chatGeo),
      new THREE.LineBasicMaterial({ color: 0x00f2ff, linewidth: 2 })
    );
    chatMesh.add(chatEdges);
    assemblyGroup.add(chatMesh);

    // Floating 3D Message Capsules on Chat Pane
    const bubbleGeo = new THREE.BoxGeometry(0.9, 0.22, 0.05);
    const bubbleMatMe = new THREE.MeshBasicMaterial({ color: 0x005c4b });
    const bubbleMatThem = new THREE.MeshBasicMaterial({ color: 0x202c33 });
    const bubble1 = new THREE.Mesh(bubbleGeo, bubbleMatThem);
    bubble1.position.set(-0.2, 0.6, 0.04);
    chatMesh.add(bubble1);
    const bubble2 = new THREE.Mesh(bubbleGeo, bubbleMatMe);
    bubble2.position.set(0.25, 0.2, 0.04);
    chatMesh.add(bubble2);
    const bubble3 = new THREE.Mesh(bubbleGeo, bubbleMatThem);
    bubble3.position.set(-0.2, -0.2, 0.04);
    chatMesh.add(bubble3);

    // Pane 3: Status Vault Stage (Right)
    const statusGeo = new THREE.PlaneGeometry(1.35, 2.4);
    const statusMat = new THREE.MeshStandardMaterial({
      color: 0x0c1520,
      emissive: 0x00ff88,
      emissiveIntensity: 0.15,
      roughness: 0.3,
      metalness: 0.7,
      side: THREE.DoubleSide,
    });
    const statusMesh = new THREE.Mesh(statusGeo, statusMat);
    const statusEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(statusGeo),
      new THREE.LineBasicMaterial({ color: 0x00ff88 })
    );
    statusMesh.add(statusEdges);
    assemblyGroup.add(statusMesh);

    // Concentric laser rings on status pane
    const ringGeo = new THREE.RingGeometry(0.3, 0.35, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 0.35, 0.03);
    statusMesh.add(ringMesh);

    // --- SMARTPHONE CHASSIS CONVERGENCE MESH ---
    const chassisGeo = new THREE.BoxGeometry(2.0, 3.8, 0.18);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x070b0f,
      metalness: 0.95,
      roughness: 0.1,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    const chassisEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(chassisGeo),
      new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.6 })
    );
    chassisMesh.add(chassisEdges);
    chassisMesh.visible = false;
    assemblyGroup.add(chassisMesh);

    // --- FLOATING 3D TUNNEL DATA PACKETS ---
    const packetCount = isMobile ? 60 : 160;
    const packetGroup = new THREE.Group();
    scene.add(packetGroup);

    const packetPGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const packetPMat1 = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const packetPMat2 = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

    const packets: THREE.Mesh[] = [];
    for (let i = 0; i < packetCount; i++) {
      const p = new THREE.Mesh(packetPGeo, i % 2 === 0 ? packetPMat1 : packetPMat2);
      p.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 20
      );
      packetGroup.add(p);
      packets.push(p);
    }

    // Anchor helper for screen projection
    const tempVec = new THREE.Vector3();
    function projectToScreen(obj: THREE.Object3D) {
      obj.getWorldPosition(tempVec);
      tempVec.project(camera);
      const x = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(tempVec.y * 0.5) + 0.5) * window.innerHeight;
      return { x, y, inFront: tempVec.z < 1 };
    }

    // 4. Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    function renderFrame() {
      animId = requestAnimationFrame(renderFrame);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Read live scroll progress from Zustand store directly for zero latency
      const progress = useNexStore.getState().scrollProgress;

      // Rotate inner quantum core
      coreMesh.rotation.x += delta * 0.8;
      coreMesh.rotation.y += delta * 1.2;

      // Animate background data packets
      packetGroup.children.forEach((p, idx) => {
        p.rotation.x += delta * 0.5;
        p.rotation.y += delta * 0.5;
        if (progress > 0.45 && progress < 0.85) {
          p.position.z += delta * 8;
          if (p.position.z > 6) p.position.z = -14;
        }
      });

      // --- 5-WAYPOINT SCROLL CALCULUS ---
      if (progress < 0.25) {
        // WAYPOINT 1: Monolithic NexCore Prism
        const local = progress / 0.25;
        prismMesh.visible = true;
        prismMesh.scale.setScalar(1 - local * 0.15);
        prismMesh.rotation.y = local * 0.8 + time * 0.15;
        prismMesh.rotation.x = 0.15 * Math.sin(time * 0.8);

        reelsMesh.visible = false;
        chatMesh.visible = false;
        statusMesh.visible = false;
        chassisMesh.visible = false;

        camera.position.set(0, 0, 7.5 - local * 1.0);
        camera.lookAt(0, 0, 0);

        setCadMarkers({
          reels: { x: 0, y: 0, visible: false },
          chat: { x: 0, y: 0, visible: false },
          status: { x: 0, y: 0, visible: false },
        });
      } else if (progress >= 0.25 && progress < 0.50) {
        // WAYPOINT 2: Exploded CAD Architectural Disassembly
        const local = (progress - 0.25) / 0.25;
        prismMesh.visible = true;
        prismMat.opacity = Math.max(0.1, 0.7 - local * 0.6);
        prismMesh.scale.setScalar(0.85 - local * 0.3);

        reelsMesh.visible = true;
        chatMesh.visible = true;
        statusMesh.visible = true;
        chassisMesh.visible = false;

        // Explode outward along X & Z
        const explodeDistance = isMobile ? 1.4 : 2.5;
        reelsMesh.position.set(-explodeDistance * local, 0.15 * Math.sin(time), 0.6 * local);
        reelsMesh.rotation.y = 0.35 * (1 - local) + 0.25;

        chatMesh.position.set(0, 0, 0.9 * local);
        chatMesh.rotation.y = 0;

        statusMesh.position.set(explodeDistance * local, -0.15 * Math.sin(time), 0.6 * local);
        statusMesh.rotation.y = -0.35 * (1 - local) - 0.25;

        assemblyGroup.rotation.y = (local - 0.5) * 0.5;
        camera.position.set(0, 0, 6.5);
        camera.lookAt(0, 0, 0);

        // Calculate 2D Screen CAD Markers
        const reelsCoord = projectToScreen(reelsMesh);
        const chatCoord = projectToScreen(chatMesh);
        const statusCoord = projectToScreen(statusMesh);

        setCadMarkers({
          reels: { x: reelsCoord.x, y: reelsCoord.y, visible: reelsCoord.inFront && local > 0.1 },
          chat: { x: chatCoord.x, y: chatCoord.y, visible: chatCoord.inFront && local > 0.1 },
          status: { x: statusCoord.x, y: statusCoord.y, visible: statusCoord.inFront && local > 0.1 },
        });
      } else if (progress >= 0.50 && progress < 0.75) {
        // WAYPOINT 3: Hacker Terminal Deep Dive
        const local = (progress - 0.50) / 0.25;
        prismMesh.visible = false;
        reelsMesh.visible = true;
        chatMesh.visible = true;
        statusMesh.visible = true;
        chassisMesh.visible = false;

        // Camera plunges forward through Chat Pane into the tunnel
        camera.position.z = 6.5 - local * 8.0;
        camera.position.y = Math.sin(time * 1.5) * 0.2;
        camera.lookAt(0, 0, camera.position.z - 5);

        assemblyGroup.rotation.z = local * 0.3;

        setCadMarkers({
          reels: { x: 0, y: 0, visible: false },
          chat: { x: 0, y: 0, visible: false },
          status: { x: 0, y: 0, visible: false },
        });
      } else if (progress >= 0.75 && progress < 0.90) {
        // WAYPOINT 4: Subsystem Convergence into Mobile Chassis
        const local = (progress - 0.75) / 0.15;
        camera.position.set(0, 0, 5.8);
        camera.lookAt(0, 0, 0);
        assemblyGroup.rotation.set(0, 0, 0);

        prismMesh.visible = false;
        reelsMesh.visible = true;
        chatMesh.visible = true;
        statusMesh.visible = true;
        chassisMesh.visible = true;

        // Panes converge back inward into chassis
        const convergeDist = (1 - local) * (isMobile ? 1.4 : 2.5);
        reelsMesh.position.set(-convergeDist, 0, 0.05 * (1 - local));
        statusMesh.position.set(convergeDist, 0, 0.05 * (1 - local));
        chatMesh.position.set(0, 0, 0.08);

        reelsMesh.rotation.y = 0;
        statusMesh.rotation.y = 0;
        chassisMesh.scale.setScalar(0.7 + local * 0.3);

        setCadMarkers({
          reels: { x: 0, y: 0, visible: false },
          chat: { x: 0, y: 0, visible: false },
          status: { x: 0, y: 0, visible: false },
        });
      } else {
        // WAYPOINT 5: Production Unlock Dock
        camera.position.set(0, 0, 5.2);
        camera.lookAt(0, 0, 0);

        chassisMesh.visible = true;
        chatMesh.visible = true;
        reelsMesh.visible = false;
        statusMesh.visible = false;
        prismMesh.visible = false;

        chassisMesh.position.set(0, 0, 0);
        chatMesh.position.set(0, 0, 0.1);

        assemblyGroup.rotation.y = Math.sin(time * 0.6) * 0.08;
      }

      renderer.render(scene, camera);
    }

    renderFrame();

    // Resize listener
    function handleResize() {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      const isMob = w < 768;
      assemblyGroup.scale.setScalar(isMob ? 0.65 : 1.0);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      prismGeo.dispose();
      prismMat.dispose();
      reelsGeo.dispose();
      reelsMat.dispose();
      chatGeo.dispose();
      chatMat.dispose();
      statusGeo.dispose();
      statusMat.dispose();
      chassisGeo.dispose();
      chassisMat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Dynamic SVG CAD Disassembly Callout Overlays */}
      {cadMarkers.reels.visible && (
        <div
          className="absolute z-20 transition-opacity duration-150"
          style={{
            left: `${cadMarkers.reels.x}px`,
            top: `${cadMarkers.reels.y}px`,
            transform: 'translate(-100%, -50%)',
          }}
        >
          <div className="flex items-center gap-2 pr-3">
            <div className="bg-[#0A0E13]/90 border border-[#00FF88] px-3 py-1 rounded font-mono text-[11px] text-[#00FF88] shadow-lg shadow-[#00FF88]/20 backdrop-blur-md">
              <span className="font-bold">// REELS_9:16</span> [X:-2.4 Y:+0.1]
            </div>
            <div className="w-8 h-[1px] bg-[#00FF88]" />
            <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
          </div>
        </div>
      )}

      {cadMarkers.chat.visible && (
        <div
          className="absolute z-20 transition-opacity duration-150"
          style={{
            left: `${cadMarkers.chat.x}px`,
            top: `${cadMarkers.chat.y - 70}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-[#0A0E13]/90 border border-[#00F2FF] px-3 py-1 rounded font-mono text-[11px] text-[#00F2FF] shadow-lg shadow-[#00F2FF]/20 backdrop-blur-md">
              <span className="font-bold">// CHAT_CORE</span> [AES-256 ZERO_KNOWLEDGE]
            </div>
            <div className="h-8 w-[1px] bg-[#00F2FF]" />
            <div className="w-2 h-2 rounded-full bg-[#00F2FF] animate-ping" />
          </div>
        </div>
      )}

      {cadMarkers.status.visible && (
        <div
          className="absolute z-20 transition-opacity duration-150"
          style={{
            left: `${cadMarkers.status.x}px`,
            top: `${cadMarkers.status.y}px`,
            transform: 'translate(0, -50%)',
          }}
        >
          <div className="flex items-center gap-2 pl-3">
            <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
            <div className="w-8 h-[1px] bg-[#00FF88]" />
            <div className="bg-[#0A0E13]/90 border border-[#00FF88] px-3 py-1 rounded font-mono text-[11px] text-[#00FF88] shadow-lg shadow-[#00FF88]/20 backdrop-blur-md">
              <span className="font-bold">// STATUS_VAULT</span> [EPHEMERAL 24H]
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
