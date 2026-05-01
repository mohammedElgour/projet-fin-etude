import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpenCheck, GraduationCap, School2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import LandingButton from '../ui/LandingButton';

const heroStats = [
  { label: 'Suivi academique', value: 'Centralise' },
  { label: 'Validation', value: 'Plus rapide' },
  { label: 'Acces', value: 'Multi-role' },
];

export default function Hero() {
  return (
      <section
        id="hero"
        className="relative overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300"
      >
      <div className="absolute inset-0 opacity-50">
        <div className="absolute left-8 top-24 h-40 w-40 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute right-10 top-20 h-52 w-52 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-cyan-100/80 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-14 px-4 pb-20 pt-28 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pt-32">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 dark:border-sky-800/50 bg-white/80 dark:bg-slate-800/80 px-4 py-2 text-sm font-medium text-sky-800 dark:text-sky-200 shadow-sm backdrop-blur"
          >
            <School2 className="h-4 w-4" />
            Plateforme academique inspiree de l ecosysteme OFPPT
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl"
          >
            Gerez les notes, la validation et l orientation des filieres dans un espace
            <span className="bg-gradient-to-r from-sky-700 via-cyan-600 to-emerald-500 bg-clip-text text-transparent">
              {' '}professionnel et moderne
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-gray-300"
          >
            ISTA Notes accompagne les directeurs, professeurs et stagiaires avec un portail clair,
            fiable et adapte a la formation professionnelle marocaine.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <LandingButton as={Link} to="/login/stagiaire">
              Commencer
              <ArrowRight className="h-4 w-4" />
            </LandingButton>
            <LandingButton href="#filieres" variant="secondary">
              Decouvrir les filieres
              <GraduationCap className="h-4 w-4" />
            </LandingButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/80 dark:border-white/20 bg-white/75 dark:bg-slate-800/75 p-5 shadow-sm backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">{stat.label}</p>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-2xl shadow-sky-100 backdrop-blur">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-sky-950 to-emerald-950 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-sky-200">ISTA Notes</p>
                  <h3 className="mt-2 text-2xl font-semibold">Tableau de pilotage pedagogique</h3>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <BookOpenCheck className="h-7 w-7 text-cyan-200" />
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-sky-100">Validation des notes</p>
                  <p className="mt-2 text-3xl font-bold">96%</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-sky-100">Filieres suivies</p>
                    <p className="mt-2 text-2xl font-bold">100+</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-sky-100">Groupes actifs</p>
                    <p className="mt-2 text-2xl font-bold">320</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-r from-cyan-400/20 to-emerald-400/20 p-4">
                  <p className="text-sm text-cyan-100">Acces dedie</p>
                  <p className="mt-2 text-lg font-semibold">Directeur, Professeur et Stagiaire dans un meme workflow.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
