import React from 'react';
import { ChevronRight, MapPin, Building, Grid, Navigation, Layers, Bookmark } from 'lucide-react';

export default function LocationBreadcrumb({ location, showTitle = true, variant = "horizontal" }) {
  if (!location) {
    return (
      <div className="text-xs text-zinc-500 italic flex items-center gap-1.5 p-2 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <MapPin className="w-3.5 h-3.5" />
        Location not specified
      </div>
    );
  }

  const parts = [
    { label: 'Floor', value: location.floor?.name || 'Floor 1', icon: Building, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Section', value: location.section?.name || 'Laptops', icon: Grid, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { label: 'Aisle', value: location.aisle?.name || 'A3', icon: Navigation, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Rack', value: location.rack?.name || 'R07', icon: Layers, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Shelf', value: location.shelf?.name || 'S04', icon: Layers, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    { label: 'Position', value: `Pos ${location.position || '12'}`, icon: Bookmark, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  ];

  if (variant === 'vertical') {
    return (
      <div className="space-y-1.5 bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
        {showTitle && (
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            Physical Store Breadcrumb
          </div>
        )}
        <div className="flex flex-col space-y-1 text-xs">
          {parts.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 ${p.color}`}>
                  <Icon className="w-3 h-3" />
                  <span className="text-zinc-400 uppercase text-[9px]">{p.label}:</span>
                  <span>{p.value}</span>
                </div>
                {idx < parts.length - 1 && (
                  <span className="text-zinc-600 text-xs">↓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {showTitle && (
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          Store Micro-Location
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {parts.map((p, idx) => (
          <React.Fragment key={idx}>
            <div className={`px-2 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1 ${p.color}`}>
              <span className="text-slate-500 dark:text-zinc-400 text-[10px] uppercase">{p.label}</span>
              <span className="text-slate-900 dark:text-white font-bold">{p.value}</span>
            </div>
            {idx < parts.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
