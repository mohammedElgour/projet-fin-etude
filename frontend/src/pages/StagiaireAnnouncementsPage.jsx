import React, { useState } from 'react';
import ManagementTable from '../components/admin/ManagementTable';
import { useStagiaireData } from '../hooks/useStagiaireData';

const StagiaireAnnouncementsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { announcements, loading, error } = useStagiaireData();

  const rows = announcements.map((item) => ({
    id: item.id,
    message: item.message,
    status: item.is_read ? 'Lu' : 'Non lu',
  }));

  return (
    <div className="space-y-6">
      {loading && <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">Chargement...</div>}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
      {!loading && !error && (
        <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <ManagementTable
            data={rows}
            columns={[
              { key: 'message', header: 'Annonce' },
              { key: 'status', header: 'Statut' },
            ]}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            loading={loading}
            emptyMessage="Aucune annonce"
            hideActions
          />
        </section>
      )}
    </div>
  );
};

export default StagiaireAnnouncementsPage;
