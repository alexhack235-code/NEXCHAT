use crate::scene_graph::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateDefinition {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub r3f_code: &'static str,
    pub scene_graph: SceneGraph,
    pub tags: Vec<&'static str>,
}

pub fn get_all_templates() -> Vec<TemplateDefinition> {
    vec![
        get_cyberpunk_template(),
        get_product_template(),
        get_portfolio_template(),
        get_gaming_template(),
        get_event_template(),
    ]
}

pub fn find_template_by_id(id: &str) -> Option<TemplateDefinition> {
    get_all_templates().into_iter().find(|t| t.id == id)
}

pub fn match_template_by_prompt(prompt: &str) -> TemplateDefinition {
    let p = prompt.to_lowercase();
    if p.contains("watch") || p.contains("product") || p.contains("shoe") || p.contains("bottle") || p.contains("car") || p.contains("luxury") {
        get_product_template()
    } else if p.contains("portfolio") || p.contains("cv") || p.contains("designer") || p.contains("art") || p.contains("studio") {
        get_portfolio_template()
    } else if p.contains("game") || p.contains("gaming") || p.contains("fps") || p.contains("dungeon") || p.contains("portal") || p.contains("space") {
        get_gaming_template()
    } else if p.contains("music") || p.contains("festival") || p.contains("dj") || p.contains("concert") || p.contains("stage") || p.contains("sound") {
        get_event_template()
    } else {
        get_cyberpunk_template()
    }
}

// ----------------------------------------------------------------------------
// 1. CYBERPUNK CITY TEMPLATE
// ----------------------------------------------------------------------------
pub fn get_cyberpunk_template() -> TemplateDefinition {
    let r3f_code = r#"import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Stars, MeshReflectorMaterial, Box, Sphere, Torus } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

function FlyingVehicles() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      const t = clock.getElapsedTime() * 1.5;
      group.current.position.x = Math.sin(t) * 8;
      group.current.position.z = Math.cos(t * 0.7) * 4;
      group.current.rotation.y = Math.sin(t * 0.5) * 0.5;
    }
  });

  return (
    <group ref={group} position={[0, 4, 0]}>
      {/* Aerocar Body */}
      <Box args={[1.8, 0.4, 3]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#00F0FF" metalness={0.9} roughness={0.1} emissive="#003344" />
      </Box>
      {/* Plasma Thrusters */}
      <Sphere args={[0.2, 16, 16]} position={[-0.7, 0, 1.5]}>
        <meshBasicMaterial color="#FF007F" />
      </Sphere>
      <Sphere args={[0.2, 16, 16]} position={[0.7, 0, 1.5]}>
        <meshBasicMaterial color="#FF007F" />
      </Sphere>
    </group>
  );
}

function NeonCitySpire({ position, height, color }: { position: [number, number, number], height: number, color: string }) {
  return (
    <group position={position}>
      <Box args={[1.5, height, 1.5]} position={[0, height / 2, 0]}>
        <meshStandardMaterial color="#080812" metalness={0.95} roughness={0.1} />
      </Box>
      {/* Beacon Ring */}
      <Torus args={[1.1, 0.08, 16, 32]} position={[0, height * 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
      </Torus>
    </group>
  );
}

export default function GeneratedScene() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#020008', position: 'relative' }}>
      <Canvas camera={{ position: [0, 6, 14], fov: 50 }}>
        <color attach="background" args={['#020008']} />
        <fog attach="fog" args={['#050014', 8, 35]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} color="#00F0FF" />
        <pointLight position={[-8, 6, -4]} intensity={4} color="#FF007F" distance={25} />

        <Stars radius={60} depth={40} count={3000} factor={4} saturation={1} fade speed={2} />

        {/* Flying Aerocars */}
        <FlyingVehicles />

        {/* Skyscraper Cluster */}
        <NeonCitySpire position={[-5, 0, -4]} height={9} color="#00F0FF" />
        <NeonCitySpire position={[-2.5, 0, -8]} height={14} color="#FF007F" />
        <NeonCitySpire position={[3, 0, -6]} height={11} color="#00FF88" />
        <NeonCitySpire position={[6, 0, -3]} height={8} color="#FFE600" />

        {/* Floating Holographic Ring */}
        <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
          <Torus args={[2.5, 0.25, 24, 64]} position={[0, 4.5, -2]} rotation={[0.4, 0.8, 0]}>
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} metalness={0.9} roughness={0.1} />
          </Torus>
        </Float>

        {/* Reflective Cyber Highway Floor */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 60]} />
          <MeshReflectorMaterial
            mirror={0.7}
            blur={[400, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={2}
            roughness={0.2}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#080814"
            metalness={0.8}
          />
        </mesh>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} maxPolarAngle={Math.PI / 2 - 0.05} />

        {/* High-Impact Post-Processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.8} />
          <ChromaticAberration offset={[0.0015, 0.0015]} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
"#;

    TemplateDefinition {
        id: "template_cyberpunk",
        name: "Cyberpunk Metropolis 2099",
        description: "Neon skyscrapers, flying aerocars, reflective wet ground, and volumetric fog.",
        r3f_code,
        scene_graph: SceneGraph::new_cyberpunk_city(),
        tags: vec!["cyberpunk", "city", "neon", "aerocars", "future", "bloom"],
    }
}

// ----------------------------------------------------------------------------
// 2. LUXURY PRODUCT SHOWCASE TEMPLATE
// ----------------------------------------------------------------------------
pub fn get_product_template() -> TemplateDefinition {
    let r3f_code = r#"import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial, ContactShadows, SpotLight } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function LuxuryProduct() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.4;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.15;
    }
  });

  return (
    <group position={[0, 1.2, 0]}>
      {/* Outer Ceramic Bezel */}
      <mesh ref={meshRef}>
        <torusGeometry args={[1.8, 0.45, 32, 100]} />
        <meshPhysicalMaterial
          color="#0d0d11"
          roughness={0.05}
          metalness={0.95}
          clearcoat={1}
          clearcoatRoughness={0.1}
          reflectivity={1}
        />
      </mesh>
      {/* Central Gem / Core */}
      <Float speed={3} rotationIntensity={0.8} floatIntensity={1.2}>
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[1.1, 0]} />
          <meshPhysicalMaterial
            color="#FFD700"
            emissive="#7A5200"
            emissiveIntensity={1.2}
            metalness={0.9}
            roughness={0.1}
            transmission={0.4}
            thickness={1.5}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function GeneratedScene() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle, #1a1a24 0%, #08080d 100%)', position: 'relative' }}>
      <Canvas camera={{ position: [0, 3, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        {/* Dynamic Studio Spotlights */}
        <SpotLight position={[6, 8, 5]} angle={0.4} penumbra={1} intensity={80} color="#ffffff" castShadow />
        <SpotLight position={[-6, 6, -4]} angle={0.5} penumbra={1} intensity={40} color="#FFD700" />
        <pointLight position={[0, -2, 2]} intensity={10} color="#4080ff" />

        {/* Luxury Pedestal */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[2.8, 3.2, 0.8, 64]} />
          <meshStandardMaterial color="#0b0b10" metalness={0.9} roughness={0.2} />
        </mesh>

        <LuxuryProduct />

        <ContactShadows position={[0, -0.99, 0]} opacity={0.7} scale={12} blur={2.4} far={4} />
        <OrbitControls autoRotate autoRotateSpeed={1.0} enablePan={false} minDistance={3.5} maxDistance={9} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.5} intensity={1.2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
"#;

    TemplateDefinition {
        id: "template_product",
        name: "Luxury Product Showcase",
        description: "Studio pedestal, precision spotlights, 360 smooth rotation, and physical clearcoat materials.",
        r3f_code,
        scene_graph: SceneGraph {
            title: "Haute Horlogerie Showcase".to_string(),
            scene: SceneEnvironment {
                fog: "#08080d, 5, 20".to_string(),
                background: "#08080d".to_string(),
                lighting: "luxury_studio".to_string(),
            },
            camera: CameraConfig { position: [0.0, 3.0, 6.0], fov: 45.0 },
            objects: vec![
                SceneObject {
                    object_type: "mesh".to_string(),
                    geometry: "torus".to_string(),
                    material: MaterialConfig {
                        color: "#0d0d11".to_string(),
                        metalness: 0.95,
                        roughness: 0.05,
                        emissive: "#000000".to_string(),
                    },
                    position: [0.0, 1.2, 0.0],
                    rotation: [0.0, 0.0, 0.0],
                    animation: AnimationConfig { anim_type: "rotate".to_string(), duration: 8.0, intensity: 1.0 },
                }
            ],
            postprocessing: vec!["bloom".to_string()],
            interactions: vec!["orbitControls".to_string()],
        },
        tags: vec!["product", "luxury", "pedestal", "spotlight", "materials"],
    }
}

// ----------------------------------------------------------------------------
// 3. ABSTRACT PORTFOLIO HERO TEMPLATE
// ----------------------------------------------------------------------------
pub fn get_portfolio_template() -> TemplateDefinition {
    let r3f_code = r#"import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial, Sphere, Torus, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function KineticLiquidBlob() {
  const blobRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (blobRef.current) {
      blobRef.current.rotation.z = clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={1.2} floatIntensity={2}>
      <mesh ref={blobRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2.2, 64, 64]} />
        <MeshDistortMaterial
          color="#6C00FF"
          emissive="#2C0077"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.8}
          distort={0.45}
          speed={3}
        />
      </mesh>
    </Float>
  );
}

export default function GeneratedScene() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#05030A', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[8, 8, 6]} intensity={30} color="#FF007F" />
        <pointLight position={[-8, -6, 4]} intensity={40} color="#00F0FF" />

        <KineticLiquidBlob />

        {/* Orbiting Gyroscope Rings */}
        <Float speed={1.5} rotationIntensity={2}>
          <Torus args={[3.2, 0.08, 16, 100]} rotation={[1.2, 0.4, 0]}>
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2} />
          </Torus>
          <Torus args={[3.8, 0.06, 16, 100]} rotation={[0.6, 1.4, 0]}>
            <meshStandardMaterial color="#FF007F" emissive="#FF007F" emissiveIntensity={2} />
          </Torus>
        </Float>

        <Sparkles count={150} scale={12} size={3} speed={0.6} color="#00FF88" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.3} intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
"#;

    TemplateDefinition {
        id: "template_portfolio",
        name: "Abstract Creative Portfolio Hero",
        description: "Kinetic morphing liquid sphere, gyroscope neon rings, and generative sparkles.",
        r3f_code,
        scene_graph: SceneGraph {
            title: "Creative Technologist Studio".to_string(),
            scene: SceneEnvironment {
                fog: "#05030A, 5, 25".to_string(),
                background: "#05030A".to_string(),
                lighting: "dual_gradient".to_string(),
            },
            camera: CameraConfig { position: [0.0, 0.0, 8.0], fov: 50.0 },
            objects: vec![
                SceneObject {
                    object_type: "mesh".to_string(),
                    geometry: "sphere".to_string(),
                    material: MaterialConfig {
                        color: "#6C00FF".to_string(),
                        metalness: 0.8,
                        roughness: 0.1,
                        emissive: "#2C0077".to_string(),
                    },
                    position: [0.0, 0.0, 0.0],
                    rotation: [0.0, 0.0, 0.0],
                    animation: AnimationConfig { anim_type: "float".to_string(), duration: 2.5, intensity: 2.0 },
                }
            ],
            postprocessing: vec!["bloom".to_string()],
            interactions: vec!["orbitControls".to_string()],
        },
        tags: vec!["portfolio", "creative", "blob", "distort", "kinetic"],
    }
}

// ----------------------------------------------------------------------------
// 4. LOW-POLY GAMING PORTAL TEMPLATE
// ----------------------------------------------------------------------------
pub fn get_gaming_template() -> TemplateDefinition {
    let r3f_code = r#"import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Box, Dodecahedron } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function QuantumPortal() {
  const portalRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (portalRef.current) {
      portalRef.current.rotation.z = clock.getElapsedTime() * 0.8;
      portalRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group ref={portalRef} position={[0, 2.5, 0]}>
      {/* Crystalline Core */}
      <Dodecahedron args={[1.5, 0]}>
        <meshStandardMaterial color="#00FF88" wireframe emissive="#00FF88" emissiveIntensity={3} />
      </Dodecahedron>
      {/* Outer Polyhedral Shell */}
      <Dodecahedron args={[2.2, 0]}>
        <meshStandardMaterial color="#0044FF" wireframe emissive="#002288" emissiveIntensity={1.5} />
      </Dodecahedron>
    </group>
  );
}

function FloatingIslands() {
  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <Box args={[4, 1.2, 4]} position={[-5, 0, -3]}>
          <meshStandardMaterial color="#1a1c2e" roughness={0.8} metalness={0.2} />
        </Box>
        <Box args={[0.5, 2, 0.5]} position={[-5, 1.5, -3]}>
          <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={2} />
        </Box>
      </Float>

      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2}>
        <Box args={[5, 1.5, 5]} position={[5, -1, -4]}>
          <meshStandardMaterial color="#1a1c2e" roughness={0.8} metalness={0.2} />
        </Box>
        <Box args={[0.8, 3, 0.8]} position={[5, 1.2, -4]}>
          <meshStandardMaterial color="#FF0055" emissive="#FF0055" emissiveIntensity={2} />
        </Box>
      </Float>
    </group>
  );
}

export default function GeneratedScene() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#04050d', position: 'relative' }}>
      <Canvas camera={{ position: [0, 4, 12], fov: 55 }}>
        <color attach="background" args={['#04050d']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 4, 2]} intensity={50} color="#00FF88" distance={20} />
        <pointLight position={[6, 8, -2]} intensity={30} color="#FF0055" />

        <Stars radius={80} count={2500} factor={4} fade />
        <QuantumPortal />
        <FloatingIslands />

        <OrbitControls enableZoom={true} enablePan={true} maxPolarAngle={Math.PI / 2} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} intensity={2.0} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
"#;

    TemplateDefinition {
        id: "template_gaming",
        name: "Low-Poly Cyber Gaming Portal",
        description: "Spinning quantum dodecahedron portal, floating polygon islands, and neon monoliths.",
        r3f_code,
        scene_graph: SceneGraph {
            title: "Quantum Gaming Odyssey".to_string(),
            scene: SceneEnvironment {
                fog: "#04050d, 8, 40".to_string(),
                background: "#04050d".to_string(),
                lighting: "neon_portal".to_string(),
            },
            camera: CameraConfig { position: [0.0, 4.0, 12.0], fov: 55.0 },
            objects: vec![
                SceneObject {
                    object_type: "mesh".to_string(),
                    geometry: "box".to_string(),
                    material: MaterialConfig {
                        color: "#00FF88".to_string(),
                        metalness: 0.5,
                        roughness: 0.5,
                        emissive: "#00FF88".to_string(),
                    },
                    position: [0.0, 2.5, 0.0],
                    rotation: [0.0, 0.0, 0.0],
                    animation: AnimationConfig { anim_type: "rotate".to_string(), duration: 5.0, intensity: 1.5 },
                }
            ],
            postprocessing: vec!["bloom".to_string()],
            interactions: vec!["orbitControls".to_string()],
        },
        tags: vec!["gaming", "low-poly", "portal", "quantum", "dodecahedron"],
    }
}

// ----------------------------------------------------------------------------
// 5. AUDIO REACTIVE MUSIC STAGE TEMPLATE
// ----------------------------------------------------------------------------
pub fn get_event_template() -> TemplateDefinition {
    let r3f_code = r#"import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Cylinder, Torus, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function AudioStrobeRings() {
  const ringRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = clock.getElapsedTime() * 3.0;
      const s = 1.0 + Math.sin(t) * 0.15;
      ringRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={ringRef} position={[0, 4, -4]}>
      <Torus args={[4, 0.1, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#FF0055" emissive="#FF0055" emissiveIntensity={4} />
      </Torus>
      <Torus args={[6, 0.12, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={4} />
      </Torus>
    </group>
  );
}

export default function GeneratedScene() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#020205', position: 'relative' }}>
      <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
        <color attach="background" args={['#020205']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 10, -2]} intensity={80} color="#FF0055" />
        <pointLight position={[-8, 6, 4]} intensity={50} color="#00F0FF" />
        <pointLight position={[8, 6, 4]} intensity={50} color="#FFE600" />

        {/* Concert Stage Structure */}
        <Cylinder args={[8, 9, 1.2, 32]} position={[0, 0, -3]}>
          <meshStandardMaterial color="#0a0a14" metalness={0.9} roughness={0.1} />
        </Cylinder>

        {/* Audio Strobe Tunnel */}
        <AudioStrobeRings />
        <Sparkles count={300} scale={[20, 10, 20]} size={4} speed={2} color="#FFE600" />

        <OrbitControls enableZoom={true} enableRotate={true} maxPolarAngle={Math.PI / 2 - 0.05} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.15} intensity={2.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
"#;

    TemplateDefinition {
        id: "template_event",
        name: "Audio-Reactive Electronic Stage",
        description: "Multi-point concert strobe lighting, pulsating holographic ring tunnel, and gold particle sparks.",
        r3f_code,
        scene_graph: SceneGraph {
            title: "Apex Horizon Electronic Stage".to_string(),
            scene: SceneEnvironment {
                fog: "#020205, 5, 30".to_string(),
                background: "#020205".to_string(),
                lighting: "concert_strobes".to_string(),
            },
            camera: CameraConfig { position: [0.0, 5.0, 15.0], fov: 60.0 },
            objects: vec![
                SceneObject {
                    object_type: "mesh".to_string(),
                    geometry: "cylinder".to_string(),
                    material: MaterialConfig {
                        color: "#0a0a14".to_string(),
                        metalness: 0.9,
                        roughness: 0.1,
                        emissive: "#000000".to_string(),
                    },
                    position: [0.0, 0.0, -3.0],
                    rotation: [0.0, 0.0, 0.0],
                    animation: AnimationConfig { anim_type: "none".to_string(), duration: 0.0, intensity: 0.0 },
                }
            ],
            postprocessing: vec!["bloom".to_string()],
            interactions: vec!["orbitControls".to_string()],
        },
        tags: vec!["stage", "music", "festival", "audio", "lights", "strobes"],
    }
}
