import React from 'react';
import clsx from 'clsx';
import { PortalCard } from './StudentPortalCards';

const PerformanceBars = ({ notes }) => (
  <PortalCard>
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Performance par module</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Progression basee sur la note finale.</p>
    </div>
    <div className="space-y-4">
      {notes.filter((note) => note.finalGrade !== null).length ? (
        notes
          .filter((note) => note.finalGrade !== null)
          .map((note) => {
            const percentage = Math.min(Math.max(((note.finalGrade || 0) / 20) * 100, 0), 100);

            return (
              <div key={note.id}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{note.moduleName}</p>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{Math.round(percentage)}%</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-700',
                      note.passed ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-rose-500 to-orange-500'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          Aucune note validee pour generer un suivi visuel.
        </div>
      )}
    </div>
  </PortalCard>
);

export default PerformanceBars;
