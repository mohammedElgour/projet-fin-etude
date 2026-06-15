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
  submitted: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const FIELD_CARD = 'rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900/60';

const EvaluationDetailsModal = ({
  isOpen,
  evaluation,
  loading = false,
  onClose,
  onApprove,
  onReject,
}) => {
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

    setFeedback(evaluation?.feedback || '');
    setActionError('');
    setActionLoading(false);
  }, [evaluation, isOpen]);

  const handleApprove = async () => {
    if (!onApprove || !evaluation) {
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      await onApprove(evaluation);
    } catch (error) {
      console.error(error);
      setActionError(error?.response?.data?.message || 'Impossible de valider cette evaluation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !evaluation) {
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      await onReject(evaluation, feedback);
    } catch (error) {
      console.error(error);
      setActionError(error?.response?.data?.message || 'Impossible de rejeter cette evaluation.');
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
                  Evaluation
                </div>
                <h3 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                  {evaluation?.evaluation_label || 'Détail de l evaluation'}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Consultez la fiche d evaluation et prenez une decision sans valider le module ou le groupe entier.
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
              ) : evaluation ? (
                <div className="space-y-6">
                  {actionError ? (
                    <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                      {actionError}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: 'Student', value: evaluation.student?.name || '-' },
                      { label: 'Groupe', value: evaluation.groupe?.nom || '-' },
                      { label: 'Filiere', value: evaluation.groupe?.filiere?.nom || '-' },
                      { label: 'Module', value: evaluation.module?.nom || '-' },
                      { label: 'Professor', value: evaluation.professor?.name || '-' },
                      { label: 'Evaluation Type', value: evaluation.evaluation_label || '-' },
                      { label: 'Grade', value: evaluation.grade_value ?? '-' },
                      {
                        label: 'Status',
                        value: (
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[evaluation.status] || STATUS_STYLES.draft}`}>
                            {evaluation.status}
                          </span>
                        ),
                      },
                      { label: 'Submission Date', value: evaluation.submission_date ? new Date(evaluation.submission_date).toLocaleString('fr-FR') : '-' },
                    ].map((item) => (
                      <div key={item.label} className={FIELD_CARD}>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.label}</p>
                        <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
                    <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72">
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Validation History</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Le suivi reprend les etapes disponibles pour cette evaluation.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {(evaluation.history || []).map((entry) => (
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
                            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{entry.date ? new Date(entry.date).toLocaleString('fr-FR') : 'Date non disponible'}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Decision admin</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Vous pouvez approuver cette evaluation ou la rejeter avec un retour optionnel.
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
                        disabled={actionLoading || (evaluation.status !== 'submitted' && evaluation.status !== 'pending')}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                            actionLoading || (evaluation.status !== 'submitted' && evaluation.status !== 'pending')
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
                        disabled={actionLoading || (evaluation.status !== 'submitted' && evaluation.status !== 'pending')}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                            actionLoading || (evaluation.status !== 'submitted' && evaluation.status !== 'pending')
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
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  Aucun detail disponible pour cette evaluation.
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

export default EvaluationDetailsModal;
