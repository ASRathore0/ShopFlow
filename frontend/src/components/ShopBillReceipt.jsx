import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Share2, X, Download, CheckCircle2, MessageSquare, Loader2, ExternalLink } from 'lucide-react';
import { billingService } from '../services/billingService';

export default function ShopBillReceipt({
  bill,
  shop,
  onClose,
  showActions = true,
}) {
  const printRef = useRef(null);
  const [sendingWa, setSendingWa] = useState(false);
  const [waSentNotice, setWaSentNotice] = useState(null);

  if (!bill) return null;

  const currentShop = shop || bill.shop || {};
  const shopName = currentShop.name || 'VR COLLECTION';
  const shopSlug = currentShop.slug || 'vr-collection';
  const shopPhone = currentShop.phone || '8920779479';
  const shopAddress = currentShop.address || 'Shop No.-04, Amritpuram, Jagat Farm, Greater Noida U.P. Near Raja Dhaba Wali Gali';
  const shopTagline = currentShop.bill_tagline || (currentShop.shop_type ? `Deals In : All Type ${currentShop.shop_type.replace('_', ' ')}` : "Deals In : All Type Men's Wear");
  const shopTerms = currentShop.bill_terms || 'No Return, Only Exchange Within 3 Days Onwards 2 pm';

  // Frontstore URL for QR Code and live customer discovery
  const frontstoreUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/shop/${shopSlug}`
    : (currentShop.frontstore_url || `https://shopsflow.in/shop/${shopSlug}`);

  // Direct Digital Bill Copy URL for customer smartphone receipt memo
  const billIdentifier = bill.order_number || bill.id || bill.bill_number;
  const billCopyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/bill/${billIdentifier}?shop=${shopSlug}`
    : `https://shopsflow.in/bill/${billIdentifier}?shop=${shopSlug}`;

  const items = bill.items || [];
  const minRows = 10;
  const emptyRowsCount = Math.max(0, minRows - items.length);

  const formattedDate = bill.created_at
    ? new Date(bill.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = async () => {
    const customerPhone = bill.customer_phone ? bill.customer_phone.replace(/\D/g, '') : '';
    const phoneParam = customerPhone ? (customerPhone.length === 10 ? `91${customerPhone}` : customerPhone) : '';

    let itemsText = items.map((it, idx) => `${idx + 1}. ${it.item_name || it.product?.name || 'Item'} (Qty: ${it.quantity}) - ₹${parseFloat(it.total_price || 0).toFixed(2)}`).join('\n');

    const message = `🧾 *BILL RECEIPT - ${shopName.toUpperCase()}*\n` +
      `*Sr. No.:* ${bill.bill_number || bill.bill_serial_no || bill.order_number}\n` +
      `*Date:* ${formattedDate}\n` +
      `*Customer:* ${bill.customer_name || 'Valued Customer'}\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total Amount:* ₹${parseFloat(bill.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
      `*Payment:* ${(bill.payment_method || 'Cash').toUpperCase()} (${bill.payment_status || 'Paid'})\n\n` +
      `📄 *View / Download Your Official Bill Memo:*\n${billCopyUrl}\n\n` +
      `🛍️ *Browse our live digital showroom:*\n${frontstoreUrl}\n\n` +
      `*Note:* ${shopTerms}\n` +
      `Thank you for shopping with us!`;

    const waUrl = phoneParam
      ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    // Direct automated API delivery if shop has Meta or Twilio configured
    if (currentShop.whatsapp_provider && currentShop.whatsapp_provider !== 'none' && bill.id) {
      setSendingWa(true);
      try {
        const res = await billingService.sendWhatsApp(bill.id, phoneParam);
        if (res?.data?.success) {
          setWaSentNotice('Sent via ' + currentShop.whatsapp_provider.toUpperCase() + ' API!');
          setTimeout(() => setWaSentNotice(null), 4000);
          setSendingWa(false);
          return;
        }
      } catch (err) {
        console.warn('Direct WhatsApp API failed, opening fallback link...', err);
      } finally {
        setSendingWa(false);
      }
    }

    window.open(waUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center max-w-full">
      {/* Top Toolbar (Hidden on print) */}
      {showActions && (
        <div className="w-full max-w-[580px] mb-3 flex items-center justify-between gap-2 print:hidden bg-slate-900/95 text-white p-2.5 sm:p-3 rounded-2xl shadow-xl backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-xs truncate">
              #{bill.bill_number || bill.bill_serial_no || bill.order_number}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={sendingWa}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              title="Send bill to customer WhatsApp (Meta / Twilio direct API, or 1-click fallback)"
            >
              {sendingWa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{sendingWa ? 'Sending...' : (waSentNotice || 'WhatsApp')}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
              title="Print standard physical bill memo"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bill Container: Exact Paper Memo Pad Layout */}
      <div
        ref={printRef}
        id="printable-shop-bill"
        className="w-full max-w-[580px] bg-white text-black p-3.5 sm:p-6 rounded-lg shadow-2xl border-2 border-black font-sans leading-tight print:p-0 print:border-2 print:shadow-none print:w-full print:max-w-none"
        style={{ color: '#000', backgroundColor: '#fff' }}
      >
        {/* HEADER SECTION */}
        <div className="flex items-start justify-between gap-1.5 sm:gap-2 pb-2">
          {/* Frontstore QR Code with Slug Handle */}
          <div className="flex flex-col items-center shrink-0 w-20 sm:w-24">
            <div className="p-1 border border-black rounded bg-white">
              <QRCodeSVG
                value={frontstoreUrl}
                size={66}
                level="M"
                includeMargin={false}
              />
            </div>
            <span className="text-[8.5px] sm:text-[9px] font-black tracking-tight text-center mt-1 truncate max-w-[85px] sm:max-w-[95px] uppercase">
              @{shopSlug}
            </span>
            <span className="text-[7px] sm:text-[7.5px] font-semibold text-center text-slate-700 tracking-tighter">
              Scan for Catalog
            </span>
          </div>

          {/* Shop Name & Header Title */}
          <div className="flex-1 text-center px-1 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase underline underline-offset-2 mb-0.5">
              Estimate
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tighter uppercase font-serif text-black leading-none py-0.5 break-words">
              {shopName}
            </h1>
            <div className="text-[11px] sm:text-sm font-bold tracking-tight text-black mt-0.5 sm:mt-1">
              {shopTagline}
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="text-right text-[10px] sm:text-[11px] font-bold leading-tight shrink-0 min-w-[85px] sm:min-w-[100px]">
            <div>Mob.: {shopPhone}</div>
            {currentShop.customer_portal_settings?.whatsapp_number && currentShop.customer_portal_settings?.whatsapp_number !== shopPhone && (
              <div>{currentShop.customer_portal_settings.whatsapp_number}</div>
            )}
          </div>
        </div>

        {/* ADDRESS BANNER (Inverted Solid Black Bar) */}
        <div className="bg-black text-white text-[10px] sm:text-xs font-bold px-2 py-1 text-center uppercase tracking-wide my-1 leading-snug">
          Address : {shopAddress}
        </div>

        {/* INVOICE & CUSTOMER META INFO */}
        <div className="pt-2 pb-1 text-xs font-bold space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-1">
              <span className="font-black text-sm">Sr. no.</span>
              <span className="font-black text-base px-1.5 border-b border-black min-w-[60px] inline-block">
                {bill.bill_number || bill.bill_serial_no || '622'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span>Date</span>
              <span className="border-b border-black min-w-[110px] inline-block text-center font-bold">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="shrink-0">Name :</span>
            <span className="border-b border-black flex-1 font-semibold pl-1">
              {bill.customer_name || 'Walk-in Customer'}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="shrink-0">Address :</span>
            <span className="border-b border-black flex-1 font-semibold pl-1 truncate">
              {bill.customer_address || (bill.customer_phone ? `Phone: ${bill.customer_phone}` : '') || ''}
            </span>
          </div>
        </div>

        {/* RULED TABLE GRID */}
        <div className="mt-2 border-2 border-black overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-black font-black text-center text-xs bg-slate-100/50 print:bg-transparent">
                <th className="border-r-2 border-black py-1 px-1.5 w-10">Sr.</th>
                <th className="border-r-2 border-black py-1 px-2 text-left">Details</th>
                <th className="border-r-2 border-black py-1 px-1.5 w-12">Qty.</th>
                <th className="border-r-2 border-black py-1 px-2 w-16 text-right">Rate</th>
                <th className="py-1 px-2 w-20 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/80 font-medium">
              {/* Product Rows */}
              {items.map((item, index) => {
                const title = item.item_name || item.product?.name || 'Item';
                const variantInfo = item.variant_name || (item.variant ? `${item.variant.name || ''} ${item.variant.sku || ''}` : '');
                const rate = parseFloat(item.unit_price || 0);
                const amt = parseFloat(item.total_price || (rate * (item.quantity || 1)));

                return (
                  <tr key={index} className="h-7 text-xs">
                    <td className="border-r-2 border-black text-center font-bold px-1 py-1">
                      {index + 1}
                    </td>
                    <td className="border-r-2 border-black px-2 py-1 font-semibold">
                      <span className="uppercase">{title}</span>
                      {variantInfo && (
                        <span className="text-[10px] text-slate-700 ml-1">
                          ({variantInfo.trim()})
                        </span>
                      )}
                    </td>
                    <td className="border-r-2 border-black text-center font-bold px-1 py-1">
                      {item.quantity}
                    </td>
                    <td className="border-r-2 border-black text-right px-2 py-1">
                      {rate.toFixed(2)}
                    </td>
                    <td className="text-right font-bold px-2 py-1">
                      {amt.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* Blank ruled padding rows to match physical bill-book pad appearance */}
              {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="h-6">
                  <td className="border-r-2 border-black text-center px-1">&nbsp;</td>
                  <td className="border-r-2 border-black px-2">&nbsp;</td>
                  <td className="border-r-2 border-black text-center px-1">&nbsp;</td>
                  <td className="border-r-2 border-black text-right px-2">&nbsp;</td>
                  <td className="text-right px-2">&nbsp;</td>
                </tr>
              ))}

              {/* Discount / Tax rows if applied */}
              {parseFloat(bill.discount_amount || 0) > 0 && (
                <tr className="border-t-2 border-black text-xs">
                  <td colSpan="3" className="border-r-2 border-black"></td>
                  <td className="border-r-2 border-black text-right px-2 py-0.5 font-bold">Discount:</td>
                  <td className="text-right px-2 py-0.5 font-bold text-red-600">
                    - {parseFloat(bill.discount_amount).toFixed(2)}
                  </td>
                </tr>
              )}

              {/* GRAND TOTAL ROW */}
              <tr className="border-t-2 border-black font-black text-xs sm:text-sm">
                <td colSpan="3" className="border-r-2 border-black"></td>
                <td className="border-r-2 border-black text-center py-1.5 px-2 bg-slate-50 print:bg-transparent font-black uppercase tracking-wide">
                  Total
                </td>
                <td className="text-right py-1.5 px-2 font-black">
                  ₹{parseFloat(bill.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PAYMENT SUMMARY & FOOTER */}
        <div className="mt-3 pt-1 flex items-end justify-between gap-2 text-xs">
          {/* Left Side: E. & O. E. + Return Policy Pill */}
          <div className="space-y-1.5 max-w-[340px]">
            <div className="text-[10px] font-bold tracking-widest text-black">
              E. & O. E.
            </div>
            {/* Pill Banner */}
            <div className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full inline-block tracking-tight text-center">
              {shopTerms}
            </div>
            {bill.payment_method && (
              <div className="text-[10px] font-semibold text-slate-700">
                Mode: <span className="uppercase font-bold text-black">{bill.payment_method}</span>
                {bill.soundbox_account_name && <span> • <strong>{bill.soundbox_account_name}</strong></span>}
                {bill.utr_number && <span className="font-mono"> (UTR: {bill.utr_number})</span>}
                {!bill.soundbox_account_name && !bill.utr_number && ` (${bill.payment_status || 'Paid'})`}
              </div>
            )}
          </div>

          {/* Right Side: Signature Block */}
          <div className="text-right flex flex-col items-end shrink-0 min-w-[130px]">
            <div className="font-extrabold text-xs uppercase tracking-tight">
              For {shopName}
            </div>
            <div className="h-10"></div>
            <div className="text-xs font-bold border-t border-black/80 pt-0.5 px-3 inline-block">
              Signature
            </div>
          </div>
        </div>
      </div>

      {/* Global Print Media Style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-shop-bill, #printable-shop-bill * {
            visibility: visible;
          }
          #printable-shop-bill {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12px !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          @page {
            margin: 10mm;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}

