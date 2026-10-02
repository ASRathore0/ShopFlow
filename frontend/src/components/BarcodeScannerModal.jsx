import React, { useState } from 'react';
import { X, ScanLine, Search, PackageCheck, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { staffService } from '../services/staffService';
import LocationBreadcrumb from './LocationBreadcrumb';

export default function BarcodeScannerModal({ onClose, onSelectProduct }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Sample quick barcodes from our seeded database for 1-click test scanning
  const demoBarcodes = [
    { label: 'MacBook Air M4', code: '194253018241' },
    { label: 'iPhone 17 Pro', code: '195949018241' },
    { label: 'Dell XPS 14', code: '884116439211' },
    { label: 'Sony WH-1000XM6', code: '454873614210' },
  ];

  const handleScan = async (searchCode) => {
    const query = searchCode || code;
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await staffService.scanBarcode(query.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || `No item found matching barcode: ${query}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#18181B] border border-zinc-700/80 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">In-Store Barcode Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Simulation Viewfinder */}
        <div className="relative aspect-video bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center overflow-hidden">
          <div className="w-3/4 h-24 border-2 border-blue-500/80 rounded-xl relative flex items-center justify-center">
            {/* Animated laser line */}
            <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] animate-bounce"></div>
            <span className="text-[11px] font-mono text-zinc-500">ALIGN BARCODE IN FRAME</span>
          </div>
        </div>

        {/* Manual Input or Gun Scanner Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter barcode or SKU (e.g. 194253018241)"
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="w-full bg-zinc-900 text-white px-3.5 py-2.5 rounded-xl border border-zinc-700 text-xs placeholder-zinc-500 outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => handleScan()}
            disabled={loading || !code.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Scan
          </button>
        </div>

        {/* 1-Click Demo Barcodes */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Quick Demo Barcodes:</span>
          <div className="flex flex-wrap gap-1.5">
            {demoBarcodes.map((d) => (
              <button
                key={d.code}
                onClick={() => {
                  setCode(d.code);
                  handleScan(d.code);
                }}
                className="text-[10px] font-mono px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 transition-colors"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scan Result Card */}
        {result && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-blue-500/40 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5" />
                Product Located
              </span>
              <span className="text-xs font-bold text-white">${parseFloat(result.product.price).toFixed(2)}</span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{result.product.name}</h4>
              <p className="text-xs text-zinc-400">{result.variant ? result.variant.name : 'Standard Model'}</p>
            </div>

            {/* Exact Location */}
            <div className="pt-2 border-t border-zinc-800">
              <LocationBreadcrumb location={result.location} showTitle={true} variant="horizontal" />
            </div>

            {onSelectProduct && (
              <button
                onClick={() => {
                  onClose();
                  onSelectProduct(result.product);
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
              >
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
