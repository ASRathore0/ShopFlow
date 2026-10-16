import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Store, Users, DollarSign, TrendingUp, CheckCircle2,
  Plus, Search, ArrowRight, BarChart3, AlertCircle, Building, Layers,
  ExternalLink, Filter, X, ArrowLeft, Sun, Moon, LogOut, Package, RefreshCw,
  Edit3, Trash2, Zap, KeyRound, Power, Check, MoreVertical, Sparkles, AlertTriangle
} from 'lucide-react';
import { superAdminService } from '../services/superAdminService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import OnboardShopModal from '../components/OnboardShopModal';
import EditShopModal from '../components/EditShopModal';
import ManagePlanModal from '../components/ManagePlanModal';
import DeleteShopModal from '../components/DeleteShopModal';
import ResetOwnerPasswordModal from '../components/ResetOwnerPasswordModal';

export default function SuperAdminDashboard() {
  const { user, switchShop } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [shops, setShops] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, suspended
  const [showCreateShop, setShowCreateShop] = useState(false);

  // Shop action modal targets
  const [editShop, setEditShop] = useState(null);
  const [planShop, setPlanShop] = useState(null);
  const [deleteShop, setDeleteShop] = useState(null);
  const [resetPassShop, setResetPassShop] = useState(null);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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
      if (plansRes && plansRes.data) setPlans(plansRes.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load super admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManageShop = async (shop) => {
    try {
      await switchShop(shop.id);
      navigate('/admin');
    } catch (err) {
      console.error('Failed to switch shop:', err);
      showToast('Could not switch to store context', 'error');
    }
  };

  const handleToggleStatus = async (shop) => {
    try {
      const res = await superAdminService.toggleShopStatus(shop.id);
      if (res && res.status === 'success') {
        showToast(res.message);
        loadData();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update store status', 'error');
    }
  };

  const metrics = data?.metrics || {
    total_shops: shops.length || 0,
    active_shops: shops.filter((s) => s.is_active).length || 0,
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
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.is_active) ||
      (statusFilter === 'suspended' && !s.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-zinc-100 font-sans transition-colors duration-200 pb-16">
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
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate hidden sm:block">
                ShopFlow Central Cloud Governance & Store Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Onboard New Store Button */}
            <button
              onClick={() => setShowCreateShop(true)}
              className="py-2 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Onboard Store</span>
              <span className="xs:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Total Stores
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {metrics.total_shops}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                {metrics.active_shops} Active
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Platform Revenue
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                ₹{parseFloat(metrics.monthly_revenue).toFixed(0)}
              </p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 mt-1">
                <TrendingUp className="w-3 h-3" />
                Monthly Subscriptions
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Customer Visits
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {metrics.total_customers}
              </p>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5 mt-1">
                <Users className="w-3 h-3" />
                Shoppers Served
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Requests Today
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {metrics.requests_today}
              </p>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 mt-1">
                <Sparkles className="w-3 h-3" />
                Floor Inquiries
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Multi-Tenant Stores Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Manage Stores & Tenants</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  {filteredShops.length} of {shops.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Edit store configurations, upgrade/downgrade subscription tiers, toggle active status, and administer merchants.
              </p>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-56 min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search store name, slug..."
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

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing & Fashion</option>
                <option value="footwear">Footwear</option>
                <option value="groceries">Groceries</option>
                <option value="furniture">Furniture</option>
                <option value="general">General Retail</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>

              {/* Reload */}
              <button
                type="button"
                onClick={loadData}
                title="Refresh Stores List"
                className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* MOBILE VIEW: High Performance Responsive Cards */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredShops.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800">
                No stores match your search criteria.
              </div>
            ) : (
              filteredShops.map((s) => {
                const planName = s.subscription?.plan?.name || 'No Plan';
                const planPrice = s.subscription?.plan?.price ? `₹${parseFloat(s.subscription.plan.price).toFixed(0)}` : 'Free';

                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                          /shop/{s.slug}
                        </div>
                      </div>

                      {/* Status Toggle Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(s)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 shrink-0 ${
                          s.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                        title="Click to toggle store active/suspended"
                      >
                        <Power className="w-2.5 h-2.5" />
                        <span>{s.is_active ? 'Active' : 'Suspended'}</span>
                      </button>
                    </div>

                    {/* Metadata & Plan Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] capitalize font-medium">
                        {s.shop_type || 'General'}
                      </span>

                      {/* Plan with upgrade trigger */}
                      <button
                        type="button"
                        onClick={() => setPlanShop(s)}
                        className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20 flex items-center gap-1 transition-all"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{planName} ({planPrice})</span>
                        <span className="text-[9px] underline ml-0.5">Change</span>
                      </button>
                    </div>

                    {/* Live Stats */}
                    <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
                      <span>{s.products_count || 0} items</span>
                      <span>•</span>
                      <span>{s.employees_count || 0} staff</span>
                      <span>•</span>
                      <span>{s.customer_requests_count || 0} requests</span>
                    </div>

                    {/* Main Nav Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleManageShop(s)}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Admin Panel</span>
                      </button>
                      <a
                        href={`/shop/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Storefront</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Management Toolbar (Edit, Plan, Reset Pass, Delete) */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setEditShop(s)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                        title="Edit Store Details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlanShop(s)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                        title="Upgrade or Downgrade Subscription"
                      >
                        <Zap className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Plan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResetPassShop(s)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                        title="Reset Owner Password"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        <span>Password</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteShop(s)}
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                        title="Delete Store"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TABLET & DESKTOP VIEW: Full Responsive Professional Table */}
          <div className="hidden sm:block bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Store Identity</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Subscription Plan</th>
                    <th className="p-4">Catalog / Activity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Administrative Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {filteredShops.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-slate-400 dark:text-zinc-500">
                        No stores found matching your query. Click "Onboard Store" to register one.
                      </td>
                    </tr>
                  ) : (
                    filteredShops.map((s) => {
                      const planName = s.subscription?.plan?.name || 'No Plan';
                      const planPrice = s.subscription?.plan?.price ? `₹${parseFloat(s.subscription.plan.price).toFixed(0)}` : 'Free';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          {/* Store Name & Slug */}
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                  {s.name}
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                  /shop/{s.slug}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 capitalize font-medium text-[11px]">
                              {s.shop_type || 'General'}
                            </span>
                          </td>

                          {/* Subscription Plan & Change Button */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 whitespace-nowrap text-[11px]">
                                {planName} ({planPrice})
                              </span>
                              <button
                                type="button"
                                onClick={() => setPlanShop(s)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                title="Upgrade or Downgrade Subscription Plan"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Catalog & Staff Counts */}
                          <td className="p-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 dark:text-zinc-200">
                              {s.products_count || 0} products • {s.employees_count || 0} staff
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                              {s.customer_requests_count || 0} customer requests
                            </div>
                          </td>

                          {/* Status Toggle Switch */}
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(s)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                s.is_active
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20'
                              }`}
                              title="Click to toggle store active/suspended"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span>{s.is_active ? 'Active' : 'Suspended'}</span>
                            </button>
                          </td>

                          {/* Action Buttons Toolbar */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Manage Shop Admin */}
                              <button
                                type="button"
                                onClick={() => handleManageShop(s)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                                title="Switch context into Store Admin"
                              >
                                <Store className="w-3.5 h-3.5" />
                                <span>Manage</span>
                              </button>

                              {/* Live Storefront Link */}
                              <a
                                href={`/shop/${s.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
                                title="Open Live Customer Storefront"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                              </a>

                              {/* Edit Shop Details */}
                              <button
                                type="button"
                                onClick={() => setEditShop(s)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
                                title="Edit Store Details"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-200" />
                              </button>

                              {/* Reset Owner Password */}
                              <button
                                type="button"
                                onClick={() => setResetPassShop(s)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
                                title="Reset Merchant Owner Password"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                              </button>

                              {/* Delete Store */}
                              <button
                                type="button"
                                onClick={() => setDeleteShop(s)}
                                className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                                title="Permanently Delete Store"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Onboard New Shop Modal */}
      <OnboardShopModal
        isOpen={showCreateShop}
        onClose={() => {
          setShowCreateShop(false);
          loadData();
        }}
      />

      {/* Edit Shop Modal */}
      <EditShopModal
        isOpen={Boolean(editShop)}
        shop={editShop}
        onClose={() => setEditShop(null)}
        onSuccess={(updatedShop, msg) => {
          showToast(msg || 'Store updated successfully!');
          loadData();
        }}
      />

      {/* Manage / Upgrade / Downgrade Plan Modal */}
      <ManagePlanModal
        isOpen={Boolean(planShop)}
        shop={planShop}
        plans={plans}
        onClose={() => setPlanShop(null)}
        onSuccess={(updatedShop, msg) => {
          showToast(msg || 'Subscription plan updated successfully!');
          loadData();
        }}
      />

      {/* Delete Shop Modal */}
      <DeleteShopModal
        isOpen={Boolean(deleteShop)}
        shop={deleteShop}
        onClose={() => setDeleteShop(null)}
        onSuccess={(deletedId, msg) => {
          showToast(msg || 'Store permanently deleted.');
          loadData();
        }}
      />

      {/* Reset Owner Password Modal */}
      <ResetOwnerPasswordModal
        isOpen={Boolean(resetPassShop)}
        shop={resetPassShop}
        onClose={() => setResetPassShop(null)}
        onSuccess={(msg) => {
          showToast(msg || 'Password updated successfully!');
        }}
      />

      {/* Floating Feedback Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-red-600 text-white shadow-red-600/30'
                : 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900 shadow-black/40'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
