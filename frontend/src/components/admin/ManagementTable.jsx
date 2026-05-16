import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Table2,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ActionButton from './ActionButton';
import IconActionButton from './IconActionButton';

const PAGE_SIZE = 8;

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="h-12 w-full max-w-md animate-pulse rounded-[18px] bg-slate-100 dark:bg-slate-800" />
      <div className="h-12 w-full max-w-[180px] animate-pulse rounded-[18px] bg-slate-100 dark:bg-slate-800" />
    </div>
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-slate-950/70">
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="grid animate-pulse grid-cols-5 gap-3 rounded-[22px] bg-slate-50/90 p-4 dark:bg-white/5">
            {[0, 1, 2, 3, 4].map((cell) => (
              <div key={cell} className="h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PaginationButton = ({ children, disabled, onClick, active = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      'inline-flex h-10 min-w-10 items-center justify-center rounded-[14px] px-3 text-sm font-semibold transition-all',
      active
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900'
        : 'bg-white/80 text-slate-600 ring-1 ring-slate-200/70 hover:bg-white hover:text-slate-900 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-slate-800 dark:hover:text-white',
      disabled ? 'cursor-not-allowed opacity-50' : '',
    ].join(' ')}
  >
    {children}
  </button>
);

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
  const [page, setPage] = useState(1);
  const normalizedSearch = searchTerm.toLowerCase();

  const filteredData = useMemo(
    () =>
      data.filter(
        (item) =>
          Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch)) &&
          (rowFilter ? rowFilter(item) : true)
      ),
    [data, normalizedSearch, rowFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPageData = useMemo(
    () => filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredData, page]
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, rowFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-[30px] border border-rose-200/80 bg-rose-50/90 px-6 py-14 text-center shadow-[0_24px_80px_-46px_rgba(244,63,94,0.45)] dark:border-rose-500/20 dark:bg-rose-500/10">
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
          <div className="relative w-full xl:max-w-lg">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students, teachers, modules, groupes..."
              value={searchTerm}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className="w-full rounded-[18px] border border-white/80 bg-white/80 py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)] outline-none backdrop-blur-xl transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950/75 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
            />
          </div>

          {filterPanel ? (
            <ActionButton
              icon={Filter}
              variant={hasActiveFilters ? 'primary' : 'secondary'}
              onClick={onToggleFilters}
              className="w-full xl:w-auto"
            >
              {hasActiveFilters ? 'Filters active' : 'Filters'}
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
        <div className="surface-panel rounded-[24px] p-4">{filterPanel}</div>
      ) : null}

      {filteredData.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-slate-200/80 bg-white/65 px-6 py-16 text-center shadow-[0_26px_70px_-42px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/65">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-100 text-slate-400 shadow-inner dark:bg-white/5 dark:text-slate-500">
            <Table2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{emptyMessage}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Adjust your search, refine filters, or add a new record to populate this workspace.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[30px] border border-white/75 bg-white/78 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/72">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 px-4">
              <thead className="sticky top-0 z-10">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key || column.header}
                      className="bg-slate-50/88 px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 first:rounded-l-[18px] last:rounded-r-[18px] dark:bg-white/5 dark:text-slate-400"
                    >
                      {column.header}
                    </th>
                  ))}
                  {!hideActions ? (
                    <th className="bg-slate-50/88 px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 first:rounded-l-[18px] last:rounded-r-[18px] dark:bg-white/5 dark:text-slate-400">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className="group"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key || column.header}
                        className="surface-subtle px-5 py-4 text-sm text-slate-700 first:rounded-l-[22px] last:rounded-r-[22px] group-hover:bg-white dark:text-slate-200 dark:group-hover:bg-slate-900/90"
                      >
                        {column.render ? column.render(row) : (row[column.key] ?? '-')}
                      </td>
                    ))}
                    {!hideActions ? (
                      <td className="surface-subtle px-5 py-4 first:rounded-l-[22px] last:rounded-r-[22px] group-hover:bg-white dark:group-hover:bg-slate-900/90">
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

          <div className="flex flex-col gap-4 border-t border-slate-200/70 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-white">{currentPageData.length}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{filteredData.length}</span> entries
            </p>

            <div className="flex items-center gap-2">
              <PaginationButton disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </PaginationButton>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <PaginationButton key={pageNumber} active={pageNumber === page} onClick={() => setPage(pageNumber)}>
                    {pageNumber}
                  </PaginationButton>
                );
              })}
              <PaginationButton disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                <ChevronRight className="h-4 w-4" />
              </PaginationButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementTable;
