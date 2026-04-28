import React from 'react';
import { Edit3, Search, Trash2, Users } from 'lucide-react';

const ManagementTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  searchTerm = '',
  onSearchChange,
  loading = false,
  emptyMessage = 'Aucune donnee disponible',
  addLabel = 'Ajouter',
  onAdd,
  rowActions = [],
  hideActions = false,
}) => {
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        {onAdd && (
          <button
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all"
            onClick={onAdd}
          >
            {addLabel}
          </button>
        )}
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">{emptyMessage}</h3>
          <p className="text-slate-500 dark:text-slate-400">Ajustez la recherche ou ajoutez une entree.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {columns.map((column) => (
                  <th
                    key={column.key || column.header}
                    className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
                {!hideActions && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredData.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key || column.header}
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white"
                    >
                      {column.render ? column.render(row) : row[column.key] || '-'}
                    </td>
                  ))}
                  {!hideActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {rowActions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => action.onClick(row)}
                            className={action.className}
                          >
                            {action.label}
                          </button>
                        ))}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagementTable;
