'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Project } from '@/data/types';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-300 dark:border-green-700',
    beta: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    complete: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200 border-gray-300 dark:border-gray-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <Link
        href={`/projects/${project.slug}`}
        className="block h-full group"
        aria-label={`View details for ${project.name}`}
      >
        <div className="relative h-full p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden">
          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {project.name}
                </h3>
                {project.version && (
                  <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700">
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic font-medium">
              {project.tagline}
            </p>

            {/* Description */}
            <p className="text-gray-700 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed">
              {project.shortDescription}
            </p>

            {/* Features Count (if available) */}
            {project.features && project.features.length > 0 && (
              <div className="mb-4 flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400">
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
                  className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg border border-cyan-200 dark:border-cyan-800"
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 4 && (
                <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                  +{project.techStack.length - 4} more
                </span>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-4 text-sm font-semibold">
              {project.links.github && (
                <span className="text-cyan-600 dark:text-cyan-400 group-hover:underline flex items-center gap-1">
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
                className="w-6 h-6 text-cyan-600 dark:text-cyan-400"
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
