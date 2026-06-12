import { useEffect, useMemo, useState } from 'react';
import { stagiaireApi } from '../services/api';
import { normalizeCollectionResponse } from '../lib/normalizeCollectionResponse';

const normalizeStagiaireNotes = (payload) => {
  const rawNotes = Array.isArray(payload) ? payload : Array.isArray(payload?.notes) ? payload.notes : [];

  return rawNotes.map((note) => ({
    ...note,
    module:
      typeof note?.module === 'string'
        ? { nom: note.module }
        : note?.module || { nom: 'Module' },
    cc1: note?.cc1 ?? note?.controle1 ?? null,
    cc2: note?.cc2 ?? note?.controle2 ?? null,
    cc3: note?.cc3 ?? note?.controle3 ?? null,
    controle1: note?.controle1 ?? note?.cc1 ?? null,
    controle2: note?.controle2 ?? note?.cc2 ?? null,
    controle3: note?.controle3 ?? note?.cc3 ?? null,
  }));
};

export const useStagiaireData = () => {
  const [notes, setNotes] = useState([]);
  const [transcriptSummary, setTranscriptSummary] = useState({
    validatedModulesCount: 0,
    totalModulesCount: 0,
    nonValidatedModulesCount: 0,
    transcriptAvailable: false,
  });
  const [schedule, setSchedule] = useState([]);
  const [emploiDuTemps, setEmploiDuTemps] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [notesRes, scheduleRes, emploiRes, timetableRes, annRes, recoRes] = await Promise.allSettled([
          stagiaireApi.notes(),
          stagiaireApi.schedule(),
          stagiaireApi.emploiDuTemps(),
          stagiaireApi.timetables(),
          stagiaireApi.announcements(),
          stagiaireApi.recommendation(),
        ]);

        const errors = [];

        if (notesRes.status === 'fulfilled') {
          const normalizedNotes = normalizeStagiaireNotes(notesRes.value);
          const validatedModulesCount = Number(notesRes.value?.validated_modules_count ?? normalizedNotes.length);
          const totalModulesCount = Number(notesRes.value?.total_modules_count ?? normalizedNotes.length);
          const nonValidatedModulesCount = Number(
            notesRes.value?.non_validated_modules_count ?? Math.max(totalModulesCount - validatedModulesCount, 0)
          );

          setNotes(normalizedNotes);
          setTranscriptSummary({
            validatedModulesCount,
            totalModulesCount,
            nonValidatedModulesCount,
            transcriptAvailable: Boolean(
              notesRes.value?.transcript_available ??
                (totalModulesCount > 0 && validatedModulesCount === totalModulesCount)
            ),
          });
        } else {
          setNotes([]);
          setTranscriptSummary({
            validatedModulesCount: 0,
            totalModulesCount: 0,
            nonValidatedModulesCount: 0,
            transcriptAvailable: false,
          });
          errors.push(notesRes.reason?.response?.data?.message || notesRes.reason?.message);
        }

        if (scheduleRes.status === 'fulfilled') {
          setSchedule(Array.isArray(scheduleRes.value) ? scheduleRes.value : []);
        } else {
          setSchedule([]);
          errors.push(scheduleRes.reason?.response?.data?.message || scheduleRes.reason?.message);
        }

        if (emploiRes.status === 'fulfilled') {
          setEmploiDuTemps(emploiRes.value || null);
        } else {
          setEmploiDuTemps(null);
          errors.push(emploiRes.reason?.response?.data?.message || emploiRes.reason?.message);
        }

        if (timetableRes.status === 'fulfilled') {
          setTimetables(normalizeCollectionResponse(timetableRes.value));
        } else {
          setTimetables([]);
          errors.push(timetableRes.reason?.response?.data?.message || timetableRes.reason?.message);
        }

        if (annRes.status === 'fulfilled') {
          setAnnouncements(Array.isArray(annRes.value) ? annRes.value : []);
        } else {
          setAnnouncements([]);
          errors.push(annRes.reason?.response?.data?.message || annRes.reason?.message);
        }

        if (recoRes.status === 'fulfilled') {
          setRecommendation(recoRes.value);
        } else {
          setRecommendation(null);
          errors.push(recoRes.reason?.response?.data?.message || recoRes.reason?.message);
        }

        if (errors.length > 0) {
          setError(errors.find(Boolean) || 'Impossible de charger completement votre espace.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const scheduleItems = useMemo(
    () =>
      schedule.flatMap((entry) =>
        Array.isArray(entry.fichier)
          ? entry.fichier.map((slot, index) => ({
              id: `${entry.id}-${index}`,
              label: `${slot.jour} ${slot.heure} - ${slot.module}`,
              day: slot.jour,
              module: slot.module,
              date: entry.date || '-',
            }))
          : []
      ),
    [schedule]
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
        createdAt: timetable.created_at || '',
      })),
    [timetables]
  );

  return {
    notes,
    schedule,
    emploiDuTemps,
    scheduleItems,
    timetableItems,
    announcements,
    recommendation,
    transcriptSummary,
    loading,
    error,
  };
};
