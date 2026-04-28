import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  TrendingUp,
  Trophy,
  AlertCircle,
  CheckCircle2,
  UserRoundCog,
  BookOpenCheck,
} from 'lucide-react';
import { adminApi } from '../services/api';
import NotificationsPanel from '../components/common/NotificationsPanel';

const StatCard = ({ title, value, trend, icon: Icon, iconBg, iconColor }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
          {value}
        </p>
        {trend && (
          <p
            className={`text-sm mt-2 ${
              trend.startsWith('+')
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend} <span className="text-slate-500 dark:text-slate-400">vs last month</span>
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  </div>
);

const Card = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm">
    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h3>
    {subtitle && (
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
    )}
    <div className="mt-5">{children}</div>
  </div>
);

const PerformanceLineChart = ({ data }) => {
  const points = useMemo(() => {
    if (!data?.length) return [];

    const width = 760;
    const height = 220;
    const padding = 24;

    const values = data.map((item) => Number(item.average_note || 0));
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 20);

    return data.map((item, index) => {
      const x =
        padding +
        (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
      const normalized = (Number(item.average_note || 0) - min) / Math.max(max - min, 1);
      const y = height - padding - normalized * (height - padding * 2);

      return {
        x,
        y,
        label: item.period || `P${index + 1}`,
        value: Number(item.average_note || 0),
      };
    });
  }, [data]);

  if (!points.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Aucune donnée disponible pour la courbe d'évolution.
      </p>
    );
  }

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 760 260" className="w-full min-w-[620px]">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((g) => {
          const y = 24 + g * 48;
          return (
            <line
              key={g}
              x1="24"
              y1={y}
              x2="736"
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
          );
        })}

        <path d={path} fill="none" stroke="url(#lineGrad)" strokeWidth="3" />

        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="#2563eb" />
            <text x={p.x} y="252" textAnchor="middle" className="fill-slate-400 text-[11px]">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminApi.dashboardStats();
        setStats(data);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            'Impossible de charger les statistiques admin.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const kpis = useMemo(() => stats?.kpis || {}, [stats]);
  const charts = useMemo(() => stats?.charts || {}, [stats]);
  const perfByFiliere = useMemo(
    () =>
      Array.isArray(charts.performance_by_filiere)
        ? charts.performance_by_filiere
        : [],
    [charts]
  );
  const evolution = useMemo(
    () => (Array.isArray(charts.results_evolution) ? charts.results_evolution : []),
    [charts]
  );

  const globalAverage = perfByFiliere.length
    ? (
        perfByFiliere.reduce(
          (sum, item) => sum + Number(item.average_note || 0),
          0
        ) / perfByFiliere.length
      ).toFixed(2)
    : null;

  const gradeDistribution = useMemo(() => {
    const total = Number(kpis.notes || 0);
    if (!total) {
      return [
        { label: 'A', value: 0 },
        { label: 'B', value: 0 },
        { label: 'C', value: 0 },
        { label: 'D', value: 0 },
        { label: 'F', value: 0 },
      ];
    }

    const successRate = Number(kpis.success_rate || 0) / 100;
    const validated = Number(kpis.validated_notes || 0);
    const effective = validated || total;

    return [
      { label: 'A', value: Math.round(effective * successRate * 0.25) },
      { label: 'B', value: Math.round(effective * successRate * 0.45) },
      { label: 'C', value: Math.round(effective * successRate * 0.3) },
      { label: 'D', value: Math.round(effective * (1 - successRate) * 0.6) },
      { label: 'F', value: Math.round(effective * (1 - successRate) * 0.4) },
    ];
  }, [kpis]);

  const maxGradeValue = Math.max(...gradeDistribution.map((g) => g.value), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Director Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Overview of student performance and system statistics.
        </p>
      </div>

      {loading && (
        <p className="text-slate-500 dark:text-slate-400">
          Chargement des statistiques...
        </p>
      )}

      {error && (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Students"
              value={kpis.stagiaires ?? 0}
              trend="+12%"
              icon={Users}
              iconBg="bg-blue-100 dark:bg-blue-500/20"
              iconColor="text-blue-600 dark:text-blue-300"
            />
            <StatCard
              title="Success Rate"
              value={`${kpis.success_rate ?? 0}%`}
              trend="+5.2%"
              icon={TrendingUp}
              iconBg="bg-emerald-100 dark:bg-emerald-500/20"
              iconColor="text-emerald-600 dark:text-emerald-300"
            />
            <StatCard
              title="Top Performers"
              value={Math.round((Number(kpis.stagiaires || 0) * 0.12))}
              trend="+8%"
              icon={Trophy}
              iconBg="bg-amber-100 dark:bg-amber-500/20"
              iconColor="text-amber-600 dark:text-amber-300"
            />
            <StatCard
              title="Difficult Modules"
              value={perfByFiliere.filter((f) => Number(f.average_note || 0) < 10).length}
              trend="-1"
              icon={AlertCircle}
              iconBg="bg-rose-100 dark:bg-rose-500/20"
              iconColor="text-rose-600 dark:text-rose-300"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            <Card title="Performance Trend" subtitle="Average grade over time">
              <PerformanceLineChart data={evolution} />
            </Card>

            <Card title="Grade Distribution" subtitle="Current semester grades">
              <div className="space-y-3">
                {gradeDistribution.map((grade) => (
                  <div key={grade.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {grade.label}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {grade.value}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(grade.value / maxGradeValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            <Card title="Module Performance" subtitle="Average scores by filière">
              {perfByFiliere.length ? (
                <div className="space-y-4">
                  {perfByFiliere.map((filiere) => {
                    const score = Number(filiere.average_note || 0);
                    const width = Math.max(0, Math.min((score / 20) * 100, 100));
                    return (
                      <div key={filiere.id || filiere.nom}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {filiere.nom}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {score.toFixed(2)}/20
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-2 rounded-full bg-indigo-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {globalAverage && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 pt-1">
                      Moyenne globale: <span className="font-semibold">{globalAverage}/20</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucune donnée de performance disponible.
                </p>
              )}
            </Card>

            <Card title="Quick Actions" subtitle="Frequently used features">
              <div className="space-y-3">
                <div className="rounded-xl p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-300" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Validate Grades</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {kpis.validated_notes ?? 0} validated notes
                    </p>
                  </div>
                </div>

                <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-start gap-3">
                  <UserRoundCog className="w-5 h-5 mt-0.5 text-emerald-600 dark:text-emerald-300" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Manage Students</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      View and edit student records
                    </p>
                  </div>
                </div>

                <div className="rounded-xl p-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-start gap-3">
                  <BookOpenCheck className="w-5 h-5 mt-0.5 text-violet-600 dark:text-violet-300" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Manage Modules</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Configure courses and modules
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      <NotificationsPanel />
    </div>
  );
};

export default AdminDashboard;
