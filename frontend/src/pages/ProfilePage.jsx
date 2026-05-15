import React from 'react';
import { Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <UserRound className="h-9 w-9" />
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Nom</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{user?.name || 'Utilisateur'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Email</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{user?.email || '-'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Role</p>
              <p className="mt-2 text-lg font-semibold capitalize text-slate-900 dark:text-white">{user?.role || '-'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Compte</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                Actif
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Informations personnelles</h2>
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
            <Mail className="mt-0.5 h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Adresse principale</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user?.email || '-'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Resume du profil</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Cette page reprend les informations disponibles dans votre session actuelle sans modifier le backend ni les donnees existantes.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
