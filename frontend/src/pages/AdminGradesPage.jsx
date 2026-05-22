import React, { useMemo, useState } from 'react';
import CrudModal from '../components/admin/CrudModal';
import ManagementTable from '../components/admin/ManagementTable';
import SubmissionDetailsModal from '../components/notes/SubmissionDetailsModal';
import { useAdminDashboardData } from '../hooks/useAdminData';
import { adminApi } from '../services/api';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  pending: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const AdminGradesPage = () => {
  const { noteSubmissions, loading, error, reload } = useAdminDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [pageError, setPageError] = useState('');
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSubmission, setDetailsSubmission] = useState(null);

  const submissionRows = useMemo(
    () =>
      noteSubmissions.map((submission) => ({
        id: submission.id,
        groupe: submission.groupe?.nom || 'Groupe',
        module: submission.module?.nom || 'Module',
        filiere: submission.filiere?.nom || 'Filiere',
        teacher: submission.teacher?.name || 'Professeur',
        stagiairesCount: submission.stagiaires_count || 0,
        status: submission.status || 'draft',
        adminComment: submission.admin_comment || '',
      })),
    [noteSubmissions]
  );

  const handleValidate = async (row) => {
    try {
      await adminApi.validateNotesGroup({ submission_id: row.id });
      await reload();
    } catch (err) {
      setPageError(err?.response?.data?.message || 'Impossible de valider la soumission du groupe.');
    }
  };

  const handleReject = async (values) => {
    try {
      await adminApi.rejectNotesGroup({
        submission_id: rejectionTarget.id,
        feedback: values.feedback,
      });
      setRejectionTarget(null);
      await reload();
    } catch (err) {
      setPageError(err?.response?.data?.message || 'Impossible de rejeter la soumission du groupe.');
    }
  };

  const handleOpenDetails = async (row) => {
    setPageError('');
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsSubmission(null);

    try {
      const response = await adminApi.noteSubmission(row.id);
      setDetailsSubmission(response?.data || null);
    } catch (err) {
      setPageError(err?.response?.data?.message || 'Impossible de charger les details de la soumission.');
      setDetailsSubmission(null);
    } finally {
      setDetailsLoading(false);
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
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Soumissions de notes</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Chaque ligne represente une seule soumission groupe + module, avec validation ou rejet en une action.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {submissionRows.length} soumissions
          </div>
        </div>

        <ManagementTable
          data={submissionRows}
          columns={[
            { key: 'groupe', header: 'Groupe' },
            { key: 'module', header: 'Module' },
            { key: 'filiere', header: 'Filiere' },
            { key: 'teacher', header: 'Professeur' },
            { key: 'stagiairesCount', header: 'Stagiaires', className: 'text-center', headerClassName: 'text-center' },
            {
              key: 'status',
              header: 'Statut',
              className: 'text-center',
              headerClassName: 'text-center',
              render: (row) => (
                <div className="flex justify-center">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[row.status] || STATUS_STYLES.draft}`}>
                    {row.status}
                  </span>
                </div>
              ),
            },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage="Aucune soumission de groupe disponible"
          rowActions={[
            {
              label: 'Validate Groupe',
              onClick: handleValidate,
              disabled: (row) => row.status !== 'pending',
              className: (row) => `rounded-xl px-3 py-1.5 text-white transition ${
                row.status === 'pending'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'cursor-not-allowed bg-slate-300'
              }`,
            },
            {
              label: 'Reject Groupe',
              onClick: (row) => setRejectionTarget(row),
              disabled: (row) => row.status !== 'pending',
              className: (row) => `rounded-xl px-3 py-1.5 text-white transition ${
                row.status === 'pending'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'cursor-not-allowed bg-slate-300'
              }`,
            },
            {
              label: 'View Details',
              onClick: handleOpenDetails,
              className: 'rounded-xl bg-slate-700 px-3 py-1.5 text-white transition hover:bg-slate-800',
            },
          ]}
        />
      </section>

      <CrudModal
        isOpen={Boolean(rejectionTarget)}
        title={rejectionTarget ? `Reject Groupe ${rejectionTarget.groupe} - ${rejectionTarget.module}` : 'Reject Groupe'}
        fields={[{ name: 'feedback', label: 'Motif', type: 'textarea', required: true }]}
        initialValues={{ feedback: '' }}
        onClose={() => setRejectionTarget(null)}
        onSubmit={handleReject}
        submitLabel="Confirmer le rejet"
      />

      <SubmissionDetailsModal
        isOpen={detailsOpen}
        submission={detailsSubmission}
        loading={detailsLoading}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsSubmission(null);
        }}
      />
    </div>
  );
};

export default AdminGradesPage;
