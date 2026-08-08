import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2 } : undefined}
      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
      className={`apple-glass-card rounded-2xl p-6 relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Top subtle material highlight line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};
