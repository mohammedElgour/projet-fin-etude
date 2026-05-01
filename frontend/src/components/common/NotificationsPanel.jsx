import React, { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationApi, unwrapList } from '../../services/api';

const NotificationsPanel = ({
  notifications,
  onRefresh,
  loading: loadingProp = false,
  error: errorProp = '',
  showReadAll = true,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isControlled = Array.isArray(notifications);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await notificationApi.list();
      setItems(unwrapList(payload));
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isControlled) {
      return undefined;
    }

    loadNotifications();
    return undefined;
  }, [isControlled]);

  const displayItems = useMemo(() => (isControlled ? notifications : items), [isControlled, notifications, items]);
  const displayLoading = isControlled ? loadingProp : loading;
  const displayError = isControlled ? errorProp : error;

  const handleReadAll = async () => {
    try {
      await notificationApi.markAllRead();

      if (isControlled) {
        await onRefresh?.();
      } else {
        await loadNotifications();
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Impossible de marquer les notifications comme lues.';

      if (isControlled) {
        console.error(message);
      } else {
        setError(message);
      }
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Bell className="w-5 h-5 text-primary-500" />
          Notifications
        </h3>
        {showReadAll ? (
          <button
            onClick={handleReadAll}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Tout marquer lu
          </button>
        ) : null}
      </div>

      {displayLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p> : null}
      {displayError ? <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p> : null}
      {!displayLoading && !displayError && displayItems.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Aucune notification.</p>
      ) : null}

      {!displayLoading && !displayError && displayItems.length > 0 ? (
        <ul className="space-y-3">
          {displayItems.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border p-3 ${
                item.is_read
                  ? 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40'
                  : 'border-blue-100 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
              }`}
            >
              {item.title ? (
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
              ) : null}
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{item.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

export default NotificationsPanel;
