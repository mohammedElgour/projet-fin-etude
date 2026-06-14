import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { professeurApi } from '../services/api';
import { normalizeCollectionResponse } from '../lib/normalizeCollectionResponse';

const normalizeCatalog = (response) => {
  const payload = response?.data || response || {};

  return {
    groupes: Array.isArray(payload.groupes) ? payload.groupes : [],
    modules: Array.isArray(payload.modules) ? payload.modules : [],
    filieres: Array.isArray(payload.filieres) ? payload.filieres : [],
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
  const catalogRef = useRef(catalog);

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  const loadData = useCallback(async () => {
    const currentGroupId = selectedGroup || bootstrapGroupId;
    const currentCatalog = catalogRef.current;

    if (!currentGroupId && currentCatalog.groupes.length > 0) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!currentGroupId) {
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

      const [catalogRes, studentsRes, scheduleRes, timetablesRes] = await Promise.all([
        currentCatalog.groupes.length > 0 ? Promise.resolve(currentCatalog) : professeurApi.catalog(),
        professeurApi.stagiaires({
          groupe_id: currentGroupId,
          ...(selectedModule ? { module_id: selectedModule } : {}),
        }),
        professeurApi.schedule({ groupe_id: currentGroupId }),
        professeurApi.timetables(),
      ]);

      const nextCatalog = currentCatalog.groupes.length > 0 ? currentCatalog : normalizeCatalog(catalogRes);
      const nextStudents = normalizeCollectionResponse(studentsRes).filter(
        (student) => String(student?.groupe?.id || '') === String(currentGroupId)
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
      setError(apiMessage || 'Impossible de charger les donnees professeur.');

      setStudents([]);
      setSchedule([]);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [bootstrapGroupId, selectedGroup, selectedModule]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        downloadUrl: timetable.download_url,
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
    activeGroupId: selectedGroup || bootstrapGroupId,
    activeSubmission,
    loading,
    error,
    setError,
    reload: loadData,
  };
};
