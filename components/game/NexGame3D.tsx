'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore, WeaponType, VehicleType, LocationType, WEAPON_REGISTRY, VEHICLE_REGISTRY, StarshipFlightPhase } from '@/lib/gameStore';
import { gameAudio } from '@/lib/gameAudio';
import { assetLoader, LoadedAssetData } from '@/lib/assetLoader';
import { physicsWorld, BoxCollider, CapsuleCollider, RigidBody } from '@/lib/physicsEngine';

interface TouchControls {
  forward: number;
  strafe: number;
  shooting: boolean;
  jumping: boolean;
}

// ============================================================
// HIGH-RESOLUTION PROCEDURAL TEXTURES (0 EMOJIS)
// ============================================================

function createModernSkyscraperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#060a10';
    ctx.fillRect(0, 0, 1024, 2048);

    const skyGrad = ctx.createLinearGradient(0, 0, 1024, 2048);
    skyGrad.addColorStop(0, 'rgba(0, 242, 255, 0.08)');
    skyGrad.addColorStop(0.5, 'rgba(10, 20, 30, 0.4)');
    skyGrad.addColorStop(1, 'rgba(0, 255, 136, 0.05)');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1024, 2048);

    const mullionCols = 16;
    const colWidth = 1024 / mullionCols;
    for (let c = 0; c < mullionCols; c++) {
      const x = c * colWidth;
      ctx.fillStyle = '#0f1722';
      ctx.fillRect(x, 0, 4, 2048);
      ctx.fillStyle = '#1c2838';
      ctx.fillRect(x + 1, 0, 1.5, 2048);
    }

    const floorRows = 48;
    const rowHeight = 2048 / floorRows;
    for (let r = 0; r < floorRows; r++) {
      const y = r * rowHeight;
      ctx.fillStyle = '#111b26';
      ctx.fillRect(0, y, 1024, 8);
      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, y + 8, 1024, 2);
    }

    for (let r = 2; r < floorRows - 2; r++) {
      for (let c = 0; c < mullionCols; c++) {
        const x = c * colWidth + 6;
        const y = r * rowHeight + 11;
        const w = colWidth - 12;
        const h = rowHeight - 14;

        const rand = Math.random();
        if (rand > 0.42) {
          if (rand > 0.85) ctx.fillStyle = '#e8f4fc';
          else if (rand > 0.68) ctx.fillStyle = '#00f2ff';
          else if (rand > 0.52) ctx.fillStyle = '#ffcc66';
          else ctx.fillStyle = '#00ff88';
          ctx.fillRect(x, y, w, h);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          for (let by = y + 4; by < y + h; by += 4) {
            ctx.fillRect(x, by, w, 1);
          }
        } else {
          ctx.fillStyle = '#091018';
          ctx.fillRect(x, y, w, h);
        }
      }
    }

    ctx.fillStyle = '#00f2ff';
    ctx.fillRect(0, 0, 6, 2048);
    ctx.fillRect(1018, 0, 6, 2048);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createLuxuryApartmentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#0c131a';
    ctx.fillRect(0, 0, 512, 1024);

    const floors = 16;
    const floorH = 1024 / floors;

    for (let f = 0; f < floors; f++) {
      const y = f * floorH;

      // Concrete balcony slab
      ctx.fillStyle = '#1c2836';
      ctx.fillRect(0, y + floorH - 12, 512, 12);

      // Glass Balcony Railing (Cyan Tinted Glass)
      ctx.fillStyle = 'rgba(0, 242, 255, 0.4)';
      ctx.fillRect(15, y + floorH - 32, 482, 20);

      // Metal railing cap
      ctx.fillStyle = '#00f2ff';
      ctx.fillRect(15, y + floorH - 34, 482, 2);

      // Living Room Glass Sliders with Interior Warm Lights
      for (let apt = 0; apt < 3; apt++) {
        const ax = apt * 165 + 20;
        const rand = Math.random();

        ctx.fillStyle = rand > 0.35 ? '#ffcc77' : '#0a1017';
        ctx.fillRect(ax, y + 10, 140, floorH - 46);

        // Curtains
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(ax, y + 10, 25, floorH - 46);
        ctx.fillRect(ax + 115, y + 10, 25, floorH - 46);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createCyberApartmentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Weathered dark brick
    ctx.fillStyle = '#14181f';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#0e1116';
    ctx.lineWidth = 2;
    for (let y = 0; y < 512; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Window arrays with Air Conditioner units
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const x = c * 120 + 25;
        const y = r * 95 + 20;

        ctx.fillStyle = '#080c10';
        ctx.fillRect(x - 4, y - 4, 78, 68);

        ctx.fillStyle = Math.random() > 0.4 ? '#00f2ff' : '#ffaa33';
        ctx.fillRect(x, y, 70, 60);

        // Window frames
        ctx.fillStyle = '#080c10';
        ctx.fillRect(x + 33, y, 4, 60);
        ctx.fillRect(x, y + 28, 70, 4);

        // AC unit box under window
        if (Math.random() > 0.5) {
          ctx.fillStyle = '#222f3d';
          ctx.fillRect(x + 12, y + 42, 45, 22);
          ctx.fillStyle = '#11171f';
          ctx.fillRect(x + 16, y + 46, 12, 14);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createSignTexture(title: string, subtitle: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#060a10';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 240);

    ctx.fillStyle = color;
    ctx.fillRect(8, 8, 30, 8);
    ctx.fillRect(8, 8, 8, 30);
    ctx.fillRect(474, 8, 30, 8);
    ctx.fillRect(496, 8, 8, 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(title, 28, 80);

    ctx.fillStyle = color;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(subtitle, 28, 130);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(28, 160, 456, 12);
    ctx.fillStyle = color;
    ctx.fillRect(28, 160, 240, 12);

    ctx.fillStyle = '#8696a0';
    ctx.font = '14px monospace';
    ctx.fillText('STATUS: ONLINE | SECURITY: AES-256', 28, 210);
  }

  return new THREE.CanvasTexture(canvas);
}

// ============================================================
// RIG INTERFACES
// ============================================================

interface PlayerRig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponMount: THREE.Group;
  weapons: Record<WeaponType, THREE.Group>;
  minigunBarrels?: THREE.Group;
  muzzleFlash: THREE.Mesh;
  thrusterLight1: THREE.Mesh;
  thrusterLight2: THREE.Mesh;
  updateAnimation: (isMoving: boolean, speedNorm: number, delta: number, time: number, isJumping: boolean) => void;
  triggerFire: () => void;
  setWeaponVisible: (type: WeaponType) => void;
}

interface ZombieRig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  jaw: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  alive: boolean;
  speed: number;
  lastBiteTime: number;
  seed: number;
  archetype: 'suit' | 'hazmat' | 'runner';
  updateAnimation: (time: number, delta: number, isBiting: boolean) => void;
  triggerDeath: (impulseX?: number, impulseZ?: number) => void;
  respawn: (x: number, z: number) => void;
}

interface VehicleMeshSet {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  frontSteerGroup: THREE.Group[];
  muzzleFlashes: THREE.Mesh[];
}

interface VehicleFleetRig {
  container: THREE.Group;
  vehicles: Record<VehicleType, VehicleMeshSet>;
  speed: number;
  steering: number;
  activeType: VehicleType;
  triggerFire: () => void;
  updatePhysics: (forward: number, turn: number, delta: number) => { movedDist: number; velocity: THREE.Vector3 };
  switchModel: (type: VehicleType) => void;
}

interface SquadTeammate {
  root: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  callsign: string;
  targetZombie: ZombieRig | null;
  lastFireTime: number;
  updateAI: (time: number, delta: number, playerPos: THREE.Vector3, zombies: ZombieRig[]) => void;
}

interface ResourceDrop {
  root: THREE.Group;
  type: 'nexToken' | 'bioSamples' | 'plasmaCells' | 'nanoScrap';
  amount: number;
  active: boolean;
}

export default function NexGame3D({
  touchInputRef,
}: {
  touchInputRef?: React.MutableRefObject<TouchControls>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene & Renderer Setup
    const scene = new THREE.Scene();
    const currentMode = useGameStore.getState().mode;
    scene.fog = new THREE.FogExp2(
      currentMode === 'apocalypse' ? 0x05130b : 0x060c16,
      0.012
    );

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;

    // 2. High-Fidelity Directional Lighting with Soft Shadow Map
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.48);
    scene.add(ambientLight);

    const mainDirectional = new THREE.DirectionalLight(0xdfeeff, 1.45);
    mainDirectional.position.set(60, 110, 50);
    mainDirectional.castShadow = true;
    mainDirectional.shadow.mapSize.width = 2048;
    mainDirectional.shadow.mapSize.height = 2048;
    const shadowDist = 90;
    mainDirectional.shadow.camera.left = -shadowDist;
    mainDirectional.shadow.camera.right = shadowDist;
    mainDirectional.shadow.camera.top = shadowDist;
    mainDirectional.shadow.camera.bottom = -shadowDist;
    scene.add(mainDirectional);

    // Emergency Biohazard Strobe Beacon
    const emergencyLight = new THREE.PointLight(0xff003c, 4.0, 90);
    emergencyLight.position.set(0, 20, 0);
    scene.add(emergencyLight);

    // ============================================================
    // 3. SCALE THE MAP TO AN ACTUAL SPRAWLING CITY (200m x 200m)
    // ============================================================
    const citySize = 210;
    const groundGeo = new THREE.PlaneGeometry(citySize, citySize, 40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x060a0f,
      roughness: 0.85,
      metalness: 0.35,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Multi-Lane City Avenue Road Markings & Cyber Grid
    const gridHelper = new THREE.GridHelper(
      citySize,
      70,
      currentMode === 'apocalypse' ? 0x00ff88 : 0x00f2ff,
      0x101a24
    );
    gridHelper.position.y = 0.03;
    scene.add(gridHelper);

    // Major Road Avenues (North-South & East-West Highways)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x080d14, roughness: 0.9 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

    // Central Boulevard East-West
    const mainAvenueEW = new THREE.Mesh(new THREE.PlaneGeometry(citySize, 16), roadMat);
    mainAvenueEW.rotation.x = -Math.PI / 2;
    mainAvenueEW.position.y = 0.04;
    mainAvenueEW.receiveShadow = true;
    scene.add(mainAvenueEW);

    // Central Boulevard North-South
    const mainAvenueNS = new THREE.Mesh(new THREE.PlaneGeometry(16, citySize), roadMat);
    mainAvenueNS.rotation.x = -Math.PI / 2;
    mainAvenueNS.position.y = 0.04;
    mainAvenueNS.receiveShadow = true;
    scene.add(mainAvenueNS);

    // Glowing Lane Dividers
    for (let pos = -citySize / 2 + 10; pos < citySize / 2 - 10; pos += 16) {
      const dashEW = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.4), lineMat);
      dashEW.rotation.x = -Math.PI / 2;
      dashEW.position.set(pos, 0.05, 0);
      scene.add(dashEW);

      const dashNS = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 8), lineMat);
      dashNS.rotation.x = -Math.PI / 2;
      dashNS.position.set(0, 0.05, pos);
      scene.add(dashNS);
    }

    // Street Lamps along Avenues
    for (let lx = -80; lx <= 80; lx += 40) {
      if (Math.abs(lx) < 15) continue;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 5.5, 8), roadMat);
      pole.position.set(lx, 2.75, 9.5);
      scene.add(pole);

      const lantern = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.6), lineMat);
      lantern.position.set(lx, 5.5, 9.5);
      scene.add(lantern);

      const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 5.5, 8), roadMat);
      pole2.position.set(lx, 2.75, -9.5);
      scene.add(pole2);
    }

    // ============================================================
    // 4. ARCHITECTURAL DIVERSITY: SKYSCRAPERS & DIFFERENT APARTMENTS
    // ============================================================
    const skyscraperTex = createModernSkyscraperTexture();
    const luxuryApartmentTex = createLuxuryApartmentTexture();
    const cyberApartmentTex = createCyberApartmentTexture();

    const skyscraperMat = new THREE.MeshStandardMaterial({
      map: skyscraperTex,
      roughness: 0.35,
      metalness: 0.65,
    });

    const luxuryApartmentMat = new THREE.MeshStandardMaterial({
      map: luxuryApartmentTex,
      roughness: 0.45,
      metalness: 0.55,
    });

    const cyberApartmentMat = new THREE.MeshStandardMaterial({
      map: cyberApartmentTex,
      roughness: 0.75,
      metalness: 0.25,
    });

    const trimMetalMat = new THREE.MeshStandardMaterial({
      color: 0x0f1722,
      roughness: 0.4,
      metalness: 0.8,
    });

    const rooftopBeacons: THREE.Mesh[] = [];

    // Modern Skyscraper Generator (Financial Core)
    function createModernSkyscraper(x: number, z: number, w: number, d: number, h: number, type: 'prism' | 'stepped' | 'twin') {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(x, 0, z);

      if (type === 'prism') {
        const lobbyGeo = new THREE.BoxGeometry(w + 2, 10, d + 2);
        const lobbyMesh = new THREE.Mesh(lobbyGeo, skyscraperMat);
        lobbyMesh.position.y = 5;
        lobbyMesh.castShadow = true;
        towerGroup.add(lobbyMesh);

        const shaftH = h - 22;
        const shaftMesh = new THREE.Mesh(new THREE.BoxGeometry(w, shaftH, d), skyscraperMat);
        shaftMesh.position.y = 10 + shaftH / 2;
        shaftMesh.castShadow = true;
        towerGroup.add(shaftMesh);

        const crownGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.65, 12, 4);
        crownGeo.rotateY(Math.PI / 4);
        const crownMesh = new THREE.Mesh(crownGeo, trimMetalMat);
        crownMesh.position.y = 10 + shaftH + 6;
        crownMesh.castShadow = true;
        towerGroup.add(crownMesh);

        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 14, 8), trimMetalMat);
        spire.position.y = h + 6;
        towerGroup.add(spire);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff003c }));
        beacon.position.y = h + 13.2;
        towerGroup.add(beacon);
        rooftopBeacons.push(beacon);
      } else if (type === 'stepped') {
        const t1H = h * 0.4;
        const t1 = new THREE.Mesh(new THREE.BoxGeometry(w, t1H, d), skyscraperMat);
        t1.position.y = t1H / 2;
        t1.castShadow = true;
        towerGroup.add(t1);

        const t2H = h * 0.35;
        const t2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, t2H, d * 0.78), skyscraperMat);
        t2.position.y = t1H + t2H / 2;
        t2.castShadow = true;
        towerGroup.add(t2);

        const t3H = h * 0.25;
        const t3 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.58, t3H, d * 0.58), skyscraperMat);
        t3.position.y = t1H + t2H + t3H / 2;
        t3.castShadow = true;
        towerGroup.add(t3);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
        beacon.position.y = h + 12;
        towerGroup.add(beacon);
        rooftopBeacons.push(beacon);
      } else {
        const subW = w * 0.42;
        const t1 = new THREE.Mesh(new THREE.BoxGeometry(subW, h, d), skyscraperMat);
        t1.position.set(-w * 0.28, h / 2, 0);
        t1.castShadow = true;
        towerGroup.add(t1);

        const t2 = new THREE.Mesh(new THREE.BoxGeometry(subW, h, d), skyscraperMat);
        t2.position.set(w * 0.28, h / 2, 0);
        t2.castShadow = true;
        towerGroup.add(t2);

        const bridge = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.58, 4.5, d * 0.75),
          new THREE.MeshStandardMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.65 })
        );
        bridge.position.set(0, h * 0.62, 0);
        towerGroup.add(bridge);
      }

      physicsWorld.addStaticCollider(
        new BoxCollider(new THREE.Vector3(x, h * 0.5, z), new THREE.Vector3(w, h, d), 'skyscraper')
      );

      scene.add(towerGroup);
      return towerGroup;
    }

    // Reset physics world static colliders for scene initialization
    physicsWorld.staticColliders = [];

    // Deploy Skyscrapers in Financial Core (Districts)
    createModernSkyscraper(-75, -60, 20, 18, 92, 'prism');
    createModernSkyscraper(-75, 0, 22, 18, 105, 'stepped');
    createModernSkyscraper(-75, 60, 20, 18, 85, 'twin');

    createModernSkyscraper(75, -60, 20, 18, 88, 'twin');
    createModernSkyscraper(75, 0, 22, 18, 110, 'prism');
    createModernSkyscraper(75, 60, 20, 18, 95, 'stepped');

    // 1. Luxury High-Rise Condominiums (Apartments Type A)
    function createLuxuryCondo(x: number, z: number, w: number, d: number, h: number) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const main = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), luxuryApartmentMat);
      main.position.y = h / 2;
      main.castShadow = true;
      main.receiveShadow = true;
      group.add(main);

      // Glass Balconies protruding forward
      const balcony = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.85, h * 0.8, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.4 })
      );
      balcony.position.set(0, h / 2, d / 2 + 0.9);
      group.add(balcony);

      // Rooftop Sky-Terrace Pool Deck
      const terrace = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 1.2, d * 0.9), trimMetalMat);
      terrace.position.y = h + 0.6;
      group.add(terrace);

      physicsWorld.addStaticCollider(
        new BoxCollider(new THREE.Vector3(x, h * 0.5, z), new THREE.Vector3(w, h, d), 'luxury_condo')
      );

      scene.add(group);
      return group;
    }

    createLuxuryCondo(-42, -55, 16, 14, 46);
    createLuxuryCondo(42, -55, 16, 14, 52);

    // 2. Mid-Rise Cyber Walk-Up Apartments (Apartments Type B)
    function createCyberWalkup(x: number, z: number, w: number, d: number, h: number) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cyberApartmentMat);
      body.position.y = h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Exterior Fire Escape metal stairs
      const fireEscape = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, h * 0.85, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x243242, metalness: 0.9 })
      );
      fireEscape.position.set(w / 2 + 1.2, h * 0.45, 0);
      group.add(fireEscape);

      physicsWorld.addStaticCollider(
        new BoxCollider(new THREE.Vector3(x, h * 0.5, z), new THREE.Vector3(w, h, d), 'walkup_apartment')
      );

      scene.add(group);
      return group;
    }

    createCyberWalkup(-42, 55, 15, 14, 28);
    createCyberWalkup(42, 55, 15, 14, 30);

    // ==========================================
    // SPECIALIZED INTERACTIVE CITY FACILITIES
    // ==========================================

    // 1. The Nexus Vault Bank
    const vaultSignTex = createSignTexture('NEXUS VAULT', 'ASSET STORAGE VAULT', '#00ff88');
    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(-28, 0, 0);

    const vaultBody = new THREE.Mesh(
      new THREE.BoxGeometry(12, 9, 12),
      new THREE.MeshStandardMaterial({ color: 0x0c131a, metalness: 0.8, roughness: 0.3 })
    );
    vaultBody.position.y = 4.5;
    vaultBody.castShadow = true;
    vaultGroup.add(vaultBody);

    const blastDoor = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x1a2634, metalness: 0.9 })
    );
    blastDoor.rotation.x = Math.PI / 2;
    blastDoor.position.set(0, 3.6, 6.15);
    vaultGroup.add(blastDoor);

    const vaultRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.08, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    vaultRing.position.set(0, 3.6, 6.36);
    vaultGroup.add(vaultRing);

    const vaultSign = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 3.2),
      new THREE.MeshBasicMaterial({ map: vaultSignTex })
    );
    vaultSign.position.set(0, 7.2, 6.05);
    vaultGroup.add(vaultSign);
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(-28, 4.5, 0), new THREE.Vector3(12, 9, 12), 'vault'));
    scene.add(vaultGroup);

    // 2. The Cyber Armory
    const armorySignTex = createSignTexture('CYBER ARMORY', 'GUNS & MUNITIONS', '#00f2ff');
    const armoryGroup = new THREE.Group();
    armoryGroup.position.set(28, 0, 0);

    const armoryBody = new THREE.Mesh(
      new THREE.BoxGeometry(12, 9, 12),
      new THREE.MeshStandardMaterial({ color: 0x0c141c, metalness: 0.7 })
    );
    armoryBody.position.y = 4.5;
    armoryBody.castShadow = true;
    armoryGroup.add(armoryBody);

    const armorySign = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 3.2),
      new THREE.MeshBasicMaterial({ map: armorySignTex })
    );
    armorySign.position.set(0, 7.2, 6.05);
    armoryGroup.add(armorySign);
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(28, 4.5, 0), new THREE.Vector3(12, 9, 12), 'armory'));
    scene.add(armoryGroup);

    // 3. The Cyber Garage (Vehicle Dealership)
    const garageSignTex = createSignTexture('CYBER GARAGE', 'COMBAT VEHICLE FLEET', '#ffaa33');
    const garageGroup = new THREE.Group();
    garageGroup.position.set(0, 0, -45);

    const garageBody = new THREE.Mesh(
      new THREE.BoxGeometry(18, 9, 14),
      new THREE.MeshStandardMaterial({ color: 0x0f151c, metalness: 0.75 })
    );
    garageBody.position.y = 4.5;
    garageBody.castShadow = true;
    garageGroup.add(garageBody);

    const garageSign = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 3.2),
      new THREE.MeshBasicMaterial({ map: garageSignTex })
    );
    garageSign.position.set(0, 7.2, 7.15);
    garageGroup.add(garageSign);
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(0, 4.5, -45), new THREE.Vector3(18, 9, 14), 'garage'));
    scene.add(garageGroup);

    // 4. The Cyber Fuel & Recharge Station
    const fuelSignTex = createSignTexture('CYBER FUEL 24H', 'RECHARGE & BATTERY CELLS', '#00f2ff');
    const fuelStationGroup = new THREE.Group();
    fuelStationGroup.position.set(0, 0, 45);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x0e1720, metalness: 0.7 })
    );
    canopy.position.y = 6.0;
    fuelStationGroup.add(canopy);

    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x111c26, metalness: 0.8 });
    const pump1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 1.4), pumpMat);
    pump1.position.set(-3.5, 1.4, 0);
    fuelStationGroup.add(pump1);
    const pump2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 1.4), pumpMat);
    pump2.position.set(3.5, 1.4, 0);
    fuelStationGroup.add(pump2);

    const fuelSign = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 2.6),
      new THREE.MeshBasicMaterial({ map: fuelSignTex })
    );
    fuelSign.position.set(0, 6.0, 6.05);
    fuelStationGroup.add(fuelSign);
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(0, 3.0, 45), new THREE.Vector3(16, 6.0, 12), 'fuel_station'));
    scene.add(fuelStationGroup);

    // ============================================================
    // 4B. REAL-WORLD & SCI-FI EXPANSIONS: AIRCRAFT CARRIER,
    // SPACEPORT ROCKET, AI DATA CENTER & RECREATIONAL ARENA
    // ============================================================

    // 1. Massive Naval Aircraft Carrier & Harbor (South Coast at x: 35, z: 110)
    const carrierSignTex = createSignTexture('NAVAL CARRIER CVN-99', 'TACTICAL FLIGHT DECK // CATAPULT 01', '#00f2ff');
    const aircraftCarrierGroup = new THREE.Group();
    aircraftCarrierGroup.position.set(35, 0, 110);

    const carrierHullMat = new THREE.MeshStandardMaterial({ color: 0x121922, metalness: 0.85, roughness: 0.35 });
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x080c10, roughness: 0.95 });
    const runwayLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    const carrierHull = new THREE.Mesh(new THREE.BoxGeometry(26, 5.5, 110), carrierHullMat);
    carrierHull.position.y = 2.75;
    carrierHull.castShadow = true;
    carrierHull.receiveShadow = true;
    aircraftCarrierGroup.add(carrierHull);

    const carrierRunway = new THREE.Mesh(new THREE.PlaneGeometry(22, 106), runwayMat);
    carrierRunway.rotation.x = -Math.PI / 2;
    carrierRunway.position.y = 5.52;
    carrierRunway.receiveShadow = true;
    aircraftCarrierGroup.add(carrierRunway);

    for (let rz = -48; rz < 48; rz += 8) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 4.5), runwayLineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 5.54, rz);
      aircraftCarrierGroup.add(dash);
    }

    const stripL = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 102), yellowStripeMat);
    stripL.rotation.x = -Math.PI / 2;
    stripL.position.set(-10, 5.54, 0);
    aircraftCarrierGroup.add(stripL);

    const stripR = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 102), yellowStripeMat);
    stripR.rotation.x = -Math.PI / 2;
    stripR.position.set(10, 5.54, 0);
    aircraftCarrierGroup.add(stripR);

    const islandTower = new THREE.Mesh(new THREE.BoxGeometry(4.5, 14, 18), carrierHullMat);
    islandTower.position.set(10.5, 12.5, 5);
    islandTower.castShadow = true;
    aircraftCarrierGroup.add(islandTower);

    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(35 + 10.5, 12.5, 110 + 5), new THREE.Vector3(4.5, 14, 18), 'carrier_island'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(35, 2.75, 110), new THREE.Vector3(26, 5.5, 110), 'carrier_deck'));

    const carrierMast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 8, 8), trimMetalMat);
    carrierMast.position.set(10.5, 23.5, 5);
    aircraftCarrierGroup.add(carrierMast);

    const radarDish = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16),
      new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true })
    );
    radarDish.position.set(10.5, 26, 5);
    radarDish.rotation.z = Math.PI / 4;
    aircraftCarrierGroup.add(radarDish);

    const carrierSign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.6), new THREE.MeshBasicMaterial({ map: carrierSignTex }));
    carrierSign.position.set(10.5, 14, -4.1);
    carrierSign.rotation.y = Math.PI;
    aircraftCarrierGroup.add(carrierSign);

    scene.add(aircraftCarrierGroup);

    // 2. COLOSSAL 120-METER SPACEX / NASA STARSHIP & 145M MECHAZILLA TOWER (West Sector at x: -100, z: 80)
    const spaceportSignTex = createSignTexture('SPACEX / NASA STARBASE', '120M ORBITAL STARSHIP // MECHAZILLA TOWER', '#00ff88');
    const spaceportGroup = new THREE.Group();
    spaceportGroup.position.set(-100, 0, 80);

    // Stage 0: Orbital Launch Mount Table (32m wide, 6m tall)
    const padBase = new THREE.Mesh(
      new THREE.CylinderGeometry(18, 22, 6, 32),
      new THREE.MeshStandardMaterial({ color: 0x11161f, metalness: 0.85, roughness: 0.3 })
    );
    padBase.position.y = 3.0;
    padBase.receiveShadow = true;
    spaceportGroup.add(padBase);

    // 6 Hydraulic Hold-Down Clamps on the pad table
    for (let c = 0; c < 6; c++) {
      const cAng = (c / 6) * Math.PI * 2;
      const clampPedestal = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 4.2, 3.2),
        new THREE.MeshStandardMaterial({ color: 0xd35400, metalness: 0.7 })
      );
      clampPedestal.position.set(Math.cos(cAng) * 7.5, 6.0, Math.sin(cAng) * 7.5);
      clampPedestal.lookAt(spaceportGroup.position.x, 6.0, spaceportGroup.position.z);
      spaceportGroup.add(clampPedestal);
    }

    // Water deluge sound suppression manifold ring
    const delugeRing = new THREE.Mesh(
      new THREE.TorusGeometry(12, 0.6, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.8 })
    );
    delugeRing.rotation.x = Math.PI / 2;
    delugeRing.position.y = 4.5;
    spaceportGroup.add(delugeRing);

    // Cryogenic Tank Farm: 4 Giant Insulated Vacuum Spheres (LOX & LCH4)
    [
      { x: -28, z: -20, r: 8.5, label: 'LOX-01' },
      { x: -38, z: 0, r: 8.5, label: 'LCH4-01' },
      { x: -28, z: 20, r: 8.5, label: 'LOX-02' },
      { x: -38, z: 35, r: 7.5, label: 'LN2-PURGE' },
    ].forEach((tank) => {
      const tankSphere = new THREE.Mesh(
        new THREE.SphereGeometry(tank.r, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 0.4, roughness: 0.35 })
      );
      tankSphere.position.set(tank.x, tank.r + 0.5, tank.z);
      tankSphere.castShadow = true;
      spaceportGroup.add(tankSphere);

      const cradle = new THREE.Mesh(
        new THREE.CylinderGeometry(tank.r * 1.1, tank.r * 1.15, 2.0, 16),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 })
      );
      cradle.position.set(tank.x, 1.0, tank.z);
      spaceportGroup.add(cradle);
    });

    // 145-Meter Mechazilla Launch & Catch Tower
    const gantryTower = new THREE.Mesh(
      new THREE.BoxGeometry(14, 145, 14),
      new THREE.MeshStandardMaterial({ color: 0x22262d, metalness: 0.85, roughness: 0.4, wireframe: true })
    );
    gantryTower.position.set(-14, 72.5, 0);
    gantryTower.castShadow = true;
    spaceportGroup.add(gantryTower);

    // Tower solid core elevator shaft
    const towerCore = new THREE.Mesh(
      new THREE.BoxGeometry(6, 145, 6),
      new THREE.MeshStandardMaterial({ color: 0x141820, metalness: 0.85 })
    );
    towerCore.position.set(-14, 72.5, 0);
    spaceportGroup.add(towerCore);

    // Articulated Chopstick Catch Arms (28m cantilever arms)
    const chopstickCarriage = new THREE.Group();
    chopstickCarriage.position.set(-8, 90, 0);

    const chopstickL = new THREE.Mesh(
      new THREE.BoxGeometry(26, 2.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xd35400, metalness: 0.7 })
    );
    chopstickL.position.set(13, 0, -4.5);
    chopstickCarriage.add(chopstickL);

    const chopstickR = new THREE.Mesh(
      new THREE.BoxGeometry(26, 2.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xd35400, metalness: 0.7 })
    );
    chopstickR.position.set(13, 0, 4.5);
    chopstickCarriage.add(chopstickR);
    spaceportGroup.add(chopstickCarriage);

    // Quick Disconnect (QD) Cryogenic Umbilical Arm
    const qdArm = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.8, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x882222, metalness: 0.8 })
    );
    qdArm.position.set(-7, 65, 0);
    spaceportGroup.add(qdArm);

    // Colossal 120-Meter Starship Stack: Booster (70m) + Starship (50m)
    const rocketGroup = new THREE.Group();
    rocketGroup.position.set(0, 6.0, 0); // Staged on Launch Table

    const stainlessSteelMat = new THREE.MeshStandardMaterial({
      color: 0xecf0f1,
      metalness: 0.96,
      roughness: 0.12,
    });
    const heatShieldTileMat = new THREE.MeshStandardMaterial({
      color: 0x0c0e12,
      metalness: 0.3,
      roughness: 0.8,
    });
    const raptorEngineMat = new THREE.MeshStandardMaterial({
      color: 0x1e272e,
      metalness: 0.9,
      roughness: 0.25,
    });

    // Sub-group: Super Heavy Booster (Stage 1, 70m tall, 9m diameter)
    const boosterGroup = new THREE.Group();
    boosterGroup.position.set(0, 0, 0);

    const boosterHull = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 70, 32),
      stainlessSteelMat
    );
    boosterHull.position.y = 35;
    boosterHull.castShadow = true;
    boosterGroup.add(boosterHull);

    // 4 Titanium Grid Fins at the top of Super Heavy (y = 67m)
    const gridFins: THREE.Mesh[] = [];
    [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((ang) => {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 3.8, 4.6),
        new THREE.MeshStandardMaterial({ color: 0x485460, metalness: 0.85, wireframe: true })
      );
      fin.position.set(Math.cos(ang) * 5.4, 67, Math.sin(ang) * 5.4);
      fin.rotation.y = ang;
      boosterGroup.add(fin);
      gridFins.push(fin);
    });

    // 33 Raptor 3 Engines Array on Booster Base
    // Outer Ring: 20 engines
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.8, 12), raptorEngineMat);
      bell.position.set(Math.cos(a) * 3.8, 0.9, Math.sin(a) * 3.8);
      boosterGroup.add(bell);
    }
    // Middle Ring: 10 engines
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.8, 12), raptorEngineMat);
      bell.position.set(Math.cos(a) * 2.3, 0.9, Math.sin(a) * 2.3);
      boosterGroup.add(bell);
    }
    // Center Cluster: 3 gimbaled engines
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.8, 12), raptorEngineMat);
      bell.position.set(Math.cos(a) * 0.9, 0.9, Math.sin(a) * 0.9);
      boosterGroup.add(bell);
    }

    // Hot-Staging Vented Interstage Ring (y = 70m)
    const hotStageRing = new THREE.Mesh(
      new THREE.CylinderGeometry(4.55, 4.55, 2.2, 24),
      new THREE.MeshStandardMaterial({ color: 0x3d3d3d, metalness: 0.8, wireframe: true })
    );
    hotStageRing.position.y = 71;
    boosterGroup.add(hotStageRing);
    rocketGroup.add(boosterGroup);

    // Sub-group: Starship Upper Stage (Stage 2, 50m tall, 9m diameter)
    const starshipStageGroup = new THREE.Group();
    starshipStageGroup.position.set(0, 72, 0);

    // Starship Cylindrical Hull
    const shipHull = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 34, 32),
      stainlessSteelMat
    );
    shipHull.position.y = 17;
    shipHull.castShadow = true;
    starshipStageGroup.add(shipHull);

    // Black Hexagonal PICA-X Thermal Heat Shield Half-Cylinder
    const heatShield = new THREE.Mesh(
      new THREE.CylinderGeometry(4.52, 4.52, 34, 16, 1, false, 0, Math.PI),
      heatShieldTileMat
    );
    heatShield.position.y = 17;
    starshipStageGroup.add(heatShield);

    // Aerodynamic Ogive Nose Cone (16m tall)
    const shipNose = new THREE.Mesh(
      new THREE.ConeGeometry(4.5, 16, 32),
      stainlessSteelMat
    );
    shipNose.position.y = 42;
    shipNose.castShadow = true;
    starshipStageGroup.add(shipNose);

    const shipNoseTiles = new THREE.Mesh(
      new THREE.ConeGeometry(4.52, 16, 16, 1, false, 0, Math.PI),
      heatShieldTileMat
    );
    shipNoseTiles.position.y = 42;
    starshipStageGroup.add(shipNoseTiles);

    // Forward Canard Flaps (Left & Right)
    const flapForwardL = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.4, 2.2),
      stainlessSteelMat
    );
    flapForwardL.position.set(-5.6, 40, 0);
    starshipStageGroup.add(flapForwardL);

    const flapForwardR = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.4, 2.2),
      stainlessSteelMat
    );
    flapForwardR.position.set(5.6, 40, 0);
    starshipStageGroup.add(flapForwardR);

    // Aft Delta Body Flaps (Left & Right)
    const flapAftL = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.5, 3.6),
      stainlessSteelMat
    );
    flapAftL.position.set(-6.5, 5, 0);
    starshipStageGroup.add(flapAftL);

    const flapAftR = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.5, 3.6),
      stainlessSteelMat
    );
    flapAftR.position.set(6.5, 5, 0);
    starshipStageGroup.add(flapAftR);

    // 6 Starship Raptors (3 Vacuum + 3 Sea-Level)
    for (let v = 0; v < 3; v++) {
      const vAng = (v / 3) * Math.PI * 2;
      const vacBell = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.6, 16), raptorEngineMat);
      vacBell.position.set(Math.cos(vAng) * 2.4, 1.3, Math.sin(vAng) * 2.4);
      starshipStageGroup.add(vacBell);
    }
    for (let s = 0; s < 3; s++) {
      const sAng = (s / 3) * Math.PI * 2 + Math.PI / 3;
      const seaBell = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 12), raptorEngineMat);
      seaBell.position.set(Math.cos(sAng) * 0.9, 0.8, Math.sin(sAng) * 0.9);
      starshipStageGroup.add(seaBell);
    }

    // Supersonic Condensation Shockwave Vapor Cone (Max-Q Cone)
    const maxQCone = new THREE.Mesh(
      new THREE.ConeGeometry(8.5, 16, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    maxQCone.rotation.x = Math.PI;
    maxQCone.position.set(0, 36, 0);
    starshipStageGroup.add(maxQCone);

    rocketGroup.add(starshipStageGroup);

    // Massive 33-Raptor Rocket Exhaust Fire & Shock Diamonds
    const rocketFlames = new THREE.Group();
    const coreFlame = new THREE.Mesh(
      new THREE.ConeGeometry(5.2, 38, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.9 })
    );
    coreFlame.rotation.x = Math.PI;
    coreFlame.position.y = -19;
    rocketFlames.add(coreFlame);

    const outerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(7.5, 52, 24),
      new THREE.MeshBasicMaterial({ color: 0xff3b00, transparent: true, opacity: 0.45 })
    );
    outerFlame.rotation.x = Math.PI;
    outerFlame.position.y = -26;
    rocketFlames.add(outerFlame);

    // Shock diamond cones inside plume
    for (let d = 0; d < 4; d++) {
      const diamond = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.4, 0),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
      );
      diamond.position.y = -8 - d * 7;
      rocketFlames.add(diamond);
    }
    rocketFlames.visible = false;
    rocketGroup.add(rocketFlames);

    spaceportGroup.add(rocketGroup);

    const terminalBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(22, 9, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f1722, metalness: 0.8 })
    );
    terminalBuilding.position.set(24, 4.5, 0);
    terminalBuilding.castShadow = true;
    spaceportGroup.add(terminalBuilding);

    const spaceportSign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3.2),
      new THREE.MeshBasicMaterial({ map: spaceportSignTex })
    );
    spaceportSign.position.set(24, 8.5, 8.05);
    spaceportGroup.add(spaceportSign);

    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(-100 - 14, 72.5, 80), new THREE.Vector3(14, 145, 14), 'launch_tower'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(-100 + 24, 4.5, 80), new THREE.Vector3(22, 9, 16), 'spaceport_terminal'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(-100, 3.0, 80), new THREE.Vector3(36, 6, 36), 'launch_table'));

    scene.add(spaceportGroup);

    // 3. AI Supercomputing Data Center & Robotics Complex (East Sector at x: 95, z: -35)
    const aiSignTex = createSignTexture('AI DATA CENTER', 'NEURAL VALIDATOR CORE // WORK STATION', '#00f2ff');
    const aiDataCenterGroup = new THREE.Group();
    aiDataCenterGroup.position.set(95, 0, -35);

    const datacenterBody = new THREE.Mesh(
      new THREE.BoxGeometry(26, 16, 22),
      new THREE.MeshStandardMaterial({ color: 0x090f17, metalness: 0.85, roughness: 0.25 })
    );
    datacenterBody.position.y = 8;
    datacenterBody.castShadow = true;
    aiDataCenterGroup.add(datacenterBody);

    const serverGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 10),
      new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true })
    );
    serverGlass.position.set(0, 8, 11.05);
    aiDataCenterGroup.add(serverGlass);

    const towerMat = new THREE.MeshStandardMaterial({ color: 0x141f2a, metalness: 0.7 });
    const coolTower1 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.2, 12, 16), towerMat);
    coolTower1.position.set(-16, 6, -4);
    aiDataCenterGroup.add(coolTower1);

    const coolTower2 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.2, 12, 16), towerMat);
    coolTower2.position.set(-16, 6, 6);
    aiDataCenterGroup.add(coolTower2);

    const robotBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 1.2, 12), trimMetalMat);
    robotBase.position.set(6, 0.6, 13);
    aiDataCenterGroup.add(robotBase);

    const robotArm1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.5, 0.3), new THREE.MeshBasicMaterial({ color: 0xffaa33 }));
    robotArm1.position.set(6, 2.2, 13);
    robotArm1.rotation.z = Math.PI / 6;
    aiDataCenterGroup.add(robotArm1);

    const robotArm2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 0.25), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
    robotArm2.position.set(7.2, 3.8, 13);
    robotArm2.rotation.z = -Math.PI / 4;
    aiDataCenterGroup.add(robotArm2);

    const aiSign = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.8), new THREE.MeshBasicMaterial({ map: aiSignTex }));
    aiSign.position.set(0, 14, 11.1);
    aiDataCenterGroup.add(aiSign);

    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(95, 8, -35), new THREE.Vector3(26, 16, 22), 'ai_datacenter'));
    scene.add(aiDataCenterGroup);

    // 4. Recreational Center & Cyber Sports Arena (North-West Sector at x: -55, z: -85)
    const recSignTex = createSignTexture('NEXUS RECREATIONAL ARENA', 'CYBER SPORTS & SOCIAL METAVERSE', '#ff003c');
    const recreationalGroup = new THREE.Group();
    recreationalGroup.position.set(-55, 0, -85);

    const arenaMat = new THREE.MeshStandardMaterial({ color: 0x111620, metalness: 0.8, roughness: 0.3 });
    const arenaBody = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 11, 36), arenaMat);
    arenaBody.position.y = 5.5;
    arenaBody.castShadow = true;
    recreationalGroup.add(arenaBody);

    const arenaRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(25.5, 0.16, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0x00f2ff })
    );
    arenaRing1.rotation.x = Math.PI / 2;
    arenaRing1.position.y = 8.5;
    recreationalGroup.add(arenaRing1);

    const arenaRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(23.5, 0.16, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xff003c })
    );
    arenaRing2.rotation.x = Math.PI / 2;
    arenaRing2.position.y = 11.1;
    recreationalGroup.add(arenaRing2);

    const turf = new THREE.Mesh(
      new THREE.CircleGeometry(20, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 })
    );
    turf.rotation.x = -Math.PI / 2;
    turf.position.y = 11.2;
    recreationalGroup.add(turf);

    const recSign = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.8), new THREE.MeshBasicMaterial({ map: recSignTex }));
    recSign.position.set(0, 8, 26.2);
    recreationalGroup.add(recSign);

    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(-55, 5.5, -85), new THREE.Vector3(48, 11, 48), 'recreational_center'));
    scene.add(recreationalGroup);

    // ============================================================
    // 4B. 2400MW NUCLEAR FISSION POWER COMPLEX & ELECTRICAL GRID
    // Located in South-West Industrial Harbor Sector at x: -150, z: -140
    // ============================================================
    const nuclearPlantGroup = new THREE.Group();
    nuclearPlantGroup.position.set(-150, 0, -140);

    const nukeConcreteMat = new THREE.MeshStandardMaterial({ color: 0x161c24, roughness: 0.82, metalness: 0.3 });
    const nukeSteelMat = new THREE.MeshStandardMaterial({ color: 0x0c131a, metalness: 0.9, roughness: 0.22 });
    const cherenkovMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.85 });
    const steamVaporMat = new THREE.MeshBasicMaterial({ color: 0xe0f7ff, transparent: true, opacity: 0.45 });

    // Reactor Containment Dome
    const containmentDome = new THREE.Group();
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 22, 32), nukeConcreteMat);
    domeBase.position.y = 11;
    domeBase.castShadow = true;
    containmentDome.add(domeBase);

    const domeCap = new THREE.Mesh(new THREE.SphereGeometry(18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), nukeConcreteMat);
    domeCap.position.y = 22;
    containmentDome.add(domeCap);

    // Glowing Cherenkov Blue Core Inspection Chamber
    const cherenkovCore = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 8, 24), cherenkovMat);
    cherenkovCore.position.set(0, 10, 0);
    containmentDome.add(cherenkovCore);

    // Control Rod Drive Mechanisms on Dome Peak
    for (let cr = 0; cr < 8; cr++) {
      const crAng = (cr / 8) * Math.PI * 2;
      const rodMech = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 4.5, 12), nukeSteelMat);
      rodMech.position.set(Math.cos(crAng) * 5.2, 40.5, Math.sin(crAng) * 5.2);
      containmentDome.add(rodMech);
    }
    nuclearPlantGroup.add(containmentDome);

    // Twin Hyperbolic Natural-Draft Cooling Towers
    const coolingTowers: THREE.Group[] = [];
    const towerOffsets = [{ x: -38, z: -18 }, { x: -38, z: 28 }];
    towerOffsets.forEach((pos) => {
      const cTower = new THREE.Group();
      cTower.position.set(pos.x, 0, pos.z);

      const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(13, 17, 20, 28, 1, true), nukeConcreteMat);
      seg1.position.y = 10;
      cTower.add(seg1);

      const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 13, 18, 28, 1, true), nukeConcreteMat);
      seg2.position.y = 29;
      cTower.add(seg2);

      const seg3 = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 10.5, 16, 28, 1, true), nukeConcreteMat);
      seg3.position.y = 46;
      cTower.add(seg3);

      const steamRing = new THREE.Mesh(new THREE.TorusGeometry(11.8, 2.2, 8, 24), steamVaporMat);
      steamRing.rotation.x = Math.PI / 2;
      steamRing.position.y = 54;
      cTower.add(steamRing);

      coolingTowers.push(cTower);
      nuclearPlantGroup.add(cTower);
    });

    // Turbine Generator Hall
    const turbineBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(38, 14, 22),
      new THREE.MeshStandardMaterial({ color: 0x0e1620, metalness: 0.8, roughness: 0.35 })
    );
    turbineBuilding.position.set(28, 7, 0);
    turbineBuilding.castShadow = true;
    nuclearPlantGroup.add(turbineBuilding);

    // High-Pressure Steam Piping from Reactor to Turbines
    const steamPipe = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 28, 16), nukeSteelMat);
    steamPipe.rotation.z = Math.PI / 2;
    steamPipe.position.set(14, 14, 0);
    nuclearPlantGroup.add(steamPipe);

    // High-Voltage Electrical Substation & Transmission Pylons
    const substation = new THREE.Group();
    substation.position.set(28, 0, 24);
    for (let tr = 0; tr < 3; tr++) {
      const transformer = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.2, 3.6), nukeSteelMat);
      transformer.position.set(tr * 6 - 6, 2.1, 0);
      substation.add(transformer);
      const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 2.4, 8), new THREE.MeshBasicMaterial({ color: 0x995533 }));
      bushing.position.set(tr * 6 - 6, 5.4, 0);
      substation.add(bushing);
    }

    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 3.2, 36, 4), nukeSteelMat);
    pylon.position.set(0, 18, 14);
    substation.add(pylon);
    const pylonArm = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 0.6), nukeSteelMat);
    pylonArm.position.set(0, 32, 14);
    substation.add(pylonArm);
    nuclearPlantGroup.add(substation);

    // Nuclear Plant Sign
    const nukeSignTex = createSignTexture('NUCLEAR POWER COMPLEX', '2400 MWE CLEAN ATOM ENERGY // RADIATION RESTRICTED', '#00f2ff');
    const nukeSign = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.2), new THREE.MeshBasicMaterial({ map: nukeSignTex }));
    nukeSign.position.set(0, 12, 18.2);
    nuclearPlantGroup.add(nukeSign);

    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(-150, 16, -140), new THREE.Vector3(36, 38, 36), 'nuclear_containment'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(-150 - 38, 27, -140 - 18), new THREE.Vector3(32, 54, 32), 'cooling_tower_1'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(-150 - 38, 27, -140 + 28), new THREE.Vector3(32, 54, 32), 'cooling_tower_2'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(-150 + 28, 7, -140), new THREE.Vector3(38, 14, 22), 'turbine_hall'));

    scene.add(nuclearPlantGroup);

    // ============================================================
    // 4C. REAL-WORLD UNDERGROUND SUBTERRANEAN METRO & BIO-BUNKER
    // Located at vertical depth Y = -22.0m (subterranean cavern)
    // ============================================================
    const undergroundGroup = new THREE.Group();
    undergroundGroup.position.set(20, -22, 20);

    const metroFloorMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.85 });
    const metroWallMat = new THREE.MeshStandardMaterial({ color: 0x0f141c, roughness: 0.92 });
    const trackRailMat = new THREE.MeshStandardMaterial({ color: 0x778899, metalness: 0.95, roughness: 0.2 });
    const trainMat = new THREE.MeshStandardMaterial({ color: 0x0b1118, metalness: 0.9, roughness: 0.25 });
    const trainWindowMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.85 });

    // 1. Massive Underground Platform Floor (120m x 42m)
    const metroFloor = new THREE.Mesh(new THREE.BoxGeometry(120, 1.0, 42), metroFloorMat);
    metroFloor.position.y = -0.5;
    metroFloor.receiveShadow = true;
    undergroundGroup.add(metroFloor);

    // Cavern Concrete Ceiling (separates underground from surface city)
    const metroCeiling = new THREE.Mesh(new THREE.BoxGeometry(120, 1.0, 42), metroWallMat);
    metroCeiling.position.y = 8.5;
    undergroundGroup.add(metroCeiling);

    // Perimeter Enclosure Tunnel Walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(120, 9.0, 1.2), metroWallMat);
    backWall.position.set(0, 4.0, -21);
    undergroundGroup.add(backWall);

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(120, 9.0, 1.2), metroWallMat);
    frontWall.position.set(0, 4.0, 21);
    undergroundGroup.add(frontWall);

    // Concrete Support Columns supporting street level above
    for (let colX = -48; colX <= 48; colX += 24) {
      const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 8.0, 16), metroWallMat);
      col1.position.set(colX, 4.0, -4);
      undergroundGroup.add(col1);

      const col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 8.0, 16), metroWallMat);
      col2.position.set(colX, 4.0, 4);
      undergroundGroup.add(col2);
    }

    // Dual Railway Tracks in Recessed Bed
    const trackGroup = new THREE.Group();
    trackGroup.position.set(0, 0, -12);
    [-0.8, 0.8].forEach((rOffset) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(110, 0.25, 0.15), trackRailMat);
      rail.position.set(0, 0.15, rOffset);
      trackGroup.add(rail);
    });
    // Railway Cross Ties
    for (let tie = -50; tie <= 50; tie += 2.5) {
      const tieMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 2.2), metroWallMat);
      tieMesh.position.set(tie, 0.05, 0);
      trackGroup.add(tieMesh);
    }
    undergroundGroup.add(trackGroup);

    // Futuristic Cyber Metro Train (3 Articulated Cars, 48m total)
    const subwayTrain = new THREE.Group();
    subwayTrain.position.set(0, 0.2, -12);
    for (let car = -1; car <= 1; car++) {
      const carGroup = new THREE.Group();
      carGroup.position.set(car * 15.5, 0, 0);

      const carBody = new THREE.Mesh(new THREE.BoxGeometry(14.5, 3.2, 3.2), trainMat);
      carBody.position.y = 1.6;
      carGroup.add(carBody);

      const winL = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 0.8), trainWindowMat);
      winL.position.set(0, 2.0, 1.62);
      carGroup.add(winL);

      const winR = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 0.8), trainWindowMat);
      winR.rotation.y = Math.PI;
      winR.position.set(0, 2.0, -1.62);
      carGroup.add(winR);

      if (car === 1) {
        const headlight = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        headlight.rotation.y = Math.PI / 2;
        headlight.position.set(7.28, 1.4, 0);
        carGroup.add(headlight);
      }
      subwayTrain.add(carGroup);
    }
    undergroundGroup.add(subwayTrain);

    // Underground Bio-Bunker & Maintenance Sewer Tunnel
    const undergroundBunkerGroup = new THREE.Group();
    undergroundBunkerGroup.position.set(45, 0, 10);
    const bunkerDoor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.0, 3.5), nukeSteelMat);
    bunkerDoor.position.set(0, 2.0, 0);
    undergroundBunkerGroup.add(bunkerDoor);
    const bioSignTex = createSignTexture('BIO-RESEARCH BUNKER', 'LEVEL -2 SUBTERRANEAN QUARANTINE', '#00ff88');
    const bioSign = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.2), new THREE.MeshBasicMaterial({ map: bioSignTex }));
    bioSign.rotation.y = -Math.PI / 2;
    bioSign.position.set(-0.35, 4.5, 0);
    undergroundBunkerGroup.add(bioSign);
    undergroundGroup.add(undergroundBunkerGroup);

    // Neon Subway Station Sign
    const metroSignTex = createSignTexture('NEXUS CENTRAL METRO', 'PLATFORM 01 // RAPID TRANSIT LINE', '#00f2ff');
    const metroSign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.2), new THREE.MeshBasicMaterial({ map: metroSignTex }));
    metroSign.position.set(0, 6.5, 0);
    undergroundGroup.add(metroSign);

    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(20, -22.5, 20), new THREE.Vector3(120, 1.0, 42), 'underground_floor'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(20, -13.5, 20), new THREE.Vector3(120, 1.0, 42), 'underground_ceiling'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(20, -18.0, 41), new THREE.Vector3(120, 9.0, 1.2), 'underground_wall_front'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(20, -18.0, -1), new THREE.Vector3(120, 9.0, 1.2), 'underground_wall_back'));
    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(20, -20.2, 8), new THREE.Vector3(48, 3.4, 3.4), 'metro_train'));

    scene.add(undergroundGroup);

    // Surface Subway Entrance Headhouse (Stairwell Portal on city sidewalk at x: 18, z: 25)
    const subwayEntranceGroup = new THREE.Group();
    subwayEntranceGroup.position.set(18, 0, 25);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0c131a, metalness: 0.9, roughness: 0.2 });
    const canopyMesh = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 5.0), canopyMat);
    canopyMesh.position.y = 1.9;
    subwayEntranceGroup.add(canopyMesh);

    const entranceHole = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.8, 4.0), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    entranceHole.position.set(0, 1.4, 0.6);
    subwayEntranceGroup.add(entranceHole);

    const surfaceSignTex = createSignTexture('METRO SUBWAY ENTRANCE', 'DOWN TO SUBTERRANEAN STATION [F]', '#00ff88');
    const surfaceSign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.4), new THREE.MeshBasicMaterial({ map: surfaceSignTex }));
    surfaceSign.position.set(0, 3.2, 2.52);
    subwayEntranceGroup.add(surfaceSign);

    physicsWorld.addStaticCollider(new BoxCollider(new THREE.Vector3(18, 1.9, 25), new THREE.Vector3(6.5, 3.8, 5.0), 'subway_entrance_canopy'));
    scene.add(subwayEntranceGroup);

    // 5. Flyable Supersonic Stealth Fighter Jet Rig
    interface FighterJetRig {
      root: THREE.Group;
      afterburnerL: THREE.Mesh;
      afterburnerR: THREE.Mesh;
      speed: number;
      altitude: number;
      missiles: THREE.Group[];
      fireMissile: () => void;
      updateFlight: (throttleInput: number, rollInput: number, delta: number) => { airspeed: number; altitude: number };
    }

    function createFighterJet(): FighterJetRig {
      const root = new THREE.Group();
      root.position.set(35, 5.8, 70); // Spawn on Aircraft Carrier Catapult

      const jetMat = new THREE.MeshStandardMaterial({ color: 0x141c26, metalness: 0.95, roughness: 0.2 });
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.75, metalness: 0.9 });
      const burnerMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

      const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 9.5), jetMat);
      fuselage.castShadow = true;
      root.add(fuselage);

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 3.2), canopyMat);
      canopy.position.set(0, 0.8, 1.4);
      root.add(canopy);

      const wings = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.14, 4.2), jetMat);
      wings.position.set(0, -0.1, -0.8);
      wings.castShadow = true;
      root.add(wings);

      const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 1.8), jetMat);
      tailL.position.set(-1.1, 1.0, -3.8);
      tailL.rotation.z = -0.25;
      root.add(tailL);

      const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 1.8), jetMat);
      tailR.position.set(1.1, 1.0, -3.8);
      tailR.rotation.z = 0.25;
      root.add(tailR);

      const burnerGeo = new THREE.ConeGeometry(0.45, 2.5, 12);
      burnerGeo.rotateX(Math.PI / 2);

      const afterburnerL = new THREE.Mesh(burnerGeo, burnerMat);
      afterburnerL.position.set(-0.65, 0, -5.2);
      afterburnerL.visible = false;
      root.add(afterburnerL);

      const afterburnerR = new THREE.Mesh(burnerGeo, burnerMat);
      afterburnerR.position.set(0.65, 0, -5.2);
      afterburnerR.visible = false;
      root.add(afterburnerR);

      const missilePylons: THREE.Group[] = [];
      [-2.4, 2.4].forEach((mx) => {
        const mGroup = new THREE.Group();
        mGroup.position.set(mx, -0.3, -0.5);
        const mBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8), trimMetalMat);
        mBody.rotation.x = Math.PI / 2;
        mGroup.add(mBody);
        const mTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xff003c }));
        mTip.rotation.x = Math.PI / 2;
        mTip.position.z = 1.35;
        mGroup.add(mTip);
        root.add(mGroup);
        missilePylons.push(mGroup);
      });

      scene.add(root);

      let airspeed = 0;

      return {
        root,
        afterburnerL,
        afterburnerR,
        speed: 0,
        altitude: 5.8,
        missiles: missilePylons,
        fireMissile: () => {
          gameAudio.playMissileLaunch();
          const firePos = root.position.clone();
          const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion);
          const impactPos = firePos.clone().add(fwd.multiplyScalar(40));
          impactPos.y = 0;

          zombies.forEach((z) => {
            if (!z.alive) return;
            if (z.root.position.distanceTo(impactPos) < 14.0) {
              z.alive = false;
              gameAudio.playZombieHit();
              z.triggerDeath(fwd.x * 3, fwd.z * 3);
              useGameStore.getState().incrementZombieKills();
              spawnLootAtCorpse(z.root.position);
              setTimeout(() => spawnZombieRig(z), 4000);
            }
          });
        },
        updateFlight: (throttleInput, rollInput, delta) => {
          const maxAirspeed = 52.0;
          if (throttleInput > 0) {
            airspeed = Math.min(maxAirspeed, airspeed + 24.0 * delta);
          } else if (throttleInput < 0) {
            airspeed = Math.max(0, airspeed - 18.0 * delta);
          }

          afterburnerL.visible = airspeed > 12;
          afterburnerR.visible = airspeed > 12;

          if (airspeed > 8) {
            root.rotation.y += rollInput * 1.8 * delta;
            root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, -rollInput * 0.45, 0.15);

            if (throttleInput > 0 && root.position.y < 85) {
              root.position.y += airspeed * 0.35 * delta;
              root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, -0.2, 0.1);
            } else if (throttleInput < 0 && root.position.y > 6) {
              root.position.y -= 14.0 * delta;
              root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, 0.2, 0.1);
            } else {
              root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, 0, 0.1);
            }

            const forwardDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), root.rotation.y);
            root.position.add(forwardDir.multiplyScalar(airspeed * delta));
          } else {
            root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, 0, 0.1);
            root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, 0, 0.1);
          }

          root.position.x = THREE.MathUtils.clamp(root.position.x, -160, 160);
          root.position.z = THREE.MathUtils.clamp(root.position.z, -160, 160);
          root.position.y = Math.max(5.8, root.position.y);

          return { airspeed, altitude: root.position.y };
        },
      };
    }

    const fighterJetRig = createFighterJet();

    // ============================================================
    // 5. MULTI-VEHICLE FLEET WITH TOGGLE CAPABILITIES
    // ============================================================

    function createVehicleFleet(): VehicleFleetRig {
      const container = new THREE.Group();
      container.position.set(0, 0, -32); // Spawn outside Garage

      const tireMat = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.9 });
      const rimMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

      // Model 1: Heavy Combat Rover (Tank)
      const roverGroup = new THREE.Group();
      const roverMat = new THREE.MeshStandardMaterial({ color: 0x121b24, metalness: 0.85, roughness: 0.3 });
      const chassisR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 4.4), roverMat);
      chassisR.position.y = 0.65;
      roverGroup.add(chassisR);
      const cabinR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2.2), roverMat);
      cabinR.position.set(0, 1.25, -0.2);
      roverGroup.add(cabinR);

      const roverWheels: THREE.Mesh[] = [];
      const roverSteer: THREE.Group[] = [];
      const wGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 16);
      wGeo.rotateZ(Math.PI / 2);

      [
        { x: -1.3, z: 1.4, f: true },
        { x: 1.3, z: 1.4, f: true },
        { x: -1.3, z: -1.4, f: false },
        { x: 1.3, z: -1.4, f: false },
      ].forEach((p) => {
        const node = new THREE.Group();
        node.position.set(p.x, 0.48, p.z);
        roverGroup.add(node);
        const wMesh = new THREE.Mesh(wGeo, tireMat);
        node.add(wMesh);
        roverWheels.push(wMesh);
        if (p.f) roverSteer.push(node);
      });

      const flashR1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
      flashR1.position.set(-0.35, 1.8, 1.8);
      flashR1.visible = false;
      roverGroup.add(flashR1);

      const flashR2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
      flashR2.position.set(0.35, 1.8, 1.8);
      flashR2.visible = false;
      roverGroup.add(flashR2);

      container.add(roverGroup);

      // Model 2: Cyber Interceptor GT (Supercar)
      const interceptorGroup = new THREE.Group();
      const carPaintMat = new THREE.MeshStandardMaterial({ color: 0x050c18, metalness: 0.95, roughness: 0.15 });
      const chassisI = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.48, 4.6), carPaintMat);
      chassisI.position.y = 0.48;
      interceptorGroup.add(chassisI);

      const cockpitI = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.45, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.65, metalness: 0.9 })
      );
      cockpitI.position.set(0, 0.88, -0.3);
      interceptorGroup.add(cockpitI);

      const wingI = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.4), carPaintMat);
      wingI.position.set(0, 1.05, -2.1);
      interceptorGroup.add(wingI);

      const intWheels: THREE.Mesh[] = [];
      const intSteer: THREE.Group[] = [];
      const intWGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 16);
      intWGeo.rotateZ(Math.PI / 2);

      [
        { x: -1.2, z: 1.4, f: true },
        { x: 1.2, z: 1.4, f: true },
        { x: -1.2, z: -1.4, f: false },
        { x: 1.2, z: -1.4, f: false },
      ].forEach((p) => {
        const node = new THREE.Group();
        node.position.set(p.x, 0.38, p.z);
        interceptorGroup.add(node);
        const wMesh = new THREE.Mesh(intWGeo, tireMat);
        node.add(wMesh);
        intWheels.push(wMesh);
        if (p.f) intSteer.push(node);
      });

      const flashI = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
      flashI.position.set(0, 0.6, 2.3);
      flashI.visible = false;
      interceptorGroup.add(flashI);

      interceptorGroup.visible = false;
      container.add(interceptorGroup);

      // Model 3: Bio-Hazard Off-Road Buggy
      const buggyGroup = new THREE.Group();
      const cageMat = new THREE.MeshStandardMaterial({ color: 0xffaa33, metalness: 0.8 });
      const chassisB = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 3.8), cageMat);
      chassisB.position.y = 0.7;
      buggyGroup.add(chassisB);

      // Roll Cage Bars
      const rollCage = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 1.1, 1.8),
        new THREE.MeshBasicMaterial({ color: 0xffaa33, wireframe: true })
      );
      rollCage.position.set(0, 1.4, -0.1);
      buggyGroup.add(rollCage);

      // Ramming Bumper
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.4), cageMat);
      bumper.position.set(0, 0.6, 2.0);
      buggyGroup.add(bumper);

      const bugWheels: THREE.Mesh[] = [];
      const bugSteer: THREE.Group[] = [];
      const bugWGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16);
      bugWGeo.rotateZ(Math.PI / 2);

      [
        { x: -1.35, z: 1.3, f: true },
        { x: 1.35, z: 1.3, f: true },
        { x: -1.35, z: -1.3, f: false },
        { x: 1.35, z: -1.3, f: false },
      ].forEach((p) => {
        const node = new THREE.Group();
        node.position.set(p.x, 0.55, p.z);
        buggyGroup.add(node);
        const wMesh = new THREE.Mesh(bugWGeo, tireMat);
        node.add(wMesh);
        bugWheels.push(wMesh);
        if (p.f) bugSteer.push(node);
      });

      const flashB = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), new THREE.MeshBasicMaterial({ color: 0xffaa33 }));
      flashB.position.set(0, 1.8, 0.6);
      flashB.visible = false;
      buggyGroup.add(flashB);

      buggyGroup.visible = false;
      container.add(buggyGroup);

      scene.add(container);

      const vehiclesMap: Record<VehicleType, VehicleMeshSet> = {
        rover: { root: roverGroup, wheels: roverWheels, frontSteerGroup: roverSteer, muzzleFlashes: [flashR1, flashR2] },
        interceptor: { root: interceptorGroup, wheels: intWheels, frontSteerGroup: intSteer, muzzleFlashes: [flashI] },
        buggy: { root: buggyGroup, wheels: bugWheels, frontSteerGroup: bugSteer, muzzleFlashes: [flashB] },
      };

      return {
        container,
        vehicles: vehiclesMap,
        speed: 0,
        steering: 0,
        activeType: 'rover',
        triggerFire: () => {
          gameAudio.playCarCannon();
          const active = vehiclesMap[this_fleet.activeType];
          active.muzzleFlashes.forEach((f) => (f.visible = true));
          setTimeout(() => {
            active.muzzleFlashes.forEach((f) => (f.visible = false));
          }, 80);
        },
        updatePhysics: (forwardInput, turnInput, delta) => {
          const def = VEHICLE_REGISTRY[this_fleet.activeType];
          const maxSpeed = def.speed;
          const accel = 20.0;
          const friction = 8.5;

          if (forwardInput !== 0) {
            this_fleet.speed += forwardInput * accel * delta;
            this_fleet.speed = THREE.MathUtils.clamp(this_fleet.speed, -maxSpeed * 0.5, maxSpeed);
          } else {
            if (this_fleet.speed > 0) this_fleet.speed = Math.max(0, this_fleet.speed - friction * delta);
            else if (this_fleet.speed < 0) this_fleet.speed = Math.min(0, this_fleet.speed + friction * delta);
          }

          const targetSteer = turnInput * (this_fleet.activeType === 'interceptor' ? 0.6 : 0.48);
          this_fleet.steering = THREE.MathUtils.lerp(this_fleet.steering, targetSteer, 0.16);

          const activeSet = vehiclesMap[this_fleet.activeType];
          activeSet.frontSteerGroup.forEach((n) => (n.rotation.y = this_fleet.steering));

          if (Math.abs(this_fleet.speed) > 0.1) {
            const mult = this_fleet.speed > 0 ? 1 : -1;
            container.rotation.y += this_fleet.steering * 2.0 * delta * mult;
          }

          const moveDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), container.rotation.y);
          const velocity = moveDir.clone().multiplyScalar(this_fleet.speed);
          container.position.add(velocity.clone().multiplyScalar(delta));

          const wheelTurn = (this_fleet.speed / 0.48) * delta;
          activeSet.wheels.forEach((w) => (w.rotation.x += wheelTurn));

          const maxB = citySize / 2 - 3.5;
          container.position.x = THREE.MathUtils.clamp(container.position.x, -maxB, maxB);
          container.position.z = THREE.MathUtils.clamp(container.position.z, -maxB, maxB);

          return { movedDist: Math.abs(this_fleet.speed * delta), velocity };
        },
        switchModel: (type) => {
          this_fleet.activeType = type;
          Object.keys(vehiclesMap).forEach((k) => {
            vehiclesMap[k as VehicleType].root.visible = k === type;
          });
        },
      };
    }

    let this_fleet: VehicleFleetRig;
    const fleetRig = createVehicleFleet();
    this_fleet = fleetRig;

    // ============================================================
    // 6. ULTRA-REALISTIC HUMANOID OPERATIVE (PLAYER CHARACTER)
    // ============================================================

    function createHumanoidPlayer(): PlayerRig {
      const root = new THREE.Group();

      const armorMat = new THREE.MeshStandardMaterial({ color: 0x0c131a, metalness: 0.88, roughness: 0.28 });
      const vestMat = new THREE.MeshStandardMaterial({ color: 0x14202c, metalness: 0.72, roughness: 0.42 });
      const jointMat = new THREE.MeshStandardMaterial({ color: 0x070b10, roughness: 0.85 });
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const reactorMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      const weaponMat = new THREE.MeshStandardMaterial({ color: 0x182430, metalness: 0.9, roughness: 0.2 });

      const pelvis = new THREE.Group();
      pelvis.position.y = 0.85;
      root.add(pelvis);

      const hipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.26), armorMat);
      hipMesh.castShadow = true;
      pelvis.add(hipMesh);

      const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.3), vestMat);
      beltMesh.position.y = 0.08;
      pelvis.add(beltMesh);

      const torso = new THREE.Group();
      torso.position.y = 0.26;
      pelvis.add(torso);

      const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.32), vestMat);
      chestMesh.position.y = 0.22;
      chestMesh.castShadow = true;
      torso.add(chestMesh);

      const armorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.08), armorMat);
      armorPlate.position.set(0, 0.24, 0.17);
      torso.add(armorPlate);

      const reactorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), reactorMat);
      reactorCore.rotation.x = Math.PI / 2;
      reactorCore.position.set(0, 0.24, 0.22);
      torso.add(reactorCore);

      const packMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 0.16), armorMat);
      packMesh.position.set(0, 0.22, -0.22);
      torso.add(packMesh);

      const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const thrusterLight1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), thrusterMat);
      thrusterLight1.position.set(-0.11, -0.06, -0.23);
      torso.add(thrusterLight1);
      const thrusterLight2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), thrusterMat);
      thrusterLight2.position.set(0.11, -0.06, -0.23);
      torso.add(thrusterLight2);

      const head = new THREE.Group();
      head.position.y = 0.52;
      torso.add(head);

      const helmetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.32), armorMat);
      helmetMesh.position.y = 0.15;
      helmetMesh.castShadow = true;
      head.add(helmetMesh);

      const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.1), visorMat);
      visorMesh.position.set(0, 0.16, 0.16);
      head.add(visorMesh);

      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.15, -0.05, 0);
      pelvis.add(leftLeg);
      const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.42, 0.2), vestMat);
      thighL.position.y = -0.21;
      leftLeg.add(thighL);
      const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.18), armorMat);
      shinL.position.y = -0.58;
      leftLeg.add(shinL);
      const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.14, 0.28), jointMat);
      bootL.position.set(0, -0.78, 0.05);
      leftLeg.add(bootL);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.15, -0.05, 0);
      pelvis.add(rightLeg);
      const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.42, 0.2), vestMat);
      thighR.position.y = -0.21;
      rightLeg.add(thighR);
      const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.18), armorMat);
      shinR.position.y = -0.58;
      rightLeg.add(shinR);
      const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.14, 0.28), jointMat);
      bootR.position.set(0, -0.78, 0.05);
      rightLeg.add(bootR);

      const leftArm = new THREE.Group();
      leftArm.position.set(-0.32, 0.36, 0);
      torso.add(leftArm);
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.35, 0.16), vestMat);
      armL.position.y = -0.175;
      leftArm.add(armL);
      const forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.14), armorMat);
      forearmL.position.set(0.12, -0.36, 0.18);
      forearmL.rotation.x = -Math.PI / 4;
      leftArm.add(forearmL);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.32, 0.36, 0);
      torso.add(rightArm);
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.35, 0.16), vestMat);
      armR.position.y = -0.175;
      rightArm.add(armR);
      const forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.14), armorMat);
      forearmR.position.set(-0.06, -0.34, 0.22);
      forearmR.rotation.x = -Math.PI / 3;
      rightArm.add(forearmR);

      const weaponMount = new THREE.Group();
      weaponMount.position.set(0.18, 0.05, 0.38);
      torso.add(weaponMount);

      const plasmaGun = new THREE.Group();
      plasmaGun.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.55), weaponMat));
      weaponMount.add(plasmaGun);

      const shotgun = new THREE.Group();
      shotgun.add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.6), weaponMat));
      shotgun.visible = false;
      weaponMount.add(shotgun);

      const railgun = new THREE.Group();
      railgun.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.85), weaponMat));
      railgun.visible = false;
      weaponMount.add(railgun);

      const minigun = new THREE.Group();
      minigun.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.5), weaponMat));
      const minigunBarrels = new THREE.Group();
      minigunBarrels.position.set(0, 0, 0.45);
      minigun.add(minigunBarrels);
      for (let b = 0; b < 6; b++) {
        const ang = (b / 6) * Math.PI * 2;
        const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), weaponMat);
        bMesh.rotation.x = Math.PI / 2;
        bMesh.position.set(Math.cos(ang) * 0.08, Math.sin(ang) * 0.08, 0.3);
        minigunBarrels.add(bMesh);
      }
      minigun.visible = false;
      weaponMount.add(minigun);

      const weapons: Record<WeaponType, THREE.Group> = { plasma: plasmaGun, shotgun, railgun, minigun };

      const muzzleFlash = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
      muzzleFlash.position.set(0, 0.02, 0.85);
      muzzleFlash.visible = false;
      weaponMount.add(muzzleFlash);

      let walkPhase = 0;

      return {
        root,
        torso,
        head,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        weaponMount,
        weapons,
        minigunBarrels,
        muzzleFlash,
        thrusterLight1,
        thrusterLight2,
        updateAnimation: (isMoving, speedNorm, delta, time, isJumping) => {
          if (isMoving) {
            walkPhase += delta * 11 * speedNorm;
            leftLeg.rotation.x = Math.sin(walkPhase) * 0.75;
            rightLeg.rotation.x = -Math.sin(walkPhase) * 0.75;
            leftArm.rotation.x = -Math.sin(walkPhase) * 0.35;
            rightArm.rotation.x = Math.sin(walkPhase) * 0.2;
            pelvis.position.y = 0.85 + Math.abs(Math.sin(walkPhase * 2)) * 0.07;
          } else {
            walkPhase = 0;
            leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.15);
            rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.15);
            leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 0.15);
            rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 0.15);
            pelvis.position.y = 0.85;
            torso.position.y = 0.26 + Math.sin(time * 2.5) * 0.015;
          }

          if (isJumping) {
            leftLeg.rotation.x = 0.35;
            rightLeg.rotation.x = 0.35;
            thrusterLight1.scale.set(1.8, 1.8, 1.8);
            thrusterLight2.scale.set(1.8, 1.8, 1.8);
          } else {
            thrusterLight1.scale.set(1, 1, 1);
            thrusterLight2.scale.set(1, 1, 1);
          }

          weaponMount.position.z = THREE.MathUtils.lerp(weaponMount.position.z, 0.38, 0.2);
        },
        triggerFire: () => {
          muzzleFlash.visible = true;
          weaponMount.position.z = 0.26;
          setTimeout(() => (muzzleFlash.visible = false), 65);
        },
        setWeaponVisible: (type) => {
          Object.keys(weapons).forEach((k) => (weapons[k as WeaponType].visible = k === type));
        },
      };
    }

    const playerRig = createHumanoidPlayer();
    scene.add(playerRig.root);

    // Register Dynamic Newtonian Rigid Bodies in Physics World
    const playerCapsule = new CapsuleCollider(new THREE.Vector3(0, 0.9, 0), 0.45, 1.8, 'player');
    const playerRigidBody = new RigidBody(75.0);
    playerRigidBody.collider = playerCapsule;
    playerRigidBody.drag = 0.08;
    playerRigidBody.friction = 0.75;
    physicsWorld.dynamicBodies = [];
    physicsWorld.addDynamicBody(playerRigidBody);

    const vehicleBoxCollider = new BoxCollider(fleetRig.container.position, new THREE.Vector3(2.4, 1.6, 4.6), 'vehicle');
    const vehicleRigidBody = new RigidBody(1800.0);
    vehicleRigidBody.collider = vehicleBoxCollider;
    vehicleRigidBody.drag = 0.12;
    vehicleRigidBody.friction = 0.6;
    physicsWorld.addDynamicBody(vehicleRigidBody);

    // ============================================================
    // 6B. 3D ASSET IMPORT SLOTS & CENTRAL PLAZA EXHIBITION PEDESTAL
    // ============================================================
    const playerAssetSlot = new THREE.Group();
    playerRig.root.add(playerAssetSlot);

    const vehicleAssetSlot = new THREE.Group();
    fleetRig.container.add(vehicleAssetSlot);

    // Central Plaza Exhibition Pedestal (Heart of City at 0, 0, -14)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0, -14);

    const pedBaseMat = new THREE.MeshStandardMaterial({ color: 0x0a121c, metalness: 0.85, roughness: 0.25 });
    const pedRingMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });

    const pedCylinder = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 0.6, 32), pedBaseMat);
    pedCylinder.position.y = 0.3;
    pedCylinder.receiveShadow = true;
    pedestalGroup.add(pedCylinder);

    const pedGlowRing = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.08, 12, 48), pedRingMat);
    pedGlowRing.rotation.x = Math.PI / 2;
    pedGlowRing.position.y = 0.61;
    pedestalGroup.add(pedGlowRing);

    for (let p = 0; p < 4; p++) {
      const pAng = (p / 4) * Math.PI * 2;
      const px = Math.cos(pAng) * 4.6;
      const pz = Math.sin(pAng) * 4.6;
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.2, 8), pedBaseMat);
      pylon.position.set(px, 1.1, pz);
      pedestalGroup.add(pylon);

      const pBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), pedRingMat);
      pBeacon.position.set(px, 2.2, pz);
      pedestalGroup.add(pBeacon);
    }

    const rotatingHoloRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.04, 8, 36),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.7 })
    );
    rotatingHoloRing.position.y = 2.4;
    pedestalGroup.add(rotatingHoloRing);

    const landmarkAssetSlot = new THREE.Group();
    landmarkAssetSlot.position.set(0, 0.6, 0);
    pedestalGroup.add(landmarkAssetSlot);

    const exhibitSignTex = createSignTexture('3D ASSET EXHIBITION', 'LIVE ONLINE PBR DEPLOYMENT', '#00f2ff');
    const exhibitSign = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.2), new THREE.MeshBasicMaterial({ map: exhibitSignTex }));
    exhibitSign.position.set(0, 3.8, 5.0);
    pedestalGroup.add(exhibitSign);

    scene.add(pedestalGroup);

    // Autonomous Companion Recon Drone
    const droneGroup = new THREE.Group();
    const droneMat = new THREE.MeshStandardMaterial({ color: 0x0f1822, metalness: 0.9, roughness: 0.2 });
    const droneCore = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.7), droneMat);
    droneGroup.add(droneCore);

    const droneVisor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.12), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
    droneVisor.position.set(0, 0.02, 0.36);
    droneGroup.add(droneVisor);

    const rotorL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.06), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
    rotorL.position.set(-0.45, 0.14, 0);
    droneGroup.add(rotorL);

    const rotorR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.06), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
    rotorR.position.set(0.45, 0.14, 0);
    droneGroup.add(rotorR);

    const droneSpot = new THREE.SpotLight(0x00f2ff, 3.5, 18, Math.PI / 4, 0.5, 1.2);
    droneSpot.position.set(0, -0.1, 0);
    droneGroup.add(droneSpot);
    droneGroup.add(droneSpot.target);
    droneSpot.target.position.set(0, -5, 2);

    const droneAssetSlot = new THREE.Group();
    droneGroup.add(droneAssetSlot);
    scene.add(droneGroup);

    // Vehicle Headlight Spotlights (High-Fidelity Night Beams)
    const headlightL = new THREE.SpotLight(0xdfeeff, 0, 48, Math.PI / 5, 0.35, 1.1);
    headlightL.position.set(-0.7, 0.8, 2.2);
    fleetRig.container.add(headlightL);
    fleetRig.container.add(headlightL.target);
    headlightL.target.position.set(-0.7, 0, 18);

    const headlightR = new THREE.SpotLight(0xdfeeff, 0, 48, Math.PI / 5, 0.35, 1.1);
    headlightR.position.set(0.7, 0.8, 2.2);
    fleetRig.container.add(headlightR);
    fleetRig.container.add(headlightR.target);
    headlightR.target.position.set(0.7, 0, 18);

    const activeMixers: THREE.AnimationMixer[] = [];

    // Subscription to Asset Loader Service
    const unsubAssetLoader = assetLoader.subscribe((data) => {
      if (data.status === 'loaded') {
        if (data.target === 'player') {
          while (playerAssetSlot.children.length > 0) playerAssetSlot.remove(playerAssetSlot.children[0]);
          playerAssetSlot.add(data.group);
          playerRig.torso.visible = false;
          playerRig.leftArm.visible = false;
          playerRig.rightArm.visible = false;
          playerRig.leftLeg.visible = false;
          playerRig.rightLeg.visible = false;
          if (data.mixer) activeMixers.push(data.mixer);
        } else if (data.target === 'vehicle') {
          while (vehicleAssetSlot.children.length > 0) vehicleAssetSlot.remove(vehicleAssetSlot.children[0]);
          vehicleAssetSlot.add(data.group);
          Object.keys(fleetRig.vehicles).forEach((k) => {
            fleetRig.vehicles[k as VehicleType].root.visible = false;
          });
          if (data.mixer) activeMixers.push(data.mixer);
        } else if (data.target === 'landmark') {
          while (landmarkAssetSlot.children.length > 0) landmarkAssetSlot.remove(landmarkAssetSlot.children[0]);
          landmarkAssetSlot.add(data.group);
          if (data.mixer) activeMixers.push(data.mixer);
        } else if (data.target === 'drone') {
          while (droneAssetSlot.children.length > 0) droneAssetSlot.remove(droneAssetSlot.children[0]);
          droneAssetSlot.add(data.group);
          droneCore.visible = false;
          if (data.mixer) activeMixers.push(data.mixer);
        }
      } else if (data.status === 'idle') {
        if (data.target === 'player') {
          while (playerAssetSlot.children.length > 0) playerAssetSlot.remove(playerAssetSlot.children[0]);
          playerRig.torso.visible = true;
          playerRig.leftArm.visible = true;
          playerRig.rightArm.visible = true;
          playerRig.leftLeg.visible = true;
          playerRig.rightLeg.visible = true;
        } else if (data.target === 'vehicle') {
          while (vehicleAssetSlot.children.length > 0) vehicleAssetSlot.remove(vehicleAssetSlot.children[0]);
          fleetRig.switchModel(useGameStore.getState().currentVehicle);
        } else if (data.target === 'landmark') {
          while (landmarkAssetSlot.children.length > 0) landmarkAssetSlot.remove(landmarkAssetSlot.children[0]);
        } else if (data.target === 'drone') {
          while (droneAssetSlot.children.length > 0) droneAssetSlot.remove(droneAssetSlot.children[0]);
          droneCore.visible = true;
        }
      }
    });

    // ============================================================
    // 7. ULTRA-REALISTIC DECAYED HUMAN ZOMBIES (3 ARCHETYPES)
    // ============================================================

    function createHumanoidZombie(id: number): ZombieRig {
      const root = new THREE.Group();
      const seed = id * 1.37 + Math.random() * 2.0;

      const archetypes: Array<'suit' | 'hazmat' | 'runner'> = ['suit', 'hazmat', 'runner'];
      const archetype = archetypes[id % 3];

      let clothColor = 0x1f2730;
      if (archetype === 'hazmat') clothColor = 0x998822; // Hazmat containment yellow
      else if (archetype === 'runner') clothColor = 0x3d3024; // Grungy urban hoodie

      const skinMat = new THREE.MeshStandardMaterial({ color: 0x273b2c, roughness: 0.9 });
      const clothMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.95 });
      const boneMat = new THREE.MeshStandardMaterial({ color: 0x9fa89f, roughness: 0.8 });
      const toxicVeinMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
      const glowingEyeMat = new THREE.MeshBasicMaterial({ color: 0xff003c });

      const pelvis = new THREE.Group();
      pelvis.position.y = 0.8;
      root.add(pelvis);

      const pantsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.26), clothMat);
      pantsMesh.castShadow = true;
      pelvis.add(pantsMesh);

      const torso = new THREE.Group();
      torso.position.y = 0.24;
      torso.rotation.x = 0.22;
      pelvis.add(torso);

      const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.44, 0.3), clothMat);
      torsoMesh.position.y = 0.22;
      torsoMesh.castShadow = true;
      torso.add(torsoMesh);

      const rib1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.08), boneMat);
      rib1.position.set(0.08, 0.22, 0.16);
      torso.add(rib1);

      const toxicVein = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.04), toxicVeinMat);
      toxicVein.position.set(0.12, 0.18, 0.17);
      torso.add(toxicVein);

      const head = new THREE.Group();
      head.position.set(0, 0.52, 0.08);
      torso.add(head);

      const skullMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.3), skinMat);
      skullMesh.position.y = 0.14;
      skullMesh.castShadow = true;
      head.add(skullMesh);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), glowingEyeMat);
      eyeL.position.set(-0.08, 0.17, 0.16);
      head.add(eyeL);

      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), glowingEyeMat);
      eyeR.position.set(0.08, 0.17, 0.16);
      head.add(eyeR);

      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.18), skinMat);
      jaw.position.set(0, 0.02, 0.1);
      head.add(jaw);

      const leftArm = new THREE.Group();
      leftArm.position.set(-0.3, 0.38, 0.05);
      leftArm.rotation.x = -1.35;
      torso.add(leftArm);
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.38, 0.14), skinMat);
      armL.position.y = -0.19;
      leftArm.add(armL);
      const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.18), boneMat);
      clawL.position.set(0, -0.42, 0.04);
      leftArm.add(clawL);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.3, 0.38, 0.05);
      rightArm.rotation.x = -1.45;
      torso.add(rightArm);
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.38, 0.14), skinMat);
      armR.position.y = -0.19;
      rightArm.add(armR);
      const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.18), boneMat);
      clawR.position.set(0, -0.42, 0.04);
      rightArm.add(clawR);

      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.14, -0.05, 0);
      pelvis.add(leftLeg);
      const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.18), clothMat);
      thighL.position.y = -0.21;
      leftLeg.add(thighL);
      const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.16), skinMat);
      shinL.position.y = -0.58;
      leftLeg.add(shinL);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.14, -0.05, 0);
      pelvis.add(rightLeg);
      const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.18), clothMat);
      thighR.position.y = -0.21;
      rightLeg.add(thighR);
      const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.16), skinMat);
      shinR.position.y = -0.58;
      rightLeg.add(shinR);

      scene.add(root);

      return {
        root,
        torso,
        head,
        jaw,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        alive: true,
        speed: (archetype === 'runner' ? 2.4 : 1.7) + Math.random() * 0.8,
        lastBiteTime: 0,
        seed,
        archetype,
        updateAnimation: (time, delta, isBiting) => {
          leftLeg.rotation.x = Math.sin(time * 4.2 + seed) * 0.65;
          rightLeg.rotation.x = Math.sin(time * 4.2 + seed + 1.3) * 0.35;
          torso.rotation.z = Math.sin(time * 2.8 + seed) * 0.14;
          head.rotation.y = Math.sin(time * 6.5 + seed) * 0.22;
          leftArm.rotation.x = -1.35 + Math.sin(time * 3.8 + seed) * 0.2;
          rightArm.rotation.x = -1.45 + Math.cos(time * 3.8 + seed) * 0.2;

          if (isBiting) {
            torso.rotation.x = 0.45;
            jaw.position.y = -0.06 + Math.abs(Math.sin(time * 16)) * 0.08;
            leftArm.rotation.x = -1.7;
            rightArm.rotation.x = -1.7;
          } else {
            torso.rotation.x = 0.22;
            jaw.position.y = 0.02;
          }
        },
        triggerDeath: (impulseX = 0, impulseZ = 0) => {
          root.rotation.x = -Math.PI / 2.2;
          root.position.y = 0.2;
          root.position.x += impulseX * 2.0;
          root.position.z += impulseZ * 2.0;
        },
        respawn: (x, z) => {
          root.rotation.x = 0;
          root.position.set(x, 0, z);
          root.visible = true;
        },
      };
    }

    const zombieCount = 24;
    const zombies: ZombieRig[] = [];

    function spawnZombieRig(z: ZombieRig) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 35 + Math.random() * 25;
      const x = Math.cos(angle) * radius;
      const zPos = Math.sin(angle) * radius;
      z.alive = true;
      z.respawn(x, zPos);
    }

    for (let i = 0; i < zombieCount; i++) {
      const zRig = createHumanoidZombie(i);
      spawnZombieRig(zRig);
      zombies.push(zRig);
    }

    // ==========================================
    // 8. ALLIED SQUAD OPERATIVES (TEAMMATES)
    // ==========================================

    function createSquadTeammate(callsign: string, offsetPos: THREE.Vector3): SquadTeammate {
      const root = new THREE.Group();
      root.position.copy(offsetPos);

      const teamArmorMat = new THREE.MeshStandardMaterial({ color: 0x182430, metalness: 0.8 });
      const teamVisorMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

      const torso = new THREE.Group();
      torso.position.y = 1.1;
      root.add(torso);

      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.32), teamArmorMat);
      bodyMesh.castShadow = true;
      torso.add(bodyMesh);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.3), teamArmorMat);
      head.position.y = 0.42;
      torso.add(head);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.08), teamVisorMat);
      visor.position.set(0, 0.42, 0.16);
      torso.add(visor);

      const allyRifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.6), teamArmorMat);
      allyRifle.position.set(0.15, -0.05, 0.35);
      torso.add(allyRifle);

      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.15, 0.8, 0);
      root.add(leftLeg);
      const legMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.8, 0.18), teamArmorMat);
      legMeshL.position.y = -0.4;
      leftLeg.add(legMeshL);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.15, 0.8, 0);
      root.add(rightLeg);
      const legMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.8, 0.18), teamArmorMat);
      legMeshR.position.y = -0.4;
      rightLeg.add(legMeshR);

      scene.add(root);

      return {
        root,
        leftLeg,
        rightLeg,
        callsign,
        targetZombie: null,
        lastFireTime: 0,
        updateAI: (time, delta, playerPos, activeZombies) => {
          const distToPlayer = root.position.distanceTo(playerPos);
          let isMoving = false;

          if (distToPlayer > 8.0) {
            const dir = playerPos.clone().sub(root.position).normalize();
            dir.y = 0;
            root.position.add(dir.multiplyScalar(4.5 * delta));
            root.rotation.y = Math.atan2(dir.x, dir.z);
            isMoving = true;
          }

          if (isMoving) {
            leftLeg.rotation.x = Math.sin(time * 9) * 0.6;
            rightLeg.rotation.x = -Math.sin(time * 9) * 0.6;
          } else {
            leftLeg.rotation.x = 0;
            rightLeg.rotation.x = 0;
          }

          if (time - this_ally.lastFireTime > 0.85) {
            let closestZ: ZombieRig | null = null;
            let closestDist = 20.0;

            activeZombies.forEach((z) => {
              if (!z.alive) return;
              const d = root.position.distanceTo(z.root.position);
              if (d < closestDist) {
                closestDist = d;
                closestZ = z;
              }
            });

            if (closestZ) {
              this_ally.targetZombie = closestZ;
              this_ally.lastFireTime = time;

              const dirToZ = (closestZ as ZombieRig).root.position.clone().sub(root.position).normalize();
              root.rotation.y = Math.atan2(dirToZ.x, dirToZ.z);

              gameAudio.playLaser();
              spawnLaserProjectile(root.position.clone().add(new THREE.Vector3(0, 1.1, 0)), dirToZ, 30, 'plasma');
            }
          }
        },
      };
    }

    let this_ally: SquadTeammate;
    const squadAllies: SquadTeammate[] = [
      createSquadTeammate('SQUAD CIPHER-7', new THREE.Vector3(-6, 0, 4)),
      createSquadTeammate('SQUAD GHOST-9', new THREE.Vector3(6, 0, 4)),
    ];
    this_ally = squadAllies[0];

    // ==========================================
    // 9. PROJECTILES & WEAPON BEAMS
    // ==========================================

    interface Projectile {
      mesh: THREE.Mesh;
      dir: THREE.Vector3;
      alive: boolean;
      life: number;
      damage: number;
      isPiercing: boolean;
    }
    const laserPool: Projectile[] = [];

    function spawnLaserProjectile(startPos: THREE.Vector3, dir: THREE.Vector3, damage: number, type: WeaponType | 'car') {
      let geo: THREE.BufferGeometry;
      let mat: THREE.Material;
      let life = 1.6;
      let isPiercing = false;

      if (type === 'car') {
        geo = new THREE.SphereGeometry(0.22, 8, 8);
        mat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      } else if (type === 'shotgun') {
        geo = new THREE.SphereGeometry(0.12, 6, 6);
        mat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
        life = 0.8;
      } else if (type === 'railgun') {
        geo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
        geo.rotateX(Math.PI / 2);
        mat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        isPiercing = true;
        life = 2.0;
      } else if (type === 'minigun') {
        geo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
        geo.rotateX(Math.PI / 2);
        mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        life = 1.2;
      } else {
        geo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8);
        geo.rotateX(Math.PI / 2);
        mat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(startPos);
      mesh.rotation.y = Math.atan2(dir.x, dir.z);
      scene.add(mesh);

      laserPool.push({ mesh, dir, alive: true, life, damage, isPiercing });
    }

    function fireCurrentWeapon() {
      const store = useGameStore.getState();
      const inVehicle = store.inVehicle;

      if (inVehicle) {
        fleetRig.triggerFire();
        const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), fleetRig.container.rotation.y);
        const muzzlePos = fleetRig.container.position.clone().add(fwd.clone().multiplyScalar(2.2));
        muzzlePos.y += 1.4;

        spawnLaserProjectile(muzzlePos, fwd, 120, 'car');
        return;
      }

      // Check Magazine Ammo & Reload State
      const hasAmmo = store.consumeAmmo();
      if (!hasAmmo) return;

      playerRig.triggerFire();
      const activeWep = store.currentWeapon;
      const def = WEAPON_REGISTRY[activeWep];

      // Aim-Down-Sights (ADS) tightens bullet spread by 65%
      const isAiming = store.isAiming;
      const spreadMult = isAiming ? 0.35 : 1.0;

      const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRig.root.rotation.y);
      const spawnPos = playerRig.root.position.clone();
      spawnPos.y += 1.1;
      spawnPos.add(fwd.clone().multiplyScalar(0.9));

      if (activeWep === 'plasma') {
        gameAudio.playLaser();
        spawnLaserProjectile(spawnPos, fwd, def.damage, 'plasma');
      } else if (activeWep === 'shotgun') {
        gameAudio.playShotgun();
        for (let p = -2; p <= 2; p++) {
          const spreadAngle = p * 0.08 * spreadMult;
          const spreadDir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
          spawnLaserProjectile(spawnPos, spreadDir, def.damage, 'shotgun');
        }
      } else if (activeWep === 'railgun') {
        gameAudio.playRailgun();
        spawnLaserProjectile(spawnPos, fwd, def.damage, 'railgun');
      } else if (activeWep === 'minigun') {
        gameAudio.playMinigun();
        if (playerRig.minigunBarrels) playerRig.minigunBarrels.rotation.z += 0.8;
        const spreadAngle = (Math.random() - 0.5) * 0.06 * spreadMult;
        const spreadDir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
        spawnLaserProjectile(spawnPos, spreadDir, def.damage, 'minigun');
      }
    }

    // ==========================================
    // 10. ZOMBIE LOOT & RESOURCE SYSTEM
    // ==========================================

    const resourcePool: ResourceDrop[] = [];

    function spawnLootAtCorpse(pos: THREE.Vector3) {
      const rand = Math.random();
      let type: 'nexToken' | 'bioSamples' | 'plasmaCells' | 'nanoScrap' = 'nexToken';
      let amount = 25;
      let geo: THREE.BufferGeometry;
      let mat: THREE.Material;

      if (rand > 0.8) {
        type = 'plasmaCells';
        amount = 1;
        geo = new THREE.CylinderGeometry(0.18, 0.18, 0.5, 6);
        mat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, emissive: 0x00f2ff, emissiveIntensity: 0.8 });
      } else if (rand > 0.6) {
        type = 'nanoScrap';
        amount = 1;
        geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        mat = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xffaa33, emissiveIntensity: 0.8 });
      } else if (rand > 0.35) {
        type = 'bioSamples';
        amount = 1;
        geo = new THREE.CylinderGeometry(0.14, 0.14, 0.45, 8);
        mat = new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff66, emissiveIntensity: 0.8 });
      } else {
        type = 'nexToken';
        amount = 35;
        geo = new THREE.OctahedronGeometry(0.4, 0);
        mat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.8 });
      }

      const root = new THREE.Group();
      root.position.set(pos.x, 0.8, pos.z);
      root.add(new THREE.Mesh(geo, mat));
      scene.add(root);

      resourcePool.push({ root, type, amount, active: true });
    }

    // Antidote Stations
    const antidoteStations: THREE.Group[] = [];
    [
      [0, 0.7, 0],
      [-24, 0.7, 24],
      [24, 0.7, -24],
    ].forEach(([x, y, z]) => {
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.add(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16),
          new THREE.MeshStandardMaterial({ color: 0x00f2ff, emissive: 0x00f2ff, emissiveIntensity: 0.7, transparent: true, opacity: 0.88 })
        )
      );
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      scene.add(group);
      antidoteStations.push(group);
    });

    // ==========================================
    // 11. INPUT LISTENERS
    // ==========================================

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;

      if (e.code === 'Digit1') useGameStore.getState().switchWeapon('plasma');
      if (e.code === 'Digit2') useGameStore.getState().switchWeapon('shotgun');
      if (e.code === 'Digit3') useGameStore.getState().switchWeapon('railgun');
      if (e.code === 'Digit4') useGameStore.getState().switchWeapon('minigun');

      // Weapon reload key
      if (e.code === 'KeyR') {
        useGameStore.getState().reloadCurrentWeapon();
      }

      // Tactical Crouch & Slide key
      if (e.code === 'KeyC' || e.code === 'ControlLeft') {
        const store = useGameStore.getState();
        if (store.isSprinting && !store.isSliding) {
          store.setSliding(true);
          setTimeout(() => {
            useGameStore.getState().setSliding(false);
          }, 1100);
        } else {
          store.setCrouching(!store.isCrouching);
        }
      }

      // Board SpaceX Starship with 'B'
      if (e.code === 'KeyB') {
        const store = useGameStore.getState();
        const distToRocket = playerRig.root.position.distanceTo(spaceportGroup.position);
        if (distToRocket < 28.0 && !store.starshipFlight.isActive) {
          store.startStarshipFlight('planet_oblivion');
        }
      }

      // Toggle Vehicle Type with 'V'
      if (e.code === 'KeyV') {
        const store = useGameStore.getState();
        const types: VehicleType[] = ['rover', 'interceptor', 'buggy'];
        const currentIdx = types.indexOf(store.currentVehicle);
        const nextType = types[(currentIdx + 1) % types.length];
        if (store.unlockedVehicles.includes(nextType)) {
          store.switchVehicle(nextType);
        }
      }

      if (e.code === 'KeyE') {
        const store = useGameStore.getState();
        if (store.inPlane) {
          store.exitPlane();
        } else if (store.inVehicle) {
          store.exitVehicle();
        } else {
          const distToJet = playerRig.root.position.distanceTo(fighterJetRig.root.position);
          if (distToJet < 7.0) {
            store.enterPlane();
          } else if (store.hasVehicle) {
            const distToCar = playerRig.root.position.distanceTo(fleetRig.container.position);
            if (distToCar < 5.0) store.enterVehicle();
          }
        }
      }

      if (e.code === 'KeyO') {
        const store = useGameStore.getState();
        store.setNearLocation(store.nearLocation === 'asset_importer' ? 'none' : 'asset_importer');
      }

      if (e.code === 'KeyF') {
        const store = useGameStore.getState();
        if (store.nearLocation === 'subway_station') {
          if (store.underground.isUnderground) {
            store.exitUnderground();
            playerRigidBody.position.set(18, 1, 28);
            playerCapsule.center.set(18, 2, 28);
          } else {
            store.enterUnderground();
            playerRigidBody.position.set(20, -21, 20);
            playerCapsule.center.set(20, -20, 20);
          }
          return;
        }
        if (store.nearLocation === 'underground_bunker') {
          store.lootSewerSample();
          return;
        }
      }

      if (e.code === 'KeyF' || e.code === 'Enter') {
        const store = useGameStore.getState();
        if (store.inPlane) {
          fighterJetRig.fireMissile();
        } else if (store.inVehicle) {
          fleetRig.triggerFire();
        } else {
          fireCurrentWeapon();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      const store = useGameStore.getState();
      if (e.button === 2) {
        // Right Mouse Click: Aim Down Sights (ADS)
        store.setAiming(true);
        return;
      }
      if (store.inPlane) {
        fighterJetRig.fireMissile();
      } else if (store.inVehicle) {
        fleetRig.triggerFire();
      } else {
        fireCurrentWeapon();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        useGameStore.getState().setAiming(false);
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    // ==========================================
    // 12. MAIN GAME LOOP
    // ==========================================

    let animId: number;
    let clock = new THREE.Clock();
    let playerVy = 0;
    const gravity = -18;
    let lastShootTime = 0;

    function gameLoop() {
      animId = requestAnimationFrame(gameLoop);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Update loaded 3D GLTF animation mixers
      activeMixers.forEach((mixer) => mixer.update(delta));

      const gameStore = useGameStore.getState();
      const isApocalypse = gameStore.mode === 'apocalypse';
      const inVehicle = gameStore.inVehicle;
      const inPlane = gameStore.inPlane;

      // Planetary World Atmospheric Transition
      const currentWorld = gameStore.currentWorld;
      if (currentWorld === 'planet_oblivion') {
        scene.fog = new THREE.FogExp2(0x0a1608, 0.016);
        mainDirectional.color.setHex(0xff6644);
      } else if (currentWorld === 'nebula_prime') {
        scene.fog = new THREE.FogExp2(0x150824, 0.008);
        mainDirectional.color.setHex(0xbb77ff);
      } else {
        scene.fog = new THREE.FogExp2(0x060c16, 0.010);
        mainDirectional.color.setHex(0xdfeeff);
      }

      // Planetary Rocket Launch & SpaceX / NASA Multi-Stage Orbital Flight Simulation
      if (gameStore.starshipFlight.isActive) {
        const flight = gameStore.starshipFlight;
        const t = flight.tPlus + delta;
        gameStore.updateStarshipTelemetry({ tPlus: t });

        if (flight.phase === 'countdown') {
          const remaining = Math.max(0, 3.0 - t);
          gameStore.updateStarshipTelemetry({ countdown: Math.ceil(remaining) });
          // Boil-off cryogenic vapor venting
          delugeRing.scale.setScalar(1.0 + Math.sin(time * 20) * 0.15);
          if (t >= 3.0) {
            gameStore.updateStarshipTelemetry({ phase: 'ignition' });
            gameAudio.playStarshipRaptorRoar();
          }
        } else if (flight.phase === 'ignition' || flight.phase === 'gravity_turn') {
          rocketFlames.visible = true;
          rocketFlames.scale.setScalar(1.0 + Math.sin(time * 35) * 0.22);
          const alt = Math.pow(t - 3.0, 1.85) * 14.0;
          const vel = (t - 3.0) * 210.0;
          rocketGroup.position.y = 6.0 + alt;

          if (t > 11.0 && flight.phase === 'ignition') {
            gameStore.updateStarshipTelemetry({ phase: 'gravity_turn' });
          }
          if (flight.phase === 'gravity_turn') {
            rocketGroup.rotation.z = Math.min(0.42, (t - 11.0) * 0.032);
          }

          if (t > 22.0) {
            gameStore.updateStarshipTelemetry({ phase: 'max_q' });
            gameAudio.playMaxQShockwave();
          }

          gameStore.updateStarshipTelemetry({ altitude: Math.round(alt), velocity: Math.round(vel) });

          // Cinematic camera tracking ascending 120m rocket
          const camTarget = new THREE.Vector3(
            spaceportGroup.position.x + 48,
            rocketGroup.position.y + 35,
            spaceportGroup.position.z + 72
          );
          camera.position.lerp(camTarget, 0.14);
          camera.lookAt(spaceportGroup.position.x, rocketGroup.position.y + 45, spaceportGroup.position.z);
        } else if (flight.phase === 'max_q') {
          maxQCone.visible = true;
          maxQCone.scale.setScalar(1.0 + Math.sin(time * 40) * 0.12);
          rocketGroup.position.y += delta * 75.0;

          if (t > 28.0) {
            maxQCone.visible = false;
            gameStore.updateStarshipTelemetry({ phase: 'meco' });
            gameAudio.playStageSeparation();
          }
        } else if (flight.phase === 'meco' || flight.phase === 'staging') {
          // Hot staging separation: Starship stage moves forward while booster separates
          starshipStageGroup.position.y += delta * 16.0;
          rocketGroup.position.y += delta * 95.0;

          if (t > 36.0) {
            gameStore.updateStarshipTelemetry({ phase: 'orbital_insertion', stage: 2 });
            gameAudio.playWarpDrive();
          }
        } else if (flight.phase === 'orbital_insertion') {
          rocketGroup.position.y += delta * 140.0;
          if (t > 44.0) {
            gameStore.updateStarshipTelemetry({ phase: 'reentry' });
            gameAudio.playReentryPlasma();
          }
        } else if (flight.phase === 'reentry') {
          // Heat shield glow
          heatShield.scale.setScalar(1.02);
          if (t > 52.0) {
            gameStore.updateStarshipTelemetry({ phase: 'belly_flop' });
            starshipStageGroup.rotation.z = Math.PI / 2; // Belly-flop horizontal skydive!
          }
        } else if (flight.phase === 'belly_flop') {
          flapForwardL.rotation.y = Math.sin(time * 6) * 0.28;
          flapForwardR.rotation.y = -Math.sin(time * 6) * 0.28;
          flapAftL.rotation.y = Math.cos(time * 6) * 0.32;
          flapAftR.rotation.y = -Math.cos(time * 6) * 0.32;

          if (t > 58.0) {
            gameStore.updateStarshipTelemetry({ phase: 'landing_burn' });
            starshipStageGroup.rotation.z = 0; // Flip maneuver!
            gameAudio.playRocketLaunch();
          }
        } else if (flight.phase === 'landing_burn') {
          rocketFlames.visible = false;
          starshipStageGroup.position.set(0, 72, 0);
          rocketGroup.rotation.z = 0;
          gameStore.completeStarshipFlight();
        }
      } else if (gameStore.isWarping) {
        rocketFlames.visible = true;
        rocketFlames.scale.setScalar(1.0 + Math.sin(time * 30) * 0.2);
        rocketGroup.position.y += delta * 36.0;

        const camTarget = new THREE.Vector3(
          spaceportGroup.position.x + 36,
          rocketGroup.position.y + 24,
          spaceportGroup.position.z + 48
        );
        camera.position.lerp(camTarget, 0.12);
        camera.lookAt(spaceportGroup.position.x, rocketGroup.position.y + 35, spaceportGroup.position.z);
      } else {
        rocketFlames.visible = false;
        maxQCone.visible = false;
        rocketGroup.position.y = 6.0; // Staged on Launch Table
        rocketGroup.rotation.z = 0;
        starshipStageGroup.position.set(0, 72, 0);
        starshipStageGroup.rotation.z = 0;
      }

      // AI Data Center Computing Loop & Robotics Animation
      gameStore.tickAiShift(delta);
      if (gameStore.aiWorker.isWorking) {
        serverGlass.visible = Math.sin(time * 16) > 0;
        robotArm1.rotation.z = Math.PI / 6 + Math.sin(time * 3) * 0.22;
        robotArm2.rotation.z = -Math.PI / 4 + Math.cos(time * 3) * 0.25;
        coolTower1.rotation.y += delta * 4;
        coolTower2.rotation.y -= delta * 4;
      }

      // Sync active vehicle model with store
      if (fleetRig.activeType !== gameStore.currentVehicle) {
        fleetRig.switchModel(gameStore.currentVehicle);
      }

      playerRig.setWeaponVisible(gameStore.currentWeapon);
      playerRig.root.visible = !inVehicle && !inPlane;

      if (isApocalypse) {
        emergencyLight.intensity = Math.sin(time * 8) > 0 ? 4.0 : 0.6;
      } else {
        emergencyLight.intensity = 0.2;
      }

      rooftopBeacons.forEach((b, idx) => {
        b.visible = Math.sin(time * 5 + idx) > 0.05;
      });

      // Update Central Plaza Hologram Pedestal
      rotatingHoloRing.rotation.z += delta * 1.4;

      const activePos = inPlane
        ? fighterJetRig.root.position
        : inVehicle
        ? fleetRig.container.position
        : playerRig.root.position;

      // Update Headlights (Active when driving)
      if (inVehicle) {
        headlightL.intensity = 4.8;
        headlightR.intensity = 4.8;
      } else {
        headlightL.intensity = 0;
        headlightR.intensity = 0;
      }

      // Update Autonomous Companion Recon Drone
      droneGroup.position.x = activePos.x + Math.cos(time * 1.6) * 4.2;
      droneGroup.position.z = activePos.z + Math.sin(time * 1.6) * 4.2;
      droneGroup.position.y = activePos.y + 3.8 + Math.sin(time * 3.2) * 0.25;
      droneGroup.lookAt(activePos.x, activePos.y + 1.0, activePos.z);
      rotorL.rotation.y += delta * 32;
      rotorR.rotation.y += delta * 32;

      let currentLoc: LocationType = 'none';

      if (activePos.distanceTo(vaultGroup.position) < 7.5) currentLoc = 'vault';
      else if (activePos.distanceTo(armoryGroup.position) < 7.5) currentLoc = 'armory';
      else if (activePos.distanceTo(garageGroup.position) < 8.5) currentLoc = 'garage';
      else if (activePos.distanceTo(fuelStationGroup.position) < 7.5) currentLoc = 'fuel_station';
      else if (activePos.distanceTo(pedestalGroup.position) < 7.5) currentLoc = 'asset_importer';
      else if (activePos.distanceTo(spaceportGroup.position) < 18.0) currentLoc = 'spaceport';
      else if (activePos.distanceTo(aiDataCenterGroup.position) < 14.0) currentLoc = 'ai_datacenter';
      else if (activePos.distanceTo(aircraftCarrierGroup.position) < 22.0) currentLoc = 'aircraft_carrier';
      else if (activePos.distanceTo(recreationalGroup.position) < 16.0) currentLoc = 'recreational_center';
      else if (activePos.distanceTo(nuclearPlantGroup.position) < 26.0) {
        currentLoc = 'nuclear_plant';
        if (Math.random() < 0.04) gameAudio.playGeigerCounterClick();
      } else if (
        activePos.distanceTo(subwayEntranceGroup.position) < 7.5 ||
        (gameStore.underground.isUnderground && activePos.distanceTo(new THREE.Vector3(20, -21, 20)) < 9.0)
      ) {
        currentLoc = 'subway_station';
      } else if (
        gameStore.underground.isUnderground &&
        activePos.distanceTo(new THREE.Vector3(65, -21, 30)) < 9.0
      ) {
        currentLoc = 'underground_bunker';
      }

      gameStore.tickNuclearAndGrid(delta);

      if (gameStore.nearLocation !== currentLoc) {
        gameStore.setNearLocation(currentLoc);
      }

      let forwardInput = 0;
      let strafeInput = 0;

      if (keys['KeyW'] || keys['ArrowUp']) forwardInput += 1;
      if (keys['KeyS'] || keys['ArrowDown']) forwardInput -= 1;
      if (keys['KeyA'] || keys['ArrowLeft']) strafeInput -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) strafeInput += 1;

      if (touchInputRef?.current) {
        if (Math.abs(touchInputRef.current.forward) > 0.1) forwardInput -= touchInputRef.current.forward;
        if (Math.abs(touchInputRef.current.strafe) > 0.1) strafeInput += touchInputRef.current.strafe;
        if (touchInputRef.current.shooting) {
          const cooldown = inVehicle ? 0.25 : WEAPON_REGISTRY[gameStore.currentWeapon].cooldown;
          if (time - lastShootTime > cooldown) {
            fireCurrentWeapon();
            lastShootTime = time;
          }
        }
      }

      if (inPlane) {
        const flight = fighterJetRig.updateFlight(forwardInput, strafeInput, delta);
        gameStore.planeAirspeed = flight.airspeed;
        gameStore.planeAltitude = flight.altitude;

        const jetOffset = new THREE.Vector3(0, 5.2, -14.0).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          fighterJetRig.root.rotation.y
        );
        const targetCam = fighterJetRig.root.position.clone().add(jetOffset);
        camera.position.lerp(targetCam, 0.16);
        camera.lookAt(
          fighterJetRig.root.position.x,
          fighterJetRig.root.position.y + 1.2,
          fighterJetRig.root.position.z
        );
      } else if (inVehicle) {
        if (gameStore.vehicleFuel > 0 && gameStore.vehicleHealth > 0) {
          const { movedDist, velocity } = fleetRig.updatePhysics(forwardInput, strafeInput, delta);
          if (movedDist > 0) {
            gameStore.consumeFuel(movedDist * 0.14);
          }

          if (Math.abs(fleetRig.speed) > 4.0) {
            zombies.forEach((z) => {
              if (!z.alive) return;
              const dist = fleetRig.container.position.distanceTo(z.root.position);
              if (dist < 2.5) {
                z.alive = false;
                gameAudio.playVehicleRam();
                const impulse = velocity.clone().normalize();
                z.triggerDeath(impulse.x, impulse.z);
                gameStore.incrementZombieKills();
                spawnLootAtCorpse(z.root.position);

                setTimeout(() => spawnZombieRig(z), 4000);
              }
            });
          }
        }

        // Drifting check with Space when driving
        const isHandbraking = keys['Space'];
        if (isHandbraking && Math.abs(fleetRig.speed) > 3.0) {
          gameAudio.playTireSkid();
          fleetRig.container.rotation.y += fleetRig.steering * 3.5 * delta;
        }

        // Clamp vehicle to physics static colliders & boundaries
        vehicleBoxCollider.center.copy(fleetRig.container.position);
        physicsWorld.staticColliders.forEach((col) => {
          const hit = vehicleBoxCollider.checkCollision(col);
          if (hit && hit.penetration > 0.001) {
            fleetRig.container.position.add(hit.normal.clone().multiplyScalar(hit.penetration * 1.05));
            fleetRig.speed *= -0.3; // Elastic bounce on crash
          }
        });

        const carOffset = new THREE.Vector3(0, 5.5, -9.5).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          fleetRig.container.rotation.y
        );
        const targetCam = fleetRig.container.position.clone().add(carOffset);
        camera.position.lerp(targetCam, 0.12);
        camera.lookAt(fleetRig.container.position.x, fleetRig.container.position.y + 1.2, fleetRig.container.position.z);
      } else {
        // Dynamic Player Character Controller
        const isNebula = gameStore.currentWorld === 'nebula_prime';
        physicsWorld.gravity.set(0, isNebula ? -7.5 : -18.0, 0);

        const isMoving = forwardInput !== 0 || strafeInput !== 0;
        const wantSprint = (keys['ShiftLeft'] || keys['ShiftRight']) && gameStore.stamina > 4;

        if (wantSprint && isMoving) {
          gameStore.consumeStamina(16 * delta);
          if (!gameStore.isSprinting) useGameStore.setState({ isSprinting: true });
        } else {
          if (gameStore.isSprinting) useGameStore.setState({ isSprinting: false });
        }
        const isSprinting = gameStore.isSprinting;

        gameStore.regenStaminaAndJetpack(delta);

        const isCrouched = gameStore.isCrouching || gameStore.isSliding;
        playerCapsule.height = isCrouched ? 0.95 : 1.8;

        const baseSpeed = gameStore.isSliding ? 14.5 : gameStore.isCrouching ? 3.4 : isSprinting ? 11.2 : 6.2;

        if (isMoving) {
          const moveVec = new THREE.Vector3(strafeInput, 0, -forwardInput).normalize();
          const targetVx = moveVec.x * baseSpeed;
          const targetVz = moveVec.z * baseSpeed;
          playerRigidBody.velocity.x = THREE.MathUtils.lerp(playerRigidBody.velocity.x, targetVx, 0.24);
          playerRigidBody.velocity.z = THREE.MathUtils.lerp(playerRigidBody.velocity.z, targetVz, 0.24);

          const targetAngle = Math.atan2(moveVec.x, moveVec.z);
          playerRig.root.rotation.y = THREE.MathUtils.lerp(playerRig.root.rotation.y, targetAngle, 0.18);
        } else if (playerRigidBody.isGrounded && !gameStore.isSliding) {
          playerRigidBody.velocity.x *= 0.8;
          playerRigidBody.velocity.z *= 0.8;
        }

        // Mid-Air Jetpack Ionic Thrust
        if (keys['Space'] && !playerRigidBody.isGrounded && gameStore.jetpackFuel > 2) {
          gameStore.consumeJetpack(28 * delta);
          playerRigidBody.addForce(new THREE.Vector3(0, 32.0, 0), 'force');
        } else if (keys['Space'] && playerRigidBody.isGrounded) {
          // Ground Jump
          playerRigidBody.velocity.y = isNebula ? 12.0 : 8.5;
          playerRigidBody.isGrounded = false;
        }

        // Step Physics World: Continuous Collision Detection & Impulse Resolution with All Buildings!
        physicsWorld.step(delta);

        // Clamp to City Bounds
        const maxBound = citySize / 2 - 2.5;
        playerRigidBody.position.x = THREE.MathUtils.clamp(playerRigidBody.position.x, -maxBound, maxBound);
        playerRigidBody.position.z = THREE.MathUtils.clamp(playerRigidBody.position.z, -maxBound, maxBound);

        // Sync Model Position
        playerRig.root.position.copy(playerRigidBody.position);

        playerRig.updateAnimation(isMoving, isSprinting ? 1.5 : 1.0, delta, time, !playerRigidBody.isGrounded);

        // Procedural Camera with Dynamic Head Bob & Aim-Down-Sights (ADS)
        const isAiming = gameStore.isAiming;
        const headBob = isMoving && playerRigidBody.isGrounded
          ? Math.sin(time * (isSprinting ? 15 : 9)) * (isSprinting ? 0.12 : 0.05)
          : 0;
        const cameraDistance = isAiming ? 3.8 : 8.2;
        const cameraHeight = isAiming ? 2.4 : 4.8;
        const cameraSide = isAiming ? 0.65 : 0;
        const cameraOffset = new THREE.Vector3(cameraSide, cameraHeight + headBob, cameraDistance);
        const targetCamPos = playerRig.root.position.clone().add(cameraOffset);
        camera.position.lerp(targetCamPos, 0.15);
        camera.lookAt(playerRig.root.position.x, playerRig.root.position.y + 1.25, playerRig.root.position.z);
      }

      squadAllies.forEach((ally) => {
        ally.updateAI(time, delta, activePos, zombies);
      });

      for (let i = laserPool.length - 1; i >= 0; i--) {
        const p = laserPool[i];
        p.life -= delta;
        p.mesh.position.add(p.dir.clone().multiplyScalar(28 * delta));

        if (p.life <= 0) {
          scene.remove(p.mesh);
          laserPool.splice(i, 1);
          continue;
        }

        if (isApocalypse) {
          for (let j = 0; j < zombies.length; j++) {
            const z = zombies[j];
            if (!z.alive) continue;
            const dist = p.mesh.position.distanceTo(z.root.position);
            if (dist < 1.35) {
              z.alive = false;
              z.triggerDeath();
              gameStore.incrementZombieKills();
              spawnLootAtCorpse(z.root.position);

              if (!p.isPiercing) {
                scene.remove(p.mesh);
                laserPool.splice(i, 1);
              }

              setTimeout(() => spawnZombieRig(z), 4000);
              break;
            }
          }
        }
      }

      if (isApocalypse && !gameStore.isGameOver) {
        zombies.forEach((z) => {
          if (!z.alive) return;

          const targetPos = inVehicle ? fleetRig.container.position : playerRig.root.position;
          const dirToTarget = targetPos.clone().sub(z.root.position);
          dirToTarget.y = 0;
          const distToTarget = dirToTarget.length();

          let isBiting = false;

          if (distToTarget > 0.1) {
            z.root.rotation.y = Math.atan2(dirToTarget.x, dirToTarget.z);
            dirToTarget.normalize();
            z.root.position.add(dirToTarget.multiplyScalar(z.speed * delta));
          }

          const biteRange = inVehicle ? 2.6 : 1.5;
          if (distToTarget < biteRange) {
            isBiting = true;
            if (time - z.lastBiteTime > 1.3) {
              z.lastBiteTime = time;
              gameStore.applyZombieBite(15, 50);

              if (!inVehicle) {
                const knockback = dirToTarget.clone().multiplyScalar(1.4);
                playerRig.root.position.add(knockback);
              }
            }
          }

          z.updateAnimation(time, delta, isBiting);
        });
      }

      resourcePool.forEach((drop) => {
        if (!drop.active) return;
        drop.root.rotation.y += delta * 2.8;
        drop.root.position.y = 0.85 + Math.sin(time * 3 + drop.root.position.x) * 0.16;

        const collectDist = inVehicle ? 2.5 : 1.45;
        if (drop.root.position.distanceTo(activePos) < collectDist) {
          drop.active = false;
          drop.root.visible = false;
          gameStore.lootResource(drop.type, drop.amount);
        }
      });

      antidoteStations.forEach((station) => {
        station.rotation.y += delta * 1.6;
        if (station.position.distanceTo(activePos) < 1.8) {
          if (gameStore.isInfected || gameStore.infection > 0) {
            gameStore.cureInfection();
          }
        }
      });

      renderer.render(scene, camera);
    }

    gameLoop();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      unsubAssetLoader();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      skyscraperTex.dispose();
      luxuryApartmentTex.dispose();
      cyberApartmentTex.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-crosshair" />
    </div>
  );
}
