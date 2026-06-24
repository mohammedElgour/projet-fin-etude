import React from 'react';
import clsx from 'clsx';
import { Clock3, DoorOpen, UserRound } from 'lucide-react';
import { getCurrentDayName, isTimeInRange, weekDays } from './studentPortalUtils';
import { PortalCard } from './StudentPortalCards';

const colors = [
  'border-sky-100 bg-sky-50 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200',
  'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200',
  'border-violet-100 bg-violet-50 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200',
  'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
  'border-rose-100 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200',
];

const WeeklySchedule = ({ rows }) => {
  const currentDay = getCurrentDayName();

  return (
    <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-6">
      {weekDays.map((day, dayIndex) => {
        const dayRows = rows.filter((row) => row.day === day);
        const isToday = day === currentDay;

        return (
          <PortalCard key={day} className={clsx('p-4', isToday && 'ring-2 ring-sky-300 dark:ring-sky-500/50')}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-950 dark:text-white">{day}</h2>
              {isToday ? (
                <span className="rounded-full bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white">Aujourd'hui</span>
              ) : null}
            </div>

            <div className="space-y-3">
              {dayRows.length ? (
                dayRows.map((slot, slotIndex) => {
                  const current = isToday && isTimeInRange(slot.startTime, slot.endTime);

                  return (
                    <article
                      key={slot.id}
                      className={clsx(
                        'rounded-2xl border p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                        colors[(dayIndex + slotIndex) % colors.length],
                        current && 'ring-2 ring-emerald-400'
                      )}
                      title={`${slot.module} - ${slot.teacher}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold">{slot.module}</h3>
                        {current ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-label="Cours actuel" /> : null}
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                        <Clock3 className="h-3.5 w-3.5" />
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs">
                        <DoorOpen className="h-3.5 w-3.5" />
                        {slot.room}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs">
                        <UserRound className="h-3.5 w-3.5" />
                        {slot.teacher}
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  Aucun cours
                </div>
              )}
            </div>
          </PortalCard>
        );
      })}
    </div>
  );
};

export default WeeklySchedule;
