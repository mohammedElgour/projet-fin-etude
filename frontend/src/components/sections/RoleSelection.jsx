import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Shield, User } from 'lucide-react';
import RoleCard from '../ui/RoleCard';
import SectionHeader from '../ui/SectionHeader';

const roles = [
  {
    title: 'Directeur',
    description: 'Valider les notes, superviser les filieres et piloter les indicateurs academiques.',
    icon: Shield,
    to: '/login/admin',
  },
  {
    title: 'Professeur',
    description: 'Consulter ses groupes, saisir les notes et suivre les validations pedagogiques.',
    icon: BookOpen,
    to: '/login/professeur',
  },
  {
    title: 'Stagiaire',
    description: 'Acceder aux notes validees, a l emploi du temps et aux annonces importantes.',
    icon: User,
    to: '/login/stagiaire',
  },
];

export default function RoleSelection() {
  return (
    <section id="roles" className="bg-white dark:bg-slate-900 py-24 sm:py-28 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Acces"
          title="Un portail adapte a chaque acteur de l'ecosysteme pedagogique"
          description="Choisissez votre espace pour gerer les notes, suivre les validations et acceder aux informations essentielles de votre parcours."
          align="center"
        />

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <RoleCard {...role} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
