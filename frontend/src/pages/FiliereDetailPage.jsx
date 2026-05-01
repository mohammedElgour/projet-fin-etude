import React, { useEffect, useState } from 'react';
import { BookCopy, FileText, FolderGit2, Layers3, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import EntityDetailScaffold, { DetailLoading, InfoCard } from '../components/admin/EntityDetailScaffold';
import { adminApi } from '../services/api';

export default function FiliereDetailPage() {
  const { id } = useParams();
  const [filiere, setFiliere] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await adminApi.filieres.get(id);
        if (active) {
          setFiliere(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.response?.data?.message || 'Impossible de charger cette filiere.');
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

  const modules = Array.isArray(filiere?.modules) ? filiere.modules : [];
  const groupes = Array.isArray(filiere?.groupes) ? filiere.groupes : [];
  const studentsCount = groupes.reduce((sum, groupe) => sum + (Array.isArray(groupe.stagiaires) ? groupe.stagiaires.length : 0), 0);

  return (
    <EntityDetailScaffold
      backTo="/admin/filieres"
      backLabel="Retour a la liste des filieres"
      badge="Filiere"
      title={filiere?.nom || 'Filiere'}
      description="Vue detaillee de la filiere avec ses modules, ses groupes et les effectifs associes."
      status={
        <>
          <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
            {modules.length} modules
          </span>
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {groupes.length} groupes
          </span>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Modules" value={modules.length} icon={BookCopy} />
        <InfoCard label="Groupes" value={groupes.length} icon={FolderGit2} />
        <InfoCard label="Stagiaires" value={studentsCount} icon={Users} />
        <InfoCard label="Description" value={filiere?.description || 'Aucune description'} icon={FileText} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Modules de la filiere</h2>
          {modules.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Aucun module rattache.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {modules.map((module) => (
                <li key={module.id} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                  <p className="font-medium text-slate-900 dark:text-white">{module.nom}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Coefficient {module.coefficient}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Groupes actifs</h2>
          {groupes.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Aucun groupe rattache.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {groupes.map((groupe) => (
                <li key={groupe.id} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-900 dark:text-white">{groupe.nom}</p>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {Array.isArray(groupe.stagiaires) ? groupe.stagiaires.length : 0} stagiaires
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Description</h2>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <div className="flex items-start gap-3">
            <Layers3 className="mt-0.5 h-5 w-5 text-slate-400" />
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {filiere?.description || 'Aucune description pedagogique n a encore ete renseignee pour cette filiere.'}
            </p>
          </div>
        </div>
      </section>
    </EntityDetailScaffold>
  );
}
