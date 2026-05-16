import React, { useMemo } from 'react';
import { BookOpenCheck, FolderKanban, GraduationCap, Sigma } from 'lucide-react';
import ResourceCrudPage from '../components/admin/ResourceCrudPage';
import { useAdminResourceList } from '../hooks/useAdminData';
import { useAdminLookups } from '../hooks/useAdminLookups';
import { adminApi } from '../services/api';

const AdminModulesPage = () => {
  const lookups = useAdminLookups(['filieres']);
  const { items, loading, error, reload } = useAdminResourceList(
    () => adminApi.modules(),
    'Impossible de charger la liste des modules.'
  );

  const dependencies = useMemo(
    () => ({
      filiereOptions: (lookups.filieres || []).map((filiere) => ({
        value: String(filiere.id),
        label: filiere.nom,
      })),
    }),
    [lookups.filieres]
  );

  const summaryCards = useMemo(() => {
    const totalModules = items.length;
    const uniqueFilieres = new Set(items.map((item) => item?.filiere?.nom || item?.filier?.nom).filter(Boolean)).size;
    const averageCoefficient = totalModules
      ? (items.reduce((sum, item) => sum + Number(item.coefficient || 0), 0) / totalModules).toFixed(1)
      : '0.0';
    const codedModules = items.filter((item) => item?.code).length;
    const catalogCoverage = totalModules ? Math.round((codedModules / totalModules) * 100) : 0;

    return [
      {
        title: 'Total Modules',
        value: totalModules,
        subtitle: 'Catalog entries available',
        icon: FolderKanban,
        tone: 'emerald',
        trend: totalModules ? 9.7 : 0,
        progress: totalModules ? 100 : 0,
      },
      {
        title: 'Filieres Linked',
        value: uniqueFilieres,
        subtitle: 'Programs using modules',
        icon: GraduationCap,
        tone: 'blue',
        trend: uniqueFilieres ? 4.3 : 0,
        progress: uniqueFilieres ? 100 : 0,
      },
      {
        title: 'Avg Coefficient',
        value: averageCoefficient,
        subtitle: 'Academic weight per module',
        icon: Sigma,
        tone: 'orange',
        trend: Number(averageCoefficient) ? 2.1 : 0,
        progress: Math.min(Number(averageCoefficient) * 10, 100),
      },
      {
        title: 'Catalog Coverage',
        value: `${catalogCoverage}%`,
        subtitle: 'Modules with reference codes',
        icon: BookOpenCheck,
        tone: 'purple',
        trend: catalogCoverage >= 70 ? 6.4 : -1.8,
        progress: catalogCoverage,
      },
    ];
  }, [items]);

  return (
    <ResourceCrudPage
      title="Modules"
      entityLabel="Module"
      description="Administrez les modules avec une interface plus nette, de meilleures priorites visuelles et des interactions premium."
      items={items}
      loading={loading}
      error={error}
      reload={reload}
      summaryCards={summaryCards}
      columns={[
        {
          key: 'nom',
          header: 'Module',
          render: (row) => (
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-white">{row.nom}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.code || 'No module code assigned'}</p>
              </div>
            </div>
          ),
        },
        {
          key: 'filiere',
          header: 'Filiere',
          render: (row) => (
            <span className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-700 dark:text-cyan-300">
              {row.filiere}
            </span>
          ),
        },
        {
          key: 'coefficient',
          header: 'Coefficient',
          render: (row) => (
            <div className="min-w-[150px]">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Academic weight</span>
                <span>{row.coefficient}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                  style={{ width: `${Math.min(Number(row.coefficient || 0) * 12, 100)}%` }}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'catalogStatus',
          header: 'Status',
          render: (row) => (
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{row.code ? 'Ready for scheduling' : 'Needs reference code'}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Module catalog health indicator</p>
            </div>
          ),
        },
      ]}
      emptyMessage="Aucun module disponible"
      addLabel="Ajouter un module"
      createTitle="Ajouter un module"
      editTitle="Modifier le module"
      detailTitle="Details du module"
      deleteTitle="Supprimer ce module"
      deleteDescription={(item) =>
        item ? `Le module "${item.nom}" sera supprime de la filiere associee.` : ''
      }
      dependencies={dependencies}
      toRow={(module) => ({
        id: module.id,
        code: module.code || '-',
        nom: module.nom || 'Module',
        coefficient: module.coefficient ?? '-',
        filiere: module.filiere?.nom || module.filier?.nom || '-',
        catalogStatus: module.code ? 'Ready' : 'Pending',
      })}
      formFields={(deps) => [
        { name: 'code', label: 'Code du module', required: true, placeholder: 'M101' },
        { name: 'nom', label: 'Nom du module', required: true, placeholder: 'Programmation Web' },
        {
          name: 'coefficient',
          label: 'Coefficient',
          type: 'number',
          required: true,
          min: 0,
          max: 99.99,
          step: 0.01,
          placeholder: '3',
        },
        {
          name: 'filiere_id',
          label: 'Filiere',
          type: 'select',
          required: true,
          options: deps.filiereOptions,
          placeholder: 'Associer a une filiere',
        },
      ]}
      detailsFields={() => [
        { name: 'code', label: 'Code du module' },
        { name: 'nom', label: 'Nom du module' },
        { name: 'coefficient', label: 'Coefficient' },
        { name: 'filiere', label: 'Filiere' },
      ]}
      buildInitialValues={(item) => ({
        code: item?.code || '',
        nom: item?.nom || '',
        coefficient: item?.coefficient ?? '',
        filiere_id: item?.filiere_id ? String(item.filiere_id) : '',
        filiere: item?.filiere?.nom || item?.filier?.nom || '-',
      })}
      buildCreatePayload={(values) => ({
        ...values,
        coefficient: Number(values.coefficient),
        filiere_id: Number(values.filiere_id),
      })}
      buildUpdatePayload={(values) => ({
        ...values,
        coefficient: Number(values.coefficient),
        filiere_id: Number(values.filiere_id),
      })}
      createItem={adminApi.createModule}
      updateItem={adminApi.updateModule}
      deleteItem={adminApi.deleteModule}
      getItemName={(item) => item?.nom || 'ce module'}
    />
  );
};

export default AdminModulesPage;
