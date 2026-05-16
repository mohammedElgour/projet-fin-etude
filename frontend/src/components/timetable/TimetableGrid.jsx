import React from 'react';
import EmptyState from '../dashboard/EmptyState';
import TimetableCard from './TimetableCard';

const TimetableGrid = ({
  items = [],
  emptyTitle = 'Aucun emploi du temps',
  emptyDescription = "Aucun emploi du temps n'est disponible pour le moment.",
  showAudience = false,
}) => {
  if (!items.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {items.map((item) => (
        <TimetableCard key={item.id} item={item} showAudience={showAudience} />
      ))}
    </div>
  );
};

export default TimetableGrid;
