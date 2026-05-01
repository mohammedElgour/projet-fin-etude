import React, { useEffect, useState } from 'react';
import { Bell, Megaphone } from 'lucide-react';
import { stagiaireApi } from '../services/api';

const StagiaireAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await stagiaireApi.announcements();
        setAnnouncements(Array.isArray(response) ? response : []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Impossible de charger les annonces.');
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Annonces et notifications</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Vous voyez ici vos notifications personnelles ainsi que les annonces globales pour les stagiaires.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-8 text-center text-slate-500 dark:text-slate-400">
          Chargement des annonces...
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-10 text-center">
          <Bell className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Aucune annonce</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Les nouvelles annonces apparaitront ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Megaphone className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {announcement.role === 'stagiaire' ? 'Annonce globale' : 'Notification personnelle'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {announcement.created_at
                    ? new Date(announcement.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </span>
              </div>

              {announcement.title ? (
                <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{announcement.title}</h2>
              ) : null}

              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">{announcement.message}</p>

              <div className="mt-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    announcement.is_read
                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                  }`}
                >
                  {announcement.role === 'stagiaire'
                    ? 'Annonce'
                    : announcement.is_read
                      ? 'Lu'
                      : 'Nouveau'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default StagiaireAnnouncementsPage;
