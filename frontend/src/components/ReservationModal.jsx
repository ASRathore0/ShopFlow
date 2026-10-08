import React, { useState } from 'react';
import { X, Bookmark, CheckCircle2, AlertCircle, Phone, User, Clock } from 'lucide-react';
import { shopService } from '../services/shopService';

export default function ReservationModal({ product, variant, shopSlug, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Please provide your name and phone number for pickup.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await shopService.createReservation(shopSlug, {
        product_id: product.id,
        variant_id: variant?.id || null,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        quantity: quantity,
      });
      setSuccessData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete reservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative z-10 bg-white dark:bg-[#18181B] border-t sm:border border-slate-200 dark:border-zinc-800 w-full max-w-md sm:rounded-3xl rounded-t-[2rem] p-5 sm:p-6 shadow-2xl space-y-4 transition-all">
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden -mt-2 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Reserve for In-Store Pickup</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successData ? (
          <div className="text-center space-y-4 py-2 animate-fade-in">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                {successData.order.order_number}
              </span>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">Reservation Held!</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                We are holding <strong>{product.name}</strong> for you. Pay nothing now; inspect and pay when collecting at our store counter.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span>Hold Period:</span>
                <span className="font-bold text-slate-900 dark:text-white">24 Hours Guaranteed</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Due at Counter:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{parseFloat(successData.order.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/25 active:scale-98"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center gap-3">
              <img
                src={product.primary_image?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=150&q=80'}
                alt=""
                className="w-11 h-11 object-cover rounded-xl border border-slate-200 dark:border-zinc-700"
              />
              <div className="text-xs min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate">{product.name}</div>
                <div className="text-slate-500 dark:text-zinc-400">{variant ? variant.name : 'Standard'}</div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Phone Number (For Pickup Confirmation)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/25 active:scale-98"
            >
              {loading ? 'Confirming Reservation...' : 'Confirm In-Store Hold'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

