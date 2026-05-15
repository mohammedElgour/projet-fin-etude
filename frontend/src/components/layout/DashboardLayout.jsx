import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BookOpenCheck,
  ChevronDown,
  ChevronLeft,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  School,
  ScrollText,
  Settings,
  ShieldCheck,
  Sun,
  TableProperties,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authApi, setAuthToken } from '../../services/api';
import SidebarItem from './SidebarItem';

const baseRouteByRole = {
  admin: '/dashboard/admin',
  professeur: '/dashboard/professeur',
  stagiaire: '/dashboard/stagiaire',
  directeur: '/dashboard/directeur',
};

const alertRouteByRole = {
  admin: '/dashboard/admin/notifications',
  professeur: '/dashboard/professeur/notifications',
  stagiaire: '/dashboard/stagiaire/announcements',
  directeur: '/dashboard/directeur/notifications',
};

const sidebarConfig = {
  admin: {
    title: 'Directeur',
    subtitle: 'Pilotage global',
    roleLabel: 'Director',
    status: 'Session active',
    accent: 'from-sky-500 via-blue-500 to-indigo-500',
    icon: ShieldCheck,
    sections: [
      {
        key: 'main',
        label: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/admin' },
          { key: 'students', label: 'Manage Students', icon: Users, path: '/dashboard/admin/students' },
          { key: 'professors', label: 'Manage Professors', icon: UserCog, path: '/dashboard/admin/professors' },
        ],
      },
      {
        key: 'academic',
        label: 'Academic',
        items: [
          { key: 'filieres', label: 'Filieres', icon: GraduationCap, path: '/dashboard/admin/filieres' },
          { key: 'groupes', label: 'Groupes', icon: School, path: '/dashboard/admin/groupes' },
          { key: 'modules', label: 'Manage Modules', icon: FolderKanban, path: '/dashboard/admin/modules' },
          { key: 'grades', label: 'Validate Grades', icon: BookOpenCheck, path: '/dashboard/admin/grades' },
          { key: 'timetable', label: 'Timetable Management', icon: TableProperties, path: '/dashboard/admin/timetable' },
        ],
      },
      {
        key: 'system',
        label: 'System',
        items: [
          { key: 'notifications', label: 'Notifications', icon: Bell, path: '/dashboard/admin/notifications' },
          { key: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/admin/settings' },
        ],
      },
    ],
    pages: {
      '/dashboard/admin': {
        eyebrow: 'Dashboard',
        title: 'Espace directeur',
        description: 'Pilotez la validation des notes, suivez les tendances globales et gardez la demo sous controle.',
      },
      '/dashboard/admin/students': {
        eyebrow: 'Administration',
        title: 'Manage Students',
        description: 'Consultez les stagiaires sur une page dediee, sans encombrer le dashboard.',
      },
      '/dashboard/admin/professors': {
        eyebrow: 'Administration',
        title: 'Manage Professors',
        description: 'Accedez a la liste des professeurs dans un espace separe.',
      },
      '/dashboard/admin/filieres': {
        eyebrow: 'Referentiel',
        title: 'Filieres',
        description: 'Consultez les filieres disponibles et leur organisation academique.',
      },
      '/dashboard/admin/groupes': {
        eyebrow: 'Organisation',
        title: 'Groupes',
        description: 'Retrouvez les groupes relies a leur filiere et a leurs effectifs.',
      },
      '/dashboard/admin/modules': {
        eyebrow: 'Administration',
        title: 'Manage Modules',
        description: 'Retrouvez les modules sur une page distincte du tableau de bord.',
      },
      '/dashboard/admin/grades': {
        eyebrow: 'Validation',
        title: 'Validate Grades',
        description: 'Traitez les notes en attente depuis une page operationnelle dediee.',
      },
      '/dashboard/admin/timetable': {
        eyebrow: 'Organisation',
        title: 'Timetable Management',
        description: 'Centralisez la structure des groupes relies a l organisation des emplois du temps.',
      },
      '/dashboard/admin/notifications': {
        eyebrow: 'Messages',
        title: 'Notifications',
        description: 'Consultez les notifications en dehors du dashboard.',
      },
      '/dashboard/admin/profile': {
        eyebrow: 'Compte',
        title: 'View Profile',
        description: 'Consultez les informations de votre session.',
      },
      '/dashboard/admin/settings': {
        eyebrow: 'Compte',
        title: 'Settings',
        description: 'Accedez aux reglages disponibles cote frontend.',
      },
    },
  },
  professeur: {
    title: 'Professeur',
    subtitle: 'Suivi pedagogique',
    roleLabel: 'Professor',
    status: 'En ligne',
    accent: 'from-sky-500 via-blue-500 to-indigo-500',
    icon: UserCog,
    sections: [
      {
        key: 'main',
        label: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/professeur' },
          { key: 'students', label: 'Stagiaires', icon: School, path: '/dashboard/professeur/students' },
          { key: 'notes', label: 'Notes', icon: ScrollText, path: '/dashboard/professeur/notes' },
        ],
      },
      {
        key: 'academic',
        label: 'Academic',
        items: [{ key: 'schedule', label: 'Emploi du temps', icon: TableProperties, path: '/dashboard/professeur/schedule' }],
      },
      {
        key: 'system',
        label: 'System',
        items: [
          { key: 'notifications', label: 'Notifications', icon: Bell, path: '/dashboard/professeur/notifications' },
          { key: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/professeur/settings' },
        ],
      },
    ],
    pages: {
      '/dashboard/professeur': {
        eyebrow: 'Dashboard',
        title: 'Espace professeur',
        description: 'Saisissez les notes, gardez un oeil sur la progression du groupe et restez concentre sur la prochaine action utile.',
      },
      '/dashboard/professeur/students': {
        eyebrow: 'Pedagogie',
        title: 'Stagiaires',
        description: 'Retrouvez la liste des stagiaires sur une page separee.',
      },
      '/dashboard/professeur/notes': {
        eyebrow: 'Pedagogie',
        title: 'Notes',
        description: 'Gerez la saisie des notes sans surcharger le dashboard.',
      },
      '/dashboard/professeur/schedule': {
        eyebrow: 'Planning',
        title: 'Emploi du temps',
        description: 'Consultez vos creneaux depuis une page dediee.',
      },
      '/dashboard/professeur/notifications': {
        eyebrow: 'Messages',
        title: 'Notifications',
        description: 'Consultez vos alertes en dehors du tableau de bord.',
      },
      '/dashboard/professeur/profile': {
        eyebrow: 'Compte',
        title: 'View Profile',
        description: 'Consultez les informations de votre session.',
      },
      '/dashboard/professeur/settings': {
        eyebrow: 'Compte',
        title: 'Settings',
        description: 'Accedez aux reglages disponibles cote frontend.',
      },
    },
  },
  directeur: {
    title: 'Directeur',
    subtitle: 'Pilotage global',
    roleLabel: 'Director',
    status: 'Vue executive',
    accent: 'from-sky-500 via-blue-500 to-indigo-500',
    icon: ShieldCheck,
    sections: [
      {
        key: 'main',
        label: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/directeur' },
          { key: 'students', label: 'Stagiaires', icon: Users, path: '/dashboard/directeur/stagiaires' },
          { key: 'professors', label: 'Professeurs', icon: UserCog, path: '/dashboard/directeur/professeurs' },
          { key: 'filieres', label: 'Filieres', icon: GraduationCap, path: '/dashboard/directeur/filieres' },
        ],
      },
      {
        key: 'academic',
        label: 'Academic',
        items: [
          { key: 'grades', label: 'Notes', icon: BookOpenCheck, path: '/dashboard/directeur/notes' },
          { key: 'timetable', label: 'Emplois du temps', icon: TableProperties, path: '/dashboard/directeur/timetable' },
        ],
      },
      {
        key: 'system',
        label: 'System',
        items: [
          { key: 'notifications', label: 'Notifications', icon: Bell, path: '/dashboard/directeur/notifications' },
          { key: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/directeur/settings' },
        ],
      },
    ],
    pages: {
      '/dashboard/directeur': {
        eyebrow: 'Dashboard',
        title: 'Espace directeur',
        description: 'Vue premium: indicateurs, validations et suivi global.',
      },
      '/dashboard/directeur/stagiaires': {
        eyebrow: 'Administration',
        title: 'Gestion des stagiaires',
        description: 'Consultez, recherchez et gerez les stagiaires.',
      },
      '/dashboard/directeur/professeurs': {
        eyebrow: 'Administration',
        title: 'Gestion des professeurs',
        description: 'Consultez et pilotez les professeurs actifs.',
      },
      '/dashboard/directeur/notes': {
        eyebrow: 'Validation',
        title: 'Gestion des notes',
        description: 'Validez, rejetez et suivez les notes.',
      },
      '/dashboard/directeur/filieres': {
        eyebrow: 'Referentiel',
        title: 'Gestion des filieres',
        description: 'Structurez et suivez les filieres.',
      },
      '/dashboard/directeur/timetable': {
        eyebrow: 'Organisation',
        title: 'Emplois du temps',
        description: 'Centralisez les emplois du temps des groupes.',
      },
      '/dashboard/directeur/notifications': {
        eyebrow: 'Messages',
        title: 'Notifications',
        description: 'Consultez les notifications du systeme.',
      },
      '/dashboard/directeur/profile': {
        eyebrow: 'Compte',
        title: 'View Profile',
        description: 'Consultez les informations de votre session.',
      },
      '/dashboard/directeur/settings': {
        eyebrow: 'Compte',
        title: 'Settings',
        description: 'Accedez aux reglages disponibles cote frontend.',
      },
    },
  },
  stagiaire: {
    title: 'Stagiaire',
    subtitle: 'Suivi personnel',
    roleLabel: 'Student',
    status: 'Progression active',
    accent: 'from-sky-500 via-blue-500 to-indigo-500',
    icon: GraduationCap,
    sections: [
      {
        key: 'main',
        label: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/stagiaire' },
          { key: 'notes', label: 'Mes Notes', icon: BookOpenCheck, path: '/dashboard/stagiaire/notes' },
          { key: 'schedule', label: 'Emploi du temps', icon: TableProperties, path: '/dashboard/stagiaire/schedule' },
        ],
      },
      {
        key: 'system',
        label: 'System',
        items: [
          { key: 'announcements', label: 'Annonces', icon: Bell, path: '/dashboard/stagiaire/announcements' },
          { key: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/stagiaire/settings' },
        ],
      },
    ],
    pages: {
      '/dashboard/stagiaire': {
        eyebrow: 'Dashboard',
        title: 'Espace stagiaire',
        description: 'Consultez vos resultats, visualisez votre progression et retrouvez vos informations essentielles au meme endroit.',
      },
      '/dashboard/stagiaire/notes': {
        eyebrow: 'Suivi',
        title: 'Mes Notes',
        description: 'Retrouvez vos notes validees sur une page distincte.',
      },
      '/dashboard/stagiaire/schedule': {
        eyebrow: 'Planning',
        title: 'Emploi du temps',
        description: 'Consultez vos creneaux depuis une page dediee.',
      },
      '/dashboard/stagiaire/announcements': {
        eyebrow: 'Messages',
        title: 'Annonces',
        description: 'Consultez vos annonces hors du dashboard.',
      },
      '/dashboard/stagiaire/profile': {
        eyebrow: 'Compte',
        title: 'View Profile',
        description: 'Consultez les informations de votre session.',
      },
      '/dashboard/stagiaire/settings': {
        eyebrow: 'Compte',
        title: 'Settings',
        description: 'Accedez aux reglages disponibles cote frontend.',
      },
    },
  },
};

const SidebarSection = ({ label, items, collapsed, role, onClose }) => {
  return (
    <section className="space-y-2.5">
      <div className={clsx('flex items-center', collapsed ? 'justify-center px-1 py-1' : 'px-2 py-0.5')}>
        {collapsed ? (
          <span className="h-px w-8 rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
        ) : (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{label}</p>
        )}
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <SidebarItem
            key={item.key}
            to={item.path}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            onClick={onClose}
            end={item.path === baseRouteByRole[role]}
          />
        ))}
      </div>
    </section>
  );
};

const SidebarContent = ({
  role,
  collapsed = false,
  mobile = false,
  onClose,
  onToggleCollapse,
}) => {
  const config = sidebarConfig[role] || sidebarConfig.stagiaire;

  return (
    <div
      className={clsx(
        'flex h-full flex-col rounded-[30px] border border-slate-200/70 bg-white p-4 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]',
        'dark:border-slate-800 dark:bg-slate-950',
        collapsed && !mobile ? 'px-3' : 'px-4'
      )}
    >
      <div
        className={clsx(
          'flex border-b border-slate-100 pb-4 dark:border-slate-800',
          collapsed && !mobile ? 'justify-center' : 'justify-end'
        )}
      >
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-slate-50/75 p-1.5 dark:border-slate-800 dark:bg-slate-900/70">
          {!mobile && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className={clsx('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} />
            </button>
          )}
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1" aria-label="Sidebar navigation">
        {config.sections.map((section) => (
          <SidebarSection key={section.key} label={section.label} items={section.items} collapsed={collapsed && !mobile} role={role} onClose={onClose} />
        ))}
      </nav>
    </div>
  );
};

const DashboardLayout = ({ role, actions }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logoutLocal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const config = sidebarConfig[role] || sidebarConfig.stagiaire;
  const pageMeta = config.pages[location.pathname] || config.pages[baseRouteByRole[role]];
  const userName = useMemo(() => user?.name || user?.email || 'Utilisateur', [user]);
  const userInitial = useMemo(() => userName.charAt(0).toUpperCase(), [userName]);

  useEffect(() => {
    setProfileMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px) and (max-width: 1279px)');
    const syncCollapsedState = (event) => {
      setDesktopCollapsed(event.matches);
    };

    syncCollapsedState(mediaQuery);
    mediaQuery.addEventListener('change', syncCollapsedState);

    return () => mediaQuery.removeEventListener('change', syncCollapsedState);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Local logout keeps the UI responsive even if the API is unavailable.
    } finally {
      logoutLocal();
      setAuthToken('');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] gap-4 px-4 py-4 sm:gap-5 sm:px-6 lg:gap-6 lg:px-8">
        <aside
          className={clsx(
            'sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 lg:block',
            desktopCollapsed ? 'w-[92px]' : 'w-[240px]'
          )}
        >
          <SidebarContent
            role={role}
            collapsed={desktopCollapsed}
            onToggleCollapse={() => setDesktopCollapsed((value) => !value)}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-4 flex items-center gap-3 rounded-[26px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.18)] lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">{pageMeta?.eyebrow || 'Dashboard'}</p>
              <p className="truncate text-base font-semibold text-slate-900">{pageMeta?.title}</p>
            </div>
          </div>

          <header className="rounded-[32px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.2)] sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600 dark:text-sky-400">{pageMeta?.eyebrow || 'Dashboard'}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{pageMeta?.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">{pageMeta?.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(alertRouteByRole[role] || baseRouteByRole[role])}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Changer le theme"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f8fafc] px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                    aria-label="Open profile menu"
                  >
                    <div className={clsx('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-semibold text-white', config.accent)}>
                      {userInitial}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{userName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{config.roleLabel}</p>
                    </div>
                    <ChevronDown className={clsx('h-4 w-4 text-slate-500 transition-transform duration-200', profileMenuOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-60 rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-slate-950"
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`${baseRouteByRole[role]}/profile`)}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          <User className="h-4 w-4" />
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`${baseRouteByRole[role]}/settings`)}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-rose-600 transition-all duration-200 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
              </div>
            </div>
          </header>

          <div className="mt-6 flex-1">
            <Outlet />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
              aria-label="Fermer le menu"
            />
            <motion.aside
              initial={{ x: -360 }}
              animate={{ x: 0 }}
              exit={{ x: -360 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed inset-y-4 left-4 z-50 w-[calc(100vw-2rem)] max-w-[320px] lg:hidden"
            >
              <div className="relative h-full">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
                <SidebarContent
                  role={role}
                  mobile
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
