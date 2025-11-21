'use client';

import { motion } from 'framer-motion';

interface RoadmapFiltersProps {
  selectedArea: string;
  selectedStatus: string;
  onAreaChange: (area: string) => void;
  onStatusChange: (status: string) => void;
}

export default function RoadmapFilters({
  selectedArea,
  selectedStatus,
  onAreaChange,
  onStatusChange,
}: RoadmapFiltersProps) {
  const areas = [
    { value: 'all', label: 'All Projects', icon: '🌐' },
    { value: 'portfolio', label: 'Portfolio', icon: '🎨' },
    { value: 'cli', label: 'CLI_X Tool', icon: '⌨️' },
    { value: 'webshop', label: 'Website', icon: '🛒' },
    { value: 'other', label: 'Other', icon: '📦' },
  ];

  const statuses = [
    { value: 'all', label: 'All Statuses', icon: '📊' },
    { value: 'completed', label: 'Completed', icon: '✓' },
    { value: 'in-progress', label: 'In Progress', icon: '⚡' },
    { value: 'planned', label: 'Planned', icon: '📋' },
  ];

  return (
    <div className="space-y-6">
      {/* Area Filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Filter by Project
        </h3>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => {
            const isSelected = selectedArea === area.value;
            return (
              <motion.button
                key={area.value}
                onClick={() => onAreaChange(area.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{area.icon}</span>
                {area.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Filter by Status
        </h3>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const isSelected = selectedStatus === status.value;
            return (
              <motion.button
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{status.icon}</span>
                {status.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

