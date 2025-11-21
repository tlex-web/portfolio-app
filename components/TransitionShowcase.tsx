'use client';

import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTexture, OrbitControls, Environment } from '@react-three/drei';
import ShaderTransition, { TransitionType } from './ShaderTransition';
import { LandscapeImage } from '@/data/types';

interface ShowcaseSceneProps {
  images: [LandscapeImage, LandscapeImage];
  transitionType: TransitionType;
  autoPlay: boolean;
}

interface ShowcaseScenePropsExtended extends ShowcaseSceneProps {
  speed: number;
  easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
}

// Easing functions
const easingFunctions = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
};

function ShowcaseScene({ images, transitionType, autoPlay, speed, easing }: ShowcaseScenePropsExtended) {
  const [rawProgress, setRawProgress] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const textures = useTexture([images[0].src, images[1].src]);
  const [texture1, texture2] = Array.isArray(textures) ? textures : [textures, textures];

  // Apply easing to progress
  const progress = easingFunctions[easing](rawProgress);

  useEffect(() => {
    if (!autoPlay) return;

    // Base speed is 0.002 per frame (much slower)
    // Speed multiplier: 0.5 = half speed, 2 = double speed
    const increment = 0.002 * speed;

    const interval = setInterval(() => {
      setRawProgress((prev) => {
        if (direction === 'forward') {
          if (prev >= 1) {
            // Pause at the end for 1 second before reversing
            setTimeout(() => setDirection('backward'), 1000);
            return 1;
          }
          return Math.min(prev + increment, 1);
        } else {
          if (prev <= 0) {
            // Pause at the start for 1 second before going forward
            setTimeout(() => setDirection('forward'), 1000);
            return 0;
          }
          return Math.max(prev - increment, 0);
        }
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [autoPlay, direction, speed]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <ShaderTransition
        texture1={texture1}
        texture2={texture2}
        progress={progress}
        transitionType={transitionType}
      />
      <Environment preset="sunset" />
    </>
  );
}

interface TransitionShowcaseProps {
  images: LandscapeImage[];
  className?: string;
}

export default function TransitionShowcase({ images, className = '' }: TransitionShowcaseProps) {
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('dissolve');
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentPair, setCurrentPair] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [easing, setEasing] = useState<'linear' | 'easeInOut' | 'easeIn' | 'easeOut'>('easeInOut');

  const transitions: { type: TransitionType; name: string; icon: string; description: string }[] = [
    { type: 'dissolve', name: 'Dissolve', icon: '✨', description: 'Elegant particles with glow effects' },
    { type: 'ripple', name: 'Ripple', icon: '🌊', description: 'Multi-wave water distortion' },
    { type: 'slice', name: 'Slice', icon: '📊', description: 'Dynamic horizontal slices' },
    { type: 'curl', name: 'Page Curl', icon: '📄', description: 'Realistic paper curl with shadows' },
    { type: 'pixelate', name: 'Pixelate', icon: '🎮', description: 'Retro pixel mosaic transition' },
  ];

  if (images.length < 2) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <p className="text-gray-400">Need at least 2 images for transitions</p>
      </div>
    );
  }

  const imagePair: [LandscapeImage, LandscapeImage] = [
    images[currentPair % images.length],
    images[(currentPair + 1) % images.length],
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Shader-Based Transitions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Custom GLSL shaders for stunning image transitions
        </p>
      </div>

      {/* Canvas */}
      <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ height: '500px' }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Suspense fallback={null}>
            <ShowcaseScene
              images={imagePair}
              transitionType={selectedTransition}
              autoPlay={autoPlay}
              speed={speed}
              easing={easing}
            />
          </Suspense>
        </Canvas>

        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="p-3 bg-black/80 backdrop-blur-sm hover:bg-black/90 rounded-full transition-colors"
            aria-label={autoPlay ? 'Pause' : 'Play'}
          >
            {autoPlay ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            onClick={() => setCurrentPair((prev) => (prev + 1) % images.length)}
            className="p-3 bg-black/80 backdrop-blur-sm hover:bg-black/90 rounded-full transition-colors"
            aria-label="Next image pair"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Current Images Indicator */}
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg">
          <p className="text-white text-sm">
            <span className="font-semibold">{imagePair[0].title}</span>
            <span className="mx-2 text-cyan-400">→</span>
            <span className="font-semibold">{imagePair[1].title}</span>
          </p>
        </div>
      </div>

      {/* Speed and Easing Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
        {/* Speed Control */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Transition Speed: {speed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Slow (0.5x)</span>
            <span>Fast (2x)</span>
          </div>
        </div>

        {/* Easing Control */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Easing Function
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['linear', 'easeInOut', 'easeIn', 'easeOut'] as const).map((easingType) => (
              <button
                key={easingType}
                onClick={() => setEasing(easingType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  easing === easingType
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {easingType === 'easeInOut' ? 'Ease In-Out' :
                 easingType === 'easeIn' ? 'Ease In' :
                 easingType === 'easeOut' ? 'Ease Out' : 'Linear'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transition Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {transitions.map((transition) => (
          <button
            key={transition.type}
            onClick={() => setSelectedTransition(transition.type)}
            className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
              selectedTransition === transition.type
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 scale-105'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-cyan-300'
            }`}
          >
            <div className="text-4xl mb-2">{transition.icon}</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              {transition.name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {transition.description}
            </p>
          </button>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border-2 border-cyan-200 dark:border-cyan-800">
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Enhanced Shader Transitions
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          These transitions feature <strong>custom GLSL shaders</strong> with advanced effects including glow, multi-wave ripples, 
          realistic shadows, and smooth easing curves. Each effect runs at 60 FPS on the GPU for cinematic quality.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 bg-white/50 dark:bg-gray-900/50 rounded-full font-medium text-gray-700 dark:text-gray-300">
            🎨 Enhanced Visuals
          </span>
          <span className="px-3 py-1 bg-white/50 dark:bg-gray-900/50 rounded-full font-medium text-gray-700 dark:text-gray-300">
            ⚡ GPU Accelerated
          </span>
          <span className="px-3 py-1 bg-white/50 dark:bg-gray-900/50 rounded-full font-medium text-gray-700 dark:text-gray-300">
            🎬 Cinematic Quality
          </span>
        </div>
      </div>
    </div>
  );
}

