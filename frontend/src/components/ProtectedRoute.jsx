import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0C] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
            Authenticating ShopFlow Retail OS session...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Graceful routing to the user's primary portal if they attempt to access unauthorized paths
    if (user.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    }
    if (['shop_owner', 'manager'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'staff' || user.role === 'cashier') {
      return <Navigate to="/staff" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}
