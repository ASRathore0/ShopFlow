import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, QrCode, Shield, Compass, LogOut, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, quickLoginAs } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const navigate = useNavigate();

  const handleQuickDemo = async (role, destination) => {
    await quickLoginAs(role);
    setShowDemoModal(false);
    navigate(destination);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0B0C]/90 backdrop-blur-md border-b border-[#27272A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                ShopFlow
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Retail OS
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#for-customers" className="hover:text-white transition-colors">For Customers</a>
            <a href="#for-shopkeepers" className="hover:text-white transition-colors">For Shopkeepers</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/shop/abc-electronics" className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              <QrCode className="w-4 h-4" />
              Live Store Demo
            </Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => setShowDemoModal(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              Explore 3 Roles
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {user?.role === 'staff' && (
                  <Link
                    to="/staff"
                    className="text-xs font-medium px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                  >
                    Staff Dashboard
                  </Link>
                )}
                {['shop_owner', 'manager'].includes(user?.role) && (
                  <Link
                    to="/admin"
                    className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                  >
                    Owner Admin
                  </Link>
                )}
                {user?.role === 'super_admin' && (
                  <Link
                    to="/super-admin"
                    className="text-xs font-medium px-3 py-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
                  >
                    Platform Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setShowDemoModal(true)}
              className="text-xs px-2.5 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg font-medium"
            >
              Demo Roles
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-[#111113] px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/shop/abc-electronics"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-blue-400 py-2"
          >
            🏪 Open Customer Store Demo (ABC Electronics)
          </Link>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-zinc-300 py-1.5"
          >
            How It Works
          </a>
          <a
            href="#for-customers"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-zinc-300 py-1.5"
          >
            For Customers
          </a>
          <a
            href="#for-shopkeepers"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-zinc-300 py-1.5"
          >
            For Shopkeepers
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-zinc-300 py-1.5"
          >
            Pricing
          </a>
          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
            >
              Sign In to Staff / Admin
            </Link>
          </div>
        </div>
      )}

      {/* 3-Role Fast Selector Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181B] border border-zinc-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white">Explore ShopFlow Experiences</h3>
                <p className="text-xs text-zinc-400">Launch any of the 3 experiences with pre-configured demo data</p>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Customer Experience */}
              <button
                onClick={() => {
                  setShowDemoModal(false);
                  navigate('/shop/abc-electronics');
                }}
                className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 transition-all text-left group"
              >
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">1. Customer Mobile Experience</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">No App Required</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Simulate scanning shop QR code. Search catalog, select variants, and press "Show Me This Product".
                  </p>
                </div>
              </button>

              {/* Staff Experience */}
              <button
                onClick={() => handleQuickDemo('staff', '/staff')}
                className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 transition-all text-left group"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">2. Store Staff Experience</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Rahul Sharma</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Live customer request queue, exact shelf/rack navigation breadcrumb, barcode scanner, and Mark Found flow.
                  </p>
                </div>
              </button>

              {/* Shop Owner Admin Experience */}
              <button
                onClick={() => handleQuickDemo('owner', '/admin')}
                className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/50 transition-all text-left group"
              >
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">3. Shop Owner / Manager Admin</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Full Control</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Real-time queue dispatching, layout map, inventory adjustments, employee workload, and demand lost revenue reports.
                  </p>
                </div>
              </button>

              {/* Super Admin Experience */}
              <button
                onClick={() => handleQuickDemo('super_admin', '/super-admin')}
                className="flex items-start gap-4 p-3 rounded-xl bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-800/80 transition-all text-left group"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-200">ShopFlow Platform Super-Admin</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Multi-tenant</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Platform SaaS oversight: all shops, subscription plans, platform revenue, and tenant health.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
