import React from 'react';
import { Store, ShieldCheck, Zap, Globe, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-[#0B0B0C] border-t border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-zinc-400 text-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2.5 text-slate-900 dark:text-white font-extrabold text-lg">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Store className="w-4 h-4" />
              </div>
              <span>ShopFlow</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm">
              Smart physical-shop management & in-store customer assistance platform. Helping retail teams serve customers faster with exact physical product location intelligence.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-200 mb-4">Retail Solutions</h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400">
              <li><Link to="/shop/abc-electronics" className="hover:text-blue-600 dark:hover:text-white transition-colors">Consumer Electronics Showrooms</Link></li>
              <li><Link to="/shop/urban-vogue" className="hover:text-blue-600 dark:hover:text-white transition-colors">Fashion & Apparel Boutiques</Link></li>
              <li><a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-white transition-colors">Footwear & Sneaker Retail</a></li>
              <li><a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-white transition-colors">Furniture & Home Decor</a></li>
              <li><a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-white transition-colors">Hardware & Department Stores</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-200 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400">
              <li><Link to="/staff" className="hover:text-blue-600 dark:hover:text-white transition-colors">Store Staff Portal</Link></li>
              <li><Link to="/admin" className="hover:text-blue-600 dark:hover:text-white transition-colors">Shop Owner Admin</Link></li>
              <li><Link to="/super-admin" className="hover:text-blue-600 dark:hover:text-white transition-colors">Platform Super-Admin</Link></li>
              <li><a href="#pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors">Subscription Plans</a></li>
              <li><Link to="/login" className="hover:text-blue-600 dark:hover:text-white transition-colors">Terminal Login</Link></li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-200 mb-4">Multi-Tenant Architecture</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-3">
              Built on React 19, Tailwind CSS, Vite, Laravel 11 REST API, MySQL, and Sanctum token security.
            </p>
            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 space-y-1 shadow-sm">
              <div className="flex items-center gap-1.5"><span className="text-blue-500">⚡</span> Zero-app mobile customer scanning</div>
              <div className="flex items-center gap-1.5"><span className="text-emerald-500">📍</span> Micro-location shelf & rack dispatch</div>
              <div className="flex items-center gap-1.5"><span className="text-purple-500">📊</span> Real-time queue duration analytics</div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-500 gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} ShopFlow Retail Technologies Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs">
            <span>Demo Store: ABC Electronics</span>
            <span>Anonymous Sessions</span>
            <span>REST API v1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
