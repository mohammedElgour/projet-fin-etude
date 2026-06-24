import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Clock3, XCircle } from 'lucide-react';

const pageSize = 8;

const formatGrade = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(number % 1 === 0 ? 0 : 1)}/20` : '-';
};

const getStatusBadge = (note) => {
  if (note?.moduleStatus === 'approved') {
    return {
      label: 'Valide',
      className:
        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
      icon: CheckCircle2,
    };
  }

  if (note?.moduleStatus === 'rejected') {
    return {
      label: 'Non valide',
      className:
        'bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
      icon: XCircle,
    };
  }

  if (note?.moduleStatus === 'submitted') {
    return {
      label: 'En cours',
      className:
        'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
      icon: Clock3,
    };
  }

  return {
    label: 'Pas encore evalue',
    className:
      'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    icon: CircleDashed,
  };
};

const GradesTable = ({ notes }) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(Math.ceil(notes.length / pageSize), 1);
  const visibleRows = useMemo(() => notes.slice((page - 1) * pageSize, page * pageSize), [notes, page]);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/75">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Modules et notes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Details des controles, EFM et validation.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {notes.length} module(s)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              {['Module', 'Controle 1', 'Controle 2', 'Controle 3', 'EFM', 'Final Grade', 'Status'].map((header) => (
                <th key={header} className="px-5 py-4 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {visibleRows.map((note) => (
              <tr key={note.id} className="text-slate-700 transition-colors duration-200 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900/70">
                <td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{note.moduleName}</td>
                <td className="px-5 py-4">{formatGrade(note.controle1)}</td>
                <td className="px-5 py-4">{formatGrade(note.controle2)}</td>
                <td className="px-5 py-4">{formatGrade(note.controle3)}</td>
                <td className="px-5 py-4">{formatGrade(note.efm)}</td>
                <td className="px-5 py-4">
                  <span className="font-semibold text-slate-950 dark:text-white">{formatGrade(note.finalGrade)}</span>
                </td>
                <td className="px-5 py-4">
                  {(() => {
                    const status = getStatusBadge(note);
                    const StatusIcon = status.icon;

                    return (
                      <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', status.className)}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notes.length > pageSize ? (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-white/10">
          <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(value - 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900"
              disabled={page === 1}
              aria-label="Page precedente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900"
              disabled={page === totalPages}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default GradesTable;
