import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Layers3, Sparkles } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const PALETTE = [
  { solid: '#3B82F6', start: '#60A5FA', end: '#2563EB', glow: 'rgba(59, 130, 246, 0.28)' },
  { solid: '#8B5CF6', start: '#A78BFA', end: '#7C3AED', glow: 'rgba(139, 92, 246, 0.28)' },
  { solid: '#10B981', start: '#34D399', end: '#059669', glow: 'rgba(16, 185, 129, 0.28)' },
  { solid: '#F97316', start: '#FB923C', end: '#EA580C', glow: 'rgba(249, 115, 22, 0.28)' },
  { solid: '#06B6D4', start: '#22D3EE', end: '#0891B2', glow: 'rgba(6, 182, 212, 0.28)' },
];

const numberFormat = new Intl.NumberFormat('en-US');

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;

  if (!item) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white/95 px-4 py-3 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200/80 backdrop-blur-xl dark:bg-slate-950/95 dark:ring-white/10">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{numberFormat.format(item.value)} groups</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {item.percentage}% of total
      </p>
    </div>
  );
};

export default function GroupesParFiliereCard({
  title = 'Groupes Par Filiere',
  subtitle = 'Distribution dynamique des groupes dans chaque filiere',
  data = [],
}) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const chartData = useMemo(() => {
    const safeData = Array.isArray(data) ? data.filter((item) => Number(item?.value) > 0) : [];
    const totalGroups = safeData.reduce((sum, item) => sum + Number(item.value || 0), 0);

    return safeData.map((item, index) => {
      const palette = PALETTE[index % PALETTE.length];
      const value = Number(item.value || 0);
      const percentage = totalGroups > 0 ? Math.round((value / totalGroups) * 100) : 0;

      return {
        ...item,
        value,
        percentage,
        color: item.color || palette.solid,
        gradientId: `groupes-gradient-${index}`,
        glow: palette.glow,
        start: palette.start,
        end: palette.end,
      };
    });
  }, [data]);

  const totals = useMemo(() => {
    const totalGroups = chartData.reduce((sum, item) => sum + item.value, 0);

    return {
      totalGroups,
      totalFilieres: chartData.length,
      topFiliere: chartData[0]?.label || 'No filiere',
    };
  }, [chartData]);

  const empty = chartData.length === 0;

  return (
    <section className="relative overflow-hidden rounded-[20px] bg-white/88 p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.22)] ring-1 ring-white/70 backdrop-blur-2xl transition duration-300 dark:bg-slate-950/72 dark:ring-white/10 sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_28%)]" />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-white/5 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5" />
              Analytics
            </div>
            <div>
              <h3 className="text-[22px] font-bold tracking-tight text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-start">
            <div className="rounded-2xl bg-slate-50/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-white/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Groups</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{numberFormat.format(totals.totalGroups)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-white/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Filieres</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{numberFormat.format(totals.totalFilieres)}</p>
            </div>
          </div>
        </div>

        {empty ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[20px] bg-slate-50/85 text-sm text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/5 dark:text-slate-400">
            No filiere groups available yet.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,1.2fr)_minmax(0,1fr)] xl:items-center">
            <div className="rounded-[20px] bg-gradient-to-br from-slate-50 via-white to-slate-100/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] dark:from-slate-900/90 dark:via-slate-950 dark:to-slate-900/80">
              <div className="relative h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <defs>
                      {chartData.map((item) => (
                        <linearGradient key={item.gradientId} id={item.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={item.start} />
                          <stop offset="100%" stopColor={item.end} />
                        </linearGradient>
                      ))}
                    </defs>

                    <Tooltip content={<CustomTooltip />} />

                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={3}
                      cornerRadius={18}
                      stroke="rgba(255,255,255,0.96)"
                      strokeWidth={5}
                      startAngle={90}
                      endAngle={-270}
                      animationDuration={950}
                      animationEasing="ease-out"
                      activeIndex={activeIndex}
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(-1)}
                    >
                      {chartData.map((item, index) => (
                        <Cell
                          key={item.label}
                          fill={`url(#${item.gradientId})`}
                          style={{
                            filter: activeIndex === index ? `drop-shadow(0 0 18px ${item.glow})` : 'drop-shadow(0 10px 22px rgba(15, 23, 42, 0.12))',
                            transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
                            transformOrigin: 'center center',
                            transition: 'filter 220ms ease, transform 220ms ease',
                          }}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex h-[122px] w-[122px] flex-col items-center justify-center rounded-full bg-white/88 text-center shadow-[0_18px_50px_-18px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-white/70 backdrop-blur-xl dark:bg-slate-950/88 dark:ring-white/10">
                    <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                      {numberFormat.format(totals.totalGroups)} Groups
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      {numberFormat.format(totals.totalFilieres)} Total filieres
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {chartData.map((item, index) => {
                  const isActive = activeIndex === index;

                  return (
                    <motion.div
                      key={item.label}
                      whileHover={{ y: -3, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                      onHoverStart={() => setActiveIndex(index)}
                      onHoverEnd={() => setActiveIndex(-1)}
                      className="rounded-[20px] bg-slate-50/88 p-4 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.36),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition dark:bg-white/5"
                      style={{
                        boxShadow: isActive
                          ? `0 24px 40px -24px ${item.glow}, inset 0 1px 0 rgba(255,255,255,0.92)`
                          : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span
                              className="mt-0.5 h-3 w-3 rounded-full shadow-[0_0_0_6px_rgba(255,255,255,0.7)] dark:shadow-none"
                              style={{ background: `linear-gradient(135deg, ${item.start}, ${item.end})` }}
                            />
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Share of total groups</p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                            {numberFormat.format(item.value)}
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.percentage}%</p>
                        </div>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.08 * index, ease: 'easeOut' }}
                          style={{
                            background: `linear-gradient(90deg, ${item.start}, ${item.end})`,
                            boxShadow: `0 0 16px ${item.glow}`,
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] bg-slate-50/88 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/5">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">Top Filiere</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{totals.topFiliere}</p>
                </div>

                <div className="rounded-[20px] bg-slate-50/88 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/5">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Layers3 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">Average</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {chartData.length ? `${(totals.totalGroups / chartData.length).toFixed(1)} groups / filiere` : '0.0 groups / filiere'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
