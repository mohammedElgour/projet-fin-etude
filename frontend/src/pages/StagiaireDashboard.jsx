import React, { useEffect, useState } from 'react';
import { stagiaireApi } from '../services/api';
import NotificationsPanel from '../components/common/NotificationsPanel';

const StagiaireDashboard = () => {
  const [notes, setNotes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [notesRes, annRes, recoRes] = await Promise.all([
          stagiaireApi.notes(),
          stagiaireApi.announcements(),
          stagiaireApi.recommendation(),
        ]);

        setNotes(notesRes?.data?.data || notesRes?.data || []);
        setAnnouncements(annRes?.data?.data || annRes?.data || []);
        setRecommendation(recoRes?.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            'Impossible de charger les informations stagiaire.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Tableau de bord Stagiaire
      </h1>
      <p className="text-slate-600 dark:text-slate-300 mb-8">
        Consultez vos notes, annonces et recommandations.
      </p>

      {loading && (
        <p className="text-slate-500 dark:text-slate-400">
          Chargement des données...
        </p>
      )}

      {error && (
        <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Notes
              </h2>
              {notes.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucune note disponible.
                </p>
              ) : (
                <ul className="space-y-2">
                  {notes.slice(0, 8).map((note) => (
                    <li
                      key={note.id}
                      className="text-sm text-slate-700 dark:text-slate-200"
                    >
                      {note.module?.nom || note.module_name || 'Module'} : {note.note}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Annonces
              </h2>
              {announcements.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucune annonce.
                </p>
              ) : (
                <ul className="space-y-2">
                  {announcements.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="text-sm text-slate-700 dark:text-slate-200"
                    >
                      {item.titre || item.title || 'Annonce'}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Recommandation IA
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {recommendation?.message ||
                recommendation?.recommendation ||
                'Aucune recommandation disponible pour le moment.'}
            </p>
          </section>
        </>
      )}

      <NotificationsPanel />
    </div>
  );
};

export default StagiaireDashboard;
