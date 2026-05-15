import { useEffect, useMemo, useState } from 'react';
import { stagiaireApi } from '../services/api';

export const useStagiaireData = () => {
  const [notes, setNotes] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [notesRes, scheduleRes, annRes, recoRes] = await Promise.all([
          stagiaireApi.notes(),
          stagiaireApi.schedule(),
          stagiaireApi.announcements(),
          stagiaireApi.recommendation(),
        ]);

        setNotes(Array.isArray(notesRes) ? notesRes : []);
        setSchedule(Array.isArray(scheduleRes) ? scheduleRes : []);
        setAnnouncements(Array.isArray(annRes) ? annRes : []);
        setRecommendation(recoRes);
      } catch (err) {
        setError(err?.response?.data?.message || 'Impossible de charger votre espace.');
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

  return {
    notes,
    scheduleItems,
    announcements,
    recommendation,
    loading,
    error,
  };
};
