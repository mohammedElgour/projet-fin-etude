import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="cta" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600" />
      <div className="absolute inset-0 opacity-50" />

      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Commencez gratuitement</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Commencez votre parcours des aujourdhui
          </h2>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Rejoignez plus de 50 000 utilisateurs qui ont deja decouvert leur voie professionnelle ideale. C est gratuit et ca prend moins de 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/#"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary-700 font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Creer un compte
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/#how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
            >
              En savoir plus
            </a>
          </div>

          <p className="mt-8 text-sm text-primary-200">
            Sans engagement. Annulez a tout moment.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
