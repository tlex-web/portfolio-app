'use client';

import { motion } from 'motion/react';
import {
  ChartBar,
  CheckCircle,
  CircleDashed,
  CircleHalf,
  Mountains,
  Package,
  ShoppingCart,
  TerminalWindow,
} from '@phosphor-icons/react/dist/ssr';
import { RoadmapItem } from '@/data/types';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface RoadmapProgressProps {
  items: RoadmapItem[];
}

export default function RoadmapProgress({ items }: RoadmapProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.status === 'completed').length;
  const inProgressItems = items.filter((item) => item.status === 'in-progress').length;
  const plannedItems = items.filter((item) => item.status === 'planned').length;

  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      Icon: ChartBar,
    },
    {
      label: 'Completed',
      value: completedItems,
      Icon: CheckCircle,
    },
    {
      label: 'In Progress',
      value: inProgressItems,
      Icon: CircleHalf,
    },
    {
      label: 'Planned',
      value: plannedItems,
      Icon: CircleDashed,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-gradient-to-br from-surface-raised to-surface-overlay rounded-xl p-6 border-2 border-accent">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-ink">
            Overall Progress
          </h3>
          <span className="text-3xl font-bold text-accent">
            {completionPercentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-4 bg-line rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent"
            initial={prefersReducedMotion ? false : { width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, ease: 'easeOut' }}
          />
        </div>

        <p className="mt-3 text-sm text-ink-muted">
          {completedItems} of {totalItems} roadmap items completed
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1, duration: 0.5 }}
            className="bg-surface-raised rounded-xl p-6 border-2 border-line hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="w-12 h-12 rounded-lg bg-surface-overlay text-ink-muted flex items-center justify-center mb-3">
              <stat.Icon size={20} aria-hidden="true" />
            </div>
            <div className="text-3xl font-bold text-ink mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-ink-muted">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Area Breakdown */}
      <div className="bg-surface-raised rounded-xl p-6 border-2 border-line">
        <h3 className="text-lg font-bold text-ink mb-4">
          Breakdown by Project
        </h3>
        <div className="space-y-3">
          {(['portfolio', 'cli', 'webshop', 'other'] as const).map((area) => {
            const areaItems = items.filter((item) => item.area === area);
            const areaCompleted = areaItems.filter((item) => item.status === 'completed').length;
            const areaPercentage = areaItems.length > 0 ? Math.round((areaCompleted / areaItems.length) * 100) : 0;

            const areaConfig = {
              portfolio: { label: 'Portfolio', Icon: Mountains },
              cli: { label: 'CLI_X Tool', Icon: TerminalWindow },
              webshop: { label: 'Website', Icon: ShoppingCart },
              other: { label: 'Other', Icon: Package },
            };

            if (areaItems.length === 0) return null;

            const AreaIcon = areaConfig[area].Icon;

            return (
              <div key={area}>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                    <AreaIcon size={20} aria-hidden="true" />
                    {areaConfig[area].label}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {areaCompleted}/{areaItems.length}
                  </span>
                </div>
                <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent"
                    initial={prefersReducedMotion ? false : { width: 0 }}
                    animate={{ width: `${areaPercentage}%` }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, delay: 0.2 }}
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

