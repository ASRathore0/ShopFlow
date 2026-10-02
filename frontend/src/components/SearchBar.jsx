import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Tag, Smartphone, Laptop, Headphones, Sparkles } from 'lucide-react';
import { shopService } from '../services/shopService';

export default function SearchBar({ shopSlug, onSelectProduct, placeholder = "Search phones, laptops, SKU..." }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await shopService.search(shopSlug, query.trim());
        setSuggestions(res.data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, shopSlug]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product) => {
    setIsOpen(false);
    setQuery('');
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center shadow-sm">
        <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-zinc-500">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-[#18181B] text-slate-900 dark:text-white pl-10 pr-9 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm placeholder-slate-400 dark:placeholder-zinc-500 transition-all outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700/80 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto animate-fade-in divide-y divide-slate-100 dark:divide-zinc-800">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              Searching showroom catalog...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1.5">
              <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Matching In-Store Models
              </div>
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={p.primary_image?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=100&q=80'}
                      alt={p.name}
                      className="w-9 h-9 object-cover rounded-xl border border-slate-200 dark:border-zinc-700"
                    />
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <span>{p.brand}</span>
                        {p.sku && <span>• {p.sku}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">${parseFloat(p.price).toFixed(2)}</div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Available</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-zinc-400">
              No products found for "{query}". Try checking another model.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
