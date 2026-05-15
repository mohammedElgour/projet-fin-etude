import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '../services/api';

const mockDashboard = {
  kpis: {
    stagiaires: 120,
    professeurs: 18,
    absences: 6,
    validated_notes_rate: 78,
  },
  charts: {
    lowest_modules: [
      { nom: 'DÃ©veloppement', average_note: 11.2 },
      { nom: 'RÃ©seaux', average_note: 12.0 },
      { nom: 'Gestion', average_note: 10.8 },
    ],
    results_evolution: [
      { period: 'Jan', average_note: 11.5 },
      { period: 'Fev', average_note: 12.2 },
      { period: 'Mar', average_note: 13.4 },
      { period: 'Avr', average_note: 14.1 },
    ],
    performance_by_filiere: [
      { nom: 'DÃ©veloppement', average_note: 17.2 },
      { nom: 'Gestion', average_note: 15.1 },
      { nom: 'RÃ©seaux', average_note: 14.6 },
      { nom: 'Design', average_note: 16.0 },
    ],
  },
  recent_activities: [
    { id: 1, message: 'Note validÃ©e par le professeur', created_at: new Date().toISOString(), type: 'Valide' },
    { id: 2, message: 'Emploi du temps mis Ã  jour', created_at: new Date().toISOString(), type: 'Planning' },
    { id: 3, message: 'Nouvelle notification envoyÃ©e', created_at: new Date().toISOString(), type: 'Info' },
  ],
};

const normalizeCollectionResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
};

export function useDirecteurDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError('');
      try {
        const res = await adminApi.dashboardStats();
        if (!cancelled) {
          setStats(res);
        }
      } catch (e) {
        console.error('Directeur dashboard request failed:', e);
        if (!cancelled) {
          setError('Impossible de charger les indicateurs. Mode mock actif.');
          setStats(mockDashboard);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ loading, error, stats }), [loading, error, stats]);
}

export function useDirecteurResourceList(fetcher, emptyMessage = 'Aucune donnee disponible') {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetcherRef.current();
      setItems(normalizeCollectionResponse(response));
    } catch (err) {
      console.error('Directeur resource request failed:', err);
      setItems([]);
      setError(err?.response?.data?.message || err?.message || 'Impossible de charger la liste.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return useMemo(
    () => ({
      loading,
      error,
      items,
      emptyMessage,
      reload: loadData,
    }),
    [loading, error, items, emptyMessage, loadData]
  );
}
