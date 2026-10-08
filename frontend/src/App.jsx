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
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CustomerProvider>
            <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 overflow-x-hidden">
            <Routes>
              {/* Marketing Website */}
              <Route path="/" element={<LandingPage />} />

              {/* Customer Mobile Experiences */}
              <Route path="/shop/:shopSlug" element={<CustomerPortal />} />
              <Route path="/shop/:shopSlug/request/:requestNumber" element={<CustomerRequestTracking />} />

              {/* Staff Portal Experience */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={['staff', 'manager', 'shop_owner', 'super_admin', 'cashier']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Shop Owner / Manager Experience */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['shop_owner', 'manager', 'super_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Platform Experience */}
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />

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
