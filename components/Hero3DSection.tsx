'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import InteractiveHotspot from './InteractiveHotspot';
import { ImageAnnotation } from '@/data/types';

interface HeroAnnotation {
  text: string;
  subtitle?: string;
  startProgress: number;
  endProgress: number;
}

interface Hero3DSectionProps {
  heroImage: {
    src: string;
    alt: string;
    annotations: HeroAnnotation[];
    hotspots?: ImageAnnotation[];
  };
}

// Separate component for annotation to properly use hooks
function AnnotationItem({
  annotation,
  scrollYProgress,
  prefersReducedMotion,
}: {
  annotation: HeroAnnotation;
  scrollYProgress: MotionValue<number>;
  prefersReducedMotion: boolean;
}) {
  const opacity = useTransform(
    scrollYProgress,
    [annotation.startProgress, annotation.endProgress],
    prefersReducedMotion ? [1, 1] : [0, 1]
  );
  const y = useTransform(
    scrollYProgress,
    [annotation.startProgress, annotation.endProgress],
    prefersReducedMotion ? [0, 0] : [50, 0]
  );

  return (
    <motion.div style={{ opacity, y }} className="text-center text-white mb-8">
      <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl">
        {annotation.text}
      </h1>
      {annotation.subtitle && (
        <p className="text-xl md:text-2xl drop-shadow-lg max-w-3xl mx-auto">
          {annotation.subtitle}
        </p>
      )}
    </motion.div>
  );
}

export default function Hero3DSection({ heroImage }: Hero3DSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Track scroll progress from page top
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Transform values based on scroll progress - more dramatic for single screen
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [1, 1] : [1, 1.3]
  );
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ['0%', '0%'] : ['0%', '15%']
  );
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.3, 1], [0.2, 0.4, 0.6]);

  return (
    <div ref={containerRef} className="relative h-screen">
      {/* Full-screen container for the hero */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            scale: imageScale,
            y: imageY,
          }}
        >
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={90}
          />
        </motion.div>

        {/* Interactive Hotspots - Above image layer */}
        {heroImage.hotspots && heroImage.hotspots.length > 0 && (
          <>
            {/* Hint Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
            >
              <div className="bg-cyan-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl border border-cyan-300 flex items-center gap-2">
                <motion.svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </motion.svg>
                <span>Click the glowing icons to explore the Matterhorn</span>
              </div>
            </motion.div>

            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="relative w-full h-full">
                {heroImage.hotspots.map((hotspot) => (
                  <div key={hotspot.id} className="pointer-events-auto">
                    <InteractiveHotspot annotation={hotspot} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Dark overlay that increases with scroll */}
        <motion.div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />

        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
        >
          Skip to content
        </a>

        {/* Text Annotations */}
        <div className="relative z-10 h-full flex items-center justify-center pointer-events-none">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {heroImage.annotations.map((annotation, index) => (
              <AnnotationItem
                key={index}
                annotation={annotation}
                scrollYProgress={scrollYProgress}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.3], [1, 0]),
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
      </div>
    </div>
  );
}

