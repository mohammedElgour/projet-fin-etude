import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PortalCard } from './StudentPortalCards';

const tooltipStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  boxShadow: '0 18px 45px -28px rgba(15, 23, 42, 0.45)',
};

export const GradeCharts = ({ notes }) => {
  const chartData = notes.map((note, index) => ({
    name: note.moduleName,
    shortName: note.moduleName.length > 12 ? `${note.moduleName.slice(0, 12)}...` : note.moduleName,
    grade: note.finalGrade || 0,
    average: Number(
      (
        notes.slice(0, index + 1).reduce((sum, item) => sum + Number(item.finalGrade || 0), 0) /
        (index + 1)
      ).toFixed(2)
    ),
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <PortalCard>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Notes par module</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Comparaison rapide des notes finales.</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="shortName" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}/20`, 'Note']} />
              <Bar dataKey="grade" radius={[10, 10, 0, 0]} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PortalCard>

      <PortalCard>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Progression moyenne</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Evolution de votre moyenne au fil des modules.</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="shortName" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}/20`, 'Moyenne']} />
              <Line type="monotone" dataKey="average" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PortalCard>
    </div>
  );
};
