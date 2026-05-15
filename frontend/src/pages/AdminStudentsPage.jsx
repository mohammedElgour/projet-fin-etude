import React, { useMemo } from 'react';
import ActionButton from '../components/admin/ActionButton';
import ResourceCrudPage from '../components/admin/ResourceCrudPage';
import { useAdminResourceList } from '../hooks/useAdminData';
import { useAdminLookups } from '../hooks/useAdminLookups';
import { adminApi } from '../services/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const filiereAliases = {
  'developpement digital': 'D\u00E9veloppement Digital',
  'développement digital': 'D\u00E9veloppement Digital',
  'dã©veloppement digital': 'D\u00E9veloppement Digital',
};

const normalizeFiliereWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim();

const getCanonicalFiliereName = (value = '') => {
  const cleaned = normalizeFiliereWhitespace(value);
  const key = cleaned.toLocaleLowerCase('fr-FR');

  return filiereAliases[key] || cleaned;
};

const getFiliereFilterKey = (value = '') => getCanonicalFiliereName(value).toLocaleLowerCase('fr-FR');

const AdminStudentsPage = () => {
  const lookups = useAdminLookups(['filieres', 'groups']);
  const { items, loading, error, reload } = useAdminResourceList(
    () => adminApi.students(),
    'Impossible de charger la liste des stagiaires.'
  );

  const dependencies = useMemo(() => {
    const groupedFilieres = new Map();

    (lookups.filieres || []).forEach((filiere) => {
      const label = getCanonicalFiliereName(filiere.nom || '');
      const filterKey = getFiliereFilterKey(label);
      const current = groupedFilieres.get(filterKey);
      const isExactCanonical = normalizeFiliereWhitespace(filiere.nom || '') === label;

      if (!current || isExactCanonical) {
        groupedFilieres.set(filterKey, {
          value: String(filiere.id),
          label,
          filterKey,
        });
      }
    });

    const filiereOptions = Array.from(groupedFilieres.values()).map(({ value, label }) => ({
      value,
      label,
    }));

    const filterFiliereOptions = Array.from(groupedFilieres.values()).map(({ filterKey, label }) => ({
      value: filterKey,
      label,
    }));

    const groups = (lookups.groups || []).map((group) => ({
      ...group,
      filiereFilterKey: getFiliereFilterKey(group?.filiere?.nom || group?.filier?.nom || ''),
    }));

    return {
      filiereOptions,
      filterFiliereOptions,
      groups,
    };
  }, [lookups.filieres, lookups.groups]);

  return (
    <ResourceCrudPage
      title="Stagiaires"
      entityLabel="Stagiaire"
      description="Ajoutez des stagiaires via un formulaire plus complet, lisible et adapte aux usages d'un vrai espace d'administration."
      items={items}
      loading={loading}
      error={error}
      reload={reload}
      columns={[
        { key: 'name', header: 'Stagiaire' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Telephone' },
        { key: 'groupe', header: 'Groupe' },
        { key: 'formation', header: 'Formation' },
      ]}
      emptyMessage="Aucun stagiaire disponible"
      addLabel="Ajouter un stagiaire"
      createTitle="Ajouter un stagiaire"
      editTitle="Modifier le stagiaire"
      detailTitle="Details du stagiaire"
      deleteTitle="Supprimer ce stagiaire"
      deleteDescription={(item) =>
        item ? `Le compte de ${item.user?.name || 'ce stagiaire'} et sa fiche academique seront supprimes.` : ''
      }
      dependencies={dependencies}
      toRow={(student) => ({
        id: student.id,
        name:
          `${student.user?.first_name || ''} ${student.user?.last_name || ''}`.trim() ||
          student.user?.name ||
          'Stagiaire',
        email: student.user?.email || '-',
        phone: student.user?.phone || '-',
        groupe: student.groupe?.nom || '-',
        formation: getCanonicalFiliereName(student.groupe?.filiere?.nom || student.groupe?.filier?.nom || '-'),
        filiere: getCanonicalFiliereName(student.groupe?.filiere?.nom || student.groupe?.filier?.nom || '-'),
      })}
      formFields={(deps) => [
        { name: 'first_name', label: 'Nom', required: true, placeholder: 'Bennani' },
        { name: 'last_name', label: 'Prenom', required: true, placeholder: 'Sara' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'sara@ista.ma' },
        { name: 'phone', label: 'Telephone', type: 'tel', required: true, placeholder: '+212 6 12 34 56 78' },
        { name: 'address', label: 'Adresse', type: 'textarea', required: true, fullWidth: true, placeholder: 'Rue, ville, region...' },
        { name: 'date_of_birth', label: 'Date de naissance', type: 'date', required: true },
        {
          name: 'filiere_id',
          label: 'Formation',
          type: 'searchable-select',
          required: true,
          options: deps.filiereOptions,
          placeholder: 'Selectionner une formation',
        },
        {
          name: 'groupe_id',
          label: 'Groupe',
          type: 'select',
          required: true,
          disabled: (values) => !values.filiere_id,
          options: (values) =>
            deps.groups
              .filter((group) => String(group.filiere_id) === String(values.filiere_id))
              .map((group) => ({
                value: String(group.id),
                label: group.nom,
              })),
          placeholder: (values) => (values?.filiere_id ? 'Selectionner un groupe' : 'Choisissez une filiere d abord'),
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          required: true,
          placeholder: 'Minimum 8 caracteres',
        },
        {
          name: 'confirm_password',
          label: 'Confirm Password',
          type: 'password',
          required: true,
          placeholder: 'Retapez le mot de passe',
        },
      ]}
      detailsFields={() => [
        { name: 'full_name', label: 'Nom complet' },
        { name: 'email', label: 'Email' },
        { name: 'phone', label: 'Telephone' },
        { name: 'address', label: 'Adresse', fullWidth: true },
        { name: 'date_of_birth', label: 'Date de naissance' },
        { name: 'formation', label: 'Formation' },
        { name: 'groupe', label: 'Groupe' },
      ]}
      buildInitialValues={(item) => ({
        first_name: item?.user?.first_name || '',
        last_name: item?.user?.last_name || '',
        full_name:
          `${item?.user?.first_name || ''} ${item?.user?.last_name || ''}`.trim() ||
          item?.user?.name ||
          '-',
        email: item?.user?.email || '',
        phone: item?.user?.phone || '',
        address: item?.user?.address || '',
        date_of_birth: item?.user?.date_of_birth || '',
        filiere_id: item?.groupe?.filiere_id ? String(item.groupe.filiere_id) : item?.groupe?.filier?.id ? String(item.groupe.filier.id) : '',
        groupe_id: item?.groupe_id ? String(item.groupe_id) : '',
        password: '',
        confirm_password: '',
        formation: getCanonicalFiliereName(item?.groupe?.filiere?.nom || item?.groupe?.filier?.nom || '-'),
        groupe: item?.groupe?.nom || '-',
        filiere: getCanonicalFiliereName(item?.groupe?.filiere?.nom || item?.groupe?.filier?.nom || '-'),
      })}
      buildCreatePayload={(values) => ({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        date_of_birth: values.date_of_birth,
        groupe_id: Number(values.groupe_id),
        password: values.password,
      })}
      buildUpdatePayload={(values) => {
        const payload = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          date_of_birth: values.date_of_birth,
          groupe_id: Number(values.groupe_id),
        };

        if (values.password) {
          payload.password = values.password;
        }

        return payload;
      }}
      validateForm={(values, mode, deps) => {
        const errors = {};
        const requiredFields = [
          ['first_name', 'Le nom est requis.'],
          ['last_name', 'Le prenom est requis.'],
          ['email', "L'email est requis."],
          ['phone', 'Le telephone est requis.'],
          ['address', "L'adresse est requise."],
          ['date_of_birth', 'La date de naissance est requise.'],
          ['filiere_id', 'La filiere est requise.'],
          ['groupe_id', 'Le groupe est requis.'],
        ];

        requiredFields.forEach(([field, message]) => {
          if (!values[field]) {
            errors[field] = message;
          }
        });

        if (values.email && !emailPattern.test(values.email)) {
          errors.email = "L'adresse email n'est pas valide.";
        }

        const availableGroups = deps.groups.filter((group) => String(group.filiere_id) === String(values.filiere_id));
        if (values.filiere_id && availableGroups.length === 0) {
          errors.groupe_id = 'Aucun groupe disponible pour cette filiere.';
        }

        if (mode === 'create' || values.password || values.confirm_password) {
          if (!values.password) {
            errors.password = 'Le mot de passe est requis.';
          } else if (values.password.length < 8) {
            errors.password = 'Le mot de passe doit contenir au moins 8 caracteres.';
          }

          if (!values.confirm_password) {
            errors.confirm_password = 'La confirmation est requise.';
          } else if (values.password !== values.confirm_password) {
            errors.confirm_password = 'Les mots de passe ne correspondent pas.';
          }
        }

        return errors;
      }}
      createItem={adminApi.createStudent}
      updateItem={adminApi.updateStudent}
      deleteItem={adminApi.deleteStudent}
      getItemName={(item) => item?.user?.name || 'ce stagiaire'}
      initialFilters={{ formationKey: '', groupeId: '', filiereKey: '' }}
      filterFn={(row, rawItem, filters) => {
        const rowFiliereKey = getFiliereFilterKey(rawItem?.groupe?.filiere?.nom || rawItem?.groupe?.filier?.nom || '');

        if (filters.formationKey && rowFiliereKey !== String(filters.formationKey)) {
          return false;
        }

        if (filters.groupeId && String(rawItem?.groupe_id || '') !== String(filters.groupeId)) {
          return false;
        }

        if (filters.filiereKey && rowFiliereKey !== String(filters.filiereKey)) {
          return false;
        }

        return true;
      }}
      renderFilters={({ dependencies: deps, draftFilters, setDraftFilters, applyFilters, resetFilters }) => {
        const activeFiliereKey = draftFilters.formationKey || draftFilters.filiereKey;
        const visibleGroups = activeFiliereKey
          ? deps.groups.filter((group) => group.filiereFilterKey === activeFiliereKey)
          : deps.groups;

        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Formation</label>
                <select
                  value={draftFilters.formationKey}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      formationKey: event.target.value,
                      groupeId: '',
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                >
                  <option value="">Toutes les formations</option>
                  {deps.filterFiliereOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Groupe</label>
                <select
                  value={draftFilters.groupeId}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      groupeId: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                >
                  <option value="">Tous les groupes</option>
                  {visibleGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Fili\u00E8re</label>
                <select
                  value={draftFilters.filiereKey}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      filiereKey: event.target.value,
                      groupeId: '',
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                >
                  <option value="">Toutes les fili\u00E8res</option>
                  {deps.filterFiliereOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="neutral" onClick={resetFilters}>
                Reinitialiser
              </ActionButton>
              <ActionButton variant="primary" onClick={applyFilters}>
                Appliquer
              </ActionButton>
            </div>
          </div>
        );
      }}
    />
  );
};

export default AdminStudentsPage;
