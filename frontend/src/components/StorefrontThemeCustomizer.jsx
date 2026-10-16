import React, { useState } from 'react';
import {
  Palette, Sparkles, Layers, Store, Eye, Check, ExternalLink,
  Image as ImageIcon, Sliders, CheckCircle2, Zap, ArrowRight,
  ShieldCheck, Search, Tag, HandHeart, UploadCloud, RefreshCw
} from 'lucide-react';
import {
  STOREFRONT_THEMES,
  HEADER_STYLES,
  CARD_STYLES,
  getThemeConfig,
  hexToRgba
} from '../utils/storefrontThemes';

export default function StorefrontThemeCustomizer({
  settingsForm,
  setSettingsForm,
  shopSlug,
  isSaving,
  onSave
}) {
  const [activePreviewDevice, setActivePreviewDevice] = useState('mobile'); // 'mobile' | 'desktop'
  const [customColor, setCustomColor] = useState(settingsForm.brand_color || '#2563EB');

  const selectedThemeId = settingsForm.theme_preset || 'midnight_blue';
  const selectedHeaderStyle = settingsForm.header_style || 'hero_banner';
  const selectedCardStyle = settingsForm.card_style || 'modern';

  // Construct a temporary shop object to resolve the live preview theme config
  const previewShop = {
    name: settingsForm.name || 'Nexora Retail',
    logo_url: settingsForm.logo_url,
    brand_color: customColor,
    opening_hours: settingsForm.opening_hours || '10:00 AM - 9:30 PM',
    customer_portal_settings: {
      theme_preset: selectedThemeId,
      brand_color: customColor,
      header_style: selectedHeaderStyle,
      card_style: selectedCardStyle,
      hero_banner_image: settingsForm.hero_banner_image,
      hero_title: settingsForm.hero_title,
      hero_subtitle: settingsForm.hero_subtitle,
      announcement: settingsForm.announcement || '🎉 Grand Showcase: Ask floor staff for instant bundle deals!',
    },
  };

  const currentTheme = getThemeConfig(previewShop);

  const handleSelectTheme = (themeId) => {
    const matched = STOREFRONT_THEMES.find((t) => t.id === themeId);
    const newColor = matched ? matched.primaryColor : customColor;
    setSettingsForm((prev) => ({
      ...prev,
      theme_preset: themeId,
      brand_color: newColor,
    }));
  };

  const handleCustomColorChange = (color) => {
    setCustomColor(color);
    setSettingsForm((prev) => ({
      ...prev,
      theme_preset: 'custom',
      brand_color: color,
    }));
  };

  const handleHeaderStyleChange = (styleId) => {
    setSettingsForm((prev) => ({
      ...prev,
      header_style: styleId,
    }));
  };

  const handleCardStyleChange = (cardId) => {
    setSettingsForm((prev) => ({
      ...prev,
      card_style: cardId,
    }));
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Palette className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Frontstore Theme & Visual Branding Studio
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Customize the look and feel of your customer-facing digital showroom. Choose from our luxury designer presets or tailor your own signature brand colors and layout aesthetics.
          </p>
        </div>

        {shopSlug && (
          <a
            href={`/shop/${shopSlug}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-zinc-700 shrink-0"
          >
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>Open Live Showroom</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        )}
      </div>

      {/* 2-COLUMN STUDIO WORKBENCH: CONTROLS (LEFT) + LIVE STORE SIMULATOR (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: THEME CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. DESIGNER THEME PRESETS */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Curated Designer Palettes
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                6 Luxury Presets
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STOREFRONT_THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`relative p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between gap-3 group cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50 dark:bg-zinc-900/90 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : 'bg-white dark:bg-[#18181B] border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Top Row: Name + Swatch */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {theme.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 block">
                          {theme.category}
                        </span>
                      </div>

                      {/* 3-Dot Color Swatch */}
                      <div className="flex items-center -space-x-1.5 shrink-0 p-1 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                        {theme.swatchColors.map((color, idx) => (
                          <span
                            key={idx}
                            className="w-3.5 h-3.5 rounded-full ring-1 ring-white dark:ring-zinc-900 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Tagline */}
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      {theme.tagline}
                    </p>

                    {/* Gradient Bar Accent */}
                    <div
                      className={`h-1.5 w-full rounded-full bg-gradient-to-r ${theme.accentGradient} opacity-90`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Custom Brand Color Option */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Custom Signature Hex Code
                    </span>
                    {selectedThemeId === 'custom' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Use your exact official brand hex color code
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                    title="Choose custom brand color"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    placeholder="#2563EB"
                    className="w-24 px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-mono text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. HEADER & HERO SHOWCASE STYLE */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Header & Hero Banner Style
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Storefront Entrance
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {HEADER_STYLES.map((style) => {
                const isSelected = selectedHeaderStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => handleHeaderStyleChange(style.id)}
                    className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                        : 'bg-white dark:bg-[#18181B] border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                        {style.badge}
                      </span>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                        {style.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      {style.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Hero Titles & Optional Banner Image */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Hero Showcase Headline (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Next-Gen Electronics & Private Floor Concierge"
                    value={settingsForm.hero_title || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hero_title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Hero Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tap 'Show Me' on any flagship item for immediate assistance"
                    value={settingsForm.hero_subtitle || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Custom Hero Background Banner Image (Optional URL)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Adds a cinematic wallpaper under the hero header</span>
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
                    value={settingsForm.hero_banner_image || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hero_banner_image: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {settingsForm.hero_banner_image && (
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, hero_banner_image: '' })}
                      className="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. PRODUCT CARD AESTHETIC STYLE */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Catalog Product Card Geometry
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Visual Feel
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CARD_STYLES.map((card) => {
                const isSelected = selectedCardStyle === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleCardStyleChange(card.id)}
                    className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-white dark:bg-[#18181B] border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                      {card.name}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      {card.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME STOREFRONT SIMULATOR (5 COLS) */}
        <div className="lg:col-span-5 sticky top-24 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                Live Storefront Simulator
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActivePreviewDevice('mobile')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activePreviewDevice === 'mobile'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
                }`}
              >
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewDevice('desktop')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activePreviewDevice === 'desktop'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
                }`}
              >
                Showroom View
              </button>
            </div>
          </div>

          {/* SIMULATED DEVICE FRAME */}
          <div
            className={`mx-auto rounded-[32px] p-3 transition-all duration-300 border-4 border-slate-800/90 dark:border-zinc-700 shadow-2xl bg-slate-900/95 text-slate-100 overflow-hidden ${
              activePreviewDevice === 'mobile' ? 'max-w-sm' : 'w-full'
            }`}
          >
            {/* Device Speaker Notch */}
            <div className="w-20 h-3.5 bg-slate-800 dark:bg-zinc-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-slate-700 dark:bg-zinc-700" />
            </div>

            {/* SCREEN VIEWPORT */}
            <div className="rounded-[22px] bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 overflow-hidden shadow-inner text-left font-sans border border-slate-200/50 dark:border-zinc-800">
              {/* 1. ANNOUNCEMENT RIBBON */}
              {settingsForm.announcement && (
                <div
                  className={`py-1.5 px-3 text-[10px] text-white font-bold text-center flex items-center justify-center gap-1.5 shadow-sm bg-gradient-to-r ${currentTheme.announcementGradient}`}
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse shrink-0" />
                  <span className="truncate">{settingsForm.announcement}</span>
                </div>
              )}

              {/* 2. SIMULATED TOP APP HEADER */}
              <div className="p-3 bg-white/90 dark:bg-[#0E0E11]/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {settingsForm.logo_url ? (
                    <img
                      src={settingsForm.logo_url}
                      alt="Logo"
                      className="w-7 h-7 rounded-lg object-contain bg-white dark:bg-zinc-800 p-0.5 border border-slate-200 dark:border-zinc-700 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: currentTheme.primaryColor }}
                    >
                      {settingsForm.name ? settingsForm.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {settingsForm.name || 'Nexora Retail'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>

                <div className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[9px] font-mono font-bold text-slate-600 dark:text-zinc-400">
                  #SHOP-402
                </div>
              </div>

              {/* 3. SIMULATED HERO BANNER */}
              {selectedHeaderStyle === 'hero_banner' && (
                <div className="relative p-3.5 overflow-hidden text-white">
                  {/* Background Wallpaper if provided */}
                  {settingsForm.hero_banner_image ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${settingsForm.hero_banner_image})` }}
                    >
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]" />
                    </div>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-r ${currentTheme.headerGradient}`} />
                  )}

                  <div className="relative z-10 space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md inline-block">
                      Showroom Concierge Active
                    </span>
                    <h4 className="text-xs font-black tracking-tight leading-snug">
                      {settingsForm.hero_title || 'Flagship Physical Showroom'}
                    </h4>
                    <p className="text-[10px] text-white/80 leading-tight">
                      {settingsForm.hero_subtitle || 'Tap "Show Me" on any item for immediate associate assistance.'}
                    </p>
                  </div>
                </div>
              )}

              {/* 4. SIMULATED SEARCH BAR */}
              <div className="p-3 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <div className="w-full bg-white dark:bg-zinc-900 py-1.5 pl-8 pr-3 text-[11px] text-slate-400 rounded-xl border border-slate-200 dark:border-zinc-800">
                    Search in-store items, SKU...
                  </div>
                </div>

                {/* 5. SIMULATED CATEGORY CHIPS */}
                <div className="flex gap-1.5 overflow-x-hidden text-[10px] font-bold">
                  <span
                    className="px-2.5 py-1 rounded-xl text-white shadow-sm shrink-0"
                    style={{ backgroundColor: currentTheme.primaryColor }}
                  >
                    All Items
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 shrink-0">
                    Smartphones
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 shrink-0">
                    Laptops
                  </span>
                </div>

                {/* 6. SIMULATED PRODUCT CARD (WITH THEMED CARD GEOMETRY) */}
                <div
                  className={`p-2.5 bg-white dark:bg-[#18181B] border transition-all shadow-sm ${
                    selectedCardStyle === 'elevated_luxe'
                      ? 'rounded-2xl border-slate-200 dark:border-zinc-700 shadow-md ring-1 ring-black/5 dark:ring-white/5'
                      : selectedCardStyle === 'glass'
                      ? 'rounded-2xl border-white/20 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md'
                      : 'rounded-2xl border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex gap-2.5 items-center">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-slate-400 shrink-0">
                      IMG
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Flagship Series
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        Pro Titanium 256GB
                      </h5>
                      <div className="flex items-center justify-between pt-1">
                        <span
                          className="font-black text-xs"
                          style={{ color: currentTheme.primaryColor }}
                        >
                          $1,199.00
                        </span>

                        {/* Theme Gradient CTA Button */}
                        <div
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1 ${currentTheme.ctaGradient}`}
                          style={currentTheme.isCustom ? { backgroundColor: currentTheme.primaryColor } : {}}
                        >
                          <HandHeart className="w-2.5 h-2.5" />
                          <span>Show Me</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. SIMULATED ACTIVE REQUEST TRACKER CHIP */}
                <div
                  className="p-2 rounded-xl flex items-center justify-between text-[10px] font-bold border"
                  style={{
                    backgroundColor: hexToRgba(currentTheme.primaryColor, 0.08),
                    borderColor: hexToRgba(currentTheme.primaryColor, 0.25),
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: currentTheme.primaryColor }}
                    />
                    <span className="text-slate-800 dark:text-zinc-200">
                      Floor Assistant Assigned
                    </span>
                  </div>
                  <span
                    className="font-mono"
                    style={{ color: currentTheme.primaryColor }}
                  >
                    ~2 min
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-400 dark:text-zinc-500 font-medium pt-1">
            ✨ Changes preview live instantly and are applied to all customer devices when saved.
          </p>
        </div>
      </div>
    </div>
  );
}
