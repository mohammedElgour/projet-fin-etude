import React from 'react';
import { Compass } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">ISTA Notes</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              MVP de gestion des notes et validation academique
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-400 dark:text-slate-500">
          Comptes demo: `admin@ista.test`, `prof@ista.test`, `sara@ista.test` / `password123`
        </p>
      </div>
    </footer>
  );
}
