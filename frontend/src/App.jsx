import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import CustomerPortal from './pages/CustomerPortal';
import CustomerRequestTracking from './pages/CustomerRequestTracking';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LoginPage from './pages/LoginPage';
import DemoSwitcher from './components/DemoSwitcher';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CustomerProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
            <Routes>
              {/* Marketing Website */}
              <Route path="/" element={<LandingPage />} />

              {/* Customer Mobile Experiences */}
              <Route path="/shop/:shopSlug" element={<CustomerPortal />} />
              <Route path="/shop/:shopSlug/request/:requestNumber" element={<CustomerRequestTracking />} />

              {/* Staff Portal Experience */}
              <Route path="/staff" element={<StaffDashboard />} />

              {/* Shop Owner / Manager Experience */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Super Admin Platform Experience */}
              <Route path="/super-admin" element={<SuperAdminDashboard />} />

              {/* Authentication Terminal */}
              <Route path="/login" element={<LoginPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Global Interactive Role & Persona Switcher */}
            <DemoSwitcher />
          </div>
        </CustomerProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
