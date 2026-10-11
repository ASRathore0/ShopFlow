import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CheckCircle2, UserCheck, AlertCircle, ScanLine, Search,
  Power, RefreshCw, HandHeart, ChevronRight, Filter, Layers, Navigation, Check,
  Sun, Moon, Store, ArrowLeft, LogOut, ChevronDown, Bell, Zap, Bookmark, X,
  CheckCheck, Volume2
} from 'lucide-react';
import { staffService } from '../services/staffService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StaffRequestCard from '../components/StaffRequestCard';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import StaffProfileModal from '../components/StaffProfileModal';

export default function StaffDashboard() {
  const { user, quickLoginAs, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active'); // active, waiting, reservations, my_assigned, completed
  const [scannerOpen, setScannerOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);
  const [staffStatus, setStaffStatus] = useState('online');
  const [refreshing, setRefreshing] = useState(false);

  const prevRequestIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Play audio chime when new requests or reservations arrive
  const playAlertChime = (isReservation = false) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      if (isReservation) {
        // Distinct 3-tone pleasant celebratory chime for reservations
        [587.33, 739.99, 880.00].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.2, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.35);
        });
      } else {
        // Standard 2-tone notification chime
        [523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.18, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.28);
        });
      }
    } catch (err) {
      console.log('Audio chime not allowed or supported:', err);
    }
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [dashRes, reqsRes] = await Promise.all([
        staffService.getDashboard(),
        staffService.getRequests({ tab: tab }),
      ]);
      if (dashRes && dashRes.data) {
        setDashboardData(dashRes.data);
        if (dashRes.data.employee) {
          setStaffStatus(dashRes.data.employee.status);
        }
      }
      if (reqsRes && reqsRes.data) {
        const newReqs = reqsRes.data.data || [];
        setRequests(newReqs);

        // Detect newly arrived requests / reservations
        const currentIds = new Set(newReqs.map((r) => r.id));
        if (!isInitialLoadRef.current) {
          const brandNew = newReqs.filter((r) => !prevRequestIdsRef.current.has(r.id));
          if (brandNew.length > 0) {
            const hasReservation = brandNew.some((r) => r.request_type === 'reservation');
            const targetItem = brandNew[0];
            const pName = targetItem.items?.[0]?.product?.name || 'In-Store Product';
            const cust = targetItem.customer_session?.customer_code || 'Showroom Customer';

            if (hasReservation) {
              playAlertChime(true);
              setToastNotice({
                title: '🔖 New In-Store Reservation!',
                message: `${pName} reserved by ${cust}. Hold for pickup.`,
                type: 'reservation',
              });
            } else {
              playAlertChime(false);
              setToastNotice({
                title: '⚡ New Customer Request!',
                message: `${pName} requested by ${cust} on showroom floor.`,
                type: 'request',
              });
            }

            setTimeout(() => {
              setToastNotice(null);
            }, 5000);
          }
        } else {
          isInitialLoadRef.current = false;
        }
        prevRequestIdsRef.current = currentIds;
      }
    } catch (err) {
      console.error('Failed to load staff data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh queue every 3 seconds for physical showroom live updates
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [tab]);

  const handleAccept = async (requestId) => {
    try {
      await staffService.acceptRequest(requestId);
      loadData();
    } catch (err) {
      alert('Could not accept request.');
    }
  };

  const handleMarkFound = async (requestId) => {
    try {
      await staffService.markFound(requestId, 'Retrieved from shelf position.');
      loadData();
    } catch (err) {
      alert('Could not mark found.');
    }
  };

  const handleComplete = async (requestId) => {
    try {
      await staffService.completeRequest(requestId, 'Customer successfully assisted in showroom.');
      loadData();
    } catch (err) {
      alert('Could not complete request.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStaffStatus(newStatus);
    try {
      await staffService.updateStatus(newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const employeeName = dashboardData?.employee?.name || user?.name || 'Rahul Sharma';
  const shopName = dashboardData?.shop?.name || 'ABC Electronics';
  const shopSlug = dashboardData?.shop?.slug || 'abc-electronics';
  const notifications = dashboardData?.notifications || [];
  const metrics = dashboardData?.metrics || {
    waiting_requests: 0,
    active_requests: 0,
    completed_today: 0,
    reservations_count: 0,
    average_service_time: '4m 32s',
  };

  const rawAvatarUrl = dashboardData?.employee?.avatar_url || user?.avatar_url;
  const avatarSrc = rawAvatarUrl
    ? (rawAvatarUrl.startsWith('http://') || rawAvatarUrl.startsWith('https://') || rawAvatarUrl.startsWith('blob:') || rawAvatarUrl.startsWith('data:')
        ? rawAvatarUrl
        : `${(import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000')}/${rawAvatarUrl.replace(/^\//, '')}`)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0C] text-slate-900 dark:text-zinc-100 pb-20 selection:bg-blue-600 transition-colors">
      {/* Staff Top Command Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#111113]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800 transition-colors shadow-xs">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          
          {/* Top Row: User Identity & Store (Mobile & Desktop) */}
          <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Profile Picture Trigger (Clicking avatar opens staff details) */}
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="relative shrink-0 cursor-pointer group focus:outline-none"
                title="Click profile picture to view & edit details"
                aria-label="Staff Profile"
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={employeeName}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shadow-md shadow-blue-500/10 group-hover:ring-2 group-hover:ring-blue-500 group-hover:scale-105 transition-all"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-md shadow-blue-500/20 group-hover:ring-2 group-hover:ring-blue-500 group-hover:scale-105 transition-all">
                    {employeeName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#111113] ${
                    staffStatus === 'online'
                      ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                      : staffStatus === 'busy'
                      ? 'bg-amber-500'
                      : 'bg-slate-400 dark:bg-zinc-500'
                  }`}
                />
              </button>

              {/* Name & Shop Info (Clean text only, no Profile button) */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {employeeName}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 truncate">
                  <span className="truncate">{shopName}</span>
                  {['shop_owner', 'manager', 'super_admin'].includes(user?.role) && (
                    <>
                      <span className="text-slate-300 dark:text-zinc-600">·</span>
                      <Link
                        to="/admin"
                        className="text-purple-600 dark:text-purple-400 hover:underline font-medium shrink-0"
                      >
                        Admin
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick System Utilities (Right aligned on mobile top row) */}
            <div className="flex sm:hidden items-center gap-1 shrink-0">
              {/* Showroom Toggle Icon */}
              <Link
                to={`/shop/${shopSlug}`}
                className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-zinc-800 transition-colors cursor-pointer"
                title="View Customer Showroom"
                aria-label="View Customer Showroom"
              >
                <Store className="w-3.5 h-3.5" />
              </Link>

              {/* Mobile Notifications Bell */}
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-1.5 text-slate-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-zinc-800 transition-colors cursor-pointer"
                title="Notifications & Reservations"
                aria-label="Notifications & Reservations"
              >
                <Bell className="w-3.5 h-3.5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={loadData}
                disabled={refreshing}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 transition-colors cursor-pointer"
                title="Refresh live queue"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              </button>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200/80 dark:border-zinc-800 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Row: Status Selector & Scan Button (Mobile: full-width parallel; Desktop: inline right) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Status Selector Pill */}
            <div className="relative flex-1 sm:flex-initial">
              <div
                className={`flex items-center justify-between gap-1.5 w-full sm:w-auto px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                  staffStatus === 'online'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : staffStatus === 'busy'
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      staffStatus === 'online'
                        ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                        : staffStatus === 'busy'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="truncate uppercase tracking-wider text-[11px]">
                    {staffStatus === 'online' ? 'Online' : staffStatus === 'busy' ? 'Busy' : staffStatus === 'on_break' ? 'Break' : 'Offline'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              </div>
              <select
                value={staffStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Staff status"
              >
                <option value="online">● Online (Taking Requests)</option>
                <option value="busy">● Busy (Assisting Customer)</option>
                <option value="on_break">● On Break</option>
                <option value="offline">● Offline</option>
              </select>
            </div>

            {/* Quick Barcode Scanner Button */}
            <button
              onClick={() => setScannerOpen(true)}
              className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
              title="Barcode Scanner"
            >
              <ScanLine className="w-4 h-4 shrink-0" />
              <span>Scan Barcode</span>
            </button>

            {/* Desktop Utility Icons */}
            <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-zinc-800">
              <Link
                to={`/shop/${shopSlug}`}
                className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-zinc-800 transition-colors shrink-0 cursor-pointer"
                title="View Customer Showroom"
                aria-label="View Customer Showroom"
              >
                <Store className="w-4 h-4" />
              </Link>

              {/* Desktop Notifications Bell */}
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-2 text-slate-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-slate-200 dark:border-zinc-800 transition-colors shrink-0 cursor-pointer"
                title="View Notifications & Reservations"
                aria-label="View Notifications & Reservations"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={loadData}
                disabled={refreshing}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors shrink-0 cursor-pointer"
                title="Refresh queue"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors shrink-0 cursor-pointer"
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-zinc-800 transition-colors shrink-0 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Staff Workspace */}
      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3.5">
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#141417] border border-amber-500/20 dark:border-amber-500/30 space-y-1 shadow-xs hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] sm:text-xs font-semibold truncate">Waiting</span>
              <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400 tracking-tight">{metrics.waiting_requests}</div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">Needs response</span>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#141417] border border-blue-500/20 dark:border-blue-500/30 space-y-1 shadow-xs hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] sm:text-xs font-semibold truncate">Active Requests</span>
              <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{metrics.active_requests}</div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">In progress now</span>
          </div>

          {/* Dedicated Reservations Metric Card */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#141417] border border-purple-500/20 dark:border-purple-500/30 space-y-1 shadow-xs hover:border-purple-500/40 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] sm:text-xs font-semibold truncate">Reservations</span>
              <Bookmark className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{metrics.reservations_count || 0}</div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">Hold for pickup</span>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#141417] border border-emerald-500/20 dark:border-emerald-500/30 space-y-1 shadow-xs hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] sm:text-xs font-semibold truncate">Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{metrics.completed_today}</div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">Today served</span>
          </div>

          <div className="col-span-2 md:col-span-1 p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#141417] border border-slate-200/80 dark:border-zinc-800 space-y-1 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] sm:text-xs font-semibold truncate">Avg Service Time</span>
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{metrics.average_service_time}</div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">Hand-off speed</span>
          </div>
        </div>

        {/* Live Queue Filter Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
            {[
              { id: 'active', label: 'Active Queue', count: (metrics.active_requests || 0) + (metrics.waiting_requests || 0) },
              { id: 'waiting', label: 'Waiting', count: metrics.waiting_requests || 0 },
              { id: 'reservations', label: '🔖 Reservations', count: metrics.reservations_count || 0 },
              { id: 'my_assigned', label: 'Assigned To Me', count: dashboardData?.my_active_requests?.length || 0 },
              { id: 'completed', label: 'Completed Today', count: metrics.completed_today || 0 },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  tab === t.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
                }`}
              >
                <span>{t.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${tab === t.id ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Sync Active (3s)</span>
          </div>
        </div>

        {/* Queue Cards List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800 animate-pulse"></div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Queue is Clear!</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              All showroom customers have been assisted. New "SHOW ME THIS PRODUCT" alerts will appear automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <StaffRequestCard
                key={req.id}
                request={req}
                onAccept={handleAccept}
                onMarkFound={handleMarkFound}
                onComplete={handleComplete}
                isAssignedToMe={req.assigned_employee_id === dashboardData?.employee?.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Barcode Scanner Modal */}
      {scannerOpen && (
        <BarcodeScannerModal
          onClose={() => setScannerOpen(false)}
          onSelectProduct={(p) => {
            alert(`Selected product: ${p.name}`);
          }}
        />
      )}

      {/* Real-time Toast Banner for Reservations & Requests */}
      {toastNotice && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-sm w-full bg-white dark:bg-[#18181B] border-2 border-purple-500 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-bounce">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            {toastNotice.type === 'reservation' ? <Bookmark className="w-5 h-5" /> : <Zap className="w-5 h-5 text-amber-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {toastNotice.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2">
              {toastNotice.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Notifications Drawer / Modal */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#141417] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Store Notifications</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Reservations & Live floor alerts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-zinc-500 space-y-2">
                  <CheckCheck className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">No recent notifications</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isRes = notif.type === 'new_reservation';
                  return (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs space-y-1 ${
                        isRes
                          ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-500/30'
                          : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isRes ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">
                              <Bookmark className="w-3 h-3" /> Reservation
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                              <Zap className="w-3 h-3" /> Store Alert
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-zinc-100">
                        {notif.title}
                      </div>
                      <p className="text-slate-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                {notifications.length} recent notices
              </span>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  setTab('reservations');
                }}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Go to Reservations →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Profile Details & Edit Modal */}
      <StaffProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        employee={dashboardData?.employee}
        shop={dashboardData?.shop}
        onProfileUpdated={(updatedUser, updatedEmployee) => {
          if (dashboardData) {
            setDashboardData({
              ...dashboardData,
              employee: updatedEmployee || dashboardData.employee,
            });
          }
          loadData();
        }}
      />
    </div>
  );
}
