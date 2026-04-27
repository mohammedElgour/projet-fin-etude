import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, TrendingUp, HeartPulse, Cpu, Palette, ArrowUpRight, X } from 'lucide-react';

const careers = [
  {
    icon: Code,
    title: 'IT & Technologie',
    description: 'Developpement web, cybersecurite, data science, intelligence artificielle et cloud computing.',
    color: 'from-blue-500 to-cyan-500',
    jobs: ['Developpeur Full Stack', 'Data Scientist', 'DevOps Engineer', 'Cybersecurity Analyst', 'AI Engineer'],
    image: '💻',
  },
  {
    icon: TrendingUp,
    title: 'Business & Management',
    description: 'Marketing digital, finance, entrepreneuriat, gestion de projet et conseil en strategie.',
    color: 'from-emerald-500 to-teal-500',
    jobs: ['Product Manager', 'Consultant Strategy', 'Financial Analyst', 'Growth Hacker', 'Business Developer'],
    image: '📊',
  },
  {
    icon: HeartPulse,
    title: 'Sante & Bien-etre',
    description: 'Medecine, soins infirmiers, psychologie, nutrition et recherche biomedicale.',
    color: 'from-rose-500 to-pink-500',
    jobs: ['Medecin Generaliste', 'Infirmier(e)', 'Psychologue', 'Data Sante', 'Chercheur Biomedical'],
    image: '🏥',
  },
  {
    icon: Cpu,
    title: 'Ingenierie & Industrie',
    description: 'Genie civil, mecanique, electronique, aeronautique et energies renouvelables.',
    color: 'from-amber-500 to-orange-500',
    jobs: ['Ingenieur Civil', 'Roboticist', 'Aerospace Engineer', 'Energy Consultant', 'Industrial Designer'],
    image: '⚙️',
  },
  {
    icon: Palette,
    title: 'Creation & Design',
    description: 'Design UX/UI, graphisme, architecture, mode, audiovisuel et arts numeriques.',
    color: 'from-violet-500 to-purple-500',
    jobs: ['UX Designer', 'Art Director', 'Motion Designer', 'Architecte', 'Game Artist'],
    image: '🎨',
  },
];

export default function CareerExploration() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="careers" className="relative py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Explorez les{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">
              metiers
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Decouvrez les secteurs qui recrutent et trouvez celui qui correspond a vos aspirations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {careers.map((career, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onClick={() => setSelected(career)}
              className="group relative cursor-pointer"
            >
              <div className="relative p-8 rounded-3xl glass hover:shadow-2xl transition-all duration-500 overflow-hidden h-full">
                <div className={'absolute inset-0 bg-gradient-to-br ' + career.color + ' opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl'} />

                <div className="relative z-10">
                  <div className="text-4xl mb-4">{career.image}</div>
                  <div className={'w-12 h-12 rounded-2xl bg-gradient-to-br ' + career.color + ' flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300'}>
                    <career.icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {career.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {career.description}
                  </p>

                  <div className="flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                    <span>Decouvrir</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg p-8 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl"
              >
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-5xl mb-4">{selected.image}</div>
                <div className={'w-14 h-14 rounded-2xl bg-gradient-to-br ' + selected.color + ' flex items-center justify-center shadow-lg mb-6'}>
                  <selected.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{selected.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{selected.description}</p>

                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Metiers populaires
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selected.jobs.map((job, j) => (
                    <span
                      key={j}
                      className="px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium"
                    >
                      {job}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

