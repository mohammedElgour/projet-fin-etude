import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookCheck, CalendarRange, ChartSpline, UsersRound, TrendingUp } from 'lucide-react';

import { BarChart, ChartCard, LineChart, PieChart } from '../components/charts/SimpleCharts';
import StatCard from '../components/dashboard/StatCard';
import { useProfesseurData } from '../hooks/useProfesseurData';

import SectionHeader from '../components/dashboard/SectionHeader';
import KpiGrid from '../components/dashboard/KpiGrid';
import { SkeletonCard, SkeletonLine } from '../components/dashboard/LoadingSkeletons';
import EmptyState from '../components/dashboard/EmptyState';

const orderedDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const dayAliases = {
  lun: 'Lundi',
  lundi: 'Lundi',
  mar: 'Mardi',
  mardi: 'Mardi',
  mer: 'Mercredi',
  mercredi: 'Mercredi',
  jeu: 'Jeudi',
  jeudi: 'Jeudi',
  ven: 'Vendredi',
  vendredi: 'Vendredi',
  sam: 'Samedi',
  samedi: 'Samedi',
};

const getStudentStatus = (row) => {
  const grades = [row.cc1, row.cc2, row.cc3, row.efm];
  const hasMissingGrade = grades.some((value) => value === '' || value === null || value === undefined);

  if (hasMissingGrade) {
    return { key: 'incomplete', label: 'Incomplete', moyenne: null };
  }

  const controlsAverage = (Number(row.cc1) + Number(row.cc2) + Number(row.cc3)) / 3;
  const moyenne = (controlsAverage * 0.4) + (Number(row.efm) * 0.6);

  return moyenne >= 10
    ? { key: 'validated', label: 'Valide', moyenne }
    : { key: 'rejected', label: 'Non valide', moyenne };
};

const ProfesseurDashboard = () => {
  const { rows, scheduleItems, selectedModule, error, loading } = useProfesseurData();

  const averageGrade = useMemo(() => {
    const values = (rows || [])
      .map((row) => getStudentStatus(row).moyenne)
      .filter((value) => value !== null && !Number.isNaN(value) && value > 0);

    if (!values.length) return 0;
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  }, [rows]);

  const barData = useMemo(
    () =>
      (rows || [])
        .map((row) => {
          const status = getStudentStatus(row);
          return {
            label: row.name.split(' ').slice(0, 2).join(' '),
            value: status.moyenne,
          };
        })
        .filter((item) => item.value !== null && !Number.isNaN(item.value))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [rows]
  );

  const lineData = useMemo(() => {
    const grouped = (scheduleItems || []).reduce((accumulator, item) => {
      const normalizedDay = dayAliases[String(item.day || '').trim().toLowerCase()] || item.day;
      accumulator[normalizedDay] = (accumulator[normalizedDay] || 0) + 1;
      return accumulator;
    }, {});

    return orderedDays
      .map((day) => ({
        label: day.slice(0, 3),
        value: grouped[day] || 0,
      }))
      .filter((item) => item.value > 0);
  }, [scheduleItems]);

  const pieData = useMemo(() => {
    const counts = (rows || []).reduce(
      (accumulator, row) => {
        const status = getStudentStatus(row);
        accumulator[status.key] = (accumulator[status.key] || 0) + 1;
        return accumulator;
      },
      { validated: 0, rejected: 0, incomplete: 0 }
    );

    return [
      { label: 'Validees', value: counts.validated, color: '#10b981' },
      { label: 'Non validees', value: counts.rejected, color: '#f43f5e' },
      { label: 'Incompletes', value: counts.incomplete, color: '#94a3b8' },
    ].filter((item) => item.value > 0);
  }, [rows]);

  const pendingCount = useMemo(() => {
    return (rows || []).filter((row) => getStudentStatus(row).key === 'incomplete').length;
  }, [rows]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Professeur" title="Espace professeur" description="Chargement de vos indicateurs..." />
        <KpiGrid columns="4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </KpiGrid>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <SectionHeader
          eyebrow="ISTA • Professor"
          title="Tableau de bord"
          description="Suivez la progression, gerez les notes et visualisez l emploi du temps."
          actions={
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/60 px-3 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/30">
              <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Analytics</span>
            </div>
          }
        />

        <KpiGrid columns="4">
          <StatCard
            label="Stagiaires"
            value={(rows || []).length}
            helper="Selon vos filtres actifs"
            accent="from-sky-500 to-cyan-500"
            icon={UsersRound}
          />
          <StatCard
            label="Moyenne de la classe"
            value={`${averageGrade}/20`}
            helper="Basee sur les 4 notes par stagiaire"
            accent="from-violet-500 to-fuchsia-500"
            icon={ChartSpline}
          />
          <StatCard
            label="Creneaux planifies"
            value={(scheduleItems || []).length}
            helper="Emploi du temps courant"
            accent="from-emerald-500 to-teal-500"
            icon={CalendarRange}
          />
          <StatCard
            label="Notes incompletes"
            value={pendingCount}
            helper={selectedModule ? 'Notes encore a completer' : 'Choisissez un module'}
            accent="from-amber-500 to-orange-500"
            icon={BookCheck}
          />
        </KpiGrid>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
          <ChartCard title="Top stagiaires" subtitle="Les meilleures moyennes calculees a partir des 4 notes">
            <BarChart data={barData} color="#f97316" />
          </ChartCard>

          <ChartCard title="Rythme de la semaine" subtitle="Le nombre de creneaux reels par jour pour le groupe selectionne">
            <LineChart data={lineData} stroke="#0ea5e9" fill="rgba(14, 165, 233, 0.14)" />
          </ChartCard>

          <ChartCard title="Progression des notes" subtitle="Repartition entre stagiaires valides, non valides et incomplets">
            <PieChart data={pieData} />
          </ChartCard>
        </div>

        {!error && (rows || []).length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Aucune donnee pour le moment"
              description="Votre tableau se mettra a jour des que des notes et des creneaux seront disponibles."
            />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default ProfesseurDashboard;
