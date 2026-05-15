import React, { useState } from 'react';
import ManagementTable from '../components/admin/ManagementTable';
import { useProfesseurData } from '../hooks/useProfesseurData';

const ProfesseurSchedulePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { catalog, scheduleItems, selectedGroup, setSelectedGroup, loading, error } = useProfesseurData();

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mb-5 max-w-md">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Groupe</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Tous les groupes</option>
            {catalog.groupes.map((groupe) => (
              <option key={groupe.id} value={groupe.id}>
                {groupe.nom} - {groupe.filier?.nom}
              </option>
            ))}
          </select>
        </div>

        <ManagementTable
          data={scheduleItems}
          columns={[
            { key: 'day', header: 'Jour' },
            { key: 'module', header: 'Module' },
            { key: 'groupe', header: 'Groupe' },
            { key: 'filiere', header: 'Filiere' },
            { key: 'date', header: 'Date' },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage="Aucun creneau programme"
          hideActions
        />
      </section>
    </div>
  );
};

export default ProfesseurSchedulePage;
