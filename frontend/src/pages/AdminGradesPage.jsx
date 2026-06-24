import React, { useMemo, useState } from 'react';
import CrudModal from '../components/admin/CrudModal';
import ManagementTable from '../components/admin/ManagementTable';
import SubmissionDetailsModal from '../components/notes/SubmissionDetailsModal';
import { useAdminDashboardData } from '../hooks/useAdminData';
import { adminApi } from '../services/api';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  pending: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  submitted: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const evaluationGradeField = (evaluationType) => {
  switch (evaluationType) {
    case 'controle_1':
      return 'cc1';
    case 'controle_2':
      return 'cc2';
    case 'controle_3':
      return 'cc3';
    case 'efm':
      return 'efm';
    default:
      return null;
  }
};

const formatStudentSummary = (submission) => {
  const names = Array.isArray(submission?.notes)
    ? submission.notes
        .map((note) => note?.stagiaire?.name || note?.stagiaire?.user?.name)
        .filter(Boolean)
    : [];

  if (names.length === 0) {
    return '-';
  }

  if (names.length === 1) {
    return names[0];
  }

  return `${names[0]} +${names.length - 1}`;
};

const formatGradeSummary = (submission) => {
  const field = evaluationGradeField(submission?.evaluation_type);
  const notes = Array.isArray(submission?.notes) ? submission.notes : [];

  if (!field || notes.length === 0) {
    return '-';
  }

  const grades = notes
    .map((note) => Number(note?.[field]))
    .filter((value) => Number.isFinite(value));

  if (grades.length === 0) {
    return '-';
  }

  const average = grades.reduce((total, value) => total + value, 0) / grades.length;

  return `${average.toFixed(2)} (${grades.length})`;
};

const getRequestErrorMessage = (err, fallbackMessage) => {
  const validationErrors = err?.response?.data?.errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const flattened = Object.values(validationErrors).flat().filter(Boolean);
    if (flattened.length > 0) {
      return flattened.join(' ');
    }
  }

  return err?.response?.data?.message || err?.message || fallbackMessage;
};

const getSubmissionNoteCount = (submission) => Number(submission?.notes_count ?? submission?.stagiaires_count ?? submission?.notesCount ?? 0);

const AdminGradesPage = () => {
  const { evaluationQueue, stats, loading, error, reload } = useAdminDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [pageError, setPageError] = useState('');
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSubmission, setDetailsSubmission] = useState(null);

  const queueRows = useMemo(
    () =>
      evaluationQueue.map((submission) => ({
        id: submission.id,
        submissionId: submission.id,
        evaluationType: submission.evaluation_type,
        evaluationLabel: submission.evaluation_label || 'Evaluation',
        student: formatStudentSummary(submission),
        groupe: submission.groupe?.nom || 'Groupe',
        filiere: submission.groupe?.filiere?.nom || 'Filiere',
        module: submission.module?.nom || 'Module',
        professor: submission.teacher?.name || 'Professeur',
        grade: formatGradeSummary(submission),
        status: submission.status || 'submitted',
        submissionDate: submission.submitted_at || '',
        feedback: submission.admin_comment || '',
        notesCount: submission.stagiaires_count ?? submission.notes_count ?? 0,
      })),
    [evaluationQueue]
  );

  const pendingCount = Number(stats?.kpis?.pending_evaluations || stats?.kpis?.pending_notes || queueRows.length || 0);

  const handleApprove = async (row) => {
    try {
      setPageError('');
      if (getSubmissionNoteCount(row) === 0) {
        setPageError('Cette soumission ne contient aucune note a valider.');
        return;
      }

      await adminApi.validateNotesGroup({ submission_id: row.id });
      await reload();
    } catch (err) {
      console.error(err);
      setPageError(getRequestErrorMessage(err, 'Impossible de valider cette evaluation.'));
    }
  };

  const handleReject = async (values) => {
    try {
      setPageError('');
      await adminApi.rejectNotesGroup({
        submission_id: rejectionTarget.id,
        feedback: values.feedback || '',
      });
      setRejectionTarget(null);
      await reload();
    } catch (err) {
      console.error(err);
      setPageError(getRequestErrorMessage(err, 'Impossible de rejeter cette evaluation.'));
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
      console.error(err);
      setPageError(getRequestErrorMessage(err, 'Impossible de charger les details de cette evaluation.'));
      setDetailsSubmission(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApproveFromDetails = async (submission) => {
    try {
      if (getSubmissionNoteCount(submission) === 0) {
        setPageError('Cette soumission ne contient aucune note a valider.');
        return;
      }

      await adminApi.validateNotesGroup({ submission_id: submission.id });
      setDetailsOpen(false);
      setDetailsSubmission(null);
      await reload();
    } catch (err) {
      console.error(err);
      setPageError(getRequestErrorMessage(err, 'Impossible de valider cette evaluation.'));
    }
  };

  const handleRejectFromDetails = async (submission, feedback) => {
    try {
      await adminApi.rejectNotesGroup({
        submission_id: submission.id,
        feedback: feedback || '',
      });
      setDetailsOpen(false);
      setDetailsSubmission(null);
      await reload();
    } catch (err) {
      console.error(err);
      setPageError(getRequestErrorMessage(err, 'Impossible de rejeter cette evaluation.'));
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
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">File de validation</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Chaque ligne represente une evaluation precise en attente de decision, pas une soumission de groupe.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {pendingCount} evaluation(s) en attente
          </div>
        </div>

        <ManagementTable
          data={queueRows}
          columns={[
            { key: 'student', header: 'Student' },
            { key: 'group', header: 'Group', render: (row) => row.groupe },
            { key: 'filiere', header: 'Filière' },
            { key: 'module', header: 'Module' },
            { key: 'evaluationLabel', header: 'Evaluation' },
            { key: 'grade', header: 'Grade', className: 'text-center', headerClassName: 'text-center' },
            { key: 'professor', header: 'Professor' },
            {
              key: 'submissionDate',
              header: 'Submission Date',
              render: (row) => formatDateTime(row.submissionDate),
            },
            {
              key: 'status',
              header: 'Status',
              className: 'text-center',
              headerClassName: 'text-center',
              render: (row) => (
                <div className="flex justify-center">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[row.status] || STATUS_STYLES.submitted}`}>
                    {row.status}
                  </span>
                </div>
              ),
            },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage="Aucune evaluation en attente de validation"
          rowActions={[
            {
              label: 'Approve Evaluation',
              onClick: handleApprove,
              disabled: (row) => row.status !== 'submitted' && row.status !== 'pending',
              className: (row) => `rounded-xl px-3 py-1.5 text-white transition ${
                row.status === 'submitted' || row.status === 'pending'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'cursor-not-allowed bg-slate-300'
              }`,
            },
            {
              label: 'Reject Evaluation',
              onClick: (row) => setRejectionTarget(row),
              disabled: (row) => row.status !== 'submitted' && row.status !== 'pending',
              className: (row) => `rounded-xl px-3 py-1.5 text-white transition ${
                row.status === 'submitted' || row.status === 'pending'
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
        title={
          rejectionTarget
            ? `Reject ${rejectionTarget.student} - ${rejectionTarget.evaluationLabel}`
            : 'Reject Evaluation'
        }
        fields={[
          { name: 'feedback', label: 'Feedback', type: 'textarea', required: false, hint: 'Optionnel, mais utile pour guider la correction.' },
        ]}
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
        onApprove={handleApproveFromDetails}
        onReject={handleRejectFromDetails}
      />
    </div>
  );
};

export default AdminGradesPage;
