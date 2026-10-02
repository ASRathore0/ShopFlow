import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Smartphone, UserCheck, ShieldCheck, Compass, X, ChevronUp, Store, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DemoSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, quickLoginAs, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSelect = async (role, path) => {
    setIsOpen(false);
    if (role === 'customer') {
      navigate('/shop/abc-electronics');
      return;
    }
    if (role === 'public') {
      navigate('/');
      return;
    }
    await quickLoginAs(role);
    navigate(path);
  };

  return (
    <div className="fixed top-16 right-3 sm:top-auto sm:bottom-4 sm:right-4 z-30 sm:z-50">
      {isOpen ? (
        <div className="bg-[#18181B] border border-blue-500/50 rounded-2xl p-4 shadow-2xl w-72 space-y-3 animate-fade-in backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>ShopFlow Interactive Demo</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-zinc-400">
            Instant 1-click switch between all 3 platform experiences:
          </p>

          <div className="space-y-1.5">
            {/* Customer */}
            <button
              onClick={() => handleRoleSelect('customer', '/shop/abc-electronics')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                location.pathname.startsWith('/shop')
                  ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div>1. Customer Mobile View</div>
                <div className="text-[10px] text-zinc-500">Scan QR & request item</div>
              </div>
            </button>

            {/* Staff */}
            <button
              onClick={() => handleRoleSelect('staff', '/staff')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                location.pathname.startsWith('/staff')
                  ? 'border-emerald-500 bg-emerald-500/10 text-white font-semibold'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div>2. Staff Queue (Rahul)</div>
                <div className="text-[10px] text-zinc-500">Micro-location & Mark Found</div>
              </div>
            </button>

            {/* Shop Owner */}
            <button
              onClick={() => handleRoleSelect('owner', '/admin')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                location.pathname.startsWith('/admin')
                  ? 'border-purple-500 bg-purple-500/10 text-white font-semibold'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Store className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div>3. Shop Owner Admin</div>
                <div className="text-[10px] text-zinc-500">Inventory, layouts, analytics</div>
              </div>
            </button>

            {/* Super Admin */}
            <button
              onClick={() => handleRoleSelect('super_admin', '/super-admin')}
              className={`w-full p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                location.pathname.startsWith('/super-admin')
                  ? 'border-amber-500 bg-amber-500/10 text-white font-semibold'
                  : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px]">
                <div>4. Super Admin (Multi-tenant)</div>
              </div>
            </button>

            {/* Public Landing */}
            <button
              onClick={() => handleRoleSelect('public', '/')}
              className={`w-full p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                location.pathname === '/'
                  ? 'border-zinc-600 bg-zinc-800 text-white font-semibold'
                  : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px]">
                <div>Public Marketing Site</div>
              </div>
            </button>
          </div>

          {user && (
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="truncate max-w-[140px]">User: {user.name}</span>
              <button onClick={logout} className="text-red-400 hover:text-red-300 font-medium">
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 sm:px-3.5 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-xl shadow-blue-500/30 flex items-center gap-1.5 border border-blue-400/30 hover:scale-105 active:scale-95 transition-all"
          title="Switch Demo Experience"
        >
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span className="hidden sm:inline">Switch Experience</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
