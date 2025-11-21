'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface MountainProps {
  scrollProgress: any;
  prefersReducedMotion: boolean;
}

function Mountain({ scrollProgress, prefersReducedMotion }: MountainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);

  // Create mountain geometry with heightmap
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(15, 15, 50, 50);
    const positions = geo.attributes.position;

    // Create Matterhorn-like peak
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // Calculate distance from center
      const distance = Math.sqrt(x * x + y * y);
      
      // Create peak shape with multiple layers
      let z = 0;
      
      // Main peak (pyramid shape)
      z += Math.max(0, 3 - distance * 0.5);
      
      // Add ridges
      z += Math.sin(Math.atan2(y, x) * 4) * 0.3 * Math.max(0, 2 - distance);
      
      // Add noise/detail
      z += (Math.sin(x * 2) * Math.cos(y * 2)) * 0.2;
      
      // Sharp peak at center
      if (distance < 0.5) {
        z += (0.5 - distance) * 2;
      }

      positions.setZ(i, z);
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Wireframe geometry
  const wireframeGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(geometry);
  }, [geometry]);

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current || prefersReducedMotion) return;

    const time = state.clock.getElapsedTime();

    // Gentle rotation
    meshRef.current.rotation.z = Math.sin(time * 0.1) * 0.05;
    
    // Breathing effect (subtle scale)
    const breathe = 1 + Math.sin(time * 0.5) * 0.02;
    meshRef.current.scale.set(breathe, breathe, breathe);

    // Sync wireframe
    if (wireframeRef.current) {
      wireframeRef.current.rotation.copy(meshRef.current.rotation);
      wireframeRef.current.scale.copy(meshRef.current.scale);
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Solid mountain */}
      <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#e0e7ff"
          metalness={0.1}
          roughness={0.8}
          flatShading
        />
      </mesh>

      {/* Wireframe overlay */}
      <lineSegments ref={wireframeRef} geometry={wireframeGeometry} rotation={[-Math.PI / 2, 0, 0]}>
        <lineBasicMaterial color="#06b6d4" transparent opacity={0.3} />
      </lineSegments>

      {/* Base platform */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}

function SnowParticles({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const count = prefersReducedMotion ? 0 : 500;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    
    return positions;
  }, [prefersReducedMotion]);

  useFrame((state) => {
    if (!particlesRef.current || prefersReducedMotion) return;
    
    const positions = particlesRef.current.geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      
      // Snow falls down
      positions.setY(i, y - 0.01);
      
      // Reset to top when reaching bottom
      if (y < -2) {
        positions.setY(i, 10);
      }
      
      // Gentle drift
      const x = positions.getX(i);
      positions.setX(i, x + Math.sin(state.clock.elapsedTime + i) * 0.001);
    }
    
    positions.needsUpdate = true;
  });

  if (prefersReducedMotion) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
          count={particles.length / 3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

interface MountainTerrain3DProps {
  className?: string;
}

export default function MountainTerrain3D({ className = '' }: MountainTerrain3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  return (
    <div ref={containerRef} className={`relative w-full h-screen ${className}`}>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        className="absolute inset-0"
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#06b6d4" />
        
        {/* Stars background */}
        <Stars
          radius={100}
          depth={50}
          count={prefersReducedMotion ? 0 : 3000}
          factor={4}
          saturation={0}
          fade
        />

        {/* Fog for depth */}
        <fog attach="fog" args={['#0a0a0a', 8, 25]} />

        {/* Environment lighting */}
        <Environment preset="night" />

        {/* Mountain */}
        <Mountain scrollProgress={scrollYProgress} prefersReducedMotion={prefersReducedMotion} />

        {/* Snow particles */}
        <SnowParticles prefersReducedMotion={prefersReducedMotion} />

        {/* Controls (limited) */}
        {!prefersReducedMotion && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2}
            autoRotate
            autoRotateSpeed={0.5}
          />
        )}
      </Canvas>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
    </div>
  );
}

