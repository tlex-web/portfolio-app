'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from 'framer-motion';
import { EASING, DURATION } from '@/lib/animations';
import { useReducedMotion } from '@/lib/useReducedMotion';
import ContourBackground from './ContourBackground';

export default function GlassmorphismNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Photos', href: '/photos' },
    { name: 'Projects', href: '/projects' },
    { name: 'Roadmap', href: '/roadmap' },
    { name: 'Contact', href: '/contact' },
  ];

  // Scroll-progressive glass effect
  const { scrollY } = useScroll();
  const scrollProgress = useTransform(scrollY, [0, 150], [0, 1]);

  // Derive visual properties from scroll progress
  const bgOpacity = useTransform(scrollProgress, [0, 1], [0, 0.85]);
  const blurValue = useTransform(scrollProgress, [0, 1], [0, 16]);
  const contourOpacity = useTransform(scrollProgress, [0, 1], [0, 0.6]);

  // Track motion values as state for inline styles
  const [bgOpacityVal, setBgOpacityVal] = useState(0);
  const [blurVal, setBlurVal] = useState(0);
  const [contourOpacityVal, setContourOpacityVal] = useState(0);

  useMotionValueEvent(bgOpacity, 'change', (latest) => {
    if (!prefersReducedMotion) setBgOpacityVal(latest);
  });

  useMotionValueEvent(blurValue, 'change', (latest) => {
    if (!prefersReducedMotion) setBlurVal(latest);
  });

  useMotionValueEvent(contourOpacity, 'change', (latest) => {
    if (!prefersReducedMotion) setContourOpacityVal(latest);
  });

  // Reduced motion: show scrolled state immediately
  useEffect(() => {
    if (prefersReducedMotion) {
      setBgOpacityVal(0.85);
      setBlurVal(16);
      setContourOpacityVal(0.6);
    }
  }, [prefersReducedMotion]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Desktop & Mobile Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: `oklch(0.13 0.015 155 / ${bgOpacityVal})`,
          backdropFilter: `blur(${blurVal}px)`,
          WebkitBackdropFilter: `blur(${blurVal}px)`,
        }}
      >
        {/* Contour background behind nav content */}
        <div className="absolute inset-0 overflow-hidden">
          <ContourBackground opacity={contourOpacityVal} />
        </div>

        {/* Nav content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo/Brand */}
            <Link
              href="/"
              className="flex-shrink-0 flex items-center gap-1 sm:gap-1.5 group"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-frost-500 to-frost-600 flex items-center justify-center shadow-lg shadow-frost-500/50 group-hover:shadow-frost-500/70 transition-all group-hover:scale-105">
                <span className="text-snow-50 text-xl sm:text-2xl font-bold">P</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-snow-50 drop-shadow-lg group-hover:scale-105 transition-transform">
                ortfolio
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:space-x-1 lg:space-x-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
                      isActive
                        ? 'text-snow-50'
                        : 'text-snow-200 hover:bg-alpine-700/50 hover:text-snow-50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute inset-0 rounded-lg bg-frost-500/20 glow-frost"
                        transition={{
                          type: 'tween',
                          duration: DURATION.hover,
                          ease: [...EASING.geological],
                        }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 min-w-[44px] min-h-[44px] rounded-lg text-snow-100 hover:bg-alpine-700/50 focus:outline-none focus:ring-2 focus:ring-frost-500/30 transition-all"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation Full-Screen Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: DURATION.enter,
              ease: [...EASING.geological],
            }}
          >
            {/* Full-screen backdrop */}
            <div
              className="absolute inset-0 bg-alpine-950/95 backdrop-blur-xl"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Contour background for mobile overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <ContourBackground opacity={0.4} />
            </div>

            {/* Close button */}
            <div className="relative flex justify-end p-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 min-w-[48px] min-h-[48px] rounded-lg text-snow-100 hover:bg-alpine-700/50 transition-all"
                aria-label="Close menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation Links - centered vertically */}
            <nav className="relative flex flex-col items-center justify-center h-[calc(100%-80px)] space-y-2 px-4">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: DURATION.enter,
                      delay: prefersReducedMotion ? 0 : index * 0.05,
                      ease: [...EASING.crystallize],
                    }}
                    className="w-full max-w-sm"
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center justify-center min-h-[56px] px-6 rounded-lg text-2xl font-heading font-medium transition-colors ${
                        isActive
                          ? 'text-snow-50 bg-frost-500/20 glow-frost'
                          : 'text-snow-200 hover:bg-frost-500/10 hover:text-snow-50'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
