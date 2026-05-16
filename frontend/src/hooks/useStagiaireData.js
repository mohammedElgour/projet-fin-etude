import { useEffect, useMemo, useState } from 'react';
import { stagiaireApi } from '../services/api';
import { normalizeCollectionResponse } from '../lib/normalizeCollectionResponse';

export const useStagiaireData = () => {
  const [notes, setNotes] = useState([]);
  const [schedule, setSchedule] = useState([]);
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
        const [notesRes, scheduleRes, timetableRes, annRes, recoRes] = await Promise.allSettled([
          stagiaireApi.notes(),
          stagiaireApi.schedule(),
          stagiaireApi.timetables(),
          stagiaireApi.announcements(),
          stagiaireApi.recommendation(),
        ]);

        const errors = [];

        if (notesRes.status === 'fulfilled') {
          setNotes(Array.isArray(notesRes.value) ? notesRes.value : []);
        } else {
          setNotes([]);
          errors.push(notesRes.reason?.response?.data?.message || notesRes.reason?.message);
        }

        if (scheduleRes.status === 'fulfilled') {
          setSchedule(Array.isArray(scheduleRes.value) ? scheduleRes.value : []);
        } else {
          setSchedule([]);
          errors.push(scheduleRes.reason?.response?.data?.message || scheduleRes.reason?.message);
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
    scheduleItems,
    timetableItems,
    announcements,
    recommendation,
    loading,
    error,
  };
};
