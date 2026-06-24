import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const formatRole = (role = '') => {
  if (role === 'stagiaire') return 'Stagiaire';
  if (role === 'professeur') return 'Professeur';
  if (role === 'admin') return 'Directeur';
  return 'Utilisateur';
};

const ProfilePage = () => {
  const { user } = useAuth();

  const initials = useMemo(() => {
    const source = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || 'U';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }, [user]);

  const active = user?.is_active !== false;
  const photo = user?.profile_photo_url;

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_24%)] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-cyan-500 to-blue-500 text-3xl font-semibold text-white shadow-[0_20px_40px_-18px_rgba(14,165,233,0.55)]">
              {photo ? <img src={photo} alt="Profile" className="h-full w-full object-cover" /> : <span>{initials}</span>}
              <div className="absolute bottom-2 right-2 rounded-full bg-white/95 p-1.5 text-cyan-600 shadow-lg">
                <Camera className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
                  {formatRole(user?.role)}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {active ? 'Compte actif' : 'Compte desactive'}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Utilisateur'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Consultez votre profil actuel, vos coordonnées et l’état du compte sans modifier les permissions ou les
                relations métiers.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 xl:col-span-2">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Informations personnelles</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Nom complet</p>
              <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
                {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || '-'}
              </p>
            </div>
            <div className="rounded-[22px] bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Telephone</p>
              <div className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-950 dark:text-white">
                <Phone className="h-4 w-4 text-cyan-600" />
                {user?.phone || '-'}
              </div>
            </div>
            <div className="rounded-[22px] bg-slate-50 p-4 dark:bg-slate-900/80 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Adresse</p>
              <div className="mt-2 flex items-start gap-2 text-base font-semibold text-slate-950 dark:text-white">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                <span className="leading-6">{user?.address || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Compte</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-[22px] bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Email</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                <Mail className="h-4 w-4 text-cyan-600" />
                <span className="break-all">{user?.email || '-'}</span>
              </div>
            </div>
            <div className="rounded-[22px] bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Statut</p>
              <p className={`mt-2 text-sm font-semibold ${active ? 'text-emerald-600' : 'text-rose-600'}`}>
                {active ? 'Actif' : 'Desactive'}
              </p>
            </div>
            <div className="rounded-[22px] bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Role technique</p>
              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{user?.role || '-'}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
