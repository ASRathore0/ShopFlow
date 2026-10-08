import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, Sparkles, Check, ArrowRight, ArrowLeft, Shield, Users,
  MapPin, Phone, Mail, Lock, QrCode, ExternalLink, Loader2, X,
  ShoppingBag, Laptop, Shirt, Compass, CheckCircle2, AlertCircle, Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function OnboardShopModal({ isOpen, onClose, initialPlan = 'growth' }) {
  const { registerShop, login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Store info, 2: Owner account, 3: Plan & confirmation, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    shop_name: '',
    shop_type: 'electronics',
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    plan_slug: initialPlan,
  });

  if (!isOpen) return null;

  const verticalOptions = [
    { id: 'electronics', name: 'Electronics & Gadgets', icon: Laptop, desc: 'Laptops, phones & audio' },
    { id: 'clothing', name: 'Clothing & Fashion', icon: Shirt, desc: 'Apparel, sizes & racks' },
    { id: 'footwear', name: 'Footwear & Sneakers', icon: Compass, desc: 'Shoe display walls & boxes' },
    { id: 'general', name: 'Retail / General Store', icon: ShoppingBag, desc: 'Mixed showroom catalog' },
  ];

  const planOptions = [
    {
      id: 'starter',
      name: 'Starter',
      price: '₹49',
      period: '/mo',
      desc: 'Single showroom store',
      features: ['Up to 5 staff', 'Shelf location finder', 'Entrance QR signage'],
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '₹129',
      period: '/mo',
      badge: 'RECOMMENDED',
      desc: 'High-traffic retail store',
      features: ['Up to 15 staff', 'Auto request dispatching', '2D store layout', 'Smart demand analytics'],
    },
    {
      id: 'business',
      name: 'Business',
      price: '₹299',
      period: '/mo',
      desc: 'Multi-floor department store',
      features: ['Up to 50 staff', 'Multi-zone floor routing', 'Inventory replenishment audits'],
    },
  ];

  const previewSlug = form.shop_name
    ? form.shop_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-₹)/g, '')
    : 'your-store';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await registerShop({
        shop_name: form.shop_name,
        shop_type: form.shop_type,
        owner_name: form.owner_name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });

      if (res.success) {
        setCreatedResult(res);
        setStep(4); // Success screen
      } else {
        setError(res.message || 'Onboarding failed. Please review your details.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsNewOwner = async () => {
    const ownerEmail = createdResult?.owner?.email || createdResult?.user?.email || form.email;
    const ownerPass = createdResult?.initial_password || form.password;
    setLoading(true);
    const res = await login(ownerEmail, ownerPass);
    setLoading(false);
    if (res.success) {
      onClose();
      navigate('/admin');
    } else {
      setError(res.message || 'Failed to authenticate as new shop owner.');
    }
  };

  const handleCopyCredentials = () => {
    const ownerEmail = createdResult?.owner?.email || createdResult?.user?.email || form.email;
    const ownerPass = createdResult?.initial_password || form.password;
    const text = `ShopFlow Retail OS Login Credentials\nStore: ${createdResult?.shop?.name}\nEmail: ${ownerEmail}\nPassword: ${ownerPass}\nLogin Portal: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 dark:bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#151518] border border-slate-200 dark:border-zinc-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {step === 4 ? 'Store Activated!' : 'Onboard Your Retail Store'}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400">
                {step === 4
                  ? 'Your store is live with starter layout & catalog'
                  : `Step ${step} of 3 • 14-day free full-feature trial`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Pills (Steps 1-3) */}
        {step < 4 && (
          <div className="px-5 sm:px-7 pt-4 pb-1 grid grid-cols-3 gap-2 shrink-0">
            <div className={`h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-800'}`} />
            <div className={`h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-800'}`} />
            <div className={`h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-800'}`} />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mx-5 sm:mx-7 mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: STORE PROFILE */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Store Details
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Enter your physical store's name and retail specialty.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Electronics & Gadgets"
                  value={form.shop_name}
                  onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-1 block">
                  Generated Store URL: shopflow.io/shop/{previewSlug}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  Retail Vertical (Tailors Starter Layout & Catalog)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {verticalOptions.map((v) => {
                    const Icon = v.icon;
                    const isSelected = form.shop_type === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setForm({ ...form, shop_type: v.id })}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-xl shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                            {v.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                            {v.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Store Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 234-5678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Physical Store Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 450 Market St, Floor 1"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: OWNER ACCOUNT */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Shop Owner Credentials
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  You'll use these credentials to access the Shop Owner Admin panel.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Business Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@yourstore.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Admin Password * (Min. 6 chars)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Automatic store initialization: When you complete onboarding, your store will be preloaded with starter categories, micro-locations, and a floor staff associate for testing.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: PLAN SELECTION & CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Choose Trial Plan
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  All plans include a 14-day risk-free trial. No payment required today.
                </p>
              </div>

              <div className="space-y-2">
                {planOptions.map((p) => {
                  const isSelected = form.plan_slug === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm({ ...form, plan_slug: p.id })}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {p.name}
                          </span>
                          {p.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {p.features.join(' • ')}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {p.price}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {p.period}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Summary box */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Store Name:</span>
                  <strong className="text-slate-900 dark:text-white">{form.shop_name}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Store Admin:</span>
                  <strong className="text-slate-900 dark:text-white">{form.email}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Retail Category:</span>
                  <strong className="text-slate-900 dark:text-white capitalize">{form.shop_type}</strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ONBOARDING SUCCESS SCREEN */}
          {step === 4 && createdResult && (
            <div className="text-center space-y-4 py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Welcome to ShopFlow, {createdResult.shop?.name}!
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Your store catalog, micro-locations, entrance QR signage, and floor staff dispatcher are now fully active.
                </p>
              </div>

              {/* Ready credentials card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Storefront URL:</span>
                  <a
                    href={`/shop/${createdResult.shop?.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>/shop/{createdResult.shop?.slug}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Admin Email:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">
                    {createdResult.owner?.email || createdResult.user?.email || form.email}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Admin Password:</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    {createdResult.initial_password || form.password}
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400">Assigned Role:</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Shop Owner Admin
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Credentials Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Owner Credentials</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleLoginAsNewOwner}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>Log In As This Shop Owner</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`/shop/${createdResult.shop?.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-500" />
                    <span>Customer QR</span>
                  </a>

                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Done (Super Admin)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation (Steps 1-3) */}
        {step < 4 && (
          <div className="px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !form.shop_name.trim()) {
                    setError('Please enter your shop name.');
                    return;
                  }
                  if (step === 2 && (!form.owner_name.trim() || !form.email.trim() || form.password.length < 6)) {
                    setError('Please fill all owner account fields with valid credentials (password min 6 chars).');
                    return;
                  }
                  setError('');
                  setStep(step + 1);
                }}
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Setting Up Store...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch My Shop</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
