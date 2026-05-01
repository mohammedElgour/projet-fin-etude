import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import ConfirmModal from '../components/admin/ConfirmModal';
import CrudModal from '../components/admin/CrudModal';
import { adminApi } from '../services/api';

const INITIAL_FORM_VALUES = {
  name: '',
  email: '',
  password: '',
  groupe_id: '',
  cin: '',
  phone: '',
  birth_date: '',
  status: 'active',
  address: '',
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
];

const formatError = (error, fallback) => {
  const validationErrors = error?.response?.data?.errors;

  if (validationErrors && typeof validationErrors === 'object') {
    const firstMessage = Object.values(validationErrors).flat()[0];
    if (firstMessage) {
      return firstMessage;
    }
  }

  return error?.response?.data?.message || fallback;
};

const extractValidationErrors = (error) => {
  const validationErrors = error?.response?.data?.errors;

  if (!validationErrors || typeof validationErrors !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(validationErrors).map(([field, messages]) => [field, messages?.[0] || 'Valeur invalide'])
  );
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const normalizePayload = (values) => ({
  name: values.name.trim(),
  email: values.email.trim(),
  password: values.password,
  groupe_id: Number(values.groupe_id),
  cin: values.cin.trim() || null,
  phone: values.phone.trim() || null,
  birth_date: values.birth_date || null,
  status: values.status,
  address: values.address.trim() || null,
});

const getStatusLabel = (value) => STATUS_OPTIONS.find((option) => option.value === value)?.label || value;

const SummaryCard = ({ title, value, helper, icon: Icon, tone = 'indigo' }) => {
  const toneMap = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
        <div className={`rounded-2xl p-3 ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const LoadingRows = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
    ))}
  </div>
);

export default function StagiairesPage() {
  const [catalogs, setCatalogs] = useState({ filieres: [], groupes: [] });
  const [filters, setFilters] = useState({
    search: '',
    filiere_id: '',
    groupe_id: '',
    status: '',
    page: 1,
    per_page: 10,
    sort_by: 'created_at',
    sort_dir: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [collection, setCollection] = useState({
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });
  const [loading, setLoading] = useState(true);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCatalogs = useCallback(async () => {
    setCatalogsLoading(true);

    try {
      const data = await adminApi.catalogs();
      setCatalogs(data);
    } catch (loadError) {
      setError(formatError(loadError, 'Impossible de charger les listes de groupes et filieres.'));
    } finally {
      setCatalogsLoading(false);
    }
  }, []);

  const loadStagiaires = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminApi.stagiaires.list({
        search: filters.search || undefined,
        filiere_id: filters.filiere_id || undefined,
        groupe_id: filters.groupe_id || undefined,
        status: filters.status || undefined,
        page: filters.page,
        per_page: filters.per_page,
        sort_by: filters.sort_by,
        sort_dir: filters.sort_dir,
      });

      setCollection({
        data: Array.isArray(response?.data) ? response.data : [],
        current_page: response?.current_page || 1,
        last_page: response?.last_page || 1,
        per_page: response?.per_page || filters.per_page,
        total: response?.total || 0,
        from: response?.from || 0,
        to: response?.to || 0,
      });
    } catch (loadError) {
      setError(formatError(loadError, 'Impossible de charger les stagiaires.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => (
        current.search === searchInput
          ? current
          : { ...current, search: searchInput, page: 1 }
      ));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadStagiaires();
  }, [loadStagiaires]);

  const groupsByFiliere = useMemo(() => {
    if (!filters.filiere_id) {
      return catalogs.groupes;
    }

    return catalogs.groupes.filter(
      (groupe) => String(groupe.filiere_id || groupe.filier?.id || groupe.filiere?.id) === filters.filiere_id
    );
  }, [catalogs.groupes, filters.filiere_id]);

  const rows = useMemo(
    () =>
      collection.data.map((item) => ({
        id: item.id,
        name: item.user?.name || '-',
        email: item.user?.email || '-',
        cin: item.cin || '-',
        phone: item.phone || '-',
        groupe: item.groupe?.nom || '-',
        filiere: item.groupe?.filier?.nom || item.groupe?.filiere?.nom || '-',
        status: item.status || 'active',
        notesCount: item.notes_count ?? 0,
        createdAt: item.created_at,
        formValues: {
          name: item.user?.name || '',
          email: item.user?.email || '',
          password: '',
          groupe_id: item.groupe?.id ? String(item.groupe.id) : '',
          cin: item.cin || '',
          phone: item.phone || '',
          birth_date: item.birth_date || '',
          status: item.status || 'active',
          address: item.address || '',
        },
      })),
    [collection.data]
  );

  const summary = useMemo(() => {
    const activeCount = rows.filter((row) => row.status === 'active').length;
    const inactiveCount = rows.filter((row) => row.status === 'inactive').length;

    return {
      activeCount,
      inactiveCount,
    };
  }, [rows]);

  const groupOptions = groupsByFiliere.map((groupe) => ({
    value: String(groupe.id),
    label: `${groupe.nom} - ${(groupe.filiere || groupe.filier)?.nom || 'Sans filiere'}`,
  }));

  const formFields = [
    { name: 'name', label: 'Nom complet', required: true, placeholder: 'Nom du stagiaire' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'email@ista.ma' },
    {
      name: 'password',
      label: editingItem ? 'Nouveau mot de passe' : 'Mot de passe',
      type: 'password',
      placeholder: editingItem ? 'Laisser vide pour conserver le mot de passe actuel' : 'Au moins 8 caracteres',
      description: editingItem ? 'Optionnel lors de la modification.' : 'Cree les identifiants du compte stagiaire.',
    },
    {
      name: 'cin',
      label: 'CIN',
      placeholder: 'Ex: AB123456',
      description: 'Utilise pour la recherche et l identification administrative.',
    },
    {
      name: 'phone',
      label: 'Telephone',
      placeholder: '+212 6 12 34 56 78',
    },
    {
      name: 'birth_date',
      label: 'Date de naissance',
      type: 'date',
    },
    {
      name: 'groupe_id',
      label: 'Groupe',
      type: 'select',
      required: true,
      options: groupOptions,
      description: catalogsLoading ? 'Chargement des groupes...' : 'Lie le stagiaire a son groupe principal.',
    },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      options: STATUS_OPTIONS,
      required: true,
    },
    {
      name: 'address',
      label: 'Adresse',
      type: 'textarea',
      placeholder: 'Adresse postale ou details complementaires',
      fullWidth: true,
    },
  ];

  const validateForm = (values) => {
    const nextErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = 'Le nom est requis.';
    }

    if (!values.email.trim()) {
      nextErrors.email = 'L email est requis.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Veuillez saisir un email valide.';
    }

    if (!editingItem && values.password.trim().length < 8) {
      nextErrors.password = 'Le mot de passe doit contenir au moins 8 caracteres.';
    }

    if (editingItem && values.password && values.password.trim().length > 0 && values.password.trim().length < 8) {
      nextErrors.password = 'Le mot de passe doit contenir au moins 8 caracteres.';
    }

    if (!values.groupe_id) {
      nextErrors.groupe_id = 'Le groupe est requis.';
    }

    if (!values.status) {
      nextErrors.status = 'Le statut est requis.';
    }

    return nextErrors;
  };

  const resetModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormErrors({});
  };

  const handleSubmit = async (values) => {
    const clientErrors = validateForm(values);
    if (Object.keys(clientErrors).length > 0) {
      setFormErrors(clientErrors);
      return;
    }

    try {
      setSubmitting(true);
      setFormErrors({});
      setError('');

      const payload = normalizePayload(values);

      if (!payload.password) {
        delete payload.password;
      }

      if (editingItem) {
        await adminApi.stagiaires.update(editingItem.id, payload);
      } else {
        await adminApi.stagiaires.create(payload);
      }

      resetModal();
      await loadStagiaires();
    } catch (submitError) {
      setFormErrors(extractValidationErrors(submitError));
      setError(formatError(submitError, 'Enregistrement impossible.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleteSubmitting(true);
      setError('');
      await adminApi.stagiaires.remove(deleteTarget.id);
      setDeleteTarget(null);

      if (collection.data.length === 1 && collection.current_page > 1) {
        setFilters((current) => ({ ...current, page: current.page - 1 }));
        return;
      }

      await loadStagiaires();
    } catch (deleteError) {
      setError(formatError(deleteError, 'Suppression impossible.'));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingItem(row);
    setFormErrors({});
    setModalOpen(true);
  };

  const visiblePages = useMemo(() => {
    const pages = [];
    const start = Math.max(1, collection.current_page - 1);
    const end = Math.min(collection.last_page, collection.current_page + 1);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [collection.current_page, collection.last_page]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              <GraduationCap className="h-3.5 w-3.5" />
              Stagiaires
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Gestion avancee des stagiaires</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Centralisez la recherche, les filtres, les profils et les operations CRUD dans une vue admin plus complete.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            Ajouter un stagiaire
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total stagiaires"
          value={collection.total}
          helper="Volume total cote backend"
          icon={Users}
          tone="indigo"
        />
        <SummaryCard
          title="Actifs sur la page"
          value={summary.activeCount}
          helper="Statut actif dans les resultats affiches"
          icon={UserPlus}
          tone="emerald"
        />
        <SummaryCard
          title="Inactifs sur la page"
          value={summary.inactiveCount}
          helper="Comptes a reactiver ou verifier"
          icon={Trash2}
          tone="amber"
        />
        <SummaryCard
          title="Affichage courant"
          value={`${collection.from || 0}-${collection.to || 0}`}
          helper={`${collection.total} resultat(s) au total`}
          icon={Filter}
          tone="sky"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.55fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Rechercher par nom, email, CIN, groupe ou filiere"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
            />
          </div>

          <select
            value={filters.filiere_id}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                filiere_id: event.target.value,
                groupe_id: '',
                page: 1,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
          >
            <option value="">Toutes les filieres</option>
            {catalogs.filieres.map((filiere) => (
              <option key={filiere.id} value={String(filiere.id)}>
                {filiere.nom}
              </option>
            ))}
          </select>

          <select
            value={filters.groupe_id}
            onChange={(event) => setFilters((current) => ({ ...current, groupe_id: event.target.value, page: 1 }))}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
          >
            <option value="">Tous les groupes</option>
            {groupOptions.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={filters.sort_by}
              onChange={(event) => setFilters((current) => ({ ...current, sort_by: event.target.value, page: 1 }))}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
            >
              <option value="created_at">Plus recents</option>
              <option value="name">Nom</option>
              <option value="email">Email</option>
              <option value="cin">CIN</option>
              <option value="status">Statut</option>
            </select>

            <select
              value={filters.sort_dir}
              onChange={(event) => setFilters((current) => ({ ...current, sort_dir: event.target.value, page: 1 }))}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Liste des stagiaires</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {collection.total} stagiaire(s) trouves avec les filtres actuels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="per-page">
              Lignes
            </label>
            <select
              id="per-page"
              value={filters.per_page}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  per_page: Number(event.target.value),
                  page: 1,
                }))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {[10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <LoadingRows />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="rounded-full bg-slate-100 p-4 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Aucun stagiaire trouve</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Essayez d ajuster la recherche, les filtres ou ajoutez un nouveau stagiaire.
              </p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  {['Stagiaire', 'Contact', 'CIN', 'Affectation', 'Statut', 'Infos', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          {row.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Cree le {formatDate(row.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span>{row.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{row.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-200">{row.cin}</td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-slate-900 dark:text-white">{row.groupe}</p>
                        <p className="text-slate-500 dark:text-slate-400">{row.filiere}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          row.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {getStatusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <p>{row.notesCount} note(s)</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`/admin/stagiaires/${row.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                          Profil
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Affichage de {collection.from || 0} a {collection.to || 0} sur {collection.total}.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={collection.current_page <= 1 || loading}
              onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
            >
              Precedent
            </button>

            {visiblePages.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, page }))}
                className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium ${
                  page === collection.current_page
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={collection.current_page >= collection.last_page || loading}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
            >
              Suivant
            </button>
          </div>
        </div>
      </section>

      <CrudModal
        isOpen={modalOpen}
        title={editingItem ? `Modifier ${editingItem.name}` : 'Ajouter un stagiaire'}
        description={
          editingItem
            ? 'Mettez a jour les informations, le groupe et le statut sans casser le compte existant.'
            : 'Creez un nouveau compte stagiaire avec ses informations academiques et de contact.'
        }
        fields={formFields}
        initialValues={editingItem ? { ...INITIAL_FORM_VALUES, ...editingItem.formValues } : INITIAL_FORM_VALUES}
        errors={formErrors}
        onClose={() => {
          if (!submitting) {
            resetModal();
          }
        }}
        onSubmit={handleSubmit}
        submitLabel={editingItem ? 'Mettre a jour' : 'Creer le stagiaire'}
        submitting={submitting}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget ? `Supprimer ${deleteTarget.name}` : 'Supprimer le stagiaire'}
        message="Cette action supprimera le profil stagiaire et son compte utilisateur associe. Elle ne pourra pas etre annulee."
        confirmLabel="Oui, supprimer"
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleteSubmitting) {
            setDeleteTarget(null);
          }
        }}
        submitting={deleteSubmitting}
      />
    </div>
  );
}
