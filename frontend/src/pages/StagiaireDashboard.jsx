import React, { useMemo } from 'react';
import {
  Award,
  BellRing,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useStagiaireData } from '../hooks/useStagiaireData';
import { PageShell, KpiCard, LoadingPanel, PortalCard } from '../components/stagiaire/StudentPortalCards';
import { getGradeSummary, getStudentInfo, normalizeScheduleRows, normalizeStudentNotes } from '../components/stagiaire/studentPortalUtils';
import WeeklySchedule from '../components/stagiaire/WeeklySchedule';
import PerformanceBars from '../components/stagiaire/PerformanceBars';

const StagiaireDashboard = () => {
  const { user } = useAuth();
  const { notes, schedule, announcements, loading, error } = useStagiaireData();

  const student = useMemo(() => getStudentInfo(user), [user]);
  const normalizedNotes = useMemo(() => normalizeStudentNotes(notes), [notes]);
  const scheduleRows = useMemo(() => normalizeScheduleRows(schedule).slice(0, 8), [schedule]);
  const summary = useMemo(() => getGradeSummary(normalizedNotes), [normalizedNotes]);
  const unreadCount = useMemo(() => announcements.filter((item) => !item.is_read).length, [announcements]);

  if (loading) {
    return <LoadingPanel label="Chargement de votre tableau de bord..." />;
  }

  return (
    <PageShell>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <PortalCard className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-100">Portail stagiaire</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {student.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-50 sm:text-base">
              {student.filiere} - {student.group}
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm backdrop-blur sm:grid-cols-2">
            <span>Annee: <strong>{student.academicYear}</strong></span>
            <span>Modules: <strong>{summary.totalModules}</strong></span>
            <span>Moyenne: <strong>{summary.average}/20</strong></span>
            <span>Notifications: <strong>{unreadCount}</strong></span>
          </div>
        </div>
      </PortalCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={GraduationCap} value={summary.totalModules} label="Total Modules" helper="Modules avec notes validees" accent="bg-sky-600" progress={100} />
        <KpiCard icon={TrendingUp} value={`${summary.average}/20`} label="Average Grade" helper="Moyenne generale" accent="bg-emerald-600" progress={(summary.average / 20) * 100} />
        <KpiCard icon={CheckCircle2} value={summary.passed} label="Modules Validated" helper="Notes superieures a 10" accent="bg-violet-600" progress={summary.totalModules ? (summary.passed / summary.totalModules) * 100 : 0} />
        <KpiCard icon={BellRing} value={unreadCount} label="Unread Notifications" helper="Messages a consulter" accent="bg-amber-500" progress={announcements.length ? (unreadCount / announcements.length) * 100 : 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Apercu de la semaine</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Vos prochains cours organises par jour.</p>
            </div>
            <Link to="/dashboard/stagiaire/schedule" className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
              Voir tout
            </Link>
          </div>
          <WeeklySchedule rows={scheduleRows} />
        </section>

        <div className="space-y-6">
          <KpiCard icon={Award} value={`${summary.highest}/20`} label="Meilleure note" helper="Votre score le plus eleve" accent="bg-emerald-600" progress={(summary.highest / 20) * 100} />
          <PortalCard>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Actions rapides</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Acces direct aux pages utiles.</p>
              </div>
            </div>
            <div className="grid gap-3">
              <Link to="/dashboard/stagiaire/notes" className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-900">
                <BookOpenCheck className="h-4 w-4 text-sky-600" /> Consulter mes notes
              </Link>
              <Link to="/dashboard/stagiaire/schedule" className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-900">
                <CalendarDays className="h-4 w-4 text-emerald-600" /> Voir l'emploi du temps
              </Link>
            </div>
          </PortalCard>
        </div>
      </div>

      {normalizedNotes.length ? <PerformanceBars notes={normalizedNotes.slice(0, 6)} /> : null}
    </PageShell>
  );
};

export default StagiaireDashboard;
