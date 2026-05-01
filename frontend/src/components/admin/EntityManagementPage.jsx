import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Filter, Plus, Search, Trash2, UserPlus, Users } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import CrudModal from './CrudModal';

const STATUS_TONES = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
};

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

const SummaryCard = ({ title, value, helper, icon: Icon, tone = 'indigo' }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
      </div>
      <div className={`rounded-2xl p-3 ${STATUS_TONES[tone] || STATUS_TONES.indigo}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const LoadingRows = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
    ))}
  </div>
);

const defaultGetInitialFilters = () => ({
  search: '',
  page: 1,
  per_page: 10,
  sort_by: 'created_at',
  sort_dir: 'desc',
});

const getInitial = (initialValues) => ({ ...initialValues });

export default function EntityManagementPage({
  title,
  badge = 'Gestion',
  description,
  singularLabel,
  api,
  columns,
  mapItemToRow,
  initialValues,
  buildFields,
  createPayload = (values) => values,
  updatePayload = (values) => values,
  loadCatalogs,
  filterControls = [],
  sortOptions = [],
  detailPath,
  emptyTitle = 'Aucune donnee trouvee',
  emptyDescription = 'Essayez d ajuster la recherche, les filtres ou ajoutez un nouvel element.',
  createLabel,
  createDescription,
  editDescription,
  searchPlaceholder = 'Rechercher...',
  validate,
  summaryBuilder,
}) {
  const [catalogs, setCatalogs] = useState({});
  const [catalogsLoading, setCatalogsLoading] = useState(Boolean(loadCatalogs));
  const [filters, setFilters] = useState(defaultGetInitialFilters);
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
  const [submitting, setSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const loadLists = useCallback(async () => {
    if (!loadCatalogs) {
      return;
    }

    setCatalogsLoading(true);

    try {
      const payload = await loadCatalogs();
      setCatalogs(payload || {});
    } catch (loadError) {
      setError(formatError(loadError, 'Impossible de charger les listes associees.'));
    } finally {
      setCatalogsLoading(false);
    }
  }, [loadCatalogs]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.list(
        Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null))
      );

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
      setError(formatError(loadError, `Impossible de charger ${title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }, [api, filters, title]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => (current.search === searchInput ? current : { ...current, search: searchInput, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(() => collection.data.map((item) => mapItemToRow(item, catalogs)), [catalogs, collection.data, mapItemToRow]);

  const summaryCards = useMemo(() => {
    if (summaryBuilder) {
      return summaryBuilder({ rows, items: collection.data, collection, catalogs });
    }

    return [
      {
        title: `Total ${title.toLowerCase()}`,
        value: collection.total,
        helper: 'Volume total disponible',
        icon: Users,
        tone: 'indigo',
      },
      {
        title: 'Elements affiches',
        value: `${collection.from || 0}-${collection.to || 0}`,
        helper: `${collection.total} resultat(s)`,
        icon: Filter,
        tone: 'sky',
      },
      {
        title: 'Par page',
        value: filters.per_page,
        helper: 'Pagination active',
        icon: UserPlus,
        tone: 'emerald',
      },
      {
        title: 'Recherche',
        value: filters.search ? 'Oui' : 'Non',
        helper: filters.search || 'Sans filtre de texte',
        icon: Trash2,
        tone: 'amber',
      },
    ];
  }, [catalogs, collection, filters.per_page, filters.search, rows, summaryBuilder, title]);

  const formFields = useMemo(() => buildFields({ catalogs, catalogsLoading, editingItem }), [buildFields, catalogs, catalogsLoading, editingItem]);

  const resetModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormErrors({});
  };

  const handleSubmit = async (values) => {
    const validationErrors = validate ? validate(values, editingItem) : {};

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      setFormErrors({});
      setError('');

      if (editingItem) {
        await api.update(editingItem.id, updatePayload(values, editingItem, catalogs));
      } else {
        await api.create(createPayload(values, catalogs));
      }

      resetModal();
      await loadData();
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
      await api.remove(deleteTarget.id);
      setDeleteTarget(null);

      if (collection.data.length === 1 && collection.current_page > 1) {
        setFilters((current) => ({ ...current, page: current.page - 1 }));
        return;
      }

      await loadData();
    } catch (deleteError) {
      setError(formatError(deleteError, 'Suppression impossible.'));
    } finally {
      setDeleteSubmitting(false);
    }
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
              <Users className="h-3.5 w-3.5" />
              {badge}
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setFormErrors({});
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            {createLabel || `Ajouter ${singularLabel.toLowerCase()}`}
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.6fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
            />
          </div>

          {filterControls.map((control) => {
            const options = control.getOptions ? control.getOptions(catalogs) : control.options || [];

            return (
              <select
                key={control.name}
                value={filters[control.name] ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    [control.name]: event.target.value,
                    ...(control.onChangeReset
                      ? Object.fromEntries(control.onChangeReset.map((field) => [field, '']))
                      : {}),
                    page: 1,
                  }))
                }
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
              >
                <option value="">{control.allLabel || control.label}</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            );
          })}

          <div className="grid grid-cols-2 gap-3">
            <select
              value={filters.sort_by}
              onChange={(event) => setFilters((current) => ({ ...current, sort_by: event.target.value, page: 1 }))}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Liste</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {collection.total} resultat(s) avec la configuration actuelle.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor={`${singularLabel}-per-page`}>
              Lignes
            </label>
            <select
              id={`${singularLabel}-per-page`}
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
              <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{emptyTitle}</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{emptyDescription}</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  {columns.map((column) => (
                    <th
                      key={column.key || column.header}
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                    >
                      {column.header}
                    </th>
                  ))}
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    {columns.map((column) => (
                      <td key={column.key || column.header} className="px-5 py-4 text-sm text-slate-700 dark:text-slate-200">
                        {column.render ? column.render(row) : row[column.key] || '-'}
                      </td>
                    ))}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {detailPath ? (
                          <Link
                            to={detailPath(row)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                            Details
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(row);
                            setFormErrors({});
                            setModalOpen(true);
                          }}
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
        title={editingItem ? `Modifier ${editingItem.displayName || singularLabel}` : createLabel || `Ajouter ${singularLabel.toLowerCase()}`}
        description={editingItem ? editDescription : createDescription}
        fields={formFields}
        initialValues={editingItem ? { ...getInitial(initialValues), ...editingItem.formValues } : getInitial(initialValues)}
        errors={formErrors}
        onClose={() => {
          if (!submitting) {
            resetModal();
          }
        }}
        onSubmit={handleSubmit}
        submitLabel={editingItem ? 'Mettre a jour' : 'Creer'}
        submitting={submitting}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget ? `Supprimer ${deleteTarget.displayName || singularLabel}` : `Supprimer ${singularLabel.toLowerCase()}`}
        message={`Cette action supprimera ${deleteTarget?.displayName || singularLabel.toLowerCase()} et ne pourra pas etre annulee.`}
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
