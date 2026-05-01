import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X, Compass } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authApi, setAuthToken } from '../../services/api';

const publicLinks = [
  { label: 'Accueil', href: '#hero' },
  { label: 'Filieres', href: '#filieres' },
  { label: 'A propos', href: '#about' },
  { label: 'Acces', href: '#roles' },
];

const dashboardRouteByRole = {
  admin: '/dashboard/admin',
  professeur: '/dashboard/professeur',
  stagiaire: '/dashboard/stagiaire',
};

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logoutLocal } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Local logout is enough for the demo even if the API call fails.
    } finally {
      logoutLocal();
      setAuthToken('');
      navigate('/');
    }
  };

  const dashboardLink = dashboardRouteByRole[user?.role] || '/';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-strong shadow-lg shadow-black/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              ISTA<span className="text-primary-500"> Notes</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {!isAuthenticated &&
              publicLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
            {isAuthenticated && (
              <Link
                to={dashboardLink}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5 transition-all"
              >
                Tableau de bord
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
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
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold"
              >
                Deconnexion
              </button>
            ) : (
              <a
                href="#roles"
                className="hidden sm:inline-flex rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25"
              >
                Commencer
              </a>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
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
