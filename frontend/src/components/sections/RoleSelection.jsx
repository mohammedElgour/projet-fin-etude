import React from 'react';
import { motion } from 'framer-motion';
import RoleCard from '../ui/RoleCard';
import { Shield, BookOpen, User } from 'lucide-react';

export default function RoleSelection() {
  const roles = [
    {
      title: 'Admin',
      description: 'Gérer le système et les utilisateurs',
      icon: Shield,
      to: '/login/admin'
    },
    {
      title: 'Professeur',
      description: 'Gérer les modules et les notes',
      icon: BookOpen,
      to: '/login/professeur'
    },
    {
      title: 'Stagiaire',
      description: 'Consulter les notes et informations',
      icon: User,
      to: '/login/stagiaire'
    }
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Shapes - subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <motion.div
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-10 w-64 h-64 bg-primary-400/10 dark:bg-primary-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-10 w-80 h-80 bg-secondary-400/10 dark:bg-secondary-500/5 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
        >
          Choisissez votre rôle
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-20 leading-relaxed"
        >
          Sélectionnez votre espace pour continuer
        </motion.p>

        {/* Role Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <RoleCard {...role} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
