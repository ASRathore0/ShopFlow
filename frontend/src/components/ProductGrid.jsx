import React from 'react';
import ProductCard from './ProductCard';
import { PackageSearch } from 'lucide-react';

export default function ProductGrid({ products, loading, onSelectProduct, onRequestProduct, onResetFilter }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 animate-pulse space-y-3">
            <div className="aspect-square bg-slate-200/70 dark:bg-zinc-800/60 rounded-xl"></div>
            <div className="h-4 bg-slate-200 dark:bg-zinc-800/80 rounded w-3/4"></div>
            <div className="h-3 bg-slate-100 dark:bg-zinc-800/60 rounded w-1/2"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-1/3"></div>
              <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded-xl w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 text-center space-y-4 max-w-md mx-auto my-6 shadow-sm">
        <div className="w-14 h-14 bg-slate-100 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <PackageSearch className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No products found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
            We couldn't find any showroom products matching your current category or search criteria.
          </p>
        </div>
        {onResetFilter && (
          <button
            onClick={onResetFilter}
            className="text-xs font-semibold px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            Clear Filters & View All
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelectProduct}
          onRequest={onRequestProduct}
        />
      ))}
    </div>
  );
}

