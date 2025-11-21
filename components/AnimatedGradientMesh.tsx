'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '@/lib/useReducedMotion';

// Gradient mesh shader with animated distortion
const gradientMeshShader = {
  vertexShader: `
    uniform float time;
    uniform float intensity;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Simplex noise function for smooth distortion
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
              
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    void main() {
      vUv = uv;
      
      // Create flowing distortion
      vec3 pos = position;
      float noise1 = snoise(vec3(pos.x * 0.5 + time * 0.2, pos.y * 0.5, time * 0.3));
      float noise2 = snoise(vec3(pos.x * 0.3, pos.y * 0.3 + time * 0.15, time * 0.2));
      
      // Apply multi-layered distortion
      pos.z += (noise1 * 0.5 + noise2 * 0.3) * intensity;
      pos.x += noise2 * 0.2 * intensity;
      pos.y += noise1 * 0.2 * intensity;
      
      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform vec3 color4;
    uniform float speed;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      // Create animated gradient based on position and time
      float mixFactor1 = vUv.x + sin(vUv.y * 3.0 + time * speed) * 0.3;
      float mixFactor2 = vUv.y + cos(vUv.x * 3.0 + time * speed * 0.7) * 0.3;
      
      // Multi-point gradient
      vec3 color = mix(
        mix(color1, color2, smoothstep(0.0, 1.0, mixFactor1)),
        mix(color3, color4, smoothstep(0.0, 1.0, mixFactor1)),
        smoothstep(0.0, 1.0, mixFactor2)
      );
      
      // Add subtle shimmer
      float shimmer = sin(vPosition.z * 10.0 + time * 2.0) * 0.05 + 0.95;
      color *= shimmer;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export type ColorScheme = 
  | 'ocean' 
  | 'sunset' 
  | 'forest' 
  | 'lavender' 
  | 'fire' 
  | 'cyberpunk'
  | 'monochrome'
  | 'aurora';

interface ColorPalette {
  color1: THREE.Color;
  color2: THREE.Color;
  color3: THREE.Color;
  color4: THREE.Color;
}

const colorSchemes: Record<ColorScheme, ColorPalette> = {
  ocean: {
    color1: new THREE.Color('#0066CC'),
    color2: new THREE.Color('#00CCCC'),
    color3: new THREE.Color('#0099FF'),
    color4: new THREE.Color('#66CCFF'),
  },
  sunset: {
    color1: new THREE.Color('#FF6B35'),
    color2: new THREE.Color('#F7931E'),
    color3: new THREE.Color('#FF3366'),
    color4: new THREE.Color('#FFC75F'),
  },
  forest: {
    color1: new THREE.Color('#0B6623'),
    color2: new THREE.Color('#2ECC71'),
    color3: new THREE.Color('#27AE60'),
    color4: new THREE.Color('#7FFF00'),
  },
  lavender: {
    color1: new THREE.Color('#8B5CF6'),
    color2: new THREE.Color('#EC4899'),
    color3: new THREE.Color('#A78BFA'),
    color4: new THREE.Color('#F472B6'),
  },
  fire: {
    color1: new THREE.Color('#FF4500'),
    color2: new THREE.Color('#FF6347'),
    color3: new THREE.Color('#FF1493'),
    color4: new THREE.Color('#FFD700'),
  },
  cyberpunk: {
    color1: new THREE.Color('#00FFFF'),
    color2: new THREE.Color('#FF00FF'),
    color3: new THREE.Color('#00FF00'),
    color4: new THREE.Color('#FF0080'),
  },
  monochrome: {
    color1: new THREE.Color('#1a1a1a'),
    color2: new THREE.Color('#4a4a4a'),
    color3: new THREE.Color('#2a2a2a'),
    color4: new THREE.Color('#6a6a6a'),
  },
  aurora: {
    color1: new THREE.Color('#00FF87'),
    color2: new THREE.Color('#60EFFF'),
    color3: new THREE.Color('#B05FF9'),
    color4: new THREE.Color('#FF6FFF'),
  },
};

interface MeshProps {
  colorScheme: ColorScheme;
  intensity: number;
  speed: number;
  prefersReducedMotion: boolean;
}

function GradientMesh({ colorScheme, intensity, speed, prefersReducedMotion }: MeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const palette = colorSchemes[colorScheme];

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: intensity },
        speed: { value: speed },
        color1: { value: palette.color1 },
        color2: { value: palette.color2 },
        color3: { value: palette.color3 },
        color4: { value: palette.color4 },
      },
      vertexShader: gradientMeshShader.vertexShader,
      fragmentShader: gradientMeshShader.fragmentShader,
      side: THREE.DoubleSide,
    });
  }, [colorScheme, intensity, speed]);

  useFrame(({ clock }) => {
    if (meshRef.current && material) {
      if (!prefersReducedMotion) {
        material.uniforms.time.value = clock.getElapsedTime();
      }
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[20, 12, 64, 64]} />
    </mesh>
  );
}

interface AnimatedGradientMeshProps {
  colorScheme?: ColorScheme;
  intensity?: number;
  speed?: number;
  blur?: boolean;
  opacity?: number;
  className?: string;
}

export default function AnimatedGradientMesh({
  colorScheme = 'ocean',
  intensity = 1.0,
  speed = 0.5,
  blur = true,
  opacity = 0.5,
  className = '',
}: AnimatedGradientMeshProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={canvasRef}
      className={`absolute inset-0 -z-10 overflow-hidden ${className}`}
      style={{ 
        opacity,
        filter: blur ? 'blur(80px)' : 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 2]}
        style={{ 
          width: '100%', 
          height: '100%',
        }}
      >
        <GradientMesh
          colorScheme={colorScheme}
          intensity={prefersReducedMotion ? 0 : intensity}
          speed={prefersReducedMotion ? 0 : speed}
          prefersReducedMotion={prefersReducedMotion}
        />
      </Canvas>
    </div>
  );
}

