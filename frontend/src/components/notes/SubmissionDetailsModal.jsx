import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import ActionButton from '../admin/ActionButton';

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panel = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } },
};

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  pending: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  submitted: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  validated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};

const FIELD_CARD = 'rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900/60';

const SubmissionDetailsModal = ({
  isOpen,
  submission,
  loading = false,
  onClose,
  onApprove,
  onReject,
}) => {
  const notes = Array.isArray(submission?.notes) ? submission.notes : [];
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFeedback('');
      setActionError('');
      setActionLoading(false);
      return;
    }

    setFeedback(submission?.admin_comment || '');
    setActionError('');
    setActionLoading(false);
  }, [submission, isOpen]);

  const handleApprove = async () => {
    if (!onApprove || !submission) {
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      await onApprove(submission);
    } catch (error) {
      console.error(error);
      setActionError(error?.response?.data?.message || 'Impossible de valider cette soumission.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !submission) {
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      await onReject(submission, feedback);
    } catch (error) {
      console.error(error);
      setActionError(error?.response?.data?.message || 'Impossible de rejeter cette soumission.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-md"
        >
          <motion.div
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="surface-panel flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-6 py-5 dark:border-white/10">
              <div>
                <div className="inline-flex rounded-full bg-slate-100/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600 dark:bg-white/5 dark:text-sky-300">
                  Details
                </div>
                <h3 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                  {submission?.evaluation_label || 'Soumission'}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Consultez la soumission complete du lot puis approuvez ou rejetez la validation.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {loading ? (
                <div className="flex min-h-[260px] items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Chargement des details...
                  </div>
                </div>
              ) : submission ? (
                <div className="space-y-6">
                  {actionError ? (
                    <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                      {actionError}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    {[
                      { label: 'Groupe', value: submission.groupe?.nom || '-' },
                      { label: 'Module', value: submission.module?.nom || '-' },
                      { label: 'Filiere', value: submission.filiere?.nom || '-' },
                      { label: 'Professeur', value: submission.teacher?.name || '-' },
                      { label: 'Evaluation', value: submission.evaluation_label || submission.evaluation_type || '-' },
                      { label: 'Stagiaires', value: submission.stagiaires_count || submission.notes_count || 0 },
                      {
                        label: 'Statut',
                        value: (
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[submission.status] || STATUS_STYLES.draft}`}>
                            {submission.status}
                          </span>
                        ),
                      },
                      {
                        label: 'Submission Date',
                        value: submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('fr-FR') : '-',
                      },
                    ].map((item) => (
                      <div key={item.label} className={FIELD_CARD}>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.label}</p>
                        <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {submission.admin_comment ? (
                    <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                      <p className="font-semibold">Commentaire admin</p>
                      <p className="mt-1">{submission.admin_comment}</p>
                    </div>
                  ) : null}

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
                    <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72">
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Validation History</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Le suivi retrace la soumission et la decision finale.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {(submission.history || []).map((entry) => (
                          <div key={`${entry.label}-${entry.status}-${entry.date || 'na'}`} className="rounded-[20px] border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.label}</p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{entry.message}</p>
                              </div>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[entry.status] || STATUS_STYLES.draft}`}>
                                {entry.status}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                              {entry.date ? new Date(entry.date).toLocaleString('fr-FR') : 'Date non disponible'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Decision admin</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        La decision s applique a toute la soumission.
                      </p>

                      <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-300">Feedback optionnel</label>
                      <textarea
                        value={feedback}
                        onChange={(event) => setFeedback(event.target.value)}
                        rows={5}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-500/20"
                        placeholder="Ajouter une remarque ou une correction"
                        disabled={actionLoading}
                      />

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={actionLoading || (submission.status !== 'submitted' && submission.status !== 'pending')}
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                            actionLoading || (submission.status !== 'submitted' && submission.status !== 'pending')
                              ? 'cursor-not-allowed bg-slate-400 opacity-70'
                              : 'bg-emerald-600 hover:bg-emerald-500'
                          }`}
                        >
                          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Approve Evaluation
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={actionLoading || (submission.status !== 'submitted' && submission.status !== 'pending')}
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                            actionLoading || (submission.status !== 'submitted' && submission.status !== 'pending')
                              ? 'cursor-not-allowed bg-slate-400 opacity-70'
                              : 'bg-rose-600 hover:bg-rose-500'
                          }`}
                        >
                          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Reject Evaluation
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-separate border-spacing-y-3 px-4">
                        <thead className="sticky top-0 z-10">
                          <tr>
                            {['Stagiaire', 'Controle 1', 'Controle 2', 'Controle 3', 'EFM', 'Moyenne', 'Statut'].map((header) => (
                              <th
                                key={header}
                                className="bg-slate-50/88 px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 first:rounded-l-[18px] last:rounded-r-[18px] dark:bg-white/5 dark:text-slate-400"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {notes.map((note) => (
                            <tr key={note.id}>
                              <td className="surface-subtle px-5 py-4 text-sm text-slate-700 first:rounded-l-[22px] last:rounded-r-[22px] dark:text-slate-200">
                                {note.stagiaire?.name || 'Stagiaire'}
                              </td>
                              <td className="surface-subtle px-5 py-4 text-sm text-slate-700 dark:text-slate-200">{note.cc1 ?? '-'}</td>
                              <td className="surface-subtle px-5 py-4 text-sm text-slate-700 dark:text-slate-200">{note.cc2 ?? '-'}</td>
                              <td className="surface-subtle px-5 py-4 text-sm text-slate-700 dark:text-slate-200">{note.cc3 ?? '-'}</td>
                              <td className="surface-subtle px-5 py-4 text-sm text-slate-700 dark:text-slate-200">{note.efm ?? '-'}</td>
                              <td className="surface-subtle px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                                {note.moyenne !== null && note.moyenne !== undefined ? Number(note.moyenne).toFixed(2) : '-'}
                              </td>
                              <td className="surface-subtle px-5 py-4 text-sm text-slate-700 first:rounded-l-[22px] last:rounded-r-[22px] dark:text-slate-200">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[note.status] || STATUS_STYLES.draft}`}>
                                  {note.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  Aucun detail disponible pour cette soumission.
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200/70 px-6 py-5 dark:border-white/10">
              <ActionButton variant="secondary" onClick={onClose}>
                Fermer
              </ActionButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default SubmissionDetailsModal;
