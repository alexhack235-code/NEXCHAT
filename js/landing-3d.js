/* ═══════════════════════════════════════════════════════════════════════
   NEXCHAT 3D WEBGL ENGINE & TEMPLATE MORPHING VAULT
   Interactive Three.js 3D Holographic Polyhedron + Concentric Gyro Rings
   + Deep Space Particle Matrix + Scroll Camera Flight + Store Integration
   ═══════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

// ─── 3D TEMPLATE DEFINITIONS ───
export const TEMPLATE_PRESETS = {
  'matrix-overdrive': {
    id: 'matrix-overdrive',
    name: 'Matrix Overdrive 3D',
    badge: 'CYBER HACKER',
    price: 5000,
    primaryColor: 0x00ff88,
    secondaryColor: 0x00d466,
    coreColor: 0x003b1f,
    coreEmissive: 0x00ff88,
    rim1Color: 0x00ff88,
    rim2Color: 0x008844,
    particleColor: 0x00ff88,
    wireframe: true,
    ringSpeed: 1.8,
    particleSpeed: 1.6,
    polyScale: 1.05,
    tagline: 'Emerald digital rain particle matrix with cybernetic wireframe polyhedral mesh.'
  },
  'quantum-stealth': {
    id: 'quantum-stealth',
    name: 'Quantum Stealth QKD',
    badge: 'CRYPTOGRAPHIC',
    price: 8000,
    primaryColor: 0x00f0ff,
    secondaryColor: 0x8b5cf6,
    coreColor: 0x0b132b,
    coreEmissive: 0x00f0ff,
    rim1Color: 0x00f0ff,
    rim2Color: 0x8b5cf6,
    particleColor: 0x38bdf8,
    wireframe: true,
    ringSpeed: 1.2,
    particleSpeed: 1.0,
    polyScale: 1.0,
    tagline: 'Cryptographic cyan & violet quantum orbital rings with refractive crystal core.'
  },
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Night City',
    badge: 'NEON OVERDRIVE',
    price: 12000,
    primaryColor: 0xff007f,
    secondaryColor: 0x00f0ff,
    coreColor: 0x2b061a,
    coreEmissive: 0xff007f,
    rim1Color: 0xff007f,
    rim2Color: 0x00f0ff,
    particleColor: 0xff3399,
    wireframe: true,
    ringSpeed: 2.2,
    particleSpeed: 2.0,
    polyScale: 1.12,
    tagline: 'High-voltage magenta & turquoise dual-torus accelerator with pulsing flare.'
  },
  'aurora-holographic': {
    id: 'aurora-holographic',
    name: 'Aurora Glassmorphism',
    badge: 'PRISMATIC',
    price: 15000,
    primaryColor: 0x10b981,
    secondaryColor: 0xec4899,
    coreColor: 0x042f2e,
    coreEmissive: 0x06b6d4,
    rim1Color: 0x06b6d4,
    rim2Color: 0xec4899,
    particleColor: 0x34d399,
    wireframe: true,
    ringSpeed: 1.0,
    particleSpeed: 0.9,
    polyScale: 1.0,
    tagline: 'Shimmering polychromatic aurora starlight with floating geodesic crystal sphere.'
  },
  'titanium-armor': {
    id: 'titanium-armor',
    name: 'Titanium Armor Defense',
    badge: 'HEAVY MILITARY',
    price: 20000,
    primaryColor: 0xf1f5f9,
    secondaryColor: 0xffd700,
    coreColor: 0x1e293b,
    coreEmissive: 0xffb700,
    rim1Color: 0xffd700,
    rim2Color: 0x94a3b8,
    particleColor: 0xfde047,
    wireframe: true,
    ringSpeed: 0.75,
    particleSpeed: 0.7,
    polyScale: 1.15,
    tagline: 'Metallic tungsten geometry with armored kinetic orbital rings and gold rim.'
  },
  'cosmic-void': {
    id: 'cosmic-void',
    name: 'Cosmic Void Infinity',
    badge: 'DEEP SPACE',
    price: 25000,
    primaryColor: 0x6366f1,
    secondaryColor: 0x38bdf8,
    coreColor: 0x0f0b29,
    coreEmissive: 0xa855f7,
    rim1Color: 0xa855f7,
    rim2Color: 0x38bdf8,
    particleColor: 0xc084fc,
    wireframe: true,
    ringSpeed: 1.5,
    particleSpeed: 2.2,
    polyScale: 1.08,
    tagline: 'Deep space singularity vortex with hyper-speed cosmic particle warp drive.'
  }
};

let currentTemplateId = localStorage.getItem('nexchat_active_3d_template') || 'quantum-stealth';
let currentPreset = TEMPLATE_PRESETS[currentTemplateId] || TEMPLATE_PRESETS['quantum-stealth'];

// Scene State
let scene, camera, renderer, animationFrameId;
let polyhedronGroup, outerMesh, innerMesh, pointsMesh;
let ringsGroup, ring1, ring2, ring3;
let satellites = [];
let particlesMesh, particlePositions, particleVelocities;
let ambientLight, coreLight, rimLight1, rimLight2;

// Mouse & Scroll State
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
let scrollProgress = 0;
let isTabActive = true;

/**
 * Initialize the full 3D WebGL scene on the landing page
 */
export function initLanding3D(lenisInstance = null) {
  const canvas = document.getElementById('webgl-3d-scene');
  if (!canvas) {
    console.warn('[NEX 3D] Canvas #webgl-3d-scene not found');
    return;
  }

  // 1. Scene & Camera Setup
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050811, 0.022);

  const width = window.innerWidth;
  const height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 0, 17);

  // 2. High-Performance WebGL Renderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('[NEX 3D] WebGL initialization fallback:', err);
    return;
  }

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0); // Transparent

  // 3. Build Central Quantum Polyhedron
  buildQuantumPolyhedron();

  // 4. Build Gyroscopic Concentric Orbiting Torus Rings
  buildGyroscopicRings();

  // 5. Build Deep Space Particle Matrix
  buildParticleMatrix();

  // 6. Build Cyber Lights
  buildLighting();

  // 7. Apply Initial Template Preset
  applyTemplateColors(currentPreset, true);

  // 8. Event Listeners (Resize, Mouse, Scroll, Visibility)
  setupEventListeners(lenisInstance);

  // 9. Start 60FPS Render Loop
  animate();

  console.log(`[NEX 3D] Engine online. Active template: ${currentPreset.name}`);
}

/**
 * Builds the central rotating holographic quantum polyhedron
 */
function buildQuantumPolyhedron() {
  polyhedronGroup = new THREE.Group();

  // Outer Wireframe Holographic Icosahedron
  const outerGeo = new THREE.IcosahedronGeometry(3.0, 1);
  const outerMat = new THREE.MeshStandardMaterial({
    color: currentPreset.primaryColor,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
    roughness: 0.15,
    metalness: 0.85
  });
  outerMesh = new THREE.Mesh(outerGeo, outerMat);
  polyhedronGroup.add(outerMesh);

  // Inner Rotating Faceted Crystal Core (Octahedron)
  const innerGeo = new THREE.OctahedronGeometry(1.65, 0);
  const innerMat = new THREE.MeshPhysicalMaterial({
    color: currentPreset.secondaryColor,
    emissive: currentPreset.coreEmissive,
    emissiveIntensity: 0.45,
    roughness: 0.1,
    metalness: 0.3,
    transmission: 0.65,
    transparent: true,
    opacity: 0.9,
    flatShading: true
  });
  innerMesh = new THREE.Mesh(innerGeo, innerMat);
  polyhedronGroup.add(innerMesh);

  // Outer Vertex Glow Points
  const pointsMat = new THREE.PointsMaterial({
    color: currentPreset.primaryColor,
    size: 0.18,
    transparent: true,
    opacity: 0.95
  });
  pointsMesh = new THREE.Points(outerGeo, pointsMat);
  polyhedronGroup.add(pointsMesh);

  scene.add(polyhedronGroup);
}

/**
 * Builds 3 concentric gyroscopic orbiting torus rings with data beacons
 */
function buildGyroscopicRings() {
  ringsGroup = new THREE.Group();

  const ringMat1 = new THREE.MeshStandardMaterial({
    color: currentPreset.primaryColor,
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.65
  });

  const ringMat2 = new THREE.MeshStandardMaterial({
    color: currentPreset.secondaryColor,
    roughness: 0.25,
    metalness: 0.8,
    transparent: true,
    opacity: 0.6
  });

  const ringMat3 = new THREE.MeshStandardMaterial({
    color: currentPreset.primaryColor,
    roughness: 0.3,
    metalness: 0.85,
    transparent: true,
    opacity: 0.55
  });

  // Ring 1 (Inner X-axis)
  ring1 = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.045, 16, 120), ringMat1);
  ring1.rotation.x = Math.PI / 4;
  ringsGroup.add(ring1);

  // Ring 2 (Middle Y-axis)
  ring2 = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.05, 16, 120), ringMat2);
  ring2.rotation.y = Math.PI / 3;
  ringsGroup.add(ring2);

  // Ring 3 (Outer Z-axis)
  ring3 = new THREE.Mesh(new THREE.TorusGeometry(7.8, 0.055, 16, 120), ringMat3);
  ring3.rotation.z = Math.PI / 6;
  ringsGroup.add(ring3);

  // 6 Glowing Orbital Satellites / Data Beacon Nodes
  const satGeo = new THREE.SphereGeometry(0.14, 16, 16);
  for (let i = 0; i < 6; i++) {
    const satMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? currentPreset.primaryColor : currentPreset.secondaryColor
    });
    const satMesh = new THREE.Mesh(satGeo, satMat);
    satellites.push({
      mesh: satMesh,
      ringIndex: i % 3,
      angle: (i / 6) * Math.PI * 2,
      speed: 0.012 + (i * 0.004)
    });
    ringsGroup.add(satMesh);
  }

  scene.add(ringsGroup);
}

/**
 * Builds 1,400+ 3D deep space particle matrix
 */
function buildParticleMatrix() {
  const PARTICLE_COUNT = 1400;
  const geometry = new THREE.BufferGeometry();
  particlePositions = new Float32Array(PARTICLE_COUNT * 3);
  particleVelocities = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    // Disperse across 3D sphere volume
    const radius = 8 + Math.random() * 65;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i3 + 2] = radius * Math.cos(phi);

    // Subtle drift velocities
    particleVelocities[i3] = (Math.random() - 0.5) * 0.03;
    particleVelocities[i3 + 1] = (Math.random() - 0.5) * 0.03;
    particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.03;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: currentPreset.particleColor,
    size: 0.16,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  });

  particlesMesh = new THREE.Points(geometry, particleMat);
  scene.add(particlesMesh);
}

/**
 * Builds multi-source cyber dynamic lights
 */
function buildLighting() {
  ambientLight = new THREE.AmbientLight(0x0a1020, 1.6);
  scene.add(ambientLight);

  // Central Core Point Light
  coreLight = new THREE.PointLight(currentPreset.primaryColor, 4.2, 28);
  coreLight.position.set(0, 0, 0);
  scene.add(coreLight);

  // Top-Right Accent Rim Light
  rimLight1 = new THREE.PointLight(currentPreset.rim1Color, 3.2, 35);
  rimLight1.position.set(12, 10, 8);
  scene.add(rimLight1);

  // Bottom-Left Accent Rim Light
  rimLight2 = new THREE.PointLight(currentPreset.rim2Color, 2.5, 30);
  rimLight2.position.set(-12, -10, -5);
  scene.add(rimLight2);
}

/**
 * Smoothly morphs the 3D scene colors and dynamics to a target template
 */
export function switch3DTemplate(templateId, isUserTriggered = true) {
  const target = TEMPLATE_PRESETS[templateId];
  if (!target) return;

  currentTemplateId = templateId;
  currentPreset = target;
  localStorage.setItem('nexchat_active_3d_template', templateId);

  applyTemplateColors(target, false);

  // Update UI active buttons and cards on page
  updateTemplateUI(templateId);

  if (isUserTriggered) {
    show3DNotification(`3D Scene Morphed: ${target.name}`, target.badge);
  }
}

/**
 * Returns current active template preset
 */
export function getActiveTemplate() {
  return currentPreset;
}

/**
 * Internal color interpolation for template transition
 */
function applyTemplateColors(preset, immediate = false) {
  if (!outerMesh || !innerMesh || !coreLight) return;

  const targetOuter = new THREE.Color(preset.primaryColor);
  const targetInner = new THREE.Color(preset.secondaryColor);
  const targetCoreEmissive = new THREE.Color(preset.coreEmissive);
  const targetRim1 = new THREE.Color(preset.rim1Color);
  const targetRim2 = new THREE.Color(preset.rim2Color);
  const targetParticle = new THREE.Color(preset.particleColor);

  if (immediate) {
    outerMesh.material.color.copy(targetOuter);
    pointsMesh.material.color.copy(targetOuter);
    innerMesh.material.color.copy(targetInner);
    innerMesh.material.emissive.copy(targetCoreEmissive);
    ring1.material.color.copy(targetOuter);
    ring2.material.color.copy(targetInner);
    ring3.material.color.copy(targetOuter);
    particlesMesh.material.color.copy(targetParticle);
    coreLight.color.copy(targetOuter);
    rimLight1.color.copy(targetRim1);
    rimLight2.color.copy(targetRim2);
    polyhedronGroup.scale.setScalar(preset.polyScale);
  } else {
    // Smooth transition in animation loop
    targetColors = {
      outer: targetOuter,
      inner: targetInner,
      coreEmissive: targetCoreEmissive,
      rim1: targetRim1,
      rim2: targetRim2,
      particle: targetParticle,
      scale: preset.polyScale
    };
  }
}

let targetColors = null;

/**
 * Event listeners: Mouse parallax, resize, scroll depth, visibility
 */
function setupEventListeners(lenisInstance) {
  // Resize Listener
  window.addEventListener('resize', () => {
    if (!renderer || !camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  });

  // Mouse Parallax Listener
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Scroll Progress Listener
  if (lenisInstance) {
    lenisInstance.on('scroll', (e) => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = maxScroll > 0 ? (e.scroll || window.scrollY) / maxScroll : 0;
    });
  } else {
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    }, { passive: true });
  }

  // Tab Visibility (Performance Conservation)
  document.addEventListener('visibilitychange', () => {
    isTabActive = !document.hidden;
  });

  // Matrix Overdrive Button Integration
  const matrixBtn = document.getElementById('matrixOverdriveBtn');
  if (matrixBtn) {
    matrixBtn.addEventListener('click', () => {
      const isOverdrive = document.body.classList.contains('matrix-overdrive-active');
      if (isOverdrive) {
        switch3DTemplate('matrix-overdrive', true);
      } else {
        switch3DTemplate('quantum-stealth', false);
      }
    });
  }

  // 3D Card Hover Perspective Tilt across templates and landing cards
  initCard3DTilt();
}

/**
 * Adds real-time 3D perspective mouse tilt to cards with specular glare
 */
export function initCard3DTilt() {
  const tiltCards = document.querySelectorAll('.template-3d-card, .eco-card, .feature-card, .wp-gallery-card');

  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`;

      // Dynamic specular sheen reflection
      const glare = card.querySelector('.card-specular-glare');
      if (glare) {
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.22) 0%, transparent 65%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
      const glare = card.querySelector('.card-specular-glare');
      if (glare) {
        glare.style.opacity = '0';
      }
    });
  });
}

/**
 * Updates UI active states on template cards
 */
function updateTemplateUI(activeId) {
  const nameEl = document.getElementById('current3DSceneName');
  if (nameEl && currentPreset) {
    nameEl.textContent = currentPreset.name;
  }

  const unlocked = JSON.parse(localStorage.getItem('nexchat_unlocked_templates') || '[]');

  document.querySelectorAll('.template-3d-card').forEach((card) => {
    const cardTemplate = card.getAttribute('data-template-id');
    const isThisActive = cardTemplate === activeId;
    card.classList.toggle('active-3d-preview', isThisActive);

    const btn = card.querySelector('.preview-3d-btn');
    if (btn) {
      if (isThisActive) {
        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Active 3D Scene';
        btn.classList.add('active');
      } else {
        btn.innerHTML = '<i class="fa-solid fa-eye"></i> Preview 3D Scene';
        btn.classList.remove('active');
      }
    }

    const storeBtn = card.querySelector('.store-access-btn');
    if (storeBtn && unlocked.includes(cardTemplate)) {
      storeBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Unlocked in Store';
      storeBtn.style.background = 'rgba(0, 255, 136, 0.2)';
      storeBtn.style.color = '#00ff88';
      storeBtn.style.borderColor = '#00ff88';
    }
  });
}

/**
 * Displays floating futuristic notification badge
 */
function show3DNotification(title, badgeText) {
  let toast = document.getElementById('nex3dToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'nex3dToast';
    toast.className = 'nex-3d-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="toast-3d-inner">
      <div class="toast-3d-badge">${badgeText || '3D ENGINE'}</div>
      <div class="toast-3d-title">${title}</div>
    </div>
  `;

  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2800);
}

/**
 * 60 FPS Render & Animation Loop
 */
function animate() {
  animationFrameId = requestAnimationFrame(animate);

  if (!isTabActive || !renderer || !scene || !camera) return;

  const ringSpeed = currentPreset.ringSpeed || 1.0;
  const particleSpeed = currentPreset.particleSpeed || 1.0;

  // 1. Mouse Lerp for fluid parallax
  mouse.x += (mouse.targetX - mouse.x) * 0.05;
  mouse.y += (mouse.targetY - mouse.y) * 0.05;

  // 2. Camera Flight Path driven by Scroll Progress
  // Top: (0, 0, 17) -> Middle: dynamic orbit -> Bottom: elevated perspective
  const targetCamZ = 17 - (scrollProgress * 5.5);
  const targetCamY = -scrollProgress * 4.0 + (mouse.y * 1.5);
  const targetCamX = Math.sin(scrollProgress * Math.PI * 2) * 2.2 + (mouse.x * 2.0);

  camera.position.x += (targetCamX - camera.position.x) * 0.05;
  camera.position.y += (targetCamY - camera.position.y) * 0.05;
  camera.position.z += (targetCamZ - camera.position.z) * 0.05;
  camera.lookAt(0, -scrollProgress * 1.5, 0);

  // 3. Central Quantum Polyhedron Rotations
  if (polyhedronGroup) {
    polyhedronGroup.rotation.y += 0.007 * ringSpeed;
    polyhedronGroup.rotation.x += 0.004 * ringSpeed;

    // Inner crystal rotates counter-clockwise faster
    if (innerMesh) {
      innerMesh.rotation.y -= 0.015 * ringSpeed;
      innerMesh.rotation.z += 0.012 * ringSpeed;
    }
  }

  // 4. Gyroscopic Concentric Orbiting Rings Rotations
  if (ring1) ring1.rotation.x += 0.009 * ringSpeed;
  if (ring2) ring2.rotation.y += 0.012 * ringSpeed;
  if (ring3) ring3.rotation.z += 0.008 * ringSpeed;

  // Orbiting Satellites on Ring Trajectories
  satellites.forEach((sat) => {
    sat.angle += sat.speed * ringSpeed;
    const r = sat.ringIndex === 0 ? 4.6 : (sat.ringIndex === 1 ? 6.2 : 7.8);
    sat.mesh.position.x = Math.cos(sat.angle) * r;
    sat.mesh.position.y = Math.sin(sat.angle) * r * (sat.ringIndex === 0 ? 0.7 : 0.85);
    sat.mesh.position.z = Math.sin(sat.angle) * r * 0.5;
  });

  // 5. Particle Matrix Swirling & Drift
  if (particlesMesh && particlePositions) {
    particlesMesh.rotation.y += 0.0008 * particleSpeed;
    particlesMesh.rotation.x += 0.0004 * particleSpeed;

    const positions = particlesMesh.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += particleVelocities[i + 1] * particleSpeed;
      // Wrap around bounds
      if (positions[i + 1] > 35) positions[i + 1] = -35;
      if (positions[i + 1] < -35) positions[i + 1] = 35;
    }
    particlesMesh.geometry.attributes.position.needsUpdate = true;
  }

  // 6. Smooth Lerp Material Transitions if template recently switched
  if (targetColors) {
    outerMesh.material.color.lerp(targetColors.outer, 0.06);
    pointsMesh.material.color.lerp(targetColors.outer, 0.06);
    innerMesh.material.color.lerp(targetColors.inner, 0.06);
    innerMesh.material.emissive.lerp(targetColors.coreEmissive, 0.06);
    ring1.material.color.lerp(targetColors.outer, 0.06);
    ring2.material.color.lerp(targetColors.inner, 0.06);
    ring3.material.color.lerp(targetColors.outer, 0.06);
    particlesMesh.material.color.lerp(targetColors.particle, 0.06);
    coreLight.color.lerp(targetColors.outer, 0.06);
    rimLight1.color.lerp(targetColors.rim1, 0.06);
    rimLight2.color.lerp(targetColors.rim2, 0.06);

    const curScale = polyhedronGroup.scale.x;
    const nextScale = curScale + (targetColors.scale - curScale) * 0.06;
    polyhedronGroup.scale.setScalar(nextScale);
  }

  // 7. Render Scene
  renderer.render(scene, camera);
}

/**
 * Clean up Three.js resources
 */
export function destroyLanding3D() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (renderer) renderer.dispose();
}
