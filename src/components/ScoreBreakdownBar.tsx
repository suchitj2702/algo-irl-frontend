// Score Breakdown Bar Component
// Displays a visual progress bar for hotness score components

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScoreBreakdownBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
  description: string;
  icon?: LucideIcon;
  compact?: boolean;
}

const colorClasses = {
  blue: 'bg-gradient-to-r from-blue-400 to-blue-600',
  green: 'bg-gradient-to-r from-mint-400 to-mint-600',
  purple: 'bg-gradient-to-r from-purple-400 to-purple-600',
  orange: 'bg-gradient-to-r from-orange-400 to-orange-600'
};

const iconColorClasses = {
  blue: 'text-blue-500 dark:text-blue-400',
  green: 'text-mint-500 dark:text-mint-400',
  purple: 'text-purple-500 dark:text-purple-400',
  orange: 'text-orange-500 dark:text-orange-400'
};

export function ScoreBreakdownBar({
  label,
  value,
  maxValue,
  color,
  description,
  icon: Icon,
  compact = false
}: ScoreBreakdownBarProps) {
  const percentage = Math.round((value / maxValue) * 100);

  if (compact) {
    // Compact single-line layout for split-panel design
    return (
      <div className="group">
        <div className="flex items-center gap-3 mb-1.5">
          {Icon && (
            <div className={`flex-shrink-0 ${iconColorClasses[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 flex-shrink-0">
            {label}
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white ml-auto flex-shrink-0">
            {value}/{maxValue}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
            {percentage}%
          </span>
        </div>

        <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className={`h-full ${colorClasses[color]}`}
          />
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 truncate group-hover:text-clip group-hover:whitespace-normal transition-all" title={description}>
          {description}
        </p>
      </div>
    );
  }

  // Original full-size layout
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className={`w-4 h-4 ${iconColorClasses[color]}`} />
          )}
          <span className="text-sm font-medium text-content-subtle">
            {label}
          </span>
        </div>
        <span className="text-sm font-semibold text-content-subtle">
          {value}/{maxValue} points
        </span>
      </div>

      <div className="relative w-full h-3 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          className={`h-full ${colorClasses[color]}`}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-content-muted dark:text-content-subtle">{description}</p>
        <span className="text-xs font-medium text-content-muted">{percentage}%</span>
      </div>
    </div>
  );
}
