import React, { useMemo, useState } from 'react';

const formatValue = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return Number(value).toFixed(1);
};

export const ChartCard = ({ title, subtitle, children }) => (
  <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition dark:border-white/10 dark:bg-slate-950/70 sm:p-6">
    <div className="mb-5">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
    </div>
    {children}
  </section>
);

function Tooltip({ x, y, children }) {
  if (!children) return null;

  return (
    <div
      className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-12 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-slate-950/90"
      style={{ left: x, top: y }}
    >
      {children}
    </div>
  );
}

export const BarChart = ({ data = [], color = '#0ea5e9' }) => {
  const max = Math.max(...(data || []).map((item) => item.value || 0), 1);
  const bars = useMemo(() => data || [], [data]);

  const [hoverIndex, setHoverIndex] = useState(null);
  const [tip, setTip] = useState({ x: 0, y: 0, content: null });

  return (
    <div className="space-y-4">
      <div className="relative flex h-64 items-end gap-3 overflow-x-auto pb-2">
        <Tooltip x={tip.x} y={tip.y}>
          {tip.content}
        </Tooltip>

        {bars.map((item, idx) => {
          const height = `${Math.max(((item.value || 0) / max) * 100, item.value ? 12 : 0)}%`;
          const isActive = hoverIndex === idx;

          return (
            <div
              key={item.label}
              className="group relative flex min-w-[72px] flex-1 flex-col items-center justify-end gap-3"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoverIndex(idx);
                setTip({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                  content: (
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.label}</div>
                      <div className="mt-1 text-slate-600 dark:text-slate-300">{formatValue(item.value)}</div>
                    </div>
                  ),
                });
              }}
              onMouseMove={(e) => {
                setTip((t) => ({ ...t, x: e.clientX, y: e.clientY }));
              }}
              onMouseLeave={() => {
                setHoverIndex(null);
                setTip({ x: 0, y: 0, content: null });
              }}
            >
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatValue(item.value)}</span>
              <div className="flex h-52 w-full items-end rounded-t-[22px] bg-slate-100 p-1 transition-colors dark:bg-slate-900">
                <div
                  className={[
                    'w-full rounded-[18px] transition-all duration-500',
                    'group-hover:shadow-lg group-hover:shadow-sky-500/15',
                  ].join(' ')}
                  style={{
                    height,
                    background: `linear-gradient(180deg, ${color}, rgba(255,255,255,0.25))`,
                    filter: isActive ? 'saturate(1.15)' : 'saturate(1)',
                    opacity: hoverIndex === null || isActive ? 1 : 0.65,
                  }}
                />
              </div>
              <span className="text-center text-xs font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LineChart = ({
  data = [],
  stroke = '#8b5cf6',
  fill = 'rgba(139, 92, 246, 0.14)',
}) => {
  const width = 520;
  const height = 220;
  const padding = 18;

  const values = (data || []).map((item) => item.value || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = (data || []).map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max((data || []).length - 1, 1);
    const y = height - padding - (((item.value || 0) - min) / range) * (height - padding * 2);
    return { ...item, x, y, index };
  });

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length
    ? `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  const [hoverIndex, setHoverIndex] = useState(null);
  const [tip, setTip] = useState({ x: 0, y: 0, content: null });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Tooltip x={tip.x} y={tip.y}>
          {tip.content}
        </Tooltip>

        <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible">
          {[0, 1, 2, 3].map((step) => {
            const y = padding + (step * (height - padding * 2)) / 3;
            return (
              <line
                key={step}
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="4 6"
              />
            );
          })}

          {areaPath ? <path d={areaPath} fill={fill} /> : null}

          {path ? (
            <path
              d={path}
              fill="none"
              stroke={stroke}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
              style={{ filter: hoverIndex === null ? 'none' : 'saturate(1.15)' }}
            />
          ) : null}

          {points.map((point) => {
            const isActive = hoverIndex === point.index;
            const isDim = hoverIndex !== null && !isActive;

            return (
              <g key={point.label}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? '9' : '6'}
                  fill={stroke}
                  opacity={isDim ? 0.35 : 1}
                  style={{ transition: 'r 180ms ease, opacity 180ms ease' }}
                  onMouseEnter={(e) => {
                    setHoverIndex(point.index);
                    setTip({
                      x: e.clientX,
                      y: e.clientY,
                      content: (
                        <div className="text-xs">
                          <div className="font-semibold text-slate-900 dark:text-white">{point.label}</div>
                          <div className="mt-1 text-slate-600 dark:text-slate-300">{formatValue(point.value)}</div>
                        </div>
                      ),
                    });
                  }}
                  onMouseMove={(e) => setTip((t) => ({ ...t, x: e.clientX, y: e.clientY }))}
                  onMouseLeave={() => {
                    setHoverIndex(null);
                    setTip({ x: 0, y: 0, content: null });
                  }}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? '18' : '11'}
                  fill={stroke}
                  opacity={isDim ? 0.06 : 0.15}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(data || []).map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-slate-50 px-3 py-2 transition hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-900/60"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatValue(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PieChart = ({ data = [] }) => {
  const safeData = Array.isArray(data) ? data : [];
  const total = safeData.reduce((sum, item) => sum + (item.value || 0), 0) || 1;

  const radius = 76;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  const [hoverLabel, setHoverLabel] = useState(null);
  const [tip, setTip] = useState({ x: 0, y: 0, content: null });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <div className="mx-auto relative">
        <Tooltip x={tip.x} y={tip.y}>
          {tip.content}
        </Tooltip>

        <svg viewBox="0 0 220 220" className="h-56 w-56 -rotate-90">
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="22"
            className="text-slate-200 dark:text-slate-800"
          />

          {safeData.map((item) => {
            const portion = (item.value || 0) / total;
            const length = portion * circumference;

            const circle = (
              <circle
                key={item.label}
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="22"
                strokeLinecap="round"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-currentOffset}
                style={{
                  opacity: hoverLabel === null || hoverLabel === item.label ? 1 : 0.55,
                  transition: 'opacity 180ms ease, filter 180ms ease',
                  filter: hoverLabel === item.label ? 'saturate(1.2)' : 'saturate(1)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  setHoverLabel(item.label);
                  setTip({
                    x: e.clientX,
                    y: e.clientY,
                    content: (
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.label}
                          </div>
                        </div>
                        <div className="mt-1 text-slate-600 dark:text-slate-300">
                          {formatValue(item.value)}
                        </div>
                      </div>
                    ),
                  });
                }}
                onMouseLeave={() => {
                  setHoverLabel(null);
                  setTip({ x: 0, y: 0, content: null });
                }}
              />
            );

            currentOffset += length;
            return circle;
          })}
        </svg>
      </div>

      <div className="grid flex-1 gap-3">
        {safeData.map((item) => {
          const percentage = Math.round(((item.value || 0) / total) * 100);
          const isActive = hoverLabel === item.label;

          return (
            <div
              key={item.label}
              className={[
                'flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/80',
                'transition hover:bg-white dark:hover:bg-slate-900/60',
              ].join(' ')}
              onMouseEnter={() => setHoverLabel(item.label)}
              onMouseLeave={() => {
                setHoverLabel(null);
                setTip({ x: 0, y: 0, content: null });
              }}
              style={{ opacity: isActive ? 1 : hoverLabel === null ? 1 : 0.65 }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {percentage}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
