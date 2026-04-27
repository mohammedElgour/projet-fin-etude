import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const testimonialsData = [
  {
    name: 'Sarah Benali',
    role: 'Etudiante en medecine',
    image: 'S',
    content: 'MyWay m a aidee a comprendre que ma passion pour les sciences pouvait se concretiser dans la medecine. Les tests etaient incroyablement precis !',
    rating: 5,
  },
  {
    name: 'Karim El Amrani',
    role: 'Developpeur Full Stack',
    image: 'K',
    content: 'Grace a cette plateforme, j ai decouvert le developpement web et j ai pu me reconvertir en seulement 6 mois. Un vrai game changer !',
    rating: 5,
  },
  {
    name: 'Laila Moussaoui',
    role: 'UX Designer',
    image: 'L',
    content: 'Les recommandations personnalisees m ont ouvert les yeux sur le design UX. Aujourdhui, j exerce un metier qui me passionne vraiment.',
    rating: 5,
  },
  {
    name: 'Youssef Tahiri',
    role: 'Entrepreneur',
    image: 'Y',
    content: 'J ai utilise MyWay pour structurer mon projet entrepreneurial. Le plan d action detaille m a ete tres utile pour convaincre mes investisseurs.',
    rating: 5,
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((prev) => (prev + 1) % testimonialsData.length);
  const prev = () => setIndex((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);

  return (
    <section id="testimonials" className="relative py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.05),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Ils ont trouve leur{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">
              voie
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Decouvrez les temoignages de nos utilisateurs qui ont transforme leur avenir professionnel.
          </p>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="relative p-8 sm:p-12 rounded-3xl glass-strong shadow-xl"
            >
              <Quote className="absolute top-6 left-6 w-10 h-10 text-primary-200 dark:text-primary-900" />

              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(testimonialsData[index].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 leading-relaxed mb-8 italic">
                  "{testimonialsData[index].content}"
                </p>

                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                    {testimonialsData[index].image}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {testimonialsData[index].name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {testimonialsData[index].role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-white/10 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {testimonialsData.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={'w-2.5 h-2.5 rounded-full transition-all duration-300 ' + (i === index ? 'w-8 bg-gradient-to-r from-primary-500 to-secondary-500' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500')}
                  aria-label={'Go to slide ' + (i + 1)}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-white/10 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

