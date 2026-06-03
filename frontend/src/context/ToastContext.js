import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);

const toneStyles = {
  success: {
    icon: CheckCircle2,
    accentClass: 'from-emerald-500/15 to-emerald-500/5 ring-emerald-200/70 dark:ring-emerald-500/20',
    iconClass: 'text-emerald-500',
  },
  error: {
    icon: AlertCircle,
    accentClass: 'from-rose-500/15 to-rose-500/5 ring-rose-200/70 dark:ring-rose-500/20',
    iconClass: 'text-rose-500',
  },
  warning: {
    icon: TriangleAlert,
    accentClass: 'from-amber-500/15 to-orange-500/5 ring-amber-200/70 dark:ring-amber-500/20',
    iconClass: 'text-amber-500',
  },
  info: {
    icon: Info,
    accentClass: 'from-sky-500/15 to-cyan-500/5 ring-sky-200/70 dark:ring-sky-500/20',
    iconClass: 'text-sky-500',
  },
};

const ToastCard = ({ t, tone, title, description }) => {
  const style = toneStyles[tone] || toneStyles.info;
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={t.visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-[22px] bg-white/95 shadow-2xl shadow-slate-950/10 ring-1 backdrop-blur-xl dark:bg-slate-950/95 ${style.accentClass}`}
      style={{ transformOrigin: 'top right' }}
    >
      <div className="bg-gradient-to-br from-white/80 to-transparent p-4 dark:from-white/5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
            <Icon className={`h-5 w-5 ${style.iconClass}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
            {description ? (
              <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="h-1 w-full bg-slate-100/80 dark:bg-slate-800/80">
        <div className={`h-full w-full bg-gradient-to-r ${tone === 'success' ? 'from-emerald-500 to-teal-500' : tone === 'error' ? 'from-rose-500 to-orange-500' : tone === 'warning' ? 'from-amber-500 to-orange-500' : 'from-sky-500 to-cyan-500'}`} />
      </div>
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const pushToast = useCallback(
    ({ title, description = '', tone = 'info', duration = 3000 }) => {
      const id = toast.custom(
        (t) => (
          <ToastCard
            t={t}
            tone={tone}
            title={title}
            description={description}
          />
        ),
        { duration }
      );

      return id;
    },
    []
  );

  const value = useMemo(
    () => ({
      toast: pushToast,
      success: (title, description) => pushToast({ title, description, tone: 'success' }),
      error: (title, description) => pushToast({ title, description, tone: 'error' }),
      warning: (title, description) => pushToast({ title, description, tone: 'warning' }),
      info: (title, description) => pushToast({ title, description, tone: 'info' }),
      dismissToast: (id) => toast.dismiss(id),
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        gutter={12}
        containerStyle={{ top: 16, right: 16 }}
        toastOptions={{ duration: 3000 }}
      />
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
