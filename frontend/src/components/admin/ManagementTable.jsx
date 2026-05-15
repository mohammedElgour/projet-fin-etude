import React from 'react';
import { Eye, Filter, Pencil, Plus, Search, Sparkles, Table2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ActionButton from './ActionButton';
import IconActionButton from './IconActionButton';

const ManagementTable = ({
  data = [],
  columns = [],
  onView,
  onEdit,
  onDelete,
  searchTerm = '',
  onSearchChange,
  loading = false,
  error = '',
  emptyMessage = 'Aucune donnee disponible',
  addLabel = 'Ajouter',
  onAdd,
  hideActions = false,
  rowActions = [],
  actionStates = {},
  actionIcons = {},
  rowFilter,
  filterPanel,
  filtersOpen = false,
  onToggleFilters,
  hasActiveFilters = false,
}) => {
  const normalizedSearch = searchTerm.toLowerCase();
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch)) &&
    (rowFilter ? rowFilter(item) : true)
  );

  if (loading) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Chargement des donnees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50/90 px-6 py-14 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-300">Chargement impossible</h3>
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-3 xl:max-w-3xl xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher rapidement..."
              value={searchTerm}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/90 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
            />
          </div>

          {filterPanel ? (
            <ActionButton
              icon={Filter}
              variant={hasActiveFilters ? 'primary' : 'secondary'}
              onClick={onToggleFilters}
              className="w-full xl:w-auto"
            >
              Filtres
            </ActionButton>
          ) : null}
        </div>

        {onAdd ? (
          <ActionButton icon={actionIcons.add || Plus} variant="primary" onClick={onAdd} className="w-full xl:w-auto">
            {addLabel}
          </ActionButton>
        ) : null}
      </div>

      {filtersOpen && filterPanel ? (
        <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/85">
          {filterPanel}
        </div>
      ) : null}

      {filteredData.length === 0 ? (
        <div className="rounded-[28px] border-2 border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <Table2 className="mx-auto mb-4 h-14 w-14 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{emptyMessage}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Ajustez votre recherche, vos filtres ou ajoutez une nouvelle entree pour commencer.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/80">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-900/70">
                <tr className="border-b border-slate-200/80 dark:border-slate-800">
                  {columns.map((column) => (
                    <th
                      key={column.key || column.header}
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                    >
                      {column.header}
                    </th>
                  ))}
                  {!hideActions ? (
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {filteredData.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.18 }}
                    className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/70"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key || column.header}
                        className="px-5 py-4 text-sm text-slate-700 dark:text-slate-200"
                      >
                        {column.render ? column.render(row) : (row[column.key] ?? '-')}
                      </td>
                    ))}
                    {!hideActions ? (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {onView ? (
                            <IconActionButton
                              icon={actionIcons.view || Eye}
                              label="Voir details"
                              variant="view"
                              onClick={() => onView(row)}
                            />
                          ) : null}
                          {rowActions.map((action) => (
                            <button
                              key={`${action.label}-${row.id}`}
                              type="button"
                              onClick={() => action.onClick(row)}
                              className={action.className}
                            >
                              {action.label}
                            </button>
                          ))}
                          {onEdit ? (
                            <IconActionButton
                              icon={actionIcons.edit || Pencil}
                              label="Modifier"
                              variant="edit"
                              loading={Boolean(actionStates.edit && actionStates.activeId === row.id)}
                              onClick={() => onEdit(row)}
                            />
                          ) : null}
                          {onDelete ? (
                            <IconActionButton
                              icon={actionIcons.delete || Trash2}
                              label="Supprimer"
                              variant="delete"
                              loading={Boolean(actionStates.delete && actionStates.activeId === row.id)}
                              onClick={() => onDelete(row)}
                            />
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementTable;
