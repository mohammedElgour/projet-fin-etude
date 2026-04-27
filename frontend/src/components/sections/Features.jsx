import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Briefcase, Target, Lightbulb } from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: 'Identifier ses passions',
    description: 'Découvrez ce qui vous motive vraiment grâce à nos tests d\'orientation scientifiquement validés et analysez vos centres d\'intérêt.',
    color: 'from-rose-500 to-pink-500',
    shadowColor: 'shadow-rose-500/25',
  },
  {
    icon: Briefcase,
    title: 'Explorer les métiers',
    description: 'Accédez à une base de données complète de métiers d\'aujourd\'hui et de demain avec fiches détaillées, salaires et débouchés.',
    color: 'from-primary-500 to-indigo-500',
    shadowColor: 'shadow-primary-500/25',
  },
  {
    icon: Target,
    title: 'Construire son projet',
    description: 'Élaborez votre projet professionnel étape par étape avec des outils de planification et de suivi de vos objectifs de carrière.',
    color: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-500/25',
  },
  {
    icon: Lightbulb,
    title: 'Recommandations IA',
    description: 'Bénéficiez de suggestions personnalisées basées sur l\'intelligence artificielle qui analysent votre profil et vos aspirations.',
    color: 'from-emerald-500 to-teal-500',
    shadowColor: 'shadow-emerald-500/25',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Tout pour votre{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">
              réussite
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Des outils complets et innovants pour vous accompagner à chaque étape de votre orientation professionnelle.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative p-8 rounded-3xl glass hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              {/* Background glow */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center ${feature.shadowColor} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
