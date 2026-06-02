import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bell,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CircleGauge,
  FileText,
  GraduationCap,
  Layers3,
  Lightbulb,
  MessageSquareMore,
  Radar,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import { useStagiaireData } from '../hooks/useStagiaireData';
import { PageShell, LoadingPanel, PortalCard } from '../components/stagiaire/StudentPortalCards';
import { getGradeSummary, getStudentInfo, normalizeStudentNotes } from '../components/stagiaire/studentPortalUtils';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatGrade = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(number % 1 === 0 ? 0 : 1) : '0';
};

const formatRelativeTime = (value) => {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 1) {
    return 'Just now';
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getPerformanceBadge = (grade) => {
  if (grade >= 17) {
    return { label: 'Exceptional', tone: 'from-emerald-500 to-teal-500', icon: Sparkles };
  }

  if (grade >= 15) {
    return { label: 'Excellent', tone: 'from-sky-500 to-indigo-500', icon: Award };
  }

  if (grade >= 12) {
    return { label: 'Strong', tone: 'from-violet-500 to-fuchsia-500', icon: BadgeCheck };
  }

  return { label: 'Building', tone: 'from-amber-500 to-orange-500', icon: Lightbulb };
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const SoftCard = ({ className, children }) => (
  <PortalCard
    className={clsx(
      'border-white/70 bg-white/85 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.24)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70',
      className
    )}
  >
    {children}
  </PortalCard>
);

const MetricCard = ({ icon: Icon, label, value, helper, progress, gradient, note }) => (
  <motion.div variants={itemVariants}>
    <SoftCard className="group h-full overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
          {helper ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p> : null}
        </div>
        <div
          className={clsx(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105',
            gradient
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {typeof progress === 'number' ? (
        <div className="mt-6">
          <div className="h-2 rounded-full bg-slate-100/90 dark:bg-slate-800/90">
            <div
              className={clsx('h-full rounded-full transition-all duration-700', gradient)}
              style={{ width: `${clamp(progress, 0, 100)}%` }}
            />
          </div>
          {note ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{note}</p> : null}
        </div>
      ) : null}
    </SoftCard>
  </motion.div>
);

const ProgressRing = ({ value, label, caption, size = 124 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamp(value, 0, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#dashboardRingGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
          <defs>
            <linearGradient id="dashboardRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{Math.round(clamp(value, 0, 100))}%</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">{caption}</p>
      <div className="mt-4 h-1.5 w-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-teal-500" />
    </div>
  );
};

const ActionCard = ({ icon: Icon, title, description, to, accent }) => (
  <Link to={to} className="group block h-full">
    <SoftCard className="h-full overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_70px_-34px_rgba(15,23,42,0.4)]">
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <div
            className={clsx(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105',
              accent
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-900 dark:group-hover:text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
    </SoftCard>
  </Link>
);

const ActivityItem = ({ icon: Icon, title, description, time, tint }) => (
  <li className="relative flex gap-4 pb-6 last:pb-0">
    <div className={clsx('relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg', tint)}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{time}</span>
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <span className="absolute left-[22px] top-11 h-full w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent dark:from-slate-700 dark:via-slate-700" />
  </li>
);

const StagiaireDashboard = () => {
  const { user } = useAuth();
  const { notes, announcements, recommendation, loading, error } = useStagiaireData();

  const student = useMemo(() => getStudentInfo(user), [user]);
  const normalizedNotes = useMemo(() => normalizeStudentNotes(notes), [notes]);
  const summary = useMemo(() => getGradeSummary(normalizedNotes), [normalizedNotes]);

  const { bestNote, bestModuleLabel } = useMemo(() => {
    const sorted = [...normalizedNotes].sort((a, b) => (b.finalGrade ?? -1) - (a.finalGrade ?? -1));
    const best = sorted[0] || null;

    return {
      bestNote: best,
      bestModuleLabel: best?.moduleName || 'Module',
    };
  }, [normalizedNotes]);

  const progressMetrics = useMemo(() => {
    const totalModules = summary.totalModules || 0;
    const validationPercentage = totalModules ? Math.round((summary.passed / totalModules) * 100) : 0;
    const averageProgress = Math.round((summary.average / 20) * 100);
    const successRate = totalModules
      ? Math.round(((summary.average / 20) * 0.6 + (summary.passed / totalModules) * 0.4) * 100)
      : 0;

    return {
      totalModules,
      validationPercentage,
      averageProgress,
      successRate,
      completedModules: summary.passed,
    };
  }, [summary.average, summary.passed, summary.totalModules]);

  const latestAnnouncement = useMemo(() => announcements[0] || null, [announcements]);

  const timelineItems = useMemo(() => {
    const items = [];

    const latestGradeNote = [...normalizedNotes]
      .filter((note) => note.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (latestGradeNote) {
      items.push({
        id: `grade-${latestGradeNote.id}`,
        icon: Award,
        title: 'New grade added',
        description: `${latestGradeNote.moduleName} is now at ${formatGrade(latestGradeNote.finalGrade)}/20.`,
        time: formatRelativeTime(latestGradeNote.created_at),
        tint: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      });
    }

    const validatedNote = [...normalizedNotes]
      .filter((note) => note.passed)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];

    if (validatedNote) {
      items.push({
        id: `validated-${validatedNote.id}`,
        icon: BadgeCheck,
        title: 'Module validated',
        description: `${validatedNote.moduleName} cleared the validation threshold.`,
        time: formatRelativeTime(validatedNote.created_at),
        tint: 'bg-gradient-to-br from-sky-500 to-indigo-500',
      });
    }

    if (latestAnnouncement) {
      items.push({
        id: `announcement-${latestAnnouncement.id}`,
        icon: Bell,
        title: 'Notification received',
        description: latestAnnouncement.title || latestAnnouncement.message || 'A new notification is waiting for you.',
        time: formatRelativeTime(latestAnnouncement.created_at),
        tint: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
      });
    }

    if (recommendation) {
      items.push({
        id: 'recommendation',
        icon: Sparkles,
        title: 'Academic insight updated',
        description: recommendation.recommendation || 'Your recommendation panel has been updated.',
        time: 'Now',
        tint: 'bg-gradient-to-br from-amber-500 to-orange-500',
      });
    }

    return items.slice(0, 4);
  }, [latestAnnouncement, normalizedNotes, recommendation]);

  const motivation = useMemo(() => {
    if (summary.average >= 15) {
      return {
        title: 'Excellent work!',
        description: 'Your average is above 15/20. You are building a very strong academic profile.',
        tone: 'from-emerald-500 via-teal-500 to-cyan-500',
        icon: Sparkles,
      };
    }

    if (progressMetrics.completedModules >= 2) {
      return {
        title: 'Keep going!',
        description: `You validated ${progressMetrics.completedModules} modules this semester. Keep the momentum alive.`,
        tone: 'from-sky-500 via-indigo-500 to-violet-500',
        icon: Zap,
      };
    }

    return {
      title: 'Your progress starts here',
      description: 'Use this dashboard to track grades, validation progress, and daily academic momentum.',
      tone: 'from-slate-700 via-slate-900 to-black',
      icon: Lightbulb,
    };
  }, [progressMetrics.completedModules, summary.average]);

  const academicYear = student.academicYear;
  const badge = bestNote ? getPerformanceBadge(bestNote.finalGrade || 0) : getPerformanceBadge(summary.average || 0);
  const BadgeIcon = badge.icon;
  const MotivationIcon = motivation.icon;

  if (loading) {
    return <LoadingPanel label="Loading your dashboard..." />;
  }

  return (
    <PageShell>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-[36px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.18),_transparent_32%),linear-gradient(135deg,#0f172a_0%,#111827_40%,#1e3a8a_100%)] px-6 py-7 text-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.7)] sm:px-8 sm:py-8"
      >
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100 backdrop-blur">
              <GraduationCap className="h-4 w-4" />
              Student Dashboard
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-100/80">Welcome back</p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Welcome back, {student.name}{' '}
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: [0, 12, 0, 12, 0], y: [0, -2, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-block origin-bottom-left"
                >
                  👋
                </motion.span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Your academic progress is now organised in a premium control centre with live insights, quick access actions, and a clear path to success.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur">
                <BookOpen className="h-4 w-4 text-sky-200" />
                Filiere: {student.filiere}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur">
                <Layers3 className="h-4 w-4 text-cyan-200" />
                Groupe: {student.group}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur">
                <CalendarDays className="h-4 w-4 text-indigo-200" />
                Annee: {academicYear}
              </span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <div className="rounded-[30px] border border-white/15 bg-white/10 p-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">Academic focus</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Every module counts</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 text-white ring-1 ring-white/15">
                  <Radar className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/75">Modules</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{summary.totalModules}</p>
                  <p className="mt-1 text-sm text-sky-100/80">Tracked from validated grades</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/75">Average</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{formatGrade(summary.average)}/20</p>
                  <p className="mt-1 text-sm text-sky-100/80">Real-time academic signal</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-black/15 p-4 ring-1 ring-white/10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/80">Performance badge</p>
                  <p className="mt-1 text-lg font-semibold text-white">{badge.label}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/15">
                  <BadgeIcon className="h-4 w-4" />
                  {bestNote ? `${formatGrade(bestNote.finalGrade)}/20` : `${formatGrade(summary.average)}/20`}
                </span>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-4 -top-6 hidden h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl lg:block" />
            <div className="pointer-events-none absolute -bottom-6 left-16 hidden h-28 w-28 rounded-full bg-indigo-300/20 blur-2xl lg:block" />
          </motion.div>
        </div>
      </motion.section>

      <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BookOpenCheck}
          label="Total Modules"
          value={summary.totalModules}
          helper="Modules with recorded grades"
          gradient="bg-gradient-to-br from-sky-500 to-blue-600"
          progress={summary.totalModules ? 100 : 0}
          note="Your complete academic surface"
        />
        <MetricCard
          icon={TrendingUp}
          label="Moyenne Generale"
          value={`${formatGrade(summary.average)}/20`}
          helper="Current semester average"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          progress={(summary.average / 20) * 100}
          note="Tracks overall academic momentum"
        />
        <MetricCard
          icon={BadgeCheck}
          label="Modules Valides"
          value={progressMetrics.completedModules}
          helper="Validated modules"
          gradient="bg-gradient-to-br from-violet-500 to-fuchsia-500"
          progress={progressMetrics.validationPercentage}
          note={`${progressMetrics.validationPercentage}% validation rate`}
        />
        <MetricCard
          icon={Bell}
          label="Notifications"
          value={announcements.length}
          helper="Unread and recent notifications"
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          progress={announcements.length ? ((announcements.length - announcements.filter((item) => !item.is_read).length) / announcements.length) * 100 : 0}
          note={announcements.length ? `${announcements.filter((item) => !item.is_read).length} unread` : 'No notifications yet'}
        />
      </motion.div>

      <motion.section variants={sectionVariants} initial="hidden" animate="visible" className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div variants={itemVariants} className="space-y-6">
          <SoftCard className="overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quick academic overview</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Academic Progress Panel</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  A clean snapshot of how your semester is evolving without exposing timetable widgets on the dashboard.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                <Target className="h-4 w-4 text-sky-500" />
                Semester focus
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Average Grade Progress</p>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{formatGrade(summary.average)}/20</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${progressMetrics.averageProgress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Validation Percentage</p>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{progressMetrics.validationPercentage}%</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                      style={{ width: `${progressMetrics.validationPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Modules Completed</p>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{progressMetrics.completedModules}/{summary.totalModules}</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
                      style={{ width: `${progressMetrics.validationPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Success Rate</p>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{progressMetrics.successRate}%</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                      style={{ width: `${progressMetrics.successRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <ProgressRing
                  value={progressMetrics.averageProgress}
                  label="Average"
                  caption="Average grade progress"
                />
                <ProgressRing
                  value={progressMetrics.validationPercentage}
                  label="Validated"
                  caption="Validation percentage"
                />
              </div>
            </div>
          </SoftCard>

          <SoftCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Best performance</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Best Performance Card</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                <Award className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <BadgeIcon className="h-4 w-4" />
                  {badge.label}
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Best module</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{bestModuleLabel}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                    <FileText className="h-4 w-4 text-sky-500" />
                    Grade
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                    {bestNote ? `${formatGrade(bestNote.finalGrade)} / 20` : `${formatGrade(summary.average)} / 20`}
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {bestNote
                    ? `Your strongest result is ${bestModuleLabel}. Keep pushing this level to lift the rest of your modules.`
                    : 'As soon as grades are available, your strongest module will appear here.'}
                </p>
              </div>

              <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.5)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Performance snapshot</p>
                    <p className="mt-2 text-2xl font-semibold">{formatGrade(summary.average)}/20</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <CircleGauge className="h-7 w-7 text-cyan-200" />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Modules validated</span>
                    <span className="font-semibold text-white">{progressMetrics.completedModules}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Success rate</span>
                    <span className="font-semibold text-white">{progressMetrics.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Validation rate</span>
                    <span className="font-semibold text-white">{progressMetrics.validationPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </SoftCard>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <SoftCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Recent activity</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Activity Timeline</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                <MessageSquareMore className="h-5 w-5" />
              </div>
            </div>

            <ul className="relative mt-6">
              {timelineItems.length ? (
                timelineItems.map((item) => <ActivityItem key={item.id} {...item} />)
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  No recent activity yet. Your latest grades and notifications will appear here.
                </li>
              )}
            </ul>
          </SoftCard>

          <SoftCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quick actions</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Quick Access</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                <Zap className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ActionCard
                icon={BookOpenCheck}
                title="View Notes"
                description="Open your complete grade history and module performance view."
                to="/dashboard/stagiaire/notes"
                accent="bg-gradient-to-br from-sky-500 to-blue-600"
              />
              <ActionCard
                icon={UserRound}
                title="View Profile"
                description="Check your academic identity and account information."
                to="/dashboard/stagiaire/profile"
                accent="bg-gradient-to-br from-violet-500 to-fuchsia-500"
              />
              <ActionCard
                icon={Bell}
                title="Notifications"
                description="Review unread updates and academic announcements."
                to="/dashboard/stagiaire/announcements"
                accent="bg-gradient-to-br from-amber-500 to-orange-500"
              />
              <ActionCard
                icon={TrendingUp}
                title="Academic Results"
                description="Jump back into your results and validation history."
                to="/dashboard/stagiaire/notes"
                accent="bg-gradient-to-br from-emerald-500 to-teal-500"
              />
            </div>
          </SoftCard>

          <SoftCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Motivation</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Motivation section</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg">
                <Lightbulb className="h-5 w-5" />
              </div>
            </div>

            <div className={clsx('mt-6 rounded-[28px] bg-gradient-to-br p-6 text-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.55)]', motivation.tone)}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">Academic boost</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight">{motivation.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/90">{motivation.description}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/15">
                  <MotivationIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </SoftCard>
        </motion.div>
      </motion.section>
    </PageShell>
  );
};

export default StagiaireDashboard;
