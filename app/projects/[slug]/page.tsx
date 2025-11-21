'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HologramTerminal from '@/components/HologramTerminal';
import HologramTerminalDemo from '@/components/HologramTerminalDemo';
import FeatureShowcase from '@/components/FeatureShowcase';
import TechStackDisplay from '@/components/TechStackDisplay';
import ProjectHighlights from '@/components/ProjectHighlights';
import { projects } from '@/data/projects';
import ReactMarkdown from 'react-markdown';

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    beta: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    complete: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/projects"
              className="text-white/80 hover:text-white hover:underline mb-6 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Projects
            </Link>

            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h1 className="text-5xl font-bold mb-4">{project.name}</h1>
                <p className="text-2xl text-cyan-100 mb-6">{project.tagline}</p>
                <p className="text-lg text-cyan-50 max-w-3xl">{project.shortDescription}</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <span className={`px-4 py-2 text-sm font-semibold rounded-full ${statusColors[project.status]}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                {project.version && (
                  <span className="px-4 py-2 text-sm font-semibold rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                    {project.version}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              {project.links.github && (
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View on GitHub
                </a>
              )}
              {project.links.demo && (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition-colors font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Live Demo
                </a>
              )}
              {project.links.docs && (
                <a
                  href={project.links.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors font-semibold border border-white/30 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Documentation
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
          {/* Holographic Terminal Demo (for CLI projects) */}
          {project.demoCommands && project.demoCommands.length > 0 && (
            <section>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Experience CLI_X in 3D
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-2">
                  Watch the holographic terminal demonstrate CLI_X's intelligent command generation, 
                  safety analysis, and natural language processing in real-time.
                </p>
              </div>

              <HologramTerminal>
                <HologramTerminalDemo commands={project.demoCommands} autoPlay loopDelay={3000} />
              </HologramTerminal>
            </section>
          )}

          {/* Features */}
          {project.features && project.features.length > 0 && (
            <section>
              <FeatureShowcase features={project.features} />
            </section>
          )}

          {/* Highlights/Metrics */}
          {project.highlights && Object.keys(project.highlights).length > 0 && (
            <section>
              <ProjectHighlights highlights={project.highlights} />
            </section>
          )}

          {/* Tech Stack */}
          <section>
            <TechStackDisplay techStack={project.techStack} />
          </section>

          {/* Detailed Description */}
          <section className="max-w-none">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
              About This Project
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <ReactMarkdown>{project.longDescription}</ReactMarkdown>
            </div>
          </section>

          {/* Related Roadmap Items */}
          {project.roadmapItems && project.roadmapItems.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
                What's Next?
              </h2>
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 border-2 border-cyan-200 dark:border-cyan-800">
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 text-center">
                  Check out the roadmap to see planned features and improvements for this project.
                </p>
                <div className="text-center">
                  <Link
                    href="/roadmap"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-semibold"
                  >
                    View Roadmap
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
