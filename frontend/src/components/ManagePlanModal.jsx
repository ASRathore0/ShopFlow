import React, { useState } from 'react';
import {
  X, Layers, Check, ArrowUpRight, ArrowDownRight, ShieldCheck,
  Zap, Star, Loader2, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { superAdminService } from '../services/superAdminService';

export default function ManagePlanModal({ isOpen, shop, plans = [], onClose, onSuccess }) {
  if (!isOpen || !shop) return null;

  const currentPlan = shop.subscription?.plan || null;
  const currentPlanId = currentPlan?.id || null;

  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId || (plans[1]?.id || plans[0]?.id));
  const [subStatus, setSubStatus] = useState(shop.subscription?.status || 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePlan = async (planIdToSet = selectedPlanId) => {
    if (!planIdToSet) {
      setError('Please select a subscription tier');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await superAdminService.updatePlan(shop.id, planIdToSet, subStatus);
      if (res && res.status === 'success') {
        onSuccess(res.data, res.message || 'Subscription plan updated successfully!');
        onClose();
      } else {
        setError(res.message || 'Failed to update plan.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating subscription plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/50 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Manage Subscription Plan</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {shop.name}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Upgrade, downgrade, or change billing tier for this retail partner.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Subscription Status Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Billing Lifecycle Status:
              </span>
            </div>
            <div className="flex items-center gap-2">
              {['active', 'trialing', 'past_due', 'cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSubStatus(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    subStatus === st
                      ? st === 'active'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : st === 'trialing'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : st === 'past_due'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-red-600 text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((p) => {
              const isCurrent = currentPlanId === p.id;
              const isSelected = selectedPlanId === p.id;
              const priceVal = parseFloat(p.price || 0);

              const isUpgrade = currentPlan ? priceVal > parseFloat(currentPlan.price || 0) : true;
              const isDowngrade = currentPlan ? priceVal < parseFloat(currentPlan.price || 0) : false;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500 shadow-md'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {p.name}
                    </span>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Current Plan
                      </span>
                    ) : isUpgrade ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        Upgrade
                      </span>
                    ) : isDowngrade ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                        <ArrowDownRight className="w-3 h-3" />
                        Downgrade
                      </span>
                    ) : null}
                  </div>

                  {/* Pricing */}
                  <div className="mb-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      ₹{priceVal.toFixed(0)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      / {p.billing_period || 'month'}
                    </span>
                  </div>

                  {/* Limits */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400 py-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span>Staff Accounts:</span>
                      <strong className="text-slate-800 dark:text-zinc-200">Up to {p.max_employees}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Products Catalog:</span>
                      <strong className="text-slate-800 dark:text-zinc-200">Up to {p.max_products} items</strong>
                    </div>
                  </div>

                  {/* Features List */}
                  {p.features && p.features.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800 space-y-1">
                      {p.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdatePlan(p.id);
                    }}
                    disabled={loading || (isCurrent && subStatus === (shop.subscription?.status || 'active'))}
                    className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isCurrent && subStatus === (shop.subscription?.status || 'active')
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-default'
                        : isUpgrade
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-800 dark:bg-zinc-700 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {loading && selectedPlanId === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isCurrent ? (
                      <span>Active Tier</span>
                    ) : isUpgrade ? (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Upgrade to {p.name}</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>Downgrade to {p.name}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 dark:text-zinc-500">
            Changes take effect immediately with zero downtime.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
