import React from 'react';
import { BookOpenText, Calculator, GraduationCap, LayoutList } from 'lucide-react';
import EntityManagementPage from '../components/admin/EntityManagementPage';
import { adminApi } from '../services/api';

const loadCatalogs = async () => {
  const { filieres } = await adminApi.catalogs();
  return { filieres };
};

const mapRow = (item) => ({
  id: item.id,
  nom: item.nom || '-',
  coefficient: item.coefficient || '-',
  filiere: item.filier?.nom || '-',
  notesCount: item.notes_count ?? 0,
  displayName: item.nom || 'ce module',
  formValues: {
    nom: item.nom || '',
    coefficient: item.coefficient || '',
    filiere_id: item.filiere_id ? String(item.filiere_id) : '',
  },
});

export default function ModulesPage() {
  return (
    <EntityManagementPage
      title="Gestion des modules"
      badge="Modules"
      singularLabel="Module"
      description="Maintenez le catalogue des modules, leurs coefficients et leur rattachement aux filieres."
      api={adminApi.modules}
      loadCatalogs={loadCatalogs}
      columns={[
        { key: 'nom', header: 'Nom' },
        { key: 'coefficient', header: 'Coefficient' },
        { key: 'filiere', header: 'Filiere' },
        { key: 'notesCount', header: 'Notes' },
      ]}
      mapItemToRow={mapRow}
      initialValues={{ nom: '', coefficient: '', filiere_id: '' }}
      buildFields={({ catalogs }) => [
        { name: 'nom', label: 'Nom du module', required: true, placeholder: 'Ex: React avance' },
        {
          name: 'coefficient',
          label: 'Coefficient',
          type: 'number',
          required: true,
          min: 0,
          max: 99.99,
          step: 0.01,
        },
        {
          name: 'filiere_id',
          label: 'Filiere',
          type: 'select',
          required: true,
          options: (catalogs.filieres || []).map((filiere) => ({
            value: String(filiere.id),
            label: filiere.nom,
          })),
        },
      ]}
      createPayload={(values) => ({
        nom: values.nom.trim(),
        coefficient: Number(values.coefficient),
        filiere_id: Number(values.filiere_id),
      })}
      updatePayload={(values) => ({
        nom: values.nom.trim(),
        coefficient: Number(values.coefficient),
        filiere_id: Number(values.filiere_id),
      })}
      filterControls={[
        {
          name: 'filiere_id',
          label: 'Filiere',
          allLabel: 'Toutes les filieres',
          getOptions: (catalogs) =>
            (catalogs.filieres || []).map((filiere) => ({
              value: String(filiere.id),
              label: filiere.nom,
            })),
        },
      ]}
      sortOptions={[
        { value: 'created_at', label: 'Plus recents' },
        { value: 'nom', label: 'Nom' },
        { value: 'coefficient', label: 'Coefficient' },
        { value: 'notes_count', label: 'Nombre de notes' },
      ]}
      detailPath={(row) => `/admin/modules/${row.id}`}
      createDescription="Ajoutez un module et son coefficient academique."
      editDescription="Mettez a jour le module sans casser son rattachement a la filiere."
      searchPlaceholder="Rechercher par nom de module ou filiere"
      summaryBuilder={({ collection, rows }) => [
        {
          title: 'Total modules',
          value: collection.total,
          helper: 'Catalogue disponible',
          icon: BookOpenText,
          tone: 'indigo',
        },
        {
          title: 'Coefficient moyen',
          value: rows.length ? (rows.reduce((sum, row) => sum + Number(row.coefficient || 0), 0) / rows.length).toFixed(2) : '0.00',
          helper: 'Sur la page courante',
          icon: Calculator,
          tone: 'emerald',
        },
        {
          title: 'Notes visibles',
          value: rows.reduce((sum, row) => sum + Number(row.notesCount || 0), 0),
          helper: 'Notes rattachees aux modules affiches',
          icon: LayoutList,
          tone: 'amber',
        },
        {
          title: 'Affichage courant',
          value: `${collection.from || 0}-${collection.to || 0}`,
          helper: `${collection.total} resultat(s)`,
          icon: GraduationCap,
          tone: 'sky',
        },
      ]}
      validate={(values) => {
        const errors = {};
        if (!values.nom.trim()) {
          errors.nom = 'Le nom du module est requis.';
        }
        if (!values.coefficient && values.coefficient !== 0) {
          errors.coefficient = 'Le coefficient est requis.';
        }
        if (!values.filiere_id) {
          errors.filiere_id = 'La filiere est requise.';
        }
        return errors;
      }}
    />
  );
}
