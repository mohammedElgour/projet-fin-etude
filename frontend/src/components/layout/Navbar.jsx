import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X, Compass, Bell, User, ChevronDown, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authApi, setAuthToken } from '../../services/api';

const publicLinks = [
  { label: 'Accueil', href: '#hero' },
  { label: 'Fonctionnalites', href: '#features' },
  { label: 'Comment ca marche', href: '#how-it-works' },
];

const dashboardRouteByRole = {
  admin: '/dashboard',
  professeur: '/dashboard/professeur',
  stagiaire: '/dashboard/stagiaire',
};

const loginRouteByRole = {
  admin: '/login/admin',
  professeur: '/login/professeur',
  stagiaire: '/login/stagiaire',
};

export default function Navbar({ isDashboard = false, onMenuClick = null }) {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logoutLocal } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    const loginRoute = loginRouteByRole[user?.role] || '/';

    try {
      await authApi.logout();
    } catch (error) {
      // Local logout is enough for the demo even if the API call fails.
    } finally {
      setProfileMenuOpen(false);
      setMobileOpen(false);
      logoutLocal();
      setAuthToken('');
      localStorage.removeItem('token');
      localStorage.removeItem('sms_token');
      localStorage.removeItem('user');
      localStorage.removeItem('sms_user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('sms_token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('sms_user');
      navigate(loginRoute, { replace: true });
    }
  };

  const dashboardLink = dashboardRouteByRole[user?.role] || '/';
  const userInitials = (user?.name || user?.email || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const dropdownItems = [
    {
      label: 'View Profile',
      icon: User,
      onClick: () => navigate('/profile'),
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => navigate('/settings'),
    },
    {
      label: 'Logout',
      icon: LogOut,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 right-0 z-50 transition-all duration-300 ${
        isDashboard
          ? 'left-0 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90'
          : `left-0 ${scrolled ? 'glass-strong shadow-lg shadow-black/5' : 'bg-transparent'}`
      }`}
    >
      <div className={`${isDashboard ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-3">
            {isDashboard && onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to={isDashboard ? dashboardLink : '/'} className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                ISTA<span className="text-primary-500"> Notes</span>
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {!isDashboard &&
              !isAuthenticated &&
              publicLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
            {!isDashboard && isAuthenticated && (
              <Link
                to={dashboardLink}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5 transition-all"
              >
                Tableau de bord
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isDashboard && isAuthenticated && (
              <button
                type="button"
                className="relative hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-primary-50 dark:text-slate-300 dark:hover:bg-white/5"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-2.5 text-slate-700 shadow-sm transition-colors hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Open profile menu"
                  aria-expanded={profileMenuOpen}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-xs font-semibold text-white">
                    {userInitials || <User className="h-4 w-4" />}
                  </span>
                  <ChevronDown
                    className={`hidden h-4 w-4 transition-transform sm:block ${profileMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/80">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {user?.name || 'Utilisateur'}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user?.email || 'Compte connecte'}
                        </p>
                      </div>

                      <div className="mt-2 space-y-1">
                        {dropdownItems.map(({ label, icon: Icon, onClick, danger = false }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false);
                              onClick();
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                              danger
                                ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
                                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <a
                href="#cta"
                className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-500 text-white text-sm font-semibold shadow-lg shadow-primary-500/25"
              >
                Commencer
              </a>
            )}

            {!isDashboard && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!isDashboard && mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden glass-strong border-t border-white/20 dark:border-white/10 overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-1">
              {!isAuthenticated &&
                publicLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              {isAuthenticated && (
                <>
                  <Link
                    to={dashboardLink}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="mt-2 px-5 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-center font-semibold"
                  >
                    Deconnexion
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
