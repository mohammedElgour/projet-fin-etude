import React from 'react';
import { Moon, Palette, Shield, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Apparence</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Conserver le style existant et gerer le theme.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Theme actuel: {theme === 'dark' ? 'Sombre' : 'Clair'}
          </button>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Session</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Parametres locaux disponibles sans changer les APIs.</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Les reglages sensibles restent geres par le systeme existant. Cette page fournit un point d acces propre depuis le menu profil.
          </p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
