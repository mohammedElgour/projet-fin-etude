import React, { useEffect, useMemo, useState } from 'react';
import { stagiaireApi } from '../services/api';
import { DAY_ORDER, groupSlotsByDay, normalizeTimetableEntries } from '../utils/timetable';

const StagiaireTimetablePage = () => {
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await stagiaireApi.schedule();
        setScheduleEntries(Array.isArray(response) ? response : []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Impossible de charger votre emploi du temps.');
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  const slots = useMemo(() => normalizeTimetableEntries(scheduleEntries), [scheduleEntries]);
  const groupedSlots = useMemo(() => groupSlotsByDay(slots), [slots]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mon emploi du temps</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Planning extrait des donnees JSON de votre groupe.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-8 text-center text-slate-500 dark:text-slate-400">
          Chargement de l emploi du temps...
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aucun creneau disponible</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Votre groupe n a pas encore de planning publie.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Jour
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Seances
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {DAY_ORDER.map((day) => (
                <tr key={day}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{day}</td>
                  <td className="px-6 py-4">
                    {groupedSlots[day]?.length ? (
                      <div className="space-y-3">
                        {groupedSlots[day].map((slot) => (
                          <div
                            key={slot.id}
                            className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 dark:bg-slate-800/70 dark:text-slate-100"
                          >
                            <p className="font-semibold">{slot.module}</p>
                            <p className="mt-1 text-slate-600 dark:text-slate-300">
                              {slot.endTime ? `${slot.startTime} - ${slot.endTime}` : slot.startTime}
                              {slot.room ? ` - ${slot.room}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400">Libre</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StagiaireTimetablePage;
