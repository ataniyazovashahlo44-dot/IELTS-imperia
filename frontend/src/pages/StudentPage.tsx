import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import { Sidebar } from '../components/Layout/Sidebar';
import StudentDashboard from '../components/Student/Dashboard';
import MyResults from '../components/Student/MyResults';
import ResultDetail from '../components/Student/ResultDetail';
import StudentSettings from '../components/Student/Settings';
import TestTaking from '../components/Student/TestTaking';
import { useTest } from '../context/TestContext';

export default function StudentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { phase } = useTest();

  // Full-screen test mode: hide layout
  if (phase === 'in-section') {
    return (
      <Routes>
        <Route path="test" element={<TestTaking />} />
        <Route path="*" element={<Navigate to="test" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Routes>
            <Route index element={<StudentDashboard />} />
            <Route path="test" element={<TestTaking />} />
            <Route path="results" element={<MyResults />} />
            <Route path="results/:id" element={<ResultDetail />} />
            <Route path="settings" element={<StudentSettings />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
          <div className="mt-8 pt-4 pb-2 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 dark:text-gray-500">
            <p>© {new Date().getFullYear()} IELTS Imperia Mock Testing System</p>
            <p className="mt-1 sm:mt-0">Powered by <span className="font-bold text-orange-500 dark:text-orange-400 tracking-wider">TriCorp agency</span></p>
          </div>
        </main>
      </div>
    </div>
  );
}
