import React, { useState } from 'react';
import {
  Store, MapPin, Phone, Mail, Clock, Sparkles, ShieldCheck,
  Wifi, ExternalLink, Share2, Check, ArrowUp, MessageCircle,
  Globe, HelpCircle, Layers, Tag, ChevronRight, Award, Truck,
  CheckCircle2, Copy
} from 'lucide-react';

export default function CustomerFooter({ shop, categories = [], onSelectCategory, customerCode, onTrackClick }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

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
    <footer className="mt-16 border-t border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#0D0D10] text-slate-700 dark:text-zinc-300 transition-colors">
       

      {/* 2. MAIN STORE FOOTER CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand & Store Bio (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3.5">
              {logoSrc && !logoFailed ? (
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 p-1 border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={logoSrc}
                    alt={shop?.name || 'Store Logo'}
                    className="w-full h-full object-contain rounded-xl"
                    onError={() => setLogoFailed(true)}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-500/20 shrink-0">
                  {shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                  {shop?.name || 'Store Showroom'}
                </h3>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block truncate">
                  {tagline}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {shop?.description ||
                `Welcome to ${shop?.name || 'our store'}. Scan in-store QR codes on any display table to check real-time stock, compare specifications, and request immediate hands-on staff assistance.`}
            </p>

            {/* Live Store Status & Wi-Fi Details */}
            <div className="space-y-2.5 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Open for In-Store Visits • {openingHours}</span>
              </div>

              {portalSettings.wifi_ssid && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-zinc-200">
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-blue-500" />
                      <span>Free Store Wi-Fi for Shoppers</span>
                    </div>
                    {portalSettings.wifi_password && (
                      <button
                        onClick={handleCopyWifi}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        {copiedWifi ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedWifi ? 'Password Copied' : 'Copy Key'}</span>
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-1">
                    <span>Network: <strong className="text-slate-800 dark:text-zinc-200 font-mono">{portalSettings.wifi_ssid}</strong></span>
                    {portalSettings.wifi_password && (
                      <span>Password: <strong className="text-slate-800 dark:text-zinc-200 font-mono">{portalSettings.wifi_password}</strong></span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location & Directions (3 Columns) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Showroom Location</span>
            </h4>

            <div className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
              <p className="font-bold text-slate-900 dark:text-white leading-snug">
                {fullAddress}
              </p>
              {landmark && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <span>📍 Floor / Landmark:</span>
                  <strong className="text-slate-700 dark:text-zinc-300">{landmark}</strong>
                </p>
              )}
              {cityState && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {cityState}
                </p>
              )}
            </div>

            <div className="pt-1">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop?.name || ''} ${fullAddress} ${cityState}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Operating Hours: <strong className="text-slate-700 dark:text-zinc-300">{openingHours}</strong></span>
              </div>
            </div>
          </div>

          {/* Store Contacts & Quick Support (3 Columns) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Contact & Assistance</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              {shop?.phone && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Phone Desk</span>
                  <a
                    href={`tel:${shop.phone}`}
                    className="font-bold text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{shop.phone}</span>
                  </a>
                </div>
              )}

              {shop?.email && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Store Email</span>
                  <a
                    href={`mailto:${shop.email}`}
                    className="font-medium text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 mt-0.5 truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    <span className="truncate">{shop.email}</span>
                  </a>
                </div>
              )}

              {cleanPhoneForWhatsApp && (
                <div className="pt-1">
                  <a
                    href={`https://wa.me/${cleanPhoneForWhatsApp}?text=${encodeURIComponent(`Hi ${shop?.name || 'Store'}, I am viewing your showroom catalog.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Social Links & Share Showroom (2 Columns) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-500" />
              <span>Connect</span>
            </h4>

            {/* Social Media Link Buttons */}
            <div className="flex flex-wrap gap-2">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Instagram"
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-slate-200 dark:border-zinc-700 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
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
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-zinc-700 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
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
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
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
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-zinc-700 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
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
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-zinc-700 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}

              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin.startsWith('http') ? socialLinks.linkedin : `https://${socialLinks.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  title="LinkedIn"
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-zinc-700 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                </a>
              )}
            </div>

            {/* Share Showroom Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-zinc-700 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Showroom Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share Showroom Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        

        {/* 4. BOTTOM COPYRIGHT & ATTRIBUTION BAR */}
        <div className="mt-10 pt-6 border-t border-slate-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-500 gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p>© {new Date().getFullYear()} <strong>{shop?.name || 'Store'}</strong>. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
              <span className="flex items-center gap-1 font-mono font-bold text-slate-600 dark:text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Session Token: {customerCode || 'ANON'}
              </span>
              <span>•</span>
              <span>Zero-App In-Store Scanning</span>
              <span>•</span>
              <span>Real-Time Floor Staff Dispatch</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={scrollToTop}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Back to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
