import React from 'react';
import ActionButton from '../admin/ActionButton';

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const TimetableCard = ({ item, showAudience = false }) => {
  const audienceLabel =
    item.audienceType === 'professeurs'
      ? item.professeurs || 'Professeurs'
      : item.groupe && item.groupe !== '-'
        ? `${item.groupe}${item.filiere && item.filiere !== '-' ? ` - ${item.filiere}` : ''}`
        : 'Groupe';

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900">
        <img
          src={item.imageUrl}
          alt={item.title || 'Emploi du temps'}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
              {item.title || 'Emploi du temps'}
            </h3>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
              {formatDate(item.createdAt)}
            </span>
          </div>
          {showAudience ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{audienceLabel}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ActionButton
            as="a"
            href={item.imageUrl}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Ouvrir
          </ActionButton>
          <ActionButton
            as="a"
            href={item.imageUrl}
            download
            variant="primary"
            className="w-full sm:w-auto"
          >
            Telecharger
          </ActionButton>
        </div>
      </div>
    </article>
  );
};

export default TimetableCard;
