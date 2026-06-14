import React, { useMemo, useState } from 'react';
import { CheckCircle2, Edit3, FileWarning, Loader2, Send, XCircle } from 'lucide-react';
import ManagementTable from '../admin/ManagementTable';
import ActionButton from '../admin/ActionButton';
import IconActionButton from '../admin/IconActionButton';
import CrudModal from '../admin/CrudModal';
import BatchActionModal from './BatchActionModal';
import { useToast } from '../../context/ToastContext';
import { useDirecteurNotesWorkflow } from '../../hooks/useDirecteurNotesWorkflow';
import { adminApi } from '../../services/api';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  submitted: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  validated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'validated', label: 'Validated' },
  { value: 'rejected', label: 'Rejected' },
];

const safeAverage = (row) => {
  const average = Number(row.moyenne);
  return Number.isFinite(average) ? average : null;
};

const NotesValidationWorkspace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [submittingAction, setSubmittingAction] = useState('');
  const {
    groupes,
    modules,
    selectedGroup,
    setSelectedGroup,
    selectedModule,
    setSelectedModule,
    selectedGroupItem,
    rows,
    summary,
    loading,
    tableLoading,
    error,
    setError,
    reload,
  } = useDirecteurNotesWorkflow();
  const { success, error: notifyError } = useToast();

  const canTriggerBatchActions = Boolean(selectedGroup && selectedModule && summary.submitted > 0 && !tableLoading);

  const columns = useMemo(
    () => [
      { key: 'student', header: 'Stagiaire' },
      { key: 'cc1', header: 'Controle 1', className: 'text-center', headerClassName: 'text-center' },
      { key: 'cc2', header: 'Controle 2', className: 'text-center', headerClassName: 'text-center' },
      { key: 'cc3', header: 'Controle 3', className: 'text-center', headerClassName: 'text-center' },
      { key: 'efm', header: 'EFM', className: 'text-center', headerClassName: 'text-center' },
      {
        key: 'moyenne',
        header: 'Moyenne',
        className: 'text-center',
        headerClassName: 'text-center',
        render: (row) => {
          const average = safeAverage(row);

          if (average === null) {
            return <span className="text-xs font-medium text-slate-400 dark:text-slate-500">-</span>;
          }

          return (
            <span className={`font-semibold ${average >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {average.toFixed(2)}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Statut',
        className: 'text-center',
        headerClassName: 'text-center',
        render: (row) => (
          <div className="flex justify-center">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[row.status] || STATUS_STYLES.draft}`}>
              {row.status}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        student: row.stagiaire?.name || 'Stagiaire',
        cc1: row.cc1 ?? '-',
        cc2: row.cc2 ?? '-',
        cc3: row.cc3 ?? '-',
        efm: row.efm ?? '-',
      })),
    [rows]
  );

  const handleValidateAll = async () => {
    setSubmittingAction('validate');
    setError('');

    try {
      const response = await adminApi.validateNotesGroup({
        groupe_id: Number(selectedGroup),
        module_id: Number(selectedModule),
      });

      success('Validation terminee', response?.message || 'Toutes les notes ont ete validees.');
      setModalMode(null);
      await reload();
    } catch (err) {
      const message = err?.response?.data?.message || 'Impossible de valider les notes.';
      setError(message);
      notifyError('Validation impossible', message);
    } finally {
      setSubmittingAction('');
    }
  };

  const handleRejectAll = async (feedback) => {
    setSubmittingAction('reject');
    setError('');

    try {
      const response = await adminApi.rejectNotesGroup({
        groupe_id: Number(selectedGroup),
        module_id: Number(selectedModule),
        feedback,
      });

      success('Rejet enregistre', response?.message || 'Toutes les notes ont ete rejetees.');
      setModalMode(null);
      await reload();
    } catch (err) {
      const message = err?.response?.data?.message || 'Impossible de rejeter les notes.';
      setError(message);
      notifyError('Rejet impossible', message);
    } finally {
      setSubmittingAction('');
    }
  };

  const handleSaveRow = async (values) => {
    if (!activeRow?.note_id) {
      setError('Impossible de modifier une note inexistante. Le professeur doit d abord la soumettre.');
      return;
    }

    setSubmittingAction('edit');
    setError('');

    try {
      const response = await adminApi.updateManagedNote(activeRow.note_id, {
        cc1: values.cc1 === '' ? null : Number(values.cc1),
        cc2: values.cc2 === '' ? null : Number(values.cc2),
        cc3: values.cc3 === '' ? null : Number(values.cc3),
        efm: values.efm === '' ? null : Number(values.efm),
        status: values.status,
        feedback: values.feedback || null,
      });

      success('Note mise a jour', response?.message || 'La note a ete corrigee avec succes.');
      setModalMode(null);
      setActiveRow(null);
      await reload();
    } catch (err) {
      const message = err?.response?.data?.message || 'Impossible de mettre a jour la note.';
      setError(message);
      notifyError('Mise a jour impossible', message);
    } finally {
      setSubmittingAction('');
    }
  };

  const summaryCards = [
    { key: 'draft', label: 'Draft', value: summary.draft, icon: FileWarning, accent: 'from-slate-500 to-slate-400' },
    { key: 'submitted', label: 'Submitted', value: summary.submitted, icon: Send, accent: 'from-sky-500 to-cyan-500' },
    { key: 'validated', label: 'Validated', value: summary.validated, icon: CheckCircle2, accent: 'from-emerald-500 to-teal-500' },
    { key: 'rejected', label: 'Rejected', value: summary.rejected, icon: XCircle, accent: 'from-rose-500 to-orange-500' },
  ];

  return (
    <div className="space-y-6 pb-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Groupe</label>
            <select
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              disabled={loading}
            >
              <option value="">Selectionnez un groupe</option>
              {groupes.map((groupe) => (
                <option key={groupe.id} value={groupe.id}>
                  {groupe.nom} - {groupe.filiere?.nom || groupe.filier?.nom || 'Filiere'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Module</label>
            <select
              value={selectedModule}
              onChange={(event) => setSelectedModule(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              disabled={loading}
            >
              <option value="">Selectionnez un module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.nom} - {module.filiere?.nom || module.filier?.nom || 'Filiere'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.key}
                className="rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-slate-900/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{card.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="sticky top-4 z-20 mb-5 flex flex-col gap-3 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Validation globale des notes</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {selectedGroupItem
                ? `Flux principal: groupe ${selectedGroupItem.nom}${selectedModule ? ' et module selectionne' : ''}.`
                : 'Selectionnez un groupe et un module pour piloter la validation.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ActionButton
              variant="success"
              icon={CheckCircle2}
              onClick={() => setModalMode('validate')}
              disabled={!canTriggerBatchActions}
              loading={submittingAction === 'validate'}
              className="w-full sm:w-auto"
            >
              Valider toutes les notes
            </ActionButton>
            <ActionButton
              variant="danger"
              icon={XCircle}
              onClick={() => setModalMode('reject')}
              disabled={!canTriggerBatchActions}
              loading={submittingAction === 'reject'}
              className="w-full sm:w-auto"
            >
              Rejeter toutes les notes
            </ActionButton>
          </div>
        </div>

        <ManagementTable
          data={tableRows}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading || tableLoading}
          emptyMessage="Aucune note disponible pour cette selection"
          onEdit={(row) => {
            setActiveRow(row);
            setModalMode('edit');
          }}
          actionIcons={{ edit: Edit3 }}
        />
      </section>

      <CrudModal
        isOpen={modalMode === 'edit' && Boolean(activeRow)}
        mode="edit"
        title="Correction ponctuelle"
        submitLabel="Enregistrer la correction"
        loading={submittingAction === 'edit'}
        initialValues={{
          cc1: activeRow?.cc1 === '-' ? '' : activeRow?.cc1 ?? '',
          cc2: activeRow?.cc2 === '-' ? '' : activeRow?.cc2 ?? '',
          cc3: activeRow?.cc3 === '-' ? '' : activeRow?.cc3 ?? '',
          efm: activeRow?.efm === '-' ? '' : activeRow?.efm ?? '',
          status: activeRow?.status || 'draft',
          feedback: activeRow?.feedback || '',
        }}
        fields={[
          { name: 'cc1', label: 'Controle 1', type: 'number', min: 0, max: 20, step: 0.25 },
          { name: 'cc2', label: 'Controle 2', type: 'number', min: 0, max: 20, step: 0.25 },
          { name: 'cc3', label: 'Controle 3', type: 'number', min: 0, max: 20, step: 0.25 },
          { name: 'efm', label: 'EFM', type: 'number', min: 0, max: 40, step: 0.25 },
          { name: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS },
          { name: 'feedback', label: 'Commentaire directeur', type: 'textarea', fullWidth: true },
        ]}
        validate={(values) => {
          const errors = {};

          ['cc1', 'cc2', 'cc3'].forEach((field) => {
            if (values[field] !== '' && (Number(values[field]) < 0 || Number(values[field]) > 20)) {
              errors[field] = 'La note doit etre comprise entre 0 et 20.';
            }
          });

          if (values.efm !== '' && (Number(values.efm) < 0 || Number(values.efm) > 40)) {
            errors.efm = 'La note doit etre comprise entre 0 et 40.';
          }

          return errors;
        }}
        onClose={() => {
          setModalMode(null);
          setActiveRow(null);
        }}
        onSubmit={handleSaveRow}
      />

      <BatchActionModal
        isOpen={modalMode === 'validate'}
        mode="validate"
        title="Valider toutes les notes soumises"
        description="Cette action valide en une seule fois toutes les notes actuellement soumises pour le groupe et le module selectionnes."
        loading={submittingAction === 'validate'}
        onCancel={() => setModalMode(null)}
        onConfirm={handleValidateAll}
      />

      <BatchActionModal
        isOpen={modalMode === 'reject'}
        mode="reject"
        title="Rejeter toutes les notes soumises"
        description="Cette action renvoie tout le lot au professeur pour correction. Les notes rejetees redeviendront modifiables cote professeur."
        loading={submittingAction === 'reject'}
        requireReason
        onCancel={() => setModalMode(null)}
        onConfirm={handleRejectAll}
      />
    </div>
  );
};

export default NotesValidationWorkspace;
