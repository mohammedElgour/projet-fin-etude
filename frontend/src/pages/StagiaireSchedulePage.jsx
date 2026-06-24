import React, { useMemo, useState } from 'react';
import { CalendarDays, Download, ExternalLink, FileDown, Maximize2, Minus, Plus, X } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useStagiaireData } from '../hooks/useStagiaireData';
import { downloadTimetableImagePdf } from '../lib/studentPortalPdf';
import { LoadingPanel, PageShell, PortalCard } from '../components/stagiaire/StudentPortalCards';
import { getStudentInfo } from '../components/stagiaire/studentPortalUtils';

const clampZoom = (value) => Math.min(Math.max(value, 0.6), 2.5);

const TimetableImage = ({ timetable, zoom }) => (
  <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
    <img
      src={timetable.image_url}
      alt={timetable.title || 'Emploi du temps'}
      className="mx-auto h-auto origin-top transition-transform duration-200"
      style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
    />
  </div>
);

const StagiaireSchedulePage = () => {
  const { user } = useAuth();
  const { emploiDuTemps, loading, error } = useStagiaireData();
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const studentFromUser = useMemo(() => getStudentInfo(user), [user]);
  const timetable = emploiDuTemps?.timetable || null;
  const student = {
    ...studentFromUser,
    group: emploiDuTemps?.group || studentFromUser.group,
    filiere: emploiDuTemps?.filiere || studentFromUser.filiere,
  };

  const handlePdfDownload = async () => {
    if (!timetable?.image_url || pdfLoading) {
      return;
    }

    setPdfLoading(true);
    setPdfError('');
    try {
      await downloadTimetableImagePdf({ student, timetable });
    } catch (error) {
      console.error(error);
      setPdfError(error?.message || 'Impossible de generer le PDF de l emploi du temps.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return <LoadingPanel label="Chargement de l'emploi du temps..." />;
  }

  return (
    <PageShell>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {pdfError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {pdfError}
        </div>
      ) : null}

      <PortalCard className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400">Planning</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            {timetable?.title || 'Emploi du temps'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Groupe: {student.group} · Filiere: {student.filiere}
          </p>
        </div>

        {timetable ? (
          <button
            type="button"
            onClick={handlePdfDownload}
            disabled={pdfLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FileDown className="h-4 w-4" />
            {pdfLoading ? 'Generation...' : "Telecharger l'emploi du temps PDF"}
          </button>
        ) : null}
      </PortalCard>

      {timetable ? (
        <PortalCard className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((value) => clampZoom(value - 0.15))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-16 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((value) => clampZoom(value + 0.15))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                <Maximize2 className="h-4 w-4" />
                Plein ecran
              </button>
              <a
                href={timetable.image_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                <ExternalLink className="h-4 w-4" />
                Nouvel onglet
              </a>
              <a
                href={timetable.image_url}
                download
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                <Download className="h-4 w-4" />
                Image
              </a>
            </div>
          </div>

          <TimetableImage timetable={timetable} zoom={zoom} />
        </PortalCard>
      ) : (
        <PortalCard className="py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <CalendarDays className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">
            Aucun emploi du temps disponible pour votre groupe.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Le planning publie par l'administration apparaitra ici des qu'il sera associe a votre groupe.
          </p>
        </PortalCard>
      )}

      {fullscreen && timetable ? (
        <div className="fixed inset-0 z-50 bg-slate-950/95 p-4">
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="h-full overflow-auto pt-14">
            <img
              src={timetable.image_url}
              alt={timetable.title || 'Emploi du temps'}
              className="mx-auto h-auto max-w-none"
              style={{ width: `${zoom * 100}%` }}
            />
          </div>
        </div>
      ) : null}
    </PageShell>
  );
};

export default StagiaireSchedulePage;
