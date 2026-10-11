import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, QrCode, LogOut, Menu, X, ArrowRight, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import OnboardShopModal from './OnboardShopModal';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  const activeShopSlug = user?.current_shop?.slug || user?.shops?.[0]?.slug || 'abc-electronics';
  const activeShopName = user?.current_shop?.name || user?.shops?.[0]?.name || 'Live Store';
  const brandDestination = !user ? '/' : user.role === 'super_admin' ? '/super-admin' : ['shop_owner', 'manager'].includes(user.role) ? '/admin' : '/staff';

  return (
    <nav className="sticky top-0 z-50 bg-white/85 dark:bg-[#0B0B0C]/85 backdrop-blur-xl border-b border-slate-200 dark:border-[#27272A] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Brand Logo */}
          <Link to={brandDestination} className="flex items-center gap-2.5 group min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Shop<span className="text-blue-600 dark:text-blue-400">Flow</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Retail OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-zinc-400">
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#for-customers" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Customer Flow
            </a>
            <a href="#for-shopkeepers" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Staff & Stores
            </a>
            <a href="#shop-types" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Categories
            </a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Pricing
            </a>
            <Link
              to={`/shop/${activeShopSlug}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Customer Demo</span>
            </Link>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-3 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 transition-all"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {user?.role === 'staff' && (
                  <Link
                    to="/staff"
                    className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                  >
                    Staff Dashboard
                  </Link>
                )}
                {['shop_owner', 'manager'].includes(user?.role) && (
                  <Link
                    to="/admin"
                    className="text-xs font-semibold px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                  >
                    Owner Admin
                  </Link>
                )}
                {user?.role === 'super_admin' && (
                  <>
                    <Link
                      to="/super-admin"
                      className="text-xs font-semibold px-3 py-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                    >
                      Platform Admin
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowOnboardModal(true)}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>+ Onboard Shop</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {/* Mobile Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 transition-colors"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111113]/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-xl">
          <Link
            to={`/shop/${activeShopSlug}`}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20"
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>{activeShopName} (Customer View)</span>
          </Link>

          {!isAuthenticated && (
            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-zinc-800 text-sm font-medium text-slate-700 dark:text-zinc-300">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-2 py-1.5 hover:text-blue-600 dark:hover:text-white rounded-lg transition-colors"
              >
                How It Works
              </a>
              <a
                href="#for-customers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-2 py-1.5 hover:text-blue-600 dark:hover:text-white rounded-lg transition-colors"
              >
                For Customers
              </a>
              <a
                href="#for-shopkeepers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-2 py-1.5 hover:text-blue-600 dark:hover:text-white rounded-lg transition-colors"
              >
                For Shopkeepers
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-2 py-1.5 hover:text-blue-600 dark:hover:text-white rounded-lg transition-colors"
              >
                Pricing
              </a>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-2">
            {user?.role === 'staff' && (
              <Link
                to="/staff"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Go to Staff Dashboard
              </Link>
            )}
            {['shop_owner', 'manager'].includes(user?.role) && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Go to Owner Admin
              </Link>
            )}
            {user?.role === 'super_admin' && (
              <>
                <Link
                  to="/super-admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold"
                >
                  Platform Admin
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowOnboardModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>+ Onboard New Shop</span>
                </button>
              </>
            )}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2.5 bg-slate-100 dark:bg-zinc-900 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-800"
              >
                Sign Out ({user?.name})
              </button>
            ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-1.5"
                >
                  <span>Sign In to Staff / Admin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            )}
          </div>
        </div>
      )}

      <OnboardShopModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
      />
    </nav>
  );
}
