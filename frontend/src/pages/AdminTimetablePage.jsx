import React, { useEffect, useMemo, useState } from 'react';
import ActionButton from '../components/admin/ActionButton';
import DeleteConfirmModal from '../components/admin/DeleteConfirmModal';
import ManagementTable from '../components/admin/ManagementTable';
import TimetableGrid from '../components/timetable/TimetableGrid';
import { useToast } from '../context/ToastContext';
import { useAdminResourceList } from '../hooks/useAdminData';
import { useAdminLookups } from '../hooks/useAdminLookups';
import { adminApi } from '../services/api';

const createInitialForm = () => ({
  title: '',
  groupIds: [],
  image: null,
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const buildAudienceLabel = (timetable) => {
  if (timetable.audience_type === 'professeurs') {
    const names = Array.isArray(timetable.professeurs)
      ? timetable.professeurs.map((professeur) => professeur.user?.name).filter(Boolean)
      : [];

    return names.length ? names.join(', ') : 'Professeur';
  }

  const groups = Array.isArray(timetable.groupes) && timetable.groupes.length
    ? timetable.groupes
    : timetable.groupe
      ? [timetable.groupe]
      : [];

  if (groups.length > 1) {
    return groups.map((group) => group.nom).join(', ');
  }

  const groupName = groups[0]?.nom || 'Groupe';
  const filiereName = groups[0]?.filiere?.nom || groups[0]?.filier?.nom || '';

  return filiereName ? `${groupName} - ${filiereName}` : groupName;
};

const AdminTimetablePage = () => {
  const toast = useToast();
  const lookups = useAdminLookups(['groups']);
  const { items, loading, error, reload } = useAdminResourceList(
    () => adminApi.timetables(),
    "Impossible de charger les emplois du temps partages."
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [formValues, setFormValues] = useState(createInitialForm);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!formValues.image) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(formValues.image);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [formValues.image]);

  const timetableRows = useMemo(
    () =>
      items.map((timetable) => ({
        id: timetable.id,
        title: timetable.title || 'Emploi du temps',
        audience: buildAudienceLabel(timetable),
        createdBy: timetable.uploader?.name || timetable.creator?.name || '-',
        createdAt: timetable.created_at
          ? new Date(timetable.created_at).toLocaleDateString('fr-FR')
          : '-',
        imageUrl: timetable.image_url,
        groups: Array.isArray(timetable.groupes) && timetable.groupes.length
          ? timetable.groupes
          : timetable.groupe
            ? [timetable.groupe]
            : [],
        _raw: timetable,
      })),
    [items]
  );

  const timetableCards = useMemo(
    () =>
      items.map((timetable) => ({
        id: timetable.id,
        title: timetable.title || 'Emploi du temps',
        imageUrl: timetable.image_url,
        groupe: buildAudienceLabel(timetable),
        filiere: timetable.groupe?.filiere?.nom || timetable.groupe?.filier?.nom || '-',
        audienceType: timetable.audience_type,
        professeurs: Array.isArray(timetable.professeurs)
          ? timetable.professeurs
              .map((professeur) => professeur.user?.name)
              .filter(Boolean)
              .join(', ')
          : '',
        createdAt: timetable.created_at || '',
      })),
    [items]
  );

  const toggleGroup = (groupId) => {
    setFormValues((current) => ({
      ...current,
      groupIds: current.groupIds.includes(String(groupId))
        ? current.groupIds.filter((id) => id !== String(groupId))
        : [...current.groupIds, String(groupId)],
    }));
  };

  const resetForm = () => {
    setFormValues(createInitialForm());
    setPreviewUrl('');
    setEditingTimetable(null);
  };

  const handleImageChange = (file) => {
    if (!file) {
      setFormValues((current) => ({ ...current, image: null }));
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.warning('Unsupported image format.', 'Use a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.warning('Image too large.', 'The maximum allowed file size is 5 MB.');
      return;
    }

    setFormValues((current) => ({ ...current, image: file }));
  };

  const handleEdit = (row) => {
    const timetable = row._raw;
    setEditingTimetable(timetable);
    setFormValues({
      title: timetable.title || '',
      groupIds: (row.groups || []).map((group) => String(group.id)),
      image: null,
    });
    setPreviewUrl('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editingTimetable && !formValues.image) {
      toast.warning('Image required.', 'Add an image before sharing the timetable.');
      return;
    }

    if (!formValues.groupIds.length) {
      toast.warning('Group required.', 'Select at least one destination group.');
      return;
    }

    const payload = new FormData();
    payload.append('title', formValues.title);
    if (formValues.image) {
      payload.append('image', formValues.image);
    }

    formValues.groupIds.forEach((groupId) => payload.append('groupe_ids[]', groupId));

    setSubmitting(true);

    try {
      if (editingTimetable) {
        await adminApi.updateTimetable(editingTimetable.id, payload);
        toast.success('Timetable updated successfully.', 'Selected groups will see the new version.');
      } else {
        await adminApi.createTimetable(payload);
        toast.success('Timetable shared successfully.', 'The document is now available to the selected groups.');
      }
      resetForm();
      await reload();
    } catch (submitError) {
      const description =
        submitError?.response?.data?.message ||
        Object.values(submitError?.response?.data?.errors || {}).flat().join(' ') ||
        'Unable to connect to the server.';

      toast.error('Failed to share timetable.', description);
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (row) => {
    setDeleteTarget(row);
  };

  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }

    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await adminApi.deleteTimetable(deleteTarget.id);
      toast.success('Timetable deleted successfully.', 'The document is no longer visible to associated groups.');
      await reload();
      if (editingTimetable?.id === deleteTarget.id) {
        resetForm();
      }
    } catch (deleteError) {
      toast.error(
        'Failed to delete timetable.',
        deleteError?.response?.data?.message || 'Unable to connect to the server.'
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 md:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Partager un emploi du temps</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Envoyez une image a un ou plusieurs groupes. Les stagiaires verront automatiquement le planning de leur groupe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Titre</label>
              <input
                type="text"
                value={formValues.title}
                onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex: Planning semaine 3"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Destinataires</label>
              <div className="grid max-h-64 gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950 sm:grid-cols-2">
                {(lookups.groups || []).map((group) => {
                  const groupId = String(group.id);
                  const checked = formValues.groupIds.includes(groupId);

                  return (
                    <label
                      key={group.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                        checked
                          ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGroup(groupId)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold">{group.nom}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {group.filiere?.nom || group.filier?.nom || 'Filiere'}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {formValues.groupIds.length} groupe(s) selectionne(s)
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Image</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) => handleImageChange(event.target.files?.[0] || null)}
                className="block w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-medium file:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:file:bg-slate-900 dark:file:text-slate-200"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">JPG, JPEG, PNG ou WEBP. Taille maximale: 5 Mo.</p>
            </div>

            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="neutral" onClick={resetForm} disabled={submitting}>
                Reinitialiser
              </ActionButton>
              <ActionButton type="submit" variant="primary" loading={submitting} disabled={submitting}>
                {editingTimetable ? "Remplacer l'emploi du temps" : "Partager l'emploi du temps"}
              </ActionButton>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Apercu</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Verifiez l&apos;image avant l&apos;envoi.
            </p>

            <div className="mt-4 overflow-hidden rounded-[24px] border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
              {previewUrl ? (
                <img src={previewUrl} alt="Apercu de l'emploi du temps" className="h-full w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Ajoutez une image pour afficher l&apos;apercu ici.
                </div>
              )}
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 md:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Historique des partages</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Retrouvez les emplois du temps deja diffuses et telechargez-les au besoin.
          </p>
        </div>

        <ManagementTable
          data={timetableRows}
          columns={[
            { key: 'title', header: 'Titre' },
            { key: 'audience', header: 'Destinataires' },
            { key: 'createdBy', header: 'Cree par' },
            { key: 'createdAt', header: 'Date' },
            {
              key: 'download',
              header: 'Document',
              render: (row) => (
                row.imageUrl ? (
                  <a
                    href={row.imageUrl}
                    download
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    Telecharger
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 dark:text-slate-500">Image indisponible</span>
                )
              ),
            },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          error={error}
          emptyMessage="Aucun emploi du temps partage"
          onEdit={handleEdit}
          onDelete={requestDelete}
          actionStates={{ delete: deleting, activeId: deleteTarget?.id }}
        />
      </section>

      <TimetableGrid
        items={timetableCards}
        showAudience
        emptyTitle="Aucun partage recent"
        emptyDescription="Les emplois du temps envoyes apparaitront ici avec un apercu visuel."
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete timetable?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.title || 'this timetable'}" from the shared list.`
            : ''
        }
        itemName={deleteTarget?.title || 'this timetable'}
        loading={deleting}
        onCancel={closeDeleteModal}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminTimetablePage;
