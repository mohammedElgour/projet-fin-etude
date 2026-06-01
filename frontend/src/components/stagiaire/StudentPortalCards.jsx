import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export const PortalCard = ({ children, className }) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className={clsx(
      'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/75',
      className
    )}
  >
    {children}
  </motion.section>
);

export const KpiCard = ({ icon: Icon, value, label, helper, accent = 'bg-sky-500', progress }) => (
  <PortalCard className="group">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
        {helper ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
      </div>
      <div className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-105', accent)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {typeof progress === 'number' ? (
      <div className="mt-5">
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className={clsx('h-full rounded-full transition-all duration-700', accent)} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
        </div>
      </div>
    ) : null}
  </PortalCard>
);

export const PageShell = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.28 }}
    className="space-y-6"
  >
    {children}
  </motion.div>
);

export const LoadingPanel = ({ label = 'Chargement...' }) => (
  <div className="space-y-4">
    <div className="h-28 animate-pulse rounded-2xl bg-white/80 shadow-sm dark:bg-slate-900/70" />
    <div className="grid gap-4 md:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-32 animate-pulse rounded-2xl bg-white/80 shadow-sm dark:bg-slate-900/70" />
      ))}
    </div>
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
  </div>
);
