import React from 'react';
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

const VARIANTS = {
  view: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800',
  edit: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-500/15',
  delete: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-200 dark:hover:bg-rose-500/15',
};

const IconActionButton = ({
  icon: Icon,
  label,
  variant = 'view',
  loading = false,
  disabled = false,
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { y: -1, scale: 1.03 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      type="button"
      disabled={isDisabled}
      aria-label={label}
      className={cn(
        'group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-950',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-medium text-white shadow-lg group-hover:block dark:bg-white dark:text-slate-900">
        {label}
      </span>
    </motion.button>
  );
};

export default IconActionButton;
