'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimatedGradientMesh, { ColorScheme } from '@/components/AnimatedGradientMesh';

export default function GradientMeshPage() {
  const [selectedScheme, setSelectedScheme] = useState<ColorScheme>('ocean');
  const [intensity, setIntensity] = useState(1.0);
  const [speed, setSpeed] = useState(0.5);
  const [blur, setBlur] = useState(true);
  const [opacity, setOpacity] = useState(0.5);

  const schemes: { name: ColorScheme; label: string; description: string; icon: string }[] = [
    { name: 'ocean', label: 'Ocean', description: 'Deep blues and teals', icon: '🌊' },
    { name: 'sunset', label: 'Sunset', description: 'Warm oranges and pinks', icon: '🌅' },
    { name: 'forest', label: 'Forest', description: 'Rich greens and emeralds', icon: '🌲' },
    { name: 'lavender', label: 'Lavender', description: 'Purple and pink tones', icon: '💜' },
    { name: 'fire', label: 'Fire', description: 'Hot reds and golds', icon: '🔥' },
    { name: 'cyberpunk', label: 'Cyberpunk', description: 'Neon cyan and magenta', icon: '🤖' },
    { name: 'monochrome', label: 'Monochrome', description: 'Grayscale elegance', icon: '⚫' },
    { name: 'aurora', label: 'Aurora', description: 'Northern lights palette', icon: '✨' },
  ];

  return (
    <>
      <Header />
      
      {/* Background Mesh */}
      <AnimatedGradientMesh
        colorScheme={selectedScheme}
        intensity={intensity}
        speed={speed}
        blur={blur}
        opacity={opacity}
      />

      <div className="min-h-screen relative">
        {/* Hero Section */}
        <div className="relative py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-6xl font-bold mb-6 text-gray-900 dark:text-white drop-shadow-lg">
              Animated Gradient Mesh
            </h1>
            <p className="text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-4">
              Dynamic, flowing gradients powered by WebGL and custom GLSL shaders
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Real-time mesh distortion with simplex noise for organic, premium aesthetics
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Color Scheme Selector */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
              Choose Your Palette
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {schemes.map((scheme) => (
                <button
                  key={scheme.name}
                  onClick={() => setSelectedScheme(scheme.name)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left backdrop-blur-md ${
                    selectedScheme === scheme.name
                      ? 'border-white bg-white/30 dark:border-gray-700 dark:bg-gray-800/50 scale-105 shadow-2xl'
                      : 'border-white/30 bg-white/10 dark:border-gray-700/30 dark:bg-gray-800/20 hover:bg-white/20 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className="text-5xl mb-3">{scheme.icon}</div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    {scheme.label}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {scheme.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Intensity Control */}
            <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-8 border border-white/30 dark:border-gray-700/30">
              <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                Distortion Intensity: {intensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span>Subtle (0)</span>
                <span>Extreme (2)</span>
              </div>
            </div>

            {/* Speed Control */}
            <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-8 border border-white/30 dark:border-gray-700/30">
              <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                Animation Speed: {speed.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span>Static (0)</span>
                <span>Fast (2)</span>
              </div>
            </div>

            {/* Opacity Control */}
            <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-8 border border-white/30 dark:border-gray-700/30">
              <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                Opacity: {opacity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span>Subtle (0.1)</span>
                <span>Solid (1)</span>
              </div>
            </div>

            {/* Blur Toggle */}
            <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-8 border border-white/30 dark:border-gray-700/30">
              <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
                Blur Effect
              </label>
              <button
                onClick={() => setBlur(!blur)}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                  blur
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {blur ? '✓ Enabled (Soft)' : '✗ Disabled (Sharp)'}
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                {blur ? 'Smooth, dreamy appearance' : 'Crisp, defined shapes'}
              </p>
            </div>
          </div>

          {/* Technical Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-xl p-6 border border-white/30 dark:border-gray-700/30">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                WebGL Powered
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                GPU-accelerated rendering with Three.js for smooth 60 FPS performance
              </p>
            </div>

            <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-xl p-6 border border-white/30 dark:border-gray-700/30">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                Custom Shaders
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Hand-crafted GLSL with simplex noise for organic distortion patterns
              </p>
            </div>

            <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-xl p-6 border border-white/30 dark:border-gray-700/30">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                Fully Accessible
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Respects prefers-reduced-motion for users sensitive to animation
              </p>
            </div>
          </div>

          {/* Use Cases */}
          <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-8 border border-white/30 dark:border-gray-700/30 mb-16">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white text-center">
              Perfect For
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🏠', title: 'Hero Sections', desc: 'Eye-catching backgrounds' },
                { icon: '📧', title: 'Contact Forms', desc: 'Welcoming atmospheres' },
                { icon: '🎯', title: 'Call-to-Actions', desc: 'Draw user attention' },
                { icon: '💼', title: 'Landing Pages', desc: 'Premium first impressions' },
              ].map((useCase, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-5xl mb-3">{useCase.icon}</div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {useCase.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/30 dark:bg-gray-800/40 backdrop-blur-md hover:bg-white/40 dark:hover:bg-gray-800/50 rounded-xl transition-all font-bold text-lg shadow-lg border border-white/30 dark:border-gray-700/30 text-gray-900 dark:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}

