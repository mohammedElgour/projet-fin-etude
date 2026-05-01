import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const chartCardClassName =
  'rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none';

const palette = ['#4f46e5', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#a855f7'];

const EmptyState = ({ message }) => (
  <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
    {message}
  </div>
);

const LoadingState = ({ rows = 4 }) => (
  <div className="space-y-4">
    <div className="h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
    <div className={`grid gap-3 ${rows > 3 ? 'sm:grid-cols-2' : ''}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70"
        />
      ))}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, suffix = '' }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      {label ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p> : null}
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {entry.value}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function OverviewBarChart({ data = [], loading = false }) {
  if (loading) {
    return <LoadingState rows={3} />;
  }

  if (!Array.isArray(data) || data.length === 0 || data.every((item) => Number(item.value) === 0)) {
    return <EmptyState message="Aucun indicateur global disponible." />;
  }

  return (
    <div className="space-y-4">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
            <Bar dataKey="value" name="Total" radius={[12, 12, 0, 0]} maxBarSize={72}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={entry.color || palette[index % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {data.map((item, index) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color || palette[index % palette.length] }}
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {item.label}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ data = [], loading = false }) {
  if (loading) {
    return <LoadingState rows={6} />;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyState message="Aucune tendance disponible." />;
  }

  return (
    <div className="space-y-4">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 20]} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip suffix="/20" />} />
            <Line
              type="monotone"
              dataKey="average"
              name="Moyenne"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 0, fill: '#4f46e5' }}
              activeDot={{ r: 6, fill: '#312e81' }}
              fill="url(#trendGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        {data.map((item) => (
          <div key={item.month} className="rounded-xl bg-slate-50 px-3 py-2 text-center dark:bg-slate-800/60">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.month}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{item.average}/20</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DistributionChart({ data = [], loading = false }) {
  if (loading) {
    return <LoadingState rows={3} />;
  }

  if (!Array.isArray(data) || data.length === 0 || data.every((item) => Number(item.value) === 0)) {
    return <EmptyState message="Aucune distribution disponible." />;
  }

  return (
    <div className="space-y-4">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={70}
              outerRadius={102}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={entry.color || palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={24} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {data.map((item, index) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color || palette[index % palette.length] }}
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {item.label}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModulePerformanceChart({ data = [], loading = false }) {
  if (loading) {
    return <LoadingState rows={5} />;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyState message="Aucune performance module disponible." />;
  }

  const topModules = data.slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topModules} layout="vertical" margin={{ top: 8, right: 12, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" horizontal={false} />
            <XAxis type="number" domain={[0, 20]} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="module"
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip suffix="/20" />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
            <Bar dataKey="average" name="Moyenne" radius={[0, 12, 12, 0]} maxBarSize={26}>
              {topModules.map((entry, index) => (
                <Cell key={entry.id || entry.module} fill={palette[index % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {topModules.map((item, index) => (
          <div key={item.id || item.module} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: palette[index % palette.length] }}
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">{item.module}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.average}/20</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartCard({ title, description, children, accent, className = '' }) {
  return (
    <section className={`${chartCardClassName} ${className}`.trim()}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {accent ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {accent}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
