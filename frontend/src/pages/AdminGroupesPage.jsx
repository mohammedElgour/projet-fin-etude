import React, { useMemo } from 'react';
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

  return (
    <ResourceCrudPage
      title="Groupes"
      entityLabel="Groupe"
      description="Pilotez les groupes et leurs rattachements avec des actions compactes, lisibles et adaptees aux usages d'un dashboard moderne."
      items={items}
      loading={loading}
      error={error}
      reload={reload}
      columns={[
        { key: 'id', header: 'ID' },
        { key: 'nom', header: 'Groupe' },
        { key: 'filiere', header: 'Filiere' },
        { key: 'stagiaires', header: 'Stagiaires' },
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
