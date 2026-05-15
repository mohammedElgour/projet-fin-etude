import React from 'react';
import { motion } from 'framer-motion';

export default function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
            {eyebrow}
          </div>
        ) : null}

        {title ? (
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {title}
          </h2>
        ) : null}

        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {actions}
        </motion.div>
      ) : null}
    </div>
  );
}
