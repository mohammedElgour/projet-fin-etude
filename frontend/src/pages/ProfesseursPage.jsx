import React from 'react';
import { CalendarClock, Mail, ShieldCheck, Users } from 'lucide-react';
import EntityManagementPage from '../components/admin/EntityManagementPage';
import { adminApi } from '../services/api';

const mapRow = (item) => ({
  id: item.id,
  name: item.user?.name || '-',
  email: item.user?.email || '-',
  createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '-',
  displayName: item.user?.name || 'ce professeur',
  formValues: {
    name: item.user?.name || '',
    email: item.user?.email || '',
    password: '',
  },
});

export default function ProfesseursPage() {
  return (
    <EntityManagementPage
      title="Gestion des professeurs"
      badge="Professeurs"
      singularLabel="Professeur"
      description="Administrez les comptes professeurs pour la saisie des notes et le suivi pedagogique."
      api={adminApi.professeurs}
      columns={[
        { key: 'name', header: 'Nom' },
        { key: 'email', header: 'Email' },
        { key: 'createdAt', header: 'Creation' },
      ]}
      mapItemToRow={mapRow}
      initialValues={{ name: '', email: '', password: '' }}
      buildFields={({ editingItem }) => [
        { name: 'name', label: 'Nom complet', required: true, placeholder: 'Nom du professeur' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'email@ista.ma' },
        {
          name: 'password',
          label: editingItem ? 'Nouveau mot de passe' : 'Mot de passe',
          type: 'password',
          placeholder: editingItem ? 'Optionnel lors de la modification' : 'Au moins 8 caracteres',
          description: editingItem ? 'Laissez vide pour conserver le mot de passe actuel.' : 'Necessaire pour creer le compte professeur.',
        },
      ]}
      createPayload={(values) => ({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })}
      updatePayload={(values) => {
        const payload = {
          name: values.name.trim(),
          email: values.email.trim(),
        };

        if (values.password) {
          payload.password = values.password;
        }

        return payload;
      }}
      sortOptions={[
        { value: 'created_at', label: 'Plus recents' },
        { value: 'name', label: 'Nom' },
        { value: 'email', label: 'Email' },
      ]}
      detailPath={(row) => `/admin/professeurs/${row.id}`}
      createDescription="Creez un nouveau compte professeur avec ses identifiants."
      editDescription="Mettez a jour le compte sans casser son acces existant."
      searchPlaceholder="Rechercher par nom ou email"
      summaryBuilder={({ collection, rows }) => [
        {
          title: 'Total professeurs',
          value: collection.total,
          helper: 'Comptes pedagogiques',
          icon: Users,
          tone: 'indigo',
        },
        {
          title: 'Emails affiches',
          value: rows.filter((row) => row.email && row.email !== '-').length,
          helper: 'Contacts disponibles sur la page',
          icon: Mail,
          tone: 'emerald',
        },
        {
          title: 'Comptes suivis',
          value: rows.length,
          helper: 'Page courante',
          icon: ShieldCheck,
          tone: 'amber',
        },
        {
          title: 'Affichage courant',
          value: `${collection.from || 0}-${collection.to || 0}`,
          helper: `${collection.total} resultat(s)`,
          icon: CalendarClock,
          tone: 'sky',
        },
      ]}
      validate={(values, editingItem) => {
        const errors = {};
        if (!values.name.trim()) {
          errors.name = 'Le nom du professeur est requis.';
        }
        if (!values.email.trim()) {
          errors.email = 'L email est requis.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
          errors.email = 'Veuillez saisir un email valide.';
        }
        if (!editingItem && values.password.trim().length < 8) {
          errors.password = 'Le mot de passe doit contenir au moins 8 caracteres.';
        }
        if (editingItem && values.password && values.password.trim().length > 0 && values.password.trim().length < 8) {
          errors.password = 'Le mot de passe doit contenir au moins 8 caracteres.';
        }
        return errors;
      }}
    />
  );
}
