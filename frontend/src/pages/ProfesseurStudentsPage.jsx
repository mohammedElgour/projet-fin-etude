import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Send } from 'lucide-react';
import ManagementTable from '../components/admin/ManagementTable';
import { useProfesseurData } from '../hooks/useProfesseurData';
import { useToast } from '../context/ToastContext';
import { professeurApi } from '../services/api';

const NOTE_FIELDS = ['controle_1', 'controle_2', 'controle_3', 'efm'];
const NOTE_LIMITS = {
  controle_1: 20,
  controle_2: 20,
  controle_3: 20,
  efm: 40,
};

const isBlankValue = (value) => value === '' || value === null || value === undefined;

const parseNoteValue = (value) => {
  if (isBlankValue(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getFieldMax = (field) => NOTE_LIMITS[field] ?? 20;

const isFieldInvalid = (field, value) => {
  if (isBlankValue(value)) {
    return false;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) || parsed < 0 || parsed > getFieldMax(field);
};

const computeMoyenne = (note) => {
  const values = NOTE_FIELDS.map((field) => parseNoteValue(note[field]));
  const isIncomplete = values.some((value) => value === null);

  if (isIncomplete) {
    return null;
  }

  const controlsAverage = (values[0] + values[1] + values[2]) / 3;
  return (controlsAverage * 0.4) + ((values[3] / 2) * 0.6);
};

const getGradeStatus = (note) => {
  const moyenne = computeMoyenne(note);

  if (moyenne === null) {
    return { label: 'Incomplete', tone: 'incomplete', moyenne: null };
  }

  return moyenne >= 10
    ? { label: 'Valide', tone: 'validated', moyenne }
    : { label: 'Non valide', tone: 'rejected', moyenne };
};

const buildNoteKey = (stagiaireId, moduleId) => `${stagiaireId}-${moduleId || 'none'}`;

const buildNoteFromRow = (row, moduleId) => ({
  stagiaire_id: row.id,
  module_id: moduleId || '',
  note_id: row.noteId ?? null,
  controle_1: row.cc1 ?? '',
  controle_2: row.cc2 ?? '',
  controle_3: row.cc3 ?? '',
  efm: row.efm ?? '',
});

const getValidationErrors = (notes) => {
  const errors = {};

  notes.forEach((note) => {
    NOTE_FIELDS.forEach((field) => {
      if (isFieldInvalid(note[field])) {
        errors[`${note.stagiaire_id}-${field}`] = true;
      }
    });
  });

  return errors;
};

const STATUS_BANNER_STYLES = {
  draft: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200',
  pending: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
};

const ProfesseurStudentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const { success, error: notifyError } = useToast();
  const {
    catalog,
    rows,
    selectedGroup,
    setSelectedGroup,
    selectedModule,
    setSelectedModule,
    activeGroupId,
    activeSubmission,
    loading,
    error,
    setError,
    reload,
  } = useProfesseurData();

  useEffect(() => {
    setNotes((previousNotes) =>
      rows.map((row) => {
        const noteKey = buildNoteKey(row.id, selectedModule);
        return previousNotes.find((entry) => buildNoteKey(entry.stagiaire_id, entry.module_id) === noteKey)
          || buildNoteFromRow(row, selectedModule);
      })
    );
  }, [rows, selectedModule]);

  useEffect(() => {
    setValidationErrors({});
    setSaveMessage('');
  }, [selectedGroup, selectedModule]);

  const activeSubmissionStatus = activeSubmission?.status || 'draft';
  const isSubmissionLocked = activeSubmissionStatus === 'pending' || activeSubmissionStatus === 'approved';

  const handleNoteChange = (stagiaireId, field, value) => {
    const max = getFieldMax(field);
    const isBlank = isBlankValue(value);
    const parsedValue = Number(value);
    const isValidValue = isBlank || (!Number.isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= max);

    setSaveMessage('');

    if (isValidValue) {
      setNotes((previousNotes) =>
        previousNotes.map((entry) =>
          entry.stagiaire_id === stagiaireId
            ? {
                ...entry,
                [field]: value,
              }
            : entry
        )
      );
    }

    setValidationErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      const errorKey = `${stagiaireId}-${field}`;

      if (isFieldInvalid(field, value)) {
        nextErrors[errorKey] = true;
      } else {
        delete nextErrors[errorKey];
      }

      return nextErrors;
    });
  };

  const notesByStudentId = useMemo(
    () =>
      notes.reduce((accumulator, note) => {
        accumulator[buildNoteKey(note.stagiaire_id, note.module_id)] = note;
        return accumulator;
      }, {}),
    [notes]
  );

  const tableRows = useMemo(
    () =>
      rows.map((row) => {
        const note = notesByStudentId[buildNoteKey(row.id, selectedModule)] || buildNoteFromRow(row, selectedModule);
        const status = getGradeStatus(note);

        return {
          ...row,
          controle_1: note.controle_1,
          controle_2: note.controle_2,
          controle_3: note.controle_3,
          efm: note.efm,
          moyenne: status.moyenne,
          uiStatus: status,
        };
      }),
    [notesByStudentId, rows, selectedModule]
  );

  const inputClassName =
    'h-10 w-24 rounded-xl border bg-white px-3 py-2 text-center text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-500/20';

  const centeredHeaderClassName = 'text-center';
  const centeredCellClassName = 'text-center';

  const columns = useMemo(
    () => [
      { key: 'name', header: 'Stagiaire' },
      { key: 'groupe', header: 'Groupe', className: centeredCellClassName, headerClassName: centeredHeaderClassName },
      { key: 'filiere', header: 'Filiere', className: centeredCellClassName, headerClassName: centeredHeaderClassName },
      {
        key: 'controle_1',
        header: 'Controle 1',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => {
          const isInvalid = Boolean(validationErrors[`${row.id}-controle_1`]);

          return (
            <div className="flex justify-center">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="20"
                step="0.25"
                value={row.controle_1}
                onChange={(event) => handleNoteChange(row.id, 'controle_1', event.target.value)}
                disabled={!selectedModule || isSavingAll || isSubmittingAll || isSubmissionLocked}
                className={`${inputClassName} ${
                  isInvalid
                    ? 'border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/70 dark:bg-rose-500/10 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>
          );
        },
      },
      {
        key: 'controle_2',
        header: 'Controle 2',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => {
          const isInvalid = Boolean(validationErrors[`${row.id}-controle_2`]);

          return (
            <div className="flex justify-center">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="20"
                step="0.25"
                value={row.controle_2}
                onChange={(event) => handleNoteChange(row.id, 'controle_2', event.target.value)}
                disabled={!selectedModule || isSavingAll || isSubmittingAll || isSubmissionLocked}
                className={`${inputClassName} ${
                  isInvalid
                    ? 'border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/70 dark:bg-rose-500/10 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>
          );
        },
      },
      {
        key: 'controle_3',
        header: 'Controle 3',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => {
          const isInvalid = Boolean(validationErrors[`${row.id}-controle_3`]);

          return (
            <div className="flex justify-center">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="20"
                step="0.25"
                value={row.controle_3}
                onChange={(event) => handleNoteChange(row.id, 'controle_3', event.target.value)}
                disabled={!selectedModule || isSavingAll || isSubmittingAll || isSubmissionLocked}
                className={`${inputClassName} ${
                  isInvalid
                    ? 'border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/70 dark:bg-rose-500/10 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>
          );
        },
      },
      {
        key: 'efm',
        header: 'EFM',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => {
          const isInvalid = Boolean(validationErrors[`${row.id}-efm`]);

          return (
            <div className="flex justify-center">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="40"
                step="0.25"
                value={row.efm}
                onChange={(event) => handleNoteChange(row.id, 'efm', event.target.value)}
                disabled={!selectedModule || isSavingAll || isSubmittingAll || isSubmissionLocked}
                className={`${inputClassName} ${
                  isInvalid
                    ? 'border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/70 dark:bg-rose-500/10 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>
          );
        },
      },
      {
        key: 'moyenne',
        header: 'Moyenne',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => {
          if (row.uiStatus.moyenne === null) {
            return <span className="text-xs font-medium text-slate-400 dark:text-slate-500">-</span>;
          }

          const textClassName =
            row.uiStatus.moyenne >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';

          return <span className={`font-semibold ${textClassName}`}>{row.uiStatus.moyenne.toFixed(2)}</span>;
        },
      },
      {
        key: 'statut',
        header: 'Statut',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => {
          const styles = {
            validated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
            rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
            incomplete: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
          };

          return (
            <div className="flex justify-center">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[row.uiStatus.tone]}`}>
                {row.uiStatus.label}
              </span>
            </div>
          );
        },
      },
    ],
    [isSavingAll, isSubmittingAll, isSubmissionLocked, selectedModule, validationErrors]
  );

  const invalidFieldCount = Object.keys(validationErrors).length;
  const hasRows = rows.length > 0;
  const hasIncompleteNotes = notes.some((note) => NOTE_FIELDS.some((field) => parseNoteValue(note[field]) === null));
  const canSaveDraft =
    Boolean(selectedModule) &&
    Boolean(activeGroupId) &&
    hasRows &&
    invalidFieldCount === 0 &&
    !loading &&
    !isSavingAll &&
    !isSubmittingAll &&
    !isSubmissionLocked;
  const canSubmit = canSaveDraft && !hasIncompleteNotes;

  const submissionBanner = useMemo(() => {
    if (!activeSubmission) {
      return null;
    }

    if (activeSubmissionStatus === 'pending') {
      return {
        status: 'pending',
        title: 'Soumission en attente',
        description: 'Les notes de ce groupe ont deja ete soumises. Elles restent verrouillees jusqu a la decision de l admin.',
      };
    }

    if (activeSubmissionStatus === 'approved') {
      return {
        status: 'approved',
        title: 'Soumission approuvee',
        description: 'Les notes de ce groupe et de ce module ont ete validees. Elles ne sont plus modifiables.',
      };
    }

    if (activeSubmissionStatus === 'rejected') {
      return {
        status: 'rejected',
        title: 'Soumission rejetee',
        description: activeSubmission.admin_comment
          ? `Commentaire admin: ${activeSubmission.admin_comment}`
          : 'Corrigez les notes puis soumettez de nouveau le groupe complet.',
      };
    }

    return {
      status: 'draft',
      title: 'Brouillon en cours',
      description: 'Le groupe possede deja un brouillon pour ce module. Vous pouvez continuer la saisie avant de soumettre.',
    };
  }, [activeSubmission, activeSubmissionStatus]);

  const buildPayload = () => ({
    groupe_id: Number(activeGroupId),
    module_id: Number(selectedModule),
    notes: notes.map((note) => ({
      stagiaire_id: note.stagiaire_id,
      controle_1: parseNoteValue(note.controle_1),
      controle_2: parseNoteValue(note.controle_2),
      controle_3: parseNoteValue(note.controle_3),
      efm: parseNoteValue(note.efm),
    })),
  });

  const ensureEditableSubmission = () => {
    if (!selectedModule) {
      const message = 'Selectionnez un module avant de continuer.';
      setError(message);
      notifyError('Action impossible', message);
      return false;
    }

    if (!activeGroupId) {
      const message = 'Selectionnez un groupe avant de continuer.';
      setError(message);
      notifyError('Action impossible', message);
      return false;
    }

    if (isSubmissionLocked) {
      const message = activeSubmissionStatus === 'approved'
        ? 'Cette soumission a deja ete approuvee. Les notes ne peuvent plus etre modifiees.'
        : 'Cette soumission est deja en attente de validation par l admin.';
      setError(message);
      notifyError('Action impossible', message);
      return false;
    }

    return true;
  };

  const handleSaveAll = async () => {
    if (!ensureEditableSubmission()) {
      return;
    }

    const nextValidationErrors = getValidationErrors(notes);
    setValidationErrors(nextValidationErrors);

    if (Object.keys(nextValidationErrors).length > 0) {
      const message = 'Corrigez les notes invalides. Les controles doivent etre entre 0 et 20 et l EFM entre 0 et 40.';
      setError(message);
      notifyError('Notes invalides', message);
      return;
    }

    setIsSavingAll(true);
    setSaveMessage('');
    setError('');

    try {
      await professeurApi.saveNotesBatch(buildPayload());
      setSaveMessage('Le brouillon du groupe a ete enregistre avec succes.');
      success('Brouillon enregistre', 'Toutes les notes du groupe ont ete sauvegardees en brouillon.');
      await reload();
    } catch (saveError) {
      const apiMessage = saveError?.response?.data?.message || 'Impossible d enregistrer le brouillon.';
      setError(apiMessage);
      notifyError('Echec de la sauvegarde', apiMessage);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSubmitAll = async () => {
    if (!ensureEditableSubmission()) {
      return;
    }

    const nextValidationErrors = getValidationErrors(notes);
    setValidationErrors(nextValidationErrors);

    if (Object.keys(nextValidationErrors).length > 0) {
      const message = 'Corrigez les notes invalides avant la soumission. Les controles doivent etre entre 0 et 20 et l EFM entre 0 et 40.';
      setError(message);
      notifyError('Notes invalides', message);
      return;
    }

    if (hasIncompleteNotes) {
      const message = 'Renseignez les 4 notes pour chaque stagiaire avant de soumettre le groupe.';
      setError(message);
      notifyError('Soumission impossible', message);
      return;
    }

    setIsSubmittingAll(true);
    setSaveMessage('');
    setError('');

    try {
      await professeurApi.submitNotesBatch(buildPayload());
      setSaveMessage('La soumission du groupe a ete envoyee a l admin pour validation.');
      success('Soumission envoyee', 'Toutes les notes du groupe ont ete soumises en une seule action.');
      await reload();
    } catch (submitError) {
      const apiMessage = submitError?.response?.data?.message || 'Impossible de soumettre les notes.';
      setError(apiMessage);
      notifyError('Soumission impossible', apiMessage);
    } finally {
      setIsSubmittingAll(false);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}
      {saveMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {saveMessage}
        </div>
      ) : null}
      {submissionBanner ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${STATUS_BANNER_STYLES[submissionBanner.status]}`}>
          <p className="font-semibold">{submissionBanner.title}</p>
          <p className="mt-1">{submissionBanner.description}</p>
        </div>
      ) : null}

      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Groupe</label>
            <select
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Tous les groupes</option>
              {catalog.groupes.map((groupe) => (
                <option key={groupe.id} value={groupe.id}>
                  {groupe.nom} - {groupe.filiere?.nom || groupe.filier?.nom || 'Filiere'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Module</label>
            <select
              value={selectedModule}
              onChange={(event) => setSelectedModule(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Tous les modules</option>
              {catalog.modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.nom} - {module.filiere?.nom || module.filier?.nom || 'Filiere'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
          <span>{hasRows ? `${rows.length} stagiaires charges` : 'Aucun stagiaire charge'}</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 sm:inline-block" />
          <span>{invalidFieldCount > 0 ? `${invalidFieldCount} champs invalides` : 'Toutes les notes sont valides'}</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 sm:inline-block" />
          <span>{hasIncompleteNotes ? 'Completez toutes les notes avant la soumission' : 'Le groupe est pret a etre soumis'}</span>
        </div>

        <ManagementTable
          data={tableRows}
          columns={columns}
          hideActions
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage="Aucun stagiaire pour ces filtres"
        />
      </section>

      <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex justify-end">
        <div className="pointer-events-auto rounded-3xl border border-white/70 bg-white/90 p-3 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={!canSaveDraft}
              className={`inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                canSaveDraft
                  ? 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
              }`}
            >
              {isSavingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSavingAll ? 'Enregistrement...' : 'Enregistrer le brouillon'}
            </button>

            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={!canSubmit}
              className={`inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                canSubmit ? 'bg-sky-600 hover:bg-sky-500' : 'cursor-not-allowed bg-slate-400 opacity-70'
              }`}
            >
              {isSubmittingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmittingAll ? 'Soumission...' : 'Soumettre les notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfesseurStudentsPage;
