import React, { useState } from 'react';
import StagiaireSidebar from './StagiaireSidebar';
import StagiaireNavbar from './StagiaireNavbar';
import DashboardHome from './pages/DashboardHome';
import GradesPage from './pages/GradesPage';
import TimetablePage from './pages/TimetablePage';
import AnnouncementsPage from './pages/AnnouncementsPage';

const StagiaireDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome />;
      case 'grades': return <GradesPage />;
      case 'timetable': return <TimetablePage />;
      case 'announcements': return <AnnouncementsPage />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans antialiased text-gray-900">
      {/* Sidebar */}
      <StagiaireSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <StagiaireNavbar />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="container mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StagiaireDashboard;