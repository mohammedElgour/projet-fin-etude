import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { adminApi } from '../services/api';

const InfoCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/85">
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{value || '-'}</p>
      </div>
    </div>
  </div>
);

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

export default function StagiaireProfilePage() {
  const { id } = useParams();
  const [stagiaire, setStagiaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await adminApi.stagiaires.get(id);
        if (active) {
          setStagiaire(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.response?.data?.message || 'Impossible de charger ce profil stagiaire.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/60" />
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const notes = Array.isArray(stagiaire?.notes) ? stagiaire.notes : [];
  const fullName = stagiaire?.user?.name || 'Stagiaire';
  const filiereName = stagiaire?.groupe?.filier?.nom || stagiaire?.groupe?.filiere?.nom || '-';
  const statusLabel = stagiaire?.status === 'inactive' ? 'Inactif' : 'Actif';

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to="/admin/stagiaires"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour a la liste des stagiaires
      </Link>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              {fullName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{fullName}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Profil stagiaire detaille avec ses informations personnelles, son affectation et son suivi academique.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
              {stagiaire?.groupe?.nom || '-'}
            </span>
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                stagiaire?.status === 'inactive'
                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoCard label="Email" value={stagiaire?.user?.email} icon={Mail} />
        <InfoCard label="Telephone" value={stagiaire?.phone} icon={Phone} />
        <InfoCard label="CIN" value={stagiaire?.cin} icon={ShieldCheck} />
        <InfoCard label="Date de naissance" value={formatDate(stagiaire?.birth_date)} icon={CalendarDays} />
        <InfoCard label="Groupe" value={stagiaire?.groupe?.nom} icon={UserRound} />
        <InfoCard label="Filiere" value={filiereName} icon={GraduationCap} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Informations personnelles</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Adresse</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{stagiaire?.address || 'Aucune adresse renseignee.'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Compte cree le</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{formatDate(stagiaire?.created_at)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Nombre de notes</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{stagiaire?.notes_count ?? notes.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Synthese academique</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Statut</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{statusLabel}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Affectation</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {stagiaire?.groupe?.nom || '-'} / {filiereName}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Adresse</p>
              <div className="mt-2 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <span>{stagiaire?.address || 'Non renseignee'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Notes associees</h2>
        {notes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Aucune note disponible pour ce stagiaire.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Note</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {notes.map((note) => (
                  <tr key={note.id}>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{note.module?.nom || 'Module'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{note.note}/20</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{note.validation_status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
