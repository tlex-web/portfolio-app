'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageAnnotation } from '@/data/types';

interface InteractiveHotspotProps {
  annotation: ImageAnnotation;
  onHover?: (id: string | null) => void;
}

const iconMap = {
  mountain: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z" />
    </svg>
  ),
  water: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  glacier: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
  trail: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
    </svg>
  ),
  lake: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    </svg>
  ),
  peak: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
    </svg>
  ),
};

export default function InteractiveHotspot({ annotation, onHover }: InteractiveHotspotProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`absolute ${isOpen ? 'z-[100000]' : 'z-10'}`}
      style={{ left: `${annotation.position.x}%`, top: `${annotation.position.y}%` }}
    >
      {/* Hotspot Button */}
      <motion.button
        className="relative group"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => onHover?.(annotation.id)}
        onMouseLeave={() => onHover?.(null)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`View ${annotation.title}`}
      >
        {/* Pulse Ring Animation */}
        <motion.div
          className="absolute inset-0 rounded-full bg-cyan-400/50"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Icon Circle */}
        <div className="relative w-12 h-12 rounded-full bg-cyan-500/80 backdrop-blur-md border-2 border-white/60 flex items-center justify-center text-white shadow-2xl group-hover:bg-cyan-400/90 group-hover:scale-110 transition-all">
          {iconMap[annotation.icon]}
        </div>

        {/* Quick Label */}
        <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40">
          <div className="bg-cyan-600 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-2xl border border-cyan-400">
            {annotation.title}
            <div className="text-xs text-cyan-100 mt-0.5">Click to learn more</div>
          </div>
        </div>
      </motion.button>

      {/* Detailed Info Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
              style={{ zIndex: 99998 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4"
              style={{ zIndex: 99999 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white">
                      {iconMap[annotation.icon]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {annotation.title}
                      </h3>
                      {annotation.details?.elevation && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {annotation.details.elevation}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Description */}
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {annotation.description}
                </p>

                {/* Details Grid */}
                {annotation.details && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {annotation.details.temperature && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Temperature
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {annotation.details.temperature}
                        </p>
                      </div>
                    )}
                    {annotation.details.distance && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Distance</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {annotation.details.distance}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fun Facts */}
                {annotation.details?.facts && annotation.details.facts.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Did you know?
                    </h4>
                    <ul className="space-y-2">
                      {annotation.details.facts.map((fact, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-cyan-500 mt-0.5">•</span>
                          <span className="text-gray-600 dark:text-gray-400">{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

