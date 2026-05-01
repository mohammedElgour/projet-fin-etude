import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CrudModal from './CrudModal';
import ManagementTable from './ManagementTable';

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

export default function AdminManagementPage({
  title,
  description,
  emptyMessage,
  addLabel,
  columns,
  fields,
  api,
  mapRows,
  createPayload = (values) => values,
  updatePayload = (values) => values,
  initialValues = {},
  loadOptions,
}) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [fieldOptions, setFieldOptions] = useState({});

  const hydrateFields = useMemo(
    () =>
      fields.map((field) => ({
        ...field,
        options: field.optionsKey ? fieldOptions[field.optionsKey] || [] : field.options,
        required:
          field.requiredOnCreate && !editingItem
            ? true
            : field.requiredOnEdit && editingItem
              ? true
              : field.required ?? false,
      })),
    [editingItem, fieldOptions, fields]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [listPayload, optionsPayload] = await Promise.all([
        api.list(),
        loadOptions ? loadOptions() : Promise.resolve({}),
      ]);

      setItems(Array.isArray(listPayload?.data) ? listPayload.data : listPayload?.data?.data || []);
      setFieldOptions(optionsPayload || {});
    } catch (loadError) {
      setError(formatError(loadError, `Impossible de charger ${title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }, [api, loadOptions, title]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(() => mapRows(items), [items, mapRows]);

  const openCreateModal = async () => {
    if (loadOptions) {
      try {
        const optionsPayload = await loadOptions();
        setFieldOptions(optionsPayload || {});
      } catch (loadError) {
        setError(formatError(loadError, 'Impossible de charger les options du formulaire.'));
      }
    }

    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = async (row) => {
    if (loadOptions) {
      try {
        const optionsPayload = await loadOptions();
        setFieldOptions(optionsPayload || {});
      } catch (loadError) {
        setError(formatError(loadError, 'Impossible de charger les options du formulaire.'));
      }
    }

    setEditingItem(row);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(`Supprimer ${row.displayName || row.name || 'cet element'} ?`);
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      await api.remove(row.id);
      await loadData();
    } catch (deleteError) {
      setError(formatError(deleteError, 'Suppression impossible.'));
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      setError('');

      if (editingItem) {
        await api.update(editingItem.id, updatePayload(values, editingItem));
      } else {
        await api.create(createPayload(values));
      }

      setModalOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (submitError) {
      setError(formatError(submitError, 'Enregistrement impossible.'));
    } finally {
      setSubmitting(false);
    }
  };

  const modalInitialValues = editingItem
    ? { ...initialValues, ...editingItem.formValues }
    : initialValues;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <ManagementTable
          data={rows}
          columns={columns}
          onEdit={openEditModal}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage={emptyMessage}
          addLabel={addLabel}
          onAdd={openCreateModal}
        />
      </section>

      <CrudModal
        isOpen={modalOpen}
        title={editingItem ? `Modifier ${editingItem.displayName || editingItem.name || ''}` : addLabel}
        fields={hydrateFields}
        initialValues={modalInitialValues}
        onClose={() => {
          if (submitting) {
            return;
          }
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
        submitLabel={editingItem ? 'Mettre a jour' : 'Creer'}
        submitting={submitting}
      />
    </div>
  );
}
