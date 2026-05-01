import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Lightbulb, Target, UsersRound } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';

const values = [
  {
    icon: BadgeCheck,
    title: 'Qualite',
    description: 'Des processus clairs pour fiabiliser le suivi pedagogique et la validation academique.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Des outils numeriques pour moderniser la formation professionnelle et la coordination des acteurs.',
  },
  {
    icon: UsersRound,
    title: 'Accessibilite',
    description: 'Une experience simple pour les directeurs, professeurs et stagiaires sur tous les ecrans.',
  },
];

export default function AboutIstaSection() {
  return (
    <section id="about" className="bg-slate-50 dark:bg-slate-800 py-24 sm:py-28 transition-colors duration-300">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div>
          <SectionHeader
            eyebrow="A propos de l'ISTA / OFPPT"
            title="Une plateforme au service de la formation professionnelle et de l'insertion"
            description="L'OFPPT contribue a la qualification des talents au Maroc. Les ISTA jouent un role central dans la formation, l'accompagnement pedagogique et la preparation des stagiaires au marche du travail."
          />

          <div className="mt-8 space-y-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            <p>
              ISTA Notes s'inspire de cette mission en centralisant le suivi des notes, la validation par la direction
              et l'acces des stagiaires a leurs resultats dans un environnement professionnel.
            </p>
            <p>
              La plateforme facilite la coordination entre les equipes pedagogiques, soutient la qualite des parcours
              et renforce une culture de transparence, de rigueur et d'innovation.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {values.map((value, index) => {
              const Icon = value.icon;

              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -left-5 top-8 hidden h-24 w-24 rounded-full bg-emerald-200/70 blur-2xl lg:block" />
          <div className="absolute -right-3 bottom-8 hidden h-28 w-28 rounded-full bg-sky-200/70 blur-2xl lg:block" />

          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-sky-700 via-cyan-700 to-emerald-600 p-8 text-white shadow-2xl shadow-sky-200">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.18),_transparent_24%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                <Target className="h-4 w-4" />
                Mission pedagogique
              </div>

              <h3 className="mt-6 text-3xl font-semibold leading-tight">
                Former, accompagner et connecter les stagiaires aux opportunites professionnelles.
              </h3>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/12 p-5 backdrop-blur">
                  <p className="text-sm text-cyan-100">Orientation</p>
                  <p className="mt-2 text-xl font-semibold">Filieres claires et structurees</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-5 backdrop-blur">
                  <p className="text-sm text-cyan-100">Insertion</p>
                  <p className="mt-2 text-xl font-semibold">Preparation aux besoins reels du marche</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-5 backdrop-blur sm:col-span-2">
                  <p className="text-sm text-cyan-100">Pilotage</p>
                  <p className="mt-2 text-lg font-medium">
                    Un espace academique concu pour suivre la progression, la validation et la performance des stagiaires.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
