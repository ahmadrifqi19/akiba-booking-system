'use client';

import React from 'react';

export default function StatusLegend() {
  const items = [
    {
      badge: 'bg-white/70 border border-sky-100 text-sky-800',
      dot: 'bg-sky-200',
      label: 'Kosong / Tersedia',
    },
    {
      badge: 'bg-linear-to-br from-sky-100 to-sky-50 border border-sky-200 text-sky-950',
      dot: 'bg-sky-500 ring-4 ring-sky-500/20',
      label: 'Terkonfirmasi (Jadwal)',
    },
    {
      badge: 'bg-linear-to-br from-emerald-100 to-teal-50 border border-emerald-200 text-emerald-950',
      dot: 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse',
      label: 'Active (Sedang Main)',
    },
    {
      badge: 'bg-linear-to-br from-slate-100 to-slate-50 border border-slate-200 text-slate-600',
      dot: 'bg-slate-400',
      label: 'Selesai / Berakhir',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-linear-to-r from-sky-50/80 to-white px-4 py-3 text-xs shadow-[0_8px_24px_-16px_rgba(14,165,233,0.45)]">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
        <span>Petunjuk status</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${item.badge}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}