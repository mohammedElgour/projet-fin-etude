import React from 'react';
import { LayoutDashboard, GraduationCap, Calendar, Bell } from 'lucide-react';

const StagiaireSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'grades', label: 'My Grades', icon: <GraduationCap size={20} /> },
    { id: 'timetable', label: 'Timetable', icon: <Calendar size={20} /> },
    { id: 'announcements', label: 'Announcements', icon: <Bell size={20} /> },
  ];

  return (
    <aside className="w-64 bg-indigo-900 text-white flex-shrink-0 hidden md:flex flex-col shadow-xl">
      <div className="p-6 flex items-center space-x-3 border-b border-indigo-800">
        <div className="bg-white p-2 rounded-lg">
            <div className="w-6 h-6 bg-indigo-600 rounded-sm"></div>
        </div>
        <span className="text-xl font-bold tracking-wider uppercase">ISTA Portal</span>
      </div>

      <nav className="mt-8 flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-indigo-700 text-white shadow-lg' 
                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-indigo-800">
        <div className="bg-indigo-800 rounded-xl p-4 text-sm text-indigo-100 italic text-center">
          "Education is the most powerful weapon which you can use to change the world."
        </div>
      </div>
    </aside>
  );
};

export default StagiaireSidebar;