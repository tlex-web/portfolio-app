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

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-32 rounded" />,
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

      {/* Detailed Description with ReactMarkdown */}
      <section className="max-w-none">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
          About This Project
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <ReactMarkdown>{project.longDescription}</ReactMarkdown>
        </div>
      </section>
    </div>
  );
}
