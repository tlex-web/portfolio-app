'use client';

import { useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Project } from '@/data/types';
import { EASING, DURATION, TILT_CONFIG } from '@/lib/animations';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const statusColors: Record<Project['status'], string> = {
    active: 'bg-pine-500/20 text-pine-400 border-pine-600/30',
    beta: 'bg-ember-500/20 text-ember-400 border-ember-600/30',
    complete: 'bg-frost-500/20 text-frost-400 border-frost-600/30',
    archived: 'bg-granite-400/20 text-granite-300 border-granite-500/30',
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion) return;
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalize cursor position to [-1, 1]
      const normalizedX = (e.clientX - centerX) / (rect.width / 2);
      const normalizedY = (e.clientY - centerY) / (rect.height / 2);

      // RotateY follows X axis (horizontal tilt), rotateX follows Y axis (vertical tilt)
      rotateY.set(normalizedX * TILT_CONFIG.maxRotation);
      rotateX.set(-normalizedY * TILT_CONFIG.maxRotation);
    },
    [prefersReducedMotion, rotateX, rotateY]
  );

  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion) return;
    setIsHovered(false);
    // Geological settle-back easing
    animate(rotateX, 0, { duration: DURATION.settle, ease: EASING.geological });
    animate(rotateY, 0, { duration: DURATION.settle, ease: EASING.geological });
  }, [prefersReducedMotion, rotateX, rotateY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: DURATION.enter,
        ease: EASING.crystallize,
      }}
      viewport={{ once: true }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: TILT_CONFIG.perspective,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="ambient-glow stratum-2 h-full focus-within:ring-2 focus-within:ring-frost-500/50 focus-within:ring-offset-2 focus-within:ring-offset-alpine-900 rounded-lg"
    >
      <Link
        href={`/projects/${project.slug}`}
        className="block h-full group outline-none"
        aria-label={`View details for ${project.name}`}
      >
        <div className="relative h-full p-6 sm:p-8">
          {/* Hex-clipped background layer (decorative only) */}
          <div className="absolute inset-0 hex-clip bg-alpine-800/90 backdrop-blur-sm" aria-hidden="true" />

          {/* Facet reveal overlay on hover */}
          <motion.div
            className="absolute inset-0 hex-clip bg-gradient-to-br from-frost-500/5 via-transparent to-frost-500/8 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: DURATION.hover }}
            aria-hidden="true"
          />

          {/* Content (not clipped) */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-snow-50 mb-2 group-hover:text-frost-400 transition-colors">
                  {project.name}
                </h3>
                {project.version && (
                  <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-frost-500/15 text-frost-400 border border-frost-600/30">
                    {project.version}
                  </span>
                )}
              </div>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[project.status]}`}
              >
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            </div>

            {/* Tagline */}
            <p className="text-sm text-granite-400 mb-4 italic font-medium">
              {project.tagline}
            </p>

            {/* Description */}
            <p className="text-snow-200 mb-6 line-clamp-3 leading-relaxed">
              {project.shortDescription}
            </p>

            {/* Features Count */}
            {project.features && project.features.length > 0 && (
              <div className="mb-4 flex items-center gap-2 text-sm text-frost-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">{project.features.length} Features</span>
              </div>
            )}

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2 mb-6">
              {project.techStack.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 text-xs font-medium bg-frost-500/10 text-frost-400 rounded-lg border border-frost-600/30"
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 4 && (
                <span className="px-3 py-1 text-xs font-medium bg-alpine-700/50 text-granite-400 rounded-lg">
                  +{project.techStack.length - 4} more
                </span>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-4 text-sm font-semibold">
              {project.links.github && (
                <span className="text-frost-400 group-hover:underline flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View Project
                </span>
              )}
            </div>

            {/* Arrow Indicator */}
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-6 h-6 text-frost-400"
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
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
