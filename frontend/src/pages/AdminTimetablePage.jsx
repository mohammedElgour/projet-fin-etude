import React, { useState } from 'react';
import ManagementTable from '../components/admin/ManagementTable';
import { useAdminResourceList } from '../hooks/useAdminData';
import { adminApi } from '../services/api';

const AdminTimetablePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { items, loading, error } = useAdminResourceList(
    () => adminApi.groups(),
    'Impossible de charger les groupes pour la gestion d emploi du temps.'
  );

  const rows = items.map((group) => ({
    id: group.id,
    groupe: group.nom || group.name || 'Groupe',
    filiere: group.filiere?.nom || group.filier?.nom || '-',
    stagiaires: group.stagiaires_count ?? '-',
  }));

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Timetable Management</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Les groupes actuellement relies a l organisation des emplois du temps.
          </p>
        </div>

        <ManagementTable
          data={rows}
          columns={[
            { key: 'groupe', header: 'Groupe' },
            { key: 'filiere', header: 'Filiere' },
            { key: 'stagiaires', header: 'Stagiaires' },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage="Aucun groupe disponible"
          hideActions
        />
      </section>
    </div>
  );
};

export default AdminTimetablePage;
