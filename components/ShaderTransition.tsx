'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced Dissolve Transition Shader with brightness boost
const dissolveShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform float progress;
    uniform float intensity;
    varying vec2 vUv;

    // Improved noise function
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 tex1 = texture2D(texture1, vUv);
      vec4 tex2 = texture2D(texture2, vUv);
      
      float noise = random(vUv * intensity);
      
      // Wider transition zone for smoother effect
      float mixFactor = smoothstep(progress - 0.2, progress + 0.2, noise);
      
      // Add subtle glow at transition edges
      float edge = smoothstep(progress - 0.15, progress, noise) * 
                   (1.0 - smoothstep(progress, progress + 0.15, noise));
      vec3 glowColor = vec3(0.3, 0.8, 1.0) * edge * 0.4;
      
      vec4 mixedColor = mix(tex1, tex2, mixFactor);
      gl_FragColor = vec4(mixedColor.rgb + glowColor, mixedColor.a);
    }
  `,
};

// Enhanced Ripple Transition Shader with multiple waves
const rippleShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform float progress;
    uniform vec2 center;
    uniform float amplitude;
    uniform float speed;
    varying vec2 vUv;

    void main() {
      vec2 dir = vUv - center;
      float dist = length(dir);
      
      // Multiple ripple waves for richer effect
      float ripple1 = sin((dist - progress * speed) * 15.0) * amplitude;
      float ripple2 = sin((dist - progress * speed) * 25.0) * amplitude * 0.5;
      float ripple = (ripple1 + ripple2) * (1.0 - progress * 0.7);
      
      vec2 offset = normalize(dir) * ripple;
      
      vec4 tex1 = texture2D(texture1, vUv + offset);
      vec4 tex2 = texture2D(texture2, vUv - offset);
      
      // Smoother fade based on distance from center
      float mixFactor = smoothstep(0.0, 1.2, (progress * 1.5 - dist * 0.4));
      
      // Add subtle shimmer at wave peaks
      float shimmer = abs(sin((dist - progress * speed) * 20.0)) * 0.15 * (1.0 - progress);
      
      vec4 mixedColor = mix(tex1, tex2, mixFactor);
      gl_FragColor = vec4(mixedColor.rgb + shimmer, mixedColor.a);
    }
  `,
};

// Slice Transition Shader
const sliceShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform float progress;
    uniform float slices;
    varying vec2 vUv;

    void main() {
      float slice = floor(vUv.y * slices);
      float sliceProgress = fract(slice / slices);
      
      // Alternate slice directions
      float offset = mod(slice, 2.0) == 0.0 ? progress : 1.0 - progress;
      
      vec2 uv1 = vUv;
      vec2 uv2 = vUv;
      
      // Slide slices
      if (mod(slice, 2.0) == 0.0) {
        uv1.x += (1.0 - progress);
        uv2.x -= progress;
      } else {
        uv1.x -= (1.0 - progress);
        uv2.x += progress;
      }
      
      vec4 tex1 = texture2D(texture1, uv1);
      vec4 tex2 = texture2D(texture2, uv2);
      
      // Determine which texture to show based on progress
      float threshold = sliceProgress;
      float mixFactor = step(threshold, progress);
      
      gl_FragColor = mix(tex1, tex2, mixFactor);
    }
  `,
};

// Enhanced Page Curl Transition Shader with realistic shadows
const curlShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform float progress;
    uniform float curlAmount;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      float curl = progress * 1.6;
      
      // Create curl effect from bottom-right corner
      vec2 corner = vec2(1.0, 0.0);
      vec2 dir = uv - corner;
      float dist = length(dir);
      
      // Calculate curl threshold with smoother curve
      float threshold = curl - dist * curlAmount;
      
      if (threshold > 0.0) {
        // Behind the curl - show texture2
        float curlIntensity = smoothstep(0.0, 0.4, threshold);
        
        // Add realistic shadow with gradient
        vec4 tex2 = texture2D(texture2, uv);
        float shadow = 1.0 - curlIntensity * 0.5;
        shadow = smoothstep(0.5, 1.0, shadow); // Soften shadow edges
        gl_FragColor = tex2 * vec4(shadow, shadow, shadow, 1.0);
      } else if (threshold > -0.15) {
        // The curling edge - show back of texture1 with gradient
        vec2 curlUv = uv;
        curlUv.x = 1.0 - curlUv.x; // Flip horizontally
        
        vec4 tex1 = texture2D(texture1, curlUv);
        float edgePos = (threshold + 0.15) / 0.15;
        float darkening = mix(0.4, 0.7, edgePos); // Gradient on back
        
        // Add slight highlight on the curl edge
        float highlight = smoothstep(0.0, 0.05, threshold + 0.15) * 
                         (1.0 - smoothstep(0.05, 0.15, threshold + 0.15)) * 0.3;
        
        gl_FragColor = tex1 * vec4(darkening + highlight, darkening + highlight, darkening + highlight, 1.0);
      } else {
        // Front side - show texture1
        vec4 tex1 = texture2D(texture1, uv);
        
        // Add slight shadow near the curl
        float shadowDist = abs(threshold);
        float shadow = 1.0 - smoothstep(0.1, 0.3, shadowDist) * 0.2;
        gl_FragColor = tex1 * vec4(shadow, shadow, shadow, 1.0);
      }
    }
  `,
};

// Pixelate Transition Shader
const pixelateShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform float progress;
    uniform float pixelSize;
    varying vec2 vUv;

    void main() {
      // Calculate pixel size based on progress (smaller at start/end)
      float dynamicPixelSize = pixelSize * sin(progress * 3.14159);
      
      // Pixelate the coordinates
      vec2 pixelatedUv = floor(vUv / dynamicPixelSize) * dynamicPixelSize;
      
      vec4 tex1 = texture2D(texture1, pixelatedUv);
      vec4 tex2 = texture2D(texture2, pixelatedUv);
      
      gl_FragColor = mix(tex1, tex2, progress);
    }
  `,
};

export type TransitionType = 'dissolve' | 'ripple' | 'slice' | 'curl' | 'pixelate';

interface ShaderTransitionProps {
  texture1: THREE.Texture;
  texture2: THREE.Texture;
  progress: number;
  transitionType: TransitionType;
}

export default function ShaderTransition({
  texture1,
  texture2,
  progress,
  transitionType,
}: ShaderTransitionProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  // Select shader based on transition type
  const shader = useMemo(() => {
    switch (transitionType) {
      case 'ripple':
        return rippleShader;
      case 'slice':
        return sliceShader;
      case 'curl':
        return curlShader;
      case 'pixelate':
        return pixelateShader;
      case 'dissolve':
      default:
        return dissolveShader;
    }
  }, [transitionType]);

  // Create shader material with uniforms
  const material = useMemo(() => {
    const baseUniforms = {
      texture1: { value: texture1 },
      texture2: { value: texture2 },
      progress: { value: progress },
    };

    const typeSpecificUniforms = {
      dissolve: {
        intensity: { value: 5.0 },
      },
      ripple: {
        center: { value: new THREE.Vector2(0.5, 0.5) },
        amplitude: { value: 0.05 },
        speed: { value: 3.0 },
      },
      slice: {
        slices: { value: 10.0 },
      },
      curl: {
        curlAmount: { value: 1.2 },
      },
      pixelate: {
        pixelSize: { value: 0.02 },
      },
    };

    return new THREE.ShaderMaterial({
      uniforms: {
        ...baseUniforms,
        ...typeSpecificUniforms[transitionType],
      },
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      transparent: true,
    });
  }, [texture1, texture2, transitionType, shader]);

  // Update progress uniform
  useFrame(() => {
    if (meshRef.current && material) {
      material.uniforms.progress.value = progress;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[4, 3]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

