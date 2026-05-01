import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BriefcaseBusiness, Building2, GraduationCap, LineChart } from 'lucide-react';

const stats = [
  { label: 'Stagiaires formes', value: 500000, suffix: '+', icon: GraduationCap },
  { label: 'Etablissements', value: 300, suffix: '+', icon: Building2 },
  { label: 'Filieres disponibles', value: 100, suffix: '+', icon: BriefcaseBusiness },
  { label: "Taux d'insertion", value: 85, suffix: '%', icon: LineChart },
];

function Counter({ value, suffix }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1400;
    const stepTime = Math.max(16, Math.floor(duration / 60));

    const timer = window.setInterval(() => {
      start += Math.ceil(value / 30);
      if (start >= value) {
        setDisplayValue(value);
        window.clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <span>
      {displayValue.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section id="statistics" className="bg-slate-50 dark:bg-slate-900 py-20 text-slate-900 dark:text-white transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="rounded-[1.75rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm dark:shadow-lg dark:shadow-black/20 backdrop-blur"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-3 text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
