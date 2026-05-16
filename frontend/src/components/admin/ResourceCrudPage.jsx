import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import ManagementTable from './ManagementTable';
import CrudModal from './CrudModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import AdminMetricCard from './AdminMetricCard';
import { useToast } from '../../context/ToastContext';

const ResourceCrudPage = ({
  title,
  entityLabel = 'Element',
  description,
  items = [],
  loading = false,
  error = '',
  reload,
  columns,
  emptyMessage,
  addLabel,
  createTitle,
  editTitle,
  detailTitle,
  deleteTitle,
  deleteDescription,
  detailsFields = () => [],
  formFields = () => [],
  toRow,
  createItem,
  updateItem,
  deleteItem,
  buildInitialValues,
  buildCreatePayload,
  buildUpdatePayload,
  getItemName,
  validateForm,
  dependencies = {},
  initialFilters = {},
  filterFn,
  renderFilters,
  summaryCards = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);
  const toast = useToast();

  const rows = useMemo(
    () =>
      items.map((item) => {
        const row = toRow(item, dependencies);
        return {
          ...row,
          _raw: item,
        };
      }),
    [dependencies, items, toRow]
  );

  useEffect(() => {
    if (modalMode === 'view' || modalMode === 'edit') {
      const latest = rows.find((row) => row.id === activeItem?.id);
      if (latest) {
        setActiveItem(latest);
      }
    }
  }, [activeItem?.id, modalMode, rows]);

  const openCreate = () => {
    setActiveItem(null);
    setModalMode('create');
  };

  const openEdit = (row) => {
    setActiveItem(row);
    setModalMode('edit');
  };

  const openView = (row) => {
    setActiveItem(row);
    setModalMode('view');
  };

  const openDelete = (row) => {
    setActiveItem(row);
    setIsDeleteOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }
    setModalMode(null);
    setActiveItem(null);
  };

  const currentInitialValues = useMemo(
    () => buildInitialValues(activeItem?._raw || activeItem || null, dependencies),
    [activeItem, buildInitialValues, dependencies]
  );

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters || {}).some((value) => value !== '' && value !== null && value !== undefined),
    [appliedFilters]
  );

  const rowFilter = useMemo(
    () => (filterFn ? (row) => filterFn(row, row._raw || null, appliedFilters, dependencies) : undefined),
    [appliedFilters, dependencies, filterFn]
  );

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    setActiveActionId(activeItem?._raw?.id || 'create');

    try {
      if (modalMode === 'create') {
        await createItem(buildCreatePayload(values, dependencies));
        toast.success(`${entityLabel} ajoute`, 'La nouvelle entree a ete enregistree avec succes.');
      } else if (activeItem?._raw) {
        await updateItem(activeItem._raw.id, buildUpdatePayload(values, activeItem._raw, dependencies));
        toast.success(`${entityLabel} mis a jour`, 'Les modifications ont ete enregistrees.');
      }

      setModalMode(null);
      setActiveItem(null);
      await reload?.();
    } catch (submitError) {
      const description =
        submitError?.response?.data?.message ||
        Object.values(submitError?.response?.data?.errors || {}).flat().join(' ') ||
        "Une erreur s'est produite pendant l'enregistrement.";

      toast.error('Enregistrement impossible', description);
    } finally {
      setSaving(false);
      setActiveActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!activeItem?._raw) {
      return;
    }

    setDeleting(true);
    setActiveActionId(activeItem._raw.id);

    try {
      await deleteItem(activeItem._raw.id);
      setIsDeleteOpen(false);
      setActiveItem(null);
      toast.success(`${entityLabel} supprime`, "L'element a ete retire avec succes.");
      await reload?.();
    } catch (deleteError) {
      toast.error(
        'Suppression impossible',
        deleteError?.response?.data?.message || "La suppression n'a pas pu etre terminee."
      );
    } finally {
      setDeleting(false);
      setActiveActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {summaryCards.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <AdminMetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              trend={card.trend}
              tone={card.tone}
              progress={card.progress}
            />
          ))}
        </div>
      ) : null}

      <section className="surface-panel rounded-[30px] p-5 md:p-6">
        <div className="mb-6">
          <div className="inline-flex rounded-full bg-slate-100/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600 shadow-inner dark:bg-white/5 dark:text-sky-300">
            Workspace
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>

        <ManagementTable
          data={rows}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          error={error}
          emptyMessage={emptyMessage}
          onAdd={openCreate}
          addLabel={addLabel}
          onView={openView}
          onEdit={openEdit}
          onDelete={openDelete}
          actionStates={{
            edit: saving && modalMode === 'edit',
            delete: deleting,
            activeId: activeActionId,
          }}
          actionIcons={{
            view: Eye,
            edit: Pencil,
            delete: Trash2,
            add: Plus,
          }}
          rowFilter={rowFilter}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((current) => !current)}
          hasActiveFilters={hasActiveFilters}
          filterPanel={
            renderFilters
              ? renderFilters({
                  dependencies,
                  items,
                  rows,
                  appliedFilters,
                  draftFilters,
                  setDraftFilters,
                  applyFilters,
                  resetFilters,
                  closeFilters: () => setFiltersOpen(false),
                })
              : null
          }
        />
      </section>

      <CrudModal
        isOpen={Boolean(modalMode)}
        mode={modalMode}
        title={
          modalMode === 'create'
            ? createTitle
            : modalMode === 'edit'
              ? editTitle
              : detailTitle
        }
        fields={formFields(dependencies, modalMode, activeItem?._raw || null)}
        detailFields={detailsFields(dependencies, activeItem?._raw || null)}
        initialValues={currentInitialValues}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
        submitLabel={modalMode === 'edit' ? 'Enregistrer' : addLabel}
        validate={(values, mode) => validateForm?.(values, mode, dependencies, activeItem?._raw || null)}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        title={deleteTitle}
        description={deleteDescription?.(activeItem?._raw || null)}
        itemName={getItemName(activeItem?._raw || null)}
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setIsDeleteOpen(false);
          }
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ResourceCrudPage;
