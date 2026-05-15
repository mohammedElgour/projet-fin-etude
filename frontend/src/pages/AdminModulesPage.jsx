import React, { useMemo } from 'react';
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

  return (
    <ResourceCrudPage
      title="Modules"
      entityLabel="Module"
      description="Administrez les modules avec une interface plus nette, de meilleures priorites visuelles et des interactions premium."
      items={items}
      loading={loading}
      error={error}
      reload={reload}
      columns={[
        { key: 'code', header: 'Code' },
        { key: 'nom', header: 'Module' },
        { key: 'coefficient', header: 'Coefficient' },
        { key: 'filiere', header: 'Filiere' },
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
