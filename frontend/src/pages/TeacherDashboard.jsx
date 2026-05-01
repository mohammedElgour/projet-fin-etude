import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Clock,
  Bell,
  AlertCircle,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import {
  GradesDistributionChart,
  StudentPerformanceChart,
  StudentsPerGroupChart,
  ModulePerformanceChart,
} from '../components/dashboard/DashboardCharts';
import { RecentActivitySection } from '../components/dashboard/RecentActivitySection';
import { professeurApi, unwrapList } from '../services/api';

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageGrade: 0,
    pendingGrades: 0,
    notifications: 0,
  });
  const [students, setStudents] = useState([]);
  const [notes, setNotes] = useState([]);

  // Load all data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError('');

      try {
        const [studentsRes, notesRes, countRes] = await Promise.all([
          professeurApi.stagiaires({ per_page: 100 }),
          professeurApi.notes({ per_page: 100 }),
          professeurApi.notificationsCount(),
        ]);

        const studentData = unwrapList(studentsRes);
        const notesData = unwrapList(notesRes);

        setStudents(studentData);
        setNotes(notesData);

        // Calculate statistics
        const totalStudents = studentData.length;
        const allGrades = notesData
          .map((note) => Number(note?.note))
          .filter((grade) => Number.isFinite(grade));
        const averageGrade =
          allGrades.length > 0
            ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(2)
            : 0;
        const pendingGrades = notesData.filter(
          (note) => note.validation_status === 'pending'
        ).length;

        setStats({
          totalStudents,
          averageGrade: parseFloat(averageGrade),
          pendingGrades,
          notifications: countRes?.unread_count || 0,
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate chart data
  const gradesDistribution = useMemo(() => {
    const ranges = { '0-5': 0, '6-10': 0, '11-15': 0, '16-20': 0 };
    notes.forEach((note) => {
      const grade = Number(note?.note);
      if (Number.isFinite(grade)) {
        if (grade <= 5) ranges['0-5']++;
        else if (grade <= 10) ranges['6-10']++;
        else if (grade <= 15) ranges['11-15']++;
        else ranges['16-20']++;
      }
    });
    return Object.entries(ranges).map(([range, count]) => ({ range, count }));
  }, [notes]);

  const performanceByMonth = useMemo(() => {
    // Mock data - in production, would calculate from actual data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'];
    return months.map((month, idx) => ({
      month,
      average: 13 + Math.random() * 4,
    }));
  }, []);

  const studentsPerGroup = useMemo(() => {
    const groupCounts = {};
    students.forEach((student) => {
      const groupName = student.groupe?.nom || 'N/A';
      groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
    });
    return Object.entries(groupCounts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const modulePerformance = useMemo(() => {
    const moduleAvgs = {};
    notes.forEach((note) => {
      const grade = Number(note?.note);
      if (note.module?.nom && Number.isFinite(grade)) {
        if (!moduleAvgs[note.module.nom]) {
          moduleAvgs[note.module.nom] = { sum: 0, count: 0 };
        }
        moduleAvgs[note.module.nom].sum += grade;
        moduleAvgs[note.module.nom].count++;
      }
    });
    return Object.entries(moduleAvgs)
      .map(([module, data]) => ({
        module,
        average: (data.sum / data.count).toFixed(2),
      }))
      .slice(0, 5);
  }, [notes]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  if (error && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            <p className="text-rose-900 dark:text-rose-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Bienvenue sur votre tableau de bord
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Gérez vos étudiants, saisissez les notes et suivez les performances
        </p>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={Users}
          label="Total des étudiants"
          value={stats.totalStudents}
          subtext="étudiants"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Moyenne des notes"
          value={stats.averageGrade}
          subtext="/20"
          trend={2.5}
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Notes en attente"
          value={stats.pendingGrades}
          subtext="à valider"
          loading={loading}
        />
        <StatCard
          icon={Bell}
          label="Notifications"
          value={stats.notifications}
          subtext="non lues"
          trend={-5}
          loading={loading}
        />
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <GradesDistributionChart data={gradesDistribution} loading={loading} />
        <StudentPerformanceChart data={performanceByMonth} loading={loading} />
        <StudentsPerGroupChart data={studentsPerGroup} loading={loading} />
        <ModulePerformanceChart data={modulePerformance} loading={loading} />
      </motion.div>

      {/* Recent Activity */}
      <RecentActivitySection loading={loading} />

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <a
          href="/professeur/stagiaires"
          className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3 w-fit mb-3">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Voir les étudiants
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gérez la liste des stagiaires
          </p>
        </a>

        <a
          href="/professeur/notes"
          className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-3 w-fit mb-3">
            <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
            Saisir les notes
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Ajoutez ou modifiez des notes
          </p>
        </a>

        <a
          href="/professeur/emploi"
          className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-3 w-fit mb-3">
            <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            Emploi du temps
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Consultez votre calendrier
          </p>
        </a>
      </motion.div>
    </motion.div>
  );
};

export default TeacherDashboard;
