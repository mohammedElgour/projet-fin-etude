import React from 'react';
import clsx from 'clsx';

const variants = {
  primary:
    'bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-500 text-white shadow-lg shadow-sky-500/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30',
  secondary:
    'border border-sky-200 dark:border-sky-700 bg-white/85 dark:bg-slate-800/85 text-slate-800 dark:text-slate-100 shadow-sm hover:-translate-y-0.5 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-white dark:hover:bg-slate-800',
  ghost:
    'text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950',
};

export default function LandingButton({
  as: Component = 'a',
  href,
  to,
  variant = 'primary',
  className,
  children,
  ...props
}) {
  const sharedProps = {
    className: clsx(
      'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300',
      variants[variant],
      className
    ),
    ...props,
  };

  if (to) {
    return (
      <Component to={to} {...sharedProps}>
        {children}
      </Component>
    );
  }

  return (
    <Component href={href} {...sharedProps}>
      {children}
    </Component>
  );
}
