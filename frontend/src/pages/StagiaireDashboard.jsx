import React, { useEffect, useMemo, useState } from 'react';
import NotificationsPanel from '../components/common/NotificationsPanel';
import { stagiaireApi } from '../services/api';

const StagiaireDashboard = () => {
  const [notes, setNotes] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [notesRes, scheduleRes, annRes, recoRes] = await Promise.all([
          stagiaireApi.notes(),
          stagiaireApi.schedule(),
          stagiaireApi.announcements(),
          stagiaireApi.recommendation(),
        ]);

        setNotes(Array.isArray(notesRes) ? notesRes : []);
        setSchedule(Array.isArray(scheduleRes) ? scheduleRes : []);
        setAnnouncements(Array.isArray(annRes) ? annRes : []);
        setRecommendation(recoRes);
      } catch (err) {
        setError(err?.response?.data?.message || 'Impossible de charger votre espace.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const average = useMemo(() => recommendation?.average ?? 0, [recommendation]);
  const scheduleItems = schedule.flatMap((entry) =>
    Array.isArray(entry.fichier)
      ? entry.fichier.map((slot, index) => ({
          id: `${entry.id}-${index}`,
          label: `${slot.jour} ${slot.heure} - ${slot.module}`,
        }))
      : []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Espace stagiaire</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Consultez vos notes validees, votre moyenne et les annonces utiles.
        </p>
      </div>

      {loading && <p className="text-slate-500 dark:text-slate-400">Chargement...</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Moyenne</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{average}/20</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Notes validees</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{notes.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Performance</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                {recommendation?.recommendation || 'Aucune recommandation pour le moment.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Mes notes validees</h2>
              {notes.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Aucune note validee pour le moment.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li key={note.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                      <span className="text-sm text-slate-700 dark:text-slate-200">{note.module?.nom || 'Module'}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{note.note}/20</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Mon emploi du temps</h2>
              {scheduleItems.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Aucun creneau planifie.</p>
              ) : (
                <ul className="space-y-3">
                  {scheduleItems.map((item) => (
                    <li key={item.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Annonces</h2>
              {announcements.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Aucune annonce.</p>
              ) : (
                <ul className="space-y-3">
                  {announcements.map((item) => (
                    <li key={item.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                      {item.message}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <NotificationsPanel />
          </div>
        </>
      )}
    </div>
  );
};

export default StagiaireDashboard;
