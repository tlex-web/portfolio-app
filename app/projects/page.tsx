import ProjectCard from '@/components/ProjectCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { projects } from '@/data/projects';

export default function ProjectsPage() {
  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16 text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Programming Projects
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              A collection of my software development projects, ranging from AI-powered CLI tools to modern web
              applications. Each project showcases innovation, quality, and attention to detail.
            </p>
          </div>

          {featuredProjects.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-4xl">⭐</span>
                Featured Projects
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {featuredProjects.map((project, index) => (
                  <ProjectCard key={project.slug} project={project} index={index} />
                ))}
              </div>
            </div>
          )}

          {otherProjects.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                Other Projects
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
