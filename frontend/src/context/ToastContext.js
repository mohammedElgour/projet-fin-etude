import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);

const toneStyles = {
  success: {
    icon: CheckCircle2,
    label: 'Success',
    ring: 'ring-emerald-500/20',
    border: 'border-emerald-500/20',
    glow: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    accent: 'from-emerald-500 to-teal-500',
    iconWrap: 'bg-emerald-500/10 text-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    text: 'text-emerald-600 dark:text-emerald-300',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    ring: 'ring-rose-500/20',
    border: 'border-rose-500/20',
    glow: 'from-rose-500/20 via-rose-500/10 to-transparent',
    accent: 'from-rose-500 to-orange-500',
    iconWrap: 'bg-rose-500/10 text-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    text: 'text-rose-600 dark:text-rose-300',
  },
  warning: {
    icon: TriangleAlert,
    label: 'Warning',
    ring: 'ring-amber-500/20',
    border: 'border-amber-500/20',
    glow: 'from-amber-500/20 via-amber-500/10 to-transparent',
    accent: 'from-amber-500 to-orange-500',
    iconWrap: 'bg-amber-500/10 text-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-300',
  },
  info: {
    icon: Info,
    label: 'Info',
    ring: 'ring-sky-500/20',
    border: 'border-sky-500/20',
    glow: 'from-sky-500/20 via-sky-500/10 to-transparent',
    accent: 'from-sky-500 to-cyan-500',
    iconWrap: 'bg-sky-500/10 text-sky-500',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    text: 'text-sky-600 dark:text-sky-300',
  },
};

const DEFAULT_DURATION = 3200;

const toastMetaStyles = {
  success: {
    wrapper: 'border-emerald-500/20 bg-white/95 shadow-[0_24px_70px_-26px_rgba(16,185,129,0.45)] dark:bg-slate-950/95',
    glow: 'from-emerald-500/22 via-emerald-500/10 to-transparent',
    iconWrap: 'bg-emerald-500/12 text-emerald-500 ring-emerald-500/10',
    accent: 'from-emerald-500 via-teal-500 to-cyan-500',
    chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    title: 'text-emerald-600 dark:text-emerald-300',
  },
  error: {
    wrapper: 'border-rose-500/20 bg-white/95 shadow-[0_24px_70px_-26px_rgba(244,63,94,0.42)] dark:bg-slate-950/95',
    glow: 'from-rose-500/22 via-rose-500/10 to-transparent',
    iconWrap: 'bg-rose-500/12 text-rose-500 ring-rose-500/10',
    accent: 'from-rose-500 via-pink-500 to-orange-500',
    chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    title: 'text-rose-600 dark:text-rose-300',
  },
  warning: {
    wrapper: 'border-amber-500/20 bg-white/95 shadow-[0_24px_70px_-26px_rgba(245,158,11,0.42)] dark:bg-slate-950/95',
    glow: 'from-amber-500/22 via-amber-500/10 to-transparent',
    iconWrap: 'bg-amber-500/12 text-amber-500 ring-amber-500/10',
    accent: 'from-amber-500 via-orange-500 to-red-500',
    chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    title: 'text-amber-600 dark:text-amber-300',
  },
  info: {
    wrapper: 'border-sky-500/20 bg-white/95 shadow-[0_24px_70px_-26px_rgba(14,165,233,0.4)] dark:bg-slate-950/95',
    glow: 'from-sky-500/22 via-sky-500/10 to-transparent',
    iconWrap: 'bg-sky-500/12 text-sky-500 ring-sky-500/10',
    accent: 'from-sky-500 via-cyan-500 to-indigo-500',
    chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    title: 'text-sky-600 dark:text-sky-300',
  },
};

const ToastCard = ({ t, tone, title, description, duration }) => {
  const style = toneStyles[tone] || toneStyles.info;
  const meta = toastMetaStyles[tone] || toastMetaStyles.info;
  const Icon = style.icon;
  const progressDuration = Math.max(1800, duration || DEFAULT_DURATION);
  const [paused, setPaused] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {t.visible ? (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.94, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, scale: 0.97, filter: 'blur(2px)' }}
          transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.8 }}
          className={`pointer-events-auto w-[calc(100vw-1rem)] max-w-md overflow-hidden rounded-[28px] border backdrop-blur-2xl ${meta.wrapper} ${style.border} ${style.ring}`}
          style={{ transformOrigin: 'top right' }}
          role="status"
          aria-live="polite"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${meta.glow} opacity-75`} />
            <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.9)_1px,transparent_0)] [background-size:18px_18px] dark:opacity-[0.08]" />
            <div className="absolute inset-x-0 top-0 h-1 bg-slate-100/90 dark:bg-white/5">
              <div
                className={`h-full origin-left bg-gradient-to-r ${meta.accent}`}
                style={{
                  animation: `toast-progress ${progressDuration}ms linear forwards`,
                  animationPlayState: paused ? 'paused' : 'running',
                }}
              />
            </div>

            <div className="relative flex items-start gap-4 px-4 pb-4 pt-5 sm:px-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-black/10 ring-1 dark:ring-white/10 ${meta.iconWrap}`}>
                <Icon className="h-6 w-6" strokeWidth={2.25} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${meta.chip}`}>
                    {style.label}
                  </span>
                </div>

                <p className={`mt-2 text-[15px] font-semibold tracking-[-0.02em] ${meta.title} dark:text-white`}>{title}</p>
                {description ? (
                  <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="rounded-xl p-2 text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-slate-700 hover:shadow-sm dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export const ToastProvider = ({ children }) => {
  const pushToast = useCallback(
    ({ title, description = '', tone = 'info', duration = DEFAULT_DURATION }) => {
      const id = toast.custom(
        (t) => <ToastCard t={t} tone={tone} title={title} description={description} duration={duration} />,
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
        gutter={14}
        containerStyle={{ top: 16, right: 16 }}
        toastOptions={{
          duration: DEFAULT_DURATION,
          success: {
            duration: DEFAULT_DURATION,
          },
          error: {
            duration: DEFAULT_DURATION,
          },
          loading: {
            duration: DEFAULT_DURATION,
          },
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
          },
        }}
      />
      <style>{`
        @keyframes toast-progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
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
