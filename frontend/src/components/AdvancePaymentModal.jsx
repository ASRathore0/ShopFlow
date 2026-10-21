import React, { useState } from 'react';
import {
  X, QrCode, Smartphone, Copy, Check, ShieldCheck,
  AlertCircle, CreditCard, ChevronRight, Sparkles, MessageCircle, ExternalLink
} from 'lucide-react';
import { getThemeConfig } from '../utils/storefrontThemes';
import { generateWhatsAppOrderMessage, openWhatsAppUrl } from '../utils/whatsappHelper';

export default function AdvancePaymentModal({
  isOpen,
  onClose,
  product,
  selectedVariant,
  shop,
}) {
  if (!isOpen || !product) return null;

  const cps = shop?.customer_portal_settings || product?.shop?.customer_portal_settings || {};
  const themeConfig = getThemeConfig(shop || product?.shop);

  const productPrice = Number(selectedVariant?.price ?? product?.price ?? 0);
  const shopName = shop?.name || product?.shop?.name || 'Showroom';
  const whatsappNumber = cps.whatsapp_number || shop?.phone || '';

  // Calculate advance amount
  const advanceType = cps.advance_amount_type || 'fixed'; // 'fixed' | 'percentage'
  const advanceValue = Number(cps.advance_amount_value) || 500;
  
  let advanceAmount = 0;
  if (advanceType === 'percentage') {
    advanceAmount = Math.max(1, Math.round((productPrice * advanceValue) / 100));
  } else {
    advanceAmount = Math.min(productPrice, advanceValue);
  }
  const balanceDue = Math.max(0, productPrice - advanceAmount);

  const upiId = cps.upi_id || '';
  const upiName = cps.upi_name || shopName;
  const qrImage = cps.payment_qr_image || null;

  // Standard UPI URI
  const upiUri = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${advanceAmount}&cu=INR&tn=${encodeURIComponent(`Advance for ${product.name}`)}`
    : '';

  // Dynamic QR Code fallback via public QR generator API if merchant entered UPI ID without uploading image
  const dynamicQrUrl = upiUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}&margin=8`
    : null;

  const activeQrSrc = qrImage || dynamicQrUrl;

  // Form states
  const [utrNumber, setUtrNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errorWarning, setErrorWarning] = useState('');

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleOpenUpiApp = () => {
    if (upiUri) {
      window.location.href = upiUri;
    }
  };

  const handleSubmitWhatsApp = (e) => {
    e?.preventDefault();

    if (!utrNumber.trim()) {
      setErrorWarning('Please enter the 12-digit UPI Transaction / UTR ID after paying so the store can verify your advance booking.');
      return;
    }

    const message = generateWhatsAppOrderMessage({
      product,
      selectedVariant,
      shop,
      advancePaid: advanceAmount,
      utrNumber: utrNumber.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerNote: customerNote.trim(),
    });

    openWhatsAppUrl(whatsappNumber, message);
    onClose();
  };

  const handleDirectWhatsAppWithoutAdvance = () => {
    const message = generateWhatsAppOrderMessage({
      product,
      selectedVariant,
      shop,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerNote: customerNote.trim(),
    });

    openWhatsAppUrl(whatsappNumber, message);
    onClose();
  };

  const variantDesc = selectedVariant
    ? [selectedVariant.color, selectedVariant.size, selectedVariant.storage, selectedVariant.name].filter(Boolean).join(' / ')
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header Ribbon */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight truncate">Advance Booking & WhatsApp Order</h3>
              <p className="text-[11px] text-emerald-100/90 font-medium truncate">{shopName} Direct Checkout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-90"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. Item Breakdown Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                  {product.brand || shopName}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {product.name}
                </h4>
                {variantDesc && (
                  <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    {variantDesc}
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase">Full Price</span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  ₹{productPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">
                  Advance Token Today
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ₹{advanceAmount.toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block uppercase">
                  Due on Delivery / Pickup
                </span>
                <span className="text-sm font-extrabold text-slate-700 dark:text-zinc-300">
                  ₹{balanceDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. QR Code / UPI Payment Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Scan to Pay Booking Advance ₹{advanceAmount.toFixed(2)}</span>
            </div>

            {/* QR Frame */}
            {activeQrSrc ? (
              <div className="relative p-2.5 bg-white rounded-2xl border-2 border-dashed border-emerald-500/40 shadow-sm group">
                <img
                  src={activeQrSrc}
                  alt="Store Payment QR"
                  className="w-48 h-48 object-contain rounded-xl mx-auto"
                />
                <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-sm">
                  BHIM UPI
                </span>
              </div>
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center p-4 text-center">
                <QrCode className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Direct WhatsApp Order</span>
                <span className="text-[10px] text-slate-400 mt-1">Pay advance via WhatsApp chat or on collection.</span>
              </div>
            )}

            {/* UPI ID Pill & Mobile Quick Pay */}
            {upiId && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200">
                  <span className="truncate max-w-[180px]">{upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {upiUri && (
                  <button
                    type="button"
                    onClick={handleOpenUpiApp}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pay in UPI App</span>
                  </button>
                )}
              </div>
            )}

            {cps.advance_payment_note && (
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed italic">
                "{cps.advance_payment_note}"
              </p>
            )}
          </div>

          {/* 3. Form: Confirmation Reference */}
          <form onSubmit={handleSubmitWhatsApp} className="space-y-3">
            {errorWarning && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorWarning}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-800 dark:text-zinc-200 mb-1">
                Payment UTR / Transaction ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value);
                  if (errorWarning) setErrorWarning('');
                }}
                placeholder="e.g. 429384729182 (12-digit UTR from GPay/PhonePe)"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">
                Found in payment receipt on PhonePe, GPay, Paytm or your banking app.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Your Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Special Note / Fitting Room Request (Optional)
              </label>
              <input
                type="text"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="e.g. Please hold until 6 PM / arrange gift wrapping"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group cursor-pointer mt-2"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform fill-white" />
              <span>Confirm & Send Details on WhatsApp</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Secondary fallback */}
          <div className="text-center pt-1 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleDirectWhatsAppWithoutAdvance}
              className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
            >
              Have questions first? Inquire on WhatsApp without advance payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
