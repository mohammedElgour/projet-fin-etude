import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ActionButton from './ActionButton';

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panel = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: 18, scale: 0.98, transition: { duration: 0.15 } },
};

const DeleteConfirmModal = ({
  isOpen,
  title = 'Confirmer la suppression',
  description,
  itemName,
  loading = false,
  onCancel,
  onConfirm,
}) => (
  <AnimatePresence>
    {isOpen ? (
      <motion.div
        variants={backdrop}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
      >
        <motion.div
          variants={panel}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-950/95"
        >
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {description || `Cette action supprimera ${itemName ? `"${itemName}"` : "cet element"} definitivement.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <ActionButton variant="neutral" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
              Annuler
            </ActionButton>
            <ActionButton variant="danger" onClick={onConfirm} loading={loading} className="w-full sm:w-auto">
              Supprimer
            </ActionButton>
          </div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default DeleteConfirmModal;
