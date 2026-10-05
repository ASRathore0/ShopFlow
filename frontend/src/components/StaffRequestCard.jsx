import React, { useState } from 'react';
import { Clock, MapPin, CheckCircle, Navigation, CheckCircle2, ChevronDown, ChevronUp, User, ShieldAlert } from 'lucide-react';
import RequestStatusBadge from './RequestStatusBadge';
import LocationBreadcrumb from './LocationBreadcrumb';
import LocationMapVisualizer from './LocationMapVisualizer';

export default function StaffRequestCard({
  request,
  onAccept,
  onMarkFound,
  onComplete,
  isAssignedToMe,
}) {
  const [showLocationMap, setShowLocationMap] = useState(false);

  const item = request.items?.[0];
  const product = item?.product;
  const location = item?.location;
  const customer = request.customer_session;

  const priorityConfigs = {
    normal: 'border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
    high: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold',
    urgent: 'border-red-500/50 bg-red-500/20 text-red-600 dark:text-red-400 font-extrabold animate-pulse',
  };

  return (
    <div className={`bg-white dark:bg-[#18181B] border rounded-2xl p-4 sm:p-5 shadow-md transition-all space-y-4 ${
      request.status === 'waiting'
        ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/5 to-transparent'
        : request.status === 'product_found'
        ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 to-transparent'
        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
    }`}>
      {/* Top Header: ID, Priority, Time, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-white">
            {request.request_number}
          </span>
          <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${priorityConfigs[request.priority] || priorityConfigs.normal}`}>
            {request.priority} priority
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
            {request.elapsed_time_human || 'Just now'}
          </span>
          <RequestStatusBadge status={request.status} size="sm" />
        </div>
      </div>

      {/* Main Grid: Customer + Target Product */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Product Details */}
        <div className="flex items-start gap-3">
          <img
            src={product?.primary_image?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=150&q=80'}
            alt={product?.name}
            className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-zinc-700 flex-shrink-0"
          />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {product?.name || 'Product'}
            </h4>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Variant: {item?.variant_description || 'Standard'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
              Quantity requested: <strong className="text-slate-800 dark:text-white">{item?.quantity || 1} unit</strong>
            </div>
          </div>
        </div>

        {/* Customer & Notes */}
        <div className="space-y-2 bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              Customer Token:
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
              {customer?.customer_code || 'Customer #A42'}
            </span>
          </div>
          {request.customer_notes ? (
            <p className="text-[11px] text-slate-700 dark:text-zinc-300 italic bg-white dark:bg-zinc-800/40 p-2 rounded-lg border border-slate-200 dark:border-zinc-700/50">
              "{request.customer_notes}"
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">No special customer message.</p>
          )}
          {request.assigned_employee && (
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between">
              <span>Handled by:</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">{request.assigned_employee.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Physical Location Card */}
      <div className="bg-slate-50/80 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <LocationBreadcrumb location={location} showTitle={true} variant="horizontal" />
          <button
            onClick={() => setShowLocationMap(!showLocationMap)}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 ml-2 flex-shrink-0"
          >
            {showLocationMap ? 'Hide Blueprint' : 'View Blueprint'}
            {showLocationMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable 2D Store Blueprint */}
        {showLocationMap && (
          <div className="pt-2 animate-fade-in">
            <LocationMapVisualizer location={location} productName={product?.name} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
        {request.status === 'waiting' && (
          <button
            onClick={() => onAccept(request.id)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            ACCEPT REQUEST
          </button>
        )}

        {(request.status === 'assigned' || request.status === 'in_progress') && (
          <>
            <button
              onClick={() => setShowLocationMap(!showLocationMap)}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              NAVIGATE TO PRODUCT
            </button>
            <button
              onClick={() => onMarkFound(request.id)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              MARK PRODUCT FOUND
            </button>
          </>
        )}

        {(request.status === 'product_found' || request.status === 'coming_to_you') && (
          <button
            onClick={() => onComplete(request.id)}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            BRING & COMPLETE ASSISTANCE
          </button>
        )}

        {request.status === 'completed' && (
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1 py-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Assistance Finished
          </span>
        )}
      </div>
    </div>
  );
}
