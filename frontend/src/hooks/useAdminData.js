import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '../services/api';
import { normalizeCollectionResponse } from '../lib/normalizeCollectionResponse';

const getRequestErrorMessage = (err, fallbackError) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    fallbackError
  );
};

export const useAdminDashboardData = () => {
  const [stats, setStats] = useState(null);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [statsRes, pendingRes] = await Promise.all([
        adminApi.dashboardStats(),
        adminApi.pendingNotes(),
      ]);

      setStats(statsRes);
      setPendingNotes(pendingRes?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de charger le tableau de bord admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    stats,
    pendingNotes,
    loading,
    error,
    reload: loadData,
  };
};

export const useAdminResourceList = (loader, fallbackError) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await loaderRef.current();
      setItems(normalizeCollectionResponse(response));
    } catch (err) {
      console.error('Admin resource request failed:', err);
      setItems([]);
      setError(getRequestErrorMessage(err, fallbackError));
    } finally {
      setLoading(false);
    }
  }, [fallbackError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return useMemo(
    () => ({
      items,
      loading,
      error,
      reload: loadData,
    }),
    [error, items, loadData, loading]
  );
};
