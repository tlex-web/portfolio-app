'use client';

import { motion } from 'motion/react';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface TechStackDisplayProps {
  techStack: string[];
  title?: string;
}

export default function TechStackDisplay({ techStack, title = 'Tech Stack' }: TechStackDisplayProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-ink text-center">
        {title}
      </h2>

      <div className="flex flex-wrap gap-3 justify-center">
        {techStack.map((tech, index) => {
          return (
            <motion.div
              key={index}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.05, duration: 0.3 }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.1, y: -5 }}
              className="group relative"
            >
              <div
                className="px-4 py-2 rounded-lg bg-surface-overlay border-2 border-line-strong hover:border-accent transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <span className="font-semibold text-ink text-sm">
                  {tech}
                </span>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-surface text-ink text-xs px-2 py-1 rounded whitespace-nowrap">
                  {tech}
                </div>
                <div className="w-2 h-2 bg-surface rotate-45 absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tech Count */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-overlay border border-line-strong rounded-full">
          <span className="text-accent font-semibold">
            {techStack.length} Technologies
          </span>
          <span className="text-ink-muted">•</span>
          <span className="text-ink">Production Ready</span>
        </div>
      </div>
    </div>
  );
}

