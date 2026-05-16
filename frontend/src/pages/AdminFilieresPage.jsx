import React from 'react';
import { BookCopy, Building2, GraduationCap, Layers3 } from 'lucide-react';
import ResourceCrudPage from '../components/admin/ResourceCrudPage';
import { useAdminResourceList } from '../hooks/useAdminData';
import { adminApi } from '../services/api';

const AdminFilieresPage = () => {
  const { items, loading, error, reload } = useAdminResourceList(
    () => adminApi.filieres(),
    'Impossible de charger la liste des filieres.'
  );

  const summaryCards = React.useMemo(() => {
    const totalFilieres = items.length;
    const totalGroupes = items.reduce((sum, item) => sum + Number(item.groupes_count ?? item.groupes?.length ?? 0), 0);
    const totalModules = items.reduce((sum, item) => sum + Number(item.modules_count ?? item.modules?.length ?? 0), 0);
    const avgModules = totalFilieres ? (totalModules / totalFilieres).toFixed(1) : '0.0';

    return [
      {
        title: 'Total Filieres',
        value: totalFilieres,
        subtitle: 'Programs and departments',
        icon: GraduationCap,
        tone: 'cyan',
        trend: totalFilieres ? 9.1 : 0,
        progress: totalFilieres ? 100 : 0,
      },
      {
        title: 'Modules Linked',
        value: totalModules,
        subtitle: 'Curriculum units attached',
        icon: BookCopy,
        tone: 'blue',
        trend: totalModules ? 6.6 : 0,
        progress: totalModules ? 100 : 0,
      },
      {
        title: 'Groupes Related',
        value: totalGroupes,
        subtitle: 'Cohorts across filieres',
        icon: Building2,
        tone: 'purple',
        trend: totalGroupes ? 5.4 : 0,
        progress: totalGroupes ? 100 : 0,
      },
      {
        title: 'Avg Modules',
        value: avgModules,
        subtitle: 'Modules per filiere',
        icon: Layers3,
        tone: 'emerald',
        trend: Number(avgModules) ? 3.1 : 0,
        progress: Math.min(Number(avgModules) * 12, 100),
      },
    ];
  }, [items]);

  return (
    <ResourceCrudPage
      title="Filieres"
      entityLabel="Filiere"
      description="Structurez les parcours de formation avec une presentation plus premium et des actions CRUD harmonisees."
      items={items}
      loading={loading}
      error={error}
      reload={reload}
      summaryCards={summaryCards}
      columns={[
        {
          key: 'nom',
          header: 'Filiere',
          render: (row) => (
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-white">{row.nom}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Department overview</p>
              </div>
            </div>
          ),
        },
        {
          key: 'description',
          header: 'Description',
          render: (row) => (
            <p className="max-w-[280px] text-sm leading-6 text-slate-600 dark:text-slate-300">{row.description}</p>
          ),
        },
        {
          key: 'groupes',
          header: 'Groupes',
          render: (row) => (
            <div className="min-w-[150px]">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Group coverage</span>
                <span>{row.groupes}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500"
                  style={{ width: `${Math.min(Number(row.groupes || 0) * 15, 100)}%` }}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'modules',
          header: 'Modules',
          render: (row) => (
            <div className="min-w-[150px]">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Module density</span>
                <span>{row.modules}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                  style={{ width: `${Math.min(Number(row.modules || 0) * 15, 100)}%` }}
                />
              </div>
            </div>
          ),
        },
      ]}
      emptyMessage="Aucune filiere disponible"
      addLabel="Ajouter une filiere"
      createTitle="Ajouter une filiere"
      editTitle="Modifier la filiere"
      detailTitle="Details de la filiere"
      deleteTitle="Supprimer cette filiere"
      deleteDescription={(item) =>
        item ? `La filiere "${item.nom}" et ses associations seront supprimees definitivement.` : ''
      }
      toRow={(filiere) => ({
        id: filiere.id,
        nom: filiere.nom || 'Filiere',
        description: filiere.description || '-',
        groupes: filiere.groupes_count ?? filiere.groupes?.length ?? 0,
        modules: filiere.modules_count ?? filiere.modules?.length ?? 0,
      })}
      formFields={() => [
        { name: 'nom', label: 'Nom de la filiere', required: true, placeholder: 'Développement Digital' },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          fullWidth: true,
          placeholder: 'Precisez les objectifs, debouches et contenus de la filiere.',
        },
      ]}
      detailsFields={() => [
        { name: 'nom', label: 'Nom de la filiere' },
        { name: 'description', label: 'Description', fullWidth: true },
        { name: 'groupes', label: 'Nombre de groupes' },
        { name: 'modules', label: 'Nombre de modules' },
      ]}
      buildInitialValues={(item) => ({
        nom: item?.nom || '',
        description: item?.description || '',
        groupes: item?.groupes_count ?? item?.groupes?.length ?? 0,
        modules: item?.modules_count ?? item?.modules?.length ?? 0,
      })}
      buildCreatePayload={(values) => values}
      buildUpdatePayload={(values) => values}
      createItem={adminApi.createFiliere}
      updateItem={adminApi.updateFiliere}
      deleteItem={adminApi.deleteFiliere}
      getItemName={(item) => item?.nom || 'cette filiere'}
    />
  );
};

export default AdminFilieresPage;
