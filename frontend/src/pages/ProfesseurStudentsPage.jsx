import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Send } from 'lucide-react';
import ManagementTable from '../components/admin/ManagementTable';
import { useProfesseurData } from '../hooks/useProfesseurData';
import { useToast } from '../context/ToastContext';
import { professeurApi } from '../services/api';

const NOTE_FIELDS = ['controle_1', 'controle_2', 'controle_3', 'efm'];
const EVALUATION_OPTIONS = [
  { value: 'controle_1', label: 'Controle 1' },
  { value: 'controle_2', label: 'Controle 2' },
  { value: 'controle_3', label: 'Controle 3' },
  { value: 'efm', label: 'EFM' },
];
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

const getValidationErrors = (notes, selectedField) => {
  const errors = {};

  notes.forEach((note) => {
    if (isFieldInvalid(selectedField, note[selectedField])) {
      errors[`${note.stagiaire_id}-${selectedField}`] = true;
    }
  });

  return errors;
};

const STATUS_BANNER_STYLES = {
  draft: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200',
  pending: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
};

const COMPONENT_STATUS_STYLES = {
  not_submitted: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  draft: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  submitted: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/20',
  approved: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20',
  rejected: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20',
};

const COMPONENT_STATUS_LABELS = {
  not_submitted: 'Not submitted',
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const ProfesseurStudentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvaluationType, setSelectedEvaluationType] = useState('controle_1');
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
    submissionsByEvaluationType,
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

  const activeSubmission = submissionsByEvaluationType?.[selectedEvaluationType] || null;
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
        const readStatus = (value, statusValue) => {
          const parsedStatus = String(statusValue || '').toLowerCase();
          const hasValue = value !== '' && value !== null && value !== undefined;

          if (!hasValue) {
            return 'not_submitted';
          }

          if (parsedStatus === 'validated' || parsedStatus === 'approved') {
            return 'approved';
          }

          if (parsedStatus === 'submitted' || parsedStatus === 'pending') {
            return 'submitted';
          }

          if (parsedStatus === 'rejected') {
            return 'rejected';
          }

          return 'draft';
        };

        return {
          ...row,
          controle_1: note.controle_1,
          controle_2: note.controle_2,
          controle_3: note.controle_3,
          efm: note.efm,
          moyenne: status.moyenne,
          uiStatus: status,
          controle1Status: readStatus(note.controle_1, row.controle1Status),
          controle2Status: readStatus(note.controle_2, row.controle2Status),
          controle3Status: readStatus(note.controle_3, row.controle3Status),
          efmStatus: readStatus(note.efm, row.efmStatus),
        };
      }),
    [notesByStudentId, rows, selectedModule]
  );

  const inputClassName =
    'h-10 w-24 rounded-xl border bg-white px-3 py-2 text-center text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-500/20';

  const centeredHeaderClassName = 'text-center';
  const centeredCellClassName = 'text-center';

  const renderComponentStatus = (statusKey) => {
    const label = COMPONENT_STATUS_LABELS[statusKey] || COMPONENT_STATUS_LABELS.not_submitted;

    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${COMPONENT_STATUS_STYLES[statusKey] || COMPONENT_STATUS_STYLES.not_submitted}`}>
        {label}
      </span>
    );
  };

  const renderEvaluationCell = (row, field, statusField) => {
    const isInvalid = Boolean(validationErrors[`${row.id}-${field}`]);
    const fieldLabel = field === 'controle_1' ? 'Controle 1' : field === 'controle_2' ? 'Controle 2' : field === 'controle_3' ? 'Controle 3' : 'EFM';
    const max = field === 'efm' ? 40 : 20;
    const inputValue = row[field];

    return (
      <div className="space-y-2">
        <div className="flex justify-center">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max={max}
            step="0.25"
            value={inputValue}
            onChange={(event) => handleNoteChange(row.id, field, event.target.value)}
            disabled={!selectedModule || isSavingAll || isSubmittingAll || isSubmissionLocked}
            className={`${inputClassName} ${
              isInvalid
                ? 'border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/70 dark:bg-rose-500/10 dark:text-rose-200'
                : 'border-slate-200 dark:border-slate-800'
            }`}
            aria-label={fieldLabel}
          />
        </div>
        <div className="flex justify-center">
          {renderComponentStatus(row[statusField])}
        </div>
      </div>
    );
  };

  const selectedStatusField = selectedEvaluationType === 'controle_1'
    ? 'controle1Status'
    : selectedEvaluationType === 'controle_2'
      ? 'controle2Status'
      : selectedEvaluationType === 'controle_3'
        ? 'controle3Status'
        : 'efmStatus';

  const selectedEvaluationLabel = selectedEvaluationType === 'controle_1'
    ? 'Controle 1'
    : selectedEvaluationType === 'controle_2'
      ? 'Controle 2'
      : selectedEvaluationType === 'controle_3'
        ? 'Controle 3'
        : 'EFM';

  const columns = [
    { key: 'name', header: 'Stagiaire' },
    { key: 'groupe', header: 'Groupe', className: centeredCellClassName, headerClassName: centeredHeaderClassName },
    { key: 'filiere', header: 'Filiere', className: centeredCellClassName, headerClassName: centeredHeaderClassName },
    {
      key: selectedEvaluationType,
      header: selectedEvaluationLabel,
      className: centeredCellClassName,
      headerClassName: centeredHeaderClassName,
      render: (row) => renderEvaluationCell(row, selectedEvaluationType, selectedStatusField),
    },
  ];

  const invalidFieldCount = Object.keys(validationErrors).length;
  const hasRows = rows.length > 0;
  const enteredEvaluationCount = notes.reduce(
    (count, note) => count + (parseNoteValue(note[selectedEvaluationType]) !== null ? 1 : 0),
    0
  );
  const hasAnyEnteredEvaluation = enteredEvaluationCount > 0;
  const canSaveDraft =
    Boolean(selectedModule) &&
    Boolean(activeGroupId) &&
    hasRows &&
    invalidFieldCount === 0 &&
    !loading &&
    !isSavingAll &&
    !isSubmittingAll &&
    !isSubmissionLocked;
  const canSubmit = canSaveDraft && hasAnyEnteredEvaluation;

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
    evaluation_type: selectedEvaluationType,
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

    const nextValidationErrors = getValidationErrors(notes, selectedEvaluationType);
    setValidationErrors(nextValidationErrors);

    if (Object.keys(nextValidationErrors).length > 0) {
      const message = selectedEvaluationType === 'efm'
        ? 'Corrigez les notes invalides. L EFM doit etre entre 0 et 40.'
        : 'Corrigez les notes invalides. Cette evaluation doit etre entre 0 et 20.';
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

    const nextValidationErrors = getValidationErrors(notes, selectedEvaluationType);
    setValidationErrors(nextValidationErrors);

    if (Object.keys(nextValidationErrors).length > 0) {
      const message = selectedEvaluationType === 'efm'
        ? 'Corrigez les notes invalides avant la soumission. L EFM doit etre entre 0 et 40.'
        : 'Corrigez les notes invalides avant la soumission. Cette evaluation doit etre entre 0 et 20.';
      setError(message);
      notifyError('Notes invalides', message);
      return;
    }

    setIsSubmittingAll(true);
    setSaveMessage('');
    setError('');

    try {
      await professeurApi.submitNotesBatch(buildPayload());
      setSaveMessage(
        hasAnyEnteredEvaluation
          ? `${enteredEvaluationCount} évaluation(s) soumise(s) à l administrateur.`
          : 'La soumission du groupe a ete envoyee a l admin pour validation.'
      );
      success(
        'Soumission envoyee',
        hasAnyEnteredEvaluation
          ? `${enteredEvaluationCount} évaluation(s) prête(s) ont ete soumises a l administrateur.`
          : 'La soumission du groupe a ete envoyee a l administrateur.'
      );
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

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Evaluation a soumettre</label>
          <select
            value={selectedEvaluationType}
            onChange={(event) => setSelectedEvaluationType(event.target.value)}
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            {EVALUATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
          <span>{hasRows ? `${rows.length} stagiaires charges` : 'Aucun stagiaire charge'}</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 sm:inline-block" />
          <span>{invalidFieldCount > 0 ? `${invalidFieldCount} champs invalides` : 'Aucune note invalide'}</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 sm:inline-block" />
          <span>
            {activeSubmissionStatus === 'pending'
              ? `${selectedEvaluationType} en attente de validation.`
              : hasAnyEnteredEvaluation
                ? `${selectedEvaluationType} prête à être soumise.`
                : 'Aucune évaluation saisie pour le moment.'}
          </span>
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
              {isSubmittingAll ? 'Soumission...' : 'Soumettre les evaluations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfesseurStudentsPage;
