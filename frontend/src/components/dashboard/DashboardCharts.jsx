import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const ChartCard = ({ title, children, loading = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
  >
    <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
    {loading ? (
      <div className="flex h-80 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-400" />
      </div>
    ) : (
      children
    )}
  </motion.div>
);

export const GradesDistributionChart = ({ data = [], loading = false }) => {
  const chartData = data.length > 0 ? data : [
    { range: '0-5', count: 0 },
    { range: '6-10', count: 0 },
    { range: '11-15', count: 0 },
    { range: '16-20', count: 0 },
  ];

  return (
    <ChartCard title="Distribution des notes" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="range"
            tick={{ fill: '#64748b', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const StudentPerformanceChart = ({ data = [], loading = false }) => {
  const chartData = data.length > 0 ? data : [
    { month: 'Jan', average: 14 },
    { month: 'Feb', average: 14.5 },
    { month: 'Mar', average: 15 },
    { month: 'Apr', average: 15.2 },
  ];

  return (
    <ChartCard title="Performance moyenne par mois" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 20]}
            tick={{ fill: '#64748b', fontSize: 12 }}
            label={{ value: 'Moyenne', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            cursor={{ stroke: 'rgba(59, 130, 246, 0.3)', strokeWidth: 2 }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="average"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5 }}
            activeDot={{ r: 7 }}
            animationDuration={500}
            name="Moyenne"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const StudentsPerGroupChart = ({ data = [], loading = false }) => {
  const chartData = data.length > 0 ? data : [
    { name: 'Groupe 1', value: 25 },
    { name: 'Groupe 2', value: 20 },
    { name: 'Groupe 3', value: 18 },
    { name: 'Groupe 4', value: 22 },
  ];

  return (
    <ChartCard title="Étudiants par groupe" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#3b82f6"
            dataKey="value"
            animationDuration={500}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const ModulePerformanceChart = ({ data = [], loading = false }) => {
  const chartData = data.length > 0 ? data : [
    { module: 'Module 1', average: 15 },
    { module: 'Module 2', average: 14 },
    { module: 'Module 3', average: 16 },
    { module: 'Module 4', average: 13 },
    { module: 'Module 5', average: 17 },
  ];

  return (
    <ChartCard title="Performance par module" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 20]} />
          <YAxis
            dataKey="module"
            type="category"
            tick={{ fill: '#64748b', fontSize: 12 }}
            width={140}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar
            dataKey="average"
            fill="#8b5cf6"
            radius={[0, 8, 8, 0]}
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
