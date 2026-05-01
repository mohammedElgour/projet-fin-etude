import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InfoCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/85">
    <div className="flex items-center gap-3">
      {Icon ? (
        <div className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{value || '-'}</p>
      </div>
    </div>
  </div>
);

export const DetailLoading = () => (
  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <div className="space-y-4">
      <div className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/60" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
        ))}
      </div>
    </div>
  </div>
);

export default function EntityDetailScaffold({
  backTo,
  backLabel,
  title,
  description,
  badge,
  status,
  children,
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              {badge}
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>
          </div>

          {status ? (
            <div className="flex flex-wrap gap-3">
              {status}
            </div>
          ) : null}
        </div>
      </section>

      {children}
    </div>
  );
}
