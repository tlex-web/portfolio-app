'use client';

import { useRef } from 'react';
import ProjectCard from '@/components/ProjectCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { projects } from '@/data/projects';
import { useHexGrid } from '@/lib/useHexGrid';

export default function ProjectsPage() {
  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);

  const featuredGridRef = useRef<HTMLDivElement>(null);
  const otherGridRef = useRef<HTMLDivElement>(null);

  useHexGrid(featuredGridRef, featuredProjects.length);
  useHexGrid(otherGridRef, otherProjects.length);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-alpine-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16 text-center">
            <h1 className="text-5xl font-bold mb-6 text-snow-50 text-shadow-glow-lg">
              Programming Projects
            </h1>
            <p className="text-xl text-snow-200 max-w-3xl mx-auto">
              A collection of my software development projects, ranging from AI-powered CLI tools to modern web
              applications. Each project showcases innovation, quality, and attention to detail.
            </p>
          </div>

          {featuredProjects.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-snow-50 font-heading text-shadow-glow">
                Featured Projects
              </h2>
              <div ref={featuredGridRef} className="hex-grid">
                {featuredProjects.map((project, index) => (
                  <ProjectCard key={project.slug} project={project} index={index} />
                ))}
              </div>
            </div>
          )}

          {otherProjects.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-snow-50 font-heading">
                Other Projects
              </h2>
              <div ref={otherGridRef} className="hex-grid">
                {otherProjects.map((project, index) => (
                  <ProjectCard key={project.slug} project={project} index={index + featuredProjects.length} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
