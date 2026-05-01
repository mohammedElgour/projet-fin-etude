import React from 'react';
import { motion } from 'framer-motion';
import {
  BriefcaseBusiness,
  Building2,
  Cable,
  Cpu,
  Hotel,
  Megaphone,
  Wrench,
} from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';

const filieres = [
  {
    title: 'Developpement Digital',
    description: 'Conception web, mobile, bases de donnees et projets collaboratifs orientes metier.',
    icon: Cpu,
  },
  {
    title: 'Infrastructure Digitale',
    description: 'Reseaux, systemes, cybersecurite et administration des environnements informatiques.',
    icon: Cable,
  },
  {
    title: 'Gestion des Entreprises',
    description: 'Organisation, comptabilite, analyse de gestion et pilotage administratif.',
    icon: Building2,
  },
  {
    title: 'Commerce et Marketing',
    description: 'Relation client, strategie commerciale, communication digitale et vente.',
    icon: Megaphone,
  },
  {
    title: 'Genie Electrique',
    description: 'Installation electrique, maintenance industrielle et automatisation des equipements.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Genie Mecanique',
    description: 'Fabrication, dessin technique, maintenance mecanique et production industrielle.',
    icon: Wrench,
  },
  {
    title: 'Hotellerie et Tourisme',
    description: 'Accueil, hebergement, restauration et gestion des services touristiques.',
    icon: Hotel,
  },
];

export default function FilieresSection() {
  return (
    <section id="filieres" className="bg-white dark:bg-gray-900 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Filieres"
          title="Des parcours de formation alignes sur les besoins du marche"
          description="Explorez des filieres inspirees du reseau ISTA / OFPPT pour accompagner les stagiaires vers des competences concretes et une insertion professionnelle durable."
          align="center"
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filieres.map((filiere, index) => {
            const Icon = filiere.icon;

            return (
              <motion.article
                key={filiere.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-md dark:hover:shadow-slate-900/50 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 group-hover:bg-sky-200 dark:group-hover:bg-sky-800/50 transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{filiere.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{filiere.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
