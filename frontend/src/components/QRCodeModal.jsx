import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download, Copy, Check, ExternalLink } from 'lucide-react';

export default function QRCodeModal({ title, subtitle, value, onClose }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ShopFlow QR Code</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; }
            .card { border: 2px dashed #000; border-radius: 20px; padding: 40px; display: inline-block; max-width: 400px; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { color: #666; font-size: 14px; margin-bottom: 24px; }
            .url { font-size: 12px; color: #888; margin-top: 16px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${title}</h1>
            <p>${subtitle}</p>
            <div id="qr">
              ${document.getElementById('qr-code-svg')?.outerHTML || ''}
            </div>
            <p class="url">${value}</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#18181B] border border-zinc-700/80 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Store QR System</span>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
        </div>

        {/* QR Code Container */}
        <div className="p-6 bg-white rounded-2xl inline-block shadow-inner mx-auto">
          <QRCodeSVG
            id="qr-code-svg"
            value={value}
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-400 truncate max-w-[200px]">{value}</span>
          <button
            onClick={handleCopy}
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handlePrint}
            className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            Print Signage
          </button>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Portal
          </a>
        </div>
      </div>
    </div>
  );
}
