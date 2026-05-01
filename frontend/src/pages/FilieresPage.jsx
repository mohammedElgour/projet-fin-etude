import React from 'react';
import { BookCopy, FolderKanban, Layers3, Users } from 'lucide-react';
import EntityManagementPage from '../components/admin/EntityManagementPage';
import { adminApi } from '../services/api';

const mapRow = (item) => ({
  id: item.id,
  nom: item.nom || '-',
  description: item.description || '-',
  modulesCount: item.modules_count ?? (Array.isArray(item.modules) ? item.modules.length : 0),
  groupesCount: item.groupes_count ?? (Array.isArray(item.groupes) ? item.groupes.length : 0),
  displayName: item.nom || 'cette filiere',
  formValues: {
    nom: item.nom || '',
    description: item.description || '',
  },
});

export default function FilieresPage() {
  return (
    <EntityManagementPage
      title="Gestion des filieres"
      badge="Filieres"
      singularLabel="Filiere"
      description="Supervisez les filieres, leurs modules et leurs groupes dans une interface plus complete."
      api={adminApi.filieres}
      columns={[
        { key: 'nom', header: 'Nom' },
        { key: 'description', header: 'Description' },
        { key: 'modulesCount', header: 'Modules' },
        { key: 'groupesCount', header: 'Groupes' },
      ]}
      mapItemToRow={mapRow}
      initialValues={{ nom: '', description: '' }}
      buildFields={() => [
        { name: 'nom', label: 'Nom de la filiere', required: true, placeholder: 'Ex: Developpement digital' },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Description optionnelle', fullWidth: true },
      ]}
      createPayload={(values) => ({
        nom: values.nom.trim(),
        description: values.description.trim() || null,
      })}
      updatePayload={(values) => ({
        nom: values.nom.trim(),
        description: values.description.trim() || null,
      })}
      sortOptions={[
        { value: 'created_at', label: 'Plus recentes' },
        { value: 'nom', label: 'Nom' },
        { value: 'modules_count', label: 'Modules' },
        { value: 'groupes_count', label: 'Groupes' },
      ]}
      detailPath={(row) => `/admin/filieres/${row.id}`}
      createDescription="Ajoutez une filiere avec son positionnement pedagogique."
      editDescription="Mettez a jour le nom ou la description de la filiere."
      searchPlaceholder="Rechercher par nom ou description"
      summaryBuilder={({ collection, rows }) => [
        {
          title: 'Total filieres',
          value: collection.total,
          helper: 'Catalogue academique',
          icon: Layers3,
          tone: 'indigo',
        },
        {
          title: 'Modules visibles',
          value: rows.reduce((sum, row) => sum + Number(row.modulesCount || 0), 0),
          helper: 'Somme sur la page',
          icon: BookCopy,
          tone: 'emerald',
        },
        {
          title: 'Groupes visibles',
          value: rows.reduce((sum, row) => sum + Number(row.groupesCount || 0), 0),
          helper: 'Somme sur la page',
          icon: Users,
          tone: 'amber',
        },
        {
          title: 'Affichage courant',
          value: `${collection.from || 0}-${collection.to || 0}`,
          helper: `${collection.total} resultat(s)`,
          icon: FolderKanban,
          tone: 'sky',
        },
      ]}
      validate={(values) => {
        const errors = {};
        if (!values.nom.trim()) {
          errors.nom = 'Le nom de la filiere est requis.';
        }
        return errors;
      }}
    />
  );
}
