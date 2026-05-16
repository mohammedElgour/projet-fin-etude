import React from 'react';
import clsx from 'clsx';
import { NavLink } from 'react-router-dom';

const SidebarItem = ({ to, icon: Icon, label, collapsed = false, end = false, onClick }) => {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      aria-label={label}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center overflow-hidden rounded-2xl border text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
          collapsed ? 'h-11 justify-center px-0' : 'gap-3 px-3 py-2.5',
          isActive
            ? 'border-white/90 bg-white/90 text-sky-700 shadow-[0_22px_44px_-26px_rgba(59,130,246,0.42)] dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200'
            : 'border-transparent text-slate-600 hover:border-white/80 hover:bg-white/72 hover:text-slate-900 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-slate-900 dark:hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={clsx(
              'absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-opacity duration-200',
              isActive ? 'bg-sky-500 opacity-100' : 'opacity-0'
            )}
            aria-hidden="true"
          />
          <span
            className={clsx(
              'relative flex items-center justify-center rounded-xl transition-all duration-200',
              collapsed ? 'h-9 w-9' : 'h-9 w-9',
              isActive
                ? 'bg-white/90 text-sky-600 shadow-sm ring-1 ring-sky-100 dark:bg-slate-900 dark:text-sky-300 dark:ring-sky-500/10'
                : 'bg-white/80 text-slate-500 shadow-sm ring-1 ring-white/80 group-hover:bg-white group-hover:text-sky-600 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10 dark:group-hover:bg-slate-800 dark:group-hover:text-sky-300'
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
          </span>
          {!collapsed && (
            <span className="relative flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className="truncate">{label}</span>
              <span
                className={clsx(
                  'h-2 w-2 rounded-full transition-all duration-200',
                  isActive ? 'bg-sky-400' : 'bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                )}
                aria-hidden="true"
              />
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

export default SidebarItem;
