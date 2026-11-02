import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Printer, ShoppingBag, Store, CheckCircle2, AlertCircle, 
  ArrowLeft, RefreshCw, Phone, MapPin, Share2, Download
} from 'lucide-react';
import { billingService } from '../services/billingService';
import ShopBillReceipt from '../components/ShopBillReceipt';

export default function PublicBillView() {
  const { identifier } = useParams();
  const [searchParams] = useSearchParams();
  const shopSlug = searchParams.get('shop') || '';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billData, setBillData] = useState(null);
  const [shopData, setShopData] = useState(null);

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

  const resolvedShopSlug = shopData?.slug || shopSlug || 'store';
  const storefrontUrl = `/shop/${resolvedShopSlug}`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0c0d12] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar (Hidden when printing) */}
      <header className="print:hidden sticky top-0 z-40 bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to={storefrontUrl}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
              title="Back to Storefront"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {shopData?.name || 'VR COLLECTION'}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Verified Bill
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Official Digital Cash Memo</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden">Print</span>
            </button>

            <Link
              to={storefrontUrl}
              className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Showroom</span>
              <span className="sm:hidden">Showroom</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-zinc-800 flex items-center justify-center text-blue-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-zinc-200">Retrieving Your Bill Memo...</h2>
              <p className="text-xs text-slate-400 mt-0.5">Securely verifying store transaction details</p>
            </div>
          </div>
        ) : error || !billData ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 text-center space-y-4 shadow-sm max-w-md w-full my-10">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Bill Receipt Not Found</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {error || "We could not find an active bill receipt with this identifier."}
              </p>
            </div>
            <Link
              to={storefrontUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Visit Shop Showroom</span>
            </Link>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-6">
            {/* The Authentic Bill Memo Receipt */}
            <div className="w-full flex justify-center py-2 sm:py-4">
              <ShopBillReceipt
                bill={billData}
                shop={shopData}
                showActions={false}
              />
            </div>

            {/* Quick Action CTAs Below Bill */}
            <div className="print:hidden w-full max-w-[580px] p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="text-center">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                  Thank you for shopping at {shopData?.name || 'our store'}!
                </span>
                <span className="text-[11px] text-slate-400">
                  Tap below to explore our live digital catalog and request assistance next time you visit.
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>Print / PDF</span>
                </button>
                <Link
                  to={storefrontUrl}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Browse Catalog</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Sticky Mobile Actions Bar (Mobile Only, print:hidden) */}
      {!loading && billData && (
        <div className="print:hidden sm:hidden fixed bottom-3 left-3 right-3 z-30">
          <div className="bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-700 p-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <Link
              to={storefrontUrl}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 text-center"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Showroom →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-200 dark:border-zinc-800 py-6 text-center text-xs text-slate-400">
        <p>Verified Official Digital Bill Memo • Powered by ShopFlow Physical Retail</p>
      </footer>
    </div>
  );
}

