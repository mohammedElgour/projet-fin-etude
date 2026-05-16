import React, { useMemo } from 'react';
import { FolderKanban, GraduationCap, PieChart as PieChartIcon, School, UserCog, Users } from 'lucide-react';
import { BarChart, LineChart } from '../components/charts/SimpleCharts';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import GroupesParFiliereCard from '../components/dashboard/GroupesParFiliereCard';
import { useAdminDashboardData } from '../hooks/useAdminData';
import { motion } from 'framer-motion';
import SectionHeader from '../components/dashboard/SectionHeader';

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const chartColors = ['#0ea5e9', '#8b5cf6', '#f97316', '#10b981', '#06b6d4', '#a78bfa'];

const EmptyChartState = ({ message }) => (
  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 text-center text-sm text-slate-500">
    {message}
  </div>
);

const AdminDashboard = () => {
  const { stats, error, loading } = useAdminDashboardData();
  const kpis = useMemo(() => stats?.kpis || {}, [stats]);
  const charts = useMemo(() => stats?.charts || {}, [stats]);

  const groupesPerFiliere = useMemo(
    () => (Array.isArray(charts.groupes_per_filiere) ? charts.groupes_per_filiere : []),
    [charts]
  );
  const stagiairesPerGroupe = useMemo(
    () => (Array.isArray(charts.stagiaires_per_groupe) ? charts.stagiaires_per_groupe : []),
    [charts]
  );
  const modulesDistribution = useMemo(
    () => (Array.isArray(charts.modules_distribution) ? charts.modules_distribution : []),
    [charts]
  );
  const recentGrowth = useMemo(
    () => (Array.isArray(charts.recent_growth) ? charts.recent_growth : []),
    [charts]
  );

  const lineData = useMemo(
    () =>
      recentGrowth.map((item) => ({
        label: item.label || item.period || '-',
        value: safeNumber(item.total),
      })),
    [recentGrowth]
  );

  const barData = useMemo(
    () =>
      stagiairesPerGroupe.map((group) => ({
        label: group.nom || 'Groupe',
        value: safeNumber(group.stagiaires_count),
      })),
    [stagiairesPerGroupe]
  );

  const pieData = useMemo(
    () =>
      groupesPerFiliere.map((item, index) => ({
        label: item.nom || 'Filiere',
        value: safeNumber(item.groupes_count),
        color: chartColors[index % chartColors.length],
      })),
    [groupesPerFiliere]
  );

  const modulesTotal = useMemo(
    () => modulesDistribution.reduce((total, item) => total + safeNumber(item.modules_count), 0),
    [modulesDistribution]
  );

  const kpiData = useMemo(() => {
    const changes = kpis.changes || {};

    return {
      totalStudents: safeNumber(kpis.stagiaires),
      totalFilieres: safeNumber(kpis.filieres),
      totalGroupes: safeNumber(kpis.groupes),
      totalProfesseurs: safeNumber(kpis.professeurs),
      totalModules: safeNumber(kpis.modules),
      changes: {
        students: safeNumber(changes.stagiaires),
        filieres: safeNumber(changes.filieres),
        groupes: safeNumber(changes.groupes),
        professeurs: safeNumber(changes.professeurs),
        modules: safeNumber(changes.modules),
      },
    };
  }, [kpis]);

  const sparklineSeries = useMemo(
    () => ({
      students: recentGrowth.map((item) => safeNumber(item.stagiaires)),
      teachers: recentGrowth.map((item) => safeNumber(item.professeurs)),
      modules: recentGrowth.map((item) => safeNumber(item.modules)),
      groupes: recentGrowth.map((item) => safeNumber(item.groupes)),
      filieres: recentGrowth.map((item) => safeNumber(item.filieres)),
    }),
    [recentGrowth]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Dashboard" title="Espace directeur" description="Chargement des indicateurs..." />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-xl bg-white ring-1 ring-slate-200/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-[340px] animate-pulse rounded-xl bg-white ring-1 ring-slate-200/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[320px] animate-pulse rounded-xl bg-white ring-1 ring-slate-200/60" />
          ))}
        </div>
      </div>
    );
  }

  const errorText = error && typeof error === 'string' && !/unauth/i.test(error) ? error : null;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
      {errorText ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorText}</div>
      ) : null}

      <SectionHeader
        eyebrow="Dashboard Analytics"
        title="Espace directeur"
        description="Vue SaaS premium: indicateurs, performance & actions rapides."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-5">
        <StatCard
          label="Total Students"
          value={kpiData.totalStudents}
          icon={Users}
          accent="from-sky-500 via-blue-500 to-cyan-500"
          change={kpiData.changes.students}
          sparklineData={sparklineSeries.students}
        />
        <StatCard
          label="Total Teachers"
          value={kpiData.totalProfesseurs}
          icon={UserCog}
          accent="from-violet-500 via-fuchsia-500 to-purple-500"
          change={kpiData.changes.professeurs}
          sparklineData={sparklineSeries.teachers}
        />
        <StatCard
          label="Total Modules"
          value={kpiData.totalModules}
          icon={FolderKanban}
          accent="from-emerald-500 via-teal-500 to-cyan-500"
          change={kpiData.changes.modules}
          sparklineData={sparklineSeries.modules}
        />
        <StatCard
          label="Total Filieres"
          value={kpiData.totalFilieres}
          icon={GraduationCap}
          accent="from-cyan-500 via-sky-500 to-blue-500"
          change={kpiData.changes.filieres}
          sparklineData={sparklineSeries.filieres}
        />
        <StatCard
          label="Total Groupes"
          value={kpiData.totalGroupes}
          icon={School}
          accent="from-orange-500 via-amber-500 to-yellow-400"
          change={kpiData.changes.groupes}
          sparklineData={sparklineSeries.groupes}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <ChartCard title="Recent Growth" subtitle="Creations mensuelles sur les 6 derniers mois">
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200/60">
            {lineData.length ? (
              <LineChart data={lineData} stroke="#0ea5e9" fill="rgba(14, 165, 233, 0.14)" />
            ) : (
              <EmptyChartState message="Aucune creation recente a afficher pour le moment." />
            )}
          </div>
        </ChartCard>

        <ChartCard title="Students Per Groupe" subtitle="Effectif stagiaires par groupe">
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200/60">
            {barData.length ? (
              <BarChart data={barData} color="#8b5cf6" />
            ) : (
              <EmptyChartState message="Aucun groupe disponible pour afficher les effectifs." />
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <GroupesParFiliereCard
            title="Groupes Par Filiere"
            subtitle={`Distribution dynamique des groupes par filiere${modulesTotal ? `, ${modulesTotal} modules rattaches` : ''}`}
            data={pieData}
          />
        </div>

        <div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => window.location.assign('/dashboard/admin/grades')}
              className="group rounded-xl bg-sky-50 p-5 text-left shadow-sm ring-1 ring-sky-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition group-hover:bg-sky-200">
                  <span className="text-sm font-semibold">OK</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Validate Grades</p>
                  <p className="mt-1 text-xs text-slate-600">Traiter les notes en attente</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => window.location.assign('/dashboard/admin/students')}
              className="group rounded-xl bg-emerald-50 p-5 text-left shadow-sm ring-1 ring-emerald-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-200">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Manage Students</p>
                  <p className="mt-1 text-xs text-slate-600">Consulter et piloter les stagiaires</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => window.location.assign('/dashboard/admin/modules')}
              className="group rounded-xl bg-violet-50 p-5 text-left shadow-sm ring-1 ring-violet-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-700 transition group-hover:bg-violet-200">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Manage Modules</p>
                  <p className="mt-1 text-xs text-slate-600">Suivre la performance des modules</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
