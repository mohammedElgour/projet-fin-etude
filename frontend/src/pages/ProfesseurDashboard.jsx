import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CrudModal from '../components/admin/CrudModal';
import ManagementTable from '../components/admin/ManagementTable';
import NotificationsPanel from '../components/common/NotificationsPanel';
import { professeurApi } from '../services/api';

const ProfesseurDashboard = () => {
  const [catalog, setCatalog] = useState({ groupes: [], modules: [] });
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStats, setLoadingStats] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const countRes = await professeurApi.notificationsCount();
      setUnreadCount(countRes.unread_count || 0);
    } catch (err) {
      // silent
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadData = useCallback(async (groupId, moduleId) => {
    setLoading(true);
    setError('');

    try {
      const [catalogRes, studentsRes, scheduleRes] = await Promise.all([
        professeurApi.catalog(),
        professeurApi.stagiaires({
          groupe_id: groupId || undefined,
          module_id: moduleId || undefined,
        }),
        professeurApi.schedule({ groupe_id: groupId || undefined }),
      ]);

      setCatalog(catalogRes);
      setStudents(studentsRes?.data || []);
      setSchedule(scheduleRes?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de charger les donnees professeur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const rows = useMemo(
    () =>
      students.map((student) => {
        const currentNote = Array.isArray(student.notes) && student.notes.length ? student.notes[0] : null;
        return {
          id: student.id,
          studentId: student.id,
          name: student.user?.name || 'Stagiaire',
          groupe: student.groupe?.nom || '-',
          filiere: student.groupe?.filier?.nom || '-',
          noteValue: currentNote?.note || '',
          noteStatus: currentNote?.validation_status || 'not_set',
          noteId: currentNote?.id || null,
        };
      }),
    [students]
  );

  const columns = [
    { key: 'name', header: 'Stagiaire' },
    { key: 'groupe', header: 'Groupe' },
    { key: 'filiere', header: 'Filiere' },
    {
      key: 'noteValue',
      header: 'Note',
      render: (row) => (row.noteValue ? `${row.noteValue}/20` : 'A saisir'),
    },
    {
      key: 'noteStatus',
      header: 'Statut',
      render: (row) => {
        const styles = {
          validated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
          pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
          rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
          not_set: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        };

        return (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[row.noteStatus]}`}>
            {row.noteStatus}
          </span>
        );
      },
    },
  ];

  const openNoteModal = (row) => {
    if (!selectedModule) {
      setError('Selectionnez un module avant de saisir une note.');
      return;
    }

    setActiveStudent(row);
    setModalOpen(true);
  };

  const handleSubmitNote = async (values) => {
    try {
      await professeurApi.saveNote({
        stagiaire_id: activeStudent.studentId,
        module_id: Number(selectedModule),
        note: Number(values.note),
      });
      setModalOpen(false);
      setActiveStudent(null);
      loadData(selectedGroup, selectedModule);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible d enregistrer la note.');
    }
  };

  const scheduleItems = schedule.flatMap((entry) =>
    Array.isArray(entry.fichier)
      ? entry.fichier.map((slot, index) => ({
          id: `${entry.id}-${index}`,
          label: `${slot.jour} ${slot.heure} - ${slot.module}`,
        }))
      : []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Espace professeur</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Saisissez les notes, suivez leur validation et preparez votre demo.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Groupe</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-white"
          >
            <option value="">Tous les groupes</option>
            {catalog.groupes.map((groupe) => (
              <option key={groupe.id} value={groupe.id}>
                {groupe.nom} - {groupe.filier?.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Module</label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-white"
          >
            <option value="">Selectionner un module</option>
            {catalog.modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.nom} - {module.filier?.nom}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Saisie des notes</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Les notes saisies passent automatiquement en attente de validation.
            </p>
          </div>
        </div>

        <ManagementTable
          data={rows}
          columns={columns}
          onEdit={openNoteModal}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage="Aucun stagiaire pour ces filtres"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Emploi du temps</h2>
          {scheduleItems.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun creneau pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {scheduleItems.map((item) => (
                <li key={item.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <NotificationsPanel />
      </section>

      <CrudModal
        isOpen={modalOpen}
        title={activeStudent ? `Saisir une note pour ${activeStudent.name}` : 'Saisir une note'}
        fields={[
          {
            name: 'note',
            label: 'Note sur 20',
            type: 'number',
            required: true,
            min: 0,
            max: 20,
            step: 0.25,
          },
        ]}
        initialValues={{ note: activeStudent?.noteValue || '' }}
        onClose={() => {
          setModalOpen(false);
          setActiveStudent(null);
        }}
        onSubmit={handleSubmitNote}
        submitLabel="Envoyer pour validation"
      />
    </div>
  );
};

export default ProfesseurDashboard;
