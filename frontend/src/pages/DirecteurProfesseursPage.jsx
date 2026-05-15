import React, { useMemo, useState } from 'react';
import ManagementTable from '../components/admin/ManagementTable';
import { adminApi } from '../services/api';
import { useDirecteurResourceList } from '../hooks/useDirecteurData';

export default function DirecteurProfesseursPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { loading, error, items } = useDirecteurResourceList(
    () => adminApi.professors(),
    'Aucun professeur disponible'
  );

  const rows = useMemo(() => {
    return (items || []).map((professor) => ({
      id: professor.id,
      name: professor.user?.name || 'Professeur',
      email: professor.user?.email || '-',
      role: professor.user?.role || 'professeur',
    }));
  }, [items]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <ManagementTable
          data={rows}
          columns={[
            { key: 'name', header: 'Professeur' },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role' },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          error={error}
          emptyMessage="Aucun professeur disponible"
          hideActions
        />
      </section>
    </div>
  );
}
