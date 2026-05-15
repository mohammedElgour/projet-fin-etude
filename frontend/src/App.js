import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';
import Hero from './components/sections/Hero';
import FilieresSection from './components/sections/FilieresSection';
import AboutIstaSection from './components/sections/AboutIstaSection';
import StatsSection from './components/sections/StatsSection';
import RoleSelection from './components/sections/RoleSelection';
import AdminLogin from './components/auth/AdminLogin';
import ProfLogin from './components/auth/ProfLogin';
import StagiaireLogin from './components/auth/StagiaireLogin';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudentsPage from './pages/AdminStudentsPage';
import AdminProfessorsPage from './pages/AdminProfessorsPage';
import AdminFilieresPage from './pages/AdminFilieresPage';
import AdminGroupesPage from './pages/AdminGroupesPage';
import AdminModulesPage from './pages/AdminModulesPage';
import AdminGradesPage from './pages/AdminGradesPage';
import AdminTimetablePage from './pages/AdminTimetablePage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import ProfesseurDashboard from './pages/ProfesseurDashboard';
import ProfesseurStudentsPage from './pages/ProfesseurStudentsPage';
import ProfesseurNotesPage from './pages/ProfesseurNotesPage';
import ProfesseurSchedulePage from './pages/ProfesseurSchedulePage';
import ProfesseurNotificationsPage from './pages/ProfesseurNotificationsPage';
import StagiaireDashboard from './pages/StagiaireDashboard';
import StagiaireNotesPage from './pages/StagiaireNotesPage';
import StagiaireSchedulePage from './pages/StagiaireSchedulePage';
import StagiaireAnnouncementsPage from './pages/StagiaireAnnouncementsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Directeur
import DirecteurDashboard from './pages/DirecteurDashboard';
import DirecteurStagiairesPage from './pages/DirecteurStagiairesPage';
import DirecteurProfesseursPage from './pages/DirecteurProfesseursPage';
import DirecteurNotesPage from './pages/DirecteurNotesPage';
import DirecteurFilieresPage from './pages/DirecteurFilieresPage';
import DirecteurEmploisDuTempsPage from './pages/DirecteurEmploisDuTempsPage';
import DirecteurNotificationsPage from './pages/DirecteurNotificationsPage';

const LandingPage = () => (

  <>
    <Hero />
    <StatsSection />
    <FilieresSection />
    <AboutIstaSection />
    <RoleSelection />
  </>
);

function App() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard/');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {!isDashboardRoute && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login/professeur" element={<ProfLogin />} />
          <Route path="/login/stagiaire" element={<StagiaireLogin />} />

          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin" />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="professors" element={<AdminProfessorsPage />} />
            <Route path="filieres" element={<AdminFilieresPage />} />
            <Route path="groupes" element={<AdminGroupesPage />} />
            <Route path="modules" element={<AdminModulesPage />} />
            <Route path="grades" element={<AdminGradesPage />} />
            <Route path="timetable" element={<AdminTimetablePage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/dashboard/professeur"
            element={
              <ProtectedRoute allowedRoles={['professeur']}>
                <DashboardLayout role="professeur" />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProfesseurDashboard />} />
            <Route path="students" element={<ProfesseurStudentsPage />} />
            <Route path="notes" element={<ProfesseurNotesPage />} />
            <Route path="schedule" element={<ProfesseurSchedulePage />} />
            <Route path="notifications" element={<ProfesseurNotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/dashboard/stagiaire"
            element={
              <ProtectedRoute allowedRoles={['stagiaire']}>
                <DashboardLayout role="stagiaire" />
              </ProtectedRoute>
            }
          >
            <Route index element={<StagiaireDashboard />} />
            <Route path="notes" element={<StagiaireNotesPage />} />
            <Route path="schedule" element={<StagiaireSchedulePage />} />
            <Route path="announcements" element={<StagiaireAnnouncementsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/dashboard/directeur"
            element={
              <ProtectedRoute allowedRoles={['directeur']}>
                <DashboardLayout role="directeur" />
              </ProtectedRoute>
            }
          >
            <Route index element={<DirecteurDashboard />} />
            <Route path="stagiaires" element={<DirecteurStagiairesPage />} />
            <Route path="professeurs" element={<DirecteurProfesseursPage />} />
            <Route path="notes" element={<DirecteurNotesPage />} />
            <Route path="filieres" element={<DirecteurFilieresPage />} />
            <Route path="timetable" element={<DirecteurEmploisDuTempsPage />} />
            <Route path="notifications" element={<DirecteurNotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>


          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
}

export default App;
