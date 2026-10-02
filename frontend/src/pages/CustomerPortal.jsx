import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Search, Store, Smartphone, Laptop, Headphones, Tv, Watch, Tag,
  Clock, CheckCircle2, Bookmark, HandHeart, ShieldCheck, ChevronRight,
  Filter, X, Layers, AlertCircle, ShoppingBag, ArrowLeft, RefreshCw,
  Sun, Moon, MapPin, Phone, Mail, Sparkles, HelpCircle
} from 'lucide-react';
import { shopService } from '../services/shopService';
import { useCustomer } from '../context/CustomerContext';
import { useTheme } from '../context/ThemeContext';
import SearchBar from '../components/SearchBar';
import ProductGrid from '../components/ProductGrid';
import ProductDetailModal from '../components/ProductDetailModal';
import RequestModal from '../components/RequestModal';
import ReservationModal from '../components/ReservationModal';
import RequestStatusBadge from '../components/RequestStatusBadge';

export default function CustomerPortal() {
  const { shopSlug } = useParams();
  const navigate = useNavigate();
  const { sessionToken, customerCode, activeRequests } = useCustomer();
  const { theme, isDark, toggleTheme } = useTheme();

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
          setCategories(res.data.categories || []);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 pb-24 sm:pb-12 selection:bg-blue-600 transition-colors">
      {/* Top Shop App Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#111113]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
          {/* Store Brand / Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20 flex-shrink-0">
              {shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {shop?.name || 'Store Showroom'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Open
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate -mt-0.5">
                {shop?.address || 'Physical Showroom Floor'}
              </span>
            </div>
          </div>

          {/* Action Chips: Theme Toggle & Anonymous Customer Token */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border border-slate-200/80 dark:border-zinc-800"
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
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="tracking-tight">{customerCode}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-3.5 sm:pt-6 space-y-5">
        {/* TAB 1: SHOWROOM CATALOG */}
        {activeTab === 'home' && (
          <>
            {/* Showroom Status Card (Slim, Native & Modern) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black tracking-tight leading-snug truncate">
                    Showroom Assistant Active
                  </div>
                  <p className="text-[10px] text-blue-100 truncate">
                    Tap <strong className="text-white font-bold">"Show Me"</strong> on any item for floor assistance
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md whitespace-nowrap block">
                  {shop?.opening_hours || 'Open Today'}
                </span>
              </div>
            </div>

            {/* Fast Live Search Bar */}
            <SearchBar
              shopSlug={shopSlug}
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
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold"
                  >
                    View All ({products.length})
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-600/30'
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
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-600/30'
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
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between shadow-sm transition-all animate-fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/30">
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
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 whitespace-nowrap ml-2"
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
                onSelectProduct={(p) => setSelectedProduct(p)}
                onRequestProduct={(p) => setRequestTarget({ product: p, variant: null })}
                onResetFilter={() => { setSelectedCategory(null); setSearchQuery(''); }}
              />
            </div>
          </>
        )}

        {/* TAB 2: MY REQUESTS QUEUE */}
        {activeTab === 'requests' && (
          <div className="space-y-4 animate-fade-in">
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
          <div className="space-y-4 animate-fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-600/25">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{shop?.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{shop?.opening_hours || '9:00 AM - 9:30 PM'}</p>
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
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span><strong>Phone:</strong> {shop?.phone || '+1 (555) 234-5678'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span><strong>Email:</strong> {shop?.email || 'contact@abcelectronics.com'}</span>
                </div>
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

      {/* Mobile-First Bottom Navigation Dock (390px Optimized single-hand navigation) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#111113]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800/80 sm:hidden transition-colors">
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all active:scale-95 ${
              activeTab === 'home'
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all relative active:scale-95 ${
              activeTab === 'requests'
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <HandHeart className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">My Requests</span>
            {activeRequests.length > 0 && (
              <span className="absolute top-2.5 right-6 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold shadow-sm shadow-blue-500/40">
                {activeRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all active:scale-95 ${
              activeTab === 'info'
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
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
          onClose={() => setReserveTarget(null)}
        />
      )}
    </div>
  );
}

