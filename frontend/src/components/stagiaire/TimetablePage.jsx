import React from 'react';
import { Download, FileText } from 'lucide-react';

const TimetablePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 text-shadow-sm">Emploi du Temps</h1>
        <button className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200">
          <Download size={18} />
          <span>Download PDF</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-gray-50 w-full rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center">
           {/* This would be an image or a table. Rendering a placeholder grid for UI purposes */}
           <div className="grid grid-cols-6 gap-2 w-full">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
              ))}
           </div>
           <div className="mt-8 flex flex-col items-center text-gray-500">
              <FileText size={48} className="text-indigo-200 mb-4" />
              <p className="font-medium text-lg text-gray-700">Spring Semester Schedule - Group DEVWFS202</p>
              <p className="text-sm">Last updated: May 01, 2024</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;

--- /dev/null
+++ b/Apache24/htdocs/Projet de fin d'etude/frontend/src/components/Stagiaire/pages/AnnouncementsPage.jsx
@@ -0,0 +1,41 @@
+import React from 'react';
+import { Calendar, Tag } from 'lucide-react';
+
+const AnnouncementsPage = () => {
+  const alerts = [
+    { id: 1, title: 'Exam Registration Opening', date: 'May 05, 2024', cat: 'Academic', desc: 'Please ensure you register for the end-of-year exams via the portal before the 15th of May.', color: 'text-blue-600 bg-blue-50' },
+    { id: 2, title: 'Absence Policy Update', date: 'April 28, 2024', cat: 'Administration', desc: 'A reminder that three unexcused absences in a module will lead to immediate disqualification.', color: 'text-red-600 bg-red-50' },
+    { id: 3, title: 'New Career Workshop', date: 'April 20, 2024', cat: 'Event', desc: 'Join us for a web development career path seminar this Saturday at the main amphitheater.', color: 'text-green-600 bg-green-50' },
+  ];
+
+  return (
+    <div className="space-y-6">
+      <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
+      
+      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
+        {alerts.map((alert) => (
+          <div key={alert.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
+            <div className="flex justify-between items-start mb-4">
+              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${alert.color}`}>
+                {alert.cat}
+              </span>
+              <div className="flex items-center text-gray-400 text-xs">
+                <Calendar size={14} className="mr-1" />
+                {alert.date}
+              </div>
+            </div>
+            <h3 className="text-lg font-bold text-gray-800 mb-2">{alert.title}</h3>
+            <p className="text-gray-600 text-sm leading-relaxed">{alert.desc}</p>
+            <div className="mt-4 pt-4 border-t border-gray-50">
+              <button className="text-indigo-600 font-semibold text-sm hover:underline">
+                Read full details →
+              </button>
+            </div>
+          </div>
+        ))}
+      </div>
+    </div>
+  );
+};
+
+export default AnnouncementsPage;