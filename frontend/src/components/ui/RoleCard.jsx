import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const RoleCard = ({ title, description, icon: Icon, to }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
      className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg hover:shadow-2xl border border-white/50 dark:border-slate-800/50 hover:border-primary-200/50 transition-all duration-500"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-primary-500/30 transition-all duration-300 mx-auto">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 text-center group-hover:text-primary-600 transition-colors">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-8 text-center leading-relaxed">{description}</p>
      <Link
        to={to}
        className="group/card relative block w-full py-4 px-6 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white font-semibold text-lg text-center shadow-xl hover:shadow-primary-500/50 focus:outline-none focus:shadow-primary-500/50 transition-all duration-300 hover:from-primary-700 hover:to-secondary-600"
      >
        Se connecter
        <span className="ml-2 inline-block w-5 h-5 bg-white/20 rounded-full group-hover:w-6 group-hover:h-6 transition-all duration-300 origin-left" />
      </Link>
    </motion.div>
  );
};

export default RoleCard;
