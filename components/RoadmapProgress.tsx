'use client';

import { motion } from 'framer-motion';
import { RoadmapItem } from '@/data/types';

interface RoadmapProgressProps {
  items: RoadmapItem[];
}

export default function RoadmapProgress({ items }: RoadmapProgressProps) {
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.status === 'completed').length;
  const inProgressItems = items.filter((item) => item.status === 'in-progress').length;
  const plannedItems = items.filter((item) => item.status === 'planned').length;

  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: '📊',
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Completed',
      value: completedItems,
      icon: '✓',
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'In Progress',
      value: inProgressItems,
      icon: '⚡',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Planned',
      value: plannedItems,
      icon: '📋',
      color: 'from-gray-500 to-gray-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border-2 border-cyan-200 dark:border-cyan-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Overall Progress
          </h3>
          <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
            {completionPercentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {completedItems} of {totalItems} roadmap items completed
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl mb-3`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Area Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Breakdown by Project
        </h3>
        <div className="space-y-3">
          {(['portfolio', 'cli', 'webshop', 'other'] as const).map((area) => {
            const areaItems = items.filter((item) => item.area === area);
            const areaCompleted = areaItems.filter((item) => item.status === 'completed').length;
            const areaPercentage = areaItems.length > 0 ? Math.round((areaCompleted / areaItems.length) * 100) : 0;

            const areaConfig = {
              portfolio: { label: 'Portfolio', icon: '🎨', color: 'bg-purple-500' },
              cli: { label: 'CLI_X Tool', icon: '⌨️', color: 'bg-cyan-500' },
              webshop: { label: 'Website', icon: '🛒', color: 'bg-orange-500' },
              other: { label: 'Other', icon: '📦', color: 'bg-gray-500' },
            };

            if (areaItems.length === 0) return null;

            return (
              <div key={area}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {areaConfig[area].icon} {areaConfig[area].label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {areaCompleted}/{areaItems.length}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${areaConfig[area].color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${areaPercentage}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

