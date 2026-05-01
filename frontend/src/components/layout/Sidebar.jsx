import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Grid2x2,
  LayoutDashboard,
  Layers3,
  School,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const adminMenu = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Statistics', to: '/statistics', icon: BarChart3 },
  { label: 'Filieres', to: '/admin/filieres', icon: School },
  { label: 'Modules', to: '/admin/modules', icon: BookOpen },
  { label: 'Groupes', to: '/admin/groupes', icon: Grid2x2 },
  { label: 'Stagiaires', to: '/admin/stagiaires', icon: GraduationCap },
  { label: 'Professeurs', to: '/admin/professeurs', icon: Users },
  { label: 'Notifications', to: '/notifications', icon: Bell, badge: true },
  { label: 'Timetables', to: '/timetables', icon: Layers3 },
];

const roleMenus = {
  admin: adminMenu,
  professeur: [
    { label: 'Tableau de bord', to: '/professeur', icon: LayoutDashboard },
    { label: 'Stagiaires', to: '/professeur/stagiaires', icon: GraduationCap },
    { label: 'Notes', to: '/professeur/notes', icon: BookOpen },
    { label: 'Emploi du temps', to: '/professeur/emploi', icon: Layers3 },
    { label: 'Notifications', to: '/professeur/notifications', icon: Bell, badge: true },
  ],
  stagiaire: [
    { label: 'Tableau de bord', to: '/dashboard/stagiaire', icon: LayoutDashboard },
    { label: 'Mes notes', to: '/stagiaire/grades', icon: BookOpen },
    { label: 'Emploi du temps', to: '/stagiaire/timetable', icon: Layers3 },
    { label: 'Annonces', to: '/stagiaire/announcements', icon: Bell, badge: true },
  ],
};

const roleLabelByRole = {
  admin: 'Directeur dashboard',
  professeur: 'Professeur dashboard',
  stagiaire: 'Stagiaire dashboard',
};

const linkBaseClasses =
  'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200';

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}) {
  const { user } = useAuth();
  const menuItems = roleMenus[user?.role] || [];
  const roleLabel = roleLabelByRole[user?.role] || 'Dashboard';

  const navContent = (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg shadow-primary-500/20">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">ISTA Notes</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-xl p-2 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-4">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Navigation
            </p>
          )}
        </div>

        <nav className="space-y-2">
          {menuItems.map(({ label, to, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `${linkBaseClasses} ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-all duration-200 group-hover:bg-white/80 dark:bg-slate-800 dark:group-hover:bg-slate-700">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-slate-900 dark:text-slate-900' : ''}`} />
                    {badge && (
                      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                    )}
                  </span>
                  {!collapsed && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="hidden border-t border-slate-200 p-4 md:block dark:border-slate-800">
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`flex w-full items-center rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-gray-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {!collapsed && <span>Collapse</span>}
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden h-screen border-r border-slate-200 bg-white shadow-sm transition-all duration-200 md:fixed md:left-0 md:top-0 md:z-40 md:flex md:flex-col dark:border-slate-800 dark:bg-slate-950 ${
          collapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {navContent}
      </aside>

      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm transition-all duration-200 md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <aside
          onClick={(event) => event.stopPropagation()}
          className={`h-full w-72 max-w-[82vw] border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {navContent}
        </aside>
      </div>
    </>
  );
}
