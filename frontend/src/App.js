import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
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
import ProfesseurDashboard from './pages/ProfesseurDashboard';
import StagiaireDashboard from './pages/StagiaireDashboard';

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <StatsSection />
              <FilieresSection />
              <AboutIstaSection />
              <RoleSelection />
            </>
          } />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login/professeur" element={<ProfLogin />} />
          <Route path="/login/stagiaire" element={<StagiaireLogin />} />

          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/professeur"
            element={
              <ProtectedRoute allowedRoles={['professeur']}>
                <ProfesseurDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/stagiaire"
            element={
              <ProtectedRoute allowedRoles={['stagiaire']}>
                <StagiaireDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={
            <>
              <Hero />
              <StatsSection />
              <FilieresSection />
              <AboutIstaSection />
              <RoleSelection />
            </>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
