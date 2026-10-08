import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Store, User, Lock, ArrowRight, ShieldCheck, Sparkles,
  Eye, EyeOff, Sun, Moon, ArrowLeft, CheckCircle2,
  Smartphone, MapPin, Zap, Info, Shield, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { user, login, loading, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  // If already authenticated, redirect to appropriate role portal
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'super_admin') {
        navigate('/super-admin', { replace: true });
      } else if (['shop_owner', 'manager'].includes(user.role)) {
        navigate('/admin', { replace: true });
      } else if (user.role === 'staff' || user.role === 'cashier') {
        navigate('/staff', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'staff' || res.user.role === 'cashier') {
        navigate('/staff', { replace: true });
      } else if (res.user.role === 'super_admin') {
        navigate('/super-admin', { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    } else {
      setError(res.message);
    }
  };

  const demoPresets = [
    {
      id: 'owner',
      roleName: 'Shop Owner',
      name: 'Vikram Mehta',
      email: 'shopowner@example.com',
      password: 'password',
      destination: '/admin',
      badge: 'Store Admin',
      color: 'from-purple-500/20 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      activeRing: 'ring-2 ring-purple-500/40 border-purple-500',
    },
    {
      id: 'staff',
      roleName: 'Floor Staff',
      name: 'Rahul Sharma',
      email: 'staff@example.com',
      password: 'password',
      destination: '/staff',
      badge: 'Queue Terminal',
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      activeRing: 'ring-2 ring-emerald-500/40 border-emerald-500',
    },
    {
      id: 'super_admin',
      roleName: 'Super Admin',
      name: 'Platform Owner',
      email: 'admin@shopflow.com',
      password: 'password',
      destination: '/super-admin',
      badge: 'Multi-Tenant SaaS',
      color: 'from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      activeRing: 'ring-2 ring-amber-500/40 border-amber-500',
    },
  ];

  const handleSelectPreset = (preset) => {
    setActivePreset(preset.id);
    setEmail(preset.email);
    setPassword(preset.password);
    setError('');
  };

  const handleQuickLoginPreset = async (preset) => {
    setActivePreset(preset.id);
    setEmail(preset.email);
    setPassword(preset.password);
    setError('');
    const res = await login(preset.email, preset.password);
    if (res.success) {
      navigate(preset.destination, { replace: true });
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Universal Utility Navigation */}
      <header className="w-full px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-10 shrink-0">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 group text-slate-900 dark:text-white font-extrabold text-lg sm:text-xl transition-all"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span>ShopFlow</span>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Retail OS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="text-xs font-semibold px-3 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to website</span>
            <span className="sm:hidden">Home</span>
          </Link>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#141417] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white shadow-sm hover:shadow transition-all"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Container - Responsive 2-Column Split on Desktop, Single Clean Column on Mobile */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Visual Column (Visible on Desktop & Tablet) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Next-Gen Physical Retail Platform</span>
              </div>
              <h1 className="text-3xl xl:text-4xl font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight">
                Empower Your Store Staff & Accelerate Customer Assistance
              </h1>
              <p className="text-sm xl:text-base text-slate-600 dark:text-zinc-400 leading-relaxed max-w-lg">
                Connect in-store QR scans to real-time aisle dispatching, 2D floor maps, shelf micro-locations, and inventory visibility in a single unified Retail OS.
              </p>
            </div>

            {/* Feature highlights checklist */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#131316]/70 border border-slate-200/80 dark:border-zinc-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Shop Owner Admin Console</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Inventory sync, 2D store layout designer & staff zone assignments</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#131316]/70 border border-slate-200/80 dark:border-zinc-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Floor Staff Dispatch Queue</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Turn customer QR taps into immediate aisle pick-ups and fulfillment</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#131316]/70 border border-slate-200/80 dark:border-zinc-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Enterprise Multi-Tenant SaaS</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Provision independent retail shops, manage subscriptions & global metrics</p>
                </div>
              </div>
            </div>

            {/* Live Status Indicator Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Live Showroom Engine Online</span>
              </div>
              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">API Latency ~24ms</span>
            </div>
          </div>

          {/* Right Column: Authentication Card (Mobile-first, responsive) */}
          <div className="w-full lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-md sm:max-w-lg space-y-5">
              
              {/* Card Header for Mobile View */}
              <div className="text-center lg:text-left space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Sign In to Terminal
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                  Select a pre-configured persona or enter your registered store account.
                </p>
              </div>

              {/* 1-Click Fast Persona Switcher Pills */}
              <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800/90 shadow-xl shadow-slate-200/50 dark:shadow-black/60 space-y-2.5 backdrop-blur-xl">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Quick-Select Demo Persona</span>
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">1-Click autofill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {demoPresets.map((preset) => {
                    const isSelected = activePreset === preset.id || email === preset.email;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        onDoubleClick={() => handleQuickLoginPreset(preset)}
                        className={`p-2.5 sm:p-3 rounded-2xl text-left border transition-all text-xs flex flex-col justify-between gap-1 group active:scale-97 ${
                          isSelected
                            ? `bg-slate-50 dark:bg-zinc-900/90 ${preset.activeRing} shadow-md`
                            : 'bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100/80 dark:hover:bg-zinc-800/50'
                        }`}
                        title={`Tap to fill ${preset.roleName} credentials`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-gradient-to-r ${preset.color}`}>
                            {preset.badge}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                        <div className="mt-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate text-xs">
                            {preset.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate font-mono">
                            {preset.email}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Interactive Credentials Form */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800/90 shadow-2xl shadow-slate-200/50 dark:shadow-black/80 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                      <span>Email Address</span>
                      {activePreset && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          Autofilled
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setActivePreset(null);
                        }}
                        placeholder="owner@yourstore.com"
                        className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white pl-10 pr-3.5 py-3 sm:py-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700/90 text-sm placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Password Input with Visibility Toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setActivePreset(null);
                        }}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white pl-10 pr-10 py-3 sm:py-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700/90 text-sm placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 absolute right-3 top-1/2 -translate-y-1/2"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error Notification Alert */}
                  {error && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                      <div className="flex-1">{error}</div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Sign In to Terminal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Centralized Onboarding Policy Information */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 text-[11px] text-slate-600 dark:text-zinc-400 flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Tenant Security Policy:</strong> New retail showrooms are onboarded exclusively by Platform Super Administrators.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer Branding Bar */}
      <footer className="w-full px-4 sm:px-8 py-4 sm:py-5 text-center text-xs text-slate-500 dark:text-zinc-500 shrink-0 border-t border-slate-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ShopFlow Retail OS • Enterprise Physical Retail Management</span>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/shop/abc-electronics" className="text-blue-600 dark:text-blue-400 hover:underline">
              Customer Mobile View Demo
            </Link>
            <span>•</span>
            <span className="font-mono text-slate-400 dark:text-zinc-600">v2.4 Production</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
