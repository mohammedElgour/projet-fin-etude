import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

function formatPercentChange(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return { text: '0%', dir: 'up' };
  const abs = Math.abs(n);
  const text = `${abs.toFixed(1)}%`;
  return { text, dir: n >= 0 ? 'up' : 'down' };
}

const buildSparkline = (values = []) => {
  if (!values.length) {
    return '';
  }

  const width = 140;
  const height = 42;
  const padding = 4;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'from-sky-500 via-cyan-500 to-emerald-500',
  change = 0,
  changeLabel,
  sparklineData = [],
}) {
  const { text: changeText, dir } = formatPercentChange(change);
  const isUp = dir === 'up';
  const sparkline = useMemo(() => buildSparkline(sparklineData), [sparklineData]);

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/82 p-5 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.24)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-slate-950/72">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${accent} opacity-[0.12] blur-2xl`} />
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{label}</p>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
              <div
                className={`mb-1 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isUp
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
                }`}
              >
                {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                <span>{changeLabel ?? changeText}</span>
              </div>
            </div>
          </div>

          <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${accent} text-white shadow-[0_18px_40px_-20px_rgba(59,130,246,0.5)]`}>
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Monthly performance snapshot</p>

          <div className="rounded-[18px] bg-slate-50/90 px-3 py-2 shadow-inner shadow-white/80 dark:bg-white/5">
            <svg viewBox="0 0 140 42" className="h-10 w-[140px]">
              <defs>
                <linearGradient id={`spark-${label.replace(/\s+/g, '-').toLowerCase()}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              {sparkline ? (
                <path
                  d={sparkline}
                  fill="none"
                  stroke={`url(#spark-${label.replace(/\s+/g, '-').toLowerCase()})`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
