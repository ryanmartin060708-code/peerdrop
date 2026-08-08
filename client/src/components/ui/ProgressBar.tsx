import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0 - 100
  statusText?: string;
  speedText?: string;
  etaText?: string;
  className?: string;
  color?: 'blue' | 'green' | 'orange' | 'red';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  statusText,
  speedText,
  etaText,
  className = '',
  color = 'blue',
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  const colorStyles = {
    blue: 'bg-apple-blue shadow-[0_0_12px_rgba(0,113,227,0.4)]',
    green: 'bg-apple-green shadow-[0_0_12px_rgba(52,199,89,0.4)]',
    orange: 'bg-apple-orange shadow-[0_0_12px_rgba(255,149,0,0.4)]',
    red: 'bg-apple-red shadow-[0_0_12px_rgba(255,59,48,0.4)]',
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {(statusText || speedText || etaText) && (
        <div className="flex items-center justify-between text-xs font-medium text-apple-gray-600 dark:text-apple-gray-400">
          <span>{statusText}</span>
          <div className="flex items-center space-x-3">
            {speedText && <span>{speedText}</span>}
            {etaText && <span>{etaText}</span>}
            <span className="text-apple-gray-900 dark:text-apple-gray-100 font-semibold">
              {Math.round(normalizedProgress)}%
            </span>
          </div>
        </div>
      )}

      {/* Progress Track */}
      <div className="relative w-full h-3 bg-apple-gray-200 dark:bg-apple-gray-800 rounded-full overflow-hidden p-0.5 border border-black/5 dark:border-white/5">
        <motion.div
          className={`h-full rounded-full ${colorStyles[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${normalizedProgress}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        />
      </div>
    </div>
  );
};
