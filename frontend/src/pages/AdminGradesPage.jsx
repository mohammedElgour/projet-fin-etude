import React, { useMemo, useState } from 'react';
import CrudModal from '../components/admin/CrudModal';
import ManagementTable from '../components/admin/ManagementTable';
import { useAdminDashboardData } from '../hooks/useAdminData';
import { adminApi } from '../services/api';

const AdminGradesPage = () => {
  const { pendingNotes, loading, error, reload } = useAdminDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [pageError, setPageError] = useState('');
  const [rejectionTarget, setRejectionTarget] = useState(null);

  const pendingRows = useMemo(
    () =>
      pendingNotes.map((note) => ({
        id: note.id,
        student: note.stagiaire?.user?.name || 'Stagiaire',
        module: note.module?.nom || 'Module',
        note: note.note,
        status: note.validation_status,
      })),
    [pendingNotes]
  );

  const handleValidate = async (row) => {
    try {
      await adminApi.validateNote(row.id);
      reload();
    } catch (err) {
      setPageError(err?.response?.data?.message || 'Impossible de valider la note.');
    }
  };

  const handleReject = async (values) => {
    try {
      await adminApi.rejectNote(rejectionTarget.id, values.feedback);
      setRejectionTarget(null);
      reload();
    } catch (err) {
      setPageError(err?.response?.data?.message || 'Impossible de rejeter la note.');
    }
  };

  return (
    <div className="space-y-6">
      {(error || pageError) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {pageError || error}
        </div>
      )}

      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Centre de validation</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Validez ou rejetez les notes soumises par les professeurs depuis une page dediee.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {pendingRows.length} en attente
          </div>
        </div>

        <ManagementTable
          data={pendingRows}
          columns={[
            { key: 'student', header: 'Stagiaire' },
            { key: 'module', header: 'Module' },
            { key: 'note', header: 'Note', render: (row) => `${row.note}/20` },
            { key: 'status', header: 'Statut' },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage="Aucune note en attente"
          rowActions={[
            {
              label: 'Valider',
              onClick: handleValidate,
              className: 'rounded-xl bg-emerald-600 px-3 py-1.5 text-white transition hover:bg-emerald-700',
            },
            {
              label: 'Rejeter',
              onClick: (row) => setRejectionTarget(row),
              className: 'rounded-xl bg-rose-600 px-3 py-1.5 text-white transition hover:bg-rose-700',
            },
          ]}
        />
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

export default AdminGradesPage;
