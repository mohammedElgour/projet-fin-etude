import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ManagementTable from '../components/admin/ManagementTable';
import { notificationApi } from '../services/api';
import { Bell, CheckCircle, Clock, Eye } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await notificationApi.list();
      const list = Array.isArray(payload?.data) ? payload.data : payload?.data?.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationApi.markRead(notificationId);
      loadNotifications(); // Refresh list
    } catch (err) {
      setError('Impossible de marquer comme lu.');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      loadNotifications();
    } catch (err) {
      setError('Impossible de marquer tout comme lu.');
    }
  };

  const rows = useMemo(() => 
    notifications.map((notification) => ({
      id: notification.id,
      message: notification.message,
      date: new Date(notification.created_at).toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      isRead: notification.is_read,
      notification,
    })), 
  [notifications]);

  const columns = [
    { 
      key: 'message', 
      header: 'Message',
      render: (row) => (
        <div className="max-w-md">
          <p className="font-medium text-slate-900 dark:text-white line-clamp-2">{row.message}</p>
        </div>
      )
    },
    { 
      key: 'date', 
      header: 'Date',
      className: 'text-right'
    },
    {
      key: 'isRead',
      header: 'Statut',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
          row.isRead 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' 
            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        }`}>
          {row.isRead ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {row.isRead ? 'Lu' : 'Non lu'}
        </span>
      ),
    },
  ];

  const rowActions = [
    {
      label: 'Marquer lu',
      onClick: (row) => markAsRead(row.id),
      disabled: (row) => row.isRead,
      className: (row) => 
        `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          row.isRead 
            ? 'bg-slate-100 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400' 
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
        }`,
    },
  ];

  const hasUnread = unreadCount > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Toutes vos notifications systeme et administratives.
            {hasUnread && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full dark:bg-blue-500/20 dark:text-blue-300">
                {unreadCount} non lu{unreadCount > 1 ? 'es' : ''}
              </span>
            )}
          </p>
        </div>
        {hasUnread && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
          >
            <Eye className="w-4 h-4" />
            Tout marquer lu
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/5">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200/50 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-xl p-6 shadow-sm">
        <ManagementTable
          data={rows}
          columns={columns}
          rowActions={rowActions}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage={
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Aucune notification
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Vous serez informe des evenements importants ici.
              </p>
            </div>
          }
          tableClassName="min-h-[400px]"
        />
      </section>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4">
        {notifications.length > 0 && (
          <>
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            {notifications.length === 1 ? '' : `s • Page 1 sur ${Math.ceil(notifications.length / 20)}`}
          </>
        )}
      </div>
    </div>
  );
}

