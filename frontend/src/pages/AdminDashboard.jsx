import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Store, Users, Package, MapPin, HandHeart, AlertTriangle, TrendingUp,
  DollarSign, Clock, Layers, QrCode, Plus, Search, ShieldCheck, ArrowRight,
  Settings, RefreshCw, BarChart2, CheckCircle2, Bookmark, UserPlus, Filter
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import QRCodeModal from '../components/QRCodeModal';
import LocationBreadcrumb from '../components/LocationBreadcrumb';
import RequestStatusBadge from '../components/RequestStatusBadge';

export default function AdminDashboard() {
  const { user, quickLoginAs } = useAuth();
  const [activeSection, setActiveSection] = useState('overview'); // overview, products, inventory, locations, queue, employees, reports, qr
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      // reload inventory
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
    { id: 'inventory', label: 'Inventory & Stock Move', icon: Layers },
    { id: 'locations', label: 'Store Physical Layout', icon: MapPin },
    { id: 'queue', label: 'Live Queue Dispatch', icon: HandHeart },
    { id: 'employees', label: 'Staff Management', icon: Users },
    { id: 'reports', label: 'Analytics & Demand Loss', icon: TrendingUp },
    { id: 'qr', label: 'Entrance QR Signage', icon: QrCode },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 flex flex-col md:flex-row selection:bg-blue-600">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#111113] border-b md:border-b-0 md:border-r border-zinc-800 flex-shrink-0 flex flex-col justify-between p-4">
        <div className="space-y-6">
          {/* Shop Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white leading-tight">ABC Electronics</div>
              <div className="text-[10px] text-zinc-400">ShopFlow Store Admin</div>
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
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Launch Customer QR */}
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Generate Store QR</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 max-w-7xl">
        {/* SECTION 1: OVERVIEW DASHBOARD */}
        {activeSection === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400 block font-medium">Today's Shoppers</span>
                <div className="text-2xl font-black text-white">{metrics.today_customers}</div>
                <span className="text-[10px] text-emerald-400 font-semibold">QR scanned sessions</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#18181B] border border-blue-500/30 space-y-1">
                <span className="text-xs text-zinc-400 block font-medium">Active Requests</span>
                <div className="text-2xl font-black text-blue-400">{metrics.active_requests}</div>
                <span className="text-[10px] text-zinc-400 font-medium">Avg wait: ~{metrics.average_wait_minutes}m</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400 block font-medium">Completed Today</span>
                <div className="text-2xl font-black text-emerald-400">{metrics.today_completed}</div>
                <span className="text-[10px] text-zinc-400">Total all-time: {metrics.completed_requests}</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400 block font-medium">Staff Online</span>
                <div className="text-2xl font-black text-purple-400">{metrics.staff_online} / {metrics.total_staff}</div>
                <span className="text-[10px] text-zinc-400">Active floor team</span>
              </div>
            </div>

            {/* Smart Demand & Stock Alerts */}
            {dashboardData?.smart_insights && dashboardData.smart_insights.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Smart Retail Demand Insights</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {dashboardData.smart_insights.map((ins, i) => (
                    <div key={i} className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs space-y-1">
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{ins.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">{ins.action}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{ins.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts: Requests by Hour & Top Requested Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Customer Demand Chart */}
              <div className="p-5 rounded-3xl bg-[#18181B] border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Customer Requests by Hour</h3>
                    <p className="text-xs text-zinc-400">Identify peak showroom traffic hours</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg">
                    Peak: 5 - 6 PM
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.hourly_chart || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                      <XAxis dataKey="hour" stroke="#71717A" fontSize={11} />
                      <YAxis stroke="#71717A" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: '#3F3F46', fontSize: 12 }} />
                      <Bar dataKey="requests" name="Requested" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="served" name="Served" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Requested Products Table */}
              <div className="p-5 rounded-3xl bg-[#18181B] border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Top Requested In-Store Products</h3>
                    <p className="text-xs text-zinc-400">Products shoppers asked staff to see</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(dashboardData?.top_products || []).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs text-zinc-500 w-4">#{idx + 1}</span>
                        <div>
                          <h4 className="text-xs font-bold text-white truncate max-w-[180px]">{p.name}</h4>
                          <span className="text-[10px] text-zinc-400">{p.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-blue-400">{p.requests} requests</div>
                        <span className={`text-[10px] ${p.available_stock < 5 ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>
                          {p.available_stock} in stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Employee Workload Table */}
            <div className="p-5 rounded-3xl bg-[#18181B] border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Employee Live Workload</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(dashboardData?.employee_workload || []).map((emp) => (
                  <div key={emp.id} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{emp.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                        {emp.status}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">{emp.zone || 'Showroom Floor'}</div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-800 text-zinc-300">
                      <span>Active Now: <strong>{emp.active_requests}</strong></span>
                      <span>Completed: <strong>{emp.completed_today}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: PRODUCT MANAGEMENT */}
        {activeSection === 'products' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Product Catalog</h2>
                <p className="text-xs text-zinc-400">Manage showroom products, prices, barcodes, and primary shelf locations</p>
              </div>
              <button
                onClick={() => setShowProductModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            <div className="bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Brand / Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Physical Shelf Location</th>
                    <th className="p-3.5">Stock</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/40">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.primary_image?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=100&q=80'}
                            alt=""
                            className="w-9 h-9 object-cover rounded-lg border border-zinc-700"
                          />
                          <div>
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">SKU: {p.sku || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-zinc-300 font-medium">{p.brand}</div>
                        <div className="text-[11px] text-zinc-500">{p.category?.name}</div>
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        ${parseFloat(p.price).toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                          {p.location ? p.location.formatted_path : 'Unassigned'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`font-semibold ${p.total_available_stock <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {p.total_available_stock} units
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => alert(`Editing product: ${p.name}`)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
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
        )}

        {/* SECTION 3: INVENTORY & STOCK ADJUSTMENT */}
        {activeSection === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Showroom Inventory Management</h2>
                <p className="text-xs text-zinc-400">Track shelf quantities, record stock-ins, transfers, and damaged item write-offs</p>
              </div>
            </div>

            <div className="bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5">Item</th>
                    <th className="p-3.5">Variant</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Available</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {inventoryItems.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-800/40">
                      <td className="p-3.5 font-bold text-white">{inv.product?.name}</td>
                      <td className="p-3.5 text-zinc-300">{inv.variant ? inv.variant.name : 'Standard'}</td>
                      <td className="p-3.5 font-mono text-[11px] text-zinc-400">
                        {inv.location ? inv.location.formatted_path : 'Floor display'}
                      </td>
                      <td className="p-3.5 font-extrabold text-white">{inv.available_quantity}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'low_stock' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedInventoryItem(inv);
                            setShowAdjustStockModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-400 text-xs font-semibold transition-colors"
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
        )}

        {/* SECTION 4: PHYSICAL STORE LOCATIONS */}
        {activeSection === 'locations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Physical Store Locations</h2>
                <p className="text-xs text-zinc-400">Micro-location hierarchy: Floor → Section → Aisle → Rack → Shelf → Position</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => (
                <div key={loc.id} className="p-4 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700">
                      {loc.label}
                    </span>
                    <span className="text-[10px] text-blue-400 font-semibold">Position {loc.position}</span>
                  </div>
                  <LocationBreadcrumb location={loc} showTitle={false} variant="horizontal" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: LIVE QUEUE DISPATCH */}
        {activeSection === 'queue' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Live Showroom Queue & Dispatcher</h2>
                <p className="text-xs text-zinc-400">Real-time customer requests across all physical store floors</p>
              </div>
            </div>

            <div className="space-y-3">
              {requestsList.map((req) => (
                <div key={req.id} className="p-4 rounded-2xl bg-[#18181B] border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">{req.request_number}</span>
                      <RequestStatusBadge status={req.status} size="sm" />
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Priority: {req.priority}</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">{req.items?.[0]?.product?.name}</div>
                    <div className="text-xs text-zinc-400">Customer: {req.customer_session?.customer_code} • {req.items?.[0]?.variant_description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">
                      Assigned: <strong className="text-white">{req.assigned_employee ? req.assigned_employee.name : 'Unassigned'}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: EMPLOYEES */}
        {activeSection === 'employees' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Store Employee Roster</h2>
                <p className="text-xs text-zinc-400">Manage floor staff roles, shift tracking, and active request limits</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center">
                      {emp.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {emp.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{emp.name}</h4>
                    <p className="text-xs text-zinc-400">{emp.role} • {emp.employee_code}</p>
                    <p className="text-[11px] text-blue-400 mt-1">Zone: {emp.assigned_zone || 'All Store'}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs text-zinc-400">
                    <span>Requests Served: <strong className="text-white">{emp.total_requests_completed}</strong></span>
                    <span>Active: <strong className="text-white">{emp.active_requests_count}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 7: REPORTS & DEMAND LOSS */}
        {activeSection === 'reports' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-white">Retail Demand & Efficiency Analytics</h2>
              <p className="text-xs text-zinc-400">Understand what shoppers requested and prevent lost showroom sales</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400">Busiest Hour</span>
                <div className="text-xl font-bold text-white">5:00 PM - 6:30 PM</div>
                <span className="text-[10px] text-zinc-500">Add 2 staff during this window</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400">Avg In-Store Response</span>
                <div className="text-xl font-bold text-emerald-400">3.8 minutes</div>
                <span className="text-[10px] text-zinc-500">Target SLA: under 5 minutes</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400">Most Demanded Section</span>
                <div className="text-xl font-bold text-blue-400">Laptops (Aisle A3)</div>
                <span className="text-[10px] text-zinc-500">62% of requests</span>
              </div>
            </div>

            {/* Missed Demand Analysis */}
            <div className="p-5 rounded-3xl bg-[#18181B] border border-zinc-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Potential Lost Revenue (High Customer Demand vs Low Physical Stock)
              </h3>
              <p className="text-xs text-zinc-400">
                Shoppers repeatedly asked for these items, but stock was critically low or 0:
              </p>

              <div className="space-y-2 pt-2">
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white">MacBook Air M4 (Starlight 16GB)</span>
                    <span className="text-zinc-500 block text-[11px]">84 requests • Only 2 physical units available</span>
                  </div>
                  <span className="font-bold text-red-400">Risk: ~$4,200 in lost demand</span>
                </div>

                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white">iPhone 17 Pro (Deep Blue 512GB)</span>
                    <span className="text-zinc-500 block text-[11px]">135 requests • Only 1 physical unit available</span>
                  </div>
                  <span className="font-bold text-red-400">Risk: ~$8,900 in lost demand</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: ENTRANCE QR SIGNAGE */}
        {activeSection === 'qr' && (
          <div className="space-y-6 animate-fade-in max-w-xl">
            <div>
              <h2 className="text-xl font-bold text-white">Store Entrance QR Code</h2>
              <p className="text-xs text-zinc-400">Print and place this QR signage at your physical shop entrance or table displays</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#18181B] border border-zinc-800 space-y-4 text-center">
              <button
                onClick={() => setShowQRModal(true)}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mx-auto"
              >
                <QrCode className="w-4 h-4" />
                Preview & Print Shop Entrance Signage
              </button>
              <p className="text-[11px] text-zinc-500">
                Points to: <strong>http://localhost:5173/shop/abc-electronics</strong>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Adjust Stock Modal */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181B] border border-zinc-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Adjust Physical Stock</h3>
            <p className="text-xs text-zinc-400">Product: {selectedInventoryItem?.product?.name}</p>

            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300">Movement Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                >
                  <option value="stock_in">Stock In (Shipment arrived)</option>
                  <option value="stock_out">Stock Out (Sold or transferred)</option>
                  <option value="adjustment">Manual Count Adjustment</option>
                  <option value="damage">Damaged / Write-off</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Reason / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly replenishment PO-902"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustStockModal(false)}
                  className="w-1/2 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181B] border border-zinc-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New In-Store Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPad Pro M4 11-inch"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Brand</label>
                  <input
                    type="text"
                    placeholder="Apple"
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                    className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="999.00"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">Initial Physical Stock</label>
                <input
                  type="number"
                  min="1"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="w-1/2 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
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
