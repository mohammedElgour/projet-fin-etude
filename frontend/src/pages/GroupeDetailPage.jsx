import React, { useEffect, useState } from 'react';
import { FolderGit2, GraduationCap, Mail, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import EntityDetailScaffold, { DetailLoading, InfoCard } from '../components/admin/EntityDetailScaffold';
import { adminApi } from '../services/api';

export default function GroupeDetailPage() {
  const { id } = useParams();
  const [groupe, setGroupe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await adminApi.groupes.get(id);
        if (active) {
          setGroupe(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.response?.data?.message || 'Impossible de charger ce groupe.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <DetailLoading />;
  }

  if (error) {
    return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-sm text-red-600 dark:text-red-400">{error}</div>;
  }

  const students = Array.isArray(groupe?.stagiaires) ? groupe.stagiaires : [];

  return (
    <EntityDetailScaffold
      backTo="/admin/groupes"
      backLabel="Retour a la liste des groupes"
      badge="Groupe"
      title={groupe?.nom || 'Groupe'}
      description="Vue detaillee du groupe, de sa filiere de rattachement et de ses stagiaires."
      status={
        <>
          <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
            {groupe?.filiere?.nom || 'Sans filiere'}
          </span>
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {groupe?.students_count ?? students.length} stagiaires
          </span>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoCard label="Nom du groupe" value={groupe?.nom} icon={FolderGit2} />
        <InfoCard label="Filiere" value={groupe?.filiere?.nom} icon={GraduationCap} />
        <InfoCard label="Stagiaires" value={groupe?.students_count ?? students.length} icon={Users} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Stagiaires du groupe</h2>
        {students.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Aucun stagiaire dans ce groupe.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{student.user?.name || 'Stagiaire'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {student.user?.email || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{student.status || 'active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </EntityDetailScaffold>
  );
}
