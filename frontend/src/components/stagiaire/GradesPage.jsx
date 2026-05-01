import React from 'react';

const GradesPage = () => {
  const grades = [
    { id: 1, module: 'Développement Front-end', grade: 17, status: 'Validated' },
    { id: 2, module: 'Bases de Données SQL', grade: 14.5, status: 'Validated' },
    { id: 3, module: 'POO avec C#', grade: 9, status: 'Not Validated' },
    { id: 4, module: 'Culture Entrepreneuriale', grade: 16, status: 'Validated' },
    { id: 5, module: 'Gestion de Projet Agile', grade: 15, status: 'Validated' },
  ];

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Academic Records</h1>
          <p className="text-gray-500">View your detailed grades for current semester.</p>
        </div>
        <div className="bg-white border px-4 py-2 rounded-lg text-sm font-medium">
          Year: 2023 - 2024
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Module</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mark (/20)</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {grades.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-800">{item.module}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold text-lg ${item.grade >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.grade}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'Validated' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradesPage;