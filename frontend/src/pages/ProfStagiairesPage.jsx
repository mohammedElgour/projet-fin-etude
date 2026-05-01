import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ManagementTable from '../components/admin/ManagementTable';
import { professeurApi } from '../services/api';

const ProfStagiairesPage = () => {
  const [stagiaires, setStagiaires] = useState([]);
  const [catalog, setCatalog] = useState({ groupes: [], modules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupe, setSelectedGroupe] = useState('');
  const [selectedModule, setSelectedModule] = useState('');

  const loadStagiaires = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [stagRes, catRes] = await Promise.all([
        professeurApi.stagiaires({
          groupe_id: selectedGroupe || undefined,
          module_id: selectedModule || undefined,
        }),
        professeurApi.catalog(),
      ]);
      setStagiaires(stagRes?.data || stagRes || []);
      setCatalog(catRes);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur chargement stagiaires');
    } finally {
      setLoading(false);
    }
  }, [selectedGroupe, selectedModule]);

  useEffect(() => {
    loadStagiaires();
  }, [loadStagiaires]);

  const rows = useMemo(() => 
    stagiaires.map(s => ({
      id: s.id,
      name: s.user?.name || 'N/A',
      groupe: s.groupe?.nom || '-',
      filiere: s.groupe?.filier?.nom || '-',
      email: s.user?.email,
      status: s.status || 'Actif',
    })), [stagiaires]
  );

  const columns = [
    { key: 'name', header: 'Nom' },
    { key: 'groupe', header: 'Groupe' },
    { key: 'filiere', header: 'Filière' },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Statut' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Mes Stagiaires
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Stagiaires dans vos groupes assignés ({stagiaires.length})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Groupe
          </label>
          <select 
            value={selectedGroupe} 
            onChange={(e) => setSelectedGroupe(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les groupes</option>
            {catalog.groupes?.map(g => (
              <option key={g.id} value={g.id}>{g.nom} ({g.filier?.nom})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Module (filtre notes)
          </label>
          <select 
            value={selectedModule} 
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les modules</option>
            {catalog.modules?.map(m => (
              <option key={m.id} value={m.id}>{m.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <ManagementTable
        data={rows}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        loading={loading}
        emptyMessage="Aucun stagiaire assigné à vos groupes."
      />
    </div>
  );
};

export default ProfStagiairesPage;

