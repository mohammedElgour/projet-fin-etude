import { useCallback, useEffect, useMemo, useState } from 'react';
import { professeurApi } from '../services/api';

export const useProfesseurData = () => {
  const [catalog, setCatalog] = useState({ groupes: [], modules: [] });
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (groupId = '', moduleId = '') => {
    setLoading(true);
    setError('');

    try {
      const [catalogRes, studentsRes, scheduleRes] = await Promise.all([
        professeurApi.catalog(),
        professeurApi.students({
          ...(groupId ? { groupe_id: groupId } : {}),
          ...(moduleId ? { module_id: moduleId } : {}),
        }),
        professeurApi.schedule(groupId ? { groupe_id: groupId } : {}),
      ]);

      setCatalog(catalogRes);
      setStudents(studentsRes?.data || []);
      setSchedule(scheduleRes?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de charger les donnees professeur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedGroup, selectedModule);
  }, [loadData, selectedGroup, selectedModule]);

  const rows = useMemo(
    () =>
      students.map((student) => {
        const currentNote = Array.isArray(student.notes) && student.notes.length ? student.notes[0] : null;
        return {
          id: student.id,
          studentId: student.id,
          name: student.user?.name || 'Stagiaire',
          groupe: student.groupe?.nom || '-',
          filiere: student.groupe?.filier?.nom || '-',
          noteValue: currentNote?.note || '',
          noteStatus: currentNote?.validation_status || 'not_set',
          noteId: currentNote?.id || null,
        };
      }),
    [students]
  );

  const scheduleItems = useMemo(
    () =>
      schedule.flatMap((entry) =>
        Array.isArray(entry.fichier)
          ? entry.fichier.map((slot, index) => ({
              id: `${entry.id}-${index}`,
              label: `${slot.jour} ${slot.heure} - ${slot.module}`,
              day: slot.jour,
              module: slot.module,
              groupe: entry.groupe?.nom || '-',
              filiere: entry.groupe?.filier?.nom || '-',
              date: entry.date || '-',
            }))
          : []
      ),
    [schedule]
  );

  return {
    catalog,
    rows,
    scheduleItems,
    selectedGroup,
    setSelectedGroup,
    selectedModule,
    setSelectedModule,
    loading,
    error,
    setError,
    reload: () => loadData(selectedGroup, selectedModule),
  };
};
