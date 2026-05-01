import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Bell } from 'lucide-react';

const RecentActivityItem = ({ icon: Icon, title, description, timestamp, type = 'info' }) => {
  const typeStyles = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    notification: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4"
    >
      <div className={`rounded-lg p-2 ${typeStyles[type]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{description}</p>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{timestamp}</div>
    </motion.div>
  );
};

export const RecentActivitySection = ({ activities = [], loading = false }) => {
  const defaultActivities = [
    {
      id: 1,
      icon: CheckCircle,
      title: 'Note validée',
      description: 'La note de Ahmed pour Module 1 a été validée',
      timestamp: 'Il y a 2h',
      type: 'success',
    },
    {
      id: 2,
      icon: AlertCircle,
      title: 'Note en attente',
      description: 'Fatima - Module 2: 18/20 (en attente de validation)',
      timestamp: 'Il y a 4h',
      type: 'warning',
    },
    {
      id: 3,
      icon: Bell,
      title: 'Nouvelle notification',
      description: 'Admin: Rappel de date limite pour la saisie des notes',
      timestamp: 'Il y a 1j',
      type: 'notification',
    },
    {
      id: 4,
      icon: CheckCircle,
      title: 'Note saisie',
      description: 'Mohamed - Module 3: 16/20 (créée)',
      timestamp: 'Il y a 1j',
      type: 'info',
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Activité récente</h3>
        <a href="/professeur/notifications" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          Voir tout →
        </a>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayActivities.slice(0, 4).map((activity) => (
            <RecentActivityItem key={activity.id} {...activity} />
          ))}
        </div>
      )}

      {displayActivities.length === 0 && !loading && (
        <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucune activité récente</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivitySection;
