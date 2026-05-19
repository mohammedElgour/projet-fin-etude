import React, { useEffect, useMemo, useState } from 'react';
import ManagementTable from '../components/admin/ManagementTable';
import { useProfesseurData } from '../hooks/useProfesseurData';
import { professeurApi } from '../services/api';

const emptyGrades = {
  controle1: '',
  controle2: '',
  controle3: '',
  efm: '',
};

const clampGradeValue = (value) => {
  if (value === '') {
    return '';
  }

  return Math.min(20, Math.max(0, Number(value)));
};

const computeMoyenne = (grades) => {
  const values = [grades.controle1, grades.controle2, grades.controle3, grades.efm];
  const isIncomplete = values.some((value) => value === '' || value === null || value === undefined);

  if (isIncomplete) {
    return null;
  }

  const controlsAverage =
    (Number(grades.controle1) + Number(grades.controle2) + Number(grades.controle3)) / 3;

  return (controlsAverage * 0.4) + (Number(grades.efm) * 0.6);
};

const getGradeStatus = (grades) => {
  const moyenne = computeMoyenne(grades);

  if (moyenne === null) {
    return { label: 'Incomplete', tone: 'incomplete', moyenne: null };
  }

  return moyenne >= 10
    ? { label: 'Valide', tone: 'validated', moyenne }
    : { label: 'Non valide', tone: 'rejected', moyenne };
};

const ProfesseurStudentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeEntries, setGradeEntries] = useState({});
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const {
    catalog,
    rows,
    selectedGroup,
    setSelectedGroup,
    selectedModule,
    setSelectedModule,
    loading,
    error,
    setError,
    reload,
  } = useProfesseurData();

  useEffect(() => {
    setGradeEntries((prev) => {
      const next = { ...prev };

      rows.forEach((row) => {
        next[row.id] = {
          controle1: row.cc1 ?? '',
          controle2: row.cc2 ?? '',
          controle3: row.cc3 ?? '',
          efm: row.efm ?? '',
        };
      });

      return next;
    });
  }, [rows]);

  const handleChange = (studentId, field, value) => {
    const normalizedValue = clampGradeValue(value);

    setGradeEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || emptyGrades),
        [field]: normalizedValue,
      },
    }));
  };

  const tableRows = useMemo(
    () =>
      rows.map((row) => {
        const grades = gradeEntries[row.id] || {
          controle1: row.cc1 ?? '',
          controle2: row.cc2 ?? '',
          controle3: row.cc3 ?? '',
          efm: row.efm ?? '',
        };
        const status = getGradeStatus(grades);

        return {
          ...row,
          controle1: grades.controle1,
          controle2: grades.controle2,
          controle3: grades.controle3,
          efm: grades.efm,
          moyenne: status.moyenne,
          uiStatus: status,
        };
      }),
    [gradeEntries, rows]
  );

  const saveNotes = async (student) => {
    if (!selectedModule) {
      setError('Selectionnez un module avant de saisir les notes.');
      return;
    }

    const grades = gradeEntries[student.id] || emptyGrades;

    setSavingStudentId(student.id);
    setSaveMessage('');
    setError('');

    try {
      await professeurApi.saveNotes({
        stagiaire_id: student.id,
        module_id: Number(selectedModule),
        cc1: grades.controle1 === '' ? null : Number(grades.controle1),
        cc2: grades.controle2 === '' ? null : Number(grades.controle2),
        cc3: grades.controle3 === '' ? null : Number(grades.controle3),
        efm: grades.efm === '' ? null : Number(grades.efm),
      });

      setSaveMessage(`Notes enregistrees pour ${student.name}.`);
      await reload();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError?.response?.data?.message || 'Impossible d enregistrer les notes.');
    } finally {
      setSavingStudentId(null);
    }
  };

  const inputClassName =
    'h-10 w-20 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-500/20';

  const centeredHeaderClassName = 'text-center';
  const centeredCellClassName = 'text-center';

  const columns = useMemo(
    () => [
      { key: 'name', header: 'Stagiaire' },
      { key: 'groupe', header: 'Groupe', className: centeredCellClassName, headerClassName: centeredHeaderClassName },
      { key: 'filiere', header: 'Filiere', className: centeredCellClassName, headerClassName: centeredHeaderClassName },
      {
        key: 'controle1',
        header: 'Controle 1',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => (
          <div className="flex justify-center">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="20"
              step="0.25"
              value={row.controle1}
              onChange={(e) => handleChange(row.id, 'controle1', e.target.value)}
              disabled={!selectedModule}
              className={inputClassName}
            />
          </div>
        ),
      },
      {
        key: 'controle2',
        header: 'Controle 2',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => (
          <div className="flex justify-center">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="20"
              step="0.25"
              value={row.controle2}
              onChange={(e) => handleChange(row.id, 'controle2', e.target.value)}
              disabled={!selectedModule}
              className={inputClassName}
            />
          </div>
        ),
      },
      {
        key: 'controle3',
        header: 'Controle 3',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => (
          <div className="flex justify-center">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="20"
              step="0.25"
              value={row.controle3}
              onChange={(e) => handleChange(row.id, 'controle3', e.target.value)}
              disabled={!selectedModule}
              className={inputClassName}
            />
          </div>
        ),
      },
      {
        key: 'efm',
        header: 'EFM',
        className: centeredCellClassName,
        headerClassName: centeredHeaderClassName,
        render: (row) => (
          <div className="flex justify-center">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="20"
              step="0.25"
              value={row.efm}
              onChange={(e) => handleChange(row.id, 'efm', e.target.value)}
              disabled={!selectedModule}
              className={inputClassName}
            />
          </div>
        ),
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
    [selectedModule]
  );

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
      {saveMessage && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{saveMessage}</div>}

      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Groupe</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
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
              onChange={(e) => setSelectedModule(e.target.value)}
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

        <ManagementTable
          data={tableRows}
          columns={columns}
          rowActions={[
            {
              label: (row) => (savingStudentId === row.id ? 'Sauvegarde...' : 'Enregistrer'),
              onClick: saveNotes,
              disabled: (row) => !selectedModule || savingStudentId === row.id,
              className: (row) =>
                `rounded-xl px-3 py-2 text-xs font-semibold text-white transition ${
                  !selectedModule || savingStudentId === row.id
                    ? 'cursor-not-allowed bg-slate-400 opacity-60'
                    : 'bg-sky-600 hover:bg-sky-500'
                }`,
            },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          emptyMessage="Aucun stagiaire pour ces filtres"
        />
      </section>
    </div>
  );
};

export default ProfesseurStudentsPage;
