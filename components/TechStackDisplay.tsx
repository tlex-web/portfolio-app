'use client';

import { motion } from 'framer-motion';

interface TechStackDisplayProps {
  techStack: string[];
  title?: string;
}

const techLogos: Record<string, { color: string; bg: string }> = {
  rust: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  tokio: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'openai': { color: 'text-green-500', bg: 'bg-green-500/10' },
  'gpt-4': { color: 'text-green-500', bg: 'bg-green-500/10' },
  anthropic: { color: 'text-purple-500', bg: 'bg-purple-500/10' },
  claude: { color: 'text-purple-500', bg: 'bg-purple-500/10' },
  groq: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  llama: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ollama: { color: 'text-green-500', bg: 'bg-green-500/10' },
  sqlite: { color: 'text-blue-400', bg: 'bg-blue-400/10' },
  docker: { color: 'text-blue-600', bg: 'bg-blue-600/10' },
  'next.js': { color: 'text-gray-900 dark:text-white', bg: 'bg-gray-900/10 dark:bg-white/10' },
  typescript: { color: 'text-blue-600', bg: 'bg-blue-600/10' },
  react: { color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  tailwind: { color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  'tailwind css': { color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  postgresql: { color: 'text-blue-700', bg: 'bg-blue-700/10' },
  prisma: { color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
  nextauth: { color: 'text-purple-600', bg: 'bg-purple-600/10' },
  stripe: { color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
  vercel: { color: 'text-gray-900 dark:text-white', bg: 'bg-gray-900/10 dark:bg-white/10' },
  node: { color: 'text-green-600', bg: 'bg-green-600/10' },
  python: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  zod: { color: 'text-blue-600', bg: 'bg-blue-600/10' },
  clap: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  serde: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'shadcn/ui': { color: 'text-gray-900 dark:text-white', bg: 'bg-gray-900/10 dark:bg-white/10' },
  'react hook form': { color: 'text-pink-500', bg: 'bg-pink-500/10' },
};

function getTechStyle(tech: string): { color: string; bg: string } {
  const lowerTech = tech.toLowerCase();
  
  for (const [key, value] of Object.entries(techLogos)) {
    if (lowerTech.includes(key)) {
      return value;
    }
  }
  
  // Default style
  return { color: 'text-gray-600 dark:text-gray-300', bg: 'bg-gray-500/10' };
}

export default function TechStackDisplay({ techStack, title = 'Tech Stack' }: TechStackDisplayProps) {
  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
        {title}
      </h2>

      <div className="flex flex-wrap gap-3 justify-center">
        {techStack.map((tech, index) => {
          const style = getTechStyle(tech);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className="group relative"
            >
              <div
                className={`px-4 py-2 rounded-lg ${style.bg} border-2 border-transparent hover:border-cyan-500 transition-all duration-300 shadow-sm hover:shadow-lg`}
              >
                <span className={`font-semibold ${style.color} text-sm`}>
                  {tech}
                </span>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {tech}
                </div>
                <div className="w-2 h-2 bg-gray-900 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tech Count */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full">
          <span className="text-purple-600 dark:text-purple-400 font-semibold">
            {techStack.length} Technologies
          </span>
          <span className="text-gray-500 dark:text-gray-400">•</span>
          <span className="text-gray-600 dark:text-gray-300">Production Ready</span>
        </div>
      </div>
    </div>
  );
}

