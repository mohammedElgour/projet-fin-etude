import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const VARIANTS = {
  primary:
    'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 focus-visible:ring-blue-500',
  secondary:
    'bg-white/90 text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-950 hover:ring-slate-300 focus-visible:ring-slate-400 dark:bg-slate-900/90 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800 dark:hover:ring-slate-600',
  success:
    'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 focus-visible:ring-emerald-500',
  danger:
    'bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 hover:shadow-rose-600/30 focus-visible:ring-rose-500',
  neutral:
    'bg-slate-100 text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-200 hover:text-slate-900 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-4.5 text-sm',
  lg: 'h-12 px-5 text-sm',
};

const ActionButton = ({
  children,
  icon: Icon,
  as,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;
  const Component = as || motion.button;
  const motionProps =
    Component === motion.button
      ? {
          whileHover: !isDisabled ? { y: -1, scale: 1.01 } : undefined,
          whileTap: !isDisabled ? { scale: 0.99 } : undefined,
        }
      : {};

  return (
    <Component
      {...motionProps}
      type={Component === motion.button ? type : undefined}
      disabled={Component === motion.button ? isDisabled : undefined}
      aria-disabled={Component !== motion.button ? isDisabled : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      <span>{children}</span>
    </Component>
  );
};

export default ActionButton;
