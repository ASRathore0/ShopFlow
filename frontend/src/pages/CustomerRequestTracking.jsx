import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, User, RefreshCw, HandHeart, AlertCircle, Sun, Moon, MapPin, Sparkles } from 'lucide-react';
import { shopService } from '../services/shopService';
import RequestStatusBadge from '../components/RequestStatusBadge';
import RequestTimeline from '../components/RequestTimeline';
import { useTheme } from '../context/ThemeContext';

export default function CustomerRequestTracking() {
  const { shopSlug, requestNumber } = useParams();
  const { isDark, toggleTheme } = useTheme();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await shopService.trackRequest(requestNumber);
      if (res && res.data) {
        setRequest(res.data);
      }
    } catch (err) {
      setError('Could not locate request details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 3 seconds for live physical assistance tracking
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [requestNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0C] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <span className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></span>
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Locating floor dispatch status...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0C] p-4 text-center flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{error || 'Request Not Found'}</h3>
        <Link
          to={`/shop/${shopSlug}`}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/25"
        >
          Return to Store Showroom
        </Link>
      </div>
    );
  }

  const item = request.items?.[0];
  const product = item?.product;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0C] text-slate-900 dark:text-zinc-100 pb-16 selection:bg-blue-600 transition-colors">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111113]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to={`/shop/${shopSlug}`}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Showroom Catalog</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <button
              onClick={fetchStatus}
              disabled={refreshing}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Refresh Status"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tracking Content */}
      <main className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {/* Radar / Status Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/90 dark:border-zinc-800 shadow-sm text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              {request.request_number}
            </span>
          </div>

          {/* Pulsing Radar Ring for Active States */}
          {request.status !== 'completed' && request.status !== 'cancelled' && (
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <span className="absolute w-16 h-16 rounded-full bg-blue-500/20 animate-ping"></span>
              <span className="absolute w-12 h-12 rounded-full bg-blue-500/30"></span>
              <div className="relative w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40">
                <HandHeart className="w-4 h-4" />
              </div>
            </div>
          )}

          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {request.status === 'completed'
                ? 'Assistance Completed'
                : request.status === 'product_found'
                ? 'Product Found! On the way'
                : request.status === 'assigned'
                ? 'Staff Member Dispatched'
                : 'Ticket Sent to Floor Queue'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              {request.status === 'completed'
                ? 'Thank you for visiting! Feel free to request any other items.'
                : `You are #${request.queue_position || 1} in the showroom queue • Stay right where you are`}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <RequestStatusBadge status={request.status} size="md" />
          </div>

          {/* Assigned Staff Info if present */}
          {request.assigned_employee && (
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs text-left shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{request.assigned_employee.name}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">Assisting you on floor</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                Active Now
              </span>
            </div>
          )}
        </div>

        {/* Target Item Summary */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/90 dark:border-zinc-800 flex items-center gap-3 shadow-sm">
          <img
            src={product?.primary_image?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=150&q=80'}
            alt=""
            className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-zinc-700 flex-shrink-0"
          />
          <div className="space-y-0.5 text-xs flex-1 min-w-0">
            <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-wider">{product?.brand}</span>
            <h4 className="font-bold text-slate-900 dark:text-white truncate">{product?.name}</h4>
            <p className="text-slate-500 dark:text-zinc-400 text-[11px] truncate font-medium">
              {item?.variant_description || 'Standard'} • {item?.quantity || 1} unit requested
            </p>
          </div>
        </div>

        {/* Visual Progress Timeline */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Showroom Dispatch Steps
          </h3>
          <RequestTimeline status={request.status} employeeName={request.assigned_employee?.name} />
        </div>

        {/* Back action */}
        <div className="text-center pt-2">
          <Link
            to={`/shop/${shopSlug}`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-1"
          >
            ← Browse more in-store products
          </Link>
        </div>
      </main>
    </div>
  );
}

