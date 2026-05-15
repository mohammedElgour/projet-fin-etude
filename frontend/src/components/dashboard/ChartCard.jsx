import React from 'react';

export default function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-[14px] bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition hover:shadow-md">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}
