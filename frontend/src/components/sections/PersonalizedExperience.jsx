import React from 'react';
import { motion } from 'framer-motion';
import { Brain, BarChart3, Users, Zap, CheckCircle2 } from 'lucide-react';

const insights = [
  { label: 'Compatibilite', value: '94%', icon: Brain },
  { label: 'Competences', value: '32', icon: BarChart3 },
  { label: 'Opportunites', value: '15', icon: Zap },
];

const recommendations = [
  'Developpeur Full Stack',
  'UX Designer',
  'Product Manager',
  'Data Analyst',
];

export default function PersonalizedExperience() {
  return (
    <section id="experience" className="relative py-24 bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-400/10 dark:bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Brain className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Propulse par l IA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Des recommandations{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">
                sur mesure
              </span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              Notre algorithme d intelligence artificielle analyse votre profil, vos competences et vos aspirations pour vous proposer les carrieres les plus adaptees a votre personnalite.
            </p>
            <div className="space-y-4">
              {[
                'Analyse approfondie de votre profil psychometrique',
                'Matching intelligent avec les metiers du marche',
                'Plan de developpement personnalise',
                'Suivi de progression en temps reel',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl glass-strong p-6 shadow-2xl shadow-primary-500/10 border border-white/30 dark:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Votre Profil</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mis a jour aujourdhui</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                  Actif
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {insights.map((insight, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                    <insight.icon className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{insight.value}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{insight.label}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recommandations IA</h5>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300">{rec}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                            style={{ width: (95 - i * 8) + '%' }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">
                          {95 - i * 8}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-secondary-400 to-primary-400 rounded-2xl rotate-12 opacity-20 blur-sm" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-xl -rotate-12 opacity-20 blur-sm" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

