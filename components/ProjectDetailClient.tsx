'use client';

import dynamic from 'next/dynamic';
import { Project } from '@/data/types';

// Lazy load heavy components
const HologramTerminal = dynamic(() => import('@/components/HologramTerminal'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-xl" />,
  ssr: false,
});

const HologramTerminalDemo = dynamic(() => import('@/components/HologramTerminalDemo'), {
  ssr: false,
});

interface ProjectDetailClientProps {
  project: Project;
}

export default function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  return (
    <div className="space-y-20">
      {/* Holographic Terminal Demo (for CLI projects) */}
      {project.demoCommands && project.demoCommands.length > 0 && (
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Experience CLI_X in 3D
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-2">
              Watch the holographic terminal demonstrate CLI_X&apos;s intelligent command generation, 
              safety analysis, and natural language processing in real-time.
            </p>
          </div>

          <HologramTerminal>
            <HologramTerminalDemo commands={project.demoCommands} autoPlay loopDelay={3000} />
          </HologramTerminal>
        </section>
      )}

      {/* Overview */}
      <section className="max-w-none">
        <h2 className="text-2xl font-heading font-semibold text-snow-50 mb-6 text-center">
          Overview
        </h2>
        <div className="bg-alpine-800 rounded-xl p-8 border border-alpine-600">
          {project.longDescription.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-snow-100 leading-relaxed mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
