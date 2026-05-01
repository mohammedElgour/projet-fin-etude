import React, { useEffect, useState } from 'react';
import { notificationApi, professeurApi, unwrapList } from '../services/api';
import NotificationsPanel from '../components/common/NotificationsPanel';

const ProfNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');

    try {
      const [notifsRes, countRes] = await Promise.all([
        notificationApi.list(),
        professeurApi.notificationsCount(),
      ]);

      setNotifications(unwrapList(notifsRes));
      setUnreadCount(countRes.unread_count || 0);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    setError('');

    try {
      await notificationApi.markAllRead();
      setSuccess('Toutes les notifications ont ete marquees comme lues.');
      await loadNotifications();
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de marquer les notifications comme lues.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {unreadCount} non lues • Total: {notifications.length}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : null}

      <NotificationsPanel
        notifications={notifications}
        loading={loading}
        error={error}
        onRefresh={loadNotifications}
      />
    </div>
  );
};

export default ProfNotificationsPage;
