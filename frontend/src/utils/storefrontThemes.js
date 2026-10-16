/**
 * ShopFlow Frontstore Designer Theme Engine
 * Provides world-class, designer-curated themes, header layouts, and card aesthetics
 * for multi-tenant retail showrooms & digital storefronts.
 */

export const STOREFRONT_THEMES = [
  {
    id: 'midnight_blue',
    name: 'Midnight Sapphire',
    category: 'Flagship & Electronics',
    tagline: 'Authoritative, trustworthy sapphire blue with rich indigo depth.',
    primaryColor: '#2563EB',
    secondaryColor: '#4F46E5',
    accentGradient: 'from-blue-600 via-indigo-600 to-blue-700',
    ctaGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
    glowColor: 'rgba(37, 99, 235, 0.35)',
    glowClass: 'shadow-blue-500/20',
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    cardBorderGlow: 'hover:border-blue-500/40 hover:shadow-blue-500/10',
    headerGradient: 'from-slate-950 via-blue-950/40 to-slate-900',
    announcementGradient: 'from-blue-700 via-indigo-600 to-blue-700',
    swatchColors: ['#2563EB', '#4F46E5', '#1E40AF'],
  },
  {
    id: 'luxury_gold',
    name: 'Obsidian & Gold',
    category: 'Jewelry, Watches & Luxury',
    tagline: 'Warm champagne metallic elegance with rich obsidian depth.',
    primaryColor: '#D97706',
    secondaryColor: '#B45309',
    accentGradient: 'from-amber-600 via-yellow-600 to-amber-700',
    ctaGradient: 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-black',
    glowColor: 'rgba(217, 119, 6, 0.35)',
    glowClass: 'shadow-amber-500/25',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    cardBorderGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/15',
    headerGradient: 'from-stone-950 via-neutral-900 to-amber-950/50',
    announcementGradient: 'from-amber-700 via-yellow-600 to-amber-800',
    swatchColors: ['#D97706', '#F59E0B', '#78350F'],
  },
  {
    id: 'tech_cyan',
    name: 'Electric Cyber',
    category: 'High-Tech, Gadgets & Audio',
    tagline: 'Ultra-modern electric cyan & cobalt neon with vivid cyberpunk aura.',
    primaryColor: '#06B6D4',
    secondaryColor: '#3B82F6',
    accentGradient: 'from-cyan-500 via-teal-500 to-blue-600',
    ctaGradient: 'bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    glowClass: 'shadow-cyan-500/25',
    badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    cardBorderGlow: 'hover:border-cyan-400/50 hover:shadow-cyan-500/20',
    headerGradient: 'from-slate-950 via-slate-900 to-cyan-950/60',
    announcementGradient: 'from-cyan-600 via-teal-600 to-blue-700',
    swatchColors: ['#06B6D4', '#0EA5E9', '#3B82F6'],
  },
  {
    id: 'emerald_luxe',
    name: 'Emerald Botanical',
    category: 'Organics, Wellness & Sustainable',
    tagline: 'Lush alpine emerald and mint freshness for organic, wellness and lifestyle.',
    primaryColor: '#059669',
    secondaryColor: '#0D9488',
    accentGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    ctaGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white',
    glowColor: 'rgba(5, 150, 105, 0.35)',
    glowClass: 'shadow-emerald-500/20',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    cardBorderGlow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/15',
    headerGradient: 'from-zinc-950 via-emerald-950/40 to-slate-900',
    announcementGradient: 'from-emerald-700 via-teal-700 to-emerald-800',
    swatchColors: ['#059669', '#10B981', '#065F46'],
  },
  {
    id: 'sunset_rose',
    name: 'Sunset Coral',
    category: 'Fashion, Streetwear & Cosmetics',
    tagline: 'Vibrant sunset rose and coral orange for trend-setting youth apparel.',
    primaryColor: '#F43F5E',
    secondaryColor: '#EA580C',
    accentGradient: 'from-rose-500 via-pink-600 to-orange-500',
    ctaGradient: 'bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    glowClass: 'shadow-rose-500/25',
    badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    cardBorderGlow: 'hover:border-rose-400/50 hover:shadow-rose-500/15',
    headerGradient: 'from-stone-950 via-rose-950/40 to-slate-900',
    announcementGradient: 'from-rose-600 via-pink-600 to-orange-600',
    swatchColors: ['#F43F5E', '#FB7185', '#EA580C'],
  },
  {
    id: 'cyber_purple',
    name: 'Cyber Violet',
    category: 'Gaming, Creative & Next-Gen',
    tagline: 'Deep interstellar violet with electric neon purple highlights.',
    primaryColor: '#7C3AED',
    secondaryColor: '#9333EA',
    accentGradient: 'from-purple-600 via-violet-600 to-indigo-700',
    ctaGradient: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white',
    glowColor: 'rgba(124, 58, 237, 0.4)',
    glowClass: 'shadow-purple-500/25',
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    cardBorderGlow: 'hover:border-purple-500/40 hover:shadow-purple-500/15',
    headerGradient: 'from-slate-950 via-purple-950/40 to-zinc-900',
    announcementGradient: 'from-purple-700 via-violet-700 to-indigo-800',
    swatchColors: ['#7C3AED', '#A855F7', '#5B21B6'],
  },
];

export const HEADER_STYLES = [
  {
    id: 'hero_banner',
    name: 'Cinematic Hero Banner',
    badge: 'Flagship Showroom',
    description: 'Expansive branded hero showcase with store status, opening hours, floor assistance perks and optional custom background banner.',
    icon: 'Sparkles',
  },
  {
    id: 'glassmorphism',
    name: 'Floating Glass Bar',
    badge: 'Modern Sleek',
    description: 'Frosted floating header with subtle background blur and sleek compact status pill.',
    icon: 'Layers',
  },
  {
    id: 'minimalist',
    name: 'Nordic Boutique',
    badge: 'Clean Minimal',
    description: 'Understated Scandinavian elegance with razor-sharp typography and maximum product focus.',
    icon: 'Store',
  },
];

export const CARD_STYLES = [
  {
    id: 'modern',
    name: 'Dynamic Rounded',
    description: 'Generous smooth corners (rounded-3xl), soft ambient shadows, and fluid hover scale.',
  },
  {
    id: 'elevated_luxe',
    name: 'Elevated Luxe',
    description: 'Sleek metallic border accent, subtle elevation on hover, and glowing action button.',
  },
  {
    id: 'glass',
    name: 'Glassmorphic Frosted',
    description: 'Translucent frosted glass backing with border highlight and clean modern hierarchy.',
  },
];

/**
 * Converts a 6-digit hex code to rgba string
 */
export const hexToRgba = (hex, alpha = 1) => {
  if (!hex || typeof hex !== 'string') return `rgba(37, 99, 235, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length !== 6) return `rgba(37, 99, 235, ${alpha})`;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Resolves the complete theme configuration for a given shop object
 */
export const getThemeConfig = (shop) => {
  const portalSettings = shop?.customer_portal_settings || {};
  const themePresetId = portalSettings.theme_preset || 'midnight_blue';
  const customBrandColor = portalSettings.brand_color || shop?.brand_color || '#2563EB';

  const matchedPreset = STOREFRONT_THEMES.find((t) => t.id === themePresetId);

  // If a preset is matched
  if (matchedPreset) {
    return {
      ...matchedPreset,
      isCustom: false,
      headerStyle: portalSettings.header_style || 'hero_banner',
      cardStyle: portalSettings.card_style || 'modern',
      heroBannerImage: portalSettings.hero_banner_image || '',
      heroTitle: portalSettings.hero_title || '',
      heroSubtitle: portalSettings.hero_subtitle || '',
      announcement: portalSettings.announcement || '',
    };
  }

  // Fallback to custom color if preset id is 'custom' or unknown
  return {
    id: 'custom',
    name: 'Custom Brand Color',
    category: 'Tailored Brand',
    tagline: 'Custom brand color chosen by shop owner.',
    primaryColor: customBrandColor,
    secondaryColor: customBrandColor,
    accentGradient: 'from-blue-600 via-indigo-600 to-blue-700',
    ctaGradient: 'bg-blue-600 hover:bg-blue-500 text-white',
    glowColor: hexToRgba(customBrandColor, 0.4),
    glowClass: 'shadow-blue-500/20',
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    cardBorderGlow: 'hover:border-blue-500/40',
    headerGradient: 'from-slate-950 via-slate-900 to-slate-950',
    announcementGradient: 'from-blue-700 via-indigo-600 to-blue-700',
    swatchColors: [customBrandColor, customBrandColor, customBrandColor],
    isCustom: true,
    headerStyle: portalSettings.header_style || 'hero_banner',
    cardStyle: portalSettings.card_style || 'modern',
    heroBannerImage: portalSettings.hero_banner_image || '',
    heroTitle: portalSettings.hero_title || '',
    heroSubtitle: portalSettings.hero_subtitle || '',
    announcement: portalSettings.announcement || '',
  };
};
