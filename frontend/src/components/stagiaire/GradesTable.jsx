import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

const GradesTable = ({ grades = [], loading = false }) => {
  const [sortBy, setSortBy] = useState('module');
  const [sortOrder, setSortOrder] = useState('asc');

  const getStatusStyle = (status) => {
    const styles = {
      validated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
      rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
      not_set: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    };
    return styles[status] || styles.not_set;
  };

  const getStatusLabel = (status) => {
    const labels = {
      validated: 'Validée',
      pending: 'En attente',
      rejected: 'Rejetée',
      not_set: 'Non défini',
    };
    return labels[status] || status;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedGrades = [...grades].sort((a, b) => {
    let aVal, bVal;

    if (sortBy === 'module') {
      aVal = a.module?.nom || '';
      bVal = b.module?.nom || '';
    } else if (sortBy === 'grade') {
      aVal = a.note || 0;
      bVal = b.note || 0;
    } else if (sortBy === 'status') {
      aVal = a.validation_status || '';
      bVal = b.validation_status || '';
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">Aucune note enregistrée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => handleSort('module')}
                className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Module
                {sortBy === 'module' && <ArrowUpDown className="h-4 w-4" />}
              </button>
            </th>
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => handleSort('grade')}
                className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Note
                {sortBy === 'grade' && <ArrowUpDown className="h-4 w-4" />}
              </button>
            </th>
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => handleSort('status')}
                className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Statut
                {sortBy === 'status' && <ArrowUpDown className="h-4 w-4" />}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedGrades.map((grade) => (
            <tr
              key={grade.id}
              className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white">
                {grade.module?.nom || 'Module'}
              </td>
              <td className="px-4 py-4 text-sm">
                <span className="font-semibold text-slate-900 dark:text-white">{grade.note}</span>
                <span className="text-slate-500 dark:text-slate-400">/20</span>
              </td>
              <td className="px-4 py-4 text-sm">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(grade.validation_status)}`}>
                  {getStatusLabel(grade.validation_status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GradesTable;
