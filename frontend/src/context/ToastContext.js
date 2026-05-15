import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

const toneStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    ringClass: 'ring-emerald-200/70 dark:ring-emerald-500/20',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-500',
    ringClass: 'ring-rose-200/70 dark:ring-rose-500/20',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, description = '', tone = 'success', duration = 3200 }) => {
      const id = ++toastId;
      setToasts((current) => [...current, { id, title, description, tone }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, duration);
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      toast: pushToast,
      success: (title, description) => pushToast({ title, description, tone: 'success' }),
      error: (title, description) => pushToast({ title, description, tone: 'error' }),
      dismissToast,
    }),
    [dismissToast, pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex justify-center px-4 sm:justify-end">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <AnimatePresence>
            {toasts.map((toast) => {
              const tone = toneStyles[toast.tone] || toneStyles.success;
              const Icon = tone.icon;

              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className={`pointer-events-auto rounded-2xl bg-white/95 p-4 shadow-2xl shadow-slate-950/10 ring-1 backdrop-blur-xl dark:bg-slate-950/95 ${tone.ringClass}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${tone.iconClass}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{toast.title}</p>
                      {toast.description ? (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{toast.description}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissToast(toast.id)}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label="Fermer la notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
