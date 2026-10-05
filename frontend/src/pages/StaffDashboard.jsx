import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CheckCircle2, UserCheck, AlertCircle, ScanLine, Search,
  Power, RefreshCw, HandHeart, ChevronRight, Filter, Layers, Navigation, Check,
  Sun, Moon, Store, ArrowLeft
} from 'lucide-react';
import { staffService } from '../services/staffService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StaffRequestCard from '../components/StaffRequestCard';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function StaffDashboard() {
  const { user, quickLoginAs } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active'); // active, waiting, my_assigned, completed
  const [scannerOpen, setScannerOpen] = useState(false);
  const [staffStatus, setStaffStatus] = useState('online');
  const [refreshing, setRefreshing] = useState(false);

  // Auto-login as staff if not authenticated yet for seamless demo
  useEffect(() => {
    async function initAuth() {
      if (!user) {
        await quickLoginAs('staff');
      }
    }
    initAuth();
  }, [user]);

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
        setRequests(reqsRes.data.data || []);
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
  const metrics = dashboardData?.metrics || {
    waiting_requests: 8,
    active_requests: 3,
    completed_today: 142,
    average_service_time: '4m 32s',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0C] text-slate-900 dark:text-zinc-100 pb-20 selection:bg-blue-600 transition-colors">
      {/* Staff Top Command Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#111113]/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              {employeeName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Good day, {employeeName}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Floor Staff
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>Shop: <strong className="text-slate-700 dark:text-zinc-200">{shopName}</strong></span>
                <Link
                  to={`/shop/${shopSlug}`}
                  target="_blank"
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  <Store className="w-3 h-3" />
                  <span>Showroom</span>
                </Link>
                {['shop_owner', 'manager', 'super_admin'].includes(user?.role) && (
                  <Link
                    to="/admin"
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline ml-1"
                  >
                    • Admin
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons & Online status selector */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={() => setScannerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ScanLine className="w-4 h-4 text-blue-500" />
              <span>Barcode Scanner</span>
            </button>

            <select
              value={staffStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition-colors ${
                staffStatus === 'online'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : staffStatus === 'busy'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
              }`}
            >
              <option value="online">● ONLINE</option>
              <option value="busy">● BUSY</option>
              <option value="on_break">● ON BREAK</option>
              <option value="offline">● OFFLINE</option>
            </select>

            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Staff Workspace */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Metric Cards Row (4 Core Metrics from Spec) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-amber-500/30 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium">Waiting Requests</span>
            <div className="text-2xl font-black text-amber-500 dark:text-amber-400">{metrics.waiting_requests}</div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Needs staff response</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-blue-500/30 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium">Active Requests</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{metrics.active_requests}</div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Being retrieved right now</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-emerald-500/30 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium">Completed Today</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.completed_today}</div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Customer requests served</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium">Avg Service Time</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.average_service_time}</div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Request to hand-off speed</span>
          </div>
        </div>

        {/* Live Queue Filter Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'active', label: 'Active Queue', count: metrics.active_requests + metrics.waiting_requests },
              { id: 'waiting', label: 'Waiting', count: metrics.waiting_requests },
              { id: 'my_assigned', label: 'Assigned To Me', count: dashboardData?.my_active_requests?.length || 0 },
              { id: 'completed', label: 'Completed Today', count: metrics.completed_today },
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
    </div>
  );
}
