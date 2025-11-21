'use client';

import { motion } from 'framer-motion';
import { RoadmapItem } from '@/data/types';

interface RoadmapTimelineProps {
  items: RoadmapItem[];
}

const statusConfig = {
  completed: {
    color: 'bg-green-500',
    textColor: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: '✓',
    label: 'Completed',
  },
  'in-progress': {
    color: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: '⚡',
    label: 'In Progress',
  },
  planned: {
    color: 'bg-gray-400',
    textColor: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: '📋',
    label: 'Planned',
  },
};

const areaConfig = {
  portfolio: {
    color: 'bg-purple-500',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: '🎨',
    label: 'Portfolio',
  },
  cli: {
    color: 'bg-cyan-500',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    icon: '⌨️',
    label: 'CLI_X Tool',
  },
  webshop: {
    color: 'bg-orange-500',
    textColor: 'text-orange-700 dark:text-orange-300',
    icon: '🛒',
    label: 'Website',
  },
  other: {
    color: 'bg-gray-500',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: '📦',
    label: 'Other',
  },
};

const priorityConfig = {
  high: {
    color: 'text-red-600 dark:text-red-400',
    icon: '🔴',
    label: 'High Priority',
  },
  medium: {
    color: 'text-yellow-600 dark:text-yellow-400',
    icon: '🟡',
    label: 'Medium Priority',
  },
  low: {
    color: 'text-green-600 dark:text-green-400',
    icon: '🟢',
    label: 'Low Priority',
  },
};

export default function RoadmapTimeline({ items }: RoadmapTimelineProps) {
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-blue-500 to-purple-500" />

      {/* Timeline Items */}
      <div className="space-y-8">
        {items.map((item, index) => {
          const status = statusConfig[item.status];
          const area = areaConfig[item.area];
          const priority = item.priority ? priorityConfig[item.priority] : null;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative pl-20"
            >
              {/* Timeline Dot */}
              <div className="absolute left-6 top-6 -translate-x-1/2">
                <div
                  className={`w-6 h-6 rounded-full ${status.color} border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center`}
                >
                  <span className="text-white text-xs">{status.icon}</span>
                </div>
              </div>

              {/* Card */}
              <div
                className={`${status.bgColor} ${status.borderColor} border-2 rounded-xl p-6 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.textColor} ${status.bgColor} border ${status.borderColor}`}
                      >
                        {status.icon} {status.label}
                      </span>

                      {/* Area Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white ${area.color}`}
                      >
                        {area.icon} {area.label}
                      </span>

                      {/* Priority Badge */}
                      {priority && (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${priority.color} bg-white dark:bg-gray-800 border-2 border-current`}
                        >
                          {priority.icon} {priority.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Target Release */}
                  {item.targetRelease && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Target Release
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        {item.targetRelease}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.description}
                </p>

                {/* Progress Bar for In-Progress Items */}
                {item.status === 'in-progress' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>In Development</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                      />
                    </div>
                  </div>
                )}

                {/* Completion Indicator for Completed Items */}
                {item.status === 'completed' && (
                  <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-semibold">
                      Successfully Delivered
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
