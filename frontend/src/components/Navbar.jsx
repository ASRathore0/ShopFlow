import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store, User, QrCode, Shield, Compass, LogOut, Menu, X,
  ArrowRight, Sun, Moon, ChevronDown, ChevronRight, Smartphone, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import OnboardShopModal from './OnboardShopModal';

export default function Navbar() {
  const { user, isAuthenticated, logout, quickLoginAs } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(null);
  const navRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setShowRoleDropdown(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setShowRoleDropdown(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const activeShopSlug = user?.current_shop?.slug || user?.shops?.[0]?.slug || 'abc-electronics';
  const activeShopName = user?.current_shop?.name || user?.shops?.[0]?.name || 'Live Store';
  const brandDestination = !user ? '/' : user.role === 'super_admin' ? '/super-admin' : ['shop_owner', 'manager'].includes(user.role) ? '/admin' : '/staff';

  const handleQuickDemo = async (role, destination) => {
    setShowRoleDropdown(false);
    setMobileMenuOpen(false);

    // If user is already authenticated, navigate without overwriting their real session!
    if (user) {
      if (role === 'customer') {
        navigate(`/shop/${activeShopSlug}`);
        return;
      }
      if (['shop_owner', 'manager', 'super_admin'].includes(user.role)) {
        if (role === 'staff' || role === 'owner' || role === 'super_admin') {
          navigate(destination);
          return;
        }
      }
      if (['staff', 'cashier'].includes(user.role)) {
        if (role === 'staff') {
          navigate('/staff');
          return;
        }
      }
    }

    if (role === 'customer') {
      navigate(`/shop/${activeShopSlug}`);
      return;
    }

    try {
      setSwitchingRole(role);
      await quickLoginAs(role);
    } catch (err) {
      console.error('Error switching role:', err);
    } finally {
      setSwitchingRole(null);
      navigate(destination);
    }
  };

  const roleExperiences = [
    {
      id: 'customer',
      role: 'customer',
      destination: `/shop/${activeShopSlug}`,
      title: 'Customer Mobile View',
      badge: activeShopName,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      description: `Scan QR, search catalog for ${activeShopName}`,
      icon: Smartphone,
      iconColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      hoverBorder: 'hover:border-blue-500/40 hover:bg-blue-50/50 dark:hover:bg-blue-500/10',
    },
    {
      id: 'staff',
      role: 'staff',
      destination: '/staff',
      title: 'Store Staff Portal',
      badge: 'Floor Queue',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      description: `Real-time queue & retrieval for ${activeShopName}`,
      icon: User,
      iconColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10',
    },
    {
      id: 'owner',
      role: 'owner',
      destination: '/admin',
      title: 'Shop Owner Admin',
      badge: 'Management',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      description: `Catalog, layout, inventory & orders for ${activeShopName}`,
      icon: Store,
      iconColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      hoverBorder: 'hover:border-purple-500/40 hover:bg-purple-50/50 dark:hover:bg-purple-500/10',
    },
    {
      id: 'super_admin',
      role: 'super_admin',
      destination: '/super-admin',
      title: 'Platform Super-Admin',
      badge: 'Multi-Tenant',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      description: 'Global SaaS management, tenant shops, plans & metrics',
      icon: Shield,
      iconColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-500/10',
    },
  ];

  const filteredExperiences = roleExperiences.filter((item) => {
    if (item.id === 'super_admin') {
      return user?.role === 'super_admin';
    }
    if (item.id === 'owner') {
      if (user && ['staff', 'cashier'].includes(user.role)) return false;
      return true;
    }
    return true;
  });

  return (
    <nav ref={navRef} className="sticky top-0 z-50 bg-white/85 dark:bg-[#0B0B0C]/85 backdrop-blur-xl border-b border-slate-200 dark:border-[#27272A] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Brand Logo */}
          <Link to={brandDestination} className="flex items-center gap-2.5 group min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                ShopFlow
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                Retail OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-7 text-sm font-medium text-slate-600 dark:text-zinc-400">
            {isAuthenticated ? (
              <>
                {user?.role === 'super_admin' && (
                  <Link to="/super-admin" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-semibold">
                    Super Admin
                  </Link>
                )}
                {['shop_owner', 'manager', 'super_admin'].includes(user?.role) && (
                  <Link to="/admin" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-semibold">
                    Store Admin
                  </Link>
                )}
                <Link to="/staff" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold">
                  Staff Queue
                </Link>
                <Link
                  to={`/shop/${activeShopSlug}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{activeShopName} Showroom</span>
                </Link>
              </>
            ) : (
              <>
                <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-white transition-colors">How It Works</a>
                <a href="#for-customers" className="hover:text-blue-600 dark:hover:text-white transition-colors">For Customers</a>
                <a href="#for-shopkeepers" className="hover:text-blue-600 dark:hover:text-white transition-colors">For Shopkeepers</a>
                <a href="#pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors">Pricing</a>
                <Link to={`/shop/${activeShopSlug}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors">
                  <QrCode className="w-4 h-4" />
                  Live Store Demo
                </Link>
              </>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
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

            {/* Desktop In-Header Role Switcher Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className={`text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border shadow-sm ${
                  showRoleDropdown
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 ring-2 ring-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                }`}
                aria-expanded={showRoleDropdown}
              >
                <Compass className={`w-3.5 h-3.5 ${showRoleDropdown ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                <span>Switch Experience</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRoleDropdown ? 'rotate-180 text-white' : 'text-slate-400 dark:text-zinc-500'}`} />
              </button>

              {/* Desktop Dropdown Popover */}
              {showRoleDropdown && (
                <div className="absolute right-0 top-full mt-2.5 w-[390px] rounded-2xl bg-white dark:bg-[#151518] border border-slate-200 dark:border-zinc-700/80 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                        Interactive Experiences
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      1-Click Fast Launch
                    </span>
                  </div>

                  <div className="p-2 space-y-1.5">
                    {filteredExperiences.map((item) => {
                      const Icon = item.icon;
                      const isLoading = switchingRole === item.role;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={switchingRole !== null}
                          onClick={() => handleQuickDemo(item.role, item.destination)}
                          className={`w-full p-2.5 rounded-xl border border-transparent text-left flex items-center gap-3 transition-all group ${item.hoverBorder} ${isLoading ? 'opacity-70 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                          <div className={`p-2 rounded-xl border shrink-0 group-hover:scale-105 transition-transform ${item.iconColor}`}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Icon className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {item.title}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border whitespace-nowrap ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>

                  {user ? (
                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                      <span className="truncate max-w-[200px]">Active: <strong className="text-slate-800 dark:text-zinc-200">{user.name}</strong></span>
                      <button type="button" onClick={logout} className="text-red-500 hover:text-red-600 dark:text-red-400 font-semibold text-[11px]">
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30 text-center text-[10px] text-slate-500 dark:text-zinc-400">
                      Instant simulation with pre-configured mock store data
                    </div>
                  )}
                </div>
              )}
            </div>

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
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
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

            {/* Mobile Header Experience Switcher Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowRoleDropdown(!showRoleDropdown);
                if (mobileMenuOpen) setMobileMenuOpen(false);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 whitespace-nowrap transition-all border ${
                showRoleDropdown
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
              }`}
              aria-expanded={showRoleDropdown}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>Roles</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showRoleDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (showRoleDropdown) setShowRoleDropdown(false);
              }}
              className="p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Role Switcher Dropdown (Anchored directly under header) */}
      {showRoleDropdown && (
        <div className="md:hidden border-b border-slate-200 dark:border-zinc-800 bg-white/98 dark:bg-[#111113]/98 backdrop-blur-2xl px-3.5 py-3 space-y-2 animate-fade-in shadow-2xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Switch Experience
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowRoleDropdown(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            {filteredExperiences.map((item) => {
              const Icon = item.icon;
              const isLoading = switchingRole === item.role;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={switchingRole !== null}
                  onClick={() => handleQuickDemo(item.role, item.destination)}
                  className={`w-full p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 text-left flex items-center gap-3 transition-all ${item.hoverBorder} active:scale-98 ${isLoading ? 'opacity-70 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className={`p-2 rounded-xl border shrink-0 ${item.iconColor}`}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border whitespace-nowrap ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>

          {user && (
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span className="truncate max-w-[180px]">User: {user.name}</span>
              <button type="button" onClick={logout} className="text-red-500 hover:text-red-600 dark:text-red-400 font-semibold text-xs">
                Logout
              </button>
            </div>
          )}
        </div>
      )}

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

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickDemo('staff', '/staff')}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-200 text-left flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{user ? 'Staff Queue' : 'Staff Demo'}</span>
            </button>
            {(!user || ['shop_owner', 'manager', 'super_admin'].includes(user?.role)) && (
              <button
                type="button"
                onClick={() => handleQuickDemo('owner', '/admin')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-200 text-left flex items-center gap-2"
              >
                <Store className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>{user ? 'Store Admin' : 'Owner Admin'}</span>
              </button>
            )}
          </div>

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
            {user?.role === 'super_admin' && (
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
