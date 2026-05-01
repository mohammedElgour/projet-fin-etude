import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MainLayout from './components/layout/MainLayout';
import Hero from './components/sections/Hero';
import RoleSelection from './components/sections/RoleSelection';
import AdminLogin from './components/auth/AdminLogin';
import ProfLogin from './components/auth/ProfLogin';
import StagiaireLogin from './components/auth/StagiaireLogin';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import FiliereDetailPage from './pages/FiliereDetailPage';
import FilieresPage from './pages/FilieresPage';
import GroupeDetailPage from './pages/GroupeDetailPage';
import GroupesPage from './pages/GroupesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import ModulesPage from './pages/ModulesPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfesseurDetailPage from './pages/ProfesseurDetailPage';
import ProfesseursPage from './pages/ProfesseursPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StatisticsPage from './pages/StatisticsPage';
import StagiaireDashboard from './pages/StagiaireDashboard';
import StagiaireProfilePage from './pages/StagiaireProfilePage';
import StagiairesPage from './pages/StagiairesPage';
import StagiaireGradesPage from './pages/StagiaireGradesPage';
import StagiaireTimetablePage from './pages/StagiaireTimetablePage';
import StagiaireAnnouncementsPage from './pages/StagiaireAnnouncementsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import TimetablesPage from './pages/TimetablesPage';
import ProfStagiairesPage from './pages/ProfStagiairesPage';
import ProfNotesPage from './pages/ProfNotesPage';
import ProfEmploiPage from './pages/ProfEmploiPage';
import ProfNotificationsPage from './pages/ProfNotificationsPage';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-white dark:bg-slate-950">
            <Navbar />
            <main>
              <Hero />
              <RoleSelection />
            </main>
            <Footer />
          </div>
        }
      />
      <Route
        path="/login/admin"
        element={
          <div className="min-h-screen bg-white dark:bg-slate-950">
            <Navbar />
            <main>
              <AdminLogin />
            </main>
            <Footer />
          </div>
        }
      />
      <Route
        path="/login/professeur"
        element={
          <div className="min-h-screen bg-white dark:bg-slate-950">
            <Navbar />
            <main>
              <ProfLogin />
            </main>
            <Footer />
          </div>
        }
      />
      <Route
        path="/login/stagiaire"
        element={
          <div className="min-h-screen bg-white dark:bg-slate-950">
            <Navbar />
            <main>
              <StagiaireLogin />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/admin/filieres" element={<FilieresPage />} />
        <Route path="/admin/filieres/:id" element={<FiliereDetailPage />} />
        <Route path="/admin/modules" element={<ModulesPage />} />
        <Route path="/admin/modules/:id" element={<ModuleDetailPage />} />
        <Route path="/admin/groupes" element={<GroupesPage />} />
        <Route path="/admin/groupes/:id" element={<GroupeDetailPage />} />
        <Route path="/admin/stagiaires" element={<StagiairesPage />} />
        <Route path="/admin/stagiaires/:id" element={<StagiaireProfilePage />} />
        <Route path="/admin/professeurs" element={<ProfesseursPage />} />
        <Route path="/admin/professeurs/:id" element={<ProfesseurDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/timetables" element={<TimetablesPage />} />
        <Route path="/dashboard/admin" element={<Navigate to="/dashboard" replace />} />
        <Route path="/filieres" element={<Navigate to="/admin/filieres" replace />} />
        <Route path="/modules" element={<Navigate to="/admin/modules" replace />} />
        <Route path="/groupes" element={<Navigate to="/admin/groupes" replace />} />
        <Route path="/stagiaires" element={<Navigate to="/admin/stagiaires" replace />} />
        <Route path="/teachers" element={<Navigate to="/admin/professeurs" replace />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'professeur', 'stagiaire']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['professeur']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/professeur" element={<TeacherDashboard />} />
        <Route path="/professeur/stagiaires" element={<ProfStagiairesPage />} />
        <Route path="/professeur/notes" element={<ProfNotesPage />} />
        <Route path="/professeur/emploi" element={<ProfEmploiPage />} />
        <Route path="/professeur/notifications" element={<ProfNotificationsPage />} />
        <Route path="/dashboard/professeur" element={<Navigate to="/professeur" replace />} />
      </Route>
      
      <Route path="/professeur/*" element={<Navigate to="/professeur" replace />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={['stagiaire']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard/stagiaire" element={<StagiaireDashboard />} />
        <Route path="/stagiaire/grades" element={<StagiaireGradesPage />} />
        <Route path="/stagiaire/timetable" element={<StagiaireTimetablePage />} />
        <Route path="/stagiaire/announcements" element={<StagiaireAnnouncementsPage />} />
      </Route>

      <Route
        path="*"
        element={
          <div className="min-h-screen bg-white dark:bg-slate-950">
            <Navbar />
            <main>
              <Hero />
              <RoleSelection />
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}

export default App;
