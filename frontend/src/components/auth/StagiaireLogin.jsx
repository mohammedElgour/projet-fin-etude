import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { authApi, setAuthToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StagiaireLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const parseErrorMessage = (err) => {
    const errors = err?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      return Object.values(errors).flat().join(' ');
    }
    return (
      err?.response?.data?.message ||
      'Connexion échouée. Vérifiez vos identifiants.'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const { data } = await authApi.login({ email, password });

      if (data?.user?.role !== 'stagiaire') {
        setError('Ce compte ne possède pas les droits stagiaire.');
        setLoading(false);
        return;
      }

      login({ token: data.token, user: data.user });
      setAuthToken(data.token);
      navigate('/dashboard/stagiaire');
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 dark:border-slate-800/50 p-8 sm:p-10"
      >
        <div className="mx-auto flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-8 shadow-lg">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-6">Stagiaire</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              placeholder="stagiaire@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit"
            disabled={loading}
            className="group relative w-full py-4 px-6 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white font-semibold text-lg shadow-xl hover:shadow-primary-500/50 focus:outline-none focus:shadow-primary-500/50 transition-all duration-300 hover:from-primary-700 hover:to-secondary-600 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
            <span className="ml-2 inline-block w-5 h-5 bg-white/20 rounded-full group-hover:w-6 group-hover:h-6 transition-all duration-300 origin-left" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default StagiaireLogin;
