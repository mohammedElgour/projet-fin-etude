import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Download, FileText, Medal, TrendingDown, TrendingUp } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useStagiaireData } from '../hooks/useStagiaireData';
import { stagiaireApi } from '../services/api';
import { downloadNotesPdf } from '../lib/studentPortalPdf';
import { GradeCharts } from '../components/stagiaire/GradeCharts';
import GradesTable from '../components/stagiaire/GradesTable';
import PerformanceBars from '../components/stagiaire/PerformanceBars';
import { KpiCard, LoadingPanel, PageShell, PortalCard } from '../components/stagiaire/StudentPortalCards';
import { formatGradeLabel, getGradeSummary, getStudentInfo, normalizeStudentNotes } from '../components/stagiaire/studentPortalUtils';

const StagiaireNotesPage = () => {
  const { user } = useAuth();
  const { warning, error: notifyError, success } = useToast();
  const { notes, loading, error, transcriptSummary } = useStagiaireData();
  const [isDownloading, setIsDownloading] = useState(false);
  const student = useMemo(() => getStudentInfo(user), [user]);
  const normalizedNotes = useMemo(() => normalizeStudentNotes(notes), [notes]);
  const summary = useMemo(() => getGradeSummary(normalizedNotes), [normalizedNotes]);
  const transcriptReady = transcriptSummary.transcriptAvailable;
  const remainingModulesCount = transcriptSummary.nonValidatedModulesCount;

  const transcriptReason = useMemo(() => {
    if (transcriptReady) {
      return 'Releve pret a telecharger';
    }

    if (!transcriptSummary.totalModulesCount) {
      return 'Aucun module affecte a votre filiere.';
    }

    if (!transcriptSummary.validatedModulesCount) {
      return 'Aucune note validee pour le moment.';
    }

    return `${remainingModulesCount} module(s) en attente de validation`;
  }, [remainingModulesCount, transcriptReady, transcriptSummary.totalModulesCount, transcriptSummary.validatedModulesCount]);

  const handleDownloadTranscript = async () => {
    if (!transcriptReady || isDownloading) {
      warning('Telechargement indisponible', transcriptReason);
      return;
    }

    setIsDownloading(true);

    try {
      const transcript = await stagiaireApi.transcript();
      const downloaded = downloadNotesPdf(transcript);

      if (downloaded) {
        success('Releve genere', 'Votre releve de notes a ete prepare pour le telechargement.');
      } else {
        warning('Telechargement indisponible', transcriptReason);
      }
    } catch (downloadError) {
      console.error(downloadError);
      const message = downloadError?.response?.data?.message || transcriptReason;

      if (downloadError?.response?.status === 422) {
        warning('Telechargement indisponible', message);
      } else {
        notifyError('Telechargement impossible', message);
      }
    } finally {
      setIsDownloading(false);
    }
  };

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
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {student.name} - {student.group} - {student.filiere}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                transcriptReady
                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {transcriptReady ? 'Releve pret a telecharger' : `${remainingModulesCount} module(s) en attente de validation`}
            </span>
            {!transcriptReady ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">{transcriptReason}</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadTranscript}
          disabled={!transcriptReady || isDownloading}
          title={transcriptReady ? 'Telecharger le releve de notes PDF' : transcriptReason}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-300 ${
            transcriptReady && !isDownloading
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg'
              : 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Download className="h-4 w-4" />
          {isDownloading ? 'Generation...' : 'Telecharger le releve de notes PDF'}
        </button>
      </PortalCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          value={formatGradeLabel(summary.average)}
          label="General Average"
          helper={summary.hasApprovedGrades ? 'Moyenne des modules valides' : 'Aucune note validee'}
          accent="bg-sky-600"
          progress={summary.hasApprovedGrades ? (summary.average / 20) * 100 : undefined}
        />
        <KpiCard
          icon={Award}
          value={formatGradeLabel(summary.highest)}
          label="Highest Grade"
          helper={summary.hasApprovedGrades ? 'Meilleur resultat' : 'En attente'}
          accent="bg-emerald-600"
          progress={summary.hasApprovedGrades ? (summary.highest / 20) * 100 : undefined}
        />
        <KpiCard
          icon={TrendingDown}
          value={formatGradeLabel(summary.lowest)}
          label="Lowest Grade"
          helper={summary.hasApprovedGrades ? 'Module a renforcer' : 'En attente'}
          accent="bg-amber-500"
          progress={summary.hasApprovedGrades ? (summary.lowest / 20) * 100 : undefined}
        />
        <KpiCard
          icon={Medal}
          value={summary.hasApprovedGrades ? summary.passed : 'En attente'}
          label="Modules Passed"
          helper={summary.hasApprovedGrades ? 'Modules valides' : 'Aucune note validee'}
          accent="bg-violet-600"
          progress={summary.hasApprovedGrades && summary.totalModules ? (summary.passed / summary.totalModules) * 100 : undefined}
        />
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
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Les modules de votre filiere apparaitront ici des leur association au dossier stagiaire.
          </p>
        </PortalCard>
      )}
    </PageShell>
  );
};

export default StagiaireNotesPage;
