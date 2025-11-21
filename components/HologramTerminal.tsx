'use client';

import { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { DemoCommand } from '@/data/types';

// Laptop Model Component
function LaptopModel({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const laptopRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!laptopRef.current || prefersReducedMotion) return;
    // Gentle floating animation for the laptop
    laptopRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.08 - 2.5;
  });

  return (
    <group ref={laptopRef} position={[0, -2.5, 0]}>
      {/* Laptop Base */}
      <mesh position={[0, 0, 0]} rotation-x={-Math.PI / 2}>
        <boxGeometry args={[5, 3.5, 0.3]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Laptop Keyboard */}
      <mesh position={[0, 0.16, 0]} rotation-x={-Math.PI / 2}>
        <boxGeometry args={[4.5, 3, 0.05]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Laptop Screen/Back */}
      <mesh position={[0, 1.8, -1.5]} rotation-x={-0.2}>
        <boxGeometry args={[5, 3.2, 0.2]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Screen Surface (black) */}
      <mesh position={[0, 1.8, -1.39]} rotation-x={-0.2}>
        <planeGeometry args={[4.6, 2.8]} />
        <meshStandardMaterial
          color="#000000"
          metalness={0.3}
          roughness={0.7}
          emissive="#001122"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Screen Glow */}
      <mesh position={[0, 1.8, -1.35]} rotation-x={-0.2}>
        <planeGeometry args={[4.8, 3]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Brand Logo (on screen bezel) */}
      <mesh position={[0, 3.5, -1.5]} rotation-x={-0.2}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

interface HologramShellProps {
  children: React.ReactNode;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  htmlWidth: string;
}

function HologramShell({ children, prefersReducedMotion, isMobile, htmlWidth }: HologramShellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const scanlineRef = useRef<THREE.Mesh>(null);

  // Floating and emerging animation from laptop
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (groupRef.current && !prefersReducedMotion) {
      // Position hologram coming out of laptop - lower position for better visibility
      groupRef.current.position.y = 1.2 + Math.sin(time * 0.5) * 0.12;
      groupRef.current.position.z = 1.2 + Math.sin(time * 0.3) * 0.15;
      // Slight tilt for 3D effect
      groupRef.current.rotation.x = -0.1;
    }

    // Pulsing glow
    if (glowRef.current && !prefersReducedMotion) {
      const pulse = Math.sin(time * 2) * 0.2 + 0.8;
      glowRef.current.scale.setScalar(pulse);
    }

    // Animated scanlines
    if (scanlineRef.current && !prefersReducedMotion) {
      scanlineRef.current.position.y = ((time * 0.5) % 2) - 1;
    }
  });

  return (
    <group ref={groupRef} scale={isMobile ? 0.7 : 0.85}>
      {/* Hologram Frame */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={isMobile ? [7, 4.5] : [8, 5]} />
        <meshStandardMaterial
          color="#00ffff"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Glow Effect */}
      <mesh ref={glowRef} position={[0, 0, -0.15]}>
        <planeGeometry args={isMobile ? [7.5, 5] : [8.5, 5.5]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Corner Markers */}
      {[
        [-4, 2.5, 0],
        [4, 2.5, 0],
        [-4, -2.5, 0],
        [4, -2.5, 0],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.2, 0.2, 0.05]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={2}
          />
        </mesh>
      ))}

      {/* Scanline Effect */}
      <mesh ref={scanlineRef}>
        <planeGeometry args={[8, 0.1]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid Lines */}
      <lineSegments>
        <edgesGeometry
          attach="geometry"
          args={[new THREE.PlaneGeometry(8, 5, 16, 10)]}
        />
        <lineBasicMaterial attach="material" color="#00ffff" opacity={0.2} transparent />
      </lineSegments>

      {/* HTML Content */}
      <Html
        transform
        distanceFactor={6}
        position={[0, 0, 0.01]}
        style={{
          width: htmlWidth,
          maxWidth: '95vw',
          pointerEvents: 'auto',
        }}
      >
        <div className="hologram-content">
          {children}
        </div>
      </Html>
    </group>
  );
}

interface ParticleFieldProps {
  prefersReducedMotion: boolean;
}

function ParticleField({ prefersReducedMotion }: ParticleFieldProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 200;

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 20; // x
      p[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      p[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
    }
    return p;
  }, []);

  useFrame(({ clock }) => {
    if (particlesRef.current && !prefersReducedMotion) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
      
      // Animate individual particles
      const positions = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions.array[i3 + 1] += Math.sin(clock.getElapsedTime() + i) * 0.002;
        
        // Wrap around
        if (positions.array[i3 + 1] > 10) positions.array[i3 + 1] = -10;
        if (positions.array[i3 + 1] < -10) positions.array[i3 + 1] = 10;
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00ffff"
        size={0.05}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

interface HologramTerminalProps {
  children: React.ReactNode;
  className?: string;
}

export default function HologramTerminal({ children, className = '' }: HologramTerminalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const cameraPosition: [number, number, number] = isMobile ? [0, 0, 16] : [0, 0, 13];
  const cameraFov = isMobile ? 60 : 50;
  
  // More granular width control for better mobile display
  const getHtmlWidth = () => {
    if (typeof window === 'undefined') return '800px';
    const width = window.innerWidth;
    if (width < 450) return '90vw';
    if (width < 640) return '92vw';
    if (width < 768) return '94vw';
    if (width < 1024) return '600px';
    return '800px';
  };
  const htmlWidth = getHtmlWidth();
  
  // Adjust height for very small screens
  // More granular container height for better mobile to tablet display
  const getContainerHeight = () => {
    if (typeof window === 'undefined') return '650px';
    const width = window.innerWidth;
    if (width < 450) return '400px';
    if (width < 640) return '450px';
    if (width < 768) return '500px';
    if (width < 900) return '550px';  // Better for tablets around 770-900px
    if (width < 1024) return '600px';
    return '650px';
  };

  return (
    <div className={`relative ${className} w-full overflow-hidden`} style={{ height: getContainerHeight() }}>
      <Canvas camera={{ position: cameraPosition, fov: cameraFov }}>
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 5, 10]} intensity={1.2} color="#00ffff" />
          <pointLight position={[10, 10, 5]} intensity={0.6} color="#ff00ff" />
          <pointLight position={[-10, -10, 5]} intensity={0.6} color="#00ff00" />
          <spotLight
            position={[0, 10, 0]}
            angle={0.5}
            penumbra={1}
            intensity={0.5}
            color="#00ffff"
            castShadow
          />

          {/* Environment */}
          <Environment preset="night" />

          {/* Particle Field */}
          <ParticleField prefersReducedMotion={prefersReducedMotion} />

          {/* Laptop Model */}
          <LaptopModel prefersReducedMotion={prefersReducedMotion} />

          {/* Hologram Shell with Content - positioned to emerge from laptop */}
          <HologramShell prefersReducedMotion={prefersReducedMotion} isMobile={isMobile} htmlWidth={htmlWidth}>
            {children}
          </HologramShell>
        </Suspense>
      </Canvas>

      {/* Holographic Display Banner */}
      <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm px-2 sm:px-3 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-full text-cyan-400 text-[10px] sm:text-xs md:text-sm font-bold border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/30">
        <span className="inline-flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          CLI_X HOLOGRAPHIC TERMINAL
          <span className="px-2 py-1 bg-purple-500/30 text-purple-300 text-xs rounded-md font-mono">3D</span>
        </span>
      </div>

      {/* Hologram Label */}
      <div className="hidden sm:flex absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-cyan-400 text-xs sm:text-sm font-bold border border-cyan-500/50 shadow-lg shadow-cyan-500/30">
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
          HOLOGRAPHIC DISPLAY ACTIVE
        </span>
      </div>

      {/* CSS for hologram styling */}
      <style jsx global>{`
        .hologram-content {
          background: rgba(0, 20, 40, 0.95);
          border: 2px solid rgba(0, 255, 255, 0.5);
          border-radius: 12px;
          box-shadow: 
            0 0 20px rgba(0, 255, 255, 0.3),
            inset 0 0 20px rgba(0, 255, 255, 0.1);
          padding: 12px;
          font-size: 0.875rem;
          font-family: 'Courier New', monospace;
          color: #00ffff;
          backdrop-filter: blur(10px);
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
          max-height: 350px;
        }

        @media (max-width: 449px) {
          .hologram-content {
            padding: 8px;
            font-size: 0.75rem;
            border-radius: 8px;
            max-height: 300px;
            border-width: 1px;
          }
        }

        @media (min-width: 640px) {
          .hologram-content {
            padding: 18px;
            font-size: 0.9375rem;
            border-radius: 14px;
            max-height: 450px;
          }
        }

        @media (min-width: 768px) {
          .hologram-content {
            padding: 24px;
            font-size: 1rem;
            border-radius: 16px;
            max-height: 500px;
          }
        }

        .hologram-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 255, 255, 0.03) 0px,
            rgba(0, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 2px
          );
          pointer-events: none;
          z-index: 1;
        }

        .hologram-content > * {
          position: relative;
          z-index: 2;
        }

        /* Glitch effect animation */
        @keyframes glitch {
          0%, 100% {
            text-shadow: 
              2px 2px 0 rgba(0, 255, 255, 0.7),
              -2px -2px 0 rgba(255, 0, 255, 0.7);
          }
          25% {
            text-shadow: 
              -2px 2px 0 rgba(0, 255, 255, 0.7),
              2px -2px 0 rgba(255, 0, 255, 0.7);
          }
          50% {
            text-shadow: 
              2px -2px 0 rgba(0, 255, 255, 0.7),
              -2px 2px 0 rgba(255, 0, 255, 0.7);
          }
          75% {
            text-shadow: 
              -2px -2px 0 rgba(0, 255, 255, 0.7),
              2px 2px 0 rgba(255, 0, 255, 0.7);
          }
        }

        .hologram-content h1,
        .hologram-content h2,
        .hologram-content h3 {
          animation: glitch 3s infinite;
        }

        /* Cyberpunk scrollbar */
        .hologram-content::-webkit-scrollbar {
          width: 8px;
        }

        .hologram-content::-webkit-scrollbar-track {
          background: rgba(0, 255, 255, 0.1);
          border-radius: 4px;
        }

        .hologram-content::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.5);
          border-radius: 4px;
        }

        .hologram-content::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}

