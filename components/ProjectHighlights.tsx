'use client';

import { motion } from 'framer-motion';

interface ProjectHighlightsProps {
  highlights: Record<string, any>;
  title?: string;
}

export default function ProjectHighlights({ highlights, title = 'Project Highlights' }: ProjectHighlightsProps) {
  const renderValue = (value: any): React.ReactNode => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{String(value)}</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <ul className="space-y-1 mt-2">
          {value.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-500 mt-1">•</span>
              <span>{renderValue(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {subKey.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-sm">{renderValue(subValue)}</div>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
        {title}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(highlights).map(([key, value], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="group"
          >
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-all duration-300 shadow-sm hover:shadow-xl h-full">
              {/* Section Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-xl">
                    {key === 'performance' && '⚡'}
                    {key === 'testing' && '✓'}
                    {key === 'safety' && '🛡️'}
                    {key === 'features' && '✨'}
                    {key === 'pricingTiers' && '💰'}
                    {key === 'security' && '🔐'}
                    {key === 'techStack' && '🛠️'}
                    {!['performance', 'testing', 'safety', 'features', 'pricingTiers', 'security', 'techStack'].includes(key) && '📊'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
              </div>

              {/* Section Content */}
              <div className="text-gray-700 dark:text-gray-300">
                {renderValue(value)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

