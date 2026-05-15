import React, { useMemo, useState } from 'react';
import ManagementTable from '../components/admin/ManagementTable';
import { adminApi } from '../services/api';
import { useDirecteurResourceList } from '../hooks/useDirecteurData';

export default function DirecteurStagiairesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { loading, error, items } = useDirecteurResourceList(
    () => adminApi.students(),
    'Aucun stagiaire disponible'
  );

  const rows = useMemo(() => {
    return (items || []).map((student) => ({
      id: student.id,
      name: student.user?.name || 'Stagiaire',
      email: student.user?.email || '-',
      groupe: student.groupe?.nom || '-',
      filiere: student.groupe?.filier?.nom || '-',
    }));
  }, [items]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <ManagementTable
          data={rows}
          columns={[
            { key: 'name', header: 'Stagiaire' },
            { key: 'email', header: 'Email' },
            { key: 'groupe', header: 'Groupe' },
            { key: 'filiere', header: 'Filière' },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          error={error}
          emptyMessage="Aucun stagiaire disponible"
          hideActions
        />
      </section>
    </div>
  );
}
