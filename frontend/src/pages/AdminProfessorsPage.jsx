import React, { useMemo, useState } from 'react';
import { BookOpenCheck, GraduationCap, KeyRound, ShieldCheck, ShieldOff, UserCog, Users } from 'lucide-react';
import ActionButton from '../components/admin/ActionButton';
import CrudModal from '../components/admin/CrudModal';
import ResourceCrudPage from '../components/admin/ResourceCrudPage';
import SearchableMultiSelect from '../components/common/SearchableMultiSelect';
import { useAdminResourceList } from '../hooks/useAdminData';
import { useAdminLookups } from '../hooks/useAdminLookups';
import { useToast } from '../context/ToastContext';
import { adminApi } from '../services/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

const renderGroupBadges = (groups = []) => {
  if (!Array.isArray(groups) || groups.length === 0) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">
        Aucun groupe
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((group) => (
        <span
          key={group.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-700 ring-1 ring-sky-500/10 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/20"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-300" />
          <span className="max-w-[12rem] truncate">{group.nom}</span>
        </span>
      ))}
    </div>
  );
};

const renderModuleBadges = (modules = []) => {
  if (!Array.isArray(modules) || modules.length === 0) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">
        Aucun module
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {modules.map((module) => (
        <span
          key={module.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1.5 text-sm font-medium text-violet-700 ring-1 ring-violet-500/10 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-400/20"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-300" />
          <span className="max-w-[12rem] truncate">{module.code ? `${module.code} - ${module.nom}` : module.nom}</span>
        </span>
      ))}
    </div>
  );
};

const AdminProfessorsPage = () => {
  const lookups = useAdminLookups(['filieres', 'groups', 'modules']);
  const { items, loading, error, reload } = useAdminResourceList(
    () => adminApi.professors(),
    'Impossible de charger la liste des professeurs.'
  );
  const toast = useToast();
  const [busyAction, setBusyAction] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  const dependencies = useMemo(() => {
    const filiereOptions = (lookups.filieres || []).map((filiere) => ({
      value: String(filiere.id),
      label: filiere.nom,
    }));

    const groups = (lookups.groups || []).map((group) => ({
      ...group,
      value: String(group.id),
      label: group.nom,
      filiereId: String(group.filiere_id),
      filiereName: group.filiere?.nom || group.filier?.nom || '',
    }));

    const modules = (lookups.modules || []).map((module) => ({
      ...module,
      value: String(module.id),
      label: module.code ? `${module.code} - ${module.nom}` : module.nom,
      filiereId: String(module.filiere_id),
      filiereName: module.filiere?.nom || module.filier?.nom || '',
    }));

    const specialiteOptions = Array.from(new Set(items.map((professor) => professor.specialite).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({
        value,
        label: value,
      }));

    return {
      filiereOptions,
      groups,
      modules,
      specialiteOptions,
    };
  }, [items, lookups.filieres, lookups.groups, lookups.modules]);

  const summaryCards = useMemo(() => {
    const totalTeachers = items.length;
    const uniqueSpecialities = new Set(items.map((professor) => professor.specialite).filter(Boolean)).size;
    const activeFilieres = new Set(items.map((professor) => professor?.filiere?.nom || professor?.filier?.nom).filter(Boolean)).size;
    const teachersWithPhone = items.filter((professor) => professor?.user?.phone).length;
    const contactCoverage = totalTeachers ? Math.round((teachersWithPhone / totalTeachers) * 100) : 0;

    return [
      {
        title: 'Total Teachers',
        value: totalTeachers,
        subtitle: 'Faculty accounts onboarded',
        icon: UserCog,
        tone: 'purple',
        trend: totalTeachers ? 10.2 : 0,
        progress: totalTeachers ? 100 : 0,
      },
      {
        title: 'Specialties',
        value: uniqueSpecialities,
        subtitle: 'Distinct teaching domains',
        icon: BookOpenCheck,
        tone: 'blue',
        trend: uniqueSpecialities ? 7.4 : 0,
        progress: uniqueSpecialities ? 100 : 0,
      },
      {
        title: 'Filieres Linked',
        value: activeFilieres,
        subtitle: 'Programs supervised',
        icon: GraduationCap,
        tone: 'emerald',
        trend: activeFilieres ? 5.6 : 0,
        progress: activeFilieres ? 100 : 0,
      },
      {
        title: 'Contact Coverage',
        value: `${contactCoverage}%`,
        subtitle: 'Profiles with phone details',
        icon: Users,
        tone: 'cyan',
        trend: contactCoverage >= 70 ? 3.9 : -1.6,
        progress: contactCoverage,
      },
    ];
  }, [items]);

  const handleToggleActive = async (row) => {
    setBusyAction({ id: row.id, type: row.isActive ? 'deactivate' : 'activate' });

    try {
      await adminApi.updateProfessor(row.id, { is_active: !row.isActive });
      toast.success(
        row.isActive ? 'Account deactivated successfully.' : 'Account activated successfully.',
        row.isActive ? 'The professor account is now inactive.' : 'The professor account is now active.'
      );
      await reload();
    } catch (err) {
      toast.error(
        'Unable to update account status.',
        err?.response?.data?.message || 'Please try again in a moment.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleResetPassword = async (values) => {
    if (!resetTarget) {
      return;
    }

    setBusyAction({ id: resetTarget.id, type: 'reset_password' });

    try {
      await adminApi.updateProfessor(resetTarget.id, {
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      setResetTarget(null);
      toast.success('Password reset successfully.', 'The new password has been applied.');
      await reload();
    } catch (err) {
      toast.error('Unable to reset password.', err?.response?.data?.message || 'Please try again in a moment.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <>
      <ResourceCrudPage
        title="Formateurs"
        entityLabel="Formateur"
        description="Ajoutez et gerez les formateurs dans un formulaire plus complet, plus professionnel et mieux guide."
        items={items}
        loading={loading}
        error={error}
        reload={reload}
        dependencies={dependencies}
        summaryCards={summaryCards}
        rowActions={[
          {
            key: 'toggle-status',
            render: (row) => (
              <ActionButton
                key={`toggle-${row.id}`}
                size="sm"
                variant={row.isActive ? 'neutral' : 'success'}
                icon={row.isActive ? ShieldOff : ShieldCheck}
                loading={busyAction?.id === row.id && busyAction?.type === (row.isActive ? 'deactivate' : 'activate')}
                onClick={() => handleToggleActive(row)}
              >
                {row.isActive ? 'Deactivate' : 'Activate'}
              </ActionButton>
            ),
          },
          {
            key: 'reset-password',
            render: (row) => (
              <ActionButton
                key={`reset-${row.id}`}
                size="sm"
                variant="secondary"
                icon={KeyRound}
                onClick={() => setResetTarget(row)}
              >
                Reset Password
              </ActionButton>
            ),
          },
        ]}
        columns={[
          {
            key: 'name',
            header: 'Formateur',
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25">
                  {getInitials(row.name || 'P')}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{row.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Faculty profile active</p>
                </div>
              </div>
            ),
          },
          {
            key: 'email',
            header: 'Contact',
            render: (row) => (
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{row.email}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.phone}</p>
              </div>
            ),
          },
          {
            key: 'formation',
            header: 'Formation',
            render: (row) => (
              <span className="inline-flex rounded-full bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-700 dark:text-sky-300">
                {row.formation}
              </span>
            ),
          },
          {
            key: 'groupes',
            header: 'Groupes',
            render: (row) => renderGroupBadges(row.groupes),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                  row.isActive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                }`}
              >
                {row.isActive ? 'Actif' : 'Desactive'}
              </span>
            ),
          },
          {
            key: 'specialite',
            header: 'Specialite',
            render: (row) => (
              <div className="max-w-[220px]">
                <p className="font-semibold text-slate-900 dark:text-white">{row.specialite}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Teaching specialty focus</p>
              </div>
            ),
          },
          {
            key: 'profileScore',
            header: 'Overview',
            render: (row) => (
              <div className="min-w-[150px]">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Profile readiness</span>
                  <span>{row.profileScore}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500"
                    style={{ width: `${row.profileScore}%` }}
                  />
                </div>
              </div>
            ),
          },
        ]}
        emptyMessage="Aucun formateur disponible"
        addLabel="Ajouter un formateur"
        createTitle="Ajouter un formateur"
        detailTitle="Details du formateur"
        deleteTitle="Supprimer ce formateur"
        deleteDescription={(item) =>
          item ? `Le compte de ${item.user?.name || 'ce formateur'} sera supprime de la plateforme.` : ''
        }
        toRow={(professor) => ({
          id: professor.id,
          name:
            `${professor.user?.first_name || ''} ${professor.user?.last_name || ''}`.trim() ||
            professor.user?.name ||
            'Professeur',
          email: professor.user?.email || '-',
          phone: professor.user?.phone || '-',
          formation: professor.filiere?.nom || professor.filier?.nom || '-',
          groupes: Array.isArray(professor.groupes)
            ? professor.groupes.map((group) => ({
                id: group.id,
                nom: group.nom,
                filiere: group.filiere?.nom || group.filier?.nom || '-',
              }))
            : [],
          modules: Array.isArray(professor.modules)
            ? professor.modules.map((module) => ({
                id: module.id,
                code: module.code,
                nom: module.nom,
                filiere: module.filiere?.nom || module.filier?.nom || '-',
              }))
            : [],
          specialite: professor.specialite || '-',
          isActive: Boolean(professor.user?.is_active ?? true),
          profileScore: Math.round(
            (
              [
                professor.user?.email,
                professor.user?.phone,
                professor.user?.address,
                professor.filiere?.nom || professor.filier?.nom,
                professor.specialite,
              ].filter(Boolean).length / 5
            ) * 100
          ),
        })}
        formFields={(deps) => [
          { name: 'first_name', label: 'Nom', required: true, placeholder: 'Alaoui' },
          { name: 'last_name', label: 'Prenom', required: true, placeholder: 'Omar' },
          { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'omar@ista.ma' },
          { name: 'phone', label: 'Telephone', type: 'tel', required: true, placeholder: '+212 6 44 55 66 77' },
          { name: 'address', label: 'Adresse', type: 'textarea', required: true, fullWidth: true, placeholder: 'Rue, ville, region...' },
          {
            name: 'filiere_id',
            label: 'Formation',
            type: 'searchable-select',
            required: true,
            options: deps.filiereOptions,
            placeholder: 'Selectionner une formation',
          },
          {
            name: 'groups',
            label: 'Groupes',
            type: 'custom',
            fullWidth: true,
            visible: (values) => Boolean(values.filiere_id),
            render: ({ values, error, onChange }) => {
              const availableGroups = deps.groups.filter((group) => String(group.filiereId) === String(values.filiere_id));

              return (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Groupes *</label>
                  <div className="rounded-[22px] border border-white/70 bg-white/85 p-4 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
                    <SearchableMultiSelect
                      options={availableGroups}
                      selected={values.groups || []}
                      onChange={onChange}
                      placeholder="Rechercher un groupe..."
                      getOptionLabel={(group) => group.nom}
                      getOptionValue={(group) => group.id}
                      getOptionSearchText={(group) => `${group.nom} ${group.filiereName || ''}`}
                      emptyMessage="Aucun groupe disponible pour cette formation."
                      ariaLabel="Groupes affectes"
                      selectedLabel="Groupes selectionnes"
                      availableLabel="Groupes disponibles"
                      className="border-none bg-transparent p-0 shadow-none"
                    />
                    {error ? <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p> : null}
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Selectionnez un ou plusieurs groupes lies a la formation choisie.
                    </p>
                  </div>
                </div>
              );
            },
          },
          {
            name: 'modules',
            label: 'Modules',
            type: 'custom',
            fullWidth: true,
            visible: (values) => Boolean(values.filiere_id),
            render: ({ values, error, onChange }) => {
              const availableModules = deps.modules.filter((module) => String(module.filiereId) === String(values.filiere_id));

              return (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Modules *</label>
                  <div className="rounded-[22px] border border-white/70 bg-white/85 p-4 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
                    <SearchableMultiSelect
                      options={availableModules}
                      selected={values.modules || []}
                      onChange={onChange}
                      placeholder="Rechercher un module..."
                      getOptionLabel={(module) => (module.code ? `${module.code} - ${module.nom}` : module.nom)}
                      getOptionValue={(module) => module.id}
                      getOptionSearchText={(module) => `${module.code || ''} ${module.nom} ${module.filiereName || ''}`}
                      emptyMessage="Aucun module disponible pour cette formation."
                      ariaLabel="Modules affectes"
                      selectedLabel="Modules selectionnes"
                      availableLabel="Modules disponibles"
                      className="border-none bg-transparent p-0 shadow-none"
                    />
                    {error ? <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p> : null}
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Selectionnez un ou plusieurs modules lies a la formation choisie.
                    </p>
                  </div>
                </div>
              );
            },
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
          { name: 'status', label: 'Statut' },
          { name: 'formation', label: 'Formation' },
          {
            name: 'groupes',
            label: 'Groupes affectes',
            fullWidth: true,
            renderValue: (_, item) => renderGroupBadges(item?.groupes || []),
          },
          {
            name: 'modules',
            label: 'Modules affectes',
            fullWidth: true,
            renderValue: (_, item) => renderModuleBadges(item?.modules || []),
          },
          { name: 'specialite', label: 'Specialite / Module' },
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
          filiere_id: item?.filiere_id ? String(item.filiere_id) : '',
          formation: item?.filiere?.nom || item?.filier?.nom || '-',
          groups: Array.isArray(item?.groupes) ? item.groupes.map((group) => String(group.id)) : [],
          modules: Array.isArray(item?.modules) ? item.modules.map((module) => String(module.id)) : [],
          password: '',
          confirm_password: '',
          status: item?.user?.is_active ? 'Actif' : 'Desactive',
        })}
        buildCreatePayload={(values) => ({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          filiere_id: Number(values.filiere_id),
          password: values.password,
          groups: (values.groups || []).map((groupId) => Number(groupId)),
          modules: (values.modules || []).map((moduleId) => Number(moduleId)),
        })}
        validateForm={(values, mode) => {
          const errors = {};
          const requiredFields = [
            ['first_name', 'Le nom est requis.'],
            ['last_name', 'Le prenom est requis.'],
            ['email', "L'email est requis."],
            ['phone', 'Le telephone est requis.'],
            ['address', "L'adresse est requise."],
            ['filiere_id', 'La formation est requise.'],
          ];

          requiredFields.forEach(([field, message]) => {
            if (!values[field]) {
              errors[field] = message;
            }
          });

          if (values.email && !emailPattern.test(values.email)) {
            errors.email = "L'adresse email n'est pas valide.";
          }

          if (!Array.isArray(values.groups) || values.groups.length === 0) {
            errors.groups = 'Au moins un groupe est obligatoire.';
          }

          if (!Array.isArray(values.modules) || values.modules.length === 0) {
            errors.modules = 'Au moins un module est obligatoire.';
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
        createItem={adminApi.createProfessor}
        deleteItem={adminApi.deleteProfessor}
        getItemName={(item) => item?.user?.name || 'ce formateur'}
        initialFilters={{ formationId: '', specialite: '' }}
        filterFn={(row, rawItem, filters) => {
          if (filters.formationId && String(rawItem?.filiere_id || '') !== String(filters.formationId)) {
            return false;
          }

          if (filters.specialite && row.specialite !== filters.specialite) {
            return false;
          }

          return true;
        }}
        renderFilters={({ dependencies: deps, draftFilters, setDraftFilters, applyFilters, resetFilters }) => (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Formation</label>
                <select
                  value={draftFilters.formationId}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      formationId: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                >
                  <option value="">Toutes les formations</option>
                  {deps.filiereOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Specialite / Module</label>
                <select
                  value={draftFilters.specialite}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      specialite: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                >
                  <option value="">Toutes les specialites</option>
                  {deps.specialiteOptions.map((option) => (
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
        )}
      />

      <CrudModal
        isOpen={Boolean(resetTarget)}
        mode="create"
        title={resetTarget ? `Reset password - ${resetTarget.name}` : 'Reset Password'}
        fields={[
          { name: 'password', label: 'Nouveau mot de passe', type: 'password', required: true },
          { name: 'password_confirmation', label: 'Confirmer le mot de passe', type: 'password', required: true },
        ]}
        initialValues={{ password: '', password_confirmation: '' }}
        onClose={() => {
          if (!busyAction) {
            setResetTarget(null);
          }
        }}
        onSubmit={handleResetPassword}
        submitLabel="Reset Password"
        loading={busyAction?.type === 'reset_password'}
        validate={(values) => {
          const errors = {};
          if (!values.password) {
            errors.password = 'Le mot de passe est requis.';
          } else if (values.password.length < 8) {
            errors.password = 'Le mot de passe doit contenir au moins 8 caracteres.';
          }

          if (!values.password_confirmation) {
            errors.password_confirmation = 'La confirmation est requise.';
          } else if (values.password !== values.password_confirmation) {
            errors.password_confirmation = 'Les mots de passe ne correspondent pas.';
          }

          return errors;
        }}
      />
    </>
  );
};

export default AdminProfessorsPage;
