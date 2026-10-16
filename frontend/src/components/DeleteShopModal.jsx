import React, { useState } from 'react';
import {
  X, AlertTriangle, Trash2, Loader2, Store, Users, ShoppingBag
} from 'lucide-react';
import { superAdminService } from '../services/superAdminService';

export default function DeleteShopModal({ isOpen, shop, onClose, onSuccess }) {
  if (!isOpen || !shop) return null;

  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isConfirmed = confirmName.trim().toLowerCase() === shop.name.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) {
      setError('Please type the exact store name to confirm deletion.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await superAdminService.deleteShop(shop.id);
      if (res && res.status === 'success') {
        onSuccess(shop.id, res.message || `Store '${shop.name}' was permanently deleted.`);
        onClose();
      } else {
        setError(res.message || 'Failed to delete store.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred during deletion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#18181B] rounded-3xl border border-red-200 dark:border-red-950/60 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-red-100 dark:border-red-950/40 bg-red-50/70 dark:bg-red-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-red-700 dark:text-red-400">
                Delete Retail Store
              </h3>
              <p className="text-xs text-red-600/80 dark:text-red-400/80">
                Permanent and irreversible action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
            You are about to delete <strong className="text-slate-900 dark:text-white">{shop.name}</strong> (/shop/{shop.slug}).
            All associated products, inventory, floor locations, customer requests, and employee accounts will be permanently destroyed.
          </p>

          {/* Quick stats snapshot */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="block text-[10px] text-slate-400 dark:text-zinc-500">Products</span>
              <strong className="text-slate-800 dark:text-zinc-200">{shop.products_count || 0}</strong>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 dark:text-zinc-500">Staff</span>
              <strong className="text-slate-800 dark:text-zinc-200">{shop.employees_count || 0}</strong>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 dark:text-zinc-500">Requests</span>
              <strong className="text-slate-800 dark:text-zinc-200">{shop.customer_requests_count || 0}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              To confirm, type <span className="font-mono text-red-600 dark:text-red-400 select-all font-black">{shop.name}</span>:
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={shop.name}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Permanently Delete Store</span>
          </button>
        </div>
      </div>
    </div>
  );
}
