import React from 'react';
import { Mail, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  admin: 'Administrateur',
  professeur: 'Professeur',
  stagiaire: 'Stagiaire',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const userInitials = (user?.name || user?.email || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <section className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 px-6 py-10 text-white sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-2xl font-semibold shadow-lg backdrop-blur-sm">
                {userInitials}
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/75">Profil</p>
                <h1 className="mt-2 text-3xl font-bold">{user?.name || 'Utilisateur connecte'}</h1>
                <p className="mt-2 text-sm text-white/85">
                  Consultez les informations actuellement chargees depuis votre session.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center gap-3 text-slate-900 dark:text-white">
                <User className="h-5 w-5 text-primary-500" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Nom
                </h2>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.name || '-'}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center gap-3 text-slate-900 dark:text-white">
                <Mail className="h-5 w-5 text-primary-500" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Email
                </h2>
              </div>
              <p className="break-all text-lg font-semibold text-slate-900 dark:text-white">{user?.email || '-'}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 sm:col-span-2">
              <div className="mb-3 flex items-center gap-3 text-slate-900 dark:text-white">
                <Shield className="h-5 w-5 text-primary-500" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Role
                </h2>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {roleLabels[user?.role] || user?.role || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
