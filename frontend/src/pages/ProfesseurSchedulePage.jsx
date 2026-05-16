import React from 'react';
import TimetableGrid from '../components/timetable/TimetableGrid';
import { useProfesseurData } from '../hooks/useProfesseurData';

const ProfesseurSchedulePage = () => {
  const { timetableItems, loading, error } = useProfesseurData();

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
          Chargement des emplois du temps...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <TimetableGrid
          items={timetableItems}
          showAudience
          emptyTitle="Aucun emploi du temps assigne"
          emptyDescription="Les emplois du temps que l'administration partage avec vous apparaitront ici."
        />
      ) : null}
    </div>
  );
};

export default ProfesseurSchedulePage;
