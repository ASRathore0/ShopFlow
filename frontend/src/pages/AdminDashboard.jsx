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
  Trash2, Check, UserCheck, AlertCircle, Eye, CornerDownRight, Tag, ChevronDown, Sparkles,
  UploadCloud, ImagePlus, Loader2, Wifi, Globe, MessageCircle, Phone, Mail, Save, Camera,
  Star, Images, GripVertical, ArrowUpDown, Crop
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import QRCodeModal from '../components/QRCodeModal';
import LocationBreadcrumb from '../components/LocationBreadcrumb';
import RequestStatusBadge from '../components/RequestStatusBadge';
import ImageCropperModal from '../components/ImageCropperModal';

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
    images: [],
    description: '',
    status: 'active',
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  // Category quick creation state inside product modal
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Tag');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Dedicated Category Manager Modal states
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [catMgrForm, setCatMgrForm] = useState({ name: '', icon: 'Tag' });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState(null);
  const [isReorderingCategories, setIsReorderingCategories] = useState(false);
  const categoryTouchCurrentIndexRef = React.useRef(null);

  // Product Image manual upload state
  const [imageUploadMode, setImageUploadMode] = useState('upload'); // 'upload' or 'url'
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showLiveCameraModal, setShowLiveCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const liveVideoRef = React.useRef(null);
  const cameraStreamRef = React.useRef(null);

  // Image Cropper & Rotate Modal state (Supports products, store logo, etc.)
  const [cropperModal, setCropperModal] = useState({
    isOpen: false,
    imageSrc: '',
    type: 'product', // 'product' or 'logo'
    targetIndex: null, // null = new upload, number = existing index in prodForm.images
    originalFile: null,
    title: 'Crop & Rotate Product Image',
    aspectRatio: '1:1',
    circularCrop: false,
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

  // Store Settings Form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    tagline: '',
    description: '',
    logo_url: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    landmark: '',
    opening_hours: '9:00 AM - 9:00 PM',
    brand_color: '#2563EB',
    is_open: true,
    whatsapp_number: '',
    wifi_ssid: '',
    wifi_password: '',
    announcement: '',
    exchange_policy: '7 Days Instant Showroom Exchange',
    social_links: {
      instagram: '',
      facebook: '',
      twitter: '',
      youtube: '',
      website: '',
      linkedin: '',
    },
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState('upload'); // 'upload' or 'url'

  const populateSettingsForm = (s) => {
    if (!s) return;
    const cps = s.customer_portal_settings || {};
    const sl = cps.social_links || {};
    const ad = cps.address_details || {};
    setSettingsForm({
      name: s.name || '',
      tagline: cps.tagline || '',
      description: s.description || '',
      logo_url: s.logo_url || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      city: cps.city || ad.city || '',
      state: cps.state || ad.state || '',
      postal_code: cps.postal_code || ad.postal_code || '',
      landmark: cps.landmark || ad.landmark || '',
      opening_hours: s.opening_hours || '9:00 AM - 9:00 PM',
      brand_color: s.brand_color || '#2563EB',
      is_open: s.is_open !== false,
      whatsapp_number: cps.whatsapp_number || '',
      wifi_ssid: cps.wifi_ssid || '',
      wifi_password: cps.wifi_password || '',
      announcement: cps.announcement || '',
      exchange_policy: cps.exchange_policy || '7 Days Instant Showroom Exchange',
      social_links: {
        instagram: sl.instagram || '',
        facebook: sl.facebook || '',
        twitter: sl.twitter || '',
        youtube: sl.youtube || '',
        website: sl.website || '',
        linkedin: sl.linkedin || '',
      },
    });
  };

  // Current Active Shop details (Dynamic for newly onboarded or switched shops)
  const currentShop = user?.current_shop || dashboardData?.shop || {
    name: 'ABC Electronics',
    slug: 'abc-electronics',
    shop_type: 'electronics',
  };

  // Load Dashboard Overview Data
  const fetchDashboard = async () => {
    try {
      const res = await adminService.getDashboard();
      if (res && res.data) {
        setDashboardData(res.data);
        if (res.data.shop) {
          populateSettingsForm(res.data.shop);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pre-load reference lists (categories & locations & employees & user's authorized shops)
  const preloadReferenceData = async () => {
    try {
      const [catRes, locRes, empRes] = await Promise.all([
        adminService.getCategories().catch(() => ({ data: [] })),
        adminService.getLocations().catch(() => ({ data: [] })),
        adminService.getEmployees().catch(() => ({ data: [] })),
      ]);
      setCategories(catRes.data || []);
      setLocations(locRes.data || []);
      setEmployees(empRes.data || []);

      const userShops = user?.shops?.length ? user.shops : (user?.current_shop ? [user.current_shop] : []);
      setAllShops(userShops);
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
      } else if (activeSection === 'qr' || activeSection === 'settings') {
        const res = await adminService.getShopSettings();
        setShopSettings(res.data || null);
        if (res.data?.shop) {
          populateSettingsForm(res.data.shop);
        }
      }
    } catch (err) {
      console.error('Error loading section data:', err);
    }
  };

  useEffect(() => {
    loadSectionData();
  }, [activeSection, user?.current_shop_id]);

  const prevAdminReqIdsRef = React.useRef(null);
  const playAdminChime = (isReservation = false) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      if (isReservation) {
        [587.33, 739.99, 880.00].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.2, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.35);
        });
      } else {
        [523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.18, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.28);
        });
      }
    } catch (e) {
      console.log('Audio chime not permitted', e);
    }
  };

  // Real-time automatic background polling every 6 seconds for live requests queue & stats
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeSection === 'queue') {
        adminService.getRequests().then((res) => {
          const newReqs = res.data?.data || [];
          if (prevAdminReqIdsRef.current) {
            const fresh = newReqs.filter((r) => !prevAdminReqIdsRef.current.has(r.id));
            if (fresh.length > 0) {
              const isRes = fresh.some((r) => r.request_type === 'reservation');
              playAdminChime(isRes);
              if (isRes) {
                showToast('🔖 New customer product reservation received!', 'success');
              } else {
                showToast('⚡ New customer showroom request received!', 'success');
              }
            }
          }
          prevAdminReqIdsRef.current = new Set(newReqs.map((r) => r.id));
          setRequestsList(newReqs);
        }).catch(() => { });
      }
      if (activeSection === 'overview' || activeSection === 'queue') {
        adminService.getDashboard().then((res) => {
          if (res?.data) setDashboardData(res.data);
        }).catch(() => { });
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
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setNewCategoryIcon('Tag');
    setIsCreatingCategory(false);
    setImageUploadMode('upload');
    setIsUploadingImage(false);
    setNewImageUrl('');
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
      images: [],
      description: '',
      status: 'active',
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setNewCategoryIcon('Tag');
    setIsCreatingCategory(false);
    setNewImageUrl('');

    // Extract existing product images
    const existingImages = (product.images && product.images.length > 0)
      ? product.images.map((img) => typeof img === 'string' ? img : (img.image_url || img.url)).filter(Boolean)
      : (product.primary_image?.image_url ? [product.primary_image.image_url] : (product.image_url ? [product.image_url] : []));

    setImageUploadMode('upload');
    setIsUploadingImage(false);
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
      image_url: existingImages[0] || '',
      images: existingImages,
      description: product.description || '',
      status: product.status || 'active',
    });
    setShowProductModal(true);
  };

  const handleQuickCreateCategory = async (e) => {
    e?.preventDefault();
    if (!newCategoryName.trim()) {
      showToast('Please enter a category name.', 'error');
      return;
    }
    setIsCreatingCategory(true);
    try {
      const res = await adminService.createCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon || 'Tag',
      });
      const newCat = res.data;
      setCategories((prev) => [...prev, newCat]);
      setProdForm((prev) => ({ ...prev, category_id: newCat.id }));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      showToast(`Category "${newCat.name}" created and selected!`);
    } catch (err) {
      console.error('Failed to create category:', err);
      showToast(err.response?.data?.message || 'Failed to create category.', 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreateCategoryFromManager = async (e) => {
    e?.preventDefault();
    if (!catMgrForm.name.trim()) {
      showToast('Please enter a category name.', 'error');
      return;
    }
    setIsSavingCategory(true);
    try {
      const res = await adminService.createCategory({
        name: catMgrForm.name.trim(),
        icon: catMgrForm.icon || 'Tag',
      });
      const newCat = res.data;
      setCategories((prev) => [...prev, newCat]);
      setCatMgrForm({ name: '', icon: 'Tag' });
      showToast(`Category "${newCat.name}" created for this shop!`);
    } catch (err) {
      console.error('Failed to create category:', err);
      showToast(err.response?.data?.message || 'Failed to create category.', 'error');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const persistCategoryOrder = async (newOrder) => {
    setCategories(newOrder);
    try {
      setIsReorderingCategories(true);
      await adminService.reorderCategories(newOrder.map((c) => c.id));
      showToast('Category arrangement updated! Showroom customers will see this order.', 'success');
    } catch (err) {
      console.error('Failed to reorder categories:', err);
      showToast('Failed to save category order.', 'error');
    } finally {
      setIsReorderingCategories(false);
    }
  };

  const handleMoveCategory = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= categories.length || fromIndex === toIndex) return;
    const updated = [...categories];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    persistCategoryOrder(updated);
  };

  const handleCategoryDragStart = (e, index) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', index.toString());
    } catch (_) {}
  };

  const handleCategoryDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedCategoryIndex !== null && draggedCategoryIndex !== index) {
      setDragOverCategoryIndex(index);
    }
  };

  const handleCategoryDragEnd = () => {
    if (
      draggedCategoryIndex !== null &&
      dragOverCategoryIndex !== null &&
      draggedCategoryIndex !== dragOverCategoryIndex
    ) {
      handleMoveCategory(draggedCategoryIndex, dragOverCategoryIndex);
    }
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  // Touch hold-and-drag for mobile & tablets
  const handleCategoryTouchStart = (e, index) => {
    if (e.target.closest('button')) return;
    categoryTouchCurrentIndexRef.current = index;
    setDraggedCategoryIndex(index);
  };

  const handleCategoryTouchMove = (e) => {
    if (categoryTouchCurrentIndexRef.current === null) return;
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const catCard = targetEl?.closest('[data-category-index]');
    if (catCard) {
      const hoverIndex = parseInt(catCard.getAttribute('data-category-index'), 10);
      if (!isNaN(hoverIndex) && hoverIndex !== categoryTouchCurrentIndexRef.current) {
        setDragOverCategoryIndex(hoverIndex);
      }
    }
  };

  const handleCategoryTouchEnd = () => {
    const fromIdx = categoryTouchCurrentIndexRef.current;
    if (fromIdx !== null && dragOverCategoryIndex !== null && fromIdx !== dragOverCategoryIndex) {
      handleMoveCategory(fromIdx, dragOverCategoryIndex);
    }
    categoryTouchCurrentIndexRef.current = null;
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setActionLoading(true);
    try {
      await adminService.deleteCategory(deletingCategory.id);
      showToast(`Category "${deletingCategory.name}" removed from your shop.`);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      setProdForm((prev) => (String(prev.category_id) === String(deletingCategory.id) ? { ...prev, category_id: '' } : prev));
      setDeletingCategory(null);
      // Refresh products list in case any were in this category
      const res = await adminService.getProducts();
      setProducts(res.data?.data || []);
    } catch (err) {
      console.error('Failed to delete category:', err);
      showToast(err.response?.data?.message || 'Failed to remove category.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    const validFiles = fileList.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('Please select valid image files (PNG, JPG, WEBP, GIF).', 'error');
      return;
    }

    const oversized = validFiles.some((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      showToast('Each image file size must be less than 5MB.', 'error');
      return;
    }

    // Single file selected or camera snap: open ImageCropperModal for crop & rotate!
    if (validFiles.length === 1) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropperModal({
          isOpen: true,
          imageSrc: event.target.result,
          targetIndex: null,
          originalFile: validFiles[0],
        });
      };
      reader.readAsDataURL(validFiles[0]);
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    try {
      const res = await adminService.uploadProductImages(validFiles);
      const uploadedList = res.data || [];
      const newUrls = uploadedList.map((item) => item.url).filter(Boolean);
      if (newUrls.length > 0) {
        setProdForm((prev) => {
          const nextImgs = [...(prev.images || []), ...newUrls];
          return {
            ...prev,
            image_url: prev.image_url || nextImgs[0],
            images: nextImgs,
          };
        });
        showToast(`${newUrls.length} photos uploaded! Use the Crop button on any image to adjust.`);
      }
    } catch (err) {
      console.error('Server upload failed, using local reader fallback:', err);
      const readPromises = validFiles.map((file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
      }));
      const base64List = await Promise.all(readPromises);
      setProdForm((prev) => {
        const nextImgs = [...(prev.images || []), ...base64List];
        return {
          ...prev,
          image_url: prev.image_url || nextImgs[0],
          images: nextImgs,
        };
      });
      showToast(`${validFiles.length} photo(s) loaded from device.`);
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveCroppedImage = async ({ blob, file, previewUrl }) => {
    // Handling Store Logo crop
    if (cropperModal.type === 'logo') {
      setIsUploadingLogo(true);
      try {
        const res = await adminService.uploadShopLogo(file);
        const uploadedUrl = res.data?.url || previewUrl;
        setSettingsForm((prev) => ({ ...prev, logo_url: uploadedUrl }));
        if (dashboardData?.shop) {
          setDashboardData((prev) => ({
            ...prev,
            shop: { ...prev.shop, logo_url: uploadedUrl },
          }));
        }
        showToast('Store logo cropped & updated successfully!');
      } catch (err) {
        console.error('Failed to upload cropped logo, using local preview:', err);
        setSettingsForm((prev) => ({ ...prev, logo_url: previewUrl }));
        showToast('Logo preview updated. Save settings to apply.');
      } finally {
        setIsUploadingLogo(false);
        setCropperModal({ isOpen: false, imageSrc: '', targetIndex: null, originalFile: null, type: 'product' });
      }
      return;
    }

    // Handling Product Images crop
    setIsUploadingImage(true);
    try {
      const res = await adminService.uploadProductImage(file);
      const uploadedUrl = res.data?.url || previewUrl;

      if (cropperModal.targetIndex !== null) {
        // Replace existing image in prodForm.images
        setProdForm((prev) => {
          const updated = [...(prev.images || [])];
          updated[cropperModal.targetIndex] = uploadedUrl;
          return {
            ...prev,
            images: updated,
            image_url: cropperModal.targetIndex === 0 ? uploadedUrl : prev.image_url,
          };
        });
        showToast('Image cropped and rotated successfully!');
      } else {
        // Add as newly cropped photo
        setProdForm((prev) => {
          const nextImgs = [...(prev.images || []), uploadedUrl];
          return {
            ...prev,
            image_url: prev.image_url || uploadedUrl,
            images: nextImgs,
          };
        });
        showToast('Cropped product photo added!');
      }
    } catch (err) {
      console.error('Failed to upload cropped image to server, using local data URL:', err);
      if (cropperModal.targetIndex !== null) {
        setProdForm((prev) => {
          const updated = [...(prev.images || [])];
          updated[cropperModal.targetIndex] = previewUrl;
          return {
            ...prev,
            images: updated,
            image_url: cropperModal.targetIndex === 0 ? previewUrl : prev.image_url,
          };
        });
      } else {
        setProdForm((prev) => ({
          ...prev,
          image_url: prev.image_url || previewUrl,
          images: [...(prev.images || []), previewUrl],
        }));
      }
      showToast('Cropped photo applied!');
    } finally {
      setIsUploadingImage(false);
      setCropperModal({ isOpen: false, imageSrc: '', targetIndex: null, originalFile: null, type: 'product' });
    }
  };

  const handleSkipCrop = async () => {
    if (cropperModal.type === 'logo') {
      const file = cropperModal.originalFile;
      setCropperModal({ isOpen: false, imageSrc: '', targetIndex: null, originalFile: null, type: 'product' });
      if (!file) return;
      setIsUploadingLogo(true);
      try {
        const res = await adminService.uploadShopLogo(file);
        if (res.data?.url) {
          setSettingsForm((prev) => ({ ...prev, logo_url: res.data.url }));
          if (dashboardData?.shop) {
            setDashboardData((prev) => ({
              ...prev,
              shop: { ...prev.shop, logo_url: res.data.url },
            }));
          }
          showToast('Store logo uploaded successfully!');
        }
      } catch (err) {
        setSettingsForm((prev) => ({ ...prev, logo_url: cropperModal.imageSrc }));
      } finally {
        setIsUploadingLogo(false);
      }
      return;
    }
    const file = cropperModal.originalFile;
    setCropperModal({ isOpen: false, imageSrc: '', targetIndex: null, originalFile: null });
    setIsUploadingImage(true);
    try {
      const res = await adminService.uploadProductImage(file);
      if (res.data?.url) {
        const newUrl = res.data.url;
        setProdForm((prev) => {
          const nextImgs = [...(prev.images || []), newUrl];
          return {
            ...prev,
            image_url: prev.image_url || newUrl,
            images: nextImgs,
          };
        });
        showToast('Product photo uploaded successfully!');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setProdForm((prev) => {
        const nextImgs = [...(prev.images || []), cropperModal.imageSrc];
        return {
          ...prev,
          image_url: prev.image_url || cropperModal.imageSrc,
          images: nextImgs,
        };
      });
      showToast('Photo added from device.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddImageUrl = (e) => {
    e?.preventDefault();
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    setProdForm((prev) => {
      const nextImgs = [...(prev.images || []), url];
      return {
        ...prev,
        image_url: prev.image_url || url,
        images: nextImgs,
      };
    });
    setNewImageUrl('');
    showToast('Image URL added to product gallery.');
  };

  const handleRemoveImage = (indexToRemove) => {
    setProdForm((prev) => {
      const nextImgs = (prev.images || []).filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        image_url: nextImgs[0] || '',
        images: nextImgs,
      };
    });
  };

  const handleSetPrimaryImage = (indexToPrimary) => {
    setProdForm((prev) => {
      const curImgs = [...(prev.images || [])];
      if (indexToPrimary >= 0 && indexToPrimary < curImgs.length) {
        const [selected] = curImgs.splice(indexToPrimary, 1);
        const nextImgs = [selected, ...curImgs];
        return {
          ...prev,
          image_url: selected,
          images: nextImgs,
        };
      }
      return prev;
    });
    showToast('Cover photo updated.');
  };

  // ==========================================
  // LIVE CAMERA PRODUCT PHOTO HANDLERS
  // ==========================================
  const startLiveCamera = async (facing = 'environment') => {
    try {
      setShowLiveCameraModal(true);
      setCameraFacing(facing);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Camera stream is not supported in this browser. Please use the Click Pic button.', 'error');
        setShowLiveCameraModal(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }).catch(async () => {
        return await navigator.mediaDevices.getUserMedia({ video: true });
      });
      cameraStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Failed to open camera viewfinder:', err);
      showToast('Could not access camera. Please allow permissions or use Click Pic directly.', 'error');
      setShowLiveCameraModal(false);
    }
  };

  const stopLiveCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setShowLiveCameraModal(false);
  };

  const switchLiveCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startLiveCamera(nextFacing);
  };

  const captureFromLiveCamera = () => {
    if (!liveVideoRef.current) return;
    const video = liveVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `product-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopLiveCamera();
      await handleFileUpload({ target: { files: [file] } });
    }, 'image/jpeg', 0.92);
  };

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const imagesPayload = (prodForm.images && prodForm.images.length > 0)
        ? prodForm.images
        : (prodForm.image_url ? [prodForm.image_url] : []);

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
        image_url: imagesPayload[0] || undefined,
        images: imagesPayload,
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

  // ==========================================
  // STORE SETTINGS HANDLERS
  // ==========================================
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, SVG).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size must be less than 5MB.', 'error');
      return;
    }

    // Open ImageCropperModal for crop & rotate
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropperModal({
        isOpen: true,
        imageSrc: ev.target.result,
        type: 'logo',
        targetIndex: null,
        originalFile: file,
        title: 'Crop & Rotate Store Logo',
        aspectRatio: '1:1',
        circularCrop: false,
      });
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleSaveStoreSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!settingsForm.name.trim()) {
      showToast('Store name is required.', 'error');
      return;
    }

    setIsSavingSettings(true);
    try {
      const payload = {
        name: settingsForm.name.trim(),
        description: settingsForm.description,
        logo_url: settingsForm.logo_url,
        phone: settingsForm.phone,
        email: settingsForm.email,
        address: settingsForm.address,
        opening_hours: settingsForm.opening_hours,
        brand_color: settingsForm.brand_color,
        is_open: settingsForm.is_open,
        customer_portal_settings: {
          tagline: settingsForm.tagline,
          city: settingsForm.city,
          state: settingsForm.state,
          postal_code: settingsForm.postal_code,
          landmark: settingsForm.landmark,
          whatsapp_number: settingsForm.whatsapp_number,
          wifi_ssid: settingsForm.wifi_ssid,
          wifi_password: settingsForm.wifi_password,
          announcement: settingsForm.announcement,
          exchange_policy: settingsForm.exchange_policy,
          social_links: settingsForm.social_links,
        },
      };

      const res = await adminService.updateShopSettings(payload);
      if (res && (res.status === 'success' || res.data)) {
        showToast('Store settings & online presence saved successfully!');
        const updatedShop = res.data?.shop || res.data || payload;
        setShopSettings((prev) => ({ ...prev, shop: updatedShop }));
        if (dashboardData?.shop) {
          setDashboardData((prev) => ({
            ...prev,
            shop: { ...prev.shop, ...updatedShop },
          }));
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast(err.response?.data?.message || 'Failed to update store settings.', 'error');
    } finally {
      setIsSavingSettings(false);
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
    { id: 'settings', label: 'Store Settings', icon: Settings },
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
    if (queueStatusFilter === 'reservations') return r.request_type === 'reservation';
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
                {currentShop?.logo_url ? (
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 p-0.5 border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={currentShop.logo_url} alt={currentShop.name} className="w-full h-full object-contain rounded-xl" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/25 shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                )}
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
        <div className="flex items-center justify-between px-4 py-3 sm:py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            {currentShop?.logo_url ? (
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-800 p-1 border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                <img src={currentShop.logo_url} alt={currentShop.name} className="w-full h-full object-contain rounded-lg" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
                <Store className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                {currentShop.name}
              </h1>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block">
                Shop Admin Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Showroom / Customer View Link Icon */}
            {currentShop?.slug && (
              <Link
                to={`/shop/${currentShop.slug}`}
                className="p-2.5 rounded-xl text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                title="View Customer Showroom"
                aria-label="View Customer Showroom"
              >
                <Store className="w-5 h-5" />
              </Link>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Pill Scroll */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/70 dark:bg-zinc-950/40">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-extrabold ${
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
          <div className="border-t border-slate-200 dark:border-zinc-800 bg-white/98 dark:bg-[#111113]/98 px-4 py-3.5 space-y-2.5 animate-fade-in shadow-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 pb-1">
              Select Admin Section
            </div>
            <div className="grid grid-cols-2 gap-2.5">
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
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-sm font-bold text-left transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
            {currentShop?.slug && (
              <div className="pt-2">
                <Link
                  to={`/shop/${currentShop.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-sm font-bold border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4.5 h-4.5" />
                    <span>View Customer Showroom</span>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )}
            {user && (
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-sm text-slate-600 dark:text-zinc-400">
                <span className="truncate max-w-[200px]">User: <strong className="text-slate-900 dark:text-white font-semibold">{user.name}</strong></span>
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
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowCategoryManagerModal(true)}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Manage and remove categories"
                >
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  <span>Categories ({categories.length})</span>
                </button>

                <button
                  type="button"
                  onClick={openCreateProductModal}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
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
                          ₹{parseFloat(p.price || 0).toFixed(2)}
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
                            ₹{parseFloat(p.price || 0).toFixed(2)}
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
                onClick={() => setQueueStatusFilter('reservations')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  queueStatusFilter === 'reservations'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Reservations ({requestsList.filter(r => r.request_type === 'reservation').length})
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
                    className={`p-4 rounded-2xl bg-white dark:bg-[#18181B] border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      req.request_type === 'reservation'
                        ? 'border-purple-500/40 hover:border-purple-500/70'
                        : 'border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {req.request_number}
                        </span>
                        {req.request_type === 'reservation' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                            <Bookmark className="w-3 h-3" />
                            IN-STORE RESERVATION
                          </span>
                        )}
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
                        Customer: <strong className="text-slate-700 dark:text-zinc-300">{req.customer_session?.customer_name || req.customer_session?.customer_code || 'Guest'}</strong>
                        {req.customer_session?.phone_number && ` (📞 ${req.customer_session.phone_number})`}
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
                  <span className="font-bold text-red-500 dark:text-red-400">Risk: ~₹4,200 in lost demand</span>
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
                  <span className="font-bold text-red-500 dark:text-red-400">Risk: ~₹8,900 in lost demand</span>
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

        {/* ======================================================== */}
        {/* SECTION 9: STORE SETTINGS & CUSTOMIZATION */}
        {/* ======================================================== */}
        {activeSection === 'settings' && (
          <div className="space-y-6 animate-fade-in max-w-5xl">
            {/* Page Header with Save CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span>Store Profile & Experience Settings</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Customize your showroom logo, name, location details, customer contacts, social links, and Wi-Fi perks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/shop/${currentShop.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-zinc-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>Preview Customer View</span>
                </a>

                <button
                  type="button"
                  onClick={handleSaveStoreSettings}
                  disabled={isSavingSettings}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSavingSettings ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveStoreSettings} className="space-y-6">
              {/* PANEL 1: BRAND IDENTITY & LOGO */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-500" />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Store Identity & Visual Branding</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Customer Facing</span>
                </div>

                {/* Logo Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Live Preview Card */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Logo Preview</span>
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-dashed border-slate-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden shadow-inner p-1">
                      {settingsForm.logo_url ? (
                        <img
                          src={settingsForm.logo_url}
                          alt="Store Logo Preview"
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-2xl">
                          {settingsForm.name ? settingsForm.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate max-w-full">
                      {settingsForm.name || 'Store Name'}
                    </span>
                    {settingsForm.logo_url && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCropperModal({
                              isOpen: true,
                              imageSrc: settingsForm.logo_url,
                              type: 'logo',
                              targetIndex: null,
                              originalFile: null,
                              title: 'Crop & Adjust Store Logo',
                              aspectRatio: '1:1',
                              circularCrop: false,
                            });
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                          title="Crop and reframe store logo"
                        >
                          <Crop className="w-3 h-3" />
                          <span>Crop</span>
                        </button>
                        <span className="text-slate-300 dark:text-zinc-700">·</span>
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, logo_url: '' })}
                          className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload / URL Controls */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLogoInputMode('upload')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          logoInputMode === 'upload'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        Upload Image File
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoInputMode('url')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          logoInputMode === 'url'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        Paste Image URL
                      </button>
                    </div>

                    {logoInputMode === 'upload' ? (
                      <div className="relative border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-zinc-900/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                          {isUploadingLogo ? (
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                          ) : (
                            <UploadCloud className="w-6 h-6 text-blue-500" />
                          )}
                          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                            {isUploadingLogo ? 'Uploading logo to server...' : 'Drag & drop or click to upload store logo'}
                          </span>
                          <span className="text-[10px] text-slate-400">PNG, JPG, WebP, SVG up to 5MB</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/images/store-logo.png"
                          value={settingsForm.logo_url}
                          onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">Paste direct link to your store logo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name, Tagline & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABC Electronics"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Tagline / Motto
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Premium Electronics & Fast In-Store Assistance"
                      value={settingsForm.tagline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Store Bio / About Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description shown to shoppers in store header and footer..."
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Operating Status Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Physical Store Operating Status
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      When open, customers can scan items and dispatch staff. When closed, requests are paused.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, is_open: !settingsForm.is_open })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      settingsForm.is_open
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                        : 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span>{settingsForm.is_open ? 'Open Now' : 'Closed'}</span>
                  </button>
                </div>
              </div>

              {/* PANEL 2: ADDRESS & SHOWROOM LOCATION */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Physical Address & Floor Location</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Navigation & Maps</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Showroom Street Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shop #104, Silicon Galleria, 100 Feet Road"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Floor / Unit / Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ground Floor, Near East Atrium"
                      value={settingsForm.landmark}
                      onChange={(e) => setSettingsForm({ ...settingsForm, landmark: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru"
                      value={settingsForm.city}
                      onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      State / Province
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Karnataka"
                      value={settingsForm.state}
                      onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Postal / PIN Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 560038"
                      value={settingsForm.postal_code}
                      onChange={(e) => setSettingsForm({ ...settingsForm, postal_code: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* PANEL 3: CONTACT & CUSTOMER DESK */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-500" />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Contact & Support Channels</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Customer Reach</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Showroom Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      WhatsApp Customer Chat Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={settingsForm.whatsapp_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Renders 1-click WhatsApp button in customer footer</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Store Support Email
                    </label>
                    <input
                      type="email"
                      placeholder="store@abcelectronics.com"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      placeholder="Mon - Sat: 10:00 AM - 9:30 PM | Sun: 11:00 AM - 8:00 PM"
                      value={settingsForm.opening_hours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, opening_hours: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* PANEL 4: SOCIAL MEDIA & ONLINE PROFILES */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-pink-500" />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Social Media & Web Links</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Customer Footer Icons</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className="text-pink-500">📸</span>
                      <span>Instagram</span>
                    </label>
                    <input
                      type="text"
                      placeholder="@abcelectronics or URL"
                      value={settingsForm.social_links.instagram}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          social_links: { ...settingsForm.social_links, instagram: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className="text-blue-600">📘</span>
                      <span>Facebook</span>
                    </label>
                    <input
                      type="text"
                      placeholder="facebook.com/yourstore"
                      value={settingsForm.social_links.facebook}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          social_links: { ...settingsForm.social_links, facebook: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className="text-slate-800 dark:text-white">✖️</span>
                      <span>X (Twitter)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="@abcelectronics"
                      value={settingsForm.social_links.twitter}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          social_links: { ...settingsForm.social_links, twitter: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className="text-red-600">▶️</span>
                      <span>YouTube</span>
                    </label>
                    <input
                      type="text"
                      placeholder="youtube.com/@yourstore"
                      value={settingsForm.social_links.youtube}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          social_links: { ...settingsForm.social_links, youtube: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span>Official Website</span>
                    </label>
                    <input
                      type="text"
                      placeholder="www.abcelectronics.com"
                      value={settingsForm.social_links.website}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          social_links: { ...settingsForm.social_links, website: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className="text-blue-500">💼</span>
                      <span>LinkedIn</span>
                    </label>
                    <input
                      type="text"
                      placeholder="linkedin.com/company/yourstore"
                      value={settingsForm.social_links.linkedin}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          social_links: { ...settingsForm.social_links, linkedin: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* PANEL 5: IN-STORE SHOPPER EXPERIENCE PERKS */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-500" />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">In-Store Shopper Experience & Wi-Fi</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Customer Amenities</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Showroom Wi-Fi Network Name (SSID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABC_Guest_WiFi"
                      value={settingsForm.wifi_ssid}
                      onChange={(e) => setSettingsForm({ ...settingsForm, wifi_ssid: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Wi-Fi Password (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Welcome2026 or leave blank for open network"
                      value={settingsForm.wifi_password}
                      onChange={(e) => setSettingsForm({ ...settingsForm, wifi_password: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Customer Announcement Ribbon (Appears at top of store)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 🎉 Grand Festival: 10% instant bundle discount when you ask floor staff!"
                      value={settingsForm.announcement}
                      onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Store Exchange / Warranty Policy
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7 Days Hassle-Free In-Store Replacement on all electronics"
                      value={settingsForm.exchange_policy}
                      onChange={(e) => setSettingsForm({ ...settingsForm, exchange_policy: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BOTTOM FLOATING/STICKY SAVE ACTION */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSavingSettings ? 'Saving All Changes...' : 'Save All Store Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* PRODUCT CREATE & EDIT MODAL */}
      {/* ======================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 w-full max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate">{editingProduct ? 'Edit Catalog Product' : 'Create New In-Store Product'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  setShowProductModal(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Category *
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setShowCategoryManagerModal(true)}
                        className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                        title="Manage or remove categories"
                      >
                        <Settings className="w-3 h-3 text-slate-400" />
                        <span>Manage / Remove</span>
                      </button>
                      <span className="text-slate-300 dark:text-zinc-700">|</span>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{showNewCategoryInput ? 'Cancel' : 'Create New'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Category Creator Box */}
                  {showNewCategoryInput ? (
                    <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2 animate-fade-in mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>Add New In-Store Category</span>
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400">Saved for future products</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Category name (e.g. Wireless Audio, Accessories)"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickCreateCategory(e);
                            }
                          }}
                          className="flex-1 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleQuickCreateCategory}
                          disabled={isCreatingCategory || !newCategoryName.trim()}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all cursor-pointer"
                        >
                          {isCreatingCategory ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold shrink-0">Icon:</span>
                        {['Tag', 'Laptop', 'Smartphone', 'Tv', 'Headphones', 'Watch', 'Sparkles', 'Package'].map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setNewCategoryIcon(ic)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors shrink-0 ${
                              newCategoryIcon === ic
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                            }`}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <select
                      value={prodForm.category_id}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setShowNewCategoryInput(true);
                        } else if (e.target.value === '__manage__') {
                          setShowCategoryManagerModal(true);
                        } else {
                          setProdForm({ ...prodForm, category_id: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="__new__" className="text-blue-600 font-bold">
                        + Create New Category...
                      </option>
                      <option value="__manage__" className="text-slate-500 font-bold">
                        ⚙ Manage & Remove Categories...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              {/* Price & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Retail Price (₹) *
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

              {/* Product Images: Direct Camera Click, Gallery Files OR Web Links */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Images className="w-4 h-4 text-blue-500" />
                      <span>Product Images</span>
                    </label>
                    {prodForm.images?.length > 0 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                        {prodForm.images.length} {prodForm.images.length === 1 ? 'image' : 'images'}
                      </span>
                    )}
                  </div>
                  <div className="inline-flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl text-[11px] font-bold self-start sm:self-auto border border-slate-200/60 dark:border-zinc-700/60">
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('upload')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        imageUploadMode === 'upload'
                          ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>Upload & Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('url')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        imageUploadMode === 'url'
                          ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Add by URL</span>
                    </button>
                  </div>
                </div>

                {/* Upload & Camera Mode */}
                {imageUploadMode === 'upload' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Option 1: Direct Click Pic (Camera) */}
                      <div className="relative rounded-2xl border-2 border-dashed border-blue-400/80 dark:border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all p-3 sm:p-4 flex flex-col justify-between group">
                        <label className="flex items-center sm:flex-col justify-start sm:justify-center gap-3 cursor-pointer text-left sm:text-center w-full active:scale-[0.98] transition-transform">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileUpload}
                            disabled={isUploadingImage}
                            className="hidden"
                          />
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform">
                            {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 sm:justify-center">
                              <span>Click Pic</span>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200">
                                Camera
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                              Snap live product photo
                            </div>
                          </div>
                        </label>

                        {/* Optional In-Browser Live Viewfinder button */}
                        <button
                          type="button"
                          onClick={() => startLiveCamera('environment')}
                          className="mt-2.5 pt-2 border-t border-blue-200/60 dark:border-blue-900/60 w-full text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Open Live Viewfinder</span>
                        </button>
                      </div>

                      {/* Option 2: Select Pics (Gallery / Files) */}
                      <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all p-3 sm:p-4 flex flex-col justify-between group">
                        <label className="flex items-center sm:flex-col justify-start sm:justify-center gap-3 cursor-pointer text-left sm:text-center w-full active:scale-[0.98] transition-transform">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            disabled={isUploadingImage}
                            className="hidden"
                          />
                          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 sm:justify-center">
                              <span>Select Pics</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
                                Gallery
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                              Browse device files
                            </div>
                          </div>
                        </label>

                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800 w-full text-[10px] text-slate-400 dark:text-zinc-500 text-center">
                          Select multiple photos (PNG, JPG, WEBP)
                        </div>
                      </div>
                    </div>

                    {/* Helper status row */}
                    <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 dark:text-zinc-500">
                      <span>Max 5MB per image</span>
                      {isUploadingImage && (
                        <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Uploading photo...
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* URL Mode */
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or paste image web link"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      className="flex-1 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                )}

                {/* Multiple Images Gallery Grid & Cover Photo Selector */}
                {prodForm.images && prodForm.images.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold">Product Gallery ({prodForm.images.length})</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">First image is the showroom Cover Photo</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-2.5 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200 dark:border-zinc-800">
                      {prodForm.images.map((imgUrl, idx) => {
                        const isCover = idx === 0;
                        return (
                          <div
                            key={idx}
                            className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              isCover
                                ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                                : 'border-slate-200 dark:border-zinc-700 hover:border-slate-400'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Product image ${idx + 1}`}
                              className="w-full h-full object-cover bg-white dark:bg-zinc-800"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=200&q=80';
                              }}
                            />

                            {/* Cover Badge or Set As Cover Button */}
                            {isCover ? (
                              <div className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>Cover</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="absolute top-1 left-1 bg-black/75 hover:bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer shadow-sm"
                                title="Set as showroom Cover Photo"
                              >
                                Set Cover
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer shadow-sm"
                              title="Remove image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Crop & Rotate Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setCropperModal({
                                  isOpen: true,
                                  imageSrc: imgUrl,
                                  targetIndex: idx,
                                  originalFile: null,
                                });
                              }}
                              className="absolute bottom-1 left-1 bg-black/75 hover:bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer shadow-sm"
                              title="Crop & Rotate photo"
                            >
                              <Crop className="w-2.5 h-2.5" />
                              <span>Crop</span>
                            </button>

                            {/* Image sequence number */}
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                              #{idx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  onClick={() => {
                    stopLiveCamera();
                    setShowProductModal(false);
                  }}
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
      {/* LIVE CAMERA CAPTURE MODAL */}
      {/* ======================================================== */}
      {showLiveCameraModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-zinc-700 w-full max-w-md rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center gap-3">
            {/* Header */}
            <div className="flex items-center justify-between w-full pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Product Live Viewfinder</span>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Video Viewport */}
            <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center shadow-inner">
              <video
                ref={(el) => {
                  liveVideoRef.current = el;
                  if (el && cameraStreamRef.current && el.srcObject !== cameraStreamRef.current) {
                    el.srcObject = cameraStreamRef.current;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Framing Guides */}
              <div className="absolute inset-4 border border-dashed border-white/25 rounded-xl pointer-events-none" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-full px-4 pt-1">
              {/* Switch Front/Rear Camera */}
              <button
                type="button"
                onClick={switchLiveCamera}
                className="p-2.5 sm:p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer flex flex-col items-center gap-1 text-[10px] font-bold"
                title="Switch camera"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Flip</span>
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={captureFromLiveCamera}
                className="relative w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                title="Click Picture"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-2.5 sm:p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer flex flex-col items-center gap-1 text-[10px] font-bold"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 text-center">
              Point camera at product and click the shutter button to save photo.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CATEGORY MANAGEMENT & REMOVAL MODAL */}
      {/* ======================================================== */}
      {showCategoryManagerModal && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 w-full max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Store Categories Management</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Create new categories or remove unnecessary categories for your shop
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryManagerModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Category Card */}
            <form onSubmit={handleCreateCategoryFromManager} className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New In-Store Category</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Available instantly</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Smart Wearables, Footwear, Books..."
                  value={catMgrForm.name}
                  onChange={(e) => setCatMgrForm({ ...catMgrForm, name: e.target.value })}
                  className="flex-1 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700/80 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSavingCategory || !catMgrForm.name.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all cursor-pointer"
                >
                  {isSavingCategory ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create</span>
                    </>
                  )}
                </button>
              </div>

              {/* Icon picker chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold shrink-0">Icon:</span>
                {['Tag', 'Smartphone', 'Laptop', 'Tv', 'Headphones', 'Watch', 'Sparkles', 'Package', 'Shirt', 'ShoppingBag'].map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setCatMgrForm({ ...catMgrForm, icon: ic })}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors shrink-0 cursor-pointer ${
                      catMgrForm.icon === ic
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </form>

            {/* Categories List & Rearrangement option */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span>Your Store's Categories ({categories.length})</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                  Top item shows first in showroom
                </span>
              </div>

              {/* Rearrange Tip Banner */}
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 min-w-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">
                    <strong>Rearrange:</strong> Hold & drag any category up or down to reorder. Top item appears first to customers.
                  </span>
                </div>
                {isReorderingCategories && (
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                )}
              </div>

              {categories.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  No categories defined yet. Use the form above to create your first category.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {categories.map((cat, idx) => {
                    const isDragging = draggedCategoryIndex === idx;
                    const isOver = dragOverCategoryIndex === idx;
                    return (
                      <div
                        key={cat.id}
                        data-category-index={idx}
                        draggable
                        onDragStart={(e) => handleCategoryDragStart(e, idx)}
                        onDragEnter={(e) => handleCategoryDragEnter(e, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={handleCategoryDragEnd}
                        onTouchStart={(e) => handleCategoryTouchStart(e, idx)}
                        onTouchMove={handleCategoryTouchMove}
                        onTouchEnd={handleCategoryTouchEnd}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all select-none cursor-grab active:cursor-grabbing ${
                          isDragging
                            ? 'opacity-40 scale-[0.98] border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-inner'
                            : isOver
                            ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/70 dark:bg-blue-950/50 scale-[1.01]'
                            : 'bg-slate-50 dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Grip Handle icon indicating hold & drag */}
                          <div
                            className="p-1 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 flex items-center justify-center shrink-0 touch-none"
                            title="Hold and drag to reorder"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Position Badge: #1, #2, etc. */}
                          <span
                            className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                              idx === 0
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                            }`}
                            title={idx === 0 ? 'Top priority in showroom' : `Position #${idx + 1}`}
                          >
                            #{idx + 1}
                          </span>

                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {cat.name}
                              </h4>
                              {idx === 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold shrink-0">
                                  1st in Showroom
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                              <span>slug: {cat.slug}</span>
                              {cat.products_count !== undefined && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-600 dark:text-zinc-300">
                                    {cat.products_count} {cat.products_count === 1 ? 'product' : 'products'}
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Clean Action button: Delete */}
                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingCategory(cat);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title={`Delete category "${cat.name}"`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryManagerModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingCategory && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-rose-200 dark:border-rose-900/50 w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Remove Category?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-zinc-200">"{deletingCategory.name}"</strong> from your shop?
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl mt-2">
                Any products currently in this category will become unassigned, but will not be deleted.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeletingCategory(null)}
                className="w-1/2 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmDeleteCategory}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {actionLoading ? 'Removing...' : 'Remove Category'}
              </button>
            </div>
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
      {/* IMAGE CROP & ROTATE MODAL */}
      {/* ======================================================== */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        imageSrc={cropperModal.imageSrc}
        title={cropperModal.title || (cropperModal.type === 'logo' ? 'Crop & Rotate Store Logo' : 'Crop & Rotate Product Image')}
        initialAspectRatio={cropperModal.aspectRatio || '1:1'}
        circularCrop={cropperModal.circularCrop || false}
        onClose={() => setCropperModal({ isOpen: false, imageSrc: '', targetIndex: null, originalFile: null, type: 'product' })}
        onSave={handleSaveCroppedImage}
        onSkip={cropperModal.targetIndex === null && cropperModal.originalFile ? handleSkipCrop : null}
      />
    </div>
  );
}
