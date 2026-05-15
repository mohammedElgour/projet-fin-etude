import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Users, GraduationCap, Clock3, CheckCircle2 } from 'lucide-react';

import SectionHeader from '../components/dashboard/SectionHeader';
import KpiGrid from '../components/dashboard/KpiGrid';
import StatCard from '../components/dashboard/StatCard';
import NotificationsPanel from '../components/common/NotificationsPanel';
import { BarChart, ChartCard, LineChart, PieChart } from '../components/charts/SimpleCharts';

import { useDirecteurDashboardData } from '../hooks/useDirecteurData';

const formatPercent = (v) => `${Number(v ?? 0).toFixed(0)}%`;

export default function DirecteurDashboard() {
  const { loading, error, stats } = useDirecteurDashboardData();

  const kpis = stats?.kpis || {};

  const moduleBarData = stats?.charts?.lowest_modules?.length
    ? stats.charts.lowest_modules.map((m) => ({ label: m.nom, value: Number(m.average_note || 0) }))
    : [
        { label: 'Module 1', value: 12 },
        { label: 'Module 2', value: 15 },
        { label: 'Module 3', value: 11 },
      ];

  const evolutionLineData = stats?.charts?.results_evolution?.length
    ? stats.charts.results_evolution.map((item) => ({ label: item.period, value: Number(item.average_note || 0) }))
    : [
        { label: 'Jan', value: 11.5 },
        { label: 'Fev', value: 12.2 },
        { label: 'Mar', value: 13.4 },
        { label: 'Avr', value: 14.1 },
      ];

  const distributionPieData = Array.isArray(stats?.charts?.performance_by_filiere)
    ? stats.charts.performance_by_filiere.slice(0, 4).map((item, idx) => ({
        label: item.nom,
        value: Math.max(Number(item.average_note || 0), 1),
        color: ['#0ea5e9', '#8b5cf6', '#f97316', '#10b981'][idx % 4],
      }))
    : [
        { label: 'Dev', value: 35, color: '#0ea5e9' },
        { label: 'Gestion', value: 25, color: '#8b5cf6' },
        { label: 'Reseaux', value: 20, color: '#f97316' },
        { label: 'Design', value: 20, color: '#10b981' },
      ];

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Directeur" title="Espace directeur" description="Chargement des indicateurs…" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <div className="h-24 rounded-2xl bg-white/60 dark:bg-slate-900/30 animate-pulse" />
          <div className="h-24 rounded-2xl bg-white/60 dark:bg-slate-900/30 animate-pulse" />
          <div className="h-24 rounded-2xl bg-white/60 dark:bg-slate-900/30 animate-pulse" />
          <div className="h-24 rounded-2xl bg-white/60 dark:bg-slate-900/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <SectionHeader
        eyebrow="ISTA • Directeur"
        title="Dashboard Analytics"
        description="Vue premium sur la validation des notes, les tendances et les modules à surveiller."
        actions={
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/60 px-3 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/30">
            <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">KPI temps réel</span>
          </div>
        }
      />

      <KpiGrid columns="4">
        <StatCard label="Total stagiaires" value={kpis.stagiaires ?? 0} helper="Stagiaires inscrits" accent="from-sky-500 to-cyan-500" icon={Users} />
        <StatCard label="Total professeurs" value={kpis.professeurs ?? 0} helper="Enseignants actifs" accent="from-emerald-500 to-teal-500" icon={GraduationCap} />
        <StatCard label="Absences" value={kpis.absences ?? kpis.absences_count ?? 0} helper="Suivi global" accent="from-amber-500 to-orange-500" icon={Clock3} />
        <StatCard label="Notes validées" value={formatPercent(kpis.validated_notes_rate ?? kpis.validated_notes ?? 0)} helper="Taux de validation" accent="from-emerald-500 to-teal-500" icon={CheckCircle2} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
        <ChartCard title="Modules à surveiller" subtitle="Bar chart des moyennes par module">
          <BarChart data={moduleBarData} color="#0ea5e9" />
        </ChartCard>

        <ChartCard title="Performances dans le temps" subtitle="Line chart sur l'évolution des notes">
          <LineChart data={evolutionLineData} stroke="#8b5cf6" fill="rgba(139, 92, 246, 0.16)" />
        </ChartCard>

        <ChartCard title="Distribution par filière" subtitle="Pie chart des performances globales">
          <PieChart data={distributionPieData} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/30">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications rapides</h3>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {Array.isArray(stats?.recent_activities) && stats.recent_activities.length
                ? stats.recent_activities.slice(0, 3).map((n, i) => (
                    <div key={n.id ?? i} className="flex items-start justify-between gap-3 py-2 border-t border-slate-200/70 first:border-t-0">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{n.message ?? 'Évènement récent'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{n.created_at ? new Date(n.created_at).toLocaleString() : '—'}</div>
                      </div>
                      <div className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300">{n.type ?? 'Info'}</div>
                    </div>
                  ))
                : '—'}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/30">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Panneau notifications</h3>
            </div>
            <NotificationsPanel />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

