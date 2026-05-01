import React, { useEffect, useState } from 'react';
import { CalendarClock, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useParams } from 'react-router-dom';
import EntityDetailScaffold, { DetailLoading, InfoCard } from '../components/admin/EntityDetailScaffold';
import { adminApi } from '../services/api';

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
};

export default function ProfesseurDetailPage() {
  const { id } = useParams();
  const [professeur, setProfesseur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await adminApi.professeurs.get(id);
        if (active) {
          setProfesseur(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.response?.data?.message || 'Impossible de charger ce professeur.');
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

  return (
    <EntityDetailScaffold
      backTo="/admin/professeurs"
      backLabel="Retour a la liste des professeurs"
      badge="Professeur"
      title={professeur?.user?.name || 'Professeur'}
      description="Vue detaillee du compte professeur et de son acces pedagogique."
      status={
        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          Acces professeur actif
        </span>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Nom" value={professeur?.user?.name} icon={UserRound} />
        <InfoCard label="Email" value={professeur?.user?.email} icon={Mail} />
        <InfoCard label="Role" value={professeur?.user?.role} icon={ShieldCheck} />
        <InfoCard label="Creation" value={formatDate(professeur?.created_at)} icon={CalendarClock} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Resume du compte</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Acces</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              Ce compte peut acceder au tableau de bord professeur, consulter les groupes et soumettre des notes pour validation.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Limite actuelle</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              Les affectations module/groupe ne sont pas modelisees dans la base actuelle, donc le profil affiche seulement les informations de compte disponibles.
            </p>
          </div>
        </div>
      </section>
    </EntityDetailScaffold>
  );
}
