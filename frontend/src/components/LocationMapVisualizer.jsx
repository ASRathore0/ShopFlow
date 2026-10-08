import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Layers, Maximize2, Info } from 'lucide-react';

export default function LocationMapVisualizer({ location, productName }) {
  const [selectedZone, setSelectedZone] = useState(null);

  // Store layout predefined architectural zones
  const zones = [
    { id: 'entrance', name: 'Main Entrance & QR Kiosk', x: 20, y: 15, w: 260, h: 40, type: 'portal', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
    { id: 'checkout', name: 'POS & Cashier Desks', x: 290, y: 15, w: 190, h: 40, type: 'pos', color: 'border-zinc-700 bg-zinc-800/80 text-zinc-300' },

    // Floor 1 Sections
    { id: 'mobiles', name: 'Mobiles & 5G (A1 - A2)', x: 20, y: 75, w: 220, h: 90, type: 'section', code: 'MOB', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
    { id: 'laptops', name: 'Laptops & Workstations (A3)', x: 260, y: 75, w: 220, h: 90, type: 'section', code: 'LAP', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },

    // Ground Floor Sections
    { id: 'accessories', name: 'Audio & Accessories (A4)', x: 20, y: 185, w: 220, h: 90, type: 'section', code: 'ACC', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
    { id: 'televisions', name: 'Televisions & OLED (A5)', x: 260, y: 185, w: 220, h: 90, type: 'section', code: 'TV', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },

    { id: 'storage', name: 'Back Store Inventory Vault', x: 20, y: 295, w: 460, h: 45, type: 'vault', color: 'border-zinc-700/80 bg-zinc-900 text-zinc-400' },
  ];

  // Pin coordinates based on location
  const getPinCoords = () => {
    if (!location) return { x: 370, y: 120 };
    const sec = location.section?.name?.toLowerCase() || '';
    if (sec.includes('laptop')) return { x: 370, y: 120, aisle: 'Aisle A3', rack: 'Rack R07' };
    if (sec.includes('mobile')) return { x: 130, y: 120, aisle: 'Aisle A2', rack: 'Rack R04' };
    if (sec.includes('access') || sec.includes('audio')) return { x: 130, y: 230, aisle: 'Aisle A4', rack: 'Rack R11' };
    if (sec.includes('tv') || sec.includes('tele')) return { x: 370, y: 230, aisle: 'Aisle A5', rack: 'Rack R15' };
    return { x: 250, y: 140, aisle: 'Floor 1', rack: 'Center Rack' };
  };

  const pin = getPinCoords();

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Map Header */}
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Physical Store Layout Blueprint
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          <span>Target Pin Active</span>
        </div>
      </div>

      {/* 2D Interactive SVG Retail Canvas */}
      <div className="relative p-4 bg-zinc-950 flex justify-center overflow-x-auto">
        <svg
          viewBox="0 0 500 360"
          className="w-full max-w-[500px] h-auto select-none font-sans"
        >
          {/* Floor grid subtle background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#27272A" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="500" height="360" fill="#0E0E11" rx="16" />
          <rect width="500" height="360" fill="url(#grid)" rx="16" />

          {/* Zones */}
          {zones.map((z) => (
            <g
              key={z.id}
              onClick={() => setSelectedZone(z)}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="10"
                fill="#18181B"
                stroke={selectedZone?.id === z.id ? '#3B82F6' : '#27272A'}
                strokeWidth={selectedZone?.id === z.id ? '2' : '1'}
                strokeDasharray={z.type === 'portal' ? '4 2' : 'none'}
              />
              <text
                x={z.x + 12}
                y={z.y + 24}
                fill="#E4E4E7"
                fontSize="11"
                fontWeight="600"
              >
                {z.name}
              </text>
              {z.code && (
                <text
                  x={z.x + z.w - 12}
                  y={z.y + 24}
                  fill="#71717A"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  [{z.code}]
                </text>
              )}
            </g>
          ))}

          {/* Target Location Pulsing Radar Pin */}
          <g transform={`translate(${pin.x}, ${pin.y})`}>
            {/* Outer radar ripple */}
            <circle r="22" fill="#2563EB" opacity="0.2">
              <animate attributeName="r" from="10" to="26" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="1.8s" repeatCount="indefinite" />
            </circle>
            {/* Inner glow */}
            <circle r="12" fill="#2563EB" opacity="0.4" />
            <circle r="7" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />

            {/* Target Label tooltip */}
            <rect x="-60" y="-36" width="120" height="24" rx="6" fill="#18181B" stroke="#3B82F6" strokeWidth="1" />
            <text x="0" y="-20" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
              {location?.label || 'TARGET ITEM'}
            </text>
          </g>
        </svg>
      </div>

      {/* Target Navigation Bar */}
      <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-300 font-medium">
            Walk Route: Entrance → {pin.aisle} → {pin.rack}
          </span>
        </div>
        <span className="text-[11px] text-blue-400 font-mono font-semibold">
          {location?.position ? `Position ${location.position}` : 'Front Display'}
        </span>
      </div>
    </div>
  );
}
