'use client';

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html, Environment, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated, config } from '@react-spring/three';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { LandscapeImage } from '@/data/types';

interface PhotoFrameProps {
  image: LandscapeImage;
  texture: THREE.Texture;
  position: [number, number, number];
  rotation: number;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

function PhotoFrame({ image, texture, position, rotation, isActive, onClick, index }: PhotoFrameProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Smooth spring animation for active state
  const { scale, posZ, opacity } = useSpring({
    scale: isActive ? 1.5 : 1,
    posZ: isActive ? 2 : 0,
    opacity: isActive ? 1 : 0.7,
    config: config.gentle,
  });

  // Gentle floating animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const floatAmount = isActive ? 0.12 : 0.04; // Less movement for inactive photos
    groupRef.current.position.y = position[1] + Math.sin(time * 0.4 + index * 0.5) * floatAmount;
  });

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]} rotation-y={rotation}>
      {/* Photo */}
      <animated.mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        scale={scale as any}
        position-z={posZ as any}
      >
        <planeGeometry args={[4, 3]} />
        {/* @ts-expect-error - react-spring types conflict with r3f */}
        <animated.meshStandardMaterial
          map={texture}
          transparent
          opacity={opacity as any}
          side={THREE.DoubleSide}
        />
      </animated.mesh>

      {/* Frame border */}
      <animated.mesh
        position-z={posZ as any}
        scale={scale as any}
      >
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial
          color="#1f2937"
          metalness={0.5}
          roughness={0.5}
        />
      </animated.mesh>

      {/* Reflection */}
      <animated.mesh
        position-y={-1.58}
        rotation-x={Math.PI}
        scale={scale as any}
        position-z={posZ as any}
      >
        <planeGeometry args={[4, 3]} />
        <animated.meshStandardMaterial
          map={texture}
          transparent
          opacity={isActive ? 0.3 : 0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </animated.mesh>

      {/* Title on hover */}
      {isActive && (
        <Html
          position={[0, -2.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
            {image.title}
          </div>
        </Html>
      )}
    </group>
  );
}

interface CarouselProps {
  images: LandscapeImage[];
  onImageClick: (image: LandscapeImage) => void;
  prefersReducedMotion: boolean;
}

function Carousel({ images, onImageClick, prefersReducedMotion }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Preload ALL textures at once to prevent flickering
  const textures = useTexture(images.map(img => img.src));
  
  // Normalize to array and stabilize textures
  const textureArray = useMemo(() => {
    const arr = Array.isArray(textures) ? textures : [textures];
    arr.forEach(texture => {
      if (texture) {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.anisotropy = 0;
      }
    });
    return arr;
  }, [textures]);

  const radius = 8;
  const angleStep = (Math.PI * 2) / images.length;

  // Calculate positions in circular formation
  const positions = useMemo(() => {
    return images.map((_, i) => {
      const angle = i * angleStep;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      return [x, 0, z] as [number, number, number];
    });
  }, [images.length, angleStep]);

  // Auto-rotation
  useFrame((state) => {
    if (!groupRef.current || prefersReducedMotion) return;
    
    // Smooth rotation to active photo with improved damping
    const targetRotation = -activeIndex * angleStep;
    const currentRotation = groupRef.current.rotation.y;
    const diff = targetRotation - currentRotation;
    
    // Only apply rotation if difference is significant to reduce jitter
    if (Math.abs(diff) > 0.001) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        currentRotation,
        targetRotation,
        0.08
      );
    }
  });

  // Keyboard controls
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    } else if (e.key === 'ArrowRight') {
      setActiveIndex((prev) => (prev + 1) % images.length);
    } else if (e.key === 'Enter' && images[activeIndex]) {
      onImageClick(images[activeIndex]);
    }
  };

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeIndex, images]);

  return (
    <group ref={groupRef}>
      {images.map((image, i) => (
        <PhotoFrame
          key={image.id}
          image={image}
          texture={textureArray[i]}
          position={positions[i]}
          rotation={i * angleStep + Math.PI}
          isActive={i === activeIndex}
          onClick={() => {
            setActiveIndex(i);
            if (i === activeIndex) {
              onImageClick(image);
            }
          }}
          index={i}
        />
      ))}

      {/* Ground plane with reflection */}
      <mesh rotation-x={-Math.PI / 2} position-y={-1.6} receiveShadow>
        <circleGeometry args={[radius + 5, 64]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

interface PhotoCarousel3DProps {
  images: LandscapeImage[];
  onImageClick: (image: LandscapeImage) => void;
  className?: string;
}

export default function PhotoCarousel3D({ images, onImageClick, className = '' }: PhotoCarousel3DProps) {
  const prefersReducedMotion = useReducedMotion();

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <p className="text-gray-400">No images to display</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[600px] ${className}`}>
      <Canvas
        camera={{ position: [0, 2, 12], fov: 50 }}
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          stencil: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        frameloop="always"
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#06b6d4" />
        <pointLight position={[10, 5, 10]} intensity={0.5} color="#8b5cf6" />

        {/* Environment for reflections */}
        <Environment preset="city" />

        {/* Fog */}
        <fog attach="fog" args={['#0a0a0a', 10, 30]} />

        {/* Carousel with Suspense to prevent texture loading flicker */}
        <Suspense fallback={null}>
          <Carousel
            images={images}
            onImageClick={onImageClick}
            prefersReducedMotion={prefersReducedMotion}
          />
          <Preload all />
        </Suspense>
      </Canvas>

      {/* Controls UI */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full">
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            window.dispatchEvent(event);
          }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Previous photo"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-white text-sm font-medium">
          Use arrow keys or click photos
        </span>

        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            window.dispatchEvent(event);
          }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Next photo"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
        🎡 Interactive 3D Gallery
      </div>
    </div>
  );
}

