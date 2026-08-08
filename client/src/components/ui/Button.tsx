import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue disabled:opacity-50 disabled:pointer-events-none select-none active-press';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-5 py-2.5 gap-2 min-h-[40px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[48px]',
  };

  const variantStyles = {
    primary:
      'bg-apple-blue hover:bg-apple-blue-hover text-white shadow-apple-sm dark:shadow-glass-dark border border-white/20',
    secondary:
      'bg-apple-gray-200 dark:bg-apple-gray-800 hover:bg-apple-gray-300 dark:hover:bg-apple-gray-700 text-apple-gray-900 dark:text-apple-gray-100 border border-black/5 dark:border-white/10',
    outline:
      'border border-apple-gray-300 dark:border-apple-gray-700 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 text-apple-gray-800 dark:text-apple-gray-200',
    ghost:
      'hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300',
    danger:
      'bg-apple-red hover:bg-red-600 text-white shadow-apple-sm border border-white/20',
  };

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
};
