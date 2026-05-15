import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

function formatPercentChange(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return { text: '0%', dir: 'up', abs: 0 };
  const abs = Math.abs(n);
  const text = `${abs.toFixed(1)}%`;
  return { text, dir: n >= 0 ? 'up' : 'down', abs };
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'from-sky-500 to-cyan-500',
  change = 0,
  changeLabel,
}) {
  const { text: changeText, dir } = formatPercentChange(change);
  const isUp = dir === 'up';

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            <div
              className={`mb-1 flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${
                isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {isUp ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
              <span>{changeLabel ?? changeText}</span>
            </div>
          </div>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-white shadow`}>
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
      </div>
    </div>
  );
}
