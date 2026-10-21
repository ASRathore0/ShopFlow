import React, { useState, useRef, useEffect } from 'react';
import {
  X, HandHeart, CheckCircle2, AlertCircle, Bookmark, ShieldCheck,
  Tag, Info, Cpu, Layers, ChevronLeft, ChevronRight, Maximize2, Images,
  MessageCircle, Share2, Check
} from 'lucide-react';
import ImageLightboxModal from './ImageLightboxModal';
import AdvancePaymentModal from './AdvancePaymentModal';
import { getThemeConfig } from '../utils/storefrontThemes';
import { generateWhatsAppOrderMessage, openWhatsAppUrl, getDirectProductUrl } from '../utils/whatsappHelper';

const getCleanImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const backendBase = import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : '';
  return `${backendBase}/${url.replace(/^\//, '')}`;
};

export default function ProductDetailModal({
  product,
  onClose,
  onRequest,
  onReserve,
  shop,
  shopLogo,
  initialVariantId,
  onVariantChange,
}) {
  if (!product) return null;

  const themeConfig = getThemeConfig(shop || product?.shop);

  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (initialVariantId && product?.variants?.length > 0) {
      const match = product.variants.find((v) => String(v.id) === String(initialVariantId));
      if (match) return match;
    }
    return product?.variants && product.variants.length > 0 ? product.variants[0] : null;
  });

  // Sync selected variant when initialVariantId changes
  useEffect(() => {
    if (initialVariantId && product?.variants?.length > 0) {
      const match = product.variants.find((v) => String(v.id) === String(initialVariantId));
      if (match) setSelectedVariant(match);
    }
  }, [initialVariantId, product]);

  const resolvedShopLogo = getCleanImageUrl(shopLogo || shop?.logo_url || product?.shop?.logo_url);
  const shopName = shop?.name || product?.shop?.name || product?.brand || 'Store';

  const rawImages = (product.images && product.images.length > 0)
    ? product.images.map((img) => (typeof img === 'string' ? img : (img.image_url || img.url))).filter(Boolean)
    : (product.primary_image?.image_url ? [product.primary_image.image_url] : (product.image_url ? [product.image_url] : []));

  const allImages = rawImages.map(getCleanImageUrl).filter(Boolean);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [imageError, setImageError] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = getDirectProductUrl({ shop, product, selectedVariant });
    const shareText = `Check out ${product.name}${selectedVariant?.name ? ` (${selectedVariant.name})` : ''} at ${shopName}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy product link', err);
    }
  };

  // Storefront action button configuration
  const cps = shop?.customer_portal_settings || product?.shop?.customer_portal_settings || {};
  const buttonMode = cps.action_button_mode || 'show_me'; // 'show_me' | 'whatsapp' | 'both'
  const showMeLabel = cps.action_button_show_me_label || 'SHOW ME';
  const whatsappLabel = cps.action_button_label || 'ORDER ON WHATSAPP';
  const isAdvanceEnabled = Boolean(cps.enable_advance_payment);
  const whatsappNumber = cps.whatsapp_number || shop?.phone || product?.shop?.phone || '';

  const handleWhatsAppClick = () => {
    if (isAdvanceEnabled) {
      setAdvanceModalOpen(true);
    } else {
      const message = generateWhatsAppOrderMessage({
        product,
        selectedVariant,
        shop,
      });
      openWhatsAppUrl(whatsappNumber, message);
    }
  };

  // Finger swipe tracking refs
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchDeltaX = useRef(0);
  const isDragging = useRef(false);
  const hasMovedSignificantly = useRef(false);

  const selectedImage = allImages[currentImgIndex] || allImages[0] || null;
  const hasRealImage = selectedImage && !imageError[currentImgIndex];
  const hasMultipleImages = allImages.length > 1;

  const handlePrevImage = (e) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    setCurrentImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    setCurrentImgIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers for sliding with finger
  const handleTouchStart = (e) => {
    if (allImages.length <= 1) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchDeltaX.current = 0;
    hasMovedSignificantly.current = false;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null || allImages.length <= 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      touchDeltaX.current = deltaX;
      if (Math.abs(deltaX) > 10) {
        hasMovedSignificantly.current = true;
      }
      if (e.cancelable && Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || allImages.length <= 1) return;
    const swipeThreshold = 35;
    if (touchDeltaX.current > swipeThreshold) {
      handlePrevImage();
    } else if (touchDeltaX.current < -swipeThreshold) {
      handleNextImage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
  };

  // Mouse drag support for desktop/mouse
  const handleMouseDown = (e) => {
    if (allImages.length <= 1 || e.button !== 0) return;
    isDragging.current = true;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    touchDeltaX.current = 0;
    hasMovedSignificantly.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || touchStartX.current === null) return;
    const deltaX = e.clientX - touchStartX.current;
    touchDeltaX.current = deltaX;
    if (Math.abs(deltaX) > 10) {
      hasMovedSignificantly.current = true;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const swipeThreshold = 45;
    if (touchDeltaX.current > swipeThreshold) {
      handlePrevImage();
    } else if (touchDeltaX.current < -swipeThreshold) {
      handleNextImage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
  };

  const handleImageClick = (idx = currentImgIndex) => {
    // If the user was swiping by finger or mouse drag, don't trigger lightbox
    if (hasMovedSignificantly.current) {
      hasMovedSignificantly.current = false;
      return;
    }
    if (allImages.length > 0) {
      setLightboxIndex(idx);
      setLightboxOpen(true);
    }
  };

  const effectivePrice = selectedVariant
    ? (selectedVariant.price ? parseFloat(selectedVariant.price) : parseFloat(product.price) + parseFloat(selectedVariant.price_modifier || 0))
    : parseFloat(product.price);

  const isOutOfStock = product.stock_status === 'out_of_stock' || product.total_available_stock === 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
        {/* Click outside backdrop */}
        <div className="fixed inset-0" onClick={onClose}></div>

        {/* Modal / Bottom Sheet Card */}
        <div className="relative z-10 bg-white dark:bg-[#18181B] border-t sm:border border-slate-200 dark:border-zinc-800 w-full max-w-2xl max-h-[92vh] sm:rounded-3xl rounded-t-[2rem] overflow-hidden flex flex-col shadow-2xl transition-all">
          {/* Mobile Drag Indicator Handle */}
          <div className="sm:hidden pt-3 pb-1 flex justify-center">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
          </div>

          {/* Header Bar */}
          <div className="px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60 sticky top-0 z-10">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">{product.brand || 'Showroom'}</span>
              <span>•</span>
              <span className="font-medium text-slate-600 dark:text-zinc-300">{product.category?.name || 'In Store'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShare}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-700/80'
                }`}
                title="Share this product"
                aria-label="Share product"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-blue-500" />}
                <span>{copied ? 'Link Copied!' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Main Visual & Key Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Image Preview & Gallery with Finger Touch Swipe */}
              <div className="space-y-3">
                <div
                  className="relative aspect-square bg-slate-100 dark:bg-zinc-900/80 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center cursor-pointer select-none group"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onClick={() => handleImageClick(currentImgIndex)}
                  title="Click to view full image (or swipe with finger)"
                >
                  {hasRealImage ? (
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                      onError={() => setImageError((prev) => ({ ...prev, [currentImgIndex]: true }))}
                    />
                  ) : resolvedShopLogo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-900/60 select-none">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white dark:bg-zinc-800 p-3.5 shadow-sm border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-center">
                        <img
                          src={resolvedShopLogo}
                          alt={shopName}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-2.5 tracking-wider uppercase text-center truncate max-w-[85%]">
                        {shopName}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-850 select-none">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-3xl shadow-lg shadow-blue-500/20">
                        {shopName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-2.5 tracking-wider truncate max-w-[85%]">
                        {shopName}
                      </span>
                    </div>
                  )}

                  {/* Left / Right Arrow Buttons */}
                  {/* {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-all opacity-80 group-hover:opacity-100 active:scale-95 shadow-md"
                        title="Previous Photo"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-all opacity-80 group-hover:opacity-100 active:scale-95 shadow-md"
                        title="Next Photo"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </>
                  )} */}

                  {/* Full View / Zoom Hint Button (Top Right) */}
                  {hasRealImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(currentImgIndex);
                      }}
                      className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 text-[11px] font-semibold flex items-center gap-1 shadow-md transition-all active:scale-95"
                      title="Click to view full image"
                    >
                      <Maximize2 className="w-3 h-3 text-blue-300" />
                      <span>Full View</span>
                    </button>
                  )}

                  {/* Counter Pill & Slide Dots (Bottom) */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
                      {/* Counter */}
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white border border-white/15 backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <Images className="w-2.5 h-2.5 text-blue-300" />
                        <span>{currentImgIndex + 1}/{allImages.length}</span>
                      </div>

                      {/* Dots */}
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/15 pointer-events-auto">
                        {allImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImgIndex(idx);
                            }}
                            className={`rounded-full transition-all cursor-pointer ${
                              currentImgIndex === idx
                                ? 'w-4 h-1.5 bg-white shadow-sm'
                                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                            }`}
                            title={`Photo ${idx + 1}`}
                          />
                        ))}
                      </div>

                      {/* Finger Swipe Icon Hint */}
                      <div className="hidden sm:block text-[9px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-zinc-300 border border-white/15 backdrop-blur-md">
                        Swipeable
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnails Row */}
                {allImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {allImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentImgIndex(idx)}
                        onDoubleClick={() => handleImageClick(idx)}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                          currentImgIndex === idx
                            ? 'border-blue-600 scale-95 shadow-md shadow-blue-500/20 ring-1 ring-blue-500/40'
                            : 'border-slate-200 dark:border-zinc-800 opacity-60 hover:opacity-100 hover:border-slate-400'
                        }`}
                        title="Click to select. Double click for full view."
                      >
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title, Stock & Price */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {product.name}
                  </h2>
                  {product.model && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">Model: {product.model}</p>
                  )}
                  {product.sku && (
                    <p className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5">SKU: {product.sku}</p>
                  )}

                  {/* Price Display */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span
                      className="text-2xl sm:text-3xl font-black tracking-tight"
                      style={{ color: themeConfig.primaryColor }}
                    >
                      ₹{effectivePrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-zinc-400 font-medium">In-Store Retail</span>
                  </div>

                  {/* Store Availability Badge */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center gap-2">
                      {isOutOfStock ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-red-600 dark:text-red-400">Currently out of showroom stock</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            In Showroom Stock ({product.total_available_stock} ready)
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Physical units are staged on the floor. Tap <strong className="text-blue-600 dark:text-blue-400">Show Me</strong> to have a shop assistant bring this item to you.
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {product.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700/60">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Select Specification / Color</span>
                  <span className="text-blue-600 dark:text-blue-400 text-[11px] normal-case font-semibold">
                    {selectedVariant ? selectedVariant.name : 'Choose variant'}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const vPrice = v.price ? parseFloat(v.price) : parseFloat(product.price) + parseFloat(v.price_modifier || 0);
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVariant(v);
                          onVariantChange?.(v);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-600/10 text-slate-900 dark:text-white shadow-sm ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                          }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{v.name}</div>
                          {v.sku && <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{v.sku}</div>}
                        </div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">₹{vPrice.toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">Description</h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Specifications Table */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">Technical Details</h4>
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-3 px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-900/40">
                      <span className="font-semibold text-slate-500 dark:text-zinc-400">{key}</span>
                      <span className="col-span-2 text-slate-800 dark:text-zinc-200 font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Mobile/Desktop Action Bar */}
          <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2.5">
            {/* Share Action Button */}
            <button
              type="button"
              onClick={handleShare}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
              }`}
              title="Share this product"
              aria-label="Share this product"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-blue-500" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>

            {onReserve && (
              <button
                onClick={() => onReserve(product, selectedVariant)}
                className="px-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
              >
                <Bookmark className="w-4 h-4" style={{ color: themeConfig.primaryColor }} />
                <span>Reserve</span>
              </button>
            )}

            {/* In-Store Show Me Button (Active when mode is 'show_me' or 'both') */}
            {(buttonMode === 'show_me' || buttonMode === 'both') && (
              <button
                onClick={() => onRequest(product, selectedVariant)}
                className={`flex-1 py-3.5 px-5 rounded-2xl ${themeConfig.ctaGradient} active:scale-98 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg ${themeConfig.glowClass} flex items-center justify-center gap-2 group min-w-0`}
                style={themeConfig.isCustom ? { backgroundColor: themeConfig.primaryColor } : {}}
              >
                <HandHeart className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">{showMeLabel}</span>
              </button>
            )}

            {/* WhatsApp Direct Order / Advance Payment Button (Active when mode is 'whatsapp' or 'both') */}
            {(buttonMode === 'whatsapp' || buttonMode === 'both') && (
              <button
                onClick={handleWhatsAppClick}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group min-w-0"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform shrink-0 fill-white" />
                <span className="truncate">{whatsappLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advance Payment & WhatsApp Modal */}
      <AdvancePaymentModal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        product={product}
        selectedVariant={selectedVariant}
        shop={shop}
      />

      {/* Fullscreen High-Res Image Lightbox Modal */}
      {lightboxOpen && allImages.length > 0 && (
        <ImageLightboxModal
          images={allImages}
          initialIndex={lightboxIndex}
          title={product.name}
          subtitle={`${product.brand || shopName} • ₹${effectivePrice.toFixed(2)}`}
          fallbackLogo={resolvedShopLogo}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
