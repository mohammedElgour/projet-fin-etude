import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { authApi, setAuthToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ProfLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const parseErrorMessage = (err) => {
    const errors = err?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      return Object.values(errors).flat().join(' ');
    }
    return err?.response?.data?.message || 'Login failed. Please check your credentials.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const data = await authApi.login({ email, password });

      if (data?.user?.role !== 'professeur') {
        const message = 'This account does not have professor access.';
        setError(message);
        toast.error('Login failed.', message);
        return;
      }

      login({ token: data.token, user: data.user });
      setAuthToken(data.token);
      toast.success('Login successful.', `Welcome back, ${data?.user?.name || 'Professor'}.`);
      navigate('/dashboard/professeur');
    } catch (err) {
      const message = parseErrorMessage(err);
      setError(message);
      toast.error('Login failed.', message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-2xl border border-white/50 bg-white/80 p-8 shadow-xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/80 sm:p-10"
      >
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h2 className="mb-6 text-center text-3xl font-bold text-slate-900 dark:text-white">Professeur</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800/50"
              placeholder="prof@ista.test"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800/50"
              placeholder="password123"
            />
          </div>
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit"
            disabled={loading}
            className="group relative w-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 px-6 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:from-primary-700 hover:to-secondary-600 hover:shadow-primary-500/50 focus:outline-none focus:shadow-primary-500/50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfLogin;
