import React from 'react';
import { Store, ShieldCheck, Zap, Globe, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0C] border-t border-[#27272A] text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Store className="w-4 h-4" />
              </div>
              <span>ShopFlow</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Smart physical-shop management & in-store customer assistance platform. Helping retail teams serve customers faster with exact physical product location intelligence.
            </p>
            <div className="flex items-center space-x-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-4">Retail Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/shop/abc-electronics" className="hover:text-white transition-colors">Consumer Electronics Showrooms</Link></li>
              <li><Link to="/shop/urban-vogue" className="hover:text-white transition-colors">Fashion & Apparel Boutiques</Link></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Footwear & Sneaker Retail</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Furniture & Home Decor</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Hardware & Department Stores</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/staff" className="hover:text-white transition-colors">Store Staff Portal</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Shop Owner Admin</Link></li>
              <li><Link to="/super-admin" className="hover:text-white transition-colors">Platform Super-Admin</Link></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Subscription Plans</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Terminal Login</Link></li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-4">Multi-Tenant Architecture</h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Built on React 19, Tailwind CSS, Vite, Laravel 11 REST API, MySQL, and Sanctum token security.
            </p>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div>⚡ Zero-app mobile customer scanning</div>
              <div>📍 Micro-location shelf & rack dispatch</div>
              <div>📊 Real-time queue duration analytics</div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>© {new Date().getFullYear()} ShopFlow Retail Technologies Inc. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Demo Store: ABC Electronics</span>
            <span>Privacy First: Anonymous Session Codes</span>
            <span>REST API v1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
