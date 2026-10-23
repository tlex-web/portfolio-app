'use client';

import { motion } from 'motion/react';
import {
  CaretDoubleUp,
  CaretDown,
  CheckCircle,
  CircleDashed,
  CircleHalf,
  Equals,
  Mountains,
  Package,
  ShoppingCart,
  TerminalWindow,
} from '@phosphor-icons/react/dist/ssr';
import { RoadmapItem } from '@/data/types';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface RoadmapTimelineProps {
  items: RoadmapItem[];
}

const statusConfig = {
  completed: {
    dotColor: 'bg-success',
    cardBorder: 'border-success',
    badgeColor: 'text-success border-success',
    Icon: CheckCircle,
    label: 'Completed',
  },
  'in-progress': {
    dotColor: 'bg-accent',
    cardBorder: 'border-accent',
    badgeColor: 'text-accent border-accent',
    Icon: CircleHalf,
    label: 'In Progress',
  },
  planned: {
    dotColor: 'bg-ink-muted',
    cardBorder: 'border-line',
    badgeColor: 'text-ink-muted border-line-strong',
    Icon: CircleDashed,
    label: 'Planned',
  },
};

// Area is a category, not a state: every area shares one neutral chip and is
// told apart by its Phosphor icon and visible label.
const areaConfig = {
  portfolio: {
    Icon: Mountains,
    label: 'Portfolio',
  },
  cli: {
    Icon: TerminalWindow,
    label: 'CLI_X Tool',
  },
  webshop: {
    Icon: ShoppingCart,
    label: 'Website',
  },
  other: {
    Icon: Package,
    label: 'Other',
  },
};

const priorityConfig = {
  high: {
    color: 'text-danger',
    Icon: CaretDoubleUp,
    label: 'High Priority',
  },
  medium: {
    color: 'text-caution',
    Icon: Equals,
    label: 'Medium Priority',
  },
  low: {
    color: 'text-success',
    Icon: CaretDown,
    label: 'Low Priority',
  },
};

export default function RoadmapTimeline({ items }: RoadmapTimelineProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-accent" />

      {/* Timeline Items */}
      <div className="space-y-8">
        {items.map((item, index) => {
          const status = statusConfig[item.status];
          const area = areaConfig[item.area];
          const priority = item.priority ? priorityConfig[item.priority] : null;

          return (
            <motion.div
              key={item.id}
              initial={prefersReducedMotion ? false : { opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1, duration: 0.5 }}
              className="relative pl-20"
            >
              {/* Timeline Dot */}
              <div className="absolute left-6 top-6 -translate-x-1/2">
                <div
                  className={`w-6 h-6 rounded-full ${status.dotColor} border-4 border-surface shadow-lg flex items-center justify-center`}
                >
                  <status.Icon size={20} aria-hidden="true" className="text-ink-inverse" />
                </div>
              </div>

              {/* Card */}
              <div
                className={`bg-surface-raised ${status.cardBorder} border-2 rounded-xl p-6 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-ink mb-2">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-surface-overlay border ${status.badgeColor}`}
                      >
                        <status.Icon size={20} aria-hidden="true" />
                        {status.label}
                      </span>

                      {/* Area Badge */}
                      <span
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-surface-overlay text-ink border border-line-strong"
                      >
                        <area.Icon size={20} aria-hidden="true" />
                        {area.label}
                      </span>

                      {/* Priority Badge */}
                      {priority && (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${priority.color} bg-surface-raised border-2 border-current`}
                        >
                          <priority.Icon size={20} aria-hidden="true" />
                          {priority.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Target Release */}
                  {item.targetRelease && (
                    <div className="text-right">
                      <div className="text-xs text-ink-muted mb-1">
                        Target Release
                      </div>
                      <div className="text-sm font-semibold text-ink px-3 py-1 bg-surface-raised rounded-lg border border-line">
                        {item.targetRelease}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-ink leading-relaxed">
                  {item.description}
                </p>

                {/* Progress Bar for In-Progress Items */}
                {item.status === 'in-progress' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
                      <span>Progress</span>
                      <span>In Development</span>
                    </div>
                    <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-accent"
                        initial={prefersReducedMotion ? false : { width: 0 }}
                        animate={{ width: '60%' }}
                        transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1 + 0.5, duration: 1 }}
                      />
                    </div>
                  </div>
                )}

                {/* Completion Indicator for Completed Items */}
                {item.status === 'completed' && (
                  <div className="mt-4 flex items-center gap-2 text-success">
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
