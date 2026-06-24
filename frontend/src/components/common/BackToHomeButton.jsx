import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const BackToHomeButton = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -5, scale: 1.03 }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate('/')}
      className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-full border border-white/30 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-cyan-200/70 hover:text-cyan-600 hover:shadow-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:ring-offset-2 dark:border-slate-700/40 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-400/40 dark:hover:text-cyan-300 dark:focus:ring-offset-slate-950"
      aria-label="Retour à l'accueil"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span>Retour à l'accueil</span>
    </motion.button>
  );
};

export default BackToHomeButton;
