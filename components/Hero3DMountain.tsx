'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import MountainTerrain3D from './MountainTerrain3D';
import DualParticleSystem from './DualParticleSystem';
import GlassmorphismNav from './GlassmorphismNav';
import ParticleButton from './ParticleButton';

export default function Hero3DMountain() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Text animations based on scroll
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const titleY = useTransform(
    scrollYProgress,
    [0, 0.3],
    prefersReducedMotion ? [0, 0] : [0, -50]
  );

  const subtitleOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const subtitleY = useTransform(
    scrollYProgress,
    [0, 0.4],
    prefersReducedMotion ? [0, 0] : [0, -30]
  );

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-black">
      {/* Navigation */}
      <GlassmorphismNav />

      {/* 3D Mountain Background */}
      <div className="absolute inset-0">
        <MountainTerrain3D />
      </div>

      {/* Dual Particle System Overlay */}
      <DualParticleSystem className="z-[5]" />

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main Title */}
          <motion.div
            style={{ opacity: titleOpacity, y: titleY }}
            className="mb-8"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 drop-shadow-2xl"
            >
              Welcome to My Portfolio
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-white font-semibold text-lg shadow-2xl"
            >
              Photography × Technology
            </motion.div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            style={{ opacity: subtitleOpacity, y: subtitleY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto drop-shadow-lg"
          >
            Capturing the majesty of the Matterhorn and crafting elegant software solutions
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <ParticleButton
              effect="trail"
              particleCount={0}
              href="#main-content"
              className="group px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-cyan-500/50 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                Explore My Work
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </ParticleButton>

            <ParticleButton
              effect="sparkle"
              particleCount={20}
              href="/contact"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-white/50 hover:scale-105"
            >
              Get in Touch
            </ParticleButton>
          </motion.div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-white/80"
          >
            {[
              { icon: '📸', text: '4 Landscape Photos' },
              { icon: '💻', text: '2 Active Projects' },
              { icon: '✓', text: '850+ Tests Passing' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.2 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        style={{
          opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]),
        }}
      >
        <div className="flex flex-col items-center text-white">
          <span className="text-sm mb-2 drop-shadow-lg">Scroll to explore</span>
          <motion.div
            animate={prefersReducedMotion ? {} : { y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg
              className="w-6 h-6 drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
      >
        Skip to content
      </a>
    </div>
  );
}

