import React from 'react';
import { FolderGit2, GraduationCap, Layers3, Users } from 'lucide-react';
import EntityManagementPage from '../components/admin/EntityManagementPage';
import { adminApi } from '../services/api';

const loadCatalogs = async () => {
  const { filieres } = await adminApi.catalogs();
  return { filieres };
};

const mapRow = (item) => ({
  id: item.id,
  nom: item.nom || '-',
  filiere: (item.filiere || item.filier)?.nom || '-',
  studentsCount: item.students_count ?? 0,
  displayName: item.nom || 'ce groupe',
  formValues: {
    nom: item.nom || '',
    filiere_id: item.filiere_id ? String(item.filiere_id) : '',
  },
});

export default function GroupesPage() {
  return (
    <EntityManagementPage
      title="Gestion des groupes"
      badge="Groupes"
      singularLabel="Groupe"
      description="Organisez les groupes, reliez-les aux filieres et suivez les effectifs etudiants."
      api={adminApi.groupes}
      loadCatalogs={loadCatalogs}
      columns={[
        { key: 'nom', header: 'Nom' },
        { key: 'filiere', header: 'Filiere' },
        { key: 'studentsCount', header: 'Stagiaires' },
      ]}
      mapItemToRow={mapRow}
      initialValues={{ nom: '', filiere_id: '' }}
      buildFields={({ catalogs }) => [
        { name: 'nom', label: 'Nom du groupe', required: true, placeholder: 'Ex: DEV101' },
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
        filiere_id: Number(values.filiere_id),
      })}
      updatePayload={(values) => ({
        nom: values.nom.trim(),
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
        { value: 'students_count', label: 'Effectif' },
      ]}
      detailPath={(row) => `/admin/groupes/${row.id}`}
      createDescription="Ajoutez un groupe et affectez-le a une filiere."
      editDescription="Mettez a jour le groupe et son rattachement pedagogique."
      searchPlaceholder="Rechercher par groupe ou filiere"
      summaryBuilder={({ collection, rows }) => [
        {
          title: 'Total groupes',
          value: collection.total,
          helper: 'Organisation academique',
          icon: FolderGit2,
          tone: 'indigo',
        },
        {
          title: 'Effectif visible',
          value: rows.reduce((sum, row) => sum + Number(row.studentsCount || 0), 0),
          helper: 'Somme des stagiaires affiches',
          icon: Users,
          tone: 'emerald',
        },
        {
          title: 'Filieres couvertes',
          value: new Set(rows.map((row) => row.filiere).filter(Boolean)).size,
          helper: 'Sur la page courante',
          icon: Layers3,
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
          errors.nom = 'Le nom du groupe est requis.';
        }
        if (!values.filiere_id) {
          errors.filiere_id = 'La filiere est requise.';
        }
        return errors;
      }}
    />
  );
}
