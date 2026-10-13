import React, { useState } from 'react';
import { X, HandHeart, CheckCircle2, AlertCircle, Bookmark, ShieldCheck, Tag, Info, Cpu, Layers } from 'lucide-react';

const getCleanImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const backendBase = import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : '';
  return `${backendBase}/${url.replace(/^\//, '')}`;
};

export default function ProductDetailModal({ product, onClose, onRequest, onReserve, shop, shopLogo }) {
  if (!product) return null;

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const resolvedShopLogo = getCleanImageUrl(shopLogo || shop?.logo_url || product?.shop?.logo_url);
  const shopName = shop?.name || product?.shop?.name || product?.brand || 'Store';

  const rawImages = (product.images && product.images.length > 0)
    ? product.images.map((img) => (typeof img === 'string' ? img : (img.image_url || img.url))).filter(Boolean)
    : (product.primary_image?.image_url ? [product.primary_image.image_url] : (product.image_url ? [product.image_url] : []));

  const allImages = rawImages.map(getCleanImageUrl).filter(Boolean);
  const [selectedImage, setSelectedImage] = useState(allImages[0] || null);
  const [imageError, setImageError] = useState(false);
  const hasRealImage = selectedImage && !imageError;

  const effectivePrice = selectedVariant
    ? (selectedVariant.price ? parseFloat(selectedVariant.price) : parseFloat(product.price) + parseFloat(selectedVariant.price_modifier || 0))
    : parseFloat(product.price);

  const isOutOfStock = product.stock_status === 'out_of_stock' || product.total_available_stock === 0;

  return (
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
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Visual & Key Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Image Preview & Gallery */}
            <div className="space-y-3">
              <div className="aspect-square bg-slate-100 dark:bg-zinc-900/80 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center">
                {hasRealImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
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
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${selectedImage === imgUrl
                          ? 'border-blue-600 scale-95 shadow-md shadow-blue-500/20'
                          : 'border-slate-200 dark:border-zinc-800 opacity-60 hover:opacity-100'
                        }`}
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
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
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
                      onClick={() => setSelectedVariant(v)}
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
          {onReserve && (
            <button
              onClick={() => onReserve(product, selectedVariant)}
              className="px-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Reserve</span>
            </button>
          )}

          <button
            onClick={() => onRequest(product, selectedVariant)}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group"
          >
            <HandHeart className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span>SHOW ME</span>
          </button>
        </div>
      </div>
    </div>
  );
}

