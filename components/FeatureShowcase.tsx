'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface Feature {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface FeatureShowcaseProps {
  features: string[];
  title?: string;
}

const iconMap: Record<string, { icon: string; color: string }> = {
  'natural language': { icon: '💬', color: 'from-blue-500 to-cyan-500' },
  intelligence: { icon: '🧠', color: 'from-purple-500 to-pink-500' },
  safety: { icon: '🛡️', color: 'from-green-500 to-emerald-500' },
  provider: { icon: '🔌', color: 'from-orange-500 to-red-500' },
  'cross-platform': { icon: '🖥️', color: 'from-indigo-500 to-blue-500' },
  conversation: { icon: '💭', color: 'from-cyan-500 to-teal-500' },
  workflow: { icon: '🔄', color: 'from-pink-500 to-rose-500' },
  template: { icon: '📋', color: 'from-yellow-500 to-orange-500' },
  ollama: { icon: '🦙', color: 'from-green-500 to-lime-500' },
  analytics: { icon: '📊', color: 'from-purple-500 to-indigo-500' },
  caching: { icon: '⚡', color: 'from-yellow-500 to-amber-500' },
  audit: { icon: '📝', color: 'from-gray-500 to-slate-500' },
  subscription: { icon: '💳', color: 'from-green-500 to-emerald-500' },
  license: { icon: '🔐', color: 'from-blue-500 to-indigo-500' },
  binary: { icon: '📦', color: 'from-orange-500 to-red-500' },
  authentication: { icon: '👤', color: 'from-purple-500 to-pink-500' },
  playground: { icon: '🎮', color: 'from-cyan-500 to-blue-500' },
  responsive: { icon: '📱', color: 'from-pink-500 to-rose-500' },
};

function getFeatureIcon(feature: string): { icon: string; color: string } {
  const lowerFeature = feature.toLowerCase();
  
  for (const [key, value] of Object.entries(iconMap)) {
    if (lowerFeature.includes(key)) {
      return value;
    }
  }
  
  return { icon: '✨', color: 'from-gray-500 to-gray-600' };
}

export default function FeatureShowcase({ features, title = 'Key Features' }: FeatureShowcaseProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const { icon, color } = getFeatureIcon(feature);
          const isHovered = hoveredIndex === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative group"
            >
              <div
                className={`relative h-full p-6 rounded-xl border-2 transition-all duration-300 ${
                  isHovered
                    ? 'border-cyan-500 bg-white dark:bg-gray-800 shadow-xl scale-105'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                }`}
              >
                {/* Icon */}
                <div className="mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-lg`}
                  >
                    {icon}
                  </div>
                </div>

                {/* Feature Text */}
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feature}
                </div>

                {/* Hover Indicator */}
                {isHovered && (
                  <motion.div
                    layoutId="feature-hover"
                    className="absolute inset-0 border-2 border-cyan-500 rounded-xl pointer-events-none"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Count */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
          <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
            {features.length} Features
          </span>
          <span className="text-gray-500 dark:text-gray-400">•</span>
          <span className="text-gray-600 dark:text-gray-300">Fully Implemented</span>
        </div>
      </div>
    </div>
  );
}

