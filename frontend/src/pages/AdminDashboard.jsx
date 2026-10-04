import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Store, Users, Package, MapPin, HandHeart, AlertTriangle, TrendingUp,
  DollarSign, Clock, Layers, QrCode, Plus, Search, ShieldCheck, ArrowRight,
  Settings, RefreshCw, BarChart2, CheckCircle2, Bookmark, UserPlus, Filter,
  Sun, Moon, Menu, X, ArrowLeft, LogOut, ExternalLink, ChevronRight, Edit3
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import QRCodeModal from '../components/QRCodeModal';
import LocationBreadcrumb from '../components/LocationBreadcrumb';
import RequestStatusBadge from '../components/RequestStatusBadge';

export default function AdminDashboard() {
  const { user, quickLoginAs, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('overview'); // overview, products, inventory, locations, queue, employees, reports, qr
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search and filter states
  const [productSearch, setProductSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  // Section specific data
  const [products, setProducts] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);

  // Modals
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustType, setAdjustType] = useState('stock_in');
  const [adjustReason, setAdjustReason] = useState('');

  // New product form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductLocationId, setNewProductLocationId] = useState('');
  const [newProductStock, setNewProductStock] = useState(10);

  // Auto-login as owner if needed for seamless testing
  useEffect(() => {
    async function initAuth() {
      if (!user || user.role === 'customer') {
        await quickLoginAs('owner');
      }
    }
    initAuth();
  }, [user]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDashboard();
      if (res && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Fetch section-specific data when activeSection changes
  useEffect(() => {
    async function loadSectionData() {
      try {
        if (activeSection === 'products') {
          const res = await adminService.getProducts();
          setProducts(res.data?.data || []);
        } else if (activeSection === 'inventory') {
          const res = await adminService.getInventory();
          setInventoryItems(res.data?.inventory?.data || []);
        } else if (activeSection === 'locations') {
          const res = await adminService.getLocations();
          setLocations(res.data || []);
        } else if (activeSection === 'employees') {
          const res = await adminService.getEmployees();
          setEmployees(res.data || []);
        } else if (activeSection === 'queue') {
          const res = await adminService.getRequests();
          setRequestsList(res.data?.data || []);
        } else if (activeSection === 'reports') {
          const res = await adminService.getReports();
          setReportsData(res.data || null);
        } else if (activeSection === 'qr') {
          const res = await adminService.getShopSettings();
          setShopSettings(res.data || null);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSectionData();
  }, [activeSection]);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    try {
      await adminService.adjustStock({
        inventory_id: selectedInventoryItem.id,
        type: adjustType,
        quantity: parseInt(adjustQty),
        reason: adjustReason,
      });
      setShowAdjustStockModal(false);
      const res = await adminService.getInventory();
      setInventoryItems(res.data?.inventory?.data || []);
      fetchDashboard();
    } catch (err) {
      alert('Could not adjust stock.');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await adminService.createProduct({
        name: newProductName,
        brand: newProductBrand,
        price: parseFloat(newProductPrice),
        primary_location_id: newProductLocationId || null,
        initial_stock: parseInt(newProductStock),
      });
      setShowProductModal(false);
      setNewProductName('');
      setNewProductBrand('');
      setNewProductPrice('');
      const res = await adminService.getProducts();
      setProducts(res.data?.data || []);
      fetchDashboard();
    } catch (err) {
      alert('Could not create product.');
    }
  };

  const metrics = dashboardData?.metrics || {
    today_customers: 24,
    active_requests: 3,
    completed_requests: 142,
    today_completed: 18,
    average_wait_minutes: 3.5,
    staff_online: 3,
    total_staff: 4,
    low_stock_count: 2,
    inventory_value: 48950.00,
    revenue: 5196.00,
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: BarChart2 },
    { id: 'products', label: 'Product Catalog', icon: Package },
    { id: 'inventory', label: 'Inventory & Moves', icon: Layers },
    { id: 'locations', label: 'Store Layout', icon: MapPin },
    { id: 'queue', label: 'Queue Dispatch', icon: HandHeart, count: metrics.active_requests },
    { id: 'employees', label: 'Staff Roster', icon: Users },
    { id: 'reports', label: 'Analytics & Loss', icon: TrendingUp },
    { id: 'qr', label: 'Entrance Signage', icon: QrCode },
  ];

  // Filtered lists
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filteredInventory = inventoryItems.filter(i =>
    (i.product?.name && i.product.name.toLowerCase().includes(inventorySearch.toLowerCase())) ||
    (i.variant?.name && i.variant.name.toLowerCase().includes(inventorySearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-zinc-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
      {/* DESKTOP SIDEBAR (Visible md and up) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-[#111113] border-r border-slate-200 dark:border-zinc-800 flex-shrink-0 flex-col justify-between p-4 min-h-screen sticky top-0">
        <div className="space-y-6">
          {/* Shop Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/25">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
                ABC Electronics
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Owner Admin
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-between transition-colors border border-slate-200 dark:border-zinc-700/80"
          >
            <span className="flex items-center gap-2">
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono uppercase">Theme</span>
          </button>

          {/* Quick Launch Customer QR */}
          <button
            type="button"
            onClick={() => setShowQRModal(true)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold border border-slate-200 dark:border-zinc-700/80 flex items-center justify-center gap-2 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Generate Store QR</span>
          </button>

          <Link
            to="/"
            className="w-full py-2 px-3 text-center text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Marketing Site</span>
          </Link>
        </div>
      </aside>

      {/* MOBILE TOP BAR & SWIPEABLE TABS (Visible below md) */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-[#111113]/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800">
        <div className="px-3.5 h-14 flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/"
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
              title="Return to site"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
              ABC Electronics
            </span>
          </div>

          {/* Right Mobile Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>

            {/* QR Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowQRModal(true)}
              className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              title="Generate QR Signage"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>

            {/* Menu Drawer Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Pill Tabs for Instant Mobile Navigation */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[9px] px-1 rounded-full font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Full Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 dark:border-zinc-800 bg-white/98 dark:bg-[#111113]/98 px-4 py-3 space-y-2 animate-fade-in shadow-xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 pb-1">
              Select Admin Section
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
            {user && (
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                <span className="truncate max-w-[180px]">User: {user.name}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 font-bold"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAIN ADMIN CONTENT BODY */}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto space-y-6 max-w-7xl">
        {/* SECTION 1: OVERVIEW DASHBOARD */}
        {activeSection === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 block font-medium">
                  Today's Shoppers
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {metrics.today_customers}
                </div>
                <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-bold block truncate">
                  QR scanned sessions
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-blue-500/30 shadow-sm space-y-1">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 block font-medium">
                  Active Requests
                </span>
                <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {metrics.active_requests}
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium block truncate">
                  Avg wait: ~{metrics.average_wait_minutes}m
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 block font-medium">
                  Completed Today
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {metrics.today_completed}
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 block truncate">
                  Total served: {metrics.completed_requests}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 block font-medium">
                  Staff Online
                </span>
                <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                  {metrics.staff_online} / {metrics.total_staff}
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 block truncate">
                  Active floor team
                </span>
              </div>
            </div>

            {/* Smart Demand & Stock Alerts */}
            {dashboardData?.smart_insights && dashboardData.smart_insights.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-50 to-blue-50/20 dark:from-amber-500/10 dark:via-zinc-900 dark:to-zinc-900 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Smart Retail Demand Insights</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {dashboardData.smart_insights.map((ins, i) => (
                    <div key={i} className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs space-y-1 shadow-sm">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between gap-2">
                        <span className="truncate">{ins.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                          {ins.action}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">{ins.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts: Requests by Hour & Top Requested Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Hourly Customer Demand Chart */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Requests by Hour</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Identify peak showroom traffic hours</p>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                    Peak: 5 - 6 PM
                  </span>
                </div>

                <div className="h-60 sm:h-64 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.hourly_chart || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272A' : '#E2E8F0'} />
                      <XAxis dataKey="hour" stroke={isDark ? '#71717A' : '#94A3B8'} fontSize={10} />
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
                      <Bar dataKey="requests" name="Requested" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="served" name="Served" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Requested Products */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top In-Store Requested Items</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Products shoppers asked staff to inspect</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(dashboardData?.top_products || []).map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-extrabold text-xs text-slate-400 dark:text-zinc-500 w-4">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                            {p.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {p.requests} requests
                        </div>
                        <span className={`text-[10px] font-semibold ${p.available_stock < 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                          {p.available_stock} in stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Employee Workload Table / Cards */}
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Employee Live Workload</h3>
                <span className="text-xs text-slate-500 dark:text-zinc-400">{metrics.staff_online} Active</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(dashboardData?.employee_workload || []).map((emp) => (
                  <div key={emp.id} className="p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{emp.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {emp.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">{emp.zone || 'Showroom Floor'}</div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                      <span>Active: <strong className="text-blue-600 dark:text-blue-400">{emp.active_requests}</strong></span>
                      <span>Served: <strong className="text-emerald-600 dark:text-emerald-400">{emp.completed_today}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: PRODUCT MANAGEMENT */}
        {activeSection === 'products' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Product Catalog</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Manage showroom products, prices, barcodes, and primary shelf locations</p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, brand, or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mobile Cards (Visible < sm) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredProducts.map((p) => (
                <div key={p.id} className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2.5">
                  <div className="flex items-start gap-3">
                    <img
                      src={p.primary_image?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=100&q=80'}
                      alt=""
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-zinc-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{p.name}</h4>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">{p.brand} • {p.category?.name}</div>
                      <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                        ${parseFloat(p.price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                      {p.location ? p.location.formatted_path : 'Unassigned'}
                    </span>
                    <span className={`font-bold ${p.total_available_stock <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {p.total_available_stock} in stock
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (Visible >= sm) */}
            <div className="hidden sm:block bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Brand / Category</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Physical Shelf Location</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.primary_image?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=100&q=80'}
                              alt=""
                              className="w-9 h-9 object-cover rounded-lg border border-slate-200 dark:border-zinc-700 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                              <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">SKU: {p.sku || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-slate-800 dark:text-zinc-300 font-medium">{p.brand}</div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400">{p.category?.name}</div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          ${parseFloat(p.price).toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                            {p.location ? p.location.formatted_path : 'Unassigned'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`font-semibold ${p.total_available_stock <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {p.total_available_stock} units
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => alert(`Editing product: ${p.name}`)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: INVENTORY & STOCK ADJUSTMENT */}
        {activeSection === 'inventory' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Showroom Inventory Management</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Track shelf quantities, record stock-ins, transfers, and damaged item write-offs</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search inventory items..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredInventory.map((inv) => (
                <div key={inv.id} className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{inv.product?.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">{inv.variant ? inv.variant.name : 'Standard'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'low_stock' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                      {inv.location ? inv.location.formatted_path : 'Floor display'}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {inv.available_quantity} available
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInventoryItem(inv);
                      setShowAdjustStockModal(true);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors border border-slate-200 dark:border-zinc-700"
                  >
                    Adjust Stock
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3.5">Item</th>
                      <th className="p-3.5">Variant</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Available</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {filteredInventory.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{inv.product?.name}</td>
                        <td className="p-3.5 text-slate-600 dark:text-zinc-300">{inv.variant ? inv.variant.name : 'Standard'}</td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                          {inv.location ? inv.location.formatted_path : 'Floor display'}
                        </td>
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">{inv.available_quantity}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'low_stock' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInventoryItem(inv);
                              setShowAdjustStockModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors border border-slate-200 dark:border-zinc-700"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: PHYSICAL STORE LOCATIONS */}
        {activeSection === 'locations' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Physical Store Locations</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Micro-location hierarchy: Floor → Section → Aisle → Rack → Shelf → Position</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {locations.map((loc) => (
                <div key={loc.id} className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                      {loc.label}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Position {loc.position}</span>
                  </div>
                  <LocationBreadcrumb location={loc} showTitle={false} variant="horizontal" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: LIVE QUEUE DISPATCH */}
        {activeSection === 'queue' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Live Showroom Queue & Dispatcher</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Real-time customer requests across physical store floors</p>
              </div>
            </div>

            <div className="space-y-3">
              {requestsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-zinc-400 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800">
                  No active requests in the floor queue right now.
                </div>
              ) : (
                requestsList.map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{req.request_number}</span>
                        <RequestStatusBadge status={req.status} size="sm" />
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400">Priority: {req.priority}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{req.items?.[0]?.product?.name}</div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">Customer: {req.customer_session?.customer_code} • {req.items?.[0]?.variant_description}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500 dark:text-zinc-400">
                        Assigned: <strong className="text-slate-900 dark:text-white">{req.assigned_employee ? req.assigned_employee.name : 'Unassigned'}</strong>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 6: EMPLOYEES */}
        {activeSection === 'employees' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Store Employee Roster</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Manage floor staff roles, shift tracking, and active request limits</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center">
                      {emp.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {emp.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{emp.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{emp.role} • {emp.employee_code}</p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">Zone: {emp.assigned_zone || 'All Store'}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <span>Requests: <strong className="text-slate-900 dark:text-white">{emp.total_requests_completed}</strong></span>
                    <span>Active Now: <strong className="text-slate-900 dark:text-white">{emp.active_requests_count}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 7: REPORTS & DEMAND LOSS */}
        {activeSection === 'reports' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Retail Demand & Efficiency Analytics</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Understand what shoppers requested and prevent lost showroom sales</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400">Busiest Hour</span>
                <div className="text-xl font-bold text-slate-900 dark:text-white">5:00 PM - 6:30 PM</div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Add 2 staff during this window</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400">Avg In-Store Response</span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">3.8 minutes</div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Target SLA: under 5 minutes</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400">Most Demanded Section</span>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">Laptops (Aisle A3)</div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">62% of requests</span>
              </div>
            </div>

            {/* Missed Demand Analysis */}
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                Potential Lost Revenue (High Customer Demand vs Low Physical Stock)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Shoppers repeatedly asked for these items, but stock was critically low or 0:
              </p>

              <div className="space-y-2 pt-1">
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">MacBook Air M4 (Starlight 16GB)</span>
                    <span className="text-slate-500 dark:text-zinc-400 block text-[11px]">84 requests • Only 2 physical units available</span>
                  </div>
                  <span className="font-bold text-red-500 dark:text-red-400">Risk: ~$4,200 in lost demand</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">iPhone 17 Pro (Deep Blue 512GB)</span>
                    <span className="text-slate-500 dark:text-zinc-400 block text-[11px]">135 requests • Only 1 physical unit available</span>
                  </div>
                  <span className="font-bold text-red-500 dark:text-red-400">Risk: ~$8,900 in lost demand</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: ENTRANCE QR SIGNAGE */}
        {activeSection === 'qr' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-xl">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Store Entrance QR Code</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Print and place this QR signage at your physical shop entrance or table displays</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 text-center">
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mx-auto transition-all"
              >
                <QrCode className="w-4 h-4" />
                Preview & Print Shop Entrance Signage
              </button>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                Points to: <strong>http://localhost:5173/shop/abc-electronics</strong>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Adjust Stock Modal */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Adjust Physical Stock</h3>
              <button
                type="button"
                onClick={() => setShowAdjustStockModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Product: <strong className="text-slate-800 dark:text-zinc-200">{selectedInventoryItem?.product?.name}</strong></p>

            <form onSubmit={handleAdjustStock} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Movement Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="stock_in">Stock In (Shipment arrived)</option>
                  <option value="stock_out">Stock Out (Sold or transferred)</option>
                  <option value="adjustment">Manual Count Adjustment</option>
                  <option value="damage">Damaged / Write-off</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Reason / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly replenishment PO-902"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustStockModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New In-Store Product</h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPad Pro M4 11-inch"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Brand</label>
                  <input
                    type="text"
                    placeholder="Apple"
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="999.00"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Initial Physical Stock</label>
                <input
                  type="number"
                  min="1"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Signage Modal */}
      {showQRModal && (
        <QRCodeModal
          title="ABC Electronics"
          subtitle="Scan to browse our in-store catalog & request staff assistance"
          value={`${window.location.origin}/shop/abc-electronics`}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}
