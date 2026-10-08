import React from 'react';
import { Eye, HandHeart, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

export default function ProductCard({ product, onSelect, onRequest }) {
  const isOutOfStock = product.stock_status === 'out_of_stock' || product.total_available_stock === 0;
  const isLowStock = product.stock_status === 'low_stock';
  const variantCount = product.variants ? product.variants.length : 0;
  const imageUrl = product.primary_image?.image_url || product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="bg-white dark:bg-[#18181B] border border-slate-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden hover:border-blue-400 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 flex flex-col group shadow-sm">
      {/* Product Image Box */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-square bg-slate-100 dark:bg-zinc-900/80 overflow-hidden cursor-pointer"
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

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

          {/* Full-width "Show Me" Touch Target */}
          <button
            onClick={() => onRequest ? onRequest(product) : onSelect(product)}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5"
          >
            <HandHeart className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Show Me</span>
          </button>
        </div>
      </div>
    </div>
  );
}


