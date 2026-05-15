import React, { useState } from 'react';
import ManagementTable from '../components/admin/ManagementTable';
import { useStagiaireData } from '../hooks/useStagiaireData';

const StagiaireNotesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { notes, loading, error } = useStagiaireData();

  const rows = notes.map((note) => ({
    id: note.id,
    module: note.module?.nom || 'Module',
    note: note.note,
    status: note.validation_status || 'validated',
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
              { key: 'module', header: 'Module' },
              { key: 'note', header: 'Note', render: (row) => `${row.note}/20` },
              { key: 'status', header: 'Statut' },
            ]}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            loading={loading}
            emptyMessage="Aucune note validee pour le moment"
            hideActions
          />
        </section>
      )}
    </div>
  );
};

export default StagiaireNotesPage;
