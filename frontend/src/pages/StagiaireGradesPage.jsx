import React, { useEffect, useMemo, useState } from 'react';
import { stagiaireApi } from '../services/api';

const StagiaireGradesPage = () => {
  const [grades, setGrades] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGrades = async () => {
      setLoading(true);
      setError('');

      try {
        const [notesRes, recommendationRes] = await Promise.all([
          stagiaireApi.notes(),
          stagiaireApi.recommendation(),
        ]);

        setGrades(Array.isArray(notesRes) ? notesRes : []);
        setRecommendation(recommendationRes || null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Impossible de charger vos notes.');
      } finally {
        setLoading(false);
      }
    };

    loadGrades();
  }, []);

  const average = useMemo(() => recommendation?.average ?? 0, [recommendation]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mes notes</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Consultez uniquement vos notes validees et leur statut academique.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Moyenne</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{average}/20</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Modules</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{grades.length}</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-8 text-center text-slate-500 dark:text-slate-400">
          Chargement des notes...
        </div>
      ) : grades.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aucune note validee</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Vos notes apparaitront ici apres validation par l administration.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Module
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Note
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {grades.map((grade) => (
                <tr key={grade.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {grade.module?.nom || 'Module'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-200">{grade.note}/20</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                      Validee
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recommendation?.recommendation ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-500/30 dark:bg-blue-500/10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-300">
            Recommandation
          </h2>
          <p className="mt-2 text-sm text-blue-900 dark:text-blue-100">{recommendation.recommendation}</p>
        </div>
      ) : null}
    </div>
  );
};

export default StagiaireGradesPage;
