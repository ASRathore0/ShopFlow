import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Store, Users, Package, MapPin, HandHeart, AlertTriangle, TrendingUp,
  DollarSign, Clock, Layers, QrCode, Plus, Search, ShieldCheck, ArrowRight,
  Settings, RefreshCw, BarChart2, CheckCircle2, Bookmark, UserPlus, Filter,
  Sun, Moon, Menu, X, ArrowLeft, LogOut, ExternalLink, ChevronRight, Edit3,
  Trash2, Check, UserCheck, AlertCircle, Eye, CornerDownRight, Tag, ChevronDown, Sparkles
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { superAdminService } from '../services/superAdminService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import QRCodeModal from '../components/QRCodeModal';
import LocationBreadcrumb from '../components/LocationBreadcrumb';
import RequestStatusBadge from '../components/RequestStatusBadge';
import OnboardShopModal from '../components/OnboardShopModal';

export default function AdminDashboard() {
  const { user, quickLoginAs, logout, switchShop } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('overview'); // overview, products, inventory, locations, queue, employees, reports, qr
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shop switching state
  const [allShops, setAllShops] = useState([]);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Section specific data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);

  // Search & Filter states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');
  const [queueStatusFilter, setQueueStatusFilter] = useState('all');

  // MODAL STATES
  const [showQRModal, setShowQRModal] = useState(false);

  // Product Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Product Form fields
  const [prodForm, setProdForm] = useState({
    name: '',
    brand: '',
    model: '',
    sku: '',
    price: '',
    cost: '',
    category_id: '',
    primary_location_id: '',
    initial_stock: 10,
    image_url: '',
    description: '',
    status: 'active',
  });

  // Inventory Modals
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustType, setAdjustType] = useState('stock_in');
  const [adjustReason, setAdjustReason] = useState('');

  // Location Modals
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [deletingLocation, setDeletingLocation] = useState(null);
  const [locForm, setLocForm] = useState({
    floor_name: 'Ground Floor',
    section_name: 'Smartphones & Tablets',
    aisle_name: 'Aisle A1',
    rack_name: 'Rack 01',
    shelf_name: 'Shelf 01',
    position: 'Bay 1',
  });

  // Employee Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    assigned_zone: 'Showroom Floor',
    password: 'password123',
    status: 'online',
  });

  // Current Active Shop details (Dynamic for newly onboarded or switched shops)
  const currentShop = user?.current_shop || dashboardData?.shop || {
    name: 'ABC Electronics',
    slug: 'abc-electronics',
    shop_type: 'electronics',
  };

  // Auto-login as owner if needed for seamless testing
  useEffect(() => {
    async function initAuth() {
      if (!user || user.role === 'customer') {
        await quickLoginAs('owner');
      }
    }
    initAuth();
  }, [user]);

  // Load Dashboard Overview Data
  const fetchDashboard = async () => {
    try {
      const res = await adminService.getDashboard();
      if (res && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pre-load reference lists (categories & locations & employees & all shops)
  const preloadReferenceData = async () => {
    try {
      const [catRes, locRes, empRes, shopsRes] = await Promise.all([
        adminService.getCategories().catch(() => ({ data: [] })),
        adminService.getLocations().catch(() => ({ data: [] })),
        adminService.getEmployees().catch(() => ({ data: [] })),
        superAdminService.getShops().catch(() => ({ data: [] })),
      ]);
      setCategories(catRes.data || []);
      setLocations(locRes.data || []);
      setEmployees(empRes.data || []);
      setAllShops(shopsRes.data || []);
    } catch (err) {
      console.error('Error preloading references:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    preloadReferenceData();
  }, [user?.current_shop_id]);

  // Fetch section-specific data when activeSection changes
  const loadSectionData = async () => {
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
      console.error('Error loading section data:', err);
    }
  };

  useEffect(() => {
    loadSectionData();
  }, [activeSection, user?.current_shop_id]);

  // Real-time automatic background polling every 6 seconds for live requests queue & stats
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeSection === 'queue') {
        adminService.getRequests().then((res) => {
          setRequestsList(res.data?.data || []);
        }).catch(() => {});
      }
      if (activeSection === 'overview' || activeSection === 'queue') {
        adminService.getDashboard().then((res) => {
          if (res?.data) setDashboardData(res.data);
        }).catch(() => {});
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [activeSection]);

  // Handle switching active shop
  const handleSwitchStore = async (targetShopId) => {
    try {
      setShowShopDropdown(false);
      const res = await switchShop(targetShopId);
      if (res.success) {
        showToast(`Switched active store to "${res.current_shop?.name || 'Selected Shop'}".`);
        fetchDashboard();
        loadSectionData();
      } else {
        showToast(res.message || 'Could not switch shop.', 'error');
      }
    } catch (err) {
      showToast('Error switching shop.', 'error');
    }
  };

  // ==========================================
  // PRODUCTS CRUD HANDLERS
  // ==========================================
  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      brand: '',
      model: '',
      sku: '',
      price: '',
      cost: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      primary_location_id: locations.length > 0 ? locations[0].id : '',
      initial_stock: 10,
      image_url: '',
      description: '',
      status: 'active',
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProdForm({
      name: product.name || '',
      brand: product.brand || '',
      model: product.model || '',
      sku: product.sku || '',
      price: product.price || '',
      cost: product.cost || '',
      category_id: product.category_id || (categories[0]?.id || ''),
      primary_location_id: product.primary_location_id || (locations[0]?.id || ''),
      initial_stock: product.total_available_stock || 10,
      image_url: product.primary_image?.image_url || '',
      description: product.description || '',
      status: product.status || 'active',
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        name: prodForm.name,
        brand: prodForm.brand,
        model: prodForm.model,
        sku: prodForm.sku || undefined,
        price: parseFloat(prodForm.price),
        cost: prodForm.cost ? parseFloat(prodForm.cost) : undefined,
        category_id: prodForm.category_id ? parseInt(prodForm.category_id) : null,
        primary_location_id: prodForm.primary_location_id ? parseInt(prodForm.primary_location_id) : null,
        description: prodForm.description,
        image_url: prodForm.image_url || undefined,
        status: prodForm.status,
      };

      if (editingProduct) {
        await adminService.updateProduct(editingProduct.id, payload);
        showToast(`Product "${prodForm.name}" updated successfully!`);
      } else {
        payload.initial_stock = parseInt(prodForm.initial_stock) || 10;
        await adminService.createProduct(payload);
        showToast(`Product "${prodForm.name}" added to catalog!`);
      }

      setShowProductModal(false);
      setEditingProduct(null);
      const res = await adminService.getProducts();
      setProducts(res.data?.data || []);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save product. Please verify fields.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    setActionLoading(true);
    try {
      await adminService.deleteProduct(deletingProduct.id);
      showToast(`Product "${deletingProduct.name}" removed from catalog.`);
      setDeletingProduct(null);
      const res = await adminService.getProducts();
      setProducts(res.data?.data || []);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete product.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // INVENTORY ADJUSTMENT HANDLER
  // ==========================================
  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    setActionLoading(true);
    try {
      await adminService.adjustStock({
        inventory_id: selectedInventoryItem.id,
        type: adjustType,
        quantity: parseInt(adjustQty),
        reason: adjustReason || 'Inventory management adjustment',
      });
      showToast(`Stock updated for ${selectedInventoryItem.product?.name || 'item'}.`);
      setShowAdjustStockModal(false);
      setSelectedInventoryItem(null);
      const res = await adminService.getInventory();
      setInventoryItems(res.data?.inventory?.data || []);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      showToast('Could not adjust stock. Please check inputs.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // PHYSICAL LOCATIONS CRUD HANDLERS
  // ==========================================
  const openCreateLocationModal = () => {
    setEditingLocation(null);
    setLocForm({
      floor_name: 'Ground Floor',
      section_name: 'Main Section',
      aisle_name: 'Aisle A1',
      rack_name: 'Rack 01',
      shelf_name: 'Shelf 01',
      position: 'Bay 1',
    });
    setShowLocationModal(true);
  };

  const openEditLocationModal = (loc) => {
    setEditingLocation(loc);
    setLocForm({
      floor_name: loc.floor?.name || 'Ground Floor',
      section_name: loc.section?.name || 'Main Section',
      aisle_name: loc.aisle?.name || 'Aisle A1',
      rack_name: loc.rack?.name || 'Rack 01',
      shelf_name: loc.shelf?.name || 'Shelf 01',
      position: loc.position || '',
      label: loc.label || '',
    });
    setShowLocationModal(true);
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingLocation) {
        await adminService.updateLocation(editingLocation.id, {
          position: locForm.position,
          label: locForm.label || undefined,
        });
        showToast('Store location position updated.');
      } else {
        await adminService.createLocation({
          floor_name: locForm.floor_name,
          section_name: locForm.section_name,
          aisle_name: locForm.aisle_name,
          rack_name: locForm.rack_name,
          shelf_name: locForm.shelf_name,
          position: locForm.position,
        });
        showToast('New physical store location registered.');
      }
      setShowLocationModal(false);
      setEditingLocation(null);
      const res = await adminService.getLocations();
      setLocations(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to save store location. Check field values.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteLocation = async () => {
    if (!deletingLocation) return;
    setActionLoading(true);
    try {
      await adminService.deleteLocation(deletingLocation.id);
      showToast(`Location "${deletingLocation.label}" removed.`);
      setDeletingLocation(null);
      const res = await adminService.getLocations();
      setLocations(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Could not delete location. Make sure no products are assigned here.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // STAFF & EMPLOYEES CRUD HANDLERS
  // ==========================================
  const openCreateEmployeeModal = () => {
    setEditingEmployee(null);
    setEmpForm({
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      assigned_zone: 'Showroom Floor',
      password: 'password123',
      status: 'online',
    });
    setShowEmployeeModal(true);
  };

  const openEditEmployeeModal = (emp) => {
    setEditingEmployee(emp);
    setEmpForm({
      name: emp.name || '',
      email: emp.email || emp.user?.email || '',
      phone: emp.phone || emp.user?.phone || '',
      role: emp.role || 'staff',
      assigned_zone: emp.assigned_zone || 'Showroom Floor',
      status: emp.status || 'online',
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingEmployee) {
        await adminService.updateEmployee(editingEmployee.id, {
          name: empForm.name,
          phone: empForm.phone,
          role: empForm.role,
          status: empForm.status,
          assigned_zone: empForm.assigned_zone,
        });
        showToast(`Staff member "${empForm.name}" updated successfully.`);
      } else {
        await adminService.createEmployee({
          name: empForm.name,
          email: empForm.email,
          phone: empForm.phone,
          role: empForm.role,
          assigned_zone: empForm.assigned_zone,
          password: empForm.password || 'password123',
        });
        showToast(`New staff member "${empForm.name}" added to roster!`);
      }
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      const res = await adminService.getEmployees();
      setEmployees(res.data || []);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save staff member. Ensure email is unique.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    setActionLoading(true);
    try {
      await adminService.deleteEmployee(deletingEmployee.id);
      showToast(`Staff member "${deletingEmployee.name}" removed.`);
      setDeletingEmployee(null);
      const res = await adminService.getEmployees();
      setEmployees(res.data || []);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      showToast('Could not remove employee.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // LIVE QUEUE DISPATCH HANDLERS
  // ==========================================
  const handleAssignStaff = async (requestId, employeeId) => {
    if (!employeeId) return;
    try {
      await adminService.assignStaff(requestId, employeeId);
      showToast('Request dispatched to staff member.');
      const res = await adminService.getRequests();
      setRequestsList(res.data?.data || []);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      showToast('Failed to assign staff.', 'error');
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await adminService.updateRequestStatus(requestId, newStatus);
      showToast(`Request status updated to ${newStatus.replace('_', ' ')}.`);
      const res = await adminService.getRequests();
      setRequestsList(res.data?.data || []);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      showToast('Failed to update request status.', 'error');
    }
  };

  // Metrics
  const metrics = dashboardData?.metrics || {
    today_customers: 24,
    active_requests: requestsList.filter((r) => ['waiting', 'assigned', 'in_progress'].includes(r.status)).length,
    completed_requests: 142,
    today_completed: 18,
    average_wait_minutes: 3.5,
    staff_online: employees.filter((e) => e.status === 'online').length || 3,
    total_staff: employees.length || 4,
    low_stock_count: 2,
    inventory_value: 48950.0,
    revenue: 5196.0,
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: BarChart2 },
    { id: 'products', label: 'Product Catalog', icon: Package, count: products.length },
    { id: 'inventory', label: 'Inventory & Moves', icon: Layers, count: metrics.low_stock_count > 0 ? metrics.low_stock_count : undefined },
    { id: 'locations', label: 'Store Layout', icon: MapPin, count: locations.length },
    { id: 'queue', label: 'Queue Dispatch', icon: HandHeart, count: metrics.active_requests },
    { id: 'employees', label: 'Staff Roster', icon: Users, count: employees.length },
    { id: 'reports', label: 'Analytics & Loss', icon: TrendingUp },
    { id: 'qr', label: 'Entrance Signage', icon: QrCode },
  ];

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase());
    const matchCategory =
      productCategoryFilter === 'all' || String(p.category_id) === String(productCategoryFilter);
    return matchSearch && matchCategory;
  });

  const filteredInventory = inventoryItems.filter((i) => {
    const matchSearch =
      i.product?.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      i.variant?.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      i.location?.label?.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchStatus =
      inventoryStatusFilter === 'all' ||
      (inventoryStatusFilter === 'low_stock' && i.status === 'low_stock') ||
      (inventoryStatusFilter === 'in_stock' && i.status === 'in_stock');
    return matchSearch && matchStatus;
  });

  const filteredRequests = requestsList.filter((r) => {
    if (queueStatusFilter === 'all') return true;
    if (queueStatusFilter === 'waiting') return r.status === 'waiting';
    if (queueStatusFilter === 'in_progress')
      return ['assigned', 'in_progress', 'product_found', 'coming_to_you'].includes(r.status);
    if (queueStatusFilter === 'completed') return r.status === 'completed';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-zinc-100 flex flex-col md:flex-row font-sans transition-colors duration-200 relative">
      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm sm:max-w-md animate-fade-in">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-rose-500/90 text-white border-rose-600/50 shadow-rose-500/20'
                : 'bg-emerald-600/95 text-white border-emerald-500/50 shadow-emerald-500/20'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR (Visible md and up) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-[#111113] border-r border-slate-200 dark:border-zinc-800 flex-shrink-0 flex-col justify-between p-4 min-h-screen sticky top-0">
        <div className="space-y-6">
          {/* Shop Header & Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowShopDropdown(!showShopDropdown)}
              className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/25 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
                    {currentShop.name}
                  </div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Admin Panel</span>
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white shrink-0 ml-1 transition-transform" />
            </button>

            {/* Shop Switcher Popover */}
            {showShopDropdown && (
              <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 shadow-2xl p-2 z-50 space-y-1 animate-fade-in">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2 py-1">
                  Active Stores ({allShops.length || 1})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {allShops.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSwitchStore(s.id)}
                      className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                        (user?.current_shop_id === s.id || currentShop.slug === s.slug)
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {(user?.current_shop_id === s.id || currentShop.slug === s.slug) && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShopDropdown(false);
                      setShowOnboardModal(true);
                    }}
                    className="w-full p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Onboard Another Store</span>
                  </button>
                </div>
              </div>
            )}
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
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
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
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500" />
              )}
              <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* Customer View Link pointing dynamically to this shop */}
          <a
            href={`/shop/${currentShop.slug}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-500" />
              <span>Customer Storefront</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* User Info & Logout */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between px-2">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Shop Owner'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                {user?.email || 'owner@shopflow.io'}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR & HORIZONTAL PILL NAVIGATION */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#111113]/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                {currentShop.name}
              </h1>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                Shop Admin Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowOnboardModal(true)}
              className="p-1.5 px-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              title="Onboard Another Store"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Pill Scroll */}
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/70 dark:bg-zinc-950/40">
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
                  <span
                    className={`text-[9px] px-1 rounded-full font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
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
        {/* ======================================================== */}
        {/* SECTION 1: OVERVIEW DASHBOARD */}
        {/* ======================================================== */}
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
                    <div
                      key={i}
                      className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs space-y-1 shadow-sm"
                    >
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between gap-2">
                        <span className="truncate">{ins.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                          {ins.action}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                        {ins.message}
                      </p>
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Customer Requests by Hour
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Identify peak showroom traffic hours
                    </p>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                    Peak: 5 - 6 PM
                  </span>
                </div>

                <div className="h-60 sm:h-64 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData?.hourly_chart || []}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Top In-Store Requested Items
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Products shoppers asked staff to inspect
                    </p>
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
                        <span
                          className={`text-[10px] font-semibold ${
                            p.available_stock < 5
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-400 dark:text-zinc-500'
                          }`}
                        >
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
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Employee Live Workload
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Real-time queue assignments across floor staff
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('employees')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Manage Roster →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(dashboardData?.employee_workload || employees.slice(0, 3)).map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {emp.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {emp.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">
                      {emp.zone || emp.assigned_zone || 'Showroom Floor'}
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                      <span>
                        Active:{' '}
                        <strong className="text-blue-600 dark:text-blue-400">
                          {emp.active_requests_count ?? emp.active_requests ?? 0}
                        </strong>
                      </span>
                      <span>
                        Served:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {emp.total_requests_completed ?? emp.completed_today ?? 0}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: PRODUCT MANAGEMENT (FULL REAL CRUD) */}
        {/* ======================================================== */}
        {activeSection === 'products' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Product Catalog
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Manage showroom products, prices, barcodes, physical shelf locations, edit, and delete
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateProductModal}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name, brand, or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await adminService.getProducts();
                    setProducts(res.data?.data || []);
                    showToast('Product list refreshed.');
                  }}
                  title="Refresh Products"
                  className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile Cards (Visible < sm) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
                  No products found matching your search.
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          p.primary_image?.image_url ||
                          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=100&q=80'
                        }
                        alt=""
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {p.name}
                          </h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              p.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                            }`}
                          >
                            {p.status || 'active'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {p.brand} • {p.category?.name || 'General'}
                        </div>
                        <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                          ${parseFloat(p.price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 truncate max-w-[160px]">
                        {p.location ? p.location.formatted_path || p.location.label : 'Unassigned'}
                      </span>
                      <span
                        className={`font-bold ${
                          (p.total_available_stock ?? p.inventory?.[0]?.available_quantity ?? 10) <= 3
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {p.total_available_stock ?? p.inventory?.[0]?.available_quantity ?? 10} in stock
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => openEditProductModal(p)}
                        className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingProduct(p)}
                        className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (Visible >= sm) */}
            <div className="hidden sm:block bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Brand / Category</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Shelf Location</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-zinc-400">
                          No products found. Click "Add New Product" to list one.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  p.primary_image?.image_url ||
                                  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=100&q=80'
                                }
                                alt=""
                                className="w-9 h-9 object-cover rounded-lg border border-slate-200 dark:border-zinc-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                  SKU: {p.sku || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="text-slate-800 dark:text-zinc-300 font-medium">{p.brand}</div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                              {p.category?.name || 'General'}
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            ${parseFloat(p.price || 0).toFixed(2)}
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 truncate max-w-[150px] inline-block">
                              {p.location ? p.location.formatted_path || p.location.label : 'Unassigned'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`font-semibold ${
                                (p.total_available_stock ?? p.inventory?.[0]?.available_quantity ?? 10) <= 3
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {p.total_available_stock ?? p.inventory?.[0]?.available_quantity ?? 10} units
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                              }`}
                            >
                              {p.status || 'active'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditProductModal(p)}
                                title="Edit Product"
                                className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingProduct(p)}
                                title="Delete Product"
                                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 3: INVENTORY & STOCK ADJUSTMENT */}
        {/* ======================================================== */}
        {activeSection === 'inventory' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Showroom Inventory Management
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Track physical shelf quantities, record stock-ins, transfers, and damaged item write-offs
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await adminService.getInventory();
                  setInventoryItems(res.data?.inventory?.data || []);
                  showToast('Inventory reloaded.');
                }}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Stock
              </button>
            </div>

            {/* Search & Stock Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search inventory items, variants, or locations..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInventoryStatusFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    inventoryStatusFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  All ({inventoryItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryStatusFilter('low_stock')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    inventoryStatusFilter === 'low_stock'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  Low Stock
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryStatusFilter('in_stock')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    inventoryStatusFilter === 'in_stock'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  Healthy Stock
                </button>
              </div>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredInventory.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
                  No inventory records match your criteria.
                </div>
              ) : (
                filteredInventory.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {inv.product?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {inv.variant ? inv.variant.name : 'Standard Item'}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'low_stock'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[180px]">
                        {inv.location ? inv.location.formatted_path || inv.location.label : 'Floor display'}
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
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors border border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Adjust Stock / Write-off
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3.5">Item</th>
                      <th className="p-3.5">Variant</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Available Stock</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-zinc-400">
                          No inventory items found.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {inv.product?.name}
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-zinc-300">
                            {inv.variant ? inv.variant.name : 'Standard'}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                            {inv.location ? inv.location.formatted_path || inv.location.label : 'Floor display'}
                          </td>
                          <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                            {inv.available_quantity} units
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'low_stock'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
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
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors border border-slate-200 dark:border-zinc-700"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 4: PHYSICAL STORE LOCATIONS (FULL REAL CRUD) */}
        {/* ======================================================== */}
        {activeSection === 'locations' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Physical Store Locations & Layout
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Micro-location hierarchy: Floor → Section → Aisle → Rack → Shelf → Position
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateLocationModal}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Micro-Location
              </button>
            </div>

            {/* Location Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {locations.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
                  No store locations registered yet. Click "Add Micro-Location" to build your store map.
                </div>
              ) : (
                locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                        {loc.label}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                        Pos {loc.position}
                      </span>
                    </div>

                    <LocationBreadcrumb location={loc} showTitle={false} variant="horizontal" />

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {loc.floor?.name || 'Main Floor'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditLocationModal(loc)}
                          title="Edit Position"
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingLocation(loc)}
                          title="Delete Location"
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 5: LIVE QUEUE DISPATCH (WORKING REAL ACTIONS) */}
        {/* ======================================================== */}
        {activeSection === 'queue' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Live Showroom Queue & Dispatcher
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Real-time customer requests across physical store floors. Auto-refreshes live.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await adminService.getRequests();
                  setRequestsList(res.data?.data || []);
                  showToast('Queue refreshed.');
                }}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Queue
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setQueueStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  queueStatusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                All Requests ({requestsList.length})
              </button>
              <button
                type="button"
                onClick={() => setQueueStatusFilter('waiting')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  queueStatusFilter === 'waiting'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                Waiting for Staff
              </button>
              <button
                type="button"
                onClick={() => setQueueStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  queueStatusFilter === 'in_progress'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => setQueueStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  queueStatusFilter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Requests List */}
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-zinc-400 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800">
                  No requests matching this filter right now.
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {req.request_number}
                        </span>
                        <RequestStatusBadge status={req.status} size="sm" />
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                            req.priority === 'urgent'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : req.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {req.priority}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {req.items?.[0]?.product?.name || 'Store Assistance'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        Customer: <strong className="text-slate-700 dark:text-zinc-300">{req.customer_session?.customer_code || 'Guest'}</strong>
                        {req.items?.[0]?.variant_description && ` • ${req.items[0].variant_description}`}
                        {req.items?.[0]?.location?.label && ` • Location: ${req.items[0].location.label}`}
                      </div>
                    </div>

                    {/* Dispatch & Status Action Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800">
                      {/* Assign Staff Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                          Assign:
                        </label>
                        <select
                          value={req.assigned_employee_id || ''}
                          onChange={(e) => handleAssignStaff(req.id, e.target.value)}
                          className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs px-2.5 py-1.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                          Status:
                        </label>
                        <select
                          value={req.status}
                          onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                          className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs px-2.5 py-1.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="waiting">Waiting</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="product_found">Product Found</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 6: STORE EMPLOYEES & STAFF ROSTER (REAL CRUD) */}
        {/* ======================================================== */}
        {activeSection === 'employees' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Store Employee Roster
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Manage floor staff roles, shift tracking, active request limits, add, edit, or remove staff
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateEmployeeModal}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add Staff Member
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {employees.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
                  No staff members listed yet.
                </div>
              ) : (
                employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {emp.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                            {emp.employee_code}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          emp.status === 'online'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : emp.status === 'busy'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Role: <strong className="text-slate-800 dark:text-zinc-200">{emp.role}</strong>
                      </p>
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                        Zone: {emp.assigned_zone || 'Showroom Floor'}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                        {emp.email || emp.user?.email || 'No email registered'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span>
                        Requests: <strong className="text-slate-900 dark:text-white">{emp.total_requests_completed ?? 0}</strong>
                      </span>
                      <span>
                        Active: <strong className="text-blue-600 dark:text-blue-400">{emp.active_requests_count ?? 0}</strong>
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => openEditEmployeeModal(emp)}
                        className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingEmployee(emp)}
                        className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 7: REPORTS & DEMAND LOSS */}
        {/* ======================================================== */}
        {activeSection === 'reports' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Retail Demand & Efficiency Analytics
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Understand what shoppers requested and prevent lost showroom sales
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400">Busiest Hour</span>
                <div className="text-xl font-bold text-slate-900 dark:text-white">5:00 PM - 6:30 PM</div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Add 2 staff during this window
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400">Avg In-Store Response</span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">3.8 minutes</div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Target SLA: under 5 minutes
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400">Most Demanded Section</span>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">Showroom Aisle A1</div>
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
                    <span className="font-bold text-slate-900 dark:text-white">
                      MacBook Air M4 (Starlight 16GB)
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400 block text-[11px]">
                      84 requests • Only 2 physical units available
                    </span>
                  </div>
                  <span className="font-bold text-red-500 dark:text-red-400">Risk: ~$4,200 in lost demand</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      iPhone 17 Pro (Deep Blue 512GB)
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400 block text-[11px]">
                      135 requests • Only 1 physical unit available
                    </span>
                  </div>
                  <span className="font-bold text-red-500 dark:text-red-400">Risk: ~$8,900 in lost demand</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 8: ENTRANCE QR SIGNAGE */}
        {/* ======================================================== */}
        {activeSection === 'qr' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-xl">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Store Entrance QR Code
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Print and place this QR signage at your physical shop entrance or table displays
              </p>
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
                Points to: <strong>{window.location.origin}/shop/{currentShop.slug}</strong>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* PRODUCT CREATE & EDIT MODAL */}
      {/* ======================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                {editingProduct ? 'Edit Catalog Product' : 'Create New In-Store Product'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Brand & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sony, Apple, Samsung"
                    value={prodForm.brand}
                    onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Category
                  </label>
                  <select
                    value={prodForm.category_id}
                    onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Retail Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="399.99"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    SKU Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SNY-WH1000-BLK"
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Physical Location & Initial Stock / Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Store Shelf Location
                  </label>
                  <select
                    value={prodForm.primary_location_id}
                    onChange={(e) => setProdForm({ ...prodForm, primary_location_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Unassigned Floor Display</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.label} (Pos {loc.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {editingProduct ? (
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Status
                      </label>
                      <select
                        value={prodForm.status}
                        onChange={(e) => setProdForm({ ...prodForm, status: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="active">Active (On Showroom Floor)</option>
                        <option value="draft">Draft (Hidden)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Initial Stock Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={prodForm.initial_stock}
                        onChange={(e) => setProdForm({ ...prodForm, initial_stock: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={prodForm.image_url}
                  onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Key features, specifications, and showroom details..."
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowProductModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE PRODUCT CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-rose-200 dark:border-rose-900/50 w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Delete Product?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-zinc-200">"{deletingProduct.name}"</strong>? This will remove its inventory records and pricing.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeletingProduct(null)}
                className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmDeleteProduct}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADJUST INVENTORY STOCK MODAL */}
      {/* ======================================================== */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Adjust Physical Stock
              </h3>
              <button
                type="button"
                onClick={() => setShowAdjustStockModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
              <div>
                Item: <strong className="text-slate-800 dark:text-zinc-200">{selectedInventoryItem?.product?.name}</strong>
              </div>
              <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-0.5">
                Current Available Stock: <strong className="text-blue-600 dark:text-blue-400">{selectedInventoryItem?.available_quantity} units</strong>
              </div>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Movement Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="stock_in">Stock In (Shipment arrived / Restock)</option>
                  <option value="stock_out">Stock Out (Sold or transferred to warehouse)</option>
                  <option value="adjustment">Manual Recount / Correction</option>
                  <option value="damage">Damaged / Defective Write-off</option>
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
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Reason / Reference PO</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly replenishment shipment #PO-941"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowAdjustStockModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  {actionLoading ? 'Saving...' : 'Save Stock Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LOCATION CREATE & EDIT MODAL */}
      {/* ======================================================== */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                {editingLocation ? 'Edit Store Location' : 'Register Store Micro-Location'}
              </h3>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3.5">
              {!editingLocation && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Floor Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Ground Floor"
                        value={locForm.floor_name}
                        onChange={(e) => setLocForm({ ...locForm, floor_name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Section Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Smartphones & Audio"
                        value={locForm.section_name}
                        onChange={(e) => setLocForm({ ...locForm, section_name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Aisle</label>
                      <input
                        type="text"
                        required
                        placeholder="Aisle A1"
                        value={locForm.aisle_name}
                        onChange={(e) => setLocForm({ ...locForm, aisle_name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Rack</label>
                      <input
                        type="text"
                        required
                        placeholder="Rack 01"
                        value={locForm.rack_name}
                        onChange={(e) => setLocForm({ ...locForm, rack_name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Shelf</label>
                      <input
                        type="text"
                        required
                        placeholder="Shelf 01"
                        value={locForm.shelf_name}
                        onChange={(e) => setLocForm({ ...locForm, shelf_name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Position / Bin Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bay 1, Eye-Level, Top Rack"
                  value={locForm.position}
                  onChange={(e) => setLocForm({ ...locForm, position: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {editingLocation && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Display Label Override</label>
                  <input
                    type="text"
                    placeholder="e.g. Ground-Laptops-R1-S2-Pos1"
                    value={locForm.label || ''}
                    onChange={(e) => setLocForm({ ...locForm, label: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowLocationModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  {actionLoading ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE LOCATION CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-rose-200 dark:border-rose-900/50 w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Remove Store Location?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-zinc-200">"{deletingLocation.label}"</strong>? Make sure no products are currently assigned to this shelf.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeletingLocation(null)}
                className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmDeleteLocation}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
              >
                {actionLoading ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EMPLOYEE CREATE & EDIT MODAL */}
      {/* ======================================================== */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                {editingEmployee ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEmployeeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {!editingEmployee && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@shopflow.io"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0192"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Role</label>
                  <select
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="staff">Floor Staff</option>
                    <option value="manager">Shift Manager</option>
                    <option value="inventory_manager">Inventory Specialist</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Assigned Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. Aisle A1-A3, Laptops"
                    value={empForm.assigned_zone}
                    onChange={(e) => setEmpForm({ ...empForm, assigned_zone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Status</label>
                  <select
                    value={empForm.status}
                    onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="online">Online (Available for Dispatch)</option>
                    <option value="busy">Busy with Shopper</option>
                    <option value="on_break">On Break</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              {!editingEmployee && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Password</label>
                  <input
                    type="password"
                    placeholder="Default: password123"
                    value={empForm.password}
                    onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowEmployeeModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  {actionLoading ? 'Saving...' : editingEmployee ? 'Update Staff' : 'Add to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE EMPLOYEE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-rose-200 dark:border-rose-900/50 w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Remove Staff Member?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-zinc-200">"{deletingEmployee.name}"</strong> ({deletingEmployee.employee_code}) from the roster?
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeletingEmployee(null)}
                className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmDeleteEmployee}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
              >
                {actionLoading ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* QR CODE SIGNAGE MODAL */}
      {/* ======================================================== */}
      {showQRModal && (
        <QRCodeModal
          title={currentShop.name}
          subtitle="Scan to browse our in-store catalog & request staff assistance"
          value={`${window.location.origin}/shop/${currentShop.slug}`}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* ======================================================== */}
      {/* ONBOARD STORE MODAL */}
      {/* ======================================================== */}
      <OnboardShopModal
        isOpen={showOnboardModal}
        onClose={() => {
          setShowOnboardModal(false);
          preloadReferenceData();
          fetchDashboard();
        }}
      />
    </div>
  );
}
