import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ClipboardList, Rocket } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Creer votre compte',
    description: 'Inscrivez-vous gratuitement en quelques secondes et creez votre profil avec vos informations academiques et vos interets.',
  },
  {
    icon: ClipboardList,
    step: '02',
    title: 'Passer les tests',
    description: 'Repondez a nos tests d orientation interactifs et ludiques pour identifier vos competences, vos valeurs et vos passions.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Obtenir vos recommandations',
    description: 'Recevez des recommandations de carriere personnalisees et un plan d action detaille pour atteindre vos objectifs professionnels.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.05),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Comment ca{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">
              marche
            </span>
            ?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Trois etapes simples pour decouvrir votre voie professionnelle ideale.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary-200 via-secondary-200 to-primary-200 dark:from-primary-900/40 dark:via-secondary-900/40 dark:to-primary-900/40" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-xl shadow-primary-500/25 z-10 relative">
                    <item.icon className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-primary-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{item.step}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

