import React, { useState } from 'react';
import {
  Palette, Sparkles, Layers, Store, Eye, Check, ExternalLink,
  Image as ImageIcon, Sliders, CheckCircle2, Zap, ArrowRight,
  ShieldCheck, Search, Tag, HandHeart, UploadCloud, RefreshCw,
  Smartphone, Monitor, Wifi, BatteryMedium, Crown, Loader2,
  Upload, X, ImagePlus
} from 'lucide-react';
import { adminService } from '../services/adminService';
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
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerInputMode, setBannerInputMode] = useState('upload'); // 'upload' | 'url'
  const [bannerUploadError, setBannerUploadError] = useState('');

  const selectedThemeId = settingsForm.theme_preset || 'midnight_blue';
  const selectedHeaderStyle = settingsForm.header_style || 'hero_banner';
  const selectedCardStyle = settingsForm.card_style || 'modern';

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerUploadError('');
    if (!file.type.startsWith('image/')) {
      setBannerUploadError('Please choose a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setBannerUploadError('Image size must be less than 15MB.');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const res = await adminService.uploadHeroBanner(file);
      const url = res.data?.url || res.url;
      if (url) {
        setSettingsForm((prev) => ({
          ...prev,
          hero_banner_image: url,
          banner_mode: 'clean_image',
          hide_banner_text: true,
        }));
      }
    } catch (err) {
      console.error('Failed to upload hero banner:', err);
      setBannerUploadError(err.response?.data?.message || 'Failed to upload banner image.');
    } finally {
      setIsUploadingBanner(false);
      if (e.target) e.target.value = '';
    }
  };

  // Construct a temporary shop object to resolve the live preview theme config
  const previewShop = {
    name: settingsForm.name || 'Apex Retail Studio',
    logo_url: settingsForm.logo_url,
    brand_color: customColor,
    opening_hours: settingsForm.opening_hours || '10:00 AM - 9:30 PM',
    customer_portal_settings: {
      theme_preset: selectedThemeId,
      brand_color: customColor,
      header_style: selectedHeaderStyle,
      card_style: selectedCardStyle,
      hero_banner_image: settingsForm.hero_banner_image,
      banner_mode: settingsForm.banner_mode || (settingsForm.hero_banner_image ? 'clean_image' : 'overlay'),
      hide_banner_text: Boolean(settingsForm.hide_banner_text),
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
    <div className="space-y-6 animate-fade-in">
      {/* 2-COLUMN STUDIO WORKBENCH: CONTROLS (LEFT 7 COLS) + LIVE STORE SIMULATOR (RIGHT 5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: THEME CONTROLS */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. CURATED DESIGNER PALETTES */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Curated Signature Palettes
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Hand-crafted material themes engineered for high-contrast in-store clarity and luxury feel.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 self-start sm:self-auto border border-slate-200 dark:border-zinc-700">
                6 Master Presets
              </span>
            </div>

            {/* PALETTES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {STOREFRONT_THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between gap-3 group cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-50/90 dark:bg-zinc-900 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/25 shadow-lg shadow-blue-500/10'
                        : 'bg-white dark:bg-[#16161a] border-slate-200/80 dark:border-zinc-800/90 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Palette Title & Category Pill */}
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {theme.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                          {theme.category}
                        </span>
                      </div>

                      {/* Swatch Harmony Strip */}
                      <div className="flex items-center -space-x-1 shrink-0 p-1 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 shadow-inner">
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

                    {/* Bottom Radiant Accent Bar */}
                    <div
                      className={`h-2 w-full rounded-full bg-gradient-to-r ${theme.accentGradient} opacity-90 shadow-sm transition-opacity group-hover:opacity-100`}
                    />
                  </button>
                );
              })}
            </div>

            {/* CUSTOM SIGNATURE HEX CODE DOCK */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Custom Signature Hex Code
                    </span>
                    {selectedThemeId === 'custom' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                        Custom Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Input your exact brand guide primary color. System automatically calibrates tints and contrast.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="relative">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                      title="Choose custom brand color"
                    />
                  </div>
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    placeholder="#2563EB"
                    className="w-24 px-3 py-2 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-mono text-xs font-black rounded-xl border border-slate-200 dark:border-zinc-700 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. HEADER & HERO ENTRANCE STYLE */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Showroom Entrance & Header Architecture
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Controls the opening visual statement shoppers experience upon scanning shelf QR codes.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 self-start sm:self-auto border border-purple-200 dark:border-purple-800">
                Entrance Style
              </span>
            </div>

            {/* 3 ARCHITECTURAL LAYOUT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {HEADER_STYLES.map((style) => {
                const isSelected = selectedHeaderStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => handleHeaderStyleChange(style.id)}
                    className={`p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                        : 'bg-white dark:bg-[#16161a] border-slate-200/80 dark:border-zinc-800/90 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Mini Wireframe Blueprint */}
                    <div className="w-full h-16 rounded-xl bg-slate-100 dark:bg-zinc-800/80 p-2 border border-slate-200 dark:border-zinc-700/80 flex flex-col justify-between overflow-hidden">
                      {style.id === 'hero_banner' ? (
                        <>
                          <div className="h-6 w-full rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 opacity-80 flex items-center px-1.5">
                            <div className="h-1.5 w-12 bg-white/70 rounded-full" />
                          </div>
                          <div className="flex gap-1">
                            <div className="h-4 flex-1 rounded bg-slate-200 dark:bg-zinc-700" />
                            <div className="h-4 flex-1 rounded bg-slate-200 dark:bg-zinc-700" />
                          </div>
                        </>
                      ) : style.id === 'minimalist' ? (
                        <>
                          <div className="h-3.5 w-full rounded bg-slate-300 dark:bg-zinc-700 flex items-center justify-between px-1">
                            <div className="h-1.5 w-6 bg-purple-500 rounded-full" />
                            <div className="h-1.5 w-4 bg-slate-400 rounded-full" />
                          </div>
                          <div className="flex gap-1 pt-1">
                            <div className="h-6 flex-1 rounded bg-slate-200 dark:bg-zinc-700" />
                            <div className="h-6 flex-1 rounded bg-slate-200 dark:bg-zinc-700" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-3 w-16 mx-auto rounded-full bg-purple-600/60" />
                          <div className="h-7 w-full rounded-lg bg-slate-200 dark:bg-zinc-700 border border-dashed border-slate-300 dark:border-zinc-600 flex items-center justify-center">
                            <div className="h-1.5 w-14 bg-slate-400 dark:bg-zinc-500 rounded-full" />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                        {style.badge}
                      </span>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white block">
                        {style.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {style.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Hero Presentation & Device Image Upload */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-4">
              {/* Banner Picture Source Selector */}
              <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                      <ImagePlus className="w-4 h-4 text-blue-500" />
                      <span>Custom Showroom Hero Banner Picture</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Upload a clean photograph or promo banner from your device or paste an image URL.
                    </p>
                  </div>

                  {/* Mode switcher tabs: Upload vs URL */}
                  <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-zinc-800 rounded-xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setBannerInputMode('upload')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        bannerInputMode === 'upload'
                          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                      }`}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerInputMode('url')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        bannerInputMode === 'url'
                          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                      }`}
                    >
                      🔗 Image URL
                    </button>
                  </div>
                </div>

                {/* Prominently Display Recommended Banner Size */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 text-slate-800 dark:text-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm shadow-blue-500/20">
                      📐
                    </span>
                    <div>
                      <span className="text-xs font-black block text-slate-900 dark:text-white">
                        Recommended Banner Dimensions
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                        Exact aspect ratio for crystal-clear mobile & desktop fit
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-mono font-black shadow-sm">
                      1200 × 450 px
                    </span>
                    <span className="px-2 py-1 rounded-xl bg-slate-200 dark:bg-zinc-800 text-[10px] font-bold text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-700">
                      8:3 Ratio
                    </span>
                  </div>
                </div>

                {/* Banner Input Area */}
                {bannerInputMode === 'upload' ? (
                  <div className="space-y-2">
                    <label className="w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                        disabled={isUploadingBanner}
                      />
                      <span className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-[0.99]">
                        {isUploadingBanner ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading Clean Picture...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>{settingsForm.hero_banner_image ? 'Upload New Clean Picture from Device' : 'Select & Upload Picture from Device'}</span>
                          </>
                        )}
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-400 text-center">
                      Supports JPG, PNG, WebP up to 15MB. Best results with 1200×450px banner.
                    </p>
                    {bannerUploadError && (
                      <p className="text-xs font-bold text-rose-500 text-center">
                        {bannerUploadError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
                      value={settingsForm.hero_banner_image || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_banner_image: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 text-slate-900 dark:text-white p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Active Image Preview & Clarity Control */}
                {settingsForm.hero_banner_image && (
                  <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 h-10 rounded-lg bg-cover bg-center border border-slate-200 dark:border-zinc-600 shrink-0" style={{ backgroundImage: `url(${settingsForm.hero_banner_image})` }} />
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                            Active Banner Picture
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            ✓ Ready to display
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, hero_banner_image: '' })}
                        className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Clean Picture vs Text Overlay Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-300">
                        Banner Picture Appearance Mode
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSettingsForm({
                            ...settingsForm,
                            banner_mode: 'clean_image',
                            hide_banner_text: true,
                          })}
                          className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            settingsForm.banner_mode === 'clean_image' || settingsForm.hide_banner_text
                              ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100 shadow-sm'
                              : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black">📸 Clean Picture Only</span>
                            {(settingsForm.banner_mode === 'clean_image' || settingsForm.hide_banner_text) && (
                              <span className="text-[10px] font-extrabold text-emerald-600">Active</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                            Shows your picture crystal clear without blur or dark wash. Text overlay is hidden.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettingsForm({
                            ...settingsForm,
                            banner_mode: 'overlay',
                            hide_banner_text: false,
                          })}
                          className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            settingsForm.banner_mode === 'overlay' && !settingsForm.hide_banner_text
                              ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100 shadow-sm'
                              : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black">🎬 With Headline Overlay</span>
                            {settingsForm.banner_mode === 'overlay' && !settingsForm.hide_banner_text && (
                              <span className="text-[10px] font-extrabold text-blue-600">Active</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                            Keeps picture clear (no blur) and overlays your custom title and subtitle.
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Headline & Subtitle Inputs (Active when not in Clean Picture Only mode) */}
              {(!settingsForm.hide_banner_text && settingsForm.banner_mode !== 'clean_image') ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                      Hero Showcase Headline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flagship Audio & Private Concierge"
                      value={settingsForm.hero_title === '.' ? '' : (settingsForm.hero_title || '')}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_title: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                      Hero Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tap 'Show Me' for immediate floor staff demo"
                      value={settingsForm.hero_subtitle === '.' ? '' : (settingsForm.hero_subtitle || '')}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : settingsForm.hero_banner_image ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Clean Picture Mode Active:</strong> Your picture will be shown in full clarity with zero blur and zero dark overlay.
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* 3. PRODUCT CARD AESTHETIC GEOMETRY */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-zinc-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Catalog Product Card Geometry
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Defines the surface treatment and border curvature of in-store product listings.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 self-start sm:self-auto border border-emerald-200 dark:border-emerald-800">
                Card Physics
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {CARD_STYLES.map((card) => {
                const isSelected = selectedCardStyle === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleCardStyleChange(card.id)}
                    className={`p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-white dark:bg-[#16161a] border-slate-200/80 dark:border-zinc-800/90 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Visual Card Mockup */}
                    <div className="w-full h-14 rounded-xl bg-slate-100 dark:bg-zinc-800/80 p-2 border border-slate-200 dark:border-zinc-700/80 flex items-center gap-2 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-zinc-700 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2 w-14 bg-slate-300 dark:bg-zinc-600 rounded-full" />
                        <div className="h-2 w-8 bg-emerald-500/70 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white block">
                        {card.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME STOREFRONT SIMULATOR (5 COLS) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                Live Storefront Simulator
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActivePreviewDevice('mobile')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activePreviewDevice === 'mobile'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewDevice('desktop')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activePreviewDevice === 'desktop'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>Kiosk</span>
              </button>
            </div>
          </div>

          {/* SIMULATED DEVICE FRAME (APPLE TITANIUM FINISH) */}
          <div
            className={`mx-auto rounded-[38px] p-3 transition-all duration-300 border-4 border-slate-800 dark:border-zinc-700 shadow-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden relative ${
              activePreviewDevice === 'mobile' ? 'max-w-sm' : 'w-full'
            }`}
          >
            {/* Dynamic Island & Notch Pill */}
            <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-between px-2.5">
              <span className="w-2 h-2 rounded-full bg-zinc-800" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
            </div>

            {/* SCREEN VIEWPORT */}
            <div className="rounded-[26px] bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 overflow-hidden shadow-inner text-left font-sans border border-slate-200/50 dark:border-zinc-800">
              {/* TOP STATUS BAR */}
              <div className="px-4 py-1.5 bg-white/80 dark:bg-black/60 backdrop-blur-sm flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/50">
                <span className="font-bold">9:41</span>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3" />
                  <BatteryMedium className="w-3.5 h-3.5" />
                </div>
              </div>

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
                    {settingsForm.name || 'Apex Retail Studio'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </div>

                <div className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[9px] font-mono font-bold text-slate-600 dark:text-zinc-400">
                  #SHOWROOM
                </div>
              </div>

              {/* 3. SIMULATED HERO BANNER */}
              {selectedHeaderStyle === 'hero_banner' && (() => {
                const hasImg = Boolean(settingsForm.hero_banner_image);
                const isOnlyImg = hasImg && (
                  settingsForm.hide_banner_text ||
                  settingsForm.banner_mode === 'clean_image' ||
                  (settingsForm.hero_title === '.' && (settingsForm.hero_subtitle === '.' || !settingsForm.hero_subtitle)) ||
                  (!settingsForm.hero_title?.trim() && !settingsForm.hero_subtitle?.trim())
                );
                const customTitle = (settingsForm.hero_title && settingsForm.hero_title !== '.') ? settingsForm.hero_title : '';
                const customSubtitle = (settingsForm.hero_subtitle && settingsForm.hero_subtitle !== '.') ? settingsForm.hero_subtitle : '';

                return (
                  <div className={`relative ${isOnlyImg ? 'h-36 sm:h-40' : 'p-3.5'} overflow-hidden text-white flex flex-col justify-between`}>
                    {hasImg ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${settingsForm.hero_banner_image})` }}
                      >
                        {/* ZERO BLUR. Only light scrim if text is present */}
                        {!isOnlyImg && (
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent" />
                        )}
                      </div>
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-r ${currentTheme.headerGradient}`} />
                    )}

                    {isOnlyImg ? null : (
                      <div className="relative z-10 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md inline-block">
                          Floor Concierge Active
                        </span>
                        <h4 className="text-xs font-black tracking-tight leading-snug drop-shadow-sm">
                          {customTitle || 'Flagship Physical Showroom'}
                        </h4>
                        <p className="text-[10px] text-white/90 leading-tight drop-shadow-sm">
                          {customSubtitle || 'Tap "Show Me" on any item for immediate associate assistance.'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 4. SIMULATED SEARCH BAR & CHIPS */}
              <div className="p-3 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <div className="w-full bg-white dark:bg-zinc-900 py-1.5 pl-8 pr-3 text-[11px] text-slate-400 rounded-xl border border-slate-200 dark:border-zinc-800">
                    Search showroom items, SKU...
                  </div>
                </div>

                {/* Category Chips */}
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
                    Audio & Tech
                  </span>
                </div>

                {/* 5. SIMULATED PRODUCT CARD (WITH THEMED CARD GEOMETRY) */}
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
                        Studio Pro Wireless
                      </h5>
                      <div className="flex items-center justify-between pt-1">
                        <span
                          className="font-black text-xs"
                          style={{ color: currentTheme.primaryColor }}
                        >
                          $349.00
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

                {/* 6. SIMULATED ACTIVE REQUEST TRACKER CHIP */}
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
                      Floor Assistant Dispatched
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

              {/* Bottom Home Indicator Bar */}
              <div className="py-2 flex justify-center bg-white/40 dark:bg-black/30">
                <div className="w-24 h-1 rounded-full bg-slate-400 dark:bg-zinc-600" />
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
