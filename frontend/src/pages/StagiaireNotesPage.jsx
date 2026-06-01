import React, { useMemo } from 'react';
import { Award, Download, FileText, Medal, TrendingDown, TrendingUp } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useStagiaireData } from '../hooks/useStagiaireData';
import { downloadNotesPdf } from '../lib/studentPortalPdf';
import { GradeCharts } from '../components/stagiaire/GradeCharts';
import GradesTable from '../components/stagiaire/GradesTable';
import PerformanceBars from '../components/stagiaire/PerformanceBars';
import { KpiCard, LoadingPanel, PageShell, PortalCard } from '../components/stagiaire/StudentPortalCards';
import { getGradeSummary, getStudentInfo, normalizeStudentNotes } from '../components/stagiaire/studentPortalUtils';

const StagiaireNotesPage = () => {
  const { user } = useAuth();
  const { notes, loading, error } = useStagiaireData();
  const student = useMemo(() => getStudentInfo(user), [user]);
  const normalizedNotes = useMemo(() => normalizeStudentNotes(notes), [notes]);
  const summary = useMemo(() => getGradeSummary(normalizedNotes), [normalizedNotes]);

  if (loading) {
    return <LoadingPanel label="Chargement des notes..." />;
  }

  return (
    <PageShell>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <PortalCard className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400">Notes</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Releve de notes et performance</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{student.name} - {student.group} - {student.filiere}</p>
        </div>
        <button
          type="button"
          onClick={() => downloadNotesPdf({ student, notes: normalizedNotes, average: summary.average })}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg"
        >
          <Download className="h-4 w-4" />
          Telecharger le releve de notes PDF
        </button>
      </PortalCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={TrendingUp} value={`${summary.average}/20`} label="General Average" helper="Moyenne de tous les modules" accent="bg-sky-600" progress={(summary.average / 20) * 100} />
        <KpiCard icon={Award} value={`${summary.highest}/20`} label="Highest Grade" helper="Meilleur resultat" accent="bg-emerald-600" progress={(summary.highest / 20) * 100} />
        <KpiCard icon={TrendingDown} value={`${summary.lowest}/20`} label="Lowest Grade" helper="Module a renforcer" accent="bg-amber-500" progress={(summary.lowest / 20) * 100} />
        <KpiCard icon={Medal} value={summary.passed} label="Modules Passed" helper="Modules valides" accent="bg-violet-600" progress={summary.totalModules ? (summary.passed / summary.totalModules) * 100 : 0} />
      </div>

      {normalizedNotes.length ? (
        <>
          <GradesTable notes={normalizedNotes} />
          <GradeCharts notes={normalizedNotes} />
          <PerformanceBars notes={normalizedNotes} />
        </>
      ) : (
        <PortalCard className="py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Aucune note disponible</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Les notes validees apparaitront ici des leur publication.</p>
        </PortalCard>
      )}
    </PageShell>
  );
};

export default StagiaireNotesPage;
