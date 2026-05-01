import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { professeurApi } from '../services/api';
import { DAY_ORDER, groupSlotsByDay, normalizeTimetableEntries } from '../utils/timetable';

const formatSlotLabel = (slot) => {
  const time = slot.endTime ? `${slot.startTime} - ${slot.endTime}` : slot.startTime;
  const group = slot.group ? ` - ${slot.group}` : '';
  const room = slot.room ? ` - ${slot.room}` : '';

  return `${time}${group}${room}`;
};

const ProfEmploiPage = () => {
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [catalog, setCatalog] = useState({ groupes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroupe, setSelectedGroupe] = useState('');

  const loadEmploi = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [scheduleRes, catalogRes] = await Promise.all([
        professeurApi.schedule({ groupe_id: selectedGroupe || undefined }),
        professeurApi.catalog(),
      ]);

      const groupedSchedule = scheduleRes?.data || {};
      const flattenedEntries = Object.values(groupedSchedule).flatMap((items) =>
        Array.isArray(items) ? items : []
      );

      setScheduleEntries(flattenedEntries);
      setCatalog(catalogRes || { groupes: [] });
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement de l emploi du temps.');
    } finally {
      setLoading(false);
    }
  }, [selectedGroupe]);

  useEffect(() => {
    loadEmploi();
  }, [loadEmploi]);

  const slots = useMemo(() => normalizeTimetableEntries(scheduleEntries), [scheduleEntries]);
  const timetable = useMemo(() => groupSlotsByDay(slots), [slots]);

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Emploi du temps</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Planning des seances issues de vos affectations par groupe et module.
          </p>
        </div>

        <div className="sm:w-72">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Groupe</label>
          <select
            value={selectedGroupe}
            onChange={(event) => setSelectedGroupe(event.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white"
          >
            <option value="">Tous les groupes</option>
            {(catalog.groupes || []).map((groupe) => (
              <option key={groupe.id} value={groupe.id}>
                {groupe.nom} {groupe.filier?.nom ? `(${groupe.filier.nom})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : null}

      {slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 px-6 py-16 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aucun creneau trouve</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Aucune seance n est disponible pour les filtres selectionnes.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm">
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
                <tr key={day} className="align-top">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{day}</td>
                  <td className="px-6 py-4">
                    {timetable[day]?.length ? (
                      <div className="space-y-3">
                        {timetable[day].map((slot) => (
                          <div
                            key={slot.id}
                            className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-slate-800 dark:bg-blue-500/10 dark:text-slate-100"
                          >
                            <p className="font-semibold">{slot.module}</p>
                            <p className="mt-1 text-slate-600 dark:text-slate-300">{formatSlotLabel(slot)}</p>
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

export default ProfEmploiPage;
