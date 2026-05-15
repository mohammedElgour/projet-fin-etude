import React, { useMemo } from 'react';
import { BellRing, BookOpenText, ChartNoAxesCombined, Clock4 } from 'lucide-react';
import { motion } from 'framer-motion';

import { BarChart, ChartCard, LineChart, PieChart } from '../components/charts/SimpleCharts';
import StatCard from '../components/dashboard/StatCard';
import { useStagiaireData } from '../hooks/useStagiaireData';

import SectionHeader from '../components/dashboard/SectionHeader';
import KpiGrid from '../components/dashboard/KpiGrid';
import { SkeletonCard, SkeletonLine } from '../components/dashboard/LoadingSkeletons';
import EmptyState from '../components/dashboard/EmptyState';

const StagiaireDashboard = () => {
  const { notes, scheduleItems, announcements, recommendation, loading, error } = useStagiaireData();

  const average = useMemo(() => recommendation?.average ?? 0, [recommendation]);

  const barData = useMemo(
    () =>
      notes.length
        ? notes.map((note) => ({ label: note.module?.nom || 'Module', value: Number(note.note || 0) }))
        : [
            { label: 'Algo', value: 13 },
            { label: 'Web', value: 15 },
            { label: 'BDD', value: 12 },
          ],
    [notes]
  );

  const lineData = useMemo(() => {
    const built = notes.map((note, index) => ({
      label: `Etape ${index + 1}`,
      value: Number(note.note || 0),
    }));

    return built.length
      ? built
      : [
          { label: 'S1', value: 11 },
          { label: 'S2', value: 12.5 },
          { label: 'S3', value: 14 },
          { label: 'S4', value: 13.8 },
        ];
  }, [notes]);

  const pieData = useMemo(() => {
    const built = [
      { label: 'Notes', value: notes.length, color: '#8b5cf6' },
      { label: 'Creneaux', value: scheduleItems.length, color: '#0ea5e9' },
      { label: 'Annonces', value: announcements.length, color: '#f97316' },
    ].filter((item) => item.value > 0);

    return built.length
      ? built
      : [
          { label: 'Notes', value: 4, color: '#8b5cf6' },
          { label: 'Creneaux', value: 5, color: '#0ea5e9' },
          { label: 'Annonces', value: 2, color: '#f97316' },
        ];
  }, [announcements.length, notes.length, scheduleItems.length]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="ISTA • Student"
          title="Espace stagiaire"
          description="Chargement de votre progression et de vos indicateurs…"
        />
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
          eyebrow="ISTA • Stagiaire"
          title="Tableau de bord"
          description="Vos notes, votre progression et vos informations importantes—au même endroit."
          actions={
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/60 px-3 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/30">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Aperçu</span>
            </div>
          }
        />

        <KpiGrid columns="4">
          <StatCard
            label="Moyenne"
            value={`${average}/20`}
            helper="Résumé instantané"
            accent="from-violet-500 to-fuchsia-500"
            icon={ChartNoAxesCombined}
          />
          <StatCard
            label="Notes validées"
            value={notes.length}
            helper="Modules disponibles"
            accent="from-sky-500 to-cyan-500"
            icon={BookOpenText}
          />
          <StatCard
            label="Creneaux planifiés"
            value={scheduleItems.length}
            helper="Semaine en cours"
            accent="from-emerald-500 to-teal-500"
            icon={Clock4}
          />
          <StatCard
            label="Annonces"
            value={announcements.length}
            helper="Informations récentes"
            accent="from-amber-500 to-orange-500"
            icon={BellRing}
          />
        </KpiGrid>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
          <ChartCard title="Notes par module" subtitle="Bar chart de vos résultats">
            <BarChart data={barData} color="#8b5cf6" />
          </ChartCard>

          <ChartCard title="Progression récente" subtitle="Line chart de performance">
            <LineChart data={lineData} stroke="#10b981" fill="rgba(16, 185, 129, 0.14)" />
          </ChartCard>

          <ChartCard title="Répartition de votre espace" subtitle="Pie chart entre notes, emploi du temps et annonces">
            <PieChart data={pieData} />
          </ChartCard>
        </div>

        {(!error && notes.length === 0 && scheduleItems.length === 0 && announcements.length === 0) ? (
          <div className="mt-6">
            <EmptyState
              title="Aucune donnée pour le moment"
              description="Dès que vos notes, créneaux et annonces seront disponibles, ils apparaîtront ici."
            />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default StagiaireDashboard;

