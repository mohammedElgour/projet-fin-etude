import React, { useEffect, useMemo, useState } from 'react';
import ActionButton from '../components/admin/ActionButton';
import ManagementTable from '../components/admin/ManagementTable';
import TimetableGrid from '../components/timetable/TimetableGrid';
import { useToast } from '../context/ToastContext';
import { useAdminResourceList } from '../hooks/useAdminData';
import { useAdminLookups } from '../hooks/useAdminLookups';
import { adminApi } from '../services/api';

const createInitialForm = () => ({
  title: '',
  audienceType: 'groupe',
  groupeId: '',
  professeurIds: [],
  image: null,
});

const buildAudienceLabel = (timetable) => {
  if (timetable.audience_type === 'professeurs') {
    const names = Array.isArray(timetable.professeurs)
      ? timetable.professeurs.map((professeur) => professeur.user?.name).filter(Boolean)
      : [];

    return names.length ? names.join(', ') : 'Professeurs';
  }

  const groupName = timetable.groupe?.nom || 'Groupe';
  const filiereName = timetable.groupe?.filiere?.nom || timetable.groupe?.filier?.nom || '';

  return filiereName ? `${groupName} - ${filiereName}` : groupName;
};

const AdminTimetablePage = () => {
  const toast = useToast();
  const lookups = useAdminLookups(['groups', 'professors']);
  const { items, loading, error, reload } = useAdminResourceList(
    () => adminApi.timetables(),
    "Impossible de charger les emplois du temps partages."
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [formValues, setFormValues] = useState(createInitialForm);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const professorOptions = useMemo(
    () =>
      (lookups.professors || []).map((professor) => ({
        id: String(professor.id),
        label:
          `${professor.user?.first_name || ''} ${professor.user?.last_name || ''}`.trim() ||
          professor.user?.name ||
          'Professeur',
        meta: professor.specialite || '',
      })),
    [lookups.professors]
  );

  const timetableRows = useMemo(
    () =>
      items.map((timetable) => ({
        id: timetable.id,
        title: timetable.title || 'Emploi du temps',
        audience: buildAudienceLabel(timetable),
        createdBy: timetable.creator?.name || '-',
        createdAt: timetable.created_at
          ? new Date(timetable.created_at).toLocaleDateString('fr-FR')
          : '-',
        imageUrl: timetable.image_url,
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
        groupe: timetable.groupe?.nom || '-',
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

  const handleAudienceChange = (audienceType) => {
    setFormValues((current) => ({
      ...current,
      audienceType,
      groupeId: audienceType === 'groupe' ? current.groupeId : '',
      professeurIds: audienceType === 'professeurs' ? current.professeurIds : [],
    }));
  };

  const handleProfessorSelection = (event) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);

    setFormValues((current) => ({
      ...current,
      professeurIds: values,
    }));
  };

  const resetForm = () => {
    setFormValues(createInitialForm());
    setPreviewUrl('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValues.image) {
      toast.error('Image requise', "Ajoutez une image avant d'envoyer l'emploi du temps.");
      return;
    }

    if (formValues.audienceType === 'groupe' && !formValues.groupeId) {
      toast.error('Groupe requis', 'Selectionnez un groupe destinataire.');
      return;
    }

    if (formValues.audienceType === 'professeurs' && !formValues.professeurIds.length) {
      toast.error('Professeurs requis', 'Selectionnez au moins un professeur.');
      return;
    }

    const payload = new FormData();
    payload.append('title', formValues.title);
    payload.append('image', formValues.image);

    if (formValues.audienceType === 'groupe') {
      payload.append('groupe_id', formValues.groupeId);
    } else {
      formValues.professeurIds.forEach((id, index) => {
        payload.append(`professeur_ids[${index}]`, id);
      });
    }

    setSubmitting(true);

    try {
      await adminApi.createTimetable(payload);
      toast.success('Emploi du temps partage', 'Le document est maintenant disponible pour les destinataires.');
      resetForm();
      await reload();
    } catch (submitError) {
      const description =
        submitError?.response?.data?.message ||
        Object.values(submitError?.response?.data?.errors || {}).flat().join(' ') ||
        "L'envoi de l'emploi du temps a echoue.";

      toast.error('Partage impossible', description);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 md:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Partager un emploi du temps</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Envoyez une image a un groupe complet ou a un ou plusieurs professeurs sans sortir des conventions du dashboard.
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
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleAudienceChange('groupe')}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    formValues.audienceType === 'groupe'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                  }`}
                >
                  Un groupe
                </button>
                <button
                  type="button"
                  onClick={() => handleAudienceChange('professeurs')}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    formValues.audienceType === 'professeurs'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                  }`}
                >
                  Un ou plusieurs professeurs
                </button>
              </div>
            </div>

            {formValues.audienceType === 'groupe' ? (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Groupe</label>
                <select
                  value={formValues.groupeId}
                  onChange={(event) => setFormValues((current) => ({ ...current, groupeId: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                >
                  <option value="">Selectionner un groupe</option>
                  {(lookups.groups || []).map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nom} - {group.filiere?.nom || group.filier?.nom || 'Filiere'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Professeurs</label>
                <select
                  multiple
                  value={formValues.professeurIds}
                  onChange={handleProfessorSelection}
                  className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                >
                  {professorOptions.map((professor) => (
                    <option key={professor.id} value={professor.id}>
                      {professor.label}{professor.meta ? ` - ${professor.meta}` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Maintenez `Ctrl` ou `Cmd` pour selectionner plusieurs professeurs.
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    image: event.target.files?.[0] || null,
                  }))
                }
                className="block w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-medium file:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:file:bg-slate-900 dark:file:text-slate-200"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="neutral" onClick={resetForm} disabled={submitting}>
                Reinitialiser
              </ActionButton>
              <ActionButton type="submit" variant="primary" loading={submitting} disabled={submitting}>
                Partager l&apos;emploi du temps
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
                <a
                  href={row.imageUrl}
                  download
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  Telecharger
                </a>
              ),
            },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          error={error}
          emptyMessage="Aucun emploi du temps partage"
          hideActions
        />
      </section>

      <TimetableGrid
        items={timetableCards}
        showAudience
        emptyTitle="Aucun partage recent"
        emptyDescription="Les emplois du temps envoyes apparaitront ici avec un apercu visuel."
      />
    </div>
  );
};

export default AdminTimetablePage;
