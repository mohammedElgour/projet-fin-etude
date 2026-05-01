import React from 'react';
import { BookOpen, TrendingUp, Info } from 'lucide-react';

const DashboardHome = () => {
  const stats = [
    { label: 'Modules', value: '12', icon: <BookOpen />, color: 'bg-blue-500' },
    { label: 'Average Grade', value: '16.45', icon: <TrendingUp />, color: 'bg-green-500' },
    { label: 'Unread Alerts', value: '03', icon: <Info />, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, Mohammed! 👋</h1>
        <p className="text-gray-500 mt-1">Check your latest updates and academic performance.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className={`${stat.color} p-4 rounded-xl text-white`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recent Grades */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Recent Results</h2>
          <div className="space-y-4">
            {[
              { mod: 'Développement Backend', mark: 18, date: '2 days ago' },
              { mod: 'Anglais Technique', mark: 15, date: 'Last week' },
              { mod: 'Conception Front-end', mark: 17, date: 'Last week' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div>
                  <p className="font-semibold text-gray-700">{item.mod}</p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold text-sm">{item.mark}/20</span>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Latest News</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 pl-4 py-2">
              <p className="font-semibold">Examen de Fin de Module</p>
              <p className="text-sm text-gray-600">The exam for "Backend Development" is scheduled for Monday, May 15th.</p>
            </div>
            <div className="border-l-4 border-amber-500 pl-4 py-2">
              <p className="font-semibold">Holiday Notice</p>
              <p className="text-sm text-gray-600">ISTA will be closed on Friday due to the national holiday.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;