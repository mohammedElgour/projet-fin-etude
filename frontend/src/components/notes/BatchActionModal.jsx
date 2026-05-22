import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
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

const BatchActionModal = ({
  isOpen,
  mode = 'validate',
  title,
  description,
  loading = false,
  requireReason = false,
  onCancel,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const isReject = mode === 'reject';
  const Icon = isReject ? AlertTriangle : CheckCircle2;
  const accentClass = isReject
    ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300';

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
        >
          <motion.div
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="surface-panel w-full max-w-xl rounded-[28px] p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {requireReason ? (
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Motif de rejet
                </label>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Expliquez ce qui doit etre corrige avant nouvelle soumission..."
                  className="min-h-28 w-full rounded-[18px] border border-white/70 bg-white/85 px-4 py-3.5 text-sm text-slate-900 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.28)] outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:focus:border-rose-500 dark:focus:ring-rose-500/15"
                />
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="neutral" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
                Annuler
              </ActionButton>
              <ActionButton
                variant={isReject ? 'danger' : 'success'}
                onClick={() => onConfirm(reason)}
                loading={loading}
                className="w-full sm:w-auto"
              >
                {isReject ? 'Rejeter toutes les notes' : 'Valider toutes les notes'}
              </ActionButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default BatchActionModal;
