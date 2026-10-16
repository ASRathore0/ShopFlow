import React, { useState } from 'react';
import {
  Store, MapPin, Phone, Mail, Clock, Sparkles, ShieldCheck,
  Wifi, ExternalLink, Share2, Check, ArrowUp, MessageCircle,
  Globe, HelpCircle, Layers, Tag, ChevronRight, Award, Truck,
  CheckCircle2, Copy, Navigation, Smartphone, ArrowRight, Shield
} from 'lucide-react';
import { getThemeConfig } from '../utils/storefrontThemes';

export default function CustomerFooter({ shop, categories = [], onSelectCategory, customerCode, onTrackClick }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const themeConfig = getThemeConfig(shop);
  const portalSettings = shop?.customer_portal_settings || {};
  const socialLinks = portalSettings.social_links || {};

  const fullAddress = shop?.address || 'Showroom Floor';
  const cityState = [portalSettings.city, portalSettings.state, portalSettings.postal_code].filter(Boolean).join(', ');
  const landmark = portalSettings.landmark || '';
  const tagline = portalSettings.tagline || 'Authorized Physical Retail Showroom';
  const openingHours = shop?.opening_hours || '9:00 AM - 9:30 PM';
  const exchangePolicy = portalSettings.exchange_policy || '7 Days Instant Showroom Exchange';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyWifi = () => {
    if (portalSettings.wifi_password) {
      navigator.clipboard.writeText(portalSettings.wifi_password);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanPhoneForWhatsApp = (portalSettings.whatsapp_number || shop?.phone || '').replace(/[^0-9]/g, '');

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
    <footer className="mt-20 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0A0A0D] text-slate-700 dark:text-zinc-300 transition-colors">

      {/* 2. MAIN EDITORIAL STORE DIRECTORY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          
          {/* Brand Prestige & Digital Amenity Pass (4 Columns) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              {logoSrc && !logoFailed ? (
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 p-1 border border-slate-200 dark:border-white/10 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={logoSrc}
                    alt={shop?.name || 'Store Logo'}
                    className="w-full h-full object-contain rounded-xl"
                    onError={() => setLogoFailed(true)}
                  />
                </div>
              ) : (
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${themeConfig.accentGradient} flex items-center justify-center font-black text-white text-lg shadow-md ${themeConfig.glowClass} shrink-0`}
                  style={themeConfig.isCustom ? { backgroundColor: themeConfig.primaryColor } : {}}
                >
                  {shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate tracking-tight">
                  {shop?.name || 'Store Showroom'}
                </h3>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider block truncate"
                  style={{ color: themeConfig.primaryColor }}
                >
                  {tagline}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed pr-2">
              {shop?.description ||
                `Welcome to ${shop?.name || 'our flagship showroom'}. Scan table QR codes throughout the store to explore inventory, view aisle micro-locations, and request instant physical assistance.`}
            </p>

            {/* Luxury Amenity Pass: Wi-Fi & Live Showroom Status */}
            <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Store Amenities
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                  <span className={`w-2 h-2 rounded-full ${shop?.is_open !== false ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'}`} />
                  <span className={shop?.is_open !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                    {shop?.is_open !== false ? 'Open Today' : 'Closed'}
                  </span>
                </span>
              </div>

              {portalSettings.wifi_ssid && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Wifi className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 text-[11px]">
                      <div className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                        Wi-Fi: {portalSettings.wifi_ssid}
                      </div>
                      {portalSettings.wifi_password && (
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                          Pass: {portalSettings.wifi_password}
                        </div>
                      )}
                    </div>
                  </div>

                  {portalSettings.wifi_password && (
                    <button
                      type="button"
                      onClick={handleCopyWifi}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      title="Copy Wi-Fi password"
                    >
                      {copiedWifi ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      <span>{copiedWifi ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Products & Convenience (Parallel 2 Columns on Mobile & Tablet, 4 Columns on Desktop) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-4 grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Showroom Collections / Categories */}
            <div className="space-y-4 min-w-0">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Products</span>
              </h4>

              <ul className="space-y-2 text-xs">
                {categories && categories.length > 0 ? (
                  categories.slice(0, 6).map((cat) => (
                    <li key={cat.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectCategory && onSelectCategory(cat.slug || cat.id)}
                        className="text-left text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 group cursor-pointer w-full"
                      >
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        <span className="truncate">{cat.name}</span>
                      </button>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="text-slate-500 dark:text-zinc-400 truncate">Main Floor Display</li>
                    <li className="text-slate-500 dark:text-zinc-400 truncate">Featured Showcase</li>
                    <li className="text-slate-500 dark:text-zinc-400 truncate">New Arrivals</li>
                  </>
                )}
              </ul>
            </div>

            {/* In-Store Convenience */}
            <div className="space-y-4 min-w-0">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Convenience</span>
              </h4>

              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400">
                <li className="min-w-0">
                  <button
                    type="button"
                    onClick={onTrackClick}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer w-full"
                  >
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">Track Staff Dispatch</span>
                  </button>
                </li>
                <li className="min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 w-full">
                    <Award className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{exchangePolicy}</span>
                  </div>
                </li>
                <li className="min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 w-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">Physical Warranty Support</span>
                  </div>
                </li>
                <li className="min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 w-full">
                    <Smartphone className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">Zero-App Floor Assistance</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Showroom Location & Hours (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Location</span>
            </h4>

            <div className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
              <p className="font-bold text-slate-900 dark:text-white leading-snug">
                {fullAddress}
              </p>
              {landmark && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Floor / Landmark: <strong className="text-slate-700 dark:text-zinc-300 font-semibold">{landmark}</strong>
                </p>
              )}
              {cityState && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {cityState}
                </p>
              )}

              <div className="pt-1.5">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop?.name || ''} ${fullAddress} ${cityState}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.05] text-[11px]">
                <span className="text-slate-400 dark:text-zinc-500 block">Showroom Hours:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{openingHours}</span>
              </div>
            </div>
          </div>

          {/* VIP Desk & Direct Contacts (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Direct Desk</span>
            </h4>

            <div className="space-y-3 text-xs">
              {cleanPhoneForWhatsApp && (
                <a
                  href={`https://wa.me/${cleanPhoneForWhatsApp}?text=${encodeURIComponent(`Hi ${shop?.name || 'Store'}, I am currently viewing your in-store showroom.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              )}

              {shop?.phone && (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Phone</span>
                  <a
                    href={`tel:${shop.phone}`}
                    className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 text-xs truncate"
                  >
                    <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{shop.phone}</span>
                  </a>
                </div>
              )}

              {shop?.email && (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Email</span>
                  <a
                    href={`mailto:${shop.email}`}
                    className="font-semibold text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 text-[11px] truncate"
                  >
                    <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">{shop.email}</span>
                  </a>
                </div>
              )}

              {/* Social Channels */}
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1.5">
                  Follow Showroom
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Instagram"
                      className="p-2 rounded-xl bg-white dark:bg-white/[0.04] text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-slate-200/80 dark:border-white/[0.08] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}

                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Facebook"
                      className="p-2 rounded-xl bg-white dark:bg-white/[0.04] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-white/[0.08] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                      </svg>
                    </a>
                  )}

                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://x.com/${socialLinks.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      title="X (Twitter)"
                      className="p-2 rounded-xl bg-white dark:bg-white/[0.04] text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-white/[0.08] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                  )}

                  {socialLinks.youtube && (
                    <a
                      href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`}
                      target="_blank"
                      rel="noreferrer"
                      title="YouTube"
                      className="p-2 rounded-xl bg-white dark:bg-white/[0.04] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200/80 dark:border-white/[0.08] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    </a>
                  )}

                  {socialLinks.website && (
                    <a
                      href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Official Website"
                      className="p-2 rounded-xl bg-white dark:bg-white/[0.04] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-white/[0.08] transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-2.5 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/[0.08] text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Share2 className="w-3 h-3 text-slate-400" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share Showroom'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* 3. BOTTOM PRECISION BAR (Heritage, Legal & Back-To-Top) */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-500 gap-4 text-center md:text-left">
          
          <div className="space-y-1">
            <p className="font-medium text-slate-700 dark:text-zinc-400">
              © {new Date().getFullYear()} <strong className="text-slate-900 dark:text-white font-bold">{shop?.name || 'Retail Showroom'}</strong>. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
              <span className="flex items-center gap-1 font-mono font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-white/[0.05]">
                <ShieldCheck className="w-3 h-3 text-blue-500" />
                Shopper ID: {customerCode || 'ANON'}
              </span>
              <span>•</span>
              <span>In-Store QR Connected</span>
              <span>•</span>
              <span>Instant Floor Associate Dispatch</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={scrollToTop}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.08] transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95 cursor-pointer"
              title="Return to top of showroom"
            >
              <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
              <span>Back to Top</span>
            </button>
          </div>

        </div>

      </div>
    </footer>
  );
}
