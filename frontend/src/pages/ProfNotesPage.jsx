import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CrudModal from '../components/admin/CrudModal';
import ManagementTable from '../components/admin/ManagementTable';
import { professeurApi, unwrapList } from '../services/api';

const statusLabels = {
  pending: 'En attente',
  validated: 'Validee',
  rejected: 'Rejetee',
};

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  validated: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ProfNotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [catalog, setCatalog] = useState({ groupes: [], modules: [] });
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupe, setSelectedGroupe] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [notesRes, catRes, studentsRes] = await Promise.all([
        professeurApi.notes({
          groupe_id: selectedGroupe || undefined,
          module_id: selectedModule || undefined,
        }),
        professeurApi.catalog(),
        professeurApi.stagiaires({
          groupe_id: selectedGroupe || undefined,
          module_id: selectedModule || undefined,
          per_page: 100,
        }),
      ]);

      setNotes(unwrapList(notesRes));
      setCatalog(catRes || { groupes: [], modules: [] });
      setAvailableStudents(unwrapList(studentsRes));
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des notes.');
    } finally {
      setLoading(false);
    }
  }, [selectedGroupe, selectedModule]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(
    () =>
      notes.map((note) => ({
        id: note.id,
        noteId: note.id,
        stagiaireId: note.stagiaire?.id,
        stagiaire: note.stagiaire?.user?.name || 'Stagiaire',
        groupe: note.stagiaire?.groupe?.nom || '-',
        module: note.module?.nom || '-',
        teacher: note.professeur?.user?.name || '-',
        noteValue: note.note,
        status: note.validation_status || 'pending',
        updatedAt: note.updated_at,
      })),
    [notes]
  );

  const studentOptions = useMemo(
    () =>
      availableStudents.map((student) => ({
        value: String(student.id),
        label: `${student.user?.name || 'Stagiaire'}${student.groupe?.nom ? ` - ${student.groupe.nom}` : ''}`,
      })),
    [availableStudents]
  );

  const columns = [
    { key: 'stagiaire', header: 'Stagiaire' },
    { key: 'groupe', header: 'Groupe' },
    { key: 'module', header: 'Module' },
    {
      key: 'noteValue',
      header: 'Note /20',
      render: (row) => <span className="font-semibold">{row.noteValue}/20</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            statusStyles[row.status] || 'bg-slate-100 text-slate-700'
          }`}
        >
          {statusLabels[row.status] || row.status}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Derniere mise a jour',
      render: (row) => formatDateTime(row.updatedAt),
    },
  ];

  const openCreateModal = () => {
    setSuccess('');
    if (!selectedModule) {
      setError('Selectionnez un module avant d ajouter une note.');
      return;
    }

    setActiveNote(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setSuccess('');
    setError('');

    if (row.status === 'validated') {
      setError('Une note deja validee ne peut pas etre modifiee.');
      return;
    }

    setActiveNote(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveNote(null);
  };

  const handleSubmitNote = async (values) => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (activeNote?.noteId) {
        await professeurApi.updateNote(activeNote.noteId, {
          note: Number(values.note),
        });
      } else {
        await professeurApi.saveNote({
          stagiaire_id: Number(values.stagiaire_id),
          module_id: Number(selectedModule),
          note: Number(values.note),
        });
      }

      closeModal();
      setSuccess(activeNote ? 'La note a ete mise a jour.' : 'La note a ete enregistree.');
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors de la sauvegarde de la note.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion des notes</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Saisissez des notes pour vos groupes assignes et modifiez-les tant qu elles ne sont pas validees.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Groupe</label>
          <select
            value={selectedGroupe}
            onChange={(event) => setSelectedGroupe(event.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white"
          >
            <option value="">Tous les groupes</option>
            {(catalog.groupes || []).map((groupe) => (
              <option key={groupe.id} value={groupe.id}>
                {groupe.nom} {groupe.filier?.nom ? `(${groupe.filier.nom})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Module</label>
          <select
            value={selectedModule}
            onChange={(event) => setSelectedModule(event.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white"
          >
            <option value="">Tous les modules</option>
            {(catalog.modules || []).map((module) => (
              <option key={module.id} value={module.id}>
                {module.nom} {module.filier?.nom ? `(${module.filier.nom})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      ) : null}

      <ManagementTable
        data={rows}
        columns={columns}
        onEdit={openEditModal}
        onAdd={openCreateModal}
        addLabel="Ajouter une note"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        loading={loading}
        emptyMessage={
          selectedModule
            ? 'Aucune note pour les filtres selectionnes.'
            : 'Selectionnez un module pour commencer la saisie.'
        }
      />

      <CrudModal
        isOpen={modalOpen}
        title={activeNote ? `Modifier la note de ${activeNote.stagiaire}` : 'Ajouter une note'}
        description={
          activeNote
            ? 'La note restera en attente jusqu a validation par le directeur.'
            : 'Choisissez un stagiaire autorise pour le module selectionne.'
        }
        fields={[
          ...(activeNote
            ? []
            : [
                {
                  name: 'stagiaire_id',
                  label: 'Stagiaire',
                  type: 'select',
                  options: studentOptions,
                  required: true,
                  fullWidth: true,
                },
              ]),
          {
            name: 'note',
            label: 'Note sur 20',
            type: 'number',
            min: 0,
            max: 20,
            step: 0.25,
            required: true,
            fullWidth: !activeNote,
          },
        ]}
        initialValues={{
          stagiaire_id: activeNote?.stagiaireId ? String(activeNote.stagiaireId) : '',
          note: activeNote?.noteValue ?? '',
        }}
        onClose={closeModal}
        onSubmit={handleSubmitNote}
        submitLabel={activeNote ? 'Mettre a jour' : 'Enregistrer'}
        submitting={submitting}
      />
    </div>
  );
};

export default ProfNotesPage;
