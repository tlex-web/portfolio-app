'use client';

import { motion } from 'motion/react';
import {
  ChartBar,
  CheckCircle,
  CreditCard,
  Gauge,
  ListChecks,
  LockKey,
  ShieldCheck,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';
import type { HighlightValue } from '@/data/types';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** Highlight key -> Phosphor icon; unmapped keys fall back to ChartBar. */
const highlightIcons: Record<string, typeof ChartBar> = {
  performance: Gauge,
  testing: CheckCircle,
  safety: ShieldCheck,
  features: ListChecks,
  pricingTiers: CreditCard,
  security: LockKey,
  techStack: Wrench,
};

/** Props for the ProjectHighlights component. */
interface ProjectHighlightsProps {
  /** Key-value map of highlight sections to display. */
  highlights: Record<string, HighlightValue>;
  /** Optional heading above the highlights grid. */
  title?: string;
}

/** Renders a grid of project highlight cards with recursive value display. */
export default function ProjectHighlights({ highlights, title = 'Project Highlights' }: ProjectHighlightsProps) {
  const prefersReducedMotion = useReducedMotion();
  const renderValue = (value: HighlightValue): React.ReactNode => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return <span className="text-accent font-semibold">{String(value)}</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <ul className="space-y-1 mt-2">
          {value.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
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
            <div key={subKey} className="p-3 bg-surface-raised rounded-lg">
              <div className="text-xs text-ink-muted uppercase tracking-wide mb-1">
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
      <h2 className="text-3xl font-bold mb-8 text-ink text-center">
        {title}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(highlights).map(([key, value], index) => {
          const Icon = highlightIcons[key] ?? ChartBar;
          return (
            <motion.div
              key={key}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1, duration: 0.3 }}
              className="group"
            >
              <div className="p-6 bg-surface-raised rounded-xl border-2 border-line hover:border-accent transition-all duration-300 shadow-sm hover:shadow-xl h-full">
                {/* Section Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center">
                    <Icon size={20} aria-hidden="true" className="text-ink-muted" />
                  </div>
                  <h3 className="text-xl font-bold text-ink capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                </div>

                {/* Section Content */}
                <div className="text-ink">
                  {renderValue(value)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

