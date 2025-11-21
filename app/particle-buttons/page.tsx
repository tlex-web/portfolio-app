'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ParticleButton, { ParticleEffect } from '@/components/ParticleButton';
import AnimatedGradientMesh from '@/components/AnimatedGradientMesh';

export default function ParticleButtonsPage() {
  const [clickCount, setClickCount] = useState(0);
  const [selectedEffect, setSelectedEffect] = useState<ParticleEffect>('explosion');

  const effects: { type: ParticleEffect; name: string; icon: string; description: string; color: string }[] = [
    { 
      type: 'explosion', 
      name: 'Explosion', 
      icon: '💥', 
      description: 'Particles burst outward with gravity',
      color: 'from-red-500 to-orange-500'
    },
    { 
      type: 'magnetic', 
      name: 'Magnetic', 
      icon: '🧲', 
      description: 'Particles orbit around click point',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      type: 'sparkle', 
      name: 'Sparkle', 
      icon: '✨', 
      description: 'Twinkling particles rise upward',
      color: 'from-yellow-400 to-orange-400'
    },
    { 
      type: 'confetti', 
      name: 'Confetti', 
      icon: '🎉', 
      description: 'Colorful celebration particles',
      color: 'from-pink-500 to-purple-500'
    },
    { 
      type: 'ripple', 
      name: 'Ripple', 
      icon: '🌊', 
      description: 'Circular wave expansion',
      color: 'from-cyan-500 to-blue-500'
    },
    { 
      type: 'trail', 
      name: 'Trail', 
      icon: '🎨', 
      description: 'Cursor trail on hover',
      color: 'from-pink-600 to-red-600'
    },
  ];

  return (
    <>
      <Header />
      
      {/* Background Mesh */}
      <AnimatedGradientMesh
        colorScheme="cyberpunk"
        intensity={0.8}
        speed={0.3}
        blur={true}
        opacity={0.4}
      />

      <div className="min-h-screen relative">
        {/* Hero Section */}
        <div className="relative py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-6xl font-bold mb-6 text-gray-900 dark:text-white drop-shadow-lg">
              Interactive Particle Buttons
            </h1>
            <p className="text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-4">
              Engage users with stunning particle effects on every interaction
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              6 unique particle effects powered by Framer Motion and React
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Effect Selector */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
              Choose Your Effect
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {effects.map((effect) => (
                <button
                  key={effect.type}
                  onClick={() => setSelectedEffect(effect.type)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 backdrop-blur-md ${
                    selectedEffect === effect.type
                      ? 'border-white bg-white/40 dark:border-gray-700 dark:bg-gray-800/60 scale-105 shadow-2xl'
                      : 'border-white/30 bg-white/20 dark:border-gray-700/30 dark:bg-gray-800/30 hover:bg-white/30 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <div className="text-5xl mb-3">{effect.icon}</div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                    {effect.name}
                  </h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {effect.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
              Try It Out!
            </h2>
            <div className="bg-white/30 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-16 border-2 border-white/30 dark:border-gray-700/30 shadow-2xl">
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-8">
                <ParticleButton
                  effect={selectedEffect}
                  particleCount={selectedEffect === 'ripple' ? 12 : selectedEffect === 'trail' ? 0 : 25}
                  onClick={() => setClickCount((prev) => prev + 1)}
                  className={`px-12 py-6 bg-gradient-to-r ${
                    effects.find((e) => e.type === selectedEffect)?.color
                  } text-white rounded-2xl font-bold text-2xl shadow-2xl hover:scale-105 transition-transform`}
                >
                  Click Me! 🎉
                </ParticleButton>

                <div className="text-center">
                  <p className="text-gray-700 dark:text-gray-300 text-lg mb-2">
                    Current Effect: <strong className="text-gray-900 dark:text-white">{selectedEffect}</strong>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Clicks: <strong className="text-2xl text-cyan-600 dark:text-cyan-400">{clickCount}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* All Effects Showcase */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
              All Effects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {effects.map((effect) => (
                <div
                  key={effect.type}
                  className="bg-white/30 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border-2 border-white/30 dark:border-gray-700/30 shadow-lg"
                >
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-3">{effect.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {effect.name}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                      {effect.description}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <ParticleButton
                      effect={effect.type}
                      particleCount={effect.type === 'ripple' ? 12 : effect.type === 'trail' ? 0 : 20}
                      className={`px-8 py-4 bg-gradient-to-r ${effect.color} text-white rounded-xl font-bold shadow-xl hover:scale-105 transition-transform`}
                    >
                      Try {effect.name}
                    </ParticleButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Button Sizes Demo */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
              Different Sizes
            </h2>
            <div className="bg-white/30 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-12 border-2 border-white/30 dark:border-gray-700/30 shadow-lg">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <ParticleButton
                  effect="sparkle"
                  particleCount={10}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium text-sm shadow-lg hover:scale-105 transition-transform"
                >
                  Small
                </ParticleButton>

                <ParticleButton
                  effect="explosion"
                  particleCount={15}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-base shadow-lg hover:scale-105 transition-transform"
                >
                  Medium
                </ParticleButton>

                <ParticleButton
                  effect="confetti"
                  particleCount={25}
                  className="px-10 py-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 transition-transform"
                >
                  Large 🎉
                </ParticleButton>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
              Perfect For
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🎯', title: 'CTAs', desc: 'Call-to-action buttons', effect: 'explosion' },
                { icon: '🎮', title: 'Games', desc: 'Interactive elements', effect: 'confetti' },
                { icon: '📧', title: 'Forms', desc: 'Submit buttons', effect: 'sparkle' },
                { icon: '🛍️', title: 'E-commerce', desc: 'Add to cart', effect: 'magnetic' },
              ].map((useCase, idx) => (
                <div
                  key={idx}
                  className="bg-white/30 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl p-6 border-2 border-white/30 dark:border-gray-700/30 shadow-lg text-center"
                >
                  <div className="text-5xl mb-4">{useCase.icon}</div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {useCase.desc}
                  </p>
                  <ParticleButton
                    effect={useCase.effect as ParticleEffect}
                    particleCount={15}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium text-sm shadow-lg hover:scale-105 transition-transform"
                  >
                    Try It
                  </ParticleButton>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/30 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl p-6 border-2 border-white/30 dark:border-gray-700/30 shadow-lg">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                60 FPS Smooth
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                RequestAnimationFrame for butter-smooth particle animations
              </p>
            </div>

            <div className="bg-white/30 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl p-6 border-2 border-white/30 dark:border-gray-700/30 shadow-lg">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                Fully Accessible
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Respects prefers-reduced-motion and keyboard navigation
              </p>
            </div>

            <div className="bg-white/30 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl p-6 border-2 border-white/30 dark:border-gray-700/30 shadow-lg">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                Customizable
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Control particle count, colors, effects, and animations
              </p>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/40 dark:bg-gray-800/50 backdrop-blur-md hover:bg-white/50 dark:hover:bg-gray-800/60 rounded-xl transition-all font-bold text-lg shadow-lg border border-white/30 dark:border-gray-700/30 text-gray-900 dark:text-white"
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

