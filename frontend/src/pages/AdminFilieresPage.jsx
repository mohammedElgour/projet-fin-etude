import React from 'react';
import ResourceCrudPage from '../components/admin/ResourceCrudPage';
import { useAdminResourceList } from '../hooks/useAdminData';
import { adminApi } from '../services/api';

const AdminFilieresPage = () => {
  const { items, loading, error, reload } = useAdminResourceList(
    () => adminApi.filieres(),
    'Impossible de charger la liste des filieres.'
  );

  return (
    <ResourceCrudPage
      title="Filieres"
      entityLabel="Filiere"
      description="Structurez les parcours de formation avec une presentation plus premium et des actions CRUD harmonisees."
      items={items}
      loading={loading}
      error={error}
      reload={reload}
      columns={[
        { key: 'id', header: 'ID' },
        { key: 'nom', header: 'Filiere' },
        { key: 'description', header: 'Description' },
        { key: 'groupes', header: 'Groupes' },
        { key: 'modules', header: 'Modules' },
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
