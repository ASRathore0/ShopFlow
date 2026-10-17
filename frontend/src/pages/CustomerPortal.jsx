import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Search, Store, Smartphone, Laptop, Headphones, Tv, Watch, Tag,
  Clock, CheckCircle2, Bookmark, HandHeart, ShieldCheck, ChevronRight,
  Filter, X, Layers, AlertCircle, ShoppingBag, ArrowLeft, RefreshCw,
  Sun, Moon, MapPin, Phone, Mail, Sparkles, HelpCircle, MessageCircle, Wifi
} from 'lucide-react';
import { shopService } from '../services/shopService';
import { useCustomer } from '../context/CustomerContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SearchBar from '../components/SearchBar';
import ProductGrid from '../components/ProductGrid';
import ProductDetailModal from '../components/ProductDetailModal';
import RequestModal from '../components/RequestModal';
import ReservationModal from '../components/ReservationModal';
import RequestStatusBadge from '../components/RequestStatusBadge';
import CustomerFooter from '../components/CustomerFooter';
import { getThemeConfig, hexToRgba } from '../utils/storefrontThemes';

export default function CustomerPortal({ defaultShopSlug }) {
  const { shopSlug: paramShopSlug } = useParams();
  const shopSlug = paramShopSlug || defaultShopSlug;
  const navigate = useNavigate();
  const { sessionToken, customerCode, activeRequests } = useCustomer();
  const { user, isAuthenticated } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  // Return to portal helper for authenticated staff, managers & owners
  const isStaffOrAdmin = isAuthenticated && user && ['staff', 'cashier', 'shop_owner', 'manager', 'super_admin'].includes(user.role);
  const returnDestination = !user ? '/' : user.role === 'super_admin' ? '/super-admin' : ['shop_owner', 'manager'].includes(user.role) ? '/admin' : '/staff';
  const returnLabel = !user ? 'Home' : user.role === 'super_admin' ? 'Super Admin' : ['shop_owner', 'manager'].includes(user.role) ? 'Owner Admin' : 'Staff Portal';

  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home'); // home, requests, info

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [requestTarget, setRequestTarget] = useState(null); // { product, variant }
  const [reserveTarget, setReserveTarget] = useState(null);

  // Load shop & categories
  useEffect(() => {
    async function loadShopData() {
      setLoading(true);
      try {
        const res = await shopService.getShop(shopSlug);
        if (res && res.data) {
          setShop(res.data.shop);
          const rawCats = res.data.categories || [];
          const sortedCats = [...rawCats].sort((a, b) => {
            const orderA = a.display_order ?? 0;
            const orderB = b.display_order ?? 0;
            if (orderA !== orderB) return orderA - orderB;
            return (a.id ?? 0) - (b.id ?? 0);
          });
          setCategories(sortedCats);
        }
      } catch (err) {
        console.error('Failed to load shop', err);
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, [shopSlug]);

  // Load products based on filter
  useEffect(() => {
    async function loadProducts() {
      try {
        const params = {};
        if (selectedCategory) params.category = selectedCategory;
        if (searchQuery) params.q = searchQuery;

        const res = await shopService.getProducts(shopSlug, params);
        if (res && res.data) {
          setProducts(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      }
    }
    loadProducts();
  }, [shopSlug, selectedCategory, searchQuery]);

  const categoryIcons = {
    Mobiles: Smartphone,
    Laptops: Laptop,
    Accessories: Headphones,
    Televisions: Tv,
    'Smart Watches': Watch,
  };

  const portalSettings = shop?.customer_portal_settings || {};
  const themeConfig = getThemeConfig(shop);

  const getCleanLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = import.meta.env?.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:8000';
    return `${backendBase}/${url.replace(/^\//, '')}`;
  };

  const logoSrc = getCleanLogoUrl(shop?.logo_url);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 pb-24 sm:pb-12 transition-colors">
      {/* Optional Store Announcement Ribbon with Themed Gradient */}
      {portalSettings.announcement && (
        <div
          className={`bg-gradient-to-r ${themeConfig.announcementGradient} text-white text-[11px] sm:text-xs py-2 px-4 text-center font-bold shadow-sm flex items-center justify-center gap-2`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-300" />
          <span className="truncate">{portalSettings.announcement}</span>
        </div>
      )}

      {/* Top Shop App Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0E0E11]/90 backdrop-blur-2xl border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
          {/* Store Brand / Info with Real Logo Support */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {logoSrc ? (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white dark:bg-zinc-800 p-1 border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                <img
                  src={logoSrc}
                  alt={shop?.name || 'Store Logo'}
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
                <div
                  className={`hidden w-full h-full bg-gradient-to-tr ${themeConfig.accentGradient} rounded-xl items-center justify-center text-white font-black text-sm`}
                  style={themeConfig.isCustom ? { backgroundColor: themeConfig.primaryColor } : {}}
                >
                  {shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </div>
            ) : (
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr ${themeConfig.accentGradient} text-white flex items-center justify-center font-black text-sm sm:text-base shadow-md ${themeConfig.glowClass} shrink-0`}
                style={themeConfig.isCustom ? { backgroundColor: themeConfig.primaryColor } : {}}
              >
                {shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {shop?.name || 'Store Showroom'}
              </span>
              <span
                className="inline-flex items-center justify-center shrink-0"
                title={shop?.is_open !== false ? 'Store is Open' : 'Store is Closed'}
                aria-label={shop?.is_open !== false ? 'Store is Open' : 'Store is Closed'}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    shop?.is_open !== false
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                      : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                  }`}
                />
              </span>
            </div>
          </div>

          {/* Action Chips: Theme Toggle & Anonymous Customer Token */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border border-slate-200/80 dark:border-zinc-800"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Customer anonymous token badge */}
            <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: themeConfig.primaryColor }} />
              <span className="tracking-tight">{customerCode}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        {/* TAB 1: SHOWROOM CATALOG */}
        {activeTab === 'home' && (
          <>
            {/* DYNAMIC SHOWROOM ENTRANCE (CINEMATIC HERO, GLASS, OR BOUTIQUE) */}
            {themeConfig.headerStyle === 'hero_banner' ? (
              <div className={`relative p-5 sm:p-7 rounded-3xl overflow-hidden text-white shadow-xl ${themeConfig.glowClass} border border-white/10 transition-all`}>
                {themeConfig.heroBannerImage ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                    style={{ backgroundImage: `url(${themeConfig.heroBannerImage})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/80 to-slate-900/60 backdrop-blur-[1.1px]" />
                  </div>
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-r ${themeConfig.headerGradient}`} />
                )}

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md shadow-sm">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>In-Store Virtual Shopping</span>
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black tracking-tight leading-snug">
                      {themeConfig.heroTitle || (shop?.name ? `${shop.name} Collection` : 'Showroom Assistant Active')}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                      {themeConfig.heroSubtitle || 'Browse authentic showroom inventory below. Tap "Show Me" on any item to have our floor associate retrieve it for you.'}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 pt-2 md:pt-0 border-t border-white/10 md:border-t-0">
                    <span className="text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/15 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>{shop?.opening_hours || 'Open Today'}</span>
                    </span>
                    {portalSettings.wifi_ssid && (
                      <span className="text-[10px] sm:text-[11px] font-semibold text-white/80 flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-emerald-300" />
                        <span>Free Wi-Fi: {portalSettings.wifi_ssid}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : themeConfig.headerStyle === 'glassmorphism' ? (
              <div
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border flex items-center justify-between gap-3 shadow-lg transition-all"
                style={{
                  borderColor: hexToRgba(themeConfig.primaryColor, 0.35),
                  boxShadow: `0 8px 30px ${hexToRgba(themeConfig.primaryColor, 0.12)}`,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">
                      {themeConfig.heroTitle || (shop?.name ? `${shop.name} Assistant` : 'Showroom Assistant Active')}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 truncate">
                      {themeConfig.heroSubtitle || 'Tap "Show Me" on any item for private associate assistance.'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap block"
                    style={{
                      backgroundColor: hexToRgba(themeConfig.primaryColor, 0.1),
                      color: themeConfig.primaryColor,
                      borderColor: hexToRgba(themeConfig.primaryColor, 0.25),
                    }}
                  >
                    {shop?.opening_hours || 'Open Today'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-2 px-1 border-b border-slate-200 dark:border-zinc-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeConfig.primaryColor }} />
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {themeConfig.heroTitle || (shop?.name ? `${shop.name} Collection` : 'Live Showroom')}
                  </span>
                  <span className="text-slate-400 dark:text-zinc-500 hidden sm:inline">·</span>
                  <span className="text-slate-500 dark:text-zinc-400 hidden sm:inline">
                    {themeConfig.heroSubtitle || 'Floor staff on duty'}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                  {shop?.opening_hours || 'Open Today'}
                </span>
              </div>
            )}

            {/* Fast Live Search Bar */}
            <SearchBar
              shopSlug={shopSlug}
              shop={shop}
              shopLogo={logoSrc}
              onSelectProduct={(p) => setSelectedProduct(p)}
              placeholder="Search in-store items, SKU, color..."
            />

            {/* Category Filter Pills (Horizontal Touch Slider) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-zinc-400 px-0.5">
                <span>Showroom Categories</span>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    style={{ color: themeConfig.primaryColor }}
                    className="hover:underline text-[11px] font-semibold"
                  >
                    View All ({products.length})
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={selectedCategory === null ? { backgroundColor: themeConfig.primaryColor } : {}}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    selectedCategory === null
                      ? 'text-white shadow-md ring-2 ring-white/20'
                      : 'bg-white dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  All Products
                </button>

                {categories.map((c) => {
                  const Icon = categoryIcons[c.name] || Tag;
                  const isSelected = selectedCategory === c.slug;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.slug)}
                      style={isSelected ? { backgroundColor: themeConfig.primaryColor } : {}}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        isSelected
                          ? 'text-white shadow-md ring-2 ring-white/20'
                          : 'bg-white dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In-Session Active Requests Sticky Banner */}
            {activeRequests.length > 0 && (
              <div
                className="p-3.5 rounded-2xl border flex items-center justify-between shadow-sm transition-all animate-fade-in"
                style={{
                  backgroundColor: hexToRgba(themeConfig.primaryColor, 0.08),
                  borderColor: hexToRgba(themeConfig.primaryColor, 0.28),
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="relative w-8 h-8 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-md"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    <HandHeart className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-zinc-900 animate-ping"></span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block truncate">
                      {activeRequests.length} Active Floor Request(s)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                      Staff associate is retrieving your item
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="px-3.5 py-1.5 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md whitespace-nowrap ml-2"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  Track Live
                </button>
              </div>
            )}

            {/* Product Catalog Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-zinc-400 px-0.5">
                <span>In-Store Products ({products.length})</span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">Tap to inspect or request</span>
              </div>

              <ProductGrid
                products={products}
                loading={loading}
                shop={shop}
                shopLogo={logoSrc}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onRequestProduct={(p) => setRequestTarget({ product: p, variant: null })}
                onResetFilter={() => { setSelectedCategory(null); setSearchQuery(''); }}
              />
            </div>
          </>
        )}

        {/* TAB 2: MY REQUESTS QUEUE */}
        {activeTab === 'requests' && (
          <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">Your Assistance Requests</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Requests sent from session token <strong className="font-mono text-slate-700 dark:text-zinc-300">{customerCode}</strong>
                </p>
              </div>
            </div>

            {activeRequests.length === 0 ? (
              <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 text-center space-y-3 shadow-sm max-w-md mx-auto my-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 flex items-center justify-center mx-auto shadow-inner">
                  <HandHeart className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">No Active Requests</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Browse any showroom product and tap <strong className="text-blue-600 dark:text-blue-400">"SHOW ME"</strong> to dispatch a staff associate with the item.
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Browse Store Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => navigate(`/shop/${shopSlug}/request/${req.request_number}`)}
                    className="p-4 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-zinc-700 transition-all cursor-pointer space-y-3 group shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                        {req.request_number}
                      </span>
                      <RequestStatusBadge status={req.status} size="sm" />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {req.items?.[0]?.product?.name || 'Product'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                          Variant: {req.items?.[0]?.variant_description || 'Standard'} • {req.items?.[0]?.quantity || 1} unit
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 dark:text-zinc-500 dark:group-hover:text-white transition-colors flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SHOP INFO */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                {logoSrc ? (
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 p-1 border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={logoSrc}
                      alt={shop?.name}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-600/25 shrink-0">
                    {shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">{shop?.name}</h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{portalSettings.tagline || 'Showroom Assistance'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">{shop?.opening_hours || '9:00 AM - 9:30 PM'}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                {shop?.description || 'Smart physical showroom with live staff dispatch.'}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 text-xs text-slate-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span><strong>Address:</strong> {shop?.address || 'Silicon Plaza, Floor 1'}</span>
                </div>
                {portalSettings.landmark && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-4 h-4 flex items-center justify-center font-bold text-[10px] text-slate-400">📍</span>
                    <span><strong>Landmark:</strong> {portalSettings.landmark}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span><strong>Phone:</strong> <a href={`tel:${shop?.phone}`} className="hover:underline">{shop?.phone || '+1 (555) 234-5678'}</a></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span><strong>Email:</strong> <a href={`mailto:${shop?.email}`} className="hover:underline">{shop?.email || 'contact@abcelectronics.com'}</a></span>
                </div>
              </div>

              {/* Direct Actions in Info tab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                {shop?.phone && (
                  <a
                    href={`https://wa.me/${(portalSettings.whatsapp_number || shop.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${shop.name}, I am visiting your store.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Showroom</span>
                  </a>
                )}
                {portalSettings.wifi_ssid && (
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Wi-Fi: {portalSettings.wifi_ssid}</span>
                    </div>
                    {portalSettings.wifi_password && (
                      <span className="text-[10px] font-mono text-slate-500">({portalSettings.wifi_password})</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* How it works card */}
            <div className="p-5 rounded-3xl bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                How In-Store Assistance Works
              </h4>
              <ul className="text-xs text-slate-600 dark:text-zinc-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600/10 text-blue-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Browse models or search for specific colors, models, or storage options.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600/10 text-blue-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Tap <strong>"SHOW ME"</strong> to dispatch a staff associate with the product.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600/10 text-blue-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Track staff arrival live on your screen using your anonymous session code.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Professional In-Store Customer Footer */}
      <CustomerFooter
        shop={shop}
        categories={categories}
        onSelectCategory={(slug) => {
          setSelectedCategory(slug);
          setActiveTab('home');
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
        customerCode={customerCode}
        onTrackClick={() => setActiveTab('requests')}
      />

      {/* Mobile-First Bottom Navigation Dock (390px Optimized single-hand navigation) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#111113]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800/80 sm:hidden transition-colors">
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('home')}
            style={activeTab === 'home' ? { color: themeConfig.primaryColor } : {}}
            className={`flex flex-col items-center justify-center space-y-1 transition-all active:scale-95 ${
              activeTab === 'home'
                ? 'font-extrabold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            style={activeTab === 'requests' ? { color: themeConfig.primaryColor } : {}}
            className={`flex flex-col items-center justify-center space-y-1 transition-all relative active:scale-95 ${
              activeTab === 'requests'
                ? 'font-extrabold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <HandHeart className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">My Requests</span>
            {activeRequests.length > 0 && (
              <span
                className="absolute top-2.5 right-6 px-1.5 py-0.2 rounded-full text-white text-[9px] font-bold shadow-sm"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                {activeRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('info')}
            style={activeTab === 'info' ? { color: themeConfig.primaryColor } : {}}
            className={`flex flex-col items-center justify-center space-y-1 transition-all active:scale-95 ${
              activeTab === 'info'
                ? 'font-extrabold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Store Info</span>
          </button>
        </div>
      </nav>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          shop={shop}
          shopLogo={logoSrc}
          onClose={() => setSelectedProduct(null)}
          onRequest={(p, v) => {
            setSelectedProduct(null);
            setRequestTarget({ product: p, variant: v });
          }}
          onReserve={(p, v) => {
            setSelectedProduct(null);
            setReserveTarget({ product: p, variant: v });
          }}
        />
      )}

      {/* "SHOW ME THIS PRODUCT" Request Modal */}
      {requestTarget && (
        <RequestModal
          product={requestTarget.product}
          variant={requestTarget.variant}
          shopSlug={shopSlug}
          shopLogo={logoSrc}
          onClose={() => setRequestTarget(null)}
          onSuccess={(req) => {
            setRequestTarget(null);
            setActiveTab('requests');
          }}
        />
      )}

      {/* In-Store Reservation Modal */}
      {reserveTarget && (
        <ReservationModal
          product={reserveTarget.product}
          variant={reserveTarget.variant}
          shopSlug={shopSlug}
          shopLogo={logoSrc}
          onClose={() => setReserveTarget(null)}
        />
      )}
      {/* Floating Return Button for Staff & Shop Owner (Strictly only visible to logged-in staff/admin) */}
      {isStaffOrAdmin && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
          <Link
            to={returnDestination}
            className="px-4 py-2.5 rounded-full bg-slate-900/95 dark:bg-zinc-800/95 hover:bg-blue-600 dark:hover:bg-blue-600 text-white shadow-2xl border border-slate-700 dark:border-zinc-600 text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-md active:scale-95 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Return to {returnLabel}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </Link>
        </div>
      )}
    </div>
  );
}

