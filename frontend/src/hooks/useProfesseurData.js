import { useCallback, useEffect, useMemo, useState } from 'react';
import { professeurApi } from '../services/api';
import { normalizeCollectionResponse } from '../lib/normalizeCollectionResponse';

const normalizeCatalog = (response) => {
  const payload = response?.data || response || {};

  return {
    groupes: Array.isArray(payload.groupes) ? payload.groupes : [],
    modules: Array.isArray(payload.modules) ? payload.modules : [],
  };
};

export const useProfesseurData = () => {
  const [catalog, setCatalog] = useState({ groupes: [], modules: [] });
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [bootstrapGroupId, setBootstrapGroupId] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const groupId = selectedGroup || bootstrapGroupId;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (!groupId) {
        const catalogRes = await professeurApi.catalog();
        const nextCatalog = normalizeCatalog(catalogRes);
        const fallbackGroupId = nextCatalog.groupes[0]?.id;

        setCatalog(nextCatalog);

        if (fallbackGroupId) {
          setBootstrapGroupId(String(fallbackGroupId));
        } else {
          setStudents([]);
          setSchedule([]);
          setChartData([]);
          setTimetables([]);
        }

        return;
      }

      // eslint-disable-next-line no-console
      console.log('GROUP ID:', groupId);

      const [catalogRes, studentsRes, scheduleRes, timetablesRes] = await Promise.all([
        professeurApi.catalog(),
        professeurApi.stagiaires({
          groupe_id: groupId,
          ...(selectedModule ? { module_id: selectedModule } : {}),
        }),
        professeurApi.schedule({ groupe_id: groupId }),
        professeurApi.timetables(),
      ]);

      // eslint-disable-next-line no-console
      console.log('STUDENTS DATA:', studentsRes);
      // eslint-disable-next-line no-console
      console.log('SCHEDULE DATA:', scheduleRes);

      const nextCatalog = normalizeCatalog(catalogRes);
      const nextStudents = normalizeCollectionResponse(studentsRes).filter(
        (student) => String(student?.groupe?.id || '') === String(groupId)
      );
      const nextSchedule = normalizeCollectionResponse(scheduleRes);

      setCatalog(nextCatalog);
      setStudents(nextStudents);
      setSchedule(nextSchedule);
      setChartData(nextSchedule);
      setTimetables(normalizeCollectionResponse(timetablesRes));

      if (!selectedGroup && nextCatalog.groupes[0]?.id && !bootstrapGroupId) {
        setBootstrapGroupId(String(nextCatalog.groupes[0].id));
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);

      const apiMessage = error?.response?.data?.message;
      if (apiMessage === 'Professor has no filiere assigned') {
        setError('Aucune filiere assignee a ce professeur');
      } else {
        setError(apiMessage || 'Impossible de charger les donnees professeur.');
      }

      setStudents([]);
      setSchedule([]);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [bootstrapGroupId, groupId, selectedGroup, selectedModule]);

  useEffect(() => {
    loadData();
  }, [groupId, loadData]);

  const rows = useMemo(
    () =>
      students.map((student) => {
        const currentNote = selectedModule
          ? (Array.isArray(student.notes) ? student.notes.find((note) => String(note.module_id) === String(selectedModule)) : null)
          : null;

        return {
          id: student.id,
          studentId: student.id,
          groupeId: student.groupe?.id || null,
          name: student.user?.name || 'Stagiaire',
          groupe: student.groupe?.nom || '-',
          filiere: student.groupe?.filiere?.nom || student.groupe?.filier?.nom || '-',
          cc1: currentNote?.cc1 ?? '',
          cc2: currentNote?.cc2 ?? '',
          cc3: currentNote?.cc3 ?? '',
          efm: currentNote?.efm ?? '',
          moyenne: currentNote?.moyenne ?? currentNote?.note ?? '',
          noteValue: currentNote?.note ?? '',
          noteStatus: currentNote?.validation_status ?? 'not_set',
          noteId: currentNote?.id || null,
        };
      }),
    [selectedModule, students]
  );

  const activeSubmission = useMemo(() => {
    if (!selectedModule) {
      return null;
    }

    for (const student of students) {
      const currentNote = Array.isArray(student.notes)
        ? student.notes.find((note) => String(note.module_id) === String(selectedModule))
        : null;

      if (currentNote?.submission) {
        return currentNote.submission;
      }
    }

    return null;
  }, [selectedModule, students]);

  const scheduleItems = useMemo(
    () =>
      chartData.flatMap((entry) =>
        Array.isArray(entry.fichier)
          ? entry.fichier.map((slot, index) => ({
              id: `${entry.id}-${index}`,
              label: `${slot.jour} ${slot.heure} - ${slot.module}`,
              day: slot.jour,
              module: slot.module,
              groupe: entry.groupe?.nom || '-',
              filiere: entry.groupe?.filiere?.nom || entry.groupe?.filier?.nom || '-',
              date: entry.date || '-',
            }))
          : []
      ),
    [chartData]
  );

  const timetableItems = useMemo(
    () =>
      timetables.map((timetable) => ({
        id: timetable.id,
        title: timetable.title || 'Emploi du temps',
        imageUrl: timetable.image_url,
        imagePath: timetable.image_path,
        groupe: timetable.groupe?.nom || '-',
        filiere: timetable.groupe?.filiere?.nom || timetable.groupe?.filier?.nom || '-',
        audienceType: timetable.audience_type,
        professeurs: Array.isArray(timetable.professeurs)
          ? timetable.professeurs
              .map((professeur) => professeur.user?.name)
              .filter(Boolean)
              .join(', ')
          : '',
        createdAt: timetable.created_at || '',
      })),
    [timetables]
  );

  return {
    catalog,
    rows,
    schedule,
    scheduleItems,
    chartData,
    timetableItems,
    selectedGroup,
    setSelectedGroup,
    selectedModule,
    setSelectedModule,
    activeGroupId: groupId,
    activeSubmission,
    loading,
    error,
    setError,
    reload: loadData,
  };
};
