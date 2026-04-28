import React, { useEffect, useMemo, useState } from 'react';
import CrudModal from '../components/admin/CrudModal';
import ManagementTable from '../components/admin/ManagementTable';
import NotificationsPanel from '../components/common/NotificationsPanel';
import { adminApi } from '../services/api';

const StatCard = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    {helper && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>}
  </div>
);

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
        adminApi.dashboardStats(),
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

  const kpis = stats?.kpis || {};
  const charts = stats?.charts || {};

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

  const topStudents = Array.isArray(charts.top_students) ? charts.top_students : [];
  const lowestModules = Array.isArray(charts.lowest_modules) ? charts.lowest_modules : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Espace directeur</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Validez les notes et suivez les indicateurs utiles pour la demo.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Notes en attente" value={kpis.pending_notes ?? 0} helper="A traiter maintenant" />
        <StatCard label="Moyenne generale" value={`${kpis.average_grade ?? 0}/20`} helper="Notes validees" />
        <StatCard label="Taux de reussite" value={`${kpis.success_rate ?? 0}%`} helper="Seuil de passage a 10/20" />
        <StatCard label="Taux d echec" value={`${kpis.fail_rate ?? 0}%`} helper="Base sur les notes validees" />
      </div>

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
                    {student.average_note}/20
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
                  <span className="text-sm text-slate-700 dark:text-slate-200">{module.nom}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {module.average_note}/20
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
