import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  Printer, ShoppingBag, Store, CheckCircle2, AlertCircle, 
  ArrowLeft, RefreshCw, Phone, MapPin, Share2, Download,
  Check, ExternalLink, ShieldCheck, Sparkles, MessageCircle, Clock, Receipt
} from 'lucide-react';
import { billingService } from '../services/billingService';
import ShopBillReceipt from '../components/ShopBillReceipt';

export default function PublicBillView() {
  const { identifier } = useParams();
  const [searchParams] = useSearchParams();
  const shopSlug = searchParams.get('shop') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billData, setBillData] = useState(null);
  const [shopData, setShopData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!identifier) return;

    let isMounted = true;
    const fetchBill = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await billingService.getPublicBill(identifier, shopSlug);
        if (isMounted) {
          if (res?.data?.bill) {
            setBillData(res.data.bill);
            setShopData(res.data.shop || res.data.bill.shop || {});
          } else {
            setError('Receipt not found');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load bill receipt:', err);
          setError(err.response?.data?.message || 'Bill receipt not found or expired.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBill();
    return () => {
      isMounted = false;
    };
  }, [identifier, shopSlug]);

  const handlePrint = () => {
    window.print();
  };

  const currentShop = shopData || billData?.shop || {};
  const resolvedShopSlug = currentShop?.slug || shopSlug || 'store';
  const storefrontUrl = `/shop/${resolvedShopSlug}`;

  const formattedDate = billData?.created_at
    ? new Date(billData.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const formattedTime = billData?.created_at
    ? new Date(billData.created_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  const handleNativeShare = async () => {
    const currentUrl = window.location.href;
    const shareText = `🧾 Bill Memo from ${currentShop.name || 'Store'}\nAmount: ₹${parseFloat(billData?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nView your digital receipt:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bill Receipt - ${currentShop.name || 'VR Collection'}`,
          text: shareText,
          url: currentUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share error, falling back to copy:', err);
        }
      }
    }

    // Fallback: Copy link
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      // WhatsApp Web fallback
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-blue-600/15 via-emerald-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-32 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar (Hidden during printing) */}
      <header className="print:hidden sticky top-0 z-40 bg-slate-900/85 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-lg shadow-black/20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to={storefrontUrl}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all border border-white/10 shrink-0"
              title="Return to Showroom"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white truncate tracking-tight">
                  {currentShop?.name || 'VR COLLECTION'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verified Bill
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <span>Official Digital Tax & Cash Memo</span>
                {formattedDate && <span>• {formattedDate}</span>}
              </p>
            </div>
          </div>

          {/* Quick Share Icon Pill */}
          {!loading && billData && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/15 shadow-sm shrink-0 cursor-pointer"
              title="Share digital bill"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-300 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-blue-300" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 sm:pb-32 flex flex-col items-center">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Loading Official Bill Memo...</h2>
              <p className="text-xs text-slate-400 mt-1">Verifying encrypted store receipt parameters</p>
            </div>
          </div>
        ) : error || !billData ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-white/10 text-center space-y-4 shadow-2xl max-w-md w-full my-12">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">Receipt Not Found</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {error || "We could not find an active bill receipt with this identifier. The link may have expired or been mistyped."}
              </p>
            </div>
            <Link
              to={storefrontUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Visit Shop Showroom</span>
            </Link>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-4 sm:space-y-6">
            
            {/* HERO RECEIPT SUMMARY CARD (Mobile-Friendly Capsule) */}
            <div className="print:hidden w-full max-w-[580px] p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border border-white/15 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Paid Amount
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {(billData.payment_method || 'UPI').toUpperCase()} • {(billData.payment_status || 'PAID').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display">
                    ₹{parseFloat(billData.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0 text-xs text-slate-300">
                  <div className="font-extrabold text-white">
                    Bill #{billData.bill_number || billData.bill_serial_no || '1'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {formattedDate} {formattedTime && `• ${formattedTime}`}
                  </div>
                </div>
              </div>
            </div>

            {/* THE AUTHENTIC PAPER BILL MEMO */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[580px] rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/40 border border-white/15 overflow-hidden bg-white">
                <ShopBillReceipt
                  bill={billData}
                  shop={currentShop}
                  showActions={false}
                />
              </div>
            </div>

            {/* SHOWROOM & STORE DISCOVERY CARD */}
            <div className="print:hidden w-full max-w-[580px] p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-white/15 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-bold text-sm text-white">
                    {currentShop.name || 'VR COLLECTION'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {currentShop.bill_tagline || 'Premium In-Store Catalog & Digital Retail'}
                </p>
                {currentShop.phone && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Customer Care: <strong>{currentShop.phone}</strong></span>
                  </p>
                )}
              </div>

              <Link
                to={storefrontUrl}
                className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 border border-white/15 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Explore Live Catalog</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Legal / Policy Note */}
            <p className="print:hidden text-[10px] text-slate-400 text-center max-w-md px-4 leading-relaxed">
              Official digital cash memo registered under {currentShop.name || 'our store'}. All terms, warranties, and return policies stated on the receipt are binding.
            </p>
          </div>
        )}
      </main>

      {/* Floating Sticky Actions Bar (Mobile-First Thumb-Zone, print:hidden) */}
      {!loading && billData && (
        <div className="print:hidden fixed bottom-3 left-3 right-3 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-40">
          <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/20 p-2 sm:p-2.5 rounded-3xl shadow-2xl shadow-black/80 flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 py-3.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <Link
              to={storefrontUrl}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95 text-center transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Showroom →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="print:hidden border-t border-white/10 py-6 text-center text-xs text-slate-400 mt-auto">
        <p>Verified Official Digital Bill Memo • Powered by ShopFlow Physical Retail</p>
      </footer>
    </div>
  );
}
