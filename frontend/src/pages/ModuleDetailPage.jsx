import React, { useEffect, useState } from 'react';
import { BookOpenText, Calculator, GraduationCap, ListChecks } from 'lucide-react';
import { useParams } from 'react-router-dom';
import EntityDetailScaffold, { DetailLoading, InfoCard } from '../components/admin/EntityDetailScaffold';
import { adminApi } from '../services/api';

export default function ModuleDetailPage() {
  const { id } = useParams();
  const [moduleItem, setModuleItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await adminApi.modules.get(id);
        if (active) {
          setModuleItem(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.response?.data?.message || 'Impossible de charger ce module.');
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

  const notes = Array.isArray(moduleItem?.notes) ? moduleItem.notes : [];
  const average =
    notes.length > 0
      ? (notes.reduce((sum, note) => sum + Number(note.note || 0), 0) / notes.length).toFixed(2)
      : '0.00';

  return (
    <EntityDetailScaffold
      backTo="/admin/modules"
      backLabel="Retour a la liste des modules"
      badge="Module"
      title={moduleItem?.nom || 'Module'}
      description="Vue detaillee du module avec son rattachement, son coefficient et les notes associees."
      status={
        <>
          <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
            {moduleItem?.filier?.nom || 'Sans filiere'}
          </span>
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {moduleItem?.notes_count ?? notes.length} notes
          </span>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Coefficient" value={moduleItem?.coefficient} icon={Calculator} />
        <InfoCard label="Filiere" value={moduleItem?.filier?.nom} icon={GraduationCap} />
        <InfoCard label="Notes" value={moduleItem?.notes_count ?? notes.length} icon={ListChecks} />
        <InfoCard label="Moyenne" value={`${average}/20`} icon={BookOpenText} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Notes rattachees</h2>
        {notes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Aucune note disponible pour ce module.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Stagiaire</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Note</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {notes.map((note) => (
                  <tr key={note.id}>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{note.stagiaire?.user?.name || 'Stagiaire'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{note.note}/20</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{note.validation_status || '-'}</td>
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
