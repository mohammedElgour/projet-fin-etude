import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationApi } from '../../services/api';

const NotificationsPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await notificationApi.list();
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Impossible de charger les notifications.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleReadAll = async () => {
    try {
      await notificationApi.readAll();
      loadNotifications();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Impossible de marquer les notifications comme lues.'
      );
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-500" />
          Notifications
        </h3>
        <button
          onClick={handleReadAll}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Tout marquer lu
        </button>
      </div>

      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Chargement des notifications...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aucune notification pour le moment.
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-700"
            >
              <p className="text-sm text-slate-800 dark:text-slate-100">
                {item.message || item.titre || 'Notification'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default NotificationsPanel;
