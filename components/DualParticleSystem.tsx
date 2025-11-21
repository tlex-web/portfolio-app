'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  opacity: number;
  type: 'code' | 'snow' | 'binary';
}

function CodeParticles({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const count = prefersReducedMotion ? 0 : 40;
    const particleData: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      particleData.push({
        position: new THREE.Vector3(
          Math.random() * 15 - 2.5, // Right side bias
          Math.random() * 20 - 10,
          (Math.random() - 0.5) * 10
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          Math.random() * 0.02 + 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        scale: Math.random() * 0.3 + 0.2,
        opacity: Math.random() * 0.5 + 0.3,
        type: 'code',
      });
    }
    
    return particleData;
  }, [prefersReducedMotion]);

  useFrame(() => {
    if (!meshRef.current || prefersReducedMotion) return;
    
    particles.forEach((particle, i) => {
      // Update position
      particle.position.add(particle.velocity);
      
      // Wrap around
      if (particle.position.y > 10) particle.position.y = -10;
      if (particle.position.x > 15) particle.position.x = -2.5;
      if (particle.position.x < -2.5) particle.position.x = 15;
      
      // Apply to instance
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (prefersReducedMotion) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <planeGeometry args={[0.3, 0.3]} />
      <meshBasicMaterial
        color="#06b6d4"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

function SnowParticles({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const count = prefersReducedMotion ? 0 : 40;
    const particleData: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      particleData.push({
        position: new THREE.Vector3(
          Math.random() * -15 + 2.5, // Left side bias
          Math.random() * 20 - 10,
          (Math.random() - 0.5) * 10
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          -(Math.random() * 0.015 + 0.005), // Fall down
          (Math.random() - 0.5) * 0.01
        ),
        scale: Math.random() * 0.15 + 0.1,
        opacity: Math.random() * 0.4 + 0.4,
        type: 'snow',
      });
    }
    
    return particleData;
  }, [prefersReducedMotion]);

  useFrame((state) => {
    if (!meshRef.current || prefersReducedMotion) return;
    
    particles.forEach((particle, i) => {
      // Update position with drift
      particle.position.add(particle.velocity);
      particle.position.x += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;
      
      // Wrap around
      if (particle.position.y < -10) particle.position.y = 10;
      if (particle.position.x < -15) particle.position.x = 2.5;
      if (particle.position.x > 2.5) particle.position.x = -15;
      
      // Apply to instance with rotation
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(particle.scale);
      dummy.rotation.z = state.clock.elapsedTime * 0.5 + i;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (prefersReducedMotion) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <circleGeometry args={[1, 6]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

function BinaryParticles({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const count = prefersReducedMotion ? 0 : 30;
    const particleData: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      particleData.push({
        position: new THREE.Vector3(
          Math.random() * 20 - 10,
          Math.random() * 20 - 10,
          (Math.random() - 0.5) * 15
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015
        ),
        scale: Math.random() * 0.2 + 0.1,
        opacity: Math.random() * 0.3 + 0.2,
        type: 'binary',
      });
    }
    
    return particleData;
  }, [prefersReducedMotion]);

  useFrame(() => {
    if (!meshRef.current || prefersReducedMotion) return;
    
    particles.forEach((particle, i) => {
      // Update position
      particle.position.add(particle.velocity);
      
      // Wrap around all axes
      ['x', 'y', 'z'].forEach((axis) => {
        const key = axis as 'x' | 'y' | 'z';
        const limit = axis === 'z' ? 7.5 : 10;
        if (particle.position[key] > limit) particle.position[key] = -limit;
        if (particle.position[key] < -limit) particle.position[key] = limit;
      });
      
      // Apply to instance
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (prefersReducedMotion) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshBasicMaterial
        color="#8b5cf6"
        transparent
        opacity={0.4}
      />
    </instancedMesh>
  );
}

interface DualParticleSystemProps {
  className?: string;
}

export default function DualParticleSystem({ className = '' }: DualParticleSystemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ alpha: true, antialias: false }}
      >
        {/* Ambient light */}
        <ambientLight intensity={0.5} />
        
        {/* Left side - Photography theme (snowflakes) */}
        <SnowParticles prefersReducedMotion={prefersReducedMotion} />
        
        {/* Right side - Programming theme (code blocks) */}
        <CodeParticles prefersReducedMotion={prefersReducedMotion} />
        
        {/* Floating everywhere - Binary (0s and 1s) */}
        <BinaryParticles prefersReducedMotion={prefersReducedMotion} />
      </Canvas>
    </div>
  );
}

