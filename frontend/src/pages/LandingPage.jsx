import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store, QrCode, Search, Navigation, CheckCircle2, Clock, Users,
  Layers, ArrowRight, ShieldCheck, Zap, Sparkles, BarChart3, Smartphone,
  Package, MapPin, Eye, Check, ChevronRight, Cpu, Play, PlusCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OnboardShopModal from '../components/OnboardShopModal';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { quickLoginAs } = useAuth();
  const navigate = useNavigate();
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardPlan, setOnboardPlan] = useState('growth');

  const handleLaunchRole = async (role, destination) => {
    await quickLoginAs(role);
    navigate(destination);
  };

  const shopTypes = [
    { name: 'Electronics & Gadgets', icon: '💻', slug: 'abc-electronics', tag: 'Flagship Demo' },
    { name: 'Clothing & Fashion', icon: '👕', slug: 'urban-vogue', tag: 'Demo Available' },
    { name: 'Footwear & Sneakers', icon: '👟', desc: 'Size & box location' },
    { name: 'Furniture & Decor', icon: '🛋️', desc: 'Aisle & warehouse bay' },
    { name: 'Cosmetics & Beauty', icon: '💄', desc: 'Shade & batch finder' },
    { name: 'Hardware & Tools', icon: '🔨', desc: 'Bin & part number' },
    { name: 'Grocery & Organic', icon: '🥑', desc: 'Section & shelf stock' },
    { name: 'Eyewear & Optical', icon: '👓', desc: 'Frame & drawer code' },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      desc: 'Ideal for single-location retail shops and local electronics boutiques.',
      features: [
        'Up to 5 staff members',
        'Store entrance QR generator',
        'Customer digital catalog',
        'Physical shelf breadcrumbs',
        'Standard queue tracking',
        'Email & chat support',
      ],
      cta: 'Start with Starter',
      highlighted: false,
    },
    {
      name: 'Growth',
      price: '$129',
      period: '/month',
      badge: 'MOST POPULAR',
      desc: 'For busy multistoried shops needing automatic staff dispatch and store maps.',
      features: [
        'Up to 15 staff members',
        'Interactive 2D store layout map',
        'Auto request dispatching',
        'Barcode & SKU hardware scanning',
        'Real-time queue duration analytics',
        'Lost customer demand reporting',
        'Priority 24/7 staff dispatch support',
      ],
      cta: 'Start 14-Day Trial',
      highlighted: true,
    },
    {
      name: 'Business',
      price: '$299',
      period: '/month',
      desc: 'For high-volume department stores with multiple departments and floors.',
      features: [
        'Up to 50 staff members',
        'Multi-floor zone routing',
        'Automated inventory replenishment',
        'Restock & damage audit trails',
        'POS & ERP integration webhooks',
        'Dedicated onboarding manager',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0C] text-slate-800 dark:text-zinc-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200 overflow-x-hidden w-full">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Subtle background grid & ambient light */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e140_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e140_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
            {/* Tagline pill */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-[11px] sm:text-xs font-semibold backdrop-blur-md max-w-full text-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
              <span className="truncate sm:whitespace-normal">The Smart Physical-Shop Management Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] break-words">
              Turn Crowded Shops Into <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-500">
                Smarter Shopping Experiences.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed px-1">
              Let customers find what they need, request products instantly, and help your staff serve more people without adding unnecessary manpower.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 w-full max-w-md sm:max-w-none mx-auto">
              <button
                type="button"
                onClick={() => {
                  setOnboardPlan('growth');
                  setShowOnboardModal(true);
                }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                Onboard New Shop (Free 14-Day Trial)
              </button>
              <Link
                to="/shop/abc-electronics"
                className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                Customer QR Demo (ABC Electronics)
              </Link>
            </div>

            {/* Trust badge */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Zero app download</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Any mobile browser</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Shelf micro-location</span>
            </div>
          </div>

          {/* Hero Visual Mockup: In-store mobile + Live staff dispatch + Location breadcrumb */}
          <div className="mt-10 sm:mt-14 max-w-5xl mx-auto rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-[#111113]/90 p-4 sm:p-7 lg:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
              {/* Left Column: Customer Mobile Screen simulation */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      ABC
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">ABC Electronics</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Showroom Open
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 font-semibold">
                    CUS-A42
                  </span>
                </div>

                {/* Mobile Product Card Inside */}
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2.5 shadow-sm">
                  <div className="aspect-[16/10] bg-slate-100 dark:bg-zinc-950 rounded-xl overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"
                      alt="MacBook Air"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-sm">
                      In Store Stock
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Apple MacBook Air M4</h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">16GB / 512GB / Midnight</p>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-white shrink-0">$1,299</span>
                  </div>
                </div>

                {/* The "SHOW ME THIS PRODUCT" button */}
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30 text-center space-y-2">
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 block font-medium">Customer presses in mobile browser:</span>
                  <div className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    SHOW ME THIS PRODUCT
                  </div>
                </div>
              </div>

              {/* Right Column: Staff receives immediate location dispatch */}
              <div className="lg:col-span-7 bg-slate-50 dark:bg-[#18181B] border border-blue-500/30 dark:border-blue-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Staff Immediate Dispatch Alert
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold shrink-0">
                    REQ-2026-001025
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-zinc-400">Target Item Requested:</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Apple MacBook Air M4 (Midnight)</div>
                </div>

                {/* EXACT LOCATION VISUALIZER */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 space-y-2.5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    Exact Physical Product Location
                  </div>

                  {/* Breadcrumb row - responsive wrap */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                    <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-bold">FLOOR 1</span>
                    <span className="text-slate-400 dark:text-zinc-600">→</span>
                    <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 font-bold">LAPTOPS</span>
                    <span className="text-slate-400 dark:text-zinc-600">→</span>
                    <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold">AISLE A3</span>
                    <span className="text-slate-400 dark:text-zinc-600">→</span>
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">RACK R07</span>
                    <span className="text-slate-400 dark:text-zinc-600">→</span>
                    <span className="px-2 py-1 rounded-lg bg-pink-500/10 text-pink-700 dark:text-pink-400 border border-pink-500/20 font-bold">SHELF S04</span>
                    <span className="text-slate-400 dark:text-zinc-600">→</span>
                    <span className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 font-bold">POS 12</span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug pt-1">
                    Employee walks directly to Shelf S04, retrieves the Midnight model, and marks "Product Found".
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-zinc-400">Assigned Staff:</span>
                    <span className="font-semibold text-slate-800 dark:text-white">Rahul Sharma</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Waiting Time Reduced by 68%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section: Running A Busy Shop Is Hard */}
      <section className="py-16 sm:py-20 bg-slate-100/70 dark:bg-[#111113]/50 border-y border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              The Physical Retail Challenge
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
              Running A Busy Shop Is Hard.
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-zinc-400">
              Physical retail stores lose revenue in the friction gaps between customers and shelves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Real Problem Cards */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Customers Wait Too Long</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Shoppers enter busy physical shops and have to wait in queues or look around frantically for an unoccupied store employee.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Staff Spend Time Searching</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Employees repeatedly ask: "Where is this model?", "Where is size M?", "Where is the black one?", wasting valuable customer interaction time.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Inventory Disconnected From Location</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                POS systems track units, but do not tell the floor team which Floor, Section, Aisle, Rack, and Shelf holds the customer's preferred variant.
              </p>
            </div>
          </div>

          {/* Solution Highlight banner */}
          <div className="mt-10 sm:mt-12 p-6 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-blue-900/30 border border-blue-200 dark:border-blue-500/30 text-center max-w-4xl mx-auto space-y-2 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">ShopFlow connects your customers, staff, and inventory.</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-xl mx-auto">
              Transform your physical shop floor into an interactive, fast-response retail experience where no customer is left waiting.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works: 4 Steps */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Frictionless 4-Step Flow
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
              How ShopFlow Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Designed for zero setup on the customer's phone and instant micro-location dispatch for employees.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '01',
                title: 'Customer Scans',
                desc: 'Customer scans the QR code placed at your shop entrance or on table displays. No app installation needed.',
                icon: QrCode,
              },
              {
                num: '02',
                title: 'Finds Product',
                desc: 'Customer searches, filters categories, checks real-time in-store stock, and selects their desired color or spec.',
                icon: Search,
              },
              {
                num: '03',
                title: 'Requests Product',
                desc: 'Customer taps "SHOW ME THIS PRODUCT". A priority assistance request with their token is created instantly.',
                icon: Sparkles,
              },
              {
                num: '04',
                title: 'Staff Gets Location',
                desc: 'Employee receives Floor, Section, Aisle, Rack, Shelf, and Position breadcrumb, retrieves item, and brings it to customer.',
                icon: Navigation,
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 relative group hover:border-blue-500/50 hover:shadow-lg transition-all space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-300 dark:text-zinc-700 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-zinc-900 border border-blue-200 dark:border-zinc-700/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Customers vs For Shopkeepers */}
      <section className="py-16 sm:py-20 bg-slate-100/70 dark:bg-[#111113]/60 border-t border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* For Customers */}
            <div id="for-customers" className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20">
                <Smartphone className="w-3.5 h-3.5" />
                FOR CUSTOMERS
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Shop with complete clarity, zero waiting anxiety.
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">Find products faster:</strong> Search entire store catalog by SKU, model, or brand in seconds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">No need to repeatedly call staff:</strong> Tap one button and staff comes directly to you.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">See real-time availability:</strong> Know immediately if your size or color is physically inside the showroom.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">Live queue visibility:</strong> Track which employee was dispatched and estimated minutes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">Zero app installation:</strong> Works straight in mobile Safari, Chrome, and Firefox.</span>
                </li>
              </ul>
              <Link
                to="/shop/abc-electronics"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 pt-2"
              >
                Experience Customer Flow Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* For Shopkeepers */}
            <div id="for-shopkeepers" className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
                <Store className="w-3.5 h-3.5" />
                FOR SHOPKEEPERS & MANAGERS
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Serve 3x more shoppers without doubling staff.
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">Reduce unnecessary staff movement:</strong> Eliminate aimless searching across crowded aisles.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">Know exact product coordinates:</strong> Every item is mapped to Floor, Section, Aisle, Rack, and Shelf.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">Capture lost customer demand:</strong> See what shoppers searched for that was out of stock.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">Peak hour staffing optimization:</strong> Know the exact hours your floor team actually needs extra hands.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900 dark:text-white">Multi-tenant ready:</strong> Configure distinct branding, store hours, and layout hierarchy per shop.</span>
                </li>
              </ul>
              <button
                onClick={() => handleLaunchRole('owner', '/admin')}
                className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-500 pt-2"
              >
                Open Owner Admin Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Shop Types Grid */}
      <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3 mb-10 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Tailored For Physical Retail</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Supported Shop Categories</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">Built to handle high SKU variety and high customer footfall environments.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {shopTypes.map((st, i) => (
              <div
                key={i}
                onClick={() => st.slug && navigate(`/shop/${st.slug}`)}
                className={`p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 space-y-2 transition-all ${
                  st.slug ? 'cursor-pointer hover:border-blue-500 hover:shadow-md' : 'opacity-85'
                }`}
              >
                <div className="text-2xl sm:text-3xl">{st.icon}</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{st.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {st.tag ? (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{st.tag} →</span>
                  ) : (
                    st.desc
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 bg-slate-100/70 dark:bg-[#111113]/40 border-t border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Simple Transparent SaaS Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
              Plans Built for Every Retail Size
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              No long contracts. Switch plans as your customer footfall grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative ${
                  plan.highlighted
                    ? 'bg-white dark:bg-[#18181B] border-2 border-blue-600 dark:border-blue-500 shadow-2xl shadow-blue-500/15'
                    : 'bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold px-3 py-0.5 rounded-full bg-blue-600 text-white shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 min-h-[32px]">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">{plan.period}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-2.5">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      const planKey = plan.name.toLowerCase();
                      setOnboardPlan(planKey === 'business' ? 'enterprise' : planKey);
                      setShowOnboardModal(true);
                    }}
                    className={`w-full py-3 rounded-2xl text-xs font-bold transition-all ${
                      plan.highlighted
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-zinc-800 bg-gradient-to-b from-slate-100 to-slate-200/50 dark:from-[#111113] dark:to-[#0B0B0C] transition-colors">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-5 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Ready to upgrade your physical retail showroom?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-xl mx-auto">
            Onboard your physical shop in 60 seconds with pre-loaded layout, categories and starter inventory.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setOnboardPlan('growth');
                setShowOnboardModal(true);
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Onboard Your Store Now
            </button>
            <Link
              to="/shop/abc-electronics"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all dark:border-zinc-700 shadow-sm"
            >
              Launch ABC Electronics Customer View
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <OnboardShopModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        initialPlan={onboardPlan}
      />
    </div>
  );
}
