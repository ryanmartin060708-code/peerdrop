import React from 'react';
import { SessionStatus } from '../../types/index.js';

interface BadgeProps {
  status: SessionStatus | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const statusMap: Record<string, { label: string; style: string }> = {
    WAITING: {
      label: 'Waiting for peer',
      style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    CONNECTING: {
      label: 'Connecting...',
      style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    CONNECTED: {
      label: 'Connected',
      style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    TRANSFERRING: {
      label: 'Transferring',
      style: 'bg-apple-blue/10 text-apple-blue border-apple-blue/20 animate-pulse',
    },
    COMPLETED: {
      label: 'Completed',
      style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    EXPIRED: {
      label: 'Expired',
      style: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    },
    CANCELLED: {
      label: 'Cancelled',
      style: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    },
    FAILED: {
      label: 'Failed',
      style: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    },
  };

  const config = statusMap[status] || {
    label: status,
    style: 'bg-apple-gray-200 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300 border-black/5 dark:border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  );
};
