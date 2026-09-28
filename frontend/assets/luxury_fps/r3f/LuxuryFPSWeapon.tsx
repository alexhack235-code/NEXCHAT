import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LuxuryFPSWeaponProps {
  isAiming?: boolean;
  onFire?: () => void;
  goldRoughness?: number;
  coreGlow?: number;
}

/**
 * AURUM-IX Luxury Plasma Railgun R3F Component.
 * Supports Next.js App Router, Vite, and WebGL 60FPS pipelines.
 */
export const LuxuryFPSWeapon: React.FC<LuxuryFPSWeaponProps> = ({
  isAiming = false,
  goldRoughness = 0.1,
  coreGlow = 2.5
}) => {
  const weaponRef = useRef<THREE.Group>(null);
  const recoilRef = useRef({ z: 0, rotX: 0 });

  const HIP_POS = new THREE.Vector3(0.24, -0.22, -0.5);
  const ADS_POS = new THREE.Vector3(0.0, -0.12, -0.38);

  useFrame((_, delta) => {
    if (!weaponRef.current) return;

    // Recoil spring recovery
    recoilRef.current.z = THREE.MathUtils.lerp(recoilRef.current.z, 0, 10 * delta);
    recoilRef.current.rotX = THREE.MathUtils.lerp(recoilRef.current.rotX, 0, 14 * delta);

    // ADS interpolation
    const targetPos = isAiming ? ADS_POS : HIP_POS;
    weaponRef.current.position.x = THREE.MathUtils.lerp(weaponRef.current.position.x, targetPos.x, 14 * delta);
    weaponRef.current.position.y = THREE.MathUtils.lerp(weaponRef.current.position.y, targetPos.y, 14 * delta);
    weaponRef.current.position.z = THREE.MathUtils.lerp(weaponRef.current.position.z, targetPos.z + recoilRef.current.z, 20 * delta);

    weaponRef.current.rotation.x = THREE.MathUtils.lerp(weaponRef.current.rotation.x, recoilRef.current.rotX, 16 * delta);
  });

  return (
    <group ref={weaponRef} position={[0.24, -0.22, -0.5]}>
      {/* 1. Receiver (Titanium Damascene) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.42]} />
        <meshStandardMaterial color="#22242a" metalness={0.95} roughness={0.25} />
      </mesh>

      {/* 2. 24K Polished Gold Shroud */}
      <mesh position={[0, 0.02, 0.38]}>
        <boxGeometry args={[0.065, 0.085, 0.55]} />
        <meshStandardMaterial color="#ffd700" metalness={1.0} roughness={goldRoughness} />
      </mesh>

      {/* 3. Obsidian Barrel */}
      <mesh position={[0, 0.02, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.65, 18]} />
        <meshStandardMaterial color="#050508" metalness={0.9} roughness={0.05} />
      </mesh>

      {/* 4. Muzzle Compensator (Gold) */}
      <mesh position={[0, 0.02, 0.74]}>
        <boxGeometry args={[0.07, 0.09, 0.12]} />
        <meshStandardMaterial color="#ffd700" metalness={1.0} roughness={0.12} />
      </mesh>

      {/* 5. Glowing Plasma Energy Core */}
      <mesh position={[0, 0.01, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.22, 16]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={coreGlow}
          roughness={0.1}
        />
      </mesh>

      {/* 6. Holographic Sight Housing */}
      <mesh position={[0, 0.12, 0.06]}>
        <boxGeometry args={[0.055, 0.06, 0.15]} />
        <meshStandardMaterial color="#050508" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* 7. Reticle Lens */}
      <mesh position={[0, 0.12, 0.08]}>
        <boxGeometry args={[0.045, 0.045, 0.005]} />
        <meshPhysicalMaterial
          color="#00ffff"
          transparent
          opacity={0.7}
          roughness={0.05}
          transmission={0.8}
        />
      </mesh>

      {/* 8. Grip */}
      <mesh position={[0, -0.12, -0.06]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.048, 0.16, 0.08]} />
        <meshStandardMaterial color="#0a0a0e" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* 9. Trigger Guard (Gold) */}
      <mesh position={[0, -0.07, 0.02]}>
        <boxGeometry args={[0.052, 0.015, 0.12]} />
        <meshStandardMaterial color="#ffd700" metalness={1.0} roughness={0.1} />
      </mesh>
    </group>
  );
};

export default LuxuryFPSWeapon;
