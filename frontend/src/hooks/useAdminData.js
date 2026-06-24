import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN_DASHBOARD_REFRESH_EVENT, adminApi } from '../services/api';
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
  const [evaluationQueue, setEvaluationQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const [statsResult, submissionsResult] = await Promise.allSettled([
        adminApi.dashboardStats(),
        adminApi.evaluationQueue(),
      ]);

      const nextErrors = [];

      if (statsResult.status === 'fulfilled') {
        const statsRes = statsResult.value;
        const normalizedStats = statsRes?.kpis || statsRes?.charts ? statsRes : statsRes?.data || {};
        setStats(normalizedStats);
      } else {
        setStats(null);
        nextErrors.push(getRequestErrorMessage(statsResult.reason, 'Impossible de charger les statistiques admin.'));
      }

      if (submissionsResult.status === 'fulfilled') {
        const submissionsRes = submissionsResult.value;
        const normalizedSubmissions = Array.isArray(submissionsRes)
          ? submissionsRes
          : submissionsRes?.data || submissionsRes?.results || [];
        setEvaluationQueue(normalizedSubmissions);
      } else {
        setEvaluationQueue([]);
        nextErrors.push(getRequestErrorMessage(submissionsResult.reason, 'Impossible de charger la file de validation.'));
      }

      if (nextErrors.length) {
        setError(nextErrors.join(' '));
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleRefresh = () => {
      loadData();
    };

    window.addEventListener(ADMIN_DASHBOARD_REFRESH_EVENT, handleRefresh);

    return () => {
      window.removeEventListener(ADMIN_DASHBOARD_REFRESH_EVENT, handleRefresh);
    };
  }, [loadData]);

  return {
    stats,
    evaluationQueue,
    pendingNotes: evaluationQueue,
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
      setItems(normalizeCollectionResponse(response) || []);
    } catch (err) {
      console.error(err);
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
