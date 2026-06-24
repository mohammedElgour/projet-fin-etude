import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { BellRing, CheckCheck, Search, Trash2 } from 'lucide-react';

import { notificationApi } from '../services/api';
import { useStagiaireData } from '../hooks/useStagiaireData';
import { LoadingPanel, PageShell, PortalCard } from '../components/stagiaire/StudentPortalCards';

const formatDate = (value) => {
  if (!value) {
    return 'Date non renseignee';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const StagiaireAnnouncementsPage = () => {
  const { announcements, loading, error } = useStagiaireData();
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const notifications = items || announcements;

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((item) => {
        const matchesQuery = `${item.title || ''} ${item.message || ''}`.toLowerCase().includes(query.toLowerCase());
        const matchesFilter =
          filter === 'all' ||
          (filter === 'read' && item.is_read) ||
          (filter === 'unread' && !item.is_read);

        return matchesQuery && matchesFilter;
      }),
    [filter, notifications, query]
  );

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const updateItems = (updater) => {
    setItems((current) => updater(current || announcements));
  };

  const markAsRead = async (notification) => {
    if (notification.is_read) {
      return;
    }

    await notificationApi.markRead(notification.id);
    updateItems((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
  };

  const markAllAsRead = async () => {
    await notificationApi.markAllRead();
    updateItems((current) => current.map((item) => ({ ...item, is_read: true })));
  };

  const deleteNotification = async (notificationId) => {
    await notificationApi.deleteLocal(notificationId);
    updateItems((current) => current.filter((item) => item.id !== notificationId));
  };

  if (loading) {
    return <LoadingPanel label="Chargement des notifications..." />;
  }

  return (
    <PageShell>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <PortalCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400">Notifications</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Centre de notifications</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{unreadCount} notification(s) non lue(s)</p>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une notification"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-500/10"
            />
          </label>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
            {[
              ['all', 'All'],
              ['read', 'Read'],
              ['unread', 'Unread'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={clsx(
                  'rounded-xl px-4 py-2 text-sm font-semibold transition',
                  filter === value
                    ? 'bg-white text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </PortalCard>

      <div className="space-y-4">
        {filteredNotifications.length ? (
          filteredNotifications.map((item) => (
            <article
              key={item.id}
              className={clsx(
                'rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-950/75',
                item.is_read
                  ? 'border-gray-100 dark:border-white/10'
                  : 'border-sky-200 ring-1 ring-sky-100 dark:border-sky-500/30 dark:ring-sky-500/20'
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white">{item.title || 'Notification'}</h2>
                    <span
                      className={clsx(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        item.is_read
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                      )}
                    >
                      {item.is_read ? 'Lu' : 'Non lu'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Administration - {formatDate(item.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => markAsRead(item)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-sky-600 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900"
                    disabled={item.is_read}
                    aria-label="Marquer comme lu"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNotification(item.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 text-rose-500 transition hover:bg-rose-50 dark:border-rose-500/20 dark:hover:bg-rose-500/10"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <PortalCard className="py-12 text-center">
            <BellRing className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Aucune notification</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucun message ne correspond aux filtres selectionnes.</p>
          </PortalCard>
        )}
      </div>
    </PageShell>
  );
};

export default StagiaireAnnouncementsPage;
