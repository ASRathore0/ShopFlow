import React, { useState } from 'react';
import { Eye, HandHeart, CheckCircle2, AlertCircle, Layers, ChevronLeft, ChevronRight, Images } from 'lucide-react';

const getCleanImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const backendBase = import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : '';
  return `${backendBase}/${url.replace(/^\//, '')}`;
};

export default function ProductCard({ product, onSelect, onRequest, shop, shopLogo }) {
  const isOutOfStock = product.stock_status === 'out_of_stock' || product.total_available_stock === 0;
  const isLowStock = product.stock_status === 'low_stock';
  const variantCount = product.variants ? product.variants.length : 0;

  // Resolve shop logo and branding for fallback
  const resolvedShopLogo = getCleanImageUrl(shopLogo || shop?.logo_url || product?.shop?.logo_url);
  const shopName = shop?.name || product?.shop?.name || product?.brand || 'Store';

  // Extract all available product images
  const rawImages = (product.images && product.images.length > 0)
    ? product.images.map((img) => (typeof img === 'string' ? img : (img.image_url || img.url))).filter(Boolean)
    : (product.primary_image?.image_url ? [product.primary_image.image_url] : (product.image_url ? [product.image_url] : []));

  const validImages = rawImages.map(getCleanImageUrl).filter(Boolean);

  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const hasRealImage = validImages.length > 0 && !imageError;
  const hasMultipleImages = validImages.length > 1 && !imageError;
  const activeImageUrl = validImages[currentImgIndex] || validImages[0];

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e, idx) => {
    e.stopPropagation();
    setCurrentImgIndex(idx);
  };

  return (
    <div className="bg-white dark:bg-[#18181B] border border-slate-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden hover:border-blue-400 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 flex flex-col group shadow-sm">
      {/* Product Image Box */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-square bg-slate-100 dark:bg-zinc-900/80 overflow-hidden cursor-pointer"
      >
        {hasRealImage ? (
          <img
            src={activeImageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : resolvedShopLogo ? (
          /* Show Store Logo if product image is not found */
          <div className="w-full h-full flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-zinc-900/70 select-none group-hover:bg-slate-100/70 dark:group-hover:bg-zinc-850/60 transition-colors">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-zinc-800 p-2.5 shadow-sm border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <img
                src={resolvedShopLogo}
                alt={shopName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-zinc-500 mt-2 tracking-wider uppercase text-center truncate max-w-[85%]">
              {shopName}
            </span>
          </div>
        ) : (
          /* Store Monogram Fallback if no logo uploaded */
          <div className="w-full h-full flex flex-col items-center justify-center p-3.5 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-850 select-none">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl sm:text-2xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              {shopName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 mt-2 tracking-wider truncate max-w-[85%]">
              {shopName}
            </span>
          </div>
        )}

        {/* Multi-Image Carousel Controls */}
        {hasMultipleImages && (
          <>
            {/* Prev Image Arrow */}
            <button
              onClick={handlePrevImage}
              title="Previous Photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Next Image Arrow */}
            <button
              onClick={handleNextImage}
              title="Next Photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Multi-Image Counter Pill */}
            <div className="absolute bottom-2.5 left-2.5 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/60 text-white border border-white/10 backdrop-blur-md flex items-center gap-1 shadow-sm">
              <Images className="w-2.5 h-2.5 text-blue-300" />
              <span>{currentImgIndex + 1}/{validImages.length}</span>
            </div>

            {/* Image Slider Indicator Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10">
              {validImages.map((_, idx) => (
                <span
                  key={idx}
                  onClick={(e) => handleDotClick(e, idx)}
                  className={`rounded-full transition-all cursor-pointer ${
                    currentImgIndex === idx
                      ? 'w-3 h-1.5 bg-white shadow-sm'
                      : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Stock Status Badge (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isOutOfStock ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/90 text-white dark:bg-red-500/20 dark:text-red-400 dark:border dark:border-red-500/30 flex items-center gap-1 backdrop-blur-md shadow-sm">
              <AlertCircle className="w-2.5 h-2.5" />
              Out
            </span>
          ) : isLowStock ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-white dark:bg-amber-500/20 dark:text-amber-400 dark:border dark:border-amber-500/30 flex items-center gap-1 backdrop-blur-md shadow-sm">
              <AlertCircle className="w-2.5 h-2.5" />
              {product.total_available_stock} left
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/30 flex items-center gap-1 backdrop-blur-md shadow-sm">
              <CheckCircle2 className="w-2.5 h-2.5" />
              In Store
            </span>
          )}
        </div>

        {/* Quick View Icon Button (Top Right Floating Glass) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/20 active:scale-90 shadow-sm"
          title="Quick View Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* Variant Count Badge (Bottom Right Floating) */}
        {variantCount > 1 && (
          <div className="absolute bottom-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-zinc-200 border border-white/10 backdrop-blur-md flex items-center gap-1">
            <Layers className="w-2.5 h-2.5 text-blue-400" />
            {variantCount} opt
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mb-0.5">
            <span className="truncate">{product.brand || 'Showroom'}</span>
            {product.category && <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate ml-1">{product.category.name}</span>}
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onSelect(product)}
            className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer leading-snug min-h-[2rem]"
          >
            {product.name}
          </h3>
        </div>

        {/* Price & Action Section - Fully Non-Overlapping & Mobile-Friendly */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
          {/* Price Row */}
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 leading-none">
              In-Store
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
              ₹{parseFloat(product.price).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
