'use client';

import Hero3DMountain from '@/components/Hero3DMountain';
import Link from 'next/link';
import { motion } from 'motion/react';
import { landscapes } from '@/data/landscapes';
import { projects } from '@/data/projects';
import Image from 'next/image';
import { Camera, CheckCircle, Code, Path } from '@phosphor-icons/react/dist/ssr';
import { EASING, DURATION } from '@/lib/animations';
import { useReducedMotion } from '@/lib/useReducedMotion';

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();

  const stats = [
    { value: landscapes.length, label: 'Landscape Photos', Icon: Camera },
    { value: projects.length, label: 'Active Projects', Icon: Code },
    { value: '850+', label: 'Tests Passing', Icon: CheckCircle },
    { value: '20%', label: 'Roadmap Complete', Icon: Path },
  ];

  return (
    <>
      {/* Full-Screen 3D Mountain Hero */}
      <Hero3DMountain />

      {/* Main Content */}
      <div id="home-content" className="bg-surface">
        {/* Stats Section */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: DURATION.enter, ease: [...EASING.geological] }}
          viewport={{ once: true }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.08, duration: DURATION.enter, ease: [...EASING.crystallize] }}
                viewport={{ once: true }}
                className="stratum-1 glow-frost bg-surface-raised rounded-2xl p-6 text-center border border-surface-overlay hover:border-accent transition-all duration-300 hover:scale-105"
              >
                <div className="mb-2 flex justify-center">
                  <stat.Icon size={20} aria-hidden="true" />
                </div>
                <div className="text-3xl font-bold text-accent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-ink-muted">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured Sections */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.h2
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: DURATION.enter, ease: [...EASING.geological] }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12 text-ink"
          >
            Explore My Work
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Photography Section */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: DURATION.enter, ease: [...EASING.geological] }}
              viewport={{ once: true }}
            >
              <Link
                href="/photos"
                className="group block relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-[400px]"
              >
                <div className="absolute inset-0">
                  <Image
                    src={landscapes[0].src}
                    alt={landscapes[0].alt}
                    fill
                    sizes="100vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
                <div className="relative h-full flex flex-col justify-end p-8 text-white">
                  <svg
                    className="w-16 h-16 mb-4 opacity-80 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="text-3xl font-bold mb-2">Landscape Photography</h3>
                  <p className="text-ink-muted mb-4">
                    Explore {landscapes.length} stunning landscapes from the Swiss Alps with interactive hotspots
                  </p>
                  <span className="inline-flex items-center gap-2 text-accent font-semibold group-hover:gap-4 transition-all">
                    View Gallery
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Projects Section */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: DURATION.enter, ease: [...EASING.geological] }}
              viewport={{ once: true }}
            >
              <Link
                href="/projects"
                className="group block relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-[400px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent-strong via-surface-overlay to-accent group-hover:scale-105 transition-transform duration-300" />
                <div className="relative h-full flex flex-col justify-end p-8 text-white">
                  <svg
                    className="w-16 h-16 mb-4 opacity-80 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  <h3 className="text-3xl font-bold mb-2">Programming Projects</h3>
                  <p className="text-ink-muted mb-4">
                    Discover {projects.length} innovative software solutions including AI-powered CLI tools
                  </p>
                  <span className="inline-flex items-center gap-2 text-accent font-semibold group-hover:gap-4 transition-all">
                    View Projects
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* About Section */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: DURATION.enter, ease: [...EASING.geological] }}
          viewport={{ once: true }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
        >
          <div className="max-w-4xl mx-auto">
            <div className="stratum-2 bg-surface-raised rounded-3xl p-12 border border-surface-overlay">
              <h2 className="text-4xl font-bold mb-6 text-center text-accent">
                Blending Art and Technology
              </h2>
              <div className="space-y-4 text-lg text-ink-muted leading-relaxed">
                <p>
                  I&apos;m passionate about capturing the world&apos;s natural beauty through landscape photography
                  while also building elegant software solutions that solve real problems.
                </p>
                <p>
                  My photography focuses on the Swiss Alps, particularly the iconic Matterhorn, where I explore
                  the interplay of light, weather, and mountain landscapes. Each image tells a story of adventure
                  and natural wonder.
                </p>
                <p>
                  On the technology side, I develop CLI_X — an AI-powered command-line tool that converts natural
                  language into shell commands. Built with Rust and featuring enterprise-grade safety, it&apos;s helping
                  developers work more efficiently.
                </p>
              </div>

              {/* Skills */}
              <div className="mt-8 pt-8 border-t border-surface-overlay">
                <h3 className="text-xl font-bold mb-4 text-ink">Core Skills</h3>
                <div className="flex flex-wrap gap-3">
                  {['Photography', 'Rust', 'TypeScript', 'Next.js', 'React', 'AI/LLM Integration', 'UI/UX Design', 'Alpine Exploration'].map((skill) => (
                    <span
                      key={skill}
                      className="px-4 py-2 bg-accent/10 text-accent rounded-lg border border-accent-strong/30 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: DURATION.enter, ease: [...EASING.geological] }}
          viewport={{ once: true }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
        >
          <div className="stratum-2 bg-gradient-to-r from-accent-strong to-accent rounded-3xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-4xl font-bold mb-4">Let&apos;s Work Together</h2>
            <p className="text-xl text-ink-muted mb-8 max-w-2xl mx-auto">
              Interested in collaboration, licensing my photos, or discussing technology projects? I&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-ink text-ink-inverse rounded-xl hover:bg-ink transition-colors font-bold text-lg shadow-lg hover:shadow-xl"
              >
                Get in Touch
              </Link>
              <Link
                href="/roadmap"
                className="px-8 py-4 bg-surface-raised/30 backdrop-blur-sm border-2 border-accent/30 text-ink rounded-xl hover:bg-surface-overlay/40 transition-colors font-bold text-lg"
              >
                View Roadmap
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

    </>
  );
}
