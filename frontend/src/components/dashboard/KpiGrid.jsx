import React from 'react';

export default function KpiGrid({ children, columns = '4', className = '' }) {
  const cols =
    columns === '1'
      ? 'grid-cols-1'
      : columns === '2'
        ? 'grid-cols-1 sm:grid-cols-2'
        : columns === '3'
          ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4';

  return <div className={`grid gap-4 ${cols} ${className}`}>{children}</div>;
}
