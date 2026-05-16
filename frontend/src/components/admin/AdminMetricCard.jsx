import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/cn';

const TONES = {
  blue: {
    shell: 'from-blue-500/18 via-cyan-400/10 to-white dark:from-blue-500/18 dark:via-cyan-500/8 dark:to-transparent',
    icon: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/18',
    bar: 'from-blue-500 to-cyan-400',
  },
  purple: {
    shell: 'from-violet-500/18 via-fuchsia-400/10 to-white dark:from-violet-500/18 dark:via-fuchsia-500/8 dark:to-transparent',
    icon: 'from-violet-500 to-fuchsia-500',
    glow: 'shadow-violet-500/18',
    bar: 'from-violet-500 to-fuchsia-400',
  },
  emerald: {
    shell: 'from-emerald-500/18 via-teal-400/10 to-white dark:from-emerald-500/18 dark:via-teal-500/8 dark:to-transparent',
    icon: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/18',
    bar: 'from-emerald-500 to-teal-400',
  },
  orange: {
    shell: 'from-orange-500/18 via-amber-400/10 to-white dark:from-orange-500/18 dark:via-amber-500/8 dark:to-transparent',
    icon: 'from-orange-500 to-amber-500',
    glow: 'shadow-orange-500/18',
    bar: 'from-orange-500 to-amber-400',
  },
  cyan: {
    shell: 'from-cyan-500/18 via-sky-400/10 to-white dark:from-cyan-500/18 dark:via-sky-500/8 dark:to-transparent',
    icon: 'from-cyan-500 to-sky-500',
    glow: 'shadow-cyan-500/18',
    bar: 'from-cyan-500 to-sky-400',
  },
};

const formatTrend = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return { text: '0%', up: true };
  }

  return {
    text: `${Math.abs(amount).toFixed(1)}%`,
    up: amount >= 0,
  };
};

export default function AdminMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 0,
  tone = 'blue',
  progress = 0,
}) {
  const palette = TONES[tone] || TONES.blue;
  const { text, up } = formatTrend(trend);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-white/70 p-5 shadow-[0_26px_64px_-34px_rgba(15,23,42,0.28)] backdrop-blur-2xl',
        'bg-gradient-to-br',
        palette.shell,
        'dark:border-white/10'
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.95),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_34%)]" />

      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
          </div>

          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-xl',
              palette.icon,
              palette.glow
            )}
          >
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                up
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
              )}
            >
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {text}
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(6, Math.min(progress, 100))}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full rounded-full bg-gradient-to-r', palette.bar)}
              />
            </div>

            <div className="flex items-end gap-1.5">
              {[24, 38, 28, 52, 44, 66, 48].map((bar, index) => (
                <span
                  key={`${title}-${bar}-${index}`}
                  className={cn('w-full rounded-full bg-gradient-to-t opacity-70', palette.bar)}
                  style={{ height: `${bar}%`, maxHeight: 34 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
