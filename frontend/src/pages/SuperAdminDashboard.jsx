import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Store, Users, DollarSign, TrendingUp, CheckCircle2,
  Plus, Search, ArrowRight, BarChart3, AlertCircle, Building, Layers,
  ExternalLink, Filter, X, ArrowLeft, Sun, Moon, LogOut, Package
} from 'lucide-react';
import { superAdminService } from '../services/superAdminService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SuperAdminDashboard() {
  const { user, quickLoginAs, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  const [shops, setShops] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopType, setNewShopType] = useState('electronics');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Auto-login as super_admin if needed
  useEffect(() => {
    async function init() {
      if (!user || user.role !== 'super_admin') {
        await quickLoginAs('super_admin');
      }
    }
    init();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, shopsRes, plansRes] = await Promise.all([
        superAdminService.getDashboard(),
        superAdminService.getShops(),
        superAdminService.getPlans(),
      ]);
      if (dashRes && dashRes.data) setData(dashRes.data);
      if (shopsRes && shopsRes.data) setShops(shopsRes.data || []);
      if (plansRes && plansRes.data) {
        setPlans(plansRes.data || []);
        if (plansRes.data.length > 0) setSelectedPlanId(plansRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateShop = async (e) => {
    e.preventDefault();
    try {
      await superAdminService.createShop({
        name: newShopName,
        shop_type: newShopType,
        email: newShopEmail,
        plan_id: selectedPlanId,
      });
      setShowCreateShop(false);
      setNewShopName('');
      setNewShopEmail('');
      loadData();
    } catch (err) {
      alert('Could not onboard shop. Please try again.');
    }
  };

  const metrics = data?.metrics || {
    total_shops: 2,
    active_shops: 2,
    total_customers: 42,
    requests_today: 18,
    active_staff: 6,
    monthly_revenue: 3840.00,
    total_users: 5,
  };

  // Filtered shops
  const filteredShops = shops.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || s.shop_type.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Top Mobile-Friendly Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B0B0C]/90 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to="/"
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              title="Return to Marketing Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  Platform Super-Admin
                </span>
                <span className="hidden xs:inline-flex text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                  Multi-Tenant
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 transition-colors"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* User status & Logout */}
            {user && (
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-200 dark:border-zinc-800 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCreateShop(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Onboard Shop</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Banner Section */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/10 via-blue-500/5 to-purple-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
              SaaS Oversight & Physical Store Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Manage retail tenants, monitor multi-store customer traffic, and track platform subscription metrics.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              All Systems Operational
            </span>
          </div>
        </div>

        {/* Platform Metrics Grid - Responsive for mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Registered Shops */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">Total Shops</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Store className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.total_shops}
            </div>
            <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold block truncate">
              {metrics.active_shops} operating
            </span>
          </div>

          {/* Platform Monthly ARR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">Monthly ARR</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ${metrics.monthly_revenue.toFixed(2)}
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 block truncate">
              Recurring volume
            </span>
          </div>

          {/* Shopper Sessions Today */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">Today's Scans</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {metrics.requests_today}
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 block truncate">
              In-store requests
            </span>
          </div>

          {/* Floor Staff Online */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">Staff Online</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {metrics.active_staff}
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 block truncate">
              Active floor crew
            </span>
          </div>
        </div>

        {/* Shop Growth Chart */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Platform Retail Request Volume (Monthly)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Aggregate customer requests served across all enrolled physical retail stores
              </p>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.shop_growth || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272A' : '#E2E8F0'} />
                <XAxis dataKey="month" stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={10} />
                <YAxis stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                    borderColor: isDark ? '#3F3F46' : '#CBD5E1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="requests" name="Total Customer Requests" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrolled Shops Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Enrolled Physical Retail Tenants
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {filteredShops.length} of {shops.length} total stores
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search store name or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing & Fashion</option>
                <option value="footwear">Footwear</option>
                <option value="hardware">Hardware</option>
              </select>
            </div>
          </div>

          {/* MOBILE VIEW: Responsive Cards (Visible on phones & small tablets) */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredShops.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800">
                No stores match your search criteria.
              </div>
            ) : (
              filteredShops.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                        slug: {s.slug}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      Active
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] capitalize font-medium">
                      {s.shop_type}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20">
                      {s.subscription?.plan?.name || 'Growth ($129)'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-zinc-800">
                    <span>{s.products_count || 8} items</span>
                    <span>•</span>
                    <span>{s.employees_count || 3} staff members</span>
                  </div>

                  <div className="pt-1">
                    <a
                      href={`/shop/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Visit Live Store</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* TABLET & DESKTOP VIEW: Full Responsive Table */}
          <div className="hidden sm:block bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Shop Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Subscription Plan</th>
                    <th className="p-3.5">Products / Staff</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Store Portal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {filteredShops.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 dark:text-zinc-500">
                        No stores found.
                      </td>
                    </tr>
                  ) : (
                    filteredShops.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <div>{s.name}</div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">slug: {s.slug}</span>
                        </td>
                        <td className="p-3.5 capitalize text-slate-700 dark:text-zinc-300">{s.shop_type}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 whitespace-nowrap">
                            {s.subscription?.plan?.name || 'Growth ($129)'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                          {s.products_count || 8} products • {s.employees_count || 3} staff
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                            Active
                          </span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <a
                            href={`/shop/${s.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center justify-end gap-1 transition-colors"
                          >
                            <span>Visit Shop</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Onboard Shop Modal - Fully Responsive */}
      {showCreateShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Onboard New Retail Tenant</h3>
              <button
                type="button"
                onClick={() => setShowCreateShop(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Shop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hardware & Tools"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Store Type</label>
                <select
                  value={newShopType}
                  onChange={(e) => setNewShopType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="electronics">Consumer Electronics</option>
                  <option value="clothing">Clothing & Apparel</option>
                  <option value="footwear">Footwear & Sneakers</option>
                  <option value="furniture">Furniture & Decor</option>
                  <option value="cosmetics">Cosmetics & Beauty</option>
                  <option value="hardware">Hardware & Tools</option>
                  <option value="grocery">Grocery & Organics</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Owner Email</label>
                <input
                  type="email"
                  required
                  placeholder="owner@store.com"
                  value={newShopEmail}
                  onChange={(e) => setNewShopEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Subscription Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.price}/month
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateShop(false)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  Create Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
