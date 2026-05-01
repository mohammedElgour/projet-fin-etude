import React, { useEffect, useMemo, useState } from 'react';
import CrudModal from '../components/admin/CrudModal';
import {
  ChartCard,
  OverviewBarChart,
  DistributionChart,
  ModulePerformanceChart,
  TrendChart,
} from '../components/admin/DashboardCharts';
import ManagementTable from '../components/admin/ManagementTable';
import NotificationsPanel from '../components/common/NotificationsPanel';
import { adminApi } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionTarget, setRejectionTarget] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsRes, pendingRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.pendingNotes(),
      ]);

      setStats(statsRes);
      setPendingNotes(pendingRes?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de charger le tableau de bord admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRows = useMemo(
    () =>
      pendingNotes.map((note) => ({
        id: note.id,
        student: note.stagiaire?.user?.name || 'Stagiaire',
        module: note.module?.nom || 'Module',
        note: note.note,
        status: note.validation_status,
        noteRecord: note,
      })),
    [pendingNotes]
  );

  const columns = [
    { key: 'student', header: 'Stagiaire' },
    { key: 'module', header: 'Module' },
    {
      key: 'note',
      header: 'Note',
      render: (row) => `${row.note}/20`,
    },
    { key: 'status', header: 'Statut' },
  ];

  const handleValidate = async (row) => {
    try {
      await adminApi.validateNote(row.id);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de valider la note.');
    }
  };

  const handleReject = async (values) => {
    try {
      await adminApi.rejectNote(rejectionTarget.id, values.feedback);
      setRejectionTarget(null);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de rejeter la note.');
    }
  };

  const topStudents = Array.isArray(stats?.top_students) ? stats.top_students : [];
  const lowestModules = Array.isArray(stats?.difficult_modules) ? stats.difficult_modules : [];
  const performanceTrend = Array.isArray(stats?.performance_trend) ? stats.performance_trend : [];
  const modulePerformance = Array.isArray(stats?.module_performance) ? stats.module_performance : [];
  const gradeDistribution = stats?.grade_distribution || {};
  const kpis = stats?.kpis || {};

  const overviewData = [
    { label: 'Stagiaires', value: stats?.total_students ?? 0, color: '#4f46e5' },
    { label: 'Professeurs', value: stats?.total_professors ?? 0, color: '#0ea5e9' },
    { label: 'Modules', value: stats?.total_modules ?? 0, color: '#14b8a6' },
  ];

  const noteStatusData = [
    { label: 'Validees', value: kpis.validated_notes ?? 0, color: '#10b981' },
    { label: 'En attente', value: kpis.pending_notes ?? 0, color: '#f59e0b' },
    { label: 'Rejetees', value: kpis.rejected_notes ?? 0, color: '#ef4444' },
  ];

  const gradeDistributionEntries = Object.entries(gradeDistribution).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Espace directeur</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Validez les notes et suivez les indicateurs utiles pour la demo.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard
          title="Vue globale"
          description="Suivi instantane des volumes principaux de la plateforme."
          accent={`${stats?.success_rate ?? 0}% reussite`}
          className="xl:col-span-2"
        >
          <OverviewBarChart data={overviewData} loading={loading} />
        </ChartCard>

        <ChartCard
          title="Statut des notes"
          description="Repartition des validations en cours pour le suivi administratif."
          accent={`${kpis.average_grade ?? 0}/20 moyenne`}
        >
          <DistributionChart data={noteStatusData} loading={loading} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Tendance des performances"
          description="Evolution mensuelle de la moyenne des notes validees."
          accent={`${topStudents.length} top stagiaires`}
        >
          <TrendChart data={performanceTrend} loading={loading} />
        </ChartCard>

        <ChartCard
          title="Performance des modules"
          description="Comparaison des meilleurs scores moyens par module."
          accent={`${lowestModules.length} modules a surveiller`}
        >
          <ModulePerformanceChart data={modulePerformance} loading={loading} />
        </ChartCard>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Distribution des notes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Repartition des notes validees par tranche academique.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {kpis.validated_notes ?? 0} validees
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
            <DistributionChart data={gradeDistributionEntries} loading={loading} />
            <div className="space-y-3">
              {gradeDistributionEntries.length === 0 && !loading ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Aucune tranche de notes disponible.
                </div>
              ) : (
                gradeDistributionEntries.map((entry) => (
                  <div
                    key={entry.label}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Niveau {entry.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{entry.value}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-500 via-sky-500 to-teal-400 p-[1px]">
          <div className="h-full rounded-[15px] bg-white/95 p-5 dark:bg-slate-900/95">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Resume decisionnel</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Les indicateurs clefs restent visibles sans revenir aux anciennes cartes statiques.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reussite</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats?.success_rate ?? 0}%</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Moyenne generale</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{kpis.average_grade ?? 0}/20</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Top stagiaires</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{topStudents.length}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Modules sensibles</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{lowestModules.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Notes en attente</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Validez ou rejetez les notes soumises par les professeurs.
          </p>
        </div>

        <ManagementTable
          data={pendingRows}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage="Aucune note en attente"
          rowActions={[
            {
              label: 'Valider',
              onClick: handleValidate,
              className: 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700',
            },
            {
              label: 'Rejeter',
              onClick: (row) => setRejectionTarget(row),
              className: 'px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700',
            },
          ]}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Top stagiaires</h2>
          {topStudents.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Pas encore de classement.</p>
          ) : (
            <ul className="space-y-3">
              {topStudents.map((student, index) => (
                <li key={student.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    {index + 1}. {student.name}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {student.average}/20
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Modules a surveiller</h2>
          {lowestModules.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Pas assez de donnees.</p>
          ) : (
            <ul className="space-y-3">
              {lowestModules.map((module) => (
                <li key={module.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                  <span className="text-sm text-slate-700 dark:text-slate-200">{module.module}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {module.average}/20
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <NotificationsPanel />
      </section>

      <CrudModal
        isOpen={Boolean(rejectionTarget)}
        title={rejectionTarget ? `Rejeter la note de ${rejectionTarget.student}` : 'Rejeter la note'}
        fields={[{ name: 'feedback', label: 'Motif', type: 'textarea', required: true }]}
        initialValues={{ feedback: '' }}
        onClose={() => setRejectionTarget(null)}
        onSubmit={handleReject}
        submitLabel="Confirmer le rejet"
      />
    </div>
  );
};

export default AdminDashboard;
