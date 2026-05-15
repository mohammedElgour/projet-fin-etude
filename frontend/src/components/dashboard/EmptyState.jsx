import React from 'react';

export default function EmptyState({
  title = 'Aucune donnée',
  description = 'Les informations n’ont pas encore été chargées.',
  action,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/20">
      <div className="mx-auto max-w-md">
        <div className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </div>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
