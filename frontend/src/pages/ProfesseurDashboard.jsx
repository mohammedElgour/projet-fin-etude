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

const ProfesseurDashboard = () => {
  const { rows, scheduleItems, selectedModule, error, loading } = useProfesseurData();

  const averageGrade = useMemo(() => {
    const values = (rows || [])
      .map((row) => Number(row.noteValue))
      .filter((value) => !Number.isNaN(value) && value > 0);

    if (!values.length) return 0;
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  }, [rows]);

  const barData = useMemo(() => {
    const grouped = (rows || []).reduce((accumulator, row) => {
      if (!row.noteValue) return accumulator;

      accumulator[row.groupe] = accumulator[row.groupe] || [];
      accumulator[row.groupe].push(Number(row.noteValue));
      return accumulator;
    }, {});

    const built = Object.entries(grouped).map(([label, values]) => ({
      label,
      value: values.reduce((sum, value) => sum + value, 0) / values.length,
    }));

    return built.length
      ? built
      : [
          { label: 'G1', value: 12 },
          { label: 'G2', value: 14.5 },
          { label: 'G3', value: 11.2 },
        ];
  }, [rows]);

  const lineData = useMemo(() => {
    const grouped = (scheduleItems || []).reduce((accumulator, item) => {
      accumulator[item.day] = (accumulator[item.day] || 0) + 1;
      return accumulator;
    }, {});

    const built = Object.entries(grouped).map(([label, value]) => ({ label, value }));

    return built.length
      ? built
      : [
          { label: 'Lun', value: 2 },
          { label: 'Mar', value: 3 },
          { label: 'Mer', value: 4 },
          { label: 'Jeu', value: 2 },
        ];
  }, [scheduleItems]);

  const pieData = useMemo(() => {
    const counts = (rows || []).reduce(
      (accumulator, row) => {
        accumulator[row.noteStatus] = (accumulator[row.noteStatus] || 0) + 1;
        return accumulator;
      },
      { validated: 0, pending: 0, rejected: 0, not_set: 0 }
    );

    const built = [
      { label: 'Validees', value: counts.validated, color: '#10b981' },
      { label: 'En attente', value: counts.pending, color: '#f59e0b' },
      { label: 'Rejetees', value: counts.rejected, color: '#f43f5e' },
      { label: 'Non saisies', value: counts.not_set, color: '#94a3b8' },
    ].filter((item) => item.value > 0);

    return built.length
      ? built
      : [
          { label: 'Validees', value: 6, color: '#10b981' },
          { label: 'En attente', value: 3, color: '#f59e0b' },
          { label: 'Rejetees', value: 1, color: '#f43f5e' },
        ];
  }, [rows]);

  const pendingCount = useMemo(() => {
    return (rows || []).filter((r) => r.noteStatus === 'pending').length;
  }, [rows]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Professeur" title="Espace professeur" description="Chargement de vos indicateurs…" />
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
          description="Suivez la progression, gérez les notes et visualisez l’emploi du temps."
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
            helper="Sur les notes déjà saisies"
            accent="from-violet-500 to-fuchsia-500"
            icon={ChartSpline}
          />
          <StatCard
            label="Creneaux planifiés"
            value={(scheduleItems || []).length}
            helper="Emploi du temps courant"
            accent="from-emerald-500 to-teal-500"
            icon={CalendarRange}
          />
          <StatCard
            label="Pending grades"
            value={pendingCount}
            helper={selectedModule ? 'À valider / compléter' : 'Choisissez un module'}
            accent="from-amber-500 to-orange-500"
            icon={BookCheck}
          />
        </KpiGrid>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
          <ChartCard title="Notes par groupe" subtitle="Bar chart des moyennes visibles">
            <BarChart data={barData} color="#f97316" />
          </ChartCard>

          <ChartCard title="Rythme de la semaine" subtitle="Line chart du nombre de créneaux par jour">
            <LineChart data={lineData} stroke="#0ea5e9" fill="rgba(14, 165, 233, 0.14)" />
          </ChartCard>

          <ChartCard title="Statut des notes" subtitle="Répartition des statuts">
            <PieChart data={pieData} />
          </ChartCard>
        </div>

        {(!error && (rows || []).length === 0) ? (
          <div className="mt-6">
            <EmptyState
              title="Aucune donnée pour le moment"
              description="Votre tableau se mettra à jour dès que des notes et des créneaux seront disponibles."
            />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default ProfesseurDashboard;
