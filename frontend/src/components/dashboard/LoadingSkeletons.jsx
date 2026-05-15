import React from 'react';

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 shadow-sm dark:border-white/10 dark:bg-slate-900/30',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent dark:before:via-slate-700',
        className,
      ].join(' ')}
    >
      <div className="h-20 w-full" />
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export function SkeletonLine({ className = '' }) {
  return (
    <div
      className={[
        'h-28 w-full rounded-2xl border border-slate-200/70 bg-white/60 dark:border-white/10 dark:bg-slate-900/30 relative overflow-hidden',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent dark:before:via-slate-700',
        className,
      ].join(' ')}
    >
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
