import React, { useMemo } from 'react';
import {
  GraduationCap,
  School,
  Users,
  Waypoints,
} from 'lucide-react';
import ResourceCrudPage from '../components/admin/ResourceCrudPage';
import { useAdminResourceList } from '../hooks/useAdminData';
import { useAdminLookups } from '../hooks/useAdminLookups';
import { adminApi } from '../services/api';

const AdminGroupesPage = () => {
  const lookups = useAdminLookups(['filieres']);
  const { items, loading, error, reload } = useAdminResourceList(
    () => adminApi.groups(),
    'Impossible de charger la liste des groupes.'
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
    const totalGroupes = items.length;
    const totalStudents = items.reduce((sum, item) => sum + Number(item.students_count ?? item.stagiaires_count ?? 0), 0);
    const activeFilieres = new Set(items.map((item) => item?.filiere?.nom || item?.filier?.nom).filter(Boolean)).size;
    const avgStudents = totalGroupes ? (totalStudents / totalGroupes).toFixed(1) : '0.0';

    return [
      {
        title: 'Total Groupes',
        value: totalGroupes,
        subtitle: 'Cohorts currently configured',
        icon: School,
        tone: 'orange',
        trend: totalGroupes ? 11.5 : 0,
        progress: totalGroupes ? 100 : 0,
      },
      {
        title: 'Students Assigned',
        value: totalStudents,
        subtitle: 'Learners attached to groupes',
        icon: Users,
        tone: 'blue',
        trend: totalStudents ? 8.7 : 0,
        progress: totalStudents ? 100 : 0,
      },
      {
        title: 'Filieres Related',
        value: activeFilieres,
        subtitle: 'Programs represented',
        icon: GraduationCap,
        tone: 'purple',
        trend: activeFilieres ? 5.2 : 0,
        progress: activeFilieres ? 100 : 0,
      },
      {
        title: 'Avg Cohort Size',
        value: avgStudents,
        subtitle: 'Average students per groupe',
        icon: Waypoints,
        tone: 'cyan',
        trend: Number(avgStudents) ? 3.4 : 0,
        progress: Math.min(Number(avgStudents) * 10, 100),
      },
    ];
  }, [items]);

  return (
    <ResourceCrudPage
      title="Groupes"
      entityLabel="Groupe"
      description="Pilotez les groupes et leurs rattachements avec des actions compactes, lisibles et adaptees aux usages d'un dashboard moderne."
      items={items}
      loading={loading}
      error={error}
      reload={reload}
      summaryCards={summaryCards}
      columns={[
        {
          key: 'nom',
          header: 'Groupe',
          render: (row) => (
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20">
                <School className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{row.nom}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Group #{row.id}</p>
              </div>
            </div>
          ),
        },
        {
          key: 'filiere',
          header: 'Filiere',
          render: (row) => (
            <span className="inline-flex rounded-full bg-violet-500/10 px-3 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300">
              {row.filiere}
            </span>
          ),
        },
        {
          key: 'stagiaires',
          header: 'Stagiaires',
          render: (row) => (
            <div className="min-w-[150px]">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Occupancy</span>
                <span>{row.stagiaires}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400"
                  style={{ width: `${Math.min(Number(row.stagiaires || 0) * 8, 100)}%` }}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'preview',
          header: 'Overview',
          render: (row) => (
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{row.stagiaires > 0 ? 'Active cohort' : 'Empty cohort'}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Filiere relation: {row.filiere}</p>
            </div>
          ),
        },
      ]}
      emptyMessage="Aucun groupe disponible"
      addLabel="Ajouter un groupe"
      createTitle="Ajouter un groupe"
      editTitle="Modifier le groupe"
      detailTitle="Details du groupe"
      deleteTitle="Supprimer ce groupe"
      deleteDescription={(item) =>
        item ? `Le groupe "${item.nom}" sera supprime. Verifiez que les stagiaires ont ete reaffectes si necessaire.` : ''
      }
      dependencies={dependencies}
      toRow={(group) => ({
        id: group.id,
        nom: group.nom || group.name || 'Groupe',
        filiere: group.filiere?.nom || group.filier?.nom || '-',
        stagiaires: group.students_count ?? group.stagiaires_count ?? 0,
        preview: group.students_count ?? group.stagiaires_count ?? 0,
      })}
      formFields={(deps) => [
        { name: 'nom', label: 'Nom du groupe', required: true, placeholder: 'DD101' },
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
        { name: 'nom', label: 'Nom du groupe' },
        { name: 'filiere', label: 'Filiere' },
        { name: 'stagiaires', label: 'Effectif stagiaires' },
      ]}
      buildInitialValues={(item) => ({
        nom: item?.nom || '',
        filiere_id: item?.filiere_id ? String(item.filiere_id) : '',
        filiere: item?.filiere?.nom || item?.filier?.nom || '-',
        stagiaires: item?.students_count ?? item?.stagiaires_count ?? 0,
      })}
      buildCreatePayload={(values) => ({
        ...values,
        filiere_id: Number(values.filiere_id),
      })}
      buildUpdatePayload={(values) => ({
        ...values,
        filiere_id: Number(values.filiere_id),
      })}
      createItem={adminApi.createGroup}
      updateItem={adminApi.updateGroup}
      deleteItem={adminApi.deleteGroup}
      getItemName={(item) => item?.nom || 'ce groupe'}
    />
  );
};

export default AdminGroupesPage;
