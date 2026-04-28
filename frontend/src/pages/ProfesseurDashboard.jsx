import React, { useEffect, useState } from 'react';
import { professeurApi } from '../services/api';
import NotificationsPanel from '../components/common/NotificationsPanel';

const ProfesseurDashboard = () => {
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [studentsRes, scheduleRes] = await Promise.all([
          professeurApi.students(),
          professeurApi.schedule(),
        ]);
        setStudents(studentsRes?.data?.data || studentsRes?.data || []);
        setSchedule(scheduleRes?.data?.data || scheduleRes?.data || []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            'Impossible de charger les données professeur.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Tableau de bord Professeur
      </h1>
      <p className="text-slate-600 dark:text-slate-300 mb-8">
        Gérez vos étudiants, notes et planning.
      </p>

      {loading && (
        <p className="text-slate-500 dark:text-slate-400">
          Chargement des données...
        </p>
      )}

      {error && (
        <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Étudiants
            </h2>
            {students.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Aucun étudiant trouvé.
              </p>
            ) : (
              <ul className="space-y-2">
                {students.slice(0, 8).map((student) => (
                  <li
                    key={student.id}
                    className="text-sm text-slate-700 dark:text-slate-200"
                  >
                    {student.nom || student.name || 'Étudiant'}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Emploi du temps
            </h2>
            {schedule.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Aucun créneau disponible.
              </p>
            ) : (
              <ul className="space-y-2">
                {schedule.slice(0, 8).map((slot) => (
                  <li
                    key={slot.id}
                    className="text-sm text-slate-700 dark:text-slate-200"
                  >
                    {slot.titre || slot.module?.nom || 'Cours planifié'}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <NotificationsPanel />
    </div>
  );
};

export default ProfesseurDashboard;
