import React, { useState, useEffect } from 'react';
import {
  X, Search, Clock, AlertCircle, Phone, MessageCircle, DollarSign,
  Calendar, CheckCircle2, RefreshCw, AlertTriangle, User, FileText,
  CreditCard, Banknote, QrCode, ArrowRight, ShieldCheck, ChevronRight,
  History, Sparkles, Filter
} from 'lucide-react';
import { billingService } from '../services/billingService';

export default function DueBillsModal({
  isOpen,
  onClose,
  role = 'admin',
  onBillUpdated,
  onViewBill,
}) {
  const [dueBills, setDueBills] = useState([]);
  const [summary, setSummary] = useState({
    total_due_amount: 0,
    due_bills_count: 0,
    pending_bills_count: 0,
    settled_bills_count: 0,
    settled_total_amount: 0,
    all_count: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'settled' | 'all'
  const [toast, setToast] = useState(null);

  // Settlement Form State
  const [settlingBill, setSettlingBill] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('cash'); // 'cash' | 'upi' | 'card'
  const [settleNotes, setSettleNotes] = useState('');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);

  // Reminder State
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadDueBills = async (searchTerm = search, tab = activeTab) => {
    setIsLoading(true);
    try {
      const params = {
        status: tab,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await billingService.getDueBills(params, role);
      if (res?.data) {
        setDueBills(res.data.data || res.data || []);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load due bills:', err);
      showToast('Failed to load due bills.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDueBills(search, activeTab);
    }
  }, [isOpen, activeTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    loadDueBills(search, newTab);
  };

  const handleSendReminder = async (bill) => {
    if (!bill.customer_phone) {
      showToast('Customer phone number is missing on this bill.', 'error');
      return;
    }
    setSendingReminderId(bill.id);
    try {
      const res = await billingService.sendDueReminder(bill.id, role);
      showToast('WhatsApp payment reminder dispatched!', 'success');
      if (res?.data?.fallback_url) {
        window.open(res.data.fallback_url, '_blank');
      }
      loadDueBills(search, activeTab);
      if (onBillUpdated) onBillUpdated();
    } catch (err) {
      console.error('Failed to send reminder:', err);
      showToast(err.response?.data?.message || 'Failed to send payment reminder.', 'error');
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleOpenSettle = (bill) => {
    const remainingDue = parseFloat(bill.due_amount) > 0
      ? parseFloat(bill.due_amount)
      : Math.max(0, parseFloat(bill.total_amount || 0) - parseFloat(bill.received_amount || 0));
    setSettlingBill(bill);
    setSettleAmount(String(remainingDue));
    setSettleMethod('cash');
    setSettleNotes('');
  };

  const handleConfirmSettle = async (e) => {
    e?.preventDefault();
    if (!settlingBill) return;

    const amt = parseFloat(settleAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }

    setIsSubmittingSettle(true);
    try {
      const res = await billingService.settleDuePayment(
        settlingBill.id,
        {
          amount: amt,
          payment_method: settleMethod,
          notes: settleNotes.trim() || null,
        },
        role
      );

      showToast(res.message || 'Payment recorded successfully!', 'success');
      setSettlingBill(null);
      loadDueBills(search, activeTab);
      if (onBillUpdated) onBillUpdated();
    } catch (err) {
      console.error('Failed to settle due payment:', err);
      showToast(err.response?.data?.message || 'Failed to record payment.', 'error');
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  if (!isOpen) return null;

  const realPendingCount = summary.pending_bills_count ?? summary.due_bills_count ?? 0;
  const realSettledCount = summary.settled_bills_count ?? 0;
  const realAllCount = summary.all_count ?? (realPendingCount + realSettledCount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Customer Due Bills & Credit Ledger (Udhaar)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {realPendingCount} Pending
                </span>
                {realSettledCount > 0 && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {realSettledCount} Settled
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Track pending customer payments, send WhatsApp reminders, and view settled credit history.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOAST ALERT */}
        {toast && (
          <div className={`mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        )}

        {/* SUMMARY STATS & TABS */}
        <div className="p-4 sm:p-6 pb-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Outstanding Due */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                  Total Outstanding Due
                </span>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  ₹{Number(summary.total_due_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </span>
            </div>

            {/* Total Pending Bills (REAL COUNT ONLY) */}
            <div className="p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                  Pending Due Bills
                </span>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {realPendingCount} <span className="text-xs font-bold text-slate-500">unpaid bills</span>
                </div>
              </div>
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <Clock className="w-5 h-5" />
              </span>
            </div>

            {/* Cleared / Settled Bills Count */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Settled Credit History
                </span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {realSettledCount} <span className="text-xs font-bold text-slate-500">cleared bills</span>
                </div>
              </div>
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* FILTER TABS & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Navigation Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700/60 shrink-0">
              <button
                type="button"
                onClick={() => handleTabChange('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Current Pending</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'pending'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                }`}>
                  {realPendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('settled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'settled'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Settled History</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'settled'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                }`}>
                  {realSettledCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>All Dues</span>
                <span className="text-[10px] font-semibold text-slate-400">
                  ({realAllCount})
                </span>
              </button>
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    loadDueBills(e.target.value, activeTab);
                  }}
                  placeholder="Search customer, phone, bill #..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => loadDueBills(search, activeTab)}
                disabled={isLoading}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                title="Refresh List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* DUE BILLS LIST */}
        <div className="p-4 sm:p-6 pt-2 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
              <p className="text-xs font-semibold">Loading bills...</p>
            </div>
          ) : dueBills.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {activeTab === 'pending'
                  ? 'All Customer Dues are Cleared!'
                  : activeTab === 'settled'
                  ? 'No Settled History Found'
                  : 'No Credit Bills Found'}
              </h4>
              <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
                {activeTab === 'pending'
                  ? 'There are zero outstanding due balances. Check the "Settled History" tab to inspect previous cleared records.'
                  : 'Bills settled from due payments will appear here in chronological history.'}
              </p>
              {activeTab === 'pending' && realSettledCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange('settled')}
                  className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer inline-flex items-center gap-1 mt-2"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View {realSettledCount} Settled Bills →</span>
                </button>
              )}
            </div>
          ) : (
            dueBills.map((bill) => {
              const totalAmt = parseFloat(bill.total_amount || 0);
              const paidAmt = parseFloat(bill.received_amount || 0);
              const dueAmt = parseFloat(bill.due_amount) > 0
                ? parseFloat(bill.due_amount)
                : Math.max(0, totalAmt - paidAmt);
              const isFullySettled = dueAmt <= 0 || bill.payment_status === 'paid';
              const billNum = bill.bill_number || bill.bill_serial_no || bill.order_number;
              const isOverdue = !isFullySettled && bill.due_date && new Date(bill.due_date) < new Date(new Date().setHours(0,0,0,0));
              const settlementHistory = bill.payment_details?.settlement_history || [];
              const latestSettlement = settlementHistory.length > 0 ? settlementHistory[settlementHistory.length - 1] : null;

              return (
                <div
                  key={bill.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs ${
                    isFullySettled
                      ? 'bg-emerald-50/20 dark:bg-zinc-850/60 border-emerald-200/60 dark:border-zinc-800'
                      : 'bg-white dark:bg-zinc-850 border-slate-200 dark:border-zinc-700/80 hover:border-amber-400/60'
                  }`}
                >
                  {/* Bill & Customer Info */}
                  <div className="space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        Bill #{billNum}
                      </span>

                      {isFullySettled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Fully Settled</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          Due Pending
                        </span>
                      )}

                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{bill.customer_name || 'Walk-in Customer'}</span>
                    </div>

                    {bill.customer_phone ? (
                      <div className="flex items-center gap-2 text-xs">
                        <a
                          href={`tel:${bill.customer_phone}`}
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{bill.customer_phone}</span>
                        </a>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No phone number</span>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>Billed: {new Date(bill.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      {!isFullySettled && bill.due_date && (
                        <span className={`font-semibold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          • Pay by: {new Date(bill.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      {isFullySettled && latestSettlement && (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          • Cleared via {latestSettlement.method?.toUpperCase() || 'CASH'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown (Total, Paid, Balance Due) */}
                  <div className={`p-3 rounded-xl border text-xs min-w-[170px] space-y-1 ${
                    isFullySettled
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/40'
                      : 'bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800'
                  }`}>
                    <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                      <span>Bill Total:</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">₹{totalAmt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span>Total Paid:</span>
                      <span className="font-semibold">₹{paidAmt.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between items-center pt-1 border-t font-black ${
                      isFullySettled
                        ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400'
                    }`}>
                      <span>Balance Due:</span>
                      <span className="text-sm">
                        {isFullySettled ? '₹0.00 (Cleared)' : `₹${dueAmt.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap sm:flex-col items-stretch gap-2 shrink-0 sm:min-w-[150px]">
                    {!isFullySettled ? (
                      <>
                        {/* Settle Due Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenSettle(bill)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Settle / Clear Due</span>
                        </button>

                        {/* Send WhatsApp Reminder Button */}
                        <button
                          type="button"
                          onClick={() => handleSendReminder(bill)}
                          disabled={sendingReminderId === bill.id || !bill.customer_phone}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          title={!bill.customer_phone ? 'Phone number missing' : 'Send payment reminder via WhatsApp'}
                        >
                          {sendingReminderId === bill.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Send Reminder</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      /* Settled Status Pill */
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Payment Cleared</span>
                      </div>
                    )}

                    {/* View Bill Receipt */}
                    {onViewBill && (
                      <button
                        type="button"
                        onClick={() => onViewBill(bill)}
                        className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Receipt</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SETTLE DUE PAYMENT SUB-MODAL */}
        {settlingBill && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Record Payment / Clear Due
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bill #{settlingBill.bill_number || settlingBill.id} • {settlingBill.customer_name || 'Walk-in'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettlingBill(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Amount Info */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Outstanding Due:</span>
                  <span className="font-black text-red-600 dark:text-red-400">
                    ₹{parseFloat(settlingBill.due_amount || (settlingBill.total_amount - settlingBill.received_amount)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Amount to receive */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Amount Received Now (₹):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    autoFocus
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-black text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Payment Method:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleMethod('cash')}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settleMethod === 'cash'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettleMethod('upi')}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settleMethod === 'upi'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettleMethod('card')}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settleMethod === 'card'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Notes (Optional):
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Paid at store counter, PhonePe UPI"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSettlingBill(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSettle}
                  disabled={isSubmittingSettle}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSettle ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Collect & Settle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
