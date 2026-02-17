'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { EASING, DURATION } from '@/lib/animations';
import { useReducedMotion } from '@/lib/useReducedMotion';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Photos', href: '/photos' },
    { name: 'Projects', href: '/projects' },
    { name: 'Roadmap', href: '/roadmap' },
    { name: 'Contact', href: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={prefersReducedMotion ? false : { y: -100 }}
      animate={{ y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: DURATION.enter, ease: [...EASING.geological] }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-alpine-900/80 backdrop-blur-xl shadow-lg'
          : 'bg-alpine-900/60 backdrop-blur-md shadow-md'
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo/Brand with Gradient */}
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            className="flex-shrink-0"
          >
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-1.5 group"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-frost-500 to-frost-600 flex items-center justify-center shadow-lg group-hover:shadow-frost-500/50 transition-shadow">
                <span className="text-white text-xl sm:text-2xl font-bold">P</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-frost-400">
                ortfolio
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-2">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1, ease: [...EASING.crystallize] }}
                >
                  <Link
                    href={item.href}
                    className={`relative px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-frost-500/20 text-snow-50 glow-frost'
                        : 'text-snow-200 hover:bg-alpine-700/50 hover:scale-105'
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-frost-500/30 rounded-lg -z-10"
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: DURATION.enter, ease: [...EASING.geological] }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-snow-200 hover:bg-alpine-700/50 transition-all"
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
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: DURATION.hover, ease: [...EASING.geological] }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {navigation.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1, ease: [...EASING.crystallize] }}
                    >
                      <Link
                        href={item.href}
                        className={`block px-4 py-3 rounded-lg text-lg font-medium transition-all ${
                          isActive
                            ? 'bg-frost-500/20 text-snow-50 shadow-lg'
                            : 'text-snow-200 hover:bg-alpine-700/50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Gradient Border Bottom */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-frost-500 to-transparent opacity-50" />
    </motion.header>
  );
}
