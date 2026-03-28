import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import { Sidebar } from '../components/Layout/Sidebar';
import AdminDashboard from '../components/Admin/Dashboard';
import Students from '../components/Admin/Students';
import AdminResults from '../components/Admin/Results';
import AdminSettings from '../components/Admin/Settings';
import Tests from '../components/Admin/Tests';
import TestDetail from '../components/Admin/TestDetail';

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="tests" element={<Tests />} />
            <Route path="tests/:id" element={<TestDetail />} />
            <Route path="students" element={<Students />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

