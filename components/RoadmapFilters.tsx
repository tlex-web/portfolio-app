'use client';

import { motion } from 'motion/react';
import {
  ChartBar,
  CheckCircle,
  CircleDashed,
  CircleHalf,
  Globe,
  Mountains,
  Package,
  ShoppingCart,
  TerminalWindow,
} from '@phosphor-icons/react/dist/ssr';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface RoadmapFiltersProps {
  selectedArea: string;
  selectedStatus: string;
  onAreaChange: (area: string) => void;
  onStatusChange: (status: string) => void;
}

const areas = [
  { value: 'all', label: 'All Projects', Icon: Globe },
  { value: 'portfolio', label: 'Portfolio', Icon: Mountains },
  { value: 'cli', label: 'CLI_X Tool', Icon: TerminalWindow },
  { value: 'webshop', label: 'Website', Icon: ShoppingCart },
  { value: 'other', label: 'Other', Icon: Package },
];

const statuses = [
  { value: 'all', label: 'All Statuses', Icon: ChartBar },
  { value: 'completed', label: 'Completed', Icon: CheckCircle },
  { value: 'in-progress', label: 'In Progress', Icon: CircleHalf },
  { value: 'planned', label: 'Planned', Icon: CircleDashed },
];

export default function RoadmapFilters({
  selectedArea,
  selectedStatus,
  onAreaChange,
  onStatusChange,
}: RoadmapFiltersProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="space-y-6">
      {/* Area Filter */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">
          Filter by Project
        </h3>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => {
            const isSelected = selectedArea === area.value;
            return (
              <motion.button
                key={area.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onAreaChange(area.value)}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isSelected
                    ? 'bg-accent text-ink-inverse shadow-lg'
                    : 'bg-surface-raised text-ink hover:bg-surface-overlay'
                }`}
              >
                <area.Icon size={20} aria-hidden="true" />
                {area.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">
          Filter by Status
        </h3>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const isSelected = selectedStatus === status.value;
            return (
              <motion.button
                key={status.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onStatusChange(status.value)}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isSelected
                    ? 'bg-accent text-ink-inverse shadow-lg'
                    : 'bg-surface-raised text-ink hover:bg-surface-overlay'
                }`}
              >
                <status.Icon size={20} aria-hidden="true" />
                {status.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
