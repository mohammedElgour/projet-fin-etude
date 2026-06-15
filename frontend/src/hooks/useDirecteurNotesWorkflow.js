import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../services/api';
import { normalizeCollectionResponse } from '../lib/normalizeCollectionResponse';

export const useDirecteurNotesWorkflow = () => {
  const [groupes, setGroupes] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    validated: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizeSummary = (payload = {}) => {
    const approved = Number(payload.approved ?? payload.validated ?? 0);

    return {
      total: Number(payload.total ?? 0),
      draft: Number(payload.draft ?? 0),
      submitted: Number(payload.submitted ?? 0),
      approved,
      validated: approved,
      rejected: Number(payload.rejected ?? 0),
    };
  };

  const loadCatalog = useCallback(async () => {
    const [groupsResponse, modulesResponse] = await Promise.all([
      adminApi.groups({ per_page: 200 }),
      adminApi.modules({ per_page: 200 }),
    ]);

    const nextGroups = normalizeCollectionResponse(groupsResponse);
    const nextModules = normalizeCollectionResponse(modulesResponse);

    setGroupes(nextGroups);
    setModules(nextModules);

    if (!selectedGroup && nextGroups[0]?.id) {
      setSelectedGroup(String(nextGroups[0].id));
    }
  }, [selectedGroup]);

  const loadWorkflow = useCallback(async (groupId, moduleId) => {
    if (!groupId || !moduleId) {
      setRows([]);
      setSummary({
        total: 0,
        draft: 0,
        submitted: 0,
        approved: 0,
        validated: 0,
        rejected: 0,
      });
      return;
    }

    setTableLoading(true);
    setError('');

    try {
      const response = await adminApi.workflowNotes({
        groupe_id: Number(groupId),
        module_id: Number(moduleId),
      });

      setRows(Array.isArray(response?.data) ? response.data : []);
      setSummary(normalizeSummary(response?.summary));
    } catch (err) {
      console.error(err);
      setRows([]);
      setSummary({
        total: 0,
        draft: 0,
        submitted: 0,
        approved: 0,
        validated: 0,
        rejected: 0,
      });
      setError(err?.response?.data?.message || 'Impossible de charger le workflow des notes.');
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError('');

      try {
        await loadCatalog();
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Impossible de charger les groupes et modules.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadCatalog]);

  useEffect(() => {
    loadWorkflow(selectedGroup, selectedModule);
  }, [loadWorkflow, selectedGroup, selectedModule]);

  const selectedGroupItem = useMemo(
    () => groupes.find((groupe) => String(groupe.id) === String(selectedGroup)) || null,
    [groupes, selectedGroup]
  );

  const filteredModules = useMemo(() => {
    if (!selectedGroupItem?.filiere_id) {
      return modules;
    }

    return modules.filter((module) => String(module.filiere_id) === String(selectedGroupItem.filiere_id));
  }, [modules, selectedGroupItem]);

  useEffect(() => {
    if (!selectedGroupItem) {
      return;
    }

    const moduleStillValid = filteredModules.some((module) => String(module.id) === String(selectedModule));

    if (!moduleStillValid) {
      setSelectedModule(filteredModules[0]?.id ? String(filteredModules[0].id) : '');
    }
  }, [filteredModules, selectedGroupItem, selectedModule]);

  const reload = useCallback(async () => {
    await loadWorkflow(selectedGroup, selectedModule);
  }, [loadWorkflow, selectedGroup, selectedModule]);

  return {
    groupes,
    modules: filteredModules,
    selectedGroup,
    setSelectedGroup,
    selectedModule,
    setSelectedModule,
    selectedGroupItem,
    rows,
    summary,
    loading,
    tableLoading,
    error,
    setError,
    reload,
  };
};
