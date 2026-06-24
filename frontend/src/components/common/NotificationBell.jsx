import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { notificationApi } from '../../services/api';

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const normalizeNotifications = (payload) => {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return [];
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const visibleItems = useMemo(() => items.slice(0, 6), [items]);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');

    try {
      const [listPayload, countPayload] = await Promise.all([
        notificationApi.list(),
        notificationApi.unreadCount(),
      ]);

      setItems(normalizeNotifications(listPayload));
      setUnreadCount(Number(countPayload?.count || 0));
    } catch (error) {
      setError(error?.response?.data?.message || 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    loadNotifications();

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleMarkAsRead = async (notificationId, isRead) => {
    if (isRead) {
      return;
    }

    try {
      await notificationApi.markRead(notificationId);

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );
      setUnreadCount((currentCount) => Math.max(currentCount - 1, 0));
    } catch (error) {
      setError(error?.response?.data?.message || 'Impossible de marquer la notification comme lue.');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/80 text-slate-600 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="surface-panel absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[340px] rounded-3xl p-3"
          >
            <div className="mb-3 flex items-center justify-between px-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} non lue(s)</p>
              </div>
            </div>

            {loading ? (
              <p className="px-2 py-8 text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
            ) : error ? (
              <p className="px-2 py-4 text-sm text-rose-600 dark:text-rose-300">{error}</p>
            ) : visibleItems.length === 0 ? (
              <p className="px-2 py-8 text-sm text-slate-500 dark:text-slate-400">Aucune notification.</p>
            ) : (
              <div className="space-y-2">
                {visibleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMarkAsRead(item.id, item.is_read)}
                    className={`block w-full rounded-2xl border px-3 py-3 text-left transition ${
                      item.is_read
                        ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50'
                        : 'border-sky-100 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {item.title || 'Notification'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
                      </div>
                      {!item.is_read ? (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" aria-hidden="true" />
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{formatDate(item.created_at)}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
