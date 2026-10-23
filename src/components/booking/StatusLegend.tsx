'use client';

import React from 'react';

export default function StatusLegend() {
  const items = [
    {
      badge: 'bg-white border border-slate-200 text-slate-600',
      dot: 'bg-slate-300',
      label: 'Kosong / Tersedia',
    },
    {
      badge: 'bg-blue-100/90 border border-blue-200 text-blue-950',
      dot: 'bg-[#007AFF]',
      label: 'Terkonfirmasi (Jadwal)',
    },
    {
      badge: 'bg-emerald-100/90 border border-emerald-300 text-emerald-950',
      dot: 'bg-emerald-600 animate-pulse',
      label: 'Active (Sedang Main)',
    },
    {
      badge: 'bg-slate-200/80 border border-slate-300 text-slate-700',
      dot: 'bg-slate-400',
      label: 'Selesai / Berakhir',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-1.5 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
        <span>Petunjuk Status:</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium ${item.badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${item.dot}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
