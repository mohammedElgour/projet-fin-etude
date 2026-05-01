import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  loading = false,
  className = '',
}) => {
  const safeValue =
    typeof value === 'number'
      ? Number.isFinite(value)
        ? value
        : 0
      : value ?? 0;
  const safeTrend = typeof trend === 'number' && Number.isFinite(trend) ? trend : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {/* Background accent */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-2xl" />

      <div className="relative space-y-3">
        {/* Header with icon */}
        <div className="flex items-start justify-between">
          <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3">
            {Icon && <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          </div>
          {safeTrend !== null && (
            <div className={`text-xs font-semibold ${safeTrend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {safeTrend > 0 ? '+' : ''}{safeTrend}%
            </div>
          )}
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>

        {/* Value */}
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{safeValue}</span>
            {subtext && <span className="text-xs text-slate-500 dark:text-slate-400">{subtext}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
