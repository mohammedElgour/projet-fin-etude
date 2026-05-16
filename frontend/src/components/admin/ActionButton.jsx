import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-white shadow-[0_18px_45px_-20px_rgba(14,165,233,0.65)] hover:shadow-[0_22px_50px_-18px_rgba(16,185,129,0.45)] focus-visible:ring-cyan-500',
  secondary:
    'bg-white/75 text-slate-700 ring-1 ring-white/80 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.35)] hover:bg-white hover:text-slate-950 hover:ring-slate-200/80 focus-visible:ring-slate-400 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-slate-800 dark:hover:ring-white/15',
  success:
    'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_18px_45px_-20px_rgba(16,185,129,0.55)] hover:shadow-[0_22px_48px_-18px_rgba(20,184,166,0.5)] focus-visible:ring-emerald-500',
  danger:
    'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_18px_45px_-20px_rgba(244,63,94,0.55)] hover:shadow-[0_22px_48px_-18px_rgba(249,115,22,0.45)] focus-visible:ring-rose-500',
  neutral:
    'bg-slate-100/85 text-slate-700 ring-1 ring-white/70 shadow-[0_14px_28px_-22px_rgba(15,23,42,0.34)] hover:bg-slate-200 hover:text-slate-900 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-slate-700',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
};

const SIZES = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-11 px-4.5 text-sm',
  lg: 'h-12 px-5.5 text-sm',
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
        'rounded-[16px]',
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
