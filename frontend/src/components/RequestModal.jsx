import React, { useState } from 'react';
import { X, HandHeart, CheckCircle2, MessageSquare, Plus, Minus, ArrowRight, ShieldCheck, Sparkles, Clock, MapPin } from 'lucide-react';
import { shopService } from '../services/shopService';
import { useCustomer } from '../context/CustomerContext';

export default function RequestModal({ product, variant, shopSlug, onClose, onSuccess }) {
  const { sessionToken, customerCode, addRequest } = useCustomer();
  const [requestType, setRequestType] = useState('show_product');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedData, setCompletedData] = useState(null);

  const quickPrompts = [
    'I want to see the color under showroom lighting',
    'Can you help compare with another model?',
    'Is the packaging sealed brand new?',
    'Can I test the feel & grip in hand?'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        product_id: product.id,
        variant_id: variant?.id || null,
        request_type: requestType,
        quantity: quantity,
        customer_notes: notes.trim(),
        session_token: sessionToken,
      };

      const res = await shopService.createRequest(shopSlug, payload);
      const reqData = res.data.request;

      // Add to local customer context
      addRequest(reqData);
      setCompletedData(res.data);

      if (onSuccess) {
        onSuccess(reqData);
      }
    } catch (err) {
      console.error('Request submission error', err);
      setError(err.response?.data?.message || 'Could not send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedVariantName = variant ? variant.name : (product.variants?.[0]?.name || 'Standard');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative z-10 bg-white dark:bg-[#18181B] border-t sm:border border-slate-200 dark:border-zinc-800 w-full max-w-lg sm:rounded-3xl rounded-t-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-all">
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
        </div>

        {/* Header */}
        <div className="px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HandHeart className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">In-Store Assistance Request</h3>
              <span className="text-[10px] text-slate-400 dark:text-zinc-400 block -mt-0.5">Floor associate brings item to your spot</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed State (Ticket Confirmation) */}
        {completedData ? (
          <div className="p-5 sm:p-6 text-center space-y-4 animate-fade-in overflow-y-auto">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 inline-block">
                {completedData.request.request_number}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                Floor Dispatch Dispatched!
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                Our floor team has received your ticket and the exact shelf coordinate of your requested item.
              </p>
            </div>

            {/* Queue & Ticket info pill */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-around text-left">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-400 block font-medium">Queue Spot</span>
                <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">#{completedData.queue_position || 1} in line</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800"></div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-400 block font-medium">Est. Wait</span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">~{completedData.estimated_wait_minutes || 2} mins</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800"></div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-400 block font-medium">Your Token</span>
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300 font-mono">{completedData.customer_code}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  window.location.href = `/shop/${shopSlug}/request/${completedData.request.request_number}`;
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Track Associate Live</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors font-medium"
              >
                Continue Browsing Catalog
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Target Product Summary */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              <img
                src={product.primary_image?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=150&q=80'}
                alt={product.name}
                className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-zinc-700 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{product.name}</h4>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">{selectedVariantName}</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold">${parseFloat(product.price).toFixed(2)}</p>
              </div>
            </div>

            {/* Assistance Option Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                Assistance Purpose
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'show_product', label: 'Show Me Product', icon: HandHeart },
                  { id: 'check_variant', label: 'Check Variant', icon: Sparkles },
                  { id: 'ask_staff', label: 'Ask Question', icon: MessageSquare },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = requestType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRequestType(opt.id)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-600/10 text-slate-900 dark:text-white ring-1 ring-blue-500 shadow-sm'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-400'}`} />
                      <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Quantity to inspect</span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">Items to bring from storage rack</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center transition-colors active:scale-95 shadow-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-extrabold text-slate-900 dark:text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(5, quantity + 1))}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center transition-colors active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                Quick Instructions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNotes((prev) => prev ? `${prev}. ${p}` : p)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Note / Message */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                Additional Note for Associate
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='e.g., "I am standing near Aisle 3" or "I want to compare sizes"'
                rows={2}
                maxLength={400}
                className="w-full bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs placeholder-slate-400 dark:placeholder-zinc-500 outline-none resize-none transition-colors"
              />
            </div>

            {/* Anonymous Privacy Notice */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                Anonymous floor session: Staff sees <strong className="text-slate-900 dark:text-zinc-200 font-mono">Customer #{customerCode.replace('CUS-', '')}</strong>. No phone number or login needed.
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-98 disabled:opacity-50 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Dispatching to Showroom Floor...</span>
                </>
              ) : (
                <>
                  <HandHeart className="w-4 h-4" />
                  <span>SUBMIT ASSISTANCE REQUEST</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

