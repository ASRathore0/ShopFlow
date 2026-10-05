import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, User, Lock, ArrowRight, ShieldCheck, Check, Sparkles, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OnboardShopModal from '../components/OnboardShopModal';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'staff') {
        navigate('/staff');
      } else if (res.user.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/admin');
      }
    } else {
      setError(res.message);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword, destination) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    login(demoEmail, demoPassword).then((res) => {
      if (res.success) {
        navigate(destination);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex flex-col justify-center items-center p-4 selection:bg-blue-600">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-white font-black text-2xl group">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <span>ShopFlow</span>
          </Link>
          <h2 className="text-xl font-bold text-white">Sign In to Staff & Admin Terminals</h2>
          <p className="text-xs text-zinc-400">Access your physical store queue, inventory, or platform management</p>
        </div>

        {/* 1-Click Demo Login Quick Cards */}
        <div className="bg-[#18181B] border border-blue-500/30 rounded-3xl p-4 shadow-xl space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Demo Accounts (Pre-configured)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('staff@example.com', 'password', '/staff')}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-left transition-colors"
            >
              <span className="text-[10px] font-bold text-emerald-400 uppercase block">Floor Staff</span>
              <span className="text-xs font-semibold text-white">Rahul Sharma</span>
              <span className="text-[10px] text-zinc-500 block">staff@example.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('shopowner@example.com', 'password', '/admin')}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-left transition-colors"
            >
              <span className="text-[10px] font-bold text-purple-400 uppercase block">Shop Owner</span>
              <span className="text-xs font-semibold text-white">Vikram Mehta</span>
              <span className="text-[10px] text-zinc-500 block">shopowner@example.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('admin@shopflow.com', 'password', '/super-admin')}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-left transition-colors"
            >
              <span className="text-[10px] font-bold text-amber-400 uppercase block">Super Admin</span>
              <span className="text-xs font-semibold text-white">Platform Owner</span>
              <span className="text-[10px] text-zinc-500 block">admin@shopflow.com</span>
            </button>
          </div>
        </div>

        {/* Onboarding Callout */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/40 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white">Opening a new retail store?</span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              Launch showroom catalog, QR codes & 2D layout in 60s
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOnboardModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold whitespace-nowrap shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Onboard Free</span>
          </button>
        </div>

        {/* Credentials Form */}
        <div className="bg-[#18181B] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Email Address</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-zinc-900 text-white pl-10 pr-3.5 py-3 rounded-2xl border border-zinc-700 text-xs placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 text-white pl-10 pr-3.5 py-3 rounded-2xl border border-zinc-700 text-xs placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-98 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-zinc-800/80">
            <Link to="/" className="text-xs text-zinc-400 hover:text-white transition-colors">
              ← Return to public website
            </Link>
          </div>
        </div>
      </div>

      <OnboardShopModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
      />
    </div>
  );
}
