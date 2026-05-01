import React from 'react';
import { Calendar, Clock, Book, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const ScheduleView = ({ schedule = [], loading = false }) => {
  const scheduleItems = schedule.flatMap((entry) =>
    Array.isArray(entry.fichier)
      ? entry.fichier.map((slot, index) => ({
          id: `${entry.id}-${index}`,
          jour: slot.jour,
          heure: slot.heure,
          module: slot.module,
        }))
      : []
  );

  // Group by day
  const itemsByDay = {};
  scheduleItems.forEach((item) => {
    if (!itemsByDay[item.jour]) {
      itemsByDay[item.jour] = [];
    }
    itemsByDay[item.jour].push(item);
  });

  const days = Object.keys(itemsByDay).sort();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (scheduleItems.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center">
        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Aucun créneau planifié pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <motion.div
          key={day}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 px-2">
            <Calendar className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">{day}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {itemsByDay[day].map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{item.heure}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.module}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium transition-colors"
      >
        <Download className="h-4 w-4" />
        Télécharger l'emploi du temps
      </motion.button>
    </div>
  );
};

export default ScheduleView;
