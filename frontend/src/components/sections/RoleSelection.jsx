import React from 'react';
import { motion } from 'framer-motion';
import RoleCard from '../ui/RoleCard';
import { Shield, BookOpen, User } from 'lucide-react';

export default function RoleSelection() {
  const roles = [
    {
      title: 'Admin',
      description: 'Valider les notes, suivre la moyenne generale et verifier les modules a risque',
      icon: Shield,
      to: '/login/admin',
    },
    {
      title: 'Professeur',
      description: 'Filtrer les groupes, saisir les notes et envoyer les validations',
      icon: BookOpen,
      to: '/login/professeur',
    },
    {
      title: 'Stagiaire',
      description: 'Consulter les notes validees, la moyenne et les notifications',
      icon: User,
      to: '/login/stagiaire',
    },
  ];

  return (
    <section id="roles" className="py-32 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
        >
          Trois roles, un seul workflow
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-20 leading-relaxed"
        >
          Connectez-vous avec un compte de demo et testez la saisie, la validation et la consultation des notes.
        </motion.p>

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
